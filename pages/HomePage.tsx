import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { CommunityEvent, MediaArticle, PlayerProfile } from '../types';
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

  useEffect(() => {
    let isMounted = true;
    const loadingTimeout = setTimeout(() => { if (isMounted) setLoading(false); }, 10000);

    const fetchStats = async () => {
      try {
        const [storesData, playersData, tournamentsData, resultsData, articlesData, videosData] = await Promise.all([
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
            id: v.id, title: v.title,
            link: `https://www.youtube.com/watch?v=${v.youtube_id}`,
            imageUrl: `https://img.youtube.com/vi/${v.youtube_id}/mqdefault.jpg`,
            description: v.description, is_premium: v.is_premium
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
        if (isMounted) { setLoading(false); clearTimeout(loadingTimeout); }
      }
    };
    fetchStats();
    return () => { isMounted = false; clearTimeout(loadingTimeout); };
  }, [currentGame]);

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

  const getRankBadgeClass = (rank: number) => {
    if (rank === 1) return 'rank-badge top-1';
    if (rank === 2) return 'rank-badge top-2';
    if (rank === 3) return 'rank-badge top-3';
    return 'rank-badge default';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg-base)' }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
          <p className="text-xs uppercase tracking-widest" style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-secondary)', letterSpacing: '0.25em' }}>
            Cargando Arena
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen text-slate-200 animate-fade-in space-y-10">
      <SEO
        title="Inicio"
        description="ThePlayer.gg es la plataforma líder para el ecosistema TCG en Chile. Rankings, torneos y comunidad en un solo lugar."
      />

      {/* ═══════════════════════════════════════════════════════
          HERO BANNER
      ════════════════════════════════════════════════════════ */}
      <div
        className="relative rounded-3xl overflow-hidden group noise-overlay"
        style={{
          minHeight: '480px',
          background: 'linear-gradient(135deg, var(--bg-secondary) 0%, var(--bg-base) 60%, var(--bg-secondary) 100%)',
          border: '1px solid rgba(255,255,255,0.06)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.04)',
        }}
      >
        {/* Ambient accent glow */}
        <div
          className="absolute inset-0 pointer-events-none opacity-20 group-hover:opacity-30 transition-opacity duration-1000"
          style={{ background: 'radial-gradient(ellipse 60% 80% at 80% 50%, var(--color-accent), transparent)' }}
        />

        {/* Background image */}
        <div
          className="absolute inset-0 bg-contain bg-no-repeat transition-transform duration-700 group-hover:scale-[1.02]"
          style={{
            backgroundImage: `url('/images/jace_banner.png')`,
            backgroundPosition: 'right center',
            opacity: 0.85,
          }}
        />

        {/* Left vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to right, var(--bg-secondary) 0%, var(--bg-secondary) 18%, rgba(0,0,0,0.5) 55%, transparent 100%)' }}
        />
        {/* Bottom vignette */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: 'linear-gradient(to top, var(--bg-base) 0%, transparent 50%)', opacity: 0.7 }}
        />

        {/* Decorative corner geometry */}
        <div
          className="absolute top-0 left-0 w-48 h-48 pointer-events-none opacity-10"
          style={{
            background: 'conic-gradient(from 0deg at 0% 0%, var(--color-accent), transparent 50%)',
          }}
        />

        <div className="relative z-10 flex flex-col justify-center p-8 lg:p-14" style={{ minHeight: '480px' }}>
          <div className="max-w-2xl space-y-5">
            {/* Badge */}
            <div className="hero-badge animate-fade-in-up stagger-1" style={{ opacity: 0 }}>
              <span>{t('popular')}</span>
            </div>

            {/* Title */}
            <h1
              className="hero-title text-4xl sm:text-6xl text-white animate-fade-in-up stagger-2"
              style={{ opacity: 0 }}
            >
              {t('jace_title')}
            </h1>

            {/* Description */}
            <p
              className="text-base sm:text-lg leading-relaxed animate-fade-in-up stagger-3"
              style={{ opacity: 0, color: 'rgba(255,255,255,0.65)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 500, maxWidth: '480px' }}
            >
              {t('jace_desc')}
            </p>

            {/* CTAs */}
            <div className="flex items-center gap-3 pt-2 animate-fade-in-up stagger-4" style={{ opacity: 0 }}>
              <Link
                to="/eventos"
                className="btn-accent px-7 py-3.5 rounded-xl text-xs"
                style={{ letterSpacing: '0.12em' }}
              >
                {t('jugar')}
              </Link>
              <Link
                to="/quienes-somos"
                className="px-6 py-3.5 rounded-xl text-xs font-bold uppercase transition-all duration-300 hover:bg-white/8"
                style={{
                  fontFamily: 'Rajdhani, sans-serif',
                  letterSpacing: '0.12em',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.8)',
                }}
              >
                {t('detalles')}
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Role-Based Widgets */}
      {!session && <VisitorWidget />}
      {session && userRole === 'player' && userId && <PlayerWidget userId={userId} />}
      {session && userRole === 'store' && userId && <StoreWidget storeId={userId} />}
      {session && userRole === 'admin' && <AdminWidget />}

      <AliasReminderBanner show={showAliasReminder} />
      <GalaNominationsBanner />

      {/* ═══════════════════════════════════════════════════════
          COMMUNITY STATS
      ════════════════════════════════════════════════════════ */}
      <section>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            {
              icon: <UsersIcon className="w-5 h-5" />,
              value: stats.totalPlayers,
              label: t('jugadores'),
              color: '#60a5fa',
              delay: 'stagger-1',
            },
            {
              icon: (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              ),
              value: stats.registeredStores,
              label: t('tiendas'),
              color: '#fbbf24',
              delay: 'stagger-2',
            },
            {
              icon: <TrophyIcon className="w-5 h-5" />,
              value: stats.activeTournaments,
              label: t('torneos'),
              color: '#c084fc',
              delay: 'stagger-3',
            },
            {
              icon: <SparklesIcon className="w-5 h-5" />,
              value: stats.totalMatches,
              label: t('partidas'),
              color: '#34d399',
              delay: 'stagger-4',
            },
          ].map((stat, i) => (
            <div key={i} className={`card-stat rounded-2xl p-5 flex flex-col items-center text-center animate-fade-in-up ${stat.delay}`} style={{ opacity: 0 }}>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110"
                style={{ background: `${stat.color}15`, color: stat.color }}
              >
                {stat.icon}
              </div>
              <div className="stat-number">
                <CountUp end={stat.value} />
              </div>
              <div className="stat-label mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          UPCOMING EVENTS
      ════════════════════════════════════════════════════════ */}
      <section className="space-y-5">
        <div className="flex justify-between items-end">
          <h2 className="section-title text-xl">{t('te_podria_gustar')}</h2>
          <Link
            to="/eventos"
            className="text-xs font-bold uppercase tracking-widest transition-all hover:opacity-80 flex items-center gap-1.5"
            style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--color-accent)', letterSpacing: '0.15em' }}
          >
            {t('ver_mas')}
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
            </svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {displayEvents.length > 0 ? (
            displayEvents.map((event, idx) => (
              <Link
                key={event.id}
                to="/eventos"
                className={`group relative h-[300px] rounded-2xl overflow-hidden flex flex-col justify-end border border-shimmer animate-fade-in-up stagger-${idx + 1}`}
                style={{
                  opacity: 0,
                  background: '#100a10',
                  border: '1px solid rgba(255,255,255,0.06)',
                  boxShadow: '0 4px 24px rgba(0,0,0,0.4)',
                }}
              >
                {/* Cover image */}
                <div
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                  style={{ backgroundImage: `url('${event.imageUrl || '/images/placeholder-article.jpg'}')` }}
                />
                {/* Vignette */}
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(10,3,14,0.97) 0%, rgba(10,3,14,0.5) 45%, transparent 100%)' }} />
                {/* Hover accent border */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                  style={{ boxShadow: 'inset 0 0 0 1px var(--color-accent)', filter: 'drop-shadow(0 0 8px var(--color-accent))' }}
                />

                {/* Player count */}
                <div
                  className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-bold tracking-widest"
                  style={{
                    fontFamily: 'Rajdhani, sans-serif',
                    background: 'rgba(0,0,0,0.7)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: 'rgba(255,255,255,0.7)',
                  }}
                >
                  {event.playerCount || 0}/{event.maxPlayers || 64}
                </div>

                {/* Content */}
                <div className="relative z-10 p-5 space-y-2.5">
                  <h3
                    className="font-bold text-white leading-snug truncate group-hover:opacity-90 transition-opacity"
                    style={{ fontFamily: 'Cinzel, serif', fontSize: '0.85rem', letterSpacing: '0.03em' }}
                    title={event.title}
                  >
                    {event.title}
                  </h3>

                  <div className="flex items-center gap-2">
                    <span
                      className="text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 rounded"
                      style={{ fontFamily: 'Rajdhani, sans-serif', background: 'var(--color-accent)', color: '#fff', letterSpacing: '0.12em' }}
                    >
                      {event.format}
                    </span>
                    <span className="text-[10px] truncate max-w-[100px]" style={{ color: 'rgba(255,255,255,0.5)', fontFamily: 'Rajdhani, sans-serif' }}>
                      {event.storeName}
                    </span>
                  </div>

                  <div
                    className="flex justify-between items-center text-[10px] border-t pt-2"
                    style={{ borderColor: 'rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.45)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600 }}
                  >
                    <span>{event.date}</span>
                    <span style={{ color: '#fbbf24' }}>
                      {event.entryFee ? (event.entryFee.includes('$') ? event.entryFee : `$${event.entryFee}`) : 'Gratis'}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <p
              className="col-span-full py-16 text-center text-xs uppercase tracking-widest"
              style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-secondary)', letterSpacing: '0.25em' }}
            >
              {t('no_eventos')}
            </p>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════
          RANKINGS
      ════════════════════════════════════════════════════════ */}
      {session ? (
        <section
          className="rounded-3xl overflow-hidden noise-overlay"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.01) 100%)',
            backdropFilter: 'blur(16px)',
            border: '1px solid rgba(255,255,255,0.07)',
            borderTopColor: 'rgba(255,255,255,0.10)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.4)',
          }}
        >
          <div className="p-6 lg:p-8 border-b" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <span style={{ color: 'var(--color-accent)', display: 'flex' }}><TrophyIcon className="w-5 h-5" /></span>
                <h2 className="section-title text-xl" style={{ fontFamily: 'Cinzel, serif' }}>
                  {t('rankings_oficiales')}
                </h2>
                <TierBadge points={topPointsPlayers.find(p => p.id === userId)?.points || 0} size="lg" />
              </div>
              <Link
                to="/ranking"
                className="text-xs font-bold uppercase flex items-center gap-1.5 transition-opacity hover:opacity-70"
                style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--color-accent)', letterSpacing: '0.15em' }}
              >
                {t('ver_mas')}
                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            </div>
            <p
              className="mt-1.5 text-xs uppercase tracking-widest"
              style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-secondary)', letterSpacing: '0.2em' }}
            >
              {t('clasificacion_temporada')}{' '}
              <span style={{ color: 'var(--color-accent)' }}>#Temporada2026</span>
            </p>
          </div>

          <div>
            {topPointsPlayers.slice(0, 5).map((player) => {
              const isCurrent = session?.user?.id && player.id === session.user.id;
              return (
                <Link
                  key={player.id}
                  to="/ranking"
                  className={`rank-row ${isCurrent ? 'is-current' : ''}`}
                  style={isCurrent ? { background: 'rgba(var(--color-accent-rgb, 255,42,95), 0.06)' } : {}}
                >
                  <div className="flex items-center gap-4">
                    <div className={getRankBadgeClass(player.rank)}>
                      {player.rank}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className="font-bold truncate"
                          style={{
                            fontFamily: 'Rajdhani, sans-serif',
                            fontWeight: 700,
                            fontSize: isCurrent ? '1rem' : '0.9rem',
                            color: isCurrent ? 'var(--color-accent)' : 'var(--text-primary)',
                            letterSpacing: '0.03em',
                          }}
                        >
                          {player.playerName}
                        </p>
                        {player.is_pro && <ProBadge size="small" />}
                        {player.is_content_creator && <ContentCreatorBadge size="small" />}
                      </div>
                      {player.team !== '-' && (
                        <p
                          className="text-[10px] uppercase tracking-widest mt-0.5"
                          style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-secondary)', letterSpacing: '0.2em' }}
                        >
                          {player.team}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-baseline gap-1.5">
                    <span
                      className="text-lg font-bold tabular-nums"
                      style={{ fontFamily: 'Cinzel, serif', color: 'var(--text-primary)', letterSpacing: '0.02em' }}
                    >
                      {player.points.toLocaleString()}
                    </span>
                    <span
                      className="text-[9px] uppercase font-bold"
                      style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--color-accent)', letterSpacing: '0.15em' }}
                    >
                      {t('puntos')}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      ) : (
        <section
          className="rounded-3xl p-10 text-center noise-overlay"
          style={{
            background: 'linear-gradient(145deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
            border: '1px solid rgba(255,255,255,0.07)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.3)',
          }}
        >
          <div className="max-w-md mx-auto space-y-4">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl mx-auto"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              🔒
            </div>
            <h2 className="text-2xl font-bold" style={{ fontFamily: 'Cinzel, serif', letterSpacing: '0.06em', color: 'var(--text-primary)' }}>
              {t('exclusivo_title')}
            </h2>
            <p className="text-sm leading-relaxed" style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-secondary)', fontWeight: 500 }}>
              {t('exclusivo_desc')}
            </p>
            <div className="pt-4">
              <Link to="/auth" className="btn-accent px-8 py-3.5 rounded-xl text-xs inline-block" style={{ letterSpacing: '0.15em' }}>
                {t('unirse_ahora')}
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════
          ARTICLES & VIDEOS
      ════════════════════════════════════════════════════════ */}
      <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Articles */}
        <div className="space-y-5">
          <h2 className="section-title text-lg" style={{ fontFamily: 'Cinzel, serif' }}>{t('articulos')}</h2>
          <div className="space-y-3">
            {latestNews.length > 0 ? (
              latestNews.slice(0, 3).map((article, idx) => (
                <Link
                  key={article.id}
                  to={`/media/articulos/${article.slug}`}
                  className={`flex gap-4 p-4 rounded-2xl border-shimmer group transition-all duration-300 animate-fade-in-up stagger-${idx + 1}`}
                  style={{
                    opacity: 0,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(8px)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                >
                  <div className="relative w-24 h-20 flex-shrink-0 rounded-xl overflow-hidden">
                    <img
                      src={article.image_url || article.imageUrl || '/images/placeholder-article.jpg'}
                      alt={article.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div
                      className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wide"
                      style={{ fontFamily: 'Rajdhani, sans-serif', background: 'var(--color-accent)', color: '#fff', letterSpacing: '0.1em' }}
                    >
                      {article.category || 'TCG'}
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4
                        className="font-bold line-clamp-2 leading-snug transition-colors group-hover:opacity-80"
                        style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', letterSpacing: '0.02em' }}
                      >
                        {article.title}
                      </h4>
                      <p className="text-xs line-clamp-2 mt-1 leading-relaxed" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>
                        {article.excerpt || (article.content?.substring(0, 100) + '...')}
                      </p>
                    </div>
                    <div
                      className="flex items-center justify-between text-[10px] border-t pt-2 mt-2"
                      style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.05em' }}
                    >
                      <span>{t('por')} {article.author || 'ThePlayer'}</span>
                      <span>{new Date(article.published_at || article.created_at || Date.now()).toLocaleDateString('es-CL')}</span>
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <p className="text-xs py-10 uppercase tracking-widest text-center" style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-secondary)', letterSpacing: '0.2em' }}>
                {t('no_noticias')}
              </p>
            )}
          </div>
        </div>

        {/* Videos */}
        <div className="space-y-5">
          <h2 className="section-title text-lg" style={{ fontFamily: 'Cinzel, serif' }}>{t('videos')}</h2>
          <div className="space-y-3">
            {featuredContent.length > 0 ? (
              featuredContent.slice(0, 3).map((video, idx) => (
                <a
                  key={video.id}
                  href={video.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex gap-4 p-4 rounded-2xl group transition-all duration-300 animate-fade-in-up stagger-${idx + 1}`}
                  style={{
                    opacity: 0,
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    backdropFilter: 'blur(8px)',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.04)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                >
                  <div className="relative w-28 h-20 flex-shrink-0 rounded-xl overflow-hidden bg-black">
                    <img
                      src={video.imageUrl || '/images/placeholder-video.jpg'}
                      alt={video.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 opacity-80 group-hover:opacity-100"
                    />
                    {/* Play button overlay */}
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center transition-transform group-hover:scale-110"
                        style={{ background: 'rgba(0,0,0,0.7)', border: '1.5px solid rgba(255,255,255,0.3)' }}
                      >
                        <svg className="w-3 h-3 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                    <div
                      className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded text-[8px] font-bold uppercase"
                      style={{ fontFamily: 'Rajdhani, sans-serif', background: 'var(--color-accent)', color: '#fff', letterSpacing: '0.1em' }}
                    >
                      Video
                    </div>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4
                        className="font-bold line-clamp-2 leading-snug"
                        style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)', letterSpacing: '0.02em' }}
                      >
                        {video.title}
                      </h4>
                      <p className="text-xs line-clamp-1 mt-1" style={{ color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif' }}>
                        {video.description || 'Video destacado de la comunidad'}
                      </p>
                    </div>
                    <div
                      className="flex items-center justify-between text-[10px] border-t pt-2 mt-2"
                      style={{ borderColor: 'rgba(255,255,255,0.06)', color: 'var(--text-secondary)', fontFamily: 'Rajdhani, sans-serif', fontWeight: 600, letterSpacing: '0.05em' }}
                    >
                      <span>YouTube</span>
                      <span style={{ color: 'var(--color-accent)' }}>▶ Ver ahora</span>
                    </div>
                  </div>
                </a>
              ))
            ) : (
              <p className="text-xs py-10 uppercase tracking-widest text-center" style={{ fontFamily: 'Rajdhani, sans-serif', color: 'var(--text-secondary)', letterSpacing: '0.2em' }}>
                {t('no_videos')}
              </p>
            )}
          </div>
        </div>
      </section>

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
