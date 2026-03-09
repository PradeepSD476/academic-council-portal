import React, { useContext, useEffect, useState } from "react";
import AuthContext from "../../context/auth/authContext";
import { Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

function SignIn() {
  const { user, login, loading } = useContext(AuthContext);
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (user) {
      if (!user.rollNo && user?.role !== 'FACULTY') navigate("/login-with-roll");
      else {
        if(user?.role !== 'FACULTY'){
          navigate("/dashboard/courses")
        }else{
          navigate("/admin/dashboard")
        }
      };
    }
  }, [user, navigate]);

  const handleSubmit = () => {
    login(email, password);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e9f0ff] to-[#eef4ff] px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 text-center">

        <div className="w-20 h-20 mx-auto bg-blue-600 rounded-full flex items-center justify-center shadow-md">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="#fff">
            <path d="M12 2L1 7l11 5 9-4.09V17h2V7L12 2z" />
            <path d="M11 12.98L3 9.21v2.11l8 3.78 8-3.78V9.21l-8 3.77z" />
            <path d="M5 13v6h2v-5.2l-2-.8zm12 0l-2 .8V19h2v-6z" />
          </svg>
        </div>

        <h2 className="text-xl font-semibold mt-5">Academic Portal</h2>
        <p className="text-gray-500 text-sm">Sign in to access your courses</p>

        <div className="mt-6 text-left">
          <label className="text-gray-500 text-md font-medium">Email</label>
          <div className="flex items-center mt-1 bg-white border border-gray-400 rounded-lg px-3 py-2 focus-within:border-blue-500 focus-within:border-2">
            <Mail size={18} className="text-gray-400" />
            <input
              type="email"
              placeholder="student@iitp.ac.in"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="text-gray-400 w-full px-3 py-1 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 text-left">
          <label className="text-gray-500 text-md font-medium">Password</label>
          <div className="flex items-center mt-1 bg-white border border-gray-400 rounded-lg px-3 py-2 focus-within:border-blue-500 focus-within:border-2">
            <Lock size={18} className="text-gray-400" />
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="text-gray-400 w-full px-3 py-1 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className={`w-full flex justify-center items-center gap-2 
  bg-blue-600 hover:bg-blue-700 
  disabled:bg-blue-400 disabled:cursor-not-allowed
  text-white py-3 rounded-lg mt-6 text-lg font-medium transition`}
        >
          {loading ? (
            <>
              <svg
                className="w-5 h-5 animate-spin"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                ></path>
              </svg>
              Signing In...
            </>
          ) : (
            "Sign In"
          )}
        </button>

        <p className="mt-4 text-sm text-gray-500">
          Don’t have an account?{" "}
          <span
            onClick={() => navigate("/register")}
            className="text-blue-600 font-medium cursor-pointer hover:underline"
          >
            Sign up
          </span>
        </p>


      </div>
    </div>
  );
}

export default SignIn;
