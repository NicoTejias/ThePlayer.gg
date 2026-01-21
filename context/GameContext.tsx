import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GameType } from '../types';

interface GameContextType {
    currentGame: GameType;
    setGame: (game: GameType) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [currentGame, setCurrentGame] = useState<GameType>(() => {
        const saved = localStorage.getItem('selectedGame');
        return (saved as GameType) || 'mtg';
    });

    // Remove the automatic useEffect sync which causes default 'mtg' to be written to empty storage on boot
    // useEffect(() => {
    //     localStorage.setItem('selectedGame', currentGame);
    // }, [currentGame]);

    const setGame = (game: GameType) => {
        localStorage.setItem('selectedGame', game);
        setCurrentGame(game);
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
