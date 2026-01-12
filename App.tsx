import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import type { Database } from './database.types';
import Header from './components/Header';
import Footer from './components/Footer';
import FloatingActionButton from './components/FloatingActionButton';
import ParticlesBackground from './components/ParticlesBackground';
import HomePage from './pages/HomePage';
import RankingsPage from './pages/RankingsPage';
import EventsPage from './pages/EventsPage';
import MarketplacePage from './pages/MarketplacePage';
import MyListingsPage from './pages/MyListingsPage';
import MarketplaceDetailPage from './pages/MarketplaceDetailPage';
import CommanderPage from './pages/CommanderPage';
import PauperPage from './pages/PauperPage';
import PremodernPage from './pages/PremodernPage';
import MediaPage from './pages/MediaPage';
import MediaArticlesPage from './pages/MediaArticlesPage';
import MediaVideosPage from './pages/MediaVideosPage';
// Removed duplicate import

import StoresPage from './pages/StoresPage';
import AuthPage from './pages/AuthPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminCMSPage from './pages/AdminCMSPage';
import ArticleDetailPage from './pages/ArticleDetailPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import ClaimReviewPage from './pages/admin/ClaimReviewPage';
import IntegrityReviewPanel from './pages/admin/IntegrityReviewPanel';
import TournamentEditPage from './pages/admin/TournamentEditPage';
import SubscriptionManagementPage from './pages/admin/SubscriptionManagementPage';
import ContentCreatorsAdminPage from './pages/admin/ContentCreatorsAdminPage';
import MarketplaceAdminPage from './pages/admin/MarketplaceAdminPage';
import NotificationsPage from './pages/NotificationsPage';
import NotificationBell from './components/NotificationBell';
import FavoritesPage from './pages/FavoritesPage';
import SellerProfilePage from './pages/SellerProfilePage';
import CalendarPage from './pages/CalendarPage';
import PlayerStatsPage from './pages/PlayerStatsPage';
import StoreDashboardPage from './pages/StoreDashboardPage';
import LeagueRankingPage from './pages/LeagueRankingPage';
import CommunityLeaguesPage from './pages/CommunityLeaguesPage';
import PlayerDashboardPage from './pages/PlayerDashboardPage';
import TeamProfilePage from './pages/TeamProfilePage';
import TournamentsListPage from './pages/TournamentsListPage';
import TournamentStandingsPage from './pages/TournamentStandingsPage';
import SettingsPage from './pages/SettingsPage';
import LiveStreamPage from './pages/LiveStreamPage';
import SubscriptionSuccessPage from './pages/SubscriptionSuccessPage';
import SubscriptionFailurePage from './pages/SubscriptionFailurePage';
import LogoutSuccessPage from './pages/LogoutSuccessPage';

import AboutPage from './pages/AboutPage';
import ContentPage from './pages/ContentPage';
import ReglamentoPage from './pages/ReglamentoPage';
import PLSPage from './pages/PLSPage';
import EmailConfirmationPage from './pages/EmailConfirmationPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ContentCreatorApplicationPage from './pages/ContentCreatorApplicationPage';
import TermsPage from './pages/TermsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import UniverseSelectionPage from './pages/UniverseSelectionPage';
import type { TournamentResult, CommunityEvent, PlayerProfile, TournamentParseResult, Team } from './types';
import OnboardingModal from './components/OnboardingModal';
import ClaimResultsModal from './components/ClaimResultsModal';
import { GameProvider, useGame } from './context/GameContext';
import CookieConsent from './components/CookieConsent';

const mockInitialPlayers: PlayerProfile[] = [];
const mockTournamentResults: TournamentResult[] = [];
const mockInitialEvents: CommunityEvent[] = [];


const AppContent: React.FC = () => {
  const { currentGame } = useGame(); // Use Game Context
  const [isAuthLoading, setIsAuthLoading] = useState(true); // Auth loading state
  const [isDataLoading, setIsDataLoading] = useState(false); // Data fetching loading state
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'player' | 'store' | 'admin' | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null); // Store full profile
  const [tournamentResults, setTournamentResults] = useState<TournamentResult[]>([]);
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([]);
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [unclaimedResults, setUnclaimedResults] = useState<any[]>([]);
  const [showClaimModal, setShowClaimModal] = useState(false);

  // YouTube Live Signal Detection
  const [isLiveSignal, setIsLiveSignal] = useState(false);
  const YOUTUBE_CHANNEL_ID = 'UC-ymLrXBUoNFhku0d8tWCVA'; // StreamCaster Mage channel
  const YOUTUBE_API_KEY = 'AIzaSyD-EGf2uQdBNFhT2FZ_m_DXR4P3kIR_LN8';

  useEffect(() => {
    console.log("Game Context Changed:", currentGame);
    // Fetch new data for the selected game
    // Don't clear data immediately to avoid blank screens during navigation
    fetchData();
  }, [currentGame]); // Re-fetch when game changes

  useEffect(() => {
    checkYouTubeLiveStatus();
    // Check every 5 minutes
    const interval = setInterval(checkYouTubeLiveStatus, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const checkYouTubeLiveStatus = async () => {
    try {
      // Skip if API key not configured
      if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY.includes('YourAPIKeyHere')) {
        setIsLiveSignal(false);
        return;
      }

      let searchUrl = '';

      // Try with Channel ID first if configured
      if (YOUTUBE_CHANNEL_ID && !YOUTUBE_CHANNEL_ID.includes('YourChannelIDHere')) {
        searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${YOUTUBE_CHANNEL_ID}&eventType=live&type=video&key=${YOUTUBE_API_KEY}`;
      } else {
        // Fallback: Search by channel handle (temporary until Channel ID is configured)
        searchUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&q=@streamcastermage&eventType=live&type=video&key=${YOUTUBE_API_KEY}`;
      }

      const response = await fetch(searchUrl);
      const data = await response.json();

      // Check if there are any live streams
      setIsLiveSignal(data.items && data.items.length > 0);
    } catch (error) {
      console.error('Error checking YouTube live status:', error);
      setIsLiveSignal(false);
    }
  };

  const navigate = useNavigate();

  // Fetch data definition
  const fetchData = async () => {
    // Set loading state
    setIsDataLoading(true);

    try {
      // =====================================================================
      // NUEVO ENFOQUE OPTIMIZADO (V2)
      // Los puntos (PWP) ya están calculados en la tabla 'profiles' por el Trigger SQL.
      // Solo leemos la data, no procesamos nada pesado aquí.
      // =====================================================================

      // =====================================================================
      // NUEVO ENFOQUE OPTIMIZADO (V3) - RANKING DINÁMICO POR JUEGO
      // Usamos una RPC que calcula los puntos al vuelo filtrando por game_type
      // =====================================================================

      // 1. Fetch Players (Ranking) usando RPC
      // Primero obtenemos los equipos para poder cruzarlos
      const { data: teamsData } = await supabase
        .from('teams')
        .select('*');

      const teamsMap: Record<string, Team> = {};
      if (teamsData) {
        teamsData.forEach((t: any) => {
          teamsMap[t.id] = {
            id: t.id,
            name: t.name,
            logoUrl: t.logo_url,
            description: t.description,
            captainId: t.captain_id,
            totalPwp: 0,
            memberCount: 0
          };
        });
      }

      // Usamos la nueva RPC get_game_ranking
      const { data: profilesData, error: profilesError } = await supabase
        .rpc('get_game_ranking', {
          p_game_type: currentGame
        });

      if (profilesError) {
        console.error("Error fetching ranking via RPC:", profilesError);
        // Fallback silencioso o toast, pero la RPC debería ser robusta
        toast.error(`Error cargando ranking: ${profilesError.message}`);
      }

      if (profilesData) {
        // Mapear a formato PlayerProfile
        const mappedPlayers: PlayerProfile[] = (profilesData as any[]).map((p, index) => {
          // Nombre para mostrar
          let displayName = p.username || 'Jugador';
          if (p.first_name || p.last_name) {
            displayName = `${p.first_name || ''} ${p.last_name || ''}`.trim();
          }

          // Resolver datos del equipo
          const teamDetails = p.team_id ? teamsMap[p.team_id] : undefined;

          // Calcular stats de equipo on-the-fly para el ranking de comunidades
          if (teamDetails) {
            teamDetails.totalPwp = (teamDetails.totalPwp || 0) + (p.pwp || 0);
            teamDetails.memberCount = (teamDetails.memberCount || 0) + 1;
          }

          return {
            id: p.id,
            name: displayName,
            region: p.region || 'Sin Región',
            pwp: p.pwp || 0,
            matchesWon: p.matches_won || 0,
            matchesLost: p.matches_lost || 0,
            matchesDrew: p.matches_drew || 0,
            teamId: p.team_id,
            team: p.team, // String legacy
            teamData: teamDetails, // Objeto completo
            isPublic: p.is_public ?? true,
            is_pro: p.is_pro || false,
            is_content_creator: p.is_content_creator ?? (p.role === 'content_creator'),
            is_judge: p.is_judge ?? (p.role === 'judge'),
            tournaments_played: p.tournaments_played || 0
          };
        });
        setPlayers(mappedPlayers);

        // Actualizar estado de equipos con los totales calculados
        const sortedTeams = Object.values(teamsMap).sort((a, b) => (b.totalPwp || 0) - (a.totalPwp || 0));
        setTeams(sortedTeams);
      }

      // 2. Fetch Tournaments (Historial)
      const { data: tourneysData } = await supabase
        .from('tournaments')
        .select('*')
        .eq('game_type', currentGame) // Filtrar por juego actual
        .order('date', { ascending: false })
        .limit(20); // Solo los últimos 20 para el widget de recientes

      const mappedTourneys: TournamentResult[] = (tourneysData || []).map(t => ({
        id: t.id,
        name: t.name,
        date: t.date,
        storeName: t.store_name || 'Unknown Store',
        format: t.format || 'Unknown',
        playerCount: t.player_count || 0
      }));
      setTournamentResults(mappedTourneys);

      // 3. Fetch Calendar Events (Futuros)
      // Usamos la nueva RPC optimizada que devuelve si estoy inscrito
      const { data: scheduledData, error: scheduledError } = await supabase
        .rpc('get_scheduled_events_with_registrations', {
          p_game_type: currentGame
        });

      if (scheduledError) console.error('Error fetching calendar:', scheduledError);

      const scheduledEvents: CommunityEvent[] = (scheduledData || []).map(e => ({
        id: e.id,
        title: e.title,
        date: e.date, // La RPC ya devuelve formato string YYYY-MM-DD
        storeName: e.store_name,
        format: e.format,
        playerCount: e.registration_count || 0,
        createdBy: e.created_by,
        maxPlayers: e.max_players,
        time: e.event_time, // La RPC devuelve event_time
        isUserRegistered: e.is_user_registered || false
      }));
      setCommunityEvents(scheduledEvents);

    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Error al cargar los datos. Por favor, intenta de nuevo.");
    } finally {
      // Always clear loading state
      setIsDataLoading(false);
    }
  };

  // Handle session state changes (wrapped in useCallback for proper initialization)
  const handleSessionState = useCallback(async (session: any) => {
    console.log("=== handleSessionState called ===");
    console.log("Session:", session ? "EXISTS" : "NULL");
    if (session?.user) {
      console.log("User ID:", session.user.id);
      console.log("User email:", session.user.email);
    }

    try {
      if (session?.user) {
        setIsLoggedIn(true);

        // Fetch or create profile
        console.log("Fetching profile for user:", session.user.id);
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', session.user.id)
          .single();

        console.log("Profile fetch result:", { profile, error });

        if (profile) {
          console.log("Profile found! Role:", profile.role);
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

            // TODO: Implement fetchUnclaimedResults
            // fetchUnclaimedResults(session.user.id);
          }
        } else {
          // Profile missing (could be new OAuth user)
          console.log("=== CREATING NEW PROFILE ===");
          console.log("User email:", session.user.email);
          console.log("User ID:", session.user.id);
          console.log("Full user metadata:", session.user.user_metadata);

          // Extract user info from metadata with improved fallback logic
          // Priority: full_name > name > given_name + family_name > email username
          const metadata = session.user.user_metadata;

          let fullName = metadata.full_name || metadata.name;

          // If no full_name or name, try to construct from given_name and family_name
          if (!fullName && (metadata.given_name || metadata.family_name)) {
            fullName = [metadata.given_name, metadata.family_name]
              .filter(Boolean)
              .join(' ')
              .trim();
          }

          // Last resort: use email username
          if (!fullName) {
            fullName = session.user.email?.split('@')[0] || 'Usuario';
          }

          console.log("Extracted full name:", fullName);

          // Get role from localStorage (set during signup) or default to 'player'
          const savedRole = localStorage.getItem('signup_role') as 'player' | 'store' | null;
          const userRole = savedRole || 'player';

          console.log("Creating profile with role:", userRole);

          // Extract first and last names with better logic
          // Priority: given_name/family_name from Google > split full_name > use full_name for both
          let firstName = metadata.given_name || '';
          let lastName = metadata.family_name || '';

          // If Google didn't provide given_name or family_name, try to split full_name
          if (!firstName && !lastName && fullName) {
            const nameParts = fullName.trim().split(' ');
            if (nameParts.length >= 2) {
              firstName = nameParts[0];
              lastName = nameParts.slice(1).join(' ');
            } else {
              // If only one word, use it as first name
              firstName = nameParts[0] || fullName;
              lastName = '';
            }
          }

          // Ensure we never have completely empty names
          if (!firstName && !lastName) {
            firstName = fullName || 'Usuario';
            lastName = '';
          }

          console.log("First name:", firstName, "| Last name:", lastName);

          // Generate unique username by checking for duplicates
          let username = fullName;
          let attempt = 0;
          let isUnique = false;

          console.log("Starting username uniqueness check with:", username);

          while (!isUnique && attempt < 10) {
            const { data: existingUser, error: checkError } = await supabase
              .from('profiles')
              .select('id')
              .eq('username', username)
              .maybeSingle();

            if (checkError) {
              console.error("Error checking username uniqueness:", checkError);
              break;
            }

            if (!existingUser) {
              isUnique = true;
              console.log("✓ Unique username found:", username);
            } else {
              attempt++;
              username = `${fullName}${attempt}`;
              console.log("Username taken, trying:", username);
            }
          }

          // If still not unique after 10 attempts, append timestamp
          if (!isUnique) {
            username = `${fullName}_${Date.now().toString().slice(-6)}`;
            console.log("Using timestamp-based username:", username);
          }

          const newProfile = {
            id: session.user.id,
            username: username,
            role: userRole,
            email: session.user.email,
            avatar_url: metadata.avatar_url || metadata.picture,
            first_name: firstName,
            last_name: lastName,
            pwp: 0,
            matches_won: 0,
            matches_lost: 0,
            matches_drew: 0
          };

          console.log("Profile object to insert:", {
            ...newProfile,
            id: newProfile.id.substring(0, 8) + "..." // Truncate ID for readability
          });

          const { error: insertError } = await supabase
            .from('profiles')
            .insert(newProfile);

          if (insertError) {
            console.error("❌ Error creating profile:", insertError);
            setUserRole(userRole);
            setUserProfile(newProfile);
            // toast.error('Error al crear perfil. Contacta al administrador.');
          } else {
            console.log("✓ Profile created successfully!");
            console.log("Username:", username);
            console.log("Role:", userRole);
            setUserRole(userRole);
            setUserProfile(newProfile);
            localStorage.removeItem('signup_role');
            // toast.success(`¡Bienvenido, ${username}!`);
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
    } finally {
      setIsAuthLoading(false);
    }
  }, []); // Empty dependency array since it only uses setState functions

  // Fetch data on load
  React.useEffect(() => {
    let authSubscription: any = null;

    // 1. Initialize Auth Check
    const initAuth = async () => {
      setIsAuthLoading(true);

      // Safety timeout for auth initialization (increased to 20 seconds)
      const authTimeout = setTimeout(() => {
        console.warn("Auth initialization timed out after 20 seconds. Forcing loading state off.");
        setIsAuthLoading(false);
        setIsLoggedIn(false);
        setUserRole(null);
        setUserProfile(null);
        toast.error("La sesión tardó demasiado en cargar. Por favor, recarga la página.");
      }, 20000); // 20 seconds timeout

      try {
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) {
          console.error("Error getting session:", error);
          throw error;
        }

        console.log("Initial session:", session ? "Found" : "Not found");
        await handleSessionState(session);

        // Subscribe to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
          console.log("Auth state changed:", event, session ? "Session exists" : "No session");

          // Handle email confirmation specifically
          if (event === 'SIGNED_IN' && session) {
            console.log("User signed in, clearing auth loading");
            clearTimeout(authTimeout);
            setIsAuthLoading(false);
          }

          // Handle sign out
          if (event === 'SIGNED_OUT') {
            console.log("User signed out, clearing state");
            setIsLoggedIn(false);
            setUserRole(null);
            setUserProfile(null);
          }

          await handleSessionState(session);
        });

        authSubscription = subscription;
      } catch (err) {
        console.error("Critical Auth Error:", err);
        setIsLoggedIn(false);
        setUserRole(null);
        setUserProfile(null);
        toast.error("Error al cargar la sesión. Por favor, recarga la página.");
      } finally {
        clearTimeout(authTimeout);
        setIsAuthLoading(false);
      }
    };

    initAuth();
    fetchData();

    // Cleanup subscription on unmount
    return () => {
      if (authSubscription) {
        authSubscription.unsubscribe();
      }
    };
  }, [currentGame]);

  if (isAuthLoading) {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col items-center justify-center text-white p-4">
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="space-y-2">
            <p className="text-xl font-bold uppercase tracking-widest animate-pulse">Conectando...</p>
            <p className="text-slate-400 text-sm">Verificando tu sesión</p>
          </div>
          <button
            onClick={() => {
              setIsAuthLoading(false);
              window.location.href = '/#/';
            }}
            className="mt-4 px-8 py-3 bg-sky-600 hover:bg-sky-500 rounded-lg text-sm font-bold uppercase tracking-wider transition-colors"
          >
            Ir al inicio
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

  const handleLogout = async () => {
    try {
      // Clear any stored data
      localStorage.removeItem('signup_role');

      await supabase.auth.signOut();

      // Clear local state
      setIsLoggedIn(false);
      setUserRole(null);
      setUserProfile(null);

      // Force a hard redirect to clear all state
      window.location.href = '/#/logout-success';
    } catch (error) {
      console.error("Error signing out:", error);
      window.location.href = '/#/';
    }
  };

  const fetchUnclaimedResults = async (userId: string) => {
    try {
      const { data, error } = await supabase.rpc('detect_unclaimed_results', {
        p_player_id: userId
      });

      if (error) {
        console.error('Error fetching unclaimed results:', error);
        return;
      }

      if (data && data.length > 0) {
        setUnclaimedResults(data);
        // Mostrar el modal solo si no está mostrando onboarding
        if (!showOnboarding) {
          setShowClaimModal(true);
        }
      }
    } catch (error) {
      console.error('Error in fetchUnclaimedResults:', error);
    }
  };

  const handleClaimProcessed = async () => {
    // Refrescar datos después de procesar reclamaciones
    await fetchData();
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
          p_player_count: tournamentData.playerCount,
          p_game_type: currentGame,
          p_league_id: tournamentData.leagueId || null
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
    closeOnboarding: () => {
      setShowOnboarding(false);
      // Si hay resultados sin reclamar, mostrar el modal después de cerrar onboarding
      if (unclaimedResults.length > 0) {
        setTimeout(() => setShowClaimModal(true), 500);
      }
    },
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

  // Determine theme class
  const themeClass = {
    mtg: 'theme-mtg',
    pokemon: 'theme-pokemon',
    one_piece: 'theme-one_piece',
    lorcana: 'theme-lorcana',
    star_wars: 'theme-star_wars',
    yugioh: 'theme-yugioh',
    flesh_blood: 'theme-flesh_blood',
    digimon: 'theme-digimon'
  }[currentGame] || 'theme-mtg';

  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className={`bg-slate-900 text-slate-200 min-h-screen flex flex-col relative isolate ${themeClass}`}>
      <Toaster position="top-center" richColors theme="dark" />
      <CookieConsent />
      {!isLanding && <ParticlesBackground />}

      {!isLanding && (
        <Header
          isLoggedIn={isLoggedIn}
          userRole={userRole}
          handleLogout={handleLogout}
          isLiveSignal={isLiveSignal}
          userName={userProfile?.username || 'Jugador'}
          userProfile={userProfile}
        />
      )}

      {/* Floating Action Button for Stores */}
      <FloatingActionButton userRole={userRole} />

      <OnboardingModal
        isOpen={showOnboarding}
        onClose={commonHandler.closeOnboarding}
        onGoToSettings={commonHandler.goToSettings}
      />

      <ClaimResultsModal
        isOpen={showClaimModal}
        unclaimedResults={unclaimedResults}
        onClose={() => setShowClaimModal(false)}
        onClaimProcessed={handleClaimProcessed}
      />

      <main className={`flex-grow ${!isLanding ? 'container mx-auto px-4 py-8' : ''}`}>
        <Routes>
          <Route path="/" element={<UniverseSelectionPage />} />
          <Route path="/home" element={<HomePage players={players} events={communityEvents} session={userProfile ? { user: userProfile } : null} userRole={userRole} userId={userProfile?.id} />} />
          <Route path="/envivo" element={<LiveStreamPage />} />
          <Route path="/pls" element={<PLSPage />} />
          <Route path="/ranking/pwp" element={<RankingsPage players={players} teams={teams} />} />
          <Route path="/equipo/:teamId" element={<TeamProfilePage />} />
          <Route path="/eventos" element={<EventsPage events={communityEvents} finishedTournaments={tournamentResults} userRole={userRole} userId={userProfile?.id} />} />
          <Route path="/torneos" element={<TournamentsListPage tournaments={tournamentResults} />} />
          <Route path="/torneos/:tournamentId" element={<TournamentStandingsPage />} />
          <Route path="/mercado" element={<MarketplacePage />} />
          <Route path="/mercado" element={<MarketplacePage />} />
          <Route path="/mercado/:id" element={<MarketplaceDetailPage />} />
          <Route path="/mis-anuncios" element={<MyListingsPage />} />
          <Route path="/commander" element={<CommanderPage />} />
          <Route path="/media" element={<MediaPage />} />
          <Route path="/media/articulos" element={<MediaArticlesPage />} />
          <Route path="/media/articulos/:slug" element={<ArticleDetailPage />} />
          <Route path="/media/videos" element={<MediaVideosPage />} />

          <Route path="/tiendas" element={<StoresPage />} />
          <Route path="/login" element={<AuthPage handleLogin={handleLogin} />} />
          <Route path="/auth" element={<AuthPage handleLogin={handleLogin} />} />
          <Route path="/confirm-email" element={<EmailConfirmationPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/content" element={<ContentPage />} />
          <Route path="/contenido" element={<ContentPage />} />
          <Route path="/reglamento" element={<ReglamentoPage />} />
          <Route path="/terminos" element={<TermsPage />} />
          <Route path="/premium" element={<SubscriptionPage />} />
          <Route path="/suscripcion" element={<SubscriptionPage />} />

          {/* Admin Routes */}
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/claims" element={<ClaimReviewPage />} />
          <Route path="/admin/integrity" element={<IntegrityReviewPanel />} />
          <Route path="/admin/tournaments/edit" element={<TournamentEditPage />} />
          <Route path="/admin/subscriptions" element={<SubscriptionManagementPage />} />
          <Route path="/admin/creators" element={<ContentCreatorsAdminPage />} />
          <Route path="/admin/marketplace" element={<MarketplaceAdminPage />} />
          <Route path="/admin/cms" element={<AdminCMSPage />} />
          <Route path="/pls" element={<PLSPage />} />
          <Route path="/creadores" element={<ContentCreatorApplicationPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/claims" element={<ClaimReviewPage />} />
          <Route path="/admin/integrity" element={<IntegrityReviewPanel />} />
          <Route path="/admin/tournaments/edit" element={<TournamentEditPage />} />

          <Route path="/admin/subscriptions" element={<SubscriptionManagementPage />} />
          <Route path="/admin/creators" element={<ContentCreatorsAdminPage />} />
          <Route path="/admin/cms" element={<AdminCMSPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/seller/:sellerId" element={<SellerProfilePage />} />
          <Route path="/calendario" element={<CalendarPage />} />
          <Route path="/stats" element={<PlayerStatsPage />} />
          <Route path="/dashboard/tienda" element={<StoreDashboardPage onTournamentUpload={handleTournamentUpload} onDeleteTournament={handleDeleteTournament} userRole={userRole} tournaments={tournamentResults} storeStatus={userProfile?.status} storeName={userProfile?.username} storeLogo={userProfile?.avatar_url} />} />
          <Route path="/leagues/:leagueId" element={<LeagueRankingPage />} />
          <Route path="/ligas" element={<CommunityLeaguesPage />} />
          <Route path="/community-leagues" element={<CommunityLeaguesPage />} />
          <Route path="/dashboard/jugador" element={<PlayerDashboardPage profile={userProfile} />} />

          <Route path="/subscription/success" element={<SubscriptionSuccessPage />} />
          <Route path="/logout-success" element={<LogoutSuccessPage />} />
          <Route path="/subscription/failure" element={<SubscriptionFailurePage />} />
        </Routes>
      </main>
      {!isLanding && <Footer />}
    </div>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </HashRouter>
  );
};

export default App;