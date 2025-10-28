"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { use } from 'react';
import { useAuth } from '@/app/context/AuthContext';
import { jobDescriptionApi, JobDescription } from '@/app/api/jobDescriptionApi';
import JobDescriptionForm from '@/app/components/JobDescriptionForm';

interface PageParams {
  id: string;
}

interface PageProps {
  params: Promise<PageParams>;
}

function EditJobDescriptionPage({ params }: PageProps) {
  const { id: jobId } = use(params);
  const { isLoggedIn, loading: authLoading, user } = useAuth();
  const router = useRouter();
  const [pageLoading, setPageLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [jobDescription, setJobDescription] = useState<JobDescription | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Check authentication
  useEffect(() => {
    // Check if user is logged in and has HR role
    if (!authLoading) {
      if (!isLoggedIn) {
        router.push('/auth/login');
      } else if (user?.role !== 'hr') {
        // Redirect if user is not HR
        router.push('/dashboard');
      }
    }
  }, [isLoggedIn, authLoading, router, user]);

  // Fetch job description
  useEffect(() => {
    if (isLoggedIn) {
      fetchJobDescription();
    }
  }, [jobId, isLoggedIn]);

  const fetchJobDescription = async () => {
    try {
      setPageLoading(true);
      setError(null);
      const result = await jobDescriptionApi.getById(Number(jobId));
      
      if (result.error) {
        setError(result.message || 'Error fetching job description');
        setJobDescription(null);
        return;
      }

      if (result.job) {
        setJobDescription(result.job);
      } else {
        setError('Job description not found');
      }
    } catch (error) {
      console.error('Error fetching job description:', error);
      setError('Error fetching job description');
    } finally {
      setPageLoading(false);
    }
  };

  const handleSubmit = async (data: Partial<JobDescription>) => {
    try {
      setSaving(true);
      setError(null);
      console.log('Updating job description with ID:', jobId);
      console.log('Update data:', data);
      const token = localStorage.getItem('token');
      console.log('Auth token exists:', !!token);
      const result = await jobDescriptionApi.update(Number(jobId), data);
      
      if (result.error) {
        setError(result.message || 'Error updating job description');
        return;
      }

      // Success - redirect back to list
      router.push('/dashboard/hr/job-description');
      // TODO: Add success notification
    } catch (error) {
      console.error('Error updating job description:', error);
      setError('Error updating job description');
    } finally {
      setSaving(false);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  // Only proceed if authenticated and has HR role
  if (!isLoggedIn || user?.role !== 'hr') {
    return null;
  }

  // Show loading state while fetching job description
  if (pageLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen p-4">
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
          <div className="mt-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-sm text-red-600 hover:text-red-500"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!jobDescription) {
    return (
      <div className="min-h-screen p-4">
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">Job Description Not Found</h3>
              <p className="text-sm text-yellow-700 mt-1">The requested job description could not be found.</p>
            </div>
          </div>
          <div className="mt-4">
            <button
              onClick={() => router.back()}
              className="inline-flex items-center text-sm text-yellow-600 hover:text-yellow-500"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }



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
          <h1 className="text-2xl font-bold text-gray-900">Edit Job Description</h1>
        </div>

        {/* Form */}
        <div className="bg-white shadow rounded-lg p-6">
          <JobDescriptionForm
            initialData={jobDescription}
            onSubmit={handleSubmit}
            isLoading={saving}
          />
        </div>
      </div>
    </div>
  );
}

export default EditJobDescriptionPage;