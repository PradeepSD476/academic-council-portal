import React, { useState, useContext, useEffect } from "react";
import { Hash } from "lucide-react";
import AuthContext from "../../context/auth/authContext";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";

function VerifyRoll() {
  const [roll, setRoll] = useState("");
  const authContext = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (!authContext.firebaseUser) {
      toast.error("Please login first!");
      navigate("/login");
    }
  }, [authContext.firebaseUser]);

  const handleVerify = async () => {
    if (!authContext.firebaseUser) {
      toast.error("Please login first!");
      navigate("/login");
      return;
    }

    if (!roll.trim()) {
      toast.error("Roll number is required!");
      return;
    }

    try {
      const idToken = await authContext.firebaseUser.getIdToken();

      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/profile`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ rollNumber: roll }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.message || "Verification failed!");
        return;
      }

      toast.success("Roll Verified Successfully!");
      navigate("/dashboard");

    } catch (error) {
      console.error(error);
      toast.error("Something went wrong!");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e9f0ff] to-[#eef4ff] px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 text-center">
        
        <div className="w-20 h-20 mx-auto bg-yellow-500 rounded-full flex items-center justify-center shadow-md">
          <Hash size={42} color="white" />
        </div>

        <h2 className="text-xl font-semibold mt-5">Verify Your Identity</h2>
        <p className="text-gray-500 text-sm">
          Please enter your roll number to continue
        </p>

        <div className="mt-6 text-left">
          <label className="text-gray-600 text-md font-medium">Roll Number</label>

          <div className="flex items-center mt-2 bg-white border border-gray-300 rounded-lg px-3 py-2
              focus-within:border-blue-500 focus-within:border-2">

            <Hash size={18} className="text-gray-400" />

            <input
              type="text"
              value={roll}
              onChange={(e) => setRoll(e.target.value)}
              placeholder="e.g., 2021CSE001"
              className="w-full px-3 py-1 text-gray-600 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleVerify}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg mt-6 text-sm font-medium transition"
        >
          Verify & Continue
        </button>

        <div className="mt-6 bg-yellow-50 border border-yellow-300 rounded-lg p-4 text-left">
          <p className="text-yellow-700 text-sm">
            <strong>Note:</strong> Your roll number will be used to fetch your
            branch, academic year, and program information from our database.
          </p>
        </div>
      </div>
    </div>
  );
}

export default VerifyRoll;
