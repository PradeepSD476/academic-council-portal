// "Copy link" and "WhatsApp" on the job page (P7-T6, F-32).
import { useState } from "react";
import toast from "react-hot-toast";
import { Check, Link2, MessageCircle } from "lucide-react";
import { postingUrl, shareText, whatsappHref } from "../lib/share";

const button = "academic-btn-outline inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold cursor-pointer";

export default function SharePosting({ posting }) {
  const [copied, setCopied] = useState(false);
  const url = postingUrl(posting.id, window.location.origin);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      toast.success("Link copied. Batchmates log in to the portal to open it.");
    } catch {
      // No clipboard access (an http page or a blocked permission): show the link to copy by hand.
      toast(`Copy this link: ${url}`, { duration: 10000 });
    }
  };

  return (
    <>
      <button type="button" onClick={copy} className={button}>
        {copied ? <Check size={14} aria-hidden="true" /> : <Link2 size={14} aria-hidden="true" />} {copied ? "Copied" : "Copy link"}
      </button>
      <a href={whatsappHref(shareText(posting, url))} target="_blank" rel="noopener noreferrer" className={button}>
        <MessageCircle size={14} aria-hidden="true" /> Share on WhatsApp
      </a>
    </>
  );
}
