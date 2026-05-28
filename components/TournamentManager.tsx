import React, { useState, useEffect, useRef } from 'react';
import {
  Trophy, Play, CheckCircle, Plus, Trash, Users, Award,
  ArrowRight, ChevronRight, RotateCcw, AlertTriangle, Monitor,
  Undo, ShieldAlert, Timer, PlusCircle, ArrowLeft, RefreshCw, LogOut, Check,
  FileSpreadsheet, Calendar
} from 'lucide-react';
import { PlayerProfile, TournamentResult, TournamentParseResult, GameType } from '../types';
import { supabase } from '../supabaseClient';
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
  players: Participant[]; // Pod can have 2, 3 or 4 players
  seats: Record<string, number>; // Maps player name to seat number (1-4)
  wins: Record<string, number>;  // Maps player name to game wins
  draws: number;
  outcome: string | null; // Name of the winner, 'draw', or null
  wageredPoints?: number;  // Points wagered in Point Wager mode
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
  seatsHistory: Record<number, number>; // How many times they sat in seat 1, 2, 3, 4
}

export const TournamentManager: React.FC<TournamentManagerProps> = ({
  players,
  currentGame,
  storeName,
  leagues,
  onTournamentUpload,
  onCancel
}) => {
  // Persistence Key
  const LOCAL_STORAGE_KEY = 'active_live_tournament';

  // Navigation Steps: 'setup' | 'register' | 'rounds' | 'finished'
  const [step, setStep] = useState<'setup' | 'register' | 'rounds' | 'finished'>('setup');

  // 1. Setup State
  const [tournamentId, setTournamentId] = useState('');
  const [tournamentName, setTournamentName] = useState('');
  const [tournamentType, setTournamentType] = useState('semanal');
  const [format, setFormat] = useState('Pauper');
  const [tournamentDate, setTournamentDate] = useState(new Date().toISOString().split('T')[0]);
  const [totalRounds, setTotalRounds] = useState<number>(3);
  const [selectedLeagueId, setSelectedLeagueId] = useState<string>('');
  
  // Commander Specific Setup
  const [commanderPairingMode, setCommanderPairingMode] = useState<'swiss' | 'power' | 'bubble'>('swiss');
  const [scoringMode, setScoringMode] = useState<'standard' | 'wager'>('standard');
  const [topCutSize, setTopCutSize] = useState<'none' | 'top4' | 'top8' | 'top12' | 'top16'>('none');

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

  // 4. TV Mode & Timer State
  const [isTvModeOpen, setIsTvModeOpen] = useState(false);
  const [roundTimer, setRoundTimer] = useState(50 * 60); // 50 minutes standard
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [tableTimers, setTableTimers] = useState<Record<string, { seconds: number; running: boolean }>>({});

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
    'Commander',
    'Pauper',
    'Modern',
    'Standard',
    'Legacy',
    'Premodern',
    'Limited',
    'Sealed',
    'Draft',
    'Custom'
  ];

  const isCommander = format.toLowerCase() === 'commander';
  const currentPairings = rounds.find(r => r.roundNumber === currentRoundNumber)?.pairings || [];

  // -------------------------------------------------------------
  // Offline-First Recovery Check
  // -------------------------------------------------------------
  useEffect(() => {
    const savedData = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (savedData) {
      try {
        const data = JSON.parse(savedData);
        if (confirm(`Se detectó un torneo activo en progreso ("${data.tournamentName}"). ¿Deseas reanudarlo?`)) {
          setStep(data.step);
          setTournamentId(data.tournamentId);
          setTournamentName(data.tournamentName);
          setTournamentType(data.tournamentType);
          setFormat(data.format);
          setTournamentDate(data.tournamentDate);
          setTotalRounds(data.totalRounds);
          setSelectedLeagueId(data.selectedLeagueId || '');
          setCommanderPairingMode(data.commanderPairingMode || 'swiss');
          setScoringMode(data.scoringMode || 'standard');
          setTopCutSize(data.topCutSize || 'none');
          setRegisteredPlayers(data.registeredPlayers || []);
          setCurrentRoundNumber(data.currentRoundNumber || 1);
          setRounds(data.rounds || []);
          setPlayerStats(data.playerStats || {});
          
          if (data.roundTimer) {
            setRoundTimer(data.roundTimer);
          }
          toast.success("Torneo reanudado con éxito.");
          return;
        } else {
          localStorage.removeItem(LOCAL_STORAGE_KEY);
        }
      } catch (e) {
        console.error("Error recovering saved tournament:", e);
      }
    }

    // Set initial date
    setTournamentDate(new Date().toISOString().split('T')[0]);
  }, []);

  // Save state on changes
  useEffect(() => {
    if (step !== 'setup') {
      const stateToSave = {
        step,
        tournamentId,
        tournamentName,
        tournamentType,
        format,
        tournamentDate,
        totalRounds,
        selectedLeagueId,
        commanderPairingMode,
        scoringMode,
        topCutSize,
        registeredPlayers,
        currentRoundNumber,
        rounds,
        playerStats,
        roundTimer
      };
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(stateToSave));
    }
  }, [
    step, tournamentId, tournamentName, tournamentType, format, 
    tournamentDate, totalRounds, selectedLeagueId, commanderPairingMode, 
    scoringMode, topCutSize, registeredPlayers, currentRoundNumber, rounds, 
    playerStats, roundTimer
  ]);

  // Default tournament name when format or type changes
  useEffect(() => {
    const typeLabel = tournamentTypes.find(t => t.value === tournamentType)?.label || tournamentType;
    setTournamentName(`${typeLabel} ${format} - ${tournamentDate}`);
  }, [tournamentType, format, tournamentDate]);

  // Round Timer Countdown
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning && roundTimer > 0) {
      interval = setInterval(() => {
        setRoundTimer(prev => prev - 1);
      }, 1000);
    } else if (roundTimer === 0) {
      setIsTimerRunning(false);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, roundTimer]);

  // Table Timers countdown
  useEffect(() => {
    let interval: any = null;
    const activeTables = Object.keys(tableTimers).filter(id => tableTimers[id].running);
    
    if (activeTables.length > 0) {
      interval = setInterval(() => {
        setTableTimers(prev => {
          const next = { ...prev };
          activeTables.forEach(id => {
            if (next[id] && next[id].running) {
              next[id] = { ...next[id], seconds: next[id].seconds + 1 };
            }
          });
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [tableTimers]);

  // Autocomplete Suggestions logic
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

  // Real-time Polling for QR Code registration
  useEffect(() => {
    let interval: any = null;
    if (step === 'register' && tournamentId) {
      const fetchLiveRegistrations = async () => {
        try {
          const { data, error } = await supabase
            .from('live_tournament_registrations')
            .select(`
              player_id,
              profiles (
                username,
                first_name,
                last_name
              )
            `)
            .eq('tournament_id', tournamentId);

          if (error) throw error;

          if (data && data.length > 0) {
            setRegisteredPlayers(prev => {
              const updated = [...prev];
              let added = false;
              
              data.forEach((reg: any) => {
                const name = reg.profiles?.username || 
                             (reg.profiles?.first_name ? `${reg.profiles.first_name} ${reg.profiles.last_name || ''}`.trim() : null) || 
                             'Jugador';
                
                if (!updated.some(p => p.id === reg.player_id || p.name.toLowerCase() === name.toLowerCase())) {
                  updated.push({ id: reg.player_id, name });
                  added = true;
                }
              });

              if (added) {
                toast.info("¡Nuevo jugador registrado por código QR!");
              }
              return updated;
            });
          }
        } catch (e) {
          console.error("Live registration fetch error:", e);
        }
      };

      fetchLiveRegistrations();
      interval = setInterval(fetchLiveRegistrations, 4000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, tournamentId]);

  // Click outside suggestions list
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

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

  const removePlayer = async (player: Participant) => {
    setRegisteredPlayers(prev => prev.filter(p => p.name !== player.name));
    
    // Clear live registration if it was there
    if (player.id && tournamentId) {
      try {
        await supabase
          .from('live_tournament_registrations')
          .delete()
          .eq('tournament_id', tournamentId)
          .eq('player_id', player.id);
      } catch (e) {
        console.error(e);
      }
    }
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
      toast.success(`Se importaron ${addedCount} jugadores.`);
    } else {
      toast.warning('No se encontraron nuevos nombres para importar.');
    }
  };

  // -------------------------------------------------------------
  // Setup Submit -> Creates Draft Tournament in Database
  // -------------------------------------------------------------
  const handleSetupSubmit = async () => {
    if (!tournamentName.trim()) {
      toast.error("Por favor ingresa un nombre para el torneo.");
      return;
    }

    const tId = crypto.randomUUID();
    setTournamentId(tId);

    try {
      toast.loading("Creando borrador del torneo...", { id: 'create-draft-loading' });
      const { error } = await supabase.rpc('create_tournament_via_rpc', {
        p_id: tId,
        p_name: tournamentName,
        p_date: tournamentDate,
        p_store_name: storeName || 'Tienda Oficial',
        p_format: format,
        p_player_count: 0,
        p_game_type: currentGame,
        p_league_id: selectedLeagueId || null
      });

      if (error) throw error;
      toast.dismiss('create-draft-loading');
      setStep('register');
      toast.success("Borrador creado en la base de datos.");
    } catch (e: any) {
      toast.dismiss('create-draft-loading');
      toast.error("Error al registrar borrador del torneo: " + e.message);
      console.error(e);
    }
  };

  // -------------------------------------------------------------
  // Pairing Generators (Swiss Pods, Seating, 1v1, Point Wager)
  // -------------------------------------------------------------

  const calculateRounds = (playerCount: number, commanderFormat: boolean): number => {
    if (commanderFormat) {
      if (playerCount <= 7) return 2;
      if (playerCount <= 15) return 3;
      if (playerCount <= 63) return 4;
      if (playerCount <= 255) return 5;
      return 6;
    } else {
      if (playerCount <= 8) return 3;
      if (playerCount <= 16) return 4;
      if (playerCount <= 32) return 5;
      if (playerCount <= 64) return 6;
      if (playerCount <= 128) return 7;
      return 8;
    }
  };

  const startTournament = () => {
    const minPlayers = isCommander ? 3 : 2;
    if (registeredPlayers.length < minPlayers) {
      toast.error(`Se requieren al menos ${minPlayers} jugadores para iniciar.`);
      return;
    }

    const calculatedRounds = calculateRounds(registeredPlayers.length, isCommander);
    setTotalRounds(calculatedRounds);

    // Initialize stats
    const initialStats: Record<string, PlayerStats> = {};
    registeredPlayers.forEach(p => {
      initialStats[p.name] = {
        name: p.name,
        points: scoringMode === 'wager' ? 100 : 0, // In Point Wager mode, start with 100 points
        wins: 0,
        losses: 0,
        draws: 0,
        opponents: [],
        byes: 0,
        seatsHistory: { 1: 0, 2: 0, 3: 0, 4: 0 }
      };
    });

    setPlayerStats(initialStats);
    
    // Generate Round 1 pairings
    const initialPairings = generatePairingsForRound(1, registeredPlayers, [], initialStats);
    
    setRounds([{
      roundNumber: 1,
      pairings: initialPairings
    }]);

    setCurrentRoundNumber(1);
    setStep('rounds');
    toast.success('¡El torneo ha comenzado! Ronda 1 emparejada.');
  };

  const generatePairingsForRound = (
    roundNum: number,
    playersList: Participant[],
    history: Round[],
    stats: Record<string, PlayerStats>
  ): Pairing[] => {
    if (!isCommander) {
      // Standard 1v1 Swiss generator (backtracking wrapper)
      return generateStandardSwissPairings(playersList, history, stats);
    }

    // --- COMMANDER MULTIPLAYER SWISS PODS ---
    const N = playersList.length;

    // 1. Math solver to get pod sizes of 4 and 3
    const getPodSizes = (cnt: number): number[] => {
      if (cnt < 3) return [cnt];
      if (cnt === 5) return [3, 2];
      
      let x = Math.floor(cnt / 4);
      let remainder = cnt % 4;
      
      if (remainder === 0) return Array(x).fill(4);
      if (remainder === 3) return [...Array(x).fill(4), 3];
      if (remainder === 2) return [...Array(x - 1).fill(4), 3, 3];
      if (remainder === 1) return [...Array(x - 2).fill(4), 3, 3, 3];
      return [cnt];
    };

    const podSizes = getPodSizes(N);

    // 2. Sort players by points desc.
    const sortedPlayers = [...playersList].sort((a, b) => {
      const ptsA = stats[a.name]?.points || 0;
      const ptsB = stats[b.name]?.points || 0;
      return ptsB - ptsA;
    });

    // 3. Initial grouping into pods
    let playerIndex = 0;
    const initialPods = podSizes.map(size => {
      const podPlayers = sortedPlayers.slice(playerIndex, playerIndex + size);
      playerIndex += size;
      return podPlayers;
    });

    // 4. Heuristic Swap to resolve rematches
    const opponentsMap = new Map<string, Set<string>>();
    playersList.forEach(p => {
      opponentsMap.set(p.name, new Set(stats[p.name]?.opponents || []));
    });

    const hasRematchInPod = (pod: Participant[]): boolean => {
      for (let i = 0; i < pod.length; i++) {
        const opps = opponentsMap.get(pod[i].name);
        if (opps) {
          for (let j = i + 1; j < pod.length; j++) {
            if (opps.has(pod[j].name)) return true;
          }
        }
      }
      return false;
    };

    // Swap items between adjacent pods to resolve rematches
    for (let i = 0; i < initialPods.length - 1; i++) {
      if (hasRematchInPod(initialPods[i])) {
        // Try swapping a player from Pod i with a player in Pod i+1
        const podA = initialPods[i];
        const podB = initialPods[i + 1];
        let solved = false;

        for (let aIdx = 0; aIdx < podA.length; aIdx++) {
          for (let bIdx = 0; bIdx < podB.length; bIdx++) {
            // Swap
            const temp = podA[aIdx];
            podA[aIdx] = podB[bIdx];
            podB[bIdx] = temp;

            if (!hasRematchInPod(podA) && !hasRematchInPod(podB)) {
              solved = true;
              break;
            }

            // Undo swap if it didn't solve it
            podB[bIdx] = podA[aIdx];
            podA[aIdx] = temp;
          }
          if (solved) break;
        }
      }
    }

    // 5. Seating balance & Seat Assignment
    const shuffleSeatsSecurely = (array: any[]) => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const randomBuffer = new Uint32Array(1);
        window.crypto.getRandomValues(randomBuffer);
        const j = randomBuffer[0] % (i + 1);
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const pairings: Pairing[] = initialPods.map(pod => {
      // Determine seating order
      let seatingOrder: Participant[] = [];

      if (roundNum === 1) {
        // Round 1: Cryptographically secure randomize seats
        seatingOrder = shuffleSeatsSecurely(pod);
      } else {
        // Round > 1: Balance seats or use inverse Swiss order
        // Let's sort players in the pod: lowest points first gets seat 1
        seatingOrder = [...pod].sort((a, b) => {
          const ptsA = stats[a.name]?.points || 0;
          const ptsB = stats[b.name]?.points || 0;
          
          if (ptsA !== ptsB) return ptsA - ptsB; // lowest points gets Seat 1

          // Tiebreaker: prioritize someone who has been in Seat 1 less times
          const s1A = stats[a.name]?.seatsHistory[1] || 0;
          const s1B = stats[b.name]?.seatsHistory[1] || 0;
          return s1A - s1B;
        });
      }

      // Map to seats record
      const seats: Record<string, number> = {};
      seatingOrder.forEach((player, index) => {
        seats[player.name] = index + 1;
      });

      // Calculate wager if Point Wager mode is on
      let wageredPoints = undefined;
      if (scoringMode === 'wager') {
        wageredPoints = 0;
        pod.forEach(p => {
          const currentPts = stats[p.name]?.points || 100;
          const bet = Math.ceil(currentPts * 0.15); // Bet 15% of points
          wageredPoints! += bet;
        });
      }

      const wins: Record<string, number> = {};
      pod.forEach(p => { wins[p.name] = 0; });

      return {
        id: crypto.randomUUID(),
        players: pod,
        seats,
        wins,
        draws: 0,
        outcome: null,
        wageredPoints
      };
    });

    return pairings;
  };

  const generateStandardSwissPairings = (
    playersList: Participant[],
    history: Round[],
    stats: Record<string, PlayerStats>
  ): Pairing[] => {
    const sortedPlayers = [...playersList].sort((a, b) => {
      const ptsA = stats[a.name]?.points || 0;
      const ptsB = stats[b.name]?.points || 0;
      return ptsB - ptsA;
    });

    const byePlayers = new Set<string>();
    Object.values(stats).forEach(s => {
      if (s.byes > 0) byePlayers.add(s.name);
    });

    let byePlayer: Participant | null = null;
    if (sortedPlayers.length % 2 !== 0) {
      let byeIndex = -1;
      for (let i = sortedPlayers.length - 1; i >= 0; i--) {
        if (!byePlayers.has(sortedPlayers[i].name)) {
          byeIndex = i;
          break;
        }
      }
      if (byeIndex === -1) byeIndex = sortedPlayers.length - 1;
      byePlayer = sortedPlayers[byeIndex];
      sortedPlayers.splice(byeIndex, 1);
    }

    const opponentsMap = new Map<string, Set<string>>();
    playersList.forEach(p => {
      opponentsMap.set(p.name, new Set(stats[p.name]?.opponents || []));
    });

    const pairings: Pairing[] = [];
    const paired = new Set<string>();

    function backtrack(index: number): boolean {
      if (index >= sortedPlayers.length) return true;
      const p1 = sortedPlayers[index];
      if (paired.has(p1.name)) return backtrack(index + 1);

      for (let i = index + 1; i < sortedPlayers.length; i++) {
        const p2 = sortedPlayers[i];
        if (paired.has(p2.name)) continue;

        const p1Opponents = opponentsMap.get(p1.name);
        if (p1Opponents && p1Opponents.has(p2.name)) continue;

        paired.add(p1.name);
        paired.add(p2.name);
        pairings.push({
          id: crypto.randomUUID(),
          players: [p1, p2],
          seats: { [p1.name]: 1, [p2.name]: 2 },
          wins: { [p1.name]: 0, [p2.name]: 0 },
          draws: 0,
          outcome: null
        });

        if (backtrack(index + 1)) return true;

        paired.delete(p1.name);
        paired.delete(p2.name);
        pairings.pop();
      }
      return false;
    }

    const success = backtrack(0);

    if (!success) {
      // Greedy points matching fallback
      pairings.length = 0;
      paired.clear();
      const unpaired = [...sortedPlayers];
      while (unpaired.length > 0) {
        const p1 = unpaired.shift()!;
        if (unpaired.length > 0) {
          const p2 = unpaired.shift()!;
          pairings.push({
            id: crypto.randomUUID(),
            players: [p1, p2],
            seats: { [p1.name]: 1, [p2.name]: 2 },
            wins: { [p1.name]: 0, [p2.name]: 0 },
            draws: 0,
            outcome: null
          });
        } else {
          byePlayer = p1;
        }
      }
    }

    if (byePlayer) {
      pairings.push({
        id: crypto.randomUUID(),
        players: [byePlayer],
        seats: { [byePlayer.name]: 1 },
        wins: { [byePlayer.name]: 2 },
        draws: 0,
        outcome: byePlayer.name
      });
    }

    return pairings;
  };

  // -------------------------------------------------------------
  // Result Recording (Standard 1v1 and Commander Pods)
  // -------------------------------------------------------------

  const handleCommanderOutcome = (pairingId: string, outcome: string | 'draw') => {
    setRounds(prevRounds => {
      return prevRounds.map(r => {
        if (r.roundNumber === currentRoundNumber) {
          return {
            ...r,
            pairings: r.pairings.map(p => {
              if (p.id === pairingId) {
                const wins: Record<string, number> = {};
                p.players.forEach(player => {
                  wins[player.name] = player.name === outcome ? 2 : 0;
                });

                return {
                  ...p,
                  outcome,
                  wins,
                  draws: outcome === 'draw' ? 1 : 0
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

  const handle1v1Outcome = (pairingId: string, winnerName: string | 'draw', wins1: number, wins2: number, draws: number = 0) => {
    setRounds(prevRounds => {
      return prevRounds.map(r => {
        if (r.roundNumber === currentRoundNumber) {
          return {
            ...r,
            pairings: r.pairings.map(p => {
              if (p.id === pairingId) {
                const wins: Record<string, number> = {};
                const name1 = p.players[0].name;
                const name2 = p.players[1]?.name;
                
                wins[name1] = wins1;
                if (name2) wins[name2] = wins2;

                return {
                  ...p,
                  outcome: winnerName,
                  wins,
                  draws
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

  const updatePlayerStatsFromAllRounds = (allCompletedRounds: Round[]): Record<string, PlayerStats> => {
    const newStats: Record<string, PlayerStats> = {};

    // Initialize stats
    registeredPlayers.forEach(p => {
      newStats[p.name] = {
        name: p.name,
        points: scoringMode === 'wager' ? 100 : 0,
        wins: 0,
        losses: 0,
        draws: 0,
        opponents: [],
        byes: 0,
        seatsHistory: { 1: 0, 2: 0, 3: 0, 4: 0 }
      };
    });

    allCompletedRounds.forEach(r => {
      r.pairings.forEach(p => {
        // Record seat history
        p.players.forEach(player => {
          const seat = p.seats[player.name];
          if (seat && newStats[player.name]) {
            newStats[player.name].seatsHistory[seat] = (newStats[player.name].seatsHistory[seat] || 0) + 1;
          }
        });

        // 1v1 BYE
        if (p.players.length === 1) {
          const p1 = p.players[0].name;
          if (newStats[p1]) {
            newStats[p1].points += isCommander ? 5 : 3;
            newStats[p1].wins += 1;
            newStats[p1].byes += 1;
          }
          return;
        }

        // Multiplayer / 1v1 Normal Match
        p.players.forEach(player => {
          const pStats = newStats[player.name];
          if (!pStats) return;

          // Record opponents
          p.players.forEach(opp => {
            if (opp.name !== player.name) {
              pStats.opponents.push(opp.name);
            }
          });

          if (scoringMode === 'wager') {
            // Point Wager: bet points are subtracted, winner gets wageredPoints
            const bet = Math.ceil(pStats.points * 0.15);
            pStats.points -= bet;

            if (p.outcome === player.name) {
              pStats.wins += 1;
              pStats.points += p.wageredPoints || 0;
            } else if (p.outcome === 'draw') {
              pStats.draws += 1;
              pStats.points += bet; // return the bet points in draw
            } else {
              pStats.losses += 1;
            }
          } else {
            // Standard MTRA / Standard scoring
            if (p.outcome === player.name) {
              pStats.wins += 1;
              pStats.points += isCommander ? 5 : 3;
            } else if (p.outcome === 'draw') {
              pStats.draws += 1;
              pStats.points += 1;
            } else {
              pStats.losses += 1;
            }
          }
        });
      });
    });

    return newStats;
  };

  // OWP (Opponent Match Win Percentage)
  const calculateOWP = (name: string, stats: Record<string, PlayerStats>): number => {
    const s = stats[name];
    const floor = isCommander ? 0.20 : 0.33; // Commander floor is 20% (0.20) as requested!
    if (!s || s.opponents.length === 0) return floor;

    let sumMWP = 0;
    let count = 0;

    s.opponents.forEach(opp => {
      const oppStats = stats[opp];
      if (oppStats) {
        const roundsPlayed = oppStats.wins + oppStats.losses + oppStats.draws - oppStats.byes;
        let mwp = floor;
        if (roundsPlayed > 0) {
          const maxPoints = roundsPlayed * (isCommander ? 5 : 3);
          mwp = oppStats.points / maxPoints;
        }
        if (mwp < floor) mwp = floor;
        sumMWP += mwp;
        count++;
      }
    });

    return count > 0 ? sumMWP / count : floor;
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

    // Sort: 1. Points, 2. OWP, 3. Wins, 4. Alphabetical
    return list.sort((a, b) => {
      if (b.points !== a.points) return b.points - a.points;
      if (b.owp !== a.owp) return b.owp - a.owp;
      if (b.wins !== a.wins) return b.wins - a.wins;
      return a.name.localeCompare(b.name);
    });
  };

  // Next round pairing generator
  const handleNextRound = () => {
    const currentRound = rounds.find(r => r.roundNumber === currentRoundNumber);
    if (!currentRound) return;

    // Check all pairings have results
    const unrecorded = currentRound.pairings.some(p => p.outcome === null);
    if (unrecorded) {
      toast.error('Por favor, registra todos los emparejamientos antes de avanzar.');
      return;
    }

    // Save completed rounds state
    const currentHistory = rounds.map(r => {
      if (r.roundNumber === currentRoundNumber) {
        return { ...r, pairings: currentRound.pairings };
      }
      return r;
    });

    const updatedStats = updatePlayerStatsFromAllRounds(currentHistory);
    setPlayerStats(updatedStats);

    if (currentRoundNumber >= totalRounds) {
      setStep('finished');
      toast.success('¡Torneo completado! Revisa la clasificación final.');
      return;
    }

    // Generate Next Round Pairings
    const nextRoundNum = currentRoundNumber + 1;
    const nextPairings = generatePairingsForRound(nextRoundNum, registeredPlayers, currentHistory, updatedStats);

    setRounds([...currentHistory, {
      roundNumber: nextRoundNum,
      pairings: nextPairings
    }]);

    setCurrentRoundNumber(nextRoundNum);
    
    // Reset round timer to 50 minutes
    setRoundTimer(50 * 60);
    setIsTimerRunning(false);
    
    toast.success(`Ronda ${nextRoundNum} generada.`);
  };

  // Hot Revert
  const handleHotRevert = () => {
    if (currentRoundNumber <= 1) {
      toast.warning("No hay rondas previas para revertir.");
      return;
    }

    if (confirm("¿Estás seguro que deseas deshacer la ronda actual y volver a la anterior? Se perderán las puntuaciones de esta ronda.")) {
      const prevRoundNum = currentRoundNumber - 1;
      const prevHistory = rounds.slice(0, prevRoundNum);
      
      const revertedStats = updatePlayerStatsFromAllRounds(prevHistory);
      setPlayerStats(revertedStats);
      setRounds(prevHistory);
      setCurrentRoundNumber(prevRoundNum);
      
      setRoundTimer(50 * 60);
      setIsTimerRunning(false);
      
      toast.success(`Reversión en caliente completada. Volviste a la Ronda ${prevRoundNum}.`);
    }
  };

  // Time Extensions suggestions
  const toggleTableTimer = (tableId: string) => {
    setTableTimers(prev => {
      const current = prev[tableId] || { seconds: 0, running: false };
      return {
        ...prev,
        [tableId]: {
          seconds: current.seconds,
          running: !current.running
        }
      };
    });
  };

  const getSuggestedExtension = (seconds: number) => {
    if (seconds <= 0) return 0;
    return Math.ceil(seconds / 60); // Round up to next minute
  };

  const handlePlayerDrop = (playerName: string) => {
    if (confirm(`¿Estás seguro que deseas retirar (Drop) a "${playerName}" del torneo?`)) {
      setRegisteredPlayers(prev => prev.filter(p => p.name !== playerName));
      toast.warning(`${playerName} ha sido retirado del torneo.`);
    }
  };

  // Finalize & Upload to Supabase
  const finalizeTournament = async () => {
    const currentRound = rounds.find(r => r.roundNumber === currentRoundNumber);
    const finalPairings = currentRound ? currentRound.pairings : [];
    
    const finalHistory = rounds.map(r => {
      if (r.roundNumber === currentRoundNumber) {
        return { ...r, pairings: finalPairings };
      }
      return r;
    });

    const finalStats = updatePlayerStatsFromAllRounds(finalHistory);
    const standings = getStandings(finalStats);

    const multiplier = getTournamentMultiplier(tournamentType);
    const participationPoints = registeredPlayers.length >= 8 ? getParticipationPoints(registeredPlayers.length) : 0;
    const effectiveMultiplier = registeredPlayers.length < 8 ? 1 : multiplier;

    // Convert standings to DB format
    const resultsForUpload: TournamentParseResult[] = standings.map((player, index) => {
      // PWP Points calculation: MTRA score + participation points, multiplied
      let basePoints = player.points;
      if (scoringMode === 'wager') {
        // Point wager score is usually high, so let's normalize or use custom logic, or just standard MTRA approximation for seasonal ranking
        basePoints = player.wins * (isCommander ? 5 : 3) + player.draws * 1;
      }
      
      const pointsEarned = (basePoints + participationPoints) * effectiveMultiplier;

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
      toast.loading('Publicando torneo en el ranking nacional...', { id: 'finalize-loading' });
      
      // Update the main tournament's player count
      const { error: updateError } = await supabase
        .from('tournaments')
        .update({ player_count: registeredPlayers.length })
        .eq('id', tournamentId);

      if (updateError) throw updateError;

      // Upload results bulk
      const resultsToUpload = resultsForUpload.map(result => ({
        player_name: result.playerName,
        wins: result.wins,
        losses: result.losses,
        draws: result.draws,
        pwp_earned: result.pointsEarned,
        rank: result.rank
      }));

      const { error: rpcError } = await supabase.rpc('process_tournament_results_bulk', {
        p_tournament_id: tournamentId,
        p_results: resultsToUpload
      });

      if (rpcError) throw rpcError;

      // Clean live registrations table
      await supabase
        .from('live_tournament_registrations')
        .delete()
        .eq('tournament_id', tournamentId);

      toast.dismiss('finalize-loading');
      toast.success('¡Torneo sincronizado y completado con éxito!');
      
      // Clear persistence
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      onCancel(); // return to dashboard
    } catch (e: any) {
      toast.dismiss('finalize-loading');
      toast.error('Error al sincronizar: ' + e.message);
      console.error(e);
    }
  };

  const cancelTournament = async () => {
    if (confirm('¿Estás seguro de cancelar el torneo? Se borrará todo el historial.')) {
      if (tournamentId) {
        try {
          await supabase.rpc('delete_tournament_by_id', {
            tournament_id_param: tournamentId
          });
        } catch (e) {
          console.error(e);
        }
      }
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      onCancel();
    }
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

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Live join page link
  const joinUrl = `${window.location.origin}/#/torneos/inscribir?id=${tournamentId}`;

  // -------------------------------------------------------------
  // UI RENDER
  // -------------------------------------------------------------

  const currentLiveStandings = getStandings();

  return (
    <div className="space-y-8 animate-fade-in relative">
      
      {/* HEADER SECTION */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-6 border-b border-white/5">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter uppercase flex items-center gap-3">
            <Trophy className="w-8 h-8 text-sky-400" />
            Organizador de Torneos {isCommander && <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 font-black tracking-widest ml-2">MODO COMMANDER</span>}
          </h2>
          <p className="text-slate-400 text-sm font-medium mt-1">Crea y ejecuta torneos suizos {isCommander ? 'multijugador' : '1v1'} de forma profesional y con soporte Offline-First.</p>
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
            Configuración del Torneo
          </h3>

          <div className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Nombre del Torneo</label>
              <input 
                type="text" 
                value={tournamentName}
                onChange={e => setTournamentName(e.target.value)}
                className="w-full px-5 py-4 bg-slate-900 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white font-bold transition-all shadow-inner"
                placeholder="Ej: Semanal Commander"
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
                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Tipo de Evento</label>
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

            {/* Commander Custom Options */}
            {isCommander && (
              <div className="p-6 bg-slate-950/40 rounded-3xl border border-white/5 space-y-6">
                <h4 className="text-[10px] font-black text-sky-400 uppercase tracking-wider">Ajustes Especializados de Commander</h4>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Variante de Emparejamiento</label>
                    <select
                      value={commanderPairingMode}
                      onChange={e => setCommanderPairingMode(e.target.value as any)}
                      className="w-full px-4 py-3 bg-slate-900 border border-white/5 rounded-xl text-xs font-bold text-white focus:outline-none"
                    >
                      <option value="swiss">Swiss Pods (Estándar)</option>
                      <option value="power">Power Pods (Leaders)</option>
                      <option value="bubble">Bubble Pods (Bubble)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Sistema de Puntuación</label>
                    <select
                      value={scoringMode}
                      onChange={e => setScoringMode(e.target.value as any)}
                      className="w-full px-4 py-3 bg-slate-900 border border-white/5 rounded-xl text-xs font-bold text-white focus:outline-none"
                    >
                      <option value="standard">Estándar MTRA (5-1-0)</option>
                      <option value="wager">Apuesta de Puntos (15%)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Corte / Top Cut</label>
                    <select
                      value={topCutSize}
                      onChange={e => setTopCutSize(e.target.value as any)}
                      className="w-full px-4 py-3 bg-slate-900 border border-white/5 rounded-xl text-xs font-bold text-white focus:outline-none"
                    >
                      <option value="none">Sin Corte (Solo Suizo)</option>
                      <option value="top4">Top 4 (1 Pod)</option>
                      <option value="top8">Top 8 (2 Pods)</option>
                      <option value="top12">Top 12 (3 Pods)</option>
                      <option value="top16">Top 16 (4 Pods)</option>
                    </select>
                  </div>
                </div>

                <div className="p-4 bg-amber-500/5 border border-amber-500/10 rounded-2xl flex items-start gap-3">
                  <ShieldAlert className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-200/80 font-medium leading-relaxed">
                    De acuerdo con las reglas oficiales MTRA, los puntos por logros (Achievements) están deshabilitados en esta herramienta para evitar pactos desleales y kingmaking en la clasificación competitiva.
                  </p>
                </div>
              </div>
            )}

            <div>
              <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Fecha del Torneo</label>
              <input
                type="date"
                value={tournamentDate}
                onChange={e => setTournamentDate(e.target.value)}
                className="w-full px-5 py-4 bg-slate-900 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white font-bold transition-all shadow-inner"
              />
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
              onClick={handleSetupSubmit}
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
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* Left 3/5: Registration controls */}
          <div className="lg:col-span-3 glass-premium p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden space-y-6">
            <div className="flex justify-between items-center border-b border-white/5 pb-4">
              <h3 className="text-xl font-black text-white uppercase tracking-wider flex items-center gap-3">
                <span className="w-8 h-8 bg-sky-500/10 text-sky-400 rounded-lg flex items-center justify-center font-mono text-sm border border-sky-500/20">2</span>
                Registro de Participantes
              </h3>
              <button 
                onClick={() => setShowBulkInput(!showBulkInput)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-black text-[10px] uppercase tracking-wider rounded-xl border border-white/5 transition-all flex items-center gap-2"
              >
                <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                {showBulkInput ? 'Registro Simple' : 'Carga Masiva (Lote)'}
              </button>
            </div>

            {showBulkInput ? (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 font-medium">Pega una lista de nombres de jugadores (uno por línea):</p>
                <textarea
                  value={bulkInput}
                  onChange={e => setBulkInput(e.target.value)}
                  className="w-full h-48 px-5 py-4 bg-slate-900 border border-white/5 rounded-2xl focus:outline-none focus:ring-2 focus:ring-sky-500 text-white font-mono text-sm transition-all shadow-inner resize-none"
                  placeholder="Ej:&#10;Nico Tejias&#10;Cristian Diaz"
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
                      placeholder="Busca por nombre o alias..."
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
                  <p className="text-slate-500 text-sm font-medium">No hay jugadores inscritos todavía.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto">
                  {registeredPlayers.map((player, index) => (
                    <div 
                      key={index}
                      className="flex items-center justify-between p-3 bg-slate-900 border border-white/5 rounded-2xl group hover:border-white/10"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <span className="text-slate-600 font-mono text-[10px]">{index + 1}</span>
                        <div className="truncate">
                          <p className="font-bold text-white text-xs truncate">{player.name}</p>
                          <span className={`text-[8px] font-black uppercase tracking-widest ${player.id ? 'text-sky-400' : 'text-slate-500'}`}>
                            {player.id ? 'Vincular' : 'Manual'}
                          </span>
                        </div>
                      </div>
                      <button 
                        onClick={() => removePlayer(player)}
                        className="p-1 text-slate-400 hover:text-red-400 rounded transition-all"
                      >
                        <Trash className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 border-t border-white/5 pt-6 mt-6">
              <button 
                onClick={cancelTournament}
                className="py-4 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest rounded-2xl border border-white/10 transition-all"
              >
                Cancelar Torneo
              </button>
              <button 
                onClick={startTournament}
                disabled={registeredPlayers.length < (isCommander ? 3 : 2)}
                className="py-4 bg-sky-600 hover:bg-sky-500 disabled:bg-slate-800 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-sky-900/40 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                Comenzar Torneo
                <Play className="w-4 h-4 fill-current" />
              </button>
            </div>
          </div>

          {/* Right 2/5: QR Code Live Register Card */}
          <div className="lg:col-span-2 glass-premium p-8 rounded-[2.5rem] border border-white/5 shadow-2xl text-center space-y-6 flex flex-col justify-center items-center relative overflow-hidden">
            <div className="absolute -top-12 -right-12 w-24 h-24 bg-sky-500/5 blur-2xl rounded-full"></div>
            
            <div className="w-12 h-12 bg-sky-500/10 text-sky-400 rounded-xl flex items-center justify-center border border-sky-500/20 shadow-lg">
              <Users className="w-6 h-6" />
            </div>

            <div className="space-y-2">
              <h4 className="text-lg font-black text-white uppercase tracking-tighter">Inscripción por QR en Vivo</h4>
              <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                Los jugadores pueden escanear este código QR con sus teléfonos móviles para registrarse de manera autónoma con su cuenta.
              </p>
            </div>

            {/* QR Image */}
            <div className="p-4 bg-white rounded-3xl shadow-2xl border border-white/10 hover:scale-105 transition-transform duration-500 relative group">
              <img 
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(joinUrl)}`}
                alt="QR Code de Inscripción" 
                className="w-44 h-44 object-contain"
              />
            </div>

            {/* Live Indicator */}
            <div className="flex items-center gap-2.5 px-4 py-2 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Sondeando en vivo...
            </div>
            
            <p className="text-[10px] text-slate-500 font-mono select-all truncate max-w-full">
              {joinUrl}
            </p>
          </div>

        </div>
      )}

      {/* STEP 3: ROUNDS */}
      {step === 'rounds' && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          
          {/* PAIRINGS CARD (3/5) */}
          <div className="lg:col-span-3 space-y-6">
            
            {/* Round info bar */}
            <div className="flex justify-between items-center bg-slate-900/50 px-6 py-4 rounded-2xl border border-white/5">
              <div>
                <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Ronda Activa</span>
                <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Ronda {currentRoundNumber} de {totalRounds}</h3>
              </div>

              {/* Countdown Timer */}
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 bg-slate-950 px-4 py-2.5 rounded-xl border border-white/5 text-center">
                  <Timer className={`w-5 h-5 ${isTimerRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
                  <span className="text-xl font-black text-white font-mono leading-none">{formatTimer(roundTimer)}</span>
                </div>
                <button 
                  onClick={() => setIsTimerRunning(!isTimerRunning)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border ${
                    isTimerRunning ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-sky-600 text-white'
                  }`}
                >
                  {isTimerRunning ? 'Pausar' : 'Iniciar'}
                </button>
              </div>

              <div className="flex gap-2">
                <button 
                  onClick={() => setIsTvModeOpen(true)}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-white/5 transition-all"
                  title="Modo TV (Pantalla Completa)"
                >
                  <Monitor className="w-5 h-5 text-sky-400" />
                </button>
                <button 
                  onClick={handleHotRevert}
                  className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl border border-white/5 transition-all"
                  title="Reversión en Caliente (Hot Revert)"
                >
                  <Undo className="w-5 h-5 text-amber-400" />
                </button>
              </div>
            </div>

            {/* PAIRINGS / PODS LIST */}
            <div className="space-y-4">
              {currentPairings.map((pairing, index) => {
                const isBye = pairing.players.length === 1 && !isCommander;
                const isTableTimerActive = tableTimers[pairing.id]?.running;
                const tableSeconds = tableTimers[pairing.id]?.seconds || 0;
                
                return (
                  <div 
                    key={pairing.id}
                    className="glass-premium p-6 rounded-3xl border border-white/5 shadow-lg relative overflow-hidden group space-y-4"
                  >
                    {/* Top table indicator */}
                    <div className="flex justify-between items-center">
                      <span className="px-3 py-1 bg-slate-950 rounded-lg text-[9px] font-black font-mono text-slate-500 border border-white/5">
                        MESA / POD {index + 1}
                      </span>
                      
                      {/* Points wager indicator */}
                      {pairing.wageredPoints !== undefined && (
                        <span className="px-3 py-1 bg-violet-500/10 text-violet-400 border border-violet-500/20 rounded-full text-[9px] font-black uppercase tracking-wider">
                          Pozo Apuesta: +{pairing.wageredPoints} Pts
                        </span>
                      )}

                      {/* Juez table stopwatch */}
                      <div className="flex items-center gap-2">
                        {tableSeconds > 0 && (
                          <span className="text-[10px] font-mono text-amber-400 font-bold">
                            +{getSuggestedExtension(tableSeconds)} min prórroga
                          </span>
                        )}
                        <button
                          onClick={() => toggleTableTimer(pairing.id)}
                          className={`p-1.5 rounded-lg border transition-all flex items-center gap-1 ${
                            isTableTimerActive 
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' 
                              : 'bg-slate-950 text-slate-500 border-white/5 hover:text-slate-300'
                          }`}
                          title="Medición de prórroga para Juez"
                        >
                          <Timer className="w-3.5 h-3.5" />
                          <span className="text-[9px] font-black uppercase tracking-wider">
                            {isTableTimerActive ? 'Midiendo...' : 'Juez'}
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Pod players rows */}
                    <div className="divide-y divide-white/5">
                      {pairing.players.map(player => {
                        const isWinner = pairing.outcome === player.name;
                        const seatNumber = pairing.seats[player.name];
                        
                        return (
                          <div 
                            key={player.name}
                            className={`py-3 flex justify-between items-center transition-all ${
                              isWinner ? 'bg-sky-500/5 px-2 rounded-xl' : ''
                            }`}
                          >
                            <div className="flex items-center gap-3 overflow-hidden">
                              {/* Seat indicator */}
                              {seatNumber && (
                                <span className="w-6 h-6 rounded-lg bg-slate-950 text-[10px] font-black font-mono text-slate-500 border border-white/5 flex items-center justify-center">
                                  A{seatNumber}
                                </span>
                              )}
                              <div className="overflow-hidden">
                                <p className={`font-black text-sm truncate ${isWinner ? 'text-sky-400 text-glow-blue' : 'text-white'}`}>
                                  {player.name}
                                </p>
                                <span className="text-[9px] text-slate-500 font-semibold uppercase">
                                  Puntos: {playerStats[player.name]?.points || 0}
                                </span>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Drop player button */}
                              <button
                                onClick={() => handlePlayerDrop(player.name)}
                                className="p-1 text-slate-600 hover:text-red-400 hover:bg-red-500/10 rounded transition-all opacity-0 group-hover:opacity-100"
                                title="Retirar del torneo"
                              >
                                <LogOut className="w-3.5 h-3.5" />
                              </button>

                              {/* Pod quick result buttons */}
                              {!isBye && (
                                <button
                                  onClick={() => {
                                    if (isCommander) {
                                      handleCommanderOutcome(pairing.id, player.name);
                                    } else {
                                      const isP1 = pairing.players[0].name === player.name;
                                      handle1v1Outcome(pairing.id, player.name, isP1 ? 2 : 0, isP1 ? 0 : 2);
                                    }
                                  }}
                                  className={`px-3 py-1.5 rounded-lg border font-black text-[9px] uppercase tracking-wider transition-all ${
                                    isWinner 
                                      ? 'bg-sky-600/20 text-sky-400 border-sky-500/40 shadow-sm' 
                                      : 'bg-slate-950 text-slate-500 border-white/5 hover:border-white/10 hover:text-slate-300'
                                  }`}
                                >
                                  Ganador
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}

                      {isBye && (
                        <div className="py-3 text-center text-xs text-amber-400 font-black uppercase tracking-widest bg-amber-500/5 rounded-xl border border-amber-500/10">
                          Descanso (BYE) - +5 Pts
                        </div>
                      )}
                    </div>

                    {/* Table Draw / Tie option */}
                    {!isBye && (
                      <div className="flex justify-end gap-2 border-t border-white/5 pt-3 mt-3">
                        <button
                          onClick={() => {
                            if (isCommander) {
                              handleCommanderOutcome(pairing.id, 'draw');
                            } else {
                              handle1v1Outcome(pairing.id, 'draw', 1, 1, 1);
                            }
                          }}
                          className={`px-3.5 py-1.5 rounded-lg border font-black text-[9px] uppercase tracking-wider transition-all ${
                            pairing.outcome === 'draw'
                              ? 'bg-amber-500/20 text-amber-400 border-amber-500/40'
                              : 'bg-slate-950 text-slate-500 border-white/5 hover:border-white/10 hover:text-slate-300'
                          }`}
                        >
                          Empate
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* ACTION PANEL */}
            <div className="flex gap-4 border-t border-white/5 pt-6 mt-6">
              <button 
                onClick={cancelTournament}
                className="px-6 py-4 bg-red-950/20 hover:bg-red-950/40 text-red-400 font-bold text-xs uppercase tracking-wider rounded-2xl border border-red-900/20 transition-all"
              >
                Cancelar Torneo
              </button>
              
              <button 
                onClick={handleNextRound}
                className="flex-grow py-4 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-2xl shadow-xl shadow-sky-900/40 transition-all active:scale-95 flex items-center justify-center gap-3"
              >
                {currentRoundNumber >= totalRounds ? 'Finalizar Rondas' : 'Siguiente Ronda'}
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* STANDINGS PANEL (2/5) */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-900/50 px-6 py-4 rounded-2xl border border-white/5 flex items-center gap-3">
              <Users className="w-5 h-5 text-sky-400" />
              <h3 className="text-lg font-black text-white uppercase tracking-wider">Posiciones en Vivo</h3>
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
          
          <div className="glass-premium p-10 rounded-[2.5rem] border border-sky-500/20 shadow-2xl relative overflow-hidden text-center space-y-6">
            <div className="absolute inset-0 bg-gradient-to-b from-sky-500/5 to-transparent"></div>
            
            <div className="w-24 h-24 bg-sky-500/10 text-sky-400 rounded-full flex items-center justify-center border border-sky-500/20 mx-auto shadow-2xl animate-bounce">
              <Trophy className="w-12 h-12" />
            </div>

            <div className="space-y-2 relative z-10">
              <h3 className="text-4xl font-black text-white uppercase tracking-tighter">¡Torneo Finalizado!</h3>
              <p className="text-slate-400 text-sm max-w-lg mx-auto">
                Revisa los standings finales de {isCommander ? 'Commander' : '1v1'} y publica para actualizar los rankings de la temporada.
              </p>
            </div>

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
                          <span className="text-slate-400 font-mono">Pod {i + 1}</span>
                          <span className="text-sky-400 font-black font-mono">
                            {p.outcome === 'draw' ? 'Empate' : p.outcome ? `Ganador: ${p.outcome}` : 'Sin definir'}
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
                  localStorage.removeItem(LOCAL_STORAGE_KEY);
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

      {/* -------------------------------------------------------------
          MODO TV (PANTALLA COMPLETA MODAL)
         ------------------------------------------------------------- */}
      {isTvModeOpen && (
        <div className="fixed inset-0 bg-slate-950 z-[999] flex flex-col p-10 animate-in fade-in duration-300">
          
          {/* TV HEADER */}
          <div className="flex justify-between items-center border-b border-white/10 pb-6 mb-8">
            <div>
              <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Pantalla Pública de Jueces</span>
              <h1 className="text-4xl font-black text-white uppercase tracking-tighter">{tournamentName}</h1>
            </div>
            
            {/* Massive countdown timer */}
            <div className="flex items-center gap-4 bg-slate-900 px-8 py-4 rounded-3xl border border-white/10">
              <Timer className={`w-8 h-8 ${isTimerRunning ? 'text-emerald-400 animate-pulse' : 'text-slate-400'}`} />
              <span className="text-5xl font-black text-white font-mono tracking-tighter">{formatTimer(roundTimer)}</span>
            </div>

            <button 
              onClick={() => setIsTvModeOpen(false)}
              className="px-6 py-3 bg-red-950/40 text-red-400 font-black text-xs uppercase tracking-wider rounded-2xl border border-red-900/30 hover:bg-red-900/50"
            >
              Salir Modo TV
            </button>
          </div>

          {/* TV CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-10 flex-grow overflow-hidden">
            
            {/* Mesas list (3/5) */}
            <div className="lg:col-span-3 space-y-4 overflow-y-auto pr-2 custom-scrollbar">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2">Emparejamientos - Ronda {currentRoundNumber}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {currentPairings.map((p, i) => (
                  <div key={p.id} className="p-6 bg-slate-900/80 border border-white/10 rounded-3xl space-y-3 relative">
                    <span className="absolute top-4 right-4 text-[9px] font-black font-mono text-slate-500 bg-slate-950 px-2 py-0.5 rounded border border-white/5">
                      MESA {i + 1}
                    </span>
                    
                    <div className="space-y-1.5 pt-2">
                      {p.players.map(player => {
                        const isWinner = p.outcome === player.name;
                        return (
                          <div key={player.name} className="flex justify-between items-center">
                            <span className={`font-black text-sm truncate ${isWinner ? 'text-sky-400' : 'text-slate-300'}`}>
                              {player.name}
                            </span>
                            {isWinner && <Check className="w-3.5 h-3.5 text-sky-400 flex-shrink-0" />}
                          </div>
                        );
                      })}
                      {p.players.length === 1 && (
                        <span className="text-xs text-amber-400 font-bold uppercase tracking-widest block text-center">BYE</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Standings list (2/5) */}
            <div className="lg:col-span-2 flex flex-col h-full overflow-hidden">
              <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest border-b border-white/5 pb-2 mb-4">Clasificación en Vivo</h3>
              <div className="bg-slate-900 border border-white/10 rounded-3xl overflow-hidden flex-grow flex flex-col">
                <div className="overflow-y-auto flex-grow pr-1 custom-scrollbar">
                  <table className="min-w-full text-left">
                    <thead className="bg-slate-950 border-b border-white/5">
                      <tr>
                        <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center w-12">#</th>
                        <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest">Jugador</th>
                        <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center w-16">Pts</th>
                        <th className="px-4 py-3 text-[9px] font-black text-slate-500 uppercase tracking-widest text-center w-16">Récord</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {currentLiveStandings.map((player, index) => (
                        <tr key={player.name} className="hover:bg-white/5">
                          <td className="px-4 py-3.5 text-center">
                            <span className="text-xs font-black font-mono text-slate-400">{index + 1}</span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="font-bold text-white text-xs block truncate">{player.name}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="text-sm font-black text-sky-400">{player.points}</span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="text-xs font-bold font-mono text-slate-400">{player.record}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}

    </div>
  );
};
