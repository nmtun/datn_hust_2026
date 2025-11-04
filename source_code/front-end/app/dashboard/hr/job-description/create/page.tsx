"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';
import { jobDescriptionApi, JobDescription } from '@/app/api/jobDescriptionApi';
import JobDescriptionForm from '@/app/components/JobDescriptionForm';

function CreateJobDescriptionPage() {
  const { user, isLoggedIn, loading: authLoading } = useAuth();
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check authentication and role
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Only proceed if authenticated and has HR role
  if (!isLoggedIn || user?.role !== 'hr') {
    router.push('/auth/login');
    return null;
  }

  const handleSubmit = async (data: Partial<JobDescription>) => {
    try {
      setSaving(true);
      setError(null);

      // Validate required fields
      if (!data.title || !data.description || !data.requirements || 
          !data.responsibilities || !data.qualifications || 
          !data.experience_level || !data.employment_type || 
          data.salary_range_min === undefined || data.salary_range_max === undefined) {
        throw new Error('Please fill in all required fields');
      }

      // Add current user as creator
      const fullData = {
        title: data.title,
        description: data.description,
        location: data.location || '',
        type_of_work: data.type_of_work || 'on-site',
        requirements: data.requirements,
        responsibilities: data.responsibilities,
        qualifications: data.qualifications,
        experience_level: data.experience_level,
        employment_type: data.employment_type,
        salary_range_min: data.salary_range_min,
        salary_range_max: data.salary_range_max,
        status: data.status || 'draft',
        posting_date: data.posting_date || new Date().toISOString().split('T')[0],
        closing_date: data.closing_date || '',
        positions_count: data.positions_count || 1,
        department_id: data.department_id || 1,
        created_by: Number(user?.user_id),
      };

      const result = await jobDescriptionApi.create(fullData);
      
      if (result.error) {
        throw new Error(result.message || 'Error creating job description');
      }

      // Success - redirect back to list with success message
      router.push('/dashboard/hr/job-description');
      // TODO: Add success notification
    } catch (error: any) {
      console.error('Error creating job description:', error);
      setError(error.message || 'Error creating job description');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen p-4 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back to Job Descriptions
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Create New Job Description</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <JobDescriptionForm
            onSubmit={handleSubmit}
            isLoading={saving}
            initialData={{
              title: '',
              description: '',
              location: '',
              type_of_work: 'on-site',
              requirements: '',
              responsibilities: '',
              qualifications: '',
              experience_level: 'fresher',
              employment_type: 'full-time',
              salary_range_min: 0,
              salary_range_max: 0,
              status: 'draft',
              posting_date: new Date().toISOString().split('T')[0],
              closing_date: '',
              positions_count: 1,
              department_id: 1, // This should be selected by user or set based on their department
            }}
          />
        </div>
      </div>
    </div>
  );
}

export default CreateJobDescriptionPage;