import React, { useEffect, useState } from "react";
import {
  BookOpen,
  Plus,
  Trash2,
  Edit,
  FolderPlus,
  FilePlus,
  Layers,
  ChevronRight,
  Sparkles,
  ArrowLeft,
} from "lucide-react";
import { roadmapApi } from "../../api/roadmapApi";
import RoadmapEditor from "../../components/RoadmapEditor";
import toast from "react-hot-toast";

export default function ManageRoadmap() {
  const [roadmaps, setRoadmaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRoadmap, setSelectedRoadmap] = useState(null);

  // Modals / Editor States
  const [showRoadmapModal, setShowRoadmapModal] = useState(false);
  const [newRoadmapTitle, setNewRoadmapTitle] = useState("");
  const [newRoadmapDesc, setNewRoadmapDesc] = useState("");
  const [newRoadmapDomain, setNewRoadmapDomain] = useState("CS");

  const [showSectionModal, setShowSectionModal] = useState(false);
  const [sectionTitle, setSectionTitle] = useState("");

  const [activeEditingChapter, setActiveEditingChapter] = useState(null); // null if not editing
  const [targetSectionId, setTargetSectionId] = useState(null);
  const [isSavingChapter, setIsSavingChapter] = useState(false);

  useEffect(() => {
    loadRoadmaps();
  }, []);

  const loadRoadmaps = async () => {
    setLoading(true);
    try {
      const res = await roadmapApi.getAllRoadmaps();
      if (res?.success) {
        setRoadmaps(res.data);
        if (res.data.length > 0 && !selectedRoadmap) {
          setSelectedRoadmap(res.data[0]);
        } else if (selectedRoadmap) {
          const updated = res.data.find((r) => r.id === selectedRoadmap.id);
          setSelectedRoadmap(updated || res.data[0]);
        }
      }
    } catch (err) {
      toast.error("Failed to load roadmaps.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRoadmap = async (e) => {
    e.preventDefault();
    if (!newRoadmapTitle.trim()) {
      toast.error("Roadmap title is required.");
      return;
    }
    try {
      const res = await roadmapApi.createRoadmap({
        title: newRoadmapTitle,
        description: newRoadmapDesc,
        domain: newRoadmapDomain,
      });
      if (res?.success) {
        toast.success("Roadmap created!");
        setShowRoadmapModal(false);
        setNewRoadmapTitle("");
        setNewRoadmapDesc("");
        loadRoadmaps();
      }
    } catch (err) {
      toast.error("Failed to create roadmap.");
      console.error(err);
    }
  };

  const handleCreateSection = async (e) => {
    e.preventDefault();
    if (!sectionTitle.trim() || !selectedRoadmap) return;
    try {
      const res = await roadmapApi.createSection({
        roadmapId: selectedRoadmap.id,
        title: sectionTitle,
        order: (selectedRoadmap.sections?.length || 0) + 1,
      });
      if (res?.success) {
        toast.success("Section added!");
        setShowSectionModal(false);
        setSectionTitle("");
        loadRoadmaps();
      }
    } catch (err) {
      toast.error("Failed to add section.");
      console.error(err);
    }
  };

  const handleDeleteRoadmap = async (id) => {
    if (!window.confirm("Are you sure you want to delete this roadmap track and all its chapters?")) return;
    try {
      await roadmapApi.deleteRoadmap(id);
      toast.success("Roadmap deleted.");
      setSelectedRoadmap(null);
      loadRoadmaps();
    } catch (err) {
      toast.error("Failed to delete roadmap.");
      console.error(err);
    }
  };

  const handleDeleteSection = async (id) => {
    if (!window.confirm("Delete section and all included chapters?")) return;
    try {
      await roadmapApi.deleteSection(id);
      toast.success("Section deleted.");
      loadRoadmaps();
    } catch (err) {
      toast.error("Failed to delete section.");
      console.error(err);
    }
  };

  const handleDeleteChapter = async (id) => {
    if (!window.confirm("Delete this chapter?")) return;
    try {
      await roadmapApi.deleteChapter(id);
      toast.success("Chapter deleted.");
      loadRoadmaps();
    } catch (err) {
      toast.error("Failed to delete chapter.");
      console.error(err);
    }
  };

  const handleSaveChapter = async ({ title, content, duration }) => {
    setIsSavingChapter(true);
    try {
      if (activeEditingChapter?.id) {
        // Update existing chapter
        await roadmapApi.updateChapter(activeEditingChapter.id, {
          title,
          content,
          duration,
        });
        toast.success("Chapter updated!");
      } else {
        // Create new chapter in targetSectionId
        await roadmapApi.createChapter({
          sectionId: targetSectionId,
          title,
          content,
          duration,
        });
        toast.success("Chapter created!");
      }
      setActiveEditingChapter(null);
      setTargetSectionId(null);
      loadRoadmaps();
    } catch (err) {
      toast.error("Failed to save chapter.");
      console.error(err);
    } finally {
      setIsSavingChapter(false);
    }
  };

  if (activeEditingChapter !== null || targetSectionId !== null) {
    return (
      <RoadmapEditor
        initialTitle={activeEditingChapter?.title || ""}
        initialContent={activeEditingChapter?.content || ""}
        initialDuration={activeEditingChapter?.duration || "10 mins"}
        onSave={handleSaveChapter}
        onCancel={() => {
          setActiveEditingChapter(null);
          setTargetSectionId(null);
        }}
        isSaving={isSavingChapter}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
            ADMINISTRATIVE MANAGEMENT
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2.5">
            <BookOpen className="text-rose-600" size={28} />
            <span>Manage Level Up Roadmaps</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Create, structure, and publish interactive learning roadmaps, sections, and chapters.
          </p>
        </div>

        <button
          onClick={() => setShowRoadmapModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>+ Create New Roadmap</span>
        </button>
      </div>

      {/* Main Grid */}
      {loading ? (
        <div className="p-16 text-center text-slate-400 font-semibold text-sm">
          Loading roadmaps...
        </div>
      ) : roadmaps.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 mx-auto flex items-center justify-center">
            <BookOpen size={24} />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Roadmaps Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Get started by creating your first roadmap track for ACC IIT Patna.
          </p>
          <button
            onClick={() => setShowRoadmapModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-lg cursor-pointer"
          >
            <Plus size={14} />
            <span>Create Roadmap</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sidebar Roadmap Selector */}
          <div className="lg:col-span-4 space-y-3">
            <h3 className="text-xs font-bold text-slate-700 uppercase tracking-wider px-1">
              Select Roadmap Track ({roadmaps.length})
            </h3>
            <div className="space-y-2">
              {roadmaps.map((r) => (
                <div
                  key={r.id}
                  onClick={() => setSelectedRoadmap(r)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex items-center justify-between ${
                    selectedRoadmap?.id === r.id
                      ? "bg-slate-900 text-white border-slate-900 shadow-md"
                      : "bg-white text-slate-800 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  <div className="space-y-1 pr-2">
                    <span
                      className={`text-[9px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                        selectedRoadmap?.id === r.id
                          ? "bg-slate-800 text-rose-400 border-slate-700"
                          : "bg-rose-50 text-rose-700 border-rose-100"
                      }`}
                    >
                      {r.domain || "CS"}
                    </span>
                    <h4 className="text-sm font-bold truncate">{r.title}</h4>
                    <p
                      className={`text-xs line-clamp-1 ${
                        selectedRoadmap?.id === r.id
                          ? "text-slate-400"
                          : "text-slate-500"
                      }`}
                    >
                      {r.sections?.length || 0} Sections • {r.description || "No description"}
                    </p>
                  </div>
                  <ChevronRight
                    size={18}
                    className={
                      selectedRoadmap?.id === r.id
                        ? "text-rose-400"
                        : "text-slate-400"
                    }
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Roadmap Details & Sections Panel */}
          {selectedRoadmap && (
            <div className="lg:col-span-8 space-y-4">
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4 shadow-2xs">
                <div className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <span className="text-[10px] font-extrabold text-rose-600 bg-rose-50 border border-rose-100 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                      {selectedRoadmap.domain}
                    </span>
                    <h2 className="text-xl font-bold text-slate-900 mt-1">
                      {selectedRoadmap.title}
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                      {selectedRoadmap.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setShowSectionModal(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 font-bold text-xs rounded-lg transition cursor-pointer"
                    >
                      <FolderPlus size={14} />
                      <span>+ Add Section</span>
                    </button>
                    <button
                      onClick={() => handleDeleteRoadmap(selectedRoadmap.id)}
                      className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                      title="Delete Roadmap"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Sections & Chapters List */}
                <div className="space-y-4 pt-2">
                  {selectedRoadmap.sections?.length === 0 ? (
                    <div className="p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
                      <p className="text-xs text-slate-500 font-semibold mb-2">
                        No sections created in this roadmap yet.
                      </p>
                      <button
                        onClick={() => setShowSectionModal(true)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-rose-600 text-white font-bold text-xs rounded-md cursor-pointer"
                      >
                        <FolderPlus size={13} />
                        <span>Add First Section</span>
                      </button>
                    </div>
                  ) : (
                    selectedRoadmap.sections?.map((sec, secIdx) => (
                      <div
                        key={sec.id}
                        className="bg-slate-50/80 rounded-xl border border-slate-200 overflow-hidden"
                      >
                        {/* Section Header */}
                        <div className="flex items-center justify-between px-4 py-3 bg-slate-100/70 border-b border-slate-200">
                          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                            <span className="w-5 h-5 rounded-md bg-slate-800 text-white text-[10px] flex items-center justify-center font-bold">
                              {secIdx + 1}
                            </span>
                            <span>{sec.title}</span>
                          </h3>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setTargetSectionId(sec.id);
                                setActiveEditingChapter({}); // blank new chapter
                              }}
                              className="inline-flex items-center gap-1 px-2.5 py-1 bg-white border border-slate-200 text-slate-700 text-xs font-bold rounded-md hover:bg-slate-50 transition cursor-pointer shadow-2xs"
                            >
                              <FilePlus size={13} className="text-rose-600" />
                              <span>+ Chapter</span>
                            </button>
                            <button
                              onClick={() => handleDeleteSection(sec.id)}
                              className="text-slate-400 hover:text-rose-600 transition"
                              title="Delete Section"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>

                        {/* Chapters inside Section */}
                        <div className="divide-y divide-slate-100 bg-white">
                          {sec.chapters?.length === 0 ? (
                            <p className="p-4 text-xs text-slate-400 italic text-center">
                              No chapters in this section. Click "+ Chapter" to add content.
                            </p>
                          ) : (
                            sec.chapters?.map((chap, chIdx) => (
                              <div
                                key={chap.id}
                                className="flex items-center justify-between px-4 py-3 hover:bg-slate-50 transition"
                              >
                                <div className="flex items-center gap-3">
                                  <span className="w-6 h-6 rounded-full bg-rose-50 text-rose-600 text-xs font-bold flex items-center justify-center border border-rose-100">
                                    {chIdx + 1}
                                  </span>
                                  <div>
                                    <h4 className="text-xs font-bold text-slate-900">
                                      {chap.title}
                                    </h4>
                                    <span className="text-[10px] text-slate-400">
                                      Est. {chap.duration || "10 mins"}
                                    </span>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => {
                                      setActiveEditingChapter(chap);
                                      setTargetSectionId(sec.id);
                                    }}
                                    className="p-1.5 text-slate-600 hover:text-slate-950 hover:bg-slate-100 rounded-md transition"
                                    title="Edit Chapter Content"
                                  >
                                    <Edit size={14} />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteChapter(chap.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition"
                                    title="Delete Chapter"
                                  >
                                    <Trash2 size={14} />
                                  </button>
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal: Create Roadmap */}
      {showRoadmapModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateRoadmap}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100"
          >
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <BookOpen size={18} className="text-rose-600" />
              <span>Create New Roadmap Track</span>
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Roadmap Title
                </label>
                <input
                  type="text"
                  required
                  value={newRoadmapTitle}
                  onChange={(e) => setNewRoadmapTitle(e.target.value)}
                  placeholder="e.g. Competitive Programming Pathway"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Domain / Track
                </label>
                <input
                  type="text"
                  value={newRoadmapDomain}
                  onChange={(e) => setNewRoadmapDomain(e.target.value)}
                  placeholder="e.g. CS, AI, Placement"
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                  Description
                </label>
                <textarea
                  rows={3}
                  value={newRoadmapDesc}
                  onChange={(e) => setNewRoadmapDesc(e.target.value)}
                  placeholder="Brief overview of what students will master..."
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowRoadmapModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-xs"
              >
                Create Track
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Modal: Create Section */}
      {showSectionModal && (
        <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs z-[100] flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateSection}
            className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl border border-slate-100"
          >
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <FolderPlus size={18} className="text-rose-600" />
              <span>Add Roadmap Section</span>
            </h3>

            <div>
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block mb-1">
                Section Title
              </label>
              <input
                type="text"
                required
                value={sectionTitle}
                onChange={(e) => setSectionTitle(e.target.value)}
                placeholder="e.g. Section 1: Core Fundamentals"
                className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowSectionModal(false)}
                className="px-4 py-2 text-xs font-semibold bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold bg-rose-600 text-white rounded-lg hover:bg-rose-700 shadow-xs"
              >
                Add Section
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
