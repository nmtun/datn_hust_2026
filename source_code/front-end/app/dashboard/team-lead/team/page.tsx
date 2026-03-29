/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Users, UserPlus, UserMinus, ChevronDown } from "lucide-react";
import { withAuth } from "@/app/middleware/withAuth";
import { teamApi, Team } from "@/app/api/teamApi";
import { employeeApi, EmployeeProfile } from "@/app/api/employeeApi";
import { showToast } from "@/app/utils/toast";

function TeamLeadTeamPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamDetail, setTeamDetail] = useState<any>(null);
  const [allEmployees, setAllEmployees] = useState<EmployeeProfile[]>([]);
  const [selectedTeamId, setSelectedTeamId] = useState<number | null>(null);
  const [newMemberId, setNewMemberId] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchTeamDetail = useCallback(async (teamId: number) => {
    const res = await teamApi.getById(teamId);
    if (res.error) {
      showToast.error(res.message || "Không thể tải chi tiết nhóm");
      return;
    }
    setTeamDetail(res.team || null);
  }, []);

  const fetchInitialData = useCallback(async () => {
    setLoading(true);
    try {
      const [teamRes, employeeRes] = await Promise.all([
        teamApi.getManaged(),
        employeeApi.getManaged(),
      ]);

      const managedTeams: Team[] = teamRes?.teams || [];
      setTeams(managedTeams);

      if (!employeeRes.error) {
        setAllEmployees(employeeRes.employees || []);
      }

      if (managedTeams.length > 0) {
        const firstId = managedTeams[0].team_id;
        setSelectedTeamId(firstId);
        await fetchTeamDetail(firstId);
      }
    } catch {
      showToast.error("Không thể tải dữ liệu nhóm");
    } finally {
      setLoading(false);
    }
  }, [fetchTeamDetail]);

  useEffect(() => {
    fetchInitialData();
  }, [fetchInitialData]);

  const members = useMemo(() => {
    return (teamDetail?.members || []) as Array<any>;
  }, [teamDetail]);

  const availableEmployees = useMemo(() => {
    const memberIds = new Set(members.map((member) => member.user_id));
    return allEmployees.filter((employee) => !memberIds.has(employee.user_id) && employee.role !== "manager");
  }, [allEmployees, members]);

  const handleSelectTeam = async (teamId: number) => {
    setSelectedTeamId(teamId);
    setNewMemberId("");
    await fetchTeamDetail(teamId);
  };

  const handleAddMember = async () => {
    if (!selectedTeamId || !newMemberId) {
      showToast.error("Vui lòng chọn thành viên");
      return;
    }

    setSaving(true);
    try {
      const res = await teamApi.addMember(selectedTeamId, Number(newMemberId));
      if (res.error) {
        showToast.error(res.message || "Thêm thành viên thất bại");
        return;
      }

      showToast.success("Đã thêm thành viên vào nhóm");
      setNewMemberId("");
      await fetchTeamDetail(selectedTeamId);
    } catch {
      showToast.error("Thêm thành viên thất bại");
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveMember = async (userId: number) => {
    if (!selectedTeamId) return;

    setSaving(true);
    try {
      const res = await teamApi.removeMember(selectedTeamId, userId);
      if (res.error) {
        showToast.error(res.message || "Xóa thành viên thất bại");
        return;
      }

      showToast.success("Đã xóa thành viên khỏi nhóm");
      await fetchTeamDetail(selectedTeamId);
    } catch {
      showToast.error("Xóa thành viên thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center py-16">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý thành viên nhóm</h1>
        <p className="text-sm text-gray-500 mt-1">Theo dõi và cập nhật thành viên trong các nhóm bạn phụ trách.</p>
      </div>

      {teams.length === 0 ? (
        <div className="bg-white shadow rounded-lg py-12 text-center">
          <Users className="mx-auto h-10 w-10 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">Bạn chưa được phân công phụ trách nhóm nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="bg-white shadow rounded-lg p-4">
            <p className="text-xs font-semibold text-indigo-600 uppercase mb-3">Nhóm phụ trách</p>
            <div className="flex flex-wrap gap-2">
              {teams.map((team) => (
                <button
                  key={team.team_id}
                  onClick={() => handleSelectTeam(team.team_id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                    selectedTeamId === team.team_id
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  {team.name}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-5">
            <p className="text-sm font-semibold text-gray-800 mb-3">
              {teamDetail?.name || "Nhóm"} - {members.length} thành viên
            </p>

            <div className="space-y-1 mb-4 max-h-72 overflow-y-auto">
              {members.length === 0 && <p className="text-sm text-gray-400 italic">Chưa có thành viên</p>}
              {members.map((member: any) => (
                <div key={member.user_id} className="flex items-center justify-between px-3 py-2 rounded-md hover:bg-gray-50">
                  <div className="flex items-center gap-2.5">
                    <div className="h-7 w-7 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
                      <span className="text-xs font-semibold text-indigo-700">{member.User?.full_name?.charAt(0)?.toUpperCase()}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{member.User?.full_name}</p>
                      <p className="text-xs text-gray-400">{member.User?.company_email || "-"}</p>
                    </div>
                    {teamDetail?.leader_id === member.user_id && (
                      <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded-full font-medium">Trưởng nhóm</span>
                    )}
                  </div>
                  {/* <button
                    onClick={() => handleRemoveMember(member.user_id)}
                    disabled={saving || teamDetail?.leader_id === member.user_id}
                    className="text-red-400 hover:text-red-600 p-1 disabled:opacity-40"
                    title="Xóa khỏi nhóm"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button> */}
                </div>
              ))}
            </div>

            {/* <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
              <div className="relative flex-1 max-w-xs">
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
                <select
                  value={newMemberId}
                  onChange={(event) => setNewMemberId(event.target.value)}
                  className="w-full border border-gray-300 rounded-md px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 appearance-none"
                >
                  <option value="">- Chọn nhân viên để thêm -</option>
                  {availableEmployees.map((employee) => (
                    <option key={employee.user_id} value={employee.user_id}>
                      {employee.full_name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={handleAddMember}
                disabled={saving || !newMemberId}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 text-white text-sm rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                <UserPlus className="w-4 h-4" />
                {saving ? "Đang xử lý..." : "Thêm"}
              </button>
            </div> */}
          </div>
        </div>
      )}
    </div>
  );
}

export default withAuth(TeamLeadTeamPage);
