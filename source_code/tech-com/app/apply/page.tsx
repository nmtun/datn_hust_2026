"use client";
import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useSearchParams, useRouter } from 'next/navigation';

// Danh sách vị trí công việc mẫu
const jobListings = [
  { id: 'frontend-developer', title: 'Lập trình viên Frontend' },
  { id: 'backend-developer', title: 'Lập trình viên Backend' },
  { id: 'ui-ux-designer', title: 'Nhà thiết kế UI/UX' },
];


export default function Apply() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const position = searchParams.get('position') || '';
  const selectedJob = position ? jobListings.find(job => job.id === position) : undefined;
  // Form state
  const [formData, setFormData] = useState<{ [key: string]: string }>({
    // position: position || '',
    full_name: '',
    personal_email: '',
    phone_number: '',
    address: '',
    coverLetter: ''
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Validate PDF and size <= 10MB
      if (file.type !== 'application/pdf') {
        setError('File phải là định dạng PDF');
        return;
      }
      if (file.size > 10 * 1024 * 1024) { // 10MB
        setError('Kích thước file vượt quá 10MB');
        return;
      }
      setError(null);
      setCvFile(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Basic required validations
    if (!formData.full_name || !formData.personal_email) {
      setError('Vui lòng điền đủ Họ tên, Email cá nhân và Mật khẩu.');
      return;
    }
    if (!cvFile) {
      setError('Vui lòng tải lên CV PDF.');
      return;
    }

    setSubmitting(true);
    const data = new FormData();
    // Map front-end fields to backend expected fields
    data.append('full_name', formData.full_name);
    data.append('personal_email', formData.personal_email);
    if (formData.phone_number) data.append('phone_number', formData.phone_number);
    if (formData.address) data.append('address', formData.address);
    if (formData.coverLetter) data.append('notes', formData.coverLetter);
    data.append('apply_date', new Date().toISOString());
    data.append('candidate_status', 'new');
    data.append('cv', cvFile);

    try {
      const baseUrl = process.env.NEXT_PUBLIC_API_URL;
    
      const res = await fetch(`${baseUrl}/api/candidates/create`, {
        method: 'POST',
        body: data,
        credentials: 'omit', 
      });
      const json = await res.json();
      if (!res.ok || json.error) {
        throw new Error(json.message || 'Gửi đơn thất bại');
      }
      setSuccess(true);
      setFormData(prev => ({
        ...prev,
        full_name: '',
        personal_email: '',
        phone_number: '',
        address: '',
        coverLetter: ''
      }));
      setCvFile(null);

      // Thông báo và chuyển về trang chủ sau 3s
      alert('Gửi đơn ứng tuyển thành công! Chuyển về trang chủ sau 3s');
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="font-sans min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow pt-16">
        <div className="bg-blue-600 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h1 className="text-3xl font-extrabold sm:text-4xl">
              Ứng tuyển vị trí
            </h1>
            {selectedJob && (
              <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
                Bạn đang ứng tuyển vào: <span className="font-semibold">{selectedJob.title}</span>
              </p>
            )}
          </div>
        </div>

        <section className="py-12 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 md:p-8">
              <form className="space-y-6" onSubmit={handleSubmit}>

                <div>
                  <div>
                    <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Họ và tên</label>
                    <input
                      type="text"
                      id="full_name"
                      name="full_name"
                      required
                      value={formData.full_name}
                      onChange={handleChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Ngày sinh
                  </label>
                  <input
                    type="date"
                    id="birthdate"
                    name="birthdate"
                    required
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="personal_email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                    <input
                      type="email"
                      id="personal_email"
                      name="personal_email"
                      required
                      value={formData.personal_email}
                      onChange={handleChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100"
                    />
                  </div>

                  <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Số điện thoại</label>
                    <input
                      type="tel"
                      id="phone_number"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Địa chỉ</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100"
                  />
                </div>

                <div>
                  <label htmlFor="resume" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    CV (Định dạng PDF)
                  </label>
                  <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 48 48"
                        aria-hidden="true"
                      >
                        <path
                          d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                      <div className="flex text-sm text-gray-600 dark:text-gray-400">
                        <label
                          htmlFor="file-upload"
                          className="relative cursor-pointer rounded-md font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 focus-within:outline-none"
                        >
                          <span>Tải lên file</span>
                          <input id="file-upload" name="cv" type="file" className="sr-only" accept="application/pdf,.pdf" required onChange={handleFileChange} />
                        </label>
                        <p className="pl-1">hoặc kéo thả</p>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        PDF tối đa 10MB
                      </p>
                      {cvFile && (
                        <p className="text-xs mt-2 text-green-600 dark:text-green-400">Đã chọn: {cvFile.name}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label htmlFor="coverLetter" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Thư giới thiệu
                  </label>
                  <textarea
                    id="coverLetter"
                    name="coverLetter"
                    rows={4}
                    value={formData.coverLetter}
                    onChange={handleChange}
                    className="mt-1 block w-full py-2 px-3 border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100"
                  ></textarea>
                </div>

                {error && (
                  <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
                )}
                {success && (
                  <div className="text-sm text-green-600 dark:text-green-400">Gửi đơn thành công!</div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    {submitting ? 'Đang gửi...' : 'Gửi đơn ứng tuyển'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
}