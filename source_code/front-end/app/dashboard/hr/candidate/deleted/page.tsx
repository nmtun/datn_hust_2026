/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Search, Eye, User, Mail, ArrowLeft, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { candidateApi, Candidate, CandidateInfo } from "@/app/api/candidateApi";
import { showToast } from "@/app/utils/toast";
import Modal from "@/app/components/Modal";
import { withAuth } from "@/app/middleware/withAuth";

function DeletedCandidatesPage() {
  const router = useRouter();
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [selectedCandidateInfo, setSelectedCandidateInfo] = useState<CandidateInfo | null>(null);
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
  const debouncedSearchName = useDebounce(searchName, 500);
  const debouncedSearchEmail = useDebounce(searchEmail, 500);
  const debouncedSearchStatus = useDebounce(searchStatus, 500);

  useEffect(() => {
    fetchDeletedCandidates();
  }, []);

  // Effect for handling search with debounced values
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchName && !debouncedSearchEmail && !debouncedSearchStatus) {
        fetchDeletedCandidates();
        return;
      }

      try {
        setLoading(true);
        const query = {
          full_name: debouncedSearchName.trim() || undefined,
          personal_email: debouncedSearchEmail.trim() || undefined,
          candidate_status: debouncedSearchStatus.trim() || undefined,
        };

        const result = await candidateApi.searchDeleted(query);

        if (!result || result.error) {
          console.error("API Error:", result?.message || "Unknown error");
          setCandidates([]);
          return;
        }

        const candidatesData = result.candidates;
        if (Array.isArray(candidatesData)) {
          setCandidates(candidatesData);
        } else {
          console.error("Invalid candidates data format:", candidatesData);
          setCandidates([]);
        }
      } catch (error) {
        console.error("Error searching deleted candidates:", error);
        setCandidates([]);
        showToast.error('Error searching deleted candidates');
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchName, debouncedSearchEmail, debouncedSearchStatus]);

  const fetchDeletedCandidates = async () => {
    try {
      setLoading(true);
      const result = await candidateApi.getDeleted();
      
      if (!result || result.error) {
        console.error("API Error:", result?.message || "Unknown error");
        setCandidates([]);
        return;
      }

      const candidatesData = result.candidates;
      if (Array.isArray(candidatesData)) {
        setCandidates(candidatesData);
      } else {
        console.error("Invalid candidates data format:", candidatesData);
        setCandidates([]);
      }
    } catch (error) {
      console.error("Error fetching deleted candidates:", error);
      setCandidates([]);
      showToast.error('Error fetching deleted candidates');
    } finally {
      setLoading(false);
    }
  };

  const [restoreLoading, setRestoreLoading] = useState<number | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [candidateToRestore, setCandidateToRestore] = useState<Candidate | null>(null);

  const handleRestoreClick = (candidate: Candidate) => {
    setCandidateToRestore(candidate);
    setShowRestoreConfirm(true);
  };

  const handleConfirmRestore = async () => {
    if (!candidateToRestore) return;

    try {
      setRestoreLoading(candidateToRestore.user_id);
      const result = await candidateApi.restore(candidateToRestore.user_id);
      
      if (result.error) {
        throw new Error(result.message || 'Error restoring candidate');
      }

      // Refresh the list
      await fetchDeletedCandidates();
      
      // Show success message
      showToast.success('Candidate restored successfully');
    } catch (error: any) {
      console.error("Error restoring candidate:", error);
      showToast.error(error.message || 'Error restoring candidate');
    } finally {
      setRestoreLoading(null);
      setShowRestoreConfirm(false);
      setCandidateToRestore(null);
    }
  };

  const handleView = (userId: number, candidateInfo?: CandidateInfo) => {
    const candidate = candidates.find(c => c.user_id === userId);
    if (candidate) {
      setSelectedCandidate(candidate);
      setSelectedCandidateInfo(candidateInfo || candidate.Candidate_Infos?.[0] || null);
      setIsViewModalOpen(true);
    }
  };

  const handleBack = () => {
    router.push("/dashboard/hr/candidate");
  };

  const getStatusColor = (status: CandidateInfo["candidate_status"]) => {
    switch (status) {
      case "new":
        return "bg-blue-100 text-blue-800";
      case "screening":
        return "bg-yellow-100 text-yellow-800";
      case "interview":
        return "bg-purple-100 text-purple-800";
      case "offered":
        return "bg-green-100 text-green-800";
      case "hired":
        return "bg-emerald-100 text-emerald-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  // Define interface for grouped candidate data
  interface GroupedCandidate extends Candidate {
    candidateInfos: CandidateInfo[];
  }

  // Group candidates data to avoid duplication
  const groupedCandidates: GroupedCandidate[] = candidates.map(candidate => ({
    ...candidate,
    candidateInfos: candidate.Candidate_Infos || []
  }));

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
          <h1 className="text-2xl font-bold text-gray-900">Deleted Candidates</h1>
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
          <div className="flex-1 relative">
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
            >
              <option value="">All Status</option>
              <option value="new">New</option>
              <option value="screening">Screening</option>
              <option value="interview">Interview</option>
              <option value="offered">Offered</option>
              <option value="hired">Hired</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Deleted Candidates Table */}
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
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied Job
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Apply Date
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groupedCandidates.map((candidate, index) => (
                <tr key={candidate.user_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="h-5 w-5 text-gray-600" />
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
                    {candidate.candidateInfos.length > 0 ? (
                      <div className="space-y-2">
                        {candidate.candidateInfos.map((candidateInfo, infoIndex) => (
                          <div key={candidateInfo.candidate_info_id} className="border-l-2 border-gray-200 pl-3 py-1 min-h-[28px] flex flex-col justify-center">
                            {candidateInfo.Job_Description ? (
                              <div>
                                <div className="text-sm font-medium text-gray-900 leading-tight">
                                  {candidateInfo.Job_Description.title}
                                </div>
                                <div className="text-sm text-gray-500 leading-tight">
                                  {candidateInfo.Job_Description.experience_level} · {candidateInfo.Job_Description.employment_type}
                                </div>
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">No job title</span>
                            )}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No job applications</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {candidate.candidateInfos.length > 0 ? (
                      <div className="space-y-2">
                        {candidate.candidateInfos.map((candidateInfo, infoIndex) => (
                          <div key={candidateInfo.candidate_info_id} className="py-1 flex items-center min-h-[28px]">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(candidateInfo.candidate_status)}`}>
                              {candidateInfo.candidate_status.charAt(0).toUpperCase() + candidateInfo.candidate_status.slice(1)}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">-</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {candidate.candidateInfos.length > 0 ? (
                      <div className="space-y-2">
                        {candidate.candidateInfos.map((candidateInfo, infoIndex) => (
                          <div key={candidateInfo.candidate_info_id} className="py-1 flex items-center min-h-[28px]">
                            {candidateInfo.apply_date 
                              ? new Date(candidateInfo.apply_date).toLocaleDateString()
                              : '-'
                            }
                          </div>
                        ))}
                      </div>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      <button 
                        onClick={() => handleView(candidate.user_id, candidate.candidateInfos[0])}
                        className="text-gray-400 hover:text-gray-500"
                        title="View details">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button 
                        onClick={() => handleRestoreClick(candidate)}
                        className={`text-green-400 hover:text-green-500 ${
                          restoreLoading === candidate.user_id ? 'opacity-50 cursor-not-allowed' : ''
                        }`}
                        disabled={restoreLoading === candidate.user_id}
                        title="Restore candidate">
                        {restoreLoading === candidate.user_id ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-400" />
                        ) : (
                          <Undo2 className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
        
        {!loading && groupedCandidates.length === 0 && (
          <div className="text-center py-8">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No deleted candidates found</h3>
            <p className="mt-1 text-sm text-gray-500">All candidates are currently active.</p>
          </div>
        )}
      </div>

      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={showRestoreConfirm}
        onClose={() => {
          setShowRestoreConfirm(false);
          setCandidateToRestore(null);
        }}
        title="Confirm Restore"
      >
        <div className="p-6">
          <p className="mb-4">Are you sure you want to restore this candidate?</p>
          <p className="mb-6 font-medium text-gray-700">{candidateToRestore?.full_name}</p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                setShowRestoreConfirm(false);
                setCandidateToRestore(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRestore}
              disabled={restoreLoading !== null}
              className={`px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${
                restoreLoading !== null ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {restoreLoading !== null ? 'Restoring...' : 'Restore'}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Candidate Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`${selectedCandidate?.full_name || "Candidate Details"} (Deleted)`}
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
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1">{selectedCandidate.personal_email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="mt-1">{selectedCandidate.phone_number || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="mt-1">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Deleted
                    </span>
                  </p>
                </div>
              </div>
              {selectedCandidate.address && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">Address</p>
                  <p className="mt-1">{selectedCandidate.address}</p>
                </div>
              )}
            </div>

            {/* All Applications Information */}
            {selectedCandidate.Candidate_Infos && selectedCandidate.Candidate_Infos.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Job Applications ({selectedCandidate.Candidate_Infos.length})
                </h3>
                <div className="space-y-4">
                  {selectedCandidate.Candidate_Infos.map((candidateInfo, index) => (
                    <div key={candidateInfo.candidate_info_id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className="text-sm font-medium text-gray-500">Application Status</p>
                          <p className="mt-1">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(candidateInfo.candidate_status)}`}>
                              {candidateInfo.candidate_status.charAt(0).toUpperCase() + candidateInfo.candidate_status.slice(1)}
                            </span>
                          </p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Apply Date</p>
                          <p className="mt-1">{new Date(candidateInfo.apply_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-500">Source</p>
                          <p className="mt-1">{candidateInfo.source || 'Not specified'}</p>
                        </div>
                        {candidateInfo.evaluation && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Evaluation Score</p>
                            <p className="mt-1">{candidateInfo.evaluation}/10</p>
                          </div>
                        )}
                      </div>

                      {/* Applied Job */}
                      {candidateInfo.Job_Description && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-500">Applied Position</p>
                          <div className="mt-1 p-3 bg-white rounded-md border">
                            <p className="font-medium">{candidateInfo.Job_Description.title}</p>
                            <p className="text-sm text-gray-600">
                              {candidateInfo.Job_Description.experience_level} · {candidateInfo.Job_Description.employment_type}
                            </p>
                          </div>
                        </div>
                      )}

                      {/* Cover Letter */}
                      {candidateInfo.cover_letter && (
                        <div>
                          <p className="text-sm font-medium text-gray-500">Cover Letter</p>
                          <div className="mt-1 p-3 bg-white rounded-md border">
                            <p className="text-sm text-gray-700 whitespace-pre-wrap">{candidateInfo.cover_letter}</p>
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
    </div>
  );
}

export default withAuth(DeletedCandidatesPage);