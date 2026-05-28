import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { toast } from 'sonner';
import { Trophy, CheckCircle, XCircle, AlertTriangle, Shield, User, Loader2, ArrowRight } from 'lucide-react';

export default function TournamentJoinPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const tournamentId = searchParams.get('id');

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const [tournament, setTournament] = useState<any>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registrationId, setRegistrationId] = useState<string | null>(null);

  // Deck validation state (for Commander)
  const [commanderName, setCommanderName] = useState('');
  const [partnerName, setPartnerName] = useState('');
  const [decklistText, setDecklistText] = useState('');
  const [isValidatingDeck, setIsValidatingDeck] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);
  const [validationSuccess, setValidationSuccess] = useState(false);

  useEffect(() => {
    const initPage = async () => {
      if (!tournamentId) {
        setLoading(false);
        return;
      }

      try {
        // 1. Check authentication
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setIsLoggedIn(true);
          
          // Get user profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();
            
          setCurrentUser(profile || session.user);
        }

        // 2. Fetch Tournament Details
        const { data: tourney, error: tourneyError } = await supabase
          .from('tournaments')
          .select('*')
          .eq('id', tournamentId)
          .single();

        if (tourneyError) throw tourneyError;
        setTournament(tourney);

        // 3. If logged in, check if already registered in live_tournament_registrations
        if (session?.user) {
          const { data: reg, error: regError } = await supabase
            .from('live_tournament_registrations')
            .select('*')
            .eq('tournament_id', tournamentId)
            .eq('player_id', session.user.id)
            .maybeSingle();

          if (reg) {
            setIsRegistered(true);
            setRegistrationId(reg.id);
          }
        }

      } catch (e: any) {
        console.error("Error loading tournament details:", e);
        toast.error("Error al cargar detalles del torneo: " + e.message);
      } finally {
        setLoading(false);
      }
    };

    initPage();
  }, [tournamentId]);

  // Scryfall Color Identity Validation
  const validateDeck = async () => {
    if (!commanderName.trim()) {
      setValidationError('Por favor ingresa el nombre de tu Comandante.');
      return;
    }

    setIsValidatingDeck(true);
    setValidationError(null);
    setValidationSuccess(false);

    try {
      // 1. Fetch Commander Color Identity
      const fetchCardInfo = async (name: string) => {
        const response = await fetch(`https://api.scryfall.com/cards/named?exact=${encodeURIComponent(name)}`);
        if (!response.ok) {
          throw new Error(`No se encontró la carta "${name}" en Scryfall.`);
        }
        return await response.json();
      };

      const commanderCard = await fetchCardInfo(commanderName);
      let commanderColors: string[] = commanderCard.color_identity || [];

      // Handle Partner if specified
      if (partnerName.trim()) {
        const partnerCard = await fetchCardInfo(partnerName);
        commanderColors = Array.from(new Set([...commanderColors, ...(partnerCard.color_identity || [])]));
      }

      // 2. Parse decklist cards
      const cardLines = decklistText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
      const cardNames: string[] = [];

      cardLines.forEach(line => {
        // Match numbers at start e.g. "1 Sol Ring" or "Sol Ring"
        const match = line.match(/^(?:\d+x?\s+)?(.+)$/i);
        if (match) {
          cardNames.push(match[1].trim());
        }
      });

      if (cardNames.length === 0) {
        setValidationError('Por favor ingresa tu lista de cartas.');
        setIsValidatingDeck(false);
        return;
      }

      // 3. Batch fetch other cards from Scryfall (max 75 per batch)
      const batches: string[][] = [];
      for (let i = 0; i < cardNames.length; i += 75) {
        batches.push(cardNames.slice(i, i + 75));
      }

      const invalidCards: { name: string; colors: string[] }[] = [];

      for (const batch of batches) {
        const scryfallIdentifiers = batch.map(name => ({ name }));
        const response = await fetch('https://api.scryfall.com/cards/collection', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ identifiers: scryfallIdentifiers })
        });

        if (response.ok) {
          const result = await response.json();
          const cardsData = result.data || [];

          cardsData.forEach((card: any) => {
            const cardColors: string[] = card.color_identity || [];
            
            // Check if cardColors is subset of commanderColors
            const isInvalid = cardColors.some(color => !commanderColors.includes(color));
            if (isInvalid) {
              invalidCards.push({
                name: card.name,
                colors: cardColors
              });
            }
          });
        }
      }

      if (invalidCards.length > 0) {
        const listStr = invalidCards.map(c => `• ${c.name} (colores: ${c.colors.join(', ') || 'incoloro'})`).join('\n');
        setValidationError(`Las siguientes cartas violan la identidad de color de tu Comandante (${commanderColors.join(', ') || 'Incoloro'}):\n${listStr}`);
      } else {
        setValidationSuccess(true);
        toast.success("¡Mazo validado con éxito!");
      }

    } catch (e: any) {
      console.error(e);
      setValidationError("Error de validación: " + e.message);
    } finally {
      setIsValidatingDeck(false);
    }
  };

  const handleRegister = async () => {
    if (!isLoggedIn) {
      // Redirect to login with current path
      const redirectTo = encodeURIComponent(`/torneos/inscribir?id=${tournamentId}`);
      navigate(`/login?redirectTo=${redirectTo}`);
      return;
    }

    setSubmitting(true);

    try {
      const playerName = currentUser.username || `${currentUser.first_name || ''} ${currentUser.last_name || ''}`.trim() || 'Jugador';

      const { data, error } = await supabase
        .from('live_tournament_registrations')
        .insert({
          tournament_id: tournamentId,
          player_id: currentUser.id
        })
        .select()
        .single();

      if (error) throw error;

      setIsRegistered(true);
      setRegistrationId(data.id);
      toast.success("¡Te has inscrito con éxito en el torneo!");

    } catch (e: any) {
      console.error(e);
      toast.error("Error al inscribirse: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUnregister = async () => {
    if (!registrationId) return;

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from('live_tournament_registrations')
        .delete()
        .eq('id', registrationId);

      if (error) throw error;

      setIsRegistered(false);
      setRegistrationId(null);
      setValidationSuccess(false);
      toast.success("Inscripción cancelada.");

    } catch (e: any) {
      console.error(e);
      toast.error("Error al cancelar la inscripción: " + e.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-slate-400">
        <Loader2 className="w-12 h-12 stroke-sky-500 animate-spin mb-4" />
        <p className="font-bold uppercase tracking-wider animate-pulse">Cargando detalles del torneo...</p>
      </div>
    );
  }

  if (!tournamentId || !tournament) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 text-red-400 border border-red-500/20 rounded-full flex items-center justify-center mx-auto">
          <XCircle className="w-10 h-10" />
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-tighter">Torneo Inválido</h2>
        <p className="text-slate-400 text-sm leading-relaxed">El enlace de inscripción que has escaneado es incorrecto o el torneo ha sido cancelado por el organizador.</p>
        <Link to="/home" className="inline-block py-3 px-6 bg-slate-800 text-white font-bold rounded-xl border border-white/5">
          Ir a Inicio
        </Link>
      </div>
    );
  }

  const isCommander = tournament.format?.toLowerCase() === 'commander';

  return (
    <div className="max-w-xl mx-auto py-10 px-4">
      <div className="glass-premium p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden space-y-8">
        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-[50px] rounded-full"></div>
        
        {/* EVENT DETAILS */}
        <div className="space-y-3 text-center border-b border-white/5 pb-6">
          <Trophy className="w-12 h-12 text-sky-400 mx-auto" />
          <span className="px-3 py-1 bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[9px] font-black uppercase rounded-full tracking-wider inline-block">
            Inscripción en Vivo
          </span>
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{tournament.name}</h2>
          <p className="text-slate-400 text-sm font-semibold">Organiza: <span className="text-white">{tournament.storeName || tournament.store_name}</span></p>
          <div className="flex justify-center gap-4 text-xs font-mono text-slate-500">
            <span>Fecha: {tournament.date}</span>
            <span>|</span>
            <span className="font-bold text-sky-400 uppercase">{tournament.format}</span>
          </div>
        </div>

        {/* REGISTRATION ACTION CARD */}
        {!isLoggedIn ? (
          <div className="bg-slate-900/50 p-6 rounded-2xl border border-white/5 text-center space-y-4">
            <User className="w-10 h-10 text-slate-500 mx-auto" />
            <p className="text-slate-300 text-sm font-medium leading-relaxed">
              Debes tener una cuenta en **ThePlayer.gg** e iniciar sesión para inscribirte en el torneo y acumular puntos.
            </p>
            <button
              onClick={() => {
                const redirect = encodeURIComponent(`/torneos/inscribir?id=${tournamentId}`);
                navigate(`/login?redirectTo=${redirect}`);
              }}
              className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-lg shadow-sky-900/20 active:scale-95 flex items-center justify-center gap-2"
            >
              Iniciar Sesión / Registrarse
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* COMMANDER DECK VALIDATOR */}
            {isCommander && !isRegistered && (
              <div className="bg-slate-900/40 p-6 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center gap-2 text-sky-400">
                  <Shield className="w-5 h-5" />
                  <h4 className="font-black text-xs uppercase tracking-wider text-white">Validación de Identidad de Color</h4>
                </div>
                <p className="text-[11px] text-slate-400 font-medium">Valida tu mazo con Scryfall antes de inscribirte (opcional en eventos casuales, obligatorio en competitivos).</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Comandante Principal</label>
                    <input 
                      type="text" 
                      value={commanderName}
                      onChange={e => setCommanderName(e.target.value)}
                      placeholder="Ej: Urza, Lord High Artificer"
                      className="w-full px-3 py-2 bg-slate-950 border border-white/5 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                  <div>
                    <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Partner / Co-Comandante</label>
                    <input 
                      type="text" 
                      value={partnerName}
                      onChange={e => setPartnerName(e.target.value)}
                      placeholder="Opcional..."
                      className="w-full px-3 py-2 bg-slate-950 border border-white/5 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-1 focus:ring-sky-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1.5">Lista de Mazo (Una carta por línea)</label>
                  <textarea 
                    value={decklistText}
                    onChange={e => setDecklistText(e.target.value)}
                    placeholder="Ej:&#10;1 Sol Ring&#10;1 Counterspell&#10;1 Rhystic Study"
                    className="w-full h-32 px-3 py-2 bg-slate-950 border border-white/5 rounded-xl text-xs font-mono text-white focus:outline-none focus:ring-1 focus:ring-sky-500 resize-none"
                  />
                </div>

                {validationError && (
                  <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-[10px] text-red-400 font-bold font-mono whitespace-pre-line leading-relaxed">{validationError}</p>
                  </div>
                )}

                {validationSuccess && (
                  <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                    <p className="text-[10px] text-emerald-400 font-black uppercase tracking-wider flex items-center justify-center gap-2">
                      <CheckCircle className="w-4 h-4" /> Mazo validado con éxito
                    </p>
                  </div>
                )}

                <button
                  onClick={validateDeck}
                  disabled={isValidatingDeck || !commanderName.trim() || !decklistText.trim()}
                  className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-[10px] uppercase tracking-wider rounded-xl transition-all disabled:opacity-50"
                >
                  {isValidatingDeck ? 'Validando con Scryfall...' : 'Validar Mazo'}
                </button>
              </div>
            )}

            {/* CONFIRMATION CARD */}
            {isRegistered ? (
              <div className="bg-emerald-500/5 p-6 rounded-2xl border border-emerald-500/20 text-center space-y-4">
                <CheckCircle className="w-12 h-12 text-emerald-400 mx-auto" />
                <div>
                  <h4 className="font-black text-white uppercase text-base">¡Inscripción Confirmada!</h4>
                  <p className="text-slate-400 text-xs mt-2">
                    Ya apareces en la lista del organizador ({currentUser.username || currentUser.name}). Por favor, espera a que comience la ronda 1.
                  </p>
                </div>
                <button
                  onClick={handleUnregister}
                  disabled={submitting}
                  className="w-full py-3 bg-red-950/20 hover:bg-red-950/40 text-red-400 font-black text-[10px] uppercase tracking-wider rounded-xl border border-red-900/20 transition-all"
                >
                  {submitting ? 'Cancelando...' : 'Cancelar Inscripción'}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {isCommander && !validationSuccess && (
                  <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                    <p className="text-[10px] text-amber-200/80 font-medium leading-relaxed">
                      El torneo es de formato **Commander**. Recomendamos validar la identidad de color de tu mazo para evitar descalificaciones, pero si es un evento casual puedes saltarte este paso haciendo clic abajo.
                    </p>
                  </div>
                )}
                
                <button
                  onClick={handleRegister}
                  disabled={submitting}
                  className="w-full py-4 bg-sky-600 hover:bg-sky-500 text-white font-black text-xs uppercase tracking-[0.2em] rounded-xl transition-all shadow-xl shadow-sky-900/20 active:scale-95 flex items-center justify-center gap-2"
                >
                  {submitting ? 'Inscribiendo...' : 'Inscribirse en el Torneo'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
