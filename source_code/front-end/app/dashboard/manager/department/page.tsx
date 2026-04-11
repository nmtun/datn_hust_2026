/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { Plus, Edit2, Trash2, Building2, X, Save, ChevronDown, ChevronRight, Users, UserPlus, UserMinus } from "lucide-react";
import { departmentApi, Department } from "@/app/api/departmentApi";
import { teamApi, Team } from "@/app/api/teamApi";
import { employeeApi, EmployeeProfile } from "@/app/api/employeeApi";
import { showToast } from "@/app/utils/toast";
import Modal from "@/app/components/Modal";
import { withAuth } from "@/app/middleware/withAuth";

const emptyForm = { name: "", code: "", description: "", manager_id: "", parent_department_id: "" };

const getEmployeeDepartmentId = (employee: EmployeeProfile): number | null => {
  if (employee.Employee_Info?.department_id) return employee.Employee_Info.department_id;
  if (employee.Employee_Info?.department?.department_id) return employee.Employee_Info.department.department_id;
  return null;
};

function DepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [allEmployees, setAllEmployees] = useState<EmployeeProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteModal, setDeleteModal] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [toDelete, setToDelete] = useState<Department | null>(null);
  const [form, setForm] = useState<any>({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Drill-down state
  const [expandedDept, setExpandedDept] = useState<number | null>(null);
  const [deptTeams, setDeptTeams] = useState<Record<number, Team[]>>({});
  const [loadingTeams, setLoadingTeams] = useState(false);
  const [expandedTeam, setExpandedTeam] = useState<number | null>(null);
  const [teamDetails, setTeamDetails] = useState<Record<number, any>>({});
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [addMemberUserId, setAddMemberUserId] = useState("");
  const [addingMember, setAddingMember] = useState(false);

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [dResult, eResult] = await Promise.all([departmentApi.getAll(), employeeApi.getAll()]);
      if (!dResult.error) setDepartments(dResult.departments || []);
      if (!eResult.error) setAllEmployees(eResult.employees || []);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  const toggleDept = async (deptId: number) => {
    if (expandedDept === deptId) { setExpandedDept(null); setExpandedTeam(null); return; }
    setExpandedDept(deptId);
    setExpandedTeam(null);
    setAddMemberUserId("");
    if (!deptTeams[deptId]) {
      setLoadingTeams(true);
      try {
        const res = await teamApi.getAll(deptId);
        if (!res.error) setDeptTeams(prev => ({ ...prev, [deptId]: res.teams || [] }));
      } finally { setLoadingTeams(false); }
    }
  };

  const toggleTeam = async (teamId: number) => {
    if (expandedTeam === teamId) { setExpandedTeam(null); return; }
    setExpandedTeam(teamId);
    setAddMemberUserId("");
    setLoadingMembers(true);
    try {
      const res = await teamApi.getById(teamId);
      if (!res.error) setTeamDetails(prev => ({ ...prev, [teamId]: res.team }));
    } finally { setLoadingMembers(false); }
  };

  const refreshTeamMembers = async (teamId: number) => {
    const res = await teamApi.getById(teamId);
    if (!res.error) setTeamDetails(prev => ({ ...prev, [teamId]: res.team }));
  };

  const handleAddMember = async (teamId: number) => {
    if (!addMemberUserId) { showToast.error("Vui lòng chọn nhân viên"); return; }
    setAddingMember(true);
    try {
      const res = await teamApi.addMember(teamId, Number(addMemberUserId));
      if (res.error) { showToast.error(res.message || "Thêm thành viên thất bại"); return; }
      showToast.success("Đã thêm thành viên vào nhóm");
      setAddMemberUserId("");
      refreshTeamMembers(teamId);
    } catch { showToast.error("Thêm thành viên thất bại"); }
    finally { setAddingMember(false); }
  };

  const handleRemoveMember = async (teamId: number, userId: number) => {
    try {
      const res = await teamApi.removeMember(teamId, userId);
      if (res.error) { showToast.error(res.message || "Xóa thành viên thất bại"); return; }
      showToast.success("Đã xóa thành viên khỏi nhóm");
      refreshTeamMembers(teamId);
    } catch { showToast.error("Lỗi xóa thành viên"); }
  };

  const openCreate = () => { setEditing(null); setForm({ ...emptyForm }); setModalOpen(true); };

  const openEdit = (dept: Department) => {
    setEditing(dept);
    setForm({ name: dept.name, code: dept.code, description: dept.description || "", manager_id: dept.manager_id || "", parent_department_id: dept.parent_department_id || "" });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.name || !form.code) { showToast.error("Vui lòng nhập tên và mã phòng ban"); return; }
    try {
      setSaving(true);
      const data: any = { name: form.name, code: form.code };
      if (form.description) data.description = form.description;
      if (form.manager_id) data.manager_id = Number(form.manager_id);
      if (form.parent_department_id) data.parent_department_id = Number(form.parent_department_id);
      const result = editing ? await departmentApi.update(editing.department_id, data) : await departmentApi.create(data);
      if (result.error) { showToast.error(result.message || "Thao tác thất bại"); return; }
      showToast.success(editing ? "Cập nhật phòng ban thành công" : "Tạo phòng ban thành công");
      setModalOpen(false);
      fetchAll();
    } catch { showToast.error("Thao tác thất bại"); }
    finally { setSaving(false); }
  };

  const handleDelete = async () => {
    if (!toDelete) return;
    try {
      setDeleting(true);
      const result = await departmentApi.delete(toDelete.department_id);
      if (result.error) { showToast.error(result.message || "Xóa thất bại"); return; }
      showToast.success("Đã xóa phòng ban");
      setDeleteModal(false);
      setToDelete(null);
      fetchAll();
    } catch { showToast.error("Xóa thất bại"); }
    finally { setDeleting(false); }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý phòng ban</h1>
        <button onClick={openCreate} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700">
          <Plus className="w-4 h-4 mr-2" />Thêm phòng ban
        </button>
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
                <th className="px-3 py-3 w-8" />
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tên phòng ban</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mã</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quản lý</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trực thuộc</th>
                <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Trạng thái</th>
                <th className="px-5 py-3 text-right text-xs font-medium text-gray-500 uppercase">Thao tác</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {departments.flatMap(dept => {
                const isExpanded = expandedDept === dept.department_id;
                const teams = deptTeams[dept.department_id] || [];
                const rows = [
                  <tr key={dept.department_id} className="hover:bg-gray-50">
                    <td className="px-3 py-3">
                      <button onClick={() => toggleDept(dept.department_id)} className="text-gray-400 hover:text-indigo-600 transition-colors">
                        {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                      </button>
                    </td>
                    <td className="px-5 py-3">
                      <div className="flex items-center space-x-2">
                        <Building2 className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                        <div>
                          <p className="text-sm font-medium text-gray-900 cursor-pointer hover:text-indigo-600" onClick={() => toggleDept(dept.department_id)}>{dept.name}</p>
                          {dept.description && <p className="text-xs text-gray-400 truncate max-w-[200px]">{dept.description}</p>}
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-sm text-gray-700 font-mono">{dept.code}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{dept.manager?.full_name || "—"}</td>
                    <td className="px-5 py-3 text-sm text-gray-700">{dept.parentDepartment?.name || "—"}</td>
                    <td className="px-5 py-3">
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${dept.active ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                        {dept.active ? "Hoạt động" : "Đã đóng"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex justify-end space-x-2">
                        <button onClick={() => openEdit(dept)} className="text-blue-400 hover:text-blue-600"><Edit2 className="w-4 h-4" /></button>
                        <button onClick={() => { setToDelete(dept); setDeleteModal(true); }} className="text-red-400 hover:text-red-600"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ];

                if (isExpanded) {
                  rows.push(
                    <tr key={`teams-${dept.department_id}`}>
                      <td colSpan={7} className="bg-slate-50 px-8 py-5 border-t border-indigo-100">
                        {loadingTeams ? (
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />Đang tải nhóm...
                          </div>
                        ) : (
                          <div>
                            <p className="text-xs font-semibold text-indigo-600 uppercase mb-3 flex items-center gap-1.5">
                              <Users className="w-3.5 h-3.5" />Các nhóm — {dept.name}
                            </p>
                            {teams.length === 0 ? (
                              <p className="text-sm text-gray-400 italic">Chưa có nhóm nào trong phòng ban này</p>
                            ) : (
                              <div className="flex flex-wrap gap-2">
                                {teams.map(team => (
                                  <button key={team.team_id} onClick={() => toggleTeam(team.team_id)}
                                    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors
                                      ${expandedTeam === team.team_id
                                        ? "bg-indigo-600 text-white border-indigo-600"
                                        : "bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50"}`}>
                                    <Users className="w-3.5 h-3.5" />{team.name}
                                  </button>
                                ))}
                              </div>
                            )}

                            {/* Team members panel */}
                            {expandedTeam !== null && teams.some(t => t.team_id === expandedTeam) && (
                              <div className="mt-4 bg-white border border-indigo-200 rounded-lg p-5">
                                {loadingMembers ? (
                                  <div className="flex items-center gap-2 text-sm text-gray-500">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600" />Đang tải thành viên...
                                  </div>
                                ) : (() => {
                                  const teamData = teamDetails[expandedTeam];
                                  const members: any[] = teamData?.members || [];
                                  const memberIds = new Set(members.map((m: any) => m.user_id));
                                  const currentDepartmentId = teamData?.department_id || expandedDept;
                                  const available = allEmployees.filter(e => (
                                    !memberIds.has(e.user_id)
                                    && currentDepartmentId !== null
                                    && getEmployeeDepartmentId(e) === currentDepartmentId
                                  ));
                                  return (
                                    <div>
                                      <p className="text-sm font-semibold text-gray-800 mb-3">
                                        {teamData?.name} &mdash; {members.length} thành viên
                                      </p>
                                      <div className="space-y-1 mb-4 max-h-60 overflow-y-auto">
                                        {members.length === 0 && <p className="text-sm text-gray-400 italic">Chưa có thành viên</p>}
                                        {members.map((m: any) => (
                                          <div key={m.user_id} className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-50">
                                            <div className="flex items-center gap-2.5">
                                              <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                                                <span className="text-xs font-semibold text-indigo-700">{m.User?.full_name?.charAt(0)?.toUpperCase()}</span>
                                              </div>
                                              <div>
                                                <p className="text-sm font-medium text-gray-800">{m.User?.full_name}</p>
                                                <p className="text-xs text-gray-400">{m.User?.company_email || "—"}</p>
                                              </div>
                                              {teamData?.leader_id === m.user_id && (
                                                <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">Trưởng nhóm</span>
                                              )}
                                            </div>
                                            <button onClick={() => handleRemoveMember(expandedTeam, m.user_id)}
                                              className="text-red-400 hover:text-red-600 p-1" title="Xóa khỏi nhóm">
                                              <UserMinus className="w-4 h-4" />
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                                        <div className="relative flex-1 max-w-xs">
                                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                                          <select value={addMemberUserId} onChange={e => setAddMemberUserId(e.target.value)}
                                            className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                                            <option value="">— Chọn nhân viên để thêm —</option>
                                            {available.map(e => <option key={e.user_id} value={e.user_id}>{e.full_name}</option>)}
                                          </select>
                                        </div>
                                        <button onClick={() => handleAddMember(expandedTeam)} disabled={addingMember || !addMemberUserId}
                                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50">
                                          <UserPlus className="w-4 h-4" />
                                          {addingMember ? "Đang thêm..." : "Thêm"}
                                        </button>
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                }
                return rows;
              })}
            </tbody>
          </table>
        )}
        {!loading && departments.length === 0 && (
          <div className="text-center py-12">
            <Building2 className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">Chưa có phòng ban nào</p>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editing ? `Sửa: ${editing.name}` : "Thêm phòng ban mới"}>
        <div className="p-1 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Tên phòng ban *</label>
              <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Mã phòng ban *</label>
              <input type="text" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })}
                className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Trưởng phòng</label>
              <div className="relative">
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <select value={form.manager_id} onChange={e => setForm({ ...form, manager_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                  <option value="">-- Không có --</option>
                  {allEmployees.map(m => <option key={m.user_id} value={m.user_id}>{m.full_name}</option>)}
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Phòng ban cha</label>
              <div className="relative">
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <select value={form.parent_department_id} onChange={e => setForm({ ...form, parent_department_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none">
                  <option value="">-- Không có --</option>
                  {departments.filter(d => editing ? d.department_id !== editing.department_id : true).map(d => (
                    <option key={d.department_id} value={d.department_id}>{d.name}</option>
                  ))}
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
          <p className="text-sm text-gray-700">Bạn có chắc muốn xóa phòng ban <span className="font-semibold">{toDelete?.name}</span>?</p>
          <p className="text-xs text-gray-500 mt-1">Phòng ban sẽ bị ẩn khỏi hệ thống (soft delete).</p>
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

export default withAuth(DepartmentPage);
