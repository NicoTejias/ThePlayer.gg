import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { RankingEntry, CommunityEvent, MediaArticle, MarketplacePost, WinRateRankingEntry, PlayerProfile } from '../types';
import Card from '../components/Card';
import TrophyIcon from '../components/icons/TrophyIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import UsersIcon from '../components/icons/UserIcon';
import { supabase } from '../supabaseClient';
import { useGame } from '../context/GameContext';

const CountUp: React.FC<{ end: number, duration?: number }> = ({ end, duration = 2000 }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    let startTime: number | null = null;
    const animate = (currentTime: number) => {
      if (!startTime) startTime = currentTime;
      const progress = Math.min((currentTime - startTime) / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 4); // EaseOutQuart
      setCount(Math.floor(ease * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [end, duration]);

  return <span>{count.toLocaleString()}</span>;
};

// Mock Data for Media and Marketplace (as we don't have real data source for these yet)
const mockArticles: MediaArticle[] = [
  { id: '1', title: 'Análisis del Metajuego Moderno Post-Baneos', author: 'Admin', excerpt: 'Exploramos cómo los últimos cambios han afectado el panorama competitivo de Modern con la salida de Fury y Grief.', imageUrl: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&q=80&w=800', category: 'Modern' },
  { id: '2', title: 'Top 5 Cartas de Commander que Deberías Jugar', author: 'Invitado', excerpt: 'Un ranking de las cartas más impactantes y versátiles para tu próximo mazo de Commander.', imageUrl: 'https://images.unsplash.com/photo-1635326444826-06c8f84991a9?auto=format&fit=crop&q=80&w=800', category: 'Commander' },
  { id: '3', title: 'Reporte: Ganador del RCQ Santiago', author: 'JuezLocal', excerpt: 'Entrevista exclusiva con el ganador del último Regional Championship Qualifier.', imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800', category: 'Reporte' },
  { id: '4', title: 'La Economía de MTG: ¿Momento de Invertir?', author: 'FinanceGuru', excerpt: 'Analizamos las tendencias del mercado secundario y qué cartas podrían subir de precio.', imageUrl: 'https://images.unsplash.com/photo-1620325867502-221cfb5faa5f?auto=format&fit=crop&q=80&w=800', category: 'Finanzas' },
  { id: '5', title: 'Guía de Draft: Lost Caverns of Ixalan', author: 'LimitedPro', excerpt: 'Domina el formato limitado con nuestra guía de arquetipos y pick orders para el nuevo set.', imageUrl: 'https://images.unsplash.com/photo-1500964757637-c85e8a162699?auto=format&fit=crop&q=80&w=800', category: 'Limited' },
  { id: '6', title: 'Entrevista con el Team campeón de Chile', author: 'Redacción', excerpt: 'Conversamos con los miembros del equipo que representará al país en el mundial.', imageUrl: 'https://images.unsplash.com/photo-1526666923127-b2970f64b422?auto=format&fit=crop&q=80&w=800', category: 'Entrevista' },
];

const mockEventsData: CommunityEvent[] = [
  { id: 'e1', title: 'Gran Open Modern', date: '2025-01-15', storeName: 'MagicSur Santiago', format: 'Modern', playerCount: 64, imageUrl: '' },
  { id: 'e2', title: 'Commander Party Night', date: '2025-01-18', storeName: 'La Comarca', format: 'Commander', playerCount: 32, imageUrl: '' },
  { id: 'e3', title: 'RCQ Pioneer Qualifier', date: '2025-01-22', storeName: 'Entre Juegos', format: 'Pioneer', playerCount: 48, imageUrl: '' },
  { id: 'e4', title: 'Liga Standard - Fecha 1', date: '2025-01-25', storeName: 'El Reino', format: 'Standard', playerCount: 16, imageUrl: '' },
  { id: 'e5', title: 'Prerelease: Nuevos Horizontes', date: '2025-02-01', storeName: 'Portal Magic', format: 'Sealed', playerCount: 50, imageUrl: '' },
  { id: 'e6', title: 'Torneo Legacy Mensual', date: '2025-02-05', storeName: 'Legacy Club', format: 'Legacy', playerCount: 24, imageUrl: '' },
];

const mockMarketplace: MarketplacePost[] = [
  { id: '1', title: 'Busco Force of Will', type: 'Compra', seller: 'User123', region: 'Metropolitana', imageUrl: 'https://picsum.photos/seed/market1/400/300' },
  { id: '2', title: 'Vendo fetchlands de Modern Horizons 2', type: 'Venta', seller: 'CardTraderCL', region: 'Valparaíso', imageUrl: 'https://picsum.photos/seed/market2/400/300' },
  { id: '3', title: 'Cambio Ragavan por Solitude', type: 'Cambio', seller: 'ProPlayer', region: 'Biobío', imageUrl: 'https://picsum.photos/seed/market3/400/300' },
  { id: '4', title: 'Vendo Sheoldred, the Apocalypse', type: 'Venta', seller: 'BlackMana', region: 'Santiago', imageUrl: 'https://picsum.photos/seed/market4/400/300' },
  { id: '5', title: 'Busco The One Ring (Normal)', type: 'Compra', seller: 'GollumFan', region: 'Sur', imageUrl: 'https://picsum.photos/seed/market5/400/300' },
  { id: '6', title: 'Vendo Lote de Tierras Dobles', type: 'Venta', seller: 'OldSchool', region: 'Metropolitana', imageUrl: 'https://picsum.photos/seed/market6/400/300' },
  { id: '7', title: 'Cambio Orcish Bowmasters', type: 'Cambio', seller: 'Archer101', region: 'Valparaíso', imageUrl: 'https://picsum.photos/seed/market7/400/300' },
  { id: '8', title: 'Vendo Mana Crypt', type: 'Venta', seller: 'CommanderKing', region: 'Norte', imageUrl: 'https://picsum.photos/seed/market8/400/300' },
  { id: '9', title: 'Busco Boseiju, Who Endures', type: 'Compra', seller: 'LandSeeker', region: 'Metropolitana', imageUrl: 'https://picsum.photos/seed/market9/400/300' },
  { id: '10', title: 'Vendo Deck Modern Rakdos Scam', type: 'Venta', seller: 'CompPlayer', region: 'Biobío', imageUrl: 'https://picsum.photos/seed/market10/400/300' },
  { id: '11', title: 'Busco Sheoldred', type: 'Compra', seller: 'NecroLord', region: 'Santiago', imageUrl: 'https://picsum.photos/seed/market11/400/300' },
  { id: '12', title: 'Vendo Lote Standard', type: 'Venta', seller: 'StandardGuy', region: 'Vina', imageUrl: 'https://picsum.photos/seed/market12/400/300' },
];

const sliderItems = [
  { id: 1, title: 'Últimas Noticias', link: '/media', imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800', color: 'from-blue-600/80' },
  { id: 2, title: 'Videos', link: '/media/videos', imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800', color: 'from-red-600/80' },
  { id: 3, title: 'Artículos', link: '/media/articulos', imageUrl: 'https://images.unsplash.com/photo-1585241936939-be05368a5bcb?auto=format&fit=crop&q=80&w=800', color: 'from-green-600/80' },
  { id: 4, title: 'MERCADO TCG', link: '/mercado', imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=800', color: 'from-purple-600/80' },
];

const SectionHeader: React.FC<{ title: string, linkTo: string }> = ({ title, linkTo }) => (
  <div className="flex justify-between items-center mb-6">
    <h2 className="text-3xl font-bold text-white uppercase tracking-wider">{title}</h2>
    <Link to={linkTo} className="text-sky-400 hover:text-sky-300 transition-colors">
      Ver más &rarr;
    </Link>
  </div>
);

interface HomePageProps {
  players: PlayerProfile[];
  events: CommunityEvent[];
}

const HomePage: React.FC<HomePageProps> = ({ players, events }) => {
  const { currentGame } = useGame();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [latestNews, setLatestNews] = useState<MediaArticle[]>([]);
  const [featuredContent, setFeaturedContent] = useState<any[]>([]);
  const [stats, setStats] = useState({ totalPlayers: 0, registeredStores: 0, activeTournaments: 0, totalMatches: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Mock some data if tables are empty, but try real fetch first
        const [storesData, playersData, tournamentsData, resultsData] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'store'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'player'),
          supabase.from('tournaments')
            .select('*', { count: 'exact', head: true })
            .eq('game_type', currentGame),
          supabase.from('tournament_results')
            .select('id, tournaments!inner(game_type)', { count: 'exact', head: true })
            .eq('tournaments.game_type', currentGame)
        ]);

        // Fetch Latest News & Videos
        const { data: articlesData } = await supabase
          .from('articles')
          .select('*')
          .eq('is_published', true)
          .order('published_at', { ascending: false })
          .limit(3);

        if (articlesData) setLatestNews(articlesData);

        const { data: videosData } = await supabase
          .from('videos')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(3);

        if (videosData) {
          setFeaturedContent(videosData.map(v => ({
            id: v.id,
            title: v.title,
            type: 'video',
            imageUrl: `https://img.youtube.com/vi/${v.youtube_id}/maxresdefault.jpg`,
            link: `/media/videos`,
            date: new Date(v.created_at || Date.now()).toLocaleDateString()
          })));
        }

        setStats({
          registeredStores: storesData.count || 0,
          totalPlayers: playersData.count || 0,
          activeTournaments: tournamentsData.count || 0,
          totalMatches: resultsData.count || 0
        });

        setLoading(false);

      } catch (e) {
        console.error("Error fetching stats", e);
        setLoading(false);
      }
    };

    fetchStats();

    // Realtime subscription for stats updates
    const subscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStats)
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, [currentGame]);

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);
  // Derive Top 10 Pts Ranking (Player Latam Series)
  const topPwpPlayers = [...players]
    .sort((a, b) => (b.pwp || 0) - (a.pwp || 0))
    .slice(0, 10)
    .map((p, i) => {
      // Generar número anónimo consistente basado en hash del ID
      const hashCode = p.id.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);
      const anonymousNumber = Math.abs(hashCode % 9000) + 1000; // Número de 4 dígitos (1000-9999)

      return {
        id: p.id, // Preservar ID
        rank: i + 1,
        // Anonymous Name Logic
        playerName: p.isPublic ? p.name : `Jugador #${anonymousNumber}`,
        pwp: p.pwp || 0,
        region: p.region || 'Unknown',
        team: p.team || 'Unknown' // Adding team to the mapped object
      };
    });

  // Derive Top 10 Win Rate Ranking (PLS Winrate)
  const topWinRatePlayers = [...players]
    .map(p => {
      const totalMatches = (p.matchesWon || 0) + (p.matchesLost || 0) + (p.matchesDrew || 0);
      const winRate = totalMatches > 0 ? ((p.matchesWon || 0) / totalMatches) * 100 : 0;
      return { ...p, winRate };
    })
    .sort((a, b) => b.winRate - a.winRate)
    .slice(0, 10)
    .map((p, i) => {
      // Generar número anónimo consistente basado en hash del ID
      const hashCode = p.id.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);
      const anonymousNumber = Math.abs(hashCode % 9000) + 1000; // Número de 4 dígitos (1000-9999)

      return {
        id: p.id, // Preservar ID
        rank: i + 1,
        // Anonymous Name Logic: "Jugador " + last 4 chars of ID (simulated or real)
        playerName: p.isPublic ? p.name : `Jugador #${anonymousNumber}`,
        winRate: `${p.winRate.toFixed(1)}%`,
        region: p.region || 'Unknown',
        team: p.team || 'Unknown' // Adding team to the mapped object
      };
    });

  // Combine real events with mock events to ensure we show 6 items for layout verification
  // Filter out duplicates if IDs might clash, though unlikely with "e1", "e2" etc vs UUIDs
  const combinedEvents = [...(events || []), ...mockEventsData];
  // specific uniqueness check if needed, but simple concat is usually fine for visual testing
  const displayEvents = combinedEvents.slice(0, 6);

  // Helper for Game Themes
  const getGameTheme = (game: string) => {
    switch (game) {
      case 'mtg':
        return {
          bg: 'bg-slate-900',
          accent: 'blue',
          gradient: 'from-violet-600 to-blue-600',
          heroImage: 'https://images.unsplash.com/photo-1642375630656-e0e985b9b653?q=80&w=2070&auto=format&fit=crop'
        };
      case 'pokemon':
        return {
          bg: 'bg-yellow-950',
          accent: 'yellow',
          gradient: 'from-yellow-500 to-amber-600',
          heroImage: 'https://images.unsplash.com/photo-1613771404721-1f92d799e49f?q=80&w=2069&auto=format&fit=crop'
        };
      case 'one_piece':
        return {
          bg: 'bg-red-950',
          accent: 'red',
          gradient: 'from-red-600 to-orange-600',
          heroImage: 'https://images.unsplash.com/photo-1578353022142-09264fd64295?q=80&w=1920&auto=format&fit=crop'
        };
      default:
        return {
          bg: 'bg-slate-900',
          accent: 'blue',
          gradient: 'from-blue-600 to-cyan-500',
          heroImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?q=80&w=2070&auto=format&fit=crop'
        };
    }
  };

  const theme = getGameTheme(currentGame);

  // Updated Partners List with new local paths
  const partners = [
    { name: 'StreamCaster Mage', logo: '/images/streamcaster-mage-logo.png', url: '#' },
    { name: 'Partner 1', logo: '/images/partners/partner_0.png', url: '#' },
    { name: 'Partner 2', logo: '/images/partners/partner_1.png', url: '#' },
    { name: 'Partner 3', logo: '/images/partners/partner_2.jpg', url: '#' },
    { name: 'Partner 4', logo: '/images/partners/partner_3.png', url: '#' },
    { name: 'Partner 5', logo: '/images/partners/partner_4.jpg', url: '#' },
  ];

  if (loading) {
    return (
      <div className={`min-h-screen ${theme.bg} flex items-center justify-center`}>
        <div className={`w-16 h-16 border-4 border-${theme.accent}-500 border-t-transparent rounded-full animate-spin`}></div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${theme.bg} pb-20 transition-colors duration-700`}>

      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-b from-black/80 via-${theme.accent}-950/20 to-${theme.bg.split('-')[1]}-900 z-10`}></div>
        <div
          className="absolute inset-0 bg-cover bg-center opacity-50 animate-pulse-slow"
          style={{ backgroundImage: `url('${theme.heroImage}')` }}
        ></div>

        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto space-y-10 animate-fade-in-up">
          <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter drop-shadow-[0_0_25px_rgba(0,0,0,0.8)]">
            THE <span className={`text-transparent bg-clip-text bg-gradient-to-r ${theme.gradient}`}>PLAYER</span>
          </h1>
          <p className="text-2xl md:text-3xl text-slate-200 font-light max-w-3xl mx-auto drop-shadow-md leading-relaxed">
            Domina el metajuego en el ecosistema número uno de Latinoamérica.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            <Link
              to="/eventos"
              className={`px-10 py-5 bg-gradient-to-r ${theme.gradient} hover:brightness-110 text-white font-bold text-xl rounded-2xl shadow-2xl shadow-${theme.accent}-500/30 transition-all transform hover:scale-105 hover:-translate-y-1 border border-white/10`}
            >
              🏆 Competir
            </Link>
            <Link
              to="/ranking"
              className="px-10 py-5 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 text-white font-bold text-xl rounded-2xl transition-all transform hover:scale-105 hover:-translate-y-1"
            >
              📊 Ver Rankings
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="container mx-auto px-4 relative z-30 -mt-24 mb-24">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-black/40 backdrop-blur-xl p-8 rounded-3xl border border-white/10 shadow-2xl">
          <div className="text-center group">
            <p className="text-4xl md:text-5xl font-black text-white group-hover:text-blue-400 transition-colors">{stats.totalPlayers}</p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">Jugadores</p>
          </div>
          <div className="text-center group">
            <p className="text-4xl md:text-5xl font-black text-white group-hover:text-emerald-400 transition-colors">{stats.activeTournaments}</p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">Torneos</p>
          </div>
          <div className="text-center group">
            <p className="text-4xl md:text-5xl font-black text-white group-hover:text-yellow-400 transition-colors">{stats.registeredStores}</p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">Tiendas</p>
          </div>
          <div className="text-center group">
            <p className="text-4xl md:text-5xl font-black text-white group-hover:text-purple-400 transition-colors">{stats.totalMatches}</p>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mt-2">Partidas</p>
          </div>
        </div>
      </section>

      {/* Content Grid */}
      <div className="container mx-auto px-4 max-w-7xl space-y-24">

        {/* Latest News */}
        <section>
          <div className="flex items-end justify-between mb-12">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
              <span className={`text-${theme.accent}-500/80 mr-2`}>///</span>
              Novedades
            </h2>
            <Link to="/media/articulos" className="hidden md:flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold uppercase text-sm tracking-wider">
              Ver Archivo <span className="text-xl">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {latestNews.length > 0 ? (
              <Link to={`/media/articulos/${latestNews[0].slug}`} className="relative h-[500px] rounded-3xl overflow-hidden group border border-white/10 shadow-2xl">
                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors z-10"></div>
                <img src={latestNews[0].image_url || latestNews[0].imageUrl || ''} alt={latestNews[0].title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-700" />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent z-20"></div>
                <div className="absolute bottom-0 left-0 p-8 z-30 w-full">
                  <span className={`inline-block px-3 py-1 bg-${theme.accent}-600 text-white text-xs font-black rounded uppercase tracking-wider mb-4`}>
                    Destacado
                  </span>
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight group-hover:text-blue-300 transition-colors">
                    {latestNews[0].title}
                  </h3>
                  <p className="text-slate-300 line-clamp-2 md:text-lg mb-4">{latestNews[0].excerpt}</p>
                </div>
              </Link>
            ) : (
              <div className="h-[500px] bg-slate-800/50 rounded-3xl flex items-center justify-center border border-white/5 border-dashed">
                <span className="text-slate-500 font-medium">Sin noticias destacadas</span>
              </div>
            )}

            <div className="grid grid-cols-1 gap-8">
              {latestNews.slice(1, 3).map((news) => (
                <Link key={news.id} to={`/media/articulos/${news.slug}`} className="relative h-60 rounded-3xl overflow-hidden group border border-white/10 flex">
                  <div className="w-1/3 relative shrink-0">
                    <img src={news.image_url || news.imageUrl || ''} alt="" className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <div className="p-6 bg-slate-800/80 w-2/3 flex flex-col justify-center">
                    <span className="text-xs font-bold text-slate-400 uppercase mb-2">{news.published_at ? new Date(news.published_at).toLocaleDateString() : ''}</span>
                    <h4 className="text-xl font-bold text-white leading-tight group-hover:text-blue-300 transition-colors mb-2">{news.title}</h4>
                    <span className="text-sm font-bold text-blue-400 mt-auto">Leer más</span>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Featured Videos */}
        <section>
          <div className="flex items-end justify-between mb-12">
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">
              <span className={`text-${theme.accent}-500/80 mr-2`}>►</span>
              Media
            </h2>
            <Link to="/media/videos" className="hidden md:flex items-center gap-2 text-slate-400 hover:text-white transition-colors font-bold uppercase text-sm tracking-wider">
              Ver Galería <span className="text-xl">→</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredContent.map((video) => (
              <a href={video.link} key={video.id} className="group relative aspect-video rounded-2xl overflow-hidden shadow-lg border border-white/10 block">
                <img src={video.imageUrl} alt={video.title} className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-2xl">
                    <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black to-transparent">
                  <h3 className="text-white font-bold truncate">{video.title}</h3>
                </div>
              </a>
            ))}
          </div>
        </section>

        {/* Rankings & Leaderboard */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start py-8">
          <div className="lg:col-span-5 space-y-8">
            <div className="inline-block px-4 py-2 bg-gradient-to-r from-yellow-600/20 to-transparent border-l-4 border-yellow-500">
              <span className="text-yellow-400 font-bold uppercase tracking-widest text-sm">Clasificación Oficial 2025</span>
            </div>
            <h2 className="text-5xl font-black text-white uppercase leading-none">
              Leader<br />board
            </h2>
            <p className="text-lg text-slate-400 leading-relaxed">
              Los mejores jugadores de la región compiten aquí. Sube de rango, gana premios y califica para el Invitacional de Fin de Año.
            </p>
            <Link to="/ranking" className="inline-flex items-center gap-3 px-8 py-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl transition-colors border border-slate-600">
              Ver Tabla Completa
              <span className="text-lg">→</span>
            </Link>
          </div>

          <div className="lg:col-span-7">
            <div className="bg-slate-800/50 rounded-3xl border border-white/5 overflow-hidden shadow-2xl">
              {topPwpPlayers.slice(0, 5).map((player, idx) => (
                <div key={player.id} className="flex items-center gap-6 p-6 border-b border-white/5 hover:bg-white/5 transition-colors group">
                  <span className={`text-4xl font-black w-12 text-center ${idx === 0 ? 'text-yellow-400' : idx === 1 ? 'text-slate-300' : idx === 2 ? 'text-amber-700' : 'text-slate-700'}`}>
                    {player.rank}
                  </span>
                  <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-700 shrink-0">
                    <img src={`https://ui-avatars.com/api/?name=${player.playerName}&background=random`} alt={player.playerName} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors">{player.playerName}</h4>
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                      <span>{player.team || 'Sin Equipo'}</span>
                      <span>•</span>
                      <span>{player.region}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-2xl font-black text-white font-mono">{player.pwp}</span>
                    <span className="text-xs font-bold text-slate-500 uppercase">Pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

      </div>

      {/* Partners Marquee */}
      <section className="mt-32 border-t border-white/5 bg-black/20 py-16 backdrop-blur">
        <div className="container mx-auto px-4">
          <p className="text-center text-slate-600 font-bold uppercase tracking-[0.3em] mb-10 text-sm">Strategic Partners</p>
          <div className="flex flex-wrap justify-center items-center gap-16 md:gap-24 opacity-50 grayscale hover:grayscale-0 transition-all duration-700 hover:opacity-100">
            {partners.map((partner, i) => (
              <div key={i} className="group relative">
                <img src={partner.logo} alt={partner.name} className="h-12 md:h-16 object-contain brightness-125 contrast-125" />
              </div>
            ))}
          </div>
        </div>
      </section>

    </div>
  );
};

export default HomePage;
