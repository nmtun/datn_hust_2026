/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, User, Building2 } from "lucide-react";
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

// --- BẮT ĐẦU: Các Type và Hàm Parse Evaluation Comment (Port từ CandidatePage) ---
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
    'Điểm mạnh:': { title: 'Điểm mạnh', tone: 'positive', splitter: /;|\n/ },
    'Điểm yếu:': { title: 'Điểm yếu', tone: 'negative', splitter: /;|\n/ },
    'Phân tích yêu cầu:': { title: 'Phân tích yêu cầu', tone: 'neutral', splitter: /\s\|\s|\n|;/ },
    'Kinh nghiệm:': { title: 'Kinh nghiệm', tone: 'neutral', splitter: /;|\n/ },
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
      return { wrapper: 'border-emerald-200 bg-emerald-50', dot: 'bg-emerald-500', badge: 'bg-emerald-100 text-emerald-700' };
    case 'negative':
      return { wrapper: 'border-rose-200 bg-rose-50', dot: 'bg-rose-500', badge: 'bg-rose-100 text-rose-700' };
    default:
      return { wrapper: 'border-slate-200 bg-slate-50', dot: 'bg-slate-500', badge: 'bg-slate-200 text-slate-700' };
  }
};
// --- KẾT THÚC: Các Type và Hàm Parse ---

function EditCandidatePage() {
  const router = useRouter();
  const params = useParams();
  const candidateId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [, setJobDescriptions] = useState<JobDescription[]>([]);
  const [expandedComments, setExpandedComments] = useState<Record<number, boolean>>({});

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
        );

        if (hasChanges && app.candidate_info_id) {
          return candidateApi.updateApplication(app.candidate_info_id, {
            candidate_status: app.candidate_status,
            evaluation: app.evaluation
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

  const toggleComment = (key: number) => {
    setExpandedComments((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
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
        <h3 className="mt-2 text-sm font-medium text-gray-900">Không tìm thấy ứng viên</h3>
        <p className="mt-1 text-sm text-gray-500">Ứng viên bạn đang tìm kiếm không tồn tại.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Chỉnh sửa Ứng viên</h1>
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
                Họ và tên *
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
                Số điện thoại
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
              Địa chỉ
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
              Các đơn ứng tuyển ({applications.length})
            </h2>
            <div className="space-y-4">
              {applications.map((application, index) => {
                const evaluationComment = application.evaluation_comment;
                const evaluationCommentText = typeof evaluationComment === "string"
                  ? evaluationComment
                  : evaluationComment?.comment;
                const evaluationCommentName = typeof evaluationComment === "string"
                  ? ""
                  : evaluationComment?.name;
                
                const commentKey = application.candidate_info_id || index;
                const isExpanded = Boolean(expandedComments[commentKey]);
                
                // Sử dụng hàm parse từ CandidatePage
                const parsedEvaluationComment = parseEvaluationComment(evaluationCommentText);
                const hasSections = parsedEvaluationComment.sections.length > 0;

                return (
                <div key={application.candidate_info_id} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Vị trí ứng tuyển
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
                        Trạng thái đơn ứng tuyển
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
                        Ngày ứng tuyển
                      </label>
                      <div className="p-3 bg-gray-50 rounded-md border border-gray-300">
                        <p className="text-sm text-gray-700">
                          {new Date(application.apply_date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Điểm đánh giá
                      </label>
                      <input
                        disabled
                        type="number"
                        min="1"
                        max="10"
                        value={application.evaluation || ''}
                        onChange={(e) => handleApplicationChange(index, 'evaluation', Number(e.target.value))}
                        className="w-full px-3 py-2 border-2 border-indigo-300 bg-white rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {/* Evaluation Comment Giao Diện Rich Text */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nhận xét đánh giá
                    </label>
                    <div className="p-4 bg-white rounded-md border border-gray-300">
                      {evaluationCommentName && (
                        <p className="text-xs text-gray-500 mb-2 font-medium">
                          Ứng viên: {evaluationCommentName}
                        </p>
                      )}

                      {/* Hiển thị intro với line-clamp nếu thu gọn */}
                      <p className={`text-sm text-gray-700 whitespace-pre-wrap leading-6 ${!isExpanded && hasSections ? 'line-clamp-3' : ''}`}>
                        {parsedEvaluationComment.intro || (hasSections && !isExpanded ? 'Có các đánh giá chi tiết bên dưới...' : !hasSections ? 'Chưa có nhận xét' : '')}
                      </p>

                      {/* Chỉ render các block phân tích màu sắc khi ĐƯỢC XỔ RA */}
                      {isExpanded && hasSections && (
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
                      )}

                      {/* Nút Xem thêm / Thu gọn */}
                      {hasSections && (
                        <button
                          type="button"
                          onClick={() => toggleComment(commentKey)}
                          className="mt-3 text-xs font-medium text-indigo-600 hover:text-indigo-700 flex items-center"
                        >
                          {isExpanded ? 'Thu gọn' : 'Xem chi tiết đánh giá'}
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* Source */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nguồn ứng tuyển
                    </label>
                    <div className="p-3 bg-gray-50 rounded-md border border-gray-300">
                      <p className="text-sm text-gray-700">{application.source || 'Not specified'}</p>
                    </div>
                  </div>

                  {/* Cover Letter */}
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Thư xin ứng tuyển
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
                      Lưu thay đổi
                    </button> 
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

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
                Đang lưu...
              </>
            ) : (
              'Lưu'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default withAuth(EditCandidatePage);