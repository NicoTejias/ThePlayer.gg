import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { RankingEntry, CommunityEvent, MediaArticle, PlayerProfile } from '../types';
import SimpleCard from '../components/SimpleCard';
import TrophyIcon from '../components/icons/TrophyIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import UsersIcon from '../components/icons/UserIcon';
import { supabase } from '../supabaseClient';
import { useGame } from '../context/GameContext';
import VisitorWidget from '../components/widgets/VisitorWidget';
import PlayerWidget from '../components/widgets/PlayerWidget';
import StoreWidget from '../components/widgets/StoreWidget';
import ProBadge from '../components/ProBadge';
import ContentCreatorBadge from '../components/ContentCreatorBadge';
import SEO from '../components/SEO';

import AdminWidget from '../components/widgets/AdminWidget';
import QuickRegistrationModal from '../components/QuickRegistrationModal';
import GalaNominationsBanner from '../components/GalaNominationsBanner';
import AliasReminderBanner from '../components/AliasReminderBanner';
import TierBadge from '../components/TierBadge';



const sliderItems = [
  { id: 5, title: 'Player Latam Series', link: '/pls', imageUrl: 'https://images.unsplash.com/photo-1550745165-9bc0b252726f?auto=format&fit=crop&q=80&w=800', color: 'from-amber-600/80', description: 'Suma puntos solo por jugar tus torneos, escala en el ranking oficial de The Player y viaja jugando tus juegos favoritos' },
  { id: 1, title: 'Últimas Noticias', link: '/media', imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800', color: 'from-blue-600/80' },
  { id: 2, title: 'Videos', link: '/media/videos', imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800', color: 'from-red-600/80' },
  { id: 3, title: 'Artículos', link: '/media/articulos', imageUrl: 'https://images.unsplash.com/photo-1585241936939-be05368a5bcb?auto=format&fit=crop&q=80&w=800', color: 'from-green-600/80' },
  { id: 4, title: 'MERCADO TCG', link: '/mercado', imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=800', color: 'from-purple-600/80' },
  { id: 6, title: 'Salón de la Fama', link: '/hall-of-fame', imageUrl: 'https://images.unsplash.com/photo-1549443105-325b9d3118a6?auto=format&fit=crop&q=80&w=800', color: 'from-yellow-600/80', description: 'Conoce a las leyendas de temporadas pasadas y sus récords históricos.' },
];

const SectionHeader: React.FC<{ title: string; linkTo: string }> = ({ title, linkTo }) => (
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-3xl font-bold text-white uppercase tracking-wider">{title}</h2>
    <Link to={linkTo} className="text-sky-400 hover:text-sky-300 transition-colors">
      Ver más →
    </Link>
  </div>
);

interface HomePageProps {
  players: PlayerProfile[];
  events: CommunityEvent[];
  session?: any;
  userRole?: 'player' | 'store' | 'admin' | null;
  userId?: string;
  showAliasReminder?: boolean;
}

const CountUp: React.FC<{ end: number; duration?: number }> = ({ end, duration = 2000 }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let start: number | null = null;
    const animate = (now: number) => {
      if (!start) start = now;
      const progress = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4);
      setCount(Math.floor(ease * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);
  return <span>{count.toLocaleString()}</span>;
};

const HomePage: React.FC<HomePageProps> = ({ players, events, session, userRole, userId, showAliasReminder = false }) => {
  const { currentGame } = useGame();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [latestNews, setLatestNews] = useState<MediaArticle[]>([]);
  const [featuredContent, setFeaturedContent] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalPlayers: 0, registeredStores: 0, activeTournaments: 0, totalMatches: 0 });
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<Set<string>>(new Set());
  const [showRegModal, setShowRegModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);

  const calculateReadingTime = (content: string): number => {
    if (!content) return 1;
    const words = content.trim().split(/\s+/).length;
    return Math.max(1, Math.ceil(words / 200));
  };

  // Fetch stats, news, videos
  useEffect(() => {
    let isMounted = true;

    // Safety timeout to avoid getting stuck forever
    const loadingTimeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 10000);

    const fetchStats = async () => {
      try {
        // Run all independent queries in parallel for better performance
        const [
          storesData,
          playersData,
          tournamentsData,
          resultsData,
          articlesData,
          videosData
        ] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'store'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'player'),
          supabase.from('tournaments').select('*', { count: 'exact', head: true }).eq('game_type', currentGame),
          // Simplified total match count to avoid slow joins on home page
          supabase.from('tournament_results').select('id', { count: 'exact', head: true }),
          supabase.from('articles').select('*').eq('is_published', true).order('published_at', { ascending: false }).limit(3),
          supabase.from('videos').select('*').order('created_at', { ascending: false }).limit(3)
        ]);

        if (!isMounted) return;

        if (articlesData.data) setLatestNews(articlesData.data);

        if (videosData.data) {
          setFeaturedContent(videosData.data.map(v => ({
            id: v.id,
            title: v.title,
            link: `https://www.youtube.com/watch?v=${v.youtube_id}`,
            imageUrl: `https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`,
            description: v.description,
            is_premium: v.is_premium
          })));
        }

        setStats({
          registeredStores: storesData.count || 0,
          totalPlayers: playersData.count || 0,
          activeTournaments: tournamentsData.count || 0,
          totalMatches: resultsData.count || 0,
        });
      } catch (e) {
        console.error('Error fetching stats:', e);
      } finally {
        if (isMounted) {
          setLoading(false);
          clearTimeout(loadingTimeout);
        }
      }
    };

    fetchStats();

    // Removed the aggressive profiles channel subscription that was causing excessive re-fetching

    return () => {
      isMounted = false;
      clearTimeout(loadingTimeout);
    };
  }, [currentGame]);

  // Fetch user registrations
  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!userId) return;
      const { data } = await supabase.from('event_registrations').select('event_id').eq('player_id', userId);
      if (data) setRegistrations(new Set(data.map((r: any) => r.event_id)));
    };
    fetchRegistrations();
  }, [userId]);

  // Auto slide
  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(prev => (prev + 1) % sliderItems.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const topPointsPlayers = [...players]
    .sort((a, b) => (b.points || 0) - (a.points || 0))
    .slice(0, 10)
    .map((p, i) => ({
      id: p.id,
      rank: i + 1,
      playerName: p.name || `Jugador #${Math.abs(p.id.split('').reduce((acc, c) => c.charCodeAt(0) + ((acc << 5) - acc), 0) % 9000 + 1000)}`,
      points: p.points || 0,
      region: p.region || 'Unknown',
      team: p.team || '-',
      is_pro: p.is_pro || false,
      is_content_creator: p.is_content_creator || false,
    }));



  // Filtrar eventos pasados y mostrar solo los próximos (incluyendo hoy)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = (events || [])
    .filter(event => {
      // Robust date parsing (YYYY-MM-DD)
      const parts = event.date.split('-');
      if (parts.length !== 3) return false;
      const eventDate = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      return eventDate >= today;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const displayEvents = upcomingEvents.slice(0, 4);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 animate-fade-in">
      <SEO
        title="Inicio"
        description="ThePlayer.gg es la plataforma líder para el ecosistema TCG en Chile. Rankings, torneos y comunidad en un solo lugar."
      />
      {/* Hero Carousel */}
      <section className="relative h-[300px] sm:h-[350px] md:h-[400px] overflow-hidden group">
        {sliderItems.map((item, idx) => (
          <Link
            key={item.id}
            to={item.link}
            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${idx === currentSlide ? 'opacity-100 scale-100' : 'opacity-0 scale-105 pointer-events-none'}`}
            style={{ backgroundImage: `url('${item.imageUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${item.color} to-transparent opacity-90`} />
            <div className="relative z-10 flex flex-col items-center justify-center h-full text-center px-4">
              <h2 className="text-4xl sm:text-6xl font-black text-white uppercase tracking-wider drop-shadow-2xl mb-2 translate-y-0 opacity-100 transition-all duration-700 delay-100 animate-fade-in-up">
                {item.title}
              </h2>
              {item.description && (
                <p className="text-lg sm:text-xl text-white/90 font-medium max-w-2xl drop-shadow-lg animate-fade-in-up delay-200">
                  {item.description}
                </p>
              )}
            </div>
          </Link>
        ))}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
          {sliderItems.map((_, idx) => (
            <button
              key={idx}
              title={`Slide ${idx + 1}`}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${idx === currentSlide ? 'bg-white w-8 shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'bg-white/30 hover:bg-white/50'}`}
            />
          ))}
        </div>
      </section>

      {/* Role-Based Widgets */}
      {!session && <VisitorWidget />}
      {session && userRole === 'player' && userId && <PlayerWidget userId={userId} />}
      {session && userRole === 'store' && userId && <StoreWidget storeId={userId} />}
      {session && userRole === 'admin' && <AdminWidget />}

      {/* Community Stats */}
      <section className="mt-8 mb-8 relative px-4">
        {/* Magic Pulse Ticker */}
        <div className="container mx-auto mb-8">
          <div className="bg-slate-900/80 border-y border-slate-800 py-2 overflow-hidden whitespace-nowrap relative group">
            <div className="flex animate-ticker gap-12 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> MTG: 24 Torneos programados</span>
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span> Marketplace: +500 nuevas cartas hoy</span>
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse"></span> Ranking: Top 100 MTG actualizado</span>
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span> Eventos: Registro abierto para el próximo RCQ</span>
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> MTG: 24 Torneos programados</span>
              <span className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-sky-500 animate-pulse"></span> Marketplace: +500 nuevas cartas hoy</span>
            </div>
          </div>
        </div>

        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/5 via-purple-900/5 to-pink-900/5 blur-3xl" />
        <div className="container mx-auto relative z-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {/* Players */}
            <div className="bg-slate-800/20 backdrop-blur-md p-8 rounded-3xl border border-white/5 flex flex-col items-center hover:border-blue-500/50 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-4 bg-blue-500/10 rounded-2xl mb-4 text-blue-400 group-hover:scale-110 transition-transform">
                <UsersIcon className="w-8 h-8" />
              </div>
              <div className="text-5xl font-black text-white mb-2 tabular-nums tracking-tighter"><CountUp end={stats.totalPlayers} /></div>
              <div className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">Jugadores</div>
            </div>
            {/* Stores */}
            <div className="bg-slate-800/20 backdrop-blur-md p-8 rounded-3xl border border-white/5 flex flex-col items-center hover:border-yellow-500/50 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-yellow-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-4 bg-yellow-500/10 rounded-2xl mb-4 text-yellow-400 group-hover:scale-110 transition-transform">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
              </div>
              <div className="text-5xl font-black text-white mb-2 tabular-nums tracking-tighter"><CountUp end={stats.registeredStores} /></div>
              <div className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">Tiendas</div>
            </div>
            {/* Tournaments */}
            <div className="bg-slate-800/20 backdrop-blur-md p-8 rounded-3xl border border-white/5 flex flex-col items-center hover:border-purple-500/50 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-4 bg-purple-500/10 rounded-2xl mb-4 text-purple-400 group-hover:scale-110 transition-transform">
                <TrophyIcon className="w-8 h-8" />
              </div>
              <div className="text-5xl font-black text-white mb-2 tabular-nums tracking-tighter"><CountUp end={stats.activeTournaments} /></div>
              <div className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">Torneos</div>
            </div>
            {/* Matches */}
            <div className="bg-slate-800/20 backdrop-blur-md p-8 rounded-3xl border border-white/5 flex flex-col items-center hover:border-emerald-500/50 transition-all duration-500 group relative overflow-hidden">
              <div className="absolute inset-0 bg-emerald-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="p-4 bg-emerald-500/10 rounded-2xl mb-4 text-emerald-400 group-hover:scale-110 transition-transform">
                <SparklesIcon className="w-8 h-8" />
              </div>
              <div className="text-5xl font-black text-white mb-2 tabular-nums tracking-tighter"><CountUp end={stats.totalMatches} /></div>
              <div className="text-[10px] text-slate-500 uppercase tracking-[0.3em] font-black">Partidas</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 space-y-16">
        {/* Alias Reminder for Players */}
        <AliasReminderBanner show={showAliasReminder} />

        {/* Gala Banner */}
        <GalaNominationsBanner />

        {/* Próximos Eventos */}
        <section>
          <SectionHeader title="Próximos Eventos" linkTo="/eventos" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayEvents.length > 0 ? (
              displayEvents.map(event => (
                <SimpleCard key={event.id} className="group relative overflow-hidden bg-slate-800/50 hover:bg-slate-800/70 transition-all border border-slate-700 h-full">
                  {/* Hover Overlay with Details */}
                  <div className="absolute inset-0 bg-slate-900/95 p-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-center items-center text-center z-20">
                    <h4 className="font-bold text-white mb-2">{event.title}</h4>
                    <p className="text-sm text-slate-300 mb-1"><span className="text-slate-500">Formato:</span> {event.format}</p>
                    <p className="text-sm text-slate-300 mb-1"><span className="text-slate-500">Tienda:</span> {event.storeName}</p>
                    <p className="text-sm text-slate-300 mb-2"><span className="text-slate-500">Cupos:</span> {event.playerCount || 0} / {event.maxPlayers || 64}</p>
                    {event.description && <p className="text-xs text-slate-400 line-clamp-3 italic">"{event.description}"</p>}
                    <Link to="/eventos" className="mt-3 text-xs text-blue-400 hover:text-blue-300 font-bold underline">Ver Calendario Completo</Link>
                  </div>

                  <div className="p-4 relative z-10 flex flex-col h-full">
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="flex flex-col flex-1 min-w-0">
                        <h3 className="text-xl font-bold text-white line-clamp-1 group-hover:text-blue-400 transition-colors leading-tight" title={event.title}>{event.title}</h3>
                        <p className="text-sm text-slate-400 truncate mt-1">📍 {event.storeName}</p>
                      </div>
                      <div className="flex flex-col items-end flex-shrink-0">
                        <span className={`text-[10px] font-black px-2 py-1 rounded shadow-sm border border-white/10 uppercase tracking-tighter ${event.format.toLowerCase() === 'commander' ? 'bg-purple-600 text-white' :
                          event.format.toLowerCase().includes('rcq') ? 'bg-red-600 text-white' :
                            'bg-blue-600 text-white'
                          }`}>
                          {event.format}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3 mb-5">
                      <div className="flex items-center gap-3 text-sm text-slate-300 bg-slate-900/40 p-2 rounded-lg border border-slate-700/50">
                        <span className="flex items-center gap-1.5 font-bold whitespace-nowrap"><span className="text-slate-500">📅</span> {event.date}</span>
                        <div className="w-px h-3 bg-slate-700"></div>
                        <span className="flex items-center gap-1.5 font-bold whitespace-nowrap"><span className="text-slate-500">⏰</span> {event.time ? event.time.substring(0, 5) : '19:00'}</span>
                      </div>

                      <div className="grid grid-cols-2 gap-2">
                        <div className="bg-slate-900/30 p-2 rounded-lg border border-slate-700/30 flex flex-col justify-center">
                          <span className="text-[9px] uppercase font-black text-slate-500 tracking-tighter mb-0.5">Inscripción</span>
                          <span className="text-base text-yellow-500 font-black leading-none">{event.entryFee ? (event.entryFee.includes('$') ? event.entryFee : `$${event.entryFee}`) : 'Gratis'}</span>
                        </div>

                        <div className="bg-slate-900/30 p-2 rounded-lg border border-slate-700/30 flex flex-col items-end justify-center relative group/logo">
                          <div className="flex flex-col items-end">
                            <span className="text-[9px] uppercase font-black text-slate-500 tracking-tighter mb-1">Cupos</span>
                            <span className={`text-base font-black leading-none ${(event.playerCount || 0) >= (event.maxPlayers || 32) ? 'text-red-400' : 'text-green-400'}`}>
                              {event.playerCount || 0} / {event.maxPlayers || 64}
                            </span>
                          </div>

                          {/* Store Logo positioned above Cupos */}
                          <div className="absolute -top-11 right-0 w-11 h-11 rounded-full overflow-hidden border-2 border-slate-700 bg-slate-800 shadow-xl transform group-hover/logo:scale-110 transition-transform duration-300">
                            {event.imageUrl ? (
                              <img src={event.imageUrl} alt={event.storeName} className="w-full h-full object-cover" onError={(e) => (e.currentTarget.src = '🏪')} />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xl">🏪</div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="mt-auto pt-3 border-t border-slate-700/50">
                      {userId && !event.isUserRegistered && (
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); setSelectedEvent(event); setShowRegModal(true); }}
                          className="w-full h-11 bg-green-600 hover:bg-green-500 text-white rounded-xl font-black transition-all shadow-lg shadow-green-900/40 active:scale-95 flex items-center justify-center gap-2 uppercase tracking-wider text-xs"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          Inscribirse Ahora
                        </button>
                      )}
                      {userId && event.isUserRegistered && (
                        <div className="w-full h-11 bg-green-900/30 text-green-400 rounded-xl font-black border border-green-500/30 flex items-center justify-center gap-2 uppercase text-xs">
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>
                          Confirmado
                        </div>
                      )}
                      {!userRole && (
                        <Link to="/login" className="w-full h-11 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-black flex items-center justify-center gap-2 transition-all uppercase text-xs">
                          Identificarse para Ir
                        </Link>
                      )}
                    </div>
                  </div>
                </SimpleCard>
              ))
            ) : (
              <p className="text-slate-400 col-span-full text-center py-8">No hay eventos próximos.</p>
            )}
          </div>
        </section>

        {/* Rankings - Moved to bottom and restricted to registered users */}
        {session && (
          <section className="pt-8 border-t border-slate-800">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Rankings Oficiales</h2>
              <TierBadge points={topPointsPlayers.find(p => p.id === userId)?.points || 0} size="lg" />
            </div>

            <div className="flex justify-center">
              <div className="w-full max-w-4xl">
                <div className="flex justify-between items-end mb-4">
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider font-mono">Top 10 Player Points <span className="text-sky-500 ml-2">#Temporada2026</span></h3>
                  <Link to="/ranking" className="text-sky-400 hover:text-sky-300 text-xs font-bold uppercase tracking-widest transition-colors flex items-center gap-1">
                    Ver Ranking Completo
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                  </Link>
                </div>

                <div className="bg-slate-800/50 rounded-2xl border border-slate-700/50 overflow-hidden shadow-2xl backdrop-blur-sm">
                  {topPointsPlayers.slice(0, 10).map(player => {
                    const isCurrent = session?.user?.id && player.id === session.user.id;
                    return (
                      <Link key={player.id} to="/ranking" className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-all border-b border-slate-700/30 last:border-0 ${isCurrent ? 'bg-blue-600/10 border-l-4 border-l-blue-500 relative' : ''}`}>
                        {isCurrent && <div className="absolute inset-0 bg-blue-500/5 animate-pulse pointer-events-none" />}

                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-900/50 border border-slate-700 text-sm font-black text-slate-400">
                          {player.rank}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className={`font-bold truncate ${isCurrent ? 'text-blue-300 text-lg' : 'text-white text-base'}`}>{player.playerName}</p>
                            {player.is_pro && <ProBadge size="small" />}
                            {player.is_content_creator && <ContentCreatorBadge size="small" />}
                          </div>
                          <div className="flex items-center gap-3">
                            <p className="text-[10px] text-slate-500 uppercase font-black tracking-widest">{player.team}</p>
                            <TierBadge points={player.points} size="sm" showIcon={false} />
                          </div>
                        </div>

                        <div className="text-right flex flex-col items-end">
                          <div className="flex items-center gap-1.5">
                            <span className={`text-xl font-black font-mono leading-none ${isCurrent ? 'text-blue-400' : 'text-slate-100'}`}>
                              {player.points.toLocaleString()}
                            </span>
                            <span className="text-[10px] text-sky-500 font-bold uppercase tracking-tighter">pts</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Ranking CTA for registered users who are not in top 10 */}
                {!topPointsPlayers.some(p => p.id === userId) && (
                  <div className="mt-6 p-6 bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl border border-slate-700 flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl">
                    <div className="flex items-center gap-4 text-center md:text-left">
                      <div className="w-12 h-12 bg-sky-500/10 rounded-full flex items-center justify-center text-2xl">📈</div>
                      <div>
                        <h4 className="font-bold text-white uppercase tracking-tight">¡Sube en el Ranking!</h4>
                        <p className="text-sm text-slate-400">Inscríbete en torneos oficiales y escala posiciones para ganar beneficios exclusivos.</p>
                      </div>
                    </div>
                    <Link to="/eventos" className="px-6 py-3 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl transition-all shadow-lg shadow-sky-900/40 uppercase tracking-widest text-xs whitespace-nowrap">
                      Buscar Torneos
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {!session && (
          <section className="pt-8 border-t border-slate-800 text-center py-12">
            <div className="max-w-xl mx-auto space-y-4">
              <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center text-3xl mx-auto border border-slate-700 mb-6 group-hover:scale-110 transition-transform">🔒</div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider italic">Rankings Exclusivos</h2>
              <p className="text-slate-400 text-lg">Inicia sesión o regístrate para ver tu posición en el ranking oficial y descubrir los niveles competitivos de nuestra comunidad.</p>
              <div className="pt-6">
                <Link to="/auth" className="px-8 py-4 bg-gradient-to-r from-sky-600 to-blue-600 text-white font-black rounded-full hover:from-sky-500 hover:to-blue-500 transition-all shadow-2xl shadow-sky-900/40 uppercase tracking-[0.15em]">
                  Unirse Ahora
                </Link>
              </div>
            </div>
          </section>
        )}

        {/* Últimas Novedades */}
        <section>
          <SectionHeader title="Últimas Novedades" linkTo="/media" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Artículos */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Artículos</h3>
              <div className="space-y-4">
                {latestNews.length > 0 ? (
                  latestNews.slice(0, 3).map(article => (
                    <Link key={article.id} to={`/media/articulos/${article.slug}`} className="group relative block bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1">
                      <div className="flex gap-4 p-4">
                        <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                          <img src={article.image_url || article.imageUrl || '/images/placeholder-article.jpg'} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-bold rounded-full">{article.category || 'Artículo'}</div>
                          {article.is_premium && (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500/90 backdrop-blur-sm text-black text-[10px] font-bold rounded-full flex items-center gap-1">👑 Premium</div>
                          )}
                          <div className="absolute bottom-2 right-2 px-2 py-1 bg-slate-900/90 backdrop-blur-sm text-white text-[10px] font-bold rounded-full border border-white/10 flex items-center gap-1">⏱️ {calculateReadingTime(article.content || article.excerpt || '')} min</div>
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col">
                          <h4 className="text-base font-bold text-white line-clamp-2 mb-2 group-hover:text-blue-400 transition-colors">{article.title}</h4>
                          <p className="text-sm text-slate-400 line-clamp-2 mb-3 flex-1">{article.excerpt || article.content?.substring(0, 120) + '...'}</p>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span>Por {article.author || 'ThePlayer'}</span>
                            <span>{new Date(article.created_at || Date.now()).toLocaleDateString('es-CL')}</span>
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))
                ) : (
                  <p className="text-slate-400">No hay noticias recientes.</p>
                )}
              </div>
            </div>
            {/* Videos */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Videos</h3>
              <div className="space-y-4">
                {featuredContent.length > 0 ? (
                  featuredContent.slice(0, 3).map(video => (
                    <a key={video.id} href={video.link} target="_blank" rel="noopener noreferrer" className="group relative block bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700 hover:border-purple-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-purple-500/20 hover:-translate-y-1">
                      <div className="flex gap-4 p-4">
                        <div className="relative w-40 h-28 flex-shrink-0 rounded-lg overflow-hidden">
                          <img src={video.imageUrl || '/images/placeholder-video.jpg'} alt={video.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute top-2 left-2 px-2 py-1 bg-purple-600/90 backdrop-blur-sm text-white text-[10px] font-bold rounded-full">Video</div>
                          {video.is_premium && (
                            <div className="absolute top-2 right-2 px-2 py-1 bg-yellow-500/90 backdrop-blur-sm text-black text-[10px] font-bold rounded-full flex items-center gap-1">👑 Premium</div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0 flex flex-col">
                          <h4 className="text-base font-bold text-white line-clamp-2 mb-2 group-hover:text-purple-400 transition-colors">{video.title}</h4>
                          <p className="text-sm text-slate-400 line-clamp-2 mb-3 flex-1">{video.description || 'Video destacado de la comunidad'}</p>
                          <div className="flex items-center justify-between text-xs text-slate-500">
                            <span className="flex items-center gap-1">YouTube</span>
                            <span>{new Date().toLocaleDateString('es-CL')}</span>
                          </div>
                        </div>
                      </div>
                    </a>
                  ))
                ) : (
                  <p className="text-slate-400">No hay videos destacados.</p>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Modals */}
      {selectedEvent && (
        <QuickRegistrationModal
          isOpen={showRegModal}
          onClose={() => { setShowRegModal(false); setSelectedEvent(null); }}
          event={selectedEvent}
          userId={userId || ''}
          onSuccess={() => setRegistrations(prev => new Set([...prev, selectedEvent.id]))}
        />
      )}
    </div>
  );
};

export default HomePage;
