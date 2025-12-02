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
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [questionCount, setQuestionCount] = useState<number>(10);
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
    if (selectedTags.length > 0) {
      fetchAvailableQuestions();
    } else {
      setAvailableQuestions([]);
    }
  }, [selectedTags]);

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
      const result = await questionApi.getByTags({
        tagIds: selectedTags,
        limit: 100 // Lấy tối đa 100 câu để preview
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
      [name]: name === 'duration' || name === 'passing_score' ? Number(value) : value
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
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handlePreviewQuestions = () => {
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
    setPreviewQuestions(shuffled.slice(0, Math.min(questionCount, availableQuestions.length)));
    setIsPreviewModalOpen(true);
  };

  const handleShufflePreview = () => {
    const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
    setPreviewQuestions(shuffled.slice(0, Math.min(questionCount, availableQuestions.length)));
  };

  const handleSubmit = async () => {
    if (selectedTags.length === 0) {
      showToast.error('Please select at least one tag');
      return;
    }

    if (!questionCount || questionCount <= 0) {
      showToast.error('Question count must be greater than 0');
      return;
    }

    if (availableQuestions.length < questionCount) {
      showToast.error(`Not enough questions available. Found ${availableQuestions.length}, need ${questionCount}`);
      return;
    }

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

    try {
      setLoading(true);
      
      const payload = {
        quizData: {
          title: formData.title.trim(),
          description: formData.description.trim() || undefined,
          duration: Number(formData.duration),
          passing_score: Number(formData.passing_score),
          status: formData.status
        },
        tagIds: selectedTags,
        questionCount: Number(questionCount)
      };
      
      const result = await quizApi.createWithRandomQuestions(payload);

      if (result.error) {
        throw new Error(result.message || 'Error creating quiz');
      }

      showToast.success(`Quiz created successfully with ${questionCount} random questions`);
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
                Select Tags *
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
                        className={`inline-flex items-center px-3 py-2 rounded-full text-sm font-medium transition-colors ${
                          selectedTags.includes(tag.tag_id)
                            ? 'bg-blue-100 text-blue-800 border-blue-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200 hover:bg-gray-200'
                        } border`}
                      >
                        {selectedTags.includes(tag.tag_id) && (
                          <CheckCircle className="w-4 h-4 mr-1" />
                        )}
                        {tag.name}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Selected {selectedTags.length} tag{selectedTags.length !== 1 ? 's' : ''}
              </p>
            </div>

            {/* Question Count */}
            <div>
              <label htmlFor="questionCount" className="block text-sm font-medium text-gray-700 mb-2">
                Number of Questions *
              </label>
              <input
                type="number"
                id="questionCount"
                value={questionCount}
                onChange={(e) => setQuestionCount(Number(e.target.value))}
                min="1"
                max="100"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                placeholder="Enter number of questions..."
              />
              <p className="text-sm text-gray-500 mt-1">
                Available questions with selected tags: {availableQuestions.length}
              </p>
            </div>

            {/* Preview Section */}
            {availableQuestions.length > 0 && (
              <div className="bg-gray-50 rounded-lg p-4">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="text-md font-medium text-gray-900">
                    Available Questions ({availableQuestions.length})
                  </h4>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={() => {
                        const shuffled = [...availableQuestions].sort(() => Math.random() - 0.5);
                        setAvailableQuestions(shuffled);
                      }}
                      className="inline-flex items-center px-3 py-2 bg-gray-600 text-white text-sm rounded-lg hover:bg-gray-700 transition-colors"
                    >
                      <Shuffle className="w-4 h-4 mr-1" />
                      Shuffle
                    </button>
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
                  disabled={loading || selectedTags.length === 0 || questionCount <= 0 || availableQuestions.length < questionCount}
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
          title={`Preview: ${questionCount} Random Questions`}
        >
          <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-200">
            <p className="text-sm text-gray-600">
              Showing {previewQuestions.length} randomly selected questions
            </p>
            <button
              onClick={handleShufflePreview}
              className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Shuffle className="w-4 h-4 mr-1" />
              Shuffle Again
            </button>
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
                    {parseOptions(question.options).map((option: string, optionIndex: number) => (
                      <div key={optionIndex} className="flex items-center space-x-2">
                        {option === question.correct_answer ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Circle className="w-4 h-4 text-gray-400" />
                        )}
                        <span className={option === question.correct_answer ? 'text-green-700 font-medium' : 'text-gray-600'}>
                          {option}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
          
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-sm text-gray-600">
              This is a preview of {previewQuestions.length} randomly selected questions. 
              The actual quiz will select different random questions each time it's taken.
            </p>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default withAuth(CreateQuizPage);