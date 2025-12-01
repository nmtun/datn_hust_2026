/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Search, ArrowLeft, Eye, RotateCcw, Trash2, FileText, Archive, Undo2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { trainingMaterialApi, TrainingMaterial } from "@/app/api/trainingMaterialApi";
import { showToast } from "@/app/utils/toast";
import Modal from "@/app/components/Modal";
import { withAuth } from "@/app/middleware/withAuth";

function ArchivedTrainingMaterialsPage() {
  const router = useRouter();
  const [searchTitle, setSearchTitle] = useState("");
  const [searchCreator, setSearchCreator] = useState("");
  const [archivedMaterials, setArchivedMaterials] = useState<TrainingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMaterial, setSelectedMaterial] = useState<TrainingMaterial | null>(null);
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

  const debouncedSearchTitle = useDebounce(searchTitle, 500);
  const debouncedSearchCreator = useDebounce(searchCreator, 500);

  useEffect(() => {
    fetchArchivedMaterials();
  }, []);

  useEffect(() => {
    const performSearch = async () => {
      if (!debouncedSearchTitle && !debouncedSearchCreator) {
        fetchArchivedMaterials();
        return;
      }

      try {
        setLoading(true);
        const query = {
          title: debouncedSearchTitle.trim() || undefined,
          created_by: debouncedSearchCreator.trim() || undefined,
          status: 'archived' // Chỉ lấy archived materials
        };

        const result = await trainingMaterialApi.search(query);

        if (!result || result.error) {
          console.error("API Error:", result?.message || "Unknown error");
          setArchivedMaterials([]);
          return;
        }

        const materials = result.materials;
        if (Array.isArray(materials)) {
          setArchivedMaterials(materials);
        } else {
          console.error("Invalid materials data format:", materials);
          setArchivedMaterials([]);
        }
      } catch (error) {
        console.error("Error searching archived materials:", error);
        setArchivedMaterials([]);
        showToast.error('Error searching archived materials');
      } finally {
        setLoading(false);
      }
    };

    performSearch();
  }, [debouncedSearchTitle, debouncedSearchCreator]);

  const fetchArchivedMaterials = async () => {
    try {
      setLoading(true);
      const result = await trainingMaterialApi.getArchived();

      if (!result || result.error) {
        console.error("API Error:", result?.message || "Unknown error");
        setArchivedMaterials([]);
        return;
      }

      const materials = result.materials;
      if (Array.isArray(materials)) {
        setArchivedMaterials(materials);
      } else {
        console.error("Invalid materials data format:", materials);
        setArchivedMaterials([]);
      }
    } catch (error) {
      console.error("Error fetching archived materials:", error);
      setArchivedMaterials([]);
    } finally {
      setLoading(false);
    }
  };

  const [restoreLoading, setRestoreLoading] = useState<number | null>(null);
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false);
  const [materialToRestore, setMaterialToRestore] = useState<TrainingMaterial | null>(null);

  const handleRestoreClick = (material: TrainingMaterial) => {
    setMaterialToRestore(material);
    setShowRestoreConfirm(true);
  };

  const handleConfirmRestore = async () => {
    if (!materialToRestore) return;

    try {
      setRestoreLoading(materialToRestore.material_id);
      const result = await trainingMaterialApi.restore(materialToRestore.material_id);

      if (result.error) {
        throw new Error(result.message || 'Error restoring training material');
      }

      await fetchArchivedMaterials();
      showToast.success('Training material restored successfully');
    } catch (error: any) {
      console.error("Error restoring training material:", error);
      showToast.error(error.message || 'Error restoring training material');
    } finally {
      setRestoreLoading(null);
      setShowRestoreConfirm(false);
      setMaterialToRestore(null);
    }
  };

  const handleView = (materialId: number) => {
    const material = archivedMaterials.find(m => m.material_id === materialId);
    if (material) {
      setSelectedMaterial(material);
      setIsViewModalOpen(true);
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
        <div className="flex items-center">
          <button
            onClick={() => router.push("/dashboard/hr/training-material")}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center">
            <Archive className="w-6 h-6 mr-2 text-gray-600" />
            <h1 className="text-2xl font-bold text-gray-900">Archived Training Materials</h1>
          </div>
        </div>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search archived materials by title..."
              value={searchTitle}
              onChange={(e) => setSearchTitle(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search archived materials by creator..."
              value={searchCreator}
              onChange={(e) => setSearchCreator(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Archived Materials Table */}
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
                  Created By
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Archived At
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {archivedMaterials.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-4">
                    <div className="text-center py-8">
                      <Archive className="mx-auto h-12 w-12 text-gray-400" />
                      <h3 className="mt-2 text-sm font-medium text-gray-900">No archived training materials found</h3>
                      <p className="mt-1 text-sm text-gray-500">All training materials are currently active.</p>
                    </div>
                  </td>
                </tr>
              ) : (
                archivedMaterials.map((material) => (
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {material.creator ? material.creator.full_name : 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {material.updated_at ? new Date(material.updated_at).toLocaleDateString() : 'Unknown'}
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
                          onClick={() => handleRestoreClick(material)}
                          className={`text-green-400 hover:text-green-500 ${restoreLoading === material.material_id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                          disabled={restoreLoading === material.material_id}
                          title="Restore material">
                          {restoreLoading === material.material_id ? (
                            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-green-400" />
                          ) : (
                            <Undo2 className="w-5 h-5" />
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={showRestoreConfirm}
        onClose={() => {
          setShowRestoreConfirm(false);
          setMaterialToRestore(null);
        }}
        title="Confirm Restore"
      >
        <div className="p-6">
          <p className="mb-4">Are you sure you want to restore this training material?</p>
          <p className="mb-6 font-medium text-gray-700">{materialToRestore?.title}</p>
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => {
                setShowRestoreConfirm(false);
                setMaterialToRestore(null);
              }}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmRestore}
              disabled={restoreLoading !== null}
              className={`px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 ${restoreLoading !== null ? 'opacity-50 cursor-not-allowed' : ''
                }`}
            >
              {restoreLoading !== null ? 'Restoring...' : 'Restore'}
            </button>
          </div>
        </div>
      </Modal>
      {/* View Material Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title={selectedMaterial?.title || "Training Material Details"}
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
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                      Archived
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
                  <p className="text-sm font-medium text-gray-500">Archived At</p>
                  <p className="mt-1">
                    {selectedMaterial.updated_at
                      ? new Date(selectedMaterial.updated_at).toLocaleString()
                      : 'Unknown'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Description</h3>
              <p className="text-gray-600 whitespace-pre-wrap">
                {selectedMaterial.description || 'No description provided.'}
              </p>
            </div>

            {/* Content Path */}
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">Content File</h3>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <p className="text-sm text-gray-600">
                    File: {selectedMaterial.content_path ? selectedMaterial.content_path.split(/[/\\]/).pop() : 'No file uploaded'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

export default withAuth(ArchivedTrainingMaterialsPage);