import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, X } from 'lucide-react';
import { tagApi, Tag } from '@/app/api/tagApi';
import { showToast } from '@/app/utils/toast';

interface TagManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const TagManagementModal: React.FC<TagManagementModalProps> = ({ isOpen, onClose }) => {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedTag, setSelectedTag] = useState<Tag | null>(null);
  const [tagName, setTagName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchTags();
    }
  }, [isOpen]);

  const fetchTags = async () => {
    try {
      setLoading(true);
      const result = await tagApi.getAll();
      if (!result.error && result.tags) {
        setTags(result.tags);
      } else {
        showToast.error(result.message || 'Failed to fetch tags');
      }
    } catch (error: any) {
      console.error('Error fetching tags:', error);
      showToast.error(error.message || 'Failed to fetch tags');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!tagName.trim()) {
      showToast.error('Tag name is required');
      return;
    }

    try {
      setSubmitting(true);
      const result = await tagApi.create({ name: tagName.trim() });
      if (!result.error) {
        showToast.success('Tag created successfully');
        setTagName('');
        setIsCreateModalOpen(false);
        fetchTags();
      } else {
        showToast.error(result.message || 'Failed to create tag');
      }
    } catch (error: any) {
      console.error('Error creating tag:', error);
      showToast.error(error.message || 'Failed to create tag');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTag = async () => {
    if (!selectedTag || !tagName.trim()) {
      showToast.error('Tag name is required');
      return;
    }

    try {
      setSubmitting(true);
      const result = await tagApi.update(selectedTag.tag_id, { name: tagName.trim() });
      if (!result.error) {
        showToast.success('Tag updated successfully');
        setTagName('');
        setSelectedTag(null);
        setIsEditModalOpen(false);
        fetchTags();
      } else {
        showToast.error(result.message || 'Failed to update tag');
      }
    } catch (error: any) {
      console.error('Error updating tag:', error);
      showToast.error(error.message || 'Failed to update tag');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTag = async (tag: Tag) => {
    if (!window.confirm(`Are you sure you want to delete the tag "${tag.name}"?`)) {
      return;
    }

    try {
      setDeleteLoading(tag.tag_id);
      const result = await tagApi.delete(tag.tag_id);
      if (!result.error) {
        showToast.success('Tag deleted successfully');
        fetchTags();
      } else {
        showToast.error(result.message || 'Failed to delete tag');
      }
    } catch (error: any) {
      console.error('Error deleting tag:', error);
      showToast.error(error.message || 'Failed to delete tag');
    } finally {
      setDeleteLoading(null);
    }
  };

  const openEditModal = (tag: Tag) => {
    setSelectedTag(tag);
    setTagName(tag.name);
    setIsEditModalOpen(true);
  };

  const filteredTags = tags.filter(tag =>
    tag.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">Tag Management</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Search and Create */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex-1 relative mr-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search tags..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-md hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Tag
            </button>
          </div>

          {/* Tags List */}
          <div className="bg-gray-50 rounded-lg overflow-hidden">
            {loading ? (
              <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : (
              <div className="max-h-96 overflow-y-auto">
                {filteredTags.length === 0 ? (
                  <div className="p-8 text-center text-gray-500">
                    {searchQuery ? 'No tags found matching your search' : 'No tags created yet'}
                  </div>
                ) : (
                  <div className="divide-y divide-gray-200">
                    {filteredTags.map((tag) => (
                      <div key={tag.tag_id} className="flex items-center justify-between p-4 hover:bg-gray-100">
                        <div className="flex-1">
                          <h3 className="text-sm font-medium text-gray-900">{tag.name}</h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {tag.trainingMaterials?.length || 0} materials • Created {new Date(tag.created_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => openEditModal(tag)}
                            className="text-blue-400 hover:text-blue-500"
                            title="Edit tag"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTag(tag)}
                            className={`text-red-400 hover:text-red-500 ${
                              deleteLoading === tag.tag_id ? 'opacity-50 cursor-not-allowed' : ''
                            }`}
                            disabled={deleteLoading === tag.tag_id}
                            title="Delete tag"
                          >
                            {deleteLoading === tag.tag_id ? (
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Create Tag Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Tag</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tag Name
                </label>
                <input
                  type="text"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="Enter tag name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleCreateTag()}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    setTagName('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateTag}
                  disabled={submitting || !tagName.trim()}
                  className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 ${
                    (submitting || !tagName.trim()) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting ? 'Creating...' : 'Create'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Tag Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 flex items-center justify-center p-4 z-60">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Edit Tag</h3>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Tag Name
                </label>
                <input
                  type="text"
                  value={tagName}
                  onChange={(e) => setTagName(e.target.value)}
                  placeholder="Enter tag name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  onKeyPress={(e) => e.key === 'Enter' && handleEditTag()}
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setSelectedTag(null);
                    setTagName('');
                  }}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditTag}
                  disabled={submitting || !tagName.trim()}
                  className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 ${
                    (submitting || !tagName.trim()) ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {submitting ? 'Updating...' : 'Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TagManagementModal;