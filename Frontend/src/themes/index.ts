export const theme = {
  colors: {
    // Neon Cyan Theme - Premium Medical App
    primary: '#00FFFF', // Bright neon cyan
    primaryDark: '#00CCCC', // Darker neon cyan variant
    primaryLight: '#33FFFF', // Lighter neon cyan variant
    primaryMuted: '#00E6E6', // Muted neon cyan for backgrounds
    primaryAlpha: 'rgba(0, 255, 255, 0.1)', // Subtle neon cyan alpha
    primaryAlphaDark: 'rgba(0, 255, 255, 0.2)', // Darker neon cyan alpha for cards

    background: '#0A0F1A', // Dark background for neon contrast
    backgroundSecondary: '#0F1419', // Slightly lighter dark background
    surface: '#FFFFFF', // Clean white surfaces
    surfaceSecondary: '#F8FAFC', // Subtle light surface

    muted: '#1A1F2E', // Muted dark background
    border: 'rgba(0, 255, 255, 0.2)', // Neon cyan borders
    borderLight: 'rgba(0, 255, 255, 0.1)', // Lighter neon cyan borders

    foreground: '#FFFFFF', // White text for dark backgrounds
    foregroundSecondary: 'rgba(255, 255, 255, 0.8)', // Semi-transparent white
    foregroundMuted: 'rgba(255, 255, 255, 0.6)', // Muted white text

    // Medical Theme Extensions (keeping medical colors but updating primary)
    medicalPrimary: '#00FFFF',
    medicalSecondary: '#33FFFF',
    medicalAccent: 'rgba(0, 255, 255, 0.3)',
    medicalSuccess: '#00FF88', // Neon green for success
    medicalWarning: '#FFAA00', // Neon orange for warnings
    medicalError: '#FF0066', // Neon pink for errors
    medicalInfo: '#00AAFF', // Neon blue for info

    // Gradient Colors - Neon Cyan Variations
    gradientStart: '#00FFFF',
    gradientEnd: '#33FFFF',
    gradientSecondary: ['#00CCCC', '#00FFFF'],

    // Status colors
    success: '#00FF88',
    warning: '#FFAA00',
    error: '#FF0066',
    info: '#00AAFF',

    // Enhanced grays for dark theme
    gray: {
      50: '#0A0F1A',
      100: '#0F1419',
      200: '#1A1F2E',
      300: '#2A2F3E',
      400: '#3A3F4E',
      500: '#5A5F6E',
      600: '#7A7F8E',
      700: '#9A9FAE',
      800: '#BABFCE',
      900: '#DADFEE',
    },

    // Performance Indicators
    latencyExcellent: '#00FFFF',
    latencyGood: '#33FFFF',
    latencyFair: '#FFAA00',
    latencyPoor: '#FF0066',
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
    xxxl: 64,
  },

  borderRadius: {
    sm: 6,
    md: 12,
    lg: 16,
    xl: 20,
    xxl: 24,
    full: 9999,
  },

  typography: {
    fontSize: {
      xs: 12,
      sm: 14,
      md: 16,
      lg: 18,
      xl: 20,
      xxl: 24,
      xxxl: 32,
      huge: 40,
    },
    fontWeight: {
      light: '300' as const,
      normal: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      extrabold: '800' as const,
    },
    lineHeight: {
      tight: 1.2,
      normal: 1.4,
      relaxed: 1.6,
      loose: 1.8,
    },
  },

  shadows: {
    none: {
      shadowColor: 'transparent',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0,
      shadowRadius: 0,
      elevation: 0,
    },
    sm: {
      shadowColor: 'rgba(0, 0, 0, 0.08)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 4,
      elevation: 2,
    },
    md: {
      shadowColor: 'rgba(0, 0, 0, 0.12)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.12,
      shadowRadius: 8,
      elevation: 4,
    },
    lg: {
      shadowColor: 'rgba(0, 0, 0, 0.16)',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.16,
      shadowRadius: 16,
      elevation: 8,
    },
    xl: {
      shadowColor: 'rgba(0, 0, 0, 0.20)',
      shadowOffset: { width: 0, height: 16 },
      shadowOpacity: 0.20,
      shadowRadius: 24,
      elevation: 12,
    },
    inner: {
      shadowColor: 'rgba(0, 0, 0, 0.06)',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 4,
      elevation: 0,
    },
    colored: {
      shadowColor: '#00FFFF',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
      elevation: 6,
    },
    neon: {
      shadowColor: '#00FFFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.5,
      shadowRadius: 20,
      elevation: 8,
    },
    neonGlow: {
      shadowColor: '#00FFFF',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8,
      shadowRadius: 30,
      elevation: 10,
    },
  },

  gradients: {
    primary: ['#00FFFF', '#33FFFF'], // Neon cyan gradient
    secondary: ['#00CCCC', '#00FFFF'], // Darker to brighter neon cyan
    tertiary: ['#00E6E6', '#00FFFF'], // Muted to bright neon cyan
    surface: ['#FFFFFF', '#F8FAFC'],
    neon: ['#00FFFF', '#00CCCC', '#00FFFF'], // Multi-stop neon gradient
    dark: ['#0A0F1A', '#0F1419'], // Dark background gradient
  },
};

export type Theme = typeof theme;
