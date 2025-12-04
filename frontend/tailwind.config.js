/** @type {import('tailwindcss').Config} */
export default {
  // Enable dark mode with class strategy (toggle between light/dark)
  darkMode: 'class',
  
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  
  theme: {
    extend: {
      // 🌿 NATURE-INSPIRED COLOR PALETTE
      colors: {
        // Grass Green - Primary accent color
        grass: {
          50: '#f0fdf4',   // Very light green
          100: '#dcfce7',  // Light green
          200: '#bbf7d0',  
          300: '#86efac',  
          400: '#4ade80',  // Bright grass green
          500: '#22c55e',  // Main grass green 🌱
          600: '#16a34a',  // Dark grass
          700: '#15803d',  
          800: '#166534',  
          900: '#14532d',  // Deep forest green
        },
        
        // Oak Brown - Secondary/accent color
        oak: {
          50: '#fdf8f6',   // Very light cream
          100: '#f2e8e5', 
          200: '#eaddd7',  
          300: '#e0cec7',  
          400: '#d2bab0',  
          500: '#bfa094',  // Light oak brown
          600: '#a1665e',  // Main oak brown 🌳
          700: '#7f4f3e',  
          800: '#6d4031',  
          900: '#5a3527',  // Dark oak
        },
        
        // Neutral nature tones
        nature: {
          cream: '#faf8f5',    // Light background (like paper)
          sand: '#f5f1ec',     // Slightly darker light bg
          stone: '#e8e4df',    // Light borders
          bark: '#4a4238',     // Dark text
          soil: '#2d2820',     // Darker text
        },
        
        // Dark mode colors
        dark: {
          bg: '#1a1614',       // Dark brown-black
          surface: '#252220',  // Elevated surface
          elevated: '#2f2d2a', // More elevated
          border: '#3d3834',   // Border
          hover: '#454139',    // Hover state
        }
      },
      
      // 🎮 FUN PIXEL FONTS
      fontFamily: {
        // Primary fun font (will load from Google Fonts)
        fun: ['"Press Start 2P"', 'cursive'],
        
        // Readable pixel-style font
        pixel: ['"Pixelify Sans"', 'sans-serif'],
        
        // Fallback to clean sans-serif
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      
      // 🎪 BOUNCY ANIMATION CONFIGS
      animation: {
        'bounce-gentle': 'bounce-gentle 0.6s ease-in-out',
        'slide-in': 'slide-in 0.3s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'pop-in': 'pop-in 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
        'wiggle': 'wiggle 0.5s ease-in-out',
      },
      
      keyframes: {
        'bounce-gentle': {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'slide-in': {
          '0%': { transform: 'translateX(-100%)', opacity: '0' },
          '100%': { transform: 'translateX(0)', opacity: '1' },
        },
        'pop-in': {
          '0%': { transform: 'scale(0.8)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'wiggle': {
          '0%, 100%': { transform: 'rotate(0deg)' },
          '25%': { transform: 'rotate(-5deg)' },
          '75%': { transform: 'rotate(5deg)' },
        },
      },
      
      // Rounded corners everywhere
      borderRadius: {
        'xl': '1rem',
        '2xl': '1.5rem',
        '3xl': '2rem',
      }
    },
  },
  plugins: [],
}

