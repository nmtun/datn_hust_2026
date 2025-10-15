import { notFound } from 'next/navigation';
import Link from 'next/link';
import Header from '../../components/Header';
import Footer from '../../components/Footer';

// Danh sách công việc dựa trên bảng Job_Descriptions
const jobListings = [
  {
    id: 'frontend-developer',
    title: 'Lập trình viên Frontend',
    department: 'Phòng Kỹ thuật',
    location: 'Hà Nội',
    remote_option: true,
    employment_type: 'full_time',
    experience_level: 'mid',
    salary_range: {
      min: 15000000,
      max: 30000000
    },
    description: 'Chúng tôi đang tìm kiếm một Lập trình viên Frontend tài năng để tham gia vào đội ngũ phát triển sản phẩm của chúng tôi. Ứng viên lý tưởng nên có kinh nghiệm với React.js, Next.js và các framework CSS hiện đại.',
    requirements: [
      'Có ít nhất 2 năm kinh nghiệm với React.js, Next.js và các framework CSS hiện đại',
      'Hiểu biết sâu về nguyên tắc thiết kế web đáp ứng (responsive)',
      'Kiến thức về kỹ thuật tối ưu hiệu suất web',
      'Thành thạo trong việc sử dụng hệ thống quản lý phiên bản (Git)',
      'Kinh nghiệm làm việc với RESTful APIs và GraphQL'
    ],
    responsibilities: [
      'Phát triển và bảo trì giao diện người dùng cho các ứng dụng web',
      'Hợp tác với nhà thiết kế và lập trình viên backend để triển khai các tính năng mới',
      'Tối ưu hóa ứng dụng để đạt tốc độ và khả năng mở rộng tối đa',
      'Đảm bảo tương thích đa trình duyệt và khả năng đáp ứng',
      'Viết mã sạch, dễ bảo trì và có tài liệu đầy đủ',
      'Tham gia vào các buổi họp review code và đóng góp ý kiến cải tiến'
    ],
    qualifications: [
      'Bằng cử nhân Khoa học Máy tính hoặc các ngành liên quan',
      'Chứng chỉ về React, JavaScript hoặc Frontend Development là một lợi thế',
      'Portfolio các dự án đã thực hiện'
    ],
    positions_count: 2,
    status: 'active',
    posting_date: '2025-09-15',
    closing_date: '2025-11-15'
  },
  {
    id: 'backend-developer',
    title: 'Lập trình viên Backend',
    department: 'Phòng Kỹ thuật',
    location: 'Hà Nội',
    remote_option: true,
    employment_type: 'full_time',
    experience_level: 'senior',
    salary_range: {
      min: 25000000,
      max: 45000000
    },
    description: 'Chúng tôi đang tìm kiếm một Lập trình viên Backend Senior để thiết kế, xây dựng và bảo trì các ứng dụng phía máy chủ. Ứng viên lý tưởng nên có kinh nghiệm với Node.js, Express.js và các hệ thống cơ sở dữ liệu hiện đại.',
    requirements: [
      'Có ít nhất 5 năm kinh nghiệm với Node.js, Express.js và các hệ thống cơ sở dữ liệu',
      'Kiến thức chuyên sâu về thiết kế và tối ưu hóa cơ sở dữ liệu',
      'Thành thạo nguyên tắc thiết kế API RESTful và microservices',
      'Hiểu biết về các giao thức xác thực và ủy quyền',
      'Kinh nghiệm với CI/CD và container hóa ứng dụng (Docker, Kubernetes)'
    ],
    responsibilities: [
      'Thiết kế, xây dựng và bảo trì các ứng dụng phía máy chủ',
      'Tạo và bảo trì các API RESTful có hiệu năng cao và khả năng mở rộng',
      'Thực hiện các biện pháp bảo mật và bảo vệ dữ liệu',
      'Tối ưu hóa ứng dụng để đạt tốc độ và khả năng mở rộng tối đa',
      'Viết mã sạch, dễ bảo trì và có tài liệu đầy đủ',
      'Hướng dẫn và đào tạo các lập trình viên junior trong nhóm'
    ],
    qualifications: [
      'Bằng cử nhân Khoa học Máy tính hoặc các ngành liên quan',
      'Chứng chỉ về AWS, Azure hoặc GCP là một lợi thế',
      'Kinh nghiệm làm việc với các dự án có quy mô lớn'
    ],
    positions_count: 1,
    status: 'active',
    posting_date: '2025-09-20',
    closing_date: '2025-10-30'
  },
  {
    id: 'ui-ux-designer',
    title: 'Nhà thiết kế UI/UX',
    department: 'Phòng Thiết kế',
    location: 'Hà Nội',
    remote_option: false,
    employment_type: 'full_time',
    experience_level: 'mid',
    salary_range: {
      min: 18000000,
      max: 35000000
    },
    description: 'Chúng tôi đang tìm kiếm một Nhà thiết kế UI/UX sáng tạo để tham gia vào đội ngũ thiết kế của chúng tôi. Ứng viên lý tưởng nên có kinh nghiệm với các công cụ và nguyên tắc thiết kế UI/UX hiện đại.',
    requirements: [
      'Có ít nhất 3 năm kinh nghiệm với các công cụ thiết kế UI/UX (Figma, Adobe XD, Sketch)',
      'Hiểu biết sâu sắc về nguyên tắc thiết kế lấy người dùng làm trung tâm',
      'Kiến thức về hệ thống thiết kế và thư viện thành phần',
      'Kinh nghiệm với các công cụ tạo prototype và kiểm thử người dùng',
      'Kỹ năng giao tiếp xuất sắc và khả năng làm việc trong môi trường đa ngành'
    ],
    responsibilities: [
      'Tạo thiết kế lấy người dùng làm trung tâm bằng cách hiểu yêu cầu kinh doanh',
      'Thiết kế giao diện người dùng hấp dẫn và trải nghiệm người dùng liền mạch',
      'Tạo user flow, wireframe, prototype và mockup có tính khả thi cao',
      'Hợp tác chặt chẽ với lập trình viên để triển khai thiết kế',
      'Tiến hành nghiên cứu và kiểm thử người dùng để cải thiện sản phẩm',
      'Tạo và duy trì hệ thống thiết kế và hướng dẫn phong cách'
    ],
    qualifications: [
      'Bằng cử nhân Thiết kế hoặc các ngành liên quan',
      'Chứng chỉ về UX Research hoặc Interaction Design là một lợi thế',
      'Portfolio các dự án thiết kế ấn tượng'
    ],
    positions_count: 1,
    status: 'active',
    posting_date: '2025-09-25',
    closing_date: '2025-11-25'
  },
  {
    id: 'data-scientist',
    title: 'Chuyên gia Khoa học Dữ liệu',
    department: 'Phòng Phân tích Dữ liệu',
    location: 'Hà Nội',
    remote_option: true,
    employment_type: 'full_time',
    experience_level: 'senior',
    salary_range: {
      min: 30000000,
      max: 60000000
    },
    description: 'Chúng tôi đang tìm kiếm một Chuyên gia Khoa học Dữ liệu có kinh nghiệm để tham gia vào đội ngũ phân tích dữ liệu của chúng tôi. Ứng viên sẽ chịu trách nhiệm phát triển các mô hình machine learning và khai thác thông tin từ dữ liệu của công ty.',
    requirements: [
      'Có ít nhất 5 năm kinh nghiệm trong lĩnh vực khoa học dữ liệu và machine learning',
      'Thành thạo Python, R và các thư viện phân tích dữ liệu liên quan',
      'Kinh nghiệm sâu với các thuật toán machine learning và deep learning',
      'Hiểu biết về big data và các công cụ xử lý dữ liệu lớn',
      'Có kinh nghiệm với các dự án AI trong thực tế'
    ],
    responsibilities: [
      'Phát triển và triển khai các mô hình machine learning để giải quyết các vấn đề kinh doanh',
      'Phân tích và khai thác thông tin từ dữ liệu lớn',
      'Hợp tác với các bộ phận khác để tích hợp các giải pháp AI vào sản phẩm',
      'Theo dõi và cải thiện hiệu suất của các mô hình đã triển khai',
      'Nghiên cứu và áp dụng các kỹ thuật mới trong lĩnh vực AI/ML',
      'Đào tạo và hướng dẫn các nhà phân tích dữ liệu junior trong nhóm'
    ],
    qualifications: [
      'Bằng Thạc sĩ hoặc Tiến sĩ trong Khoa học Máy tính, Toán học, Thống kê hoặc các ngành liên quan',
      'Các chứng chỉ về Data Science, Machine Learning từ các tổ chức uy tín',
      'Các bài báo khoa học đã công bố là một lợi thế'
    ],
    positions_count: 1,
    status: 'active',
    posting_date: '2025-09-10',
    closing_date: '2025-11-10'
  }
];

type Props = {
  params: {
    id: string;
  };
};

export default async function JobDetail({ params }: Props) {
  // Access the id directly from params object
  const { id } = await params;
  const job = jobListings.find(job => job.id === id);
  
  if (!job) {
    notFound();
  }
  
  return (
    <div className="font-sans min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-16">
        <div className="bg-blue-600 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-4">
              <Link href="/careers" className="inline-flex items-center text-blue-200 hover:text-white">
                <svg className="mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Quay lại
              </Link>
            </div>
            <h1 className="text-3xl font-extrabold sm:text-4xl">
              {job.title}
            </h1>
            <div className="mt-4 flex flex-wrap gap-4 text-blue-200">
              <div className="flex items-center">
                <svg className="mr-1.5 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                {job.location}{job.remote_option ? ' / Remote' : ''}
              </div>
              <div className="flex items-center">
                <svg className="mr-1.5 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {job.employment_type === 'full_time' ? 'Toàn thời gian' : 
                 job.employment_type === 'part_time' ? 'Bán thời gian' : 
                 job.employment_type === 'contract' ? 'Hợp đồng' : 'Thực tập'}
              </div>
            </div>
          </div>
        </div>
        
        <section className="py-12">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="prose dark:prose-invert max-w-none">
              <p className="text-lg text-gray-700 dark:text-gray-300">
                {job.description}
              </p>
              
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-medium text-blue-700 dark:text-blue-300">Mức lương</h3>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(job.salary_range.min)} - 
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(job.salary_range.max)}
                  </p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-medium text-blue-700 dark:text-blue-300">Kinh nghiệm</h3>
                    <p className="mt-1 text-gray-700 dark:text-gray-300">
                      {job.experience_level === 'intern' ? 'Thực tập sinh' : 
                       job.experience_level === 'fresher' ? '1-2 năm' : 
                       job.experience_level === 'mid' ? '2-4 năm' : 
                       job.experience_level === 'senior' ? '5 năm trở lên' : 'Quản lý'}
                    </p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-medium text-blue-700 dark:text-blue-300">Phòng ban</h3>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{job.department}</p>
                </div>
                
                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-medium text-blue-700 dark:text-blue-300">Số vị trí</h3>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{job.positions_count}</p>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Yêu cầu</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  {job.requirements.map((requirement, index) => (
                    <li key={index}>{requirement}</li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Trách nhiệm công việc</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  {job.responsibilities.map((responsibility, index) => (
                    <li key={index}>{responsibility}</li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Bằng cấp & Chứng chỉ ưu tiên</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  {job.qualifications?.map((qualification, index) => (
                    <li key={index}>{qualification}</li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-8 bg-gray-50 dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Thông tin tuyển dụng</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Ngày đăng tuyển</p>
                    <p className="mt-1 text-gray-700 dark:text-gray-300">
                      {new Date(job.posting_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Hạn nộp hồ sơ</p>
                    <p className="mt-1 text-gray-700 dark:text-gray-300">
                      {new Date(job.closing_date).toLocaleDateString('vi-VN')}
                    </p>
                  </div>
                </div>
                
                <div className="mt-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    Bạn quan tâm đến vị trí này? Hãy gửi đơn ứng tuyển trước ngày {new Date(job.closing_date).toLocaleDateString('vi-VN')}!
                  </p>
                  <div className="mt-4">
                    <Link 
                      href={`/apply?position=${job.id}`} 
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Ứng tuyển ngay
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}