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

      const response = await axios.get(`${import.meta.env.VITE_API_URL}/v1/announcements?page=${page}&limit=${limit}`, {
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
        await axios.patch(`${import.meta.env.VITE_API_URL}/v1/announcements/${currentId}`, apiPayload, {
            withCredentials: true
        });
        toast.success("Announcement Updated Successfully!");
      } else {
        await axios.post(`${import.meta.env.VITE_API_URL}/v1/announcements`, apiPayload, {
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

      await axios.delete(`${import.meta.env.VITE_API_URL}/v1/announcements/${id}`, {
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-[3px] h-6 bg-[var(--color-secondary)] rounded-full shadow-[0_0_8px_var(--color-secondary)]" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-primary)] tracking-tight flex items-center gap-2.5">
              <Megaphone className="text-[var(--color-secondary)]" size={24} /> Manage Announcements
            </h1>
          </div>
          <p className="text-slate-500 text-sm ml-4">Broadcast updates, circulars, and official notices to students.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[var(--color-secondary)] hover:opacity-90 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-[0_8px_20px_var(--color-secondary-glow)] cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> New Announcement
        </button>
      </div>

      {/* Announcements Table */}
      <div className="bg-white/95 backdrop-blur-xl shadow-xs rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {loading && announcements.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-[var(--color-secondary)] w-8 h-8" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-800">
              <thead className="bg-white/90">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Title &amp; Notice</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Type</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Posted By</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Attachment</th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70">
                {announcements.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-[var(--color-primary)] leading-snug">{item.title}</div>
                      <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5">{item.description}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex items-center rounded-full bg-white/5 border border-white/10 px-2.5 py-0.5 text-xs font-bold text-slate-600 uppercase tracking-wider">
                        {item.type || "GENERAL"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center text-xs font-semibold text-slate-600">
                        <User size={13} className="mr-1.5 text-slate-500" />
                        {item.uploadedBy?.displayName || "Admin"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {item.fileURL && item.filePath ? (
                        <a href={item.fileURL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[var(--color-secondary)] hover:text-[#ff7438] font-bold text-xs hover:underline">
                          View File <ExternalLink size={13}/>
                        </a>
                      ) : (
                        <span className="text-slate-500 text-xs">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 font-medium">
                      {new Date(item.updatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(item)}
                          className="p-1.5 text-slate-500 hover:text-[var(--color-primary)] bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                          title="Edit Announcement"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(item.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 bg-white/5 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Delete Announcement"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!loading && announcements.length === 0 && (
          <div className="p-16 text-center text-slate-500 text-sm">No announcements found.</div>
        )}
        
        {/* Pagination Footer */}
        <div className="bg-white/90 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <button 
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-600 hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition font-semibold cursor-pointer"
          >
            Previous
          </button>
          <span>Page <span className="font-bold text-[var(--color-primary)]">{page}</span></span>
          <button 
            onClick={() => setPage(p => p + 1)}
            disabled={!hasMore}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-600 hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition font-semibold cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>

      {/* --- ADD/EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4">
          <div className="bg-white/95 backdrop-blur-xl shadow-xs border border-slate-200 rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden text-[var(--color-primary)]">
            <div className="px-6 py-4 bg-white/95 backdrop-blur-xl shadow-xs border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-lg font-bold text-[var(--color-primary)]">
                {editMode ? 'Edit Announcement' : 'New Announcement'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-full hover:bg-white/10 text-slate-500 hover:text-white transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Title *</label>
                <input 
                  type="text" 
                  name="title" 
                  required
                  value={formData.title} 
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200 bg-white/90 rounded-xl text-[var(--color-primary)] placeholder-slate-400 focus:border-[var(--color-secondary)] focus:outline-none text-sm transition"
                  placeholder="e.g. End Semester Exam Schedule Released"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Description *</label>
                <textarea 
                  name="description" 
                  required
                  rows="4"
                  value={formData.description} 
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200 bg-white/90 rounded-xl text-[var(--color-primary)] placeholder-slate-400 focus:border-[var(--color-secondary)] focus:outline-none text-sm transition resize-none"
                  placeholder="Enter the full announcement details and instructions here..."
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Category Type</label>
                <select
                  name="type"
                  value={formData.type}
                  onChange={handleChange}
                  className="w-full px-3.5 py-2.5 border border-slate-200 bg-white/90 rounded-xl text-[var(--color-primary)] focus:border-[var(--color-secondary)] focus:outline-none text-sm transition cursor-pointer"
                >
                  {ANNOUNCEMENT_TYPE_OPTIONS.map((option) => (
                    <option key={option} value={option} className="bg-sky-100 text-[var(--color-primary)]">
                      {option}
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload Section */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">Attachment / PDF</label>
                <div className="relative group">
                  <input 
                    type="file" 
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    className="block w-full text-xs text-slate-500
                      file:mr-3 file:py-2 file:px-3
                      file:rounded-xl file:border-0
                      file:text-xs file:font-bold
                      file:bg-[var(--color-secondary)]/15 file:text-[var(--color-secondary)]
                      hover:file:bg-[var(--color-secondary)]/25 cursor-pointer bg-white/90 border border-slate-200 rounded-xl p-1"
                  />
                  {editMode && !selectedFile && formData.filePath && (
                    <p className="text-[10px] text-slate-500 mt-1 truncate">Current: {formData.filePath.split('/').pop()}</p>
                  )}
                </div>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
                <button 
                  type="button" 
                  onClick={closeModal}
                  disabled={isUploading}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-white/5 transition cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isUploading}
                  className="px-5 py-2 text-xs font-bold text-[var(--color-primary)] bg-[var(--color-secondary)] hover:opacity-90 rounded-xl shadow-xs disabled:opacity-50 flex items-center gap-2 transition cursor-pointer"
                >
                  {isUploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <UploadCloud size={15} />
                      <span>{editMode ? 'Update Notice' : 'Post Announcement'}</span>
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