import React, { useState } from 'react';
import {
  View,
  Text,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ModernCard from '../components/ModernCard';
import ModernButton from '../components/ModernButton';
import ModernInput from '../components/ModernInput';
import ModernIcon from '../components/ModernIcon';
import Logo from '../components/Logo';
import LoadingScreen from '../components/LoadingScreen';
import { useNavigationWithLoading } from '../hooks/useNavigationWithLoading';

type RootStackParamList = {
  Login: undefined;
  PatientSelection: undefined;
};

type LoginScreenNavigationProp = NativeStackNavigationProp<
  RootStackParamList,
  'Login'
>;

interface Props {
  navigation: LoginScreenNavigationProp;
}

const LoginScreen: React.FC<Props> = ({ _navigation }) => {
  const theme = useTheme();
  const { isLoading, loadingMessage, loadingVariant, navigateWithLoading } = useNavigationWithLoading();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLogin, setIsLogin] = useState(true);
  const [clinicName, setClinicName] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleAuth = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (!isLogin) {
      if (!clinicName) {
        Alert.alert('Error', 'Please enter clinic name');
        return;
      }
      if (password !== confirmPassword) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
    }

    // Navigate with loading screen
    await navigateWithLoading('PatientSelection', undefined, {
      message: isLogin ? 'Signing you in...' : 'Creating your account...',
      variant: 'medical',
      delay: 1200
    });
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: theme.colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoContainer}>
            <Logo width={100} height={100} />
          </View>

          <View style={styles.heroContent}>
            <Text style={[styles.title, { color: theme.colors.foreground }]}>
              MediEase Clinic
            </Text>
            <Text style={[styles.subtitle, { color: theme.colors.foregroundSecondary }]}>
              Advanced Healthcare Management Platform
            </Text>
            <Text style={[styles.description, { color: theme.colors.foregroundMuted }]}>
              Streamline your clinical workflow with AI-powered transcription and intelligent note generation.
            </Text>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <ModernCard variant="elevated" style={styles.formCard}>
            <View style={styles.formHeader}>
              <Text style={[styles.formTitle, { color: theme.colors.foreground }]}>
                {isLogin ? 'Welcome Back' : 'Join MediEase'}
              </Text>
              <Text style={[styles.formSubtitle, { color: theme.colors.foregroundSecondary }]}>
                {isLogin
                  ? 'Sign in to your clinic account'
                  : 'Create your clinic account'
                }
              </Text>
            </View>

            <View style={styles.formInputs}>
              {!isLogin && (
                <ModernInput
                  label="Clinic Name"
                  placeholder="Enter your clinic name"
                  value={clinicName}
                  onChangeText={setClinicName}
                  leftIcon={<ModernIcon name="home" size={20} color={theme.colors.foregroundMuted} />}
                />
              )}

              <ModernInput
                label="Email Address"
                placeholder="clinic@example.com"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                leftIcon={<ModernIcon name="user" size={20} color={theme.colors.foregroundMuted} />}
              />

              <ModernInput
                label="Password"
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                leftIcon={<ModernIcon name="settings" size={20} color={theme.colors.foregroundMuted} />}
              />

              {!isLogin && (
                <ModernInput
                  label="Confirm Password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry
                  leftIcon={<ModernIcon name="settings" size={20} color={theme.colors.foregroundMuted} />}
                />
              )}
            </View>

            <View style={styles.formActions}>
              <ModernButton
                title={isLogin ? 'Sign In' : 'Create Account'}
                onPress={handleAuth}
                variant="gradient"
                size="lg"
                loading={isLoading}
                style={styles.primaryButton}
              />

              <View style={styles.divider}>
                <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
                <Text style={[styles.dividerText, { color: theme.colors.foregroundMuted }]}>
                  or
                </Text>
                <View style={[styles.dividerLine, { backgroundColor: theme.colors.border }]} />
              </View>

              <ModernButton
                title={isLogin ? 'Create New Account' : 'Sign In Instead'}
                onPress={() => setIsLogin(!isLogin)}
                variant="ghost"
                size="md"
              />
            </View>
          </ModernCard>
        </View>

        {/* Features Preview */}
        <View style={styles.featuresSection}>
          <Text style={[styles.featuresTitle, { color: theme.colors.foreground }]}>
            Why Choose MediEase?
          </Text>

          <View style={styles.featuresGrid}>
            <ModernCard variant="default" style={styles.featureCard}>
              <ModernIcon name="mic" size={32} color={theme.colors.primary} />
              <Text style={[styles.featureTitle, { color: theme.colors.foreground }]}>
                Voice Recording
              </Text>
              <Text style={[styles.featureText, { color: theme.colors.foregroundSecondary }]}>
                Seamless audio capture with professional-grade quality
              </Text>
            </ModernCard>

            <ModernCard variant="default" style={styles.featureCard}>
              <ModernIcon name="pulse" size={32} color={theme.colors.success} />
              <Text style={[styles.featureTitle, { color: theme.colors.foreground }]}>
                AI Transcription
              </Text>
              <Text style={[styles.featureText, { color: theme.colors.foregroundSecondary }]}>
                Advanced AI converts speech to accurate medical notes
              </Text>
            </ModernCard>

            <ModernCard variant="default" style={styles.featureCard}>
              <ModernIcon name="check" size={32} color={theme.colors.info} />
              <Text style={[styles.featureTitle, { color: theme.colors.foreground }]}>
                Smart Notes
              </Text>
              <Text style={[styles.featureText, { color: theme.colors.foregroundSecondary }]}>
                Automated clinical documentation with actionable insights
              </Text>
            </ModernCard>
          </View>
        </View>
      </ScrollView>

      <LoadingScreen
        visible={isLoading}
        message={loadingMessage}
        variant={loadingVariant}
        showProgress={true}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 40,
  },
  heroSection: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  logoContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContent: {
    alignItems: 'center',
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -1,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 320,
  },
  formSection: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  formCard: {
    padding: 0,
  },
  formHeader: {
    padding: 24,
    paddingBottom: 16,
    alignItems: 'center',
  },
  formTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: -0.5,
  },
  formSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  formInputs: {
    paddingHorizontal: 24,
  },
  formActions: {
    padding: 24,
    paddingTop: 16,
  },
  primaryButton: {
    marginBottom: 20,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    fontSize: 14,
    fontWeight: '500',
  },
  featuresSection: {
    paddingHorizontal: 24,
  },
  featuresTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  featuresGrid: {
    gap: 16,
  },
  featureCard: {
    padding: 20,
    alignItems: 'center',
    textAlign: 'center',
  },
  featureTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 8,
    textAlign: 'center',
  },
  featureText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default LoginScreen;
