import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Megaphone, Plus, Edit2, Trash2, X, Loader2, ExternalLink, User, UploadCloud } from 'lucide-react';
import { getFilePath } from '../../lib/getFilePath'; // Import your GCS utility
import toast from 'react-hot-toast';

const ANNOUNCEMENT_TYPE_OPTIONS = [
  "GENERAL",
  "ACADEMICS",
  "FEST",
  "PLACEMENTS",
  "RESEARCH",
  "CAREER",
];

const ManageAnnouncement = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [hasMore, setHasMore] = useState(true);

  // Modal and Upload states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const initialFormState = {
    title: '',
    description: '',
    type: 'GENERAL',
    filePath: '',
  };
  const [formData, setFormData] = useState(initialFormState);

  const fetchAnnouncements = async () => {
    setLoading(true);
    try {

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/announcements?page=${page}&limit=${limit}`, {
        withCredentials: true
      });

      if (response.data && response.data.data) {
        toast.success("Announcement Fetched.")
        setAnnouncements(response.data.data);
        setHasMore(response.data.data.length === limit);
      }
    } catch (error) {
      toast.error("Failed to get announcements.")
      console.error("Failed to fetch announcements:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnnouncements();
  }, [page]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);
    
    try {
      let finalFilePath = formData.filePath;

      // 1. Handle File Upload to GCS if a new file is selected
      if (selectedFile) {
        const uploadResult = await getFilePath({ 
          file: selectedFile, 
          folder: 'announcements' 
        });
        
        if (uploadResult?.filePath) {
          finalFilePath = uploadResult.filePath;
        } else {
          throw new Error("File upload to GCS failed.");
        }
      }

      // 2. Prepare API Payload
      const apiPayload = {
          title: formData.title,
          description: formData.description,
          type: formData.type,
          filePath: finalFilePath
      };

      if (editMode) {
        await axios.patch(`${import.meta.env.VITE_API_URL}/api/v1/announcements/${currentId}`, apiPayload, {
            withCredentials: true
        });
        toast.success("Announcement Updated Successfully!");
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/announcements`, apiPayload, {
            withCredentials: true
        });
        toast.success("Announcement Created Successfully!");
      }
      
      closeModal();
      fetchAnnouncements(); 
    } catch (error) {
      console.error("Operation failed:", error);
      toast.error("Operation failed.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {

      await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/announcements/${id}`, {
        withCredentials: true
      });
      toast.success("Announcement Deleted.")
      
      fetchAnnouncements(); 
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete.");
    }
  };

  const openEditModal = (announcement) => {
    setEditMode(true);
    setCurrentId(announcement.id);
    setFormData({
      title: announcement.title,
      description: announcement.description,
      type: announcement.type || 'GENERAL',
      filePath: announcement.filePath || '',
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditMode(false);
    setCurrentId(null);
    setFormData(initialFormState);
    setSelectedFile(null);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Megaphone className="text-rose-500" /> Manage Announcements
          </h1>
          <p className="text-gray-500 text-sm mt-1">Broadcast updates and news to students.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> New Announcement
        </button>
      </div>

      {/* Announcements Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        
        {loading && announcements.length === 0 ? (
           <div className="flex items-center justify-center h-64">
             <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title & Description</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Posted By</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Attachment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {announcements.map((item) => (
                  <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">{item.title}</div>
                      <div className="text-xs text-gray-500 truncate max-w-xs mt-1">{item.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 border border-blue-100">
                        {item.type || "GENERAL"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center text-sm text-gray-600">
                            <User size={14} className="mr-1.5 text-gray-400" />
                            {item.uploadedBy?.displayName || "Admin"}
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                        {item.fileURL && item.filePath ? (
                            <a href={item.fileURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-600 hover:underline">
                                View File <ExternalLink size={14}/>
                            </a>
                        ) : (
                            <span className="text-gray-400 text-xs">No Attachment</span>
                        )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                        {new Date(item.updatedAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openEditModal(item)} className="text-blue-600 hover:text-blue-900 mr-4">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(item.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!loading && announcements.length === 0 && (
             <div className="p-8 text-center text-gray-500">No announcements found.</div>
        )}
        
        {/* Pagination Footer */}
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
            <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded-md bg-white disabled:opacity-50 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
                Previous
            </button>
            <span className="text-sm text-gray-600">Page <span className="font-semibold text-gray-900">{page}</span></span>
            <button 
                onClick={() => setPage(p => p + 1)}
                disabled={!hasMore}
                className="px-4 py-2 border rounded-md bg-white disabled:opacity-50 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
                Next
            </button>
        </div>
      </div>

      {/* --- ADD/EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            
            <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                {editMode ? 'Edit Announcement' : 'New Announcement'}
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
                  placeholder="e.g., Exam Schedule Released"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea 
                  name="description" 
                  required
                  rows="4"
                  value={formData.description} 
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                  placeholder="Enter the full details here..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                >
                  {ANNOUNCEMENT_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload Section */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Attachment</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="block w-full text-xs text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-xs file:font-semibold
                      file:bg-blue-50 file:text-blue-700
                      hover:file:bg-blue-100 cursor-pointer"
                  />
                  {editMode && !selectedFile && formData.filePath && (
                    <p className="text-[10px] text-gray-400 mt-1 truncate">Current: {formData.filePath.split('/').pop()}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm disabled:opacity-50 flex items-center gap-2"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading...
                    </>
                  ) : (
                    <>
                      <UploadCloud size={16} />
                      {editMode ? 'Update' : 'Post Announcement'}
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageAnnouncement;