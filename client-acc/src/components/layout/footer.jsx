import React from "react";
import { Link } from "react-router-dom";
import logo from "/logo.png";

function Footer() {
  return (
    <footer className="text-slate-600 mt-auto border-t border-slate-200 bg-white">
      {/* Main Grid */}
      <div className="max-w-[1280px] mx-auto px-6 lg:px-12 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Col 1: Institute Body Identity */}
        <div className="md:col-span-2 space-y-4">
          <div className="flex items-center gap-3">
            <img src={logo} alt="IIT Patna" className="h-10 w-auto object-contain" />
            <div>
              <p className="font-bold text-base text-slate-900 leading-tight">
                Academic &amp; Career Council
              </p>
              <p className="text-xs text-slate-500 font-medium">
                Students' Gymkhana · Indian Institute of Technology Patna
              </p>
            </div>
          </div>
          <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-md">
            The student-led body empowering the IIT Patna community with academic resources, career prep, peer mentorship, research initiatives, and governance support.
          </p>
          <div className="pt-2 text-xs">
            <span className="text-slate-500 font-medium">Official Contact: </span>
            <a
              href="mailto:acc_ug@iitp.ac.in"
              className="text-slate-900 font-semibold hover:underline"
            >
              acc_ug@iitp.ac.in
            </a>
          </div>
        </div>

        {/* Col 2: Academic Resources */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Academic Portals
          </h3>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-600 font-medium">
            <li>
              <Link to="/dashboard/courses" className="hover:text-slate-950 transition-colors">
                Course Repository &amp; PYQs
              </Link>
            </li>
            <li>
              <Link to="/dashboard/career-vault" className="hover:text-slate-950 transition-colors">
                Career Vault
              </Link>
            </li>
            <li>
              <Link to="/dashboard/finance-vault" className="hover:text-slate-950 transition-colors">
                Scholarships &amp; Finance
              </Link>
            </li>
            <li>
              <a
                href="https://academics.iitp.ac.in"
                target="_blank"
                rel="noreferrer"
                className="hover:text-slate-950 transition-colors"
              >
                IIT Patna Academic Portal ↗
              </a>
            </li>
          </ul>
        </div>

        {/* Col 3: Council & Governance */}
        <div>
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3">
            Council &amp; Team
          </h3>
          <ul className="space-y-2 text-xs sm:text-sm text-slate-600 font-medium">
            <li>
              <Link to="/wings" className="hover:text-slate-950 transition-colors">
                Council Wings
              </Link>
            </li>
            <li>
              <Link to="/team" className="hover:text-slate-950 transition-colors">
                Council Representatives
              </Link>
            </li>
            <li>
              <Link to="/administrators" className="hover:text-slate-950 transition-colors">
                Academic Administrators
              </Link>
            </li>
            <li>
              <Link to="/faq" className="hover:text-slate-950 transition-colors">
                Academic FAQs
              </Link>
            </li>
            <li>
              <Link to="/devs" className="hover:text-slate-950 transition-colors">
                Portal Developers
              </Link>
            </li>
          </ul>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-slate-100 bg-slate-50/80 py-4">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12 flex flex-col sm:flex-row justify-between items-center text-slate-500 text-xs gap-2">
          <p>
            &copy; {new Date().getFullYear()} Academic &amp; Career Council, IIT Patna. All rights reserved.
          </p>
          <div className="flex gap-4">
            <span>Students' Gymkhana</span>
            <span>·</span>
            <span>IIT Patna Campus, Bihta</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

