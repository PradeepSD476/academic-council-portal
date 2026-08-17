import React from 'react';
import { motion } from 'framer-motion';
import { X, Mail, Copy, User } from 'lucide-react';
import { useToast } from './ui/toast';

export default function ProfileModal({ user, onClose }) {
  const toast = useToast();
  if (!user) return null;

  const roleLabels = {
    MENTOR: 'Mentor',
    CO_MENTOR: 'Co-Mentor',
    MENTEE: 'Mentee',
    UNASSIGNED: 'Unassigned',
  };

  const roleGradients = {
    MENTOR: 'from-blue-600 to-indigo-600 border-indigo-500/30',
    CO_MENTOR: 'from-purple-600 to-pink-600 border-purple-500/30',
    MENTEE: 'from-emerald-500 to-teal-600 border-emerald-500/30',
    UNASSIGNED: 'from-zinc-600 to-zinc-800 border-zinc-700',
  };

  const handleCopyEmail = () => {
    if (user.email) {
      navigator.clipboard.writeText(user.email);
      toast({ title: 'Email copied to clipboard', variant: 'success' });
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 cursor-pointer"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 15 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-zinc-900/90 backdrop-blur-2xl shadow-2xl p-6 overflow-hidden z-10 font-[Plus_Jakarta_Sans]"
      >
        {/* Glow Effects */}
        <div className={`absolute -top-24 -left-24 w-48 h-48 bg-gradient-to-br ${roleGradients[user.smpRole]} rounded-full blur-3xl opacity-20`} />
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl text-zinc-500 hover:text-zinc-50 hover:bg-white/5 transition-all duration-200"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center">
          {/* Profile Picture / Avatar */}
          {user.profilePicUrl ? (
            <div className={`w-24 h-24 rounded-full p-1 bg-gradient-to-br ${roleGradients[user.smpRole]} shadow-xl mb-4 overflow-hidden flex-shrink-0`}>
              <img
                src={user.profilePicUrl}
                alt={user.name}
                className="w-full h-full object-cover rounded-full bg-zinc-950"
              />
            </div>
          ) : (
            <div className={`w-24 h-24 rounded-full bg-gradient-to-br ${roleGradients[user.smpRole]} flex items-center justify-center font-black text-zinc-50 text-2xl shadow-xl mb-4 flex-shrink-0`}>
              {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?'}
            </div>
          )}

          {/* Name & Role */}
          <h3 className="text-xl font-black text-zinc-50 tracking-tight">{user.name}</h3>
          <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold border bg-white/[0.02] text-zinc-300`}>
            <span className={`w-1.5 h-1.5 rounded-full ${user.smpRole === 'MENTEE' ? 'bg-emerald-400' : user.smpRole === 'MENTOR' ? 'bg-indigo-400' : 'bg-purple-400'}`} />
            {roleLabels[user.smpRole] || 'Student'}
          </span>

          <div className="mt-1.5 text-xs text-zinc-500 font-mono tracking-wider">{user.rollNumber}</div>

          {/* Contact Details */}
          <div className="flex gap-2 mt-4 w-full">
            <button
              onClick={handleCopyEmail}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-white/8 bg-white/[0.02] text-xs font-bold text-zinc-300 hover:text-zinc-50 hover:bg-white/5 transition-all duration-200"
            >
              <Mail className="w-4 h-4 text-zinc-500" />
              {user.email}
              <Copy className="w-3.5 h-3.5 text-zinc-600 ml-1" />
            </button>
          </div>

          {/* Profile Fields */}
          <div className="w-full text-left mt-6 space-y-4 border-t border-white/5 pt-5">
            {/* Bio */}
            <div>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">Bio</span>
              <p className="text-zinc-200 text-sm bg-white/[0.02] border border-white/5 p-3 rounded-xl min-h-[44px]">
                {user.bio || <span className="text-zinc-600 italic">No bio written yet.</span>}
              </p>
            </div>

            {/* Description */}
            <div>
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block mb-1">About</span>
              <p className="text-zinc-300 text-sm bg-white/[0.02] border border-white/5 p-3 rounded-xl min-h-[80px] whitespace-pre-wrap leading-relaxed">
                {user.description || <span className="text-zinc-600 italic">No description details provided.</span>}
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
