import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

export const useAuth = () => {
    const navigate = useNavigate();
    const [isAuthLoading, setIsAuthLoading] = useState(true);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [userRole, setUserRole] = useState<'player' | 'store' | 'admin' | null>(null);
    const [userProfile, setUserProfile] = useState<any>(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [hasAlias, setHasAlias] = useState<boolean>(true);

    const handleSessionState = useCallback(async (session: any) => {
        if (!session?.user) {
            setIsLoggedIn(false);
            setUserRole(null);
            setUserProfile(null);
            setHasAlias(true);
            setIsAuthLoading(false);
            return;
        }

        try {
            setIsLoggedIn(true);
            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();

            if (profile) {
                setUserRole(profile.role);
                setUserProfile(profile);
                if (profile.role === 'player') {
                    const { count } = await supabase.from('player_aliases').select('*', { count: 'exact', head: true }).eq('player_id', session.user.id);
                    const exists = count !== null && count > 0;
                    setHasAlias(exists);
                    if (!exists) setShowOnboarding(true);
                } else {
                    setHasAlias(true);
                }
            } else {
                console.warn("Profile not found for session user");
                setHasAlias(true);
            }
        } catch (e) {
            console.error("Session State Error:", e);
            setHasAlias(true);
        } finally {
            setIsAuthLoading(false);
        }
    }, []);

    const handleLogin = (role: any) => {
        setIsLoggedIn(true);
        setUserRole(role);
        const savedGame = localStorage.getItem('selectedGame');
        if (role === 'player' && savedGame) {
            navigate('/home');
        } else {
            navigate(role === 'admin' ? '/admin' : role === 'store' ? '/dashboard/tienda' : '/dashboard/jugador');
        }
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setIsLoggedIn(false);
        setUserRole(null);
        setUserProfile(null);
        window.location.href = '/#/logout-success';
    };

    useEffect(() => {
        const initAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            await handleSessionState(session);

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (evt, ses) => {
                if (evt === 'SIGNED_OUT') {
                    setIsLoggedIn(false);
                    setUserRole(null);
                    setUserProfile(null);
                    setIsAuthLoading(false);
                    navigate('/');
                } else if (evt === 'SIGNED_IN' || evt === 'TOKEN_REFRESHED') {
                    await handleSessionState(ses);
                }
            });

            return () => subscription.unsubscribe();
        };
        initAuth();

        const timeout = setTimeout(() => setIsAuthLoading(false), 3000);
        return () => clearTimeout(timeout);
    }, [handleSessionState, navigate]);

    return {
        isAuthLoading,
        isLoggedIn,
        userRole,
        userProfile,
        showOnboarding,
        setShowOnboarding,
        hasAlias,
        handleLogin,
        handleLogout
    };
};
