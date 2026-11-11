import { useState } from "react";
import { Info, X } from "lucide-react";
import { Modal, outlineButton } from "../../admin/careers/components/ui";
import { aboutBannerDismissed, dismissAboutBanner } from "../lib/about";

// What this section is (P5-T7, F-28): off-campus openings collected from company job boards and
// student links, reviewed by ACC; not the placement cell's process. Text only.
export function AboutPanel({ onClose }) {
  return (
    <Modal title="About these openings" onClose={onClose}
      footer={<button type="button" className={outlineButton} onClick={onClose}>Close</button>}>
      <div className="space-y-4 text-sm text-slate-600 leading-relaxed">
        <section>
          <h3 className="font-bold text-[var(--color-primary)]">Where they come from</h3>
          <p>Internships and entry-level jobs collected from companies' own job boards, and from links that students share. They are off-campus openings: you apply on the company's site, not through the portal.</p>
        </section>
        <section>
          <h3 className="font-bold text-[var(--color-primary)]">Checked by ACC</h3>
          <p>An ACC admin reviews every opening before it appears here. Details the source doesn't state (pay, deadline, eligibility) are shown as not stated, never guessed. Always confirm the details on the company's page before you apply.</p>
        </section>
        <section>
          <h3 className="font-bold text-[var(--color-primary)]">Not the placement cell</h3>
          <p>ACC does not run the hiring for these roles, and this is separate from the institute's campus placement and internship process.</p>
        </section>
        <section>
          <h3 className="font-bold text-[var(--color-primary)]">Something wrong with an opening?</h3>
          <p>Use <span className="font-semibold">Report a problem</span> on its page (closed, wrong pay or eligibility, not a real job). ACC sees the reason, not your name.</p>
        </section>
        <section>
          <h3 className="font-bold text-[var(--color-primary)]">Found an opening that isn't here?</h3>
          <p>Use <span className="font-semibold">Share a job link</span>. ACC reviews it, and you can follow its status under "Your shared links".</p>
        </section>
      </div>
    </Modal>
  );
}

// A one-time banner on the jobs page; dismissing it is remembered in this browser.
export function AboutBanner({ onOpen }) {
  const [hidden, setHidden] = useState(aboutBannerDismissed);
  if (hidden) return null;
  return (
    <div role="note" className="flex items-start gap-3 px-4 py-3 rounded-xl border border-blue-100 bg-[var(--color-secondary-light)] text-sm text-slate-700">
      <Info size={16} className="mt-0.5 shrink-0 text-[var(--color-secondary)]" aria-hidden="true" />
      <p className="flex-1">
        These are off-campus openings collected from company job boards and student links, and checked by ACC. You apply on the company's site; this is separate from the placement cell's process.{" "}
        <button type="button" onClick={onOpen} className="font-semibold text-[var(--color-secondary)] hover:underline cursor-pointer">More about these openings</button>
      </p>
      <button type="button" onClick={() => { dismissAboutBanner(); setHidden(true); }} aria-label="Dismiss this note" className="p-1 rounded-lg text-slate-500 hover:bg-white/70 cursor-pointer">
        <X size={16} />
      </button>
    </div>
  );
}
