import React, { useState, useEffect } from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import { tagApi, Tag } from '@/app/api/tagApi';
import { showToast } from '@/app/utils/toast';

interface SimpleTag {
  tag_id: number;
  name: string;
}

interface MaterialTagModalProps {
  isOpen: boolean;
  onClose: () => void;
  materialId: number;
  materialTitle: string;
  currentTags?: SimpleTag[];
  onTagsUpdated?: () => void;
}

const MaterialTagModal: React.FC<MaterialTagModalProps> = ({
  isOpen,
  onClose,
  materialId,
  materialTitle,
  currentTags = [],
  onTagsUpdated
}) => {
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [assignedTags, setAssignedTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchAvailableTags();
    }
  }, [isOpen]);

  // Update assigned tags when available tags are loaded
  useEffect(() => {
    if (availableTags.length > 0 && currentTags && currentTags.length > 0) {
      const matchingTags = availableTags.filter(tag => 
        currentTags.some(currentTag => currentTag.tag_id === tag.tag_id)
      );
      setAssignedTags(matchingTags);
    } else if (availableTags.length > 0) {
      setAssignedTags([]);
    }
  }, [availableTags, currentTags]);

  const fetchAvailableTags = async () => {
    try {
      setLoading(true);
      const result = await tagApi.getAll();
      if (!result.error && result.tags) {
        setAvailableTags(result.tags);
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

  const handleAddTag = (tag: Tag) => {
    if (!assignedTags.find(t => t.tag_id === tag.tag_id)) {
      setAssignedTags([...assignedTags, tag]);
    }
  };

  const handleRemoveTag = (tagId: number) => {
    setAssignedTags(assignedTags.filter(tag => tag.tag_id !== tagId));
  };

  const handleSave = async () => {
    try {
      setSubmitting(true);
      const tagIds = assignedTags.map(tag => tag.tag_id);
      
      const result = await tagApi.assignToMaterial(materialId, tagIds);
      if (!result.error) {
        showToast.success('Tags updated successfully');
        onTagsUpdated?.();
        onClose();
      } else {
        showToast.error(result.message || 'Failed to update tags');
      }
    } catch (error: any) {
      console.error('Error updating tags:', error);
      showToast.error(error.message || 'Failed to update tags');
    } finally {
      setSubmitting(false);
    }
  };

  const getUnassignedTags = () => {
    return availableTags.filter(tag => 
      !assignedTags.find(assignedTag => assignedTag.tag_id === tag.tag_id)
    );
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Manage Tags</h2>
            <p className="text-sm text-gray-600 mt-1">{materialTitle}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-500"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Assigned Tags */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Assigned Tags</h3>
                {assignedTags.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    No tags assigned to this material
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {assignedTags.map((tag) => (
                      <div
                        key={tag.tag_id}
                        className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-lg"
                      >
                        <span className="text-sm font-medium text-indigo-900">
                          {tag.name}
                        </span>
                        <button
                          onClick={() => handleRemoveTag(tag.tag_id)}
                          className="text-red-400 hover:text-red-500"
                          title="Remove tag"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Available Tags */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-3">Available Tags</h3>
                {getUnassignedTags().length === 0 ? (
                  <div className="text-center py-8 text-gray-500 bg-gray-50 rounded-lg">
                    {availableTags.length === 0 
                      ? 'No tags available. Create some tags first.'
                      : 'All available tags have been assigned'
                    }
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {getUnassignedTags().map((tag) => (
                      <div
                        key={tag.tag_id}
                        className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg hover:bg-gray-100"
                      >
                        <span className="text-sm font-medium text-gray-900">
                          {tag.name}
                        </span>
                        <button
                          onClick={() => handleAddTag(tag)}
                          className="text-indigo-400 hover:text-indigo-500"
                          title="Add tag"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end space-x-3 p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={submitting}
            className={`px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 ${
              submitting ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {submitting ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default MaterialTagModal;