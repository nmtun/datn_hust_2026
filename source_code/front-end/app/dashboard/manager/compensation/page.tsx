/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Plus, Eye, Edit2, DollarSign, ChevronDown, X, Save } from "lucide-react";
import { compensationApi, Compensation } from "@/app/api/compensationApi";
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

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [cRes, eRes] = await Promise.all([compensationApi.getAll(), employeeApi.getAll()]);
      if (!cRes.error) setRecords(cRes.records || []);
      if (!eRes.error) setEmployees(eRes.employees || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
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
    if (!form.user_id || !form.effective_date) { showToast.error("Vui lòng chọn nhân viên và ngày hiệu lực"); return; }
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
      if (result.error) { showToast.error(result.message || "Thao tác thất bại"); return; }
      showToast.success(editing ? "Cập nhật lương thưởng thành công" : "Tạo bản ghi lương thưởng thành công");
      setModalOpen(false);
      fetchAll();
    } catch { showToast.error("Thao tác thất bại"); }
    finally { setSaving(false); }
  };

  const fmtCurrency = (v?: number) => v != null ? new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(v) : "—";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý lương thưởng</h1>
        <button onClick={openCreate} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />Thêm bản ghi
        </button>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" /></div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Nhân viên", "Lương", "Thưởng", "Ngày hiệu lực", "Lý do", "Thao tác"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.map(r => (
                <tr key={r.comp_id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center">
                        <span className="text-xs font-semibold text-indigo-600">{r.employee?.full_name?.charAt(0) || "?"}</span>
                      </div>
                      <p className="text-sm text-gray-900">{r.employee?.full_name || `User #${r.user_id}`}</p>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm font-medium text-gray-900">{fmtCurrency(r.salary)}</td>
                  <td className="px-5 py-3 text-sm text-amber-700">{r.bonus ? fmtCurrency(r.bonus) : <span className="text-gray-400">—</span>}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">
                    {r.effective_date ? new Date(r.effective_date).toLocaleDateString("vi-VN") : "—"}
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-600 max-w-[160px] truncate">{r.reason || <span className="text-gray-400">—</span>}</td>
                  <td className="px-5 py-3">
                    <div className="flex space-x-2">
                      <button onClick={() => setViewRecord(r)} className="text-gray-400 hover:text-gray-600"><Eye className="w-4 h-4" /></button>
                      <button onClick={() => openEdit(r)} className="text-blue-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && records.length === 0 && (
          <div className="text-center py-12">
            <DollarSign className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">Chưa có bản ghi lương thưởng nào</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal isOpen={!!viewRecord} onClose={() => setViewRecord(null)} title="Chi tiết lương thưởng"
        showEditButton onEdit={() => { openEdit(viewRecord!); setViewRecord(null); }}>
        {viewRecord && (
          <div className="p-1 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                ["Nhân viên", viewRecord.employee?.full_name || `User #${viewRecord.user_id}`],
                ["Ngày hiệu lực", viewRecord.effective_date ? new Date(viewRecord.effective_date).toLocaleDateString("vi-VN") : "—"],
                ["Lương", fmtCurrency(viewRecord.salary)],
                ["Thưởng", viewRecord.bonus ? fmtCurrency(viewRecord.bonus) : "Không có"],
                ["Người duyệt", viewRecord.approver?.full_name || "—"],
                ["Ngày duyệt", viewRecord.approved_at ? new Date(viewRecord.approved_at).toLocaleDateString("vi-VN") : "—"],
              ].map(([l, v]) => (
                <div key={l}><p className="text-xs text-gray-500">{l}</p><p className="text-sm font-medium mt-0.5">{v}</p></div>
              ))}
              {viewRecord.reason && <div className="col-span-2"><p className="text-xs text-gray-500">Lý do</p><p className="text-sm mt-0.5">{viewRecord.reason}</p></div>}
            </div>
          </div>
        )}
      </Modal>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? "Cập nhật lương thưởng" : "Thêm bản ghi lương thưởng"}>
        <div className="p-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Nhân viên *</label>
              <div className="relative">
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <select value={form.user_id} onChange={e => setForm({ ...form, user_id: e.target.value })} disabled={!!editing}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none disabled:bg-gray-100">
                  <option value="">-- Chọn nhân viên --</option>
                  {employees.map(e => <option key={e.user_id} value={e.user_id}>{e.full_name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Ngày hiệu lực *</label>
              <input type="date" value={form.effective_date} onChange={e => setForm({ ...form, effective_date: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Lương (VND)</label>
              <input type="number" value={form.salary} onChange={e => setForm({ ...form, salary: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Thưởng (VND)</label>
              <input type="number" value={form.bonus} onChange={e => setForm({ ...form, bonus: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Lý do</label>
            <textarea value={form.reason} onChange={e => setForm({ ...form, reason: e.target.value })}
              rows={2} className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
          </div>
          <div className="flex justify-end space-x-3 pt-2">
            <button onClick={() => setModalOpen(false)} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">
              <X className="w-4 h-4 inline mr-1" />Hủy
            </button>
            <button onClick={handleSave} disabled={saving} className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center">
              {saving ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" /> : <Save className="w-4 h-4 mr-1" />}
              Lưu
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default withAuth(CompensationPage);
