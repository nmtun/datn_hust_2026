/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { trainingMaterialApi, TrainingMaterial } from "@/app/api/trainingMaterialApi";
import { quizResultApi, QuizResult } from "@/app/api/quizApi";
import { ArrowLeft, Clock, User, FileText, Download, Play, History, ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";
import { showToast } from "@/app/utils/toast";
import { withAuth } from "@/app/middleware/withAuth";

function TrainingMaterialDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [material, setMaterial] = useState<TrainingMaterial | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"content" | "quizzes">("content");
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);
  const [quizHistories, setQuizHistories] = useState<Record<number, QuizResult[]>>({});
  const [loadingHistory, setLoadingHistory] = useState<Record<number, boolean>>({});
  const [myQuizResults, setMyQuizResults] = useState<QuizResult[]>([]);

  useEffect(() => {
    if (params.id) {
      fetchMaterial();
    }
  }, [params.id]);

  const fetchMaterial = async () => {
    try {
      setLoading(true);
      const [materialResponse, myResultsResponse] = await Promise.allSettled([
        trainingMaterialApi.getById(Number(params.id)),
        quizResultApi.getMyResults(),
      ]);

      if (
        materialResponse.status !== "fulfilled" ||
        !materialResponse.value ||
        materialResponse.value.error
      ) {
        const message =
          materialResponse.status === "fulfilled"
            ? materialResponse.value?.message || "Unknown error"
            : materialResponse.reason;
        console.error("API Error:", message);
        showToast.error('Lỗi khi tải tài liệu');
        return;
      }

      setMaterial(materialResponse.value.material);

      if (
        myResultsResponse.status === "fulfilled" &&
        !myResultsResponse.value?.error
      ) {
        setMyQuizResults(myResultsResponse.value.results || []);
      } else {
        setMyQuizResults([]);
      }
    } catch (error) {
      console.error("Error fetching material:", error);
      showToast.error('Lỗi khi tải tài liệu');
      setMyQuizResults([]);
    } finally {
      setLoading(false);
    }
  };

  const passedQuizIds = new Set(
    myQuizResults
      .filter((result) => result.pass_status)
      .map((result) => result.quiz_id)
  );

  const toggleHistory = async (quizId: number) => {
    if (expandedHistory === quizId) {
      setExpandedHistory(null);
      return;
    }
    setExpandedHistory(quizId);
    if (quizHistories[quizId]) return;
    setLoadingHistory((prev) => ({ ...prev, [quizId]: true }));
    try {
      const response = await quizResultApi.getAttemptHistory(quizId);
      setQuizHistories((prev) => ({ ...prev, [quizId]: response.attempts || [] }));
    } catch {
      showToast.error('Lỗi khi tải lịch sử làm bài');
    } finally {
      setLoadingHistory((prev) => ({ ...prev, [quizId]: false }));
    }
  };

  const getFileUrl = (path: string) => {
    if (!path) return null;
    const files = path.split(";");
    return files[0]?.trim();
  };

  const getAllFiles = (path: string) => {
    if (!path) return [];
    return path.split(";").filter(f => f.trim()).map(f => f.trim());
  };

  const getFileName = (path: string) => {
    if (!path) return "Tải xuống";
    const fileName = path.split(/[\\/]/).pop();
    return fileName || "Tải xuống";
  };
  
  const getDisplayName = (path: string) => {
    const fileName = getFileName(path);
    // Remove timestamp pattern: _YYYY_MM_DD_HH_MM_SS_N
    return fileName.replace(/_\d{4}_\d{2}_\d{2}_\d{2}_\d{2}_\d{2}_\d+/, '');
  };
  const getFileUrlWithToken = (filename: string) => {
    const token = localStorage.getItem("token");
    return `${process.env.NEXT_PUBLIC_API_URL}/api/training-material/download/${filename}?token=${token}`;
  };
  const getFileExtension = (path: string) => {
    if (!path) return "";
    return path.split(".").pop()?.toLowerCase() || "";
  };

  const isVideo = (ext: string) => {
    return ["mp4", "avi", "mov", "wmv", "flv", "mkv"].includes(ext);
  };

  const isPdf = (ext: string) => {
    return ext === "pdf";
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (!material) {
    return (
      <div className="bg-white p-12 rounded-lg shadow-sm text-center">
        <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Không tìm thấy tài liệu
        </h2>
        <button
          onClick={() => router.push("/dashboard/employee/training")}
          className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
        >
          Quay lại danh sách
        </button>
      </div>
    );
  }

  const filePath = getFileUrl(material.content_path);
  const fileExt = filePath ? getFileExtension(filePath) : "";
  
  // Get all files and categorize them
  const allFiles = getAllFiles(material.content_path || "");
  const videoFiles = allFiles.filter(file => isVideo(getFileExtension(file)));
  const pdfFiles = allFiles.filter(file => isPdf(getFileExtension(file)));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <button
          onClick={() => router.push("/dashboard/employee/training")}
          className="flex items-center text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Quay lại danh sách
        </button>
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          {material.title}
        </h1>
        <div className="flex items-center text-sm text-gray-600 space-x-4">
          <div className="flex items-center">
            <User className="w-4 h-4 mr-1" />
            <span>{material.creator?.full_name || "Admin"}</span>
          </div>
          <div className="flex items-center">
            <Clock className="w-4 h-4 mr-1" />
            <span>{new Date(material.created_at).toLocaleDateString("vi-VN")}</span>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="bg-white rounded-lg shadow-sm">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab("content")}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === "content"
                  ? "border-indigo-500 text-indigo-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Nội dung học tập
            </button>
            {material.quizzes && material.quizzes.length > 0 && (
              <button
                onClick={() => setActiveTab("quizzes")}
                className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === "quizzes"
                    ? "border-indigo-500 text-indigo-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                Bài kiểm tra ({material.quizzes.length})
              </button>
            )}
          </nav>
        </div>

        {/* Content Tab */}
        {activeTab === "content" && (
          <div className="p-6">
            {/* Description */}
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-3">
                Mô tả
              </h2>
              <p className="text-gray-700 whitespace-pre-wrap">
                {material.description || "Không có mô tả"}
              </p>
            </div>

            {/* Tags */}
            {material.tags && material.tags.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Chủ đề
                </h3>
                <div className="flex flex-wrap gap-2">
                  {material.tags.map((tag) => (
                    <span
                      key={tag.tag_id}
                      className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium"
                    >
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* File Content */}
            {allFiles.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-3">
                  Tài liệu học tập
                </h3>

                {/* Layout: 2 columns if both types exist, centered if only one */}
                <div className={`${videoFiles.length > 0 && pdfFiles.length > 0 ? 'grid grid-cols-1 lg:grid-cols-2 gap-6' : 'flex justify-center'}`}>
                  {/* Video Section */}
                  {videoFiles.length > 0 && (
                    <div className={`mb-6 ${videoFiles.length > 0 && pdfFiles.length > 0 ? '' : 'max-w-5xl w-full'}`}>
                      <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                        <Play className="w-5 h-5 mr-2 text-indigo-600" />
                        Video ({videoFiles.length})
                      </h4>
                      <div className="space-y-4">
                        {videoFiles.map((videoFile, index) => (
                          <div key={index} className="border rounded-lg p-4 bg-gray-50">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              {getDisplayName(videoFile)}
                            </p>
                            <div className="border rounded-lg overflow-hidden bg-black">
                              <video
                                controls
                                className="w-full h-full"
                                src={getFileUrlWithToken(getFileName(videoFile))}
                              >
                                Trình duyệt của bạn không hỗ trợ video.
                              </video>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PDF Section */}
                  {pdfFiles.length > 0 && (
                    <div className={`mb-6 ${videoFiles.length > 0 && pdfFiles.length > 0 ? '' : 'max-w-5xl w-full'}`}>
                      <h4 className="text-md font-medium text-gray-800 mb-3 flex items-center">
                        <FileText className="w-5 h-5 mr-2 text-red-600" />
                        Tài liệu PDF ({pdfFiles.length})
                      </h4>
                      <div className="space-y-4">
                        {pdfFiles.map((pdfFile, index) => (
                          <div key={index} className="border rounded-lg p-4 bg-gray-50">
                            <p className="text-sm font-medium text-gray-700 mb-2">
                              {getDisplayName(pdfFile)}
                            </p>
                            <div className="border rounded-lg overflow-hidden bg-white" style={{ height: "600px" }}>
                              <iframe
                                src={getFileUrlWithToken(getFileName(pdfFile))}
                                className="w-full h-full"
                                title={`PDF Viewer - ${getDisplayName(pdfFile)}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Download All Section */}
                <div className="mt-6 pt-4 border-t">
                  <h4 className="text-md font-medium text-gray-800 mb-3">
                    Tải xuống tài liệu
                  </h4>
                  <div className="flex flex-wrap gap-3">
                    {allFiles.map((file, index) => (
                      <a
                        key={index}
                        href={getFileUrlWithToken(getFileName(file))}
                        download
                        className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {getDisplayName(file)}
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Quizzes Tab */}
        {activeTab === "quizzes" && material.quizzes && (
          <div className="p-6 space-y-4">
            {material.quizzes.map((quiz) => (
              <div
                key={quiz.quiz_id}
                className="border border-gray-200 rounded-lg overflow-hidden hover:border-indigo-300 hover:shadow-sm transition-all"
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold text-gray-900">
                          {quiz.title}
                        </h3>
                        {passedQuizIds.has(quiz.quiz_id) && (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            Đạt
                          </span>
                        )}
                      </div>
                      <p className="text-gray-600 mb-4">
                        {quiz.description || "Không có mô tả"}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <div className="flex items-center">
                          <svg
                            className="w-5 h-5 mr-2 text-blue-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Thời gian: {quiz.duration} phút
                        </div>
                        <div className="flex items-center">
                          <svg
                            className="w-5 h-5 mr-2 text-green-500"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          Điểm đạt: {quiz.passing_score}%
                        </div>
                      </div>
                    </div>

                    <div className="ml-4 flex flex-col gap-2">
                      <button
                        onClick={() =>
                          router.push(
                            `/dashboard/employee/training/quiz/${quiz.quiz_id}`
                          )
                        }
                        className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors font-medium flex items-center"
                      >
                        <Play className="w-5 h-5 mr-2" />
                        Bắt đầu làm bài
                      </button>
                      <button
                        onClick={() => toggleHistory(quiz.quiz_id)}
                        className="px-6 py-3 border border-indigo-300 text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors font-medium flex items-center justify-center"
                      >
                        <History className="w-5 h-5 mr-2" />
                        Lịch sử làm bài
                        {expandedHistory === quiz.quiz_id ? (
                          <ChevronUp className="w-4 h-4 ml-2" />
                        ) : (
                          <ChevronDown className="w-4 h-4 ml-2" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* History Section */}
                {expandedHistory === quiz.quiz_id && (
                  <div className="border-t border-gray-200 bg-gray-50 p-6">
                    <h4 className="text-base font-semibold text-gray-800 mb-4 flex items-center">
                      <History className="w-4 h-4 mr-2 text-indigo-500" />
                      Lịch sử làm bài
                    </h4>
                    {loadingHistory[quiz.quiz_id] ? (
                      <div className="flex justify-center py-6">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
                      </div>
                    ) : quizHistories[quiz.quiz_id]?.length > 0 ? (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="text-left text-gray-500 border-b border-gray-200">
                              <th className="pb-3 pr-4">Lần</th>
                              <th className="pb-3 pr-4">Điểm số</th>
                              <th className="pb-3 pr-4">Kết quả</th>
                              <th className="pb-3 pr-4">Thời gian làm</th>
                              <th className="pb-3">Ngày làm</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {quizHistories[quiz.quiz_id].map((attempt) => {
                              const mins = Math.floor(attempt.completion_time / 60);
                              const secs = attempt.completion_time % 60;
                              return (
                                <tr key={attempt.result_id} className="hover:bg-white transition-colors">
                                  <td className="py-3 pr-4 font-medium text-gray-700">
                                    #{attempt.attempt_number}
                                  </td>
                                  <td className="py-3 pr-4">
                                    <span className={`font-semibold ${attempt.pass_status ? 'text-green-600' : 'text-red-600'}`}>
                                      {attempt.score.toFixed(0)}%
                                    </span>
                                  </td>
                                  <td className="py-3 pr-4">
                                    {attempt.pass_status ? (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                        <CheckCircle className="w-3.5 h-3.5 mr-1" />
                                        Đạt
                                      </span>
                                    ) : (
                                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                        <XCircle className="w-3.5 h-3.5 mr-1" />
                                        Chưa đạt
                                      </span>
                                    )}
                                  </td>
                                  <td className="py-3 pr-4 text-gray-600">
                                    {mins > 0 ? `${mins} phút ` : ''}{secs} giây
                                  </td>
                                  <td className="py-3 text-gray-600">
                                    {new Date(attempt.completion_date).toLocaleDateString("vi-VN")}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    ) : (
                      <p className="text-center text-gray-500 py-6">
                        Bạn chưa làm bài kiểm tra này lần nào.
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
export default withAuth(TrainingMaterialDetailPage);