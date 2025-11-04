import React from 'react';
import { JobDescription } from '@/app/api/jobDescriptionApi';

interface JobDescriptionFormProps {
  initialData?: Partial<JobDescription>;
  onSubmit: (data: Partial<JobDescription>) => void;
  isLoading?: boolean;
}

const JobDescriptionForm: React.FC<JobDescriptionFormProps> = ({
  initialData,
  onSubmit,
  isLoading = false,
}) => {
  const [formData, setFormData] = React.useState<Partial<JobDescription>>({
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
    ...initialData,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  const parseCurrencyValue = (value: string): number => {
    return Number(value.replace(/[,.]/g, ''));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const numericValue = value === '' ? 0 : parseCurrencyValue(value);
    
    if (name === 'salary_range_max' && numericValue < (formData.salary_range_min || 0)) {
      return; // Don't update if max is less than min
    }

    setFormData((prev) => ({
      ...prev,
      [name]: numericValue,
    }));
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Title */}
      <div>
        <label htmlFor="title" className="block text-sm font-medium text-gray-700">
          Job Title *
        </label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      {/* Basic Information - First Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <label htmlFor="employment_type" className="block text-sm font-medium text-gray-700">
            Employment Type *
          </label>
          <select
            id="employment_type"
            name="employment_type"
            value={formData.employment_type}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="full-time">Full Time</option>
            <option value="part-time">Part Time</option>
          </select>
        </div>

        <div>
          <label htmlFor="type_of_work" className="block text-sm font-medium text-gray-700">
            Work Type *
          </label>
          <select
            id="type_of_work"
            name="type_of_work"
            value={formData.type_of_work}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="on-site">On Site</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>

        <div>
          <label htmlFor="experience_level" className="block text-sm font-medium text-gray-700">
            Experience Level *
          </label>
          <select
            id="experience_level"
            name="experience_level"
            value={formData.experience_level}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="intern">Intern</option>
            <option value="fresher">Fresher</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior</option>
            <option value="manager">Manager</option>
          </select>
        </div>
      </div>

      {/* Basic Information - Second Row */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Location *
          </label>
          <input
            type="text"
            id="location"
            name="location"
            value={formData.location}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="positions_count" className="block text-sm font-medium text-gray-700">
            Number of Positions *
          </label>
          <input
            type="number"
            id="positions_count"
            name="positions_count"
            value={formData.positions_count}
            onChange={handleNumberChange}
            min="1"
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

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
            <option value="paused">Paused</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Salary Range */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="salary_range_min" className="block text-sm font-medium text-gray-700">
            Minimum Salary (VND) *
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              id="salary_range_min"
              name="salary_range_min"
              value={formData.salary_range_min ? formatCurrency(formData.salary_range_min) : ''}
              onChange={handleNumberChange}
              required
              placeholder="0"
              className="block w-full rounded-md border-gray-300 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">VND</span>
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="salary_range_max" className="block text-sm font-medium text-gray-700">
            Maximum Salary (VND) *
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              id="salary_range_max"
              name="salary_range_max"
              value={formData.salary_range_max ? formatCurrency(formData.salary_range_max) : ''}
              onChange={handleNumberChange}
              required
              placeholder="0"
              className="block w-full rounded-md border-gray-300 pr-12 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <span className="text-gray-500 sm:text-sm">VND</span>
            </div>
          </div>
          {typeof formData.salary_range_max === 'number' && 
           typeof formData.salary_range_min === 'number' && 
           formData.salary_range_max < formData.salary_range_min && (
            <p className="mt-1 text-sm text-red-600">
              Maximum salary must be greater than minimum salary
            </p>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="posting_date" className="block text-sm font-medium text-gray-700">
            Posting Date *
          </label>
          <input
            type="date"
            id="posting_date"
            name="posting_date"
            value={formData.posting_date}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>

        <div>
          <label htmlFor="closing_date" className="block text-sm font-medium text-gray-700">
            Closing Date
          </label>
          <input
            type="date"
            id="closing_date"
            name="closing_date"
            value={formData.closing_date || ''}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">
          Job Description *
        </label>
        <textarea
          id="description"
          name="description"
          value={formData.description}
          onChange={handleChange}
          required
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      {/* Requirements */}
      <div>
        <label htmlFor="requirements" className="block text-sm font-medium text-gray-700">
          Requirements *
        </label>
        <textarea
          id="requirements"
          name="requirements"
          value={formData.requirements}
          onChange={handleChange}
          required
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      {/* Responsibilities */}
      <div>
        <label htmlFor="responsibilities" className="block text-sm font-medium text-gray-700">
          Responsibilities *
        </label>
        <textarea
          id="responsibilities"
          name="responsibilities"
          value={formData.responsibilities}
          onChange={handleChange}
          required
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      {/* Qualifications */}
      <div>
        <label htmlFor="qualifications" className="block text-sm font-medium text-gray-700">
          Qualifications *
        </label>
        <textarea
          id="qualifications"
          name="qualifications"
          value={formData.qualifications}
          onChange={handleChange}
          required
          rows={4}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
        />
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          disabled={isLoading}
          className="inline-flex justify-center rounded-md border border-transparent bg-indigo-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  );
};

export default JobDescriptionForm;