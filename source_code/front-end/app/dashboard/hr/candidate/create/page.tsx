/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, User, Building2, Upload } from "lucide-react";
import { candidateApi } from "@/app/api/candidateApi";
import { jobDescriptionApi } from "@/app/api/jobDescriptionApi";
import { showToast } from "@/app/utils/toast";
import { withAuth } from "@/app/middleware/withAuth";

interface JobDescription {
  job_id: number;
  title: string;
  experience_level: string;
  employment_type: string;
  type_of_work?: string;
  status: 'draft' | 'active' | 'paused' | 'closed';
  department?: {
    department_id: number;
    name: string;
    code: string;
  } | null;
}

function CreateCandidatePage() {
  const router = useRouter();

  const [saving, setSaving] = useState(false);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);

  // Form data state
  const [formData, setFormData] = useState({
    full_name: "",
    personal_email: "",
    phone_number: "",
    address: "",
    job_id: "",
    candidate_status: "new" as "new" | "screening" | "interview" | "offered" | "rejected" | "hired",
    source: "website",
    cover_letter: "",
  });

  // CV file state
  const [cvFile, setCvFile] = useState<File | null>(null);

  useEffect(() => {
    fetchJobDescriptions();
  }, []);

  const selectedJob = jobDescriptions.find(
    (job) => Number(job.job_id) === Number(formData.job_id)
  );

  const fetchJobDescriptions = async () => {
    try {
      setLoadingJobs(true);
      const result = await jobDescriptionApi.getAll();
      if (!result.error) {
        const jobs = Array.isArray(result.jobs) ? result.jobs : [];
        const activeJobs = jobs.filter((job: JobDescription) => job.status === 'active');
        setJobDescriptions(activeJobs);
      }
    } catch (error) {
      console.error("Error fetching job descriptions:", error);
      showToast.error('Failed to load job positions');
    } finally {
      setLoadingJobs(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];

      if (!allowedTypes.includes(file.type)) {
        showToast.error('Only PDF, DOC, DOCX files are allowed');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        showToast.error('CV file size must be less than 10MB');
        return;
      }

      setCvFile(file);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate required fields
      if (!formData.full_name.trim() || !formData.personal_email.trim()) {
        showToast.error('Please fill in all required fields');
        return;
      }

      if (!formData.job_id) {
        showToast.error('Please select a job position');
        return;
      }

      if (!cvFile) {
        showToast.error('Please upload candidate CV');
        return;
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.personal_email.trim())) {
        showToast.error('Please enter a valid email address');
        return;
      }

      // Prepare form data for API
      const apiFormData = new FormData();
      
      // Add all form fields
      Object.entries(formData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          apiFormData.append(key, String(value));
        }
      });

      // Add CV file if selected
      if (cvFile) {
        apiFormData.append('cv', cvFile);
      }

      // Add current date as apply_date
      apiFormData.append('apply_date', new Date().toISOString().split('T')[0]);

      const result = await candidateApi.create(apiFormData);
      
      if (result.error) {
        throw new Error(result.message || 'Error creating candidate');
      }

      showToast.success('Candidate created successfully');
      router.push('/dashboard/hr/candidate');
    } catch (error: any) {
      console.error("Error creating candidate:", error);
      showToast.error(error.message || 'Error creating candidate');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/hr/candidate');
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Tạo Ứng Viên Mới</h1>
        </div>
      </div>

      <div className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Thông tin cá nhân
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Full Name *
              </label>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter candidate's full name"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email *
              </label>
              <input
                type="email"
                name="personal_email"
                value={formData.personal_email}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter candidate's email"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Số điện thoại
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter phone number"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nguồn ứng tuyển
              </label>
              <select
                name="source"
                value={formData.source}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="website">Website</option>
                <option value="topcv">TopCV</option>
                <option value="linkedin">LinkedIn</option>
                <option value="referral">Referral</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Địa chỉ
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter candidate's address"
            />
          </div>
        </div>

        {/* Job Application Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <Building2 className="w-5 h-5 mr-2" />
            Thông tin đơn ứng tuyển
          </h2>
          {jobDescriptions.length === 0 && !loadingJobs && (
            <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
              Không tìm thấy mô tả công việc nào. Vui lòng tạo và kích hoạt một JD trước khi tạo ứng viên.
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Vị trí ứng tuyển *
              </label>
              <select
                name="job_id"
                value={formData.job_id}
                onChange={handleInputChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="">{loadingJobs ? 'Loading positions...' : 'Select a job position'}</option>
                {jobDescriptions.map(job => (
                  <option key={job.job_id} value={job.job_id}>
                    {job.title} - {job.department?.name || 'No department'} ({job.experience_level} · {job.employment_type})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Trạng thái đơn ứng tuyển
              </label>
              <select
                name="candidate_status"
                value={formData.candidate_status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="new">New</option>
                <option value="screening">Screening</option>
                <option value="interview">Interview</option>
                <option value="offered">Offered</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>
          </div>

          {selectedJob && (
            <div className="mt-4 rounded-md border border-indigo-100 bg-indigo-50 p-4">
              <h3 className="text-sm font-semibold text-indigo-900 mb-2">Chọn vị trí ứng tuyển</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-indigo-900">
                <p><span className="font-medium">Position:</span> {selectedJob.title}</p>
                <p><span className="font-medium">Department:</span> {selectedJob.department?.name || 'No department'}</p>
                <p><span className="font-medium">Level:</span> {selectedJob.experience_level}</p>
                <p><span className="font-medium">Type:</span> {selectedJob.employment_type}{selectedJob.type_of_work ? ` · ${selectedJob.type_of_work}` : ''}</p>
              </div>
            </div>
          )}
          
          {/* CV Upload */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              CV/Resume
            </label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-4">
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  onChange={handleFileChange}
                  className="hidden"
                  id="cv-upload"
                />
                <label
                  htmlFor="cv-upload"
                  className="cursor-pointer inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Chọn file CV
                </label>
                {cvFile && (
                  <p className="mt-2 text-sm text-gray-600">
                    Đã chọn: {cvFile.name}
                  </p>
                )}
              </div>
              <p className="text-xs text-gray-500 mt-2">
                Định dạng được hỗ trợ: PDF (Tối đa 10MB)
              </p>
            </div>
          </div>

          {/* Cover Letter */}
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thư xin ứng tuyển / Ghi chú thêm
            </label>
            <textarea
              name="cover_letter"
              value={formData.cover_letter}
              onChange={handleInputChange}
              rows={6}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Enter cover letter or additional notes..."
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pb-6">
          <button
            onClick={handleBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Hủy
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
              saving ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {saving ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block" />
                Đang tạo...
              </>
            ) : (
              'Tạo Ứng viên'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default withAuth(CreateCandidatePage);