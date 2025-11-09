
export interface RankingEntry {
  rank: number;
  playerName: string;
  pwp: number;
  region: string;
}

export interface CommunityEvent {
  id: string;
  title: string;
  date: string;
  store: string;
  format: string;
  imageUrl: string;
}

export interface MediaArticle {
  id: string;
  title:string;
  author: string;
  excerpt: string;
  imageUrl: string;
}

export interface MarketplacePost {
  id: string;
  title: string;
  type: 'Venta' | 'Compra' | 'Cambio';
  seller: string;
}
