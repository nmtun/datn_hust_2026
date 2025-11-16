/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, User, Mail, Phone, MapPin, Building2, Calendar, FileText } from "lucide-react";
import { candidateApi, Candidate, CandidateInfo } from "@/app/api/candidateApi";
import { jobDescriptionApi } from "@/app/api/jobDescriptionApi";
import { showToast } from "@/app/utils/toast";
import { withAuth } from "@/app/middleware/withAuth";

interface JobDescription {
  job_id: number;
  title: string;
  experience_level: string;
  employment_type: string;
}

function EditCandidatePage() {
  const router = useRouter();
  const params = useParams();
  const candidateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);

  // Form data state
  const [formData, setFormData] = useState({
    full_name: "",
    personal_email: "",
    phone_number: "",
    address: "",
    status: "active" as "active" | "on_leave" | "terminated",
  });

  // Applications data
  const [applications, setApplications] = useState<CandidateInfo[]>([]);

  useEffect(() => {
    if (candidateId) {
      fetchCandidate();
      fetchJobDescriptions();
    }
  }, [candidateId]);

  const fetchCandidate = async () => {
    try {
      setLoading(true);
      const result = await candidateApi.getById(Number(candidateId));
      
      if (result.error) {
        showToast.error('Error loading candidate data');
        router.push('/dashboard/hr/candidate');
        return;
      }

      const candidateData = result.candidate;
      setCandidate(candidateData);
      
      // Set form data
      setFormData({
        full_name: candidateData.full_name || "",
        personal_email: candidateData.personal_email || "",
        phone_number: candidateData.phone_number || "",
        address: candidateData.address || "",
        status: candidateData.status || "active",
      });

      // Set applications data
      setApplications(candidateData.Candidate_Infos || []);
    } catch (error) {
      console.error("Error fetching candidate:", error);
      showToast.error('Error loading candidate data');
      router.push('/dashboard/hr/candidate');
    } finally {
      setLoading(false);
    }
  };

  const fetchJobDescriptions = async () => {
    try {
      const result = await jobDescriptionApi.getAll();
      if (!result.error) {
        setJobDescriptions(result.jobs || []);
      }
    } catch (error) {
      console.error("Error fetching job descriptions:", error);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleApplicationChange = (index: number, field: string, value: any) => {
    setApplications(prev => prev.map((app, i) => 
      i === index ? { ...app, [field]: value } : app
    ));
  };

  const handleSaveApplication = async (index: number) => {
    try {
      const application = applications[index];
      if (!application.candidate_info_id) return;

      const result = await candidateApi.updateApplication(application.candidate_info_id, {
        candidate_status: application.candidate_status,
        evaluation: application.evaluation
        // Note: cover_letter is now read-only and not updated
      });

      if (result.error) {
        throw new Error(result.message || 'Error updating application');
      }

      showToast.success('Application updated successfully');
    } catch (error: any) {
      console.error("Error updating application:", error);
      showToast.error(error.message || 'Error updating application');
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

      // 1. Cập nhật thông tin cơ bản của candidate
      const userResult = await candidateApi.update(Number(candidateId), formData);
      
      if (userResult.error) {
        throw new Error(userResult.message || 'Error updating candidate information');
      }

      // 2. Cập nhật từng application nếu có thay đổi
      const originalApplications = candidate?.Candidate_Infos || [];
      const updatePromises = applications.map(async (app, index) => {
        const originalApp = originalApplications[index];
        
        // Kiểm tra xem có thay đổi gì không
        const hasChanges = (
          app.candidate_status !== originalApp?.candidate_status ||
          app.evaluation !== originalApp?.evaluation
          // Note: cover_letter is now read-only and not checked for changes
        );

        if (hasChanges && app.candidate_info_id) {
          return candidateApi.updateApplication(app.candidate_info_id, {
            candidate_status: app.candidate_status,
            evaluation: app.evaluation
            // Note: cover_letter is now read-only and not updated
          });
        }
        return Promise.resolve({ error: false });
      });

      const applicationResults = await Promise.all(updatePromises);
      const failedUpdates = applicationResults.filter(result => result.error);
      
      if (failedUpdates.length > 0) {
        showToast.error('Some application updates failed');
      } else {
        showToast.success('Candidate updated successfully');
      }

      router.push('/dashboard/hr/candidate');
    } catch (error: any) {
      console.error("Error updating candidate:", error);
      showToast.error(error.message || 'Error updating candidate');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    router.push('/dashboard/hr/candidate');
  };

  const getStatusColor = (status: CandidateInfo["candidate_status"]) => {
    switch (status) {
      case "new":
        return "bg-blue-500 text-white";
      case "screening":
        return "bg-amber-500 text-white";
      case "interview":
        return "bg-purple-600 text-white";
      case "offered":
        return "bg-green-600 text-white";
      case "hired":
        return "bg-emerald-600 text-white";
      case "rejected":
        return "bg-red-600 text-white";
      default:
        return "bg-gray-500 text-white";
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="text-center py-8">
        <h3 className="mt-2 text-sm font-medium text-gray-900">Candidate not found</h3>
        <p className="mt-1 text-sm text-gray-500">The candidate you're looking for doesn't exist.</p>
      </div>
    );
  }

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
          <h1 className="text-2xl font-bold text-gray-900">Edit Candidate</h1>
        </div>
      </div>

      <div className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Personal Information
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
                className="w-full px-3 py-2 border-2 border-indigo-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
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
                className="w-full px-3 py-2 border-2 border-indigo-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone_number"
                value={formData.phone_number}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border-2 border-indigo-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border-2 border-indigo-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="active">Active</option>
                <option value="on_leave">On Leave</option>
                <option value="terminated">Terminated</option>
              </select>
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Address
            </label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleInputChange}
              rows={3}
              className="w-full px-3 py-2 border-2 border-indigo-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>

        {/* Job Applications */}
        {applications.length > 0 && (
          <div className="bg-white shadow rounded-lg p-6">
            <h2 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
              <Building2 className="w-5 h-5 mr-2" />
              Job Applications ({applications.length})
            </h2>
            <div className="space-y-4">
              {applications.map((application, index) => (
                <div key={application.candidate_info_id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Applied Position
                      </label>
                      <div className="p-3 bg-gray-50 rounded-md border border-gray-300">
                        <p className="font-medium text-sm text-gray-700">
                          {application.Job_Description?.title || 'No job title'}
                        </p>
                        <p className="text-xs text-gray-500">
                          {application.Job_Description?.experience_level} · {application.Job_Description?.employment_type}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Application Status
                      </label>
                      <select
                        value={application.candidate_status}
                        onChange={(e) => handleApplicationChange(index, 'candidate_status', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-indigo-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      >
                        <option value="new">New</option>
                        <option value="screening">Screening</option>
                        <option value="interview">Interview</option>
                        <option value="offered">Offered</option>
                        <option value="hired">Hired</option>
                        <option value="rejected">Rejected</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Apply Date
                      </label>
                      <div className="p-3 bg-gray-50 rounded-md border border-gray-300">
                        <p className="text-sm text-gray-700">
                          {new Date(application.apply_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Evaluation Score (1-10)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="10"
                        value={application.evaluation || ''}
                        onChange={(e) => handleApplicationChange(index, 'evaluation', Number(e.target.value))}
                        className="w-full px-3 py-2 border-2 border-indigo-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>
                  
                  {/* Source */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Source
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-300">
                      <p className="text-sm text-gray-700">{application.source || 'Not specified'}</p>
                    </div>
                  </div>

                  {/* Cover Letter */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Cover Letter
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-300 min-h-[100px]">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {application.cover_letter || 'No cover letter provided'}
                      </p>
                    </div>
                  </div>

                  {/* Save Application Button */}
                  <div className="mt-4 flex justify-end">
                    <button
                      onClick={() => handleSaveApplication(index)}
                      className="px-3 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-md hover:bg-indigo-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Save Application

                    </button> 
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-4 pb-6">
          <button
            onClick={handleBack}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            Cancel
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
                Saving...
              </>
            ) : (
              'Save'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default withAuth(EditCandidatePage);