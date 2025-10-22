import React, { useState, forwardRef } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextInputProps,
} from 'react-native';
import { useTheme } from '../themes/ThemeContext';

interface ModernInputProps extends TextInputProps {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: ViewStyle;
  variant?: 'default' | 'filled' | 'outlined';
}

const ModernInput = forwardRef<TextInput, ModernInputProps>(({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  containerStyle,
  variant = 'outlined',
  style,
  ...props
}, ref) => {
  const theme = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const getContainerStyles = () => {
    const baseStyles: ViewStyle = {
      marginBottom: theme.spacing.md,
    };

    switch (variant) {
      case 'filled':
        return {
          ...baseStyles,
          backgroundColor: theme.colors.surfaceSecondary,
          borderRadius: theme.borderRadius.md,
          borderWidth: 0,
          ...theme.shadows.inner,
        };
      case 'outlined':
      default:
        return {
          ...baseStyles,
          borderWidth: 2,
          borderColor: error
            ? theme.colors.error
            : isFocused
              ? theme.colors.primary
              : theme.colors.border,
          borderRadius: theme.borderRadius.md,
          backgroundColor: theme.colors.surface,
          ...theme.shadows.sm,
        };
    }
  };

  const getInputStyles = () => ({
    flex: 1,
    fontSize: theme.typography.fontSize.lg, // Increased font size for better visibility
    color: theme.colors.foreground,
    paddingVertical: theme.spacing.lg, // More padding for tablet
    paddingHorizontal: leftIcon || rightIcon ? theme.spacing.md : theme.spacing.lg,
    fontWeight: theme.typography.fontWeight.normal,
  });

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text
          style={[
            styles.label,
            {
              color: error
                ? theme.colors.error
                : isFocused
                  ? theme.colors.primary
                  : theme.colors.foregroundSecondary,
            },
          ]}
        >
          {label}
        </Text>
      )}

      <View style={getContainerStyles()}>
        {leftIcon && (
          <View style={styles.leftIcon}>
            {leftIcon}
          </View>
        )}

        <TextInput
          ref={ref}
          style={[getInputStyles(), style]}
          placeholderTextColor={theme.colors.foregroundMuted}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          {...props}
        />

        {rightIcon && (
          <View style={styles.rightIcon}>
            {rightIcon}
          </View>
        )}
      </View>

      {(error || helperText) && (
        <Text
          style={[
            styles.helperText,
            {
              color: error ? theme.colors.error : theme.colors.foregroundMuted,
            },
          ]}
        >
          {error || helperText}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  container: {},
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  leftIcon: {
    justifyContent: 'center',
    paddingLeft: 12,
  },
  rightIcon: {
    justifyContent: 'center',
    paddingRight: 12,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
    lineHeight: 16,
  },
});

ModernInput.displayName = 'ModernInput';

export default ModernInput;
