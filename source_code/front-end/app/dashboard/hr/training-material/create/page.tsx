/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import { trainingMaterialApi } from '@/app/api/trainingMaterialApi';
import { showToast } from '@/app/utils/toast';
import { withAuth } from '@/app/middleware/withAuth';
import TrainingMaterialForm from '@/app/components/TrainingMaterialForm';

function CreateTrainingMaterialPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (formData: FormData) => {
    try {
      setSaving(true);

      const result = await trainingMaterialApi.create(formData);

      if (result.error) {
        throw new Error(result.message || 'Error creating training material');
      }

      showToast.success('Training material created successfully');
      router.push('/dashboard/hr/training-material');
    } catch (error: any) {
      console.error('Error creating training material:', error);
      showToast.error(error.message || 'Error creating training material');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center">
          <button
            onClick={() => router.push('/dashboard/hr/training-material')}
            className="mr-4 p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-gray-900">Create New Training Material</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <TrainingMaterialForm
          onSubmit={handleSubmit}
          isLoading={saving}
        />
      </div>
    </div>
  );
}

export default withAuth(CreateTrainingMaterialPage);