/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import { questionApi, QuizQuestion } from "@/app/api/quizApi";
import { tagApi, Tag } from "@/app/api/tagApi";
import { showToast } from "@/app/utils/toast";
import { withAuth } from "@/app/middleware/withAuth";

function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const questionId = Array.isArray(params.id) ? parseInt(params.id[0]) : parseInt(params.id as string);
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);

  const [tags, setTags] = useState<Tag[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [formData, setFormData] = useState({
    question_text: "",
    question_type: "multiple_choice" as "multiple_choice" | "multiple_response" | "true_false",
    options: ["", "", "", ""],
    correct_answer: "",
    points: 1
  });

  useEffect(() => {
    if (questionId) {
      fetchQuestion();
      fetchTags();
    }
  }, [questionId]);

  const fetchQuestion = async () => {
    try {
      setInitialLoading(true);
      const result = await questionApi.getById(questionId);
      
      if (result.error) {
        throw new Error(result.message || 'Question not found');
      }

      const questionData = result.question;
      setQuestion(questionData);

      // Parse options
      let options = ["", "", "", ""];
      if (questionData.options) {
        try {
          const parsedOptions = JSON.parse(questionData.options);
          options = Array.isArray(parsedOptions) ? parsedOptions : questionData.options.split(',').map((opt: string) => opt.trim());
        } catch {
          options = questionData.options.split(',').map((opt: string) => opt.trim());
        }
      }

      // Set form data
      setFormData({
        question_text: questionData.question_text || "",
        question_type: questionData.question_type || "multiple_choice",
        options: questionData.question_type === 'true_false' ? ["True", "False"] : options,
        correct_answer: questionData.correct_answer || "",
        points: questionData.points || 1
      });

      // Set selected tags
      if (questionData.tags) {
        setSelectedTags(questionData.tags.map((tag: any) => tag.tag_id));
      }

    } catch (error: any) {
      console.error("Error fetching question:", error);
      showToast.error(error.message || 'Error loading question');
      router.push('/dashboard/hr/questions');
    } finally {
      setInitialLoading(false);
    }
  };

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

  const toggleTagSelection = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId) 
        ? prev.filter(id => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'points' ? (value === '' ? '' : Number(value)) : value
    }));
  };

  const handleQuestionTypeChange = (type: "multiple_choice" | "multiple_response" | "true_false") => {
    setFormData(prev => ({
      ...prev,
      question_type: type,
      options: type === 'true_false' ? ["True", "False"] : ["", "", "", ""],
      correct_answer: ""
    }));
  };

  const handleOptionChange = (index: number, value: string) => {
    setFormData(prev => {
      const newOptions = prev.options.map((option, i) => i === index ? value : option);
      let newCorrectAnswer = prev.correct_answer;
      
      // If the option text is cleared and it was selected as correct answer, remove it
      if (value.trim() === '' && prev.options[index] === prev.correct_answer) {
        newCorrectAnswer = "";
      } else if (value.trim() === '' && prev.question_type === 'multiple_response') {
        // For multiple response, remove this option from correct answers
        const correctAnswers = prev.correct_answer ? prev.correct_answer.split(',') : [];
        const filteredAnswers = correctAnswers.filter(ans => ans !== prev.options[index]);
        newCorrectAnswer = filteredAnswers.join(',');
      } else if (prev.options[index] === prev.correct_answer && value !== prev.options[index]) {
        // If option text changed and it was the correct answer, update correct answer
        newCorrectAnswer = value;
      } else if (prev.question_type === 'multiple_response' && prev.correct_answer.includes(prev.options[index])) {
        // For multiple response, update the correct answer if this option was selected
        const correctAnswers = prev.correct_answer.split(',');
        const updatedAnswers = correctAnswers.map(ans => ans === prev.options[index] ? value : ans);
        newCorrectAnswer = updatedAnswers.join(',');
      }
      
      return {
        ...prev,
        options: newOptions,
        correct_answer: newCorrectAnswer
      };
    });
  };

  const addOption = () => {
    if (formData.options.length < 6) {
      setFormData(prev => ({
        ...prev,
        options: [...prev.options, ""]
      }));
    }
  };

  const removeOption = (index: number) => {
    if (formData.options.length > 2) {
      setFormData(prev => ({
        ...prev,
        options: prev.options.filter((_, i) => i !== index),
        correct_answer: prev.correct_answer === prev.options[index] ? "" : prev.correct_answer
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.question_text.trim()) {
      showToast.error('Please enter question text');
      return;
    }

    if (!formData.correct_answer) {
      showToast.error('Please set the correct answer');
      return;
    }

    if (formData.question_type !== 'true_false') {
      const nonEmptyOptions = formData.options.filter(opt => opt.trim());
      if (nonEmptyOptions.length < 2) {
        showToast.error('Please provide at least 2 options');
        return;
      }
      
      // For multiple response, check if all correct answers exist in options
      if (formData.question_type === 'multiple_response') {
        const correctAnswers = formData.correct_answer ? formData.correct_answer.split(',').filter(ans => ans.trim()) : [];
        if (correctAnswers.length === 0) {
          showToast.error('Please select at least one correct answer');
          return;
        }
        const invalidAnswers = correctAnswers.filter(ans => !nonEmptyOptions.includes(ans));
        if (invalidAnswers.length > 0) {
          showToast.error('All correct answers must have corresponding option text');
          return;
        }
      } else {
        // For multiple choice, check single correct answer
        if (!formData.correct_answer || !nonEmptyOptions.includes(formData.correct_answer)) {
          showToast.error('Please select a correct answer from the available options');
          return;
        }
      }
    }

    if (formData.points <= 0) {
      showToast.error('Points must be greater than 0');
      return;
    }

    try {
      setLoading(true);
      
      let optionsToSend = undefined;
      if (formData.question_type !== 'true_false') {
        const nonEmptyOptions = formData.options.filter(opt => opt.trim());
        optionsToSend = JSON.stringify(nonEmptyOptions);
      }

      const result = await questionApi.update(questionId, {
        question_text: formData.question_text.trim(),
        question_type: formData.question_type,
        options: optionsToSend,
        correct_answer: formData.correct_answer,
        points: formData.points
      });

      if (result.error) {
        throw new Error(result.message || 'Error updating question');
      }

      // Update tags
      try {
        // First, remove all existing tags for this question
        if (question?.tags && question.tags.length > 0) {
          const currentTagIds = question.tags.map(tag => tag.tag_id);
          await tagApi.removeFromQuestion(questionId, currentTagIds);
        }
        
        // Then assign new tags if any selected
        if (selectedTags.length > 0) {
          await tagApi.assignToQuestion(questionId, selectedTags);
        }
      } catch (tagError) {
        console.warn("Error updating tags:", tagError);
        // Don't fail the entire process if tag assignment fails
      }

      showToast.success('Question updated successfully');
      router.push('/dashboard/hr/questions');
    } catch (error: any) {
      console.error("Error updating question:", error);
      showToast.error(error.message || 'Error updating question');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center items-center p-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
        </div>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Question not found</h3>
          <button
            onClick={() => router.push('/dashboard/hr/questions')}
            className="text-indigo-600 hover:text-indigo-500"
          >
            Go back to questions
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => router.push('/dashboard/hr/questions')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">Edit Question</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Editing Question</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <p>Changes to this question will affect all quizzes that use it. Use tags to categorize your questions for easy selection when creating quizzes.</p>
                </div>
              </div>
            </div>
          </div>

          <div>
            <label htmlFor="question_text" className="block text-sm font-medium text-gray-700 mb-2">
              Question Text *
            </label>
            <textarea
              id="question_text"
              name="question_text"
              value={formData.question_text}
              onChange={handleInputChange}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              placeholder="Enter your question..."
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Question Type *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="question_type"
                  value="multiple_choice"
                  checked={formData.question_type === 'multiple_choice'}
                  onChange={() => handleQuestionTypeChange('multiple_choice')}
                  className="mr-2"
                />
                Multiple Choice (Single Answer)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="question_type"
                  value="multiple_response"
                  checked={formData.question_type === 'multiple_response'}
                  onChange={() => handleQuestionTypeChange('multiple_response')}
                  className="mr-2"
                />
                Multiple Response (Multiple Answers)
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="question_type"
                  value="true_false"
                  checked={formData.question_type === 'true_false'}
                  onChange={() => handleQuestionTypeChange('true_false')}
                  className="mr-2"
                />
                True/False
              </label>
            </div>
          </div>

          {formData.question_type !== 'true_false' && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-sm font-medium text-gray-700">
                  Options *
                </label>
                {formData.options.length < 6 && (
                  <button
                    type="button"
                    onClick={addOption}
                    className="flex items-center px-3 py-1 text-sm bg-blue-100 text-blue-600 rounded-lg hover:bg-blue-200"
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Option
                  </button>
                )}
              </div>
              <div className="space-y-3">
                {formData.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3">
                    <div className="flex-1">
                      <input
                        type="text"
                        value={option}
                        onChange={(e) => handleOptionChange(index, e.target.value)}
                        placeholder={`Option ${index + 1}...`}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <label className="flex items-center">
                      <input
                        type={formData.question_type === 'multiple_response' ? 'checkbox' : 'radio'}
                        name="correct_answer"
                        value={option}
                        checked={formData.correct_answer === option || (formData.question_type === 'multiple_response' && formData.correct_answer.includes(option))}
                        onChange={(e) => {
                          if (formData.question_type === 'multiple_response') {
                            const currentAnswers = formData.correct_answer ? formData.correct_answer.split(',') : [];
                            if (e.target.checked) {
                              setFormData(prev => ({
                                ...prev,
                                correct_answer: [...currentAnswers, option].join(',')
                              }));
                            } else {
                              setFormData(prev => ({
                                ...prev,
                                correct_answer: currentAnswers.filter(ans => ans !== option).join(',')
                              }));
                            }
                          } else {
                            setFormData(prev => ({
                              ...prev,
                              correct_answer: e.target.checked ? option : ""
                            }));
                          }
                        }}
                        className="mr-2"
                      />
                      <span className="text-sm text-gray-600">Correct</span>
                    </label>
                    {formData.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(index)}
                        className="text-red-600 hover:text-red-800 p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {formData.question_type === 'true_false' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Correct Answer *
              </label>
              <div className="flex space-x-4">
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="correct_answer"
                    value="True"
                    checked={formData.correct_answer === 'True'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  True
                </label>
                <label className="flex items-center">
                  <input
                    type="radio"
                    name="correct_answer"
                    value="False"
                    checked={formData.correct_answer === 'False'}
                    onChange={handleInputChange}
                    className="mr-2"
                  />
                  False
                </label>
              </div>
            </div>
          )}

          <div>
            <label htmlFor="points" className="block text-sm font-medium text-gray-700 mb-2">
              Points *
            </label>
            <input
              type="number"
              id="points"
              name="points"
              value={formData.points}
              onChange={handleInputChange}
              min="0.1"
              step="0.1"
              max="100"
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              required
            />
          </div>

          {/* Tag Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <div className="border border-gray-200 rounded-lg p-4 min-h-[120px]">
              {tags.length === 0 ? (
                <div className="text-center py-4">
                  <p className="text-gray-500 text-sm">No tags available.</p>
                  <p className="text-gray-400 text-xs mt-1">Tags help categorize questions for better organization.</p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {tags.map((tag) => (
                      <button
                        key={tag.tag_id}
                        type="button"
                        onClick={() => toggleTagSelection(tag.tag_id)}
                        className={`inline-flex items-center px-3 py-1.5 rounded-full text-sm font-medium transition-colors border ${
                          selectedTags.includes(tag.tag_id)
                            ? 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-150'
                            : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                        }`}
                      >
                        {selectedTags.includes(tag.tag_id) && (
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                        {tag.name}
                      </button>
                    ))}
                  </div>
                  <p className="text-sm text-gray-500">
                    {selectedTags.length > 0 
                      ? `${selectedTags.length} tag${selectedTags.length > 1 ? 's' : ''} selected`
                      : 'Select tags to categorize this question'
                    }
                  </p>
                </>
              )}
            </div>
          </div>

          {/* Quiz Usage Information */}
          {question && question.quizAssignments && question.quizAssignments.length > 0 && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Question in Use</h3>
                  <div className="mt-2 text-sm text-yellow-700">
                    <p>This question is currently used in {question.quizAssignments.length} quiz(s):</p>
                    <ul className="list-disc list-inside mt-1">
                      {question.quizAssignments.map((assignment) => (
                        <li key={assignment.id}>
                          {assignment.quiz.title} (Tag: {assignment.tag.name})
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push('/dashboard/hr/questions')}
              className="px-6 py-2.5 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 font-medium transition-colors"
            >
              <Save className="w-4 h-4 mr-2" />
              {loading ? 'Updating...' : 'Update Question'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default withAuth(EditQuestionPage);