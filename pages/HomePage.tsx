import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import type { RankingEntry, CommunityEvent, MediaArticle, MarketplacePost, WinRateRankingEntry, PlayerProfile } from '../types';
import Card from '../components/Card';
import TrophyIcon from '../components/icons/TrophyIcon';
import SparklesIcon from '../components/icons/SparklesIcon';
import UsersIcon from '../components/icons/UserIcon'; // Ensure this matches existing import if present or add it
import { supabase } from '../supabaseClient';

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
  const [currentSlide, setCurrentSlide] = useState(0);
  const [stats, setStats] = useState({ stores: 0, players: 0, tournaments: 0, matches: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Mock some data if tables are empty, but try real fetch first
        const [stores, players, tournaments, results] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'store'),
          supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('role', 'player'),
          supabase.from('tournaments').select('*', { count: 'exact', head: true }),
          supabase.from('tournament_results').select('*', { count: 'exact', head: true })
        ]);

        setStats({
          stores: stores.count || 0,
          players: players.count || 0,
          tournaments: tournaments.count || 0,
          matches: results.count || 0
        });
      } catch (e) {
        console.error("Error fetching stats", e);
      }
    };
    fetchStats();
  }, []);

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderItems.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);
  // Derive Top 10 PWP Ranking (Player Latam Series)
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

  return (
    <div className="space-y-12">

      {/* Hero Carousel Section */}
      <section className="relative w-full h-[400px] md:h-[500px] overflow-hidden rounded-2xl shadow-2xl group">
        {/* Slides */}
        {sliderItems.map((item, index) => (
          <div
            key={item.id}
            className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentSlide ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
          >
            <div className={`absolute inset-0 bg-gradient-to-t ${item.color} to-transparent opacity-60 z-10`} />
            <div className="absolute inset-0 bg-black/20 z-10" /> {/* General overlay for readability */}
            <img
              src={item.imageUrl}
              alt={item.title}
              className="w-full h-full object-cover transform scale-105 group-hover:scale-110 transition-transform duration-[10000ms]"
            />
            <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12 z-20 flex flex-col items-start justify-end h-full bg-gradient-to-t from-slate-900 to-transparent">
              <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mb-4 drop-shadow-xl animate-fade-in-up">
                {item.title}
              </h2>
              <Link
                to={item.link}
                className="bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-bold py-3 px-8 rounded-full border border-white/30 transition-all hover:scale-105 hover:shadow-lg flex items-center gap-2"
              >
                Explorar
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5l6 6m0 0l-6 6m6-6H3" />
                </svg>
              </Link>
            </div>
          </div>
        ))}

        {/* Indicators */}
        <div className="absolute bottom-6 right-8 z-30 flex space-x-3">
          {sliderItems.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${index === currentSlide ? 'bg-white w-8' : 'bg-white/40 hover:bg-white/60'}`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </section>

      {/* Rankings Section Grid */}
      <div className="grid lg:grid-cols-2 gap-12 mb-20">
        {/* Player Latam Series (PWP) Section */}
        <section>
          <SectionHeader title="Player Latam Series" linkTo="/ranking/pwp" />
          <div className="bg-slate-800 rounded-lg p-5 shadow-xl border border-slate-700">
            <ul className="space-y-2">
              {topPwpPlayers.length > 0 ? (
                topPwpPlayers.map((player, index) => (
                  <li key={player.playerName} className={`flex items-center justify-between p-2 rounded-md ${index < 3 ? 'bg-slate-700/60' : 'hover:bg-slate-700/30'}`}>
                    <div className="flex items-center space-x-3">
                      <span className={`text-lg font-bold w-6 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-yellow-600' : 'text-slate-500'}`}>
                        {player.rank}
                      </span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {/* Anonymize logic handled in map */}
                          <span className="text-base text-white font-medium truncate max-w-[120px] sm:max-w-xs">
                            {player.playerName}
                          </span>
                        </div>
                      </div>
                      {/* Show TEAM instead of REGION */}
                      <span className="text-[10px] text-sky-300 bg-sky-900/30 border border-sky-800 px-1.5 py-0.5 rounded ml-auto mr-2">
                        {player.team || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-sky-400 font-semibold text-sm">
                      <span>{player.pwp} pts</span>
                      {index < 3 && <TrophyIcon className="w-4 h-4" />}
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-slate-400 text-center py-4">No hay datos de ranking disponibles.</li>
              )}
            </ul>
          </div>
        </section>

        {/* PLS Winrate Section */}
        <section>
          <SectionHeader title="PLS Winrate" linkTo="/ranking/pwp" />
          <div className="bg-slate-800 rounded-lg p-5 shadow-xl border border-slate-700">
            <ul className="space-y-2">
              {topWinRatePlayers.length > 0 ? (
                topWinRatePlayers.map((player, index) => (
                  <li key={player.playerName} className={`flex items-center justify-between p-2 rounded-md ${index < 3 ? 'bg-slate-700/60' : 'hover:bg-slate-700/30'}`}>
                    <div className="flex items-center space-x-3">
                      <span className={`text-lg font-bold w-6 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-yellow-600' : 'text-slate-500'}`}>
                        {player.rank}
                      </span>
                      <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                          {/* Anonymize logic handled in map */}
                          <span className="text-base text-white font-medium truncate max-w-[120px] sm:max-w-xs">
                            {player.playerName}
                          </span>
                        </div>
                      </div>
                      {/* Show TEAM instead of REGION */}
                      <span className="text-[10px] text-violet-300 bg-violet-900/30 border border-violet-800 px-1.5 py-0.5 rounded ml-auto mr-2">
                        {player.team || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2 text-violet-400 font-semibold text-sm">
                      <span>{player.winRate}</span>
                      {index < 3 && <SparklesIcon className="w-4 h-4" />}
                    </div>
                  </li>
                ))
              ) : (
                <li className="text-slate-400 text-center py-4">No hay datos de ranking disponibles.</li>
              )}
            </ul>
          </div>
        </section>
      </div>

      {/* Unified 3-Column Layout: Events, Content, Market */}
      <div className="grid lg:grid-cols-3 gap-8">

        {/* Column 1: Próximos Eventos */}
        <section className="flex flex-col h-full">
          <SectionHeader title="Próximos Eventos" linkTo="/eventos" />
          <div className="bg-slate-800 rounded-lg p-4 shadow-xl border border-slate-700 flex-1 flex flex-col gap-4">
            {displayEvents.length > 0 ? (
              displayEvents.map((event) => (
                <div key={event.id} className="bg-slate-700/40 rounded-lg p-3 border border-slate-600/50 hover:border-sky-500/50 transition-colors group">
                  <div className="flex justify-between items-start mb-1">
                    <h3 className="text-white font-bold group-hover:text-sky-400 transition-colors text-sm line-clamp-1">{event.title}</h3>
                    <span className="text-[10px] bg-sky-900/80 text-sky-200 px-1.5 py-0.5 rounded border border-sky-700/50 whitespace-nowrap">{event.format}</span>
                  </div>
                  <div className="text-slate-400 text-xs mb-1">{event.storeName}</div>
                  <div className="text-slate-500 text-[10px] flex items-center gap-1">
                    <span>📅 {event.date}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-slate-400 text-sm text-center py-10">No hay eventos próximos.</p>
            )}
            <div className="mt-auto text-center pt-2">
              <Link to="/eventos" className="text-xs text-sky-500 hover:text-sky-400 underline">Ver todos los eventos</Link>
            </div>
          </div>
        </section>

        {/* Column 2: Contenido Destacado */}
        <section className="flex flex-col h-full">
          <SectionHeader title="Contenido Destacado" linkTo="/media" />
          <div className="bg-slate-800 rounded-lg p-4 shadow-xl border border-slate-700 flex-1 flex flex-col gap-4">
            {mockArticles.slice(0, 6).map((article) => (
              <div key={article.id} className="flex gap-3 bg-slate-700/40 rounded-lg p-2 border border-slate-600/50 hover:bg-slate-700/60 transition-colors group cursor-pointer">
                <div className="w-20 h-20 shrink-0 rounded-md overflow-hidden">
                  <img src={article.imageUrl} alt={article.title} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
                </div>
                <div className="flex-1 flex flex-col justify-between py-0.5">
                  <h3 className="text-white font-bold text-xs leading-snug group-hover:text-green-400 transition-colors line-clamp-2">{article.title}</h3>
                  <div className="flex justify-between items-center text-[10px] text-slate-500 mt-2">
                    <span>{article.author}</span>
                    <span className="bg-slate-700 px-1.5 py-0.5 rounded text-slate-300">{article.category}</span>
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-auto text-center pt-2">
              <Link to="/media" className="text-xs text-green-500 hover:text-green-400 underline">Ver todo el contenido</Link>
            </div>
          </div>
        </section>

        {/* Column 3: Mercado */}
        <section className="flex flex-col h-full">
          <SectionHeader title="Mercado TCG" linkTo="/mercado" />
          <div className="bg-slate-800 rounded-lg p-4 shadow-xl border border-slate-700 flex-1 flex flex-col">
            <ul className="space-y-2 divide-y divide-slate-700/50 mb-2">
              {mockMarketplace.slice(0, 9).map(post => (
                <li key={post.id} className="flex justify-between items-center py-2 first:pt-0 last:pb-0 hover:bg-slate-700/30 px-2 -mx-2 rounded transition-colors cursor-pointer">
                  <div className="flex-1 min-w-0 pr-2">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${post.type === 'Venta' ? 'bg-red-900/40 text-red-300 border-red-800' :
                        post.type === 'Compra' ? 'bg-green-900/40 text-green-300 border-green-800' :
                          'bg-blue-900/40 text-blue-300 border-blue-800'
                        }`}>
                        {post.type.toUpperCase()}
                      </span>
                      <span className="text-slate-500 text-[10px] truncate">{post.region}</span>
                    </div>
                    <p className="text-slate-200 text-sm truncate hover:text-white transition-colors" title={post.title}>{post.title}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-xs block text-right">{post.seller}</span>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-auto text-center pt-2 border-t border-slate-700/50">
              <Link to="/mercado" className="text-xs text-slate-500 hover:text-slate-300 underline">Ver todo el mercado</Link>
            </div>
          </div>
        </section>

      </div>

      {/* Community Stats Section */}
      <section className="mt-24 mb-12 relative px-4">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-900/10 via-purple-900/10 to-blue-900/10 blur-3xl rounded-full opacity-50 -z-10 pointer-events-none"></div>

        <div className="text-center mb-10">
          <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-slate-100 to-slate-400 uppercase tracking-tighter">
            La Comunidad en Cifras
          </h2>
          <p className="text-slate-400 mt-2 font-medium">El ecosistema competitivo más grande de Chile</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {/* Players Stat */}
          <div className="bg-slate-800/40 backdrop-blur-sm p-6 rounded-xl border border-slate-700/50 flex flex-col items-center hover:border-blue-500/50 hover:bg-slate-800/60 transition-all group hover:-translate-y-1 duration-300">
            <div className="p-3 bg-blue-500/10 rounded-full mb-4 group-hover:bg-blue-500/20 transition-colors text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.2)]">
              <UsersIcon className="w-8 h-8" />
            </div>
            <div className="text-4xl font-bold text-white mb-1 tabular-nums tracking-tight">
              <CountUp end={stats.players} />
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

    </div>
  );
};

export default HomePage;