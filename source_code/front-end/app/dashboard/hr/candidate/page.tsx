/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Search, Plus, Edit2, Eye, Trash2, User, Mail, FileText, Building2, ChevronDown } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { candidateApi, Candidate, CandidateInfo } from "@/app/api/candidateApi";
import { showToast } from "@/app/utils/toast";
import Modal from "@/app/components/Modal";
import { withAuth } from "@/app/middleware/withAuth";

function CandidatePage() {
  const router = useRouter();
  const [searchName, setSearchName] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isEvaluationModalOpen, setIsEvaluationModalOpen] = useState(false);
  const [evaluationCandidateInfo, setEvaluationCandidateInfo] = useState<CandidateInfo | null>(null);

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
    fetchCandidates();
  }, []);

  // Effect for handling search with debounced values
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchName && !debouncedSearchEmail && !debouncedSearchStatus) {
        fetchCandidates();
        return;
      }

      try {
        setLoading(true);
        const query = {
          full_name: debouncedSearchName.trim() || undefined,
          personal_email: debouncedSearchEmail.trim() || undefined,
          candidate_status: debouncedSearchStatus.trim() || undefined,
        };

        const result = await candidateApi.search(query);

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
        console.error("Error searching candidates:", error);
        setCandidates([]);
        showToast.error('Error searching candidates');
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchName, debouncedSearchEmail, debouncedSearchStatus]);

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const result = await candidateApi.getAll();

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
      console.error("Error fetching candidates:", error);
      setCandidates([]);
      showToast.error('Error fetching candidates');
    } finally {
      setLoading(false);
    }
  };

  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [candidateToDelete, setCandidateToDelete] = useState<Candidate | null>(null);

  const handleDeleteClick = (candidate: Candidate) => {
    setCandidateToDelete(candidate);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!candidateToDelete) return;

    try {
      setDeleteLoading(candidateToDelete.user_id);
      const result = await candidateApi.delete(candidateToDelete.user_id);

      if (result.error) {
        throw new Error(result.message || 'Error deleting candidate');
      }

      // Refresh the list
      await fetchCandidates();

      // Show success message
      showToast.success('Candidate deleted successfully');
    } catch (error: any) {
      console.error("Error deleting candidate:", error);
      showToast.error(error.message || 'Error deleting candidate');
    } finally {
      setDeleteLoading(null);
      setShowDeleteConfirm(false);
      setCandidateToDelete(null);
    }
  };

  const handleEdit = (userId: number) => {
    router.push(`/dashboard/hr/candidate/edit/${userId}`);
  };

  const handleView = (userId: number) => {
    const candidate = candidates.find(c => c.user_id === userId);
    if (candidate) {
      setSelectedCandidate(candidate);
      setIsViewModalOpen(true);
    }
  };

  const handleCreateNew = () => {
    router.push("/dashboard/hr/candidate/create");
  };

  const handleOpenEvaluationComment = (candidateInfo: CandidateInfo) => {
    setEvaluationCandidateInfo(candidateInfo);
    setIsEvaluationModalOpen(true);
  };

  const getEvaluationCommentText = (candidateInfo?: CandidateInfo | null) => {
    const evaluationComment = candidateInfo?.evaluation_comment;
    if (!evaluationComment) return '';
    return typeof evaluationComment === 'string'
      ? evaluationComment
      : evaluationComment.comment || '';
  };

  const getEvaluationCommentName = (candidateInfo?: CandidateInfo | null) => {
    const evaluationComment = candidateInfo?.evaluation_comment;
    if (!evaluationComment || typeof evaluationComment === 'string') return '';
    return evaluationComment.name || '';
  };

  type EvaluationSectionTone = 'positive' | 'negative' | 'neutral';

  interface EvaluationSection {
    title: string;
    tone: EvaluationSectionTone;
    items: string[];
  }

  interface ParsedEvaluationComment {
    intro: string;
    sections: EvaluationSection[];
  }

  interface RequirementAnalysisItem {
    sequence: string;
    requirement: string;
    cvEvidence: string;
    conclusion: string;
  }

  const cleanEvaluationItem = (item: string) => {
    return item
      .replace(/^\d+[.)]\s*/, '')
      .replace(/^[-•\s]+/, '')
      .replace(/[.\s]+$/g, '')
      .trim();
  };

  const parseEvaluationItems = (content: string, splitter: RegExp) => {
    return content
      .split(splitter)
      .map(cleanEvaluationItem)
      .filter(Boolean);
  };

  const parseRequirementAnalysisItem = (value: string): RequirementAnalysisItem | null => {
    if (!value) return null;

    const normalized = value.replace(/\r\n/g, ' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
    if (!normalized) return null;

    const match = normalized.match(
      /^(?:\((\d+)\)|(\d+)[.)])?\s*(.*?)\s*-\s*Thông tin từ cv:\s*(.*?)\s*-\s*Kết luận:\s*(.*)$/i
    );

    if (!match) {
      return null;
    }

    const sequence = match[1] || match[2] || '';
    const requirement = cleanEvaluationItem(match[3] || '');
    const cvEvidence = (match[4] || '').trim();
    const conclusion = (match[5] || '').trim();

    if (!requirement && !cvEvidence && !conclusion) {
      return null;
    }

    return {
      sequence,
      requirement,
      cvEvidence,
      conclusion,
    };
  };

  const parseEvaluationComment = (value?: string): ParsedEvaluationComment => {
    if (!value) {
      return { intro: '', sections: [] };
    }

    const normalized = value.replace(/\r\n/g, '\n').trim();
    if (!normalized) {
      return { intro: '', sections: [] };
    }

    const sectionConfig: Record<
      string,
      { title: string; tone: EvaluationSectionTone; splitter: RegExp }
    > = {
      'Điểm mạnh:': {
        title: 'Điểm mạnh',
        tone: 'positive',
        splitter: /;|\n/,
      },
      'Điểm yếu:': {
        title: 'Điểm yếu',
        tone: 'negative',
        splitter: /;|\n/,
      },
      'Phân tích yêu cầu:': {
        title: 'Phân tích yêu cầu',
        tone: 'neutral',
        splitter: /\s\|\s|\n|;/,
      },
      'Kinh nghiệm:': {
        title: 'Kinh nghiệm',
        tone: 'neutral',
        splitter: /;|\n/,
      },
    };

    const parts = normalized
      .split(/(Điểm mạnh:|Điểm yếu:|Phân tích yêu cầu:|Kinh nghiệm:?)/g)
      .map((part) => part.trim())
      .filter(Boolean);

    if (parts.length === 0) {
      return { intro: '', sections: [] };
    }

    let intro = '';
    const sections: EvaluationSection[] = [];

    const hasLeadingIntro = !/^(Điểm mạnh:|Điểm yếu:|Phân tích yêu cầu:|Kinh nghiệm:?)/.test(parts[0]);
    if (hasLeadingIntro) {
      intro = parts[0];
    }

    const startIndex = hasLeadingIntro ? 1 : 0;

    for (let index = startIndex; index < parts.length; index += 2) {
      const marker = parts[index];
      const content = (parts[index + 1] || '').trim();

      if (!marker) continue;

      const normalizedMarker = marker.endsWith(':') ? marker : `${marker}:`;
      const config = sectionConfig[normalizedMarker];

      if (!config) {
        const fallback = [marker, content].filter(Boolean).join(' ').trim();
        if (fallback) {
          sections.push({
            title: 'Nhận xét',
            tone: 'neutral',
            items: [fallback],
          });
        }
        continue;
      }

      const items = parseEvaluationItems(content, config.splitter);
      if (items.length > 0) {
        sections.push({
          title: config.title,
          tone: config.tone,
          items,
        });
      }
    }

    if (sections.length === 0 && intro) {
      const introItems = intro
        .split('\n')
        .map(cleanEvaluationItem)
        .filter(Boolean);

      if (introItems.length > 1) {
        intro = '';
        sections.push({
          title: 'Nhận xét',
          tone: 'neutral',
          items: introItems,
        });
      }
    }

    return { intro, sections };
  };

  const getEvaluationSectionStyles = (tone: EvaluationSectionTone) => {
    switch (tone) {
      case 'positive':
        return {
          wrapper: 'border-emerald-200 bg-emerald-50',
          dot: 'bg-emerald-500',
          badge: 'bg-emerald-100 text-emerald-700',
        };
      case 'negative':
        return {
          wrapper: 'border-rose-200 bg-rose-50',
          dot: 'bg-rose-500',
          badge: 'bg-rose-100 text-rose-700',
        };
      default:
        return {
          wrapper: 'border-slate-200 bg-slate-50',
          dot: 'bg-slate-500',
          badge: 'bg-slate-200 text-slate-700',
        };
    }
  };

  const handleViewCV = (cvPath: string) => {
    if (cvPath) {
      // Lấy tên file từ đường dẫn (xử lý cả đường dẫn Windows và Linux)
      const fileName = cvPath.split(/[/\\]/).pop();
      // Tạo URL để xem CV trực tiếp
      const viewUrl = `${process.env.NEXT_PUBLIC_API_URL}/uploads/cvs/${fileName}`;
      window.open(viewUrl, '_blank');
    }
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

  const getEvaluationTag = (score?: number | null) => {
    if (score == null) return null;
    if (score <= 50) {
      return { label: "Không phù hợp", className: "bg-red-100 text-red-800" };
    }
    if (score <= 80) {
      return { label: "Phù hợp", className: "bg-amber-100 text-amber-800" };
    }
    return { label: "Rất phù hợp", className: "bg-emerald-100 text-emerald-800" };
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

  const parsedEvaluationComment = parseEvaluationComment(
    getEvaluationCommentText(evaluationCandidateInfo)
  );
  const evaluationModalTag = getEvaluationTag(evaluationCandidateInfo?.evaluation);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Quản lý Ứng viên</h1>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => router.push("/dashboard/hr/candidate/deleted")}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <Trash2 className="w-5 h-5 mr-2" />
            Ứng viên đã xóa
          </button>
          <button
            onClick={() => router.push("/dashboard/hr/candidate/hired")}
            className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-md hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500"
          >
            <Building2 className="w-5 h-5 mr-2" />
            Ứng viên đã tuyển
          </button>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="w-5 h-5 mr-2" />
            Thêm ứng viên
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
            <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
            <select
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
              className="pl-10 pr-10 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
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

      {/* Candidates Table */}
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
                  Ưng viên
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Liên hệ
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Công việc đã ứng tuyển
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ngày ứng tuyển
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Hành động
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {groupedCandidates.map((candidate) => (
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
                        {candidate.candidateInfos.map((candidateInfo) => {
                          const evaluationTag = getEvaluationTag(candidateInfo.evaluation);

                          return (
                            <div key={candidateInfo.candidate_info_id} className="border-l-2 border-gray-200 pl-3 py-1 min-h-[28px] flex flex-col justify-center">
                              {candidateInfo.Job_Description ? (
                                <div className="flex items-center justify-between">
                                  <div>
                                    <div className="text-sm font-medium text-gray-900 leading-tight flex items-center">
                                      {candidateInfo.Job_Description.title}
                                      {evaluationTag && (
                                        <span className={`ml-2 px-2 py-0.5 text-xs font-semibold rounded-full ${evaluationTag.className}`}>
                                          {evaluationTag.label}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-sm text-gray-500 leading-tight">
                                      {candidateInfo.Job_Description.experience_level} · {candidateInfo.Job_Description.employment_type}
                                    </div>
                                  </div>
                                  {candidateInfo.cv_file_path && (
                                    <button
                                      onClick={() => handleViewCV(candidateInfo.cv_file_path!)}
                                      className="ml-2 text-green-400 hover:text-green-500 flex-shrink-0"
                                      title="View CV for this job">
                                      <FileText className="w-6 h-6" />
                                    </button>
                                  )}
                                </div>
                              ) : (
                                <span className="text-sm text-gray-400">Không có tiêu đề công việc</span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">Không có đơn ứng tuyển</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    {candidate.candidateInfos.length > 0 ? (
                      <div className="space-y-2">
                        {candidate.candidateInfos.map((candidateInfo) => (
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
                        {candidate.candidateInfos.map((candidateInfo) => (
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
                        onClick={() => handleView(candidate.user_id)}
                        className="text-gray-400 hover:text-gray-500"
                        title="Xem chi tiết">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(candidate.user_id)}
                        className="text-blue-400 hover:text-blue-500"
                        title="Chỉnh sửa ứng viên">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(candidate)}
                        className={`text-red-400 hover:text-red-500 ${deleteLoading === candidate.user_id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        disabled={deleteLoading === candidate.user_id}
                        title="Xóa ứng viên">
                        {deleteLoading === candidate.user_id ? (
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

        {!loading && groupedCandidates.length === 0 && (
          <div className="text-center py-8">
            <User className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy ứng viên nào</h3>
            <p className="mt-1 text-sm text-gray-500">Bắt đầu bằng cách thêm một ứng viên mới.</p>
            <div className="mt-6">
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Plus className="w-5 h-5 mr-2" />
                Thêm Ứng viên Mới
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setCandidateToDelete(null);
        }}
        title="Xác nhận Xóa"
      >
        <div className="p-6">
          <p className="mb-4">Bạn có chắc chắn muốn xóa ứng viên này không?</p>
          <p className="mb-6 font-medium text-gray-700">{candidateToDelete?.full_name}</p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setCandidateToDelete(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Hủy
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleteLoading !== null}
              className={`px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${deleteLoading !== null ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              {deleteLoading !== null ? 'Đang xóa...' : 'Xóa'}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Candidate Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={`${selectedCandidate?.full_name || "Candidate Details"}`}
        showEditButton={true}
        onEdit={() => {
          setIsViewModalOpen(false);
          handleEdit(selectedCandidate!.user_id);
        }}
      >
        {selectedCandidate && (
          <div className="space-y-6">
            {/* Personal Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Thông tin cá nhân</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Họ và tên</p>
                  <p className="mt-1">{selectedCandidate.full_name}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="mt-1">{selectedCandidate.personal_email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Số điện thoại</p>
                  <p className="mt-1">{selectedCandidate.phone_number || 'Not provided'}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="mt-1">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${selectedCandidate.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                      {selectedCandidate.status.charAt(0).toUpperCase() + selectedCandidate.status.slice(1)}
                    </span>
                  </p>
                </div>
              </div>
              {selectedCandidate.address && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">Địa chỉ</p>
                  <p className="mt-1">{selectedCandidate.address}</p>
                </div>
              )}
            </div>

            {/* All Applications Information */}
            {selectedCandidate.Candidate_Infos && selectedCandidate.Candidate_Infos.length > 0 && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Các đơn ứng tuyển ({selectedCandidate.Candidate_Infos.length})
                </h3>
                <div className="space-y-4">
                  {selectedCandidate.Candidate_Infos.map((candidateInfo) => {
                    const evaluationTag = getEvaluationTag(candidateInfo.evaluation);

                    return (
                      <div key={candidateInfo.candidate_info_id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                        <div className="grid grid-cols-2 gap-4 mb-4">
                          <div>
                            <p className="text-sm font-medium text-gray-500">Trạng thái đơn ứng tuyển</p>
                            <p className="mt-1">
                              <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(candidateInfo.candidate_status)}`}>
                                {candidateInfo.candidate_status.charAt(0).toUpperCase() + candidateInfo.candidate_status.slice(1)}
                              </span>
                            </p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Ngày ứng tuyển</p>
                            <p className="mt-1">{new Date(candidateInfo.apply_date).toLocaleDateString()}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-500">Nguồn ứng tuyển</p>
                            <p className="mt-1">{candidateInfo.source || 'Not specified'}</p>
                          </div>
                          {candidateInfo.evaluation != null && (
                            <div>
                              <p className="text-sm font-medium text-gray-500">Điểm đánh giá</p>
                              <p className="mt-1 flex flex-wrap items-center gap-2">
                                <span>{candidateInfo.evaluation}/100</span>
                                {evaluationTag && (
                                  <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${evaluationTag.className}`}>
                                    {evaluationTag.label}
                                  </span>
                                )}
                              </p>
                            </div>
                          )}
                          <div>
                            <p className="text-sm font-medium text-gray-500">Bình luận đánh giá</p>
                            <button
                              type="button"
                              onClick={() => handleOpenEvaluationComment(candidateInfo)}
                              className="mt-1 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              Xem bình luận
                            </button>
                          </div>
                        </div>

                        {/* Applied Job */}
                        {candidateInfo.Job_Description && (
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-500">Vị trí ứng tuyển</p>
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
                          <div className="mb-4">
                            <p className="text-sm font-medium text-gray-500">CV/Resume</p>
                            <div className="mt-1">
                              <button
                                onClick={() => handleViewCV(candidateInfo.cv_file_path!)}
                                className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                Xem CV
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Cover Letter */}
                        {candidateInfo.cover_letter && (
                          <div>
                            <p className="text-sm font-medium text-gray-500">Thư động lực</p>
                            <div className="mt-1 p-3 bg-white rounded-md border">
                              <p className="text-sm text-gray-700 whitespace-pre-wrap">{candidateInfo.cover_letter}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Evaluation Comment Modal */}
      <Modal
        isOpen={isEvaluationModalOpen}
        onClose={() => {
          setIsEvaluationModalOpen(false);
          setEvaluationCandidateInfo(null);
        }}
        title="Evaluation Comment"
      >
        <div className="space-y-5">
          {(getEvaluationCommentName(evaluationCandidateInfo) || evaluationCandidateInfo?.evaluation) && (
            <div className="grid grid-cols-2 gap-4">
              {getEvaluationCommentName(evaluationCandidateInfo) && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Ưng viên</p>
                  <p className="mt-1">{getEvaluationCommentName(evaluationCandidateInfo)}</p>
                </div>
              )}
              {evaluationCandidateInfo?.evaluation != null && (
                <div>
                  <p className="text-sm font-medium text-gray-500">Điểm đánh giá</p>
                  <p className="mt-1 flex flex-wrap items-center gap-2">
                    <span>{evaluationCandidateInfo.evaluation}/100</span>
                    {evaluationModalTag && (
                      <span className={`px-2 py-0.5 text-xs font-semibold rounded-full ${evaluationModalTag.className}`}>
                        {evaluationModalTag.label}
                      </span>
                    )}
                  </p>
                </div>
              )}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-gray-500">Bình luận đánh giá</p>
            <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-4">
              {parsedEvaluationComment.intro && (
                <p className="text-sm text-gray-700 whitespace-pre-wrap leading-6">
                  {parsedEvaluationComment.intro}
                </p>
              )}

              {parsedEvaluationComment.sections.length > 0 ? (
                <div className={`space-y-3 ${parsedEvaluationComment.intro ? 'mt-4' : ''}`}>
                  {parsedEvaluationComment.sections.map((section, sectionIndex) => {
                    const sectionStyles = getEvaluationSectionStyles(section.tone);
                    const isRequirementAnalysisSection = section.title === 'Phân tích yêu cầu';
                    const requirementAnalysisItems = isRequirementAnalysisSection
                      ? section.items
                        .map(parseRequirementAnalysisItem)
                        .filter((item): item is RequirementAnalysisItem => item !== null)
                      : [];
                    const hasStructuredRequirementAnalysis =
                      requirementAnalysisItems.length > 0 &&
                      requirementAnalysisItems.length === section.items.length;

                    return (
                      <div
                        key={`${section.title}-${sectionIndex}`}
                        className={`rounded-md border p-3 ${sectionStyles.wrapper}`}
                      >
                        {hasStructuredRequirementAnalysis ? (
                          <div className="space-y-3">
                            {requirementAnalysisItems.map((item, itemIndex) => {
                              const displaySequence = item.sequence || String(itemIndex + 1);

                              return (
                                <div
                                  key={`${section.title}-${sectionIndex}-${itemIndex}`}
                                  className="rounded-md border border-slate-200 bg-white p-3"
                                >
                                  <div className="mb-2 flex items-center gap-2">
                                    <span className="inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-indigo-100 px-2 text-xs font-semibold text-indigo-700">
                                      {displaySequence}
                                    </span>
                                    <p className="text-sm font-semibold text-slate-800">
                                      {item.requirement || `Yêu cầu ${displaySequence}`}
                                    </p>
                                  </div>

                                  <div className="space-y-2">
                                    <div className="rounded-md border border-blue-100 bg-blue-50 p-2.5">
                                      <p className="text-xs font-semibold uppercase tracking-wide text-blue-700">
                                        Thông tin từ CV
                                      </p>
                                      <p className="mt-1 text-sm leading-6 text-blue-900">
                                        {item.cvEvidence || 'Chưa có thông tin'}
                                      </p>
                                    </div>

                                    <div className="rounded-md border border-amber-100 bg-amber-50 p-2.5">
                                      <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                                        Kết luận
                                      </p>
                                      <p className="mt-1 text-sm leading-6 text-amber-900">
                                        {item.conclusion || 'Chưa có kết luận'}
                                      </p>
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <ul className="space-y-1.5">
                            {section.items.map((item, itemIndex) => (
                              <li
                                key={`${section.title}-${sectionIndex}-${itemIndex}`}
                                className="flex items-start gap-2 text-sm text-gray-700 leading-6"
                              >
                                <span className={`mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full ${sectionStyles.dot}`}></span>
                                <span>{item}</span>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : !parsedEvaluationComment.intro ? (
                <p className="text-sm text-gray-500 italic">No evaluation comment yet</p>
              ) : null}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default withAuth(CandidatePage);

