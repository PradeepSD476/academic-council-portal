import React, { useContext, useEffect, useState } from "react";
import {
  BookOpen,
  ChevronRight,
  ChevronLeft,
  List,
  CheckCircle2,
  Clock,
  Sparkles,
  Layers,
  ArrowRight,
  ArrowLeft,
  Plus,
  Compass,
} from "lucide-react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import AuthContext from "../../context/auth/authContext";
import { roadmapApi } from "../../api/roadmapApi";
import toast from "react-hot-toast";

export default function LevelUp() {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const { roadmapSlug, chapterSlug } = useParams();

  const isAdminInAdminMode =
    (user?.role === "SUPER_ADMIN" ||
      user?.role === "FACULTY" ||
      user?.role === "ANNOUNCEMENT_ADMIN" ||
      user?.role === "RESOURCE_ADMIN" ||
      user?.role === "CAREER_ADMIN" ||
      user?.role === "FINANCE_ADMIN") &&
    location.pathname.startsWith("/admin");

  const [roadmaps, setRoadmaps] = useState([]);
  const [activeRoadmap, setActiveRoadmap] = useState(null);
  const [activeChapter, setActiveChapter] = useState(null);
  const [completedChapterIds, setCompletedChapterIds] = useState([]);
  const [showDrawer, setShowDrawer] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRoadmapData();
  }, [roadmapSlug, chapterSlug]);

  const loadRoadmapData = async () => {
    setLoading(true);
    try {
      const res = await roadmapApi.getAllRoadmaps();
      if (res?.success && res.data.length > 0) {
        setRoadmaps(res.data);

        // Find active roadmap
        let currentRoadmap = res.data.find((r) => r.slug === roadmapSlug) || res.data[0];
        setActiveRoadmap(currentRoadmap);

        // Find all chapters flattened
        const allChapters = currentRoadmap.sections?.flatMap((s) => s.chapters) || [];

        // Find active chapter
        let currentChapter = allChapters.find((c) => c.slug === chapterSlug) || allChapters[0];
        if (currentChapter) {
          // Fetch complete chapter details with content
          const chapRes = await roadmapApi.getChapter(currentChapter.id);
          if (chapRes?.success) {
            setActiveChapter(chapRes.data);
          } else {
            setActiveChapter(currentChapter);
          }
        }
      }
    } catch (err) {
      toast.error("Failed to load roadmaps.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectChapter = (chap) => {
    setShowDrawer(false);
    if (activeRoadmap) {
      navigate(`/dashboard/level-up/${activeRoadmap.slug}/${chap.slug}`);
    }
  };

  const toggleChapterComplete = (chapId) => {
    setCompletedChapterIds((prev) =>
      prev.includes(chapId)
        ? prev.filter((id) => id !== chapId)
        : [...prev, chapId]
    );
  };

  // Find all chapters in flat list for next/prev navigation
  const flatChapters = activeRoadmap?.sections?.flatMap((s) => s.chapters) || [];
  const currentChapterIndex = flatChapters.findIndex((c) => c.id === activeChapter?.id);
  const prevChapter = currentChapterIndex > 0 ? flatChapters[currentChapterIndex - 1] : null;
  const nextChapter =
    currentChapterIndex >= 0 && currentChapterIndex < flatChapters.length - 1
      ? flatChapters[currentChapterIndex + 1]
      : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
            SKILL & ROADMAPS
          </span>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-950 tracking-tight flex items-center gap-2">
            <span>Level Up</span>
          </h1>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Interactive chapter-by-chapter learning path for ACC IIT Patna.
          </p>
        </div>

        {/* Top-Right Admin Action Button */}
        {isAdminInAdminMode && (
          <button
            onClick={() => navigate("/admin/level-up")}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer self-start sm:self-auto"
          >
            <Plus size={16} />
            <span>+ Create / Manage Roadmap</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="p-16 text-center text-slate-400 font-semibold text-sm">
          Loading roadmap chapters...
        </div>
      ) : !activeRoadmap ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <p className="text-sm text-slate-500 font-semibold">No roadmaps available yet.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Next.js Learn Style Navigation Header Bar */}
          <div className="bg-slate-900 text-white rounded-2xl p-3.5 sm:p-4 shadow-md border border-slate-800 flex items-center justify-between gap-3 relative">
            <div className="flex items-center gap-3 min-w-0">
              {/* Drawer Button */}
              <button
                onClick={() => setShowDrawer(!showDrawer)}
                className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition cursor-pointer shrink-0"
                title="Toggle Sections & Chapters Menu"
              >
                <List size={18} />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  <span className="text-rose-400 font-bold truncate">
                    {activeRoadmap.title}
                  </span>
                  <span>•</span>
                  <span className="truncate">
                    {activeChapter?.section?.title || "Overview"}
                  </span>
                </div>

                <h3 className="text-xs sm:text-sm font-bold text-white truncate leading-snug">
                  {activeChapter?.title || "Select a Chapter"}
                </h3>
              </div>
            </div>

            {/* Save Progress Indicator */}
            {activeChapter && (
              <button
                onClick={() => toggleChapterComplete(activeChapter.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                  completedChapterIds.includes(activeChapter.id)
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-slate-800 text-slate-300 border border-slate-700 hover:bg-slate-700"
                }`}
              >
                <CheckCircle2 size={14} />
                <span className="hidden sm:inline">
                  {completedChapterIds.includes(activeChapter.id)
                    ? "Completed"
                    : "Mark Complete"}
                </span>
              </button>
            )}
          </div>

          {/* Interactive Section & Chapter Drawer Dropdown */}
          {showDrawer && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-2xl space-y-5 text-white animate-in fade-in slide-in-from-top-3 duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Compass size={14} className="text-rose-400" />
                  <span>Roadmap Explorer</span>
                </h4>
                <button
                  onClick={() => setShowDrawer(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Close ✕
                </button>
              </div>

              {/* Track Selector Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {roadmaps.map((rm) => (
                  <button
                    key={rm.id}
                    onClick={() => {
                      setActiveRoadmap(rm);
                      const firstChap = rm.sections?.[0]?.chapters?.[0];
                      if (firstChap) handleSelectChapter(firstChap);
                    }}
                    className={`p-3 rounded-xl border text-left transition cursor-pointer ${
                      activeRoadmap?.id === rm.id
                        ? "bg-rose-600 text-white border-rose-500 shadow-sm"
                        : "bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-800"
                    }`}
                  >
                    <div className="text-[9px] uppercase font-extrabold opacity-80">
                      {rm.domain} Track
                    </div>
                    <div className="text-xs font-bold truncate">{rm.title}</div>
                  </button>
                ))}
              </div>

              {/* Sections & Chapters Grid */}
              <div className="space-y-4 pt-2">
                {activeRoadmap?.sections?.map((sec, secIdx) => (
                  <div key={sec.id} className="space-y-2">
                    <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
                      Section {secIdx + 1}: {sec.title}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {sec.chapters?.map((chap, chIdx) => {
                        const isSelected = activeChapter?.id === chap.id;
                        const isDone = completedChapterIds.includes(chap.id);
                        return (
                          <button
                            key={chap.id}
                            onClick={() => handleSelectChapter(chap)}
                            className={`p-3 rounded-xl border text-left transition flex items-center gap-3 cursor-pointer ${
                              isSelected
                                ? "bg-white text-slate-900 border-white font-bold shadow-md"
                                : isDone
                                ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/50"
                                : "bg-slate-800/50 text-slate-300 border-slate-800 hover:bg-slate-800"
                            }`}
                          >
                            <span
                              className={`w-6 h-6 rounded-full text-xs font-bold flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "bg-rose-600 text-white"
                                  : isDone
                                  ? "bg-emerald-500 text-slate-950"
                                  : "bg-slate-700 text-slate-300"
                              }`}
                            >
                              {chIdx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs truncate font-semibold">
                                {chap.title}
                              </p>
                              <span className="text-[10px] opacity-70">
                                {chap.duration || "10 mins"}
                              </span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Clean Documentation Style Article Reader Area */}
          {activeChapter ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-10 shadow-2xs space-y-8">
              {/* Chapter Meta */}
              <div className="border-b border-slate-100 pb-6 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-rose-600 uppercase tracking-wider">
                  <span>
                    Chapter {currentChapterIndex >= 0 ? currentChapterIndex + 1 : 1}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-400">
                    <Clock size={13} />
                    <span>{activeChapter.duration || "10 mins read"}</span>
                  </span>
                </div>

                <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                  {activeChapter.title}
                </h1>
              </div>

              {/* Chapter HTML / Markdown Article Content */}
              <div
                className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed space-y-4"
                dangerouslySetInnerHTML={{
                  __html: activeChapter.content || "<p>No content in this chapter yet.</p>",
                }}
              />

              {/* Bottom Next / Prev Navigation */}
              <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                {prevChapter ? (
                  <button
                    onClick={() => handleSelectChapter(prevChapter)}
                    className="flex items-center gap-2 p-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 transition cursor-pointer w-full sm:w-auto"
                  >
                    <ArrowLeft size={16} className="text-rose-600" />
                    <div className="text-left">
                      <span className="text-[10px] text-slate-400 uppercase block">
                        Previous Chapter
                      </span>
                      <span>{prevChapter.title}</span>
                    </div>
                  </button>
                ) : (
                  <div />
                )}

                {nextChapter ? (
                  <button
                    onClick={() => handleSelectChapter(nextChapter)}
                    className="flex items-center justify-end gap-2 p-3 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold transition cursor-pointer w-full sm:w-auto shadow-xs"
                  >
                    <div className="text-right">
                      <span className="text-[10px] text-rose-200 uppercase block">
                        Next Chapter
                      </span>
                      <span>{nextChapter.title}</span>
                    </div>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <div />
                )}
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
              <p className="text-slate-500 text-xs">No chapter selected.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
