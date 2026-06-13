"use client";

import { withAuth } from "@/app/middleware/withAuth";
import {
    Calendar,
    Download,
    Users,
    Wallet,
    Zap,
    Briefcase,
    MoreVertical,
    AlertTriangle,
    Megaphone,
    CheckCircle2,
    ArrowRight
} from "lucide-react";

// --- MOCK DATA (Đã Việt hóa) ---
const resourceData = [
    { name: "Frontend Core", hours: "1.240", billable: 50, project: 30, nonBillable: 20 },
    { name: "Backend Infra", hours: "1.180", billable: 60, project: 35, nonBillable: 5 },
    { name: "Mobile Native", hours: "920", billable: 40, project: 40, nonBillable: 20 },
];

const topTeams = [
    { name: "Core Platform API", lead: "Sarah Jenkins", delivery: "98.4%", velocity: "42 điểm/sprint", status: "VƯỢT MỨC", color: "blue" },
    { name: "Data Visualization", lead: "Michael Chang", delivery: "95.2%", velocity: "38 điểm/sprint", status: "ĐÚNG TIẾN ĐỘ", color: "blue" },
    { name: "Identity & Access", lead: "David Ross", delivery: "91.8%", velocity: "34 điểm/sprint", status: "ĐÚNG TIẾN ĐỘ", color: "gray" },
];

const announcements = [
    { time: "Hôm nay, 09:00", title: "Đã chốt nội dung cuộc họp toàn khối Quý 3" },
    { time: "Hôm qua", title: "Cập nhật luồng Onboarding mới lên môi trường Staging" },
    { time: "12 Thg 10", title: "Nhắc nhở: Hoàn thành khóa đào tạo bảo mật trước Thứ Sáu" },
];

function DepartmentHeadDashboard() {
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
                        <Calendar className="w-4 h-4" />
                        Quý 3 2024
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm">
                        <Download className="w-4 h-4" />
                        Xuất báo cáo
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Headcount */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tổng nhân sự</p>
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <Users className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-baseline gap-3">
                            <h2 className="text-4xl font-bold text-gray-900">342</h2>
                            <span className="px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 flex items-center gap-1">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path></svg>
                                +4.2%
                            </span>
                        </div>
                        <p className="text-sm text-gray-500 mt-2">so với quý trước (328)</p>
                    </div>
                </div>

                {/* Budget */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngân sách đã dùng</p>
                        <div className="p-2 bg-red-50 rounded-lg text-red-600">
                            <Wallet className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold text-gray-900">86%</h2>
                        <div className="w-full bg-gray-200 rounded-full h-1.5 mt-3 mb-2">
                            <div className="bg-red-600 h-1.5 rounded-full" style={{ width: '86%' }}></div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">Còn lại:</span>
                            <span className="font-semibold text-red-600">$1.2M</span>
                        </div>
                    </div>
                </div>

                {/* Productivity */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Điểm năng suất</p>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <Zap className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold text-gray-900">92 <span className="text-lg text-gray-400 font-medium">/ 100</span></h2>
                        <p className="text-sm text-gray-600 mt-2 flex items-center gap-1.5">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            Vượt mục tiêu (85)
                        </p>
                    </div>
                </div>

                {/* Open Reqs */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Vị trí đang tuyển</p>
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                            <Briefcase className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold text-gray-900 mb-3">14</h2>
                        <div className="flex gap-2">
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">8 Kỹ sư</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">4 Sản phẩm</span>
                            <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">2 Thiết kế</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Middle Section: Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Resource Allocation */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Phân bổ Nguồn lực</h3>
                        <button className="text-gray-400 hover:text-gray-600">
                            <MoreVertical className="w-5 h-5" />
                        </button>
                    </div>
                    <div className="space-y-6">
                        {resourceData.map((item, idx) => (
                            <div key={idx}>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-gray-700">{item.name}</span>
                                    <span className="text-gray-500 font-mono text-xs">{item.hours} giờ</span>
                                </div>
                                <div className="flex w-full h-3 rounded-full overflow-hidden bg-gray-100">
                                    <div style={{ width: `${item.billable}%` }} className="bg-blue-600"></div>
                                    <div style={{ width: `${item.project}%` }} className="bg-indigo-400"></div>
                                    <div style={{ width: `${item.nonBillable}%` }} className="bg-gray-500"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-8 flex items-center justify-center gap-6 text-xs text-gray-500">
                        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-blue-600 rounded-sm"></span>Tính phí</div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-indigo-400 rounded-sm"></span>Dự án</div>
                        <div className="flex items-center gap-2"><span className="w-3 h-3 bg-gray-500 rounded-sm"></span>Không tính phí</div>
                    </div>
                </div>

                {/* Performance Trends */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <div className="flex justify-between items-center mb-6">
                        <h3 className="text-lg font-semibold text-gray-900">Xu hướng Hiệu suất</h3>
                        <div className="flex bg-gray-50 rounded-lg p-1 border border-gray-100">
                            <button className="px-3 py-1 text-xs font-medium bg-white shadow-sm rounded-md text-gray-800">6T</button>
                            <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700">1N</button>
                            <button className="px-3 py-1 text-xs font-medium text-gray-500 hover:text-gray-700">YTD</button>
                        </div>
                    </div>
                    {/* Mock Line Chart */}
                    <div className="relative h-48 w-full mt-4 flex flex-col justify-end">
                        <svg viewBox="0 0 400 100" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                            <defs>
                                <linearGradient id="gradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.2" />
                                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <path
                                d="M 0 80 C 50 75, 80 50, 150 25 C 200 5, 250 40, 300 35 C 350 30, 380 15, 400 5 L 400 100 L 0 100 Z"
                                fill="url(#gradient)"
                            />
                            <path
                                d="M 0 80 C 50 75, 80 50, 150 25 C 200 5, 250 40, 300 35 C 350 30, 380 15, 400 5"
                                fill="none"
                                stroke="#2563eb"
                                strokeWidth="2.5"
                            />
                        </svg>
                        {/* Grid lines & Labels */}
                        <div className="absolute inset-0 border-b border-gray-200 flex flex-col justify-between pb-8 pointer-events-none">
                            <div className="border-t border-gray-100 border-dashed w-full h-0"></div>
                            <div className="border-t border-gray-100 border-dashed w-full h-0"></div>
                            <div className="border-t border-gray-100 border-dashed w-full h-0"></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-400 mt-2 px-1">
                            <span>Thg 1</span>
                            <span>Thg 2</span>
                            <span>Thg 3</span>
                            <span>Thg 4</span>
                            <span>Thg 5</span>
                            <span>Thg 6</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Bottom Section */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Top Performing Teams */}
                <div className="xl:col-span-2 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-6">Nhóm Hiệu suất Cao</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr>
                                    <th className="pb-3 text-xs font-semibold text-gray-500 border-b border-gray-100">Nhóm</th>
                                    <th className="pb-3 text-xs font-semibold text-gray-500 border-b border-gray-100">Trưởng nhóm</th>
                                    <th className="pb-3 text-xs font-semibold text-gray-500 border-b border-gray-100">Tỷ lệ Hoàn thành</th>
                                    <th className="pb-3 text-xs font-semibold text-gray-500 border-b border-gray-100">Tốc độ (Velocity)</th>
                                    <th className="pb-3 text-xs font-semibold text-gray-500 border-b border-gray-100 text-right">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {topTeams.map((team, idx) => (
                                    <tr key={idx} className="group">
                                        <td className="py-4 border-b border-gray-50">
                                            <div className="flex items-center gap-2">
                                                <span className={`w-2 h-2 rounded-full ${team.color === 'blue' ? 'bg-blue-600' : 'bg-gray-400'}`}></span>
                                                <span className="font-medium text-gray-800 text-sm">{team.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 border-b border-gray-50 text-sm text-gray-600">{team.lead}</td>
                                        <td className="py-4 border-b border-gray-50 text-sm font-medium text-gray-800">{team.delivery}</td>
                                        <td className="py-4 border-b border-gray-50 text-sm font-mono text-gray-600">{team.velocity}</td>
                                        <td className="py-4 border-b border-gray-50 text-right">
                                            <span className={`inline-flex px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${team.status === 'VƯỢT MỨC' ? 'bg-green-50 text-green-700' : 'bg-green-50 text-green-700'}`}>
                                                {team.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Right Sidebar (Alerts & Announcements) */}
                <div className="flex flex-col gap-6">
                    {/* Alert */}
                    <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-red-500"></div>
                        <div className="flex items-center gap-2 mb-2">
                            <AlertTriangle className="w-5 h-5 text-red-600" />
                            <h3 className="font-semibold text-red-600 text-sm">Cảnh báo Ngân sách</h3>
                        </div>
                        <p className="text-sm text-gray-700 mb-4 leading-relaxed">
                            Chi phí hạ tầng Cloud vượt 12% so với định mức dự kiến hàng tháng. Vui lòng kiểm tra lại các tag sử dụng AWS.
                        </p>
                        <a href="#" className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-700">
                            Xem Phân tích Chi phí <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>

                    {/* Announcements */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex-1">
                        <div className="flex items-center gap-2 mb-6">
                            <Megaphone className="w-5 h-5 text-blue-600" />
                            <h3 className="font-semibold text-gray-900">Thông báo Gần đây</h3>
                        </div>
                        <div className="space-y-5">
                            {announcements.map((announcement, idx) => (
                                <div key={idx} className="relative pl-3 border-l-2 border-gray-100 hover:border-blue-500 transition-colors">
                                    <p className="text-xs text-gray-400 mb-1">{announcement.time}</p>
                                    <p className="text-sm font-medium text-gray-800 leading-snug">{announcement.title}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withAuth(DepartmentHeadDashboard);