"use client";
import { useState, useEffect } from "react";
import { Plus, Edit2, Calendar, RefreshCw, Save, X } from "lucide-react";
import { performancePeriodApi, PerformancePeriod } from "@/app/api/performancePeriodApi";
import { showToast } from "@/app/utils/toast";
import Modal from "@/app/components/Modal";
import { withAuth } from "@/app/middleware/withAuth";
import { useAuth } from "@/app/context/AuthContext";

const STATUS_META: Record<string, { label: string; color: string; next: string }> = {
  planned:     { label: "Kế hoạch",       color: "bg-gray-100 text-gray-700",   next: "Bắt đầu" },
  in_progress: { label: "Đang thực hiện", color: "bg-blue-100 text-blue-800",   next: "Hoàn thành" },
  completed:   { label: "Hoàn thành",     color: "bg-green-100 text-green-800", next: "" },
};

const BLANK: { period_name: string; start_date: string; end_date: string; description: string; status: PerformancePeriod["status"] } =
  { period_name: "", start_date: "", end_date: "", description: "", status: "planned" };

function PerformancePeriodPage() {
  const { user } = useAuth();
  const [periods, setPeriods] = useState<PerformancePeriod[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<PerformancePeriod | null>(null);
  const [form, setForm] = useState({ ...BLANK });
  const [saving, setSaving] = useState(false);
  const [toggling, setToggling] = useState<number | null>(null);
  const canManagePeriod = user?.role === "hr" || (user?.role === "manager" && (user?.hierarchy_role || "manager") === "manager");

  useEffect(() => { fetchPeriods(); }, []);

  const fetchPeriods = async () => {
    setLoading(true);
    try {
      const res = await performancePeriodApi.getAll();
      if (!res.error) setPeriods(res.periods || []);
    } catch { showToast.error("Lỗi tải dữ liệu"); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setEditing(null); setForm({ ...BLANK }); setModalOpen(true); };
  const openEdit = (p: PerformancePeriod) => {
    setEditing(p);
    setForm({ period_name: p.period_name, start_date: p.start_date?.split("T")[0] || "", end_date: p.end_date?.split("T")[0] || "", description: p.description || "", status: p.status });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.period_name || !form.start_date || !form.end_date) { showToast.error("Vui lòng điền đầy đủ thông tin bắt buộc"); return; }
    setSaving(true);
    try {
      const res = editing
        ? await performancePeriodApi.update(editing.period_id, form)
        : await performancePeriodApi.create(form);
      if (res.error) { showToast.error(res.message); return; }
      showToast.success(editing ? "Cập nhật thành công" : "Tạo kỳ đánh giá thành công");
      setModalOpen(false);
      fetchPeriods();
    } catch { showToast.error("Lỗi lưu dữ liệu"); }
    finally { setSaving(false); }
  };

  const handleToggle = async (p: PerformancePeriod) => {
    setToggling(p.period_id);
    try {
      const res = await performancePeriodApi.toggleStatus(p.period_id);
      if (res.error) { showToast.error(res.message); return; }
      showToast.success("Cập nhật trạng thái thành công");
      fetchPeriods();
    } catch { showToast.error("Lỗi cập nhật trạng thái"); }
    finally { setToggling(null); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Kỳ đánh giá hiệu suất</h1>
        {canManagePeriod && (
          <button onClick={openCreate} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" />Tạo kỳ đánh giá
          </button>
        )}
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center p-12"><div className="animate-spin h-8 w-8 rounded-full border-b-2 border-indigo-600" /></div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Tên kỳ đánh giá", "Ngày bắt đầu", "Ngày kết thúc", "Trạng thái", "Hành động"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {periods.map(p => {
                const meta = STATUS_META[p.status] || STATUS_META.planned;
                return (
                  <tr key={p.period_id} className="hover:bg-gray-50">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-indigo-400" />
                        <div>
                          <p className="text-sm font-medium text-gray-900">{p.period_name}</p>
                          {p.description && <p className="text-xs text-gray-400 truncate max-w-[220px]">{p.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-sm text-gray-700">{new Date(p.start_date).toLocaleDateString("vi-VN")}</td>
                    <td className="px-5 py-4 text-sm text-gray-700">{new Date(p.end_date).toLocaleDateString("vi-VN")}</td>
                    <td className="px-5 py-4">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${meta.color}`}>{meta.label}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {canManagePeriod && (
                          <button onClick={() => openEdit(p)} className="text-gray-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                        )}
                        {canManagePeriod && meta.next && (
                          <button onClick={() => handleToggle(p)} disabled={toggling === p.period_id}
                            className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 disabled:opacity-50">
                            {toggling === p.period_id ? <div className="animate-spin h-3 w-3 border border-indigo-700 border-t-transparent rounded-full" /> : <RefreshCw className="w-3 h-3" />}
                            {meta.next}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        {!loading && periods.length === 0 && (
          <div className="text-center py-12"><Calendar className="mx-auto h-10 w-10 text-gray-300" /><p className="mt-2 text-sm text-gray-500">Chưa có kỳ đánh giá nào</p></div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={canManagePeriod && modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Sửa kỳ: ${editing.period_name}` : "Tạo kỳ đánh giá mới"}>
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Tên kỳ đánh giá *</label>
            <input value={form.period_name} onChange={e => setForm({ ...form, period_name: e.target.value })} placeholder="VD: Q1 2026"
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ngày bắt đầu *</label>
              <input type="date" value={form.start_date} onChange={e => setForm({ ...form, start_date: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Ngày kết thúc *</label>
              <input type="date" value={form.end_date} onChange={e => setForm({ ...form, end_date: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Mô tả</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={2}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Trạng thái</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value as PerformancePeriod["status"] })}
              className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
              {Object.entries(STATUS_META).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"><X className="w-4 h-4 inline mr-1" />Hủy</button>
            <button onClick={handleSave} disabled={saving}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50">
              {saving ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-4 h-4" />}
              {editing ? "Cập nhật" : "Tạo mới"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default withAuth(PerformancePeriodPage);
