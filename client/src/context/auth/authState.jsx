import { useState } from "react";
import AuthContext from "./authContext";
import { auth, provider } from "../../lib/firebass";
import { useEffect } from "react";
import { onAuthStateChanged, signInWithPopup, signOut } from "firebase/auth";

const AuthState = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [firebaseUser, setFirebaseUser] = useState(null);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (currentFirebaseUser) => {
            setFirebaseUser(currentFirebaseUser);
            if (currentFirebaseUser) {
                try {
                    const idToken = await currentFirebaseUser.getIdToken();
                    const response = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/auth/login`, {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${idToken}`
                        },
                    })
                    if (!response.ok) {
                        await signOut(auth);
                        setUser(null);
                        throw new Error("Backend Auth Failed !");

                    }
                    const backendData = await response.json();
                    setUser(backendData.data);
                    console.table(backendData.data);
                } catch (err) {
                    console.log("Error", err);
                }
            }
            else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);


    const login = async () => {
        setLoading(true);
        try {
            await signInWithPopup(auth, provider);
        }
        catch (err) {
            console.log("Error", err)
            setLoading(false);
        }
        setLoading(false);
    }

    const logout = async () => {
        setLoading(true);
        try {
            return await signOut(auth);
        } catch (err) {
            console.log("Error", err);
            setLoading(false);
        }
    }

    const values = {
        user,
        firebaseUser,
        loading,
        login,
        logout,
        isAuthenticated: !!user && !!firebaseUser,
    }

    return (
        <AuthContext.Provider value={values}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthState;
