import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../../components/Layout/ScreenContainer';
import ModernCard from '../../components/ModernCard';
import ModernInput from '../../components/ModernInput';
import ModernButton from '../../components/ModernButton';
import ModernIcon from '../../components/ModernIcon';
import { useTheme } from '../../themes/ThemeContext';
import { UserRole, useAppContext } from '../../context/AppContext';
import ModernButton from '../../components/ModernButton';

interface LoginScreenProps {
  onAuthenticated: (role: UserRole) => void;
  onBack: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onAuthenticated, onBack }) => {
  const theme = useTheme();
  const {
    mode,
    clinicProfile,
    login,
    setCurrentUser,
    setMode,
    doctors,
    receptionists
  } = useAppContext();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!identifier || !password) {
      Alert.alert('Missing information', 'Please enter your email/username and password.');
      return;
    }

    setIsLoading(true);

    try {
      const result = await login(identifier, password);

      if (result.success && result.user) {
        console.log(`${result.user.role} login successful`, result.user);
        setIsLoading(false);
        onAuthenticated(result.user.role);
      } else {
        setIsLoading(false);
        Alert.alert(
          'Authentication Failed',
          result.message || 'Invalid username or password. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      setIsLoading(false);
      Alert.alert(
        'Login Error',
        'An error occurred during login. Please try again.',
        [{ text: 'OK' }]
      );
    }
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>
      <ModernCard variant="elevated" borderRadius="xl" style={styles.card}>
        <Text style={[styles.title, { color: theme.colors.foreground }]}>Sign In</Text>
        <Text style={[styles.subtitle, { color: theme.colors.foregroundSecondary }]}>
          Enter your credentials to access your account
        </Text>

        <View style={styles.demoAccountsContainer}>
          <Text style={[styles.demoAccountsTitle, { color: theme.colors.primary }]}>
            {mode === 'api' ? 'Backend Mode - Use registered accounts' : 'Demo Accounts (Local Mode):'}
          </Text>
          {mode === 'api' ? (
            <Text style={[styles.demoAccount, { color: theme.colors.foreground }]}>
              Use accounts registered through the backend API
            </Text>
          ) : (
            <>
              <Text style={[styles.demoAccount, { color: theme.colors.foreground }]}>Admin: admin@gmail.com / Admin@123</Text>
              <Text style={[styles.demoAccount, { color: theme.colors.foreground }]}>Doctor: doctor@gmail.com / Doctor@123</Text>
              <Text style={[styles.demoAccount, { color: theme.colors.foreground }]}>Receptionist: reception@gmail.com / Reception@123</Text>
            </>
          )}
        </View>

        <ModernInput
          label="Email or Username"
          placeholder="Enter your email or username"
          value={identifier}
          onChangeText={setIdentifier}
          autoCapitalize="none"
          keyboardType="email-address"
          leftIcon={<ModernIcon name="mail" size={18} color={theme.colors.foregroundMuted} />}
        />

        <ModernInput
          label="Password"
          placeholder="Enter your password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          leftIcon={<ModernIcon name="lock" size={18} color={theme.colors.foregroundMuted} />}
        />

        <ModernButton
          title="Sign In"
          variant="primary"
          size="lg"
          onPress={handleLogin}
          loading={isLoading}
          style={styles.signInButton}
        />

        <View style={styles.buttonRow}>
          <ModernButton
            title={mode === 'api' ? 'Switch to Demo Mode' : 'Switch to API Mode'}
            variant="outline"
            size="sm"
            onPress={() => setMode(mode === 'api' ? 'local' : 'api')}
            textStyle={{ color: theme.colors.primary }}
          />
          <ModernButton
            title="Back"
            variant="outline"
            size="md"
            onPress={onBack}
            textStyle={{ color: theme.colors.primary }}
          />
        </View>
      </ModernCard>
    </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 600, // Increased for tablets
    padding: 32,
    gap: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    textAlign: 'center',
    marginBottom: 8,
  },
  demoAccountsContainer: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    padding: 16,
    borderRadius: 12,
    marginVertical: 16,
    alignSelf: 'stretch',
  },
  demoAccountsTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  demoAccount: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 6,
  },
  signInButton: {
    marginTop: 16,
    height: 56, // Taller button for better touch target
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
    gap: 12,
  },
});

export default LoginScreen;
