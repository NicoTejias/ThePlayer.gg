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

  const partners = [
    { name: 'ThePlayer', logo: '/images/partners/theplayer_logo.png', url: '#' },
    { name: 'Blood Moon', logo: '/images/partners/bloodmoon.png', url: '#' },
    { name: 'Moss Eisley', logo: '/images/partners/moss_eisley.jpg', url: '#' },
    { name: 'Command Center', logo: '/images/partners/command_center.jpg', url: '#' },
    { name: 'Blue Robot', logo: '/images/partners/blue_robot.png', url: '#' },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0f172a] flex items-center justify-center">
        <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-16 pb-20">

      {/* Hero Section */}
      <section className="relative h-[600px] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a]/70 to-[#0f172a] z-10"></div>
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1642375630656-e0e985b9b653?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 animate-pulse-slow"></div>

        <div className="relative z-20 text-center px-4 max-w-4xl mx-auto space-y-8 animate-fade-in-up">
          <h1 className="text-6xl md:text-8xl font-black text-white tracking-tighter drop-shadow-2xl">
            THE <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-400">PLAYER</span>
          </h1>
          <p className="text-2xl md:text-3xl text-slate-300 font-light max-w-2xl mx-auto drop-shadow-md">
            El ecosistema definitivo para TCG en Latinoamérica. Compite, rankea y domina.
          </p>
          <div className="flex flex-col sm:flex-row gap-6 justify-center pt-8">
            <Link
              to="/eventos"
              className="px-8 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold text-lg rounded-xl shadow-lg shadow-blue-600/30 transition-all transform hover:scale-105 hover:-translate-y-1"
            >
              Ver Eventos
            </Link>
            <Link
              to="/ranking"
              className="px-8 py-4 bg-slate-800/80 backdrop-blur-md border border-slate-600 hover:bg-slate-700 text-white font-bold text-lg rounded-xl transition-all transform hover:scale-105 hover:-translate-y-1"
            >
              Consultar Ranking
            </Link>
          </div>
        </div>
      </section>

      {/* Community Stats */}
      <section className="container mx-auto px-4 max-w-6xl -mt-20 relative z-30">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 bg-slate-800/80 backdrop-blur-md p-8 rounded-2xl border border-slate-700 shadow-2xl">
          <div className="text-center">
            <p className="text-4xl font-black text-white">{stats.totalPlayers}</p>
            <p className="text-xs uppercase tracking-widest text-slate-400 mt-1">Jugadores</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-black text-emerald-400">{stats.activeTournaments}</p>
            <p className="text-xs uppercase tracking-widest text-slate-400 mt-1">Torneos Activos</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-black text-blue-400">{stats.registeredStores}</p>
            <p className="text-xs uppercase tracking-widest text-slate-400 mt-1">Tiendas Oficiales</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-black text-purple-400">{stats.totalMatches}</p>
            <p className="text-xs uppercase tracking-widest text-slate-400 mt-1">Partidas Jugadas</p>
          </div>
        </div>
      </section>

      {/* Featured News & Updates */}
      <section className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-3xl font-bold text-white uppercase tracking-wider border-l-4 border-blue-500 pl-4">Novedades</h2>
          <Link to="/noticias" className="text-blue-400 hover:text-blue-300 text-sm font-bold uppercase">Ver Todo &rarr;</Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {featuredContent.map((content) => (
            <Link key={content.id} to={content.link} className="group bg-slate-800 rounded-xl overflow-hidden border border-slate-700 hover:border-blue-500 transition-all hover:shadow-xl hover:shadow-blue-500/10">
              <div className="h-48 overflow-hidden relative">
                <img src={content.imageUrl} alt={content.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                <div className="absolute top-2 right-2 bg-black/60 backdrop-blur px-2 py-1 rounded text-xs font-bold text-white uppercase">{content.type}</div>
              </div>
              <div className="p-6">
                <p className="text-blue-400 text-xs font-bold mb-2">{content.date}</p>
                <h3 className="text-xl font-bold text-white group-hover:text-blue-300 transition-colors mb-2">{content.title}</h3>
                <span className="text-slate-500 text-sm group-hover:text-slate-400">Leer más &rarr;</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Ranking Spotlight */}
      <section className="py-20 bg-slate-900/50 border-y border-slate-800">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-12">

            <div className="md:w-1/2 space-y-6">
              <h2 className="text-4xl font-black text-white uppercase tracking-wide">
                Player Latam <span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-amber-600">Series</span>
              </h2>
              <p className="text-lg text-slate-300">
                El ranking más prestigioso de la región. Acumula puntos participando en torneos oficiales y clasifica para el gran invitacional de fin de temporada.
              </p>

              <div className="grid grid-cols-2 gap-4 pt-4">
                <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-yellow-500">
                  <p className="font-bold text-white">Premios en Efectivo</p>
                  <p className="text-xs text-slate-400">Para el Top 8 Final</p>
                </div>
                <div className="bg-slate-800 p-4 rounded-lg border-l-4 border-blue-500">
                  <p className="font-bold text-white">Invitaciones Pro Tour</p>
                  <p className="text-xs text-slate-400">Clasificatorios Regionales</p>
                </div>
              </div>

              <Link to="/ranking" className="inline-block px-8 py-3 bg-white text-slate-900 font-bold rounded-lg hover:bg-slate-200 transition-colors mt-4">
                VER TABLA DE POSICIONES
              </Link>
            </div>

            {/* Top 5 Table Snippet */}
            <div className="md:w-1/2 w-full bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-2xl relative">
              <div className="absolute -top-4 -right-4 bg-yellow-500 text-black font-black px-4 py-2 rounded-lg rotate-3 shadow-lg uppercase text-sm">
                Líderes de Temporada
              </div>
              <table className="w-full text-left">
                <thead>
                  <tr className="text-slate-500 text-xs uppercase tracking-wider border-b border-slate-700">
                    <th className="pb-3 pl-2">Rank</th>
                    <th className="pb-3">Jugador</th>
                    <th className="pb-3 text-right pr-2">Pts</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {topPwpPlayers.slice(0, 5).map((player) => (
                    <tr key={player.id} className="group hover:bg-slate-700/30 transition-colors">
                      <td className="py-3 pl-2 font-mono font-bold text-slate-400 group-hover:text-yellow-400">#{player.rank}</td>
                      <td className="py-3 font-medium text-white group-hover:text-blue-300 flex items-center gap-2">
                        <img src={`https://ui-avatars.com/api/?name=${player.playerName}&background=random&color=fff&size=24`} className="w-6 h-6 rounded-full" alt="" />
                        {player.playerName}
                      </td>
                      <td className="py-3 pr-2 text-right font-bold text-emerald-400 font-mono">{player.pwp}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="mt-4 text-center border-t border-slate-700 pt-3">
                <Link to="/ranking" className="text-xs text-slate-400 hover:text-white uppercase tracking-wider font-bold">Ver todos los jugadores &darr;</Link>
              </div>
            </div>
          </div>
          <Link key={news.id} to={`/media/articulos/${news.slug}`} className="group relative h-96 rounded-xl overflow-hidden shadow-xl block">
            <div className="absolute inset-0 bg-slate-900 group-hover:scale-105 transition-transform duration-700">
              {news.image_url ? (
                <img src={news.image_url} alt={news.title} className="w-full h-full object-cover opacity-60 group-hover:opacity-40 transition-opacity" />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-slate-800 to-slate-900"></div>
              )}
            </div>
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/40 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-6 w-full">
              <span className="inline-block px-3 py-1 bg-blue-600/90 text-white text-xs font-bold rounded mb-3 uppercase tracking-wider">
                {news.game_type}
              </span>
              <h3 className="text-xl font-bold text-white mb-2 leading-tight group-hover:text-blue-300 transition-colors">
                {news.title}
              </h3>
              <p className="text-slate-300 text-sm line-clamp-2 mb-4">
                {news.excerpt}
              </p>
              <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">
                Leer Artículo &rarr;
              </span>
            </div>
          </Link>
          )) : (
          <div className="col-span-3 text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
            <p className="text-slate-400">No hay noticias recientes.</p>
          </div>
                                )}
        </div>
      </section>

      {/* Featured Videos Section */}
      <section className="container mx-auto px-4 max-w-7xl">
        <div className="flex justify-between items-end mb-8">
          <div>
            <h2 className="text-3xl font-bold text-white uppercase tracking-wider">Videos Destacados</h2>
            <div className="h-1 w-20 bg-red-500 mt-2"></div>
          </div>
          <Link to="/media/videos" className="text-slate-400 hover:text-white flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors">
            Ver galería <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredContent.map((content) => (
            <div key={content.id} className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden shadow-lg group">
              <div className="relative aspect-video">
                <img src={content.imageUrl} alt={content.title} className="w-full h-full object-cover" />
                <a href={content.link} className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-all duration-300">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center pl-1 shadow-xl transform scale-75 group-hover:scale-100 transition-transform">
                    <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg>
                  </div>
                </a>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-white line-clamp-2 mb-2 group-hover:text-red-400 transition-colors">{content.title}</h3>
                <p className="text-xs text-slate-500">{content.date}</p>
              </div>
            </div>
          ))}
          {featuredContent.length === 0 && (
            <div className="col-span-3 text-center py-12 bg-slate-800/50 rounded-xl border border-slate-700 border-dashed">
              <p className="text-slate-400">Pronto más videos.</p>
            </div>
          )}
        </div>
      </section>

      {/* Rankings Preview & Join CTA */}
      <section className="container mx-auto px-4 max-w-7xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Top 10 Ranking */}
        <div className="lg:col-span-1 bg-slate-900 rounded-xl border border-slate-800 p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white uppercase tracking-wider">Top 10 - Puntos</h3>
            <Link to="/ranking" className="text-xs text-blue-400 hover:text-blue-300 uppercase font-bold">Ver Completo</Link>
          </div>
          <div className="space-y-4">
            {topPwpPlayers.map((player) => (
              <div key={player.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-600">
                <span className={`font-mono text-xl font-bold w-6 text-center ${player.rank === 1 ? 'text-yellow-400' : player.rank === 2 ? 'text-slate-300' : player.rank === 3 ? 'text-amber-600' : 'text-slate-600'}`}>
                  {player.rank}
                </span>
                <div className="w-10 h-10 rounded-full bg-slate-700 overflow-hidden flex-shrink-0">
                  <img src={`https://ui-avatars.com/api/?name=${player.name}&background=random`} alt={player.name} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold truncate">{player.name}</p>
                  <p className="text-xs text-slate-500">{player.team || 'Sin Equipo'}</p>
                </div>
                <div className="text-right">
                  <span className="block text-emerald-400 font-bold font-mono">{player.pwp}</span>
                  <span className="text-[10px] text-slate-500 uppercase">Pts</span>
                </div>
              </div>
            ))}
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
              <CountUp end={stats.stores} />
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Tiendas</div>
          </div>

          {/* Tournaments Stat */}
          <div className="bg-slate-800/40 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 flex flex-col items-center hover:border-purple-500/50 hover:bg-slate-800/60 transition-all group hover:-translate-y-1 duration-300">
            <div className="p-3 bg-purple-500/10 rounded-full mb-4 group-hover:bg-purple-500/20 transition-colors text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.2)]">
              <TrophyIcon className="w-8 h-8" />
            </div>
            <div className="text-4xl font-bold text-white mb-1 tabular-nums tracking-tight">
              <CountUp end={stats.tournaments} />
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Torneos</div>
          </div>

          {/* Matches Stat */}
          <div className="bg-slate-800/40 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 flex flex-col items-center hover:border-green-500/50 hover:bg-slate-800/60 transition-all group hover:-translate-y-1 duration-300">
            <div className="p-3 bg-green-500/10 rounded-full mb-4 group-hover:bg-green-500/20 transition-colors text-green-400 shadow-[0_0_15px_rgba(34,197,94,0.2)]">
              <SparklesIcon className="w-8 h-8" />
            </div>
            <div className="text-4xl font-bold text-white mb-1 tabular-nums tracking-tight">
              <CountUp end={stats.matches} />
            </div>
            <div className="text-xs text-slate-400 uppercase tracking-widest font-bold">Partidas</div>
          </div>
        </div>
      </section>

      {/* Marquee Brands/Partners */}
      <div className="border-t border-slate-800 py-12">
        <div className="container mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm uppercase tracking-widest mb-8 font-bold">Nuestros Aliados</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60 grayscale hover:grayscale-0 transition-all hover:opacity-100 duration-500">
            {partners.map((partner, idx) => (
              <img key={idx} src={partner.logo} alt={partner.name} className="h-10 md:h-14 object-contain" />
            ))}
          </div>
        </div>
      </div>

    </div>
                        </div >
                      </div >
                    </div >
                  </div >
                </section >
          </div >
      </div >
    </div >
        </div >
      </div >
    </div >
  );
};

export default HomePage;