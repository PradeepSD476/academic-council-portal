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
  Search,
  Check,
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
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDomainFilter, setSelectedDomainFilter] = useState("ALL");

  useEffect(() => {
    loadRoadmapData();
  }, [roadmapSlug, chapterSlug]);

  const loadRoadmapData = async () => {
    setLoading(true);
    try {
      const res = await roadmapApi.getAllRoadmaps();
      if (res?.success && res.data.length > 0) {
        setRoadmaps(res.data);

        if (roadmapSlug) {
          let currentRoadmap =
            res.data.find((r) => r.slug === roadmapSlug) || res.data[0];
          setActiveRoadmap(currentRoadmap);

          const allChapters =
            currentRoadmap.sections?.flatMap((s) => s.chapters) || [];
          let currentChapter =
            allChapters.find((c) => c.slug === chapterSlug) || allChapters[0];

          if (currentChapter) {
            const chapRes = await roadmapApi.getChapter(currentChapter.id);
            if (chapRes?.success) {
              setActiveChapter(chapRes.data);
            } else {
              setActiveChapter(currentChapter);
            }
          } else {
            setActiveChapter(null);
          }
        } else {
          setActiveRoadmap(null);
          setActiveChapter(null);
        }
      }
    } catch (err) {
      toast.error("Failed to load roadmaps.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectRoadmap = (rm) => {
    const firstChap = rm.sections?.[0]?.chapters?.[0];
    if (firstChap) {
      navigate(`/dashboard/level-up/${rm.slug}/${firstChap.slug}`);
    } else {
      navigate(`/dashboard/level-up/${rm.slug}/overview`);
    }
  };

  const handleSelectChapter = (chap) => {
    setShowMobileSidebar(false);
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
  const flatChapters =
    activeRoadmap?.sections?.flatMap((s) => s.chapters) || [];
  const currentChapterIndex = flatChapters.findIndex(
    (c) => c.id === activeChapter?.id
  );
  const prevChapter =
    currentChapterIndex > 0 ? flatChapters[currentChapterIndex - 1] : null;
  const nextChapter =
    currentChapterIndex >= 0 && currentChapterIndex < flatChapters.length - 1
      ? flatChapters[currentChapterIndex + 1]
      : null;

  // Domain filter lists
  const availableDomains = [
    "ALL",
    ...Array.from(new Set(roadmaps.map((r) => r.domain || "CS"))),
  ];

  const filteredRoadmaps = roadmaps.filter((r) => {
    const matchesDomain =
      selectedDomainFilter === "ALL" ||
      (r.domain || "CS").toUpperCase() === selectedDomainFilter.toUpperCase();
    const matchesSearch =
      r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.description || "").toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDomain && matchesSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* View 1: CARD TYPE LAYOUT (All Roadmaps View) */}
      {!roadmapSlug && (
        <div className="space-y-6 animate-in fade-in duration-300">
          {/* Top Bar with Title, Domain Filter Pills & Search */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-3xl border border-slate-200/90 shadow-2xs">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                <BookOpen size={20} />
              </div>
              <div>
                <h1 className="text-xl font-extrabold text-slate-950 tracking-tight">
                  Level Up Roadmaps
                </h1>
                <p className="text-xs text-slate-500">
                  Interactive chapter-by-chapter learning paths for ACC IIT Patna.
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto">
              {/* Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto scrollbar-none py-1">
                {availableDomains.map((dom) => (
                  <button
                    key={dom}
                    onClick={() => setSelectedDomainFilter(dom)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                      selectedDomainFilter === dom
                        ? "bg-blue-600 text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {dom === "ALL" ? "All Tracks" : `${dom} Track`}
                  </button>
                ))}
              </div>

              {/* Search Input */}
              <div className="relative w-full sm:w-56">
                <Search
                  size={16}
                  className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  type="text"
                  placeholder="Search roadmaps..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-blue-500 focus:bg-white transition"
                />
              </div>

              {isAdminInAdminMode && (
                <button
                  onClick={() => navigate("/admin/level-up")}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition cursor-pointer shrink-0"
                >
                  <Plus size={15} />
                  <span>Manage</span>
                </button>
              )}
            </div>
          </div>

          {/* Card Grid */}
          {loading ? (
            <div className="p-16 text-center text-slate-400 font-semibold text-sm">
              Loading roadmaps...
            </div>
          ) : filteredRoadmaps.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-3">
              <Compass size={36} className="text-slate-300 mx-auto" />
              <p className="text-sm font-bold text-slate-700">
                No roadmaps match your search.
              </p>
              <p className="text-xs text-slate-400">
                Try selecting a different domain filter or clearing your search.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRoadmaps.map((rm) => {
                const totalChapters =
                  rm.sections?.reduce(
                    (acc, sec) => acc + (sec.chapters?.length || 0),
                    0
                  ) || 0;
                const completedCount =
                  rm.sections
                    ?.flatMap((s) => s.chapters)
                    .filter((c) => completedChapterIds.includes(c.id)).length ||
                  0;
                const progressPct =
                  totalChapters > 0
                    ? Math.round((completedCount / totalChapters) * 100)
                    : 0;

                return (
                  <div
                    key={rm.id}
                    onClick={() => handleSelectRoadmap(rm)}
                    className="group bg-white rounded-3xl border border-slate-200 hover:border-blue-300 p-6 flex flex-col justify-between shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer relative overflow-hidden"
                  >
                    <div className="space-y-4">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between">
                        <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-100">
                          {rm.domain || "CS"} Track
                        </span>
                        <span className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100">
                          <BookOpen size={13} className="text-blue-600" />
                          <span>{totalChapters} Chapters</span>
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div className="space-y-1.5">
                        <h3 className="text-lg font-extrabold text-slate-950 group-hover:text-blue-600 transition leading-snug">
                          {rm.title}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 leading-relaxed">
                          {rm.description ||
                            "Explore structured sections and chapters to level up your domain knowledge."}
                        </p>
                      </div>

                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-[11px] text-slate-600 font-semibold">
                        <div className="flex items-center gap-1.5">
                          <Layers size={14} className="text-slate-400" />
                          <span>{rm.sections?.length || 0} Sections</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <Clock size={14} className="text-slate-400" />
                          <span>Est. {totalChapters * 10} mins</span>
                        </div>
                      </div>

                      {/* Completion Progress */}
                      {completedCount > 0 && (
                        <div className="space-y-1 pt-1">
                          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500">
                            <span>Progress</span>
                            <span className="text-blue-600">{progressPct}%</span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-600 rounded-full transition-all"
                              style={{ width: `${progressPct}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Action Button */}
                    <div className="pt-6">
                      <div className="w-full py-2.5 px-4 bg-slate-900 group-hover:bg-blue-600 text-white rounded-2xl text-xs font-bold flex items-center justify-between transition shadow-xs">
                        <span>
                          {completedCount > 0 ? "Continue Learning" : "Explore Roadmap"}
                        </span>
                        <ArrowRight
                          size={15}
                          className="group-hover:translate-x-1 transition-transform"
                        />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* View 2: CHAPTERWISE LAYOUT (Content on Left, Chapters Sidebar on Right) */}
      {roadmapSlug && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Sticky Ceiling Header Bar */}
          <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-md border border-slate-800 flex items-center justify-between gap-3 sticky top-0 z-30">
            <div className="flex items-center gap-3 min-w-0">
              {/* Back to All Roadmaps Button */}
              <button
                onClick={() => navigate("/dashboard/level-up")}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-bold transition cursor-pointer shrink-0"
              >
                <ArrowLeft size={14} />
                <span className="hidden sm:inline">All Roadmaps</span>
              </button>

              {/* Mobile Chapter Tree Drawer Button */}
              <button
                onClick={() => setShowMobileSidebar(!showMobileSidebar)}
                className="lg:hidden p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer shrink-0"
                title="Toggle Chapter Menu"
              >
                <List size={18} />
              </button>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">
                  <span className="text-blue-400 font-bold truncate">
                    {activeRoadmap?.title}
                  </span>
                  <span>/</span>
                  <span className="truncate">
                    {activeChapter?.section?.title || "Overview"}
                  </span>
                </div>
                <h2 className="text-xs sm:text-sm font-bold text-white truncate leading-tight">
                  {activeChapter?.title || "Select a Chapter"}
                </h2>
              </div>
            </div>

            {/* Mark Complete Toggle */}
            {activeChapter && (
              <button
                onClick={() => toggleChapterComplete(activeChapter.id)}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer shrink-0 ${
                  completedChapterIds.includes(activeChapter.id)
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                    : "bg-blue-600 hover:bg-blue-500 text-white shadow-xs"
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

          {/* 2-Column Grid Layout: Main Chapter Content on Left (col-span-8), Chapters Tree on Right (col-span-4) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative">
            {/* Left Column: Documentation Article View */}
            <main className="lg:col-span-8 space-y-6">
              {activeChapter ? (
                <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-10 shadow-2xs space-y-8 min-h-[600px]">
                  {/* Article Title Header */}
                  <div className="border-b border-slate-100 pb-6 space-y-3">
                    <div className="flex items-center gap-2 text-xs font-extrabold text-blue-600 uppercase tracking-wider">
                      <span>
                        Chapter{" "}
                        {currentChapterIndex >= 0
                          ? currentChapterIndex + 1
                          : 1}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-400 font-semibold">
                        <Clock size={13} />
                        <span>{activeChapter.duration || "10 mins read"}</span>
                      </span>
                    </div>

                    <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-950 tracking-tight leading-tight">
                      {activeChapter.title}
                    </h1>
                  </div>

                  {/* Chapter Content Body */}
                  <div
                    className="prose prose-slate max-w-none text-slate-800 text-sm leading-relaxed space-y-4"
                    dangerouslySetInnerHTML={{
                      __html:
                        activeChapter.content ||
                        "<p class='text-slate-400 italic'>No content in this chapter yet.</p>",
                    }}
                  />

                  {/* Next / Previous Chapter Navigation */}
                  <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                    {prevChapter ? (
                      <button
                        onClick={() => handleSelectChapter(prevChapter)}
                        className="flex items-center gap-3 p-3.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-2xl text-xs font-bold text-slate-800 transition cursor-pointer w-full sm:w-auto"
                      >
                        <ArrowLeft size={16} className="text-blue-600" />
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
                        className="flex items-center justify-end gap-3 p-3.5 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl text-xs font-bold transition cursor-pointer w-full sm:w-auto shadow-xs"
                      >
                        <div className="text-right">
                          <span className="text-[10px] text-blue-200 uppercase block">
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
                <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center">
                  <p className="text-slate-500 text-xs">No chapter selected.</p>
                </div>
              )}
            </main>

            {/* Right Sub-Sidebar: Sections & Chapters Tree */}
            <aside
              className={`
                lg:col-span-4 bg-slate-900 text-white rounded-3xl border border-slate-800 p-5 shadow-xl space-y-5
                lg:sticky lg:top-20 max-h-[calc(100vh-140px)] overflow-y-auto scrollbar-thin
                ${
                  showMobileSidebar
                    ? "block fixed inset-x-4 top-24 z-40 max-h-[75vh]"
                    : "hidden lg:block"
                }
              `}
            >
              <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
                <div>
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-blue-400 block">
                    {activeRoadmap?.domain || "CS"} TRACK
                  </span>
                  <h3 className="text-sm font-extrabold text-white truncate">
                    {activeRoadmap?.title}
                  </h3>
                </div>
                {showMobileSidebar && (
                  <button
                    onClick={() => setShowMobileSidebar(false)}
                    className="text-xs text-slate-400 hover:text-white"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Sections & Chapters List */}
              <div className="space-y-5">
                {activeRoadmap?.sections?.map((sec, secIdx) => (
                  <div key={sec.id} className="space-y-2">
                    <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider px-1">
                      SECTION {secIdx + 1}: {sec.title}
                    </h4>

                    <div className="space-y-1">
                      {sec.chapters?.map((chap, chIdx) => {
                        const isSelected = activeChapter?.id === chap.id;
                        const isDone = completedChapterIds.includes(chap.id);
                        return (
                          <button
                            key={chap.id}
                            onClick={() => handleSelectChapter(chap)}
                            className={`w-full p-2.5 rounded-xl border text-left transition flex items-center gap-2.5 cursor-pointer ${
                              isSelected
                                ? "bg-blue-600 text-white border-blue-500 font-bold shadow-md"
                                : isDone
                                ? "bg-emerald-950/40 text-emerald-300 border-emerald-800/40 hover:bg-emerald-900/40"
                                : "bg-slate-800/40 text-slate-300 border-slate-800 hover:bg-slate-800 hover:text-white"
                            }`}
                          >
                            <span
                              className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shrink-0 ${
                                isSelected
                                  ? "bg-white text-blue-600"
                                  : isDone
                                  ? "bg-emerald-500 text-slate-950"
                                  : "bg-slate-700 text-slate-300"
                              }`}
                            >
                              {isDone ? <Check size={12} /> : chIdx + 1}
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs truncate font-medium">
                                {chap.title}
                              </p>
                              <span className="text-[9px] opacity-70 block">
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
            </aside>
          </div>
        </div>
      )}
    </div>
  );
}

