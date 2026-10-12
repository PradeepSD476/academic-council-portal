import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Shield, ChevronLeft, ChevronRight, Loader2, Wifi } from 'lucide-react';
import toast from 'react-hot-toast';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [page, setPage] = useState(1);
  const limit = 10;
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [onlineOnly, setOnlineOnly] = useState(false);

  const roles = ['STUDENT', 'CAREER_ADMIN', 'ANNOUNCEMENT_ADMIN', 'RESOURCE_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN', 'FACULTY'];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/v1/users?page=${page}&limit=${limit}&search=${searchTerm}${onlineOnly ? '&online=true' : ''}`, {
        withCredentials: true
      });

      if (response.data && response.data.data) {
        setUsers(response.data.data);
        if (response.data.data.length < limit) {
          setHasMore(false);
        } else {
          setHasMore(true);
        }
      }
    } catch (error) {
      toast.error("Unable to fetch users.");
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm, onlineOnly]);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/v1/users/${userId}?newRole=${newRole}`, {}, {
        withCredentials: true
      });

      setUsers(prevUsers =>
        prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u)
      );
      toast.success("Role updated successfully");
    } catch (error) {
      console.error("Failed to update role:", error);
      toast.error("Failed to update role");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-[3px] h-6 bg-[var(--color-secondary)] rounded-full shadow-[0_0_8px_var(--color-secondary)]" />
            <h1 className="text-2xl md:text-3xl font-extrabold text-[var(--color-primary)] tracking-tight flex items-center gap-2.5">
              <Users className="text-[var(--color-secondary)]" size={24} /> User Management
            </h1>
          </div>
          <p className="text-slate-500 text-sm ml-4">View enrolled users and manage system authorization roles.</p>
        </div>
        <div className="text-xs font-semibold text-slate-500 bg-white/95 backdrop-blur-xl shadow-xs px-4 py-2 rounded-xl border border-slate-200 self-start sm:self-auto">
          Page {page}
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative w-full max-w-md">
          <input
            type="text"
            placeholder="Search by name, email, branch, roll number..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-white/95 backdrop-blur-xl shadow-xs text-[var(--color-primary)] placeholder-slate-400 focus:outline-none focus:border-[var(--color-secondary)] focus:ring-1 focus:ring-[var(--color-secondary)] text-sm shadow-sm transition"
          />
        </div>
        <button
          onClick={() => { setOnlineOnly(prev => !prev); setPage(1); }}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-2xl border text-xs font-bold transition-all duration-200 cursor-pointer shrink-0 ${
            onlineOnly
              ? 'bg-emerald-50 border-emerald-300 text-emerald-700 shadow-sm'
              : 'bg-white/95 border-slate-200 text-slate-500 hover:border-slate-300'
          }`}
        >
          <Wifi size={14} className={onlineOnly ? 'text-emerald-500' : 'text-slate-400'} />
          {onlineOnly ? 'Online Only' : 'Show Online'}
        </button>
      </div>

      {/* Main Content Area */}
      <div className="bg-white/95 backdrop-blur-xl shadow-xs rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-[var(--color-secondary)] w-8 h-8" />
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-800">
                <thead className="bg-white/90">
                  <tr>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">User Details</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Branch</th>
                    <th className="px-6 py-3.5 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Current Role</th>
                    <th className="px-6 py-3.5 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Change Role</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-800/70">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-[var(--color-secondary)]/15 border border-[var(--color-secondary)]/30 text-[var(--color-secondary)] rounded-xl flex items-center justify-center font-bold text-sm">
                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="ml-3.5 min-w-0">
                            <div className="text-sm font-bold text-[var(--color-primary)] leading-snug">
                              {user.displayName || "No Name"}
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2.5 py-0.5 inline-flex text-xs font-semibold rounded-full bg-white/5 border border-white/10 text-slate-600">
                          {user.branchName || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="inline-flex items-center justify-end">
                          {updatingId === user.id ? (
                            <Loader2 className="animate-spin w-4 h-4 text-[var(--color-secondary)]" />
                          ) : (
                            <select
                              className="px-3 py-1.5 text-xs border border-slate-200 focus:outline-none focus:border-[var(--color-secondary)] rounded-xl bg-white/90 text-[var(--color-primary)] font-semibold cursor-pointer"
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            >
                              {roles.map(role => (
                                <option key={role} value={role} className="bg-sky-100 text-[var(--color-primary)]">{role}</option>
                              ))}
                            </select>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card-Based View */}
            <div className="block md:hidden divide-y divide-neutral-800/80">
              {users.map((user) => (
                <div key={user.id} className="p-4 flex flex-col gap-3 hover:bg-white/5 transition-colors">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-9 w-9 bg-[var(--color-secondary)]/15 border border-[var(--color-secondary)]/30 text-[var(--color-secondary)] rounded-xl flex items-center justify-center font-bold text-xs">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="ml-3 min-w-0">
                      <div className="text-sm font-bold text-[var(--color-primary)] truncate">
                        {user.displayName || "No Name"}
                      </div>
                      <div className="text-xs text-slate-500 truncate">{user.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Branch:</span>
                    <span className="px-2 py-0.5 font-semibold rounded-full bg-white/5 border border-white/10 text-slate-600">
                      {user.branchName || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">Role:</span>
                    <RoleBadge role={user.role} />
                  </div>

                  <div className="flex items-center justify-between gap-4 mt-1 border-t border-slate-200/80 pt-2.5">
                    <span className="text-xs text-slate-500 font-medium">Change Role:</span>
                    <div className="flex-1 max-w-[160px]">
                      {updatingId === user.id ? (
                        <Loader2 className="animate-spin w-4 h-4 text-[var(--color-secondary)] ml-auto" />
                      ) : (
                        <select
                          className="block w-full text-xs border border-slate-200 focus:outline-none focus:border-[var(--color-secondary)] py-1.5 px-2.5 rounded-xl bg-white/90 text-[var(--color-primary)] font-semibold cursor-pointer"
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        >
                          {roles.map(role => (
                            <option key={role} value={role} className="bg-sky-100 text-[var(--color-primary)]">{role}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && users.length === 0 && (
          <div className="p-16 text-center text-slate-500 text-sm">
            No users found matching your search.
          </div>
        )}

        {/* Footer / Pagination */}
        <div className="bg-white/90 px-4 py-3 md:px-6 md:py-3.5 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500">
          <button
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={page === 1 || loading}
            className="flex items-center px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-600 hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition font-semibold cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </button>
          <span>
            Page <span className="font-bold text-[var(--color-primary)]">{page}</span>
          </span>
          <button
            onClick={() => setPage(prev => prev + 1)}
            disabled={!hasMore || loading}
            className="flex items-center px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-600 hover:text-[var(--color-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition font-semibold cursor-pointer"
          >
            Next <ChevronRight className="w-4 h-4 ml-1" />
          </button>
        </div>
      </div>
    </div>
  );
};

const RoleBadge = ({ role }) => {
  const colors = {
    'SUPER_ADMIN': 'bg-purple-950/60 text-purple-300 border-purple-800/60',
    'ANNOUNCEMENT_ADMIN': 'bg-rose-950/60 text-rose-300 border-rose-800/60',
    'RESOURCE_ADMIN': 'bg-amber-950/60 text-amber-300 border-amber-800/60',
    'STUDENT': 'bg-emerald-950/60 text-emerald-300 border-emerald-800/60',
    'FACULTY': 'bg-blue-950/60 text-blue-300 border-blue-800/60',
    'CAREER_ADMIN': 'bg-[var(--color-secondary)]/10 text-[var(--color-secondary)] border-[var(--color-secondary)]/30',
    'FINANCE_ADMIN': 'bg-teal-950/60 text-teal-300 border-teal-800/60'
  };

  const style = colors[role] || 'bg-neutral-800 text-slate-600 border-slate-300';

  return (
    <span className={`px-2.5 py-0.5 inline-flex items-center text-[10px] md:text-xs font-bold border rounded-full uppercase tracking-wider ${style}`}>
      {role === 'SUPER_ADMIN' && <Shield className="w-3 h-3 mr-1" />}
      {role?.replace(/_/g, " ")}
    </span>
  );
};

export default ManageUsers;