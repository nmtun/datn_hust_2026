/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { quizApi, Quiz, QuizQuestion, quizResultApi } from "@/app/api/quizApi";
import { Clock, CheckCircle } from "lucide-react";
import { showToast } from "@/app/utils/toast";
import { withAuth } from "@/app/middleware/withAuth";

interface QuizAnswer {
  question_id: number;
  answer: string | string[];
}

function TakeQuizPage() {
  const params = useParams();
  const router = useRouter();
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [timeLeft, setTimeLeft] = useState(0);
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [quizResult, setQuizResult] = useState<{
    score: number;
    correctCount: number;
    totalQuestions: number;
    passed: boolean;
  } | null>(null);

  useEffect(() => {
    if (params.quizId) {
      fetchQuiz();
    }
  }, [params.quizId]);

  useEffect(() => {
    if (quiz && timeLeft > 0) {
      const timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [quiz, timeLeft]);

  const fetchQuiz = async () => {
    try {
      setLoading(true);
      const response = await quizApi.getById(Number(params.quizId));
      
      if (!response || response.error) {
        console.error("API Error:", response?.message || "Unknown error");
        showToast.error('Lỗi khi tải bài kiểm tra');
        return;
      }
      
      setQuiz(response.quiz);
      setTimeLeft(response.quiz.duration * 60); // Convert minutes to seconds
      setQuizStartTime(new Date());
      
      // Initialize answers array
      const initialAnswers: QuizAnswer[] = response.quiz.questionAssignments?.map(
        (qa: any) => ({
          question_id: qa.question.question_id,
          answer: qa.question.question_type === "multiple_response" ? [] : "",
        })
      ) || [];
      setAnswers(initialAnswers);
    } catch (error) {
      console.error("Error fetching quiz:", error);
      showToast.error('Lỗi khi tải bài kiểm tra');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (questionId: number, answer: string | string[]) => {
    setAnswers((prev) =>
      prev.map((a) =>
        a.question_id === questionId ? { ...a, answer } : a
      )
    );
  };

  const handleMultipleResponseChange = (
    questionId: number,
    option: string,
    checked: boolean
  ) => {
    setAnswers((prev) =>
      prev.map((a) => {
        if (a.question_id === questionId) {
          const currentAnswers = Array.isArray(a.answer) ? a.answer : [];
          if (checked) {
            return { ...a, answer: [...currentAnswers, option] };
          } else {
            return {
              ...a,
              answer: currentAnswers.filter((ans) => ans !== option),
            };
          }
        }
        return a;
      })
    );
  };

  const calculateScore = () => {
    if (!quiz?.questionAssignments) return { correctCount: 0, totalQuestions: 0, score: 0 };

    let correctCount = 0;
    const totalQuestions = quiz.questionAssignments.length;

    quiz.questionAssignments.forEach((qa) => {
      const question = qa.question;
      const userAnswer = answers.find((a) => a.question_id === question.question_id);

      if (!userAnswer) return;

      if (question.question_type === "multiple_response") {
        const correctAnswers = question.correct_answer.split(",").sort();
        const userAnswers = Array.isArray(userAnswer.answer)
          ? userAnswer.answer.sort()
          : [];
        
        if (
          correctAnswers.length === userAnswers.length &&
          correctAnswers.every((ans, idx) => ans === userAnswers[idx])
        ) {
          correctCount++;
        }
      } else {
        if (userAnswer.answer === question.correct_answer) {
          correctCount++;
        }
      }
    });

    const score = (correctCount / totalQuestions) * 100;
    return { correctCount, totalQuestions, score };
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    setIsSubmitting(true);
    try {
      const result = calculateScore();
      const { score, correctCount, totalQuestions } = result;
      const completionTime = quizStartTime
        ? Math.floor((new Date().getTime() - quizStartTime.getTime()) / 1000)
        : 0;

      const passed = score >= (quiz?.passing_score || 70);

      // Submit quiz result to backend
      await quizResultApi.submit({
        quiz_id: quiz?.quiz_id!,
        score: score,
        pass_status: passed,
        completion_time: completionTime,
        answers: answers,
      });

      // Show result modal
      setQuizResult({
        score,
        correctCount,
        totalQuestions,
        passed,
      });
      setShowResultModal(true);
    } catch (error) {
      console.error("Error submitting quiz:", error);
      showToast.error('Có lỗi xảy ra khi nộp bài. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  const currentQuestion = quiz?.questionAssignments?.[currentQuestionIndex];
  const progress = quiz?.questionAssignments
    ? ((currentQuestionIndex + 1) / quiz.questionAssignments.length) * 100
    : 0;

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!quiz || !currentQuestion) {
    return (
      <div className="bg-white p-12 rounded-lg shadow-sm text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Không tìm thấy bài kiểm tra
        </h2>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const question = currentQuestion.question;
  const options = question.options ? JSON.parse(question.options) : [];
  const userAnswer = answers.find((a) => a.question_id === question.question_id);

  return (
    <div className="space-y-6">
      {/* Header with Timer */}
      <div className="bg-white p-6 rounded-lg shadow-sm sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900">{quiz.title}</h1>
          <div
            className={`flex items-center text-lg font-semibold ${
              timeLeft < 300 ? "text-red-600" : "text-gray-700"
            }`}
          >
            <Clock className="w-6 h-6 mr-2" />
            {formatTime(timeLeft)}
          </div>
        </div>

        {/* Progress Bar and Question Overview */}
        <div className="flex gap-6 items-start">
          {/* Progress Section */}
          <div className="flex-1">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Câu {currentQuestionIndex + 1} / {quiz.questionAssignments?.length}
            </p>
          </div>

          {/* Question Navigation Grid - Compact */}
          <div className="flex-shrink-0">
            <h3 className="text-sm font-semibold text-gray-700 mb-2">
              Tổng quan
            </h3>
            <div className="grid grid-cols-10 gap-1.5">
              {quiz.questionAssignments?.map((qa, index) => {
                const answered = answers.find(
                  (a) => a.question_id === qa.question.question_id
                );
                const hasAnswer =
                  answered &&
                  (Array.isArray(answered.answer)
                    ? answered.answer.length > 0
                    : answered.answer !== "");

                return (
                  <button
                    key={qa.question.question_id}
                    onClick={() => setCurrentQuestionIndex(index)}
                    className={`w-7 h-7 rounded text-xs font-semibold transition-colors ${
                      index === currentQuestionIndex
                        ? "bg-indigo-600 text-white"
                        : hasAnswer
                        ? "bg-green-100 text-green-700 hover:bg-green-200"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                  >
                    {index + 1}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Question Content */}
      <div className="bg-white rounded-lg shadow-sm p-8">
        {/* Question Text */}
        <div className="mb-6">
          <div className="flex items-start">
            <span className="flex-shrink-0 w-8 h-8 bg-indigo-600 text-white rounded-full flex items-center justify-center font-semibold mr-4">
              {currentQuestionIndex + 1}
            </span>
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {question.question_text}
              </h2>
              <p className="text-sm text-gray-500">
                {question.question_type === "multiple_response"
                  ? "Chọn tất cả các đáp án đúng"
                  : question.question_type === "true_false"
                  ? "Chọn Đúng hoặc Sai"
                  : "Chọn một đáp án đúng"}
              </p>
            </div>
          </div>
        </div>

        {/* Answer Options */}
        <div className="space-y-3">{question.question_type === "multiple_response" ? (
              // Multiple Response (Checkboxes)
              options.map((option: string, index: number) => (
                <label
                  key={index}
                  className="flex items-start p-4 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-indigo-300 transition-colors"
                >
                  <input
                    type="checkbox"
                    checked={
                      Array.isArray(userAnswer?.answer) &&
                      userAnswer.answer.includes(option)
                    }
                    onChange={(e) =>
                      handleMultipleResponseChange(
                        question.question_id,
                        option,
                        e.target.checked
                      )
                    }
                    className="mt-1 h-5 w-5 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="ml-3 text-gray-700">{option}</span>
                </label>
              ))
            ) : question.question_type === "true_false" ? (
              // True/False (Radio buttons)
              ["Đúng", "Sai"].map((option, index) => (
                <label
                  key={index}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    userAnswer?.answer === option
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.question_id}`}
                    value={option}
                    checked={userAnswer?.answer === option}
                    onChange={(e) =>
                      handleAnswerChange(question.question_id, e.target.value)
                    }
                    className="h-5 w-5 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="ml-3 text-gray-700 font-medium">
                    {option}
                  </span>
                </label>
              ))
            ) : (
              // Multiple Choice (Radio buttons)
              options.map((option: string, index: number) => (
                <label
                  key={index}
                  className={`flex items-center p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                    userAnswer?.answer === option
                      ? "border-indigo-500 bg-indigo-50"
                      : "border-gray-200 hover:border-indigo-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${question.question_id}`}
                    value={option}
                    checked={userAnswer?.answer === option}
                    onChange={(e) =>
                      handleAnswerChange(question.question_id, e.target.value)
                    }
                    className="h-5 w-5 text-indigo-600 focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="ml-3 text-gray-700">{option}</span>
                </label>
              ))
            )}
          </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between mt-8 pt-6 border-t">
          <button
            onClick={() =>
              setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
            }
            disabled={currentQuestionIndex === 0}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            ← Câu trước
          </button>

          {currentQuestionIndex === (quiz.questionAssignments?.length || 0) - 1 ? (
            <button
              onClick={() => setShowConfirmDialog(true)}
              className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium flex items-center"
            >
              <CheckCircle className="w-5 h-5 mr-2" />
              Nộp bài
            </button>
          ) : (
            <button
              onClick={() =>
                setCurrentQuestionIndex((prev) =>
                  Math.min((quiz.questionAssignments?.length || 1) - 1, prev + 1)
                )
              }
              className="px-6 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
            >
              Câu tiếp →
            </button>
          )}
        </div>
      </div>

      {/* Confirm Submit Dialog */}
      {showConfirmDialog && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-gray-900 mb-4">
              Xác nhận nộp bài
            </h3>
            <p className="text-gray-600 mb-6">
              Bạn có chắc chắn muốn nộp bài? Sau khi nộp bạn không thể thay đổi
              câu trả lời.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={() => {
                  setShowConfirmDialog(false);
                  handleSubmit();
                }}
                disabled={isSubmitting}
                className="flex-1 px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? "Đang nộp..." : "Nộp bài"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result Modal */}
      {showResultModal && quizResult && (
        <div className="fixed inset-0 bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              {quizResult.passed ? (
                <CheckCircle className="w-16 h-16 text-green-500" />
              ) : (
                <CheckCircle className="w-16 h-16 text-red-500" />
              )}
            </div>

            {/* Title */}
            <h3 className="text-2xl font-bold text-center text-gray-900 mb-2">
              {quizResult.passed ? "Chúc mừng! 🎉" : "Chưa đạt yêu cầu"}
            </h3>

            {/* Score */}
            <div className="text-center mb-6">
              <div className="text-5xl font-bold text-indigo-600 mb-2">
                {quizResult.score.toFixed(0)}%
              </div>
              <div className="text-lg text-gray-600">
                Số câu đúng: <span className="font-semibold text-gray-900">{quizResult.correctCount}/{quizResult.totalQuestions}</span>
              </div>
            </div>

            {/* Message */}
            <p className="text-center text-gray-600 mb-6">
              {quizResult.passed
                ? "Bạn đã hoàn thành xuất sắc bài kiểm tra!"
                : "Đừng nản lòng, hãy thử lại lần nữa!"}
            </p>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <button
                onClick={() => {
                  router.push("/dashboard/employee/training");
                }}
                className="w-full px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium"
              >
                Về trang đào tạo
              </button>
              {!quizResult.passed && (
                <button
                  onClick={() => {
                    window.location.reload();
                  }}
                  className="w-full px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                >
                  Làm lại bài kiểm tra
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(TakeQuizPage);
