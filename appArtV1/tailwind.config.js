/** @type {import('tailwindcss').Config} */
module.exports = {
  // NOTE: Content paths are relative to the project root
  content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  darkMode: 'class',
  theme: {
    extend: {
      // Luxury Color System
      colors: {
        // Light Mode (Gallery-grade neutrals)
        background: {
          DEFAULT: '#F7F4EF', // Warm paper background
          secondary: '#FFFFFF', // Pure white surfaces
        },
        surface: {
          DEFAULT: '#FFFFFF',
          secondary: '#FAF8F4',
          tertiary: '#F4F1EB',
        },
        // Luxury Theme - Exact Gallery Palette
        app: '#F7F4EF', // Warm paper background (primary background)
        text: {
          primary: '#121212',    // Deep charcoal (exact spec)
          secondary: '#5B5B5B',  // Medium gray (exact spec)
          tertiary: '#8B8B8B',   // Light gray
          inverse: '#FFFFFF',
        },
        hairline: 'rgba(18,18,18,0.08)', // Hairline borders (exact spec)
        accent: {
          DEFAULT: '#1E2A44',    // Deep ink navy (main CTA)
          navy: '#1E2A44',       // Deep ink navy (alias)
          success: '#2F7D5A',   // Muted green
          warning: '#B9822C',   // Muted amber (exact spec)
          danger: '#A43A3A',   // Muted red
        },

        // Dark Mode (Premium dark theme)
        dark: {
          background: {
            DEFAULT: '#0B0D10', // Deep charcoal
            secondary: '#11141A', // Dark surface
          },
          surface: {
            DEFAULT: '#11141A',
            secondary: '#1A1F26',
            tertiary: '#232832',
          },
          text: {
            primary: '#F4F4F4',   // Off-white
            secondary: '#B8B8B8', // Medium gray
            tertiary: '#8B8B8B',  // Light gray
          },
          border: {
            DEFAULT: 'rgba(244,244,244,0.08)',
            light: 'rgba(244,244,244,0.04)',
            dark: 'rgba(244,244,244,0.12)',
          },
        },
      },

      // Luxury Typography Scale
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', 'system-ui', 'sans-serif'],
        display: ['Inter', 'SF Pro Display', 'serif'], // For elegant headings
      },
      fontSize: {
        // Hero scale (gallery-grade impact)
        'hero': ['2.5rem', { lineHeight: '1.1', letterSpacing: '-0.025em' }], // 40px
        'hero-sm': ['2rem', { lineHeight: '1.15', letterSpacing: '-0.02em' }], // 32px

        // Section headers (semi-bold, prominent)
        'section': ['1.25rem', { lineHeight: '1.3', letterSpacing: '-0.01em' }], // 20px
        'section-sm': ['1.125rem', { lineHeight: '1.35', letterSpacing: '-0.005em' }], // 18px

        // Body text (comfortable reading)
        'body': ['1rem', { lineHeight: '1.5' }], // 16px
        'body-sm': ['0.9375rem', { lineHeight: '1.55' }], // 15px

        // Captions and metadata
        'caption': ['0.8125rem', { lineHeight: '1.4', letterSpacing: '0.01em' }], // 13px
        'caption-sm': ['0.75rem', { lineHeight: '1.45', letterSpacing: '0.015em' }], // 12px

        // Small labels (caps with spacing)
        'label': ['0.6875rem', { lineHeight: '1.2', letterSpacing: '0.05em' }], // 11px
      },
      fontWeight: {
        thin: '100',
        light: '300',
        normal: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
        black: '900',
      },

      // Luxury Spacing System (4/8/12/16/24/32)
      spacing: {
        'px': '1px',
        '0': '0',
        '1': '0.25rem',    // 4px
        '2': '0.5rem',     // 8px
        '3': '0.75rem',    // 12px
        '4': '1rem',       // 16px
        '5': '1.25rem',    // 20px
        '6': '1.5rem',     // 24px
        '8': '2rem',       // 32px
        '10': '2.5rem',    // 40px
        '12': '3rem',      // 48px
        '16': '4rem',      // 64px
        '20': '5rem',      // 80px
        '24': '6rem',      // 96px
      },

      // Luxury Border Radius (Exact Specs)
      borderRadius: {
        'none': '0',
        'sm': '0.25rem',     // 4px
        'DEFAULT': '0.5rem', // 8px
        'md': '0.75rem',     // 12px
        'input': '0.875rem', // 14px (Input radius - exact spec)
        'button': '1rem',    // 16px (Button radius - exact spec)
        'card': '1.125rem',  // 18px (Card radius - exact spec)
        'lg': '1.125rem',    // 18px (alias for card)
        'xl': '1.25rem',     // 20px
        '2xl': '1.375rem',   // 22px
        'full': '9999px',
      },

      // Premium Shadow System
      boxShadow: {
        'none': '0 0 #0000',
        'xs': '0 1px 2px 0 rgba(17, 17, 17, 0.04)',
        'sm': '0 1px 3px 0 rgba(17, 17, 17, 0.08), 0 1px 2px -1px rgba(17, 17, 17, 0.04)',
        'DEFAULT': '0 4px 6px -1px rgba(17, 17, 17, 0.06), 0 2px 4px -2px rgba(17, 17, 17, 0.04)',
        'md': '0 10px 15px -3px rgba(17, 17, 17, 0.06), 0 4px 6px -4px rgba(17, 17, 17, 0.04)',
        'lg': '0 20px 25px -5px rgba(17, 17, 17, 0.06), 0 8px 10px -6px rgba(17, 17, 17, 0.04)',
        'xl': '0 25px 50px -12px rgba(17, 17, 17, 0.12)',

        // Glass effect shadows (subtle)
        'glass': '0 8px 32px 0 rgba(17, 17, 17, 0.04), inset 0 1px 0 rgba(255, 255, 255, 0.1)',
        'glass-lg': '0 20px 40px 0 rgba(17, 17, 17, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
      },

      // Animation durations (luxury motion: 150-220ms)
      transitionDuration: {
        '75': '75ms',
        '100': '100ms',
        '150': '150ms', // Default luxury transition
        '200': '200ms', // Slightly slower for elegance
        '220': '220ms', // Maximum luxury duration
      },

      // Custom animations for micro-interactions
      keyframes: {
        'scale-in': {
          '0%': { transform: 'scale(0.95)', opacity: '0' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
        'fade-in-up': {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        'shimmer': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        'scale-in': 'scale-in 150ms ease-out',
        'fade-in-up': 'fade-in-up 200ms ease-out',
        'shimmer': 'shimmer 1.5s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

