import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function Landing() {
  return (
    <div className="bg-background font-body-md text-on-background antialiased min-h-screen overflow-x-hidden">
      <header className="fixed top-4 md:top-6 left-0 right-0 w-full z-50 px-margin-mobile md:px-margin-desktop">
        <div className="max-w-container-max mx-auto h-12 md:h-14 bg-surface/40 backdrop-blur-2xl rounded-full border border-white/40 shadow-md flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-black text-[10px] tracking-wider">
                <img src="./acc_logo.png" alt="acc_logo" />
              </div>
              <span className="font-bold text-on-surface tracking-tight text-sm uppercase">IIT Patna</span>
            </div>
            <div className="h-4 w-[1px] bg-outline-variant/30"></div>
            <nav className="hidden md:flex items-center gap-6">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-on-surface-variant">Student Mentorship Program</span>
            </nav>
          </div>
          <div className="flex items-center gap-4 md:gap-6">
            <Link to="/login" className="text-[13px] font-semibold bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent hover:drop-shadow-sm transition-all duration-300 cursor-pointer border border-primary/20 hover:border-primary/50 hover:bg-primary/5 px-4 py-1.5 rounded-full shadow-sm hover:shadow-[0_2px_10px_rgba(59,130,246,0.15)] active:scale-95 flex items-center justify-center">
              Log in
            </Link>
            <Link to="/signup" className="cursor-pointer">
              <button className="bg-gradient-to-r from-primary to-indigo-500 hover:from-primary hover:to-indigo-400 text-white pl-5 pr-1.5 py-1.5 rounded-full text-[13px] font-semibold flex items-center gap-3 hover:shadow-[0_4px_15px_rgba(59,130,246,0.3)] transition-all duration-300 border border-primary/50 shadow-sm cursor-pointer hover:-translate-y-0.5 active:translate-y-0 active:scale-95">
                Register
                <div className="w-7 h-7 rounded-full border border-white/30 bg-white/20 flex items-center justify-center pointer-events-none">
                  <span className="material-symbols-outlined text-[14px]">arrow_outward</span>
                </div>
              </button>
            </Link>
          </div>
        </div>
      </header>

      <main className="w-full">
        <div className="flex flex-col w-full overflow-hidden relative">
          {/* Ambient Background Gradients */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
            {/* Light blue glow on the left */}
            <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[70%] bg-blue-300/30 blur-[140px] rounded-full mix-blend-multiply"></div>
            {/* Soft yellow/amber glow on the right */}
            <div className="absolute top-[-5%] right-[-10%] w-[60%] h-[70%] bg-amber-200/40 blur-[140px] rounded-full mix-blend-multiply"></div>
            {/* Subtle blue at the bottom */}
            <div className="absolute bottom-[10%] left-[20%] w-[50%] h-[50%] bg-indigo-200/20 blur-[140px] rounded-full mix-blend-multiply"></div>
          </div>

          {/* Hero Section */}
          <section className="relative z-10 w-full pt-36 md:pt-44 lg:pt-52 pb-6 px-margin-mobile md:px-margin-desktop flex flex-col items-center justify-center text-center">

            {/* Main Headline */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px] leading-[1.05] font-semibold text-[#111827] max-w-4xl mx-auto tracking-tight mb-6 relative z-10"
            >
              Unlock <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent drop-shadow-[0_0_16px_rgba(59,130,246,0.35)]">potential</span> with <br />
              <span className="font-serif italic font-normal tracking-normal text-[#111827]">expert mentorship</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
              className="text-base sm:text-lg md:text-xl text-on-surface-variant/70 max-w-3xl mx-auto mb-6 text-center leading-relaxed px-4"
            >
              Bridging driven juniors with <span className="font-semibold text-primary/90 drop-shadow-[0_0_10px_rgba(59,130,246,0.25)]">experienced seniors</span> to foster academic growth, <br className="hidden md:block" /> build <span className="font-semibold text-primary/90 drop-shadow-[0_0_10px_rgba(59,130,246,0.25)]">lasting connections</span>, and strengthen our campus community.
            </motion.p>

            {/* Network Visualization Integrated */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
              className="relative w-full max-w-[1400px] mx-auto h-[240px] sm:h-[300px] md:h-[360px] mb-6 select-none pointer-events-none"
            >
              {/* Desktop SVG */}
              <svg className="hidden md:block absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet" viewBox="0 0 1400 300">
                <g className="text-outline-variant/40" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M 220,150 L 580,150" />
                  <path d="M 150,80 C 250,80 400,150 580,150" />
                  <path d="M 150,220 C 250,220 400,150 580,150" />
                  <path d="M 820,150 L 1180,150" />
                  <path d="M 820,150 C 1000,150 1150,80 1250,80" />
                  <path d="M 820,150 C 1000,150 1150,220 1250,220" />
                </g>
                <circle className="shadow-sm" cx="150" cy="80" fill="#ffffff" r="22" stroke="#f1f5f9" strokeWidth="1" />
                <text fill="#22c55e" fontFamily="Material Symbols Outlined" fontSize="20" textAnchor="middle" x="150" y="86">bolt</text>
                <circle className="shadow-md" cx="220" cy="150" fill="#ffffff" r="26" stroke="#f1f5f9" strokeWidth="1" />
                <circle cx="212" cy="150" fill="#3b82f6" r="8" />
                <circle cx="228" cy="150" fill="#60a5fa" r="8" />
                <circle className="shadow-sm" cx="150" cy="220" fill="#ffffff" r="22" stroke="#f1f5f9" strokeWidth="1" />
                <text fill="#ef4444" fontFamily="Material Symbols Outlined" fontSize="20" textAnchor="middle" x="150" y="226">layers</text>
                <rect fill="#ffffff" fillOpacity="0.9" height="80" rx="12" stroke="#f1f5f9" strokeWidth="1" width="360" x="520" y="110" />
                <foreignObject height="80" width="360" x="520" y="110">
                  <div className="flex flex-wrap items-center justify-center gap-2 p-4 h-full">
                    <span className="px-3 py-1 bg-surface-container-low/50 text-on-surface-variant text-[10px] rounded-full border border-outline-variant/20">#Mentorship</span>
                    <span className="px-3 py-1 bg-surface-container-low/50 text-on-surface-variant text-[10px] rounded-full border border-outline-variant/20">#Growth</span>
                    <span className="px-3 py-1 bg-surface-container-low/50 text-on-surface-variant text-[10px] rounded-full border border-outline-variant/20">#IITPatna</span>
                    <span className="px-3 py-1 bg-surface-container-low/50 text-on-surface-variant text-[10px] rounded-full border border-outline-variant/20">#FutureLeaders</span>
                  </div>
                </foreignObject>
                <rect fill="#f8fafc" height="24" rx="12" stroke="#e2e8f0" width="64" x="350" y="138" />
                <text fill="#475569" fontFamily="Inter" fontSize="9" fontWeight="600" textAnchor="middle" x="382" y="154">Collab</text>
                <rect fill="#f8fafc" height="24" rx="12" stroke="#e2e8f0" width="64" x="968" y="138" />
                <text fill="#475569" fontFamily="Inter" fontSize="9" fontWeight="600" textAnchor="middle" x="1000" y="154">Connect</text>
                <image className="rounded-full" height="48" href="https://lh3.googleusercontent.com/aida-public/AB6AXuBSFBM1WxMA2hkmzYRRcW13DwIQgaytFuRJV6X8uGpfJTmGZ7uid7fXjsnZCEVw1ZFVuyP72K2jFNTF9hKW0HUFO-LggoHI8jjtqhEpdXaBQnhoXDY1xJPIuOsvNLDInHp0E0--J9v007H4tSyk_xfAYOo8fiM0UkkQN7Gw0hZByNyFaB-kXtDkJVtWf2hoiXjLUSzqOmn_1UG2oJiqFlMtuCosxiN4Ci-nOCckOSLWN5EVnWaS-9s" width="48" x="1230" y="56" />
                <image className="rounded-full" height="48" href="https://lh3.googleusercontent.com/aida-public/AB6AXuAx230VnL2KsOgS-VVPg8J1IpdSXnGrjrv4x7l3Pq_zttANY8EtBUi47ZtxAZIl-JDMQuDCQ1f4sXs9fYNE2ZdD6q81y0wYokTQCLWw3mI7B3ExmbXUz32duXTYaVSl9hbEfp4JRRY7-C9534ufvPllbEm6pcXLJk_yygvuVYDQiikEVm_Z5Uv21i3HuUuuatuWL1kjuVkLTCz7AJrq93MjZBIQL4mV3SVHcWhEkdgeMKYCvmih2yQ" width="48" x="1180" y="126" />
                <image className="rounded-full" height="48" href="https://lh3.googleusercontent.com/aida-public/AB6AXuD89xTCkqQOnmQiOftaU-0eu1nhEnlUtiD0fp6ZLOdsSgMKmO5yKLBOwpzVTWpyNTeKhh3uNeiKobxs_jUy63UlXZ-nrKLsb8romKJ_e1Px-wwXd0Qsv-GeMkozQMHuwuW2pRxGD93YUCbkLdhVc_3x03_YgygEPjkqj3n13CILV0tmo2QI4ZrcqZE5HjlAdr8bOk3C2pocGng86XyMUONyE9XKvcExsIPvhc29eCfQKVNC6sWxsgU" width="48" x="1230" y="196" />
              </svg>

              {/* Mobile SVG */}
              <svg className="block md:hidden absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid meet" viewBox="0 0 800 300">
                <g className="text-outline-variant/40" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M 120,150 L 280,150" />
                  <path d="M 50,80 C 150,80 200,150 280,150" />
                  <path d="M 50,220 C 150,220 200,150 280,150" />
                  <path d="M 520,150 L 676,150" />
                  <path d="M 520,150 C 620,150 670,80 726,80" />
                  <path d="M 520,150 C 620,150 670,220 726,220" />
                </g>
                <circle className="shadow-sm" cx="50" cy="80" fill="#ffffff" r="22" stroke="#f1f5f9" strokeWidth="1" />
                <text fill="#22c55e" fontFamily="Material Symbols Outlined" fontSize="20" textAnchor="middle" x="50" y="86">bolt</text>
                <circle className="shadow-md" cx="120" cy="150" fill="#ffffff" r="26" stroke="#f1f5f9" strokeWidth="1" />
                <circle cx="112" cy="150" fill="#3b82f6" r="8" />
                <circle cx="128" cy="150" fill="#60a5fa" r="8" />
                <circle className="shadow-sm" cx="50" cy="220" fill="#ffffff" r="22" stroke="#f1f5f9" strokeWidth="1" />
                <text fill="#ef4444" fontFamily="Material Symbols Outlined" fontSize="20" textAnchor="middle" x="50" y="226">layers</text>
                <rect fill="#ffffff" fillOpacity="0.9" height="80" rx="12" stroke="#f1f5f9" strokeWidth="1" width="360" x="220" y="110" />
                <foreignObject height="80" width="360" x="220" y="110">
                  <div className="flex flex-wrap items-center justify-center gap-2 p-4 h-full">
                    <span className="px-3 py-1 bg-surface-container-low/50 text-on-surface-variant text-[10px] rounded-full border border-outline-variant/20">#Mentorship</span>
                    <span className="px-3 py-1 bg-surface-container-low/50 text-on-surface-variant text-[10px] rounded-full border border-outline-variant/20">#Growth</span>
                    <span className="px-3 py-1 bg-surface-container-low/50 text-on-surface-variant text-[10px] rounded-full border border-outline-variant/20">#IITPatna</span>
                    <span className="px-3 py-1 bg-surface-container-low/50 text-on-surface-variant text-[10px] rounded-full border border-outline-variant/20">#FutureLeaders</span>
                  </div>
                </foreignObject>
                <rect fill="#f8fafc" height="24" rx="12" stroke="#e2e8f0" width="64" x="120" y="138" />
                <text fill="#475569" fontFamily="Inter" fontSize="9" fontWeight="600" textAnchor="middle" x="152" y="154">Collab</text>
                <rect fill="#f8fafc" height="24" rx="12" stroke="#e2e8f0" width="64" x="616" y="138" />
                <text fill="#475569" fontFamily="Inter" fontSize="9" fontWeight="600" textAnchor="middle" x="648" y="154">Connect</text>
                <image className="rounded-full" height="48" href="https://lh3.googleusercontent.com/aida-public/AB6AXuBSFBM1WxMA2hkmzYRRcW13DwIQgaytFuRJV6X8uGpfJTmGZ7uid7fXjsnZCEVw1ZFVuyP72K2jFNTF9hKW0HUFO-LggoHI8jjtqhEpdXaBQnhoXDY1xJPIuOsvNLDInHp0E0--J9v007H4tSyk_xfAYOo8fiM0UkkQN7Gw0hZByNyFaB-kXtDkJVtWf2hoiXjLUSzqOmn_1UG2oJiqFlMtuCosxiN4Ci-nOCckOSLWN5EVnWaS-9s" width="48" x="702" y="56" />
                <image className="rounded-full" height="48" href="https://lh3.googleusercontent.com/aida-public/AB6AXuAx230VnL2KsOgS-VVPg8J1IpdSXnGrjrv4x7l3Pq_zttANY8EtBUi47ZtxAZIl-JDMQuDCQ1f4sXs9fYNE2ZdD6q81y0wYokTQCLWw3mI7B3ExmbXUz32duXTYaVSl9hbEfp4JRRY7-C9534ufvPllbEm6pcXLJk_yygvuVYDQiikEVm_Z5Uv21i3HuUuuatuWL1kjuVkLTCz7AJrq93MjZBIQL4mV3SVHcWhEkdgeMKYCvmih2yQ" width="48" x="652" y="126" />
                <image className="rounded-full" height="48" href="https://lh3.googleusercontent.com/aida-public/AB6AXuD89xTCkqQOnmQiOftaU-0eu1nhEnlUtiD0fp6ZLOdsSgMKmO5yKLBOwpzVTWpyNTeKhh3uNeiKobxs_jUy63UlXZ-nrKLsb8romKJ_e1Px-wwXd0Qsv-GeMkozQMHuwuW2pRxGD93YUCbkLdhVc_3x03_YgygEPjkqj3n13CILV0tmo2QI4ZrcqZE5HjlAdr8bOk3C2pocGng86XyMUONyE9XKvcExsIPvhc29eCfQKVNC6sWxsgU" width="48" x="702" y="196" />
              </svg>
            </motion.div>


          </section>

          {/* Bento Grid Section */}
          <section className="relative z-10 w-full px-margin-mobile md:px-margin-desktop py-32">
            <div className="max-w-container-max mx-auto">
              <div className="mb-20 text-center">
                <h2 className="text-4xl md:text-5xl font-bold text-[#0f172a] mb-6 tracking-tight">Why join the Program?</h2>
                <p className="font-body-md text-on-surface-variant/80 max-w-2xl mx-auto text-lg leading-relaxed">Everything you need to excel academically and professionally at IIT Patna, organized in one intuitive platform.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 auto-rows-[340px]">
                {/* Large Card 1 - Curated Groups */}
                <div className="md:col-span-2 relative bg-white/40 backdrop-blur-sm rounded-3xl p-10 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden group hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-500">
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-primary">search_insights</span>
                      </div>
                      <h3 className="text-2xl font-bold text-[#0f172a] mb-4">Curated Groups</h3>
                      <p className="font-body-md text-on-surface-variant/80 max-w-md text-lg">Our allocation engine intelligently matches you based on your interests, branch, and goals for maximum synergy.</p>
                    </div>
                  </div>
                </div>

                {/* Small Card 1 - Expert Mentorship */}
                <div className="relative bg-white/40 backdrop-blur-sm rounded-3xl p-10 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden group hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-500">
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-tertiary/5 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-tertiary">route</span>
                      </div>
                      <h3 className="text-xl font-bold text-[#0f172a] mb-2">Expert Mentorship</h3>
                      <p className="font-body-md text-on-surface-variant/80 text-sm leading-relaxed">Get paired with senior students who have navigated the challenges you'll face—from academics to internships.</p>
                    </div>
                    <div className="mt-auto">
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-2 overflow-hidden">
                        <div className="bg-primary h-full rounded-full w-2/3"></div>
                      </div>
                      <p className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest text-right">Guidance</p>
                    </div>
                  </div>
                </div>

                {/* Small Card 2 - Trusted Community */}
                <div className="relative bg-white/40 backdrop-blur-sm rounded-3xl p-10 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden group hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-500">
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div>
                      <div className="w-12 h-12 rounded-2xl bg-secondary/5 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-secondary">forum</span>
                      </div>
                      <h3 className="text-xl font-bold text-[#0f172a] mb-2">Trusted Community</h3>
                      <p className="font-body-md text-on-surface-variant/80 text-sm leading-relaxed">A secure, verified platform exclusively for IIT Patna students, ensuring a safe and focused environment.</p>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-[9px] font-bold uppercase tracking-tighter border border-slate-100">Verified</span>
                      <span className="px-3 py-1 rounded-full bg-slate-50 text-slate-500 text-[9px] font-bold uppercase tracking-tighter border border-slate-100">Secure</span>
                    </div>
                  </div>
                </div>

                {/* Large Card 2 - Stats block */}
                <div className="md:col-span-2 relative bg-white/40 backdrop-blur-sm rounded-3xl p-10 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.02)] overflow-hidden group hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-500">
                  <div className="relative z-10 h-full flex flex-col md:flex-row gap-12 items-center">
                    <div className="flex-1">
                      <div className="w-12 h-12 rounded-2xl bg-surface-tint/5 flex items-center justify-center mb-6">
                        <span className="material-symbols-outlined text-surface-tint">analytics</span>
                      </div>
                      <h3 className="text-2xl font-bold text-[#0f172a] mb-4">Growing Network</h3>
                      <p className="font-body-md text-on-surface-variant/80 mb-8 text-lg">Join hundreds of students and mentors already building the future of IIT Patna together.</p>
                      <Link to="/signup">
                        <button className="text-primary font-bold text-sm hover:text-surface-tint flex items-center gap-2 transition-colors">
                          Join the community <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                        </button>
                      </Link>
                    </div>
                    <div className="flex-1 w-full flex justify-end">
                      <div className="grid grid-cols-2 gap-4 w-full h-full">
                        <div className="flex flex-col items-center justify-center p-4 bg-white/50 rounded-2xl border border-white/50 hover:bg-white/70 transition-colors">
                          <span className="text-4xl font-bold text-[#0f172a]">200+</span>
                          <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mt-1">Students</span>
                        </div>
                        <div className="flex flex-col items-center justify-center p-4 bg-white/50 rounded-2xl border border-white/50 hover:bg-white/70 transition-colors">
                          <span className="text-4xl font-bold text-[#0f172a]">50+</span>
                          <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mt-1">Mentors</span>
                        </div>
                        <div className="col-span-2 flex flex-col items-center justify-center p-4 bg-white/50 rounded-2xl border border-white/50 hover:bg-white/70 transition-colors">
                          <span className="text-4xl font-bold text-[#0f172a]">30+</span>
                          <span className="text-[10px] font-bold text-on-surface-variant/60 uppercase tracking-widest mt-1">Mentorship Groups</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </main>

      <footer className="w-full bg-white py-16 border-t border-slate-100">
        <div className="max-w-container-max mx-auto px-margin-desktop flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <img src="./acc_logo.png" alt="ACC Logo" className="w-8 h-8 object-contain" />
              <img src="./gym_logo.png" alt="Gymkhana Logo" className="w-10 h-10 object-contain" />
              <span className="text-[11px] font-bold uppercase tracking-widest text-slate-700">IIT PATNA</span>
            </div>
            <span className="text-[10px] font-semibold text-slate-400">© 2026 IIT Patna · Student Mentorship Program</span>
          </div>
          <div className="flex gap-8">
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Cultivating Excellence</span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Building Connections</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
