"use client";

import { withAuth } from "@/app/middleware/withAuth";
import { 
  Users, 
  Building2, 
  Network, 
  ClipboardList, 
  Plus, 
  FolderPlus,
  AlertTriangle,
  RefreshCcw,
  Mail,
  MoreHorizontal,
  Calendar,
  Search,
  CheckCircle2,
  Clock
} from "lucide-react";

// ==========================================
// MOCK DATA TỔNG HỢP
// ==========================================
const statsData = [
  { title: "Tổng nhân viên", value: "1,248", trend: "+12%", trendUp: true, subtitle: "So với tháng trước", icon: Users },
  { title: "Phòng ban", value: "12", subtitle: "Trên các khu vực", icon: Building2 },
  { title: "Đội nhóm", value: "48", subtitle: "Nhóm chức năng", icon: Network },
  { title: "Dự án đang chạy", value: "24", subtitle: "Hiện đang tiến hành", icon: ClipboardList },
];

const projectList = [
  { id: "PRJ001", name: "Nâng cấp Hệ thống ERP", manager: "Lê Văn A", deadline: "20/07/2026", progress: 75, status: "Đang làm", statusColor: "text-blue-600 bg-blue-50", members: ["https://i.pravatar.cc/150?u=1", "https://i.pravatar.cc/150?u=2", "https://i.pravatar.cc/150?u=3"] },
  { id: "PRJ002", name: "Chiến dịch Marketing Q3", manager: "Nguyễn Thị B", deadline: "15/06/2026", progress: 95, status: "Sắp xong", statusColor: "text-emerald-600 bg-emerald-50", members: ["https://i.pravatar.cc/150?u=4", "https://i.pravatar.cc/150?u=5"] },
  { id: "PRJ003", name: "Phát triển App Mobile", manager: "Trần Văn C", deadline: "10/06/2026", progress: 40, status: "Chậm", statusColor: "text-red-600 bg-red-50", members: ["https://i.pravatar.cc/150?u=6", "https://i.pravatar.cc/150?u=7", "https://i.pravatar.cc/150?u=8", "https://i.pravatar.cc/150?u=9"] }
];

const employeeDistribution = [
  { name: "Kỹ thuật", percentage: 42, count: 524, color: "bg-blue-600" },
  { name: "Bán hàng", percentage: 25, count: 312, color: "bg-blue-500" },
  { name: "Tiếp thị", percentage: 15, count: 187, color: "bg-gray-500" },
  { name: "Nhân sự", percentage: 10, count: 125, color: "bg-blue-300" },
  { name: "Tài chính", percentage: 8, count: 100, color: "bg-gray-400" },
];

const recruitmentFunnel = [
  { stage: "Ứng tuyển", count: 850, width: "100%", color: "bg-blue-300" },
  { stage: "Sàng lọc", count: 340, width: "65%", color: "bg-blue-500" },
  { stage: "Phỏng vấn", count: 120, width: "45%", color: "bg-blue-600" },
  { stage: "Đề nghị", count: 45, width: "25%", color: "bg-indigo-500" },
  { stage: "Đã thuê", count: 32, width: "15%", color: "bg-gray-600" },
];

const performanceReviews = [
  { status: "Hoàn thành", percentage: 75, text: "936 / 1248 nhân viên", color: "bg-emerald-500" },
  { status: "Đang chờ", percentage: 20, text: "249 / 1248 nhân viên", color: "bg-blue-600" },
  { status: "Quá hạn", percentage: 5, text: "63 / 1248 nhân viên", color: "bg-red-400" },
];

const recentActivities = [
  { user: "Sarah Chen", action: "đã gia nhập bộ phận Kỹ thuật", time: "2 giờ trước", color: "bg-blue-500" },
  { user: "Dự án mới", action: "'Q4 Roadmap' đã được tạo", time: "5 giờ trước", color: "bg-blue-400" },
  { user: "Tái cơ cấu", action: "phòng ban đã được chốt", time: "Hôm qua", color: "bg-gray-400" },
  { user: "Báo cáo", action: "chỉ số hàng tuần đã được xuất", time: "Hôm qua", color: "bg-gray-300" },
];

const upcomingMilestones = [
  { date: "15 Th6", event: "Nghiệm thu Giai đoạn 1", project: "App Mobile", type: "Họp" },
  { date: "18 Th6", event: "Ra mắt bản Beta", project: "Hệ thống ERP", type: "Kỹ thuật" },
  { date: "22 Th6", event: "Chốt ngân sách Q4", project: "Marketing Q3", type: "Tài chính" },
];

// ==========================================
// COMPONENT CHÍNH
// ==========================================
function ManagerDashboard() {
  const currentDate = new Date().toLocaleDateString('vi-VN', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  return (
    <div className="space-y-8 pb-10">
      
      {/* 1. HEADER KHU VỰC */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Bảng điều khiển</h1>
          <p className="text-sm text-gray-500 mt-1 capitalize">{currentDate}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Tìm kiếm..." 
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 w-64 bg-white"
            />
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 text-sm font-medium transition-colors shadow-sm">
            <FolderPlus className="w-4 h-4" />
            <span className="hidden sm:inline">Tạo dự án</span>
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors shadow-sm">
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Thêm nhân viên</span>
          </button>
        </div>
      </div>

      {/* 2. THỐNG KÊ NHANH (STATS GRID) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{stat.title}</span>
                <div className="p-1.5 bg-gray-50 rounded-lg">
                  <Icon className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <div>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-2xl font-bold text-gray-900">{stat.value}</h3>
                  {stat.trend && (
                    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${stat.trendUp ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                      {stat.trend}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">{stat.subtitle}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 3. QUẢN LÝ DỰ ÁN */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">Quản lý Dự án</h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Bảng danh sách dự án (Chiếm 2/3) */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-50 flex justify-between items-center">
              <h3 className="font-semibold text-gray-800">Dự án trọng điểm</h3>
              <button className="text-sm text-blue-600 font-medium hover:underline">Xem toàn bộ</button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/50">
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tên dự án</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Nhân sự</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Tiến độ</th>
                    <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Trạng thái</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {projectList.map((prj) => (
                    <tr key={prj.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4">
                        <p className="text-sm font-bold text-gray-800">{prj.name}</p>
                        <p className="text-xs text-gray-400">Hạn: {prj.deadline} • PM: {prj.manager}</p>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex -space-x-2">
                            {prj.members.map((m, i) => (
                              <img key={i} src={m} className="w-6 h-6 rounded-full border-2 border-white" alt="member" />
                            ))}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 w-40">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 h-1.5 rounded-full">
                            <div 
                              className={`h-1.5 rounded-full ${prj.progress > 80 ? 'bg-emerald-500' : prj.progress < 50 ? 'bg-red-500' : 'bg-blue-500'}`} 
                              style={{ width: `${prj.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-xs font-medium text-gray-700">{prj.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${prj.statusColor}`}>
                          {prj.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Phân bổ trạng thái dự án (Chiếm 1/3) */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col justify-center">
            <h3 className="text-base font-semibold text-gray-900 mb-6 text-center">Tình trạng tổng thể</h3>
            <div className="flex items-center justify-center gap-8">
              {/* Fake Donut Chart */}
              <div className="relative flex items-center justify-center w-36 h-36 bg-gray-50 rounded-full border-[6px] border-blue-500 shadow-inner">
                <div className="text-center bg-white w-24 h-24 rounded-full flex flex-col items-center justify-center">
                  <span className="block text-2xl font-bold text-gray-900">24</span>
                  <span className="text-[10px] text-gray-500 font-medium uppercase">Dự án</span>
                </div>
              </div>
            </div>
            <div className="mt-8 space-y-3 px-4">
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span><span className="text-gray-700">Đang tiến hành</span></div>
                <span className="font-semibold text-gray-900">45%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-blue-300"></span><span className="text-gray-700">Lập kế hoạch</span></div>
                <span className="font-semibold text-gray-900">30%</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <div className="flex items-center gap-2"><span className="w-2.5 h-2.5 rounded-full bg-gray-400"></span><span className="text-gray-700">Tạm dừng/Hủy</span></div>
                <span className="font-semibold text-gray-900">25%</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 4. NHÂN SỰ & TUYỂN DỤNG */}
      <div className="space-y-4">
        <h2 className="text-lg font-bold text-gray-800 border-b border-gray-200 pb-2">Nhân sự & Tuyển dụng</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Phân bổ nhân sự */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-6">Phân bổ nhân sự</h3>
            <div className="space-y-4">
              {employeeDistribution.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="font-medium text-gray-700">{item.name}</span>
                    <span className="text-gray-500">{item.percentage}% ({item.count})</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${item.color} h-2 rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Hiệu suất Q3 */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-6">Đánh giá hiệu suất Q3</h3>
            <div className="space-y-6">
              {performanceReviews.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="font-medium text-gray-700">{item.status}</span>
                    <span className="font-semibold text-gray-900">{item.percentage}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5 mb-1">
                    <div className={`${item.color} h-2.5 rounded-full`} style={{ width: `${item.percentage}%` }}></div>
                  </div>
                  <span className="text-xs text-gray-500">{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Phễu tuyển dụng */}
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-6">Phễu tuyển dụng</h3>
            <div className="space-y-3">
              {recruitmentFunnel.map((item, index) => (
                <div key={index} className="flex items-center gap-3">
                  <span className="w-16 text-[11px] font-medium text-right text-gray-600">{item.stage}</span>
                  <div className="flex-1 bg-gray-50 rounded-md h-7 relative flex items-center overflow-hidden">
                    <div className={`${item.color} h-full rounded-md absolute left-0 top-0`} style={{ width: item.width }}></div>
                    <span className="relative z-10 pl-3 text-xs font-bold text-gray-900 drop-shadow-sm">{item.count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* 5. CÔNG VIỆC CẦN LÀM & THÔNG BÁO */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Mốc thời gian quan trọng */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-orange-500" />
              Lịch trình sắp tới
            </h3>
          </div>
          <div className="space-y-4">
            {upcomingMilestones.map((ms, index) => (
              <div key={index} className="flex items-start gap-4 p-3 hover:bg-gray-50 rounded-lg border border-gray-50 transition-colors">
                <div className="text-center min-w-[45px]">
                  <p className="text-[10px] font-bold text-blue-600 uppercase">{ms.date.split(' ')[1]}</p>
                  <p className="text-lg font-black text-gray-800 leading-none">{ms.date.split(' ')[0]}</p>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-bold text-gray-800 leading-snug">{ms.event}</p>
                  <div className="flex justify-between items-center mt-1.5">
                    <p className="text-[11px] text-gray-500">{ms.project}</p>
                    <span className="text-[10px] bg-white border border-gray-200 px-1.5 py-0.5 rounded text-gray-600 font-medium">{ms.type}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Hoạt động gần đây */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-900">Hoạt động gần đây</h3>
            <button className="text-xs font-medium text-blue-600 hover:underline">Xem tất cả</button>
          </div>
          <div className="relative border-l-2 border-gray-100 ml-2 space-y-6">
            {recentActivities.map((activity, index) => (
              <div key={index} className="relative pl-5">
                <span className={`absolute -left-[9px] top-1 w-4 h-4 rounded-full ${activity.color} ring-4 ring-white`}></span>
                <p className="text-sm text-gray-800">
                  <span className="font-semibold">{activity.user}</span> {activity.action}
                </p>
                <span className="text-[11px] text-gray-400 mt-1 block">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Thông báo */}
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <h3 className="font-semibold text-gray-900">Hộp thư & Thông báo</h3>
            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-[10px] font-bold uppercase rounded-full tracking-wide">2 Mới</span>
          </div>
          <div className="space-y-3 flex-1">
            <div className="flex gap-3 p-3 bg-red-50/80 rounded-lg border border-red-100 transition-colors hover:bg-red-50">
              <div className="bg-white p-2 rounded-lg text-red-500 h-fit shadow-sm">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">3 Đánh giá quá hạn</p>
                <p className="text-[11px] text-gray-600 mt-0.5">Cần hành động cho phòng Bán hàng</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-blue-50/80 rounded-lg border border-blue-100 transition-colors hover:bg-blue-50">
              <div className="bg-white p-2 rounded-lg text-blue-600 h-fit shadow-sm">
                <RefreshCcw className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Bảo trì hệ thống</p>
                <p className="text-[11px] text-gray-600 mt-0.5">Đã lên lịch vào Chủ nhật 2 AM EST</p>
              </div>
            </div>

            <div className="flex gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100 transition-colors hover:bg-gray-100/80">
              <div className="bg-white p-2 rounded-lg text-gray-500 h-fit shadow-sm">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900">Chính sách nghỉ phép</p>
                <p className="text-[11px] text-gray-600 mt-0.5">Bản nháp đã sẵn sàng để xem xét</p>
              </div>
            </div>
          </div>
        </div>

      </div>
      
    </div>
  );
}

export default withAuth(ManagerDashboard);