/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useState, useEffect } from "react";
import { Search, User, Eye, Edit2, ChevronDown, X, Save, Building2, Users, Briefcase, Calendar, Mail, Phone, MapPin } from "lucide-react";
import { employeeApi, EmployeeProfile } from "@/app/api/employeeApi";
import { departmentApi, Department } from "@/app/api/departmentApi";
import { teamApi, Team } from "@/app/api/teamApi";
import { showToast } from "@/app/utils/toast";
import Modal from "@/app/components/Modal";
import { withAuth } from "@/app/middleware/withAuth";

const STATUS_LABELS: Record<string, string> = { active: "Đang làm", on_leave: "Nghỉ phép", terminated: "Đã nghỉ" };
const STATUS_COLORS: Record<string, string> = {
  active: "bg-green-100 text-green-800",
  on_leave: "bg-yellow-100 text-yellow-800",
  terminated: "bg-red-100 text-red-800",
};

function HREmployeePage() {
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState("");

  const [viewEmployee, setViewEmployee] = useState<EmployeeProfile | null>(null);
  const [editEmployee, setEditEmployee] = useState<EmployeeProfile | null>(null);
  const [editForm, setEditForm] = useState<any>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchDepartments();
    fetchEmployees();
  }, []);

  const fetchDepartments = async () => {
    const res = await departmentApi.getAll();
    if (!res.error) setDepartments(res.departments || []);
  };

  const fetchEmployees = async (params?: any) => {
    setLoading(true);
    try {
      const res = await employeeApi.getAll(params);
      if (!res.error) setEmployees(res.employees || []);
      else showToast.error(res.message || "Lỗi tải danh sách nhân viên");
    } catch { showToast.error("Lỗi kết nối"); }
    finally { setLoading(false); }
  };

  const handleSearch = () => {
    fetchEmployees({
      full_name: search || undefined,
      department_id: filterDept ? Number(filterDept) : undefined,
      status: filterStatus || undefined,
    });
  };

  const handleReset = () => {
    setSearch(""); setFilterDept(""); setFilterStatus("");
    fetchEmployees();
  };

  const handleStatusChange = async (emp: EmployeeProfile, status: string) => {
    try {
      const res = await employeeApi.updateStatus(emp.user_id, status as any);
      if (res.error) { showToast.error(res.message); return; }
      showToast.success("Cập nhật trạng thái thành công");
      fetchEmployees({ full_name: search || undefined, department_id: filterDept ? Number(filterDept) : undefined, status: filterStatus || undefined });
    } catch { showToast.error("Lỗi cập nhật trạng thái"); }
  };

  const openEdit = (emp: EmployeeProfile) => {
    setEditEmployee(emp);
    const deptId = emp.Employee_Info?.department_id;
    setEditForm({
      full_name: emp.full_name || "",
      phone_number: emp.phone_number || "",
      address: emp.address || "",
      role: emp.role || "",
      position: emp.Employee_Info?.position || "",
      department_id: deptId || "",
      team_id: emp.Employee_Info?.team_id || "",
      hire_date: emp.Employee_Info?.hire_date?.split("T")[0] || "",
    });
    fetchTeamsForEdit(deptId ? Number(deptId) : undefined);
  };

  const fetchTeamsForEdit = async (departmentId?: number) => {
    const res = await teamApi.getAll(departmentId);
    if (!res.error) setTeams(res.teams || []);
  };

  const handleSaveEdit = async () => {
    if (!editEmployee) return;
    setSaving(true);
    try {
      const payload: any = {};
      if (editForm.full_name) payload.full_name = editForm.full_name;
      if (editForm.phone_number !== undefined) payload.phone_number = editForm.phone_number;
      if (editForm.address !== undefined) payload.address = editForm.address;
      if (editForm.role) payload.role = editForm.role;
      if (editForm.position !== undefined) payload.position = editForm.position;
      if (editForm.department_id) payload.department_id = Number(editForm.department_id);
      if (editForm.team_id) payload.team_id = Number(editForm.team_id);
      if (editForm.hire_date) payload.hire_date = editForm.hire_date;

      const res = await employeeApi.update(editEmployee.user_id, payload);
      if (res.error) { showToast.error(res.message); return; }
      showToast.success("Cập nhật nhân viên thành công");
      setEditEmployee(null);
      fetchEmployees();
    } catch { showToast.error("Lỗi cập nhật"); }
    finally { setSaving(false); }
  };

  const emp = (e: EmployeeProfile) => e.Employee_Info;

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý nhân viên</h1>
        <span className="text-sm text-gray-500">{employees.length} nhân viên</span>
      </div>

      {/* Search & Filter */}
      <div className="bg-white shadow rounded-lg p-4 mb-6">
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[200px] relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input type="text" placeholder="Tìm theo tên..." value={search} onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleSearch()}
              className="pl-9 pr-3 py-2 w-full border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <select value={filterDept} onChange={e => setFilterDept(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Tất cả phòng ban</option>
            {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
          </select>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
            <option value="">Tất cả trạng thái</option>
            <option value="active">Đang làm</option>
            <option value="on_leave">Nghỉ phép</option>
            <option value="terminated">Đã nghỉ</option>
          </select>
          <button onClick={handleSearch} className="px-4 py-2 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700">Tìm kiếm</button>
          <button onClick={handleReset} className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded-md hover:bg-gray-200">Đặt lại</button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {["Nhân viên", "Liên hệ", "Chức vụ / Phòng ban", "Trạng thái", "Hành động"].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {employees.map(e => (
                <tr key={e.user_id} className="hover:bg-gray-50">
                  <td className="px-5 py-4">
                    <div className="flex items-center space-x-3">
                      <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold text-indigo-700">{e.full_name?.charAt(0)?.toUpperCase()}</span>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900">{e.full_name}</p>
                        {emp(e)?.employee_code && <p className="text-xs text-gray-400">{emp(e)!.employee_code}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-gray-700">{e.personal_email}</p>
                    <p className="text-xs text-gray-400">{e.phone_number || "—"}</p>
                  </td>
                  <td className="px-5 py-4">
                    <p className="text-sm text-gray-800">{emp(e)?.position || <span className="text-gray-400">—</span>}</p>
                    {emp(e)?.department && (
                      <span className="inline-flex items-center text-xs text-gray-500 mt-0.5">
                        <Building2 className="w-3 h-3 mr-1" />{emp(e)!.department!.name}
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <div className="relative group">
                      <select value={e.status}
                        onChange={ev => handleStatusChange(e, ev.target.value)}
                        className={`text-xs font-semibold rounded-full px-2 py-1 border-0 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${STATUS_COLORS[e.status] || "bg-gray-100 text-gray-700"}`}>
                        <option value="active">Đang làm</option>
                        <option value="on_leave">Nghỉ phép</option>
                        <option value="terminated">Đã nghỉ</option>
                      </select>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center space-x-3">
                      <button onClick={() => setViewEmployee(e)} className="text-gray-400 hover:text-indigo-600" title="Xem chi tiết">
                        <Eye className="w-4 h-4" />
                      </button>
                      <button onClick={() => openEdit(e)} className="text-gray-400 hover:text-blue-600" title="Chỉnh sửa">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        {!loading && employees.length === 0 && (
          <div className="text-center py-12">
            <User className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-2 text-sm text-gray-500">Không tìm thấy nhân viên nào</p>
          </div>
        )}
      </div>

      {/* View Modal */}
      <Modal isOpen={!!viewEmployee} onClose={() => setViewEmployee(null)} title={viewEmployee?.full_name || "Chi tiết"} showEditButton onEdit={() => { openEdit(viewEmployee!); setViewEmployee(null); }}>
        {viewEmployee && (
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4">
              {[
                { icon: <User className="w-4 h-4" />, label: "Họ và tên", val: viewEmployee.full_name },
                { icon: <Mail className="w-4 h-4" />, label: "Email cá nhân", val: viewEmployee.personal_email },
                { icon: <Mail className="w-4 h-4" />, label: "Email công ty", val: viewEmployee.company_email || "—" },
                { icon: <Phone className="w-4 h-4" />, label: "Điện thoại", val: viewEmployee.phone_number || "—" },
                { icon: <MapPin className="w-4 h-4" />, label: "Địa chỉ", val: viewEmployee.address || "—" },
                { icon: null, label: "Trạng thái", val: STATUS_LABELS[viewEmployee.status] || viewEmployee.status },
                { icon: null, label: "Role", val: viewEmployee.role },
                { icon: <Briefcase className="w-4 h-4" />, label: "Chức vụ", val: emp(viewEmployee)?.position || "—" },
                { icon: <Building2 className="w-4 h-4" />, label: "Phòng ban", val: emp(viewEmployee)?.department?.name || "—" },
                { icon: <Users className="w-4 h-4" />, label: "Nhóm", val: emp(viewEmployee)?.team?.name || "—" },
                { icon: <User className="w-4 h-4" />, label: "Quản lý", val: emp(viewEmployee)?.manager?.full_name || "—" },
                { icon: <Calendar className="w-4 h-4" />, label: "Ngày vào làm", val: emp(viewEmployee)?.hire_date ? new Date(emp(viewEmployee)!.hire_date!).toLocaleDateString("vi-VN") : "—" },
              ].map(({ icon, label, val }) => (
                <div key={label}>
                  <p className="text-xs text-gray-500 flex items-center gap-1">{icon}{label}</p>
                  <p className="text-sm font-medium text-gray-800 mt-0.5">{val}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Modal */}
      <Modal isOpen={!!editEmployee} onClose={() => setEditEmployee(null)} title={`Chỉnh sửa: ${editEmployee?.full_name}`}>
        {editEmployee && (
          <div className="p-6 space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Họ và tên", key: "full_name", type: "text" },
                { label: "Điện thoại", key: "phone_number", type: "text" },
                { label: "Chức vụ", key: "position", type: "text" },
                { label: "Ngày vào làm", key: "hire_date", type: "date" },
              ].map(({ label, key, type }) => (
                <div key={key}>
                  <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} value={editForm[key] || ""} onChange={e => setEditForm({ ...editForm, [key]: e.target.value })}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Phòng ban</label>
                <select value={editForm.department_id || ""} onChange={e => {
                  setEditForm({ ...editForm, department_id: e.target.value, team_id: "" });
                  fetchTeamsForEdit(e.target.value ? Number(e.target.value) : undefined);
                }}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">— Chọn phòng ban —</option>
                  {departments.map(d => <option key={d.department_id} value={d.department_id}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Nhóm</label>
                <select value={editForm.team_id || ""} onChange={e => setEditForm({ ...editForm, team_id: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="">— Không có —</option>
                  {teams.map(t => <option key={t.team_id} value={t.team_id}>{t.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
                <select value={editForm.role || ""} onChange={e => setEditForm({ ...editForm, role: e.target.value })}
                  className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500">
                  <option value="employee">Employee</option>
                  <option value="manager">Manager</option>
                  <option value="hr">HR</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Địa chỉ</label>
              <textarea value={editForm.address || ""} onChange={e => setEditForm({ ...editForm, address: e.target.value })}
                rows={2} className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none" />
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button onClick={() => setEditEmployee(null)} className="px-4 py-2 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200">Hủy</button>
              <button onClick={handleSaveEdit} disabled={saving}
                className="px-4 py-2 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2">
                {saving ? <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" /> : <Save className="w-4 h-4" />}
                Lưu
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default withAuth(HREmployeePage);
