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
import FavoritesPage from './pages/FavoritesPage';
import SellerProfilePage from './pages/SellerProfilePage';
import CalendarPage from './pages/CalendarPage';
import CreatorDashboardPage from './pages/CreatorDashboardPage';
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
import NotFoundPage from './pages/NotFoundPage';
import HallOfFamePage from './pages/HallOfFamePage';
import AdminAwardsPage from './pages/AdminAwardsPage';
import AdminSeasonPage from './pages/admin/AdminSeasonPage';
import SupportPage from './pages/SupportPage';
import ContentCreatorApplicationPage from './pages/ContentCreatorApplicationPage';
import TermsPage from './pages/TermsPage';
import SubscriptionPage from './pages/SubscriptionPage';
import UniverseSelectionPage from './pages/UniverseSelectionPage';
import type { TournamentResult, CommunityEvent, PlayerProfile, TournamentParseResult, Team } from './types';
import OnboardingModal from './components/OnboardingModal';
import ClaimResultsModal from './components/ClaimResultsModal';
import { GameProvider, useGame } from './context/GameContext';
import CookieConsent from './components/CookieConsent';
import ChatAssistant from './components/ChatAssistant';

const AppContent: React.FC = () => {
  const { currentGame } = useGame();
  const navigate = useNavigate();
  const location = useLocation();

  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isDataLoading, setIsDataLoading] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'player' | 'store' | 'admin' | null>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [tournamentResults, setTournamentResults] = useState<TournamentResult[]>([]);
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>([]);
  const [players, setPlayers] = useState<PlayerProfile[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [unclaimedResults, setUnclaimedResults] = useState<any[]>([]);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [isLiveSignal, setIsLiveSignal] = useState(false);

  // YouTube Live Detection
  const YOUTUBE_CHANNEL_ID = 'UC-ymLrXBUoNFhku0d8tWCVA';
  const YOUTUBE_API_KEY = 'AIzaSyD-EGf2uQdBNFhT2FZ_m_DXR4P3kIR_LN8';

  const checkYouTubeLiveStatus = async () => {
    try {
      if (!YOUTUBE_API_KEY || YOUTUBE_API_KEY.includes('YourAPIKey')) return;
      const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${YOUTUBE_CHANNEL_ID}&eventType=live&type=video&key=${YOUTUBE_API_KEY}`;
      const response = await fetch(url);
      if (response.status === 403) return;
      const data = await response.json();
      setIsLiveSignal(data.items && data.items.length > 0);
    } catch (e) {
      setIsLiveSignal(false);
    }
  };

  // Data Fetching Logic (Parallelized)
  const fetchData = async () => {
    setIsDataLoading(true);
    try {
      console.log("Fetching global data for:", currentGame);
      const [teamsRes, rankingRes, tourneysRes, eventsRes] = await Promise.all([
        supabase.from('teams').select('*'),
        supabase.rpc('get_game_ranking', { p_game_type: currentGame }),
        supabase.from('tournaments').select('*').eq('game_type', currentGame).order('date', { ascending: false }).limit(20),
        supabase.rpc('get_scheduled_events_with_registrations', { p_game_type: currentGame })
      ]);

      if (teamsRes.data) {
        const tMap: Record<string, Team> = {};
        teamsRes.data.forEach((t: any) => tMap[t.id] = t);
        setTeams(teamsRes.data);

        if (rankingRes.data) {
          setPlayers(rankingRes.data.map((p: any) => ({
            ...p,
            isPublic: p.is_public ?? (!!p.username), // Ensure users with accounts (username) are public by default if flag is missing
            team_internal: p.team_id ? tMap[p.team_id]?.name || p.team : p.team,
            pwp_claimed: p.pwp,
            is_active: true
          })));
        }
      }

      if (tourneysRes.data) setTournamentResults(tourneysRes.data);
      if (eventsRes.data) setCommunityEvents(eventsRes.data);
    } catch (error) {
      console.error("Data Fetch Error:", error);
    } finally {
      setIsDataLoading(false);
    }
  };

  // Session Handler
  const handleSessionState = useCallback(async (session: any) => {
    if (!session?.user) {
      setIsLoggedIn(false);
      setUserRole(null);
      setUserProfile(null);
      setIsAuthLoading(false);
      return;
    }

    if (userProfile?.id === session.user.id) {
      setIsLoggedIn(true);
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
          if (count === 0) setShowOnboarding(true);
          // detect_unclaimed_results call could go here
        }
      } else {
        // Fallback for missing profile
        console.warn("Profile not found for session user");
      }
    } catch (e) {
      console.error("Session State Error:", e);
    } finally {
      setIsAuthLoading(false);
    }
  }, [userProfile]);

  // Lifecycle
  useEffect(() => {
    fetchData();
    checkYouTubeLiveStatus();
    const ytInterval = setInterval(checkYouTubeLiveStatus, 5 * 60 * 1000);

    const initAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      await handleSessionState(session);
      supabase.auth.onAuthStateChange(async (evt, ses) => {
        if (evt === 'SIGNED_OUT') {
          setIsLoggedIn(false);
          setUserRole(null);
          setUserProfile(null);
          setIsAuthLoading(false);
          navigate('/');
        } else {
          await handleSessionState(ses);
        }
      });
    };
    initAuth();

    // Safety timeout for loading screen
    const timeout = setTimeout(() => setIsAuthLoading(false), 8000);

    return () => {
      clearInterval(ytInterval);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    if (players.length > 0 || communityEvents.length > 0) {
      fetchData();
    }
  }, [currentGame]);

  // Auth/Loading UI
  const isLanding = location.pathname === '/';
  if (isAuthLoading && !isLanding) {
    return (
      <div className="bg-slate-900 min-h-screen flex flex-col items-center justify-center text-white p-4">
        <div className="flex flex-col items-center gap-6 max-w-md text-center">
          <div className="w-16 h-16 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="space-y-2">
            <p className="text-xl font-bold uppercase tracking-widest animate-pulse">Conectando...</p>
            <p className="text-slate-400 text-sm">Validando acceso seguro</p>
          </div>
        </div>
      </div>
    );
  }

  const handleTournamentUpload = async (tournamentData: Omit<TournamentResult, 'id'>, playerResults: TournamentParseResult[]) => {
    try {
      const dateParts = tournamentData.date.split('/');
      const isoDate = dateParts.length === 3 ? `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}` : tournamentData.date;

      const newTournamentId = crypto.randomUUID();
      const { error: tourneyError } = await supabase.rpc('create_tournament_via_rpc', {
        p_id: newTournamentId,
        p_name: tournamentData.name,
        p_date: isoDate,
        p_store_name: tournamentData.storeName,
        p_format: tournamentData.format,
        p_player_count: tournamentData.playerCount,
        p_game_type: currentGame,
        p_league_id: tournamentData.leagueId || null
      });

      if (tourneyError) throw tourneyError;

      const resultsToUpload = playerResults.map((result, index) => ({
        player_name: result.playerName,
        wins: result.wins,
        losses: result.losses,
        draws: result.draws,
        pwp_earned: result.pwpEarned,
        rank: index + 1
      }));

      const { error: rpcError } = await supabase.rpc('process_tournament_results_bulk', {
        p_tournament_id: newTournamentId,
        p_results: resultsToUpload
      });

      if (rpcError) throw rpcError;

      toast.success('¡Torneo subido con éxito!');
      await fetchData();
    } catch (error: any) {
      console.error("Upload Error:", error);
      toast.error('Error al subir torneo: ' + error.message);
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
      await fetchData();
    } catch (error: any) {
      toast.error('Error al eliminar: ' + error.message);
    }
  };

  const handleLogin = (role: any) => {
    setIsLoggedIn(true);
    setUserRole(role);
    navigate(role === 'admin' ? '/admin' : role === 'store' ? '/dashboard/tienda' : '/dashboard/jugador');
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setIsLoggedIn(false);
    setUserRole(null);
    setUserProfile(null);
    window.location.href = '/#/logout-success';
  };

  const themeClass = {
    mtg: 'theme-mtg', pokemon: 'theme-pokemon', one_piece: 'theme-one_piece',
    lorcana: 'theme-lorcana', star_wars: 'theme-star_wars', yugioh: 'theme-yugioh',
    flesh_blood: 'theme-flesh_blood', digimon: 'theme-digimon'
  }[currentGame] || 'theme-mtg';

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

      <FloatingActionButton userRole={userRole} />

      <OnboardingModal isOpen={showOnboarding} onClose={() => setShowOnboarding(false)} onGoToSettings={() => { setShowOnboarding(false); navigate('/settings'); }} />
      <ClaimResultsModal isOpen={showClaimModal} unclaimedResults={unclaimedResults} onClose={() => setShowClaimModal(false)} onClaimProcessed={fetchData} />

      <main className={`flex-grow ${!isLanding ? 'container mx-auto px-4 py-8' : ''}`}>
        <Routes>
          <Route path="/" element={<UniverseSelectionPage />} />
          <Route path="/home" element={<HomePage players={players} events={communityEvents} session={userProfile ? { user: userProfile } : null} userRole={userRole} userId={userProfile?.id} />} />
          <Route path="/envivo" element={<LiveStreamPage />} />
          <Route path="/pls" element={<PLSPage />} />
          <Route path="/ranking" element={<RankingsPage players={players} teams={teams} />} />
          <Route path="/hall-of-fame" element={<HallOfFamePage />} />
          <Route path="/soporte" element={<SupportPage />} />
          <Route path="/equipo/:teamId" element={<TeamProfilePage />} />
          <Route path="/eventos" element={<EventsPage events={communityEvents} finishedTournaments={tournamentResults} userRole={userRole} userId={userProfile?.id} />} />
          <Route path="/torneos" element={<TournamentsListPage tournaments={tournamentResults} />} />
          <Route path="/torneos/:tournamentId" element={<TournamentStandingsPage />} />
          <Route path="/mercado" element={<MarketplacePage />} />
          <Route path="/mercado/:id" element={<MarketplaceDetailPage />} />
          <Route path="/mis-anuncios" element={<MyListingsPage />} />
          <Route path="/commander" element={<CommanderPage />} />
          <Route path="/pauper" element={<PauperPage />} />
          <Route path="/premodern" element={<PremodernPage />} />
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
          <Route path="/reglamento" element={<ReglamentoPage />} />
          <Route path="/quienes-somos" element={<AboutPage />} />
          <Route path="/contenido" element={<ContentPage />} />
          <Route path="/ligas" element={<CommunityLeaguesPage />} />
          <Route path="/terminos" element={<TermsPage />} />
          <Route path="/premium" element={<SubscriptionPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/creadores" element={<ContentCreatorApplicationPage />} />
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/admin/users" element={<UserManagementPage />} />
          <Route path="/admin/awards" element={<AdminAwardsPage />} />
          <Route path="/admin/season" element={<AdminSeasonPage />} />
          <Route path="/admin/claims" element={<ClaimReviewPage />} />
          <Route path="/admin/integrity" element={<IntegrityReviewPanel />} />
          <Route path="/admin/tournaments/edit" element={<TournamentEditPage />} />
          <Route path="/admin/subscriptions" element={<SubscriptionManagementPage />} />
          <Route path="/admin/creators" element={<ContentCreatorsAdminPage />} />
          <Route path="/admin/marketplace" element={<MarketplaceAdminPage />} />
          <Route path="/admin/cms" element={<AdminCMSPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/seller/:sellerId" element={<SellerProfilePage />} />
          <Route path="/calendario" element={<CalendarPage />} />
          <Route path="/stats" element={<PlayerStatsPage />} />
          <Route path="/dashboard/tienda" element={<StoreDashboardPage onTournamentUpload={handleTournamentUpload} onDeleteTournament={handleDeleteTournament} userRole={userRole} tournaments={tournamentResults} storeStatus={userProfile?.status} storeName={userProfile?.username} storeLogo={userProfile?.avatar_url} />} />
          <Route path="/dashboard/jugador" element={<PlayerDashboardPage profile={userProfile} />} />
          <Route path="/dashboard/creador" element={<CreatorDashboardPage profile={userProfile} />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {!isLanding && <Footer />}
      <ChatAssistant />
    </div>
  );
};

export default function App() {
  return (
    <HashRouter>
      <GameProvider>
        <AppContent />
      </GameProvider>
    </HashRouter>
  );
}