import React from 'react';
import { JobDescription } from '@/app/api/jobDescriptionApi';
import { departmentApi, Department } from '@/app/api/departmentApi';

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
  const [departments, setDepartments] = React.useState<Department[]>([]);
  const [departmentLoading, setDepartmentLoading] = React.useState(false);

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
    department_id: undefined,
    ...initialData,
  });

  React.useEffect(() => {
    const fetchDepartments = async () => {
      try {
        setDepartmentLoading(true);
        const result = await departmentApi.getAll();
        if (!result?.error && Array.isArray(result?.departments)) {
          setDepartments(result.departments.filter((item: Department) => item.active !== false));
        } else {
          setDepartments([]);
        }
      } catch (error) {
        console.error('Error fetching departments:', error);
        setDepartments([]);
      } finally {
        setDepartmentLoading(false);
      }
    };

    fetchDepartments();
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.department_id) {
      return;
    }

    const payload: Partial<JobDescription> = {
      title: formData.title,
      description: formData.description,
      location: formData.location,
      type_of_work: formData.type_of_work,
      requirements: formData.requirements,
      responsibilities: formData.responsibilities,
      qualifications: formData.qualifications,
      experience_level: formData.experience_level,
      employment_type: formData.employment_type,
      salary_range_min: formData.salary_range_min,
      salary_range_max: formData.salary_range_max,
      status: formData.status,
      posting_date: formData.posting_date,
      closing_date: formData.closing_date,
      positions_count: formData.positions_count,
      department_id: formData.department_id,
    };

    onSubmit(payload);
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === 'department_id') {
      setFormData((prev) => ({
        ...prev,
        department_id: value ? Number(value) : undefined,
      }));
      return;
    }

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
          Tiêu đề công việc *
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
            Loại hình làm việc *
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
            Loại công việc *
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
            Trình độ *
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
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div>
          <label htmlFor="location" className="block text-sm font-medium text-gray-700">
            Địa điểm *
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
          <label htmlFor="department_id" className="block text-sm font-medium text-gray-700">
            Phòng ban *
          </label>
          <select
            id="department_id"
            name="department_id"
            value={formData.department_id ?? ''}
            onChange={handleChange}
            required
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">{departmentLoading ? 'Loading departments...' : 'Select department'}</option>
            {departments.map((department) => (
              <option key={department.department_id} value={department.department_id}>
                {department.name} ({department.code})
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="positions_count" className="block text-sm font-medium text-gray-700">
            Số lượng tuyển dụng *
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
            Trạng thái *
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
            Lương tối thiểu (VND) *
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
            Lương tối đa (VND) *
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
              Lương tối đa phải lớn hơn hoặc bằng lương tối thiểu.
            </p>
          )}
        </div>
      </div>

      {/* Timeline */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div>
          <label htmlFor="posting_date" className="block text-sm font-medium text-gray-700">
            Ngày đăng *
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
            Ngày đóng
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
          Mô tả công việc *
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
          Yêu cầu công việc *
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
          Trách nhiệm công việc *
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
          Bằng cấp *
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