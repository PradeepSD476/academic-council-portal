import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Plus, Search, Edit2, Trash2, ChevronLeft, ChevronRight,
  BookOpen, X, Save, AlertTriangle
} from 'lucide-react';
import { getAuth } from 'firebase/auth';

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
    program: '',
    academicYear: '',
    allowedBranches: ''
  };
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

  const getAuthToken = async () => {
    const auth = getAuth();
    const user = auth.currentUser;
    return user ? await user.getIdToken() : localStorage.getItem('token');
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const token = await getAuthToken();
      const searchParam = debouncedSearch ? `&search=${encodeURIComponent(debouncedSearch)}` : '';
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/courses?page=${page}&limit=${limit}${searchParam}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const fetchedCourses = response.data?.data?.courses || response.data?.data || [];
      setCourses(fetchedCourses);
      setHasMore(fetchedCourses.length >= limit);
    } catch (error) {
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
      allowedBranches: Array.isArray(course.allowedBranches) ? course.allowedBranches.join(', ') : course.allowedBranches || ''
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this course? This action cannot be undone.")) return;

    try {
      const token = await getAuthToken();
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/courses/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      alert("Course deleted successfully");
      fetchCourses(); 
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete course. Check console for details.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await getAuthToken();

      const payload = {
        ...formData,
        credits: parseInt(formData.credits),
        academicYear: parseInt(formData.academicYear),
        allowedBranches: formData.allowedBranches.split(',').map(b => b.trim()).filter(b => b !== '')
      };

      if (modalMode === 'add') {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/courses`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Course Added Successfully!");
      } else {
        await axios.patch(`${import.meta.env.VITE_API_URL}/api/v1/courses/${selectedCourseId}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        alert("Course Updated Successfully!");
      }

      setIsModalOpen(false);
      fetchCourses(); // Refresh
    } catch (error) {
      console.error("Operation failed:", error.response?.data || error);
      alert(error.response?.data?.message || "Operation failed. Check inputs.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };


  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Courses</h1>
          <p className="text-gray-500 text-sm mt-1">View and manage the academic course catalog.</p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm"
        >
          <Plus size={18} />
          Add New Course
        </button>
      </div>

      <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search courses by code or name..."
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Code</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branches</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Credits</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                [...Array(5)].map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-48"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-6 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                    <td className="px-6 py-4"><div className="h-8 bg-gray-200 rounded w-20 ml-auto"></div></td>
                  </tr>
                ))
              ) : courses.length > 0 ? (
                courses.map((course) => (
                  <tr key={course.id || course.courseCode} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                        {course.courseCode}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{course.name}</div>
                      <div className="text-xs text-gray-500">{course.instructor}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {/* Join the array with a comma and space */}
                        {course.allowedBranches ? course.allowedBranches.join(', ') : 'All'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{course.credits}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleOpenEdit(course)} className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                          <Edit2 size={16} />
                        </button>
                        <button onClick={() => handleDelete(course.id)} className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center text-gray-500">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="p-3 bg-gray-100 rounded-full"><BookOpen size={24} className="text-gray-400" /></div>
                      <p className="font-medium">No courses found</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <p className="text-sm text-gray-500">Page <span className="font-medium text-gray-900">{page}</span></p>
          <div className="flex gap-2">
            <button onClick={() => page > 1 && setPage(p => p - 1)} disabled={page === 1 || loading} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronLeft size={16} /> Previous</button>
            <button onClick={() => hasMore && setPage(p => p + 1)} disabled={!hasMore || loading} className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50">Next <ChevronRight size={16} /></button>
          </div>
        </div>
      </div>

      {/* --- ADD / EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-100 flex items-center justify-between z-10">
              <h2 className="text-lg font-bold text-gray-800">
                {modalMode === 'add' ? 'Add New Course' : 'Edit Course'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Code *</label>
                  <input required name="courseCode" value={formData.courseCode} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all" placeholder="e.g. CS101" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course Name *</label>
                  <input required name="name" value={formData.name} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Data Structures" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Brief course description..." />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructor *</label>
                  <input required name="instructor" value={formData.instructor} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Faculty Name" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Credits *</label>
                  <input required type="number" name="credits" value={formData.credits} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 4" />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Program *</label>
                  <input required name="program" value={formData.program} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. BTech" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Academic Year (Sem) *</label>
                  <input required type="number" name="academicYear" value={formData.academicYear} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. 2025" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Allowed Branches *</label>
                <input required name="allowedBranches" value={formData.allowedBranches} onChange={handleInputChange} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. CSE, EEE, ME (Comma separated)" />
                <p className="text-xs text-gray-500 mt-1">Separate multiple branches with commas</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 mt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 flex items-center gap-2">
                  <Save size={16} />
                  {modalMode === 'add' ? 'Save Course' : 'Update Course'}
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