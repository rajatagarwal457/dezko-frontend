/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './app/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Nunito', 'sans-serif'],
            },
            colors: {
                vireo: {
                    teal: '#4ECDC4',
                    pink: '#FF6B6B',
                    purple: '#845EC2',
                    yellow: '#FFE66D',
                    orange: '#FF9F1C',
                    offwhite: '#F7F7F7',
                    dark: '#292F36'
                }
            },
            animation: {
                'bounce-slow': 'bounce 3s infinite',
                'wiggle': 'wiggle 1s ease-in-out infinite',
                'spin-slow': 'spin 3s linear infinite',
                'pulse-fast': 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            },
            keyframes: {
                wiggle: {
                    '0%, 100%': { transform: 'rotate(-3deg)' },
                    '50%': { transform: 'rotate(3deg)' },
                }
            }
        }
    },
    plugins: [],
}
