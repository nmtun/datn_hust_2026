'use client';

import { useState, useEffect } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { JobDescriptionApi } from '../../api/jobDescriptionApi';

interface JobDescription {
  job_id: number;
  title: string;
  department_id?: number;
  location?: string;
  type_of_work?: string;
  employment_type: string;
  experience_level: string;
  salary_range_min: number;
  salary_range_max: number;
  description: string;
  requirements: string;
  responsibilities: string;
  qualifications: string;
  positions_count?: number;
  status: string;
  posting_date?: string;
  closing_date?: string;
}

const parseStringToArray = (str: string | null): string[] => {
  if (!str) return [];
  return str.split('\n').filter(item => item.trim() !== '');
};

export default function JobDetail() {
  const params = useParams();
  const idParam = params?.id ? Number(params.id) : null;

  const [job, setJob] = useState<JobDescription | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showApplyModal, setShowApplyModal] = useState<boolean>(false);

  useEffect(() => {
    async function fetchJobDescription() {
      try {
        setIsLoading(true);
        if (!idParam) {
          setError('ID không hợp lệ');
          return;
        }

        const result = await JobDescriptionApi.getById(idParam);
        if (!result.error && result.job) {
          setJob(result.job);
        } else {
          setError('Không tìm thấy công việc');
        }
      } catch (err) {
        setError('Lỗi khi tải dữ liệu công việc');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }

    fetchJobDescription();
  }, [idParam]);


  // Parse requirements, responsibilities, and qualifications to arrays if job exists
  const requirementsArray = job ? parseStringToArray(job.requirements) : [];
  const responsibilitiesArray = job ? parseStringToArray(job.responsibilities) : [];
  const qualificationsArray = job ? parseStringToArray(job.qualifications) : [];

  // Format date function
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('vi-VN').format(date);
  };

  if (isLoading) {
    return (
      <div className="font-sans min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow pt-16 flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="font-sans min-h-screen flex flex-col">
        <Header />
        <main className="flex-grow pt-16">
          <div className="max-w-3xl mx-auto px-4 py-8">
            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
              <p>{error || 'Job not found'}</p>
              <Link href="/careers" className="text-blue-600 hover:text-blue-800 font-medium mt-2 inline-block">
                Quay lại danh sách việc làm
              </Link>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
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
                {job.location || 'Không có thông tin vị trí'}
              </div>
              <div className="flex items-center">
                <svg className="mr-1.5 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {job.employment_type === 'full-time' ? 'Full time' : 'Part time'}
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
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(job.salary_range_min)} -
                    {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(job.salary_range_max)}
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-medium text-blue-700 dark:text-blue-300">Kinh nghiệm</h3>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">
                    {job.experience_level === 'intern' ? 'Không yêu cầu' :
                      job.experience_level === 'fresher' ? '1-2 năm' :
                        job.experience_level === 'mid' ? '3-5 năm' : '5 năm trở lên'}
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-medium text-blue-700 dark:text-blue-300">Phòng ban</h3>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">
                    {job.department_id ? `ID phòng ban: ${job.department_id}` : 'Không có thông tin phòng ban'}
                  </p>
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
                  <h3 className="font-medium text-blue-700 dark:text-blue-300">Số vị trí</h3>
                  <p className="mt-1 text-gray-700 dark:text-gray-300">{job.positions_count || 'Không xác định'}</p>
                </div>
              </div>

              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Yêu cầu</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  {requirementsArray.map((requirement, index) => (
                    <li key={index}>{requirement}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Trách nhiệm công việc</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  {responsibilitiesArray.map((responsibility, index) => (
                    <li key={index}>{responsibility}</li>
                  ))}
                </ul>
              </div>

              <div className="mt-8">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Bằng cấp & Chứng chỉ ưu tiên</h2>
                <ul className="list-disc pl-6 space-y-2 text-gray-700 dark:text-gray-300">
                  {qualificationsArray.map((qualification, index) => (
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
                      {formatDate(job.posting_date)}
                    </p>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Hạn nộp hồ sơ</p>
                    <p className="mt-1 text-gray-700 dark:text-gray-300">
                      {formatDate(job.closing_date)}
                    </p>
                  </div>
                </div>

                <div className="mt-6">
                  <p className="text-gray-700 dark:text-gray-300">
                    Bạn quan tâm đến vị trí này? Hãy gửi đơn ứng tuyển trước ngày {formatDate(job.closing_date)}!
                  </p>
                  <div className="mt-4">
                    <button
                      onClick={() => setShowApplyModal(true)}
                      className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Ứng tuyển ngay
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />

      {/* Modal xác nhận ứng tuyển */}
      {showApplyModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  Xác nhận ứng tuyển: {job.title}
                </h3>
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                >
                  <svg className="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Thông tin vị trí</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Vị trí công việc:</p>
                    <p className="text-gray-700 dark:text-gray-300">{job.title}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Địa điểm:</p>
                    <p className="text-gray-700 dark:text-gray-300">{job.location || 'Không có thông tin'}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Mức lương:</p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(job.salary_range_min)} -
                      {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(job.salary_range_max)}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Kinh nghiệm:</p>
                    <p className="text-gray-700 dark:text-gray-300">
                      {job.experience_level === 'intern' ? 'Không yêu cầu' :
                        job.experience_level === 'fresher' ? '1-2 năm' :
                          job.experience_level === 'mid' ? '3-5 năm' : '5 năm trở lên'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">Yêu cầu chính</h4>
                <ul className="list-disc pl-6 space-y-1 text-gray-700 dark:text-gray-300">
                  {requirementsArray.slice(0, 3).map((requirement, index) => (
                    <li key={index}>{requirement}</li>
                  ))}
                  {requirementsArray.length > 3 && <li>...</li>}
                </ul>
              </div>

              <p className="text-gray-700 dark:text-gray-300 mb-6">
                Bạn sẽ được chuyển đến trang ứng tuyển để điền thông tin chi tiết và gửi hồ sơ.
              </p>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowApplyModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600"
                >
                  Quay lại
                </button>
                <Link
                  href={`/apply?position=${job.job_id}`}
                  className="px-4 py-2 border border-transparent rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  Tiếp tục ứng tuyển
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}