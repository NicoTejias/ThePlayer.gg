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
import { useTranslation } from '../context/LanguageContext';

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

interface HomePageProps {
  players: PlayerProfile[];
  events: CommunityEvent[];
  session?: any;
  userRole?: 'player' | 'store' | 'admin' | null;
  userId?: string;
  showAliasReminder?: boolean;
}

const HomePage: React.FC<HomePageProps> = ({ players, events, session, userRole, userId, showAliasReminder = false }) => {
  const { currentGame } = useGame();
  const { t } = useTranslation();
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

    const loadingTimeout = setTimeout(() => {
      if (isMounted) {
        setLoading(false);
      }
    }, 10000);

    const fetchStats = async () => {
      try {
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

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingEvents = (events || [])
    .filter(event => {
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
    <div className="min-h-screen bg-slate-900/10 text-slate-200 animate-fade-in space-y-8">
      <SEO
        title="Inicio"
        description="ThePlayer.gg es la plataforma líder para el ecosistema TCG en Chile. Rankings, torneos y comunidad en un solo lugar."
      />

      {/* Hero Banner (Dynamic Gradient Base, full width after sidebar) */}
      <div className="relative rounded-[2rem] overflow-hidden group shadow-2xl border border-white/5 bg-gradient-to-r from-[var(--bg-secondary)] via-[var(--bg-base)] to-[var(--bg-secondary)] p-8 lg:p-12 min-h-[440px] sm:min-h-[520px] flex items-center">
        {/* Glow decoration */}
        <div className="absolute -inset-0.5 bg-gradient-to-r from-[var(--color-accent)] to-indigo-500 rounded-[2rem] blur opacity-10 group-hover:opacity-15 transition duration-1000" />

        {/* Jace Image Background (full image, no crop) */}
        <div
          className="absolute inset-0 bg-contain bg-no-repeat transition-transform duration-700 group-hover:scale-[1.03] opacity-90 sm:opacity-100"
          style={{
            backgroundImage: `url('/images/jace_banner.png')`,
            backgroundPosition: 'right center'
          }}
        />
        {/* Vignette Gradients */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(to right, var(--bg-secondary) 0%, var(--bg-secondary) 22%, transparent 75%)'
          }}
        />
        <div 
          className="absolute inset-0 pointer-events-none" 
          style={{
            background: 'linear-gradient(to top, var(--bg-base) 0%, transparent 100%)',
            opacity: 0.6
          }}
        />

        <div className="relative z-10 flex flex-col justify-center space-y-4 max-w-4xl">
          <div>
            <span className="px-3 py-1 bg-[var(--color-accent)]/20 border border-[var(--color-accent)]/40 text-[var(--color-accent)] text-[10px] font-black uppercase tracking-[0.2em] rounded-full">
              {t('popular')}
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-5xl font-black text-white uppercase tracking-wide leading-none drop-shadow-lg">
            {t('jace_title')}
          </h1>
          
          <p className="text-slate-350 text-sm sm:text-base font-medium leading-relaxed drop-shadow-md">
            {t('jace_desc')}
          </p>

          <div className="pt-2 flex items-center gap-4">
            <Link 
              to="/eventos" 
              className="px-8 py-3.5 bg-gradient-to-r from-rose-600 to-[#ff2a5f] hover:from-rose-500 hover:to-[#ff4575] text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-rose-950/40 active:scale-95 transition-all duration-300"
            >
              {t('jugar')}
            </Link>
            
            <Link 
              to="/quienes-somos" 
              className="px-6 py-3.5 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 text-white font-black rounded-xl text-xs uppercase tracking-wider transition-all duration-300"
            >
              {t('detalles')}
            </Link>
          </div>
        </div>
      </div>

      {/* Role-Based Widgets */}
      {!session && <VisitorWidget />}
      {session && userRole === 'player' && userId && <PlayerWidget userId={userId} />}
      {session && userRole === 'store' && userId && <StoreWidget storeId={userId} />}
      {session && userRole === 'admin' && <AdminWidget />}

      {/* Gala Banner & Reminders */}
      <AliasReminderBanner show={showAliasReminder} />
      <GalaNominationsBanner />

      {/* Community Stats Row */}
      <section className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/5 via-purple-900/5 to-pink-900/5 blur-3xl pointer-events-none" />
        <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Players */}
          <div className="bg-slate-900/30 backdrop-blur-xl p-6 rounded-3xl border border-white/5 flex flex-col items-center hover:border-blue-500/50 transition-all duration-500 group overflow-hidden">
            <div className="p-3 bg-blue-500/10 rounded-xl mb-3 text-blue-400 group-hover:scale-110 transition-transform">
              <UsersIcon className="w-6 h-6" />
            </div>
            <div className="text-3xl font-black text-white mb-1 tabular-nums tracking-tighter"><CountUp end={stats.totalPlayers} /></div>
            <div className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-black">{t('jugadores')}</div>
          </div>
          {/* Stores */}
          <div className="bg-slate-900/30 backdrop-blur-xl p-6 rounded-3xl border border-white/5 flex flex-col items-center hover:border-yellow-500/50 transition-all duration-500 group overflow-hidden">
            <div className="p-3 bg-yellow-500/10 rounded-xl mb-3 text-yellow-400 group-hover:scale-110 transition-transform">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>
            </div>
            <div className="text-3xl font-black text-white mb-1 tabular-nums tracking-tighter"><CountUp end={stats.registeredStores} /></div>
            <div className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-black">{t('tiendas')}</div>
          </div>
          {/* Tournaments */}
          <div className="bg-slate-900/30 backdrop-blur-xl p-6 rounded-3xl border border-white/5 flex flex-col items-center hover:border-purple-500/50 transition-all duration-500 group overflow-hidden">
            <div className="p-3 bg-purple-500/10 rounded-xl mb-3 text-purple-400 group-hover:scale-110 transition-transform">
              <TrophyIcon className="w-6 h-6" />
            </div>
            <div className="text-3xl font-black text-white mb-1 tabular-nums tracking-tighter"><CountUp end={stats.activeTournaments} /></div>
            <div className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-black">{t('torneos')}</div>
          </div>
          {/* Matches */}
          <div className="bg-slate-900/30 backdrop-blur-xl p-6 rounded-3xl border border-white/5 flex flex-col items-center hover:border-emerald-500/50 transition-all duration-500 group overflow-hidden">
            <div className="p-3 bg-emerald-500/10 rounded-xl mb-3 text-emerald-400 group-hover:scale-110 transition-transform">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <div className="text-3xl font-black text-white mb-1 tabular-nums tracking-tighter"><CountUp end={stats.totalMatches} /></div>
            <div className="text-[9px] text-slate-500 uppercase tracking-[0.3em] font-black">{t('partidas')}</div>
          </div>
        </div>
      </section>

      {/* Middle Section: You Might Also Like ("Te Podría Gustar") Event Grid */}
      <section className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">
            {t('te_podria_gustar')}
          </h2>
          <Link to="/eventos" className="text-xs text-sky-400 hover:text-sky-350 font-black uppercase tracking-wider transition-all">
            {t('ver_mas')} &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {displayEvents.length > 0 ? (
            displayEvents.map((event) => (
              <Link 
                key={event.id}
                to="/eventos"
                className="group relative h-[320px] rounded-[2rem] overflow-hidden border border-white/5 bg-[#180c18] flex flex-col justify-end p-6 shadow-xl hover:border-sky-500/50 hover:shadow-sky-550/15 transition-all duration-500"
              >
                {/* Event Cover Image Background */}
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url('${event.imageUrl || '/images/placeholder-article.jpg'}')` }}
                />
                {/* Dark Vignette Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#130712] via-[#130712]/40 to-transparent" />

                {/* Player count badge on top right */}
                <div className="absolute top-4 right-4 px-3 py-1 bg-slate-900/65 backdrop-blur-md rounded-full border border-white/10 text-[9px] font-black text-slate-200">
                  👥 {event.playerCount || 0} / {event.maxPlayers || 64} {t('jugadores')}
                </div>

                {/* Card Content (at bottom) */}
                <div className="relative z-10 space-y-2">
                  <h3 className="text-base font-black text-white group-hover:text-sky-400 transition-colors leading-snug truncate" title={event.title}>
                    {event.title}
                  </h3>
                  
                  <div className="flex items-center gap-2">
                    <span className="text-[8px] font-black uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                      {event.format}
                    </span>
                    <span className="text-[9px] text-slate-400 truncate max-w-[120px]">
                      📍 {event.storeName}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center text-[9px] text-slate-450 font-black border-t border-slate-800/40 pt-2 mt-1">
                    <span>📅 {event.date}</span>
                    <span className="text-yellow-500">{event.entryFee ? (event.entryFee.includes('$') ? event.entryFee : `$${event.entryFee}`) : 'Gratis'}</span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p className="text-slate-500 uppercase tracking-widest font-black text-xs text-center col-span-full py-16">
              {t('no_eventos')}
            </p>
          )}
        </div>
      </section>

      {/* Rankings Section */}
      {session && (
        <section className="bg-slate-900/30 border border-white/5 rounded-[2rem] p-6 lg:p-8 shadow-2xl backdrop-blur-xl">
          <div className="flex justify-between items-end mb-6">
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-black text-white uppercase tracking-wider">
                {t('rankings_oficiales')}
              </h2>
              <TierBadge points={topPointsPlayers.find(p => p.id === userId)?.points || 0} size="lg" />
            </div>
            
            <Link to="/ranking" className="text-xs text-sky-400 hover:text-sky-350 font-black uppercase tracking-wider transition-all flex items-center gap-1">
              {t('ver_mas')} &rarr;
            </Link>
          </div>

          <div className="max-w-4xl mx-auto">
            <p className="text-xs font-black text-slate-500 uppercase tracking-widest mb-4">
              {t('clasificacion_temporada')} <span className="text-sky-500 ml-2">#Temporada2026</span>
            </p>
            
            <div className="space-y-2 rounded-2xl overflow-hidden border border-slate-850 bg-slate-900/45">
              {topPointsPlayers.slice(0, 5).map((player) => {
                const isCurrent = session?.user?.id && player.id === session.user.id;
                return (
                  <Link 
                    key={player.id} 
                    to="/ranking" 
                    className={`flex items-center justify-between p-4 hover:bg-slate-800/10 transition-all border-b border-slate-850/30 last:border-0 ${isCurrent ? 'bg-sky-600/10 border-l-4 border-l-sky-500' : ''}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-slate-800/40 border border-slate-700/50 text-xs font-black text-slate-400">
                        {player.rank}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className={`font-black truncate ${isCurrent ? 'text-sky-400 text-base' : 'text-white text-sm'}`}>
                            {player.playerName}
                          </p>
                          {player.is_pro && <ProBadge size="small" />}
                          {player.is_content_creator && <ContentCreatorBadge size="small" />}
                        </div>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-wider mt-0.5">
                          {player.team}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <span className="text-base font-black font-mono leading-none text-slate-100">
                        {player.points.toLocaleString()}
                      </span>
                      <span className="text-[9px] text-sky-400 font-black uppercase tracking-wider">
                        {t('puntos')}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {!session && (
        <section className="bg-slate-900/30 border border-white/5 rounded-[2rem] p-8 text-center shadow-xl backdrop-blur-xl">
          <div className="max-w-xl mx-auto space-y-4">
            <div className="w-14 h-14 bg-slate-800/40 border border-slate-750 rounded-full flex items-center justify-center text-2xl mx-auto mb-4">
              🔒
            </div>
            <h2 className="text-xl font-black text-white uppercase tracking-wider">
              {t('exclusivo_title')}
            </h2>
            <p className="text-slate-400 text-sm">
              {t('exclusivo_desc')}
            </p>
            <div className="pt-4">
              <Link 
                to="/auth" 
                className="px-8 py-3.5 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-black rounded-full uppercase tracking-wider text-xs shadow-lg shadow-sky-950/20"
              >
                {t('unirse_ahora')}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* Articles & Videos Section */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Articles */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-white uppercase tracking-wider">
            {t('articulos')}
          </h2>
          <div className="space-y-4">
            {latestNews.length > 0 ? (
              latestNews.slice(0, 3).map((article) => (
                <Link 
                  key={article.id} 
                  to={`/media/articulos/${article.slug}`} 
                  className="block bg-slate-900/30 hover:bg-slate-800/20 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-sky-500/30"
                >
                  <div className="flex gap-4 p-4">
                    <div className="relative w-24 h-24 sm:w-28 sm:h-28 flex-shrink-0 rounded-xl overflow-hidden">
                      <img src={article.image_url || article.imageUrl || '/images/placeholder-article.jpg'} alt={article.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-sky-600 text-white text-[8px] font-black rounded-full uppercase">
                        {article.category || 'TCG'}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-black text-white line-clamp-2 leading-snug group-hover:text-sky-400 transition-colors">
                          {article.title}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-normal">
                          {article.excerpt || article.content?.substring(0, 100) + '...'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold border-t border-slate-850/30 pt-2 mt-2">
                        <span>{t('por')} {article.author || 'ThePlayer'}</span>
                        <span>{new Date(article.published_at || article.created_at || Date.now()).toLocaleDateString('es-CL')}</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-slate-500 font-black uppercase tracking-widest text-xs py-8">
                {t('no_noticias')}
              </p>
            )}
          </div>
        </div>

        {/* Videos */}
        <div className="space-y-4">
          <h2 className="text-lg font-black text-white uppercase tracking-wider">
            {t('videos')}
          </h2>
          <div className="space-y-4">
            {featuredContent.length > 0 ? (
              featuredContent.slice(0, 3).map((video) => (
                <a 
                  key={video.id} 
                  href={video.link} 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="block bg-slate-900/30 hover:bg-slate-800/20 border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 hover:border-[#ff2a5f]/30"
                >
                  <div className="flex gap-4 p-4">
                    <div className="relative w-28 h-20 sm:w-32 sm:h-22 flex-shrink-0 rounded-xl overflow-hidden bg-slate-850">
                      <img src={video.imageUrl || '/images/placeholder-video.jpg'} alt={video.title} className="w-full h-full object-cover" />
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-[#ff2a5f] text-white text-[8px] font-black rounded-full uppercase">
                        Video
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                      <div>
                        <h4 className="text-sm font-black text-white line-clamp-2 leading-snug">
                          {video.title}
                        </h4>
                        <p className="text-xs text-slate-400 line-clamp-1 mt-1">
                          {video.description || 'Video destacado de la comunidad'}
                        </p>
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 font-semibold border-t border-slate-850/30 pt-2 mt-2">
                        <span>YouTube</span>
                        <span>{new Date().toLocaleDateString('es-CL')}</span>
                      </div>
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <p className="text-slate-500 font-black uppercase tracking-widest text-xs py-8">
                {t('no_videos')}
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Modal */}
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
