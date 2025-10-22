import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  ActivityIndicator,
  View,
} from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';

interface ModernButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gradient';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const ModernButton: React.FC<ModernButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  style,
  textStyle,
  leftIcon,
  rightIcon,
}) => {
  const theme = useTheme();

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          paddingHorizontal: theme.spacing.md,
          paddingVertical: theme.spacing.sm,
          minHeight: 36,
        };
      case 'md':
        return {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          minHeight: 44,
        };
      case 'lg':
        return {
          paddingHorizontal: theme.spacing.xl,
          paddingVertical: theme.spacing.lg,
          minHeight: 52,
        };
      case 'xl':
        return {
          paddingHorizontal: theme.spacing.xxl,
          paddingVertical: theme.spacing.xl,
          minHeight: 60,
        };
      default:
        return {
          paddingHorizontal: theme.spacing.lg,
          paddingVertical: theme.spacing.md,
          minHeight: 44,
        };
    }
  };

  const getTextSize = () => {
    switch (size) {
      case 'sm': return theme.typography.fontSize.sm;
      case 'md': return theme.typography.fontSize.md;
      case 'lg': return theme.typography.fontSize.lg;
      case 'xl': return theme.typography.fontSize.xl;
      default: return theme.typography.fontSize.md;
    }
  };

  const getVariantStyles = () => {
    const isDisabled = disabled || loading;

    switch (variant) {
      case 'primary':
        return {
          backgroundColor: isDisabled ? theme.colors.gray[300] : theme.colors.primary,
          borderWidth: 0,
          ...theme.shadows.colored,
        };
      case 'secondary':
        return {
          backgroundColor: isDisabled ? theme.colors.gray[200] : theme.colors.primaryLight,
          borderWidth: 1,
          borderColor: isDisabled ? theme.colors.gray[300] : theme.colors.primary,
        };
      case 'outline':
        return {
          backgroundColor: 'transparent',
          borderWidth: 2,
          borderColor: isDisabled ? theme.colors.gray[300] : theme.colors.primary,
        };
      case 'ghost':
        return {
          backgroundColor: 'transparent',
          borderWidth: 0,
        };
      case 'gradient':
        return {
          borderWidth: 0,
        };
      default:
        return {
          backgroundColor: isDisabled ? theme.colors.gray[300] : theme.colors.primary,
          borderWidth: 0,
        };
    }
  };

  const getTextColor = () => {
    const isDisabled = disabled || loading;

    switch (variant) {
      case 'primary':
      case 'gradient':
        return theme.colors.surface;
      case 'secondary':
        return isDisabled ? theme.colors.gray[400] : theme.colors.foreground;
      case 'outline':
        return isDisabled ? theme.colors.gray[400] : theme.colors.primary;
      case 'ghost':
        return isDisabled ? theme.colors.gray[400] : theme.colors.primary;
      default:
        return theme.colors.surface;
    }
  };

  const buttonStyles: ViewStyle[] = [
    styles.base,
    getSizeStyles(),
    getVariantStyles(),
    disabled && styles.disabled,
    style,
  ];

  const textStyles: TextStyle[] = [
    styles.text,
    {
      fontSize: getTextSize(),
      color: getTextColor(),
      fontWeight: theme.typography.fontWeight.semibold,
    },
    textStyle,
  ];

  const content = (
    <>
      {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' || variant === 'gradient' ? theme.colors.surface : theme.colors.primary}
        />
      ) : (
        <Text style={textStyles}>{title}</Text>
      )}
      {rightIcon && <View style={styles.rightIcon}>{rightIcon}</View>}
    </>
  );

  if (variant === 'gradient' && !disabled && !loading) {
    return (
      <TouchableOpacity
        style={[styles.gradientContainer, getSizeStyles(), style]}
        onPress={onPress}
        disabled={disabled || loading}
        activeOpacity={0.8}
      >
        <LinearGradient
          colors={theme.gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[styles.gradient, getSizeStyles()]}
        >
          {content}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={buttonStyles}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      delayPressIn={0}
      delayPressOut={50}
    >
      {content}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  disabled: {
    opacity: 0.6,
  },
  gradientContainer: {
    borderRadius: 12,
  },
  gradient: {
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  text: {
    textAlign: 'center',
    fontWeight: '600',
  },
  leftIcon: {
    marginRight: 8,
  },
  rightIcon: {
    marginLeft: 8,
  },
});

export default ModernButton;
