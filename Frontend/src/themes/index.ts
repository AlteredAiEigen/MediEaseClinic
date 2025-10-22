export const theme = {
  colors: {
    // Modern Medical Theme - Higher contrast for better visibility
    primary: 'hsl(174, 72%, 40%)', // Darker teal for better contrast
    primaryDark: 'hsl(174, 72%, 30%)', // Even darker teal for depth
    primaryLight: 'hsl(174, 60%, 50%)', // Lighter teal but still good contrast

    background: 'hsl(210, 25%, 98%)', // More neutral background
    backgroundSecondary: 'hsl(210, 15%, 95%)', // Slightly different background
    surface: '#FFFFFF', // Clean white surfaces
    surfaceSecondary: 'hsl(210, 10%, 97%)', // Subtle surface

    muted: 'hsl(210, 15%, 90%)', // Muted background
    border: 'hsl(214, 32%, 80%)', // Higher contrast borders
    borderLight: 'hsl(214, 20%, 85%)', // Lighter but visible borders

    foreground: 'hsl(210, 25%, 10%)', // Darker text for better contrast
    foregroundSecondary: 'hsl(210, 15%, 25%)', // Darker secondary text
    foregroundMuted: 'hsl(210, 10%, 40%)', // Darker muted text

    // Medical Theme Extensions
    medicalPrimary: 'hsl(174, 72%, 50%)',
    medicalSecondary: 'hsl(172, 60%, 75%)',
    medicalAccent: 'hsl(176, 68%, 85%)',
    medicalSuccess: 'hsl(142, 76%, 40%)',
    medicalWarning: 'hsl(38, 92%, 50%)',
    medicalError: 'hsl(0, 84%, 60%)',
    medicalInfo: 'hsl(199, 89%, 48%)',

    // Gradient Colors
    gradientStart: 'hsl(174, 72%, 50%)',
    gradientEnd: 'hsl(176, 68%, 70%)',
    gradientSecondary: 'hsl(172, 60%, 75%)',

    // Status colors
    success: 'hsl(142, 76%, 40%)',
    warning: 'hsl(38, 92%, 50%)',
    error: 'hsl(0, 84%, 60%)',
    info: 'hsl(199, 89%, 48%)',

    // Enhanced grays
    gray: {
      50: 'hsl(210, 20%, 98%)',
      100: 'hsl(210, 15%, 95%)',
      200: 'hsl(210, 10%, 89%)',
      300: 'hsl(210, 8%, 75%)',
      400: 'hsl(210, 8%, 56%)',
      500: 'hsl(210, 6%, 43%)',
      600: 'hsl(210, 8%, 35%)',
      700: 'hsl(210, 10%, 25%)',
      800: 'hsl(210, 15%, 16%)',
      900: 'hsl(210, 20%, 10%)',
    },

    // Performance Indicators
    latencyExcellent: 'hsl(174, 72%, 40%)',
    latencyGood: 'hsl(174, 65%, 50%)',
    latencyFair: 'hsl(38, 92%, 50%)',
    latencyPoor: 'hsl(0, 84%, 60%)',
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
      shadowColor: 'hsl(174, 72%, 50%)',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 6,
    },
  },

  gradients: {
    primary: ['hsl(174, 72%, 50%)', 'hsl(176, 68%, 70%)'],
    secondary: ['hsl(172, 60%, 75%)', 'hsl(174, 72%, 50%)'],
    surface: ['#FFFFFF', 'hsl(174, 10%, 97%)'],
  },
};

export type Theme = typeof theme;
