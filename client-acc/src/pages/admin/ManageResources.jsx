import React, { useEffect, useState } from "react";
import axios from "axios";
import { getFilePath } from "../../lib/getFilePath.js";
import {
  FileText,
  Plus,
  Edit2,
  Trash2,
  X,
  Loader2,
  ExternalLink,
  UploadCloud,
} from "lucide-react";
import toast from "react-hot-toast";

const ManageResources = () => {
  const [resources, setResources] = useState([]);
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const limit = 10;
  const [hasMore, setHasMore] = useState(true);
  const [notifyUsers, setNotifyUsers] = useState(true);

  // Modal and Upload states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [currentId, setCurrentId] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);

  const initialFormState = {
    title: "",
    description: "",
    filePath: "",
    resourceType: "LECTURE_SLIDE",
    courseId: "",
  };
  const [formData, setFormData] = useState(initialFormState);

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

  // --- Data Fetching ---
  const fetchAllCourses = async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/v1/courses?limit=500`,
        { withCredentials: true }
      );
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
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/v1/resources/all?page=${page}&limit=${limit}`,
        { withCredentials: true }
      );
      if (response.data && response.data.data) {
        setResources(response.data.data);
        setHasMore(response.data.data.length === limit);
      }
    } catch (error) {
      toast.error("Failed to fetch resources.");
      console.error("Failed to fetch resources:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchResources();
    fetchAllCourses();
  }, [page]);

  // --- Handlers ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      const selectedCourse = courses.find(
        (c) => c.id === parseInt(formData.courseId)
      );
      const courseCode = selectedCourse ? selectedCourse.courseCode : "";

      if (editMode) {
        let finalFilePath = formData.filePath;
        if (selectedFiles.length > 0) {
          const uploadResult = await getFilePath({
            file: selectedFiles[0],
            folder: "resources",
          });
          if (uploadResult?.filePath) {
            finalFilePath = uploadResult.filePath;
          } else {
            toast.error("Failed to upload file");
            throw new Error("File upload failed.");
          }
        }

        const editPayload = {
          ...formData,
          filePath: finalFilePath,
          courseId: parseInt(formData.courseId),
        };
        delete editPayload.courseCode;

        await axios.patch(
          `${import.meta.env.VITE_API_URL}/v1/resources/${currentId}`,
          editPayload,
          { withCredentials: true }
        );
        toast.success("Resource Updated Successfully!");
      } else {
        if (selectedFiles.length === 0 && !formData.filePath) {
          toast.error("Please select a file to upload");
          throw new Error("No file selected");
        }

        const filesToUpload = selectedFiles.length > 0 ? selectedFiles : [null];
        let successCount = 0;

        for (const file of filesToUpload) {
          let finalFilePath = formData.filePath;
          if (file) {
            const uploadResult = await getFilePath({
              file: file,
              folder: "resources",
            });
            if (uploadResult?.filePath) {
              finalFilePath = uploadResult.filePath;
            } else {
              toast.error(`Failed to upload ${file.name}`);
              continue;
            }
          }

          // Use the file name as the title if multiple files are selected or title is empty
          const generatedTitle = file ? file.name.replace(/\.[^/.]+$/, "") : "Resource";
          const finalTitle = selectedFiles.length > 1 || !formData.title ? generatedTitle : formData.title;

          const addPayload = {
            ...formData,
            title: finalTitle,
            filePath: finalFilePath,
            courseCode: courseCode,
            notifyUsers: notifyUsers,
          };
          delete addPayload.courseId;

          await axios.post(
            `${import.meta.env.VITE_API_URL}/v1/resources`,
            addPayload,
            { withCredentials: true }
          );
          successCount++;
        }

        if (successCount > 0) {
          toast.success(`${successCount} Resource(s) Created Successfully!`);
        }
      }

      closeModal();
      fetchResources();
    } catch (error) {
      console.error("Operation failed:", error);
      toast.error("Operation failed");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/v1/resources/${id}`,
        { withCredentials: true }
      );
      fetchResources();
    } catch (error) {
      console.error("Delete failed:", error);
      toast.error("Failed to delete resource");
    }
  };

  const openEditModal = (resource) => {
    setEditMode(true);
    setCurrentId(resource.id);
    setFormData({
      title: resource.title,
      description: resource.description || "",
      filePath: resource.filePath,
      resourceType: resource.resourceType,
      courseId: resource.courseId || resource.course?.id || "",
    });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditMode(false);
    setFormData(initialFormState);
    setSelectedFiles([]);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const getTypeBadge = (type) => {
    switch (type) {
      case "PYQ":
        return "bg-purple-950/60 text-purple-300 border-purple-800/60";
      case "NOTES":
        return "bg-emerald-950/60 text-emerald-300 border-emerald-800/60";
      case "LECTURE_SLIDE":
        return "bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] border-[var(--color-secondary)]/20";
      case "TUTORIAL":
      case "ASSIGNMENT":
        return "bg-blue-950/60 text-blue-300 border-blue-800/60";
      default:
        return "bg-white/5 text-slate-600 border-white/10";
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-[3px] h-6 bg-[var(--color-secondary)] rounded-full shadow-[0_0_8px_var(--color-secondary)]" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-primary)] tracking-tight flex items-center gap-2.5">
              <FileText className="text-[var(--color-secondary)]" size={24} /> Manage Resources
            </h1>
          </div>
          <p className="text-slate-500 text-sm ml-4">
            Upload, update, and manage academic resources and course materials.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center gap-2 bg-[var(--color-secondary)] hover:opacity-90 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-[0_8px_20px_var(--color-secondary-glow)] cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} /> Add Resource
        </button>
      </div>

      {/* --- Table Section --- */}
      <div className="bg-white/95 backdrop-blur-xl shadow-xs rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {loading && resources.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-[var(--color-secondary)] w-8 h-8" />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-800">
              <thead className="bg-white/90">
                <tr>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Title &amp; Info
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">
                    File Link
                  </th>
                  <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/70">
                {resources.map((res) => (
                  <tr key={res.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-[var(--color-primary)] leading-snug">
                        {res.title}
                      </div>
                      <div className="text-xs text-slate-500 truncate max-w-xs mt-0.5">
                        {res.description || "No description provided"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2.5 py-0.5 inline-flex text-xs font-bold border rounded-full uppercase tracking-wider ${getTypeBadge(res.resourceType)}`}
                      >
                        {res.resourceType?.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className="px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full bg-white/5 border border-white/10 text-slate-600">
                        {res.course?.courseCode || res.courseCode || "General"}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {res.fileURL ? (
                        <a
                          href={res.fileURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[var(--color-secondary)] hover:text-[#ff7438] font-bold text-xs hover:underline"
                        >
                          View File <ExternalLink size={13} />
                        </a>
                      ) : (
                        <span className="text-xs text-slate-500">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEditModal(res)}
                          className="p-1.5 text-slate-500 hover:text-[var(--color-primary)] bg-white/5 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                          title="Edit Resource"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(res.id)}
                          className="p-1.5 text-slate-500 hover:text-red-400 bg-white/5 hover:bg-red-950/30 rounded-lg transition-colors cursor-pointer"
                          title="Delete Resource"
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

        {!loading && resources.length === 0 && (
          <div className="p-16 text-center text-slate-500 text-sm">
            No resources found.
          </div>
        )}

        <div className="bg-white/90 px-6 py-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-600 hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition font-semibold cursor-pointer"
          >
            Previous
          </button>
          <span>Page <span className="font-bold text-[var(--color-primary)]">{page}</span></span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-600 hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition font-semibold cursor-pointer"
          >
            Next
          </button>
        </div>
      </div>

      {/* --- Modal Section --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-3 sm:p-6 overflow-hidden" onClick={closeModal}>
          <div className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl sm:rounded-3xl shadow-2xl w-full max-w-lg h-[88vh] max-h-[750px] flex flex-col overflow-hidden text-[var(--color-primary)] my-auto" onClick={(e) => e.stopPropagation()}>
            <div className="px-4 sm:px-6 py-3.5 sm:py-4 bg-white/95 backdrop-blur-xl border-b border-slate-200 flex justify-between items-center shrink-0">
              <h3 className="text-base sm:text-lg font-bold text-[var(--color-primary)]">
                {editMode ? "Edit Resource" : "Add New Resource"}
              </h3>
              <button
                type="button"
                onClick={closeModal}
                className="p-1.5 rounded-full hover:bg-slate-100 text-slate-500 hover:text-[var(--color-primary)] transition-colors cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden min-h-0">
              <div className="p-4 sm:p-6 space-y-4 flex-1 overflow-y-auto min-h-0 scrollbar-thin">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Title *
                  </label>
                  <input
                    type="text"
                    name="title"
                    required={editMode || selectedFiles.length <= 1}
                    disabled={!editMode && selectedFiles.length > 1}
                    value={formData.title}
                    onChange={handleChange}
                    placeholder={!editMode && selectedFiles.length > 1 ? "Auto-generated from file names" : "e.g. Endsem 2024 PYQ with Solutions"}
                    className="w-full px-3.5 py-2.5 border border-slate-200 bg-white/90 rounded-xl text-[var(--color-primary)] placeholder-slate-400 focus:border-[var(--color-secondary)] focus:outline-none text-sm transition disabled:opacity-50 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Associated Course *
                  </label>
                  <select
                    name="courseId"
                    required
                    value={formData.courseId}
                    onChange={handleChange}
                    className="w-full px-3.5 py-2.5 border border-slate-200 bg-white/90 rounded-xl text-[var(--color-primary)] focus:border-[var(--color-secondary)] focus:outline-none text-sm transition cursor-pointer"
                  >
                    <option value="" className="bg-sky-100 text-slate-500">Select a Course</option>
                    {courses.map((course) => (
                      <option key={course.id} value={course.id} className="bg-sky-100 text-[var(--color-primary)]">
                        {course.courseCode} - {course.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Resource Type
                    </label>
                    <select
                      name="resourceType"
                      value={formData.resourceType}
                      onChange={handleChange}
                      className="w-full px-3.5 py-2.5 border border-slate-200 bg-white/90 rounded-xl text-[var(--color-primary)] focus:border-[var(--color-secondary)] focus:outline-none text-sm transition cursor-pointer"
                    >
                      <option value="LECTURE_SLIDE" className="bg-sky-100 text-[var(--color-primary)]">Lecture Slides</option>
                      <option value="NOTES" className="bg-sky-100 text-[var(--color-primary)]">Handwritten Notes</option>
                      <option value="PYQ" className="bg-sky-100 text-[var(--color-primary)]">Previous Year Questions</option>
                      <option value="TUTORIAL" className="bg-sky-100 text-[var(--color-primary)]">Tutorial Sheets</option>
                      <option value="ASSIGNMENT" className="bg-sky-100 text-[var(--color-primary)]">Assignments</option>
                      <option value="BOOK" className="bg-sky-100 text-[var(--color-primary)]">Reference Books</option>
                      <option value="LAB_MANUAL" className="bg-sky-100 text-[var(--color-primary)]">Lab Manual</option>
                      <option value="LAB_ASSIGNMENT" className="bg-sky-100 text-[var(--color-primary)]">Lab Assignments</option>
                      <option value="PROJECT" className="bg-sky-100 text-[var(--color-primary)]">Project Guidelines</option>
                      <option value="SYLLABUS" className="bg-sky-100 text-[var(--color-primary)]">Course Syllabus</option>
                      <option value="QUESTION_BANK" className="bg-sky-100 text-[var(--color-primary)]">Question Bank</option>
                      <option value="REFERENCE_MATERIAL" className="bg-sky-100 text-[var(--color-primary)]">Reference Material</option>
                      <option value="PRESENTATION" className="bg-sky-100 text-[var(--color-primary)]">Presentations</option>
                      <option value="VIDEO_LECTURE" className="bg-sky-100 text-[var(--color-primary)]">Video Lectures</option>
                      <option value="SOFTWARE" className="bg-sky-100 text-[var(--color-primary)]">Software / Tools</option>
                      <option value="DATASET" className="bg-sky-100 text-[var(--color-primary)]">Datasets</option>
                      <option value="READING_MATERIAL" className="bg-sky-100 text-[var(--color-primary)]">Reading Material</option>
                      <option value="CASE_STUDY" className="bg-sky-100 text-[var(--color-primary)]">Case Studies</option>
                      <option value="EXAM_NOTICE" className="bg-sky-100 text-[var(--color-primary)]">Exam Notices</option>
                      <option value="TIME_TABLE" className="bg-sky-100 text-[var(--color-primary)]">Time Table</option>
                      <option value="OTHER" className="bg-sky-100 text-[var(--color-primary)]">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                      Upload File
                    </label>
                    <input
                      type="file"
                      multiple={!editMode}
                      onChange={(e) => setSelectedFiles(Array.from(e.target.files))}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-[var(--color-secondary)]/15 file:text-[var(--color-secondary)] hover:file:bg-[var(--color-secondary)]/25 cursor-pointer"
                    />
                    {selectedFiles.length > 0 && (
                      <div className="mt-2 flex flex-col gap-1 max-h-24 overflow-y-auto">
                        {selectedFiles.map((f, i) => (
                           <p key={i} className="text-[10px] text-slate-500 truncate">
                             Selected: {f.name}
                           </p>
                        ))}
                      </div>
                    )}
                    {editMode && selectedFiles.length === 0 && formData.filePath && (
                      <p className="text-[10px] text-slate-500 mt-1 truncate">
                        Current: {formData.filePath.split("/").pop()}
                      </p>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                    Description
                  </label>
                  <textarea
                    name="description"
                    rows="3"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Additional notes, semester, instructor details..."
                    className="w-full px-3.5 py-2.5 border border-slate-200 bg-white/90 rounded-xl text-[var(--color-primary)] placeholder-slate-400 focus:border-[var(--color-secondary)] focus:outline-none text-sm transition resize-none"
                  />
                </div>

                {!editMode && (
                  <div className="flex items-center gap-2.5 bg-white/90 border border-slate-200 p-3 rounded-xl">
                    <input
                      type="checkbox"
                      id="notifyUsers"
                      checked={notifyUsers}
                      onChange={(e) => setNotifyUsers(e.target.checked)}
                      className="w-4 h-4 rounded accent-[var(--color-secondary)] cursor-pointer"
                    />
                    <label htmlFor="notifyUsers" className="text-xs text-slate-600 font-semibold cursor-pointer">
                      Notify enrolled students via in-app alert
                    </label>
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-slate-200 flex justify-end gap-3 bg-white/95 backdrop-blur-md shrink-0">
                <button
                  type="button"
                  onClick={closeModal}
                  disabled={isUploading}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-slate-50 transition cursor-pointer"
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
                      <span>{editMode ? "Update Resource" : "Create Resource"}</span>
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

export default ManageResources;
