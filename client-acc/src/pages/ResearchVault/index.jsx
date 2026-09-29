import { createElement, useContext, useEffect, useId, useMemo, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Activity, Bookmark, BookOpen, BookSearch, BriefcaseBusiness, Check, CheckCircle2, ChevronDown, CircleHelp, ExternalLink, Filter, FlaskConical, MessageCircle, Plus, Search, Send, ThumbsUp, UserRoundCheck, UserRoundPlus, UsersRound, X, Clock, Download, Eye, FileText, Lock } from 'lucide-react';
import toast from 'react-hot-toast';
import AuthContext from '../../context/auth/authContext';
import { researchVaultApi } from '../../api/researchVaultApi';
import { getInitials } from '../../lib/utils';

const TABS_WITH_ACTIONS = ['experiences', 'discussions', 'resources'];

// Single source of truth for tab icons - same icon used for both active and inactive states
const TAB_CONFIG = {
  faculty: { id: 'faculty', label: 'Faculty', icon: FlaskConical, actionLabel: null },
  experiences: { id: 'experiences', label: 'Experiences', icon: BookOpen, actionLabel: 'Share an experience' },
  discussions: { id: 'discussions', label: 'Discussion', icon: CircleHelp, actionLabel: 'Ask a question' },
  resources: { id: 'resources', label: 'Resources', icon: Bookmark, actionLabel: 'Submit Resource' },
  positions: { id: 'positions', label: 'Open positions', icon: BriefcaseBusiness, actionLabel: null },
  following: { id: 'following', label: 'Following', icon: Activity, actionLabel: null },
};

const sections = Object.values(TAB_CONFIG);

const responseData = (response) => response.data?.data || [];
const errorMessage = (error) => error.response?.data?.message || 'The request could not be completed.';

// Module-level helper functions for resource type display
const formatResourceType = (type) => {
  if (!type) return 'Resource';
  return type.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
};

const getResourceTypeIcon = (type) => {
  switch (type) {
    case 'GUIDE': return <BookOpen size={12} />;
    case 'SOP_WRITING': return <FileText size={12} />;
    case 'COLD_EMAILING': return <Send size={12} />;
    case 'PHD_APPLICATIONS': return <BriefcaseBusiness size={12} />;
    case 'GRANT_WRITING': return <FileText size={12} />;
    default: return <Bookmark size={12} />;
  }
};

// Open Positions: single source of truth for position-type labels so the filter
// options and the card badges always spell the type the same way.
const POSITION_TYPE_LABELS = {
  RA: 'Research Assistant',
  RA_SHIP: 'Research Assistantship',
  INTERNSHIP: 'Internship',
  PROJECT: 'Project',
  FELLOWSHIP: 'Fellowship',
  SUMMER: 'Summer Research',
  SUMMER_RESEARCH: 'Summer Research',
  THESIS: 'Thesis Slot',
  READING_PROJECT: 'Reading Project',
  PHD: 'PhD Position',
  OTHER: 'Other',
};

const positionTypeLabel = (type) => {
  if (!type) return '';
  return POSITION_TYPE_LABELS[type] || type.replaceAll('_', ' ');
};

// A position is "open" when it is active and its deadline has not passed.
// Used for the client-side Show-closed filter so toggling is instant (no refetch).
const isOpenPosition = (position) => {
  if (position.isActive === false) return false;
  if (!position.deadline) return true;
  return new Date(position.deadline).getTime() >= Date.now();
};

const POSITION_TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'RA', label: 'Research Assistant' },
  { value: 'INTERNSHIP', label: 'Internship' },
  { value: 'PROJECT', label: 'Project' },
  { value: 'FELLOWSHIP', label: 'Fellowship' },
];

const POSITION_SORT_OPTIONS = [
  { value: 'deadline', label: 'Deadline (soonest)' },
  { value: 'newest', label: 'Newest' },
  { value: 'department', label: 'Department (A-Z)' },
];

// Custom dropdown used across the Open Positions filter row. Renders a pill
// trigger with the options panel positioned below it (absolute, z-30), so it
// never overlaps the page header the way a native <select> popup can.
// Set `searchable` to add a type-ahead input at the top of the panel.
function FilterDropdown({
  value,
  onChange,
  options,
  ariaLabel,
  placeholder = 'Select…',
  searchable = false,
  searchPlaceholder = 'Search…',
  emptyMessage = 'No matches.',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlightIndex, setHighlightIndex] = useState(0);
  const containerRef = useRef(null);
  const triggerRef = useRef(null);
  const searchInputRef = useRef(null);
  const panelRef = useRef(null);
  const listboxId = useId();

  useEffect(() => {
    if (!open) return undefined;
    const handlePointerDown = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) setOpen(false);
    };
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [open]);

  useEffect(() => {
    if (open && searchable && searchInputRef.current) searchInputRef.current.focus();
  }, [open, searchable]);

  const selected = options.find((option) => String(option.value) === String(value));
  const visible = searchable
    ? options.filter((option) => option.label.toLowerCase().includes(query.trim().toLowerCase()))
    : options;

  // Keyboard support: ArrowUp/ArrowDown move the highlight through the options
  // in visual order; Enter/Space select the highlighted option. The highlight
  // starts at index 0, so Enter always selects the visually first item until
  // the user actually arrows somewhere else.
  const moveHighlight = (delta) => {
    setHighlightIndex((prev) => {
      if (visible.length === 0) return 0;
      return (prev + delta + visible.length) % visible.length;
    });
  };
  const selectHighlighted = () => {
    const option = visible[highlightIndex];
    if (!option) return;
    onChange(option.value);
    setOpen(false);
  };

  useEffect(() => {
    setHighlightIndex(0);
  }, [open, query]);

  useEffect(() => {
    if (!open) return;
    panelRef.current?.querySelector('[data-active="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [highlightIndex, open]);

  const handleContainerKeyDown = (event) => {
    if (event.key === 'Escape') {
      setOpen(false);
      triggerRef.current?.focus();
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) { setOpen(true); return; }
      moveHighlight(event.key === 'ArrowDown' ? 1 : -1);
      return;
    }
    if (event.key === 'Enter') {
      if (!open) return; // let the button's default click open the panel
      event.preventDefault();
      selectHighlighted();
      return;
    }
    if (event.key === ' ' && open && event.target.tagName !== 'INPUT') {
      event.preventDefault();
      selectHighlighted();
    }
  };

  return (
    <div ref={containerRef} className="relative" onKeyDown={handleContainerKeyDown}>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        onClick={() => { setOpen((prev) => !prev); setQuery(''); }}
        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-4 py-2.5 text-xs font-semibold text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)]"
      >
        {selected ? selected.label : placeholder}
        <ChevronDown size={13} className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          ref={panelRef}
          role="listbox"
          id={listboxId}
          aria-activedescendant={visible[highlightIndex] ? `${listboxId}-opt-${highlightIndex}` : undefined}
          className="absolute left-0 top-full z-30 mt-2 max-h-64 w-56 overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl"
        >
          {searchable && (
            <div className="sticky top-0 bg-white p-1">
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)]"
              />
            </div>
          )}
          {visible.length === 0 && <p className="px-3 py-2 text-xs text-slate-500">{emptyMessage}</p>}
          {visible.map((option, index) => {
            const isSelected = String(option.value) === String(value);
            const isHighlighted = index === highlightIndex;
            return (
              <button
                key={option.value || '__all__'}
                id={`${listboxId}-opt-${index}`}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={isSelected}
                data-active={isHighlighted ? 'true' : undefined}
                onClick={() => { onChange(option.value); setOpen(false); }}
                className={`flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-xs ${isHighlighted ? 'bg-blue-100 text-[var(--color-primary-accent)]' : 'text-slate-700 hover:bg-blue-50 hover:text-[var(--color-primary-accent)]'} ${isSelected ? 'font-semibold' : ''}`}
              >
                <span className="truncate">{option.label}</span>
                {isSelected && <Check size={13} className="shrink-0" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

const getResourceTypeBadgeClass = (type) => {
  const base = 'inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border';
  switch (type) {
    case 'GUIDE': return `${base} bg-emerald-50 text-emerald-800 border-emerald-200`;
    case 'SOP_WRITING': return `${base} bg-blue-50 text-blue-800 border-blue-200`;
    case 'COLD_EMAILING': return `${base} bg-purple-50 text-purple-800 border-purple-200`;
    case 'PHD_APPLICATIONS': return `${base} bg-amber-50 text-amber-800 border-amber-200`;
    case 'GRANT_WRITING': return `${base} bg-rose-50 text-rose-800 border-rose-200`;
    default: return `${base} bg-slate-50 text-slate-700 border-slate-200`;
  }
};

export default function ResearchVault() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialSection = searchParams.get('section');
  const validSections = ['faculty', 'experiences', 'discussions', 'resources', 'positions', 'following'];
  const { user } = useContext(AuthContext);
  const [section, setSection] = useState(validSections.includes(initialSection) ? initialSection : 'faculty');
  const [areas, setAreas] = useState([]);
  const [items, setItems] = useState([]);
  const [facultyOptions, setFacultyOptions] = useState([]);
  const [followedFacultyIds, setFollowedFacultyIds] = useState(() => new Set());
  const [followedAreaIds, setFollowedAreaIds] = useState(() => new Set());
  const [pendingUnfollow, setPendingUnfollow] = useState(null);
  const [search, setSearch] = useState('');
  const [discussionStatus, setDiscussionStatus] = useState('all');
  const [department, setDepartment] = useState('');
  const [areaId, setAreaId] = useState('');
  const [areaSearch, setAreaSearch] = useState('');
  const [areaPickerOpen, setAreaPickerOpen] = useState(false);
  const areaPickerRef = useRef(null);
  const [followingAreaId, setFollowingAreaId] = useState('');
  const [followingAreaSearch, setFollowingAreaSearch] = useState('');
  const [followingAreaPickerOpen, setFollowingAreaPickerOpen] = useState(false);
  const followingAreaPickerRef = useRef(null);
  const [activeFacultyFilters, setActiveFacultyFilters] = useState([]);
  const [activeAreaFilters, setActiveAreaFilters] = useState([]);
  const [openingsOnly, setOpeningsOnly] = useState(false);
  const [refreshVersion, setRefreshVersion] = useState(0);
  const [loading, setLoading] = useState(true);
  const [interest, setInterest] = useState({ department: '', subArea: '', projectType: '' });
  const [matches, setMatches] = useState([]);
  const [matchSearched, setMatchSearched] = useState(false);
  const [matching, setMatching] = useState(false);
  const [formOpen, setFormOpen] = useState(false);

  // ── Resources tab state ───────────────────────────────────────────────────
  const [resourceFormOpen, setResourceFormOpen] = useState(false);
  const [resourceForm, setResourceForm] = useState({
    title: '', description: '', url: '', category: 'GUIDE',
    researchAreaIds: [], customArea: '', consent_confirmed: false
  });
  const [submittingResource, setSubmittingResource] = useState(false);
  const [resourceSubmitSuccess, setResourceSubmitSuccess] = useState(false);
  const [resourceSubmitWarnings, setResourceSubmitWarnings] = useState([]);
  // Resource filters/sort (separate from the main section search)
  const [resourceCategory, setResourceCategory] = useState('');
  const [resourceFormat, setResourceFormat] = useState('');
  const [resourceSort, setResourceSort] = useState('newest');
  const [resourcePage, setResourcePage] = useState(1);
  // Open Positions filters/sort + bookmark state
  const [positionAreaId, setPositionAreaId] = useState('');
  const [positionType, setPositionType] = useState('');
  const [positionSort, setPositionSort] = useState('deadline');
  const [positionShowClosed, setPositionShowClosed] = useState(false);
  const [bookmarkedPositionIds, setBookmarkedPositionIds] = useState(() => new Set());
  const [resourceTotal, setResourceTotal] = useState(0);
  const RESOURCE_PAGE_SIZE = 12;

  // Area options for the Open Positions filter (searchable custom dropdown).
  const positionAreaOptions = useMemo(() => ([
    { value: '', label: 'All research areas' },
    ...areas.map((area) => ({ value: String(area.id), label: area.name })),
  ]), [areas]);

  // "Show closed positions" is a pure client-side filter over the already
  // loaded list: toggling it costs no network request and cannot flash.
  const filteredPositions = useMemo(() => (
    positionShowClosed ? items : items.filter(isOpenPosition)
  ), [items, positionShowClosed]);
  // My Submissions
  const [showMySubmissions, setShowMySubmissions] = useState(false);
  const [myResources, setMyResources] = useState([]);
  const [myResourcesLoading, setMyResourcesLoading] = useState(false);
  const [withdrawConfirm, setWithdrawConfirm] = useState(null); // { id, title }
  const [editingResource, setEditingResource] = useState(null); // resource object to edit
  const [editForm, setEditForm] = useState({ title: '', description: '', url: '', category: '', researchAreaIds: [], customArea: '' });
  const [savingEdit, setSavingEdit] = useState(false);

  // ── Resource fetch (triggered by resource-specific filters too) ────────────
  // When section changes away from resources, reset resource filters
  useEffect(() => {
    if (section !== 'resources') {
      setResourceCategory('');
      setResourceFormat('');
      setResourceSort('newest');
      setResourcePage(1);
    }
  }, [section]);

  useEffect(() => {
    researchVaultApi.getAreas().then((response) => setAreas(responseData(response))).catch(() => {});
    researchVaultApi.getFaculty({ limit: 100 }).then((response) => setFacultyOptions(responseData(response))).catch(() => {});
    researchVaultApi.getFollows().then(({ data }) => {
      setFollowedFacultyIds(new Set(data.data?.facultyIds || []));
      setFollowedAreaIds(new Set(data.data?.areaIds || []));
    }).catch((error) => toast.error(errorMessage(error)));
    researchVaultApi.getPositionBookmarks().then(({ data }) => {
      setBookmarkedPositionIds(new Set(data.data?.positionIds || []));
    }).catch(() => {});
  }, []);

  // Compute relevant areas for Following section: followed areas + areas of followed faculty
  const followingRelevantAreas = useMemo(() => {
    if (!areas.length) return [];
    const relevantAreaIds = new Set(followedAreaIds);
    followedFacultyIds.forEach((fid) => {
      const faculty = facultyOptions.find((f) => f.id === fid);
      if (faculty?.researchAreas) {
        faculty.researchAreas.forEach((ra) => relevantAreaIds.add(ra.researchArea.id));
      }
    });
    const filtered = areas.filter((a) => relevantAreaIds.has(a.id));
    return filtered.length ? filtered : areas;
}, [areas, followedFacultyIds, followedAreaIds, facultyOptions]);

  // Compute active filter labels for Following section
  const activeFacultyList = activeFacultyFilters.length > 0
    ? facultyOptions.filter((f) => activeFacultyFilters.includes(f.id))
    : [];
  const activeAreaList = activeAreaFilters.length > 0
    ? areas.filter((a) => activeAreaFilters.includes(a.id))
    : [];

  // Compute filter label for Following section
  useEffect(() => {
    const closeOnOutsidePointer = (event) => {
      if (!areaPickerRef.current?.contains(event.target)) setAreaPickerOpen(false);
      if (!followingAreaPickerRef.current?.contains(event.target)) setFollowingAreaPickerOpen(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, []);

useEffect(() => {
    let active = true;
    setLoading(true);
    const params = { search, ...(areaId ? { areaId } : {}) };
    const request = section === 'faculty'
      ? researchVaultApi.getFaculty({ search, department, area: areas.find((area) => String(area.id) === areaId)?.slug, openings: openingsOnly ? 'true' : undefined })
      : section === 'experiences'
        ? researchVaultApi.getExperiences({ ...params, department })
        : section === 'discussions'
            ? researchVaultApi.getDiscussions({
              ...params,
              ...(discussionStatus === 'needs-reply' ? { unanswered: 'true' } : {}),
              ...(discussionStatus === 'resolved' ? { resolved: 'true' } : {})
            })
            : section === 'resources'
              ? researchVaultApi.getResources({
                  ...params,
                  ...(resourceCategory ? { category: resourceCategory } : {}),
                  ...(resourceFormat ? { format: resourceFormat } : {}),
                  sort: resourceSort,
                  page: resourcePage,
                  limit: RESOURCE_PAGE_SIZE
                })
              : section === 'positions'
                ? researchVaultApi.getPositions({
                    search,
                    department,
                    areaId: positionAreaId || undefined,
                    positionType: positionType || undefined,
                    sort: positionSort,
                    // Always fetch open + closed together: the "Show closed
                    // positions" checkbox then filters client-side, so toggling
                    // it fires no network request and cannot flash the list.
                    includeClosed: 'true'
                  })
                : researchVaultApi.getFollowingUpdates({
                    ...(followingAreaId ? { areaId: followingAreaId } : {}),
                    // Filter logic: OR within same type (multiple facultyIds = any of them), AND across types (facultyIds AND areaIds)
                    ...(activeFacultyFilters.length > 0 ? { facultyIds: activeFacultyFilters.join(',') } : {}),
                    ...(activeAreaFilters.length > 0 ? { areaIds: activeAreaFilters.join(',') } : {}),
                  });
    request.then((response) => {
      const data = responseData(response);
      console.log('[Following] activeFacultyFilters:', activeFacultyFilters, 'activeAreaFilters:', activeAreaFilters, 'items:', data.length, data.map(d => ({ id: d.id, type: d.type, source: d.source })));
      if (active) {
        setItems(data);
        if (section === 'resources') {
          setResourceTotal(response.data?.total || 0);
        }
      }
    }).catch((error) => {
      if (active) toast.error(errorMessage(error));
    }).finally(() => {
      if (active) setLoading(false);
    });
    return () => { active = false; };
  }, [section, search, discussionStatus, department, areaId, areas, openingsOnly, refreshVersion, followingAreaId, activeFacultyFilters, activeAreaFilters, resourceCategory, resourceFormat, resourceSort, resourcePage, positionAreaId, positionType, positionSort]);

  const follow = async (kind, id, name = '') => {
    const numericId = Number(id);
    const isFaculty = kind === 'faculty';
    const followingSet = isFaculty ? followedFacultyIds : followedAreaIds;
    const isFollowing = followingSet.has(numericId);
    if (isFollowing) {
      setPendingUnfollow({ kind, id: numericId, name });
      return;
    }

    try {
      if (isFaculty) {
        await researchVaultApi.followFaculty(numericId);
      } else {
        await researchVaultApi.followArea(numericId);
      }

      const updateFollowed = isFaculty ? setFollowedFacultyIds : setFollowedAreaIds;
      updateFollowed((current) => {
        const next = new Set(current);
        next.add(numericId);
        return next;
      });
      toast.success(`You're now following ${name || 'this research item'}.`);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const confirmUnfollow = async () => {
    if (!pendingUnfollow) return;
    const { kind, id, name } = pendingUnfollow;
    try {
      if (kind === 'faculty') await researchVaultApi.unfollowFaculty(id);
      else await researchVaultApi.unfollowArea(id);
      const updateFollowed = kind === 'faculty' ? setFollowedFacultyIds : setFollowedAreaIds;
      updateFollowed((current) => {
        const next = new Set(current);
        next.delete(id);
        return next;
      });
      toast.success(`Unfollowed ${name || 'research item'}.`);
      setPendingUnfollow(null);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const togglePositionBookmark = async (positionId) => {
    const isBookmarked = bookmarkedPositionIds.has(positionId);
    try {
      if (isBookmarked) {
        await researchVaultApi.unbookmarkPosition(positionId);
        setBookmarkedPositionIds((current) => {
          const next = new Set(current);
          next.delete(positionId);
          return next;
        });
        toast.success('Removed from saved positions.');
      } else {
        await researchVaultApi.bookmarkPosition(positionId);
        setBookmarkedPositionIds((current) => {
          const next = new Set(current);
          next.add(positionId);
          return next;
        });
        toast.success('Position saved — see it under Following.');
      }
      setRefreshVersion((v) => v + 1);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const deadlineInfo = (deadline) => {
    if (!deadline) return null;
    const ms = new Date(deadline).getTime() - Date.now();
    const days = Math.ceil(ms / (24 * 60 * 60 * 1000));
    if (ms < 0) return { key: 'closed', label: 'Deadline passed', cls: 'bg-slate-100 text-slate-500 border-slate-200' };
    if (days <= 7) return { key: 'soon', label: days === 0 ? 'Closes today' : `${days} day${days === 1 ? '' : 's'} left`, cls: days <= 2 ? 'bg-red-50 text-red-700 border-red-200' : 'bg-amber-50 text-amber-700 border-amber-200' };
    return null;
  };

  const findMatches = async (event) => {
    event.preventDefault();
    setMatching(true);
    try {
      setMatches(responseData(await researchVaultApi.matchInterest(interest)));
      setMatchSearched(true);
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setMatching(false);
    }
  };

  const submitContent = async (event) => {
    event.preventDefault();
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    try {
      if (section === 'experiences') {
        await researchVaultApi.submitExperience({ ...data, facultyId: data.facultyId || null, researchAreaIds: data.researchAreaIds ? [Number(data.researchAreaIds)] : [] });
        toast.success('Experience submitted for review.');
      } else {
        await researchVaultApi.submitDiscussion({ ...data, researchAreaIds: data.researchAreaIds ? [Number(data.researchAreaIds)] : [] });
        toast.success('Question posted.');
      }
      setFormOpen(false);
      form.reset();
      setRefreshVersion((version) => version + 1);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const reply = async (discussionId, content) => {
    try {
      await researchVaultApi.replyToDiscussion(discussionId, { content });
      toast.success('Reply added.');
      setRefreshVersion((version) => version + 1);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const acceptAnswer = async (discussionId, replyId) => {
    try {
      await researchVaultApi.acceptDiscussionReply(discussionId, replyId);
      toast.success('Answer accepted. Discussion marked resolved.');
      setRefreshVersion((version) => version + 1);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  const vote = async (discussionId) => {
    try {
      const { data } = await researchVaultApi.voteDiscussion(discussionId);
      setItems((current) => current.map((item) => item.id === discussionId
        ? { ...item, voteCount: data.data.voteCount, hasVoted: data.data.hasVoted }
        : item));
    } catch (error) {
      toast.error(errorMessage(error));
    }
};

  // ── Submit Resource ────────────────────────────────────────────────────────
  const submitResource = async (e) => {
    e.preventDefault();
    setSubmittingResource(true);
    setResourceSubmitWarnings([]);
    try {
      const payload = {
        title: resourceForm.title.trim(),
        description: resourceForm.description.trim() || undefined,
        url: resourceForm.url.trim(),
        category: resourceForm.category,
        researchAreaIds: resourceForm.researchAreaIds,
        customArea: resourceForm.customArea.trim() || undefined,
        consent_confirmed: resourceForm.consent_confirmed
      };
      const response = await researchVaultApi.submitResource(payload);
      setResourceSubmitSuccess(true);
      if (response.data?.warnings?.length) {
        setResourceSubmitWarnings(response.data.warnings);
      }
      setRefreshVersion((v) => v + 1);
      loadMyResources();
    } catch (error) {
      const msg = error.response?.data?.message || 'Submission failed. Please try again.';
      toast.error(msg);
    } finally {
      setSubmittingResource(false);
    }
  };

  const resetResourceForm = () => {
    setResourceForm({ title: '', description: '', url: '', category: 'GUIDE', researchAreaIds: [], customArea: '', consent_confirmed: false });
    setResourceSubmitSuccess(false);
    setResourceSubmitWarnings([]);
    setResourceFormOpen(false);
  };

  // ── My Submissions ─────────────────────────────────────────────────────────
  const loadMyResources = async () => {
    if (!user) return;
    setMyResourcesLoading(true);
    try {
      const response = await researchVaultApi.getMyResources();
      setMyResources(responseData(response));
    } catch {
      // silently fail — user may not be logged in
    } finally {
      setMyResourcesLoading(false);
    }
  };

  useEffect(() => {
    if (section === 'resources' && user) loadMyResources();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [section, user]);

  const withdrawResource = async (id) => {
    try {
      await researchVaultApi.deleteMyResource(id);
      toast.success('Submission withdrawn.');
      setWithdrawConfirm(null);
      loadMyResources();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not withdraw submission.');
    }
  };

  const saveEditResource = async (e) => {
    e.preventDefault();
    if (!editingResource) return;
    setSavingEdit(true);
    try {
      await researchVaultApi.updateMyResource(editingResource.id, {
        title: editForm.title.trim(),
        description: editForm.description.trim() || undefined,
        url: editForm.url.trim(),
        category: editForm.category,
        researchAreaIds: editForm.researchAreaIds,
        customArea: editForm.customArea.trim() || ''
      });
      toast.success('Submission updated.');
      setEditingResource(null);
      loadMyResources();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not update submission.');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="research-vault-theme mx-auto max-w-7xl space-y-6 pb-12 text-slate-900">
      <header>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="mb-2 flex items-center gap-3">
              <div className="accent-bar h-6 rounded-full shadow-[0_0_8px_var(--color-secondary)]" />
              <h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-[var(--color-primary)] md:text-3xl"><BookSearch size={26} className="text-[var(--color-secondary)]" /> Research Vault</h1>
            </div>
            <p className="ml-4 text-sm text-slate-500">Find a research group, learn from student experiences, and get practical guidance for your next step.</p>
          </div>
          {(section === 'experiences' || section === 'discussions' || (section === 'resources' && user && !['RESEARCH_ADMIN', 'SUPER_ADMIN'].includes(user.role))) && (
            <button onClick={() => (section === 'resources' ? (() => { setResourceSubmitSuccess(false); setResourceFormOpen(true); })() : setFormOpen(true))} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95">
              {section === 'experiences' ? <><Send size={16} /> Share an experience</> : section === 'discussions' ? <><Send size={16} /> Ask a question</> : <><Plus size={16} /> Submit Resource</>}
            </button>
          )}
        </div>
      </header>

      <nav className="vault-tabs flex items-center gap-2 overflow-x-auto px-1 pb-1 scrollbar-thin -ml-1" aria-label="Research Vault sections" style={{ scrollbarWidth: 'thin', scrollbarColor: 'var(--color-secondary) transparent' }}>
        {sections.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => { if (id === 'discussions') { navigate('/dashboard/research-vault/questions'); return; } setSection(id); navigate(`/dashboard/research-vault?section=${id}`, { replace: true }); setItems([]); setLoading(true); setSearch(''); setDiscussionStatus('all'); setAreaId(''); setAreaSearch(''); setAreaPickerOpen(false); }} className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-xs font-bold whitespace-nowrap transition-all duration-200 ${section === id ? 'is-active bg-[var(--color-secondary)] text-white shadow-[0_4px_16px_var(--color-secondary-glow)] scale-[1.02]' : 'border-slate-200 bg-white/95 text-slate-500 shadow-xs hover:border-slate-300 hover:bg-white/90 hover:text-[var(--color-primary)]'}`}>
            {createElement(Icon, { size: 16 })} {label}
          </button>
        ))}
        <div className="shrink-0 w-8 lg:w-0" aria-hidden="true" />
      </nav>

      <div className="vault-toolbar flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-xl sm:p-4 md:flex-row md:items-center">
        <label className="relative min-w-0 flex-1">
          <Search size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder={`Search ${section}...`} className="w-full rounded-xl border border-slate-200 bg-white/90 py-2.5 pl-10 pr-3 text-xs text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)]" />
        </label>
        {section === 'discussions' && <select value={discussionStatus} onChange={(event) => setDiscussionStatus(event.target.value)} aria-label="Filter discussions by status" className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-xs font-semibold text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)] sm:w-48"><option value="all">All discussions</option><option value="needs-reply">Needs a reply</option><option value="resolved">Resolved</option></select>}
        {(section === 'faculty' || section === 'experiences' || section === 'positions') && (
          <input value={department} onChange={(event) => setDepartment(event.target.value)} placeholder="Department" className="rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-xs font-semibold text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)] sm:w-56" />
        )}
        {section === 'faculty' && <label className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-xs font-semibold text-slate-700"><input type="checkbox" checked={openingsOnly} onChange={(event) => setOpeningsOnly(event.target.checked)} className="accent-emerald-800" /> Current openings</label>}
        {section !== 'positions' && (
          <div ref={section === 'following' ? followingAreaPickerRef : areaPickerRef} className="relative sm:w-56">
            <input
              role="combobox"
              aria-label="Search research areas"
              aria-expanded={section === 'following' ? followingAreaPickerOpen : areaPickerOpen}
              aria-controls="research-area-options"
              aria-autocomplete="list"
              value={
                section === 'following'
                  ? followingAreaId
                    ? followingRelevantAreas.find((area) => String(area.id) === followingAreaId)?.name || followingAreaSearch
                    : followingAreaSearch
                  : areaId
                    ? areas.find((area) => String(area.id) === areaId)?.name || areaSearch
                    : areaSearch
              }
              onFocus={() => {
                if (section === 'following') setFollowingAreaPickerOpen(true);
                else setAreaPickerOpen(true);
              }}
              onChange={(event) => {
                if (section === 'following') {
                  setFollowingAreaSearch(event.target.value);
                  setFollowingAreaId('');
                  setFollowingAreaPickerOpen(true);
                } else {
                  setAreaSearch(event.target.value);
                  setAreaId('');
                  setAreaPickerOpen(true);
                }
              }}
              onKeyDown={(event) => {
                if (event.key === 'Escape') {
                  if (section === 'following') setFollowingAreaPickerOpen(false);
                  else setAreaPickerOpen(false);
                }
                if (event.key === 'Enter' && (section === 'following' ? followingAreaPickerOpen : areaPickerOpen)) {
                  event.preventDefault();
                  const sourceAreas = section === 'following' ? followingRelevantAreas : areas;
                  const sourceSearch = section === 'following' ? followingAreaSearch : areaSearch;
                  const firstMatch = sourceAreas.filter((area) =>
                    `${area.name} ${area.description || ''}`.toLowerCase().includes(sourceSearch.trim().toLowerCase())
                  )[0];
                  if (firstMatch) {
                    if (section === 'following') {
                      setFollowingAreaId(String(firstMatch.id));
                      setFollowingAreaSearch(firstMatch.name);
                      setFollowingAreaPickerOpen(false);
                    } else {
                      setAreaId(String(firstMatch.id));
                      setAreaSearch(firstMatch.name);
                      setAreaPickerOpen(false);
                    }
                  }
                }
              }}
              placeholder={section === 'following' && followingRelevantAreas.length === 0 ? 'No relevant areas' : 'All research areas'}
              className="w-full rounded-xl border border-slate-200 bg-white/90 px-3 py-2.5 text-xs font-semibold text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)]"
            />
            {(section === 'following' ? followingAreaId : areaId) && (
              <button
                type="button"
                aria-label="Clear research area filter"
                onClick={() => {
                  if (section === 'following') {
                    setFollowingAreaId('');
                    setFollowingAreaSearch('');
                    setFollowingAreaPickerOpen(false);
                  } else {
                    setAreaId('');
                    setAreaSearch('');
                    setAreaPickerOpen(false);
                  }
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-900"
              >
                ×
              </button>
            )}
            {(section === 'following' ? followingAreaPickerOpen : areaPickerOpen) && (
              <div id="research-area-options" role="listbox" className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-slate-200 bg-white p-1 shadow-xl">
                <button
                  type="button"
                  role="option"
                  aria-selected={!(section === 'following' ? followingAreaId : areaId)}
                  onClick={() => {
                    if (section === 'following') {
                      setFollowingAreaId('');
                      setFollowingAreaSearch('');
                      setFollowingAreaPickerOpen(false);
                    } else {
                      setAreaId('');
                      setAreaSearch('');
                      setAreaPickerOpen(false);
                    }
                  }}
                  className="block w-full rounded-lg px-3 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-blue-50 hover:text-[var(--color-primary-accent)]"
                >
                  All research areas
                </button>
                {(section === 'following' ? followingRelevantAreas : areas)
                  .filter((area) =>
                    `${area.name} ${area.description || ''}`.toLowerCase().includes(
                      (section === 'following' ? followingAreaSearch : areaSearch).trim().toLowerCase()
                    )
                  )
                  .slice(0, 8)
                  .map((area) => (
                    <button
                      type="button"
                      role="option"
                      aria-selected={String(area.id) === (section === 'following' ? followingAreaId : areaId)}
                      key={area.id}
                      onClick={() => {
                        if (section === 'following') {
                          setFollowingAreaId(String(area.id));
                          setFollowingAreaSearch(area.name);
                          setFollowingAreaPickerOpen(false);
                        } else {
                          setAreaId(String(area.id));
                          setAreaSearch(area.name);
                          setAreaPickerOpen(false);
                        }
                      }}
                      className="block w-full rounded-lg px-3 py-2 text-left text-xs text-slate-700 hover:bg-blue-50 hover:text-[var(--color-primary-accent)]"
                    >
                      {area.name}
                    </button>
                  ))}
                {(section === 'following' ? followingAreaSearch : areaSearch).trim() &&
                  (section === 'following' ? followingRelevantAreas : areas).every(
                    (area) =>
                      !`${area.name} ${area.description || ''}`.toLowerCase().includes(
                        (section === 'following' ? followingAreaSearch : areaSearch).trim().toLowerCase()
                      )
                  ) && (
                    <p className="px-3 py-2 text-xs text-slate-500">
                      No matching areas. Try another term or clear the filter.
                    </p>
                  )}
              </div>
            )}
          </div>
        )}
      </div>

      {section === 'faculty' && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
          <VaultList loading={loading} empty="No faculty profiles match these filters.">
            {items.map((faculty) => <article key={faculty.id} className="border-b border-slate-200 py-5 first:pt-1 overflow-hidden">
              <div className="flex flex-wrap items-start justify-between gap-3 min-w-0">
                <div className="min-w-0 flex flex-col items-start text-left">
                  <h2 className="text-lg font-bold text-slate-950 leading-snug break-words">{faculty.name}</h2>
                  <p className="mt-1 text-sm text-slate-600 leading-snug break-words">{faculty.designation}{faculty.designation && faculty.department ? ' · ' : ''}{faculty.department}</p>
                </div>
                <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); follow('faculty', faculty.id, faculty.name); }} aria-pressed={followedFacultyIds.has(faculty.id)} title={followedFacultyIds.has(faculty.id) ? `Unfollow ${faculty.name}` : `Follow ${faculty.name}`} className="inline-flex items-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 hover:border-[var(--color-secondary)] hover:text-[var(--color-primary-accent)] shrink-0">{followedFacultyIds.has(faculty.id) ? <><UserRoundCheck size={15} /> Following</> : <><UserRoundPlus size={15} /> Follow</>}</button>
              </div>
              {faculty.biography && <p className="mt-3 text-sm leading-6 text-slate-700">{faculty.biography}</p>}
              <TagList areas={faculty.researchAreas?.map((entry) => entry.researchArea) || []} onFollow={follow} followedAreaIds={followedAreaIds} />
              {faculty.positions?.length > 0 && <p className="mt-3 text-xs font-semibold text-emerald-800">{faculty.positions.length} current opening{faculty.positions.length === 1 ? '' : 's'}</p>}
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">{faculty.email && <a className="hover:text-emerald-800" href={`mailto:${faculty.email}`}>{faculty.email}</a>}{faculty.website && <a className="inline-flex items-center gap-1 hover:text-emerald-800" href={faculty.website} target="_blank" rel="noreferrer">Faculty website <ExternalLink size={12} /></a>}</div>
              {faculty.publications && <details className="mt-3 text-sm"><summary className="cursor-pointer font-semibold text-slate-700">Publications and work</summary><p className="mt-2 whitespace-pre-wrap text-slate-600">{faculty.publications}</p></details>}
            </article>)}</VaultList>
          <aside className="self-start rounded-3xl border-2 border-[var(--color-secondary)]/30 bg-gradient-to-b from-white/95 via-sky-50/25 to-blue-50/35 p-5 shadow-[0_12px_35px_rgba(11,30,63,0.06)]">
            <p className="flex items-center gap-2 text-sm font-bold text-emerald-950"><UsersRound size={16} /> Find a research match</p>
            <p className="mt-2 text-xs leading-5 text-slate-600">Choose any interests. Recommendations are ranked by research-area fit, department, and active openings.</p>
            <form onSubmit={findMatches} className="mt-4 space-y-3">
              <input value={interest.department} onChange={(event) => setInterest({ ...interest, department: event.target.value })} placeholder="Department (e.g. Electrical)" aria-label="Preferred department" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)]" />
              <input value={interest.subArea} onChange={(event) => setInterest({ ...interest, subArea: event.target.value })} placeholder="Research area (e.g. robotics)" aria-label="Research area of interest" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)]" />
              <select value={interest.projectType} onChange={(event) => setInterest({ ...interest, projectType: event.target.value })} aria-label="Preferred project type" className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)]"><option value="">Any project type</option><option value="SUMMER_RESEARCH">Summer research</option><option value="THESIS">Thesis</option><option value="READING_PROJECT">Reading project</option><option value="RA_SHIP">Research assistantship</option></select>
              <button disabled={matching || (!interest.department.trim() && !interest.subArea.trim() && !interest.projectType)} className="w-full rounded-xl bg-[var(--color-secondary)] px-3 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[var(--color-primary-accent)] disabled:cursor-not-allowed disabled:opacity-50">{matching ? 'Finding matches...' : 'Find faculty matches'}</button>
            </form>
            {matchSearched && <div className="mt-4 border-t border-blue-100 pt-3">
              <p className="mb-1 text-xs font-semibold text-slate-600">{matches.length ? `${matches.length} recommended faculty, ranked by fit` : 'No close matches yet. Try a broader department or research-area term.'}</p>
              <ul className="divide-y divide-blue-100">
                {matches.map((match) => <li key={match.id} className="py-3">
                  <div className="flex items-start justify-between gap-2 min-w-0">
                    <p className="text-sm font-bold text-slate-900 leading-snug break-words min-w-0">{match.name}</p>
                    <span className="shrink-0 rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-bold text-blue-800">{match.matchScore}% fit</span>
                  </div>
                  <p className="mt-0.5 text-xs text-slate-500 leading-snug break-words">{match.department || match.designation || 'Faculty'}</p>
                  <p className="mt-2 text-xs leading-5 text-slate-600">{match.matchReasons.join(' · ')}</p>
                  <div className="mt-2 flex items-center gap-3">
                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); follow('faculty', match.id, match.name); }} aria-pressed={followedFacultyIds.has(match.id)} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary-accent)] hover:text-[var(--color-secondary)]">{followedFacultyIds.has(match.id) ? <><UserRoundCheck size={13} /> Following</> : <><UserRoundPlus size={13} /> Follow</>}</button>
                    {match.email && <a href={`mailto:${match.email}`} className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--color-primary-accent)] hover:text-[var(--color-secondary)]">Contact <ExternalLink size={12} /></a>}
                  </div>
                </li>)}
              </ul>
            </div>}
          </aside>
        </div>
      )}

      {section === 'experiences' && <VaultList loading={loading} empty="No published experiences yet.">{items.map((experience) => <article key={experience.id} className="border-b border-slate-200 py-5 first:pt-1"><div className="flex flex-wrap items-start justify-between gap-2"><h2 className="text-lg font-bold">{experience.title}</h2><span className="text-xs text-slate-500">{experience.uploadedBy ? authorLabel(experience.uploadedBy) : (experience.faculty?.name || experience.guideName || 'Student contributor')}</span></div><p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-700">{experience.description}</p><div className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">{experience.labName && <span>Lab: {experience.labName}</span>}{experience.duration && <span>Duration: {experience.duration}</span>}{experience.outcome && <span>Outcome: {experience.outcome}</span>}</div>{experience.keyLearnings && <p className="mt-2 text-sm text-slate-600"><strong>Key learnings:</strong> {experience.keyLearnings}</p>}<TagList areas={experience.researchAreas?.map((entry) => entry.researchArea) || []} onFollow={follow} followedAreaIds={followedAreaIds} /></article>)}</VaultList>}

      {section === 'discussions' && <VaultList loading={loading} empty="No discussions found.">{items.map((discussion) => <DiscussionItem key={discussion.id} discussion={discussion} currentUserId={user?.id} onReply={reply} onVote={vote} onAcceptAnswer={acceptAnswer} onFollow={follow} followedAreaIds={followedAreaIds} setRefreshVersion={setRefreshVersion} />)}</VaultList>}

      {section === 'resources' && (
        <div className="space-y-4">
          {/* Filter pills row — matches the shared vault-toolbar control styling */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Category pills */}
            {[
              { value: '', label: 'All' },
              { value: 'GUIDE', label: 'Guide' },
              { value: 'SOP_WRITING', label: 'SOP Writing' },
              { value: 'LOR', label: 'LOR' },
              { value: 'COLD_EMAILING', label: 'Cold Email' },
              { value: 'PHD_APPLICATIONS', label: 'PhD Apps' },
              { value: 'GRANT_WRITING', label: 'Grant Writing' },
              { value: 'TEMPLATE', label: 'Template' },
              { value: 'GENERAL', label: 'General' },
            ].map(({ value, label }) => (
              <button
                key={value}
                type="button"
                onClick={() => { setResourceCategory(value); setResourcePage(1); }}
                className={`px-3 py-2.5 rounded-full text-xs font-semibold border transition-colors ${resourceCategory === value ? 'bg-[var(--color-secondary)] text-white border-[var(--color-secondary)]' : 'bg-white/90 text-[var(--color-primary)] border-slate-200 hover:border-[var(--color-secondary)] hover:text-[var(--color-primary-accent)]'}`}
              >
                {label}
              </button>
            ))}
            <div className="ml-auto flex flex-wrap items-center gap-2">
              {user && (
                <button
                  type="button"
                  onClick={() => setShowMySubmissions((v) => !v)}
                  aria-pressed={showMySubmissions}
                  className={`inline-flex items-center gap-2 rounded-full border px-3 py-2.5 text-xs font-semibold transition-colors ${showMySubmissions ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/10 text-[var(--color-primary-accent)]' : 'bg-white/90 text-[var(--color-primary)] border-slate-200 hover:border-[var(--color-secondary)] hover:text-[var(--color-primary-accent)]'}`}
                >
                  <FileText size={14} /> My Submissions
                </button>
              )}
              {/* Format filter */}
              <select
                value={resourceFormat}
                onChange={(e) => { setResourceFormat(e.target.value); setResourcePage(1); }}
                aria-label="Filter by format"
                className="rounded-full border border-slate-200 bg-white/90 px-4 py-2.5 text-xs font-semibold text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)]"
              >
                <option value="">All formats</option>
                <option value="link">External Link</option>
                <option value="pdf">PDF</option>
                <option value="docx">DOCX</option>
              </select>
              {/* Sort */}
              <select
                value={resourceSort}
                onChange={(e) => { setResourceSort(e.target.value); setResourcePage(1); }}
                aria-label="Sort resources"
                className="rounded-full border border-slate-200 bg-white/90 px-4 py-2.5 text-xs font-semibold text-[var(--color-primary)] outline-none focus:border-[var(--color-secondary)]"
              >
                <option value="newest">Newest</option>
                <option value="most_viewed">Most Viewed</option>
                <option value="most_downloaded">Most Downloaded</option>
              </select>
            </div>
          </div>

          {/* My Submissions panel */}
          {showMySubmissions && (
            <section aria-label="My submissions" className="rounded-2xl border border-slate-200 bg-white/95 p-4 shadow-sm space-y-3">
              <h4 className="font-bold text-slate-900 flex items-center gap-2"><FileText size={16} className="text-[var(--color-secondary)]" /> My Submissions</h4>
              {myResourcesLoading ? (
                <p className="text-xs text-slate-500 py-4 text-center">Loading your submissions…</p>
              ) : myResources.length === 0 ? (
                <p className="text-xs text-slate-500 py-4 text-center">You haven't submitted any resources yet.</p>
              ) : (
                <ul className="divide-y divide-slate-100">
                  {myResources.map((r) => (
                    <li key={r.id} className="py-3">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border ${
                              r.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                              : r.status === 'REJECTED' ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-amber-50 text-amber-700 border-amber-200'
                            }`}>{r.status}</span>
                            <span className={getResourceTypeBadgeClass(r.resourceType)}>{formatResourceType(r.resourceType)}</span>
                          </div>
                          <p className="text-sm font-semibold text-slate-900 break-words">{r.title}</p>
                          {r.status === 'REJECTED' && r.rejection_reason && (
                            <p className="mt-1 text-xs text-red-600 italic">Reason: {r.rejection_reason}</p>
                          )}
                          <p className="text-xs text-slate-400 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          {r.status === 'PENDING' && (
                            <>
                              <button
                                type="button"
                                onClick={() => { setEditingResource(r); setEditForm({ title: r.title, description: r.description || '', url: r.url || '', category: r.resourceType, researchAreaIds: r.researchAreas?.map(ra => ra.researchArea.id) || [], customArea: r.customArea?.name || '' }); }}
                                className="text-xs font-semibold text-[var(--color-primary-accent)] hover:underline"
                              >Edit</button>
                              <button
                                type="button"
                                onClick={() => setWithdrawConfirm({ id: r.id, title: r.title })}
                                className="text-xs font-semibold text-red-600 hover:underline"
                              >Withdraw</button>
                            </>
                          )}
                          {r.status === 'REJECTED' && (
                            <button
                              type="button"
                              onClick={() => {
                                setResourceForm({ title: r.title, description: r.description || '', url: r.url || '', category: r.resourceType, researchAreaIds: r.researchAreas?.map(ra => ra.researchArea.id) || [], consent_confirmed: false });
                                setResourceSubmitSuccess(false);
                                setResourceFormOpen(true);
                              }}
                              className="text-xs font-semibold text-[var(--color-primary-accent)] hover:underline"
                            >Resubmit as new</button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}

          {/* Resource cards */}
          <VaultList loading={loading} empty="No resources match your filters.">
            {items.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                follow={follow}
                followedAreaIds={followedAreaIds}
                apiUrl={researchVaultApi.getResourceDownloadUrl(resource.id)}
              />
            ))}
          </VaultList>

          {/* Pagination */}
          {resourceTotal > RESOURCE_PAGE_SIZE && (
            <div className="flex items-center justify-center gap-3 pt-2" role="navigation" aria-label="Resource pagination">
              <button
                type="button"
                disabled={resourcePage <= 1}
                onClick={() => setResourcePage((p) => p - 1)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40 hover:border-[var(--color-secondary)] hover:text-[var(--color-primary-accent)] transition-colors"
              >← Previous</button>
              <span className="text-xs text-slate-500">Page {resourcePage} of {Math.ceil(resourceTotal / RESOURCE_PAGE_SIZE)}</span>
              <button
                type="button"
                disabled={resourcePage >= Math.ceil(resourceTotal / RESOURCE_PAGE_SIZE)}
                onClick={() => setResourcePage((p) => p + 1)}
                className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 disabled:opacity-40 hover:border-[var(--color-secondary)] hover:text-[var(--color-primary-accent)] transition-colors"
              >Next →</button>
            </div>
          )}
        </div>
      )}

      {section === 'positions' && (
        <div className="space-y-4">
          {/* Filter/sort row — same control styling as the Resources filter row */}
          <div className="flex flex-wrap items-center gap-2">
            <FilterDropdown
              value={positionType}
              onChange={setPositionType}
              options={POSITION_TYPE_OPTIONS}
              ariaLabel="Filter by position type"
              placeholder="All types"
            />
            <FilterDropdown
              value={positionAreaId}
              onChange={setPositionAreaId}
              options={positionAreaOptions}
              ariaLabel="Filter by research area"
              placeholder="All research areas"
              searchable
              searchPlaceholder="Search areas…"
              emptyMessage="No matching areas."
            />
            <div className="ml-auto flex flex-wrap items-center gap-2">
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-slate-200 bg-white/90 px-3 py-2.5 text-xs font-semibold text-[var(--color-primary)]">
                <input type="checkbox" checked={positionShowClosed} onChange={(e) => setPositionShowClosed(e.target.checked)} className="accent-emerald-800" />
                Show closed positions
              </label>
              <FilterDropdown
                value={positionSort}
                onChange={setPositionSort}
                options={POSITION_SORT_OPTIONS}
                ariaLabel="Sort positions"
                placeholder="Deadline (soonest)"
              />
            </div>
          </div>

          <VaultList loading={loading} empty={positionShowClosed ? 'No positions match your filters.' : 'No open research positions right now.'}>
            {filteredPositions.map((position) => {
              const closed = position.deadline && new Date(position.deadline).getTime() < Date.now();
              const urgency = deadlineInfo(position.deadline);
              const isBookmarked = bookmarkedPositionIds.has(position.id);
              return (
                <article key={position.id} className={`flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 py-5 first:pt-1 ${closed ? 'opacity-60' : ''}`}>
                  <div className="min-w-0 flex-1 cursor-pointer" role="link" tabIndex={0}
                    onClick={() => navigate(`/dashboard/research-vault/positions/${position.id}`)}
                    onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/dashboard/research-vault/positions/${position.id}`); }}
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-800">{positionTypeLabel(position.positionType)}</span>
                      {urgency && <span className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-bold ${urgency.cls}`}>{urgency.label}</span>}
                      {position.bookmarked && <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-2.5 py-0.5 text-[11px] font-bold text-blue-700">Saved</span>}
                    </div>
                    <h2 className="mt-1 text-lg font-bold hover:text-[var(--color-primary-accent)]">{position.title}</h2>
                    <p className="mt-1 text-sm text-slate-600">{position.faculty?.name}{position.faculty?.department ? ` · ${position.faculty.department}` : ''}</p>
                    {position.description && <p className="mt-1.5 max-w-3xl truncate text-sm leading-6 text-slate-600">{position.description}</p>}
                    {position.deadline && <p className={`mt-2 text-xs ${closed ? 'text-slate-400' : 'text-slate-500'}`}>Apply by {new Date(position.deadline).toLocaleDateString()}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-2">
                    <button
                      type="button"
                      onClick={() => togglePositionBookmark(position.id)}
                      aria-pressed={isBookmarked}
                      title={isBookmarked ? 'Remove from saved positions' : 'Save this position'}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-semibold transition-colors ${isBookmarked ? 'border-blue-200 bg-blue-50 text-blue-700' : 'border-slate-200 bg-white text-slate-600 hover:border-[var(--color-secondary)] hover:text-[var(--color-primary-accent)]'}`}
                    >
                      <Bookmark size={13} /> {isBookmarked ? 'Saved' : 'Save'}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(`/dashboard/research-vault/positions/${position.id}`)}
                      className="inline-flex items-center gap-2 rounded-full bg-emerald-800 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-900"
                    >
                      View details
                    </button>
                  </div>
                </article>
              );
            })}
          </VaultList>
        </div>
      )}

      {section === 'following' && (
        <div className="space-y-6">
          {/* Followed Faculty */}
          {followedFacultyIds.size > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
                <UserRoundCheck size={20} className="text-[var(--color-secondary)]" />
                Following Faculty ({followedFacultyIds.size})
              </h3>
              <div className="space-y-2">
                {Array.from(followedFacultyIds).map((fid) => {
                  const faculty = items.find((f) => f.id === fid) || 
                    facultyOptions.find((f) => f.id === fid);
                  const isSelected = activeFacultyFilters.includes(fid);
                  const isFollowing = followedFacultyIds.has(fid);
                  return faculty ? (
                    <div
                      key={fid}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      onClick={(e) => {
                        if (e.target.closest('button')) return;
                        e.preventDefault();
                        setActiveFacultyFilters(prev => 
                          isSelected ? prev.filter(id => id !== fid) : [...prev, fid]
                        );
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          setActiveFacultyFilters(prev => 
                            isSelected ? prev.filter(id => id !== fid) : [...prev, fid]
                          );
                        }
                      }}
                      title={isSelected ? `Remove ${faculty.name} from filter` : `Add ${faculty.name} to filter`}
                      className={`w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 rounded-xl border p-3 shadow-sm transition-all duration-150 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2 overflow-hidden ${
                        isSelected
                          ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/5 ring-1 ring-inset ring-[var(--color-secondary)]/30'
                          : 'border-slate-200 bg-white/95 hover:border-[var(--color-secondary)] hover:bg-slate-50/50'
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0 flex-1 sm:flex-nowrap">
                        <div className="w-10 h-10 flex-shrink-0 rounded-full bg-gradient-to-br from-[var(--color-primary)] to-[var(--color-secondary)] flex items-center justify-center text-white font-semibold text-sm">
                          {getInitials(faculty.name, 'F')}
                        </div>
                        <div className="min-w-0 flex flex-col items-start text-left">
                          <p className="font-semibold text-slate-900 leading-snug break-words">{faculty.name}</p>
                          <p className="text-xs text-slate-500 leading-snug break-words">{faculty.designation}{faculty.department ? ` · ${faculty.department}` : ''}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); follow('faculty', fid, faculty.name); }}
                          aria-pressed={isFollowing}
                          title={isFollowing ? `Unfollow ${faculty.name}` : `Follow ${faculty.name}`}
                          className="inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2 ${
                            isFollowing
                              ? 'border-[var(--color-secondary)] bg-[var(--color-secondary)]/10 text-[var(--color-primary-accent)] hover:bg-[var(--color-secondary)]/20'
                              : 'border-slate-300 bg-white text-slate-700 hover:border-[var(--color-secondary)] hover:text-[var(--color-primary-accent)]'
                          }"
                        >
                          {isFollowing ? <UserRoundCheck size={13} /> : <UserRoundPlus size={13} />}
                          {isFollowing ? 'Following' : 'Follow'}
                        </button>
                      </div>
                    </div>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Followed Research Areas */}
          {followedAreaIds.size > 0 && (
            <div>
              <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-900">
                <Bookmark size={20} className="text-[var(--color-secondary)]" />
                Following Research Areas ({followedAreaIds.size})
              </h3>
              <div className="flex flex-wrap gap-2">
                {Array.from(followedAreaIds).map((aid) => {
                  const area = areas.find((a) => a.id === aid);
                  const isSelected = activeAreaFilters.includes(aid);
                  return area ? (
                    <button
                      type="button"
                      key={aid}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setActiveAreaFilters(prev => 
                          isSelected ? prev.filter(id => id !== aid) : [...prev, aid]
                        );
                      }}
                      aria-pressed={isSelected}
                      title={isSelected ? `Remove ${area.name} from filter` : `Add ${area.name} to filter`}
                      className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-semibold transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)] focus-visible:ring-offset-2 ${
                        isSelected
                          ? 'bg-blue-100 border-2 border-blue-400 text-blue-900 hover:bg-blue-200'
                          : 'border border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100'
                      }`}
                    >
                      {isSelected ? <Check size={13} className="mr-1 text-blue-700" /> : <Filter size={13} className="mr-1" />}
                      {area.name}
                    </button>
                  ) : null;
                })}
              </div>
            </div>
          )}

          {/* Recent Activity Feed */}
          {followedFacultyIds.size === 0 && followedAreaIds.size === 0 ? (
            <div className="academic-card flex flex-col items-center justify-center rounded-3xl p-12 text-center text-sm text-slate-500">
              <UserRoundPlus size={32} className="text-slate-300 mb-3" />
              <p className="font-semibold text-slate-700">Not following anyone yet</p>
              <p className="mt-1 text-slate-500">Follow a faculty member or research area to see their updates here.</p>
            </div>
          ) : (
            <div>
              {/* Title row */}
              <div className="mb-3 flex items-center gap-2">
                <h3 className="whitespace-nowrap flex items-center gap-2 text-lg font-bold text-slate-900">
                  <Activity size={20} className="text-[var(--color-secondary)]" />
                  Recent Activity
                </h3>
              </div>

              {/* Active filters bar - separate row, flex-wrap, only when filters active */}
              {(activeFacultyFilters.length > 0 || activeAreaFilters.length > 0) && (
                <div className="mb-4 flex flex-wrap items-center gap-2" role="group" aria-label="Active filters">
                  {(() => {
                    const totalFilters = activeFacultyFilters.length + activeAreaFilters.length;
                    // Collapse when many filters: show "N filters active · Clear all"
                    if (totalFilters > 4) {
                      return (
                        <div className="inline-flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-slate-600">
                            {totalFilters} filter{totalFilters > 1 ? 's' : ''} active
                          </span>
                          <button
                            type="button"
                            onClick={() => { setActiveFacultyFilters([]); setActiveAreaFilters([]); }}
                            className="text-sm font-semibold text-[var(--color-primary-accent)] hover:text-[var(--color-secondary)] underline-offset-2 hover:underline"
                            aria-label="Clear all filters"
                          >
                            Clear all
                          </button>
                        </div>
                      );
                    }
                    // Otherwise show individual pills
                    return (
                      <div className="inline-flex items-center gap-2 flex-wrap">
                        {activeFacultyList.map((faculty) => (
                          <span
                            key={`faculty-${faculty.id}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm"
                          >
                            <span className="font-semibold text-[var(--color-secondary)]">{faculty.name}</span>
                            <button
                              type="button"
                              onClick={() => setActiveFacultyFilters(prev => prev.filter(id => id !== faculty.id))}
                              className="ml-1.5 p-0.5 rounded-full hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
                              aria-label={`Remove filter ${faculty.name}`}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                        {activeAreaList.map((area) => (
                          <span
                            key={`area-${area.id}`}
                            className="inline-flex items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1.5 text-sm font-medium text-slate-700 shadow-sm"
                          >
                            <span className="font-semibold text-blue-700">{area.name}</span>
                            <button
                              type="button"
                              onClick={() => setActiveAreaFilters(prev => prev.filter(id => id !== area.id))}
                              className="ml-1.5 p-0.5 rounded-full hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-secondary)]"
                              aria-label={`Remove filter ${area.name}`}
                            >
                              <X size={12} />
                            </button>
                          </span>
                        ))}
                        {(activeFacultyList.length > 0 || activeAreaList.length > 0) && (
                          <button
                            type="button"
                            onClick={() => { setActiveFacultyFilters([]); setActiveAreaFilters([]); }}
                            className="text-sm font-semibold text-[var(--color-primary-accent)] hover:text-[var(--color-secondary)] underline-offset-2 hover:underline"
                            aria-label="Clear all filters"
                          >
                            Clear all
                          </button>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Empty state for filtered results */}
              {!loading && items.length === 0 && (activeFacultyFilters.length > 0 || activeAreaFilters.length > 0) && (
                <div className="academic-card flex flex-col items-center justify-center rounded-3xl p-8 text-center text-sm text-slate-500">
                  <Filter size={28} className="text-slate-300 mb-2" />
                  <p className="font-semibold text-slate-700">No updates match these filters</p>
                  <p className="mt-1 text-slate-500">Try removing some filters or click Clear all.</p>
                </div>
              )}

              <VaultList loading={loading} empty="No recent activity from the people and areas you follow.">
                {items.map((update, index) => (
                  <article key={update.id || `following-update-${index}`} className="border-b border-slate-200 py-5 first:pt-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="rounded-full border border-blue-200 bg-blue-50 px-2.5 py-1 text-[10px] font-bold uppercase text-blue-800">
                        {String(update.type || 'update').replaceAll('_', ' ')}
                      </span>
                      <time className="text-xs text-slate-500" dateTime={update.createdAt}>
                        {update.createdAt ? new Date(update.createdAt).toLocaleDateString() : ''}
                      </time>
                    </div>
                    <h2 className="mt-2 text-base font-bold text-slate-900">{update.title || 'Research update'}</h2>
                    {update.source && <p className="mt-1 text-xs font-semibold text-[var(--color-primary-accent)]">{update.source}</p>}
                    {update.detail && <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">{update.detail}</p>}
                  </article>
                ))}
              </VaultList>
            </div>
          )}
        </div>
      )}

      {formOpen && <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setFormOpen(false); }}><section role="dialog" aria-modal="true" aria-labelledby="vault-form-title" className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-md bg-white p-6 shadow-xl"><div className="flex items-center justify-between"><h2 id="vault-form-title" className="text-xl font-bold">{section === 'experiences' ? 'Share a research experience' : 'Ask the community'}</h2><button onClick={() => setFormOpen(false)} aria-label="Close" className="rounded p-2 text-slate-500 hover:bg-slate-100">×</button></div><form onSubmit={submitContent} className="mt-5 space-y-3"><input name="title" required placeholder={section === 'experiences' ? 'Experience title' : 'Question title'} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" />{section === 'experiences' && <><input name="labName" placeholder="Lab name" className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" /><input name="guideName" placeholder="Faculty guide" className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" /><input name="duration" placeholder="Duration" className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" /><input name="prerequisites" placeholder="Prerequisites" className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" /><input name="keyLearnings" placeholder="Key learnings" className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" /></>}<textarea name={section === 'experiences' ? 'description' : 'content'} required rows={5} placeholder={section === 'experiences' ? 'What did you work on and what should others know?' : 'Write your question or details. Markdown is supported.'} className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" />{section === 'experiences' && <input name="outcome" placeholder="Outcome" className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-sm" />}<select name="researchAreaIds" defaultValue="" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="">Research area (optional)</option>{areas.map((area) => <option key={area.id} value={area.id}>{area.name}</option>)}</select>{section === 'experiences' && <select name="facultyId" defaultValue="" className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-sm"><option value="">Faculty member (optional)</option>{facultyOptions.map((faculty) => <option key={faculty.id} value={faculty.id}>{faculty.name}</option>)}</select>}<div className="flex justify-end gap-2 pt-2"><button type="button" onClick={() => setFormOpen(false)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold">Cancel</button><button className="rounded-md bg-emerald-800 px-4 py-2 text-sm font-semibold text-white">Submit</button></div></form></section></div>}

      {/* Submit Resource Modal */}
      {resourceFormOpen && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) resetResourceForm(); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="submit-resource-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 id="submit-resource-title" className="text-xl font-bold text-slate-900">Submit Resource for Review</h2>
              <button type="button" onClick={resetResourceForm} aria-label="Close" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700"><X size={18} /></button>
            </div>

            {resourceSubmitSuccess ? (
              <div className="py-8 flex flex-col items-center text-center gap-4">
                <div className="rounded-full bg-emerald-100 p-4"><CheckCircle2 size={36} className="text-emerald-600" /></div>
                <div>
                  <p className="text-lg font-bold text-slate-900">Sent for review!</p>
                  <p className="mt-1 text-sm text-slate-500">An admin will review your submission. You'll see it in "My Submissions" once processed.</p>
                </div>
                {resourceSubmitWarnings.length > 0 && (
                  <div className="w-full rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-left">
                    <p className="text-xs font-bold text-amber-800 mb-1">Note:</p>
                    {resourceSubmitWarnings.map((w, i) => <p key={i} className="text-xs text-amber-700">⚠ {w}</p>)}
                  </div>
                )}
                <button type="button" onClick={resetResourceForm} className="rounded-full bg-[var(--color-secondary)] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[var(--color-primary-accent)]">Done</button>
              </div>
            ) : (
              <form onSubmit={submitResource} className="space-y-4">
                <p className="text-xs text-slate-500 border-l-2 border-[var(--color-secondary)] pl-3">Submitted resources are reviewed before publishing. Links only — admins handle file uploads.</p>

                {/* Title */}
                <div>
                  <label htmlFor="res-title" className="block text-xs font-semibold text-slate-700 mb-1">Title <span className="text-red-500">*</span></label>
                  <input
                    id="res-title"
                    required
                    maxLength={200}
                    value={resourceForm.title}
                    onChange={(e) => setResourceForm({ ...resourceForm, title: e.target.value })}
                    placeholder='e.g., "SOP Writing Guide for PhD Applications"'
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[var(--color-secondary)] outline-none"
                  />
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="res-desc" className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                  <textarea
                    id="res-desc"
                    rows={3}
                    maxLength={1000}
                    value={resourceForm.description}
                    onChange={(e) => setResourceForm({ ...resourceForm, description: e.target.value })}
                    placeholder="Briefly describe what this resource covers…"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[var(--color-secondary)] outline-none resize-none"
                  />
                </div>

                {/* Category */}
                <div>
                  <label htmlFor="res-cat" className="block text-xs font-semibold text-slate-700 mb-1">Category <span className="text-red-500">*</span></label>
                  <select
                    id="res-cat"
                    required
                    value={resourceForm.category}
                    onChange={(e) => setResourceForm({ ...resourceForm, category: e.target.value })}
                    className="w-full appearance-none rounded-full border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-[var(--color-primary)] focus:border-[var(--color-secondary)] outline-none"
                  >
                    <option value="GUIDE">Guide / Tutorial</option>
                    <option value="SOP_WRITING">SOP Writing</option>
                    <option value="LOR">Letter of Recommendation</option>
                    <option value="COLD_EMAILING">Cold Email Templates</option>
                    <option value="PHD_APPLICATIONS">PhD Applications</option>
                    <option value="GRANT_WRITING">Grant Writing</option>
                    <option value="TEMPLATE">Template</option>
                    <option value="GENERAL">General</option>
                  </select>
                </div>

                {/* Research Areas (multi-select) */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Research Areas</label>
                  <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto rounded-xl border border-slate-200 p-2">
                    {areas.map((area) => {
                      const selected = resourceForm.researchAreaIds.includes(area.id);
                      return (
                        <button
                          key={area.id}
                          type="button"
                          onClick={() => setResourceForm((f) => ({
                            ...f,
                            researchAreaIds: selected
                              ? f.researchAreaIds.filter((id) => id !== area.id)
                              : [...f.researchAreaIds, area.id]
                          }))}
                          aria-pressed={selected}
                          className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${selected ? 'bg-[var(--color-secondary)] text-white border-[var(--color-secondary)]' : 'bg-white text-slate-600 border-slate-200 hover:border-[var(--color-secondary)]'}`}
                        >
                          {selected && <Check size={10} className="inline mr-1" />}{area.name}
                        </button>
                      );
                    })}
                    {/* "Other" — free-text area, sent for admin review/normalization */}
                    <button
                      type="button"
                      onClick={() => setResourceForm((f) => ({ ...f, customArea: f.customArea ? '' : ' ' }))}
                      aria-pressed={Boolean(resourceForm.customArea)}
                      className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${resourceForm.customArea ? 'bg-[var(--color-secondary)] text-white border-[var(--color-secondary)]' : 'bg-white text-slate-600 border-dashed border-slate-300 hover:border-[var(--color-secondary)]'}`}
                    >
                      {resourceForm.customArea ? <Check size={10} className="inline mr-1" /> : <Plus size={10} className="inline mr-1" />}Other
                    </button>
                    {areas.length === 0 && <span className="text-xs text-slate-400 px-1">Loading areas…</span>}
                  </div>
                  {Boolean(resourceForm.customArea) && (
                    <input
                      type="text"
                      maxLength={60}
                      value={resourceForm.customArea}
                      onChange={(e) => setResourceForm({ ...resourceForm, customArea: e.target.value })}
                      placeholder="Type your research area (e.g., Quantum Materials)"
                      className="mt-2 w-full rounded-full border border-slate-200 px-4 py-2 text-xs focus:border-[var(--color-secondary)] outline-none"
                    />
                  )}
                  {Boolean(resourceForm.customArea) && (
                    <p className="mt-1 text-[11px] text-slate-400">Custom areas are reviewed by admins before appearing as filters for everyone.</p>
                  )}
                </div>

                {/* URL */}
                <div>
                  <label htmlFor="res-url" className="block text-xs font-semibold text-slate-700 mb-1">Link URL <span className="text-red-500">*</span></label>
                  <input
                    id="res-url"
                    type="url"
                    required
                    maxLength={2048}
                    value={resourceForm.url}
                    onChange={(e) => setResourceForm({ ...resourceForm, url: e.target.value })}
                    placeholder="https://docs.google.com/…"
                    className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm focus:border-[var(--color-secondary)] outline-none font-mono"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">Google Drive links: set sharing to "Anyone with the link can view". Prefer club or institutional drives over personal ones.</p>
                </div>

                {/* Consent */}
                <label className="flex items-start gap-3 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 cursor-pointer hover:border-[var(--color-secondary)]">
                  <input
                    type="checkbox"
                    required
                    checked={resourceForm.consent_confirmed}
                    onChange={(e) => setResourceForm({ ...resourceForm, consent_confirmed: e.target.checked })}
                    className="mt-0.5 accent-emerald-700"
                  />
                  <span className="text-xs text-slate-600">I own or have permission to share this content and have removed personal identifiers such as names, roll numbers, and contact details.</span>
                </label>

                <div className="flex justify-end gap-2 pt-1">
                  <button type="button" onClick={resetResourceForm} disabled={submittingResource} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                  <button type="submit" disabled={submittingResource || !resourceForm.consent_confirmed} className="rounded-full bg-[var(--color-secondary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-accent)] disabled:opacity-50 transition-colors">
                    {submittingResource ? 'Submitting…' : 'Submit for Review'}
                  </button>
                </div>
              </form>
            )}
          </section>
        </div>
      )}

      {/* Edit submission modal */}
      {editingResource && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-950/40 p-4" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setEditingResource(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="edit-resource-title" className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 id="edit-resource-title" className="text-xl font-bold text-slate-900">Edit Submission</h2>
              <button type="button" onClick={() => setEditingResource(null)} aria-label="Close" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <form onSubmit={saveEditResource} className="space-y-4">
              <div>
                <label htmlFor="edit-title" className="block text-xs font-semibold text-slate-700 mb-1">Title <span className="text-red-500">*</span></label>
                <input id="edit-title" required maxLength={200} value={editForm.title} onChange={(e) => setEditForm({ ...editForm, title: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-secondary)]" />
              </div>
              <div>
                <label htmlFor="edit-desc" className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
                <textarea id="edit-desc" rows={3} maxLength={1000} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-secondary)] resize-none" />
              </div>
              <div>
                <label htmlFor="edit-cat" className="block text-xs font-semibold text-slate-700 mb-1">Category</label>
                <select id="edit-cat" value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm outline-none focus:border-[var(--color-secondary)]">
                  <option value="GUIDE">Guide / Tutorial</option>
                  <option value="SOP_WRITING">SOP Writing</option>
                  <option value="LOR">Letter of Recommendation</option>
                  <option value="COLD_EMAILING">Cold Email Templates</option>
                  <option value="PHD_APPLICATIONS">PhD Applications</option>
                  <option value="GRANT_WRITING">Grant Writing</option>
                  <option value="TEMPLATE">Template</option>
                  <option value="GENERAL">General</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Research Areas</label>
                <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto rounded-xl border border-slate-200 p-2">
                  {areas.map((area) => {
                    const selected = editForm.researchAreaIds.includes(area.id);
                    return (
                      <button key={area.id} type="button" onClick={() => setEditForm((f) => ({ ...f, researchAreaIds: selected ? f.researchAreaIds.filter((id) => id !== area.id) : [...f.researchAreaIds, area.id] }))} aria-pressed={selected} className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${selected ? 'bg-[var(--color-secondary)] text-white border-[var(--color-secondary)]' : 'bg-white text-slate-600 border-slate-200 hover:border-[var(--color-secondary)]'}`}>
                        {selected && <Check size={10} className="inline mr-1" />}{area.name}
                      </button>
                    );
                  })}
                  {/* "Other" — free-text area, sent for admin review/normalization */}
                  <button
                    type="button"
                    onClick={() => setEditForm((f) => ({ ...f, customArea: f.customArea ? '' : ' ' }))}
                    aria-pressed={Boolean(editForm.customArea)}
                    className={`px-2.5 py-1 rounded-full text-xs font-semibold border transition-colors ${editForm.customArea ? 'bg-[var(--color-secondary)] text-white border-[var(--color-secondary)]' : 'bg-white text-slate-600 border-dashed border-slate-300 hover:border-[var(--color-secondary)]'}`}
                  >
                    {editForm.customArea ? <Check size={10} className="inline mr-1" /> : <Plus size={10} className="inline mr-1" />}Other
                  </button>
                </div>
                {Boolean(editForm.customArea) && (
                  <input
                    type="text"
                    maxLength={60}
                    value={editForm.customArea}
                    onChange={(e) => setEditForm({ ...editForm, customArea: e.target.value })}
                    placeholder="Type your research area (e.g., Quantum Materials)"
                    className="mt-2 w-full rounded-full border border-slate-200 px-4 py-2 text-xs focus:border-[var(--color-secondary)] outline-none"
                  />
                )}
              </div>
              <div>
                <label htmlFor="edit-url" className="block text-xs font-semibold text-slate-700 mb-1">Link URL</label>
                <input id="edit-url" type="url" maxLength={2048} value={editForm.url} onChange={(e) => setEditForm({ ...editForm, url: e.target.value })} className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm outline-none focus:border-[var(--color-secondary)] font-mono" />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button type="button" onClick={() => setEditingResource(null)} disabled={savingEdit} className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 hover:bg-slate-50">Cancel</button>
                <button type="submit" disabled={savingEdit} className="rounded-full bg-[var(--color-secondary)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--color-primary-accent)] disabled:opacity-50">{savingEdit ? 'Saving…' : 'Save Changes'}</button>
              </div>
            </form>
          </section>
        </div>
      )}

      {/* Withdraw confirmation dialog */}
      {withdrawConfirm && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setWithdrawConfirm(null); }}>
          <section role="alertdialog" aria-modal="true" aria-labelledby="withdraw-title" aria-describedby="withdraw-desc" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)]">Research Vault</p>
                <h2 id="withdraw-title" className="mt-1 text-xl font-bold text-slate-950">Withdraw submission?</h2>
              </div>
              <button type="button" aria-label="Close" onClick={() => setWithdrawConfirm(null)} className="rounded-md p-2 text-slate-400 hover:bg-slate-100"><X size={18} /></button>
            </div>
            <p id="withdraw-desc" className="mt-3 text-sm leading-6 text-slate-600">
              "<strong>{withdrawConfirm.title}</strong>" will be permanently deleted. This cannot be undone.
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <button type="button" onClick={() => setWithdrawConfirm(null)} className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Keep it</button>
              <button type="button" onClick={() => withdrawResource(withdrawConfirm.id)} className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700">Withdraw</button>
            </div>
          </section>
        </div>
      )}

      {pendingUnfollow && <div className="fixed inset-0 z-[90] flex items-center justify-center bg-slate-950/45 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setPendingUnfollow(null); }}><section role="alertdialog" aria-modal="true" aria-labelledby="unfollow-title" aria-describedby="unfollow-description" className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl"><div className="flex items-start justify-between gap-4"><div><p className="text-xs font-bold uppercase tracking-wider text-[var(--color-secondary)]">Research Vault</p><h2 id="unfollow-title" className="mt-1 text-xl font-bold text-slate-950">Unfollow {pendingUnfollow.name}?</h2></div><button type="button" aria-label="Close confirmation" onClick={() => setPendingUnfollow(null)} className="rounded-md p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button></div><p id="unfollow-description" className="mt-3 text-sm leading-6 text-slate-600">Updates from {pendingUnfollow.kind === 'faculty' ? 'this faculty member' : 'this research area'} will no longer appear in your Following feed. You can follow again at any time.</p><div className="mt-6 flex justify-end gap-2"><button type="button" onClick={() => setPendingUnfollow(null)} className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50">Keep following</button><button type="button" onClick={confirmUnfollow} className="rounded-md bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800">Unfollow</button></div></section></div>}
    </div>
  );
}

function ResearchVaultHeader({ title, subtitle, actionLabel, onAction, actionIcon: ActionIcon }) {
  return (
    <header>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <div className="accent-bar h-6 rounded-full shadow-[0_0_8px_var(--color-secondary)]" />
            <h1 className="flex items-center gap-2.5 text-2xl font-extrabold tracking-tight text-[var(--color-primary)] md:text-3xl">
              <BookSearch size={26} className="text-[var(--color-secondary)]" /> {title}
            </h1>
          </div>
          <p className="ml-4 text-sm text-slate-500">{subtitle}</p>
        </div>
        {actionLabel && onAction && (
          <button onClick={onAction} className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[var(--color-primary)] to-[var(--color-secondary)] px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:opacity-95 shrink-0">
            {ActionIcon && <ActionIcon size={16} />} {actionLabel}
          </button>
        )}
      </div>
    </header>
  );
}

function FilterBar({ children }) {
  return (
    <div className="vault-toolbar flex flex-col gap-3 rounded-3xl border border-slate-200 bg-white/95 p-3 shadow-lg backdrop-blur-xl sm:p-4 md:flex-row md:items-center">
      {children}
    </div>
  );
}

function VaultList({ loading, empty, children }) {
  if (loading) return <div className="academic-card flex min-h-48 items-center justify-center rounded-3xl p-8 text-center text-sm text-slate-500">Loading Research Vault...</div>;
  if (!children || (Array.isArray(children) && children.length === 0)) return <div className="academic-card flex min-h-48 items-center justify-center rounded-3xl p-8 text-center text-sm text-slate-500">{empty}</div>;
  return <div className="space-y-4">{children}</div>;
}

function ResourceCard({ resource, follow, followedAreaIds, apiUrl }) {
  // sourceType is the authoritative FILE vs EXTERNAL_LINK distinction
  // (backend-derived, persisted per resource); fall back for legacy rows.
  const isFileResource = resource.sourceType
    ? resource.sourceType === 'FILE'
    : Boolean(resource.filePath);
  const isLink = !isFileResource;
  const format = resource.format || (isFileResource ? (resource.mimeType?.includes('pdf') ? 'pdf' : 'docx') : 'link');

  const formatBadge = {
    link: { cls: 'bg-blue-50 text-blue-700 border-blue-200', icon: <ExternalLink size={10} />, label: 'External Link' },
    pdf:  { cls: 'bg-slate-100 text-slate-600 border-slate-200', icon: <FileText size={10} />, label: 'PDF' },
    docx: { cls: 'bg-indigo-50 text-indigo-600 border-indigo-200', icon: <FileText size={10} />, label: 'DOCX' }
  }[format] || { cls: 'bg-slate-50 text-slate-500 border-slate-200', icon: <FileText size={10} />, label: 'File' };

  const actionBtn = 'inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 hover:border-[var(--color-secondary)] hover:text-[var(--color-primary-accent)] hover:bg-slate-50 transition-colors';

  // Optimistic counters: bump the displayed number the moment the user acts,
  // then reconcile silently against server truth — Math.max means the shown
  // value can only ever move up (no flash-down when a unique-view POST returns
  // an unchanged count, or when a refetch lands mid-flight).
  const [viewCount, setViewCount] = useState(resource.viewCount ?? 0);
  const [downloadCount, setDownloadCount] = useState(resource.downloadCount ?? 0);

  useEffect(() => {
    setViewCount((v) => Math.max(v, resource.viewCount ?? 0));
  }, [resource.viewCount]);
  useEffect(() => {
    setDownloadCount((v) => Math.max(v, resource.downloadCount ?? 0));
  }, [resource.downloadCount]);

  // Track a unique view when the user opens the resource content.
  // (File downloads are counted server-side inside the download endpoint.)
  const handleOpen = () => {
    setViewCount((v) => v + 1);
    researchVaultApi.recordResourceView(resource.id)
      .then((response) => {
        const serverCount = response.data?.data?.viewCount;
        if (Number.isFinite(serverCount)) setViewCount((v) => Math.max(v, serverCount));
      })
      .catch(() => {});
  };

  // The download endpoint increments the counter before streaming the file.
  const handleDownload = () => {
    setDownloadCount((v) => v + 1);
  };

  return (
    <article className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b border-slate-200 py-5 first:pt-1 overflow-hidden">
      <div className="flex-1 min-w-0">
        {/* Badges */}
        <div className="flex flex-wrap items-center gap-2">
          <span className={getResourceTypeBadgeClass(resource.resourceType)}>
            {getResourceTypeIcon(resource.resourceType)}
            {formatResourceType(resource.resourceType)}
          </span>
          <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${formatBadge.cls}`}>
            {formatBadge.icon} {formatBadge.label}
          </span>
        </div>

        {/* Title + description */}
        <h2 className="mt-2 text-base font-bold text-slate-950 leading-snug break-words">{resource.title}</h2>
        {resource.description && (
          <p className="mt-1.5 max-w-3xl text-sm leading-6 text-slate-600 line-clamp-3">{resource.description}</p>
        )}

        {/* Meta row — author follows the Discussion format: Name · Roll Number */}
        <div className="mt-2.5 flex flex-wrap items-center gap-3 text-xs text-slate-500">
          {resource.uploadedBy?.displayName && (
            <span className="flex items-center gap-1">
              <UserRoundCheck size={12} /> {authorLabel(resource.uploadedBy)}
            </span>
          )}
          <span className="flex items-center gap-1"><Eye size={12} /> {viewCount}</span>
          {isFileResource && <span className="flex items-center gap-1"><Download size={12} /> {downloadCount}</span>}
          {resource.createdAt && (
            <span className="flex items-center gap-1"><Clock size={12} /> {new Date(resource.createdAt).toLocaleDateString()}</span>
          )}
        </div>

        {/* Research area tags (+ admin-pending custom tag) */}
        <TagList
          areas={resource.researchAreas?.map((entry) => entry.researchArea) || []}
          onFollow={follow}
          followedAreaIds={followedAreaIds}
        />
        {resource.customArea && (
          <div className="mt-2">
            <span
              title="Custom research area — pending admin review"
              className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 bg-slate-50 px-2 py-1 text-[11px] font-semibold text-slate-500"
            >
              <Clock size={11} /> {resource.customArea.name}
            </span>
          </div>
        )}
      </div>

      {/* Action button(s) — label reflects what actually happens on click */}
      <div className="shrink-0 sm:ml-4 flex flex-col items-start gap-1.5">
        {isLink && (
          <>
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              onClick={handleOpen}
              className={actionBtn}
            >
              <ExternalLink size={14} /> Open Link
            </a>
            <span className="text-[11px] text-slate-400 flex items-center gap-1">Opens externally <ExternalLink size={10} /></span>
          </>
        )}
        {isFileResource && format === 'pdf' && (
          <div className="flex items-center gap-2">
            <a
              href={`${apiUrl}&inline=1`}
              target="_blank"
              rel="noreferrer"
              onClick={handleOpen}
              className={actionBtn}
            >
              <FileText size={14} /> Open PDF
            </a>
            <a
              href={apiUrl}
              download
              onClick={handleDownload}
              className={actionBtn}
            >
              <Download size={14} /> Download
            </a>
          </div>
        )}
        {isFileResource && format !== 'pdf' && (
          <a
            href={apiUrl}
            download
            onClick={handleDownload}
            className={actionBtn}
          >
            <Download size={14} /> Download
          </a>
        )}
        {!isLink && !isFileResource && (
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-3 py-2 text-sm text-slate-400">
            <Lock size={14} /> Unavailable
          </span>
        )}
      </div>
    </article>
  );
}

function TagList({ areas, onFollow, followedAreaIds, compact = false }) {
  if (!areas?.length) return null;
  return <div className={`flex flex-wrap gap-1.5 ${compact ? '' : 'mt-3'}`}>{areas.map((area) => {
    const isFollowing = followedAreaIds?.has(area.id) || false;
    return <button type="button" key={area.id} onClick={(e) => { e.preventDefault(); e.stopPropagation(); onFollow('area', area.id, area.name); }} aria-pressed={isFollowing} title={isFollowing ? `Unfollow ${area.name}` : `Click to follow ${area.name}`} className={`relative rounded-full border px-2 ${compact ? 'py-0.5' : 'py-1'} text-[11px] font-semibold transition-all duration-150 cursor-pointer ${isFollowing ? 'border-blue-200 bg-blue-50 text-blue-900 hover:bg-blue-100 hover:shadow-sm hover:-translate-y-0.5' : 'border-emerald-200 bg-emerald-50 text-emerald-900 hover:bg-emerald-100 hover:shadow-sm hover:-translate-y-0.5'}`}>{isFollowing ? <Check size={11} className="mr-1 inline" /> : <Plus size={11} className="mr-1 inline" />}{area.name}</button>;
  })}</div>;
}

const authorLabel = (author) => [author?.displayName || 'ACC student', author?.rollNo].filter(Boolean).join(' · ');

const relativeTime = (value) => {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(value).getTime()) / 1000));
  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(value).toLocaleDateString();
};

function DiscussionItem({ discussion, currentUserId, onReply, onVote, onAcceptAnswer, onFollow, followedAreaIds, setRefreshVersion }) {
  const [replyText, setReplyText] = useState('');
  const [_replyTo, setReplyTo] = useState(null);
  const isOwnDiscussion = discussion.uploadedBy?.id === currentUserId;
  const hasAcceptedAnswer = discussion.replies?.some((reply) => reply.isAccepted) || false;

  const toggleReplyVote = async (replyId) => {
    try {
      await researchVaultApi.voteReply(discussion.id, replyId);
      setRefreshVersion((version) => version + 1);
    } catch (error) {
      toast.error(errorMessage(error));
    }
  };

  return (
    <article className={`border-b border-slate-200 py-5 first:pt-1 ${isOwnDiscussion ? '!bg-blue-50/70 border-l-4 border-l-blue-600 pl-4 ring-1 ring-blue-200' : ''}`}>
      <div className="flex flex-wrap items-center gap-2">
        <h2 className="text-xl font-bold leading-snug text-slate-950">{discussion.title}</h2>
        {discussion.isResolved && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[11px] font-bold text-emerald-900"><Check size={12} /> Resolved</span>}
      </div>
      <p className="mt-3 whitespace-pre-wrap text-base leading-7 text-left text-slate-700">{discussion.content}</p>
      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
        <p className={`text-xs font-medium ${isOwnDiscussion ? 'text-blue-700' : 'text-slate-600'}`}>{authorLabel(discussion.uploadedBy)}{discussion.uploadedBy?.role === 'FACULTY' ? ' · Verified faculty' : ''}</p>
        <TagList areas={discussion.researchAreas?.map((entry) => entry.researchArea) || []} onFollow={onFollow} followedAreaIds={followedAreaIds} compact />
      </div>
      <div className="mt-3 flex items-center gap-4">
        <button onClick={() => onVote(discussion.id)} aria-pressed={discussion.hasVoted || false} className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${discussion.hasVoted ? 'text-[var(--color-secondary)]' : 'text-slate-600 hover:text-[var(--color-primary-accent)]'}`}><ThumbsUp size={14} fill={discussion.hasVoted ? 'currentColor' : 'none'} /> {discussion.voteCount ?? discussion._count?.votes ?? 0}</button>
        <span className="text-xs text-slate-500">{discussion._count?.replies || 0} replies</span>
      </div>
      {discussion.replies?.length > 0 && <div className="mt-4 space-y-3 border-t border-slate-200 pt-4">{discussion.replies.map((entry) => {
        const isOwnReply = entry.uploadedBy?.id === currentUserId;
        return (
          <div key={entry.id} className={`w-[calc(100%-2rem)] rounded-xl border px-3 py-3 ${isOwnReply ? 'ml-auto border-blue-200 bg-blue-50/80 text-right' : 'mr-auto border-emerald-200 bg-emerald-50/40 text-left'}`}>
            {entry.isAccepted && <p className="mb-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-1 text-[10px] font-bold uppercase text-emerald-800"><CheckCircle2 size={12} /> Accepted answer</p>}
            <header className="flex flex-wrap items-center gap-2 mb-2 justify-end">
              <span className={`font-semibold text-sm ${isOwnReply ? 'text-blue-900' : 'text-slate-900'}`}>{entry.uploadedBy?.displayName || 'ACC student'}</span>
              {entry.uploadedBy?.rollNo && <span className="text-xs text-slate-500">{entry.uploadedBy.rollNo}</span>}
              <time className="text-xs text-slate-400" dateTime={entry.createdAt}>{relativeTime(entry.createdAt)}</time>
              {entry.uploadedBy?.role === 'FACULTY' && <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-800"><UserRoundCheck size={10} /> Verified faculty</span>}
            </header>
            <p className="text-sm leading-6 text-slate-700">{entry.content}</p>
            <footer className="mt-3 flex items-center gap-4 pt-2 border-t border-slate-100 justify-end">
              <button onClick={() => toggleReplyVote(entry.id)} aria-pressed={entry.hasVoted || false} className={`inline-flex items-center gap-1.5 text-xs font-semibold transition-colors ${entry.hasVoted ? 'text-[var(--color-secondary)]' : 'text-slate-600 hover:text-[var(--color-primary-accent)]'}`}><ThumbsUp size={14} fill={entry.hasVoted ? 'currentColor' : 'none'} /> {entry.voteCount || 0}</button>
              <button onClick={() => setReplyTo(entry.id)} className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-[var(--color-primary-accent)]"><MessageCircle size={14} /> Reply</button>
              {isOwnDiscussion && !hasAcceptedAnswer && <button type="button" onClick={() => onAcceptAnswer(discussion.id, entry.id)} className={`inline-flex items-center gap-1 text-[11px] font-semibold text-[var(--color-primary-accent)] hover:text-[var(--color-secondary)]`}><CheckCircle2 size={13} /> Mark as answer</button>}
            </footer>
            {entry.replies?.map((child) => {
              const isOwnNestedReply = child.uploadedBy?.id === currentUserId;
              return (
                <div key={child.id} className={`mt-2 w-[calc(100%-1.5rem)] rounded-lg border px-3 py-3 ${isOwnNestedReply ? 'ml-auto border-blue-200 bg-blue-50/80 text-right' : 'mr-auto border-emerald-200 bg-emerald-50/40 text-left'}`}>
                  <header className="flex flex-wrap items-center gap-2 mb-2 justify-end">
                    <span className={`font-semibold text-sm ${isOwnNestedReply ? 'text-blue-900' : 'text-slate-900'}`}>{child.uploadedBy?.displayName || 'ACC student'}</span>
                    {child.uploadedBy?.rollNo && <span className="text-xs text-slate-500">{child.uploadedBy.rollNo}</span>}
                    <time className="text-xs text-slate-400" dateTime={child.createdAt}>{relativeTime(child.createdAt)}</time>
                  </header>
                  <p className="text-sm text-slate-600">{child.content}</p>
                  <footer className="mt-2 flex items-center gap-3 pt-2 border-t border-slate-100 justify-end">
                    <button onClick={() => toggleReplyVote(child.id)} aria-pressed={child.hasVoted || false} className={`inline-flex items-center gap-1.5 text-xs font-semibold ${child.hasVoted ? 'text-blue-700' : 'text-slate-500 hover:text-blue-700'}`}><ThumbsUp size={14} fill={child.hasVoted ? 'currentColor' : 'none'} /> {child.voteCount || 0}</button>
                  </footer>
                </div>
              );
            })}
          </div>
        );
      })}</div>}
      <form onSubmit={(event) => { event.preventDefault(); if (replyText.trim()) { onReply(discussion.id, replyText); setReplyText(''); } }} className="mt-3 flex gap-2">
        <input value={replyText} onChange={(event) => setReplyText(event.target.value)} placeholder="Add a reply" className="min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm" />
        <button aria-label="Send reply" className="rounded-md bg-[var(--color-secondary)] px-3 text-white transition-colors hover:bg-[var(--color-primary-accent)]"><Send size={15} /></button>
      </form>
    </article>
  );
}