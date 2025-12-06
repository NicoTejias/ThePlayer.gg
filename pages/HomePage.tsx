import React from 'react';
import { Link } from 'react-router-dom';
import type { RankingEntry, CommunityEvent, MediaArticle, MarketplacePost, WinRateRankingEntry } from '../types';
import Card from '../components/Card';
import TrophyIcon from '../components/icons/TrophyIcon';
import SparklesIcon from '../components/icons/SparklesIcon';

// Mock Data
const mockRanking: RankingEntry[] = [
  { rank: 1, playerName: 'MageSlayer92', pwp: 1250, region: 'Santiago' },
  { rank: 2, playerName: 'ElfoNocturno', pwp: 1180, region: 'Valparaíso' },
  { rank: 3, playerName: 'GoblinKing', pwp: 1155, region: 'Concepción' },
  { rank: 4, playerName: 'AetherFlux', pwp: 1090, region: 'Antofagasta' },
  { rank: 5, playerName: 'JaceMind', pwp: 1075, region: 'Santiago' },
];

const mockWinRateRanking: WinRateRankingEntry[] = [
  { rank: 1, playerName: 'ProdigyMTG', winRate: '78.5%', region: 'Viña del Mar' },
  { rank: 2, playerName: 'Strategist', winRate: '75.2%', region: 'Santiago' },
  { rank: 3, playerName: 'LaHechicera', winRate: '74.9%', region: 'La Serena' },
  { rank: 4, playerName: 'ControlFreak', winRate: '72.1%', region: 'Temuco' },
  { rank: 5, playerName: 'ComboMaster', winRate: '71.8%', region: 'Santiago' },
];

const mockEvents: CommunityEvent[] = [
  // FIX: Changed property `store` to `storeName` to conform to the CommunityEvent type.
  { id: '1', title: 'Clasificatorio Nacional', date: '25 DIC 2024', storeName: 'Magicsur', format: 'Standard', imageUrl: 'https://picsum.photos/seed/event1/400/300', playerCount: 64 },
  // FIX: Changed property `store` to `storeName` to conform to the CommunityEvent type.
  { id: '2', title: 'Store Championship', date: '28 DIC 2024', storeName: 'Guildreams', format: 'Modern', imageUrl: 'https://picsum.photos/seed/event2/400/300', playerCount: 32 },
  // FIX: Changed property `store` to `storeName` to conform to the CommunityEvent type.
  { id: '3', title: 'FNM Draft', date: '30 DIC 2024', storeName: 'Ouroboros', format: 'Draft', imageUrl: 'https://picsum.photos/seed/event3/400/300', playerCount: 16 },
];

const mockArticles: MediaArticle[] = [
    { id: '1', title: 'Análisis del Metajuego Moderno Post-Baneos', author: 'Admin', excerpt: 'Exploramos cómo los últimos cambios han afectado el panorama competitivo de Modern.', imageUrl: 'https://picsum.photos/seed/article1/400/300', category: 'Modern' },
    { id: '2', title: 'Top 5 Cartas de Commander que Deberías Jugar', author: 'Invitado', excerpt: 'Un ranking de las cartas más impactantes y versátiles para tu próximo mazo de Commander.', imageUrl: 'https://picsum.photos/seed/article2/400/300', category: 'Commander' },
];

// FIX: Added missing region and imageUrl properties to mockMarketplace objects to conform to MarketplacePost type.
const mockMarketplace: MarketplacePost[] = [
    {id: '1', title: 'Busco Force of Will', type: 'Compra', seller: 'User123', region: 'Metropolitana', imageUrl: 'https://picsum.photos/seed/market1/400/300'},
    {id: '2', title: 'Vendo fetchlands de Modern Horizons 2', type: 'Venta', seller: 'CardTraderCL', region: 'Valparaíso', imageUrl: 'https://picsum.photos/seed/market2/400/300'},
    {id: '3', title: 'Cambio Ragavan por Solitude', type: 'Cambio', seller: 'ProPlayer', region: 'Biobío', imageUrl: 'https://picsum.photos/seed/market3/400/300'},
];

const SectionHeader: React.FC<{title: string, linkTo: string}> = ({title, linkTo}) => (
    <div className="flex justify-between items-center mb-6">
        <h2 className="text-3xl font-bold text-white uppercase tracking-wider">{title}</h2>
        <Link to={linkTo} className="text-sky-400 hover:text-sky-300 transition-colors">
            Ver más &rarr;
        </Link>
    </div>
);


const HomePage: React.FC = () => {
  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center bg-slate-800 p-10 rounded-lg shadow-2xl border border-slate-700">
        <h1 className="text-5xl font-bold text-white tracking-tighter">BIENVENIDO A THEPLAYER.GG</h1>
        <p className="text-xl text-slate-300 mt-4 max-w-3xl mx-auto">
          El hub central de la comunidad de Trading Card Games en Chile. Rankings, eventos, contenido y mucho más.
        </p>
        <div className="mt-8">
          <Link to="/#register" className="bg-sky-500 text-white font-bold py-3 px-8 rounded-md hover:bg-sky-600 transition duration-300 text-lg">
            Únete a la Comunidad
          </Link>
        </div>
      </section>
      
      {/* Rankings Section Grid */}
      <div className="grid lg:grid-cols-2 gap-16">
        {/* Ranking The Player (PWP) Section */}
        <section>
          <SectionHeader title="Ranking The Player" linkTo="/ranking/pwp" />
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700 h-full">
            <ul className="space-y-4">
              {mockRanking.map((player, index) => (
                <li key={player.playerName} className={`flex items-center justify-between p-3 rounded-md ${index < 3 ? 'bg-slate-700/50' : ''}`}>
                  <div className="flex items-center space-x-4">
                    <span className={`text-xl font-bold w-8 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-yellow-600' : 'text-slate-400'}`}>
                      {player.rank}
                    </span>
                    <span className="text-lg text-white">{player.playerName}</span>
                    <span className="text-sm text-slate-400 bg-slate-700 px-2 py-1 rounded">{player.region}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-sky-400 font-semibold">
                    <span>{player.pwp} pts</span>
                    <TrophyIcon className="w-5 h-5" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* Ranking Caminante de Planos (Win-Rate) Section */}
        <section>
          <SectionHeader title="Ranking Caminante de Planos" linkTo="/ranking/pwp" />
          <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700 h-full">
            <ul className="space-y-4">
              {mockWinRateRanking.map((player, index) => (
                <li key={player.playerName} className={`flex items-center justify-between p-3 rounded-md ${index < 3 ? 'bg-slate-700/50' : ''}`}>
                  <div className="flex items-center space-x-4">
                    <span className={`text-xl font-bold w-8 text-center ${index === 0 ? 'text-yellow-400' : index === 1 ? 'text-slate-300' : index === 2 ? 'text-yellow-600' : 'text-slate-400'}`}>
                      {player.rank}
                    </span>
                    <span className="text-lg text-white">{player.playerName}</span>
                    <span className="text-sm text-slate-400 bg-slate-700 px-2 py-1 rounded">{player.region}</span>
                  </div>
                  <div className="flex items-center space-x-2 text-violet-400 font-semibold">
                    <span>{player.winRate} Win Rate</span>
                    <SparklesIcon className="w-5 h-5" />
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* Events Section */}
      <section>
        <SectionHeader title="Próximos Eventos" linkTo="/eventos" />
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {mockEvents.map((event) => (
            // FIX: The imageUrl property is optional in CommunityEvent type. Added non-null assertion as it's guaranteed in this mock data.
            <Card key={event.id} imageUrl={event.imageUrl!} title={event.title}>
              {/* FIX: Changed event.store to event.storeName to conform to the CommunityEvent type. */}
              <p className="text-slate-400">{event.storeName}</p>
              <p>{event.date}</p>
              <div className="mt-4">
                <span className="inline-block bg-sky-800 rounded-full px-3 py-1 text-sm font-semibold text-sky-200 mr-2 mb-2">{event.format}</span>
              </div>
            </Card>
          ))}
        </div>
      </section>

      {/* Media & Marketplace Section */}
      <div className="grid lg:grid-cols-2 gap-16">
        {/* Media Section */}
        <section>
          <SectionHeader title="Contenido Destacado" linkTo="/media" />
          <div className="space-y-8">
            {mockArticles.map((article) => (
                <Card key={article.id} imageUrl={article.imageUrl} title={article.title}>
                    <p className="text-slate-400">{article.excerpt}</p>
                    <div className="mt-4 font-semibold text-sm text-slate-500">
                        Por: {article.author}
                    </div>
                </Card>
            ))}
          </div>
        </section>

        {/* Marketplace Section */}
        <section>
          <SectionHeader title="Mercado" linkTo="/mercado" />
           <div className="bg-slate-800 rounded-lg p-6 shadow-xl border border-slate-700">
                <ul className="space-y-3">
                    {mockMarketplace.map(post => (
                        <li key={post.id} className="flex justify-between items-center p-3 bg-slate-700/50 rounded-md">
                            <div>
                                <span className={`font-bold text-sm px-2 py-1 rounded-full ${
                                    post.type === 'Venta' ? 'bg-red-500/20 text-red-300' : 
                                    post.type === 'Compra' ? 'bg-green-500/20 text-green-300' : 
                                    'bg-blue-500/20 text-blue-300'
                                }`}>
                                    {post.type}
                                </span>
                                <p className="text-white mt-1">{post.title}</p>
                            </div>
                            <span className="text-slate-400 text-sm">{post.seller}</span>
                        </li>
                    ))}
                </ul>
           </div>
        </section>
      </div>

    </div>
  );
};

export default HomePage;