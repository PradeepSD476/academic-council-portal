import { useRef } from "react";
import AsyncSelect from "react-select/async";
import { careersApi } from "../../../api/careersApi";

// Company search: the optional company field on the Career Vault experience form and the jobs
// page company filter (P6-T5). Searches ACTIVE companies by name or
// alias; the value is { value: id, label: name } or null.
const styles = {
  control: (base, state) => ({
    ...base,
    minHeight: 42,
    borderRadius: "0.75rem",
    backgroundColor: "rgb(240 249 255 / 0.5)",
    borderColor: state.isFocused ? "var(--color-secondary)" : "#e2e8f0",
    boxShadow: "none",
    fontSize: "0.875rem",
    "&:hover": { borderColor: state.isFocused ? "var(--color-secondary)" : "#cbd5e1" },
  }),
  placeholder: (base) => ({ ...base, color: "#94a3b8" }),
  singleValue: (base) => ({ ...base, color: "var(--color-primary)" }),
  menu: (base) => ({ ...base, borderRadius: "0.75rem", overflow: "hidden", fontSize: "0.875rem" }),
  menuPortal: (base) => ({ ...base, zIndex: 1000 }),
  option: (base, state) => ({
    ...base,
    cursor: "pointer",
    color: "var(--color-primary)",
    backgroundColor: state.isSelected ? "rgb(224 242 254)" : state.isFocused ? "rgb(240 249 255)" : "white",
  }),
};

// plain (B-47): white box with the admin experience editor's corners and blue focus ring.
const plainStyles = {
  ...styles,
  control: (base, state) => ({
    ...styles.control(base, state),
    borderRadius: "0.5rem",
    backgroundColor: "white",
    borderColor: state.isFocused ? "#2563eb" : "#e2e8f0",
    boxShadow: state.isFocused ? "0 0 0 2px rgb(37 99 235 / 0.1)" : "none",
    "&:hover": { borderColor: state.isFocused ? "#2563eb" : "#cbd5e1" },
  }),
  singleValue: (base) => ({ ...base, color: "#0f172a" }),
};

export default function CompanyPicker({ inputId, value, onChange, noMatchText = "No company matches. Leave it empty.", plain = false }) {
  const timer = useRef(null);
  const wrapRef = useRef(null);

  // B-43: the list follows the box while a page or drawer scrolls (a phone keyboard opening scrolls
  // it), and closes only once the box itself is out of sight or under something else.
  const boxHidden = () => {
    const box = wrapRef.current?.querySelector(".cp__control");
    if (!box) return true;
    const r = box.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + Math.min(20, r.width / 2), r.top + r.height / 2);
    return !hit || !box.contains(hit);
  };

  // Debounced so typing doesn't send a request per key.
  const loadOptions = (q) =>
    new Promise((resolve) => {
      clearTimeout(timer.current);
      timer.current = setTimeout(async () => {
        try {
          const companies = await careersApi.searchCompanies(q.trim() || undefined);
          resolve(companies.map((c) => ({ value: c.id, label: c.name })));
        } catch {
          resolve([]);
        }
      }, 250);
    });

  return (
    <div ref={wrapRef}>
      <AsyncSelect
        inputId={inputId}
        cacheOptions
        defaultOptions
        isClearable
        value={value}
        onChange={onChange}
        loadOptions={loadOptions}
        placeholder="Search company…"
        noOptionsMessage={({ inputValue }) => (inputValue ? noMatchText : "Type to search")}
        loadingMessage={() => "Searching…"}
        styles={plain ? plainStyles : styles}
        // The list is drawn on <body> so a card with its own stacking context (backdrop blur) can't
        // cover it; fixed position follows the box.
        classNamePrefix="cp"
        menuPortalTarget={document.body}
        menuPosition="fixed"
        menuPlacement="auto"
        closeMenuOnScroll={(e) => !(e.target instanceof Element && e.target.closest(".cp__menu-list")) && boxHidden()}
      />
    </div>
  );
}
