/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Search, Plus, Edit2, Eye, Trash2, Clock, Trophy, Users, Archive, Play, BookOpen } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { quizApi, Quiz } from "@/app/api/quizApi";
import { showToast } from "@/app/utils/toast";
import Modal from "@/app/components/Modal";
import { withAuth } from "@/app/middleware/withAuth";

function QuizPage() {
  const router = useRouter();
  const [searchTitle, setSearchTitle] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
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

  // Debounce search values
  const debouncedSearchTitle = useDebounce(searchTitle, 500);
  const debouncedSearchStatus = useDebounce(searchStatus, 500);

  useEffect(() => {
    fetchQuizzes();
  }, []);

  // Effect for handling search with debounced values
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchTitle && !debouncedSearchStatus) {
        fetchQuizzes();
        return;
      }

      try {
        setLoading(true);
        const params = {
          search: debouncedSearchTitle.trim() || undefined,
          status: debouncedSearchStatus.trim() || undefined,
        };

        const result = await quizApi.getAll(params);

        if (!result || result.error) {
          console.error("API Error:", result?.message || "Unknown error");
          setQuizzes([]);
          return;
        }

        const quizData = result.quizzes;
        if (Array.isArray(quizData)) {
          // Lọc bỏ những quiz có status là 'archived' trong kết quả tìm kiếm
          const activeQuizzes = quizData.filter(quiz => quiz.status !== 'archived');
          setQuizzes(activeQuizzes);
        } else {
          console.error("Invalid quiz data format:", quizData);
          setQuizzes([]);
        }
      } catch (error) {
        console.error("Error searching quizzes:", error);
        setQuizzes([]);
        showToast.error('Error searching quizzes');
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchTitle, debouncedSearchStatus]);

  const fetchQuizzes = async () => {
    try {
      setLoading(true);
      const result = await quizApi.getAll();

      if (!result || result.error) {
        console.error("API Error:", result?.message || "Unknown error");
        setQuizzes([]);
        return;
      }

      const quizData = result.quizzes;
      if (Array.isArray(quizData)) {
        // Lọc bỏ những quiz có status là 'archived'
        const activeQuizzes = quizData.filter(quiz => quiz.status !== 'archived');
        setQuizzes(activeQuizzes);
      } else {
        console.error("Invalid quiz data format:", quizData);
        setQuizzes([]);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  };

  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [quizToDelete, setQuizToDelete] = useState<Quiz | null>(null);

  const handleDeleteClick = (quiz: Quiz) => {
    setQuizToDelete(quiz);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!quizToDelete) return;

    try {
      setDeleteLoading(quizToDelete.quiz_id);
      const result = await quizApi.delete(quizToDelete.quiz_id);

      if (result.error) {
        throw new Error(result.message || 'Error deleting quiz');
      }

      // Refresh the list
      await fetchQuizzes();

      // Show success message
      showToast.success('Quiz archived successfully');
    } catch (error: any) {
      console.error("Error deleting quiz:", error);
      showToast.error(error.message || 'Error deleting quiz');
    } finally {
      setDeleteLoading(null);
      setShowDeleteConfirm(false);
      setQuizToDelete(null);
    }
  };

  const handleEdit = (quizId: number) => {
    router.push(`/dashboard/hr/quizzes/edit/${quizId}`);
  };

  const handleView = (quizId: number) => {
    const quiz = quizzes.find(q => q.quiz_id === quizId);
    if (quiz) {
      setSelectedQuiz(quiz);
      setIsViewModalOpen(true);
    }
  };

  const handleCreateNew = () => {
    router.push("/dashboard/hr/quizzes/create");
  };

  const handleManageQuestions = (quizId: number) => {
    router.push(`/dashboard/hr/quizzes/${quizId}/questions`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800';
      case 'archived':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
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
      <div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Quiz Management</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/dashboard/hr/quizzes/archived')}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              <Archive className="w-5 h-5 mr-2" />
              View Archived
            </button>
            <button
              onClick={() => router.push('/dashboard/hr/questions')}
              className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Manage Questions
            </button>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Quiz
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search quiz by title or description..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex-1 relative">
            <select
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
              className="pl-4 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
            </select>
          </div>
        </div>
      </div>

      {/* Quiz Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      ) : quizzes.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No quizzes found</h3>
          <p className="text-gray-500">Get started by creating your first quiz.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quizzes.map((quiz) => (
            <div key={quiz.quiz_id} className="bg-white rounded-lg shadow-md border border-gray-200 hover:shadow-lg transition-shadow">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {quiz.title}
                  </h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(quiz.status)}`}>
                    {quiz.status}
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

                {quiz.tags && quiz.tags.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-1">
                      {quiz.tags.map((tag: any) => (
                        <span
                          key={tag.tag_id}
                          className="inline-flex items-center px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full"
                        >
                          {tag.name}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

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
                    onClick={() => handleManageQuestions(quiz.quiz_id)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                  >
                    <Play className="w-4 h-4 mr-1" />
                    Questions
                  </button>
                  <button
                    onClick={() => handleEdit(quiz.quiz_id)}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-yellow-50 text-yellow-600 rounded-lg hover:bg-yellow-100 transition-colors"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteClick(quiz)}
                    disabled={deleteLoading === quiz.quiz_id}
                    className="flex-1 flex items-center justify-center px-3 py-2 text-sm bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    {deleteLoading === quiz.quiz_id ? 'Deleting...' : 'Delete'}
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
          title="Quiz Details"
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
              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(selectedQuiz.status)}`}>
                {selectedQuiz.status}
              </span>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Questions</h3>
              <p className="text-gray-700">{selectedQuiz.questions?.length || 0} questions</p>
            </div>

            {selectedQuiz.tags && selectedQuiz.tags.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
                <div className="flex flex-wrap gap-2">
                  {selectedQuiz.tags.map((tag: any) => (
                    <span
                      key={tag.tag_id}
                      className="inline-flex items-center px-2 py-1 text-xs font-medium bg-indigo-100 text-indigo-800 rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

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

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && quizToDelete && (
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Confirm Delete"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to archive the quiz "{quizToDelete.title}"? 
              This action will move it to the archived section.
            </p>
            <div className="flex space-x-3 justify-end">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                disabled={deleteLoading !== null}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
              >
                {deleteLoading !== null ? 'Archiving...' : 'Archive Quiz'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default withAuth(QuizPage);