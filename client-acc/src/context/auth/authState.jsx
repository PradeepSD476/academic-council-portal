import { useState } from "react";
import AuthContext from "./authContext";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const AuthState = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchMe = async () => {
            try {
                const response = await fetch(
                    `${import.meta.env.VITE_API_URL}/v1/getuser/me`,
                    { credentials: "include" }
                );

                if (response.ok) {
                    const data = await response.json();
                    setUser(data.data);
                    console.log(data.data)
                }
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        fetchMe();
    }, []);


    const login = async (email, password) => {
        setLoading(true);
        const normalizedEmail = (email || "").trim().toLowerCase();
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/v1/auth/login`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email: normalizedEmail, password }),
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (response.ok) {
                setUser(data.data);
                console.table(data.data);
                toast.success("Logged in successfully!");
            } else {
                const status = response.status;
                if (status === 401 && data?.error === "MISSING_PARAMETERS") {
                    throw new Error("Please enter both your email and password.");
                } else if (status === 404) {
                    throw new Error("No account found with this email. Please sign up first.");
                } else if (status === 401) {
                    throw new Error("Incorrect password. Please try again.");
                } else {
                    throw new Error(data?.message || "Login failed. Please try again later.");
                }
            }
        } catch (err) {
            toast.error(err.message || "Login failed. Please try again later.");
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    const register = async (displayName, email, password, confirmPassword, otp) => {
        setLoading(true);
        const normalizedEmail = (email || "").trim().toLowerCase();
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/v1/auth/register`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ displayName, email: normalizedEmail, password, confirmPassword, otp }),
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                // Use the server's human-readable message; the backend now returns
                // specific messages for every failure case
                throw new Error(data?.message || "Registration failed. Please try again.");
            } else {
                toast.success("Account created! Please sign in.");
            }

            navigate('/login');
        } catch (err) {
            toast.error(err.message || "Unable to register. Please try again later.");
            console.error(err.message);
        } finally {
            setLoading(false);
        }
    };



    const logout = async () => {
        setLoading(true);
        try {
            await fetch(
                `${import.meta.env.VITE_API_URL}/v1/auth/logout`,
                { withCredentials: true }
            );
            setUser(null);
            toast.success("user logged out.")
        } catch (err) {
            toast.error("Unable to logout, Please try again later.")
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    const values = {
        user,
        login,
        logout,
        register,
        loading,
        isAuthenticated: !!user
    }

    return (
        <AuthContext.Provider value={values}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthState;
