import React, { useCallback, useMemo } from 'react';
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Container, Engine } from "tsparticles-engine";
import { useGame } from '../context/GameContext';

// Define theme colors matching index.css
const themeConfigs: Record<string, { bg: string; accent: string; secondary: string }> = {
    mtg: { bg: "#0f172a", accent: "#3b82f6", secondary: "#60a5fa" },      // Blue
    pokemon: { bg: "#18181b", accent: "#eab308", secondary: "#facc15" },  // Yellow
    one_piece: { bg: "#1c1917", accent: "#ef4444", secondary: "#f87171" }, // Red
    lorcana: { bg: "#1e1b4b", accent: "#f59e0b", secondary: "#fbbf24" },  // Amber/Gold
    star_wars: { bg: "#000000", accent: "#06b6d4", secondary: "#22d3ee" }, // Cyan
    yugioh: { bg: "#1e1b4b", accent: "#a855f7", secondary: "#c084fc" },   // Purple
    flesh_blood: { bg: "#450a0a", accent: "#f87171", secondary: "#fca5a5" }, // Red/Crimson
    digimon: { bg: "#0c4a6e", accent: "#fb923c", secondary: "#fdba74" }    // Orange
};

const ParticlesBackground: React.FC = () => {
    const { currentGame } = useGame();

    const particlesInit = useCallback(async (engine: Engine) => {
        await loadSlim(engine);
    }, []);

    const particlesLoaded = useCallback(async (container: Container | undefined) => {
        // console.log(container);
    }, []);

    // Get current theme colors or fallback to MTG (default)
    const currentTheme = themeConfigs[currentGame] || themeConfigs.mtg;

    const options = useMemo(() => ({
        background: {
            // Transparent so the animated gradient background (AnimatedBackground) shows through.
            // This also fixes light mode, where a hardcoded dark canvas used to keep the page dark.
            color: {
                value: "transparent",
            },
        },
        fpsLimit: 120,
        interactivity: {
            events: {
                onClick: {
                    enable: true,
                    mode: "push",
                },
                onHover: {
                    enable: true,
                    mode: ["repulse", "bubble"],
                },
                resize: true,
            },
            modes: {
                push: {
                    quantity: 4,
                },
                repulse: {
                    distance: 100,
                    duration: 0.4,
                },
                bubble: {
                    distance: 200,
                    size: 6,
                    duration: 0.4,
                    opacity: 0.8,
                    color: {
                        value: currentTheme.secondary // Use secondary color for interactive bubble
                    }
                },
            },
        },
        particles: {
            color: {
                value: currentTheme.accent, // Use accent color for particles
            },
            links: {
                color: "#ffffff",
                distance: 150,
                enable: true,
                opacity: 0.1,
                width: 1,
            },
            move: {
                direction: "none" as const,
                enable: true,
                outModes: {
                    default: "bounce" as const,
                },
                random: false,
                speed: 1,
                straight: false,
            },
            number: {
                density: {
                    enable: true,
                    area: 800,
                },
                value: 60,
            },
            opacity: {
                value: 0.3,
            },
            shape: {
                type: "circle",
            },
            size: {
                value: { min: 1, max: 3 },
            },
        },
        detectRetina: true,
    }), [currentTheme]);

    return (
        <Particles
            id="tsparticles"
            init={particlesInit}
            loaded={particlesLoaded}
            className="absolute inset-0 -z-10 h-full w-full"
            options={options}
        />
    );
};

export default ParticlesBackground;
