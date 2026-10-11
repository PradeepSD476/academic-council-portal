// A labelled form field. When the extractor was unsure about it, the label gets a small "Check"
// marker and the input an amber outline, so the reviewer looks at it first. Fields that share one
// flag (pay, eligibility, internship timing) sit in a FieldGroup that carries the marker once.
import { AlertTriangle } from "lucide-react";

// Amber outline for every input inside a flagged field or group.
export const unsureInputs = "[&_:is(input,select,textarea)]:border-amber-400 [&_:is(input,select,textarea)]:bg-amber-50/40";

export function CheckMark({ confidence }) {
  const known = confidence !== null && confidence !== undefined;
  return (
    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700"
      title={known ? `The extractor was unsure about this (confidence ${confidence.toFixed(2)})` : "The extractor was unsure about this"}>
      <AlertTriangle size={12} aria-hidden="true" /> Check
    </span>
  );
}

export function FieldGroup({ title, uncertain, confidence, children, className = "" }) {
  return (
    <fieldset className={`${className} ${uncertain ? unsureInputs : ""}`}>
      <legend className="flex items-center gap-2 mb-2">
        <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</span>
        {uncertain && <CheckMark confidence={confidence} />}
      </legend>
      {children}
    </fieldset>
  );
}

export default function UncertainField({ id, label, uncertain, confidence, hint, children, className = "" }) {
  return (
    <div className={`${className} ${uncertain ? unsureInputs : ""}`}>
      <div className="flex items-center gap-2">
        <label htmlFor={id} className="text-xs font-semibold text-slate-600">{label}</label>
        {uncertain && <CheckMark confidence={confidence} />}
      </div>
      <div className="mt-1">{children}</div>
      {hint && <p className="mt-1 text-[11px] text-slate-500">{hint}</p>}
    </div>
  );
}
