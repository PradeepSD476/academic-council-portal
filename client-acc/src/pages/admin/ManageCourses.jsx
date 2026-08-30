import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight,
  BookOpen, X, Save, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';
import Select from 'react-select'


const ManageCourses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [selectedCourseId, setSelectedCourseId] = useState(null);


  const initialFormState = {
    courseCode: '',
    name: '',
    description: '',
    credits: '',
    instructor: '',
    program: 'BTECH',
    academicYear: '',
    allowedBranches: []
  };

  // Lock background body scroll when modal is open
  useEffect(() => {
    if (isModalOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isModalOpen]);

  const branchOptions = [
    { value: "AI", label: "AI" },
    { value: "CS", label: "CS" },
    { value: "CB", label: "CB" },
    { value: "EE", label: "EE" },
    { value: "MT", label: "MT" },
    { value: "MC", label: "MC" },
    { value: "CE", label: "CE" },
    { value: "MM", label: "MM" },
    { value: "PH", label: "PH" },
    { value: "CM", label: "CM" },
    { value: "VL", label: "VL" },
    { value: "PC", label: "PC" },
    { value: "ST", label: "ST" },
    { value: "GT", label: "GT" },
    { value: "ES", label: "ES" },
    { value: "ME", label: "ME" },
    { value: "CT", label: "CT" },
    { value: "EC", label: "EC" },
  ]




  const [formData, setFormData] = useState(initialFormState);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  useEffect(() => {
    fetchCourses();
  }, [page, debouncedSearch]);


  const fetchCourses = async () => {
    setLoading(true);
    try {
      const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/v1/courses?page=${page}&limit=${limit}${searchParam}`,
        { withCredentials: true }
      );

      const fetchedCourses = response.data?.data?.courses || response.data?.data || [];
      setCourses(fetchedCourses);
      setHasMore(fetchedCourses.length >= limit);
    } catch (error) {
      toast.error("failed to fetch courses.")
      console.error("Failed to fetch courses:", error);
    } finally {
      
      setLoading(false);
    }
  };


  const handleOpenAdd = () => {
    setModalMode('add');
    setFormData(initialFormState);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (course) => {
    setModalMode('edit');
    setSelectedCourseId(course.id);
    setFormData({
      courseCode: course.courseCode,
      name: course.name,
      description: course.description || '',
      credits: course.credits,
      instructor: course.instructor || '',
      program: course.program || '',
      academicYear: course.academicYear || '',
      allowedBranches: Array.isArray(course.allowedBranches)
        ? course.allowedBranches
        : []
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/v1/courses/${id}`, {
        withCredentials: true
      });
      toast.success("Course deleted successfully");
      fetchCourses();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {

      const payload = {
        ...formData,
        credits: parseFloat(formData.credits),
        academicYear: parseInt(formData.academicYear),
        allowedBranches: formData.allowedBranches
      };

      if (modalMode === 'add') {
        await axios.post(`${import.meta.env.VITE_API_URL}/v1/courses`, payload, {
          withCredentials: true
        });
        toast.success("Course Added Successfully!");
      } else {
        await axios.patch(`${import.meta.env.VITE_API_URL}/v1/courses/${selectedCourseId}`, payload, {
          withCredentials: true
        });
        toast.success("Course Updated Successfully!");
      }

      setIsModalOpen(false);
      fetchCourses(); // Refresh
    } catch (error) {
      console.error("Operation failed:", error.response?.data || error);
      toast.error("Operation failed. Check inputs.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  const customSelectStyles = {
    control: (provided, state) => ({
      ...provided,
      backgroundColor: 'white',
      borderColor: state.isFocused ? 'var(--color-secondary)' : '#e2e8f0', // slate-200
      borderRadius: '0.75rem',
      padding: '2px',
      boxShadow: state.isFocused ? '0 0 0 1px var(--color-secondary)' : 'none',
      '&:hover': {
        borderColor: state.isFocused ? 'var(--color-secondary)' : '#cbd5e1', // slate-300
      },
    }),
    menu: (provided) => ({
      ...provided,
      backgroundColor: 'white',
      borderRadius: '0.75rem',
      border: '1px solid #e2e8f0',
      zIndex: 50,
    }),
    option: (provided, state) => ({
      ...provided,
      backgroundColor: state.isSelected
        ? 'var(--color-secondary)'
        : state.isFocused
        ? '#f0f9ff' // sky-50
        : 'white',
      color: state.isSelected ? 'white' : 'var(--color-primary)',
      cursor: 'pointer',
    }),
    multiValue: (provided) => ({
      ...provided,
      backgroundColor: '#f0f9ff',
      borderRadius: '0.5rem',
      border: '1px solid #bae6fd',
    }),
    multiValueLabel: (provided) => ({
      ...provided,
      color: 'var(--color-secondary)',
      fontWeight: 'bold',
      fontSize: '0.75rem',
    }),
    multiValueRemove: (provided) => ({
      ...provided,
      color: 'var(--color-secondary)',
      ':hover': {
        backgroundColor: 'var(--color-secondary)',
        color: '#ffffff',
      },
    }),
    input: (provided) => ({
      ...provided,
      color: 'var(--color-primary)',
    }),
    placeholder: (provided) => ({
      ...provided,
      color: '#94a3b8', // slate-400
      fontSize: '0.875rem',
    }),
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-[3px] h-6 bg-[var(--color-secondary)] rounded-full shadow-[0_0_8px_var(--color-secondary)]" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-primary)] tracking-tight">
              Manage Courses
            </h1>
          </div>
          <p className="text-slate-500 text-sm ml-4">
            View, add, and manage academic course offerings.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-[var(--color-secondary)] hover:opacity-90 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-[0_8px_20px_var(--color-secondary-glow)] cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Add New Course</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative w-full max-w-md">
        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search courses by code, name, or instructor..."
          className="w-full pl-11 pr-4 py-3 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-xs text-[var(--color-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)] focus:ring-1 focus:ring-[var(--color-secondary)] text-sm shadow-sm transition"
        />
      </div>

      {/* Table Card */}
      <div className="bg-white/95 backdrop-blur-xl shadow-xs rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-white/90">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Name &amp; Faculty</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Branches</th>
                <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Credits</th>
                <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-48"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-slate-200 rounded w-12"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-slate-200 rounded w-20 ml-auto"></div></td>
                  </tr>
                ))
              ) : courses.length > 0 ? (
                courses.map((course) => (
                  <tr key={course.id || course.courseCode} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] border border-[var(--color-secondary)]/20 uppercase">
                        {course.courseCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-[var(--color-primary)] leading-snug">{course.name}</div>
                      <div className="text-xs text-slate-500 mt-0.5">{course.instructor || "Faculty"}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full bg-white/5 border border-white/10 text-slate-600">
                        {Array.isArray(course.allowedBranch) && course.allowedBranch.length > 0
                          ? course.allowedBranch.join(', ')
                          : 'All'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-[var(--color-primary)]">{course.credits}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(course)}
                          className="p-1.5 text-slate-500 hover:text-[var(--color-primary)] bg-sky-50 hover:bg-sky-100 rounded-lg transition-colors cursor-pointer"
                          title="Edit Course"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(course.id)}
                          className="p-1.5 text-slate-500 hover:text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition-colors cursor-pointer"
                          title="Delete Course"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-16 text-center text-slate-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-3 bg-sky-100 border border-slate-200 rounded-full"><BookOpen size={24} className="text-slate-500" /></div>
                      <p className="font-semibold text-slate-500 text-sm">No courses found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-white/90 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <p>Page <span className="font-bold text-[var(--color-primary)]">{page}</span></p>
          <div className="flex gap-2">
            <button
              onClick={() => page > 1 && setPage(p => p - 1)}
              disabled={page === 1 || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-100 text-slate-600 hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer font-semibold"
            >
              <ChevronLeft size={14} /> Previous
            </button>
            <button
              onClick={() => hasMore && setPage(p => p + 1)}
              disabled={!hasMore || loading}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-sky-50 border border-sky-100 text-slate-600 hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer font-semibold"
            >
              Next <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-hidden" onClick={() => setIsModalOpen(false)}>
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-2xl h-[88vh] max-h-[800px] flex flex-col overflow-hidden text-[var(--color-primary)] my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b border-slate-200 flex items-center justify-between bg-white/90 backdrop-blur-md shrink-0">
              <h2 className="text-base sm:text-lg font-bold text-[var(--color-primary)]">
                {modalMode === 'add' ? 'Add New Course' : 'Edit Course'}
              </h2>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-[var(--color-primary)] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto min-h-0 scrollbar-thin">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Course Code *</label>
                    <input
                      required
                      name="courseCode"
                      value={formData.courseCode}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-slate-200 bg-white/90 rounded-xl text-[var(--color-primary)] placeholder-slate-400 focus:border-[var(--color-secondary)] focus:outline-none text-sm transition"
                      placeholder="e.g. CS101"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Course Name *</label>
                    <input
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-slate-200 bg-white/90 rounded-xl text-[var(--color-primary)] placeholder-slate-400 focus:border-[var(--color-secondary)] focus:outline-none text-sm transition"
                      placeholder="e.g. Data Structures"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2.5 border border-slate-200 bg-white/90 rounded-xl text-[var(--color-primary)] placeholder-slate-400 focus:border-[var(--color-secondary)] focus:outline-none text-sm transition resize-y"
                    placeholder="Brief course description..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Instructor *</label>
                    <input
                      required
                      name="instructor"
                      value={formData.instructor}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-slate-200 bg-white/90 rounded-xl text-[var(--color-primary)] placeholder-slate-400 focus:border-[var(--color-secondary)] focus:outline-none text-sm transition"
                      placeholder="Faculty Name"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Credits *</label>
                    <input
                      required
                      type="number"
                      step="any"
                      name="credits"
                      value={formData.credits}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-slate-200 bg-white/90 rounded-xl text-[var(--color-primary)] placeholder-slate-400 focus:border-[var(--color-secondary)] focus:outline-none text-sm transition"
                      placeholder="e.g. 4"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Program *</label>
                    <div className="w-full px-3 py-2.5 border border-slate-200 bg-white/90 rounded-xl text-slate-600 text-sm font-semibold">
                      BTECH
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">Academic Year *</label>
                    <input
                      required
                      type="number"
                      name="academicYear"
                      value={formData.academicYear}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2.5 border border-slate-200 bg-white/90 rounded-xl text-[var(--color-primary)] placeholder-slate-400 focus:border-[var(--color-secondary)] focus:outline-none text-sm transition"
                      placeholder="e.g. 1 for 1st year"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Allowed Branches *
                  </label>

                  <Select
                    isMulti
                    options={branchOptions}
                    styles={customSelectStyles}
                    placeholder="Select allowed branches"
                    closeMenuOnSelect={false}
                    value={branchOptions.filter(opt =>
                      formData.allowedBranches.includes(opt.value)
                    )}
                    onChange={(selected) =>
                      setFormData(prev => ({
                        ...prev,
                        allowedBranches: (selected || []).map(opt => opt.value)
                      }))
                    }
                  />

                  <p className="text-[11px] text-slate-500 mt-1">
                    Select one or more branches eligible for this course
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-3 p-4 border-t border-slate-200 bg-white/95 backdrop-blur-md shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-[var(--color-secondary)] hover:opacity-90 rounded-xl shadow-xs flex items-center gap-2 transition cursor-pointer"
                >
                  <Save size={14} />
                  <span>{modalMode === 'add' ? 'Save Course' : 'Update Course'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageCourses;
