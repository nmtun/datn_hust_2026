/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { Search, Plus, Edit2, Eye, Trash2, FileText, Download, BookOpen, Archive, Tags, Settings, TagIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { trainingMaterialApi, TrainingMaterial } from "@/app/api/trainingMaterialApi";
import { showToast } from "@/app/utils/toast";
import Modal from "@/app/components/Modal";
import { withAuth } from "@/app/middleware/withAuth";
import TagManagementModal from "@/app/components/TagManagementModal";
import MaterialTagModal from "@/app/components/MaterialTagModal";

function TrainingMaterialPage() {
  const router = useRouter();
  const [searchTitle, setSearchTitle] = useState("");
  const [searchCreator, setSearchCreator] = useState("");
  const [searchStatus, setSearchStatus] = useState("");
  const [trainingMaterials, setTrainingMaterials] = useState<TrainingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<TrainingMaterial | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedVideoUrl, setSelectedVideoUrl] = useState<string | null>(null);
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);
  const [isTagManagementOpen, setIsTagManagementOpen] = useState(false);
  const [isMaterialTagModalOpen, setIsMaterialTagModalOpen] = useState(false);
  const [materialForTagging, setMaterialForTagging] = useState<TrainingMaterial | null>(null);

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
  const debouncedSearchCreator = useDebounce(searchCreator, 500);
  const debouncedSearchStatus = useDebounce(searchStatus, 500);

  useEffect(() => {
    fetchTrainingMaterials();
  }, []);

  // Effect for handling search with debounced values
  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchTitle && !debouncedSearchCreator && !debouncedSearchStatus) {
        fetchTrainingMaterials();
        return;
      }

      try {
        setLoading(true);
        const query = {
          title: debouncedSearchTitle.trim() || undefined,
          created_by: debouncedSearchCreator.trim() || undefined,
          status: debouncedSearchStatus.trim() || undefined,
        };

        const result = await trainingMaterialApi.search(query);

        if (!result || result.error) {
          console.error("API Error:", result?.message || "Unknown error");
          setTrainingMaterials([]);
          return;
        }

        const materials = result.materials;
        if (Array.isArray(materials)) {
          // Lọc bỏ những materials có status là 'archived' trong kết quả tìm kiếm
          const activeMaterials = materials.filter(material => material.status !== 'archived');
          setTrainingMaterials(activeMaterials);
        } else {
          console.error("Invalid materials data format:", materials);
          setTrainingMaterials([]);
        }
      } catch (error) {
        console.error("Error searching training materials:", error);
        setTrainingMaterials([]);
        showToast.error('Error searching training materials');
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchTitle, debouncedSearchCreator, debouncedSearchStatus]);

  const fetchTrainingMaterials = async () => {
    try {
      setLoading(true);
      const result = await trainingMaterialApi.getAll();

      if (!result || result.error) {
        console.error("API Error:", result?.message || "Unknown error");
        setTrainingMaterials([]);
        return;
      }

      const materials = result.materials;
      if (Array.isArray(materials)) {
        // Lọc bỏ những materials có status là 'archived'
        const activeMaterials = materials.filter(material => material.status !== 'archived');
        setTrainingMaterials(activeMaterials);
      } else {
        console.error("Invalid materials data format:", materials);
        setTrainingMaterials([]);
      }
    } catch (error) {
      console.error("Error fetching training materials:", error);
      setTrainingMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [materialToDelete, setMaterialToDelete] = useState<TrainingMaterial | null>(null);

  const handleDeleteClick = (material: TrainingMaterial) => {
    setMaterialToDelete(material);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!materialToDelete) return;

    try {
      setDeleteLoading(materialToDelete.material_id);
      const result = await trainingMaterialApi.delete(materialToDelete.material_id);

      if (result.error) {
        throw new Error(result.message || 'Error deleting training material');
      }

      // Refresh the list
      await fetchTrainingMaterials();

      // Show success message
      showToast.success('Training material deleted successfully');
    } catch (error: any) {
      console.error("Error deleting training material:", error);
      showToast.error(error.message || 'Error deleting training material');
    } finally {
      setDeleteLoading(null);
      setShowDeleteConfirm(false);
      setMaterialToDelete(null);
    }
  };

  const handleEdit = (materialId: number) => {
    router.push(`/dashboard/hr/training-material/edit/${materialId}`);
  };

  const handleView = (materialId: number) => {
    const material = trainingMaterials.find(m => m.material_id === materialId);
    if (material) {
      setSelectedMaterial(material);
      setIsViewModalOpen(true);
    }
  };

  const handleCreateNew = () => {
    router.push("/dashboard/hr/training-material/create");
  };

  const handleDownloadFile = async (filename: string) => {
    try {
      const response = await trainingMaterialApi.downloadFile(filename);

      // Create blob URL and trigger download
      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      showToast.success('File downloaded successfully');
    } catch (error: any) {
      console.error('Error downloading file:', error);
      showToast.error('Error downloading file');
    }
  };

  const handleViewFile = (filePath: string) => {
    if (filePath) {
      // Lấy tên file từ đường dẫn (xử lý cả đường dẫn Windows và Linux)
      const fileName = filePath.split(/[/\\]/).pop();
      if (!fileName) return;

      // Kiểm tra extension của file
      const fileExtension = fileName.split('.').pop()?.toLowerCase();
      const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'webm'];

      // Tạo URL để xem file trực tiếp
      const viewUrl = `${process.env.NEXT_PUBLIC_API_URL}/uploads/training/${fileName}`;

      if (videoExtensions.includes(fileExtension || '')) {
        // Nếu là video, mở trong modal hoặc tab mới với video player
        setSelectedVideoUrl(viewUrl);
        setIsVideoModalOpen(true);
      } else {
        // Nếu là document, mở trong tab mới như trước
        window.open(viewUrl, '_blank');
      }
    }
  };

  const getStatusColor = (status: TrainingMaterial["status"]) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "archived":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };



  const getTypeDisplayName = (type: string) => {
    switch (type.toLowerCase()) {
      case "video":
        return "Video";
      case "document":
        return "Document";
      case "both":
        return "Video & Document";
      default:
        return type.charAt(0).toUpperCase() + type.slice(1);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Training Materials Management</h1>
        </div>
        <div className="flex space-x-4">
          <button
            onClick={() => router.push("/dashboard/hr/training-material/archived")}
            className="inline-flex items-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            <Archive className="w-5 h-5 mr-2" />
            Archived Materials
          </button>
          <button
            onClick={() => setIsTagManagementOpen(true)}
            className="inline-flex items-center px-4 py-2 bg-purple-100 text-purple-700 text-sm font-medium rounded-md hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            <TagIcon className="w-5 h-5 mr-2" />
            Manage Tags
          </button>
          <button
            onClick={handleCreateNew}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add New Material
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
            <FileText className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by creator..."
              value={searchCreator}
              onChange={(e) => setSearchCreator(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex-1 relative">
            <BookOpen className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <select
              value={searchStatus}
              onChange={(e) => setSearchStatus(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 appearance-none"
            >
              <option value="">All Status</option>
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
            </select>
          </div>
        </div>
      </div>

      {/* Training Materials Table */}
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
                  Material
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
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
              {trainingMaterials.map((material) => (
                <tr key={material.material_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">{material.title}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {material.description}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {getTypeDisplayName(material.type)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1">
                      {material.tags && material.tags.length > 0 ? (
                        material.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag.tag_id}
                            className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                          >
                            {tag.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-gray-400">No tags</span>
                      )}
                      {material.tags && material.tags.length > 3 && (
                        <span className="text-xs text-gray-500">+{material.tags.length - 3} more</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(material.status)}`}>
                      {material.status.charAt(0).toUpperCase() + material.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {material.creator ? material.creator.full_name : 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(material.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={() => handleView(material.material_id)}
                        className="text-gray-400 hover:text-gray-500"
                        title="View details">
                        <Eye className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => {
                          setMaterialForTagging(material);
                          setIsMaterialTagModalOpen(true);
                        }}
                        className="text-purple-400 hover:text-purple-500"
                        title="Manage tags">
                        <Tags className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleEdit(material.material_id)}
                        className="text-blue-400 hover:text-blue-500"
                        title="Edit material">
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(material)}
                        className={`text-red-400 hover:text-red-500 ${deleteLoading === material.material_id ? 'opacity-50 cursor-not-allowed' : ''
                          }`}
                        disabled={deleteLoading === material.material_id}
                        title="Delete material">
                        {deleteLoading === material.material_id ? (
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
          setMaterialToDelete(null);
        }}
        title="Confirm Delete"
      >
        <div className="p-6">
          <p className="mb-4">Are you sure you want to delete this training material?</p>
          <p className="mb-6 font-medium text-gray-700">{materialToDelete?.title}</p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                setShowDeleteConfirm(false);
                setMaterialToDelete(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={deleteLoading !== null}
              className={`px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 ${deleteLoading !== null ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              {deleteLoading !== null ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Material Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={selectedMaterial?.title || "Training Material Details"}
        showEditButton={true}
        onEdit={() => {
          setIsViewModalOpen(false);
          handleEdit(selectedMaterial!.material_id);
        }}
      >
        {selectedMaterial && (
          <div className="space-y-6">
            {/* Basic Information */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Type</p>
                  <p className="mt-1">
                    {getTypeDisplayName(selectedMaterial.type)}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Status</p>
                  <p className="mt-1">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(selectedMaterial.status)}`}>
                      {selectedMaterial.status.charAt(0).toUpperCase() + selectedMaterial.status.slice(1)}
                    </span>
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created By</p>
                  <p className="mt-1">
                    {selectedMaterial.creator ? (
                      <span className="text-gray-900 font-medium">{selectedMaterial.creator.full_name}</span>
                    ) : (
                      <span className="text-gray-500">Unknown</span>
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Created At</p>
                  <p className="mt-1">{new Date(selectedMaterial.created_at).toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Last Updated</p>
                  <p className="mt-1">
                    {selectedMaterial.updated_at
                      ? new Date(selectedMaterial.updated_at).toLocaleString()
                      : 'Never updated'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {selectedMaterial.tags && selectedMaterial.tags.length > 0 ? (
                  selectedMaterial.tags.map((tag) => (
                    <span
                      key={tag.tag_id}
                      className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-800 rounded-full"
                    >
                      {tag.name}
                    </span>
                  ))
                ) : (
                  <span className="text-sm text-gray-500">No tags assigned</span>
                )}
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">
                {selectedMaterial.description || 'No description provided.'}
              </p>
            </div>

            {/* Content Files */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Content Files</h3>
              {selectedMaterial.content_path ? (
                <div className="space-y-2">
                  {selectedMaterial.content_path.split(';').filter(path => path.trim()).map((filePath, index) => {
                    const filename = filePath.split(/[/\\]/).pop();
                    return (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {filename || 'Unknown file'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleViewFile(filePath)}
                            className="flex items-center text-green-600 hover:text-green-500 text-sm"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            {(() => {
                              const fileName = filePath.split(/[/\\]/).pop();
                              const fileExtension = fileName?.split('.').pop()?.toLowerCase();
                              const videoExtensions = ['mp4', 'avi', 'mov', 'wmv', 'webm'];
                              return videoExtensions.includes(fileExtension || '') ? 'Play' : 'View';
                            })()}
                          </button>
                          <button
                            onClick={() => handleDownloadFile(filename || '')}
                            className="flex items-center text-indigo-600 hover:text-indigo-500 text-sm"
                          >
                            <Download className="w-4 h-4 mr-1" />
                            Download
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No files uploaded</p>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Video Modal */}
      <Modal
        isOpen={isVideoModalOpen}
        onClose={() => {
          setIsVideoModalOpen(false);
          setSelectedVideoUrl(null);
        }}
        title="Video Player"
      >
        {selectedVideoUrl && (
          <div className="p-4">
            <video
              controls
              className="w-full h-auto max-h-96 rounded-lg"
              preload="metadata"
            >
              <source src={selectedVideoUrl} type="video/mp4" />
              <source src={selectedVideoUrl} type="video/webm" />
              <source src={selectedVideoUrl} type="video/quicktime" />
              Your browser does not support the video tag.
            </video>
            <div className="mt-4 flex justify-end">
              <a
                href={selectedVideoUrl}
                download
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <Download className="w-4 h-4 mr-2" />
                Download Video
              </a>
            </div>
          </div>
        )}
      </Modal>

      {/* Tag Management Modal */}
      <TagManagementModal
        isOpen={isTagManagementOpen}
        onClose={() => setIsTagManagementOpen(false)}
      />

      {/* Material Tag Modal */}
      {materialForTagging && (
        <MaterialTagModal
          isOpen={isMaterialTagModalOpen}
          onClose={() => {
            setIsMaterialTagModalOpen(false);
            setMaterialForTagging(null);
          }}
          materialId={materialForTagging.material_id}
          materialTitle={materialForTagging.title}
          currentTags={materialForTagging.tags || []}
          onTagsUpdated={() => {
            fetchTrainingMaterials();
          }}
        />
      )}
    </div>
  );
}

export default withAuth(TrainingMaterialPage);