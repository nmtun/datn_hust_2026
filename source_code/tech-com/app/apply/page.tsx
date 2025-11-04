"use client";
import React, { useState, useEffect, useRef } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { useRouter, useSearchParams } from 'next/navigation';
import { JobDescriptionApi } from '../api/jobDescriptionApi';
import { CandidateApi } from '../api/candidateApi';
import { validateEmail, validateVietnamPhoneNumber, validateName, validateAge } from '../../utils/validate';

interface JobInfo {
  job_id: number;
  title: string;
}

export default function Apply() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const formRef = useRef<HTMLDivElement>(null);
  const [jobPosition, setJobPosition] = useState<string>('');
  const [jobTitle, setJobTitle] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  
  // Form state
  const [formData, setFormData] = useState({
    full_name: '',
    birthdate: '',
    personal_email: '',
    phone_number: '',
    address: '',
    coverLetter: ''
  });
  const [formErrors, setFormErrors] = useState({
    full_name: '',
    birthdate: '',
    personal_email: '',
    phone_number: ''
  });
  const [cvFile, setCvFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Get job details from URL parameters
  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        const positionId = searchParams.get('position');
        
        if (!positionId) {
          setError('Không tìm thấy thông tin vị trí ứng tuyển');
          return;
        }
        
        setJobPosition(positionId);
        
        // Get job title if possible
        try {
          const result = await JobDescriptionApi.getById(Number(positionId));
          if (!result.error && result.job) {
            setJobTitle(result.job.title);
          }
        } catch (err) {
          console.error('Error fetching job details:', err);
        }
      } catch (error) {
        console.error('Error processing job position:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchJobDetails();
  }, [searchParams]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Real-time validation
    if (name === 'full_name') {
      if (value && !validateName(value)) {
        setFormErrors(prev => ({ ...prev, full_name: 'Tên không được chứa số hoặc ký tự đặc biệt' }));
      } else {
        setFormErrors(prev => ({ ...prev, full_name: '' }));
      }
    }
    else if (name === 'birthdate') {
      if (value && !validateAge(value)) {
        setFormErrors(prev => ({ ...prev, birthdate: 'Bạn phải đủ 18 tuổi để ứng tuyển' }));
      } else {
        setFormErrors(prev => ({ ...prev, birthdate: '' }));
      }
    }
    else if (name === 'personal_email') {
      if (value && !validateEmail(value)) {
        setFormErrors(prev => ({ ...prev, personal_email: 'Email không hợp lệ' }));
      } else {
        setFormErrors(prev => ({ ...prev, personal_email: '' }));
      }
    } 
    else if (name === 'phone_number') {
      if (value && !validateVietnamPhoneNumber(value)) {
        setFormErrors(prev => ({ ...prev, phone_number: 'Số điện thoại không hợp lệ (phải bắt đầu bằng 03, 05, 07, 08, 09 và có 10 số)' }));
      } else {
        setFormErrors(prev => ({ ...prev, phone_number: '' }));
      }
    }
  };
  
  const validateAndSetFile = (file: File) => {
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
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Basic validations
    if (!jobPosition) {
      setError('Không tìm thấy thông tin vị trí ứng tuyển.');
      return;
    }
    if (!formData.full_name || !formData.personal_email || !formData.birthdate) {
      setError('Vui lòng điền đầy đủ thông tin bắt buộc (có dấu *).');
      return;
    }
    if (!cvFile) {
      setError('Vui lòng tải lên CV PDF.');
      return;
    }
    
    // Validate name
    if (!validateName(formData.full_name)) {
      setError('Tên không được chứa số hoặc ký tự đặc biệt.');
      return;
    }
    
    // Age validation
    if (!validateAge(formData.birthdate)) {
      setError('Bạn phải đủ 18 tuổi để ứng tuyển.');
      return;
    }
    
    // Email validation
    if (!validateEmail(formData.personal_email)) {
      setError('Email không hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }
    
    // Phone number validation (if provided)
    if (formData.phone_number && !validateVietnamPhoneNumber(formData.phone_number)) {
      setError('Số điện thoại không hợp lệ. Vui lòng nhập đúng định dạng số điện thoại Việt Nam.');
      return;
    }
    
    // Check if any form errors exist
    if (Object.values(formErrors).some(error => error !== '')) {
      setError('Vui lòng sửa các lỗi trong biểu mẫu trước khi gửi.');
      return;
    }

    setSubmitting(true);
    const data = new FormData();
    
    // Map form fields to backend expected fields
    data.append('full_name', formData.full_name);
    data.append('personal_email', formData.personal_email);
    data.append('birthdate', formData.birthdate);
    if (formData.phone_number) data.append('phone_number', formData.phone_number);
    if (formData.address) data.append('address', formData.address);
    if (formData.coverLetter) data.append('notes', formData.coverLetter);
    data.append('job_id', jobPosition);
    data.append('apply_date', new Date().toISOString().split('T')[0]);
    data.append('candidate_status', 'new');
    data.append('role', 'candidate');
    data.append('cv', cvFile);

    try {
      const result = await CandidateApi.submitApplication(data);
      
      if (result.error) {
        throw new Error(result.message || 'Gửi đơn thất bại');
      }
      
      setSuccess(true);
      setFormData({
        full_name: '',
        birthdate: '',
        personal_email: '',
        phone_number: '',
        address: '',
        coverLetter: ''
      });
      setCvFile(null);
      
      // Scroll to success message
      if (formRef.current) {
        formRef.current.scrollIntoView({ behavior: 'smooth' });
      }

      // Redirect to home page after success
      setTimeout(() => {
        router.push('/');
      }, 3000);
    } catch (err: any) {
      setError(err.message || 'Có lỗi xảy ra khi gửi đơn ứng tuyển.');
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
            {loading ? (
              <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">Đang tải thông tin...</p>
            ) : (
              <p className="mt-4 text-xl text-blue-100 max-w-2xl mx-auto">
                Bạn đang ứng tuyển vào: <span className="font-semibold">
                  {jobTitle || 'Vị trí công việc'}
                </span>
              </p>
            )}
          </div>
        </div>

        <section className="py-12 bg-gray-50 dark:bg-gray-900">
          <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
            <div ref={formRef} className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 md:p-8">
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Họ và tên</label>
                  <input
                    type="text"
                    id="full_name"
                    name="full_name"
                    required
                    value={formData.full_name}
                    onChange={handleChange}
                    className={`mt-1 block w-full py-2 px-3 border ${formErrors.full_name ? 'border-red-300 ring-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                    placeholder="VD: Nguyễn Văn A"
                  />
                  {formErrors.full_name && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.full_name}</p>
                  )}
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
                    value={formData.birthdate}
                    onChange={handleChange}
                    className={`mt-1 block w-full py-2 px-3 border ${formErrors.birthdate ? 'border-red-300 ring-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                    max={new Date().toISOString().split('T')[0]}
                  />
                  {formErrors.birthdate && (
                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.birthdate}</p>
                  )}
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
                      className={`mt-1 block w-full py-2 px-3 border ${formErrors.personal_email ? 'border-red-300 ring-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                      placeholder="VD: email@example.com"
                    />
                    {formErrors.personal_email && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.personal_email}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone_number" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Số điện thoại</label>
                    <input
                      type="tel"
                      id="phone_number"
                      name="phone_number"
                      value={formData.phone_number}
                      onChange={handleChange}
                      className={`mt-1 block w-full py-2 px-3 border ${formErrors.phone_number ? 'border-red-300 ring-red-500' : 'border-gray-300 dark:border-gray-700'} bg-white dark:bg-gray-900 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm text-gray-900 dark:text-gray-100`}
                      placeholder="VD: 0912345678"
                    />
                    {formErrors.phone_number && (
                      <p className="mt-1 text-sm text-red-600 dark:text-red-400">{formErrors.phone_number}</p>
                    )}
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
                    placeholder="VD: 123 Đường ABC, Quận X, TP. Hà Nội"
                  />
                </div>

                <div>
                  <label htmlFor="resume" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    CV (Định dạng PDF)
                  </label>
                  <div 
                    className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 dark:border-gray-700 border-dashed rounded-md"
                    onDrop={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                        validateAndSetFile(e.dataTransfer.files[0]);
                      }
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                    onDragEnter={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                    }}
                  >
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
                    Thư tự giới thiệu
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
                  <div id="error-message" className="p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-600 dark:bg-red-900 dark:border-red-800 dark:text-red-300">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path>
                      </svg>
                      {error}
                    </div>
                  </div>
                )}
                {success && (
                  <div id="success-message" className="p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-600 dark:bg-green-900 dark:border-green-800 dark:text-green-300">
                    <div className="flex items-center">
                      <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"></path>
                      </svg>
                      Gửi đơn thành công! Chúng tôi sẽ sớm liên hệ với bạn. Bạn sẽ được chuyển về trang chủ sau 3 giây.
                    </div>
                  </div>
                )}

                <div className="mt-6 flex justify-end">
                  <button
                    type="submit"
                    disabled={submitting || !!formErrors.full_name || !!formErrors.birthdate || !!formErrors.personal_email || !!formErrors.phone_number}
                    className={`inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
                      submitting || !!formErrors.full_name || !!formErrors.birthdate || !!formErrors.personal_email || !!formErrors.phone_number 
                        ? 'bg-blue-400 cursor-not-allowed' 
                        : 'bg-blue-600 hover:bg-blue-700'
                    }`}
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