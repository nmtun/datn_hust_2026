"use client";

import { withAuth } from "@/app/middleware/withAuth";
import {
    Calendar, Briefcase, UserPlus,
    UserCheck, GraduationCap, Download, MoreHorizontal,
    AlertTriangle, Clock, MapPin, Video
} from "lucide-react";

// --- MOCK DATA ---
const statsData = [
    { title: "Vị trí đang mở", value: "42", subtitle: "Đang hoạt động", icon: Briefcase, color: "text-blue-600", bg: "bg-blue-100" },
    { title: "Ứng viên mới", value: "128", subtitle: "7 ngày qua", icon: UserPlus, color: "text-blue-500", bg: "bg-blue-50" },
    { title: "Tuyển mới tháng này", value: "15", subtitle: "+12%", icon: UserCheck, color: "text-indigo-600", bg: "bg-indigo-100" },
    { title: "Hoàn thành đào tạo", value: "94%", subtitle: "Tiến độ", icon: GraduationCap, color: "text-emerald-600", bg: "bg-emerald-100" },
];

const funnelData = [
    { stage: "Đã ứng tuyển", count: 450, width: "100%", color: "bg-blue-200" },
    { stage: "Sàng lọc", count: 340, width: "80%", color: "bg-blue-400" },
    { stage: "Phỏng vấn", count: 180, width: "50%", color: "bg-blue-500" },
    { stage: "Đề nghị", count: 68, width: "25%", color: "bg-blue-600" },
    { stage: "Đã tuyển", count: 35, width: "15%", color: "bg-blue-700" },
];

const recentCandidates = [
    { name: "Sarah Jenkins", role: "UX Designer", status: "Sàng lọc", date: "24 Thg 10", statusColor: "bg-blue-100 text-blue-700" },
    { name: "Michael Chen", role: "DevOps Eng.", status: "Đã gửi đề nghị", date: "22 Thg 10", statusColor: "bg-green-100 text-green-700" },
    { name: "Aisha Patel", role: "Product Mgr", status: "Phỏng vấn", date: "21 Thg 10", statusColor: "bg-purple-100 text-purple-700" },
    { name: "David Rodriguez", role: "Sales Rep", status: "Đã ứng tuyển", date: "20 Thg 10", statusColor: "bg-gray-100 text-gray-700" },
    { name: "Emma Wilson", role: "Data Analyst", status: "Từ chối", date: "19 Thg 10", statusColor: "bg-red-100 text-red-700" },
];

const upcomingInterviews = [
    { time: "10:00 SA", name: "Jason Lee", role: "Senior Frontend Engineer", type: "Zoom Link", isVideo: true },
    { time: "02:30 CH", name: "Maria Garcia", role: "Marketing Director", type: "Phòng 4B", isVideo: false },
    { time: "09:15 SA", name: "Kevin Smith", role: "HR Business Partner", type: "Google Meet", isVideo: true },
];

const overdueTraining = [
    { name: "Tom Baker", course: "Cơ bản về An ninh mạng", days: "Trễ 14 ngày" },
    { name: "Lisa Jones", course: "Quy tắc Ứng xử 2024", days: "Trễ 5 ngày" },
    { name: "Marcus Wright", course: "Đánh giá Tuân thủ Q3", days: "Trễ 2 ngày" },
];

function HrDashboard() {
    const currentDate = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    return (
        <div className="font-sans text-slate-800 space-y-6">

            {/* Header Content */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 mb-2">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Bảng điều khiển</h1>
                    <p className="text-sm text-gray-500 mt-1 capitalize">{currentDate}</p>
                </div>
                <button className="flex items-center bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 py-2 px-4 rounded-md text-sm font-medium transition-colors shadow-sm">
                    <Download className="w-4 h-4 mr-2" />
                    Xuất Báo Cáo
                </button>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsData.map((stat, idx) => (
                    <div key={idx} className="bg-white rounded-xl p-5 shadow-sm border border-slate-100 flex flex-col relative overflow-hidden">
                        <div className="border-t-4 border-blue-500 absolute top-0 left-0 right-0 rounded-t-xl opacity-50" />
                        <div className="flex justify-between items-start mb-4">
                            <span className="text-sm font-semibold text-slate-500 uppercase tracking-wider">{stat.title}</span>
                            <div className={`${stat.bg} p-2 rounded-lg`}>
                                <stat.icon className={`w-5 h-5 ${stat.color}`} />
                            </div>
                        </div>
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-bold text-slate-900">{stat.value}</span>
                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${stat.bg} ${stat.color}`}>{stat.subtitle}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Middle Section: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Funnel Chart */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 lg:col-span-2">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Phễu Tuyển Dụng Ứng Viên</h3>
                        <button><MoreHorizontal className="text-slate-400 hover:text-slate-600" /></button>
                    </div>
                    <div className="space-y-4">
                        {funnelData.map((item, idx) => (
                            <div key={idx} className="flex items-center text-sm">
                                <div className="w-24 text-slate-600 font-medium text-right pr-4">{item.stage}</div>
                                <div className="flex-1 bg-slate-50 rounded-r-md h-8 flex items-center relative">
                                    <div className={`${item.color} h-full rounded-r-md flex items-center px-3 text-slate-800 font-semibold text-xs`} style={{ width: item.width }}>
                                        {item.count}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Hiring Trend */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100 flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-bold text-slate-800">Xu Hướng (6 Tháng)</h3>
                        <select className="text-xs border-slate-200 rounded-md bg-slate-50 p-1 outline-none">
                            <option>Tất cả phòng ban</option>
                        </select>
                    </div>
                    <div className="flex-1 border-b border-l border-slate-200 relative flex items-end justify-between px-2 pb-2 mt-4">
                        <span className="text-xs text-slate-400 absolute -bottom-5 left-2">Th1</span>
                        <span className="text-xs text-slate-400 absolute -bottom-5 left-1/4">Th2</span>
                        <span className="text-xs text-slate-400 absolute -bottom-5 left-2/4">Th3</span>
                        <span className="text-xs text-slate-400 absolute -bottom-5 left-3/4">Th4</span>
                        <span className="text-xs text-slate-400 absolute -bottom-5 right-2">Th5</span>
                        <div className="w-8 bg-blue-800 h-1/4 rounded-t-sm absolute right-2 bottom-0 flex items-center justify-center">
                            <span className="text-[10px] text-white font-bold -mt-6 bg-slate-800 px-1 rounded">15</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Recent Candidates */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Ứng Viên Gần Đây</h3>
                        <a href="#" className="text-sm font-semibold text-blue-600 hover:text-blue-800">Xem tất cả</a>
                    </div>
                    <div className="space-y-5">
                        {recentCandidates.map((candidate, idx) => (
                            <div key={idx} className="flex justify-between items-center">
                                <div>
                                    <p className="font-semibold text-sm text-slate-900">{candidate.name}</p>
                                    <p className="text-xs text-slate-500">{candidate.role}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full ${candidate.statusColor}`}>
                                        {candidate.status}
                                    </span>
                                    <span className="text-xs text-slate-400 w-12 text-right">{candidate.date}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Upcoming Interviews */}
                <div className="bg-white rounded-xl p-6 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-bold text-slate-800">Phỏng Vấn Sắp Tới</h3>
                        <Calendar className="text-slate-400 w-5 h-5" />
                    </div>

                    <p className="text-xs font-bold text-slate-400 uppercase mb-4">Hôm nay</p>
                    <div className="space-y-4 mb-6">
                        {upcomingInterviews.slice(0, 2).map((interview, idx) => (
                            <div key={idx} className="flex gap-4 items-start">
                                <div className="bg-blue-50 text-blue-700 rounded-lg p-2 text-center min-w-[60px]">
                                    <p className="text-sm font-bold">{interview.time.split(" ")[0]}</p>
                                    <p className="text-[10px] font-semibold">{interview.time.split(" ")[1]}</p>
                                </div>
                                <div>
                                    <p className="font-semibold text-sm text-slate-900">{interview.name}</p>
                                    <p className="text-xs text-slate-500">{interview.role}</p>
                                    <p className="text-xs text-blue-600 mt-1 flex items-center gap-1 font-medium">
                                        {interview.isVideo ? <Video className="w-3 h-3" /> : <MapPin className="w-3 h-3" />}
                                        {interview.type}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    <p className="text-xs font-bold text-slate-400 uppercase mb-4 border-t pt-4">Ngày mai</p>
                    <div className="flex gap-4 items-start">
                        <div className="bg-slate-100 text-slate-700 rounded-lg p-2 text-center min-w-[60px]">
                            <p className="text-sm font-bold">{upcomingInterviews[2].time.split(" ")[0]}</p>
                            <p className="text-[10px] font-semibold">{upcomingInterviews[2].time.split(" ")[1]}</p>
                        </div>
                        <div>
                            <p className="font-semibold text-sm text-slate-900">{upcomingInterviews[2].name}</p>
                            <p className="text-xs text-slate-500">{upcomingInterviews[2].role}</p>
                        </div>
                    </div>
                </div>

                {/* Overdue Training */}
                <div className="bg-red-50 rounded-xl p-6 shadow-sm border border-red-100">
                    <div className="flex justify-between items-center mb-6">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="text-red-600 w-5 h-5" />
                            <h3 className="text-lg font-bold text-red-700">Đào Tạo Quá Hạn</h3>
                        </div>
                        <span className="bg-red-600 text-white text-xs font-bold px-2 py-1 rounded-md">3 Cảnh báo</span>
                    </div>

                    <div className="space-y-3">
                        {overdueTraining.map((training, idx) => (
                            <div key={idx} className="bg-white rounded-lg p-3 flex items-center border-l-4 border-red-500 shadow-sm">
                                <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-xs font-bold text-slate-600 mr-3">
                                    {training.name.split(" ").map(n => n[0]).join("")}
                                </div>
                                <div className="flex-1">
                                    <p className="font-semibold text-sm text-slate-900">{training.name}</p>
                                    <p className="text-xs text-slate-500 truncate">{training.course}</p>
                                    <p className="text-[10px] font-semibold text-red-600 flex items-center mt-1">
                                        <Clock className="w-3 h-3 mr-1" /> {training.days}
                                    </p>
                                </div>
                                <button className="text-xs font-semibold text-blue-600 hover:text-blue-800 bg-blue-50 px-2 py-1 rounded">
                                    Nhắc nhở
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    );
}

export default withAuth(HrDashboard);