import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import client from '../api/client';
import { notificationHub } from '../api/notificationHub';
import type { AuthResponse, User, UserRole } from '../types/types';

interface RegisterPayload {
    email: string;
    password: string;
    fullName?: string;
    role: UserRole;
}

interface AuthContextValue {
    currentUser: User | null;
    token: string | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (payload: RegisterPayload) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [currentUser, setCurrentUser] = useState<User | null>(() => {
        const stored = localStorage.getItem('luma_user');
        return stored ? (JSON.parse(stored) as User) : null;
    });
    const [token, setToken] = useState<string | null>(() => localStorage.getItem('luma_token'));

    useEffect(() => {
        const existing = localStorage.getItem('luma_token');
        if (existing) {
            void notificationHub.start(existing);
        }
    }, []);

    const persist = (auth: AuthResponse) => {
        localStorage.setItem('luma_token', auth.token);
        localStorage.setItem('luma_user', JSON.stringify(auth.user));
        setToken(auth.token);
        setCurrentUser(auth.user);
        void notificationHub.start(auth.token);
    };

    const login = async (email: string, password: string) => {
        const { data } = await client.post<AuthResponse>('/auth/login', { email, password });
        persist(data);
    };

    const register = async (payload: RegisterPayload) => {
        const { data } = await client.post<AuthResponse>('/auth/register', payload);
        persist(data);
    };

    const logout = () => {
        localStorage.removeItem('luma_token');
        localStorage.removeItem('luma_user');
        setToken(null);
        setCurrentUser(null);
        void notificationHub.stop();
    };

    return (
        <AuthContext.Provider
            value={{
                currentUser,
                token,
                isAuthenticated: Boolean(token),
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return ctx;
}
