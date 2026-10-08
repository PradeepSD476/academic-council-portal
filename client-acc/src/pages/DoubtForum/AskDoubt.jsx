import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import toast from "react-hot-toast";
import { apiError, doubtApi } from "../../api/doubtApi";
import { MarkdownEditor } from "../../components/Markdown";
import { buildImageMap } from "../../lib/markdown";
import { DOUBT_CATEGORIES } from "./constants";

const TITLE_MIN = 8;
const TITLE_MAX = 150;

const INPUT =
  "w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm text-[var(--color-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)] transition bg-sky-50/50";

// Used for both "Ask a doubt" (/dashboard/doubts/ask) and editing one (/dashboard/doubts/:id/edit).
export default function AskDoubt() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [body, setBody] = useState("");
  const [images, setImages] = useState({});
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    let active = true;
    (async () => {
      try {
        const res = await doubtApi.getDoubt(id);
        const doubt = res.data.data;
        if (!active) return;
        if (!doubt.canEdit) {
          toast.error("You can only edit your own doubt.");
          navigate(`/dashboard/doubts/${id}`, { replace: true });
          return;
        }
        setTitle(doubt.title);
        setCategory(doubt.category);
        setBody(doubt.rawBody);
        setImages(buildImageMap(doubt.rawBody, doubt.body));
        setLoading(false);
      } catch (err) {
        toast.error(apiError(err, "Could not load this doubt."));
        navigate("/dashboard/doubts", { replace: true });
      }
    })();
    return () => {
      active = false;
    };
  }, [id, isEdit, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    const cleanTitle = title.trim();
    if (cleanTitle.length < TITLE_MIN) return toast.error(`Title must be at least ${TITLE_MIN} characters.`);
    if (!category) return toast.error("Please choose a category.");
    if (!body.trim()) return toast.error("Please describe your doubt.");

    setSaving(true);
    try {
      const payload = { title: cleanTitle, category, body: body.trim() };
      if (isEdit) {
        await doubtApi.updateDoubt(id, payload);
        toast.success("Doubt updated.");
        navigate(`/dashboard/doubts/${id}`);
      } else {
        const res = await doubtApi.createDoubt(payload);
        toast.success("Your doubt has been posted.");
        navigate(`/dashboard/doubts/${res.data.data.id}`);
      }
    } catch (err) {
      toast.error(apiError(err, "Could not save your doubt."));
    } finally {
      setSaving(false);
    }
  };

  const back = () => navigate(isEdit ? `/dashboard/doubts/${id}` : "/dashboard/doubts");

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <button
          type="button"
          onClick={back}
          className="flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-[var(--color-primary)] transition-colors cursor-pointer mb-4 max-md:ml-8"
        >
          <ArrowLeft size={16} /> Back
        </button>
        <div className="flex items-center gap-3 mb-1">
          <div className="w-[3px] h-6 bg-[var(--color-secondary)] rounded-full" />
          <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-primary)] tracking-tight">
            {isEdit ? "Edit your doubt" : "Ask a doubt"}
          </h1>
        </div>
        <p className="text-slate-500 text-sm ml-4">A clear title and enough detail get you a faster answer.</p>
      </div>

      {loading ? (
        <div className="h-64 rounded-2xl border border-slate-200 bg-white animate-pulse" />
      ) : (
        <form onSubmit={handleSubmit} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-xs flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <label htmlFor="doubt-title" className="text-xs font-semibold text-slate-600">
              Title <span className="text-[var(--color-secondary)]">*</span>
            </label>
            <input
              id="doubt-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={TITLE_MAX}
              placeholder="e.g. How do I apply for a duplicate ID card?"
              className={INPUT}
            />
            <span className="text-[10px] text-slate-400 self-end">
              {title.length}/{TITLE_MAX}
            </span>
          </div>

          <div className="flex flex-col gap-1.5 sm:max-w-xs">
            <label htmlFor="doubt-category" className="text-xs font-semibold text-slate-600">
              Category <span className="text-[var(--color-secondary)]">*</span>
            </label>
            <select id="doubt-category" value={category} onChange={(e) => setCategory(e.target.value)} className={INPUT}>
              <option value="" disabled>
                Select category…
              </option>
              {DOUBT_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1.5">
            <label htmlFor="doubt-body" className="text-xs font-semibold text-slate-600">
              Details <span className="text-[var(--color-secondary)]">*</span>
            </label>
            <MarkdownEditor
              id="doubt-body"
              value={body}
              onChange={setBody}
              rows={10}
              initialImages={images}
              placeholder={"What exactly do you need to know? What have you already tried?\n\nMarkdown works: **bold**, lists, links, and images."}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-1">
            <button type="button" onClick={back} className="px-5 py-2.5 text-xs font-semibold text-slate-600 border border-slate-200 rounded-xl hover:bg-sky-50 transition cursor-pointer">
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2.5 text-xs font-bold bg-[var(--color-secondary)] hover:opacity-90 text-white rounded-xl shadow-xs transition disabled:opacity-60 disabled:cursor-not-allowed cursor-pointer"
            >
              {saving ? "Saving…" : isEdit ? "Save changes" : "Post doubt"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
