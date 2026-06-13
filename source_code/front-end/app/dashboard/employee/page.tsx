"use client";

import { withAuth } from "@/app/middleware/withAuth";
import {
    Calendar as CalendarIcon,
    ClipboardList,
    GraduationCap,
    PartyPopper,
    ArrowRight,
    Download,
    Plane,
    Receipt,
    User,
    Shield,
    Megaphone,
    MoreVertical,
    Clock,
    MapPin,
    Info,
    AlertTriangle
} from "lucide-react";

// --- MOCK DATA ---
const scheduleData = [
    {
        day: "T2", date: "24",
        title: "Họp Standup Nhóm",
        time: "10:00 SA - 10:30 SA",
        type: "team",
        attendees: ["SJ", "MC"]
    },
    {
        day: "T3", date: "25",
        title: "Đánh giá Hiệu suất Q3",
        time: "2:00 CH - 3:00 CH",
        type: "1:1",
        tag: "Họp 1:1"
    },
    {
        day: "T5", date: "27",
        title: "Khởi động Dự án Lumina",
        location: "Phòng 4B",
        time: "11:00 SA",
        type: "location"
    }
];

const payslipsData = [
    { month: "Tháng 9 2023", date: "30 Thg 9, 2023", amount: "****.**" },
    { month: "Tháng 8 2023", date: "31 Thg 8, 2023", amount: "****.**" },
    { month: "Tháng 7 2023", date: "31 Thg 7, 2023", amount: "****.**" }
];

const goalsData = [
    { title: "Hoàn thành Chứng chỉ AWS", progress: 65, color: "bg-blue-600" },
    { title: "Hướng dẫn Lập trình viên mới", progress: 40, color: "bg-blue-600" },
    { title: "Tối ưu truy vấn DB", progress: 98, color: "bg-green-500" }
];

const announcementsData = [
    {
        title: "Họp toàn công ty (Townhall) thường niên",
        content: "Tham gia cùng chúng tôi vào Thứ Sáu này để tổng kết Q3 và xem trước lộ trình cho phần còn lại của năm. Bữa trưa sẽ được chuẩn bị...",
        time: "Đăng 2 ngày trước bởi Nhân sự",
        icon: <Megaphone className="w-5 h-5 text-blue-600" />
    },
    {
        title: "Kỳ Mở Đăng Ký Phúc Lợi",
        content: "Cổng đăng ký phúc lợi sẽ bắt đầu mở vào tuần tới. Vui lòng xem xét các gói cập nhật trên cổng thông tin.",
        time: "Đăng 4 ngày trước bởi Ban Phúc lợi",
        icon: <Shield className="w-5 h-5 text-indigo-600" />
    }
];

const celebrationsData = [
    {
        name: "Sarah Jenkins",
        event: "Sinh nhật", date: "28 Thg 10",
        action: "Gửi lời chúc",
        initials: "SJ", bgColor: "bg-pink-100 text-pink-600"
    },
    {
        name: "David Chen",
        event: "Kỷ niệm 3 năm làm việc", date: "2 Thg 11",
        action: "Chúc mừng",
        initials: "DC", bgColor: "bg-blue-100 text-blue-600"
    }
];

function EmployeeDashboard() {
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
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium">
                    <CalendarIcon className="w-4 h-4" />
                    Thứ Bảy, 13 Tháng 6, 2026
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Leave Balance */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm border-t-4 border-t-blue-500 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Nghỉ phép còn lại</p>
                        <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                            <CalendarIcon className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold text-gray-900">12 <span className="text-base font-normal text-gray-500">Ngày</span></h2>
                        <p className="text-sm text-gray-500 mt-2 flex items-center gap-1.5">
                            <Info className="w-4 h-4 text-blue-400" />
                            3 ngày đang chờ duyệt
                        </p>
                    </div>
                </div>

                {/* Pending Tasks */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm border-t-4 border-t-indigo-500 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Công việc chờ xử lý</p>
                        <div className="p-2 bg-indigo-50 rounded-lg text-indigo-600">
                            <ClipboardList className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-4xl font-bold text-gray-900">5 <span className="text-base font-normal text-gray-500">Nhiệm vụ</span></h2>
                        <p className="text-sm text-red-500 mt-2 flex items-center gap-1.5 font-medium">
                            <AlertTriangle className="w-4 h-4" />
                            1 quá hạn
                        </p>
                    </div>
                </div>

                {/* Training Progress */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm border-t-4 border-t-green-500 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Tiến độ đào tạo</p>
                        <div className="p-2 bg-green-50 rounded-lg text-green-600">
                            <GraduationCap className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <div className="flex items-end gap-2 mb-2">
                            <h2 className="text-4xl font-bold text-gray-900">80%</h2>
                            <span className="text-sm text-gray-500 mb-1">4/5 Module</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                            <div className="bg-green-500 h-1.5 rounded-full" style={{ width: '80%' }}></div>
                        </div>
                    </div>
                </div>

                {/* Upcoming Holiday */}
                <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm border-t-4 border-t-gray-300 flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-4">
                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Ngày lễ sắp tới</p>
                        <div className="p-2 bg-gray-100 rounded-lg text-gray-600">
                            <PartyPopper className="w-4 h-4" />
                        </div>
                    </div>
                    <div>
                        <h2 className="text-xl font-bold text-gray-900 mb-2 truncate">Lễ Tạ Ơn</h2>
                        <p className="text-sm text-gray-500 flex items-center gap-1.5">
                            <Clock className="w-4 h-4" />
                            trong 2 tuần nữa
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Left Column (Spans 2 cols on lg) */}
                <div className="lg:col-span-2 flex flex-col gap-6">

                    {/* Weekly Schedule */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Lịch trình tuần này</h3>
                            <a href="#" className="text-sm font-medium text-blue-600 hover:text-blue-700 flex items-center gap-1">
                                Xem Lịch <ArrowRight className="w-4 h-4" />
                            </a>
                        </div>
                        <div className="space-y-4">
                            {scheduleData.map((item, idx) => (
                                <div key={idx} className="flex gap-4 items-center border-b border-gray-50 pb-4 last:border-0 last:pb-0">
                                    {/* Date Block */}
                                    <div className="flex flex-col items-center justify-center bg-gray-100 rounded-lg w-12 h-14 shrink-0">
                                        <span className="text-xs font-semibold text-gray-500">{item.day}</span>
                                        <span className="text-lg font-bold text-gray-800">{item.date}</span>
                                    </div>
                                    {/* Content */}
                                    <div className="flex-1">
                                        <h4 className="font-medium text-gray-900">{item.title}</h4>
                                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                                            {item.location ? (
                                                <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {item.location} • {item.time}</span>
                                            ) : (
                                                <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {item.time}</span>
                                            )}
                                        </div>
                                    </div>
                                    {/* Right Tags/Avatars */}
                                    <div>
                                        {item.tag && (
                                            <span className="px-3 py-1 bg-indigo-50 text-indigo-600 text-xs font-medium rounded-md">
                                                {item.tag}
                                            </span>
                                        )}
                                        {item.attendees && (
                                            <div className="flex -space-x-2">
                                                {item.attendees.map((att, i) => (
                                                    <div key={i} className="w-7 h-7 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center text-[10px] font-bold text-blue-700">
                                                        {att}
                                                    </div>
                                                ))}
                                                <div className="w-7 h-7 rounded-full bg-gray-100 border-2 border-white flex items-center justify-center text-[10px] font-medium text-gray-600">
                                                    +3
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Recent Payslips */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Phiếu lương gần đây</h3>
                            <button className="text-gray-400 hover:text-gray-600">
                                <MoreVertical className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr>
                                        <th className="pb-3 text-xs font-semibold text-gray-500 border-b border-gray-100 uppercase tracking-wider">Tháng</th>
                                        <th className="pb-3 text-xs font-semibold text-gray-500 border-b border-gray-100 uppercase tracking-wider">Ngày trả</th>
                                        <th className="pb-3 text-xs font-semibold text-gray-500 border-b border-gray-100 uppercase tracking-wider">Thực lĩnh</th>
                                        <th className="pb-3 text-xs font-semibold text-gray-500 border-b border-gray-100 uppercase tracking-wider text-right">Hành động</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payslipsData.map((slip, idx) => (
                                        <tr key={idx} className="group">
                                            <td className="py-4 border-b border-gray-50 text-sm font-medium text-gray-800">{slip.month}</td>
                                            <td className="py-4 border-b border-gray-50 text-sm font-mono text-gray-600">{slip.date}</td>
                                            <td className="py-4 border-b border-gray-50 text-sm font-mono font-medium text-gray-800">{slip.amount}</td>
                                            <td className="py-4 border-b border-gray-50 text-right">
                                                <button className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                                                    <Download className="w-4 h-4" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Company Announcements */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm relative overflow-hidden">
                        <div className="absolute right-0 top-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-10 opacity-50"></div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Thông báo nội bộ</h3>
                        <div className="space-y-6">
                            {announcementsData.map((announcement, idx) => (
                                <div key={idx} className="flex gap-4 items-start border-b border-gray-50 pb-5 last:border-0 last:pb-0">
                                    <div className="mt-1">{announcement.icon}</div>
                                    <div>
                                        <h4 className="font-medium text-gray-900">{announcement.title}</h4>
                                        <p className="text-sm text-gray-600 mt-1 leading-relaxed">{announcement.content}</p>
                                        <p className="text-xs text-gray-400 mt-2">{announcement.time}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-6">

                    {/* Quick Actions */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Hành động nhanh</h3>
                        <div className="grid grid-cols-2 gap-3">
                            <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-blue-500 hover:bg-blue-50/50 transition-all group">
                                <Plane className="w-6 h-6 text-blue-600" />
                                <span className="text-xs font-medium text-gray-700 text-center">Xin nghỉ phép</span>
                            </button>
                            <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-indigo-500 hover:bg-indigo-50/50 transition-all group">
                                <Receipt className="w-6 h-6 text-indigo-500" />
                                <span className="text-xs font-medium text-gray-700 text-center">Xem phiếu lương</span>
                            </button>
                            <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-gray-500 hover:bg-gray-50 transition-all group">
                                <User className="w-6 h-6 text-gray-600" />
                                <span className="text-xs font-medium text-gray-700 text-center">Cập nhật hồ sơ</span>
                            </button>
                            <button className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-gray-200 hover:border-green-500 hover:bg-green-50/50 transition-all group">
                                <Shield className="w-6 h-6 text-green-500" />
                                <span className="text-xs font-medium text-gray-700 text-center">TT Phúc lợi</span>
                            </button>
                        </div>
                    </div>

                    {/* Q4 Goals */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-semibold text-gray-900">Mục tiêu Q4</h3>
                            <span className="text-xs text-gray-500">Đang tiến hành</span>
                        </div>
                        <div className="space-y-5 mb-6">
                            {goalsData.map((goal, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between text-sm mb-1.5">
                                        <span className="font-medium text-gray-800">{goal.title}</span>
                                        <span className="text-blue-600 font-mono text-xs font-medium">{goal.progress}%</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                                        <div className={`${goal.color} h-1.5 rounded-full`} style={{ width: `${goal.progress}%` }}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button className="w-full py-2.5 px-4 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors">
                            Xem tất cả Mục tiêu
                        </button>
                    </div>

                    {/* Upcoming Celebrations */}
                    <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Kỷ niệm sắp tới</h3>
                        <div className="space-y-5">
                            {celebrationsData.map((celeb, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${celeb.bgColor}`}>
                                            {celeb.initials}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-900">{celeb.name}</h4>
                                            <p className="text-xs text-gray-500 mt-0.5">{celeb.event} • {celeb.date}</p>
                                        </div>
                                    </div>
                                    <button className="text-xs font-medium text-blue-600 hover:text-blue-800 transition-colors">
                                        {celeb.action}
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}

export default withAuth(EmployeeDashboard);