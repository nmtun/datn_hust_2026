/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  Plus,
  FolderKanban,
  ListTodo,
  CircleCheck,
  MessageSquare,
  GitPullRequestArrow,
  Save,
  X,
  Trash2,
  Pencil,
  Eye,
  RefreshCcw,
  UserRound,
  ChevronDown,
  ChevronRight,
} from "lucide-react";
import Modal from "@/app/components/Modal";
import { showToast } from "@/app/utils/toast";
import { useAuth } from "@/app/context/AuthContext";
import { projectApi, Project, ProjectStatus } from "@/app/api/projectApi";
import {
  CreateTaskPayload,
  Task,
  taskApi,
  TaskPriority,
  TaskReviewDecision,
  TaskStatus,
  UpdateTaskPayload,
} from "@/app/api/taskApi";
import { employeeApi, EmployeeProfile } from "@/app/api/employeeApi";
import { Team, teamApi } from "@/app/api/teamApi";
import { Department, departmentApi } from "@/app/api/departmentApi";

type RoleMode = "manager" | "department_head" | "team_lead" | "employee";

type TaskFormState = {
  title: string;
  description: string;
  project_id: string;
  department_id: string;
  assigned_to: string;
  parent_task_id: string;
  team_id: string;
  start_date: string;
  due_date: string;
  priority: TaskPriority;
  status: TaskStatus;
};

type ProjectFormState = {
  name: string;
  goal: string;
  description: string;
  start_date: string;
  end_date: string;
  status: ProjectStatus;
};

const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  to_do: "To do",
  doing: "Doing",
  review: "Review",
  done: "Done",
};

const TASK_STATUS_BADGE: Record<TaskStatus, string> = {
  to_do: "bg-slate-100 text-slate-700",
  doing: "bg-blue-100 text-blue-700",
  review: "bg-amber-100 text-amber-800",
  done: "bg-emerald-100 text-emerald-700",
};

const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  to_do: "To do",
  doing: "Doing",
  review: "Review",
  done: "Done",
  on_hold: "On hold",
  cancelled: "Cancelled",
};

const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "Thấp",
  medium: "Trung bình",
  high: "Cao",
  urgent: "Khẩn cấp",
};

const PRIORITY_BADGE: Record<TaskPriority, string> = {
  low: "bg-gray-100 text-gray-700",
  medium: "bg-indigo-100 text-indigo-700",
  high: "bg-orange-100 text-orange-700",
  urgent: "bg-red-100 text-red-700",
};

const STATUS_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  to_do: ["doing"],
  doing: ["review"],
  review: ["doing", "done"],
  done: [],
};

const EMPTY_TASK_FORM: TaskFormState = {
  title: "",
  description: "",
  project_id: "",
  department_id: "",
  assigned_to: "",
  parent_task_id: "",
  team_id: "",
  start_date: "",
  due_date: "",
  priority: "medium",
  status: "to_do",
};

const EMPTY_PROJECT_FORM: ProjectFormState = {
  name: "",
  goal: "",
  description: "",
  start_date: "",
  end_date: "",
  status: "to_do",
};

const toDateInput = (value?: string | null) => {
  if (!value) return "";
  return value.includes("T") ? value.split("T")[0] : value;
};

const toDisplayDate = (value?: string | null) => {
  if (!value) return "-";
  try {
    return new Date(value).toLocaleDateString("vi-VN");
  } catch {
    return value;
  }
};

const getTaskTitleByRole = (roleMode: RoleMode) => {
  if (roleMode === "manager") return "Điều phối công việc toàn dự án";
  if (roleMode === "department_head") return "Phân việc cho trưởng nhóm";
  if (roleMode === "team_lead") return "Phân việc cho thành viên";
  return "Công việc của tôi";
};

export default function TaskWorkspace({ roleMode }: { roleMode: RoleMode }) {
  const { user } = useAuth();
  const currentUserId = Number(user?.user_id || 0);

  const canManageProjects = roleMode === "manager";
  const canCreateTask = roleMode !== "employee";

  const [activeTab, setActiveTab] = useState<"projects" | "tasks">("tasks");

  const [projects, setProjects] = useState<Project[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<EmployeeProfile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);

  const [loadingRefs, setLoadingRefs] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);

  const [taskFilterProject, setTaskFilterProject] = useState("");
  const [taskFilterStatus, setTaskFilterStatus] = useState("");

  const [taskModalOpen, setTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [taskForm, setTaskForm] = useState<TaskFormState>({ ...EMPTY_TASK_FORM });
  const [savingTask, setSavingTask] = useState(false);

  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [projectForm, setProjectForm] = useState<ProjectFormState>({ ...EMPTY_PROJECT_FORM });
  const [savingProject, setSavingProject] = useState(false);

  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [loadingTaskDetail, setLoadingTaskDetail] = useState(false);

  const [commentText, setCommentText] = useState("");
  const [savingComment, setSavingComment] = useState(false);

  const [reviewDecision, setReviewDecision] = useState<TaskReviewDecision>("approved");
  const [reviewNote, setReviewNote] = useState("");
  const [savingReview, setSavingReview] = useState(false);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<number>>(new Set());

  const [updatingStatusId, setUpdatingStatusId] = useState<number | null>(null);

  const departmentHeadUserIds = useMemo(
    () => new Set(departments.map((department) => department.manager_id).filter(Boolean) as number[]),
    [departments]
  );

  const teamLeadUserIds = useMemo(
    () => new Set(teams.map((team) => team.leader_id).filter(Boolean) as number[]),
    [teams]
  );

  const managerDepartments = useMemo(
    () => departments.filter((department) => Boolean(department.manager_id)),
    [departments]
  );

  const selectedManagerDepartment = useMemo(() => {
    if (!taskForm.department_id) return null;
    return managerDepartments.find((department) => Number(department.department_id) === Number(taskForm.department_id)) || null;
  }, [managerDepartments, taskForm.department_id]);

  const assignableEmployees = useMemo(() => {
    if (!canCreateTask) return [];

    if (roleMode === "manager") {
      if (!selectedManagerDepartment?.manager_id) return [];
      return employees.filter((item) => item.user_id === Number(selectedManagerDepartment.manager_id) && departmentHeadUserIds.has(item.user_id));
    }

    if (roleMode === "department_head") {
      return employees.filter((item) => teamLeadUserIds.has(item.user_id));
    }

    return employees.filter(
      (item) =>
        item.user_id !== currentUserId &&
        item.role === "employee" &&
        (!item.hierarchy_role || item.hierarchy_role === "employee") &&
        !teamLeadUserIds.has(item.user_id)
    );
  }, [
    canCreateTask,
    currentUserId,
    departmentHeadUserIds,
    employees,
    roleMode,
    selectedManagerDepartment?.manager_id,
    teamLeadUserIds,
  ]);

  const availableParentTasks = useMemo(() => {
    if (roleMode === "manager") return [];
    if (!taskForm.project_id) return [];
    return tasks.filter(
      (item) =>
        Number(item.project_id) === Number(taskForm.project_id) &&
        Number(item.assigned_to) === Number(currentUserId) &&
        (!editingTask || Number(item.task_id) !== Number(editingTask.task_id))
    );
  }, [currentUserId, editingTask, roleMode, taskForm.project_id, tasks]);

  const taskStat = useMemo(() => {
    const summary: Record<TaskStatus, number> = {
      to_do: 0,
      doing: 0,
      review: 0,
      done: 0,
    };

    tasks.forEach((item) => {
      summary[item.status] += 1;
    });

    return summary;
  }, [tasks]);

  const taskIds = useMemo(() => new Set(tasks.map((item) => Number(item.task_id))), [tasks]);

  const taskChildrenMap = useMemo(() => {
    const map = new Map<number, Task[]>();

    tasks.forEach((item) => {
      if (!item.parent_task_id) return;
      const parentId = Number(item.parent_task_id);
      const children = map.get(parentId) || [];
      children.push(item);
      map.set(parentId, children);
    });

    return map;
  }, [tasks]);

  const rootTasks = useMemo(() => {
    return tasks.filter((item) => !item.parent_task_id || !taskIds.has(Number(item.parent_task_id)));
  }, [taskIds, tasks]);

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const response = await projectApi.getAll();
      if (!response.error) {
        setProjects(response.projects || []);
      } else {
        showToast.error(response.message || "Không thể tải danh sách dự án");
      }
    } catch {
      showToast.error("Không thể tải danh sách dự án");
    } finally {
      setLoadingProjects(false);
    }
  }, []);

  const fetchReferences = useCallback(async () => {
    setLoadingRefs(true);
    try {
      if (!canCreateTask) {
        setEmployees([]);
        setTeams([]);
        setDepartments([]);
        return;
      }

      const employeePromise = roleMode === "manager" ? employeeApi.getAll() : employeeApi.getManaged();
      const teamPromise = roleMode === "manager" ? teamApi.getAll() : teamApi.getManaged();
      const departmentPromise = roleMode === "manager" ? departmentApi.getAll() : Promise.resolve({ error: false, departments: [] });

      const [employeeRes, teamRes, departmentRes] = await Promise.all([employeePromise, teamPromise, departmentPromise]);

      if (!employeeRes.error) {
        setEmployees(employeeRes.employees || []);
      }

      if (!teamRes.error) {
        setTeams(teamRes.teams || []);
      }

      if (!departmentRes.error) {
        setDepartments(departmentRes.departments || []);
      }
    } catch {
      showToast.error("Không thể tải dữ liệu nhân sự phụ trợ");
    } finally {
      setLoadingRefs(false);
    }
  }, [canCreateTask, roleMode]);

  const fetchTasks = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const params: any = {};
      if (taskFilterProject) params.project_id = Number(taskFilterProject);
      if (taskFilterStatus) params.status = taskFilterStatus;
      if (roleMode === "employee" && currentUserId) {
        params.assigned_to = currentUserId;
      }

      const response = await taskApi.getAll(params);
      if (!response.error) {
        setTasks(response.tasks || []);
      } else {
        showToast.error(response.message || "Không thể tải danh sách công việc");
      }
    } catch {
      showToast.error("Không thể tải danh sách công việc");
    } finally {
      setLoadingTasks(false);
    }
  }, [currentUserId, roleMode, taskFilterProject, taskFilterStatus]);

  useEffect(() => {
    fetchProjects();
    fetchReferences();
  }, [fetchProjects, fetchReferences]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    setExpandedTaskIds((prev) => {
      const next = new Set<number>();
      prev.forEach((taskId) => {
        if (taskIds.has(taskId)) next.add(taskId);
      });
      return next;
    });
  }, [taskIds]);

  const toggleTaskExpand = (taskId: number) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const canEditTask = (task: Task) => {
    if (roleMode === "manager") return true;
    return Number(task.created_by) === currentUserId;
  };

  const canChangeStatus = (task: Task) => {
    if (roleMode === "manager") return true;
    return Number(task.created_by) === currentUserId || Number(task.assigned_to) === currentUserId;
  };

  const canReviewTask = (task: Task) => {
    if (task.status !== "review") return false;
    if (roleMode === "employee") return false;
    if (roleMode === "manager") return Number(task.assigned_to) !== currentUserId;
    return Number(task.assigned_to) !== currentUserId;
  };

  const openCreateTask = () => {
    if (!canCreateTask) {
      showToast.error("Bạn không có quyền giao việc");
      return;
    }

    if (projects.length === 0) {
      showToast.error("Chưa có dự án để tạo công việc");
      return;
    }

    setEditingTask(null);

    if (roleMode === "manager") {
      if (managerDepartments.length === 0) {
        showToast.error("Chưa có phòng ban có trưởng phòng để giao việc");
        return;
      }

      const firstDepartment = managerDepartments[0];
      const firstDepartmentHeadId = firstDepartment.manager_id ? String(firstDepartment.manager_id) : "";

      setTaskForm({
        ...EMPTY_TASK_FORM,
        project_id: String(projects[0].project_id),
        department_id: String(firstDepartment.department_id),
        assigned_to: firstDepartmentHeadId,
        start_date: toDateInput(new Date().toISOString()),
      });
      setTaskModalOpen(true);
      return;
    }

    if (assignableEmployees.length === 0) {
      showToast.error("Chưa có người nhận việc trong phạm vi của bạn");
      return;
    }

    setTaskForm({
      ...EMPTY_TASK_FORM,
      project_id: String(projects[0].project_id),
      assigned_to: String(assignableEmployees[0].user_id),
      start_date: toDateInput(new Date().toISOString()),
    });
    setTaskModalOpen(true);
  };

  const openEditTask = (task: Task) => {
    if (!canEditTask(task)) {
      showToast.error("Bạn chỉ sửa được task do mình tạo");
      return;
    }

    const inferredDepartment = roleMode === "manager"
      ? managerDepartments.find((department) => Number(department.manager_id) === Number(task.assigned_to))
      : null;

    setEditingTask(task);
    setTaskForm({
      title: task.title || "",
      description: task.description || "",
      project_id: String(task.project_id || ""),
      department_id: inferredDepartment ? String(inferredDepartment.department_id) : "",
      assigned_to: String(task.assigned_to || ""),
      parent_task_id: task.parent_task_id ? String(task.parent_task_id) : "",
      team_id: task.team_id ? String(task.team_id) : "",
      start_date: toDateInput(task.start_date),
      due_date: toDateInput(task.due_date),
      priority: task.priority || "medium",
      status: task.status || "to_do",
    });
    setTaskModalOpen(true);
  };

  const saveTask = async () => {
    if (!taskForm.title.trim()) {
      showToast.error("Vui lòng nhập tiêu đề công việc");
      return;
    }
    if (!taskForm.project_id) {
      showToast.error("Vui lòng chọn dự án");
      return;
    }
    if (!taskForm.assigned_to) {
      showToast.error("Vui lòng chọn người nhận việc");
      return;
    }

    if (roleMode === "manager" && !taskForm.department_id) {
      showToast.error("Manager phải chọn phòng ban phụ trách");
      return;
    }

    if (roleMode === "manager" && taskForm.parent_task_id) {
      showToast.error("Manager chỉ giao task lớn (task cha để trống) cho trưởng phòng");
      return;
    }

    if ((roleMode === "department_head" || roleMode === "team_lead") && !taskForm.parent_task_id) {
      showToast.error("Vui lòng chọn task cha đã giao cho bạn trước khi phân rã task");
      return;
    }

    setSavingTask(true);
    try {
      const payload: CreateTaskPayload | UpdateTaskPayload = {
        title: taskForm.title.trim(),
        description: taskForm.description.trim() || undefined,
        project_id: Number(taskForm.project_id),
        department_id: taskForm.department_id ? Number(taskForm.department_id) : undefined,
        assigned_to: Number(taskForm.assigned_to),
        parent_task_id: taskForm.parent_task_id ? Number(taskForm.parent_task_id) : undefined,
        team_id: taskForm.team_id ? Number(taskForm.team_id) : undefined,
        start_date: taskForm.start_date || undefined,
        due_date: taskForm.due_date || undefined,
        priority: taskForm.priority,
        status: taskForm.status,
      } as CreateTaskPayload;

      const response = editingTask
        ? await taskApi.update(editingTask.task_id, payload as UpdateTaskPayload)
        : await taskApi.create(payload as CreateTaskPayload);

      if (response.error) {
        showToast.error(response.message || "Không thể lưu công việc");
        return;
      }

      showToast.success(editingTask ? "Cập nhật công việc thành công" : "Tạo công việc thành công");
      setTaskModalOpen(false);
      setEditingTask(null);
      await fetchTasks();
    } catch {
      showToast.error("Không thể lưu công việc");
    } finally {
      setSavingTask(false);
    }
  };

  const removeTask = async (task: Task) => {
    if (!canEditTask(task)) {
      showToast.error("Bạn chỉ xóa được task do mình tạo");
      return;
    }

    const confirmed = window.confirm(`Xóa công việc ${task.title}?`);
    if (!confirmed) return;

    try {
      const response = await taskApi.delete(task.task_id);
      if (response.error) {
        showToast.error(response.message || "Không thể xóa công việc");
        return;
      }
      showToast.success("Đã xóa công việc");
      await fetchTasks();
    } catch {
      showToast.error("Không thể xóa công việc");
    }
  };

  const changeTaskStatus = async (task: Task, nextStatus: TaskStatus) => {
    if (!canChangeStatus(task)) {
      showToast.error("Bạn không có quyền đổi trạng thái task này");
      return;
    }

    setUpdatingStatusId(task.task_id);
    try {
      const response = await taskApi.updateStatus(task.task_id, nextStatus);
      if (response.error) {
        showToast.error(response.message || "Không thể cập nhật trạng thái");
        return;
      }
      showToast.success("Đã cập nhật trạng thái công việc");
      await fetchTasks();

      if (viewTask && viewTask.task_id === task.task_id) {
        await openTaskDetail(task.task_id);
      }
    } catch {
      showToast.error("Không thể cập nhật trạng thái");
    } finally {
      setUpdatingStatusId(null);
    }
  };

  const openTaskDetail = async (taskId: number) => {
    setLoadingTaskDetail(true);
    setViewTask(null);

    try {
      const response = await taskApi.getById(taskId);
      if (response.error) {
        showToast.error(response.message || "Không thể tải chi tiết công việc");
        return;
      }
      setViewTask(response.task || null);
    } catch {
      showToast.error("Không thể tải chi tiết công việc");
    } finally {
      setLoadingTaskDetail(false);
    }
  };

  const saveComment = async () => {
    if (!viewTask) return;
    if (!commentText.trim()) {
      showToast.error("Vui lòng nhập nội dung comment");
      return;
    }

    setSavingComment(true);
    try {
      const response = await taskApi.addComment(viewTask.task_id, commentText.trim());
      if (response.error) {
        showToast.error(response.message || "Không thể thêm comment");
        return;
      }
      setCommentText("");
      showToast.success("Đã thêm comment");
      await openTaskDetail(viewTask.task_id);
      await fetchTasks();
    } catch {
      showToast.error("Không thể thêm comment");
    } finally {
      setSavingComment(false);
    }
  };

  const submitReview = async () => {
    if (!viewTask) return;
    if (!canReviewTask(viewTask)) {
      showToast.error("Bạn không có quyền review task này");
      return;
    }

    setSavingReview(true);
    try {
      const response = await taskApi.createReview(viewTask.task_id, {
        decision: reviewDecision,
        note: reviewNote.trim() || undefined,
      });

      if (response.error) {
        showToast.error(response.message || "Không thể gửi review");
        return;
      }

      showToast.success("Đã gửi review task");
      setReviewNote("");
      await openTaskDetail(viewTask.task_id);
      await fetchTasks();
    } catch {
      showToast.error("Không thể gửi review");
    } finally {
      setSavingReview(false);
    }
  };

  const openCreateProject = () => {
    if (!canManageProjects) return;
    setEditingProject(null);
    setProjectForm({ ...EMPTY_PROJECT_FORM, start_date: toDateInput(new Date().toISOString()) });
    setProjectModalOpen(true);
  };

  const openEditProject = (project: Project) => {
    if (!canManageProjects) return;

    setEditingProject(project);
    setProjectForm({
      name: project.name || "",
      goal: project.goal || "",
      description: project.description || "",
      start_date: toDateInput(project.start_date),
      end_date: toDateInput(project.end_date),
      status: project.status || "to_do",
    });
    setProjectModalOpen(true);
  };

  const saveProject = async () => {
    if (!projectForm.name.trim()) {
      showToast.error("Vui lòng nhập tên dự án");
      return;
    }

    setSavingProject(true);
    try {
      const payload = {
        name: projectForm.name.trim(),
        goal: projectForm.goal.trim() || undefined,
        description: projectForm.description.trim() || undefined,
        start_date: projectForm.start_date || undefined,
        end_date: projectForm.end_date || undefined,
        status: projectForm.status,
      };

      const response = editingProject
        ? await projectApi.update(editingProject.project_id, payload)
        : await projectApi.create(payload);

      if (response.error) {
        showToast.error(response.message || "Không thể lưu dự án");
        return;
      }

      showToast.success(editingProject ? "Cập nhật dự án thành công" : "Tạo dự án thành công");
      setProjectModalOpen(false);
      setEditingProject(null);
      await fetchProjects();
    } catch {
      showToast.error("Không thể lưu dự án");
    } finally {
      setSavingProject(false);
    }
  };

  const removeProject = async (project: Project) => {
    if (!canManageProjects) return;

    const confirmed = window.confirm(`Xóa dự án ${project.name}?`);
    if (!confirmed) return;

    try {
      const response = await projectApi.delete(project.project_id);
      if (response.error) {
        showToast.error(response.message || "Không thể xóa dự án");
        return;
      }

      showToast.success("Đã xóa dự án");
      await Promise.all([fetchProjects(), fetchTasks()]);
    } catch {
      showToast.error("Không thể xóa dự án");
    }
  };

  const renderTaskStatusOptions = (task: Task) => {
    const nextStatuses = STATUS_TRANSITIONS[task.status] || [];
    if (!canChangeStatus(task) || nextStatuses.length === 0) return null;

    return (
      <div className="flex items-center gap-2">
        <select
          defaultValue=""
          onChange={(event) => {
            const value = event.target.value as TaskStatus;
            if (!value) return;
            changeTaskStatus(task, value);
            event.target.value = "";
          }}
          className="border border-gray-300 rounded-md px-2 py-1 text-xs"
          disabled={updatingStatusId === task.task_id}
        >
          <option value="">Chuyển trạng thái</option>
          {nextStatuses.map((status) => (
            <option key={status} value={status}>
              {TASK_STATUS_LABELS[status]}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const renderTaskRows = (items: Task[], level = 0): ReactNode[] => {
    return items.flatMap((task) => {
      const taskId = Number(task.task_id);
      const subTasks = taskChildrenMap.get(taskId) || [];
      const hasSubTasks = subTasks.length > 0;
      const isExpanded = expandedTaskIds.has(taskId);

      const row = (
        <tr key={task.task_id} className="hover:bg-gray-50">
          <td className="px-4 py-3">
            <div className="flex items-start gap-2" style={{ paddingLeft: `${level * 18}px` }}>
              {hasSubTasks ? (
                <button
                  onClick={() => toggleTaskExpand(taskId)}
                  className="mt-0.5 text-gray-400 hover:text-indigo-600"
                  title={isExpanded ? "Thu gọn sub task" : "Mở rộng sub task"}
                >
                  {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              ) : (
                <span className="w-4 h-4 mt-0.5" />
              )}

              <div>
                <p className="text-sm font-medium text-gray-900">{task.title}</p>
                {task.parent_task_id ? (
                  <p className="text-xs text-gray-400 mt-0.5">Sub task của #{task.parent_task_id}</p>
                ) : (
                  <p className="text-xs text-gray-400 mt-0.5">Task chính</p>
                )}
              </div>
            </div>
          </td>
          <td className="px-4 py-3 text-sm text-gray-700">{task.project?.name || `#${task.project_id}`}</td>
          <td className="px-4 py-3">
            <p className="text-sm text-gray-800">{task.assignee?.full_name || `#${task.assigned_to}`}</p>
            <p className="text-xs text-gray-400">Tạo bởi {task.creator?.full_name || `#${task.created_by}`}</p>
          </td>
          <td className="px-4 py-3">
            <span className={`px-2 py-1 text-xs rounded-full ${PRIORITY_BADGE[task.priority]}`}>
              {PRIORITY_LABELS[task.priority]}
            </span>
          </td>
          <td className="px-4 py-3">
            <div className="space-y-2">
              <span className={`px-2 py-1 text-xs rounded-full ${TASK_STATUS_BADGE[task.status]}`}>
                {TASK_STATUS_LABELS[task.status]}
              </span>
              {renderTaskStatusOptions(task)}
            </div>
          </td>
          <td className="px-4 py-3 text-sm text-gray-700">{toDisplayDate(task.due_date)}</td>
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <button
                onClick={() => openTaskDetail(task.task_id)}
                className="text-gray-400 hover:text-indigo-600"
                title="Chi tiết"
              >
                <Eye className="w-4 h-4" />
              </button>

              {canEditTask(task) && (
                <button onClick={() => openEditTask(task)} className="text-gray-400 hover:text-blue-600" title="Sửa">
                  <Pencil className="w-4 h-4" />
                </button>
              )}

              {canEditTask(task) && (
                <button onClick={() => removeTask(task)} className="text-gray-400 hover:text-red-600" title="Xóa">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          </td>
        </tr>
      );

      if (!hasSubTasks || !isExpanded) {
        return [row];
      }

      return [row, ...renderTaskRows(subTasks, level + 1)];
    });
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý công việc</h1>
          <p className="text-sm text-gray-500 mt-1">{getTaskTitleByRole(roleMode)}</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTasks()}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-sm rounded-md border border-gray-300 bg-white hover:bg-gray-50"
          >
            <RefreshCcw className="w-4 h-4" />
            Làm mới
          </button>
          {canCreateTask && (
            <button
              onClick={openCreateTask}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4" />
              Giao việc
            </button>
          )}
          {canManageProjects && (
            <button
              onClick={openCreateProject}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-md bg-slate-900 text-white hover:bg-slate-800"
            >
              <FolderKanban className="w-4 h-4" />
              Tạo dự án
            </button>
          )}
        </div>
      </div>

      {canManageProjects && (
        <div className="bg-white rounded-lg shadow p-2 inline-flex gap-2">
          <button
            onClick={() => setActiveTab("tasks")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === "tasks" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
          >
            Task
          </button>
          <button
            onClick={() => setActiveTab("projects")}
            className={`px-4 py-2 rounded-md text-sm font-medium ${activeTab === "projects" ? "bg-indigo-600 text-white" : "text-gray-600 hover:bg-gray-100"}`}
          >
            Project
          </button>
        </div>
      )}

      {(activeTab === "tasks" || !canManageProjects) && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.keys(taskStat) as TaskStatus[]).map((status) => (
              <div key={status} className="bg-white rounded-lg shadow p-3">
                <p className="text-xs text-gray-500 uppercase">{TASK_STATUS_LABELS[status]}</p>
                <p className="mt-2 text-2xl font-semibold text-gray-900">{taskStat[status]}</p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex flex-col md:flex-row gap-3">
              <select
                value={taskFilterProject}
                onChange={(event) => setTaskFilterProject(event.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm md:min-w-[220px]"
              >
                <option value="">Tất cả dự án</option>
                {projects.map((project) => (
                  <option key={project.project_id} value={project.project_id}>
                    {project.name}
                  </option>
                ))}
              </select>

              <select
                value={taskFilterStatus}
                onChange={(event) => setTaskFilterStatus(event.target.value)}
                className="border border-gray-300 rounded-md px-3 py-2 text-sm md:min-w-[180px]"
              >
                <option value="">Tất cả trạng thái</option>
                {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {TASK_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            {loadingTasks ? (
              <div className="py-16 flex justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
              </div>
            ) : tasks.length === 0 ? (
              <div className="py-16 text-center">
                <ListTodo className="mx-auto w-10 h-10 text-gray-300" />
                <p className="mt-2 text-sm text-gray-500">Chưa có công việc phù hợp bộ lọc</p>
              </div>
            ) : (
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Tiêu đề",
                      "Dự án",
                      "Người nhận",
                      "Ưu tiên",
                      "Trạng thái",
                      "Hạn xử lý",
                      "Thao tác",
                    ].map((item) => (
                      <th key={item} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        {item}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {renderTaskRows(rootTasks)}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {activeTab === "projects" && canManageProjects && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {loadingProjects ? (
            <div className="py-16 flex justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
            </div>
          ) : projects.length === 0 ? (
            <div className="py-16 text-center">
              <FolderKanban className="mx-auto w-10 h-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">Chưa có dự án</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {[
                    "Tên dự án",
                    "Mục tiêu",
                    "Trạng thái",
                    "Bắt đầu",
                    "Kết thúc",
                    "Thao tác",
                  ].map((item) => (
                    <th key={item} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      {item}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {projects.map((project) => (
                  <tr key={project.project_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{project.name}</p>
                      {project.description && <p className="text-xs text-gray-400 mt-0.5 truncate max-w-[240px]">{project.description}</p>}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{project.goal || "-"}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 text-xs rounded-full bg-slate-100 text-slate-700">
                        {PROJECT_STATUS_LABELS[project.status]}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{toDisplayDate(project.start_date)}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{toDisplayDate(project.end_date)}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button onClick={() => openEditProject(project)} className="text-gray-400 hover:text-blue-600" title="Sửa">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button onClick={() => removeProject(project)} className="text-gray-400 hover:text-red-600" title="Xóa">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <Modal
        isOpen={taskModalOpen}
        onClose={() => {
          setTaskModalOpen(false);
          setEditingTask(null);
        }}
        title={editingTask ? `Cập nhật task: ${editingTask.title}` : "Giao công việc mới"}
      >
        <div className="space-y-4 p-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-600">Tiêu đề task *</label>
              <input
                type="text"
                value={taskForm.title}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, title: event.target.value }))}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Dự án *</label>
              <select
                value={taskForm.project_id}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, project_id: event.target.value, parent_task_id: "" }))}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">-- Chọn dự án --</option>
                {projects.map((project) => (
                  <option key={project.project_id} value={project.project_id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {roleMode === "manager" && (
              <div>
                <label className="text-xs font-medium text-gray-600">Phòng ban phụ trách *</label>
                <select
                  value={taskForm.department_id}
                  onChange={(event) => {
                    const nextDepartment = managerDepartments.find(
                      (department) => Number(department.department_id) === Number(event.target.value)
                    );

                    setTaskForm((prev) => ({
                      ...prev,
                      department_id: event.target.value,
                      assigned_to: nextDepartment?.manager_id ? String(nextDepartment.manager_id) : "",
                    }));
                  }}
                  className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">-- Chọn phòng ban --</option>
                  {managerDepartments.map((department) => (
                    <option key={department.department_id} value={department.department_id}>
                      {department.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-600">
                {roleMode === "manager" ? "Trưởng phòng nhận việc *" : "Người nhận việc *"}
              </label>
              <select
                value={taskForm.assigned_to}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, assigned_to: event.target.value }))}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                disabled={roleMode === "manager"}
              >
                <option value="">-- Chọn nhân sự --</option>
                {assignableEmployees.map((employee) => (
                  <option key={employee.user_id} value={employee.user_id}>
                    {employee.full_name}
                    {employee.hierarchy_role ? ` (${employee.hierarchy_role})` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Task cha</label>
              <select
                value={taskForm.parent_task_id}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, parent_task_id: event.target.value }))}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                disabled={roleMode === "manager"}
              >
                <option value="">-- {roleMode === "manager" ? "Chọn task" : "Chọn task cha"} --</option>
                {availableParentTasks.map((task) => (
                  <option key={task.task_id} value={task.task_id}>
                    {task.title}
                  </option>
                ))}
              </select>
              {roleMode === "manager" && (
                <p className="mt-1 text-[11px] text-gray-500">Manager chỉ giao task lớn cho trưởng phòng.</p>
              )}
              {(roleMode === "department_head" || roleMode === "team_lead") && (
                <p className="mt-1 text-[11px] text-gray-500">Bạn chỉ có thể chọn task cha đang được giao cho chính bạn.</p>
              )}
            </div>

            {roleMode !== "manager" && (
              <div>
                <label className="text-xs font-medium text-gray-600">Nhóm phụ trách</label>
                <select
                  value={taskForm.team_id}
                  onChange={(event) => setTaskForm((prev) => ({ ...prev, team_id: event.target.value }))}
                  className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                >
                  <option value="">-- Không chọn nhóm --</option>
                  {teams.map((team) => (
                    <option key={team.team_id} value={team.team_id}>
                      {team.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-gray-600">Ngày bắt đầu</label>
              <input
                type="date"
                value={taskForm.start_date}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, start_date: event.target.value }))}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Hạn xử lý</label>
              <input
                type="date"
                value={taskForm.due_date}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, due_date: event.target.value }))}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Ưu tiên</label>
              <select
                value={taskForm.priority}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, priority: event.target.value as TaskPriority }))}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {(Object.keys(PRIORITY_LABELS) as TaskPriority[]).map((priority) => (
                  <option key={priority} value={priority}>
                    {PRIORITY_LABELS[priority]}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Trạng thái ban đầu</label>
              <select
                value={taskForm.status}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, status: event.target.value as TaskStatus }))}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {(Object.keys(TASK_STATUS_LABELS) as TaskStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {TASK_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-600">Mô tả</label>
              <textarea
                value={taskForm.description}
                onChange={(event) => setTaskForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={3}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm resize-none"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setTaskModalOpen(false);
                setEditingTask(null);
              }}
              className="px-4 py-2 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <X className="inline w-4 h-4 mr-1" />
              Hủy
            </button>
            <button
              onClick={saveTask}
              disabled={savingTask || loadingRefs}
              className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="inline w-4 h-4 mr-1" />
              {savingTask ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={projectModalOpen}
        onClose={() => {
          setProjectModalOpen(false);
          setEditingProject(null);
        }}
        title={editingProject ? `Cập nhật dự án: ${editingProject.name}` : "Tạo dự án mới"}
      >
        <div className="space-y-4 p-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-600">Tên dự án *</label>
              <input
                type="text"
                value={projectForm.name}
                onChange={(event) => setProjectForm((prev) => ({ ...prev, name: event.target.value }))}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-600">Mục tiêu</label>
              <textarea
                value={projectForm.goal}
                onChange={(event) => setProjectForm((prev) => ({ ...prev, goal: event.target.value }))}
                rows={2}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm resize-none"
              />
            </div>

            <div className="md:col-span-2">
              <label className="text-xs font-medium text-gray-600">Mô tả</label>
              <textarea
                value={projectForm.description}
                onChange={(event) => setProjectForm((prev) => ({ ...prev, description: event.target.value }))}
                rows={3}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm resize-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Ngày bắt đầu</label>
              <input
                type="date"
                value={projectForm.start_date}
                onChange={(event) => setProjectForm((prev) => ({ ...prev, start_date: event.target.value }))}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Ngày kết thúc</label>
              <input
                type="date"
                value={projectForm.end_date}
                onChange={(event) => setProjectForm((prev) => ({ ...prev, end_date: event.target.value }))}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-gray-600">Trạng thái</label>
              <select
                value={projectForm.status}
                onChange={(event) => setProjectForm((prev) => ({ ...prev, status: event.target.value as ProjectStatus }))}
                className="w-full mt-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                {(Object.keys(PROJECT_STATUS_LABELS) as ProjectStatus[]).map((status) => (
                  <option key={status} value={status}>
                    {PROJECT_STATUS_LABELS[status]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              onClick={() => {
                setProjectModalOpen(false);
                setEditingProject(null);
              }}
              className="px-4 py-2 text-sm rounded-md bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              <X className="inline w-4 h-4 mr-1" />
              Hủy
            </button>
            <button
              onClick={saveProject}
              disabled={savingProject}
              className="px-4 py-2 text-sm rounded-md bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
            >
              <Save className="inline w-4 h-4 mr-1" />
              {savingProject ? "Đang lưu..." : "Lưu"}
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={loadingTaskDetail || !!viewTask}
        onClose={() => {
          setViewTask(null);
          setCommentText("");
          setReviewDecision("approved");
          setReviewNote("");
        }}
        title={viewTask ? `Chi tiết task: ${viewTask.title}` : "Đang tải..."}
      >
        {loadingTaskDetail ? (
          <div className="py-10 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600" />
          </div>
        ) : viewTask ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-xs text-gray-500">Dự án</p>
                <p className="text-sm font-medium mt-1">{viewTask.project?.name || `#${viewTask.project_id}`}</p>
              </div>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-xs text-gray-500">Trạng thái</p>
                <p className="text-sm font-medium mt-1">{TASK_STATUS_LABELS[viewTask.status]}</p>
              </div>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-xs text-gray-500">Người nhận</p>
                <p className="text-sm font-medium mt-1">{viewTask.assignee?.full_name || `#${viewTask.assigned_to}`}</p>
              </div>
              <div className="bg-gray-50 rounded-md p-3">
                <p className="text-xs text-gray-500">Hạn xử lý</p>
                <p className="text-sm font-medium mt-1">{toDisplayDate(viewTask.due_date)}</p>
              </div>
            </div>

            {viewTask.description && (
              <div>
                <p className="text-xs text-gray-500 mb-1">Mô tả</p>
                <div className="rounded-md border border-gray-200 p-3 text-sm text-gray-700 whitespace-pre-wrap">
                  {viewTask.description}
                </div>
              </div>
            )}

            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <MessageSquare className="w-4 h-4" />
                Comment ({viewTask.comments?.length || 0})
              </p>

              <div className="space-y-2 max-h-56 overflow-y-auto border border-gray-100 rounded-md p-2">
                {(viewTask.comments || []).length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Chưa có comment</p>
                ) : (
                  (viewTask.comments || []).map((comment) => (
                    <div key={comment.comment_id} className="bg-gray-50 rounded-md p-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800 flex items-center gap-1.5">
                          <UserRound className="w-3.5 h-3.5" />
                          {comment.author?.full_name || `#${comment.user_id}`}
                        </p>
                        <p className="text-xs text-gray-400">{toDisplayDate(comment.created_at)}</p>
                      </div>
                      <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{comment.comment}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-2 flex gap-2">
                <textarea
                  rows={2}
                  value={commentText}
                  onChange={(event) => setCommentText(event.target.value)}
                  className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm resize-none"
                  placeholder="Nhập comment..."
                />
                <button
                  onClick={saveComment}
                  disabled={savingComment}
                  className="self-end px-3 py-2 rounded-md text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                >
                  {savingComment ? "Đang gửi..." : "Gửi"}
                </button>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                <GitPullRequestArrow className="w-4 h-4" />
                Review ({viewTask.reviews?.length || 0})
              </p>

              <div className="space-y-2 border border-gray-100 rounded-md p-2">
                {(viewTask.reviews || []).length === 0 ? (
                  <p className="text-sm text-gray-400 italic">Chưa có review</p>
                ) : (
                  (viewTask.reviews || []).map((review) => (
                    <div key={review.review_id} className="bg-gray-50 rounded-md p-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800">
                          {review.reviewer?.full_name || `#${review.reviewer_id}`} - {review.decision === "approved" ? "Approved" : "Yêu cầu chỉnh sửa"}
                        </p>
                        <p className="text-xs text-gray-400">{toDisplayDate(review.created_at)}</p>
                      </div>
                      {review.note && <p className="text-sm text-gray-700 mt-1 whitespace-pre-wrap">{review.note}</p>}
                    </div>
                  ))
                )}
              </div>

              {canReviewTask(viewTask) && (
                <div className="mt-3 border border-indigo-100 bg-indigo-50 rounded-md p-3 space-y-2">
                  <p className="text-sm font-medium text-indigo-900">Thực hiện review task</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <select
                      value={reviewDecision}
                      onChange={(event) => setReviewDecision(event.target.value as TaskReviewDecision)}
                      className="border border-indigo-200 rounded-md px-3 py-2 text-sm"
                    >
                      <option value="approved">Approved</option>
                      <option value="changes_requested">Yêu cầu chỉnh sửa</option>
                    </select>
                    <input
                      value={reviewNote}
                      onChange={(event) => setReviewNote(event.target.value)}
                      className="border border-indigo-200 rounded-md px-3 py-2 text-sm"
                      placeholder="Ghi chú review"
                    />
                  </div>
                  <button
                    onClick={submitReview}
                    disabled={savingReview}
                    className="px-3 py-2 rounded-md text-sm bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {savingReview ? "Đang gửi review..." : "Gửi review"}
                  </button>
                </div>
              )}
            </div>

            {(viewTask.subTasks || []).length > 0 && (
              <div>
                <p className="text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
                  <CircleCheck className="w-4 h-4" />
                  Sub task ({viewTask.subTasks?.length || 0})
                </p>
                <div className="space-y-2">
                  {(viewTask.subTasks || []).map((subTask) => (
                    <div key={subTask.task_id} className="border border-gray-100 rounded-md p-2.5">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800">{subTask.title}</p>
                        <span className={`px-2 py-1 text-xs rounded-full ${TASK_STATUS_BADGE[subTask.status]}`}>
                          {TASK_STATUS_LABELS[subTask.status]}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mt-1">{subTask.assignee?.full_name || `#${subTask.assigned_to}`}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : null}
      </Modal>
    </div>
  );
}
