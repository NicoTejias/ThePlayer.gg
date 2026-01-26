import React, { useState, useEffect, useCallback } from 'react';
import { Toaster, toast } from 'sonner';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './hooks/useAuth';
import { useAppData } from './hooks/useAppData';
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
import ForumIndexPage from './pages/forum/ForumIndexPage';
import ForumBoardPage from './pages/forum/ForumBoardPage';
import ForumThreadPage from './pages/forum/ForumThreadPage';
import CreateThreadPage from './pages/forum/CreateThreadPage';
import AdminForumPage from './pages/admin/AdminForumPage';
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

  const {
    isAuthLoading,
    isLoggedIn,
    userRole,
    userProfile,
    showOnboarding,
    setShowOnboarding,
    hasAlias,
    handleLogin,
    handleLogout,
  } = useAuth();

  const {
    isDataLoading,
    tournamentResults,
    communityEvents,
    players,
    teams,
    refreshData: fetchData
  } = useAppData(currentGame, userProfile?.id);

  const [unclaimedResults, setUnclaimedResults] = useState<any[]>([]);
  const [showClaimModal, setShowClaimModal] = useState(false);
  const [isLiveSignal, setIsLiveSignal] = useState(false);

  // YouTube Live Detection
  const YOUTUBE_CHANNEL_ID = 'UC-ymLrXBUoNFhku0d8tWCVA';
  const YOUTUBE_API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY;

  const checkYouTubeLiveStatus = async () => {
    setIsLiveSignal(false);
  };

  useEffect(() => {
    checkYouTubeLiveStatus();
    const ytInterval = setInterval(checkYouTubeLiveStatus, 5 * 60 * 1000);
    return () => clearInterval(ytInterval);
  }, []);



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
        rank: result.rank || index + 1
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
          <Route path="/home" element={<HomePage players={players} events={communityEvents} session={userProfile ? { user: userProfile } : null} userRole={userRole} userId={userProfile?.id} showAliasReminder={isLoggedIn && userRole === 'player' && !hasAlias} />} />
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
          <Route path="/admin/foro" element={<AdminForumPage />} />
          <Route path="/notifications" element={<NotificationsPage />} />

          <Route path="/foro" element={<ForumIndexPage />} />
          <Route path="/foro/:categorySlug/:boardSlug" element={<ForumBoardPage />} />
          <Route path="/foro/:categorySlug/:boardSlug/nuevo" element={<CreateThreadPage />} />
          <Route path="/foro/:categorySlug/:boardSlug/:threadSlug" element={<ForumThreadPage />} />
          <Route path="/favorites" element={<FavoritesPage />} />
          <Route path="/seller/:sellerId" element={<SellerProfilePage />} />
          <Route path="/calendario" element={<CalendarPage />} />
          <Route path="/stats" element={<PlayerStatsPage />} />
          <Route path="/dashboard/tienda" element={<StoreDashboardPage onTournamentUpload={handleTournamentUpload} onDeleteTournament={handleDeleteTournament} userRole={userRole} tournaments={tournamentResults} storeStatus={userProfile?.status} storeName={userProfile?.username} storeLogo={userProfile?.avatar_url} />} />
          <Route path="/dashboard/jugador" element={<PlayerDashboardPage profile={userProfile} showAliasReminder={isLoggedIn && userRole === 'player' && !hasAlias} />} />
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