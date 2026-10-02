import { useRef } from "react";
import AsyncSelect from "react-select/async";
import { careersApi } from "../../../api/careersApi";

// Optional company field on the Career Vault experience form. Searches ACTIVE companies by name or
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
  menu: (base) => ({ ...base, borderRadius: "0.75rem", overflow: "hidden", zIndex: 30, fontSize: "0.875rem" }),
  option: (base, state) => ({
    ...base,
    cursor: "pointer",
    color: "var(--color-primary)",
    backgroundColor: state.isSelected ? "rgb(224 242 254)" : state.isFocused ? "rgb(240 249 255)" : "white",
  }),
};

export default function CompanyPicker({ inputId, value, onChange }) {
  const timer = useRef(null);

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
    <AsyncSelect
      inputId={inputId}
      cacheOptions
      defaultOptions
      isClearable
      value={value}
      onChange={onChange}
      loadOptions={loadOptions}
      placeholder="Search company…"
      noOptionsMessage={({ inputValue }) => (inputValue ? "No company matches. Leave it empty." : "Type to search")}
      loadingMessage={() => "Searching…"}
      styles={styles}
    />
  );
}
