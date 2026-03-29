/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { Plus, Eye, Edit2, Star, X, Save } from "lucide-react";
import { performanceApi, Performance } from "@/app/api/performanceApi";
import { performancePeriodApi, PerformancePeriod } from "@/app/api/performancePeriodApi";
import { employeeApi, EmployeeProfile } from "@/app/api/employeeApi";
import { showToast } from "@/app/utils/toast";
import Modal from "@/app/components/Modal";
import { withAuth } from "@/app/middleware/withAuth";

const BLANK_FORM = { user_id: "" as any, period_id: "" as any, kpi_goals: "", achievement: "", rating: "" as any, feedback: "", review_date: "" };

interface FormModalProps {
  title: string;
  onClose: () => void;
  initialForm?: any;
  employees: EmployeeProfile[];
  periods: PerformancePeriod[];
  isEdit: boolean;
  saving: boolean;
  onSave: (data: any) => void;
}

function FormModal({ title, onClose, initialForm, employees, periods, isEdit, saving, onSave }: FormModalProps) {
  const [form, setForm] = useState<any>(initialForm ?? { ...BLANK_FORM });

  return (
    <Modal isOpen title={title} onClose={onClose}>
      <div className="p-6 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Nhân viên *</label>
            <select value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" disabled={isEdit}>
              <option value="">— Chọn nhân viên —</option>
              {employees.map(e => <option key={e.user_id} value={e.user_id}>{e.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Kỳ đánh giá *</label>
            <select value={form.period_id} onChange={e => setForm({ ...form, period_id: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" disabled={isEdit}>
              <option value="">— Chọn kỳ —</option>
              {periods.map(p => <option key={p.period_id} value={p.period_id}>{p.period_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Đánh giá (1–5)</label>
            <input type="number" min="1" max="5" step="0.5" value={form.rating} onChange={e => setForm({ ...form, rating: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Ngày đánh giá</label>
            <input type="date" value={form.review_date} onChange={e => setForm({ ...form, review_date: e.target.value })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
        </div>
        {[{ label: "Mục tiêu KPI", key: "kpi_goals" }, { label: "Kết quả đạt được", key: "achievement" }, { label: "Nhận xét", key: "feedback" }].map(({ label, key }) => (
          <div key={key}>
            <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
            <textarea value={form[key]} onChange={e => setForm({ ...form, [key]: e.target.value })} rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
        ))}
        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"><X className="w-4 h-4 inline mr-1" />Hủy</button>
          <button onClick={() => onSave(form)} disabled={saving}
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
            {saving ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-4 h-4" />}
            {isEdit ? "Cập nhật" : "Tạo mới"}
          </button>
        </div>
      </div>
    </Modal>
  );
}

function PerformancePage() {
  const [records, setRecords] = useState<Performance[]>([]);
  const [periods, setPeriods] = useState<PerformancePeriod[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewRecord, setViewRecord] = useState<Performance | null>(null);
  const [createModal, setCreateModal] = useState(false);
  const [editRecord, setEditRecord] = useState<Performance | null>(null);
  const [saving, setSaving] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState("");
  const inProgressPeriods = periods.filter(p => p.status === "in_progress");

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [rRes, pRes, eRes] = await Promise.all([
        performanceApi.getAll(),
        performancePeriodApi.getAll(),
        employeeApi.getAll(),
      ]);
      if (!rRes.error) setRecords(rRes.records || []);
      if (!pRes.error) setPeriods(pRes.periods || []);
      if (!eRes.error) setEmployees(eRes.employees || []);
    } catch { showToast.error("Lỗi tải dữ liệu"); }
    finally { setLoading(false); }
  };

  const openCreate = () => {
    if (inProgressPeriods.length === 0) {
      showToast.error("Hiện không có kỳ đánh giá đang thực hiện");
      return;
    }
    setCreateModal(true);
  };
  const openEdit = (r: Performance) => { setEditRecord(r); };

  const handleSave = async (form: any) => {
    if (!form.user_id || !form.period_id) { showToast.error("Vui lòng chọn nhân viên và kỳ đánh giá"); return; }
    if (!editRecord && !inProgressPeriods.some(p => p.period_id === Number(form.period_id))) {
      showToast.error("Chỉ có thể chọn kỳ đánh giá đang thực hiện");
      return;
    }
    setSaving(true);
    try {
      const payload: any = { user_id: Number(form.user_id), period_id: Number(form.period_id) };
      if (form.kpi_goals) payload.kpi_goals = form.kpi_goals;
      if (form.achievement) payload.achievement = form.achievement;
      if (form.rating !== "") payload.rating = Number(form.rating);
      if (form.feedback) payload.feedback = form.feedback;
      if (form.review_date) payload.review_date = form.review_date;

      const res = editRecord
        ? await performanceApi.update(editRecord.perf_id, payload)
        : await performanceApi.create(payload);
      if (res.error) { showToast.error(res.message); return; }
      showToast.success(editRecord ? "Cập nhật đánh giá thành công" : "Tạo đánh giá thành công");
      setCreateModal(false); setEditRecord(null);
      fetchAll();
    } catch { showToast.error("Lỗi lưu dữ liệu"); }
    finally { setSaving(false); }
  };

  const renderStars = (rating?: number) => {
    if (rating == null) return <span className="text-gray-300 text-xs">—</span>;
    return (
      <div className="flex items-center gap-1">
        <div className="flex">{Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(rating) ? "text-yellow-400 fill-yellow-400" : "text-gray-200"}`} />
        ))}</div>
        <span className="text-xs text-gray-600 ml-1">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const empName = (id: number) => employees.find(e => e.user_id === id)?.full_name || `#${id}`;
  const filtered = filterPeriod ? records.filter(r => r.period_id === Number(filterPeriod)) : records;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý đánh giá hiệu suất</h1>
        <button onClick={openCreate} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />Tạo đánh giá
        </button>
      </div>

      {/* Filter */}
      <div className="mb-4 flex gap-3">
        <select value={filterPeriod} onChange={e => setFilterPeriod(e.target.value)}
          className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
          <option value="">Tất cả kỳ đánh giá</option>
          {periods.map(p => <option key={p.period_id} value={p.period_id}>{p.period_name}</option>)}
        </select>
        <span className="text-sm text-gray-500 flex items-center">{filtered.length} bản ghi</span>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 rounded-full border-b-2 border-indigo-600" /></div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Nhân viên", "Kỳ đánh giá", "Đánh giá", "Ngày đánh giá", "Người đánh giá", "Hành động"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map(r => (
                <tr key={r.perf_id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-xs font-semibold text-indigo-700">{empName(r.user_id).charAt(0)}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900">{empName(r.user_id)}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-sm text-gray-700">{r.Period?.period_name || `#${r.period_id}`}</td>
                  <td className="px-5 py-4">{renderStars(r.rating)}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{r.review_date ? new Date(r.review_date).toLocaleDateString("vi-VN") : "—"}</td>
                  <td className="px-5 py-4 text-sm text-gray-600">{r.reviewer?.full_name || "—"}</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <button onClick={() => setViewRecord(r)} className="text-gray-400 hover:text-indigo-600"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(r)} className="text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && filtered.length === 0 && (
          <div className="text-center py-12"><Star className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-2 text-sm text-gray-500">Chưa có đánh giá nào</p></div>
        )}
      </div>

      {/* View */}
      <Modal isOpen={!!viewRecord} onClose={() => setViewRecord(null)} title="Chi tiết đánh giá"
        showEditButton onEdit={() => { openEdit(viewRecord!); setViewRecord(null); }}>
        {viewRecord && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><p className="text-xs text-gray-500">Nhân viên</p><p className="text-sm font-medium mt-0.5">{empName(viewRecord.user_id)}</p></div>
              <div><p className="text-xs text-gray-500">Kỳ đánh giá</p><p className="text-sm font-medium mt-0.5">{viewRecord.Period?.period_name || "—"}</p></div>
              <div><p className="text-xs text-gray-500">Đánh giá</p><div className="mt-0.5">{renderStars(viewRecord.rating)}</div></div>
              <div><p className="text-xs text-gray-500">Ngày đánh giá</p><p className="text-sm font-medium mt-0.5">{viewRecord.review_date ? new Date(viewRecord.review_date).toLocaleDateString("vi-VN") : "—"}</p></div>
              <div><p className="text-xs text-gray-500">Người đánh giá</p><p className="text-sm font-medium mt-0.5">{viewRecord.reviewer?.full_name || "—"}</p></div>
            </div>
            {[{ label: "Mục tiêu KPI", val: viewRecord.kpi_goals }, { label: "Kết quả đạt được", val: viewRecord.achievement }, { label: "Nhận xét", val: viewRecord.feedback }].map(({ label, val }) => val && (
              <div key={label}><p className="text-xs text-gray-500 mb-1">{label}</p><div className="bg-gray-50 rounded p-3 text-sm text-gray-700 whitespace-pre-wrap">{val}</div></div>
            ))}
          </div>
        )}
      </Modal>

      {createModal && (
        <FormModal title="Tạo đánh giá mới" onClose={() => setCreateModal(false)}
          employees={employees} periods={inProgressPeriods}
          isEdit={false} saving={saving} onSave={handleSave} />
      )}
      {editRecord && (
        <FormModal title={`Sửa đánh giá: ${empName(editRecord.user_id)}`} onClose={() => setEditRecord(null)}
          initialForm={{
            user_id: editRecord.user_id, period_id: editRecord.period_id,
            kpi_goals: editRecord.kpi_goals || "", achievement: editRecord.achievement || "",
            rating: editRecord.rating ?? "", feedback: editRecord.feedback || "",
            review_date: editRecord.review_date?.split("T")[0] || "",
          }}
          employees={employees} periods={periods}
          isEdit saving={saving} onSave={handleSave} />
      )}
    </div>
  );
}

export default withAuth(PerformancePage);
