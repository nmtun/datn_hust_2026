"use client";

import { useState, useEffect } from "react";
import {
  User,
  Mail,
  Phone,
  MapPin,
  Briefcase,
  Building2,
  Users,
  Calendar,
  Edit2,
  Save,
  X,
  Shield,
} from "lucide-react";
import { employeeApi, EmployeeProfile } from "@/app/api/employeeApi";
import { showToast } from "@/app/utils/toast";
import { withAuth } from "@/app/middleware/withAuth";

function ManagerProfilePage() {
  const [profile, setProfile] = useState<EmployeeProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState({ phone_number: "", address: "" });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const result = await employeeApi.getMyProfile();
      if (result.error) {
        showToast.error(result.message || "Không thể tải thông tin hồ sơ");
        return;
      }
      setProfile(result.profile);
      setEditForm({
        phone_number: result.profile?.phone_number || "",
        address: result.profile?.address || "",
      });
    } catch {
      showToast.error("Không thể tải thông tin hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const result = await employeeApi.updateMyProfile({
        phone_number: editForm.phone_number || undefined,
        address: editForm.address || undefined,
      });
      if (result.error) {
        showToast.error(result.message || "Cập nhật thất bại");
        return;
      }
      showToast.success("Cập nhật hồ sơ thành công");
      setIsEditing(false);
      await fetchProfile();
    } catch {
      showToast.error("Cập nhật thất bại");
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "on_leave":
        return "bg-yellow-100 text-yellow-800";
      case "terminated":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Đang làm việc";
      case "on_leave":
        return "Nghỉ phép";
      case "terminated":
        return "Đã nghỉ";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-12">
        <User className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">Không tìm thấy thông tin hồ sơ</p>
      </div>
    );
  }

  const emp = profile.Employee_Info;

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Hồ sơ của tôi</h1>
        {!isEditing ? (
          <button
            onClick={() => setIsEditing(true)}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Edit2 className="w-4 h-4 mr-2" />
            Chỉnh sửa
          </button>
        ) : (
          <div className="flex space-x-3">
            <button
              onClick={() => {
                setIsEditing(false);
                setEditForm({
                  phone_number: profile.phone_number || "",
                  address: profile.address || "",
                });
              }}
              className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200"
            >
              <X className="w-4 h-4 mr-2" />
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {saving ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              Lưu
            </button>
          </div>
        )}
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <div className="flex items-center space-x-6">
          <div className="h-20 w-20 rounded-full bg-indigo-100 flex items-center justify-center">
            <span className="text-3xl font-bold text-indigo-600">
              {profile.full_name?.charAt(0)?.toUpperCase() || "?"}
            </span>
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900">{profile.full_name}</h2>
            <p className="text-sm text-gray-500 mt-1">
              {profile.company_email || profile.personal_email}
            </p>
            <div className="flex items-center space-x-3 mt-2">
              <span
                className={`px-2 py-0.5 text-xs font-semibold rounded-full ${getStatusColor(
                  profile.status
                )}`}
              >
                {getStatusLabel(profile.status)}
              </span>
              <span className="flex items-center text-xs text-gray-500">
                <Shield className="w-3.5 h-3.5 mr-1" />
                {profile.role}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Thông tin liên hệ</h3>
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Email cá nhân</p>
              <p className="text-sm text-gray-900">{profile.personal_email}</p>
            </div>
          </div>
          {profile.company_email && (
            <div className="flex items-start space-x-3">
              <Mail className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-xs text-gray-500 mb-1">Email công ty</p>
                <p className="text-sm text-gray-900">{profile.company_email}</p>
              </div>
            </div>
          )}
          <div className="flex items-start space-x-3">
            <Phone className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Số điện thoại</p>
              {isEditing ? (
                <input
                  type="text"
                  value={editForm.phone_number}
                  onChange={(e) =>
                    setEditForm({ ...editForm, phone_number: e.target.value })
                  }
                  placeholder="Nhập số điện thoại..."
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile.phone_number || "Chưa cập nhật"}</p>
              )}
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-gray-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-xs text-gray-500 mb-1">Địa chỉ</p>
              {isEditing ? (
                <textarea
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Nhập địa chỉ..."
                  rows={2}
                  className="w-full text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
              ) : (
                <p className="text-sm text-gray-900">{profile.address || "Chưa cập nhật"}</p>
              )}
            </div>
          </div>
        </div>
        {isEditing && (
          <p className="mt-4 text-xs text-gray-400">
            * Chỉ có thể chỉnh sửa số điện thoại và địa chỉ. Các thông tin khác do hệ thống quản lý.
          </p>
        )}
      </div>

      {emp && (
        <div className="bg-white shadow rounded-lg p-6">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Thông tin công việc</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Mã nhân viên</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {emp.employee_id_number || "Chưa cập nhật"}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Briefcase className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Chức vụ</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {emp.position || "Chưa cập nhật"}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Calendar className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Ngày vào làm</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {emp.hire_date
                    ? new Date(emp.hire_date).toLocaleDateString("vi-VN")
                    : "Chưa cập nhật"}
                </p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Building2 className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Phòng ban</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {emp.department?.name || "Chưa cập nhật"}
                </p>
                <p className="text-xs text-gray-400">{emp.department?.code || ""}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Users className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Nhóm</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {emp.team?.name || "Chưa cập nhật"}
                </p>
                <p className="text-xs text-gray-400">{emp.team?.code || ""}</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <User className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="text-xs text-gray-500">Quản lý trực tiếp</p>
                <p className="text-sm font-medium text-gray-900 mt-0.5">
                  {emp.manager?.full_name || "Chưa cập nhật"}
                </p>
                {emp.manager?.company_email && (
                  <p className="text-xs text-gray-400">{emp.manager.company_email}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(ManagerProfilePage);
