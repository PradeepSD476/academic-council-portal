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
} from "lucide-react"; // Import your GCS utility
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
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const initialFormState = {
    title: "",
    description: "",
    filePath: "",
    resourceType: "LECTURE_SLIDE",
    courseId: "",
  };
  const [formData, setFormData] = useState(initialFormState);


  // --- Data Fetching ---
  const fetchAllCourses = async () => {
    try {

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/v1/courses?limit=500`,
        {
          withCredentials: true
        }
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
        `${import.meta.env.VITE_API_URL
        }/api/v1/resources/all?page=${page}&limit=${limit}`,
        {
          withCredentials: true
        }
      );

      if (response.data && response.data.data) {
        toast.success("Resources Fetched.")
        setResources(response.data.data);
        setHasMore(response.data.data.length === limit);
      }
    } catch (error) {
      toast.error("failed to fetch resources.")
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

      let finalFilePath = formData.filePath;

      if (selectedFile) {
        const uploadResult = await getFilePath({
          file: selectedFile,
          folder: "resources",
        });
        if (uploadResult?.filePath) {
          finalFilePath = uploadResult.filePath;
        } else {
          toast.error("failed to upload")
          throw new Error("File upload to GCS failed.");
        }
      }

      // 2. Prepare API Payload
      const selectedCourse = courses.find(
        (c) => c.id === parseInt(formData.courseId)
      );

      if (editMode) {
        const editPayload = {
          ...formData,
          filePath: finalFilePath,
          courseId: parseInt(formData.courseId),
        };
        // Clean payload for backend consistency
        delete editPayload.courseCode;

        await axios.patch(
          `${import.meta.env.VITE_API_URL}/api/v1/resources/${currentId}`,
          editPayload,
          {
            withCredentials: true
          }
        );
        toast.success("Resource Updated Successfully!");
      } else {
        const addPayload = {
          ...formData,
          filePath: finalFilePath,
          courseCode: selectedCourse ? selectedCourse.courseCode : "",
          notifyUsers: notifyUsers
        };
        // Prisma uses courseId or courseCode; adjust based on your controller logic
        delete addPayload.courseId;

        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/v1/resources`,
          addPayload,
          {
            withCredentials: true
          }
        );
        toast.success("Resource Created Successfully!");
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
        `${import.meta.env.VITE_API_URL}/api/v1/resources/${id}`,
        {
          withCredentials: true
        }
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
    setSelectedFile(null);
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
          <p className="text-gray-500 text-sm mt-1">
            Add, update, and remove academic materials.
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Resource
        </button>
      </div>

      {/* --- Table Section --- */}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Title
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Course
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Link
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {resources.map((res) => (
                  <tr
                    key={res.id}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {res.title}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-xs">
                        {res.description}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${res.resourceType === "PYQ"
                            ? "bg-purple-100 text-purple-800"
                            : res.resourceType === "NOTES"
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                      >
                        {res.resourceType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {res.course?.courseCode || res.courseCode || "N/A"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600">
                      {res.fileURL && (
                        <a
                          href={res.fileURL}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 hover:underline"
                        >
                          View <ExternalLink size={14} />
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => openEditModal(res)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(res.id)}
                        className="text-red-600 hover:text-red-900"
                      >
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
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-4 py-2 border rounded-md bg-white disabled:opacity-50 text-sm"
          >
            Previous
          </button>
          <span className="text-sm text-gray-600">Page {page}</span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={!hasMore}
            className="px-4 py-2 border rounded-md bg-white disabled:opacity-50 text-sm"
          >
            Next
          </button>
        </div>
      </div>

      {/* --- Modal Section --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="px-6 py-4 bg-gray-50 border-b flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-800">
                {editMode ? "Edit Resource" : "Add New Resource"}
              </h3>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Title
                </label>
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
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course
                </label>
                <select
                  name="courseId"
                  required
                  value={formData.courseId}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                >
                  <option value="">Select a Course</option>
                  {courses.map((course) => (
                    <option key={course.id} value={course.id}>
                      {course.courseCode} - {course.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type
                  </label>
                  <select
                    name="resourceType"
                    value={formData.resourceType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="LECTURE_SLIDE">Lecture Slides</option>
                    <option value="NOTES">Handwritten Notes</option>
                    <option value="PYQ">Previous Year Questions</option>
                    <option value="TUTORIAL">Tutorial Sheets</option>
                    <option value="ASSIGNMENT">Assignments</option>
                    <option value="BOOK">Reference Books</option>
                    <option value="LAB_MANUAL">Lab Manual</option>
                    <option value="LAB_ASSIGNMENT">Lab Assignments</option>
                    <option value="PROJECT">Project Guidelines</option>
                    <option value="SYLLABUS">Course Syllabus</option>
                    <option value="QUESTION_BANK">Question Bank</option>
                    <option value="REFERENCE_MATERIAL">Reference Material</option>
                    <option value="PRESENTATION">Presentations</option>
                    <option value="VIDEO_LECTURE">Video Lectures</option>
                    <option value="SOFTWARE">Software / Tools</option>
                    <option value="DATASET">Datasets</option>
                    <option value="READING_MATERIAL">Reading Material</option>
                    <option value="CASE_STUDY">Case Studies</option>
                    <option value="EXAM_NOTICE">Exam Notices</option>
                    <option value="TIME_TABLE">Time Table</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Upload File
                  </label>
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
                    {editMode && !selectedFile && (
                      <p className="text-[10px] text-gray-400 mt-1 truncate">
                        Current: {formData.filePath.split("/").pop()}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  rows="3"
                  value={formData.description}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                />
              </div>

              {!editMode && (
                <div className="flex align-items-center">
                  <input
                    type="checkbox"
                    id="notifyUsers"
                    checked={notifyUsers}
                    onChange={(e) => setNotifyUsers(e.target.checked)}
                  />
                  <label htmlFor="notifyUsers" className="ml-2">
                    Notify Students
                  </label>
                </div>
              )}

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
                      {editMode ? "Update Resource" : "Create Resource"}
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
