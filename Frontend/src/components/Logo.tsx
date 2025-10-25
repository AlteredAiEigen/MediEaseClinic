import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface LogoProps {
  width?: number;
  height?: number;
}

const Logo: React.FC<LogoProps> = ({ width = 80, height = 80 }) => {
  return (
    <View style={[styles.logoContainer, { width, height }]}>
      <Text style={styles.logoText}>MediEase</Text>
      <Text style={styles.subText}>Clinic</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  logoContainer: {
    backgroundColor: '#10b981',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10
  },
  logoText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold'
  },
  subText: {
    color: 'white',
    fontSize: 12
  }
});

export default Logo;
