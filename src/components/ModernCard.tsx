import React from 'react';
import { View, ViewStyle } from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';

interface ModernCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'elevated' | 'gradient' | 'glass';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  borderRadius?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
}

const ModernCard: React.FC<ModernCardProps> = ({
  children,
  style,
  variant = 'default',
  padding = 'md',
  borderRadius = 'md',
}) => {
  const theme = useTheme();

  const getPadding = () => {
    switch (padding) {
      case 'none': return 0;
      case 'sm': return theme.spacing.sm;
      case 'md': return theme.spacing.md;
      case 'lg': return theme.spacing.lg;
      case 'xl': return theme.spacing.xl;
      default: return theme.spacing.md;
    }
  };

  const getBorderRadius = () => {
    switch (borderRadius) {
      case 'sm': return theme.borderRadius.sm;
      case 'md': return theme.borderRadius.md;
      case 'lg': return theme.borderRadius.lg;
      case 'xl': return theme.borderRadius.xl;
      case 'full': return theme.borderRadius.full;
      default: return theme.borderRadius.md;
    }
  };

  const getVariantStyles = () => {
    const baseStyles: ViewStyle = {
      backgroundColor: theme.colors.surface,
      borderRadius: getBorderRadius(),
      padding: getPadding(),
    };

    switch (variant) {
      case 'elevated':
        return {
          ...baseStyles,
          ...theme.shadows.lg,
          borderWidth: 0,
        };
      case 'gradient':
        return {
          ...baseStyles,
          borderWidth: 0,
        };
      case 'glass':
        return {
          ...baseStyles,
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          backdropFilter: 'blur(10px)',
          borderWidth: 1,
          borderColor: 'rgba(255, 255, 255, 0.2)',
          ...theme.shadows.md,
        };
      default:
        return {
          ...baseStyles,
          borderWidth: 1,
          borderColor: theme.colors.border,
          ...theme.shadows.sm,
        };
    }
  };

  const cardStyles = [
    getVariantStyles(),
    style,
  ];

  if (variant === 'gradient') {
    return (
      <LinearGradient
        colors={theme.gradients.primary}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={cardStyles}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View style={cardStyles}>
      {children}
    </View>
  );
};

export default ModernCard;
