import React, { useState, useEffect, useRef } from 'react';
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
  ScrollView,
  PermissionsAndroid,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RequestPermissionsScreen from './RequestPermissionsScreen';
import { useTheme } from '../../themes/ThemeContext';
import { Theme } from '../../themes';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import LinearGradient from 'react-native-linear-gradient';
import RecordingService from '../../services/RecordingService';
import ExternalMicService from '../../services/ExternalMicService';
import { useAppointments } from '../../context/AppointmentsContext';
import { useAppContext } from '../../context/AppContext';

import ModernCard from '../../components/ModernCard';
import ModernButton from '../../components/ModernButton';
import ModernIcon from '../../components/ModernIcon';
import ModernHeader from '../../components/ModernHeader';
import Logo from '../../components/Logo';
import LoadingScreen from '../../components/LoadingScreen';
import { useNavigationWithLoading } from '../../hooks/useNavigationWithLoading';

type RootStackParamList = {
  DoctorDashboard: undefined;
  ConsultationRecording: { patient: Patient };
  ClinicalNotes: { patient: Patient; recordingDuration: number; recordingId: string };
};

type ConsultationRecordingScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'ConsultationRecording'
>;

interface Props {
  navigation: ConsultationRecordingScreenNavigationProp;
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
const IS_TABLET = width >= 768;

const ConsultationRecordingScreen: React.FC<Props> = ({ navigation, route }) => {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { isLoading, loadingMessage, loadingVariant, navigateWithLoading } = useNavigationWithLoading();
  const { updateAppointmentStatus } = useAppointments();
  const { currentUser } = useAppContext();
  const { patient } = route.params;

  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [recordingSession, setRecordingSession] = useState<any>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [recordingComplete, setRecordingComplete] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);
  const [micStatus, setMicStatus] = useState('Checking microphone...');
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);

  const androidApiLevel = React.useMemo(() => {
    if (Platform.OS !== 'android') {
      return null;
    }

    if (typeof Platform.Version === 'string') {
      const parsed = parseInt(Platform.Version, 10);
      return Number.isNaN(parsed) ? null : parsed;
    }

    return Platform.Version as number;
  }, []);

  const requiresLegacyStoragePermission = Platform.OS === 'android' && (androidApiLevel ?? 0) < 29;
  
  // Check if permissions were already granted on component mount
  useEffect(() => {
    const checkActualPermissions = async () => {
      try {
        if (Platform.OS === 'android') {
          // Check the actual system permissions
          const micPermission = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO);
          let storagePermissionGranted = true;

          if (requiresLegacyStoragePermission) {
            storagePermissionGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
          }
          
          if (micPermission && storagePermissionGranted) {
            console.log('System permissions are already granted');
            setPermissionsGranted(true);
            // Update storage to match actual permissions
            await AsyncStorage.setItem('permissionsGranted', 'true');
            return;
          }
        } else {
          // iOS doesn't need runtime permissions for this app
          setPermissionsGranted(true);
          return;
        }
        
        // If system permissions not granted, check stored value as fallback
        const storedPermissions = await AsyncStorage.getItem('permissionsGranted');
        if (storedPermissions === 'true') {
          setPermissionsGranted(true);
        }
      } catch (error) {
        console.error('Error checking permissions:', error);
      }
    };
    
    checkActualPermissions();
  }, [requiresLegacyStoragePermission]);

  // Animation values
  const [waveAnimation] = useState(new Animated.Value(0));
  const [pulseAnimation] = useState(new Animated.Value(1));
  const [scaleAnimation] = useState(new Animated.Value(1));

  // Duration timer
  const durationTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Check microphone status on mount
  useEffect(() => {
    const checkMicrophoneStatus = async () => {
      try {
        setMicStatus('Checking microphone connection...');
        
        try {
          // Try to get device info
          const deviceInfo = await ExternalMicService.listAudioDevices();
          
          if (deviceInfo.hasExternalMic) {
            // Found external microphone
            const externalDevices = deviceInfo.devices?.filter(d => d.isExternal) || [];
            
            if (externalDevices.length > 0) {
              const deviceNames = externalDevices.map(d => d.name).join(', ');
              setMicStatus(`External microphone detected: ${deviceNames}`);
            } else {
              setMicStatus('External microphone connected via OTG');
            }
            setRecordingError(null);
          } else {
            // No external microphone found
            setMicStatus('No external microphone detected');
            setRecordingError('No external microphone found. Please connect a microphone via OTG.');
          }
          
          // Log all devices for debugging
          if (deviceInfo.devices && deviceInfo.devices.length > 0) {
            console.log('Available audio devices:');
            deviceInfo.devices.forEach(device => {
              console.log(`- ${device.name} (${device.type}), External: ${device.isExternal}`);
            });
          } else {
            console.log('No audio devices found');
          }
        } catch (err) {
          console.error('Error checking microphone:', err);
          setMicStatus('Error detecting external microphone');
          setRecordingError('Could not detect external microphone. Please check connection.');
        }
      } catch (err) {
        console.error('Unexpected error while checking microphone:', err);
        setMicStatus('Microphone service unavailable');
        setRecordingError('Microphone service unavailable on this device');
      }
    };
    
    checkMicrophoneStatus();
  }, []);

  // Audio level polling
  useEffect(() => {
    let audioLevelInterval: NodeJS.Timeout | null = null;

    if (isRecording) {
      // Start duration timer
      durationTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

      // Start audio level polling
      audioLevelInterval = setInterval(() => {
        const level = RecordingService.getAudioLevel();
        setAudioLevel(level);
      }, 100);

      // Start animations
      startAnimations();
    } else {
      // Clear timers and reset animations
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
        durationTimerRef.current = null;
      }

      if (audioLevelInterval) {
        clearInterval(audioLevelInterval);
      }

      resetAnimations();
    }

    return () => {
      if (durationTimerRef.current) {
        clearInterval(durationTimerRef.current);
      }
      if (audioLevelInterval) {
        clearInterval(audioLevelInterval);
      }
    };
  }, [isRecording]);

  // Start animations for recording state
  const startAnimations = () => {
    // Wave animation
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

    // Pulse animation
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

    // Scale animation
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
  };

  // Reset animations
  const resetAnimations = () => {
    waveAnimation.setValue(0);
    pulseAnimation.setValue(1);
    scaleAnimation.setValue(1);
  };

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    return RecordingService.formatDuration(seconds);
  };

  // Show toast message
  const showToast = (message: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.showWithGravity(
        message,
        ToastAndroid.SHORT,
        ToastAndroid.CENTER
      );
    } else {
      // For iOS, use Alert with auto-dismiss
      Alert.alert(
        'Recording',
        message,
        [],
        { cancelable: true }
      );
    }
  };

  // Handle start/stop recording
  const handleStartStopRecording = async () => {
    // Clear previous errors
    setRecordingError(null);
    
    try {
      if (!isRecording) {
        // Update status
        setMicStatus('Initializing microphone...');
        
        try {
          // Start recording
          const session = await RecordingService.startRecording(
            patient.id,
            'apt_' + Date.now(), // Mock appointment ID
            currentUser?.id || 'unknown_doctor'
          );
          
          setRecordingSession(session);
          setIsRecording(true);
          setRecordingComplete(false);
          setMicStatus('Recording in progress - External microphone active');
          showToast('Recording started');
        } catch (err) {
          console.error('Failed to start recording:', err);
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          setRecordingError(`Failed to start recording: ${errorMessage}`);
          setMicStatus('Error with microphone');
          Alert.alert('Recording Error', `Failed to start recording: ${errorMessage}`);
        }
      } else {
        // Stop recording
        if (recordingSession) {
          try {
            setMicStatus('Finalizing recording...');
            const recording = await RecordingService.stopRecording();
            
            if (recording && recording.filePath) {
              setIsRecording(false);
              setRecordingSession(null);
              setRecordingId(recording.id);
              setRecordingComplete(true);
              setMicStatus('Recording completed successfully');
              
              const savedMessage = `Recording saved - ${formatDuration(recordingDuration)}`;
              showToast(savedMessage);
            } else {
              throw new Error('Recording has no file path');
            }
          } catch (err) {
            console.error('Failed to stop recording:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setRecordingError(`Failed to save recording: ${errorMessage}`);
            setMicStatus('Error saving recording');
            setIsRecording(false);
            setRecordingSession(null);
            Alert.alert('Recording Error', `Failed to save recording: ${errorMessage}`);
          }
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setRecordingError(`Recording error: ${errorMessage}`);
      setMicStatus('Recording system error');
      Alert.alert('Recording System Error', errorMessage);
      console.error('Recording system error:', error);
    }
  };

  // Handle play recording
  const handlePlayRecording = async () => {
    if (!recordingId) {
      Alert.alert('Error', 'No recording available to play');
      return;
    }

    try {
      setPlayingAudio(true);
      const success = await RecordingService.playRecording(recordingId);
      
      if (!success) {
        Alert.alert('Playback Error', 'Failed to play the recording');
      }
      
      // Simulate playback duration for demo purposes
      setTimeout(() => {
        setPlayingAudio(false);
      }, recordingDuration * 1000);
    } catch (error) {
      setPlayingAudio(false);
      Alert.alert('Playback Error', 'Failed to play the recording');
      console.error('Playback error:', error);
    }
  };

  // Navigate to clinical notes
  const handleContinueToClinicalNotes = () => {
    if (!recordingId) {
      Alert.alert('Error', 'No recording available');
      return;
    }

    navigateWithLoading(
      'ClinicalNotes', 
      { 
        patient, 
        recordingDuration,
        recordingId 
      }, 
      'Processing recording...', 
      'medical'
    );
  };

  // Render audio wave visualization
  const renderWaveBars = () => {
    // Create different heights for a more realistic waveform
    const heightVariations = [0.6, 0.9, 0.7, 1, 0.8, 0.5, 0.7];
    const barCount = IS_TABLET ? 9 : 7;
    
    return [...Array(barCount)].map((_, index) => {
      const heightMultiplier = heightVariations[index % heightVariations.length];
      
      // Use audio level to influence the wave height
      const dynamicHeight = isRecording ? 
        (0.3 + (audioLevel / 100) * 0.7) * heightMultiplier : 
        heightMultiplier * 0.4;
      
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
                    outputRange: [
                      isRecording ? dynamicHeight * 0.8 : 0.2, 
                      isRecording ? dynamicHeight * 1.2 : heightMultiplier
                    ],
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

  const handlePermissionsGranted = async () => {
    setPermissionsGranted(true);
    try {
      await AsyncStorage.setItem('permissionsGranted', 'true');
    } catch (error) {
      console.error('Error storing permissions status:', error);
    }
  };

  // If permissions are not granted, show the permissions request screen
  if (!permissionsGranted) {
    return <RequestPermissionsScreen onPermissionsGranted={handlePermissionsGranted} />;
  }

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
              LIVE RECORDING • External Microphone Active
            </Text>
          </View>
        </LinearGradient>
      )}

      <ModernHeader
        title="Consultation Recording"
        subtitle={`Recording with ${patient.firstName} ${patient.lastName}`}
        leftIcon={
          <View style={styles.backButtonContainer}>
            <ModernIcon name="arrow-left" size={20} color={theme.colors.foreground} />
          </View>
        }
        onLeftPress={() => {
          if (isRecording) {
            Alert.alert(
              'Stop Recording',
              'Recording is in progress. Do you want to stop and discard?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Stop & Discard', 
                  style: 'destructive',
                  onPress: async () => {
                    if (recordingSession) {
                      try {
                        await RecordingService.stopRecording();
                      } catch (error) {
                        console.error('Error stopping recording:', error);
                      }
                    }
                    navigation.goBack();
                  }
                }
              ]
            );
          } else {
            navigation.goBack();
          }
        }}
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

      {/* Patient Info Card */}
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

      {/* Main Content */}
      <ScrollView 
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainContentContainer}>
          {/* Recording Section */}
          <View style={styles.recordingSection}>
            {/* Duration Display */}
            <View style={styles.durationSection}>
              <Text style={[styles.durationLabel, { color: theme.colors.foregroundSecondary }]}>
                {isRecording ? 'Recording Time' : recordingComplete ? 'Recording Length' : 'Ready to Record'}
              </Text>
              <Animated.Text
                style={[
                  styles.durationValue,
                  {
                    color: isRecording ? theme.colors.primary : theme.colors.foreground,
                    transform: [{ scale: isRecording ? scaleAnimation : 1 }],
                  },
                ]}
              >
                {formatDuration(recordingDuration)}
              </Animated.Text>
            </View>

            {/* Audio Wave Visualization */}
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

            {/* Recording Controls */}
            <View style={styles.buttonSection}>
              <Animated.View style={{ transform: [{ scale: isRecording ? pulseAnimation : 1 }] }}>
                <TouchableOpacity 
                  onPress={handleStartStopRecording}
                  activeOpacity={0.8}
                  disabled={recordingComplete && !isRecording}
                >
                  <LinearGradient
                    colors={isRecording ? ['#fff', '#fff'] : theme.gradients.primary}
                    style={[
                      styles.recordButtonContainer,
                      isRecording && {
                        borderColor: theme.colors.medicalError,
                        borderWidth: 2,
                      },
                      recordingComplete && !isRecording && { opacity: 0.5 }
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

            {/* Playback and Continue Buttons (shown after recording) */}
            {recordingComplete && (
              <View style={styles.postRecordingControls}>
                <ModernButton
                  title={playingAudio ? "Playing..." : "Play Recording"}
                  variant="outline"
                  size="md"
                  onPress={handlePlayRecording}
                  disabled={playingAudio}
                  leftIcon={<ModernIcon name="play" size={20} color={theme.colors.primary} />}
                  style={styles.playButton}
                />
                
                <ModernButton
                  title="Continue to Clinical Notes"
                  variant="gradient"
                  size="md"
                  onPress={handleContinueToClinicalNotes}
                  leftIcon={<ModernIcon name="file-text" size={20} color="#fff" />}
                  style={styles.continueButton}
                />
              </View>
            )}
          </View>

          {/* Guidelines Section */}
          <View style={styles.guidelinesSection}>
            <View style={styles.guidelinesHeader}>
              <ModernIcon name="info" size={24} color={theme.colors.primary} />
              <Text style={styles.guidelinesTitle}>Recording Status</Text>
            </View>
            
            {/* Microphone Status */}
            <View style={[styles.statusBanner, { 
              backgroundColor: recordingError 
                ? 'rgba(239, 68, 68, 0.1)' 
                : isRecording 
                  ? 'rgba(16, 185, 129, 0.1)' 
                  : 'rgba(59, 130, 246, 0.1)',
              marginBottom: 16
            }]}>
              <ModernIcon 
                name={recordingError ? "alert-circle" : isRecording ? "mic" : "info"} 
                size={24} 
                color={recordingError 
                  ? theme.colors.medicalError 
                  : isRecording 
                    ? theme.colors.medicalSuccess 
                    : theme.colors.primary} 
              />
              <View style={{flex: 1, marginLeft: 12}}>
                <Text style={[styles.statusTitle, { 
                  color: recordingError 
                    ? theme.colors.medicalError 
                    : isRecording 
                      ? theme.colors.medicalSuccess 
                      : theme.colors.primary
                }]}>
                  {micStatus}
                </Text>
                {recordingError && (
                  <Text style={styles.errorText}>{recordingError}</Text>
                )}
              </View>
            </View>
            
            <View style={styles.guidelinesList}>
              <View style={styles.guidelineItem}>
                <ModernIcon name="mic" size={20} color={recordingError ? theme.colors.medicalError : theme.colors.primary} />
                <Text style={[styles.guidelineText, recordingError && {color: theme.colors.medicalError}]}>
                  External microphone connected via OTG is being used for high-quality audio
                </Text>
              </View>
              
              <View style={styles.guidelineItem}>
                <ModernIcon name="volume-2" size={20} color={theme.colors.primary} />
                <Text style={styles.guidelineText}>
                  Audio is automatically amplified for better clarity
                </Text>
              </View>
              
              <View style={styles.guidelineItem}>
                <ModernIcon name="zap" size={20} color={theme.colors.primary} />
                <Text style={styles.guidelineText}>
                  Speak clearly and maintain consistent volume for best results
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
                : recordingComplete
                ? 'rgba(34, 197, 94, 0.1)'
                : 'rgba(59, 130, 246, 0.1)',
              marginTop: 20
            }]}>
              <ModernIcon
                name={isRecording ? 'record' : recordingComplete ? 'check' : 'info'}
                size={20}
                color={isRecording 
                  ? theme.colors.medicalError 
                  : recordingComplete
                  ? theme.colors.medicalSuccess
                  : theme.colors.primary}
              />
              <Text style={[styles.statusBadgeText, {
                color: isRecording 
                  ? theme.colors.medicalError 
                  : recordingComplete
                  ? theme.colors.medicalSuccess
                  : theme.colors.primary,
                fontSize: 16
              }]}>
                {isRecording 
                  ? 'Recording Active' 
                  : recordingComplete
                  ? 'Recording Complete'
                  : 'Ready to Record'}
              </Text>
            </View>
          </View>
        </View>
      </ScrollView>

      <LoadingScreen
        visible={isLoading}
        message={loadingMessage}
        variant={loadingVariant}
        showProgress={true}
      />
    </View>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  statusTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#ef4444',
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
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
  // Patient section
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
    flexDirection: IS_TABLET ? 'row' : 'column',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  // Recording section
  recordingSection: {
    flex: IS_TABLET ? 2 : 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingRight: IS_TABLET ? 16 : 0,
    paddingBottom: IS_TABLET ? 0 : 16,
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
    marginBottom: 24,
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
  // Post recording controls
  postRecordingControls: {
    width: '100%',
    alignItems: 'center',
    gap: 16,
  },
  playButton: {
    minWidth: 200,
  },
  continueButton: {
    minWidth: 200,
  },
  // Guidelines section
  guidelinesSection: {
    flex: IS_TABLET ? 1 : undefined,
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
});

export default ConsultationRecordingScreen;
