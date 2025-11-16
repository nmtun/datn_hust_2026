/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Search, Plus, Edit2, Eye, Trash2, MapPin, Briefcase } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { jobDescriptionApi } from "@/app/api/jobDescriptionApi";
import { showToast } from "@/app/utils/toast";
import Modal from "@/app/components/Modal";
import { withAuth } from "@/app/middleware/withAuth";

interface JobDescription {
  job_id: number;
  title: string;
  description: string;
  location: string;
  type_of_work: 'on-site' | 'remote' | 'hybrid';
  requirements: string;
  responsibilities: string;
  qualifications: string;
  experience_level: 'intern' | 'fresher' | 'mid' | 'senior' | 'manager';
  employment_type: 'full-time' | 'part-time';
  salary_range_min: number;
  salary_range_max: number;
  status: 'draft' | 'active' | 'paused' | 'closed';
  posting_date: string;
  closing_date: string;
  positions_count: number;
  department_id: number;
  is_deleted: boolean;
  created_by: number;
  created_at: string;
  updated_at: string | null;
}

function JobDescriptionPage() {
  const router = useRouter();
  const [searchTitle, setSearchTitle] = useState("");
  const [searchLocation, setSearchLocation] = useState("");
  const [searchLevel, setSearchLevel] = useState("");
  const [jobDescriptions, setJobDescriptions] = useState<JobDescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<JobDescription | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  
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
  const debouncedSearchTitle = useDebounce(searchTitle, 500);
  const debouncedSearchLocation = useDebounce(searchLocation, 500);
  const debouncedSearchLevel = useDebounce(searchLevel, 500);

  useEffect(() => {
    fetchJobDescriptions();
  }, []);

  // Effect for handling search with debounced values
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchTitle && !debouncedSearchLocation && !debouncedSearchLevel) {
        fetchJobDescriptions();
        return;
      }

      try {
        setLoading(true);
        const query = {
          title: debouncedSearchTitle.trim() || undefined,
          location: debouncedSearchLocation.trim() || undefined,
          experience_level: debouncedSearchLevel.trim() || undefined,
        };

        const result = await jobDescriptionApi.search(query);

        if (!result || result.error) {
          console.error("API Error:", result?.message || "Unknown error");
          setJobDescriptions([]);
          return;
        }

        const jobs = result.jobs;
        if (Array.isArray(jobs)) {
          setJobDescriptions(jobs);
        } else {
          console.error("Invalid jobs data format:", jobs);
          setJobDescriptions([]);
        }
      } catch (error) {
        console.error("Error searching job descriptions:", error);
        setJobDescriptions([]);
        showToast.error('Error searching job descriptions');
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchTitle, debouncedSearchLocation, debouncedSearchLevel]);

  const fetchJobDescriptions = async () => {
    try {
      setLoading(true);
      const result = await jobDescriptionApi.getAll();
      
      // Check if the response has the expected structure
      if (!result || result.error) {
        console.error("API Error:", result?.message || "Unknown error");
        setJobDescriptions([]);
        return;
      }

      // The jobs array should be in result.jobs based on the backend service
      const jobs = result.jobs;
      if (Array.isArray(jobs)) {
        setJobDescriptions(jobs);
      } else {
        console.error("Invalid jobs data format:", jobs);
        setJobDescriptions([]);
      }
    } catch (error) {
      console.error("Error fetching job descriptions:", error);
      setJobDescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [jobToDelete, setJobToDelete] = useState<JobDescription | null>(null);

  const handleDeleteClick = (job: JobDescription) => {
    setJobToDelete(job);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!jobToDelete) return;

    try {
      setDeleteLoading(jobToDelete.job_id);
      const result = await jobDescriptionApi.delete(jobToDelete.job_id);
      
      if (result.error) {
        throw new Error(result.message || 'Error deleting job description');
      }

      // Refresh the list
      await fetchJobDescriptions();
      
      // Show success message
      showToast.success('Job description deleted successfully');
    } catch (error: any) {
      console.error("Error deleting job description:", error);
      showToast.error(error.message || 'Error deleting job description');
    } finally {
      setDeleteLoading(null);
      setShowDeleteConfirm(false);
      setJobToDelete(null);
    }
  };

  const handleEdit = (jobId: number) => {
    router.push(`/dashboard/hr/job-description/edit/${jobId}`);
  };

  const handleView = (jobId: number) => {
    const job = jobDescriptions.find(job => job.job_id === jobId);
    if (job) {
      setSelectedJob(job);
      setIsViewModalOpen(true);
    }
  };

  const handleCreateNew = () => {
    router.push("/dashboard/hr/job-description/create");
  };



  const getStatusColor = (status: JobDescription["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "paused":
        return "bg-orange-100 text-orange-800";
      case "closed":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Job Descriptions Management</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push("/dashboard/hr/job-description/deleted")}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Deleted JDs
          </button>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="w-5 h-5 mr-2" />
            Create New JD
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by title..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex-1 relative">
            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by location..."
              value={searchLocation}
              onChange={(e) => setSearchLocation(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex-1 relative">
            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by level..."
              value={searchLevel}
              onChange={(e) => setSearchLevel(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Job Descriptions Table */}
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
                  Title
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Level
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created At
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {jobDescriptions.map((jd) => (
              <tr key={jd.job_id} className="hover:bg-gray-50">
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{jd.title}</div>
                  <div className="text-sm text-gray-500">
                    {jd.employment_type} · {jd.type_of_work}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {jd.experience_level}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {jd.location}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(jd.status)}`}>
                    {jd.status.charAt(0).toUpperCase() + jd.status.slice(1)}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(jd.created_at).toLocaleDateString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div className="flex justify-end space-x-3">
                    <button 
                      onClick={() => handleView(jd.job_id)}
                      className="text-gray-400 hover:text-gray-500"
                      title="View details">
                      <Eye className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleEdit(jd.job_id)}
                      className="text-blue-400 hover:text-blue-500"
                      title="Edit job description">
                      <Edit2 className="w-5 h-5" />
                    </button>
                    <button 
                      onClick={() => handleDeleteClick(jd)}
                      className={`text-red-400 hover:text-red-500 ${
                        deleteLoading === jd.job_id ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                      disabled={deleteLoading === jd.job_id}
                      title="Delete job description">
                      {deleteLoading === jd.job_id ? (
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-red-400" />
                      ) : (
                        <Trash2 className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setJobToDelete(null);
        }}
        title="Confirm Delete"
      >
        <div className="p-6">
          <p className="mb-4">Bạn có chắc chắn muốn xóa mô tả công việc này?</p>
          <p className="mb-6 font-medium text-gray-700">{jobToDelete?.title}</p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setJobToDelete(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleteLoading !== null}
              className={`px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${
                deleteLoading !== null ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {deleteLoading !== null ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Job Description Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={selectedJob?.title || "Job Description Details"}
        showEditButton={true}
        onEdit={() => {
          setIsViewModalOpen(false);
          handleEdit(selectedJob!.job_id);
        }}
      >
        {selectedJob && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Employment Type</p>
                  <p className="mt-1">{selectedJob.employment_type}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Work Type</p>
                  <p className="mt-1">{selectedJob.type_of_work}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="mt-1">{selectedJob.location}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Experience Level</p>
                  <p className="mt-1">{selectedJob.experience_level}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Positions Available</p>
                  <p className="mt-1">{selectedJob.positions_count}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="mt-1">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedJob.status)}`}>
                      {selectedJob.status.charAt(0).toUpperCase() + selectedJob.status.slice(1)}
                    </span>
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{selectedJob.description}</p>
            </div>

            {/* Requirements */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Requirements</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{selectedJob.requirements}</p>
            </div>

            {/* Responsibilities */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Responsibilities</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{selectedJob.responsibilities}</p>
            </div>

            {/* Qualifications */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Qualifications</h3>
              <p className="text-gray-600 whitespace-pre-wrap">{selectedJob.qualifications}</p>
            </div>

            {/* Salary Range */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Salary Range</h3>
              <p className="text-gray-600">
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                  .format(selectedJob.salary_range_min)} - {' '}
                {new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' })
                  .format(selectedJob.salary_range_max)}
              </p>
            </div>

            {/* Timeline */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Timeline</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Posting Date</p>
                  <p className="mt-1">{selectedJob.posting_date}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Closing Date</p>
                  <p className="mt-1">{selectedJob.closing_date || 'Not specified'}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default withAuth(JobDescriptionPage);