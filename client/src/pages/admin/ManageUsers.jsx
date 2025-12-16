import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Users, Shield, ChevronLeft, ChevronRight, Loader2, CheckCircle } from 'lucide-react';
import { getAuth } from 'firebase/auth'; 

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [page, setPage] = useState(1);
  const limit = 10;
  const [hasMore, setHasMore] = useState(true);

  const roles = ['STUDENT', 'ANNOUNCEMENT_ADMIN', 'RESOURCE_ADMIN', 'SUPER_ADMIN'];

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : localStorage.getItem('token');

      const response = await axios.get(`http://localhost:5000/api/v1/users?page=${page}&limit=${limit}`, {
        headers: { Authorization: `Bearer ${token}` }
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
      console.error("Failed to fetch users:", error);

    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page]); 

  const handleRoleChange = async (userId, newRole) => {
    setUpdatingId(userId);
    try {
      const auth = getAuth();
      const user = auth.currentUser;
      const token = user ? await user.getIdToken() : localStorage.getItem('token');

      await axios.patch(`http://localhost:5000/api/v1/users/${userId}?newRole=${newRole}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUsers(prevUsers =>
        prevUsers.map(u => u.id === userId ? { ...u, role: newRole } : u)
      );

    } catch (error) {
      console.error("Failed to update role:", error);
      alert(error.response?.data?.message || "Failed to update role");
    } finally {
      setUpdatingId(null);
    }
  };

  return (
    <div className="p-6 min-h-screen bg-gray-50">

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Users className="text-blue-600" /> User Management
          </h1>
          <p className="text-gray-500 text-sm mt-1">View users and manage their access roles.</p>
        </div>
        <div className="text-sm font-medium text-gray-600 bg-white px-4 py-2 rounded-lg border shadow-sm">
          Page {page}
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

        {loading && users.length === 0 ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="animate-spin text-blue-500 w-8 h-8" />
          </div>
        ) : (
          <div className="overflow-x-auto">
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
                            className="block w-full pl-3 pr-8 py-1.5 text-xs border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
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
        )}

        {!loading && users.length === 0 && (
          <div className="p-12 text-center text-gray-500">
            No users found.
          </div>
        )}

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex items-center justify-between">
          <button
            onClick={() => setPage(prev => Math.max(prev - 1, 1))}
            disabled={page === 1 || loading}
            className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Previous
          </button>
          <span className="text-sm text-gray-600">
            Page <span className="font-semibold text-gray-900">{page}</span>
          </span>
          <button
            onClick={() => setPage(prev => prev + 1)}
            disabled={!hasMore || loading}
            className="flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
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
  };

  const style = colors[role] || 'bg-gray-100 text-gray-800 border-gray-200';

  return (
    <span className={`px-3 py-1 inline-flex items-center text-xs font-medium border rounded-full ${style}`}>
      {role === 'SUPER_ADMIN' && <Shield className="w-3 h-3 mr-1" />}
      {role}
    </span>
  );
};

export default ManageUsers;