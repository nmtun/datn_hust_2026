/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { ArrowLeft, Search, Eye, RotateCcw, Clock, Trophy, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { quizApi, Quiz } from "@/app/api/quizApi";
import { showToast } from "@/app/utils/toast";
import Modal from "@/app/components/Modal";
import { withAuth } from "@/app/middleware/withAuth";

function ArchivedQuizzesPage() {
  const router = useRouter();
  const [searchTitle, setSearchTitle] = useState("");
  const [searchCreator, setSearchCreator] = useState("");
  const [archivedQuizzes, setArchivedQuizzes] = useState<Quiz[]>([]);
  const [allArchivedQuizzes, setAllArchivedQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  const debouncedSearchTitle = useDebounce(searchTitle, 500);
  const debouncedSearchCreator = useDebounce(searchCreator, 500);

  useEffect(() => {
    fetchArchivedQuizzes();
  }, []);

  useEffect(() => {
    const performSearch = () => {
      if (!debouncedSearchTitle && !debouncedSearchCreator) {
        setArchivedQuizzes(allArchivedQuizzes);
        return;
      }

      const filteredQuizzes = allArchivedQuizzes.filter(quiz => {
        const titleMatch = !debouncedSearchTitle || 
          quiz.title.toLowerCase().includes(debouncedSearchTitle.toLowerCase());
        const creatorMatch = !debouncedSearchCreator || 
          (quiz.creator && quiz.creator.full_name.toLowerCase().includes(debouncedSearchCreator.toLowerCase()));
        
        return titleMatch && creatorMatch;
      });
      
      setArchivedQuizzes(filteredQuizzes);
    };

    performSearch();
  }, [debouncedSearchTitle, debouncedSearchCreator, allArchivedQuizzes]);

  const fetchArchivedQuizzes = async () => {
    try {
      setLoading(true);
      const result = await quizApi.getArchived();

      if (!result || result.error) {
        console.error("API Error:", result?.message || "Unknown error");
        setArchivedQuizzes([]);
        return;
      }

      const quizData = result.quizzes;
      if (Array.isArray(quizData)) {
        setAllArchivedQuizzes(quizData);
        setArchivedQuizzes(quizData);
      } else {
        console.error("Invalid quiz data format:", quizData);
        setAllArchivedQuizzes([]);
        setArchivedQuizzes([]);
      }
    } catch (error) {
      console.error("Error fetching archived quizzes:", error);
      setAllArchivedQuizzes([]);
      setArchivedQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const [restoreLoading, setRestoreLoading] = useState<number | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [quizToRestore, setQuizToRestore] = useState<Quiz | null>(null);

  const handleRestoreClick = (quiz: Quiz) => {
    setQuizToRestore(quiz);
    setShowRestoreConfirm(true);
  };

  const handleConfirmRestore = async () => {
    if (!quizToRestore) return;

    try {
      setRestoreLoading(quizToRestore.quiz_id);
      const result = await quizApi.restore(quizToRestore.quiz_id);

      if (result.error) {
        throw new Error(result.message || 'Error restoring quiz');
      }

      // Refresh the list
      await fetchArchivedQuizzes();

      // Show success message
      showToast.success('Quiz restored successfully');
    } catch (error: any) {
      console.error("Error restoring quiz:", error);
      showToast.error(error.message || 'Error restoring quiz');
    } finally {
      setRestoreLoading(null);
      setShowRestoreConfirm(false);
      setQuizToRestore(null);
    }
  };

  const handleView = (quizId: number) => {
    const quiz = archivedQuizzes.find(q => q.quiz_id === quizId);
    if (quiz) {
      setSelectedQuiz(quiz);
      setIsViewModalOpen(true);
    }
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) {
      return `${minutes} phút`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => router.push('/dashboard/hr/quizzes')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">Archived Quizzes</h1>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search archived quizzes by title..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search archived quizzes by creator..."
              value={searchCreator}
              onChange={(e) => setSearchCreator(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
      </div>

      {/* Quiz Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : archivedQuizzes.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">📁</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No archived quizzes</h3>
          <p className="text-gray-500">There are no archived quizzes at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {archivedQuizzes.map((quiz) => (
            <div key={quiz.quiz_id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow opacity-75">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {quiz.title}
                  </h3>
                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                    archived
                  </span>
                </div>

                {quiz.description && (
                  <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                    {quiz.description}
                  </p>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    <span>{formatDuration(quiz.duration)}</span>
                  </div>
                  <div className="flex items-center">
                    <Trophy className="w-4 h-4 mr-1" />
                    <span>{quiz.passing_score}%</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    <span>{quiz.questions?.length || 0} questions</span>
                  </div>
                  <span className="text-xs">
                    {new Date(quiz.creation_date).toLocaleDateString('vi-VN')}
                  </span>
                </div>

                {quiz.creator && (
                  <p className="text-xs text-gray-500 mb-4">
                    Created by: {quiz.creator.full_name}
                  </p>
                )}

                <div className="flex space-x-2">
                  <button
                    onClick={() => handleView(quiz.quiz_id)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </button>
                  <button
                    onClick={() => handleRestoreClick(quiz)}
                    disabled={restoreLoading === quiz.quiz_id}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors disabled:opacity-50"
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    {restoreLoading === quiz.quiz_id ? 'Restoring...' : 'Restore'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* View Modal */}
      {selectedQuiz && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Archived Quiz Details"
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Title</h3>
              <p className="text-gray-700">{selectedQuiz.title}</p>
            </div>

            {selectedQuiz.description && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                <p className="text-gray-700">{selectedQuiz.description}</p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Duration</h3>
                <p className="text-gray-700">{formatDuration(selectedQuiz.duration)}</p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Passing Score</h3>
                <p className="text-gray-700">{selectedQuiz.passing_score}%</p>
              </div>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Status</h3>
              <span className="px-2 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800">
                archived
              </span>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Questions</h3>
              <p className="text-gray-700">{selectedQuiz.questions?.length || 0} questions</p>
            </div>

            {selectedQuiz.creator && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Created by</h3>
                <p className="text-gray-700">{selectedQuiz.creator.full_name}</p>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Created on</h3>
              <p className="text-gray-700">{new Date(selectedQuiz.creation_date).toLocaleDateString('vi-VN')}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Restore Confirmation Modal */}
      {showRestoreConfirm && quizToRestore && (
        <Modal
          isOpen={showRestoreConfirm}
          onClose={() => setShowRestoreConfirm(false)}
          title="Confirm Restore"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to restore the quiz "{quizToRestore.title}"? 
              This action will make it active again.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowRestoreConfirm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmRestore}
                disabled={restoreLoading !== null}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
              >
                {restoreLoading !== null ? 'Restoring...' : 'Restore Quiz'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default withAuth(ArchivedQuizzesPage);