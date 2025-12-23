/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { ArrowLeft, Plus, Edit2, Eye, Trash2, CheckCircle, XCircle } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { useState, useEffect } from "react";
import { questionApi, QuizQuestion, quizApi, Quiz, questionToQuizApi } from "@/app/api/quizApi";
import { showToast } from "@/app/utils/toast";
import Modal from "@/app/components/Modal";
import { withAuth } from "@/app/middleware/withAuth";

function QuizQuestionsPage() {
  const router = useRouter();
  const params = useParams();
  const quizId = params.id as string;
  
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedQuestion, setSelectedQuestion] = useState<QuizQuestion | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);

  useEffect(() => {
    if (quizId) {
      fetchQuiz();
      fetchQuestions();
    }
  }, [quizId]);

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

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      const result = await questionApi.getByQuizId(Number(quizId));

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
      // Remove question from quiz
      const result = await questionToQuizApi.removeQuestionFromQuiz({
        questionId: questionToDelete.question_id,
        quizId: Number(quizId)
      });

      if (result.error) {
        throw new Error(result.message || 'Error removing question from quiz');
      }

      // Refresh the list
      await fetchQuestions();

      showToast.success('Question removed from quiz successfully');
    } catch (error: any) {
      console.error("Error removing question from quiz:", error);
      showToast.error(error.message || 'Error removing question from quiz');
    } finally {
      setDeleteLoading(null);
      setShowDeleteConfirm(false);
      setQuestionToDelete(null);
    }
  };

  const handleEdit = (questionId: number) => {
    router.push(`/dashboard/hr/quizzes/${quizId}/questions/edit/${questionId}`);
  };

  const handleView = (questionId: number) => {
    const question = questions.find(q => q.question_id === questionId);
    if (question) {
      setSelectedQuestion(question);
      setIsViewModalOpen(true);
    }
  };

  const handleCreateNew = () => {
    router.push(`/dashboard/hr/questions/create?quizId=${quizId}`);
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

  if (!quiz) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div>
        <button
          onClick={() => router.push('/dashboard/hr/quizzes')}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Quizzes
        </button>
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Questions for: {quiz.title}</h1>
            <p className="text-gray-600 mt-1">
              Duration: {quiz.duration} minutes | Passing Score: {quiz.passing_score}% | 
              Total Questions: {questions.length}
            </p>
          </div>
        </div>
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : questions.length === 0 ? (
        <div className="text-center py-12">
          <div className="mx-auto h-12 w-12 text-gray-400 mb-4">❓</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No questions yet</h3>
          <p className="text-gray-500 mb-4">This quiz doesn't have any questions yet.</p>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add First Question
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <div key={question.question_id} className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="text-sm font-medium text-gray-500">Question {index + 1}</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getQuestionTypeColor(question.question_type)}`}>
                      {getQuestionTypeLabel(question.question_type)}
                    </span>
                    <span className="text-sm text-gray-500">{question.points} points</span>
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-3">
                    {question.question_text}
                  </h3>
                </div>
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleView(question.question_id)}
                    className="text-gray-400 hover:text-gray-500 p-2 rounded-lg hover:bg-gray-50"
                    title="View"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleEdit(question.question_id)}
                    className="text-blue-400 hover:text-blue-500 p-2 rounded-lg hover:bg-blue-50"
                    title="Edit"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteClick(question)}
                    disabled={deleteLoading === question.question_id}
                    className="text-red-400 hover:text-red-500 p-2 rounded-lg hover:bg-red-50 disabled:opacity-50"
                    title="Delete"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {question.options && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {parseOptions(question.options).map((option: string, optIndex: number) => (
                    <div
                      key={optIndex}
                      className={`flex items-center p-3 rounded-lg border-2 ${
                        option === question.correct_answer || question.correct_answer.includes(option)
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-200 bg-gray-50'
                      }`}
                    >
                      {option === question.correct_answer || question.correct_answer.includes(option) ? (
                        <CheckCircle className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600 mr-2 flex-shrink-0" />
                      )}
                      <span className={`text-sm ${
                        option === question.correct_answer || question.correct_answer.includes(option)
                          ? 'text-green-800 font-medium'
                          : 'text-gray-700'
                      }`}>
                        {option}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
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
                      {option === selectedQuestion.correct_answer || selectedQuestion.correct_answer.includes(option) ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <XCircle className="w-4 h-4 text-red-600" />
                      )}
                      <span className={option === selectedQuestion.correct_answer || selectedQuestion.correct_answer.includes(option) ? 'text-green-700 font-medium' : 'text-gray-700'}>
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
          title="Remove Question from Quiz"
        >
          <div className="space-y-4">
            <p className="text-gray-700">
              Are you sure you want to remove this question from the quiz? The question will remain in the question bank and can be added to other quizzes.
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
                {deleteLoading !== null ? 'Removing...' : 'Remove from Quiz'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}

export default withAuth(QuizQuestionsPage);