import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { toast } from "react-hot-toast";

const Dashboard = () => {
  const [opportunities, setOpportunities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOpportunities = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/finance-vault`, {
        params: {
          page: 1,
          limit: 100,
        },
        withCredentials: true,
      });

      setOpportunities(data.data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to fetch finance opportunities.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOpportunities();
  }, []);

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this opportunity?"
    );

    if (!confirmDelete) return;

    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/v1/finance-vault/${id}`, {
        withCredentials: true,
      });

      toast.success("Opportunity deleted successfully.");

      setOpportunities((prev) =>
        prev.filter((item) => item.id !== id)
      );
    } catch (err) {
      console.error(err);
      toast.error(
        err?.response?.data?.message ||
          "Failed to delete opportunity."
      );
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <h2 className="text-xl font-semibold">
          Loading...
        </h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-8">

      <div className="flex justify-between items-center mb-8">

        <div>
          <h1 className="text-3xl font-bold">
            Finance Vault Admin
          </h1>

          <p className="text-gray-500 mt-1">
            Manage Finance Opportunities
          </p>
        </div>

        <Link
          to="/admin/finance-vault/add"
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-lg font-medium"
        >
          + Add Opportunity
        </Link>

      </div>

      <div className="bg-white rounded-xl shadow overflow-x-auto">

        <table className="min-w-full">

          <thead className="bg-gray-100">

            <tr>
              <th className="text-left px-6 py-4">Title</th>
              <th className="text-left px-6 py-4">Category</th>
              <th className="text-left px-6 py-4">Provider</th>
              <th className="text-left px-6 py-4">Deadline</th>
              <th className="text-left px-6 py-4">Status</th>
              <th className="text-center px-6 py-4">
                Actions
              </th>
            </tr>

          </thead>

          <tbody>

            {opportunities.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="text-center py-10 text-gray-500"
                >
                  No Finance Opportunities Found
                </td>
              </tr>
            ) : (
              opportunities.map((item) => (
                <tr
                  key={item._id || item.id}
                  className="border-t hover:bg-gray-50"
                >
                  <td className="px-6 py-4 font-medium">
                    {item.title}
                  </td>

                  <td className="px-6 py-4">
                    {item.category}
                  </td>

                  <td className="px-6 py-4">
                    {item.provider || "-"}
                  </td>

                  <td className="px-6 py-4">
                    {item.deadline
                      ? new Date(
                          item.deadline
                        ).toLocaleDateString()
                      : "-"}
                  </td>

                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${
                        item.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {item.isActive
                        ? "Active"
                        : "Inactive"}
                    </span>
                  </td>

                  <td className="px-6 py-4">

                    <div className="flex justify-center gap-3">

                      <Link
                        to={`/admin/finance-vault/edit/${item._id || item.id}`}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded"
                      >
                        Edit
                      </Link>

                      <button
                        onClick={() =>
                          handleDelete(item._id || item.id)
                        }
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded"
                      >
                        Delete
                      </button>

                    </div>

                  </td>
                </tr>
              ))
            )}

          </tbody>

        </table>

      </div>
    </div>
  );
};

export default Dashboard;