import React, { useState, useEffect, useRef } from 'react';
import { 
  Trophy, Play, CheckCircle, Plus, Trash, Users, Award, 
  ArrowRight, ChevronRight, Clipboard, Calendar, FileSpreadsheet, RotateCcw, AlertTriangle 
} from 'lucide-react';
import { PlayerProfile, TournamentResult, TournamentParseResult, GameType } from '../types';
import { toast } from 'sonner';

interface TournamentManagerProps {
  players: PlayerProfile[];
  currentGame: GameType;
  storeName: string;
  leagues: any[];
  onTournamentUpload: (tournamentData: Omit<TournamentResult, 'id'>, players: TournamentParseResult[]) => Promise<void>;
  onCancel: () => void;
}

interface Participant {
  id: string | null;
  name: string;
}

interface Pairing {
  id: string;
  player1: Participant;
  player2: Participant | null; // null represents a BYE
  wins1: number;
  wins2: number;
  draws: number;
  outcome: 'p1' | 'p2' | 'draw' | null;
}

interface Round {
  roundNumber: number;
  pairings: Pairing[];
}

interface PlayerStats {
  name: string;
  points: number;
  wins: number;
  losses: number;
  draws: number;
  opponents: string[];
  byes: number;
}

export const TournamentManager: React.FC<TournamentManagerProps> = ({
  players,
  currentGame,
  storeName,
  leagues,
  onTournamentUpload,
  onCancel
}) => {
  // Navigation Steps: 'setup' | 'register' | 'rounds' | 'finished'
  const [step, setStep] = useState<'setup' | 'register' | 'rounds' | 'finished'>('setup');

  // 1. Setup State
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentType, setTournamentType] = useState('semanal');
  const [format, setFormat] = useState('Pauper');
  const [tournamentDate, setTournamentDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalRounds, setTotalRounds] = useState<number>(3);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');

  // 2. Registration State
  const [registeredPlayers, setRegisteredPlayers] = useState<Participant[]>([]);
  const [searchPlayer, setSearchPlayer] = useState('');
  const [suggestions, setSuggestions] = useState<PlayerProfile[]>([]);
  const [bulkInput, setBulkInput] = useState('');
  const [showBulkInput, setShowBulkInput] = useState(false);
  const [focusedSuggestionIndex, setFocusedSuggestionIndex] = useState(-1);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 3. Rounds State
  const [currentRoundNumber, setCurrentRoundNumber] = useState(1);
  const [rounds, setRounds] = useState<Round[]>([]);
  const [playerStats, setPlayerStats] = useState<Record<string, PlayerStats>>({});

  const tournamentTypes = [
    { value: 'semanal', label: 'Semanal', multiplier: 1 },
    { value: 'fnm', label: 'FNM', multiplier: 1 },
    { value: 'showdown', label: 'Showdown', multiplier: 2 },
    { value: 'draft', label: 'Draft', multiplier: 3 },
    { value: 'sellado', label: 'Sellado', multiplier: 3 },
    { value: 'prerelease', label: 'Prerelease', multiplier: 3 },
    { value: 'premier', label: 'Premier', multiplier: 4 },
    { value: 'rcq', label: 'RCQ', multiplier: 4 },
  ];

  const formatsList = [
    'Pauper',
    'Modern',
    'Standard',
    'Legacy',
    'Commander',
    'Premodern',
    'Limited',
    'Sealed',
    'Draft',
    'Custom'
  ];

  // Set default tournament name when format or type changes
  useEffect(() => {
    const typeLabel = tournamentTypes.find(t => t.value === tournamentType)?.label || tournamentType;
    setTournamentName(`${typeLabel} ${format} - ${tournamentDate}`);
  }, [tournamentType, format, tournamentDate]);

  // Handle Autocomplete Suggestions
  useEffect(() => {
    if (searchPlayer.trim().length > 1) {
      const filtered = players.filter(p => {
        const nameMatch = p.name?.toLowerCase().includes(searchPlayer.toLowerCase());
        const usernameMatch = p.username?.toLowerCase().includes(searchPlayer.toLowerCase());
        const alreadyRegistered = registeredPlayers.some(rp => rp.name.toLowerCase() === p.name?.toLowerCase() || rp.name.toLowerCase() === p.username?.toLowerCase());
        return (nameMatch || usernameMatch) && !alreadyRegistered;
      }).slice(0, 5);
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
    setFocusedSuggestionIndex(-1);
  }, [searchPlayer, players, registeredPlayers]);

  // Click outside autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Suggestions navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setFocusedSuggestionIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setFocusedSuggestionIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (focusedSuggestionIndex >= 0 && focusedSuggestionIndex < suggestions.length) {
        addOfficialPlayer(suggestions[focusedSuggestionIndex]);
      } else {
        // Add as guest
        addGuestPlayer(searchPlayer);
      }
    }
  };

  const addOfficialPlayer = (profile: PlayerProfile) => {
    const name = profile.username || profile.name;
    if (!name) return;
    
    if (registeredPlayers.some(p => p.name.toLowerCase() === name.toLowerCase())) {
      toast.error('Este jugador ya está registrado.');
      return;
    }

    setRegisteredPlayers(prev => [...prev, { id: profile.id, name }]);
    setSearchPlayer('');
    setSuggestions([]);
    toast.success(`Jugador ${name} registrado.`);
  };

  const addGuestPlayer = (name: string) => {
    const cleanName = name.trim();
    if (!cleanName) return;

    if (registeredPlayers.some(p => p.name.toLowerCase() === cleanName.toLowerCase())) {
      toast.error('Este jugador ya está registrado.');
      return;
    }

    setRegisteredPlayers(prev => [...prev, { id: null, name: cleanName }]);
    setSearchPlayer('');
    setSuggestions([]);
    toast.success(`Invitado ${cleanName} registrado.`);
  };

  const removePlayer = (nameToRemove: string) => {
    setRegisteredPlayers(prev => prev.filter(p => p.name !== nameToRemove));
  };

  const handleBulkImport = () => {
    const lines = bulkInput.split('\n');
    let addedCount = 0;
    const newPlayers: Participant[] = [];

    lines.forEach(line => {
      const cleanName = line.trim();
      if (!cleanName) return;

      const alreadyRegistered = registeredPlayers.some(p => p.name.toLowerCase() === cleanName.toLowerCase()) ||
                                 newPlayers.some(p => p.name.toLowerCase() === cleanName.toLowerCase());

      if (!alreadyRegistered) {
        // Try to match with an official profile
        const matchedProfile = players.find(p => 
          (p.name && p.name.toLowerCase() === cleanName.toLowerCase()) || 
          (p.username && p.username.toLowerCase() === cleanName.toLowerCase())
        );

        if (matchedProfile) {
          newPlayers.push({ id: matchedProfile.id, name: matchedProfile.username || matchedProfile.name });
        } else {
          newPlayers.push({ id: null, name: cleanName });
        }
        addedCount++;
      }
    });

    if (newPlayers.length > 0) {
      setRegisteredPlayers(prev => [...prev, ...newPlayers]);
      setBulkInput('');
      setShowBulkInput(false);
      toast.success(`Se importaron ${addedCount} jugadores correctamente.`);
    } else {
      toast.warning('No se encontraron nuevos nombres válidos para importar.');
    }
  };

  // -------------------------------------------------------------
  // Pairing Algorithm and Stats Calculation
  // -------------------------------------------------------------

  const startTournament = () => {
    if (registeredPlayers.length < 3) {
      toast.error('Se requieren al menos 3 jugadores para iniciar un torneo suizo.');
      return;
    }

    // Initialize stats
    const initialStats: Record<string, PlayerStats> = {};
    registeredPlayers.forEach(p => {
      initialStats[p.name] = {
        name: p.name,
        points: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        opponents: [],
        byes: 0
      };
    });

    setPlayerStats(initialStats);
    
    // Generate Round 1 pairings
    const initialPairings = generateSwissPairings(registeredPlayers, [], initialStats);
    
    setRounds([{
      roundNumber: 1,
      pairings: initialPairings
    }]);

    setCurrentRoundNumber(1);
    setStep('rounds');
    toast.success('¡El torneo ha comenzado! Ronda 1 emparejada.');
  };

  const generateSwissPairings = (
    playersList: Participant[],
    history: Round[],
    stats: Record<string, PlayerStats>
  ): Pairing[] => {
    // 1. Sort players by points descending.
    const sortedPlayers = [...playersList].sort((a, b) => {
      const ptsA = stats[a.name]?.points || 0;
      const ptsB = stats[b.name]?.points || 0;
      return ptsB - ptsA;
    });

    // Keep track of which players already had a BYE
    const byePlayers = new Set<string>();
    Object.values(stats).forEach(s => {
      if (s.byes > 0) byePlayers.add(s.name);
    });

    // If odd, we must assign a BYE.
    let byePlayer: Participant | null = null;
    if (sortedPlayers.length % 2 !== 0) {
      // Find lowest score player who hasn't had a bye.
      let byeIndex = -1;
      for (let i = sortedPlayers.length - 1; i >= 0; i--) {
        if (!byePlayers.has(sortedPlayers[i].name)) {
          byeIndex = i;
          break;
        }
      }
      // Fallback if everyone has had a bye, pick the last player
      if (byeIndex === -1) {
        byeIndex = sortedPlayers.length - 1;
      }
      byePlayer = sortedPlayers[byeIndex];
      sortedPlayers.splice(byeIndex, 1);
    }

    const opponentsMap = new Map<string, Set<string>>();
    playersList.forEach(p => {
      opponentsMap.set(p.name, new Set(stats[p.name]?.opponents || []));
    });

    const pairings: Pairing[] = [];
    const paired = new Set<string>();

    // Backtracking recursive search
    function backtrack(index: number): boolean {
      if (index >= sortedPlayers.length) return true;
      const p1 = sortedPlayers[index];
      if (paired.has(p1.name)) return backtrack(index + 1);

      for (let i = index + 1; i < sortedPlayers.length; i++) {
        const p2 = sortedPlayers[i];
        if (paired.has(p2.name)) continue;

        // Check rematch
        const p1Opponents = opponentsMap.get(p1.name);
        if (p1Opponents && p1Opponents.has(p2.name)) {
          continue; // Avoid rematch
        }

        // Try pairing
        paired.add(p1.name);
        paired.add(p2.name);
        pairings.push({
          id: crypto.randomUUID(),
          player1: p1,
          player2: p2,
          wins1: 0,
          wins2: 0,
          draws: 0,
          outcome: null
        });

        if (backtrack(index + 1)) return true;

        // Backtrack
        paired.delete(p1.name);
        paired.delete(p2.name);
        pairings.pop();
      }
      return false;
    }

    const success = backtrack(0);

    if (!success) {
      // If we failed (cannot pair without rematches), pair greedily by points, allowing rematches
      pairings.length = 0;
      paired.clear();

      const unpaired = [...sortedPlayers];
      while (unpaired.length > 0) {
        const p1 = unpaired.shift()!;
        if (unpaired.length > 0) {
          const p2 = unpaired.shift()!;
          pairings.push({
            id: crypto.randomUUID(),
            player1: p1,
            player2: p2,
            wins1: 0,
            wins2: 0,
            draws: 0,
            outcome: null
          });
        } else {
          byePlayer = p1;
        }
      }
    }

    // Add bye if present
    if (byePlayer) {
      pairings.push({
        id: crypto.randomUUID(),
        player1: byePlayer,
        player2: null,
        wins1: 2,
        wins2: 0,
        draws: 0,
        outcome: 'p1' // Bye is automatic win
      });
    }

    return pairings;
  };

  const handleResultChange = (pairingId: string, outcome: 'p1' | 'p2' | 'draw', wins1: number = 0, wins2: number = 0, draws: number = 0) => {
    setRounds(prevRounds => {
      return prevRounds.map(r => {
        if (r.roundNumber === currentRoundNumber) {
          return {
            ...r,
            pairings: r.pairings.map(p => {
              if (p.id === pairingId) {
                // If it is a bye, keep outcome as 'p1'
                if (p.player2 === null) {
                  return { ...p, wins1: 2, wins2: 0, draws: 0, outcome: 'p1' };
                }

                // Default wins/draws if not provided
                let w1 = wins1;
                let w2 = wins2;
                let dr = draws;
                
                if (wins1 === 0 && wins2 === 0 && draws === 0) {
                  if (outcome === 'p1') { w1 = 2; w2 = 0; }
                  else if (outcome === 'p2') { w1 = 0; w2 = 2; }
                  else { w1 = 1; w2 = 1; dr = 1; }
                }

                return {
                  ...p,
                  outcome,
                  wins1: w1,
                  wins2: w2,
                  draws: dr
                };
              }
              return p;
            })
          };
        }
        return r;
      });
    });
  };

  const updatePlayerStatsFromRound = (roundPairings: Pairing[]): Record<string, PlayerStats> => {
    const newStats = { ...playerStats };

    // Reset stats to recalculate based on history + current round
    // We should compute stats from all completed rounds (rounds 1 to currentRoundNumber)
    // Initialize stats first
    registeredPlayers.forEach(p => {
      newStats[p.name] = {
        name: p.name,
        points: 0,
        wins: 0,
        losses: 0,
        draws: 0,
        opponents: [],
        byes: 0
      };
    });

    // Populate from all rounds up to current
    const allRounds = rounds.map(r => {
      if (r.roundNumber === currentRoundNumber) {
        return { ...r, pairings: roundPairings }; // Use newest pairings
      }
      return r;
    });

    allRounds.forEach(r => {
      r.pairings.forEach(p => {
        const p1 = p.player1.name;
        
        if (p.player2 === null) {
          // Bye
          newStats[p1].points += 3;
          newStats[p1].wins += 1;
          newStats[p1].byes += 1;
        } else {
          const p2 = p.player2.name;
          newStats[p1].opponents.push(p2);
          newStats[p2].opponents.push(p1);

          if (p.outcome === 'p1') {
            newStats[p1].points += 3;
            newStats[p1].wins += 1;
            newStats[p2].losses += 1;
          } else if (p.outcome === 'p2') {
            newStats[p2].points += 3;
            newStats[p2].wins += 1;
            newStats[p1].losses += 1;
          } else if (p.outcome === 'draw') {
            newStats[p1].points += 1;
            newStats[p1].draws += 1;
            newStats[p2].points += 1;
            newStats[p2].draws += 1;
          }
        }
      });
    });

    return newStats;
  };

  // OWP (Opponent Match Win Percentage)
  const calculateOWP = (name: string, stats: Record<string, PlayerStats>): number => {
    const s = stats[name];
    if (!s || s.opponents.length === 0) return 0.33;

    let sumMWP = 0;
    let count = 0;

    s.opponents.forEach(opp => {
      const oppStats = stats[opp];
      if (oppStats) {
        // Exclude BYEs from MWP rounds calculation
        const roundsPlayed = oppStats.wins + oppStats.losses + oppStats.draws - oppStats.byes;
        let mwp = 0.33;
        if (roundsPlayed > 0) {
          mwp = oppStats.points / (roundsPlayed * 3);
        }
        if (mwp < 0.33) mwp = 0.33;
        sumMWP += mwp;
        count++;
      }
    });

    return count > 0 ? sumMWP / count : 0.33;
  };

  const getStandings = (stats: Record<string, PlayerStats> = playerStats) => {
    const list = registeredPlayers.map(p => {
      const s = stats[p.name] || { points: 0, wins: 0, losses: 0, draws: 0, opponents: [], byes: 0 };
      const owp = calculateOWP(p.name, stats);
      return {
        id: p.id,
        name: p.name,
        points: s.points,
        wins: s.wins,
        losses: s.losses,
        draws: s.draws,
        owp: owp,
        byes: s.byes,
        record: `${s.wins}-${s.losses}-${s.draws}`
      };
    });

    // Sort criteria: 1. Points, 2. OWP, 3. Wins, 4. Alphabetical
    return list.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.owp !== a.owp) return b.owp - a.owp;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.name.localeCompare(b.name);
    });
  };

  const nextRound = () => {
    const currentRound = rounds.find(r => r.roundNumber === currentRoundNumber);
    if (!currentRound) return;

    // Check if all pairings have an outcome
    const unrecorded = currentRound.pairings.some(p => p.outcome === null);
    if (unrecorded) {
      toast.error('Por favor, registra el resultado de todos los enfrentamientos antes de avanzar.');
      return;
    }

    // Save stats for completed rounds
    const updatedStats = updatePlayerStatsFromRound(currentRound.pairings);
    setPlayerStats(updatedStats);

    if (currentRoundNumber >= totalRounds) {
      // Tournament finished
      setStep('finished');
      toast.success('¡Torneo completado! Revisa los resultados finales.');
      return;
    }

    // Generate Next Round Pairings
    const nextRoundNum = currentRoundNumber + 1;
    
    // Simulate updated history by copying rounds state
    const currentHistory = rounds.map(r => {
      if (r.roundNumber === currentRoundNumber) {
        return { ...r, pairings: currentRound.pairings };
      }
      return r;
    });

    const nextPairings = generateSwissPairings(registeredPlayers, currentHistory, updatedStats);

    setRounds([...currentHistory, {
      roundNumber: nextRoundNum,
      pairings: nextPairings
    }]);

    setCurrentRoundNumber(nextRoundNum);
    toast.success(`Ronda ${nextRoundNum} generada.`);
  };

  const getParticipationPoints = (playerCount: number) => {
    if (playerCount >= 128) return 5;
    if (playerCount >= 64) return 4;
    if (playerCount >= 32) return 3;
    if (playerCount >= 16) return 2;
    if (playerCount >= 8) return 1;
    return 0;
  };

  const getTournamentMultiplier = (type: string) => {
    const found = tournamentTypes.find(t => t.value === type);
    return found ? found.multiplier : 1;
  };

  const finalizeTournament = async () => {
    const currentRound = rounds.find(r => r.roundNumber === currentRoundNumber);
    
    // Calculate final stats
    const finalPairings = currentRound ? currentRound.pairings : [];
    const finalStats = updatePlayerStatsFromRound(finalPairings);
    const standings = getStandings(finalStats);

    const multiplier = getTournamentMultiplier(tournamentType);
    const participationPoints = getParticipationPoints(registeredPlayers.length);
    
    const effectiveMultiplier = registeredPlayers.length < 8 ? 1 : multiplier;
    const effectiveParticipation = registeredPlayers.length < 8 ? 0 : participationPoints;

    const resultsForUpload: TournamentParseResult[] = standings.map((player, index) => {
      const pointsEarned = ((player.wins * 3) + (player.draws * 1) + effectiveParticipation) * effectiveMultiplier;
      return {
        rank: index + 1,
        playerName: player.name,
        matchRecord: player.record,
        wins: player.wins,
        losses: player.losses,
        draws: player.draws,
        pointsEarned: Math.round(pointsEarned)
      };
    });

    const tournamentData = {
      name: tournamentName,
      date: tournamentDate,
      storeName: storeName || 'Tienda Oficial',
      format: format,
      playerCount: registeredPlayers.length,
      leagueId: selectedLeagueId || undefined
    };

    try {
      toast.loading('Sincronizando resultados con el ranking general...', { id: 'finalize-loading' });
      await onTournamentUpload(tournamentData, resultsForUpload);
      toast.dismiss('finalize-loading');
      toast.success('¡Torneo publicado y guardado exitosamente!');
      onCancel(); // Returns to main view
    } catch (e: any) {
      toast.dismiss('finalize-loading');
      toast.error('Error al sincronizar el torneo: ' + e.message);
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // Render Steps UI
  // -------------------------------------------------------------

  const currentPairings = rounds.find(r => r.roundNumber === currentRoundNumber)?.pairings || [];
  const currentLiveStandings = getStandings();

  return (
    <div className="space-y-8 animate-fade-in">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
            <Trophy className="w-8 h-8 text-sky-400" />
            Organizador de Torneos
          </h2>
          <p className="text-slate-400 text-sm font-medium mt-1">Crea y ejecuta un torneo suizo interactivo de forma fácil y profesional.</p>
        </div>
        <button 
          onClick={onCancel}
          className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-xl border border-white/10 transition-all"
        >
          Volver
        </button>
      </div>

      {/* STEP 1: SETUP */}
      {step === 'setup' && (
        <div className="max-w-3xl mx-auto glass-premium p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-[50px] rounded-full"></div>
          
          <h3 className="text-xl font-black text-white uppercase tracking-wider mb-8 flex items-center gap-3">
            <span className="w-8 h-8 bg-sky-500/10 text-sky-400 rounded-lg flex items-center justify-center font-mono text-sm border border-sky-500/20">1</span>
            Configuración Inicial
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Nombre del Torneo</label>
              <input 
                type="text" 
                value={tournamentName}
                onChange={e => setTournamentName(e.target.value)}
                className="w-full px-5 py-4 bg-slate-900 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white font-bold transition-all shadow-inner"
                placeholder="Ej: Semanal Modern"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Formato</label>
                <select 
                  value={format}
                  onChange={e => setFormat(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-900 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white font-bold transition-all shadow-inner"
                >
                  {formatsList.map(fmt => (
                    <option key={fmt} value={fmt}>{fmt}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Tipo de Torneo</label>
                <select 
                  value={tournamentType}
                  onChange={e => setTournamentType(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-900 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white font-bold transition-all shadow-inner"
                >
                  {tournamentTypes.map(t => (
                    <option key={t.value} value={t.value}>{t.label} (Multiplicador x{t.multiplier})</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Fecha del Torneo</label>
                <input 
                  type="date" 
                  value={tournamentDate}
                  onChange={e => setTournamentDate(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-900 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white font-bold transition-all shadow-inner"
                />
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Cantidad de Rondas</label>
                <input 
                  type="number" 
                  min={1}
                  max={10}
                  value={totalRounds}
                  onChange={e => setTotalRounds(parseInt(e.target.value) || 3)}
                  className="w-full px-5 py-4 bg-slate-900 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white font-bold transition-all shadow-inner"
                />
              </div>
            </div>

            {leagues.length > 0 && (
              <div>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Vincular a Liga (Opcional)</label>
                <select 
                  value={selectedLeagueId}
                  onChange={e => setSelectedLeagueId(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-900 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white font-bold transition-all shadow-inner"
                >
                  <option value="">Ninguna liga (Torneo común)</option>
                  {leagues.map(l => (
                    <option key={l.id} value={l.id}>{l.name} ({l.format})</option>
                  ))}
                </select>
              </div>
            )}

            <button 
              onClick={() => setStep('register')}
              className="w-full py-5 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-sky-900/40 transition-all active:scale-95 flex items-center justify-center gap-3 mt-4"
            >
              Continuar al Registro
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: REGISTRATION */}
      {step === 'register' && (
        <div className="max-w-4xl mx-auto glass-premium p-10 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-[50px] rounded-full"></div>
          
          <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
            <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
              <span className="w-8 h-8 bg-sky-500/10 text-sky-400 rounded-lg flex items-center justify-center font-mono text-sm border border-sky-500/20">2</span>
              Registro de Participantes
            </h3>
            <div className="flex gap-2">
              <button 
                onClick={() => setShowBulkInput(!showBulkInput)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] uppercase tracking-wider rounded-xl border border-white/5 transition-all flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                {showBulkInput ? 'Registro Simple' : 'Carga Masiva (Lote)'}
              </button>
            </div>
          </div>

          <div className="space-y-8">
            
            {showBulkInput ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                <p className="text-xs text-slate-400 font-medium">Pega una lista de nombres de jugadores, uno por cada línea. Emparejaremos de forma automática a los usuarios registrados en el sistema.</p>
                <textarea
                  value={bulkInput}
                  onChange={e => setBulkInput(e.target.value)}
                  className="w-full h-48 px-5 py-4 bg-slate-900 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white font-mono text-sm transition-all shadow-inner resize-none"
                  placeholder="Ej:&#10;Nicolas Tejias&#10;Cristian Diaz&#10;Sebastian Riquelme"
                />
                <div className="flex gap-3">
                  <button 
                    onClick={() => setShowBulkInput(false)}
                    className="px-5 py-3 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase rounded-xl transition-all"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={handleBulkImport}
                    className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg"
                  >
                    Importar Lista
                  </button>
                </div>
              </div>
            ) : (
              <div className="relative" ref={dropdownRef}>
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Agregar Jugador</label>
                <div className="flex gap-3">
                  <div className="relative flex-grow">
                    <input 
                      type="text"
                      value={searchPlayer}
                      onChange={e => setSearchPlayer(e.target.value)}
                      onKeyDown={handleKeyDown}
                      className="w-full px-5 py-4 bg-slate-900 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white font-bold transition-all shadow-inner"
                      placeholder="Busca por nombre o alias (ej. Nico)..."
                    />
                    
                    {suggestions.length > 0 && (
                      <div className="absolute left-0 right-0 mt-2 bg-slate-950 border border-white/10 rounded-2xl overflow-hidden shadow-2xl z-30 divide-y divide-white/5">
                        {suggestions.map((p, index) => (
                          <div 
                            key={p.id}
                            onClick={() => addOfficialPlayer(p)}
                            className={`px-5 py-4 hover:bg-sky-600/10 cursor-pointer flex items-center justify-between transition-colors ${
                              focusedSuggestionIndex === index ? 'bg-sky-600/20 text-white' : 'text-slate-300'
                            }`}
                          >
                            <div>
                              <span className="font-bold text-white block">{p.username || p.name}</span>
                              <span className="text-[10px] text-slate-500 font-mono">Nombre: {p.name || 'N/A'}</span>
                            </div>
                            <span className="px-2 py-0.5 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[9px] font-black uppercase rounded-lg">Oficial</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={() => addGuestPlayer(searchPlayer)}
                    disabled={!searchPlayer.trim()}
                    className="px-6 bg-slate-800 hover:bg-slate-700 text-white font-black text-xs uppercase tracking-wider rounded-2xl border border-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5 text-sky-400" />
                    Invitado
                  </button>
                </div>
              </div>
            )}

            {/* REGISTERED LIST */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Users className="w-4 h-4 text-sky-400" />
                  Jugadores Inscritos ({registeredPlayers.length})
                </span>
                {registeredPlayers.length > 0 && (
                  <button 
                    onClick={() => setRegisteredPlayers([])}
                    className="text-red-400 hover:text-red-300 text-xs font-bold transition-colors"
                  >
                    Remover Todos
                  </button>
                )}
              </div>

              {registeredPlayers.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-white/5 bg-slate-900/30 rounded-2xl">
                  <p className="text-slate-500 text-sm font-medium">No hay jugadores inscritos en este torneo todavía.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                  {registeredPlayers.map((player, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3.5 bg-slate-900 border border-white/5 rounded-2xl hover:border-white/10 group transition-all"
                    >
                      <div className="flex items-center gap-3 overflow-hidden">
                        <span className="text-slate-600 font-black font-mono text-[10px]">{index + 1}</span>
                        <div className="overflow-hidden">
                          <p className="font-bold text-white text-sm truncate">{player.name}</p>
                          <span className={`text-[8px] font-black uppercase tracking-widest ${player.id ? 'text-sky-400' : 'text-slate-500'}`}>
                            {player.id ? 'Oficial (Linked)' : 'Invitado'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removePlayer(player.name)}
                        className="p-1.5 bg-slate-800 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg group-hover:opacity-100 transition-all duration-300"
                        title="Eliminar"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ACTION BUTTONS */}
            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6 mt-6">
              <button 
                onClick={() => setStep('setup')}
                className="py-4 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl border border-white/10 transition-all"
              >
                Volver
              </button>
              <button 
                onClick={startTournament}
                disabled={registeredPlayers.length < 3}
                className="py-4 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-sky-900/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                Comenzar Torneo
                <Play className="w-4 h-4 fill-current" />
              </button>
            </div>

          </div>
        </div>
      )}

      {/* STEP 3: ROUNDS */}
      {step === 'rounds' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* PAIRINGS COLUMNS (3/5) */}
          <div className="lg:col-span-3 space-y-6">
            <div className="flex justify-between items-center bg-slate-900/50 px-6 py-4 rounded-2xl border border-white/5">
              <div>
                <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Ronda Activa</span>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Ronda {currentRoundNumber} de {totalRounds}</h3>
              </div>
              <div className="px-4 py-2 bg-slate-950 rounded-xl border border-white/10 text-center">
                <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider block">Mesas</span>
                <span className="text-lg font-black text-white font-mono">{currentPairings.length}</span>
              </div>
            </div>

            {/* PAIRINGS LIST */}
            <div className="space-y-4">
              {currentPairings.map((pairing, index) => {
                const isBye = pairing.player2 === null;
                return (
                  <div 
                    key={pairing.id}
                    className="glass-premium p-6 rounded-3xl border border-white/5 shadow-lg relative overflow-hidden group"
                  >
                    {/* Mesa tag */}
                    <div className="absolute top-4 left-4 bg-slate-950 px-3 py-1 rounded-lg text-[9px] font-black font-mono text-slate-500 border border-white/5">
                      MESA {index + 1}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-5 items-center gap-4 pt-4">
                      
                      {/* Player 1 details */}
                      <div className="sm:col-span-2 text-left space-y-1">
                        <p className={`font-black text-base truncate ${pairing.outcome === 'p1' ? 'text-sky-400 text-glow-blue' : 'text-white'}`}>
                          {pairing.player1.name}
                        </p>
                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                          Pts: {playerStats[pairing.player1.name]?.points || 0}
                        </span>
                      </div>

                      {/* VS / Middle controls */}
                      <div className="sm:col-span-1 text-center py-2 sm:py-0">
                        {isBye ? (
                          <span className="px-3 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/30 text-[9px] font-black uppercase rounded-lg tracking-wider">BYE</span>
                        ) : (
                          <span className="text-slate-600 font-black font-mono text-xs">VS</span>
                        )}
                      </div>

                      {/* Player 2 details */}
                      <div className="sm:col-span-2 text-right sm:text-right space-y-1">
                        {isBye ? (
                          <p className="font-bold text-slate-500 text-base">Descanso</p>
                        ) : (
                          <>
                            <p className={`font-black text-base truncate ${pairing.outcome === 'p2' ? 'text-sky-400 text-glow-blue' : 'text-white'}`}>
                              {pairing.player2?.name}
                            </p>
                            <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                              Pts: {pairing.player2 ? (playerStats[pairing.player2.name]?.points || 0) : 0}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Result buttons */}
                    {!isBye && (
                      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-white/5 mt-4 pt-4">
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] text-slate-500 font-black uppercase tracking-wider">Registro de Partida:</span>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                          <button
                            onClick={() => handleResultChange(pairing.id, 'p1', 2, 0, 0)}
                            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider border transition-all ${
                              pairing.outcome === 'p1' 
                                ? 'bg-sky-600/20 text-sky-400 border-sky-500/40 shadow-md shadow-sky-900/20' 
                                : 'bg-slate-900 text-slate-400 border-white/5 hover:border-white/10'
                            }`}
                          >
                            Gana A (2-0)
                          </button>
                          <button
                            onClick={() => handleResultChange(pairing.id, 'p1', 2, 1, 0)}
                            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider border transition-all ${
                              pairing.outcome === 'p1' && pairing.wins1 === 2 && pairing.wins2 === 1
                                ? 'bg-sky-600/20 text-sky-400 border-sky-500/40' 
                                : 'bg-slate-900 text-slate-400 border-white/5 hover:border-white/10'
                            }`}
                          >
                            Gana A (2-1)
                          </button>
                          <button
                            onClick={() => handleResultChange(pairing.id, 'draw', 1, 1, 1)}
                            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider border transition-all ${
                              pairing.outcome === 'draw' 
                                ? 'bg-amber-500/20 text-amber-400 border-amber-500/40 shadow-md shadow-amber-900/10' 
                                : 'bg-slate-900 text-slate-400 border-white/5 hover:border-white/10'
                            }`}
                          >
                            Empate
                          </button>
                          <button
                            onClick={() => handleResultChange(pairing.id, 'p2', 1, 2, 0)}
                            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider border transition-all ${
                              pairing.outcome === 'p2' && pairing.wins1 === 1 && pairing.wins2 === 2
                                ? 'bg-sky-600/20 text-sky-400 border-sky-500/40' 
                                : 'bg-slate-900 text-slate-400 border-white/5 hover:border-white/10'
                            }`}
                          >
                            Gana B (2-1)
                          </button>
                          <button
                            onClick={() => handleResultChange(pairing.id, 'p2', 0, 2, 0)}
                            className={`flex-1 sm:flex-initial px-4 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-wider border transition-all ${
                              pairing.outcome === 'p2' && pairing.wins1 === 0 && pairing.wins2 === 2
                                ? 'bg-sky-600/20 text-sky-400 border-sky-500/40 shadow-md shadow-sky-900/20' 
                                : 'bg-slate-900 text-slate-400 border-white/5 hover:border-white/10'
                            }`}
                          >
                            Gana B (2-0)
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ACTION PANEL */}
            <div className="flex gap-4 border-t border-white/5 pt-6 mt-6">
              <button 
                onClick={() => {
                  if (confirm('¿Estás seguro de cancelar el torneo? Se perderán todos los datos cargados.')) {
                    onCancel();
                  }
                }}
                className="px-6 py-4 bg-red-950/20 hover:bg-red-950/40 text-red-400 font-bold text-xs uppercase tracking-wider rounded-2xl border border-red-900/20 transition-all"
              >
                Cancelar Torneo
              </button>
              
              <button 
                onClick={nextRound}
                className="flex-grow py-4 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-sky-900/40 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                {currentRoundNumber >= totalRounds ? 'Finalizar Rondas' : 'Siguiente Ronda'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* STANDINGS COLUMN (2/5) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/50 px-6 py-4 rounded-2xl border border-white/5 flex items-center gap-3">
              <Users className="w-5 h-5 text-sky-400" />
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Tabla de Posiciones</h3>
            </div>

            <div className="glass-premium rounded-3xl border border-white/5 overflow-hidden">
              <div className="max-h-[600px] overflow-y-auto">
                <table className="min-w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-950 relative z-20 border-b border-white/5">
                    <tr>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center w-12">#</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Jugador</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center w-16">Pts</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center w-20">OWP%</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {currentLiveStandings.map((player, index) => (
                      <tr 
                        key={player.name}
                        className={`group transition-colors ${
                          index < 1 ? 'bg-sky-500/5 hover:bg-sky-500/10' : 'hover:bg-white/5'
                        }`}
                      >
                        <td className="px-4 py-3.5 text-center">
                          <span className={`text-xs font-black font-mono ${
                            index === 0 ? 'text-yellow-400' :
                            index === 1 ? 'text-slate-300' :
                            index === 2 ? 'text-amber-600' : 'text-slate-600'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <div className="overflow-hidden">
                            <span className="font-bold text-white text-xs block truncate">{player.name}</span>
                            <span className="text-[9px] text-slate-500 font-mono font-bold block">{player.record}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="text-sm font-black text-sky-400">{player.points}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="text-xs font-bold font-mono text-slate-400">
                            {Math.round(player.owp * 100)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* STEP 4: FINISHED */}
      {step === 'finished' && (
        <div className="max-w-4xl mx-auto space-y-8 animate-in zoom-in duration-300">
          
          {/* CONGRATS HEADER */}
          <div className="glass-premium p-10 rounded-[2.5rem] border border-sky-500/20 shadow-2xl relative overflow-hidden text-center space-y-6">
            <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 to-transparent"></div>
            
            <div className="w-24 h-24 bg-sky-500/10 text-sky-400 rounded-full flex items-center justify-center border border-sky-500/20 mx-auto shadow-2xl animate-bounce">
              <Trophy className="w-12 h-12" />
            </div>

            <div className="space-y-2 relative z-10">
              <h3 className="text-4xl font-black text-white uppercase tracking-tighter">¡Torneo Finalizado!</h3>
              <p className="text-slate-400 text-sm max-w-lg mx-auto">
                Todos los emparejamientos y resultados se han registrado correctamente. A continuación puedes ver la clasificación final y proceder con la publicación oficial.
              </p>
            </div>

            {/* PODIO CARD */}
            {currentLiveStandings.length > 0 && (
              <div className="bg-slate-950/50 p-6 rounded-2xl border border-white/5 max-w-md mx-auto flex items-center gap-6 text-left">
                <div className="p-3.5 bg-yellow-500/10 text-yellow-400 border border-yellow-500/20 rounded-xl">
                  <Award className="w-8 h-8" />
                </div>
                <div>
                  <span className="text-[9px] text-yellow-500 font-black uppercase tracking-widest block">Ganador del Torneo</span>
                  <span className="text-xl font-black text-white block">{currentLiveStandings[0].name}</span>
                  <span className="text-xs font-bold text-slate-500 block">Puntos: {currentLiveStandings[0].points} | Récord: {currentLiveStandings[0].record}</span>
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            
            {/* FINAL STANDINGS */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Award className="w-4 h-4 text-sky-400" />
                Clasificación Definitiva
              </h4>
              <div className="glass-premium rounded-3xl border border-white/5 overflow-hidden">
                <table className="min-w-full text-left">
                  <thead className="bg-slate-950 relative z-20 border-b border-white/5">
                    <tr>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center w-12">#</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Jugador</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center w-16">Pts</th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center w-20">Récord</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {currentLiveStandings.map((player, index) => (
                      <tr key={player.name} className="hover:bg-white/5">
                        <td className="px-4 py-3.5 text-center">
                          <span className={`text-xs font-black font-mono ${
                            index === 0 ? 'text-yellow-400' :
                            index === 1 ? 'text-slate-300' :
                            index === 2 ? 'text-amber-600' : 'text-slate-600'
                          }`}>
                            {index + 1}
                          </span>
                        </td>
                        <td className="px-4 py-3.5">
                          <span className="font-bold text-white text-xs block">{player.name}</span>
                          <span className={`text-[8px] font-black uppercase tracking-widest ${player.id ? 'text-sky-400' : 'text-slate-500'}`}>
                            {player.id ? 'Vincular' : 'Manual'}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="text-sm font-black text-sky-400">{player.points}</span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span className="text-xs font-bold font-mono text-slate-300">{player.record}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ROUNDS SUMMARY */}
            <div className="space-y-4">
              <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                <Calendar className="w-4 h-4 text-sky-400" />
                Resumen de Rondas
              </h4>
              <div className="glass-premium p-6 rounded-3xl border border-white/5 space-y-6 max-h-[400px] overflow-y-auto">
                {rounds.map(r => (
                  <div key={r.roundNumber} className="space-y-3">
                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block border-b border-white/5 pb-1">
                      Ronda {r.roundNumber}
                    </span>
                    <div className="space-y-2">
                      {r.pairings.map((p, i) => (
                        <div key={p.id} className="text-xs flex justify-between items-center bg-slate-900/50 p-2.5 rounded-xl">
                          <span className="text-slate-400 font-mono">Mesa {i + 1}</span>
                          <span className="text-white font-bold max-w-[120px] truncate">{p.player1.name}</span>
                          <span className="text-sky-400 font-black font-mono">
                            {p.player2 ? `${p.wins1} - ${p.wins2}` : 'BYE'}
                          </span>
                          <span className="text-white font-bold max-w-[120px] truncate">
                            {p.player2 ? p.player2.name : '-'}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* ACTION BUTTONS */}
          <div className="flex gap-4 border-t border-white/5 pt-6 mt-6">
            <button 
              onClick={() => {
                if (confirm('¿Deseas reiniciar y borrar el torneo para comenzar otro?')) {
                  setStep('setup');
                  setRegisteredPlayers([]);
                  setRounds([]);
                  setPlayerStats({});
                }
              }}
              className="px-6 py-4 bg-white/5 hover:bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-2xl border border-white/10 transition-all flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Reiniciar
            </button>
            <button 
              onClick={finalizeTournament}
              className="flex-grow py-5 bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-emerald-900/30 transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              <CheckCircle className="w-5 h-5" />
              Publicar Resultados y Terminar
            </button>
          </div>

        </div>
      )}

    </div>
  );
};
