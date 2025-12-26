import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from "react";
import http from "../lib/http.js";

const AuthContext = createContext(null);
const TOKEN_KEY = "auth_token";

const readToken = () => {
    if (typeof window === "undefined") {
        return null;
    }
    return window.localStorage.getItem(TOKEN_KEY);
};

const writeToken = (token) => {
    if (typeof window === "undefined") {
        return;
    }
    window.localStorage.setItem(TOKEN_KEY, token);
};

const clearToken = () => {
    if (typeof window === "undefined") {
        return;
    }
    window.localStorage.removeItem(TOKEN_KEY);
};

const resolveError = (error, fallback) =>
    error?.response?.data?.message || error?.message || fallback;

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [initializing, setInitializing] = useState(true);

    const refreshUser = useCallback(async () => {
        try {
            const { data } = await http.get("/auth/me");
            setUser(data.user);
            return data.user;
        } catch (error) {
            clearToken();
            setUser(null);
            throw error;
        }
    }, []);

    useEffect(() => {
        const token = readToken();
        if (!token) {
            setInitializing(false);
            return;
        }

        (async () => {
            try {
                await refreshUser();
            } catch (error) {
                console.warn("Failed to refresh user", error);
            } finally {
                setInitializing(false);
            }
        })();
    }, [refreshUser]);

    const login = useCallback(async (payload) => {
        try {
            const { data } = await http.post("/auth/login", payload);
            writeToken(data.token);
            setUser(data.user);
            return data.user;
        } catch (error) {
            const message = resolveError(error, "登录失败");
            throw new Error(message);
        }
    }, []);

    const register = useCallback(async (payload) => {
        try {
            const { data } = await http.post("/auth/register", payload);
            writeToken(data.token);
            setUser(data.user);
            return data.user;
        } catch (error) {
            const message = resolveError(error, "注册失败");
            throw new Error(message);
        }
    }, []);

    const logout = useCallback(() => {
        clearToken();
        setUser(null);
    }, []);

    const value = useMemo(
        () => ({
            user,
            isAuthenticated: Boolean(user),
            initializing,
            login,
            register,
            logout,
            refreshUser,
        }),
        [initializing, login, logout, refreshUser, register, user]
    );

    return (
        <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used within AuthProvider");
    }
    return context;
};
