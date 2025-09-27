import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useTheme } from '../themes/ThemeContext';

interface ModernIconProps {
  name: string;
  size?: number;
  color?: string;
  backgroundColor?: string;
  style?: any;
}

const ModernIcon: React.FC<ModernIconProps> = ({
  name,
  size = 24,
  color,
  backgroundColor,
  style,
}) => {
  const theme = useTheme();

  // Simple icon mapping - you can expand this with actual icon fonts
  const getIconSymbol = (iconName: string) => {
    const icons: { [key: string]: string } = {
      // Navigation
      'arrow-left': '←',
      'arrow-right': '→',
      'chevron-left': '‹',
      'chevron-right': '›',

      // Actions
      'play': '▶',
      'pause': '⏸',
      'stop': '⏹',
      'record': '●',
      'mic': '🎤',
      'mic-off': '🎤',

      // Medical
      'stethoscope': '🩺',
      'heart': '❤️',
      'pulse': '💓',
      'user': '👤',
      'users': '👥',
      'calendar': '📅',
      'clock': '🕐',
      'check': '✓',
      'cross': '✕',
      'plus': '+',
      'minus': '-',

      // Status
      'success': '✓',
      'error': '✕',
      'warning': '⚠',
      'info': 'ℹ',

      // UI
      'menu': '☰',
      'search': '🔍',
      'settings': '⚙',
      'notification': '🔔',
      'home': '🏠',
    };

    return icons[iconName] || '?';
  };

  const iconColor = color || theme.colors.primary;
  const bgColor = backgroundColor || 'transparent';

  return (
    <View
      style={[
        styles.container,
        {
          width: size,
          height: size,
          backgroundColor: bgColor,
          borderRadius: bgColor !== 'transparent' ? size / 2 : 0,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.icon,
          {
            fontSize: size * 0.8,
            color: iconColor,
            lineHeight: size,
          },
        ]}
      >
        {getIconSymbol(name)}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default ModernIcon;
