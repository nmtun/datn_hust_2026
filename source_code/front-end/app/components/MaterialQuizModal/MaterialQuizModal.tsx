/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect, useCallback } from "react";
import { X, Plus, Trash2, Search, BookOpen } from "lucide-react";
import { quizApi, Quiz } from "@/app/api/quizApi";
import { trainingMaterialApi } from "@/app/api/trainingMaterialApi";
import { showToast } from "@/app/utils/toast";

interface MaterialQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialId: number;
  materialTitle: string;
  materialTags?: { tag_id: number; name: string }[];
  onQuizzesUpdated: () => void;
}

interface QuizWithRelation extends Quiz {
  isAttached?: boolean;
}

export default function MaterialQuizModal({
  isOpen,
  onClose,
  materialId,
  materialTitle,
  materialTags = [],
  onQuizzesUpdated,
}: MaterialQuizModalProps) {
  const [quizzes, setQuizzes] = useState<QuizWithRelation[]>([]);
  const [attachedQuizzes, setAttachedQuizzes] = useState<Quiz[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchQuizzes = useCallback(async () => {
    try {
      setLoading(true);
      const result = await quizApi.getAll({
        search: searchQuery,
        status: 'active'
      });

      if (!result.error && result.quizzes) {
        setQuizzes(result.quizzes);
      } else {
        console.error("Error fetching quizzes:", result.message);
        setQuizzes([]);
      }
    } catch (error) {
      console.error("Error fetching quizzes:", error);
      setQuizzes([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  const fetchAttachedQuizzes = useCallback(async () => {
    try {
      const result = await trainingMaterialApi.getById(materialId);
      if (result && !result.error && result.material && result.material.quizzes) {
        setAttachedQuizzes(result.material.quizzes);
      } else {
        setAttachedQuizzes([]);
      }
    } catch (error) {
      console.error("Error fetching attached quizzes:", error);
      setAttachedQuizzes([]);
    }
  }, [materialId]);

  const handleAttachQuiz = async (quiz: Quiz) => {
    try {
      setActionLoading(quiz.quiz_id);
      const result = await trainingMaterialApi.attachQuiz(materialId, quiz.quiz_id);

      if (!result.error) {
        showToast.success('Quiz attached to material successfully');
        setAttachedQuizzes(prev => [...prev, quiz]);
        onQuizzesUpdated();
      } else {
        showToast.error(result.message || 'Error attaching quiz');
      }
    } catch (error: any) {
      console.error("Error attaching quiz:", error);
      showToast.error('Error attaching quiz to material');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDetachQuiz = async (quiz: Quiz) => {
    try {
      setActionLoading(quiz.quiz_id);
      const result = await trainingMaterialApi.detachQuiz(materialId, quiz.quiz_id);

      if (!result.error) {
        showToast.success('Quiz detached from material successfully');
        setAttachedQuizzes(prev => prev.filter(q => q.quiz_id !== quiz.quiz_id));
        onQuizzesUpdated();
      } else {
        showToast.error(result.message || 'Error detaching quiz');
      }
    } catch (error: any) {
      console.error("Error detaching quiz:", error);
      showToast.error('Error detaching quiz from material');
    } finally {
      setActionLoading(null);
    }
  };

  const isQuizAttached = (quizId: number) => {
    return attachedQuizzes.some(q => q.quiz_id === quizId);
  };

  const hasCommonTags = (quiz: Quiz) => {
    if (!quiz.tags || !materialTags.length) return false;

    return quiz.tags?.some(quizTag =>
      materialTags.some(materialTag => materialTag.tag_id === quizTag.tag_id)
    ) || false;
  };

  useEffect(() => {
    if (isOpen) {
      fetchQuizzes();
      fetchAttachedQuizzes();
    }
  }, [isOpen, fetchQuizzes, fetchAttachedQuizzes]);

  const filteredQuizzes = quizzes.filter(quiz => {
    // First filter by search query
    const matchesSearch = quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quiz.description?.toLowerCase().includes(searchQuery.toLowerCase());

    // If material has no tags, show all quizzes
    if (materialTags.length === 0) {
      return matchesSearch;
    }

    // Only show quizzes that have matching tags with the material
    const hasMatchingTags = hasCommonTags(quiz);
    return matchesSearch && hasMatchingTags;
  });

  // Sort quizzes by title since we're only showing matching ones
  const sortedQuizzes = filteredQuizzes.sort((a, b) => a.title.localeCompare(b.title));

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">
              Manage Quizzes for: {materialTitle}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {materialTags.length > 0
                ? "Showing only quizzes that share tags with this material"
                : "Showing all available quizzes (material has no tags)"
              }
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Material Tags Display */}
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-700 mb-2">Material Tags:</h3>
            {materialTags.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {materialTags.map(tag => (
                  <span
                    key={tag.tag_id}
                    className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full"
                  >
                    {tag.name}
                  </span>
                ))}
              </div>
            ) : (
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  ⚠️ This material has no tags assigned. All quizzes can be attached, but it's recommended to add tags for better organization.
                </p>
              </div>
            )}
          </div>

          {/* Search */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search quizzes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>

          {/* Currently Attached Quizzes */}
          {attachedQuizzes.length > 0 && (
            <div className="mb-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Currently Attached Quizzes</h3>
              <div className="space-y-3">
                {attachedQuizzes.map((quiz) => (
                  <div key={quiz.quiz_id} className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <BookOpen className="w-5 h-5 text-green-600" />
                      <div>
                        <h4 className="font-medium text-gray-900">{quiz.title}</h4>
                        <p className="text-sm text-gray-500">{quiz.description}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDetachQuiz(quiz)}
                      disabled={actionLoading === quiz.quiz_id}
                      className={`flex items-center px-3 py-2 text-sm font-medium text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md ${actionLoading === quiz.quiz_id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                    >
                      {actionLoading === quiz.quiz_id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2" />
                      ) : (
                        <Trash2 className="w-4 h-4 mr-2" />
                      )}
                      Detach
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Available Quizzes */}
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Available Quizzes</h3>
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto space-y-3">
                {sortedQuizzes.length === 0 ? (
                  <div className="text-center py-8">
                    {materialTags.length > 0 ? (
                      <div>
                        <p className="text-gray-500 mb-2">No quizzes found with matching tags</p>
                        <p className="text-sm text-gray-400">
                          Create quizzes with tags: {materialTags.map(tag => tag.name).join(', ')}
                        </p>
                      </div>
                    ) : (
                      <p className="text-gray-500">No quizzes found</p>
                    )}
                  </div>
                ) : (
                  sortedQuizzes.map((quiz) => {
                    const isAttached = isQuizAttached(quiz.quiz_id);
                    const hasSharedTags = hasCommonTags(quiz);

                    return (
                      <div
                        key={quiz.quiz_id}
                        className={`flex items-center justify-between p-4 border border-gray-200 bg-white rounded-lg ${isAttached ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center space-x-3">
                          <BookOpen className="w-5 h-5 text-blue-600" />
                          <div>
                            <h4 className="font-medium text-gray-900 flex items-center">
                              {quiz.title}
                              {quiz.tags && quiz.tags.length > 0 && (
                                <div className="ml-3 flex flex-wrap gap-1">
                                  {quiz.tags.slice(0, 2).map((tag: any) => (
                                    <span
                                      key={tag.tag_id}
                                      className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full"
                                    >
                                      {tag.name}
                                    </span>
                                  ))}
                                  {quiz.tags.length > 2 && (
                                    <span className="text-xs text-gray-500">+{quiz.tags.length - 2}</span>
                                  )}
                                </div>
                              )}
                            </h4>
                            <p className="text-sm text-gray-500">{quiz.description}</p>
                            <p className="text-xs text-gray-400">
                              Duration: {quiz.duration} mins • Passing Score: {quiz.passing_score}%
                            </p>
                          </div>
                        </div>

                        {!isAttached && (
                          <button
                            onClick={() => handleAttachQuiz(quiz)}
                            disabled={actionLoading === quiz.quiz_id}
                            className={`flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-md ${actionLoading === quiz.quiz_id ? 'opacity-50 cursor-not-allowed' : ''
                              }`}
                          >
                            {actionLoading === quiz.quiz_id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            ) : (
                              <Plus className="w-4 h-4 mr-2" />
                            )}
                            Attach
                          </button>
                        )}

                        {isAttached && (
                          <span className="px-4 py-2 text-sm font-medium text-green-600 bg-green-100 rounded-md">
                            Already Attached
                          </span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end p-6 border-t border-gray-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}