import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ModernHeaderProps {
  title?: string;
  subtitle?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  style?: ViewStyle;
  showBackButton?: boolean;
  transparent?: boolean;
}

const ModernHeader: React.FC<ModernHeaderProps> = ({
  title,
  subtitle,
  leftIcon,
  rightIcon,
  onLeftPress,
  onRightPress,
  style,
  showBackButton = false,
  transparent = false,
}) => {
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const headerStyles: ViewStyle[] = [
    styles.container,
    {
      paddingTop: insets.top + theme.spacing.md,
      backgroundColor: transparent ? 'transparent' : theme.colors.surface,
    },
    style,
  ];

  const titleColor = transparent ? theme.colors.surface : theme.colors.foreground;
  const subtitleColor = transparent ? 'rgba(255, 255, 255, 0.8)' : theme.colors.foregroundSecondary;

  return (
    <View style={headerStyles}>
      <View style={styles.content}>
        <View style={styles.leftSection}>
          {(leftIcon || showBackButton) && (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: transparent ? 'rgba(255, 255, 255, 0.1)' : theme.colors.surfaceSecondary, borderRadius: 20 }]}
              onPress={onLeftPress}
              activeOpacity={0.7}
            >
              {leftIcon || (
                <Text style={[styles.backIcon, { color: titleColor }]}>←</Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.centerSection}>
          {title && (
            <Text
              style={[
                styles.title,
                {
                  color: titleColor,
                  fontSize: subtitle ? theme.typography.fontSize.xl : theme.typography.fontSize.xxl,
                },
              ]}
              numberOfLines={1}
            >
              {title}
            </Text>
          )}
          {subtitle && (
            <Text
              style={[styles.subtitle, { color: subtitleColor }]}
              numberOfLines={1}
            >
              {subtitle}
            </Text>
          )}
        </View>

        <View style={styles.rightSection}>
          {rightIcon && (
            <TouchableOpacity
              style={[styles.iconButton, { backgroundColor: transparent ? 'rgba(255, 255, 255, 0.1)' : theme.colors.surfaceSecondary, borderRadius: 20 }]}
              onPress={onRightPress}
              activeOpacity={0.7}
            >
              {rightIcon}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!transparent && <View style={[styles.divider, { backgroundColor: theme.colors.borderLight }]} />}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    minHeight: 56,
  },
  leftSection: {
    width: 40,
    alignItems: 'flex-start',
  },
  centerSection: {
    flex: 1,
    alignItems: 'center',
  },
  rightSection: {
    width: 40,
    alignItems: 'flex-end',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
    marginTop: 2,
    opacity: 0.8,
  },
  divider: {
    height: 1,
    width: '100%',
  },
});

export default ModernHeader;
