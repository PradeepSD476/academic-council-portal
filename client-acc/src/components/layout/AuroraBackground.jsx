import React from "react";

const AuroraBackground = () => {
  return (
    <div
      className="fixed inset-0 pointer-events-none -z-10 bg-[#F8FAFC]"
      aria-hidden="true"
    >
      {/* Subtle institutional dot-grid pattern for clean structure */}
      <div
        className="absolute inset-0 opacity-[0.45]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #CBD5E1 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
      />
      {/* Soft top gradient to keep header crisp */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-white to-transparent opacity-80" />
    </div>
  );
};

export default AuroraBackground;

