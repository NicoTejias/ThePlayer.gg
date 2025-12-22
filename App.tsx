import React, { useState } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import type { Database } from './database.types';
import Header from './components/Header';
import Footer from './components/Footer';
import ParticlesBackground from './components/ParticlesBackground';
import HomePage from './pages/HomePage';
import RankingsPage from './pages/RankingsPage';
import EventsPage from './pages/EventsPage';
import MarketplacePage from './pages/MarketplacePage';
import MarketplaceDetailPage from './pages/MarketplaceDetailPage';
import CommanderPage from './pages/CommanderPage';
import MediaPage from './pages/MediaPage';
import MediaArticlesPage from './pages/MediaArticlesPage';
import MediaVideosPage from './pages/MediaVideosPage';
import PLSPage from './pages/PLSPage';
import JudgesPage from './pages/JudgesPage';
import StoresPage from './pages/StoresPage';
import AuthPage from './pages/AuthPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import StoreDashboardPage from './pages/StoreDashboardPage';
import PlayerDashboardPage from './pages/PlayerDashboardPage';
import TournamentsListPage from './pages/TournamentsListPage';
import TournamentStandingsPage from './pages/TournamentStandingsPage';
import SettingsPage from './pages/SettingsPage';
import LiveStreamPage from './pages/LiveStreamPage';
import type { TournamentResult, CommunityEvent, PlayerProfile, TournamentParseResult } from './types';
import OnboardingModal from './components/OnboardingModal';

const mockInitialPlayers: PlayerProfile[] = [];
const mockTournamentResults: TournamentResult[] = [];
const mockInitialEvents: CommunityEvent[] = [];


const AppContent: React.FC = () => {
  const [isAuthLoading, setIsAuthLoading] = useState(true); // New loading state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'player' | 'store' | 'admin' | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null); // Store full profile
  const [tournamentResults, setTournamentResults] = useState<TournamentResult[]>([]);
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([]);
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Hardcoded for now. In future, fetch this from Supabase 'system_status' table or similar.
  const [isLiveSignal, setIsLiveSignal] = useState(true);
  const navigate = useNavigate();

  // Fetch data definition
  const fetchData = async () => {
    // 1. Fetch Players
    const { data: profilesData, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .order('pwp', { ascending: false });

    if (profilesData) {
      const mappedPlayers: PlayerProfile[] = profilesData.map(p => ({
        id: p.id,
        name: p.username || 'Unknown',
        region: p.region || 'Unknown',
        pwp: p.pwp || 0,
        matchesWon: p.matches_won || 0,
        matchesLost: p.matches_lost || 0,
        matchesDrew: p.matches_drew || 0,
        team: p.team,
        isPublic: p.is_public || false
      }));
      setPlayers(mappedPlayers);
    }

    // 2. Fetch Tournaments
    const { data: tourneysData, error: tourneysError } = await supabase
      .from('tournaments')
      .select('*')
      .order('date', { ascending: false });

    if (tourneysData) {
      const mappedTourneys: TournamentResult[] = tourneysData.map(t => ({
        id: t.id,
        name: t.name,
        date: t.date,
        storeName: t.store_name || 'Unknown Store',
        format: t.format || 'Unknown',
        playerCount: t.player_count || 0
      }));
      setTournamentResults(mappedTourneys);

      const mappedEvents: CommunityEvent[] = mappedTourneys.map(t => ({
        id: t.id,
        title: t.name,
        date: t.date,
        storeName: t.storeName,
        format: t.format,
        playerCount: t.playerCount
      }));
      setCommunityEvents(mappedEvents);
    }
  };

  // Fetch data on load
  React.useEffect(() => {
    // 1. Initialize Auth Check
    const initAuth = async () => {
      setIsAuthLoading(true);
      try {
        // Check active session immediately
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        await handleSessionState(session);

        // Setup listener for future changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          // We don't await this inside the event loop in a way that blocks init, 
          // but we want to ensure state updates correctly.
          await handleSessionState(session);
        });

        // Warning: returning the cleanup function here inside the async function 
        // doesn't actually work for useEffect cleanup because useEffect expects 
        // the immediate return to be the cleanup.
        // We need to move the subscription out or handle it differently if we want strict cleanup.
        // For now, let's just keep the logic flowing but fix the loading state.

      } catch (err) {
        console.error("Critical Auth Error:", err);
        setIsLoggedIn(false);
      } finally {
        setIsAuthLoading(false);
      }
    };

    initAuth();
    fetchData();
  }, []);

  const handleSessionState = async (session: any) => {
    try {
      if (session?.user) {
        setIsLoggedIn(true);

        // Fetch or create profile
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setUserRole(profile.role as 'player' | 'store' | 'admin');
          setUserProfile(profile);
          console.log("Logged in as:", profile.role);

          // Check for Alias (Onboarding)
          if (profile.role === 'player') {
            const { count } = await supabase
              .from('player_aliases')
              .select('*', { count: 'exact', head: true })
              .eq('player_id', session.user.id);

            if (count === 0) {
              setShowOnboarding(true);
            }
          }
        } else {
          // Profile missing (could be new OAuth user or Email user with failed profile creation)
          console.log("Profile not found, creating new profile...");

          const fullName = session.user.user_metadata.full_name || session.user.user_metadata.username || session.user.email?.split('@')[0] || 'User';
          const userRole = (session.user.user_metadata.role as 'player' | 'store') || (localStorage.getItem('signup_role') as 'player' | 'store') || 'player';

          const newProfile = {
            id: session.user.id,
            username: fullName,
            role: userRole,
            email: session.user.email,
            avatar_url: session.user.user_metadata.avatar_url,
            pwp: 0,
            matches_won: 0,
            matches_lost: 0,
            matches_drew: 0
          };

          const { error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile);

          if (insertError) {
            console.error("Error creating profile automatically (likely RLS). Using temp profile:", insertError);
            // Fallback: Set profile in memory anyway so the user can use the site temporarily
            setUserRole(userRole);
            setUserProfile(newProfile);
          } else {
            console.log("Profile created successfully.");
            setUserRole(userRole);
            setUserProfile(newProfile);
          }
        }
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
        setUserProfile(null);
        setShowOnboarding(false);
      }
    } catch (error) {
      console.error("Error in handleSessionState:", error);
      // Ensure we don't break the app - set to logged out state
      setIsLoggedIn(false);
      setUserRole(null);
      setUserProfile(null);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="bg-slate-900 min-h-screen flex items-center justify-center text-white">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="animate-pulse">Cargando sesión...</p>
        </div>
      </div>
    );
  }


  const handleLogin = async (role: 'player' | 'store' | 'admin') => {
    setIsLoggedIn(true);
    setUserRole(role);
    switch (role) {
      case 'admin':
        navigate('/admin');
        break;
      case 'store':
        navigate('/dashboard/tienda');
        break;
      case 'player':
        navigate('/dashboard/jugador');
        break;
      default:
        navigate('/');
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    navigate('/');
  };

  const handleTournamentUpload = async (tournamentData: Omit<TournamentResult, 'id'>, playerResults: TournamentParseResult[]) => {
    console.log("=== INICIO DE SUBIDA ===");
    console.log("Tournament Data:", tournamentData);
    const errors: string[] = [];

    try {
      const dateParts = tournamentData.date.split('/');
      const isoDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : tournamentData.date;

      // PROBE CONNECTION
      const { count, error: probeError } = await supabase.from('tournaments').select('*', { count: 'exact', head: true });
      if (probeError) throw new Error("No hay conexión con la base de datos (Lectura fallida).");

      // 1. Upload Tournament Record
      const newTournamentId = crypto.randomUUID();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("La base de datos tardó demasiado en responder (Timeout). Revisa tu conexión o las políticas RLS.")), 15000)
      );

      const insertPromise = supabase
        .rpc('create_tournament_via_rpc', {
          p_id: newTournamentId,
          p_name: tournamentData.name,
          p_date: isoDate,
          p_store_name: tournamentData.storeName,
          p_format: tournamentData.format,
          p_player_count: tournamentData.playerCount
        });

      const { error: tourneyError } = await Promise.race([insertPromise, timeoutPromise]) as any;

      if (tourneyError) throw new Error(tourneyError?.message || "Error al crear el torneo");

      // 2. Process Players and Results
      for (let i = 0; i < playerResults.length; i++) {
        const result = playerResults[i];
        try {
          const { error: rpcError } = await supabase.rpc('process_player_result', {
            p_tournament_id: newTournamentId,
            p_player_name: result.playerName,
            p_wins: result.wins,
            p_losses: result.losses,
            p_draws: result.draws,
            p_pwp_earned: result.pwpEarned
          });

          if (rpcError) throw new Error(rpcError.message);

        } catch (innerError: any) {
          errors.push(`${result.playerName}: ${innerError.message || "Unknown error"}`);
        }
      }

      await fetchData();

      if (errors.length > 0) {
        alert(`Torneo subido con advertencias. Revisa los siguientes errores:\n${errors.join('\n')}`);
      } else {
        alert("¡Torneo subido con éxito! El ranking ha sido actualizado.");
      }

    } catch (error: any) {
      console.error("💥 ERROR CRÍTICO:", error);
      alert(`Error crítico al crear el torneo: ${error.message || 'Error desconocido'}`);
    }
  };

  const commonHandler = {
    closeOnboarding: () => setShowOnboarding(false),
    goToSettings: () => {
      setShowOnboarding(false);
      navigate('/settings');
    }
  };

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen flex flex-col relative isolate">
      <ParticlesBackground />
      <Header isLoggedIn={isLoggedIn} userRole={userRole} handleLogout={handleLogout}
        isLiveSignal={isLiveSignal}
        userName={userProfile?.username || 'Jugador'}
      />

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={commonHandler.closeOnboarding}
        onGoToSettings={commonHandler.goToSettings}
      />

      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage players={players} events={communityEvents} />} />
          <Route path="/envivo" element={<LiveStreamPage />} />
          <Route path="/pls" element={<PLSPage />} />
          <Route path="/ranking/pwp" element={<RankingsPage players={players} />} />
          <Route path="/eventos" element={<EventsPage events={communityEvents} />} />
          <Route path="/torneos" element={<TournamentsListPage tournaments={tournamentResults} />} />
          <Route path="/torneos/:tournamentId" element={<TournamentStandingsPage />} />
          <Route path="/mercado" element={<MarketplacePage />} />
          <Route path="/mercado/:id" element={<MarketplaceDetailPage />} />
          <Route path="/commander" element={<CommanderPage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/media/articulos" element={<MediaArticlesPage />} />
          <Route path="/media/videos" element={<MediaVideosPage />} />
          <Route path="/jueces" element={<JudgesPage />} />
          <Route path="/tiendas" element={<StoresPage />} />
          <Route path="/login" element={<AuthPage handleLogin={handleLogin} />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/dashboard/tienda" element={<StoreDashboardPage onTournamentUpload={handleTournamentUpload} userRole={userRole} tournaments={tournamentResults} storeStatus={userProfile?.status} />} />
          <Route path="/dashboard/jugador" element={<PlayerDashboardPage profile={userProfile} />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <AppContent />
    </HashRouter>
  );
};

export default App;