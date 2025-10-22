import React, { useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Logo from '../components/Logo';
import { useTheme } from '../themes/ThemeContext';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;

const SplashScreen: React.FC = () => {
  const theme = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <Logo width={IS_TABLET ? 200 : 150} height={IS_TABLET ? 200 : 150} />
        <Text style={[styles.title, { color: theme.colors.primary }]}>
          MediEase Clinic
        </Text>
        <Text style={[styles.subtitle, { color: theme.colors.foregroundSecondary }]}>
          Healthcare Management Platform
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    gap: 24,
  },
  title: {
    fontSize: IS_TABLET ? 36 : 28,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: IS_TABLET ? 18 : 16,
    textAlign: 'center',
  },
});

export default SplashScreen;
