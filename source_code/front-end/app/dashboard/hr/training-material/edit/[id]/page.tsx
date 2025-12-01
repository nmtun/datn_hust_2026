/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, FileText } from 'lucide-react';
import { trainingMaterialApi, TrainingMaterial } from '@/app/api/trainingMaterialApi';
import { showToast } from '@/app/utils/toast';
import { withAuth } from '@/app/middleware/withAuth';
import TrainingMaterialForm from '@/app/components/TrainingMaterialForm';

function EditTrainingMaterialPage() {
  const router = useRouter();
  const params = useParams();
  const materialId = Number(params?.id);
  
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [trainingMaterial, setTrainingMaterial] = useState<TrainingMaterial | null>(null);

  useEffect(() => {
    if (materialId) {
      fetchTrainingMaterial();
    }
  }, [materialId]);

  const fetchTrainingMaterial = async () => {
    try {
      setLoading(true);
      const result = await trainingMaterialApi.getById(materialId);
      
      if (result.error) {
        throw new Error(result.message || 'Error fetching training material');
      }

      setTrainingMaterial(result.material);
    } catch (error: any) {
      console.error('Error fetching training material:', error);
      showToast.error(error.message || 'Error fetching training material');
      router.push('/dashboard/hr/training-material');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (formData: FormData) => {
    try {
      setSaving(true);

      const result = await trainingMaterialApi.update(materialId, formData);

      if (result.error) {
        throw new Error(result.message || 'Error updating training material');
      }

      showToast.success('Training material updated successfully');
      router.push('/dashboard/hr/training-material');
    } catch (error: any) {
      console.error('Error updating training material:', error);
      showToast.error(error.message || 'Error updating training material');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          <span className="ml-3 text-gray-600">Loading training material...</span>
        </div>
      </div>
    );
  }

  if (!trainingMaterial) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center py-12">
          <p className="text-gray-500">Training material not found</p>
          <button
            onClick={() => router.push('/dashboard/hr/training-material')}
            className="mt-4 text-indigo-600 hover:text-indigo-500"
          >
            Back to Training Materials
          </button>
        </div>
      </div>
    );
  }

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
            <h1 className="text-2xl font-bold text-gray-900">Edit Training Material</h1>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="bg-white shadow rounded-lg p-6">
        <TrainingMaterialForm
          initialData={trainingMaterial}
          onSubmit={handleSubmit}
          isLoading={saving}
        />
      </div>
    </div>
  );
}

export default withAuth(EditTrainingMaterialPage);