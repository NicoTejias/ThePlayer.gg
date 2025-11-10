
import React, { useState } from 'react';
import { HashRouter, Routes, Route, useNavigate } from 'react-router-dom';
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
import type { TournamentResult, CommunityEvent, PlayerProfile, TournamentParseResult } from './types';

const mockInitialPlayers: PlayerProfile[] = [
  { id: 'p1', name: 'MageSlayer92', region: 'Metropolitana', pwp: 1250, matchesWon: 41, matchesLost: 10, matchesDrew: 5 },
  { id: 'p2', name: 'ElfoNocturno', region: 'Valparaíso', pwp: 1180, matchesWon: 39, matchesLost: 12, matchesDrew: 4 },
  { id: 'p3', name: 'GoblinKing', region: 'Biobío', pwp: 1155, matchesWon: 38, matchesLost: 13, matchesDrew: 3 },
  { id: 'p4', name: 'AetherFlux', region: 'Norte', pwp: 1090, matchesWon: 35, matchesLost: 15, matchesDrew: 6 },
  { id: 'p5', name: 'JaceMind', region: 'Metropolitana', pwp: 1075, matchesWon: 34, matchesLost: 14, matchesDrew: 8 },
  { id: 'p6', name: 'ProdigyMTG', region: 'Valparaíso', winRate: 78.5, pwp: 980, matchesWon: 50, matchesLost: 12, matchesDrew: 2 },
  { id: 'p7', name: 'Strategist', region: 'Metropolitana', winRate: 75.2, pwp: 950, matchesWon: 48, matchesLost: 15, matchesDrew: 1 },
];


const mockTournamentResults: TournamentResult[] = [
    { id: 'tr1', name: 'Clasificatorio Nacional - Stgo', date: '2024-07-28', storeName: 'Magicsur', format: 'Standard', playerCount: 64 },
    { id: 'tr2', name: 'Store Championship Viña', date: '2024-07-27', storeName: 'Guildreams', format: 'Modern', playerCount: 32 },
    { id: 'tr3', name: 'FNM Draft de Fin de Año', date: '2024-07-26', storeName: 'Ouroboros', format: 'Draft', playerCount: 16 },
    { id: 'tr4', name: 'Torneo Benéfico de Commander', date: '2024-07-21', storeName: 'El Reino de los Duelos', format: 'Commander', playerCount: 40 },
    { id: 'tr5', name: 'Liga Pioneer - Fecha Final', date: '2024-07-20', storeName: 'La Forja del Sur', format: 'Pioneer', playerCount: 22 },
];

const mockInitialEvents: CommunityEvent[] = [
  { id: '1', title: 'Clasificatorio Nacional - Stgo', date: '25 DIC 2024', storeName: 'Magicsur', format: 'Standard', playerCount: 64 },
  { id: '2', title: 'Store Championship Viña', date: '28 DIC 2024', storeName: 'Guildreams', format: 'Modern', playerCount: 32 },
  { id: '3', title: 'FNM Draft de Fin de Año', date: '30 DIC 2024', storeName: 'Ouroboros', format: 'Draft', playerCount: 16 },
];


const AppContent: React.FC = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userRole, setUserRole] = useState<'player' | 'store' | 'admin' | null>(null);
  const [tournamentResults, setTournamentResults] = useState<TournamentResult[]>(mockTournamentResults);
  const [communityEvents, setCommunityEvents] = useState<CommunityEvent[]>(mockInitialEvents);
  const [players, setPlayers] = useState<PlayerProfile[]>(mockInitialPlayers);
  const navigate = useNavigate();

  const handleLogin = (role: 'player' | 'store' | 'admin') => {
    setIsLoggedIn(true);
    setUserRole(role);
    navigate('/');
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserRole(null);
    navigate('/');
  };

  const handleTournamentUpload = (tournamentData: Omit<TournamentResult, 'id'>, playerResults: TournamentParseResult[]) => {
    const newId = `tourney-${Date.now()}`;
    
    // 1. Add to tournament results repository
    const newTournament: TournamentResult = { ...tournamentData, id: newId };
    setTournamentResults(prevResults => [newTournament, ...prevResults]);

    // 2. Also create and add to public events calendar
    const newEvent: CommunityEvent = {
        id: newId,
        title: tournamentData.name,
        date: tournamentData.date,
        storeName: tournamentData.storeName,
        format: tournamentData.format,
        playerCount: tournamentData.playerCount,
    };
    setCommunityEvents(prevEvents => [newEvent, ...prevEvents]);
    
    // 3. Update player rankings ("backend" logic)
    setPlayers(currentPlayers => {
        const updatedPlayers = [...currentPlayers];

        playerResults.forEach(result => {
            const playerIndex = updatedPlayers.findIndex(p => p.name.toLowerCase() === result.playerName.toLowerCase());

            if (playerIndex > -1) {
                // Player exists, update their stats
                const playerToUpdate = updatedPlayers[playerIndex];
                playerToUpdate.pwp += result.pwpEarned;
                playerToUpdate.matchesWon += result.wins;
                playerToUpdate.matchesLost += result.losses;
                playerToUpdate.matchesDrew += result.draws;
            } else {
                // New player, add them to the ranking
                updatedPlayers.push({
                    id: `p${Date.now()}-${result.playerName}`,
                    name: result.playerName,
                    region: 'Desconocida', // Or handle region mapping
                    pwp: result.pwpEarned,
                    matchesWon: result.wins,
                    matchesLost: result.losses,
                    matchesDrew: result.draws,
                });
            }
        });

        return updatedPlayers;
    });
  };

  return (
    <div className="bg-slate-900 text-slate-200 min-h-screen flex flex-col">
      <Header isLoggedIn={isLoggedIn} userRole={userRole} handleLogout={handleLogout} />
      <main className="flex-grow container mx-auto px-4 py-8">
        <Routes>
          <Route path="/" element={<HomePage />} />
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
          <Route path="/admin" element={<AdminDashboardPage />} />
          <Route path="/dashboard/tienda" element={<StoreDashboardPage onTournamentUpload={handleTournamentUpload} />} />
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
