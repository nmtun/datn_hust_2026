/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { DollarSign, Gift, Calendar, User, FileText, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { compensationApi, Compensation } from "@/app/api/compensationApi";
import { showToast } from "@/app/utils/toast";
import Modal from "@/app/components/Modal";
import { withAuth } from "@/app/middleware/withAuth";

function MyCompensationPage() {
  const [compensations, setCompensations] = useState<Compensation[]>([]);
  const [loading, setLoading] = useState(true);
  const [aiView, setAiView] = useState<{ title: string; comment: string } | null>(null);

  useEffect(() => {
    fetchCompensations();
  }, []);

  const fetchCompensations = async () => {
    try {
      setLoading(true);
      const result = await compensationApi.getMyCompensation();
      if (result.error) {
        showToast.error(result.message || "Không thể tải dữ liệu lương thưởng");
        return;
      }
      setCompensations(result.records || []);
    } catch (error: any) {
      showToast.error("Không thể tải dữ liệu lương thưởng");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    if (amount == null) return "—";
    return new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(amount);
  };

  const getSalaryChange = (index: number) => {
    if (index >= compensations.length - 1) return null;
    const current = compensations[index].salary;
    const prev = compensations[index + 1].salary;
    if (current == null || prev == null) return null;
    return current - prev;
  };

  const latestComp = compensations[0];

  const openAiView = (comp: Compensation) => {
    if (!comp.comment) return;
    const dateLabel = comp.effective_date
      ? new Date(comp.effective_date).toLocaleDateString("vi-VN")
      : "—";
    setAiView({ title: `Nhận xét AI (${dateLabel})`, comment: comp.comment });
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
        <h1 className="text-2xl font-bold text-gray-900">Lịch sử lương thưởng</h1>
        <p className="text-sm text-gray-500 mt-1">Xem thông tin lương và thưởng của bạn theo từng thời kỳ</p>
      </div>

      {latestComp && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <div className="bg-white shadow rounded-lg p-5 flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Lương hiện tại</p>
              <p className="text-xl font-bold text-gray-900">{formatCurrency(latestComp.salary)}</p>
              <p className="text-xs text-gray-400 mt-0.5">
                Hiệu lực từ {latestComp.effective_date ? new Date(latestComp.effective_date).toLocaleDateString("vi-VN") : "—"}
              </p>
            </div>
          </div>
          <div className="bg-white shadow rounded-lg p-5 flex items-center space-x-4">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Gift className="h-6 w-6 text-amber-600" />
            </div>
            <div>
              <p className="text-xs text-gray-500">Thưởng gần nhất</p>
              <p className="text-xl font-bold text-gray-900">
                {latestComp.bonus ? formatCurrency(latestComp.bonus) : "Không có"}
              </p>
              {latestComp.reason && (
                <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[200px]">{latestComp.reason}</p>
              )}
              {latestComp.comment && (
                <p className="text-xs text-emerald-700 mt-0.5 truncate max-w-[200px]">AI: {latestComp.comment}</p>
              )}
              {latestComp.comment && (
                <button
                  type="button"
                  onClick={() => openAiView(latestComp)}
                  className="mt-1 text-xs text-emerald-700 hover:text-emerald-800 underline"
                >
                  Xem nhận xét AI
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {compensations.length === 0 ? (
        <div className="bg-white shadow rounded-lg py-16 text-center">
          <DollarSign className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-3 text-sm font-medium text-gray-900">Chưa có dữ liệu lương thưởng</h3>
          <p className="mt-1 text-sm text-gray-500">Thông tin lương thưởng sẽ được HR cập nhật tại đây.</p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100">
            <h3 className="text-sm font-semibold text-gray-700">Lịch sử chi tiết ({compensations.length} bản ghi)</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Ngày hiệu lực
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lương
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Thưởng
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lý do
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Người duyệt
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {compensations.map((comp, index) => {
                  const salaryChange = getSalaryChange(index);
                  return (
                    <tr key={comp.comp_id} className={`hover:bg-gray-50 ${index === 0 ? "bg-indigo-50" : ""}`}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {comp.effective_date
                                ? new Date(comp.effective_date).toLocaleDateString("vi-VN")
                                : "—"}
                            </p>
                            {index === 0 && (
                              <span className="text-xs text-indigo-600 font-medium">Hiện tại</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center space-x-2">
                          <p className="text-sm font-semibold text-gray-900">{formatCurrency(comp.salary)}</p>
                          {salaryChange != null && (
                            <span
                              className={`flex items-center text-xs font-medium ${
                                salaryChange > 0
                                  ? "text-green-600"
                                  : salaryChange < 0
                                  ? "text-red-600"
                                  : "text-gray-400"
                              }`}
                            >
                              {salaryChange > 0 ? (
                                <>
                                  <TrendingUp className="w-3 h-3 mr-0.5" />+{formatCurrency(salaryChange)}
                                </>
                              ) : salaryChange < 0 ? (
                                <>
                                  <TrendingDown className="w-3 h-3 mr-0.5" />{formatCurrency(salaryChange)}
                                </>
                              ) : (
                                <>
                                  <Minus className="w-3 h-3 mr-0.5" />Không đổi
                                </>
                              )}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {comp.bonus ? (
                          <div className="flex items-center space-x-1">
                            <Gift className="w-4 h-4 text-amber-500" />
                            <span className="text-sm font-medium text-amber-700">{formatCurrency(comp.bonus)}</span>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {comp.reason || comp.comment ? (
                          <div className="flex items-start space-x-1 max-w-[220px]">
                            <FileText className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                            <div className="min-w-0">
                              {comp.reason && (
                                <p className="text-sm text-gray-600 truncate">{comp.reason}</p>
                              )}
                              {comp.comment && (
                                <p className="text-xs text-emerald-700 truncate">AI: {comp.comment}</p>
                              )}
                              {comp.comment && (
                                <button
                                  type="button"
                                  onClick={() => openAiView(comp)}
                                  className="mt-1 text-xs text-emerald-700 hover:text-emerald-800 underline"
                                >
                                  Xem nhận xét AI
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {comp.approver ? (
                          <div className="flex items-center space-x-1">
                            <User className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-sm text-gray-700">{comp.approver.full_name}</p>
                              {comp.approved_at && (
                                <p className="text-xs text-gray-400">
                                  {new Date(comp.approved_at).toLocaleDateString("vi-VN")}
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Modal
        isOpen={!!aiView}
        onClose={() => setAiView(null)}
        title={aiView?.title || "Nhận xét AI"}
      >
        <p className="text-sm text-gray-700 whitespace-pre-wrap">{aiView?.comment}</p>
      </Modal>
    </div>
  );
}

export default withAuth(MyCompensationPage);
