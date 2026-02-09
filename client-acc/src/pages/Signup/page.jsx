import React, { useContext, useState } from "react";
import AuthContext from "../../context/auth/authContext";
import { Mail, Lock, User } from "lucide-react";
import { useNavigate } from "react-router-dom";

function SignUp() {
    const { register } = useContext(AuthContext);
    const navigate = useNavigate();

    const [displayName, setDisplayName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");

    const [otp, setOtp] = useState("");
    const [otpSent, setOtpSent] = useState(false);

    const handleSendOTP = async () => {
        if (!email.endsWith("@iitp.ac.in")) {
            alert("Please use your IIT Patna email address");
            return;
        }
        try {
            const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/send-otp`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email,
                    type: "EMAIL_VERIFICATION",
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || "Failed to send OTP");
            }

            setOtpSent(true);
            alert("OTP sent to your email");

        } catch (err) {
            alert(err.message);
        }
    };

    const handleSubmit = () => {
        if (!otpSent || !otp) {
            alert("Please verify your email using OTP");
            return;
        }

        register(displayName, email, password, confirmPassword, otp);
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e9f0ff] to-[#eef4ff] px-4">
            <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-8 text-center">

                <div className="w-20 h-20 mx-auto bg-blue-600 rounded-full flex items-center justify-center shadow-md">
                    <User size={36} className="text-white" />
                </div>

                <h2 className="text-xl font-semibold mt-5">Create Account</h2>
                <p className="text-gray-500 text-sm">
                    Sign up to access academic resources
                </p>

                {/* Full Name */}
                <div className="mt-6 text-left">
                    <label className="text-gray-500 text-md font-medium">
                        Full Name
                    </label>
                    <div className="flex items-center mt-1 border border-gray-400 rounded-lg px-3 py-2 focus-within:border-blue-500 focus-within:border-2">
                        <User size={18} className="text-gray-400" />
                        <input
                            type="text"
                            placeholder="Your full name"
                            value={displayName}
                            onChange={(e) => setDisplayName(e.target.value)}
                            className="text-gray-400 w-full px-3 py-1 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Email + OTP */}
                <div className="mt-4 text-left">
                    <label className="text-gray-500 text-md font-medium">
                        Email
                    </label>

                    <div className="flex items-center mt-1 border border-gray-400 rounded-lg px-3 py-2 focus-within:border-blue-500 focus-within:border-2">
                        <Mail size={18} className="text-gray-400" />

                        <input
                            type="email"
                            placeholder="student@iitp.ac.in"
                            value={email}
                            onChange={(e) => {
                                setEmail(e.target.value);
                                setOtp("");
                                setOtpSent(false);
                            }}
                            className="text-gray-400 w-full px-3 py-1 focus:outline-none"
                        />

                        <button
                            type="button"
                            onClick={handleSendOTP}
                            disabled={!email || otpSent}
                            className="ml-2 text-sm font-medium text-blue-600 hover:underline disabled:text-gray-400"
                        >
                            {otpSent ? "OTP Sent" : "Send OTP"}
                        </button>
                    </div>
                </div>

                {otpSent && (
                    <div className="mt-3 text-left">
                        <label className="text-gray-500 text-md font-medium">
                            Enter OTP
                        </label>
                        <input
                            type="text"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value)}
                            className="w-full mt-1 border border-gray-400 rounded-lg px-3 py-2 focus:outline-none"
                        />
                    </div>
                )}

                {/* Password */}
                <div className="mt-4 text-left">
                    <label className="text-gray-500 text-md font-medium">
                        Password
                    </label>
                    <div className="flex items-center mt-1 border border-gray-400 rounded-lg px-3 py-2 focus-within:border-blue-500 focus-within:border-2">
                        <Lock size={18} className="text-gray-400" />
                        <input
                            type="password"
                            placeholder="Create a password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="text-gray-400 w-full px-3 py-1 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Confirm Password */}
                <div className="mt-4 text-left">
                    <label className="text-gray-500 text-md font-medium">
                        Confirm Password
                    </label>
                    <div className="flex items-center mt-1 border border-gray-400 rounded-lg px-3 py-2 focus-within:border-blue-500 focus-within:border-2">
                        <Lock size={18} className="text-gray-400" />
                        <input
                            type="password"
                            placeholder="Confirm password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="text-gray-400 w-full px-3 py-1 focus:outline-none"
                        />
                    </div>
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg mt-6 text-lg font-medium transition"
                >
                    Sign Up
                </button>

                <p className="mt-4 text-sm text-gray-500">
                    Already have an account?{" "}
                    <span
                        onClick={() => navigate("/login")}
                        className="text-blue-600 font-medium cursor-pointer hover:underline"
                    >
                        Sign in
                    </span>
                </p>
            </div>
        </div>
    );
}

export default SignUp;
