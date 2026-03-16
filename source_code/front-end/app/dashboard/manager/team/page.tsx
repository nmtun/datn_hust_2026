/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Users, X, Save, ChevronDown } from "lucide-react";
import { teamApi, Team } from "@/app/api/teamApi";
import { departmentApi, Department } from "@/app/api/departmentApi";
import { employeeApi, EmployeeProfile } from "@/app/api/employeeApi";
import { showToast } from "@/app/utils/toast";
import Modal from "@/app/components/Modal";
import { withAuth } from "@/app/middleware/withAuth";

const emptyForm = { name: "", code: "", description: "", department_id: "", leader_id: "" };

function TeamPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterDept, setFilterDept] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editing, setEditing] = useState<Team | null>(null);
  const [toDelete, setToDelete] = useState<Team | null>(null);
  const [form, setForm] = useState<any>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => { fetchRefs(); }, []);
  useEffect(() => { fetchTeams(); }, [filterDept]);

  const fetchRefs = async () => {
    try {
      const [dRes, eRes] = await Promise.all([departmentApi.getAll(), employeeApi.getAll()]);
      if (!dRes.error) setDepartments(dRes.departments || []);
      if (!eRes.error) setEmployees(eRes.employees || []);
    } catch { /* ignore */ }
  };

  const fetchTeams = async () => {
    setLoading(true);
    try {
      const result = await teamApi.getAll(filterDept ? Number(filterDept) : undefined);
      if (!result.error) setTeams(result.teams || []);
    } catch { setTeams([]); }
    finally { setLoading(false); }
  };

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setModalOpen(true); };
  const openEdit = (t: Team) => {
    setEditing(t);
    setForm({ name: t.name, code: t.code, description: t.description || "", department_id: t.department_id || "", leader_id: t.leader_id || "" });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) { showToast.error("Vui lòng nhập tên và mã nhóm"); return; }
    if (!form.department_id) { showToast.error("Vui lòng chọn phòng ban"); return; }
    try {
      setSaving(true);
      const data: any = { name: form.name, code: form.code, department_id: Number(form.department_id) };
      if (form.description) data.description = form.description;
      if (form.leader_id) data.leader_id = Number(form.leader_id);
      const result = editing ? await teamApi.update(editing.team_id, data) : await teamApi.create(data);
      if (result.error) { showToast.error(result.message || "Thao tác thất bại"); return; }
      showToast.success(editing ? "Cập nhật nhóm thành công" : "Tạo nhóm thành công");
      setModalOpen(false);
      fetchTeams();
    } catch (err: any) { showToast.error(err?.response?.data?.message || "Thao tác thất bại"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      const result = await teamApi.delete(toDelete.team_id);
      if (result.error) { showToast.error(result.message || "Xóa thất bại"); return; }
      showToast.success("Đã xóa nhóm");
      setDeleteModal(false);
      setToDelete(null);
      fetchTeams();
    } catch { showToast.error("Xóa thất bại"); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý nhóm</h1>
        <button onClick={openCreate} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />Thêm nhóm
        </button>
      </div>

      <div className="mb-4 flex">
        <div className="relative">
          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
            className="pl-3 pr-7 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none min-w-[180px]">
            <option value="">Tất cả phòng ban</option>
            {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
          </select>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-16">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên nhóm</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phòng ban</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trưởng nhóm</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {teams.map(team => (
                <tr key={team.team_id} className="hover:bg-gray-50">
                  <td className="px-5 py-3">
                    <div className="flex items-center space-x-2">
                      <Users className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-gray-900">{team.name}</p>
                        {team.description && <p className="text-xs text-gray-400 truncate max-w-[180px]">{team.description}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700 font-mono">{team.code}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{team.department?.name || "—"}</td>
                  <td className="px-5 py-3 text-sm text-gray-700">{team.leader?.full_name || "—"}</td>
                  <td className="px-5 py-3">
                    <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${team.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                      {team.active ? "Hoạt động" : "Đã đóng"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <div className="flex justify-end space-x-2">
                      <button onClick={() => openEdit(team)} className="text-blue-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                      <button onClick={() => { setToDelete(team); setDeleteModal(true); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && teams.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">Chưa có nhóm nào</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Sửa: ${editing.name}` : "Thêm nhóm mới"}>
        <div className="p-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tên nhóm *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mã nhóm *</label>
              <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phòng ban *</label>
              <div className="relative">
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <select value={form.department_id} onChange={e => setForm({ ...form, department_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                  <option value="">-- Chọn phòng ban --</option>
                  {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Trưởng nhóm</label>
              <div className="relative">
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <select value={form.leader_id} onChange={e => setForm({ ...form, leader_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                  <option value="">-- Không có --</option>
                  {employees.map(e => <option key={e.user_id} value={e.user_id}>{e.full_name}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Mô tả</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
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

      {/* Delete Confirm */}
      <Modal isOpen={deleteModal} onClose={() => { setDeleteModal(false); setToDelete(null); }} title="Xác nhận xóa">
        <div className="p-4">
          <p className="text-sm text-gray-700">Bạn có chắc muốn xóa nhóm <span className="font-semibold">{toDelete?.name}</span>?</p>
          <div className="flex justify-end space-x-3 mt-5">
            <button onClick={() => { setDeleteModal(false); setToDelete(null); }} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Hủy</button>
            <button onClick={handleDelete} disabled={deleting} className="px-4 py-2 text-sm bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50">
              {deleting ? "Đang xóa..." : "Xóa"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default withAuth(TeamPage);
