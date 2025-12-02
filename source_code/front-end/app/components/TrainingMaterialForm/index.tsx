/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { FileText, Upload, X } from 'lucide-react';
import { TrainingMaterial } from '@/app/api/trainingMaterialApi';

interface TrainingMaterialFormProps {
  initialData?: Partial<TrainingMaterial>;
  onSubmit: (data: FormData) => void;
  isLoading?: boolean;
}

const TrainingMaterialForm: React.FC<TrainingMaterialFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = React.useState({
    title: initialData?.title || '',
    description: initialData?.description || '',
    type: initialData?.type || 'document' as 'video' | 'document' | 'both',
    status: initialData?.status || 'draft' as 'active' | 'draft' | 'archived',
  });

  const [contentFiles, setContentFiles] = React.useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = React.useState<string[]>([]);
  const [isDragActive, setIsDragActive] = React.useState(false);
  const [existingFiles, setExistingFiles] = React.useState<string[]>([]);
  const [filesToDelete, setFilesToDelete] = React.useState<string[]>([]);

  // Set preview URLs for existing content
  React.useEffect(() => {
    if (initialData?.content_path) {
      // Parse multiple files separated by semicolon
      const files = initialData.content_path.split(';').filter(path => path.trim());
      setExistingFiles(files);
      setPreviewUrls(files);
    }
  }, [initialData]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.title.trim()) {
      alert('Please enter a title');
      return;
    }

    if (!formData.description.trim()) {
      alert('Please enter a description');
      return;
    }

    const remainingExistingFiles = existingFiles.filter(file => !filesToDelete.includes(file));
    if (remainingExistingFiles.length === 0 && contentFiles.length === 0) {
      alert('Please keep at least one content file or upload new files');
      return;
    }

    // Create FormData object
    const submitFormData = new FormData();
    submitFormData.append('title', formData.title.trim());
    submitFormData.append('description', formData.description.trim());
    submitFormData.append('type', formData.type);
    submitFormData.append('status', formData.status);

    if (contentFiles.length > 0) {
      contentFiles.forEach((file, index) => {
        submitFormData.append('files', file);
      });
    }

    // Gửi danh sách file cần xóa
    if (filesToDelete.length > 0) {
      submitFormData.append('filesToDelete', JSON.stringify(filesToDelete));
    }

    onSubmit(submitFormData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const processFiles = (fileList: FileList | File[]) => {
    const files = Array.isArray(fileList) ? fileList : Array.from(fileList);
    
    // Validate each file based on selected type
    let allowedTypes: string[] = [];
    let typeDescription = '';
    
    if (formData.type === 'video') {
      allowedTypes = [
        'video/mp4',
        'video/avi',
        'video/quicktime',
        'video/x-msvideo'
      ];
      typeDescription = 'MP4, AVI, MOV';
    } else if (formData.type === 'document') {
      allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'text/plain',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
      typeDescription = 'PDF, DOC, DOCX, TXT, PPT, PPTX';
    } else { // both
      allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'video/mp4',
        'video/avi',
        'video/quicktime',
        'video/x-msvideo',
        'text/plain',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];
      typeDescription = 'PDF, DOC, DOCX, MP4, AVI, MOV, TXT, PPT, PPTX';
    }

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    files.forEach(file => {
      // Validate file size (max 50MB)
      if (file.size > 50 * 1024 * 1024) {
        invalidFiles.push(`${file.name}: File size must be less than 50MB`);
        return;
      }

      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        invalidFiles.push(`${file.name}: Invalid file type`);
        return;
      }

      validFiles.push(file);
    });

    if (invalidFiles.length > 0) {
      alert(`Invalid files:\n${invalidFiles.join('\n')}\n\nValid files for ${formData.type === 'both' ? 'Video & Document' : formData.type}: ${typeDescription} (max 50MB each)`);
      if (validFiles.length === 0) return;
    }

    // Add valid files to existing files
    setContentFiles(prev => [...prev, ...validFiles]);
    setPreviewUrls(prev => [...prev, ...validFiles.map(file => file.name)]);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setContentFiles(prev => prev.filter((_, i) => i !== index));
    setPreviewUrls(prev => prev.filter((_, i) => i !== index));
  };

  const removeAllFiles = () => {
    setContentFiles([]);
    // Keep existing files, only remove new files
    if (initialData?.content_path) {
      const files = initialData.content_path.split(';').filter(path => path.trim());
      setPreviewUrls(files);
    } else {
      setPreviewUrls([]);
    }
  };

  const removeExistingFile = (filePath: string) => {
    setFilesToDelete(prev => [...prev, filePath]);
    setExistingFiles(prev => prev.filter(file => file !== filePath));
    setPreviewUrls(prev => prev.filter(url => url !== filePath));
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      processFiles(files);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Enter training material title"
        />
      </div>

      {/* Type */}
      <div>
        <label htmlFor="type" className="block text-sm font-medium text-gray-700">
          Type *
        </label>
        <select
          id="type"
          name="type"
          value={formData.type}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="document">Document</option>
          <option value="video">Video</option>
          <option value="both">Video & Document</option>
        </select>
      </div>

      {/* Status */}
      <div>
        <label htmlFor="status" className="block text-sm font-medium text-gray-700">
          Status *
        </label>
        <select
          id="status"
          name="status"
          value={formData.status}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        >
          <option value="draft">Draft</option>
          <option value="active">Active</option>
          <option value="archived">Archived</option>
        </select>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Description *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          placeholder="Enter training material description"
        />
      </div>

      {/* Content File */}
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Content File {!initialData?.content_path && '*'}
        </label>
        
        {/* File Upload Area */}
        <div className="mt-1">
          <div 
            className={`flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md transition-colors ${
              isDragActive 
                ? 'border-indigo-400 bg-indigo-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
          >
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label
                  htmlFor="content-upload"
                  className="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"
                >
                  <span>Upload a file</span>
                  <input
                    id="content-upload"
                    name="content-upload"
                    type="file"
                    multiple
                    className="sr-only"
                    onChange={handleFileChange}
                    accept={formData.type === 'video' ? '.mp4,.avi,.mov' : formData.type === 'document' ? '.pdf,.doc,.docx,.ppt,.pptx' : '.pdf,.doc,.docx,.mp4,.avi,.mov,.ppt,.pptx'}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">
                {formData.type === 'video' ? 'MP4' : formData.type === 'document' ? 'PDF, DOC, DOCX, PPT, PPTX' : 'PDF, DOC, DOCX, MP4, PPT, PPTX'} up to 50MB each (multiple files allowed)
              </p>
            </div>
          </div>
        </div>

        {/* Current/Selected Files Preview */}
        {(previewUrls.length > 0 || contentFiles.length > 0) && (
          <div className="mt-4 space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">
                Files ({existingFiles.length + contentFiles.length})
              </h4>
              {contentFiles.length > 0 && (
                <button
                  type="button"
                  onClick={removeAllFiles}
                  className="text-sm text-red-600 hover:text-red-800"
                >
                  Remove All New Files
                </button>
              )}
            </div>
            
            {/* Existing files */}
            {existingFiles.map((filePath, index) => {
              const filename = filePath.split(/[/\\]/).pop() || 'Unknown file';
              return (
                <div key={`existing-${index}`} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          Current file: {filename}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeExistingFile(filePath)}
                      className="ml-4 text-red-400 hover:text-red-500"
                      title="Remove file"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
            
            {/* New files */}
            {contentFiles.map((file, index) => (
              <div key={index} className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        New file: {file.name}
                      </p>
                      <p className="text-xs text-gray-500">
                        Size: {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="ml-4 text-red-400 hover:text-red-500"
                    title="Remove file"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Submit Button */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={() => window.history.back()}
          className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : (
            'Save'
          )}
        </button>
      </div>
    </form>
  );
};

export default TrainingMaterialForm;