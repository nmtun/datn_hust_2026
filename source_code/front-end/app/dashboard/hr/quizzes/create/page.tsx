/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, CheckCircle, Circle, Plus, Eye, Shuffle } from "lucide-react";
import { quizApi, questionApi, Quiz, QuizQuestion } from "@/app/api/quizApi";
import { tagApi, Tag } from "@/app/api/tagApi";
import { showToast } from "@/app/utils/toast";
import { withAuth } from "@/app/middleware/withAuth";
import Modal from "@/app/components/Modal";

function CreateQuizPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [tags, setTags] = useState<Tag[]>([]);
  const [tagConfigs, setTagConfigs] = useState<{ tagId: number, questionCount: number }[]>([]);
  const [availableQuestions, setAvailableQuestions] = useState<QuizQuestion[]>([]);
  const [previewQuestions, setPreviewQuestions] = useState<QuizQuestion[]>([]);
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    duration: 30,
    passing_score: 70,
    status: "active" as "active" | "draft"
  });

  useEffect(() => {
    fetchTags();
  }, []);

  useEffect(() => {
    if (tagConfigs.length > 0) {
      fetchAvailableQuestions();
    } else {
      setAvailableQuestions([]);
    }
  }, [tagConfigs]);

  const fetchTags = async () => {
    try {
      const result = await tagApi.getAll();
      if (result && !result.error && Array.isArray(result.tags)) {
        setTags(result.tags);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
      showToast.error('Error loading tags');
    }
  };

  const fetchAvailableQuestions = async () => {
    try {
      const tagIds = tagConfigs.map(config => config.tagId);
      const result = await questionApi.getByTags({
        tagIds: tagIds,
        limit: 200 // Lấy tối đa 200 câu để preview
      });
      if (result && !result.error && Array.isArray(result.questions)) {
        setAvailableQuestions(result.questions);
      }
    } catch (error) {
      console.error("Error fetching questions by tags:", error);
      showToast.error('Error loading questions');
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: (name === 'duration' || name === 'passing_score')
        ? (value === '' ? '' : Number(value))
        : value
    }));
  };

  const handleNextStep = () => {
    if (currentStep === 1) {
      // Validate basic quiz info
      if (!formData.title.trim()) {
        showToast.error('Please enter quiz title');
        return;
      }
      if (formData.duration <= 0) {
        showToast.error('Duration must be greater than 0');
        return;
      }
      if (formData.passing_score < 0 || formData.passing_score > 100) {
        showToast.error('Passing score must be between 0 and 100');
        return;
      }
    }
    setCurrentStep(2);
  };

  const handlePrevStep = () => {
    setCurrentStep(1);
  };

  const toggleTagSelection = (tagId: number) => {
    setTagConfigs(prev => {
      const exists = prev.find(config => config.tagId === tagId);
      if (exists) {
        return prev.filter(config => config.tagId !== tagId);
      } else {
        return [...prev, { tagId, questionCount: 1 }]; // Default 1 question per tag
      }
    });
  };

  const updateTagQuestionCount = (tagId: number, count: number) => {
    setTagConfigs(prev =>
      prev.map(config =>
        config.tagId === tagId
          ? { ...config, questionCount: Math.max(1, count) }
          : config
      )
    );
  };

  const handlePreviewQuestions = () => {
    const totalQuestions = tagConfigs.reduce((sum, config) => sum + config.questionCount, 0);
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
    setPreviewQuestions(shuffled.slice(0, Math.min(totalQuestions, availableQuestions.length)));
    setIsPreviewModalOpen(true);
  };

  const handleShufflePreview = () => {
    const totalQuestions = tagConfigs.reduce((sum, config) => sum + config.questionCount, 0);
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
    setPreviewQuestions(shuffled.slice(0, Math.min(totalQuestions, availableQuestions.length)));
  };

  const handleSubmit = async () => {
    // Validate form data
    if (!formData.title.trim()) {
      showToast.error('Quiz title is required');
      return;
    }

    if (!formData.duration || formData.duration <= 0) {
      showToast.error('Valid duration is required');
      return;
    }

    if (formData.passing_score < 0 || formData.passing_score > 100) {
      showToast.error('Passing score must be between 0 and 100');
      return;
    }

    if (tagConfigs.length === 0) {
      showToast.error('Please select at least one tag for random question creation');
      return;
    }

    const totalQuestions = tagConfigs.reduce((sum, config) => sum + config.questionCount, 0);
    if (!totalQuestions || totalQuestions <= 0) {
      showToast.error('Total question count must be greater than 0');
      return;
    }

    if (availableQuestions.length < totalQuestions) {
      showToast.error(`Not enough questions available. Found ${availableQuestions.length}, need ${totalQuestions}`);
      return;
    }

    try {
      setLoading(true);

      // Create quiz with random questions
      const totalQuestions = tagConfigs.reduce((sum, config) => sum + config.questionCount, 0);
      const payload = {
        quizData: {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          duration: Number(formData.duration),
          passing_score: Number(formData.passing_score),
          status: formData.status
        },
        tagConfigs: tagConfigs.map(config => ({
          tagId: config.tagId,
          questionCount: config.questionCount
        }))
      };

      const result = await quizApi.createWithRandomQuestions(payload);

      if (result.error) {
        throw new Error(result.message || 'Error creating quiz');
      }

      showToast.success(`Quiz created successfully with ${totalQuestions} random questions`);
      router.push('/dashboard/hr/quizzes');
    } catch (error: any) {
      console.error("Error creating quiz:", error);
      showToast.error(error.message || 'Error creating quiz');
    } finally {
      setLoading(false);
    }
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

  const isCorrectAnswer = (option: string, correctAnswer: string, questionType: string) => {
    if (questionType === 'multiple_response') {
      try {
        const correctAnswers = JSON.parse(correctAnswer);
        return Array.isArray(correctAnswers) && correctAnswers.includes(option);
      } catch {
        return correctAnswer.split(',').map(ans => ans.trim()).includes(option);
      }
    }
    return option === correctAnswer;
  };

  return (
    <div className="max-w-6xl mx-auto">
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
            <h1 className="text-2xl font-bold text-gray-900">Create New Quiz</h1>
          </div>
        </div>
      </div>

      {/* Step Indicator */}
      <div className="mb-8">
        <div className="flex items-center">
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'}`}>
            {currentStep > 1 ? <CheckCircle className="w-5 h-5" /> : '1'}
          </div>
          <div className={`flex-1 h-1 mx-4 ${currentStep > 1 ? 'bg-blue-600' : 'bg-gray-300'}`}></div>
          <div className={`flex items-center justify-center w-8 h-8 rounded-full ${currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-300 text-gray-500'}`}>
            2
          </div>
        </div>
        <div className="flex justify-between mt-2">
          <span className="text-sm font-medium text-gray-900">Quiz Information</span>
          <span className="text-sm font-medium text-gray-900">Select Questions</span>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg p-6">
        {currentStep === 1 ? (
          <div className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Quiz Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter quiz title..."
                required
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter quiz description..."
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
                  Duration (minutes) *
                </label>
                <input
                  type="number"
                  id="duration"
                  name="duration"
                  value={formData.duration}
                  onChange={handleInputChange}
                  min="1"
                  max="480"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>

              <div>
                <label htmlFor="passing_score" className="block text-sm font-medium text-gray-700 mb-2">
                  Passing Score (%) *
                </label>
                <input
                  type="number"
                  id="passing_score"
                  name="passing_score"
                  value={formData.passing_score}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="active">Active</option>
                <option value="draft">Draft</option>
              </select>
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={() => router.push('/dashboard/hr/quizzes')}
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleNextStep}
                className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium transition-colors"
              >
                Next: Select Questions
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Configure Quiz Questions</h3>
            </div>

            {/* Tag Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Tags & Configure Questions *
              </label>
              <div className="border border-gray-200 rounded-lg p-4">
                {tags.length === 0 ? (
                  <div className="text-center py-4">
                    <p className="text-gray-500">No tags available.</p>
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <button
                        key={tag.tag_id}
                        type="button"
                        onClick={() => toggleTagSelection(tag.tag_id)}
                        className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors ${tagConfigs.find(c => c.tagId === tag.tag_id)
                          ? 'bg-blue-100 text-blue-800 border-blue-200'
                          : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                          } border`}
                      >
                        {tagConfigs.find(c => c.tagId === tag.tag_id) && (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        )}
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Selected {tagConfigs.length} tag{tagConfigs.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Question Count per Tag */}
            {tagConfigs.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Number of Questions per Tag *
                </label>
                <div className="space-y-3">
                  {tagConfigs.map(config => {
                    const tag = tags.find(t => t.tag_id === config.tagId);
                    if (!tag) return null;

                    const availableCount = availableQuestions.filter(q =>
                      Array.isArray(q.tags)
                        ? q.tags.some(tagObj => tagObj.tag_id === config.tagId)
                        : false
                    ).length;

                    const isExceed = config.questionCount > availableCount;

                    return (
                      <div key={config.tagId} className="flex flex-col p-3 border border-gray-200 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                              {tag.name}
                            </span>
                            <span className="ml-2 text-xs text-gray-500">
                              ({availableCount} available)
                            </span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <label htmlFor={`count-${config.tagId}`} className="text-sm text-gray-600">
                              Questions:
                            </label>
                            <input
                              type="number"
                              id={`count-${config.tagId}`}
                              value={config.questionCount}
                              onChange={(e) => updateTagQuestionCount(config.tagId, Number(e.target.value))}
                              min="1"
                              max="50"
                              className="w-20 px-2 py-1 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-center"
                            />
                          </div>
                        </div>
                        {isExceed && (
                          <div className="mt-2 w-full">
                            <span className="text-xs text-red-600 font-semibold">
                              Không được vượt quá {availableCount} câu
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-semibold">Total questions:</span> {tagConfigs.reduce((sum, config) => sum + config.questionCount, 0)}
                  </p>
                  {/* Cảnh báo nếu tổng số câu hỏi muốn chọn > availableQuestions.length */}
                  {tagConfigs.reduce((sum, config) => sum + config.questionCount, 0) > availableQuestions.length && (
                    (() => {
                      // Đếm số câu hỏi trùng tag
                      const questionTagCount: Record<number, number> = {};
                      availableQuestions.forEach(q => {
                        if (Array.isArray(q.tags)) {
                          // lọc các tag của câu hỏi đang chọn
                          const matchedTags = q.tags.filter(tagObj => tagConfigs.some(config => config.tagId === tagObj.tag_id));
                          // lưu lại nếu câu hỏi được chọn có nhiều tag
                          if (matchedTags.length > 1) {
                            questionTagCount[q.question_id] = matchedTags.length;
                          }
                        }
                      });
                      const duplicateCount = Object.keys(questionTagCount).length;
                      return (
                        <p className="mt-2 text-xs text-orange-600">
                          Tổng số câu hỏi bạn muốn chọn vượt quá số lượng câu hỏi khả dụng.<br />
                          Có {duplicateCount} câu hỏi thuộc nhiều tag nên chỉ có thể tạo quiz với tối đa <b>{availableQuestions.length}</b> câu hỏi.
                        </p>
                      );
                    })()
                  )}
                </div>
              </div>
            )}

            {/* Preview Section */}
            {availableQuestions.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-medium text-gray-900 flex items-center">
                    Available Questions ({availableQuestions.length})
                    {tagConfigs.length > 0 && (() => {
                      // Đếm số câu hỏi trùng tag
                      const questionTagCount: Record<number, number> = {};
                      availableQuestions.forEach(q => {
                        if (Array.isArray(q.tags)) {
                          const matchedTags = q.tags.filter(tagObj => tagConfigs.some(config => config.tagId === tagObj.tag_id));
                          if (matchedTags.length > 1) {
                            questionTagCount[q.question_id] = matchedTags.length;
                          }
                        }
                      });
                      const duplicateCount = Object.keys(questionTagCount).length;
                      if (duplicateCount > 0) {
                        return (
                          <span className="ml-4 px-2 py-1 bg-orange-50 text-orange-700 text-xs rounded">
                            Có {duplicateCount} câu hỏi thuộc nhiều tag
                          </span>
                        );
                      }
                      return null;
                    })()}
                  </h4>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handlePreviewQuestions}
                      className="inline-flex items-center px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Preview Random Selection
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                  {availableQuestions.slice(0, 6).map((question, index) => (
                    <div key={question.question_id} className="bg-white p-3 rounded border">
                      <p className="text-sm text-gray-900 truncate">{question.question_text}</p>
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${getQuestionTypeColor(question.question_type)}`}>
                        {getQuestionTypeLabel(question.question_type)}
                      </span>
                    </div>
                  ))}
                  {availableQuestions.length > 6 && (
                    <div className="bg-white p-3 rounded border flex items-center justify-center">
                      <p className="text-sm text-gray-500">+{availableQuestions.length - 6} more...</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={handlePrevStep}
                className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
              >
                Previous
              </button>
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard/hr/quizzes')}
                  className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={loading || tagConfigs.length === 0 || tagConfigs.reduce((sum, config) => sum + config.questionCount, 0) <= 0 || availableQuestions.length < tagConfigs.reduce((sum, config) => sum + config.questionCount, 0)}
                  className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? 'Creating...' : 'Create Quiz'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Preview Questions Modal */}
      {previewQuestions.length > 0 && (
        <Modal
          isOpen={isPreviewModalOpen}
          onClose={() => setIsPreviewModalOpen(false)}
          title={`Preview: ${tagConfigs.reduce((sum, config) => sum + config.questionCount, 0)} Random Questions`}
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {previewQuestions.length} randomly selected questions
            </p>
            {/* <button
              onClick={handleShufflePreview}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Shuffle className="w-4 h-4 mr-1" />
              Shuffle
            </button> */}
          </div>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {previewQuestions.map((question, index) => (
              <div key={question.question_id} className="border border-gray-200 rounded-lg p-4">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-medium text-gray-900">Question {index + 1}</h4>
                  <div className="flex items-center space-x-2">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getQuestionTypeColor(question.question_type)}`}>
                      {getQuestionTypeLabel(question.question_type)}
                    </span>
                    <span className="text-xs text-gray-500">{question.points} pts</span>
                  </div>
                </div>
                <p className="text-gray-700 mb-3">{question.question_text}</p>

                {question.options && (
                  <div className="space-y-1">
                    {parseOptions(question.options).map((option: string, optionIndex: number) => {
                      const isCorrect = isCorrectAnswer(option, question.correct_answer, question.question_type);
                      return (
                        <div key={optionIndex} className="flex items-center space-x-2">
                          {isCorrect ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <Circle className="w-4 h-4 text-gray-400" />
                          )}
                          <span className={isCorrect ? 'text-green-700 font-medium' : 'text-gray-600'}>
                            {option}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              Đây là bản minh họa với {previewQuestions.length} câu hỏi bạn chọn.
              Quiz thực tế sẽ được tạo ngẫu nhiên từ các câu hỏi phù hợp với cấu hình tag đã chọn.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default withAuth(CreateQuizPage);