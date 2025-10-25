import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface IconProps {
  name: string;
  size?: number;
  color?: string;
  strokeWidth?: number;
  style?: any;
}

const Icon: React.FC<IconProps> = ({
  name,
  size = 24,
  color = '#000',
  style
}) => {
  const renderIcon = () => {
    switch (name) {
      // Navigation
      case 'arrow-left':
        return '←';
      case 'arrow-right':
        return '→';
      case 'chevron-left':
        return '‹';
      case 'chevron-right':
        return '›';
      case 'chevron-down':
        return '⌄';
      case 'chevron-up':
        return '⌃';

      // Actions
      case 'plus':
        return '+';
      case 'minus':
        return '−';
      case 'x':
        return '×';
      case 'check':
        return '✓';
      case 'edit':
        return '✏';
      case 'trash':
        return '🗑';
      case 'search':
        return '🔍';

      // Medical
      case 'user':
        return '👤';
      case 'users':
        return '👥';
      case 'user-check':
        return '✅';
      case 'heart':
        return '❤️';
      case 'activity':
        return '📊';

      // UI Elements
      case 'home':
        return '🏠';
      case 'calendar':
        return '📅';
      case 'clock':
        return '🕐';
      case 'mail':
        return '✉️';
      case 'lock':
        return '🔒';
      case 'menu':
        return '☰';
      case 'bell':
        return '🔔';
      case 'settings':
        return '⚙️';
      case 'log-out':
        return '🚪';
      case 'phone':
        return '📞';
      case 'clipboard':
        return '📋';
      case 'file-text':
        return '📄';
      case 'camera':
        return '📷';
      case 'image':
        return '🖼️';

      // Status
      case 'check-circle':
        return '✅';
      case 'x-circle':
        return '❌';
      case 'alert-circle':
        return '⚠️';
      case 'alert-triangle':
        return '⚠️';
      case 'info':
        return 'ℹ️';

      // Media
      case 'play':
        return '▶️';
      case 'pause':
        return '⏸️';
      case 'stop':
        return '⏹️';
      case 'mic':
        return '🎤';
      case 'mic-off':
        return '🎤❌';

      // More icons
      case 'eye':
        return '👁️';
      case 'eye-off':
        return '🙈';
      case 'download':
        return '⬇️';
      case 'upload':
        return '⬆️';
      case 'refresh':
        return '🔄';
      case 'more-vertical':
        return '⋮';
      case 'more-horizontal':
        return '⋯';

      default:
        return '●';
    }
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={{ fontSize: size, color }}>{renderIcon()}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default Icon;


