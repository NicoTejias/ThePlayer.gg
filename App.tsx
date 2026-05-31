import React, { useState, useEffect, lazy, Suspense } from 'react';
import { Toaster, toast } from 'sonner';
import { HashRouter, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { useAuth } from './hooks/useAuth';
import { useAppData } from './hooks/useAppData';
import Header from './components/Header';
import Footer from './components/Footer';
import FloatingActionButton from './components/FloatingActionButton';
import ParticlesBackground from './components/ParticlesBackground';
import AnimatedBackground from './components/AnimatedBackground';
import Sidebar from './components/Sidebar';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
// Páginas con carga diferida (code-splitting): cada ruta genera su propio chunk
// y solo se descarga cuando el usuario la visita, reduciendo el bundle inicial.
const HomePage = lazy(() => import('./pages/HomePage'));
const RankingsPage = lazy(() => import('./pages/RankingsPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const MarketplacePage = lazy(() => import('./pages/MarketplacePage'));
const MyListingsPage = lazy(() => import('./pages/MyListingsPage'));
const MarketplaceDetailPage = lazy(() => import('./pages/MarketplaceDetailPage'));
const CommanderPage = lazy(() => import('./pages/CommanderPage'));
const PauperPage = lazy(() => import('./pages/PauperPage'));
const PremodernPage = lazy(() => import('./pages/PremodernPage'));
const MediaPage = lazy(() => import('./pages/MediaPage'));
const MediaArticlesPage = lazy(() => import('./pages/MediaArticlesPage'));
const MediaVideosPage = lazy(() => import('./pages/MediaVideosPage'));
const StoresPage = lazy(() => import('./pages/StoresPage'));
const AuthPage = lazy(() => import('./pages/AuthPage'));
const AdminDashboardPage = lazy(() => import('./pages/AdminDashboardPage'));
const AdminCMSPage = lazy(() => import('./pages/AdminCMSPage'));
const ArticleDetailPage = lazy(() => import('./pages/ArticleDetailPage'));
const UserManagementPage = lazy(() => import('./pages/admin/UserManagementPage'));
const ClaimReviewPage = lazy(() => import('./pages/admin/ClaimReviewPage'));
const IntegrityReviewPanel = lazy(() => import('./pages/admin/IntegrityReviewPanel'));
const TournamentEditPage = lazy(() => import('./pages/admin/TournamentEditPage'));
const SubscriptionManagementPage = lazy(() => import('./pages/admin/SubscriptionManagementPage'));
const ContentCreatorsAdminPage = lazy(() => import('./pages/admin/ContentCreatorsAdminPage'));
const MarketplaceAdminPage = lazy(() => import('./pages/admin/MarketplaceAdminPage'));
const NotificationsPage = lazy(() => import('./pages/NotificationsPage'));
const FavoritesPage = lazy(() => import('./pages/FavoritesPage'));
const SellerProfilePage = lazy(() => import('./pages/SellerProfilePage'));
const CalendarPage = lazy(() => import('./pages/CalendarPage'));
const CreatorDashboardPage = lazy(() => import('./pages/CreatorDashboardPage'));
const PlayerStatsPage = lazy(() => import('./pages/PlayerStatsPage'));
const StoreDashboardPage = lazy(() => import('./pages/StoreDashboardPage'));
const CommunityLeaguesPage = lazy(() => import('./pages/CommunityLeaguesPage'));
const LeagueRankingPage = lazy(() => import('./pages/LeagueRankingPage'));
const PlayerDashboardPage = lazy(() => import('./pages/PlayerDashboardPage'));
const TeamProfilePage = lazy(() => import('./pages/TeamProfilePage'));
const TournamentsListPage = lazy(() => import('./pages/TournamentsListPage'));
const TournamentStandingsPage = lazy(() => import('./pages/TournamentStandingsPage'));
const TournamentJoinPage = lazy(() => import('./pages/TournamentJoinPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const LiveStreamPage = lazy(() => import('./pages/LiveStreamPage'));
const AboutPage = lazy(() => import('./pages/AboutPage'));
const ContentPage = lazy(() => import('./pages/ContentPage'));
const ReglamentoPage = lazy(() => import('./pages/ReglamentoPage'));
const PLSPage = lazy(() => import('./pages/PLSPage'));
const EmailConfirmationPage = lazy(() => import('./pages/EmailConfirmationPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ResetPasswordPage = lazy(() => import('./pages/ResetPasswordPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const HallOfFamePage = lazy(() => import('./pages/HallOfFamePage'));
const ForumIndexPage = lazy(() => import('./pages/forum/ForumIndexPage'));
const ForumBoardPage = lazy(() => import('./pages/forum/ForumBoardPage'));
const ForumThreadPage = lazy(() => import('./pages/forum/ForumThreadPage'));
const CreateThreadPage = lazy(() => import('./pages/forum/CreateThreadPage'));
const AdminForumPage = lazy(() => import('./pages/admin/AdminForumPage'));
const AdminAwardsPage = lazy(() => import('./pages/AdminAwardsPage'));
const AdminSeasonPage = lazy(() => import('./pages/admin/AdminSeasonPage'));
const SupportPage = lazy(() => import('./pages/SupportPage'));
const ContentCreatorApplicationPage = lazy(() => import('./pages/ContentCreatorApplicationPage'));
const TermsPage = lazy(() => import('./pages/TermsPage'));
const SubscriptionPage = lazy(() => import('./pages/SubscriptionPage'));
const UniverseSelectionPage = lazy(() => import('./pages/UniverseSelectionPage'));
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

  const [unclaimedResults] = useState<any[]>([]);
  const [showClaimModal, setShowClaimModal] = useState(false);
  // Detección de "en vivo": deshabilitada (la antigua integración con YouTube
  // exponía la API key en el cliente). Pendiente: mover a Edge Function si se reactiva.
  const isLiveSignal = false;

  // Redirect Root to Home if needed
  useEffect(() => {
    if (location.pathname === '/' || location.pathname === '') {
      navigate('/home', { replace: true });
    }
  }, [location.pathname, navigate]);

  // Auth/Loading UI
  const isExcludedPath = location.pathname === '/' || location.pathname === '/home';
  if (isAuthLoading && !isExcludedPath) {
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
        pwp_earned: result.pointsEarned,
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
    flesh_blood: 'theme-flesh_blood', digimon: 'theme-digimon', alpha_clash: 'theme-alpha_clash'
  }[currentGame] || 'theme-mtg';

  return (
    <div className={`text-slate-200 min-h-screen flex flex-col lg:flex-row relative isolate ${themeClass}`}>
      <Toaster position="top-center" richColors theme="dark" />
      <CookieConsent />
      <AnimatedBackground />
      <ParticlesBackground />

      {/* Desktop Sidebar (inline, visible on lg screens) */}
      {!isAuthLoading && (
        <div className="hidden lg:block w-72 flex-shrink-0 border-r border-slate-700/50 bg-[#130712]/30 backdrop-blur-xl h-screen sticky top-0 overflow-y-auto custom-scrollbar">
          <Sidebar
            isOpen={true}
            onClose={() => {}}
            isLoggedIn={isLoggedIn}
            userRole={userRole}
            isContentCreator={userProfile?.is_content_creator || userProfile?.role === 'content_creator'}
            isInline={true}
          />
        </div>
      )}

      {/* Main Content Pane */}
      <div className="flex-grow flex flex-col min-w-0 min-h-screen">
        {!isAuthLoading && (
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

        <main className="flex-grow container mx-auto px-4 py-8">
          <Suspense fallback={
            <div className="flex justify-center items-center py-24">
              <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          }>
          <Routes>
            <Route path="/" element={<HomePage players={players} events={communityEvents} session={userProfile ? { user: userProfile } : null} userRole={userRole} userId={userProfile?.id} showAliasReminder={isLoggedIn && userRole === 'player' && !hasAlias} />} />
            <Route path="/home" element={<HomePage players={players} events={communityEvents} session={userProfile ? { user: userProfile } : null} userRole={userRole} userId={userProfile?.id} showAliasReminder={isLoggedIn && userRole === 'player' && !hasAlias} />} />
            <Route path="/universe" element={<UniverseSelectionPage />} />
            <Route path="/universe-selection" element={<UniverseSelectionPage />} />
            <Route path="/envivo" element={<LiveStreamPage />} />
            <Route path="/pls" element={<PLSPage />} />
            <Route path="/ranking" element={<RankingsPage players={players} teams={teams} />} />
            <Route path="/hall-of-fame" element={<HallOfFamePage />} />
            <Route path="/soporte" element={<SupportPage />} />
            <Route path="/equipo/:teamId" element={<TeamProfilePage />} />
            <Route path="/eventos" element={<EventsPage events={communityEvents} finishedTournaments={tournamentResults} userRole={userRole} userId={userProfile?.id} />} />
            <Route path="/torneos" element={<TournamentsListPage tournaments={tournamentResults} />} />
            <Route path="/torneos/:tournamentId" element={<TournamentStandingsPage userRole={userRole} userId={userProfile?.id} />} />
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
            <Route path="/leagues/:leagueId" element={<LeagueRankingPage />} />
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
            <Route path="/torneos/inscribir" element={<TournamentJoinPage />} />
            <Route path="/dashboard/tienda" element={<StoreDashboardPage onTournamentUpload={handleTournamentUpload} onDeleteTournament={handleDeleteTournament} userRole={userRole} tournaments={tournamentResults} storeStatus={userProfile?.status} storeName={userProfile?.username} storeLogo={userProfile?.avatar_url} players={players} />} />
            <Route path="/dashboard/jugador" element={<PlayerDashboardPage profile={userProfile} showAliasReminder={isLoggedIn && userRole === 'player' && !hasAlias} />} />
            <Route path="/dashboard/creador" element={<CreatorDashboardPage profile={userProfile} />} />
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
          </Suspense>
        </main>

        <Footer />
        <ChatAssistant />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <HashRouter>
      <ThemeProvider>
        <LanguageProvider>
          <GameProvider>
            <AppContent />
          </GameProvider>
        </LanguageProvider>
      </ThemeProvider>
    </HashRouter>
  );
}