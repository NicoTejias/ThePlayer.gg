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

// Mock Data for Media and Marketplace
const mockArticles: MediaArticle[] = [
  { id: '1', title: 'Análisis del Metajuego Moderno Post-Baneos', author: 'Admin', excerpt: 'Exploramos cómo los últimos cambios han afectado el panorama competitivo de Modern.', imageUrl: 'https://images.unsplash.com/photo-1613771404784-3a5686aa2be3?auto=format&fit=crop&q=80&w=800', category: 'Modern' },
  { id: '2', title: 'Top 5 Cartas de Commander', author: 'Invitado', excerpt: 'Un ranking de las cartas más impactantes y versátiles para tu próximo mazo de Commander.', imageUrl: 'https://images.unsplash.com/photo-1635326444826-06c8f84991a9?auto=format&fit=crop&q=80&w=800', category: 'Commander' },
  { id: '3', title: 'Reporte: Ganador del RCQ Santiago', author: 'JuezLocal', excerpt: 'Entrevista exclusiva con el ganador del último Regional Championship Qualifier.', imageUrl: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&q=80&w=800', category: 'Reporte' },
];

const mockEventsData: CommunityEvent[] = [
  { id: 'e1', title: 'Gran Open Modern', date: '2025-01-15', storeName: 'MagicSur Santiago', format: 'Modern', playerCount: 64, imageUrl: '' },
  { id: 'e2', title: 'Commander Party Night', date: '2025-01-18', storeName: 'La Comarca', format: 'Commander', playerCount: 32, imageUrl: '' },
  { id: 'e3', title: 'RCQ Pioneer Qualifier', date: '2025-01-22', storeName: 'Entre Juegos', format: 'Pioneer', playerCount: 48, imageUrl: '' },
];

const mockMarketplace: MarketplacePost[] = [
  { id: '1', title: 'Busco Force of Will', type: 'Compra', seller: 'User123', region: 'Metropolitana', imageUrl: 'https://picsum.photos/seed/market1/400/300' },
  { id: '2', title: 'Vendo fetchlands de Modern Horizons 2', type: 'Venta', seller: 'CardTraderCL', region: 'Valparaíso', imageUrl: 'https://picsum.photos/seed/market2/400/300' },
  { id: '3', title: 'Cambio Ragavan por Solitude', type: 'Cambio', seller: 'ProPlayer', region: 'Biobío', imageUrl: 'https://picsum.photos/seed/market3/400/300' },
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

  // Derive Top 10 Pts Ranking (Player Latam Series)
  const topPwpPlayers = [...players]
    .sort((a, b) => (b.pwp || 0) - (a.pwp || 0))
    .slice(0, 10)
    .map((p, i) => {
      const hashCode = p.id.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);
      const anonymousNumber = Math.abs(hashCode % 9000) + 1000;

      return {
        id: p.id,
        rank: i + 1,
        playerName: p.isPublic ? p.name : `Jugador #${anonymousNumber}`,
        pwp: p.pwp || 0,
        region: p.region || 'Unknown',
        team: p.team || 'Sin Equipo'
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
      const hashCode = p.id.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);
      const anonymousNumber = Math.abs(hashCode % 9000) + 1000;

      return {
        id: p.id,
        rank: i + 1,
        playerName: p.isPublic ? p.name : `Jugador #${anonymousNumber}`,
        winRate: `${p.winRate.toFixed(1)}%`,
        region: p.region || 'Unknown',
        team: p.team || 'Sin Equipo'
      };
    });

  const combinedEvents = [...(events || []), ...mockEventsData];
  const displayEvents = combinedEvents.slice(0, 6);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Hero Carousel */}
      <section className="relative h-[500px] overflow-hidden">
        {sliderItems.map((item, idx) => (
          <Link
            key={item.id}
            to={item.link}
            className={`absolute inset-0 transition-opacity duration-1000 ${idx === currentSlide ? 'opacity-100' : 'opacity-0'}`}
            style={{ backgroundImage: `url('${item.imageUrl}')`, backgroundSize: 'cover', backgroundPosition: 'center' }}
          >
            <div className={`absolute inset-0 bg-gradient-to-r ${item.color} to-transparent opacity-95`}></div>
            <div className="relative z-10 flex items-center justify-center h-full">
              <h2 className="text-6xl font-black text-white uppercase tracking-wider drop-shadow-2xl">{item.title}</h2>
            </div>
          </Link>
        ))}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex gap-2">
          {sliderItems.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-3 h-3 rounded-full transition-all ${idx === currentSlide ? 'bg-white w-8' : 'bg-white/50'}`}
            />
          ))}
        </div>
      </section>

      {/* Community Stats Section */}
      <section className="mt-24 mb-12 relative px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-purple-900/10 to-pink-900/10 blur-3xl"></div>
        <div className="container mx-auto relative z-10">
          <h2 className="text-3xl font-bold text-center text-white mb-8 uppercase tracking-wide">
            Comunidad en Números
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {/* Players Stat */}
            <div className="bg-slate-800/40 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 flex flex-col items-center hover:border-blue-500/50 hover:bg-slate-800/60 transition-all group hover:-translate-y-1 duration-300">
              <div className="p-3 bg-blue-500/10 rounded-full mb-4 group-hover:bg-blue-500/20 transition-colors text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                <UsersIcon className="w-8 h-8" />
              </div>
              <div className="text-4xl font-bold text-white mb-1 tabular-nums tracking-tight">
                <CountUp end={stats.totalPlayers} />
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Jugadores</div>
            </div>

            {/* Stores Stat */}
            <div className="bg-slate-800/40 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 flex flex-col items-center hover:border-yellow-500/50 hover:bg-slate-800/60 transition-all group hover:-translate-y-1 duration-300">
              <div className="p-3 bg-yellow-500/10 rounded-full mb-4 group-hover:bg-yellow-500/20 transition-colors text-yellow-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
              </div>
              <div className="text-4xl font-bold text-white mb-1 tabular-nums tracking-tight">
                <CountUp end={stats.registeredStores} />
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Tiendas</div>
            </div>

            {/* Tournaments Stat */}
            <div className="bg-slate-800/40 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 flex flex-col items-center hover:border-purple-500/50 hover:bg-slate-800/60 transition-all group hover:-translate-y-1 duration-300">
              <div className="p-3 bg-purple-500/10 rounded-full mb-4 group-hover:bg-purple-500/20 transition-colors text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                <TrophyIcon className="w-8 h-8" />
              </div>
              <div className="text-4xl font-bold text-white mb-1 tabular-nums tracking-tight">
                <CountUp end={stats.activeTournaments} />
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Torneos</div>
            </div>

            {/* Matches Stat */}
            <div className="bg-slate-800/40 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 flex flex-col items-center hover:border-green-500/50 hover:bg-slate-800/60 transition-all group hover:-translate-y-1 duration-300">
              <div className="p-3 bg-green-500/10 rounded-full mb-4 group-hover:bg-green-500/20 transition-colors text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
                <SparklesIcon className="w-8 h-8" />
              </div>
              <div className="text-4xl font-bold text-white mb-1 tabular-nums tracking-tight">
                <CountUp end={stats.totalMatches} />
              </div>
              <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Partidas</div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content - Row-based Layout */}
      <div className="container mx-auto px-4 py-12 space-y-16">

        {/* Próximos Eventos - Full Width Row */}
        <section>
          <SectionHeader title="Próximos Eventos" linkTo="/eventos" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {displayEvents.slice(0, 4).map((event) => (
              <Card key={event.id} className="bg-slate-800/50 hover:bg-slate-800/70 transition-all border border-slate-700">
                <div className="p-4">
                  <h3 className="text-lg font-bold text-white mb-2 line-clamp-1">{event.title}</h3>
                  <p className="text-sm text-slate-400 mb-1">📍 {event.storeName}</p>
                  <p className="text-sm text-slate-400 mb-1">📅 {new Date(event.date).toLocaleDateString()}</p>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-700">
                    <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">{event.format}</span>
                    <span className="text-xs text-slate-500">{event.playerCount} jugadores</span>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* Rankings - Full Width Row with 2 Internal Columns */}
        <section>
          <SectionHeader title="Rankings" linkTo="/ranking" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* PWP Ranking */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Top 10 Pts</h3>
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
                {topPwpPlayers.slice(0, 5).map((player) => (
                  <Link key={player.id} to="/ranking" className="flex items-center gap-3 p-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-0">
                    <span className="text-lg font-black text-slate-600 w-6">{player.rank}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate text-sm">{player.playerName}</p>
                      <p className="text-xs text-slate-500">{player.team}</p>
                    </div>
                    <div className="text-right">
                      <span className="block text-green-400 font-bold font-mono text-sm">{player.pwp}</span>
                      <span className="text-[10px] text-slate-500 uppercase">Pts</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* Win Rate Ranking */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Top 10 Win Rate</h3>
              <div className="bg-slate-800/50 rounded-xl border border-slate-700 overflow-hidden shadow-xl">
                {topWinRatePlayers.slice(0, 5).map((player) => (
                  <Link key={player.id} to="/ranking" className="flex items-center gap-3 p-3 hover:bg-slate-700/50 transition-colors border-b border-slate-700/50 last:border-0">
                    <span className="text-lg font-black text-slate-600 w-6">{player.rank}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white font-bold truncate text-sm">{player.playerName}</p>
                      <p className="text-xs text-slate-500">{player.team}</p>
                    </div>
                    <div className="text-right">
                      <span className="block text-blue-400 font-bold font-mono text-sm">{player.winRate}</span>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Últimas Novedades - Full Width Row with 2 Internal Columns */}
        <section>
          <SectionHeader title="Últimas Novedades" linkTo="/media" />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Latest Articles */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Artículos</h3>
              <div className="space-y-3">
                {(latestNews.length > 0 ? latestNews : mockArticles).slice(0, 3).map((article) => (
                  <Card key={article.id} className="bg-slate-800/50 hover:bg-slate-800/70 transition-all border border-slate-700">
                    <div className="flex gap-3 p-3">
                      <div className="w-24 h-24 flex-shrink-0 rounded overflow-hidden">
                        <img src={article.image_url || article.imageUrl || ''} alt={article.title} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm font-bold text-white line-clamp-2 mb-1 group-hover:text-blue-300 transition-colors">{article.title}</h4>
                        <p className="text-xs text-slate-500 mb-2">{article.category}</p>
                        <p className="text-xs text-slate-400 line-clamp-2">{article.excerpt}</p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Featured Videos */}
            <div>
              <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Videos</h3>
              <div className="space-y-3">
                {featuredContent.slice(0, 3).map((video) => (
                  <a key={video.id} href={video.link} className="block group">
                    <Card className="bg-slate-800/50 hover:bg-slate-800/70 transition-all border border-slate-700">
                      <div className="flex gap-3 p-3">
                        <div className="w-32 h-20 flex-shrink-0 rounded overflow-hidden relative">
                          <img src={video.imageUrl} alt={video.title} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center">
                              <svg className="w-4 h-4 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                            </div>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-white line-clamp-2 group-hover:text-blue-300 transition-colors">{video.title}</h4>
                          <p className="text-xs text-slate-500 mt-1">{video.date}</p>
                        </div>
                      </div>
                    </Card>
                  </a>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default HomePage;
