import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GameType } from '../types';

interface GameContextType {
    currentGame: GameType;
    setGame: (game: GameType) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    // Current application is locked to Magic: The Gathering
    const [currentGame] = useState<GameType>('mtg');

    const setGame = (game: GameType) => {
        console.warn('Game selection is currently disabled. Locked to mtg.');
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
