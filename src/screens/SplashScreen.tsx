import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import Logo from '../components/Logo';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  PatientSelection: undefined;
  Recording: { patient: Patient };
  ClinicalNotes: { patient: Patient; recordingDuration: number };
  PreviousPatients: undefined;
};

type SplashScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Splash'
>;

interface Props {
  navigation: SplashScreenNavigationProp;
}

interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  priority: 'low' | 'medium' | 'high';
  waitTime: string;
  appointmentTime: string;
}

const SplashScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const [logoScale] = React.useState(new Animated.Value(0.3));
  const [logoOpacity] = React.useState(new Animated.Value(0));
  const [textOpacity] = React.useState(new Animated.Value(0));
  const [taglineOpacity] = React.useState(new Animated.Value(0));

  useEffect(() => {
    // Logo animation sequence
    Animated.sequence([
      // Logo fade in and scale up
      Animated.parallel([
        Animated.timing(logoScale, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(logoOpacity, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
      // Text fade in
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      // Tagline fade in
      Animated.timing(taglineOpacity, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Navigate to login after animation
    const timer = setTimeout(() => {
      navigation.replace('Login');
    }, 3000); // 3 seconds total

    return () => clearTimeout(timer);
  }, [navigation, logoScale, logoOpacity, textOpacity, taglineOpacity]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      <View style={styles.content}>
        {/* Animated Logo */}
        <Animated.View
          style={[
            styles.logoContainer,
            {
              transform: [{ scale: logoScale }],
              opacity: logoOpacity,
            },
          ]}
        >
          <Logo width={120} height={120} />
        </Animated.View>

        {/* App Name */}
        <Animated.View
          style={[
            styles.textContainer,
            { opacity: textOpacity },
          ]}
        >
          <Text style={[styles.appName, { color: theme.colors.surface }]}>
            MediEase Clinic
          </Text>
        </Animated.View>

        {/* Tagline */}
        <Animated.View
          style={[
            styles.taglineContainer,
            { opacity: taglineOpacity },
          ]}
        >
          <Text style={[styles.tagline, { color: 'rgba(255, 255, 255, 0.8)' }]}>
            Advanced Healthcare Management
          </Text>
          <Text style={[styles.subtitle, { color: 'rgba(255, 255, 255, 0.6)' }]}>
            AI-Powered Medical Solutions
          </Text>
        </Animated.View>

        {/* Loading Indicator */}
        <View style={styles.loadingContainer}>
          <View style={[styles.loadingBar, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}>
            <Animated.View
              style={[
                styles.loadingProgress,
                {
                  backgroundColor: theme.colors.surface,
                  width: logoOpacity.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0, width * 0.6],
                  }),
                },
              ]}
            />
          </View>
        </View>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: 'rgba(255, 255, 255, 0.5)' }]}>
          Version 1.0.0
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
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  appName: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -1,
    marginBottom: 8,
  },
  taglineContainer: {
    alignItems: 'center',
  },
  tagline: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    textAlign: 'center',
  },
  loadingContainer: {
    marginTop: 60,
    alignItems: 'center',
  },
  loadingBar: {
    height: 3,
    width: width * 0.6,
    borderRadius: 1.5,
    overflow: 'hidden',
  },
  loadingProgress: {
    height: '100%',
    borderRadius: 1.5,
  },
  footer: {
    position: 'absolute',
    bottom: 40,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default SplashScreen;
