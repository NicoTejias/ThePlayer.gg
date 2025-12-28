import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { MediaArticle, CommunityEvent, MarketplacePost, PlayerProfile } from '../types';
import TrophyIcon from '../components/icons/TrophyIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
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

// Mock Data
const sliderItems = [
  { id: 1, title: 'Últimas Noticias', link: '/media', imageUrl: 'https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&q=80&w=800', color: 'from-blue-600/80' },
  { id: 2, title: 'Videos', link: '/media/videos', imageUrl: 'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&q=80&w=800', color: 'from-red-600/80' },
  { id: 3, title: 'Artículos', link: '/media/articulos', imageUrl: 'https://images.unsplash.com/photo-1585241936939-be05368a5bcb?auto=format&fit=crop&q=80&w=800', color: 'from-green-600/80' },
  { id: 4, title: 'MERCADO TCG', link: '/mercado', imageUrl: 'https://images.unsplash.com/photo-1607082348824-0a96f2a4b9da?auto=format&fit=crop&q=80&w=800', color: 'from-purple-600/80' },
];

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
        const [storesData, playersData, tournamentsData, resultsData] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'store'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'player'),
          supabase.from('tournaments').select('*', { count: 'exact', head: true }).eq('game_type', currentGame),
          supabase.from('tournament_results').select('id, tournaments!inner(game_type)', { count: 'exact', head: true }).eq('tournaments.game_type', currentGame)
        ]);

        const { data: articlesData } = await supabase.from('articles').select('*').eq('is_published', true).order('published_at', { ascending: false }).limit(3);
        if (articlesData) setLatestNews(articlesData);

        const { data: videosData } = await supabase.from('videos').select('*').order('created_at', { ascending: false }).limit(3);
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
    const subscription = supabase.channel('public:profiles').on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, fetchStats).subscribe();
    return () => { supabase.removeChannel(subscription); };
  }, [currentGame]);

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

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
        <div className="absolute inset-0 bg-cover bg-center opacity-50 animate-pulse-slow" style={{ backgroundImage: `url('${theme.heroImage}')` }}></div>
        <div className="relative z-20 text-center px-4 max-w-5xl mx-auto space-y-10 animate-fade-in-up">
          <h1 className="text-6xl md:text-9xl font-black text-white tracking-tighter drop-shadow-[0_0_25px_rgba(0,0,0,0.8)]">
            THE <span className={`text-transparent bg-clip-text bg-gradient-to-r ${theme.gradient}`}>PLAYER</span>
          </h1>
          <p className="text-2xl md:text-3xl text-slate-200 font-light max-w-3xl mx-auto drop-shadow-md leading-relaxed">
            Domina el metajuego en el ecosistema número uno de Latinoamérica.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            <Link to="/eventos" className={`px-10 py-5 bg-gradient-to-r ${theme.gradient} hover:brightness-110 text-white font-bold text-xl rounded-2xl shadow-2xl shadow-${theme.accent}-500/30 transition-all transform hover:scale-105 hover:-translate-y-1 border border-white/10`}>
              🏆 Competir
            </Link>
            <Link to="/ranking" className="px-10 py-5 bg-white/5 backdrop-blur-xl border border-white/10 hover:bg-white/10 text-white font-bold text-xl rounded-2xl transition-all transform hover:scale-105 hover:-translate-y-1">
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
              <span className={`text-${theme.accent}-500/80 mr-2`}>///</span> Novedades
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
                  <span className={`inline-block px-3 py-1 bg-${theme.accent}-600 text-white text-xs font-black rounded uppercase tracking-wider mb-4`}>Destacado</span>
                  <h3 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight group-hover:text-blue-300 transition-colors">{latestNews[0].title}</h3>
                  <p className="text-slate-300 line-clamp-2 md:text-lg mb-4">{latestNews[0].excerpt}</p>
                </div>
              </Link>
            ) : (
              <div className="h-[500px] bg-slate-800/50 rounded-3xl flex items-center justify-center border border-white/5 border-dashed"><span className="text-slate-500 font-medium">Sin noticias destacadas</span></div>
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
      </div>
    </div>
  );
};

export default HomePage;
