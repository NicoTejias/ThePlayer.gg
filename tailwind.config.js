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
                'player-dark': '#0f172a',
                'player-accent': '#3b82f6',
                'player-secondary': '#1e293b',
            },
            fontFamily: {
                'display': ['Cinzel', 'Georgia', 'serif'],
                'body': ['Rajdhani', 'system-ui', 'sans-serif'],
                'mono': ['JetBrains Mono', 'monospace'],
            },
            letterSpacing: {
                'ultra': '0.25em',
                'mega': '0.35em',
            },
            boxShadow: {
                'accent': '0 0 30px -5px var(--color-accent)',
                'accent-lg': '0 0 60px -10px var(--color-accent)',
                'glow-sm': '0 0 15px var(--border-glow)',
                'inner-glow': 'inset 0 1px 0 rgba(255,255,255,0.07)',
            },
            backgroundImage: {
                'noise': "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
            },
            animation: {
                'shimmer': 'shimmer 2.5s linear infinite',
                'glow-pulse': 'glow-pulse 3s ease-in-out infinite',
                'slide-right': 'slide-right 0.4s cubic-bezier(0.4,0,0.2,1) forwards',
            },
            keyframes: {
                shimmer: {
                    '0%': { backgroundPosition: '-200% center' },
                    '100%': { backgroundPosition: '200% center' },
                },
                'glow-pulse': {
                    '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
                    '50%': { opacity: '1', transform: 'scale(1.02)' },
                },
                'slide-right': {
                    from: { opacity: '0', transform: 'translateX(-12px)' },
                    to: { opacity: '1', transform: 'translateX(0)' },
                },
            },
        },
    },
    plugins: [],
}
