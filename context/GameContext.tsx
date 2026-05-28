import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GameType } from '../types';

interface GameContextType {
    currentGame: GameType;
    setGame: (game: GameType) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentGame, setCurrentGameState] = useState<GameType>(() => {
        const saved = localStorage.getItem('app_game');
        return (saved ? saved as GameType : 'mtg');
    });

    const setGame = (game: GameType) => {
        setCurrentGameState(game);
        localStorage.setItem('app_game', game);
    };

    return (
        <GameContext.Provider value={{ currentGame, setGame }}>
            {children}
        </GameContext.Provider>
    );
};

export const useGame = () => {
    const context = useContext(GameContext);
    if (context === undefined) {
        throw new Error('useGame must be used within a GameProvider');
    }
    return context;
};
