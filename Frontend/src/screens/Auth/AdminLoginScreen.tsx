import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import ScreenContainer from '../../components/Layout/ScreenContainer';
import ModernCard from '../../components/ModernCard';
import ModernInput from '../../components/ModernInput';
import ModernButton from '../../components/ModernButton';
import ModernIcon from '../../components/ModernIcon';
import { useTheme } from '../../themes/ThemeContext';
import { useAppContext } from '../../context/AppContext';

interface AdminLoginScreenProps {
  onAuthenticated: () => void;
  onBack: () => void;
}

const AdminLoginScreen: React.FC<AdminLoginScreenProps> = ({ onAuthenticated, onBack }) => {
  const theme = useTheme();
  const { clinicProfile, setCurrentUser } = useAppContext();

  const [email, setEmail] = useState(clinicProfile?.adminEmail ?? '');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!clinicProfile) {
      Alert.alert('No clinic record', 'Please sign up your clinic first.');
      return;
    }

    if (email.trim().toLowerCase() !== clinicProfile.adminEmail.trim().toLowerCase() || password !== clinicProfile.adminPassword) {
      Alert.alert('Invalid credentials', 'Check admin email or password.');
      return;
    }

    setCurrentUser({
      id: 'admin-1',
      name: clinicProfile.clinicName,
      email: clinicProfile.adminEmail,
      role: 'admin',
    });

    onAuthenticated();
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>      
      <ModernCard variant="elevated" borderRadius="xl" style={styles.card}>        
        <Text style={[styles.title, { color: theme.colors.foreground }]}>Clinic Admin Login</Text>        
        <Text style={[styles.subtitle, { color: theme.colors.foregroundSecondary }]}>Use the credentials created during clinic setup.</Text>        
        <ModernInput label="Admin email" placeholder="admin@clinic.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" leftIcon={<ModernIcon name="mail" size={18} color={theme.colors.foregroundMuted} />} />        
        <ModernInput label="Password" placeholder="Enter password" value={password} onChangeText={setPassword} secureTextEntry leftIcon={<ModernIcon name="lock" size={18} color={theme.colors.foregroundMuted} />} />        
        <ModernButton title="Sign in as admin" variant="gradient" size="lg" onPress={handleLogin} />        
        <ModernButton title="Back" variant="ghost" onPress={onBack} />      
      </ModernCard>    
  </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    flexGrow: 1,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
  },
  subtitle: {
    fontSize: 16,
  },
});

export default AdminLoginScreen;

