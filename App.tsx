import React, { useState } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import type { Database } from './database.types';
import Header from './components/Header';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import RankingsPage from './pages/RankingsPage';
import EventsPage from './pages/EventsPage';
import MarketplacePage from './pages/MarketplacePage';
import MediaPage from './pages/MediaPage';
import JudgesPage from './pages/JudgesPage';
import StoresPage from './pages/StoresPage';
import AuthPage from './pages/AuthPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import StoreDashboardPage from './pages/StoreDashboardPage';
import PlayerDashboardPage from './pages/PlayerDashboardPage';
import TournamentsListPage from './pages/TournamentsListPage';
import TournamentStandingsPage from './pages/TournamentStandingsPage';
import SettingsPage from './pages/SettingsPage';
import type { TournamentResult, CommunityEvent, PlayerProfile, TournamentParseResult } from './types';

const mockInitialPlayers: PlayerProfile[] = [];
const mockTournamentResults: TournamentResult[] = [];
const mockInitialEvents: CommunityEvent[] = [];


const AppContent: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'player' | 'store' | 'admin' | null>(null);
  const [tournamentResults, setTournamentResults] = useState<TournamentResult[]>([]);
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([]);
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
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
          }
        }
      } else {
        setIsLoggedIn(false);
        setUserRole(null);
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
        let playerId = null;

        try {
          // Check if player exists
          const { data: existingPlayers, error: searchError } = await supabase
            .from('profiles')
            .select('id, matches_won, matches_lost, matches_drew, pwp')
            .ilike('username', result.playerName)
            .limit(1);

          if (searchError) {
            console.error(`    ❌ Error buscando jugador:`, searchError);
            throw new Error(`Error searching for ${result.playerName}: ${searchError.message}`);
          }

          if (existingPlayers && existingPlayers.length > 0) {
            const p = existingPlayers[0];
            playerId = p.id;
            console.log(`    ℹ️ Jugador existente encontrado, actualizando stats...`);

            const { error: updateError } = await supabase
              .from('profiles')
              .update({
                matches_won: (p.matches_won || 0) + result.wins,
                matches_lost: (p.matches_lost || 0) + result.losses,
                matches_drew: (p.matches_drew || 0) + result.draws,
                pwp: (p.pwp || 0) + result.pwpEarned
              })
              .eq('id', playerId);

            if (updateError) {
              console.error(`    ❌ Error actualizando:`, updateError);
              throw new Error(`Error updating ${result.playerName}: ${updateError.message}`);
            }
            console.log(`    ✅ Stats actualizados`);

          } else {
            console.log(`    ℹ️ Jugador nuevo, creando perfil...`);
            const { count } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true });

            const guestNumber = (count || 0) + 1;
            const guestUsername = `Player${String(guestNumber).padStart(3, '0')}`;
            const newProfileId = crypto.randomUUID();

            const { data: newProfile, error: profileError } = await supabase
              .from('profiles')
              .insert({
                id: newProfileId,
                username: result.playerName || guestUsername,
                role: 'player',
                pwp: result.pwpEarned,
                matches_won: result.wins,
                matches_lost: result.losses,
                matches_drew: result.draws
              })
              .select()
              .single();

            if (profileError) {
              console.error(`    ❌ Error creando perfil:`, profileError);
              throw new Error(`Error creating ${result.playerName}: ${profileError.message}`);
            }
            if (newProfile) {
              playerId = newProfile.id;
              console.log(`    ✅ Perfil creado con ID: ${playerId}`);
            }
          }

          // Insert Result
          if (playerId) {
            console.log(`    Guardando resultado en tournament_results...`);
            const { error: resultError } = await supabase
              .from('tournament_results')
              .insert({
                tournament_id: newTournamentId,
                player_id: playerId,
                player_name: result.playerName,
                wins: result.wins,
                losses: result.losses,
                draws: result.draws,
                pwp_earned: result.pwpEarned
              });

            if (resultError) {
              console.error(`    ❌ Error guardando resultado:`, resultError);
              throw new Error(`Error saving result for ${result.playerName}: ${resultError.message}`);
            }
            console.log(`    ✅ Resultado guardado`);
          }

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
    <div className="bg-slate-900 text-slate-200 min-h-screen flex flex-col">
      <Header isLoggedIn={isLoggedIn} userRole={userRole} handleLogout={handleLogout} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage players={players} events={communityEvents} />} />
          <Route path="/ranking/pwp" element={<RankingsPage players={players} />} />
          <Route path="/eventos" element={<EventsPage events={communityEvents} />} />
          <Route path="/torneos" element={<TournamentsListPage tournaments={tournamentResults} />} />
          <Route path="/torneos/:tournamentId" element={<TournamentStandingsPage />} />
          <Route path="/mercado" element={<MarketplacePage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/media/articulos" element={<div className="text-center text-4xl mt-20">Artículos (En Construcción)</div>} />
          <Route path="/media/videos" element={<div className="text-center text-4xl mt-20">Videos (En Construcción)</div>} />
          <Route path="/media/commander" element={<div className="text-center text-4xl mt-20">Rincón de Commander (En Construcción)</div>} />
          <Route path="/jueces" element={<JudgesPage />} />
          <Route path="/tiendas" element={<StoresPage />} />
          <Route path="/login" element={<AuthPage handleLogin={handleLogin} />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/dashboard/tienda" element={<StoreDashboardPage onTournamentUpload={handleTournamentUpload} userRole={userRole} tournaments={tournamentResults} />} />
          <Route path="/dashboard/jugador" element={<PlayerDashboardPage />} />
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