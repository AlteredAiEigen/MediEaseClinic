import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import ModernIcon from './ModernIcon';

interface RoleCardProps {
  title: string;
  description: string;
  icon: string;
  onPress: () => void;
}

const RoleCard: React.FC<RoleCardProps> = ({ title, description, icon, onPress }) => {
  const theme = useTheme();

  return (
    <TouchableOpacity style={[styles.card, { borderColor: theme.colors.border }]} onPress={onPress}>
      <View style={[styles.iconContainer, { backgroundColor: theme.colors.gradientSecondary + '22' }]}>
        <ModernIcon name={icon} size={24} color={theme.colors.primary} />
      </View>
      <Text style={[styles.title, { color: theme.colors.foreground }]}>{title}</Text>
      <Text style={[styles.description, { color: theme.colors.foregroundSecondary }]}>{description}</Text>
      <View style={styles.footer}>
        <ModernIcon name="arrow-right" size={18} color={theme.colors.primary} />
        <Text style={[styles.linkLabel, { color: theme.colors.primary }]}>Continue</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 20,
    borderWidth: 1,
    borderRadius: 16,
    backgroundColor: '#fff',
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  linkLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default RoleCard;

