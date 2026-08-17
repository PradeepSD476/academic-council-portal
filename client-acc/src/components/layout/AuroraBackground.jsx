import ACC_THEME from "../../config/theme";

const AuroraBackground = () => {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden bg-[var(--color-canvas)]" aria-hidden="true">
      {/* ── Vibrant Atmospheric Azure & Deep Blue Mesh Orbs ── */}
      <div 
        className="absolute -top-[15%] -left-[10%] w-[65vw] h-[65vw] max-w-[850px] max-h-[850px] rounded-full bg-gradient-to-br from-[var(--color-secondary)]/50 via-[var(--color-primary-accent)]/40 to-transparent blur-[100px] animate-aurora-1" 
      />
      <div 
        className="absolute -top-[10%] -right-[10%] w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] rounded-full bg-gradient-to-bl from-[var(--color-primary-accent)]/45 via-[var(--color-primary)]/35 to-transparent blur-[110px] animate-aurora-2" 
      />
      <div 
        className="absolute top-[35%] left-[15%] w-[55vw] h-[55vw] max-w-[750px] max-h-[750px] rounded-full bg-gradient-to-tr from-[var(--color-secondary)]/45 via-[var(--color-primary-blue)]/35 to-transparent blur-[120px] animate-aurora-3" 
      />
      <div 
        className="absolute -bottom-[10%] right-[10%] w-[65vw] h-[55vw] max-w-[850px] max-h-[750px] rounded-full bg-gradient-to-t from-[var(--color-primary-accent)]/45 via-[var(--color-secondary)]/35 to-transparent blur-[110px] animate-aurora-4" 
      />
      <div 
        className="absolute top-[60%] -left-[10%] w-[50vw] h-[50vw] max-w-[650px] max-h-[650px] rounded-full bg-gradient-to-r from-[var(--color-secondary)]/40 via-[var(--color-primary)]/35 to-transparent blur-[100px] animate-aurora-1" 
      />

      {/* ── Aceternity Light Mode Aurora Ribbons (Theme Variables) ── */}
      <div className="absolute inset-0 overflow-hidden">
        <div
          className={`
            absolute -inset-[15px] opacity-95 will-change-transform pointer-events-none
            [--white-gradient:repeating-linear-gradient(100deg,#ffffff_0%,#ffffff_7%,transparent_10%,transparent_12%,#ffffff_16%)]
            [--aurora:repeating-linear-gradient(100deg,var(--color-secondary)_10%,var(--color-primary-accent)_20%,var(--color-primary)_30%,var(--color-secondary-soft)_40%,var(--color-primary-blue)_50%)]
            [background-image:var(--white-gradient),var(--aurora)]
            [background-size:300%,_200%]
            [background-position:50%_50%,50%_50%]
            filter blur-[10px]
            after:content-[""] after:absolute after:inset-0
            after:[background-image:var(--white-gradient),var(--aurora)]
            after:[background-size:200%,_100%]
            after:animate-aurora after:[background-attachment:fixed] after:mix-blend-multiply
            [mask-image:radial-gradient(ellipse_at_80%_20%,black_45%,transparent_85%)]
          `}
        />
      </div>

      {/* Subtle Dot Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.4]"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(11,30,63,0.12) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />
    </div>
  );
};

export default AuroraBackground;

