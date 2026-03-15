/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Search, BookOpen, Video, FileText, Play } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { trainingMaterialApi, TrainingMaterial } from "@/app/api/trainingMaterialApi";
import { showToast } from "@/app/utils/toast";
import { withAuth } from "@/app/middleware/withAuth";

function EmployeeTrainingPage() {
  const [materials, setMaterials] = useState<TrainingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchMaterials();
  }, []);

  const fetchMaterials = async () => {
    try {
      setLoading(true);
      const response = await trainingMaterialApi.getAll();
      
      if (!response || response.error) {
        console.error("API Error:", response?.message || "Unknown error");
        setMaterials([]);
        return;
      }
      
      // Chỉ hiển thị tài liệu active
      const activeMaterials = response.materials?.filter(
        (m: TrainingMaterial) => m.status === "active"
      ) || [];
      setMaterials(activeMaterials);
    } catch (error) {
      console.error("Error fetching materials:", error);
      showToast.error('Lỗi khi tải danh sách tài liệu');
      setMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredMaterials = materials.filter((material) =>
    material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    material.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
      <div className="bg-white p-6 rounded-lg shadow-sm">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Tìm kiếm tài liệu..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
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
                    className="bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200 overflow-hidden cursor-pointer border border-gray-200"
                    onClick={() =>
                      router.push(
                        `/dashboard/employee/training/${material.material_id}`
                      )
                    }
                  >
                    {/* Card Header */}
                    <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 p-6 text-white">
                      <div className="flex items-start justify-between">
                        <div className="text-4xl mb-2">
                          {material.type === "video" ? (
                            <Video className="w-10 h-10" />
                          ) : material.type === "document" ? (
                            <FileText className="w-10 h-10" />
                          ) : (
                            <BookOpen className="w-10 h-10" />
                          )}
                        </div>
                        <span className="px-3 py-1 bg-white text-gray-900 rounded-full text-xs font-medium">
                          {material.type === "video"
                            ? "Video"
                            : material.type === "document"
                            ? "Tài liệu"
                            : "Video & Tài liệu"}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold mb-2 line-clamp-2">
                        {material.title}
                      </h3>
                    </div>

                    {/* Card Body */}
                    <div className="p-6">
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {material.description || "Không có mô tả"}
                      </p>

                      {/* Tags */}
                      {material.tags && material.tags.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-4">
                          {material.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag.tag_id}
                              className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full"
                            >
                              {tag.name}
                            </span>
                          ))}
                          {material.tags.length > 3 && (
                            <span className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-full">
                              +{material.tags.length - 3}
                            </span>
                          )}
                        </div>
                      )}

                      {/* Quiz Badge */}
                      {material.quizzes && material.quizzes.length > 0 && (
                        <div className="flex items-center text-sm text-green-600 mb-4">
                          <FileText className="w-5 h-5 mr-2" />
                          {material.quizzes.length} bài kiểm tra
                        </div>
                      )}

                      {/* View Button */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                        <span className="text-xs text-gray-500">
                          Tạo bởi: {material.creator?.full_name || "Admin"}
                        </span>
                        <button className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors text-sm font-medium flex items-center">
                          <Play className="w-4 h-4 mr-1" />
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
