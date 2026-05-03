/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { Plus, Eye, Edit2, DollarSign, ChevronDown, X, Save, Search, TrendingUp } from "lucide-react";
import { compensationApi, Compensation, CompensationRecommendation } from "@/app/api/compensationApi";
import { employeeApi, EmployeeProfile } from "@/app/api/employeeApi";
import { showToast } from "@/app/utils/toast";
import Modal from "@/app/components/Modal";
import { withAuth } from "@/app/middleware/withAuth";

const emptyForm = { user_id: "", salary: "", bonus: "", effective_date: "", reason: "" };

function CompensationPage() {
  const [records, setRecords] = useState<Compensation[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewRecord, setViewRecord] = useState<Compensation | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Compensation | null>(null);
  const [form, setForm] = useState<any>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({});
  const [recommendModalOpen, setRecommendModalOpen] = useState(false);
  const [recommendYear, setRecommendYear] = useState<number>(new Date().getFullYear());
  const [recommendations, setRecommendations] = useState<CompensationRecommendation[]>([]);
  const [recommendLoading, setRecommendLoading] = useState(false);
  const [recommendError, setRecommendError] = useState<string | null>(null);
  const [recommendSaving, setRecommendSaving] = useState(false);

  const yearOptions = useMemo(() => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, index) => currentYear - index);
  }, []);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cRes, eRes] = await Promise.all([compensationApi.getAll(), employeeApi.getAll()]);
      if (!cRes.error) setRecords(cRes.records || []);
      if (!eRes.error) setEmployees(eRes.employees || []);
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  };

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setModalOpen(true); };
  const openEdit = (r: Compensation) => {
    setEditing(r);
    setForm({
      user_id: r.user_id || "",
      salary: r.salary ?? "",
      bonus: r.bonus ?? "",
      effective_date: r.effective_date?.slice(0, 10) || "",
      reason: r.reason || "",
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.user_id || !form.effective_date) {
      showToast.error("Vui lòng chọn nhân viên và ngày hiệu lực");
      return;
    }
    try {
      setSaving(true);
      const data: any = {
        user_id: Number(form.user_id),
        effective_date: form.effective_date,
      };
      if (form.salary !== "") data.salary = Number(form.salary);
      if (form.bonus !== "") data.bonus = Number(form.bonus);
      if (form.reason) data.reason = form.reason;

      const result = editing
        ? await compensationApi.update(editing.comp_id, data)
        : await compensationApi.create(data);
      if (result.error) {
        showToast.error(result.message || "Thao tác thất bại");
        return;
      }
      showToast.success(editing ? "Cập nhật lương thưởng thành công" : "Tạo bản ghi lương thưởng thành công");
      setModalOpen(false);
      fetchAll();
    } catch {
      showToast.error("Thao tác thất bại");
    } finally {
      setSaving(false);
    }
  };

  const fmtCurrency = (v?: number) =>
    v != null ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v) : "—";

  const employeeNameById = useMemo(
    () => new Map(employees.map((employee) => [employee.user_id, employee.full_name])),
    [employees]
  );

  const parseDateValue = (value?: string) => (value ? new Date(value).getTime() : 0);

  const groupedRecords = useMemo(() => {
    const map = new Map<
      string,
      { key: string; userId?: number; name: string; records: Compensation[] }
    >();
    const order: string[] = [];

    records.forEach((record) => {
      const userId = record.user_id ?? record.employee?.user_id;
      const key = userId != null ? `user-${userId}` : `comp-${record.comp_id}`;
      const name =
        record.employee?.full_name
        || (userId != null ? employeeNameById.get(userId) : undefined)
        || `User #${userId ?? record.user_id ?? "?"}`;

      if (!map.has(key)) {
        map.set(key, { key, userId, name, records: [] });
        order.push(key);
      }
      map.get(key)!.records.push(record);
    });

    return order.map((key) => {
      const group = map.get(key)!;
      group.records.sort((a, b) => {
        const diff = parseDateValue(b.effective_date) - parseDateValue(a.effective_date);
        if (diff !== 0) return diff;
        return (b.comp_id ?? 0) - (a.comp_id ?? 0);
      });
      return group;
    });
  }, [records, employeeNameById]);

  const filteredGroups = useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    if (!query) return groupedRecords;
    return groupedRecords.filter((group) => group.name.toLowerCase().includes(query));
  }, [groupedRecords, searchTerm]);

  const toggleGroup = (key: string) => {
    setExpandedGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const openRecommendationModal = () => {
    const currentYear = new Date().getFullYear();
    setRecommendYear(currentYear);
    setRecommendations([]);
    setRecommendError(null);
    setRecommendModalOpen(true);
  };

  const handleGenerateRecommendations = async () => {
    try {
      setRecommendLoading(true);
      setRecommendError(null);
      const result = await compensationApi.getRecommendations(recommendYear);
      if (result.error) {
        const message = result.message || "Không thể tạo đề xuất lương thưởng";
        setRecommendError(message);
        showToast.error(message);
        return;
      }
      setRecommendations(result.recommendations || []);
      if ((result.recommendations || []).length === 0) {
        showToast.error("Không có dữ liệu đề xuất cho năm đã chọn");
      }
    } catch {
      const message = "Không thể tạo đề xuất lương thưởng";
      setRecommendError(message);
      showToast.error(message);
    } finally {
      setRecommendLoading(false);
    }
  };

  const handleSaveRecommendations = async () => {
    if (recommendations.length === 0) {
      showToast.error("Chua co du lieu de luu");
      return;
    }

    try {
      setRecommendSaving(true);
      const result = await compensationApi.saveRecommendations({
        year: recommendYear,
        recommendations
      });

      if (result.error) {
        showToast.error(result.message || "Khong the luu de xuat");
        return;
      }

      showToast.success("Da luu de xuat va gui thong bao");
      setRecommendModalOpen(false);
      fetchAll();
    } catch {
      showToast.error("Khong the luu de xuat");
    } finally {
      setRecommendSaving(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý lương thưởng</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={openRecommendationModal}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700"
          >
            <TrendingUp className="w-4 h-4 mr-2" />Đề xuất lương thưởng
          </button>
          <button
            onClick={openCreate}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
          >
            <Plus className="w-4 h-4 mr-2" />Thêm bản ghi
          </button>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder="Tìm theo tên nhân viên"
              className="w-full border border-gray-300 rounded-md pl-9 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : filteredGroups.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {[
                  "Nhân viên",
                  "Lương",
                  "Thưởng",
                  "Ngày hiệu lực",
                  "Lý do",
                  "Thao tác",
                ].map((h) => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredGroups.map((group) => {
                const latest = group.records[0];
                const hasMultiple = group.records.length > 1;
                const isExpanded = !!expandedGroups[group.key];

                return (
                  <Fragment key={group.key}>
                    <tr className="hover:bg-gray-50">
                      <td className="px-5 py-3">
                        <div className="flex items-center space-x-2">
                          {hasMultiple ? (
                            <button
                              type="button"
                              onClick={() => toggleGroup(group.key)}
                              className="p-1 rounded hover:bg-gray-100 text-gray-500"
                              aria-label={isExpanded ? "Thu gọn" : "Mở rộng"}
                            >
                              <ChevronDown
                                className={`w-4 h-4 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                              />
                            </button>
                          ) : (
                            <span className="w-6" />
                          )}
                          <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                            <span className="text-xs font-semibold text-indigo-600">
                              {group.name.charAt(0) || "?"}
                            </span>
                          </div>
                          <div>
                            <p className="text-sm text-gray-900">{group.name}</p>
                            {hasMultiple && (
                              <p className="text-xs text-gray-400">{group.records.length} bản ghi</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3 text-sm font-medium text-gray-900">
                        {fmtCurrency(latest.salary)}
                      </td>
                      <td className="px-5 py-3 text-sm text-amber-700">
                        {latest.bonus ? fmtCurrency(latest.bonus) : <span className="text-gray-400">—</span>}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-700">
                        {latest.effective_date ? new Date(latest.effective_date).toLocaleDateString("vi-VN") : "—"}
                      </td>
                      <td className="px-5 py-3 text-sm text-gray-600 max-w-[200px]">
                        {latest.reason || latest.comment ? (
                          <div className="min-w-0">
                            {latest.reason && (
                              <p className="text-sm text-gray-600 truncate">{latest.reason}</p>
                            )}
                            {latest.comment && (
                              <p className="text-xs text-emerald-700 truncate">AI: {latest.comment}</p>
                            )}
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setViewRecord(latest)}
                            className="text-gray-400 hover:text-gray-600"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEdit(latest)}
                            className="text-blue-400 hover:text-blue-600"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded &&
                      group.records.slice(1).map((record) => (
                        <tr key={record.comp_id} className="bg-gray-50/60 hover:bg-gray-100">
                          <td className="px-5 py-3">
                            <div className="flex items-center space-x-2 pl-12">
                              <div className="h-7 w-7 rounded-full bg-gray-200 flex items-center justify-center">
                                <span className="text-xs font-semibold text-gray-600">
                                  {group.name.charAt(0) || "?"}
                                </span>
                              </div>
                              <div>
                                <p className="text-sm text-gray-700">{group.name}</p>
                                <p className="text-xs text-gray-400">Bản ghi trước</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm font-medium text-gray-900">
                            {fmtCurrency(record.salary)}
                          </td>
                          <td className="px-5 py-3 text-sm text-amber-700">
                            {record.bonus ? fmtCurrency(record.bonus) : <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-700">
                            {record.effective_date ? new Date(record.effective_date).toLocaleDateString("vi-VN") : "—"}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600 max-w-[200px]">
                            {record.reason || record.comment ? (
                              <div className="min-w-0">
                                {record.reason && (
                                  <p className="text-sm text-gray-600 truncate">{record.reason}</p>
                                )}
                                {record.comment && (
                                  <p className="text-xs text-emerald-700 truncate">AI: {record.comment}</p>
                                )}
                              </div>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3">
                            <div className="flex space-x-2">
                              <button
                                onClick={() => setViewRecord(record)}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openEdit(record)}
                                className="text-blue-400 hover:text-blue-600"
                              >
                                <Edit2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-12">
            <DollarSign className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">
              {records.length === 0
                ? "Chưa có bản ghi lương thưởng nào"
                : "Không tìm thấy nhân viên phù hợp"}
            </p>
          </div>
        )}
      </div>

      <Modal
        isOpen={!!viewRecord}
        onClose={() => setViewRecord(null)}
        title="Chi tiết lương thưởng"
        showEditButton
        onEdit={() => {
          openEdit(viewRecord!);
          setViewRecord(null);
        }}
      >
        {viewRecord && (
          <div className="p-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Nhân viên", viewRecord.employee?.full_name || `User #${viewRecord.user_id}`],
                [
                  "Ngày hiệu lực",
                  viewRecord.effective_date
                    ? new Date(viewRecord.effective_date).toLocaleDateString("vi-VN")
                    : "—",
                ],
                ["Lương", fmtCurrency(viewRecord.salary)],
                ["Thưởng", viewRecord.bonus ? fmtCurrency(viewRecord.bonus) : "Không có"],
                ["Người duyệt", viewRecord.approver?.full_name || "—"],
                [
                  "Ngày duyệt",
                  viewRecord.approved_at
                    ? new Date(viewRecord.approved_at).toLocaleDateString("vi-VN")
                    : "—",
                ],
              ].map(([l, v]) => (
                <div key={l}>
                  <p className="text-xs text-gray-500">{l}</p>
                  <p className="text-sm font-medium mt-0.5">{v}</p>
                </div>
              ))}
              {viewRecord.reason && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Lý do</p>
                  <p className="text-sm mt-0.5">{viewRecord.reason}</p>
                </div>
              )}
              {viewRecord.comment && (
                <div className="col-span-2">
                  <p className="text-xs text-gray-500">Nhận xét AI</p>
                  <p className="text-sm mt-0.5">{viewRecord.comment}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

      <Modal
        isOpen={recommendModalOpen}
        onClose={() => setRecommendModalOpen(false)}
        title="Đề xuất lương thưởng"
      >
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="sm:w-48">
              <label className="block text-xs font-medium text-gray-600 mb-1">Chọn năm</label>
              <select
                value={recommendYear}
                onChange={(event) => setRecommendYear(Number(event.target.value))}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {yearOptions.map((year) => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGenerateRecommendations}
              disabled={recommendLoading}
              className="inline-flex items-center justify-center px-4 py-2 text-sm bg-emerald-600 text-white rounded-md hover:bg-emerald-700 disabled:opacity-50"
            >
              {recommendLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <span>Tính toán</span>
              )}
            </button>
          </div>

          {recommendError && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-md px-3 py-2">
              {recommendError}
            </div>
          )}

          {recommendLoading ? (
            <div className="flex justify-center py-10">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-emerald-600" />
            </div>
          ) : recommendations.length > 0 ? (
            <div className="overflow-x-auto border border-gray-100 rounded-lg">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Nhân viên",
                      "Điểm TB",
                      "Lương hiện tại",
                      "Tăng lương",
                      "Lương đề xuất",
                      "Thưởng",
                      "Nhận xét AI"
                    ].map((heading) => (
                      <th
                        key={heading}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase"
                      >
                        {heading}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recommendations.map((item) => {
                    const avgLabel = item.rating_count
                      ? `${item.average_rating.toFixed(2)} (${item.rating_count})`
                      : "—";
                    const increaseLabel = item.salary_increase_percent
                      ? `+${item.salary_increase_percent}%`
                      : "0%";
                    const bonusLabel = item.bonus_months
                      ? `${item.bonus_months} tháng`
                      : "0 tháng";

                    return (
                      <tr key={item.user_id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">
                          <div className="font-medium">{item.full_name}</div>
                          <div className="text-xs text-gray-400">{item.company_email || "—"}</div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{avgLabel}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{fmtCurrency(item.current_salary ?? undefined)}</td>
                        <td className="px-4 py-3 text-sm font-medium text-emerald-700">{increaseLabel}</td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {fmtCurrency(item.recommended_salary ?? undefined)}
                        </td>
                        <td className="px-4 py-3 text-sm text-amber-700">
                          <div>{bonusLabel}</div>
                          <div className="text-xs text-gray-400">
                            {fmtCurrency(item.recommended_bonus ?? undefined)}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600 max-w-[320px]">
                          {item.ai_comment || "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-sm text-gray-500 bg-gray-50 border border-gray-100 rounded-md px-4 py-6 text-center">
              Chưa có dữ liệu đề xuất. Hãy chọn năm và bấm "Tính toán".
            </div>
          )}

          <div className="flex justify-end pt-2">
            <button
              onClick={handleSaveRecommendations}
              disabled={recommendSaving || recommendLoading || recommendations.length === 0}
              className="inline-flex items-center px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {recommendSaving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
              ) : (
                <span>Lưu kết quả</span>
              )}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? "Cập nhật lương thưởng" : "Thêm bản ghi lương thưởng"}
      >
        <div className="p-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nhân viên *</label>
              <div className="relative">
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <select
                  value={form.user_id}
                  onChange={(e) => setForm({ ...form, user_id: e.target.value })}
                  disabled={!!editing}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none disabled:bg-gray-100"
                >
                  <option value="">-- Chọn nhân viên --</option>
                  {employees.map((e) => (
                    <option key={e.user_id} value={e.user_id}>
                      {e.full_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ngày hiệu lực *</label>
              <input
                type="date"
                value={form.effective_date}
                onChange={(e) => setForm({ ...form, effective_date: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Lương (VND)</label>
              <input
                type="number"
                value={form.salary}
                onChange={(e) => setForm({ ...form, salary: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Thưởng (VND)</label>
              <input
                type="number"
                value={form.bonus}
                onChange={(e) => setForm({ ...form, bonus: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lý do</label>
            <textarea
              value={form.reason}
              onChange={(e) => setForm({ ...form, reason: e.target.value })}
              rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
            >
              <X className="w-4 h-4 inline mr-1" />Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-1" />
              )}
              Lưu
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default withAuth(CompensationPage);