import React, { useState } from 'react';
import { Toaster, toast } from 'sonner';
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
import TeamProfilePage from './pages/TeamProfilePage';
import TournamentsListPage from './pages/TournamentsListPage';
import TournamentStandingsPage from './pages/TournamentStandingsPage';
import SettingsPage from './pages/SettingsPage';
import LiveStreamPage from './pages/LiveStreamPage';
import type { TournamentResult, CommunityEvent, PlayerProfile, TournamentParseResult, Team } from './types';
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
  const [teams, setTeams] = useState<Team[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Hardcoded for now. In future, fetch this from Supabase 'system_status' table or similar.
  const [isLiveSignal, setIsLiveSignal] = useState(true);
  const navigate = useNavigate();

  // Fetch data definition
  const fetchData = async () => {
    // =====================================================================
    // NUEVO ENFOQUE: Construir ranking desde tournament_results
    // Esto permite que TODOS los jugadores de torneos aparezcan en el ranking
    // incluso si no tienen cuenta registrada.
    // =====================================================================

    // 1. Fetch tournament results agrupados por player_name
    const { data: resultsData, error: resultsError } = await supabase
      .from('tournament_results')
      .select(`
        player_name,
        player_id,
        pwp_earned,
        wins,
        losses,
        draws
      `);

    if (resultsData) {
      // Agrupar resultados por player_name (o player_id si existe)
      const playerMap: Record<string, {
        name: string;
        playerId: string | null;
        pwp: number;
        wins: number;
        losses: number;
        draws: number;
      }> = {};

      for (const result of resultsData) {
        // Usar player_id como key si existe, sino usar player_name
        const key = result.player_id || result.player_name;

        if (!playerMap[key]) {
          playerMap[key] = {
            name: result.player_name,
            playerId: result.player_id,
            pwp: 0,
            wins: 0,
            losses: 0,
            draws: 0
          };
        }

        playerMap[key].pwp += result.pwp_earned || 0;
        playerMap[key].wins += result.wins || 0;
        playerMap[key].losses += result.losses || 0;
        playerMap[key].draws += result.draws || 0;
      }

      // Obtener información adicional de profiles para jugadores vinculados
      const playerIds = Object.values(playerMap)
        .map(p => p.playerId)
        .filter(id => id !== null) as string[];

      let profilesMap: Record<string, {
        firstName: string;
        lastName: string;
        username: string;
        region: string;
        team: string | null;
        teamId: string | null;
        isPublic: boolean
      }> = {};

      if (playerIds.length > 0) {
        const { data: profilesData } = await supabase
          .from('profiles')
          .select('id, username, first_name, last_name, region, team, team_id, is_public')
          .in('id', playerIds);

        if (profilesData) {
          for (const profile of profilesData) {
            profilesMap[profile.id] = {
              firstName: profile.first_name || '',
              lastName: profile.last_name || '',
              username: profile.username || 'Unknown',
              region: profile.region || 'Unknown',
              team: profile.team,
              teamId: profile.team_id,
              isPublic: profile.is_public ?? false
            };
          }
        }
      }

      // 1.5 Fetch Teams
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*');

      const teamsMap: Record<string, Team> = {};
      if (teamsData) {
        for (const t of teamsData) {
          teamsMap[t.id] = {
            id: t.id,
            name: t.name,
            logoUrl: t.logo_url,
            description: t.description,
            captainId: t.captain_id,
            totalPwp: 0,
            memberCount: 0
          };
        }
      }

      // Mapear a PlayerProfile
      // IMPORTANTE: Ordenar primero para asignar números consistentes
      const sortedEntries = Object.entries(playerMap).sort((a, b) => b[1].pwp - a[1].pwp);

      const mappedPlayers: PlayerProfile[] = sortedEntries.map(([key, data], index) => {
        const profile = data.playerId ? profilesMap[data.playerId] : null;
        const hasAccount = profile !== null;

        // Generar número de jugador anónimo (basado en posición del ranking)
        const anonymousNumber = String(index + 1).padStart(3, '0');

        // Determinar el nombre a mostrar
        let displayName: string;
        if (hasAccount) {
          // Si tiene cuenta → mostrar Nombre Apellido (o username como fallback)
          const fullName = `${profile.firstName} ${profile.lastName}`.trim();
          displayName = fullName || profile.username;
        } else {
          // Si NO tiene cuenta → mostrar "Jugador XXX" (anónimo)
          displayName = `Jugador ${anonymousNumber}`;
        }

        // Link to teamData if available
        const teamData = profile?.teamId ? teamsMap[profile.teamId] : undefined;

        // Accumulate team stats
        if (teamData) {
          teamData.totalPwp = (teamData.totalPwp || 0) + data.pwp;
          teamData.memberCount = (teamData.memberCount || 0) + 1;
        }

        return {
          id: data.playerId || key, // Usar player_name como ID si no tiene cuenta
          name: displayName,
          region: hasAccount ? profile.region : 'Sin Región',
          pwp: data.pwp,
          matchesWon: data.wins,
          matchesLost: data.losses,
          matchesDrew: data.draws,
          teamId: profile?.teamId || undefined,
          team: profile?.team || null,
          teamData: teamData,
          // isPublic = true si tiene cuenta vinculada
          isPublic: hasAccount
        };
      });

      // Sort teams by total PWP
      const sortedTeams = Object.values(teamsMap).sort((a, b) => (b.totalPwp || 0) - (a.totalPwp || 0));
      setTeams(sortedTeams);

      // Ya está ordenado por PWP descendente
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

      // Solo convertir torneos FUTUROS a CommunityEvents
      // Los torneos pasados solo están en tournamentResults
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const futureTournaments: CommunityEvent[] = mappedTourneys
        .filter(t => new Date(t.date) >= today) // Solo eventos futuros
        .map(t => ({
          id: t.id,
          title: t.name,
          date: t.date,
          storeName: t.storeName,
          format: t.format,
          playerCount: t.playerCount
        }));

      // 3. Fetch Scheduled Events (eventos agendados) con contador de inscritos
      const { data: scheduledData, error: scheduledError } = await supabase
        .rpc('get_scheduled_events_with_registrations');

      if (scheduledError) {
        console.error('Error fetching scheduled events:', scheduledError);
      }

      const scheduledEvents: CommunityEvent[] = scheduledData?.map(e => ({
        id: e.id,
        title: e.title,
        date: e.date,
        storeName: e.store_name,
        format: e.format,
        playerCount: e.registration_count || 0, // Contador real de inscritos
        createdBy: e.created_by, // ID del creador del evento
        maxPlayers: e.max_players, // Máximo de jugadores
        time: e.event_time, // Hora del evento
        isUserRegistered: e.is_user_registered || false // Si el usuario está inscrito
      })) || [];

      // Combinar torneos futuros con eventos agendados
      const allEvents = [...futureTournaments, ...scheduledEvents];
      setCommunityEvents(allEvents);
    }
  };

  // Fetch data on load
  React.useEffect(() => {
    // 1. Initialize Auth Check
    const initAuth = async () => {
      setIsAuthLoading(true);

      // Safety timeout for auth initialization
      const authTimeout = setTimeout(() => {
        if (isAuthLoading) {
          console.warn("Auth initialization timed out. Forcing loading state off.");
          setIsAuthLoading(false);
        }
      }, 8000);

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        await handleSessionState(session);

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
          handleSessionState(session);
        });
      } catch (err) {
        console.error("Critical Auth Error:", err);
        setIsLoggedIn(false);
      } finally {
        clearTimeout(authTimeout);
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
      setIsLoggedIn(false);
      setUserRole(null);
      setUserProfile(null);
    }
  };

  if (isAuthLoading) {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col items-center justify-center text-white p-4">
        <div className="flex flex-col items-center gap-6 max-w-sm text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="space-y-2">
            <p className="text-xl font-bold uppercase tracking-widest animate-pulse">Cargando sesión...</p>
            <p className="text-slate-500 text-sm italic">Si esto tarda demasiado, por favor recarga la página o revisa tu conexión.</p>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-6 py-2 bg-slate-800 hover:bg-slate-700 rounded-full text-xs font-bold uppercase tracking-tighter border border-slate-700 transition-colors"
          >
            Forzar Recarga
          </button>
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

      // 2. Process Players and Results (Bulk Upload)
      const resultsToUpload = playerResults.map((result, index) => ({
        player_name: result.playerName,
        wins: result.wins,
        losses: result.losses,
        draws: result.draws,
        pwp_earned: result.pwpEarned,
        rank: index + 1
      }));

      // Wrap RPC in timeout to prevent hanging UI
      const bulkUploadPromise = supabase.rpc('process_tournament_results_bulk', {
        p_tournament_id: newTournamentId,
        p_results: resultsToUpload
      });

      const timeoutPromiseBulk = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("La subida masiva tardó demasiado (Timeout).")), 30000)
      );

      const { error: rpcError } = await Promise.race([bulkUploadPromise, timeoutPromiseBulk]) as any;

      if (rpcError) throw new Error(rpcError.message);

      await fetchData();

      if (errors.length > 0) {
        toast.warning('Torneo subido con advertencias', {
          description: errors.join('\n'),
          duration: 10000,
        });
      } else {
        toast.success('¡Torneo subido con éxito!', {
          description: 'El ranking ha sido actualizado correctamente.',
        });
      }

    } catch (error: any) {
      console.error("💥 ERROR CRÍTICO:", error);
      toast.error('Error al crear el torneo', {
        description: error.message || 'Error desconocido',
      });
    }
  };

  const commonHandler = {
    closeOnboarding: () => setShowOnboarding(false),
    goToSettings: () => {
      setShowOnboarding(false);
      navigate('/settings');
    }
  };

  const handleDeleteTournament = async (tournamentId: string) => {
    try {
      const { data, error } = await supabase.rpc('delete_tournament_by_id', {
        tournament_id_param: tournamentId
      });

      if (error) throw error;
      if (!data.success) throw new Error(data.message);

      toast.success('Torneo eliminado correctamente');
      await fetchData(); // Refrescar datos para que desaparezca de la lista
    } catch (error: any) {
      console.error("Error deleting tournament:", error);
      toast.error('Error al eliminar el torneo', { description: error.message });
    }
  };

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen flex flex-col relative isolate">
      <Toaster position="top-center" richColors theme="dark" />
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
          <Route path="/ranking/pwp" element={<RankingsPage players={players} teams={teams} />} />
          <Route path="/equipo/:teamId" element={<TeamProfilePage />} />
          <Route path="/eventos" element={<EventsPage events={communityEvents} finishedTournaments={tournamentResults} userRole={userRole} userId={userProfile?.id} />} />
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
          <Route path="/dashboard/tienda" element={<StoreDashboardPage onTournamentUpload={handleTournamentUpload} onDeleteTournament={handleDeleteTournament} userRole={userRole} tournaments={tournamentResults} storeStatus={userProfile?.status} storeName={userProfile?.username} />} />
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