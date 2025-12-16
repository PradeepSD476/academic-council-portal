import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { FileText, Plus, Edit2, Trash2, X, Loader2, ExternalLink } from 'lucide-react';
import { getAuth } from 'firebase/auth'; 

const ManageResources = () => {
  const [resources, setResources] = useState([]);
  const [courses, setCourses] = useState([]); 
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [hasMore, setHasMore] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);

  const initialFormState = {
    title: '',
    description: '',
    filePath: '',
    resourceType: 'NOTES',
    courseId: '', 
  };
  const [formData, setFormData] = useState(initialFormState);


  const fetchAllCourses = async () => {
    try {
        const auth = getAuth();
        const user = auth.currentUser;
        const token = user ? await user.getIdToken() : localStorage.getItem('token');

        const response = await axios.get('http://localhost:5000/api/v1/courses?limit=100', {
            headers: { Authorization: `Bearer ${token}` }
        });

        if (response.data && response.data.data) {
            setCourses(response.data.data);
        }
    } catch (error) {
        console.error("Failed to fetch courses list:", error);
    }
  };

  const fetchResources = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : localStorage.getItem('token');

      const response = await axios.get(`http://localhost:5000/api/v1/resources/all?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data && response.data.data) {
        setResources(response.data.data);
        setHasMore(response.data.data.length === limit);
      }
    } catch (error) {
      console.error("Failed to fetch resources:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchAllCourses(); 
  }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const auth = getAuth();
    const user = auth.currentUser;
    const token = user ? await user.getIdToken() : localStorage.getItem('token');
    const selectedCourse = courses.find(c => c.id === parseInt(formData.courseId));

    try {
      if (editMode) {
        const editPayload = {
            ...formData,
            courseId: parseInt(formData.courseId) 
        };
        
        delete editPayload.courseCode; 

        await axios.patch(`http://localhost:5000/api/v1/resources/${currentId}`, editPayload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert("Resource Updated Successfully!");

      } else {
        const addPayload = {
            ...formData,
            courseCode: selectedCourse ? selectedCourse.courseCode : '', 
        };
        
        delete addPayload.courseId;

        await axios.post('http://localhost:5000/api/v1/resources', addPayload, {
            headers: { Authorization: `Bearer ${token}` }
        });
        alert("Resource Created Successfully!");
      }
      
      closeModal();
      fetchResources();
    } catch (error) {
      console.error("Operation failed:", error);
      alert(error.response?.data?.message || "Operation failed");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : localStorage.getItem('token');

      await axios.delete(`http://localhost:5000/api/v1/resources/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchResources();
    } catch (error) {
      console.error("Delete failed:", error);
      alert("Failed to delete resource");
    }
  };

  const openEditModal = (resource) => {
    setEditMode(true);
    setCurrentId(resource.id);
    setFormData({
      title: resource.title,
      description: resource.description,
      filePath: resource.filePath,
      resourceType: resource.resourceType,
      courseId: resource.courseId || resource.course?.id || '', 
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditMode(false);
    setFormData(initialFormState);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <FileText className="text-amber-500" /> Manage Resources
          </h1>
          <p className="text-gray-500 text-sm mt-1">Add, update, and remove academic materials.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Resource
        </button>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading && resources.length === 0 ? (
           <div className="flex items-center justify-center h-64">
             <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Link</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resources.map((res) => (
                  <tr key={res.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{res.title}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">{res.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${res.resourceType === 'PYQ' ? 'bg-purple-100 text-purple-800' : 
                          res.resourceType === 'NOTES' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {res.resourceType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {res.course?.courseCode || res.courseCode || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                        {res.fileURL && (
                            <a href={res.fileURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:underline">
                                View <ExternalLink size={14}/>
                            </a>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEditModal(res)} className="text-blue-600 hover:text-blue-900 mr-4">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(res.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-md bg-white disabled:opacity-50 text-sm"
            >
                Previous
            </button>
            <span className="text-sm text-gray-600">Page {page}</span>
            <button 
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore}
                className="px-4 py-2 border rounded-md bg-white disabled:opacity-50 text-sm"
            >
                Next
            </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                {editMode ? 'Edit Resource' : 'Add New Resource'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input 
                  type="text" 
                  name="title" 
                  required
                  value={formData.title} 
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Course</label>
                <select
                  name="courseId" 
                  required
                  value={formData.courseId} 
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Select a Course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.courseCode} - {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                    <select 
                      name="resourceType" 
                      value={formData.resourceType} 
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="NOTES">Notes</option>
                      <option value="PYQ">PYQ</option>
                      <option value="BOOK">Book</option>
                      <option value="SLIDES">Slides</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">File Path (GCS)</label>
                    <input 
                      type="text" 
                      name="filePath" 
                      required
                      value={formData.filePath} 
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="folder/filename.pdf"
                    />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  name="description" 
                  rows="3"
                  value={formData.description} 
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm"
                >
                  {editMode ? 'Update Resource' : 'Create Resource'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default ManageResources;