import React, { useEffect, useState } from "react";
import axios from "axios";
import SearchBar from "./components/SearchBar";
import FilterSidebar from "./components/FilterSidebar";
import ScholarshipCard from "./components/ScholarshipCard";

const Index = () => {
  const [scholarships, setScholarships] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [filters, setFilters] = useState({
    category: "",
    gender: "",
    income: "",
    branch: "",
    activeStatus: "",
  });

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchScholarships = async () => {
    try {
      setLoading(true);

      const { data } = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/finance-vault`, {
        params: {
          page,
          limit: 10,
          search: searchTerm,
          category: filters.category,
          gender: filters.gender,
          income: filters.income,
          branch: filters.branch,
          activeStatus: filters.activeStatus,
        },
        withCredentials: true,
      });

      setScholarships(data.data);
      setTotalPages(data.totalPages);
      setError("");
    } catch (err) {
      console.error(err);
      setError("Failed to load scholarships.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScholarships();
  }, [page, searchTerm, filters]);

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-6 py-8">

        <h1 className="text-4xl font-bold text-center">
          Finance Vault
        </h1>

        <p className="text-center text-gray-600 mt-2 mb-8">
          Search and explore financial opportunities available for IIT Patna students.
        </p>

      

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">

      <div className="lg:col-span-1">
    <div className="sticky top-24">
      <FilterSidebar
        filters={filters}
        setFilters={setFilters}
      />
    </div>
  </div>
         <div className="lg:col-span-3 lg:ml-[22rem]">

            <div className="mb-4 flex justify-between items-center">

              <div>

                <h2 className="text-xl font-semibold">
                  Finance Opportunities
                </h2>

                {!loading && (
                  <p className="text-gray-600">
                    {scholarships.length} opportunity(s) found
                  </p>
                )}

              </div>

            </div>

            {loading ? (

              <div className="bg-white rounded-lg shadow p-8 text-center">
                Loading...
              </div>

            ) : error ? (

              <div className="bg-red-100 text-red-700 rounded-lg p-5">
                {error}
              </div>

            ) : scholarships.length === 0 ? (

              <div className="bg-white rounded-lg shadow p-8 text-center">

                <h3 className="text-xl font-semibold">
                  No Opportunities Found
                </h3>

                <p className="text-gray-500 mt-2">
                  Try changing your search or filters.
                </p>

              </div>

            ) : (

              <>
                <div className="space-y-5">

                  {scholarships.map((scholarship) => (
                    <ScholarshipCard
                      key={scholarship.id}
                      scholarship={scholarship}
                    />
                  ))}

                </div>

                <div className="flex justify-center items-center gap-4 mt-8">

                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
                  >
                    Previous
                  </button>

                  <span className="font-medium">
                    Page {page} of {totalPages}
                  </span>

                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="px-4 py-2 bg-blue-600 text-white rounded disabled:bg-gray-400"
                  >
                    Next
                  </button>

                </div>
              </>

            )}

          </div>

        </div>

      </div>
    </div>
  );
};

export default Index;