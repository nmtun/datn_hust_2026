"use client";

import { withAuth } from "@/app/middleware/withAuth";
import {
    Filter,
    Plus,
    Users,
    ClipboardList,
    CheckCircle2,
    AlertTriangle,
    MoreHorizontal,
    MessageSquare,
    Play
} from "lucide-react";

// --- MOCK DATA ---
const workloadData = [
    { name: "Sarah J.", points: 14, percent: 80, color: "bg-blue-600" },
    { name: "Mike T.", points: 12, percent: 70, color: "bg-blue-600" },
    { name: "Alex R.", points: 18, percent: 95, color: "bg-red-600" },
    { name: "Elena G.", points: 8, percent: 45, color: "bg-blue-600" },
    { name: "David C.", points: 10, percent: 60, color: "bg-blue-600" },
];

const actionTasks = [
    {
        title: "Tối ưu hóa API Endpoint",
        id: "ENG-402", priority: "Ưu tiên cao",
        assignee: "Sarah J.", avatarInitials: "SJ", avatarColor: "bg-indigo-100 text-indigo-700",
        status: "Bị chặn", statusColor: "bg-red-100 text-red-700"
    },
    {
        title: "Cập nhật Auth Middleware",
        id: "ENG-415", priority: "Ưu tiên trung bình",
        assignee: "Mike T.", avatarInitials: "MT", avatarColor: "bg-blue-100 text-blue-700",
        status: "Đang đánh giá", statusColor: "bg-gray-200 text-gray-700"
    },
    {
        title: "Script Migration Database",
        id: "ENG-418", priority: "Khẩn cấp",
        assignee: "Alex R.", avatarInitials: "AR", avatarColor: "bg-slate-200 text-slate-700",
        status: "Đang đánh giá", statusColor: "bg-gray-200 text-gray-700"
    },
];

const activities = [
    {
        type: "completed",
        user: "Elena G.", action: "đã hoàn thành công việc", task: "ENG-399",
        time: "10 phút trước",
        icon: <CheckCircle2 className="w-4 h-4 text-green-600" />,
        iconBg: "bg-green-100"
    },
    {
        type: "commented",
        user: "Sarah J.", action: "đã bình luận về", task: "ENG-402",
        time: "45 phút trước",
        comment: '"Cần phê duyệt schema mới trước khi tiếp tục."',
        icon: <MessageSquare className="w-4 h-4 text-gray-500" />,
        iconBg: "bg-gray-100"
    },
    {
        type: "moved",
        user: "Mike T.", action: "đã chuyển", task: "ENG-415", status: "Đang tiến hành",
        time: "2 giờ trước",
        icon: <Play className="w-4 h-4 text-blue-600 fill-current" />,
        iconBg: "bg-blue-100"
    }
];

function TeamLeadDashboard() {
    const currentDate = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển</h1>
                    <p className="text-sm text-gray-500 mt-1 capitalize">{currentDate}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                        <Filter className="w-4 h-4" />
                        Bộ lọc
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm">
                        <Plus className="w-4 h-4" />
                        Giao việc
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Capacity */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm border-t-4 border-t-blue-600 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Năng lực nhóm</p>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold text-gray-900 mb-2">12<span className="text-2xl text-gray-400">/14</span></h2>
                        <div className="flex items-center gap-3 text-sm text-gray-600">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span> Đang làm việc</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-orange-400"></span> 2 Vắng mặt</span>
                        </div>
                    </div>
                </div>

                {/* Current Sprint */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm border-t-4 border-t-indigo-500 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Sprint hiện tại</p>
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <ClipboardList className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold text-gray-900 mb-2">86</h2>
                        <p className="text-sm text-gray-500">Công việc đã giao</p>
                    </div>
                </div>

                {/* Completed */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm border-t-4 border-t-green-500 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Đã hoàn thành</p>
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <CheckCircle2 className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold text-gray-900 mb-2">42</h2>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5">
                            <span className="text-green-600 font-medium flex items-center">
                                <svg className="w-3 h-3 mr-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                +15%
                            </span>
                            so với tuần trước
                        </p>
                    </div>
                </div>

                {/* Blockers */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm border-t-4 border-t-red-500 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Trở ngại</p>
                        <div className="p-2 bg-red-50 rounded-lg text-red-600">
                            <AlertTriangle className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold text-gray-900 mb-2">7</h2>
                        <p className="text-sm text-red-500 font-medium">Đang chờ đánh giá</p>
                    </div>
                </div>
            </div>

            {/* Middle Section: Burn-down & Workload */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Sprint Burn-down */}
                <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Biểu đồ Burn-down</h3>
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">Sprint 42 (Ngày 5/14)</span>
                    </div>
                    {/* Mock Burn-down Chart */}
                    <div className="relative h-56 w-full mt-4 flex flex-col justify-end border-b border-gray-200">
                        <svg viewBox="0 0 600 200" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                            {/* Ideal dashed line */}
                            <line x1="0" y1="10" x2="600" y2="190" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="6 6" />
                            {/* Actual progress line */}
                            <path
                                d="M 0 10 L 120 30 L 240 40 L 360 90 L 480 100"
                                fill="none"
                                stroke="#2563eb"
                                strokeWidth="5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            />
                        </svg>
                        <div className="absolute inset-0 border-l border-gray-200"></div>
                        {/* Grid lines */}
                        <div className="absolute inset-0 flex flex-col justify-between pb-6 pointer-events-none">
                            <div className="border-t border-gray-100 w-full h-0"></div>
                            <div className="border-t border-gray-100 w-full h-0"></div>
                            <div className="border-t border-gray-100 w-full h-0"></div>
                            <div className="border-t border-gray-100 w-full h-0"></div>
                        </div>
                        {/* X-Axis labels */}
                        <div className="flex justify-between text-xs text-gray-500 mt-2 px-1">
                            <span>Thứ 2</span>
                            <span>Thứ 3</span>
                            <span>Thứ 4</span>
                            <span>Thứ 5</span>
                            <span>Thứ 6</span>
                        </div>
                    </div>
                </div>

                {/* Workload */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Khối lượng công việc</h3>
                        <button className="text-gray-400 hover:text-gray-600">
                            <MoreHorizontal className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="space-y-5">
                        {workloadData.map((user, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-sm mb-1.5">
                                    <span className="font-medium text-gray-800">{user.name}</span>
                                    <span className="text-gray-600 font-mono text-xs">{user.points} điểm</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className={`${user.color} h-2 rounded-full`} style={{ width: `${user.percent}%` }}></div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Bottom Section: Action Required & Activity Feed */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Action Required Table */}
                <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Cần xử lý: Đánh giá</h3>
                        <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">Xem tất cả</a>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="pb-3 text-xs font-semibold text-gray-500 border-b border-gray-100 uppercase tracking-wider">Công việc</th>
                                    <th className="pb-3 text-xs font-semibold text-gray-500 border-b border-gray-100 uppercase tracking-wider">Phụ trách</th>
                                    <th className="pb-3 text-xs font-semibold text-gray-500 border-b border-gray-100 uppercase tracking-wider">Trạng thái</th>
                                    <th className="pb-3 text-xs font-semibold text-gray-500 border-b border-gray-100 uppercase tracking-wider text-right">Hành động</th>
                                </tr>
                            </thead>
                            <tbody>
                                {actionTasks.map((task, idx) => (
                                    <tr key={idx} className="group">
                                        <td className="py-4 border-b border-gray-50">
                                            <p className="font-medium text-gray-800 text-sm">{task.title}</p>
                                            <p className="text-xs text-gray-500 mt-0.5">{task.id} • {task.priority}</p>
                                        </td>
                                        <td className="py-4 border-b border-gray-50">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${task.avatarColor}`}>
                                                    {task.avatarInitials}
                                                </div>
                                                <span className="text-sm text-gray-700">{task.assignee}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 border-b border-gray-50">
                                            <span className={`inline-flex px-2.5 py-1 text-xs font-medium rounded-full ${task.statusColor}`}>
                                                {task.status}
                                            </span>
                                        </td>
                                        <td className="py-4 border-b border-gray-50 text-right">
                                            {/* Placeholder for action buttons if needed */}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Activity Feed */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Hoạt động gần đây</h3>
                    <div className="relative border-l-2 border-gray-100 ml-3 space-y-6">
                        {activities.map((activity, idx) => (
                            <div key={idx} className="relative pl-6">
                                {/* Timeline Icon */}
                                <span className={`absolute -left-[13px] top-0.5 w-6 h-6 rounded-full flex items-center justify-center ring-4 ring-white ${activity.iconBg}`}>
                                    {activity.icon}
                                </span>

                                {/* Content */}
                                <div>
                                    <p className="text-sm text-gray-800">
                                        <span className="font-medium">{activity.user}</span> {activity.action} <span className="font-medium">{activity.task}</span>
                                        {activity.status && <span> sang <span className="font-medium">{activity.status}</span></span>}
                                    </p>

                                    {activity.comment && (
                                        <div className="mt-2 p-3 bg-gray-50 rounded-lg text-sm text-gray-600 border border-gray-100">
                                            {activity.comment}
                                        </div>
                                    )}

                                    <p className="text-xs text-gray-400 mt-1.5">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAuth(TeamLeadDashboard);