/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Search, BookOpen, Video, FileText, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";
import { trainingMaterialApi, TrainingMaterial } from "@/app/api/trainingMaterialApi";
import { showToast } from "@/app/utils/toast";
import { withAuth } from "@/app/middleware/withAuth";
import { quizResultApi, QuizResult } from "@/app/api/quizApi";

function EmployeeTrainingPage() {
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [quizResults, setQuizResults] = useState<QuizResult[]>([]);
  const router = useRouter();

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const [materialsResponse, quizResultsResponse] = await Promise.allSettled([
        trainingMaterialApi.getAll(),
        quizResultApi.getMyResults(),
      ]);

      if (materialsResponse.status !== "fulfilled" || !materialsResponse.value || materialsResponse.value.error) {
        const message =
          materialsResponse.status === "fulfilled"
            ? materialsResponse.value?.message || "Unknown error"
            : materialsResponse.reason;
        console.error("API Error:", message);
        setMaterials([]);
        return;
      }

      // Chỉ hiển thị tài liệu active
      const activeMaterials = materialsResponse.value.materials?.filter(
        (m: TrainingMaterial) => m.status === "active"
      ) || [];
      setMaterials(activeMaterials);

      if (
        quizResultsResponse.status === "fulfilled" &&
        !quizResultsResponse.value?.error
      ) {
        setQuizResults(quizResultsResponse.value.results || []);
      } else {
        setQuizResults([]);
      }
    } catch (error) {
      console.error("Error fetching materials:", error);
      showToast.error('Lỗi khi tải danh sách tài liệu');
      setMaterials([]);
      setQuizResults([]);
    } finally {
      setLoading(false);
    }
  };

  const passedQuizIds = useMemo(
    () => new Set(quizResults.filter((result) => result.pass_status).map((result) => result.quiz_id)),
    [quizResults]
  );

  const isMaterialCompleted = (material: TrainingMaterial) => {
    const quizzes = material.quizzes || [];
    if (quizzes.length === 0) return false;
    return quizzes.every((quiz) => passedQuizIds.has(quiz.quiz_id));
  };

  const filteredMaterials = useMemo(() => {
    const normalizedSearchTerm = searchTerm.toLowerCase().trim();

    return materials
      .filter((material) => {
        if (!normalizedSearchTerm) return true;
        return (
          material.title.toLowerCase().includes(normalizedSearchTerm) ||
          material.description?.toLowerCase().includes(normalizedSearchTerm)
        );
      })
      .sort((a, b) => {
        const aCompleted = isMaterialCompleted(a);
        const bCompleted = isMaterialCompleted(b);

        if (aCompleted === bCompleted) return 0;
        return aCompleted ? 1 : -1;
      });
  }, [materials, searchTerm, passedQuizIds]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Tài Liệu Đào Tạo
          </h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="mb-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
        </div>
      ) : (
        <>
          {/* Materials Grid */}
          {filteredMaterials.length === 0 ? (
            <div className="bg-white p-12 rounded-lg shadow-sm text-center">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500 text-lg">
                {searchTerm
                  ? "Không tìm thấy tài liệu phù hợp"
                  : "Chưa có tài liệu đào tạo nào"}
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredMaterials.map((material) => (
                <div
                  key={material.material_id}
                  // THÊM flex flex-col h-full ĐỂ CARD LUÔN ĐẦY CHIỀU CAO CỦA GRID ROW
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer border border-gray-200 flex flex-col h-full"
                  onClick={() =>
                    router.push(
                      `/dashboard/employee/training/${material.material_id}`
                    )
                  }
                >
                  {/* Card Header (Thiết kế lại giống ảnh) */}
                  <div className="bg-indigo-600 p-6 text-white flex flex-col justify-between min-h-[140px]">
                    <div className="flex items-start justify-between">
                      <div className="mb-2">
                        {material.type === "video" ? (
                          <Video className="w-8 h-8" />
                        ) : material.type === "document" ? (
                          <FileText className="w-8 h-8" />
                        ) : (
                          <BookOpen className="w-8 h-8" />
                        )}
                      </div>
                      <span className="px-3 py-1 bg-white text-gray-900 rounded-full text-xs font-medium shrink-0 ml-2">
                        {material.type === "video"
                          ? "Video"
                          : material.type === "document"
                            ? "Tài liệu"
                            : "Video & Tài liệu"}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold line-clamp-2 mt-4">
                      {material.title}
                    </h3>
                  </div>

                  {/* Card Body */}
                  {/* THÊM flex flex-col flex-1 ĐỂ VÙNG NÀY CHIẾM TOÀN BỘ KHÔNG GIAN CÒN LẠI */}
                  <div className="p-6 flex flex-col flex-1">
                    
                    {/* Phần nội dung bên trên (Mô tả, tags, quiz) */}
                    <div className="flex-1">
                      {isMaterialCompleted(material) && (
                        <div className="inline-flex items-center px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs font-semibold mb-3">
                          Đã hoàn thành
                        </div>
                      )}

                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {material.description || "Không có mô tả"}
                      </p>

                      {/* Tags */}
                      {material.tags && material.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {material.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.tag_id}
                              className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              {tag.name}
                            </span>
                          ))}
                          {material.tags.length > 3 && (
                            <span className="px-2.5 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              +{material.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Quiz Badge */}
                      {material.quizzes && material.quizzes.length > 0 && (
                        <div className="flex items-center text-sm font-medium text-green-600 mb-4">
                          <FileText className="w-4 h-4 mr-1.5" />
                          {material.quizzes.length} bài kiểm tra
                        </div>
                      )}
                    </div>

                    {/* View Button Footer */}
                    {/* THÊM mt-auto ĐỂ LUÔN ĐẨY FOOTER XUỐNG DƯỚI CÙNG CỦA CARD */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-100 mt-auto">
                      <span className="text-xs text-gray-500">
                        Tạo bởi: {material.creator?.full_name || "Admin"}
                      </span>
                      <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center">
                        <Play className="w-4 h-4 mr-1" fill="currentColor" />
                        Xem chi tiết
                      </button>
                    </div>

                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default withAuth(EmployeeTrainingPage);