import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Shield, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [page, setPage] = useState(1);
  const limit = 10;
  const [hasMore, setHasMore] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  const roles = ['STUDENT', 'CAREER_ADMIN', 'ANNOUNCEMENT_ADMIN', 'RESOURCE_ADMIN', 'FINANCE_ADMIN', 'SUPER_ADMIN', 'FACULTY'];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users?page=${page}&limit=${limit}&search=${searchTerm}`, {
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
  }, [page, searchTerm]);

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      await axios.patch(`${import.meta.env.VITE_API_URL}/api/v1/users/${userId}?newRole=${newRole}`, {}, {
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
    <div className="p-4 md:p-6 min-h-screen bg-gray-50">
      {/* Header section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-xl md:text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-blue-600 w-5 h-5 md:w-6 md:h-6" /> User Management
          </h1>
          <p className="text-gray-500 text-xs md:text-sm mt-1">View users and manage their access roles.</p>
        </div>
        <div className="text-xs md:text-sm font-medium text-gray-600 bg-white px-3 py-1.5 md:px-4 md:py-2 rounded-lg border shadow-sm self-start sm:self-auto">
          Page {page}
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search by name, email, branch, roll number..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setPage(1);
          }}
          className="w-full md:w-96 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-white"
        />
      </div>

      {/* Main Content Area */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
          </div>
        ) : (
          <div>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Details</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Current Role</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold">
                            {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {user.displayName || "No Name"}
                            </div>
                            <div className="text-sm text-gray-500">{user.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                          {user.branchName || "N/A"}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <RoleBadge role={user.role} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-2">
                          {updatingId === user.id ? (
                            <Loader2 className="animate-spin w-5 h-5 text-blue-600" />
                          ) : (
                            <select
                              className="block w-full pl-3 pr-8 py-1.5 text-xs border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md bg-white text-gray-800"
                              value={user.role}
                              onChange={(e) => handleRoleChange(user.id, e.target.value)}
                            >
                              {roles.map(role => (
                                <option key={role} value={role}>{role}</option>
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
            <div className="block md:hidden divide-y divide-gray-200">
              {users.map((user) => (
                <div key={user.id} className="p-4 flex flex-col gap-3 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center">
                    <div className="flex-shrink-0 h-10 w-10 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-sm">
                      {user.displayName ? user.displayName.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="ml-3 min-w-0">
                      <div className="text-sm font-semibold text-gray-900 truncate">
                        {user.displayName || "No Name"}
                      </div>
                      <div className="text-xs text-gray-500 truncate">{user.email}</div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-gray-500 font-medium">Branch:</span>
                    <span className="px-2 py-0.5 font-semibold rounded-full bg-gray-100 text-gray-800">
                      {user.branchName || "N/A"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 font-medium">Role:</span>
                    <RoleBadge role={user.role} />
                  </div>

                  <div className="flex items-center justify-between gap-4 mt-1 border-t border-gray-100 pt-2">
                    <span className="text-xs text-gray-500 font-medium">Change Role:</span>
                    <div className="flex-1 max-w-[160px]">
                      {updatingId === user.id ? (
                        <Loader2 className="animate-spin w-4 h-4 text-blue-600 ml-auto" />
                      ) : (
                        <select
                          className="block w-full text-xs border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 py-1 px-2 rounded-md bg-white text-gray-800"
                          value={user.role}
                          onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        >
                          {roles.map(role => (
                            <option key={role} value={role}>{role}</option>
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
          <div className="p-12 text-center text-gray-500 text-sm">
            No users found.
          </div>
        )}

        {/* Footer / Pagination */}
        <div className="bg-gray-50 px-4 py-3 md:px-6 md:py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={page === 1 || loading}
            className="flex items-center px-2.5 py-1.5 md:px-3 md:py-1.5 border border-gray-300 rounded-md text-xs md:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </button>
          <span className="text-xs md:text-sm text-gray-600">
            Page <span className="font-semibold text-gray-900">{page}</span>
          </span>
          <button
            onClick={() => setPage(prev => prev + 1)}
            disabled={!hasMore || loading}
            className="flex items-center px-2.5 py-1.5 md:px-3 md:py-1.5 border border-gray-300 rounded-md text-xs md:text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
    'SUPER_ADMIN': 'bg-purple-100 text-purple-800 border-purple-200',
    'ANNOUNCEMENT_ADMIN': 'bg-blue-100 text-blue-800 border-blue-200',
    'RESOURCE_ADMIN': 'bg-amber-100 text-amber-800 border-amber-200',
    'STUDENT': 'bg-green-100 text-green-800 border-green-200',
    'FACULTY': 'bg-red-100 text-red-800 border-red-200',
    'CAREER_ADMIN': 'bg-blue-100 text-blue-800 border-blue-200',
    'FINANCE_ADMIN': 'bg-teal-100 text-teal-800 border-teal-200'
  };

  const style = colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <span className={`px-2 py-0.5 inline-flex items-center text-[10px] md:text-xs font-medium border rounded-full ${style}`}>
      {role === 'SUPER_ADMIN' && <Shield className="w-3 h-3 mr-1" />}
      {role}
    </span>
  );
};

export default ManageUsers;