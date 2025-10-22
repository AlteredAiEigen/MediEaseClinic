import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import Logo from './Logo';
import ModernIcon from './ModernIcon';

const { width, height } = Dimensions.get('window');

interface LoadingScreenProps {
  message?: string;
  progress?: number;
  showProgress?: boolean;
  variant?: 'default' | 'medical' | 'simulation' | 'analysis';
  onComplete?: () => void;
  visible?: boolean;
}

const medicalIcons = ['heart', 'pulse', 'stethoscope', 'brain', 'zap', 'cross'];

const loadingMessages = {
  default: [
    "Initializing MediEase...",
    "Loading patient data...",
    "Preparing simulation environment...",
    "Almost ready..."
  ],
  medical: [
    "Analyzing patient symptoms...",
    "Processing medical history...",
    "Generating clinical insights...",
    "Preparing diagnosis assistance..."
  ],
  simulation: [
    "Connecting to AI patient...",
    "Calibrating voice synthesis...",
    "Loading case scenarios...",
    "Starting consultation..."
  ],
  analysis: [
    "Processing conversation data...",
    "Analyzing medical patterns...",
    "Generating consultation summary...",
    "Finalizing clinical notes..."
  ]
};

const LoadingScreen: React.FC<LoadingScreenProps> = ({
  message,
  progress,
  showProgress = true,
  variant = 'default',
  onComplete,
  visible = true
}) => {
  const theme = useTheme();
  const [currentMessage, setCurrentMessage] = useState(0);
  const [animatedProgress] = useState(new Animated.Value(0));
  const [pulsingIcon, setPulsingIcon] = useState(0);
  const [pulseAnimations] = useState(() =>
    Array.from({ length: 3 }, () => new Animated.Value(0))
  );

  const messages = loadingMessages[variant];

  useEffect(() => {
    if (!visible) return;

    let messageInterval: NodeJS.Timeout | null = null;
    let iconInterval: NodeJS.Timeout | null = null;
    let pulseIntervals: NodeJS.Timeout[] = [];

    // Rotate loading messages
    messageInterval = setInterval(() => {
      setCurrentMessage(prev => (prev + 1) % messages.length);
    }, 2000);

    // Animate pulsing icons
    iconInterval = setInterval(() => {
      setPulsingIcon(prev => (prev + 1) % medicalIcons.length);
    }, 800);

    // Animate pulsing dots
    pulseAnimations.forEach((animation, index) => {
      const interval = setInterval(() => {
        Animated.sequence([
          Animated.timing(animation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(animation, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]).start();
      }, index * 200);

      pulseIntervals.push(interval);
    });

    // Animate progress if provided
    if (progress !== undefined) {
      Animated.timing(animatedProgress, {
        toValue: progress,
        duration: 1000,
        useNativeDriver: false,
      }).start(() => {
        if (progress >= 100 && onComplete) {
          setTimeout(onComplete, 500);
        }
      });
    }

    return () => {
      if (messageInterval) clearInterval(messageInterval);
      if (iconInterval) clearInterval(iconInterval);
      pulseIntervals.forEach(interval => clearInterval(interval));
    };
  }, [progress, onComplete, messages.length, visible, pulseAnimations]);

  if (!visible) return null;


  const progressScale = animatedProgress.interpolate({
    inputRange: [0, 100],
    outputRange: [0, 1],
  });

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.primary }]}>
      {/* Background pattern */}
      <View style={styles.backgroundPattern}>
        <View style={styles.patternGrid} />
      </View>

      <View style={styles.content}>
        {/* Main logo */}
        <View style={styles.logoContainer}>
          <Logo width={100} height={100} />
        </View>

        {/* Simple medical icon */}
        {variant === 'medical' && (
          <View style={styles.simpleIconContainer}>
            <ModernIcon name={medicalIcons[pulsingIcon]} size={32} color={theme.colors.primary} />
          </View>
        )}

        {/* Loading message */}
        <View style={styles.messageContainer}>
          <Text style={[styles.message, { color: theme.colors.surface }]}>
            {message || messages[currentMessage]}
          </Text>
          <View style={styles.dotsContainer}>
            {pulseAnimations.map((animation, index) => (
              <Animated.View
                key={index}
                style={[
                  styles.dot,
                  {
                    backgroundColor: theme.colors.surface,
                    transform: [{
                      scale: animation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.5],
                      })
                    }]
                  }
                ]}
              />
            ))}
          </View>
        </View>

        {/* Progress bar */}
        {showProgress && (
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { backgroundColor: 'rgba(255, 255, 255, 0.3)' }]}>
              <Animated.View
                style={[
                  styles.progressFill,
                  {
                    transform: [{ scaleX: progressScale }],
                    transformOrigin: 'left',
                    backgroundColor: theme.colors.surface,
                  },
                ]}
              />
            </View>
            {progress !== undefined && (
              <Text style={[styles.progressText, { color: 'rgba(255, 255, 255, 0.8)' }]}>
                {Math.round(progress)}%
              </Text>
            )}
          </View>
        )}

      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: 'rgba(255, 255, 255, 0.6)' }]}>
          MediEase Clinic
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backgroundPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.05,
  },
  patternGrid: {
    flex: 1,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#ffffff',
    borderStyle: 'dashed',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  logoContainer: {
    marginBottom: 60,
    alignItems: 'center',
    justifyContent: 'center',
  },
  simpleIconContainer: {
    marginTop: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContainer: {
    marginBottom: 40,
    alignItems: 'center',
  },
  message: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    letterSpacing: -0.5,
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  progressContainer: {
    width: width * 0.7,
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
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

export default LoadingScreen;
