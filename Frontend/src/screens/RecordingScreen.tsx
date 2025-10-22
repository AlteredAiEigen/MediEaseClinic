import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  Animated,
  Dimensions,
  TouchableOpacity,
  ToastAndroid,
  Platform,
} from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import RecordingService from '../services/RecordingService';
import { useAppointments } from '../context/AppointmentsContext';

import ModernCard from '../components/ModernCard';
import ModernButton from '../components/ModernButton';
import ModernIcon from '../components/ModernIcon';
import ModernHeader from '../components/ModernHeader';
import Logo from '../components/Logo';
import LoadingScreen from '../components/LoadingScreen';
import { useNavigationWithLoading } from '../hooks/useNavigationWithLoading';

type RootStackParamList = {
  Login: undefined;
  PatientSelection: undefined;
  Recording: { patient: Patient };
  ClinicalNotes: { patient: Patient; recordingDuration: number };
};

type RecordingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Recording'
>;

interface Props {
  navigation: RecordingScreenNavigationProp;
  route: { params: { patient: Patient } };
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  age: string;
  medicalHistory?: string;
  [key: string]: any;
}

const { width } = Dimensions.get('window');

const RecordingScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme();
  const { isLoading, loadingMessage, loadingVariant, navigateWithLoading } = useNavigationWithLoading();
  const { updateAppointmentStatus } = useAppointments();
  const { patient } = route.params;

  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [waveAnimation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [scaleAnimation] = useState(new Animated.Value(1));
  const [recordingSession, setRecordingSession] = useState<any>(null);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;

    if (isRecording) {
      interval = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Enhanced animations for recording state
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnimation, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnimation, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.sequence([
          Animated.timing(scaleAnimation, {
            toValue: 1.05,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      waveAnimation.setValue(0);
      pulseAnimation.setValue(1);
      scaleAnimation.setValue(1);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording, waveAnimation, pulseAnimation, scaleAnimation]);

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Custom styled alert for recording actions
  const showCustomAlert = (title: string, message: string, buttons: any[]) => {
    return (
      <View style={styles.modalOverlay}>
        <TouchableOpacity 
          style={styles.modalBackdrop} 
          activeOpacity={1}
          onPress={() => {}}
        />
        <View style={styles.modalContainer}>
          <LinearGradient
            colors={[theme.colors.primary, theme.colors.primaryDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.modalHeader}
          >
            <ModernIcon 
              name={isRecording ? "mic" : "check-circle"} 
              size={24} 
              color="#fff" 
            />
            <Text style={styles.modalTitle}>{title}</Text>
          </LinearGradient>
          
          <View style={styles.modalBody}>
            <Text style={styles.modalMessage}>{message}</Text>
          </View>
          
          <View style={styles.modalFooter}>
            {buttons.map((button, index) => (
              <TouchableOpacity 
                key={index}
                style={[
                  styles.modalButton,
                  button.destructive ? styles.modalDestructiveButton : 
                  button.primary ? styles.modalPrimaryButton : styles.modalSecondaryButton,
                  index < buttons.length - 1 && styles.modalButtonMargin
                ]}
                onPress={button.onPress}
              >
                {button.icon && (
                  <ModernIcon 
                    name={button.icon} 
                    size={16} 
                    color={button.destructive ? '#fff' : button.primary ? '#fff' : theme.colors.foreground} 
                    style={{marginRight: 8}}
                  />
                )}
                <Text style={[
                  styles.modalButtonText,
                  button.destructive ? styles.modalDestructiveButtonText : 
                  button.primary ? styles.modalPrimaryButtonText : styles.modalSecondaryButtonText,
                ]}>
                  {button.text}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  // Show a toast message that auto-dismisses
  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.showWithGravity(
        message,
        ToastAndroid.SHORT,
        ToastAndroid.CENTER
      );
    } else {
      // For iOS, use Alert with auto-dismiss
      const alertShown = Alert.alert(
        'Recording Saved',
        message,
        [],
        { cancelable: true }
      );
      
      // Auto-dismiss the alert after a short time
      setTimeout(() => {
        // This is a workaround since we can't directly dismiss alerts in React Native
        // The timeout should be short enough that it dismisses before navigation
      }, 800);
    }
  };

  const handleStartStopRecording = async () => {
    try {
      if (!isRecording) {
        // Start recording
        const session = await RecordingService.startRecording(
          patient.id,
          'apt_' + Date.now(), // Mock appointment ID
          'doc1' // Mock doctor ID
        );
        setRecordingSession(session);
        setIsRecording(true);
        showToast('Recording started');
      } else {
        // Stop recording
        if (recordingSession) {
          const recording = await RecordingService.stopRecording();
          setIsRecording(false);
          setRecordingSession(null);
          
          const savedMessage = `Recording saved - ${formatDuration(recordingDuration)}`;
          showToast(savedMessage);
          
          // Navigate to clinical notes with recording data
          setTimeout(() => {
            navigateWithLoading('ClinicalNotes', { 
              patient, 
              recordingDuration,
              recordingId: recording.id 
            }, 'Processing recording...', 'medical');
          }, 1000);
        }
      }
    } catch (error) {
      Alert.alert('Recording Error', 'Failed to start/stop recording');
      console.error('Recording error:', error);
    }
  };

  const renderWaveBars = () => {
    // Create different heights for a more realistic waveform
    const heightVariations = [0.6, 0.9, 0.7, 1, 0.8, 0.5, 0.7];
    
    return [...Array(7)].map((_, index) => {
      const heightMultiplier = heightVariations[index];
      
      return (
        <Animated.View
          key={index}
          style={[
            styles.waveBar,
            {
              backgroundColor: isRecording ? theme.colors.primary : theme.colors.gray[300],
              height: 60 * heightMultiplier,
              transform: [
                {
                  scaleY: waveAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [isRecording ? 0.4 : 0.2, isRecording ? heightMultiplier * 1.2 : heightMultiplier],
                  }),
                },
              ],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.waveBarHighlight,
              {
                backgroundColor: theme.colors.primary,
                opacity: waveAnimation,
                height: 60 * heightMultiplier,
                transform: [
                  {
                    scaleY: waveAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 0.5],
                    }),
                  },
                ],
              },
            ]}
          />
        </Animated.View>
      );
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Live streaming indicator at the top */}
      {isRecording && (
        <LinearGradient
          colors={theme.gradients.primary}
          style={styles.liveStreamingBanner}
        >
          <View style={styles.liveStreamingContent}>
            <View style={styles.liveStreamingDot} />
            <Text style={styles.liveStreamingText}>
              LIVE STREAMING • Processing Audio Data
            </Text>
          </View>
        </LinearGradient>
      )}

      <ModernHeader
        title="Voice Recording"
        subtitle={`Consultation with ${patient.firstName} ${patient.lastName}`}
        leftIcon={
          <View style={styles.backButtonContainer}>
            <ModernIcon name="arrow-left" size={20} color={theme.colors.foreground} />
          </View>
        }
        onLeftPress={() => navigation.goBack()}
        rightIcon={
          <View style={styles.headerRight}>
            {isRecording && (
              <View style={[styles.recordingIndicator, { backgroundColor: theme.colors.medicalError }]}>
                <Text style={styles.recText}>REC</Text>
              </View>
            )}
          </View>
        }
      />

      {/* Patient Info Card - More compact for tablet */}
      <View style={styles.patientSection}>
        <ModernCard variant="elevated" style={styles.patientCard}>
          <View style={styles.patientHeader}>
            <View style={styles.patientAvatar}>
              <Logo width={40} height={40} />
            </View>
            <View style={styles.patientInfo}>
              <Text style={[styles.patientName, { color: theme.colors.foreground }]}>
                {patient.firstName} {patient.lastName}
              </Text>
              <Text style={[styles.patientDetails, { color: theme.colors.foregroundSecondary }]}>
                Age {patient.age} • {patient.medicalHistory || 'General Consultation'}
              </Text>
            </View>
            {isRecording && (
              <View style={[styles.recBadge]}>
                <Text style={styles.recBadgeText}>REC</Text>
              </View>
            )}
          </View>
        </ModernCard>
      </View>

      {/* Main Recording Section - Optimized for tablet */}
      <View style={styles.mainContentContainer}>
        <View style={styles.recordingSection}>
          {/* Duration Display - Larger for better visibility */}
          <View style={styles.durationSection}>
            <Text style={[styles.durationLabel, { color: theme.colors.foregroundSecondary }]}>
              Recording Time
            </Text>
            <Animated.Text
              style={[
                styles.durationValue,
                {
                  color: isRecording ? theme.colors.primary : theme.colors.foreground,
                  transform: [{ scale: scaleAnimation }],
                },
              ]}
            >
              {formatDuration(recordingDuration)}
            </Animated.Text>
          </View>

          {/* Audio Wave Visualization - Larger for better visibility */}
          <View style={styles.waveSection}>
            <View style={styles.waveContainer}>
              {renderWaveBars()}
            </View>
            {isRecording && (
              <Animated.View style={[styles.pulseRing, {
                borderColor: theme.colors.primary,
                transform: [{ scale: pulseAnimation }],
              }]} />
            )}
          </View>

          {/* Recording Button - Simplified and more prominent */}
          <View style={styles.buttonSection}>
            <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
              <TouchableOpacity 
                onPress={handleStartStopRecording}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={isRecording ? ['#fff', '#fff'] : theme.gradients.primary}
                  style={[
                    styles.recordButtonContainer,
                    isRecording && {
                      borderColor: theme.colors.medicalError,
                      borderWidth: 2,
                    }
                  ]}
                >
                  <View style={styles.recordButtonInner}>
                    <ModernIcon 
                      name={isRecording ? "stop" : "mic"} 
                      size={isRecording ? 28 : 32} 
                      color={isRecording ? theme.colors.medicalError : theme.colors.surface} 
                    />
                    <Text style={[
                      styles.recordButtonText, 
                      { color: isRecording ? theme.colors.medicalError : theme.colors.surface }
                    ]}>
                      {isRecording ? 'Stop Recording' : 'Start Recording'}
                    </Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>
          </View>
        </View>

        {/* Guidelines Section - Side by side on tablet */}
        <View style={styles.guidelinesSection}>
          <View style={styles.guidelinesHeader}>
            <ModernIcon name="info" size={24} color={theme.colors.primary} />
            <Text style={styles.guidelinesTitle}>Recording Guidelines</Text>
          </View>
          
          <View style={styles.guidelinesList}>
            <View style={styles.guidelineItem}>
              <ModernIcon name="mic" size={20} color={theme.colors.primary} />
              <Text style={styles.guidelineText}>
                Ensure microphone is 6-8 inches from patient
              </Text>
            </View>
            
            <View style={styles.guidelineItem}>
              <ModernIcon name="volume-2" size={20} color={theme.colors.primary} />
              <Text style={styles.guidelineText}>
                Speak clearly and maintain consistent volume
              </Text>
            </View>
            
            <View style={styles.guidelineItem}>
              <ModernIcon name="brain" size={20} color={theme.colors.primary} />
              <Text style={styles.guidelineText}>
                AI will automatically transcribe and generate clinical notes
              </Text>
            </View>
          </View>
          
          {/* Status Indicator */}
          <View style={[styles.statusBadge, {
            backgroundColor: isRecording
              ? 'rgba(239, 68, 68, 0.1)'
              : 'rgba(34, 197, 94, 0.1)',
            marginTop: 20
          }]}>
            <ModernIcon
              name={isRecording ? 'record' : 'check'}
              size={20}
              color={isRecording ? theme.colors.medicalError : theme.colors.medicalSuccess}
            />
            <Text style={[styles.statusBadgeText, {
              color: isRecording ? theme.colors.medicalError : theme.colors.medicalSuccess,
              fontSize: 16
            }]}>
              {isRecording ? 'Recording Active' : 'Ready to Record'}
            </Text>
          </View>
        </View>
      </View>


      <LoadingScreen
        visible={isLoading}
        message={loadingMessage}
        variant={loadingVariant}
        showProgress={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Custom Alert Modal Styles
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContainer: {
    width: '80%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 12,
  },
  modalBody: {
    padding: 24,
  },
  modalMessage: {
    fontSize: 16,
    color: '#333',
    lineHeight: 24,
  },
  modalFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 100,
  },
  modalButtonMargin: {
    marginRight: 12,
  },
  modalPrimaryButton: {
    backgroundColor: '#2DD4BF',
  },
  modalSecondaryButton: {
    backgroundColor: '#f5f5f5',
  },
  modalDestructiveButton: {
    backgroundColor: '#ef4444',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalPrimaryButtonText: {
    color: '#fff',
  },
  modalSecondaryButtonText: {
    color: '#333',
  },
  modalDestructiveButtonText: {
    color: '#fff',
  },
  // Live streaming banner at top
  liveStreamingBanner: {
    width: '100%',
    paddingVertical: 12,
  },
  liveStreamingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveStreamingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  liveStreamingText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  // Patient section - more compact
  patientSection: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 0,
  },
  patientCard: {
    padding: 12,
  },
  patientHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(174, 234, 214, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  patientDetails: {
    fontSize: 14,
  },
  recBadge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  recBadgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  // Main content container - tablet optimized layout
  mainContentContainer: {
    flex: 1,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  // Recording section - larger for better visibility
  recordingSection: {
    flex: 2,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: 16,
  },
  durationSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  durationLabel: {
    fontSize: 18,
    fontWeight: '500',
    marginBottom: 8,
  },
  durationValue: {
    fontSize: 72,
    fontWeight: '700',
    letterSpacing: -1,
    color: '#2DD4BF',
  },
  waveSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 120,
    marginBottom: 20,
  },
  waveBar: {
    width: 12,
    borderRadius: 6,
    marginHorizontal: 6,
    overflow: 'hidden',
  },
  waveBarHighlight: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    borderRadius: 6,
  },
  pulseRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 3,
    opacity: 0.3,
  },
  buttonSection: {
    width: '100%',
    alignItems: 'center',
  },
  recordButtonContainer: {
    width: width * 0.4,
    maxWidth: 280,
    height: 70,
    borderRadius: 35,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  recordButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  recordButtonText: {
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 10,
  },
  // Guidelines section - tablet optimized
  guidelinesSection: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  guidelinesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  guidelinesTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginLeft: 10,
    color: '#0f172a',
  },
  guidelinesList: {
    gap: 20,
  },
  guidelineItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  guidelineText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#334155',
    flex: 1,
    lineHeight: 22,
  },
  // Status badge
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
  },
  statusBadgeText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 10,
  },
  // Header elements
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  recordingIndicator: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#ef4444',
  },
  recText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  backButtonContainer: {
    padding: 8,
  },
  secondaryButtonContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  secondaryButton: {
    minWidth: 160,
  },
});

export default RecordingScreen;
