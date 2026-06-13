"use client";

import { withAuth } from "@/app/middleware/withAuth";
import {
    Server,
    Activity,
    AlertTriangle,
    Users,
    RefreshCw,
    Download,
    ArrowUp,
    Minus,
    ChevronDown,
    UserCog,
    Key,
    Shield,
    Power
} from "lucide-react";

// --- MOCK DATA ---
const auditLogs = [
    {
        time: "10:42:01 UTC",
        user: "J. Doe (Admin)", userInitials: "JD", userBg: "bg-gray-200 text-gray-700",
        action: "Thay đổi Quyền người dùng (ID: 8842)",
        ip: "192.168.1.105",
        status: "THÀNH CÔNG", statusColor: "bg-green-100 text-green-700"
    },
    {
        time: "10:38:15 UTC",
        user: "System Auto-Backup", userInitials: "SB", userBg: "bg-blue-100 text-blue-700", icon: true,
        action: "Bắt đầu Snapshot Database",
        ip: "10.0.0.4",
        status: "THÀNH CÔNG", statusColor: "bg-green-100 text-green-700"
    },
    {
        time: "10:15:44 UTC",
        user: "Unknown", userInitials: "?", userBg: "bg-gray-100 text-gray-500", icon: true,
        action: "Nỗ lực đăng nhập thất bại (Root)", actionColor: "text-red-600 font-medium",
        ip: "45.22.19.102",
        status: "THẤT BẠI", statusColor: "bg-red-100 text-red-700"
    },
    {
        time: "09:55:10 UTC",
        user: "A. Smith (HR)", userInitials: "AS", userBg: "bg-gray-200 text-gray-700",
        action: "Xuất danh sách nhân sự Q3",
        ip: "192.168.1.55",
        status: "THÀNH CÔNG", statusColor: "bg-green-100 text-green-700"
    },
];

const maintenanceUpdates = [
    {
        time: "Hôm nay, 23:00 UTC",
        title: "Tối ưu hóa Index Database",
        downtime: "Thời gian gián đoạn dự kiến: ~5 phút",
        active: true
    },
    {
        time: "Ngày mai, 02:00 UTC",
        title: "Triển khai bản vá bảo mật (v2.4.1)",
    },
    {
        time: "Thứ Sáu, 00:00 UTC",
        title: "Sao lưu toàn bộ hệ thống hàng tuần",
    }
];

function TenantAdminDashboard() {
    const currentDate = new Date().toLocaleDateString('vi-VN', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    });
    return (
        <div className="flex flex-col gap-6 max-w-7xl mx-auto text-gray-800">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển</h1>
                    <p className="text-sm text-gray-500 mt-1 capitalize">{currentDate}</p>
                </div>
                <div className="flex items-center gap-3">
                    <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors shadow-sm">
                        <RefreshCw className="w-4 h-4" />
                        Làm mới
                    </button>
                    <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm">
                        <Download className="w-4 h-4" />
                        Xuất báo cáo
                    </button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* System Uptime */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm border-t-4 border-t-green-500 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Thời gian hoạt động</p>
                        <div className="text-green-600">
                            <Server className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold text-gray-900">99.99<span className="text-2xl text-gray-400">%</span></h2>
                        <p className="text-sm text-green-500 mt-2 flex items-center gap-1.5 font-medium">
                            <ArrowUp className="w-3.5 h-3.5" />
                            Ổn định hơn 30 ngày
                        </p>
                    </div>
                </div>

                {/* Server Latency */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm border-t-4 border-t-blue-500 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Độ trễ máy chủ</p>
                        <div className="text-blue-600">
                            <Activity className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold text-gray-900">45<span className="text-xl font-medium text-gray-500 ml-1">ms</span></h2>
                        <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
                            <Minus className="w-3.5 h-3.5" />
                            Trung bình toàn cầu
                        </p>
                    </div>
                </div>

                {/* Security Alerts */}
                <div className="bg-red-50 p-5 rounded-xl border border-red-100 shadow-sm border-t-4 border-t-red-500 flex flex-col justify-between relative overflow-hidden">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-xs font-semibold text-red-800 uppercase tracking-wider">Cảnh báo bảo mật</p>
                        <div className="text-red-600">
                            <AlertTriangle className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold text-red-600">2</h2>
                        <p className="text-sm text-red-600 mt-2 flex items-center gap-1.5 font-medium">
                            <AlertTriangle className="w-3.5 h-3.5 fill-red-100" />
                            Cần xử lý khẩn cấp
                        </p>
                    </div>
                </div>

                {/* Active Sessions */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm border-t-4 border-t-indigo-600 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Phiên hoạt động</p>
                        <div className="text-indigo-600">
                            <Users className="w-5 h-5" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold text-gray-900">1,240</h2>
                        <p className="text-sm text-green-500 mt-2 flex items-center gap-1.5 font-medium">
                            <ArrowUp className="w-3.5 h-3.5" />
                            +12% so với giờ trước
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

                {/* Left Column (Spans 2 cols on xl) */}
                <div className="xl:col-span-2 flex flex-col gap-6">

                    {/* System Health Monitor */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <div className="flex items-center gap-3">
                                <h3 className="text-lg font-semibold text-gray-900">Giám sát sức khỏe hệ thống</h3>
                                <span className="bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider">Trực tiếp</span>
                            </div>
                            <button className="flex items-center gap-2 px-3 py-1.5 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                                1 Giờ qua <ChevronDown className="w-4 h-4" />
                            </button>
                        </div>

                        {/* Health Bars */}
                        <div className="grid grid-cols-3 gap-4 mb-6">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Sử dụng CPU</span>
                                    <span className="font-semibold text-gray-900">42%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '42%' }}></div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Bộ nhớ (RAM)</span>
                                    <span className="font-semibold text-gray-900">68%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-orange-500 h-2 rounded-full" style={{ width: '68%' }}></div>
                                </div>
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Truy xuất ổ cứng (I/O)</span>
                                    <span className="font-semibold text-gray-900">15%</span>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div className="bg-green-500 h-2 rounded-full" style={{ width: '15%' }}></div>
                                </div>
                            </div>
                        </div>

                        {/* Mock Chart Area */}
                        <div className="relative h-64 w-full border border-gray-100 rounded-xl overflow-hidden mt-4">
                            {/* Grid background */}
                            <div className="absolute inset-0 grid grid-cols-6 grid-rows-4 opacity-30">
                                {[...Array(24)].map((_, i) => (
                                    <div key={i} className="border-t border-l border-gray-200"></div>
                                ))}
                            </div>
                            {/* Lines */}
                            <svg viewBox="0 0 800 200" className="w-full h-full preserve-3d" preserveAspectRatio="none">
                                {/* Dashed line (Memory/Other metric) */}
                                <path
                                    d="M 0 180 C 100 170, 200 190, 300 180 C 400 150, 450 100, 500 120 C 550 140, 600 180, 650 170 C 700 150, 750 110, 800 90"
                                    fill="none"
                                    stroke="#10b981"
                                    strokeWidth="3"
                                    strokeDasharray="8 8"
                                />
                                {/* Solid line (CPU) */}
                                <path
                                    d="M 0 150 C 100 80, 150 150, 200 160 C 250 170, 300 130, 350 50 C 400 -30, 450 150, 500 170 C 550 190, 580 40, 620 -10 C 650 -50, 680 180, 800 180"
                                    fill="none"
                                    stroke="#2563eb"
                                    strokeWidth="5"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                    </div>

                    {/* Recent Audit Logs */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Nhật ký Hệ thống gần đây</h3>
                            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700">Xem tất cả</a>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        <th className="pb-3 text-xs font-semibold text-gray-500 border-b border-gray-100">THỜI GIAN</th>
                                        <th className="pb-3 text-xs font-semibold text-gray-500 border-b border-gray-100">NGƯỜI DÙNG/HỆ THỐNG</th>
                                        <th className="pb-3 text-xs font-semibold text-gray-500 border-b border-gray-100">HÀNH ĐỘNG</th>
                                        <th className="pb-3 text-xs font-semibold text-gray-500 border-b border-gray-100">ĐỊA CHỈ IP</th>
                                        <th className="pb-3 text-xs font-semibold text-gray-500 border-b border-gray-100 text-right">TRẠNG THÁI</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {auditLogs.map((log, idx) => (
                                        <tr key={idx} className="group hover:bg-gray-50 transition-colors">
                                            <td className="py-3 border-b border-gray-50 text-sm font-mono text-gray-600 whitespace-nowrap">{log.time}</td>
                                            <td className="py-3 border-b border-gray-50">
                                                <div className="flex items-center gap-2">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${log.userBg}`}>
                                                        {log.icon ? <Server className="w-3 h-3" /> : log.userInitials}
                                                    </div>
                                                    <span className="text-sm text-gray-800 font-medium">{log.user}</span>
                                                </div>
                                            </td>
                                            <td className={`py-3 border-b border-gray-50 text-sm ${log.actionColor || 'text-gray-700'}`}>{log.action}</td>
                                            <td className="py-3 border-b border-gray-50 text-sm font-mono text-gray-600">{log.ip}</td>
                                            <td className="py-3 border-b border-gray-50 text-right">
                                                <span className={`inline-flex px-2 py-1 text-[10px] font-bold rounded uppercase tracking-wider ${log.statusColor}`}>
                                                    {log.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-6">

                    {/* Security Threat Radar */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Shield className="w-5 h-5 text-red-500" />
                            Radar Mối đe dọa Bảo mật
                        </h3>

                        {/* Map/Radar Graphic */}
                        <div className="bg-gray-50 border border-gray-100 rounded-lg h-40 relative flex items-center justify-center mb-6 overflow-hidden">
                            {/* Dot Grid Background */}
                            <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '12px 12px' }}></div>

                            {/* Radar overlay text */}
                            <div className="relative bg-white/80 backdrop-blur-sm px-4 py-1.5 rounded-full border border-gray-200 text-sm font-medium text-gray-700 shadow-sm">
                                Đang giám sát trực tiếp
                            </div>

                            {/* Threat Dots */}
                            <div className="absolute top-10 left-1/4 w-3 h-3 bg-red-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.8)]"></div>
                            <div className="absolute bottom-12 right-1/4 w-3 h-3 bg-yellow-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(234,179,8,0.8)]"></div>
                        </div>

                        {/* Threat Legend */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-red-500"></span>
                                    <span className="text-gray-800">Lỗi xác thực nhiều lần</span>
                                </div>
                                <span className="text-xs font-mono text-gray-500">Frankfurt, DE</span>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
                                    <span className="text-gray-800">Cỡ dữ liệu xuất bất thường</span>
                                </div>
                                <span className="text-xs font-mono text-gray-500">IP Nội bộ</span>
                            </div>
                        </div>
                    </div>

                    {/* Updates & Maintenance */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Cập nhật & Bảo trì</h3>
                        <div className="relative border-l-2 border-gray-100 ml-2 space-y-6 mb-6">
                            {maintenanceUpdates.map((update, idx) => (
                                <div key={idx} className="relative pl-5">
                                    <span className={`absolute -left-[7px] top-1.5 w-3 h-3 rounded-full border-2 border-white ${update.active ? 'bg-yellow-400' : 'bg-gray-300'}`}></span>
                                    <p className="text-xs font-semibold text-gray-500 mb-1">{update.time}</p>
                                    <p className="text-sm font-medium text-gray-900">{update.title}</p>
                                    {update.downtime && (
                                        <div className="mt-2 bg-gray-100 border border-gray-200 text-gray-600 font-mono text-xs p-2 rounded-md inline-block">
                                            {update.downtime}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-2 bg-white border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 text-sm font-medium transition-colors">
                            Quản lý Lịch trình
                        </button>
                    </div>

                    {/* Quick Actions */}
                    <div>
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Thao tác nhanh</p>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all text-gray-700">
                                <UserCog className="w-5 h-5 text-blue-600" />
                                <span className="text-sm font-medium">Phân quyền</span>
                            </button>
                            <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all text-gray-700">
                                <Key className="w-5 h-5 text-indigo-600" />
                                <span className="text-sm font-medium">Khóa API</span>
                            </button>
                            <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-200 bg-gray-50 hover:bg-white hover:border-gray-300 hover:shadow-sm transition-all text-gray-700">
                                <Key className="w-5 h-5 text-blue-500" />
                                <span className="text-sm font-medium">Cấu hình SSO</span>
                            </button>
                            <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 hover:border-red-300 transition-all text-red-700">
                                <Power className="w-5 h-5" />
                                <span className="text-sm font-medium">Buộc đăng xuất</span>
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default withAuth(TenantAdminDashboard);