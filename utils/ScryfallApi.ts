// Scryfall API integration for card search
// Documentation: https://scryfall.com/docs/api

export interface ScryfallCard {
    id: string;
    name: string;
    image_uris?: {
        small: string;
        normal: string;
        large: string;
        png: string;
        art_crop: string;
        border_crop: string;
    };
    card_faces?: Array<{
        name: string;
        image_uris?: {
            small: string;
            normal: string;
            large: string;
            png: string;
        };
    }>;
    set_name: string;
    set: string;
    collector_number: string;
    prices: {
        usd?: string;
        usd_foil?: string;
    };
}

export interface CardSearchResult {
    name: string;
    imageUrl: string;
    setName: string;
    price?: string;
}

/**
 * Search for cards by name using Scryfall's autocomplete API
 */
export const searchCardsByName = async (query: string): Promise<CardSearchResult[]> => {
    if (!query || query.length < 2) return [];

    try {
        const response = await fetch(
            `https://api.scryfall.com/cards/search?q=${encodeURIComponent(query)}&unique=prints&order=released`,
            {
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            if (response.status === 404) return []; // No results found
            throw new Error('Error searching cards');
        }

        const data = await response.json();

        return data.data.slice(0, 10).map((card: ScryfallCard) => ({
            name: card.name,
            imageUrl: getCardImageUrl(card),
            setName: card.set_name,
            price: card.prices?.usd
        }));
    } catch (error) {
        console.error('Scryfall API error:', error);
        return [];
    }
};

/**
 * Get the best image URL from a Scryfall card object
 */
const getCardImageUrl = (card: ScryfallCard): string => {
    // For double-faced cards, use the front face
    if (card.card_faces && card.card_faces[0]?.image_uris) {
        return card.card_faces[0].image_uris.normal;
    }

    // For normal cards
    if (card.image_uris) {
        return card.image_uris.normal;
    }

    return '';
};

/**
 * Get exact card by name
 */
export const getCardByName = async (cardName: string): Promise<CardSearchResult | null> => {
    try {
        const response = await fetch(
            `https://api.scryfall.com/cards/named?exact=${encodeURIComponent(cardName)}`,
            {
                headers: {
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) return null;

        const card: ScryfallCard = await response.json();

        return {
            name: card.name,
            imageUrl: getCardImageUrl(card),
            setName: card.set_name,
            price: card.prices?.usd
        };
    } catch (error) {
        console.error('Scryfall API error:', error);
        return null;
    }
};

/**
 * Debounce helper for search input
 */
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) => {
    let timeout: NodeJS.Timeout;

    return (...args: Parameters<T>) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
};
