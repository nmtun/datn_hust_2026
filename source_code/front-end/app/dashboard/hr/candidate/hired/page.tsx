/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, 
  Plus, 
  Edit2, 
  Eye, 
  User, 
  Mail, 
  FileText,
  ArrowLeft,
  Building2,
  Send,
  Key,
  Copy
} from "lucide-react";
import { candidateApi, Candidate, CandidateInfo } from "@/app/api/candidateApi";
import { showToast } from "@/app/utils/toast";
import Modal from "@/app/components/Modal";
import { withAuth } from "@/app/middleware/withAuth";

function HiredCandidatesPage() {
  const router = useRouter();
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [hiredCandidates, setHiredCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isCreateEmailModalOpen, setIsCreateEmailModalOpen] = useState(false);
  const [createEmailLoading, setCreateEmailLoading] = useState(false);
  
  // Form data for creating company email
  const [emailFormData, setEmailFormData] = useState({
    company_email: "",
    password: "",
    confirmPassword: ""
  });

  const useDebounce = (value: string, delay: number) => {
    const [debouncedValue, setDebouncedValue] = useState(value);

    useEffect(() => {
      const handler = setTimeout(() => {
        setDebouncedValue(value);
      }, delay);

      return () => {
        clearTimeout(handler);
      };
    }, [value, delay]);

    return debouncedValue;
  };

  // Debounce search values
  const debouncedSearchName = useDebounce(searchName, 500);
  const debouncedSearchEmail = useDebounce(searchEmail, 500);

  useEffect(() => {
    fetchHiredCandidates();
  }, []);

  // Effect for handling search with debounced values
  useEffect(() => {
    if (!debouncedSearchName && !debouncedSearchEmail) {
      fetchHiredCandidates();
      return;
    }
    handleSearch();
  }, [debouncedSearchName, debouncedSearchEmail]);

  const fetchHiredCandidates = async () => {
    try {
      setLoading(true);
      // Sử dụng search với candidate_status = 'hired'
      const result = await candidateApi.search({ candidate_status: 'hired' });
      
      if (!result || result.error) {
        console.error("API Error:", result?.message || "Unknown error");
        setHiredCandidates([]);
        return;
      }

      const candidatesData = result.candidates;
      if (Array.isArray(candidatesData)) {
        // Lọc chỉ những ứng viên có ít nhất 1 application với status 'hired'
        const filteredCandidates = candidatesData.filter((candidate: Candidate) => 
          candidate.Candidate_Infos?.some((info: CandidateInfo) => info.candidate_status === 'hired')
        );
        setHiredCandidates(filteredCandidates);
      } else {
        console.error("Invalid candidates data format:", candidatesData);
        setHiredCandidates([]);
      }
    } catch (error) {
      console.error("Error fetching hired candidates:", error);
      setHiredCandidates([]);
      showToast.error('Error fetching hired candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!debouncedSearchName && !debouncedSearchEmail) {
      return;
    }

    try {
      setLoading(true);
      const query = {
        full_name: debouncedSearchName.trim() || undefined,
        personal_email: debouncedSearchEmail.trim() || undefined,
        candidate_status: 'hired', // Luôn tìm với status hired
      };

      const result = await candidateApi.search(query);

      if (!result || result.error) {
        console.error("API Error:", result?.message || "Unknown error");
        setHiredCandidates([]);
        return;
      }

      const candidatesData = result.candidates;
      if (Array.isArray(candidatesData)) {
        // Lọc chỉ những ứng viên có ít nhất 1 application với status 'hired'
        const filteredCandidates = candidatesData.filter((candidate: Candidate) => 
          candidate.Candidate_Infos?.some((info: CandidateInfo) => info.candidate_status === 'hired')
        );
        setHiredCandidates(filteredCandidates);
      } else {
        console.error("Invalid candidates data format:", candidatesData);
        setHiredCandidates([]);
      }
    } catch (error) {
      console.error("Error searching hired candidates:", error);
      setHiredCandidates([]);
      showToast.error('Error searching hired candidates');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    router.push("/dashboard/hr/candidate");
  };

  const handleView = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    setIsViewModalOpen(true);
  };

  const handleCreateCompanyEmail = (candidate: Candidate) => {
    setSelectedCandidate(candidate);
    // Tạo company_email mặc định từ tên và domain công ty
    const defaultEmail = generateDefaultCompanyEmail(candidate.full_name);
    setEmailFormData({
      company_email: defaultEmail,
      password: generateRandomPassword(),
      confirmPassword: ""
    });
    setIsCreateEmailModalOpen(true);
  };

  const generateDefaultCompanyEmail = (fullName: string) => {
    // Chuyển đổi tên thành format email (ví dụ: Nguyen Van A -> nguyen.van.a@company.com)
    const name = fullName
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove accents
      .replace(/\s+/g, '.')
      .replace(/[^a-z0-9.]/g, '');
    return `${name}@company.com`;
  };

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleEmailFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEmailFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCopyPassword = async () => {
    try {
      await navigator.clipboard.writeText(emailFormData.password);
      showToast.success('Password copied to clipboard!');
    } catch (error) {
      console.error('Failed to copy password:', error);
      showToast.error('Failed to copy password');
    }
  };

  const handleSubmitCompanyEmail = async () => {
    if (!selectedCandidate) return;

    // Validation
    if (!emailFormData.company_email.trim()) {
      showToast.error('Please enter company email');
      return;
    }

    if (!emailFormData.password.trim()) {
      showToast.error('Please enter password');
      return;
    }

    if (emailFormData.password !== emailFormData.confirmPassword) {
      showToast.error('Passwords do not match');
      return;
    }

    if (emailFormData.password.length < 8) {
      showToast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      setCreateEmailLoading(true);
      const result = await candidateApi.createCompanyEmail(selectedCandidate.user_id, {
        company_email: emailFormData.company_email,
        password: emailFormData.password
      });

      if (result.error) {
        throw new Error(result.message || 'Error creating company email');
      }

      showToast.success('Company email created and sent successfully!');
      setIsCreateEmailModalOpen(false);
      // Refresh the candidates list to show updated company_email
      await fetchHiredCandidates();
      
      // Reset form
      setEmailFormData({
        company_email: "",
        password: "",
        confirmPassword: ""
      });
    } catch (error: any) {
      console.error("Error creating company email:", error);
      showToast.error(error.message || 'Error creating company email');
    } finally {
      setCreateEmailLoading(false);
    }
  };

  const handleViewCV = (cvPath: string) => {
    if (cvPath) {
      const fileName = cvPath.split(/[/\\]/).pop();
      const viewUrl = `${process.env.NEXT_PUBLIC_API_URL}/uploads/${fileName}`;
      window.open(viewUrl, '_blank');
    }
  };

  const getStatusColor = (status: CandidateInfo["candidate_status"]) => {
    switch (status) {
      case "hired":
        return "bg-emerald-100 text-emerald-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Hired Candidates</h1>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchName}
              onChange={(e) => setSearchName(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex-1 relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by email..."
              value={searchEmail}
              onChange={(e) => setSearchEmail(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Hired Candidates Table */}
      <div className="bg-white shadow rounded-lg overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hired Position
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Company Email
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {hiredCandidates.map((candidate) => {
                // Lấy thông tin hired job đầu tiên
                const hiredJob = candidate.Candidate_Infos?.find(info => info.candidate_status === 'hired');
                
                return (
                  <tr key={candidate.user_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <User className="h-5 w-5 text-emerald-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{candidate.full_name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{candidate.personal_email}</div>
                      <div className="text-sm text-gray-500">{candidate.phone_number || 'No phone'}</div>
                    </td>
                    <td className="px-6 py-4">
                      {hiredJob && hiredJob.Job_Description ? (
                        <div className="border-l-2 border-emerald-200 pl-3 py-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-gray-900">
                                {hiredJob.Job_Description.title}
                              </div>
                              <div className="text-sm text-gray-500">
                                {hiredJob.Job_Description.experience_level} · {hiredJob.Job_Description.employment_type}
                              </div>
                              <span className={`mt-1 px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(hiredJob.candidate_status)}`}>
                                Hired
                              </span>
                            </div>
                            {hiredJob.cv_file_path && (
                              <button
                                onClick={() => handleViewCV(hiredJob.cv_file_path!)}
                                className="ml-2 text-green-400 hover:text-green-500 flex-shrink-0"
                                title="View CV">
                                <FileText className="w-6 h-6" />
                              </button>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400">No job information</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {candidate.company_email ? (
                        <div className="flex items-center">
                          <Building2 className="w-4 h-4 text-green-600 mr-2" />
                          <span className="text-sm text-gray-900">{candidate.company_email}</span>
                        </div>
                      ) : (
                        <span className="text-sm text-gray-400 italic">Not created</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end space-x-3">
                        <button 
                          onClick={() => handleView(candidate)}
                          className="text-gray-400 hover:text-gray-500"
                          title="View details">
                          <Eye className="w-5 h-5" />
                        </button>
                        {!candidate.company_email && (
                          <button 
                            onClick={() => handleCreateCompanyEmail(candidate)}
                            className="text-indigo-600 hover:text-indigo-500"
                            title="Create company email">
                            <Send className="w-5 h-5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
        
        {!loading && hiredCandidates.length === 0 && (
          <div className="text-center py-8">
            <Building2 className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No hired candidates found</h3>
            <p className="mt-1 text-sm text-gray-500">There are currently no candidates with hired status.</p>
          </div>
        )}
      </div>

      {/* View Candidate Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`${selectedCandidate?.full_name || "Candidate Details"}`}
      >
        {selectedCandidate && (
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Personal Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  <p className="mt-1">{selectedCandidate.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Personal Email</p>
                  <p className="mt-1">{selectedCandidate.personal_email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Company Email</p>
                  <p className="mt-1">{selectedCandidate.company_email || 'Not created'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="mt-1">{selectedCandidate.phone_number || 'Not provided'}</p>
                </div>
              </div>
              {selectedCandidate.address && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="mt-1">{selectedCandidate.address}</p>
                </div>
              )}
            </div>

            {/* Hired Job Information */}
            {selectedCandidate.Candidate_Infos && selectedCandidate.Candidate_Infos.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Hired Positions
                </h3>
                <div className="space-y-4">
                  {selectedCandidate.Candidate_Infos
                    .filter(info => info.candidate_status === 'hired')
                    .map((candidateInfo) => (
                    <div key={candidateInfo.candidate_info_id} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Status</p>
                          <p className="mt-1">
                            <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-emerald-100 text-emerald-800">
                              Hired
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Apply Date</p>
                          <p className="mt-1">{new Date(candidateInfo.apply_date).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {/* Job Information */}
                      {candidateInfo.Job_Description && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-500">Position</p>
                          <div className="mt-1 p-3 bg-white rounded-md border">
                            <p className="font-medium">{candidateInfo.Job_Description.title}</p>
                            <p className="text-sm text-gray-600">
                              {candidateInfo.Job_Description.experience_level} · {candidateInfo.Job_Description.employment_type}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* CV */}
                      {candidateInfo.cv_file_path && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">CV/Resume</p>
                          <div className="mt-1">
                            <button
                              onClick={() => handleViewCV(candidateInfo.cv_file_path!)}
                              className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View CV
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Create Company Email Modal */}
      <Modal
        isOpen={isCreateEmailModalOpen}
        onClose={() => setIsCreateEmailModalOpen(false)}
        title={`Create Company Email - ${selectedCandidate?.full_name}`}
      >
        <div className="space-y-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-red-800 mb-2">Lưu ý:</h4>
            <ul className="text-sm text-red-600 space-y-1">
              <li>- Email công ty sẽ được tạo để nhân viên truy cập hệ thống</li>
              <li>- Thông tin đăng nhập sẽ được gửi tự động đến email cá nhân của họ</li>
              <li>- Mật khẩu phải có ít nhất 8 ký tự</li>
            </ul>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Company Email *
            </label>
            <input
              type="email"
              name="company_email"
              value={emailFormData.company_email}
              onChange={handleEmailFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="employee@company.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password *
            </label>
            <div className="relative">
              <input
                type="text"
                name="password"
                value={emailFormData.password}
                onChange={handleEmailFormChange}
                className="w-full px-3 py-2 pr-20 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                placeholder="Enter password"
                required
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                <button
                  type="button"
                  onClick={handleCopyPassword}
                  className="text-gray-400 hover:text-gray-600"
                  title="Copy password"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const newPassword = generateRandomPassword();
                    setEmailFormData(prev => ({
                      ...prev,
                      password: newPassword,
                      confirmPassword: ""
                    }));
                  }}
                  className="text-sm text-indigo-600 hover:text-indigo-500"
                >
                  Generate
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password *
            </label>
            <input
              type="text"
              name="confirmPassword"
              value={emailFormData.confirmPassword}
              onChange={handleEmailFormChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              placeholder="Confirm password"
              required
            />
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              onClick={() => setIsCreateEmailModalOpen(false)}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitCompanyEmail}
              disabled={createEmailLoading}
              className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                createEmailLoading ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {createEmailLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2 inline-block" />
                  Creating & Sending...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 mr-2 inline-block" />
                  Create & Send Email
                </>
              )}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default withAuth(HiredCandidatesPage);
