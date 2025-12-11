import React from "react";
import { useContext,useEffect } from "react";
import AuthContext from "../../context/auth/authContext";
import { Mail, Lock } from "lucide-react";
import { useNavigate } from "react-router-dom";

function Login() {
  const authContext = useContext(AuthContext);
  const navigate  = useNavigate()

  useEffect(() => {
    if (authContext.firebaseUser && authContext.user) {
      if(!authContext.user.rollNo)
        navigate("/login-with-roll");
      else navigate("/dashboard")
    }
  }, [authContext.firebaseUser, authContext.user]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e9f0ff] to-[#eef4ff] px-4">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 text-center">
        
        <div className="w-20 h-20 mx-auto bg-blue-600 rounded-full flex items-center justify-center shadow-md">
          <svg
            width="40"
            height="40"
            viewBox="0 0 24 24"
            fill="#fff"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M12 2L1 7l11 5 9-4.09V17h2V7L12 2z" />
            <path d="M11 12.98L3 9.21v2.11l8 3.78 8-3.78V9.21l-8 3.77z" />
            <path d="M5 13v6h2v-5.2l-2-.8zm12 0l-2 .8V19h2v-6z" />
          </svg>
        </div>

        <h2 className="text-xl font-semibold mt-5">Academic Portal</h2>
        <p className="text-gray-500 text-sm">Sign in to access your courses</p>

        <div className="mt-6 text-left">
          <label className="text-gray-500 text-md font-medium">Email</label>
          <div className="flex items-center mt-1 bg-white border border-gray-400 rounded-lg px-3 py-2 
              focus-within:border-blue-500 focus-within:border-2">

            <Mail size={18} className="text-gray-400" />
            <input
              type="email"
              placeholder="student@iitp.ac.in"
              className="text-gray-400 w-full px-3 py-1 focus:outline-none"
            />
          </div>
        </div>

        <div className="mt-4 text-left">
          <label className="text-gray-500 text-md font-medium">Password</label>
          <div className="flex items-center mt-1 bg-white border border-gray-400 rounded-lg px-3 py-2 
              focus-within:border-blue-500 focus-within:border-2">

            <Lock size={18} className="text-gray-400" />
            <input
              type="password"
              placeholder="Enter your password"
              className="text-gray-400 w-full px-3 py-1 focus:outline-none"
            />
          </div>
        </div>

        <button
          onClick={authContext.login}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg mt-6 text-lg font-medium transition"
        >
          Sign In
        </button>

        {/* Google  */}
        <button
          onClick={authContext.googleLogin}
          className="w-full mt-4 border border-gray-300 rounded-lg py-3 flex items-center justify-center gap-3 bg-white hover:bg-gray-50 transition"
        >
          <img
            src="https://www.gstatic.com/images/branding/product/1x/gsa_64dp.png"
            alt="Google"
            className="w-6 h-6"
          />
          <span className="text-gray-700 font-medium">Login with Google</span>
        </button>

      </div>
    </div>
  );
}

export default Login;
