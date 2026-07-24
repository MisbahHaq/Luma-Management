import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

interface AuthContextValue {
    user: typeof import('../api/mock').mockUser | null;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (data: { email: string; password: string; fullName?: string; role: string }) => Promise<void>;
    forgotPassword: (email: string) => Promise<void>;
    resetPassword: (token: string, newPassword: string) => Promise<void>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<typeof import('../api/mock').mockUser | null>(() => {
        const stored = localStorage.getItem('luma_demo_user');
        return stored ? JSON.parse(stored) : null;
    });

    useEffect(() => {
        const stored = localStorage.getItem('luma_demo_user');
        if (stored) setUser(JSON.parse(stored));
    }, []);

    const login = async (email: string, _password: string) => {
        await new Promise((r) => setTimeout(r, 400));
        const { mockUser } = await import('../api/mock');
        if (email === mockUser.email) {
            localStorage.setItem('luma_demo_user', JSON.stringify(mockUser));
            setUser(mockUser);
            return;
        }
        const fake = { ...mockUser, email, fullName: email.split('@')[0] };
        localStorage.setItem('luma_demo_user', JSON.stringify(fake));
        setUser(fake);
    };

    const register = async (_data: { email: string; password: string; fullName?: string; role: string }) => {
        await new Promise((r) => setTimeout(r, 400));
    };

    const forgotPassword = async (_email: string) => {
        await new Promise((r) => setTimeout(r, 400));
    };

    const resetPassword = async (_token: string, _newPassword: string) => {
        await new Promise((r) => setTimeout(r, 400));
    };

    const logout = () => {
        localStorage.removeItem('luma_demo_user');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, isAuthenticated: Boolean(user), login, register, forgotPassword, resetPassword, logout }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
    return ctx;
}
