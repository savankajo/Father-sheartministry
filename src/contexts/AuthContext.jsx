import React, { useContext, useState, useEffect, createContext } from "react";
import { auth, db } from "../firebase";
import {
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    updateProfile
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);

    // Admin Credentials
    const ADMIN_EMAIL = "media@fathersheartministry.ca";

    function signup(email, password, name) {
        return createUserWithEmailAndPassword(auth, email, password)
            .then(async (result) => {
                // Update display name
                await updateProfile(result.user, { displayName: name });
                // Create user doc
                await setDoc(doc(db, "users", result.user.uid), {
                    uid: result.user.uid,
                    email: email,
                    displayName: name,
                    teams: []
                });
            });
    }

    function login(email, password) {
        return signInWithEmailAndPassword(auth, email, password);
    }

    function logout() {
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            setCurrentUser(user);
            if (user) {
                setIsAdmin(user.email === ADMIN_EMAIL);
            } else {
                setIsAdmin(false);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        isAdmin,
        login,
        signup,
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
}
