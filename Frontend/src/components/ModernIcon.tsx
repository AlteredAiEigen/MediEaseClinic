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

// Simple icon mapping to Unicode symbols and text
const iconMap: Record<string, string> = {
  // Navigation
  'arrow-left': '←',
  'arrow-right': '→',
  'chevron-left': '‹',
  'chevron-right': '›',
  'chevron-up': '▲',
  'chevron-down': '▼',
  
  // Actions
  'play': '▶',
  'pause': '⏸',
  'stop': '⏹',
  'record': '●',
  'mic': '🎤',
  'mic-off': '🎤',
  
  // Medical
  'stethoscope': '🩺',
  'heart': '❤',
  'pulse': '💓',
  'user': '👤',
  'users': '👥',
  'calendar': '📅',
  'clock': '🕐',
  'check': '✓',
  'cross': '✗',
  'x': '✗',
  'plus': '+',
  'minus': '−',
  
  // Status
  'success': '✓',
  'error': '✗',
  'warning': '⚠',
  'info': 'ℹ',
  
  // UI
  'menu': '☰',
  'search': '🔍',
  'settings': '⚙',
  'notification': '🔔',
  'home': '🏠',
  
  // Additional icons
  'mail': '✉',
  'lock': '🔒',
  'log-out': '↪',
  'clipboard-list': '📋',
  'user-check': '👤✓',
  'edit': '✏',
  'trash': '🗑',
  'phone': '📞',
};

const ModernIcon: React.FC<ModernIconProps> = ({
  name,
  size = 24,
  color,
  backgroundColor,
  style,
}) => {
  const theme = useTheme();
  const iconColor = color || theme.colors.primary;
  const bgColor = backgroundColor || 'transparent';
  
  // Map the icon name to a symbol
  const iconSymbol = iconMap[name] || '?';

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
      <Text style={[styles.icon, { fontSize: size * 0.6, color: iconColor }]}>
        {iconSymbol}
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
