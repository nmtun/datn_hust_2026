/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Star, TrendingUp, Target, MessageSquare, Calendar, User, ChevronDown, ChevronUp } from "lucide-react";
import { performanceApi, Performance } from "@/app/api/performanceApi";
import { showToast } from "@/app/utils/toast";
import { withAuth } from "@/app/middleware/withAuth";

function MyPerformancePage() {
  const [performances, setPerformances] = useState<Performance[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  useEffect(() => {
    fetchPerformances();
  }, []);

  const fetchPerformances = async () => {
    try {
      setLoading(true);
      const result = await performanceApi.getMyPerformance();
      if (result.error) {
        showToast.error(result.message || "Không thể tải dữ liệu đánh giá");
        return;
      }
      setPerformances(result.records || []);
    } catch (error: any) {
      showToast.error("Không thể tải dữ liệu đánh giá");
    } finally {
      setLoading(false);
    }
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4.5) return "text-emerald-600";
    if (rating >= 3.5) return "text-blue-600";
    if (rating >= 2.5) return "text-yellow-600";
    return "text-red-600";
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return "Xuất sắc";
    if (rating >= 3.5) return "Tốt";
    if (rating >= 2.5) return "Trung bình";
    return "Yếu";
  };

  const getRatingBg = (rating: number) => {
    if (rating >= 4.5) return "bg-emerald-50 border-emerald-200";
    if (rating >= 3.5) return "bg-blue-50 border-blue-200";
    if (rating >= 2.5) return "bg-yellow-50 border-yellow-200";
    return "bg-red-50 border-red-200";
  };

  const getPeriodStatusColor = (status: string) => {
    switch (status) {
      case "in_progress": return "bg-blue-100 text-blue-800";
      case "completed": return "bg-green-100 text-green-800";
      case "planned": return "bg-gray-100 text-gray-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  const getPeriodStatusLabel = (status: string) => {
    switch (status) {
      case "in_progress": return "Đang thực hiện";
      case "completed": return "Hoàn thành";
      case "planned": return "Kế hoạch";
      default: return status;
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }).map((_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
      />
    ));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kết quả đánh giá của tôi</h1>
        <p className="text-sm text-gray-500 mt-1">Xem lịch sử đánh giá hiệu suất công việc của bạn</p>
      </div>

      {performances.length === 0 ? (
        <div className="bg-white shadow rounded-lg py-16 text-center">
          <TrendingUp className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-3 text-sm font-medium text-gray-900">Chưa có đánh giá nào</h3>
          <p className="mt-1 text-sm text-gray-500">Các kết quả đánh giá từ quản lý sẽ hiển thị tại đây.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {performances.map((perf) => (
            <div key={perf.perf_id} className="bg-white shadow rounded-lg overflow-hidden">
              {/* Card Header */}
              <div
                className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedId(expandedId === perf.perf_id ? null : perf.perf_id)}
              >
                <div className="flex items-center space-x-4">
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {perf.Period?.period_name || `Đánh giá #${perf.perf_id}`}
                    </p>
                    {perf.Period && (
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(perf.Period.start_date).toLocaleDateString("vi-VN")} -{" "}
                        {new Date(perf.Period.end_date).toLocaleDateString("vi-VN")}
                      </p>
                    )}
                  </div>
                  {perf.Period && (
                    <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getPeriodStatusColor(perf.Period.status)}`}>
                      {getPeriodStatusLabel(perf.Period.status)}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  {perf.rating != null && (
                    <div className={`flex items-center space-x-2 px-3 py-1.5 rounded-lg border ${getRatingBg(perf.rating)}`}>
                      <div className="flex">{renderStars(perf.rating)}</div>
                      <span className={`text-sm font-bold ${getRatingColor(perf.rating)}`}>
                        {perf.rating.toFixed(1)}
                      </span>
                      <span className={`text-xs ${getRatingColor(perf.rating)}`}>
                        · {getRatingLabel(perf.rating)}
                      </span>
                    </div>
                  )}
                  {expandedId === perf.perf_id ? (
                    <ChevronUp className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  )}
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === perf.perf_id && (
                <div className="border-t border-gray-100 px-6 py-5 space-y-5">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {/* KPI Goals */}
                    {perf.kpi_goals && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <Target className="w-4 h-4 text-indigo-500" />
                          <h4 className="text-sm font-medium text-gray-700">Mục tiêu KPI</h4>
                        </div>
                        <div className="bg-gray-50 rounded-md p-3">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{perf.kpi_goals}</p>
                        </div>
                      </div>
                    )}

                    {/* Achievement */}
                    {perf.achievement && (
                      <div>
                        <div className="flex items-center space-x-2 mb-2">
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <h4 className="text-sm font-medium text-gray-700">Kết quả đạt được</h4>
                        </div>
                        <div className="bg-gray-50 rounded-md p-3">
                          <p className="text-sm text-gray-700 whitespace-pre-wrap">{perf.achievement}</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Feedback */}
                  {perf.feedback && (
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <MessageSquare className="w-4 h-4 text-blue-500" />
                        <h4 className="text-sm font-medium text-gray-700">Nhận xét từ quản lý</h4>
                      </div>
                      <div className="bg-blue-50 border border-blue-100 rounded-md p-3">
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{perf.feedback}</p>
                      </div>
                    </div>
                  )}

                  {/* Meta info */}
                  <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-gray-100 text-xs text-gray-500">
                    {perf.review_date && (
                      <span className="flex items-center space-x-1">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Ngày đánh giá: {new Date(perf.review_date).toLocaleDateString("vi-VN")}</span>
                      </span>
                    )}
                    {perf.reviewer && (
                      <span className="flex items-center space-x-1">
                        <User className="w-3.5 h-3.5" />
                        <span>Người đánh giá: {perf.reviewer.full_name}</span>
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default withAuth(MyPerformancePage);
