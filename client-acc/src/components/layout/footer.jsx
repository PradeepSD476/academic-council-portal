import React from "react";
import { Link } from "react-router-dom";
import logo from "/logo.png";

function Footer() {
  return (
    <footer className="text-slate-600 mt-auto border-t border-slate-200/80 bg-white/85 backdrop-blur-2xl shadow-[0_-4px_25px_rgba(15,23,42,0.03)]">
      {/* Top bar */}
      <div className="mx-auto grid grid-cols-1 md:grid-cols-2">
        {/* Left Column */}
        <div className="bg-slate-50/60 px-6 md:px-16 py-12 border-b md:border-b-0 md:border-r border-slate-200/80">
          <div className="flex items-center mb-5">
            <Link to="/" className="flex items-center space-x-3 group">
              <img src={logo} alt="logo" className="h-12 w-auto object-contain" />
              <div>
                <p className="font-extrabold text-xl md:text-2xl text-[#0B1E3F] tracking-tight leading-snug group-hover:text-[#133E87] transition-colors">
                  Academic &amp; Career Council
                </p>
                <p className="text-xs font-bold text-[#0284C7] tracking-wider uppercase">
                  IIT Patna
                </p>
              </div>
            </Link>
          </div>

          <p className="text-slate-600 mb-6 leading-relaxed text-sm max-w-lg">
            The Academic &amp; Career Council (ACC) of IIT Patna is the premier student body under
            the Students' Gymkhana that fosters academic excellence, research culture,
            and career progression through mentorship, workshops, and student initiatives.
          </p>

          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-1">
              Contact Desk
            </h2>
            <a
              href="mailto:acc_ug@iitp.ac.in"
              className="text-[#133E87] hover:text-[#0284C7] font-semibold transition-colors text-sm inline-flex items-center gap-1.5"
            >
              <span>acc_ug@iitp.ac.in</span>
              <span className="text-[#0284C7]">↗</span>
            </a>
          </div>
        </div>

        {/* Right Column */}
        <div className="grid grid-cols-2 gap-8 bg-white/40 px-6 md:px-16 py-12">
          <div>
            <h3 className="text-xs font-extrabold text-[#0B1E3F] uppercase tracking-widest mb-4 border-b border-slate-200/80 pb-2">
              Quick Links
            </h3>
            <ul className="space-y-3 text-slate-600 text-sm font-medium">
              <li>
                <Link to="/" className="hover:text-[#133E87] transition-colors inline-block hover:translate-x-1 duration-200">
                  Home
                </Link>
              </li>
              <li>
                <a href="https://academics.iitp.ac.in" target="_blank" rel="noreferrer" className="hover:text-[#133E87] transition-colors inline-block hover:translate-x-1 duration-200">
                  Academics Portal ↗
                </a>
              </li>
              <li>
                <a href="https://www.iitp.ac.in/research/research-projects-and-resources" target="_blank" rel="noreferrer" className="hover:text-[#133E87] transition-colors inline-block hover:translate-x-1 duration-200">
                  Research Initiatives ↗
                </a>
              </li>
              <li>
                <Link to="/wings" className="hover:text-[#133E87] transition-colors inline-block hover:translate-x-1 duration-200">
                  Council Wings
                </Link>
              </li>
              <li>
                <Link to="/dashboard/courses" className="hover:text-[#133E87] transition-colors inline-block hover:translate-x-1 duration-200">
                  Resource Vault
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-extrabold text-[#0B1E3F] uppercase tracking-widest mb-4 border-b border-slate-200/80 pb-2">
              Council Info
            </h3>
            <ul className="space-y-3 text-slate-600 text-sm font-medium">
              <li>
                <Link to="/team" className="hover:text-[#133E87] transition-colors inline-block hover:translate-x-1 duration-200">
                  ACC Team
                </Link>
              </li>
              <li>
                <Link to="/administrators" className="hover:text-[#133E87] transition-colors inline-block hover:translate-x-1 duration-200">
                  Administrators
                </Link>
              </li>
              <li>
                <Link to="/devs" className="hover:text-[#133E87] transition-colors inline-block hover:translate-x-1 duration-200">
                  Web &amp; Dev Team
                </Link>
              </li>
              <li>
                <Link to="/faq" className="hover:text-[#133E87] transition-colors inline-block hover:translate-x-1 duration-200">
                  FAQs &amp; Help Desk
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-200/80 bg-slate-100/70 py-6">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row justify-between items-center text-slate-500 text-xs px-6 md:px-16 gap-4">
          <ul className="flex flex-wrap justify-center md:justify-start gap-6 font-medium">
            <li className="hover:text-slate-800 transition cursor-pointer">Student Gymkhana</li>
            <li className="hover:text-slate-800 transition cursor-pointer">Privacy Guidelines</li>
            <li className="hover:text-slate-800 transition cursor-pointer">Support</li>
          </ul>

          <p className="text-center text-slate-500 font-medium">
            &copy; 2026 Academic &amp; Career Council, IIT Patna. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
