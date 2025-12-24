import React, { useState, useEffect } from 'react';
import { searchCardsByName, debounce, type CardSearchResult } from '../utils/ScryfallApi';

interface CardSearchInputProps {
    onCardSelect: (card: CardSearchResult) => void;
    placeholder?: string;
    disabled?: boolean;
}

const CardSearchInput: React.FC<CardSearchInputProps> = ({
    onCardSelect,
    placeholder = "Buscar carta...",
    disabled = false
}) => {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<CardSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [showResults, setShowResults] = useState(false);

    // Debounced search function
    const debouncedSearch = debounce(async (searchQuery: string) => {
        if (searchQuery.length < 2) {
            setResults([]);
            setIsSearching(false);
            return;
        }

        setIsSearching(true);
        const cards = await searchCardsByName(searchQuery);
        setResults(cards);
        setIsSearching(false);
        setShowResults(true);
    }, 500);

    useEffect(() => {
        debouncedSearch(query);
    }, [query]);

    const handleSelect = (card: CardSearchResult) => {
        onCardSelect(card);
        setQuery('');
        setResults([]);
        setShowResults(false);
    };

    return (
        <div className="relative">
            <div className="relative">
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setShowResults(true)}
                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 transition text-white placeholder-slate-500 pr-10"
                />
                {isSearching && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <div className="w-5 h-5 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                )}
            </div>

            {/* Results Dropdown */}
            {showResults && results.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl max-h-96 overflow-y-auto">
                    {results.map((card, index) => (
                        <button
                            key={index}
                            type="button"
                            onClick={() => handleSelect(card)}
                            className="w-full flex items-center gap-3 p-3 hover:bg-slate-700 transition-colors text-left border-b border-slate-700 last:border-b-0"
                        >
                            {card.imageUrl && (
                                <img
                                    src={card.imageUrl}
                                    alt={card.name}
                                    className="w-16 h-auto rounded border border-slate-600"
                                />
                            )}
                            <div className="flex-1 min-w-0">
                                <p className="text-white font-medium truncate">{card.name}</p>
                                <p className="text-slate-400 text-xs truncate">{card.setName}</p>
                                {card.price && (
                                    <p className="text-green-400 text-xs font-bold mt-0.5">
                                        ${card.price} USD
                                    </p>
                                )}
                            </div>
                        </button>
                    ))}
                </div>
            )}

            {/* No Results */}
            {showResults && query.length >= 2 && !isSearching && results.length === 0 && (
                <div className="absolute z-50 w-full mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-2xl p-4 text-center">
                    <p className="text-slate-400 text-sm">No se encontraron cartas</p>
                </div>
            )}
        </div>
    );
};

export default CardSearchInput;
