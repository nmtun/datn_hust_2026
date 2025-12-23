/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import { questionApi, quizApi, Quiz, QuizQuestion } from "@/app/api/quizApi";
import { showToast } from "@/app/utils/toast";
import { withAuth } from "@/app/middleware/withAuth";

function EditQuestionPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;
  const questionId = params.questionId as string;
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [question, setQuestion] = useState<QuizQuestion | null>(null);
  const [formData, setFormData] = useState({
    question_text: "",
    question_type: "multiple_choice" as "multiple_choice" | "multiple_response" | "true_false",
    options: ["", "", "", ""],
    correct_answer: "",
    points: 1
  });

  useEffect(() => {
    if (quizId && questionId) {
      fetchQuiz();
      fetchQuestion();
    }
  }, [quizId, questionId]);

  const fetchQuiz = async () => {
    try {
      const result = await quizApi.getById(Number(quizId));
      if (result && !result.error && result.quiz) {
        setQuiz(result.quiz);
      }
    } catch (error) {
      console.error("Error fetching quiz:", error);
    }
  };

  const fetchQuestion = async () => {
    try {
      setInitialLoading(true);
      const result = await questionApi.getById(Number(questionId));

      if (result.error || !result.question) {
        showToast.error(result.message || 'Question not found');
        router.push(`/dashboard/hr/quizzes/${quizId}/questions`);
        return;
      }

      const questionData = result.question;
      setQuestion(questionData);
      
      // Parse options if they exist
      let parsedOptions = ["", "", "", ""];
      if (questionData.options) {
        try {
          parsedOptions = JSON.parse(questionData.options);
        } catch {
          parsedOptions = questionData.options.split(',').map((opt: string) => opt.trim());
        }
      }

      setFormData({
        question_text: questionData.question_text,
        question_type: questionData.question_type,
        options: questionData.question_type === 'true_false' ? ["True", "False"] : parsedOptions,
        correct_answer: questionData.correct_answer,
        points: questionData.points
      });
    } catch (error: any) {
      console.error("Error fetching question:", error);
      showToast.error('Error loading question');
      router.push(`/dashboard/hr/quizzes/${quizId}/questions`);
    } finally {
      setInitialLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'points' || name === 'quiz_id' ? (value === '' ? '' : Number(value)) : value
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
      if (!nonEmptyOptions.includes(formData.correct_answer)) {
        showToast.error('Correct answer must be one of the options');
        return;
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

      const result = await questionApi.update(Number(questionId), {
        question_text: formData.question_text.trim(),
        question_type: formData.question_type,
        options: optionsToSend,
        correct_answer: formData.correct_answer,
        points: formData.points
      });

      if (result.error) {
        throw new Error(result.message || 'Error updating question');
      }

      showToast.success('Question updated successfully');
      router.push(`/dashboard/hr/quizzes/${quizId}/questions`);
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
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  if (!question || !quiz) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">Question not found</h3>
          <button
            onClick={() => router.push(`/dashboard/hr/quizzes/${quizId}/questions`)}
            className="text-blue-600 hover:text-blue-700"
          >
            Back to Questions
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
            onClick={() => router.push(`/dashboard/hr/quizzes/${quizId}/questions`)}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">Edit Question</h1>
            <span className="ml-3 text-sm text-gray-600">for "{quiz.title}"</span>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
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
                        disabled={!option.trim()}
                        checked={
                          formData.question_type === 'multiple_response'
                            ? !!option && formData.correct_answer
                              .split(',')
                              .filter(ans => ans.trim() !== '')
                              .includes(option)
                            : formData.correct_answer === option && !!option
                        }
                        onChange={(e) => {
                          if (!option.trim()) return;
                          
                          if (formData.question_type === 'multiple_response') {
                            const currentAnswers = formData.correct_answer ? formData.correct_answer.split(',').filter(ans => ans.trim()) : [];
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

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push(`/dashboard/hr/quizzes/${quizId}/questions`)}
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