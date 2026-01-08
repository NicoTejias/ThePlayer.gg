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

import AdminWidget from '../components/widgets/AdminWidget';
import QuickRegistrationModal from '../components/QuickRegistrationModal';

// Mock data (empty)
const mockArticles: MediaArticle[] = [];
const mockEventsData: Record<string, CommunityEvent[]> = {};

const sliderItems = [
  { id: 1, title: 'Últimas Noticias', link: '/media', imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800', color: 'from-blue-600/80' },
  { id: 2, title: 'Videos', link: '/media/videos', imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800', color: 'from-red-600/80' },
  { id: 3, title: 'Artículos', link: '/media/articulos', imageUrl: 'https://images.unsplash.com/photo-1585241936939-be05368a5bcb?auto=format&fit=crop&q=80&w=800', color: 'from-green-600/80' },
  { id: 4, title: 'MERCADO TCG', link: '/mercado', imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=800', color: 'from-purple-600/80' },
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

const HomePage: React.FC<HomePageProps> = ({ players, events, session, userRole, userId }) => {
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
    const fetchStats = async () => {
      try {
        const [storesData, playersData, tournamentsData, resultsData] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'store'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'player'),
          supabase.from('tournaments').select('*', { count: 'exact', head: true }).eq('game_type', currentGame),
          supabase.from('tournament_results').select('id, tournaments!inner(game_type)', { count: 'exact', head: true }).eq('tournaments.game_type', currentGame),
        ]);
        const { data: articlesData } = await supabase.from('articles').select('*').eq('is_published', true).order('published_at', { ascending: false }).limit(3);
        if (articlesData) setLatestNews(articlesData);
        const { data: videosData } = await supabase.from('videos').select('*').order('created_at', { ascending: false }).limit(3);
        if (videosData) {
          setFeaturedContent(videosData.map(v => ({
            id: v.id,
            title: v.title,
            link: `https://www.youtube.com/watch?v=${v.youtube_id}`,
            imageUrl: `https://img.youtube.com/vi/${v.youtube_id}/maxresdefault.jpg`,
            description: v.description,
          })));
        }
        setStats({
          registeredStores: storesData.count || 0,
          totalPlayers: playersData.count || 0,
          activeTournaments: tournamentsData.count || 0,
          totalMatches: resultsData.count || 0,
        });
        setLoading(false);
      } catch (e) {
        console.error('Error fetching stats', e);
        setLoading(false);
      }
    };
    fetchStats();
    const subscription = supabase.channel('public:profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStats).subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [currentGame]);

  // Fetch user registrations
  useEffect(() => {
    const fetchRegistrations = async () => {
      if (!userId) return;
      const { data } = await supabase.from('tournament_registrations').select('tournament_id').eq('player_id', userId);
      if (data) setRegistrations(new Set(data.map((r: any) => r.tournament_id)));
    };
    fetchRegistrations();
  }, [userId]);

  // Auto slide
  useEffect(() => {
    const timer = setInterval(() => setCurrentSlide(prev => (prev + 1) % sliderItems.length), 5000);
    return () => clearInterval(timer);
  }, []);

  const topPwpPlayers = [...players]
    .sort((a, b) => (b.pwp || 0) - (a.pwp || 0))
    .slice(0, 10)
    .map((p, i) => ({
      id: p.id,
      rank: i + 1,
      playerName: p.isPublic ? p.name : `Jugador #${Math.abs(p.id.split('').reduce((acc, c) => c.charCodeAt(0) + ((acc << 5) - acc), 0) % 9000 + 1000)}`,
      pwp: p.pwp || 0,
      region: p.region || 'Unknown',
      team: p.team || 'Sin Equipo',
      is_pro: p.is_pro || false,
      is_content_creator: p.is_content_creator || false,
    }));

  const topWinRatePlayers = [...players]
    .map(p => {
      const total = (p.matchesWon || 0) + (p.matchesLost || 0) + (p.matchesDrew || 0);
      const winRate = total > 0 ? ((p.matchesWon || 0) / total) * 100 : 0;
      return { ...p, winRate };
    })
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 10)
    .map((p, i) => ({
      id: p.id,
      rank: i + 1,
      playerName: p.isPublic ? p.name : `Jugador #${Math.abs(p.id.split('').reduce((acc, c) => c.charCodeAt(0) + ((acc << 5) - acc), 0) % 9000 + 1000)}`,
      winRate: `${p.winRate.toFixed(1)}%`,
      region: p.region || 'Unknown',
      team: p.team || 'Sin Equipo',
      is_pro: p.is_pro || false,
      is_content_creator: p.is_content_creator || false,
    }));

  // Filtrar eventos pasados y mostrar solo los próximos (incluyendo hoy)
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = (events || [])
    .filter(event => {
      // Asumimos que event.date viene en formato YYYY-MM-DD
      // Agregamos T00:00:00 para asegurar que se interprete como local time al inicio del día
      // o usamos una comparación de strings directa si el formato es consistente ISO
      const eventDate = new Date(`${event.date}T00:00:00`);
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
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-slate-200">
      {/* Hero Carousel */}
      <section className="relative h-[300px] sm:h-[350px] md:h-[400px] overflow-hidden">
        {sliderItems.map((item, idx) => (
          <Link
            key={item.id}
            to={item.link}
            className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `url('${item.imageUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${item.color} to-transparent opacity-95`} />
            <div className="relative z-10 flex items-center justify-center h-full">
              <h2 className="text-6xl font-black text-white uppercase tracking-wider drop-shadow-2xl">{item.title}</h2>
            </div>
          </Link>
        ))}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
          {sliderItems.map((_, idx) => (
            <button
              key={idx}
              title={`Slide ${idx + 1}`}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-8' : 'bg-white/50'}`}
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
      <section className="mt-24 mb-12 relative px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-purple-900/10 to-pink-900/10 blur-3xl" />
        <div className="container mx-auto relative z-10">
          <h2 className="text-3xl font-bold text-center text-white mb-8 uppercase tracking-wide">Comunidad en Números</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-8">
            {/* Players */}
            <div className="bg-slate-800/40 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 flex flex-col items-center hover:border-blue-500/50 hover:bg-slate-800/60 transition-all group hover:animate-float duration-300">
              <div className="p-3 bg-blue-500/10 rounded-full mb-4 group-hover:bg-blue-500/20 transition-colors text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <UsersIcon className="w-8 h-8" />
              </div>
              <div className="text-4xl font-bold text-white mb-1 tabular-nums tracking-tight"><CountUp end={stats.totalPlayers} /></div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Jugadores</div>
            </div>
            {/* Stores */}
            <div className="bg-slate-800/40 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 flex flex-col items-center hover:border-yellow-500/50 hover:bg-slate-800/60 transition-all group hover:-translate-y-1 duration-300">
              <div className="p-3 bg-yellow-500/10 rounded-full mb-4 group-hover:bg-yellow-500/20 transition-colors text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" /></svg>
              </div>
              <div className="text-4xl font-bold text-white mb-1 tabular-nums tracking-tight"><CountUp end={stats.registeredStores} /></div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Tiendas</div>
            </div>
            {/* Tournaments */}
            <div className="bg-slate-800/40 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 flex flex-col items-center hover:border-purple-500/50 hover:bg-slate-800/60 transition-all group hover:-translate-y-1 duration-300">
              <div className="p-3 bg-purple-500/10 rounded-full mb-4 group-hover:bg-purple-500/20 transition-colors text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <TrophyIcon className="w-8 h-8" />
              </div>
              <div className="text-4xl font-bold text-white mb-1 tabular-nums tracking-tight"><CountUp end={stats.activeTournaments} /></div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Torneos</div>
            </div>
            {/* Matches */}
            <div className="bg-slate-800/40 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 flex flex-col items-center hover:border-green-500/50 hover:bg-slate-800/60 transition-all group hover:-translate-y-1 duration-300">
              <div className="p-3 bg-green-500/10 rounded-full mb-4 group-hover:bg-green-500/20 transition-colors text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                <SparklesIcon className="w-8 h-8" />
              </div>
              <div className="text-4xl font-bold text-white mb-1 tabular-nums tracking-tight"><CountUp end={stats.totalMatches} /></div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Partidas</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-12 space-y-16">
        {/* Próximos Eventos */}
        <section>
          <SectionHeader title="Próximos Eventos" linkTo="/eventos" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayEvents.length > 0 ? (
              displayEvents.map(event => (
                <SimpleCard key={event.id} className="bg-slate-800/50 hover:bg-slate-800/70 transition-all border border-slate-700">
                  <div className="p-4">
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{event.title}</h3>
                    <p className="text-sm text-slate-400 mb-1">📍 {event.storeName}</p>
                    <p className="text-sm text-slate-400 mb-1">📅 {new Date(event.date).toLocaleDateString()}</p>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
                      <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">{event.format}</span>
                      <div className="flex items-center gap-2">
                        {userRole === 'player' && userId && !registrations.has(event.id) && (
                          <button
                            onClick={() => { setSelectedEvent(event); setShowRegModal(true); }}
                            className="text-xs bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded font-bold transition-colors min-h-[44px] flex items-center justify-center"
                          >Inscribirse</button>
                        )}
                        {userRole === 'player' && registrations.has(event.id) && (
                          <span className="text-xs text-green-400 font-bold flex items-center gap-1">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" /></svg>Inscrito</span>
                        )}
                        {!userRole && (
                          <span className="text-xs text-slate-500">{event.playerCount} jugadores</span>
                        )}
                      </div>
                    </div>
                  </div>
                </SimpleCard>
              ))
            ) : (
              <p className="text-slate-400 col-span-full text-center py-8">No hay eventos próximos.</p>
            )}
          </div>
        </section>

        {/* Rankings */}
        <section>
          <SectionHeader title="Rankings" linkTo="/ranking" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* PWP Ranking */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Top 10 Pts</h3>
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
                {topPwpPlayers.slice(0, 5).map(player => {
                  const isCurrent = session?.user?.id && player.id === session.user.id;
                  return (
                    <Link key={player.id} to="/ranking" className={`flex items-center gap-3 p-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-0 ${isCurrent ? 'bg-blue-500/10 border-l-4 border-l-blue-500' : ''}`}>
                      <span className={`text-lg font-black w-6 ${isCurrent ? 'text-blue-400' : 'text-slate-600'}`}>{player.rank}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold truncate text-sm">{player.playerName}</p>
                          {player.is_pro && <ProBadge size="small" />}
                          {player.is_content_creator && <ContentCreatorBadge size="small" />}
                          {isCurrent && <span className="px-2 py-0.5 bg-blue-500 text-white text-xs font-bold rounded-full">Tú</span>}
                        </div>
                        <p className="text-xs text-slate-500">{player.team}</p>
                      </div>
                      <div className="text-right">
                        <span className={`block font-bold font-mono text-sm ${isCurrent ? 'text-blue-400' : 'text-green-400'}`}>{player.pwp}</span>
                        <span className="text-[10px] text-slate-500 uppercase">Pts</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
            {/* Win Rate Ranking */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Top 10 Win Rate</h3>
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
                {topWinRatePlayers.slice(0, 5).map(player => {
                  const isCurrent = session?.user?.id && player.id === session.user.id;
                  return (
                    <Link key={player.id} to="/ranking" className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-0 ${isCurrent ? 'bg-purple-500/10 border-l-4 border-l-purple-500' : ''}`}>
                      <span className={`text-lg font-black w-6 ${isCurrent ? 'text-purple-400' : 'text-slate-600'}`}>{player.rank}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold truncate text-sm">{player.playerName}</p>
                          {player.is_pro && <ProBadge size="small" />}
                          {player.is_content_creator && <ContentCreatorBadge size="small" />}
                          {isCurrent && <span className="px-2 py-0.5 bg-purple-500 text-white text-xs font-bold rounded-full">Tú</span>}
                        </div>
                        <p className="text-xs text-slate-500">{player.team}</p>
                      </div>
                      <div className="text-right">
                        <span className={`block font-bold font-mono text-sm ${isCurrent ? 'text-purple-400' : 'text-blue-400'}`}>{player.winRate}</span>
                        <span className="text-[10px] text-slate-500 uppercase">WinRate</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

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
                    <Link key={article.id} to={`/media/articulos/${article.id}`} className="group relative block bg-slate-800/50 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500/50 transition-all duration-300 hover:shadow-2xl hover:shadow-blue-500/20 hover:-translate-y-1">
                      <div className="flex gap-4 p-4">
                        <div className="relative w-32 h-32 flex-shrink-0 rounded-lg overflow-hidden">
                          <img src={article.image_url || article.imageUrl || '/images/placeholder-article.jpg'} alt={article.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                          <div className="absolute top-2 left-2 px-2 py-1 bg-blue-600/90 backdrop-blur-sm text-white text-[10px] font-bold rounded-full">{article.category || 'Artículo'}</div>
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
