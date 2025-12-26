/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
        "./pages/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
        "./app/**/*.{js,ts,jsx,tsx}",
        "./**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Map standard colors to variables for global theming
                slate: {
                    900: 'var(--bg-base)',
                    800: 'var(--bg-secondary)',
                    200: '#e2e8f0', // Keep text light
                    400: '#94a3b8',
                    500: '#64748b',
                    700: '#334155',
                },
                sky: {
                    500: 'var(--color-accent)',
                    600: 'var(--color-accent-hover)',
                },
                blue: { // Map blue too since it's used interchangeably
                    500: 'var(--color-accent)',
                    600: 'var(--color-accent-hover)',
                },
                // Semantic aliases
                'player-dark': 'var(--bg-base)',
                'player-accent': 'var(--color-accent)',
                'player-accent-hover': 'var(--color-accent-hover)',
                'player-secondary': 'var(--bg-secondary)',
            },
        },
    },
    plugins: [],
}
