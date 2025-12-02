/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Search, Plus, Edit2, Eye, Trash2, BookOpen, Filter, CheckCircle, XCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { questionApi, QuizQuestion, quizApi, Quiz } from "@/app/api/quizApi";
import { showToast } from "@/app/utils/toast";
import Modal from "@/app/components/Modal";
import { withAuth } from "@/app/middleware/withAuth";

function QuestionsPage() {
  const router = useRouter();
  const [searchText, setSearchText] = useState("");
  const [searchType, setSearchType] = useState("");
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<QuizQuestion | null>(null);
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
  const debouncedSearchText = useDebounce(searchText, 500);
  const debouncedSearchType = useDebounce(searchType, 500);

  useEffect(() => {
    fetchQuizzes();
    fetchQuestions();
  }, []);

  // Effect for handling search with debounced values
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchText && !debouncedSearchType) {
        fetchQuestions();
        return;
      }

      try {
        setLoading(true);
        const params = {
          search: debouncedSearchText.trim() || undefined,
          questionType: debouncedSearchType.trim() || undefined,
        };

        const result = await questionApi.getAll(params);

        if (!result || result.error) {
          console.error("API Error:", result?.message || "Unknown error");
          setQuestions([]);
          return;
        }

        const questionData = result.questions;
        if (Array.isArray(questionData)) {
          setQuestions(questionData);
        } else {
          console.error("Invalid question data format:", questionData);
          setQuestions([]);
        }
      } catch (error) {
        console.error("Error searching questions:", error);
        setQuestions([]);
        showToast.error('Error searching questions');
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchText, debouncedSearchType]);

  const fetchQuizzes = async () => {
    try {
      const result = await quizApi.getAll();
      if (result && !result.error && Array.isArray(result.quizzes)) {
        setQuizzes(result.quizzes);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
    }
  };

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const result = await questionApi.getAll();

      if (!result || result.error) {
        console.error("API Error:", result?.message || "Unknown error");
        setQuestions([]);
        return;
      }

      const questionData = result.questions;
      if (Array.isArray(questionData)) {
        setQuestions(questionData);
      } else {
        console.error("Invalid question data format:", questionData);
        setQuestions([]);
      }
    } catch (error) {
      console.error("Error fetching questions:", error);
      setQuestions([]);
    } finally {
      setLoading(false);
    }
  };

  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [questionToDelete, setQuestionToDelete] = useState<QuizQuestion | null>(null);

  const handleDeleteClick = (question: QuizQuestion) => {
    setQuestionToDelete(question);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!questionToDelete) return;

    try {
      setDeleteLoading(questionToDelete.question_id);
      const result = await questionApi.delete(questionToDelete.question_id);

      if (result.error) {
        throw new Error(result.message || 'Error deleting question');
      }

      // Refresh the list
      await fetchQuestions();

      // Show success message
      showToast.success('Question deleted successfully');
    } catch (error: any) {
      console.error("Error deleting question:", error);
      showToast.error(error.message || 'Error deleting question');
    } finally {
      setDeleteLoading(null);
      setShowDeleteConfirm(false);
      setQuestionToDelete(null);
    }
  };

  const handleEdit = (questionId: number) => {
    router.push(`/dashboard/hr/questions/edit/${questionId}`);
  };

  const handleView = (questionId: number) => {
    const question = questions.find(q => q.question_id === questionId);
    if (question) {
      setSelectedQuestion(question);
      setIsViewModalOpen(true);
    }
  };

  const handleCreateNew = () => {
    router.push("/dashboard/hr/questions/create");
  };

  const getQuestionTypeColor = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return 'bg-blue-100 text-blue-800';
      case 'multiple_response':
        return 'bg-green-100 text-green-800';
      case 'true_false':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getQuestionTypeLabel = (type: string) => {
    switch (type) {
      case 'multiple_choice':
        return 'Multiple Choice';
      case 'multiple_response':
        return 'Multiple Response';
      case 'true_false':
        return 'True/False';
      default:
        return type;
    }
  };

  const parseOptions = (optionsStr: string | undefined) => {
    if (!optionsStr) return [];
    try {
      return JSON.parse(optionsStr);
    } catch {
      return optionsStr.split(',').map(opt => opt.trim());
    }
  };

  return (
    <div>
      <div>
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900">Question Management</h1>
          <div className="flex space-x-4">
            <button
              onClick={() => router.push('/dashboard/hr/quizzes')}
              className="inline-flex items-center px-4 py-2 bg-blue-100 text-blue-700 text-sm font-medium rounded-md hover:bg-blue-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <BookOpen className="w-5 h-5 mr-2" />
              Manage Quizzes
            </button>
            <button
              onClick={handleCreateNew}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Plus className="w-5 h-5 mr-2" />
              Create Question
            </button>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex space-x-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search question text..."
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex-1 relative">
            <select
              value={searchType}
              onChange={(e) => setSearchType(e.target.value)}
              className="pl-4 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
            >
              <option value="">All Types</option>
              <option value="multiple_choice">Multiple Choice</option>
              <option value="multiple_response">Multiple Response</option>
              <option value="true_false">True/False</option>
            </select>
          </div>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="flex justify-center items-center p-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No questions found</h3>
          <p className="text-gray-500">Get started by creating your first question.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Question
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quiz
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Points
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {questions.map((question) => (
                  <tr key={question.question_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 max-w-md truncate">
                        {question.question_text}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {question.quizAssignments && question.quizAssignments.length > 0 
                          ? `${question.quizAssignments.length} quiz(s)` 
                          : 'Question Bank'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1">
                        {question.tags && question.tags.length > 0 ? (
                          question.tags.map((tag) => (
                            <span
                              key={tag.tag_id}
                              className="inline-flex px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-md"
                            >
                              {tag.name}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-gray-400 italic">No tags</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getQuestionTypeColor(question.question_type)}`}>
                        {getQuestionTypeLabel(question.question_type)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{question.points}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(question.question_id)}
                          className="text-gray-400 hover:text-gray-500 p-1"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleEdit(question.question_id)}
                          className="text-blue-400 hover:text-blue-500 p-1"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(question)}
                          disabled={deleteLoading === question.question_id}
                          className="text-red-400 hover:text-red-500 p-1 disabled:opacity-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
        </div>
      )}

      {/* View Modal */}
      {selectedQuestion && (
        <Modal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          title="Question Details"
        >
          <div className="space-y-4">
            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Question Text</h3>
              <p className="text-gray-700">{selectedQuestion.question_text}</p>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Used in Quizzes</h3>
              {selectedQuestion.quizAssignments && selectedQuestion.quizAssignments.length > 0 ? (
                <div className="space-y-1">
                  {selectedQuestion.quizAssignments.map((assignment) => (
                    <div key={assignment.id} className="text-sm">
                      <span className="text-gray-700">{assignment.quiz.title}</span>
                      <span className="text-gray-500 ml-2">({assignment.tag.name})</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500">Available in question bank</p>
              )}
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {selectedQuestion.tags && selectedQuestion.tags.length > 0 ? (
                  selectedQuestion.tags.map((tag) => (
                    <span
                      key={tag.tag_id}
                      className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-md"
                    >
                      {tag.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500 italic">No tags assigned</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Type</h3>
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getQuestionTypeColor(selectedQuestion.question_type)}`}>
                  {getQuestionTypeLabel(selectedQuestion.question_type)}
                </span>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Points</h3>
                <p className="text-gray-700">{selectedQuestion.points}</p>
              </div>
            </div>

            {selectedQuestion.options && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Options</h3>
                <ul className="space-y-2">
                  {parseOptions(selectedQuestion.options).map((option: string, index: number) => (
                    <li key={index} className="flex items-center space-x-2">
                      {option === selectedQuestion.correct_answer ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className={option === selectedQuestion.correct_answer ? 'text-green-700 font-medium' : 'text-gray-700'}>
                        {option}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div>
              <h3 className="font-semibold text-gray-900 mb-2">Correct Answer</h3>
              <p className="text-green-700 font-medium">{selectedQuestion.correct_answer}</p>
            </div>
          </div>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && questionToDelete && (
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Confirm Delete"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to delete this question? This action cannot be undone.
            </p>
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-sm font-medium text-gray-900">Question:</p>
              <p className="text-sm text-gray-700 mt-1">{questionToDelete.question_text}</p>
            </div>
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
                {deleteLoading !== null ? 'Deleting...' : 'Delete Question'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default withAuth(QuestionsPage);