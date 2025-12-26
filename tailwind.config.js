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
        colors: {
            'player-dark': 'var(--bg-base)',
            'player-accent': 'var(--color-accent)',
            'player-accent-hover': 'var(--color-accent-hover)', // New hover state
            'player-secondary': 'var(--bg-secondary)',
        },
    },
    plugins: [],
}
