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
                    `${import.meta.env.VITE_API_URL}/api/v1/getuser/me`,
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
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/auth/login`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ email, password }),
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (response.ok) {
                setUser(data.data);
                console.table(data.data)
                toast.success("logged In")
            } else {
                toast.error("Unable to login, Please try again later.")
                throw new Error(data.message);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };


    const register = async (displayName, email, password, confirmPassword, otp) => {
        setLoading(true);
        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/auth/register`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ displayName, email, password, confirmPassword, otp }),
                    credentials: "include",
                }
            );

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message);
            }else{
                toast.success("registered successfully, please login now.")
            }
            
            navigate('/login')
        } catch (err) {
            toast.error("unable to register, check your credentials or please try again later.")
            console.error(err.message);
        } finally {
            setLoading(false);
        }
    };



    const logout = async () => {
        setLoading(true);
        try {
            await fetch(
                `${import.meta.env.VITE_API_URL}/api/v1/auth/logout`,
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
