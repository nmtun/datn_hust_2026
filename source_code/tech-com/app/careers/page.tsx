'use client';

import { useEffect, useState } from 'react';
import { JobDescriptionApi } from '../api/jobDescriptionApi';
import Header from '../components/Header';
import Footer from '../components/Footer';
import Link from 'next/link';

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

export default function Careers() {
  const [jobListings, setJobListings] = useState<JobDescription[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchJobDescriptions() {
      try {
        setIsLoading(true);
        const result = await JobDescriptionApi.getAll();
        if (!result.error && result.jobs) {
          // Filter only active jobs
          const activeJobs = result.jobs.filter(
            (job: JobDescription) => job.status === 'active' || job.status === 'published'
          );
          setJobListings(activeJobs);
        } else {
          setError('Failed to fetch job listings');
        }
      } catch (err) {
        setError('An error occurred while fetching job descriptions');
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchJobDescriptions();
  }, []);

  return (
    <div className="font-sans min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-16">
        <div className="bg-blue-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-extrabold sm:text-4xl">
              Tham gia Đội ngũ của Chúng tôi
            </h1>
            <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
              Khám phá cơ hội nghề nghiệp hấp dẫn tại TechCom
            </p>
          </div>
        </div>
        
        <section className="py-16 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-8">
              Vị trí đang tuyển
            </h2>
            
            {isLoading ? (
              <div className="flex justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
              </div>
            ) : error ? (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                <p>{error}</p>
              </div>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {jobListings.length > 0 ? (
                  jobListings.map((job, idx) => (
                    <div 
                      key={job.job_id ?? `job-${idx}`} 
                      className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-shadow flex flex-col h-full"
                    >
                      <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 h-14 line-clamp-2">{job.title}</h3>
                      <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <svg className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className="truncate">
                          {job.location || 'Không có thông tin vị trí'}
                          {job.type_of_work && <span className="ml-1">({job.type_of_work})</span>}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <svg className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span className="truncate">{job.employment_type === 'full-time' ? 'Full time' : 'Part time'}</span>
                      </div>
                      <div className="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <svg className="mr-1.5 h-5 w-5 flex-shrink-0 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span className="truncate">
                        {job.experience_level === 'intern' ? 'Không yêu cầu' : 
                         job.experience_level === 'fresher' ? '1-2 năm' :
                         job.experience_level === 'mid' ? '3-5 năm' : '5 năm trở lên'}
                        </span>
                      </div>
                      <div className="mt-4 flex-grow">
                        <p className="text-sm text-gray-700 dark:text-gray-300 line-clamp-3 h-18">
                          {job.description}
                        </p>
                      </div>
                      <div className="mt-4">
                        <div className="text-sm mb-2">
                          <span className="font-medium text-gray-900 dark:text-gray-100">Mức lương: </span>
                          <span className="text-gray-700 dark:text-gray-300">
                            {new Intl.NumberFormat('vi-VN').format(job.salary_range_min)} - {new Intl.NumberFormat('vi-VN').format(job.salary_range_max)} VND
                          </span>
                        </div>
                        <Link 
                          href={`/careers/${job.job_id}`} 
                          className="inline-flex items-center justify-center w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                        >
                          Xem chi tiết
                        </Link>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-3 text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">Hiện không có vị trí nào đang tuyển dụng</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </section>

        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
              Tại sao nên tham gia TechCom?
            </h2>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Tại TechCom, chúng tôi cung cấp một môi trường hợp tác và sáng tạo nơi bạn có thể phát triển sự nghiệp và làm việc trên các dự án thú vị.
            </p>
            
            <div className="mt-12 grid gap-8 md:grid-cols-3">
              <div className="p-6">
                <div className="text-blue-600 dark:text-blue-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">Phát triển Sự nghiệp</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Cơ hội phát triển chuyên môn và thăng tiến trong sự nghiệp.</p>
              </div>
              
              <div className="p-6">
                <div className="text-blue-600 dark:text-blue-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">Đội ngũ Hợp tác</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Làm việc với những cá nhân tài năng và đam mê công nghệ.</p>
              </div>
              
              <div className="p-6">
                <div className="text-blue-600 dark:text-blue-400 mb-4">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                </div>
                <h3 className="text-xl font-medium text-gray-900 dark:text-gray-100">Phúc lợi Cạnh tranh</h3>
                <p className="mt-2 text-gray-600 dark:text-gray-400">Lương cạnh tranh, phúc lợi sức khỏe, lựa chọn làm việc linh hoạt và nhiều hơn nữa.</p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}