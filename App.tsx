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
// ... existing code ...


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

const mockInitialPlayers: PlayerProfile[] = [];
const mockTournamentResults: TournamentResult[] = [];
const mockInitialEvents: CommunityEvent[] = [];


const AppContent: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'player' | 'store' | 'admin' | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null); // Store full profile
  const [tournamentResults, setTournamentResults] = useState<TournamentResult[]>([]);
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([]);
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  // Hardcoded for now. In future, fetch this from Supabase 'system_status' table or similar.
  const [isLiveSignal, setIsLiveSignal] = useState(true);
  const navigate = useNavigate();

  // Fetch data on load
  React.useEffect(() => {
    fetchData();

    // Handle Supabase Auth
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth event:", event);

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
        } else {
          // Create new profile for OAuth user
          console.log("New user, creating profile...");
          const newProfile = {
            id: session.user.id,
            username: session.user.user_metadata.full_name || session.user.email?.split('@')[0] || 'User',
            role: (localStorage.getItem('signup_role') as 'player' | 'store') || 'player', // Use selected role or default
            email: session.user.email,
            avatar_url: session.user.user_metadata.avatar_url
          };

          const { error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile);

          if (insertError) {
            console.error("Error creating profile:", insertError);
          } else {
            setUserRole('player');
            if (newProfile) setUserProfile(newProfile);
          }
        }
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
        setUserProfile(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

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
        team: p.team // Add team
        // winRate calc could happen here if needed, or in the component
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
        storeName: t.store_name || 'Unknown Store', // Keeping consistent with previous map
        format: t.format || 'Unknown',
        playerCount: t.player_count || 0
      }));
      setTournamentResults(mappedTourneys);

      // Map tournaments to CommunityEvents (assuming for now they are same source or related)
      // Note: In a real app, 'Events' might be future scheduled events vs 'Tournaments' which are past results
      // For now, let's just populate events with the same data or similar logic if intended
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

  const handleLogin = async (role: 'player' | 'store' | 'admin') => {
    // Kept for manual login simulation or if you expand it later
    // The AuthPage now handles the actual Supabase calls for Google
    // which triggers the onAuthStateChange above.
    // Manual login forms in AuthPage should also ideally be updated to use Supabase.

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
    console.log("Player Results:", playerResults);
    const errors: string[] = [];

    try {
      // Convert date from DD/MM/YYYY to YYYY-MM-DD for Supabase
      const dateParts = tournamentData.date.split('/');
      const isoDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : tournamentData.date;
      console.log("Fecha convertida:", isoDate);

      // PROBE CONNECTION
      console.log("🔍 Probando conexión de lectura...");
      const { count, error: probeError } = await supabase.from('tournaments').select('*', { count: 'exact', head: true });
      if (probeError) {
        console.error("❌ La lectura falló. No hay conexión con DB:", probeError);
        throw new Error("No hay conexión con la base de datos (Lectura fallida).");
      }
      console.log("✅ Conexión de lectura OK. Filas actuales:", count);

      // 1. Upload Tournament Record
      console.log("Paso 1: Insertando torneo VÍA RPC (Función SQL) + SECURITY DEFINER...");

      // Generate ID manually
      const newTournamentId = crypto.randomUUID();
      console.log("ID generado manualmente:", newTournamentId);

      // Create a promise that rejects after 15 seconds
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("La base de datos tardó demasiado en responder (Timeout). Revisa tu conexión o las políticas RLS.")), 15000)
      );

      // USE RPC to bypass Table Insert issues
      const insertPromise = supabase
        .rpc('create_tournament_via_rpc', {
          p_id: newTournamentId,
          p_name: tournamentData.name,
          p_date: isoDate,
          p_store_name: tournamentData.storeName,
          p_format: tournamentData.format,
          p_player_count: tournamentData.playerCount
        });

      // Race against the timeout
      const { error: tourneyError } = await Promise.race([insertPromise, timeoutPromise]) as any;

      if (tourneyError) {
        console.error("❌ ERROR AL CREAR TORNEO:", tourneyError);
        throw new Error(tourneyError?.message || "Error al crear el torneo");
      }

      console.log("✅ Torneo creado con ID:", newTournamentId);

      // 2. Process Players and Results
      console.log(`Paso 2: Procesando ${playerResults.length} jugadores...`);
      for (let i = 0; i < playerResults.length; i++) {
        const result = playerResults[i];
        console.log(`  Procesando jugador ${i + 1}/${playerResults.length}: ${result.playerName}`);

        try {
          const { error: rpcError } = await supabase.rpc('process_player_result', {
            p_tournament_id: newTournamentId,
            p_player_name: result.playerName,
            p_wins: result.wins,
            p_losses: result.losses,
            p_draws: result.draws,
            p_pwp_earned: result.pwpEarned
          });

          if (rpcError) {
            console.error(`    ❌ Error RPC:`, rpcError);
            throw new Error(rpcError.message);
          }
          console.log(`    ✅ Procesado correctamente`);

        } catch (innerError: any) {
          console.error(`  ❌ ERROR PROCESANDO ${result.playerName}:`, innerError);
          errors.push(`${result.playerName}: ${innerError.message || "Unknown error"}`);
        }
      }

      // Refresh data
      console.log("Paso 3: Refrescando datos de la app...");
      await fetchData();
      console.log("✅ Datos refrescados");

      if (errors.length > 0) {
        console.warn("⚠️ Subida completada con errores:", errors);
        alert(`Torneo subido con advertencias. Revisa los siguientes errores:\n${errors.join('\n')}`);
      } else {
        console.log("🎉 SUBIDA EXITOSA");
        alert("¡Torneo subido con éxito! El ranking ha sido actualizado.");
      }

    } catch (error: any) {
      console.error("💥 ERROR CRÍTICO:", error);
      alert(`Error crítico al crear el torneo: ${error.message || 'Error desconocido'}`);
    }
  };

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen flex flex-col relative isolate">
      <ParticlesBackground />
      <Header isLoggedIn={isLoggedIn} userRole={userRole} handleLogout={handleLogout} isLiveSignal={isLiveSignal} />
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
          <Route path="/dashboard/tienda" element={<StoreDashboardPage onTournamentUpload={handleTournamentUpload} userRole={userRole} tournaments={tournamentResults} />} />
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