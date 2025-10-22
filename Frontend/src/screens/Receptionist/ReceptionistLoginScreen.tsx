import React, { useState } from 'react';
import { Alert, StyleSheet, Text } from 'react-native';
import ScreenContainer from '../../components/Layout/ScreenContainer';
import ModernCard from '../../components/ModernCard';
import ModernInput from '../../components/ModernInput';
import ModernButton from '../../components/ModernButton';
import ModernIcon from '../../components/ModernIcon';
import { useTheme } from '../../themes/ThemeContext';
import { useAppContext } from '../../context/AppContext';

interface ReceptionistLoginScreenProps {
  onAuthenticated: () => void;
  onBack: () => void;
}

const ReceptionistLoginScreen: React.FC<ReceptionistLoginScreenProps> = ({ onAuthenticated, onBack }) => {
  const theme = useTheme();
  const { authenticateReceptionist, setCurrentUser } = useAppContext();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    if (!identifier || !password) {
      Alert.alert('Missing information', 'Enter your email/username and password.');
      return;
    }

    const receptionist = authenticateReceptionist(identifier, password);
    if (!receptionist) {
      return;
    }

    setCurrentUser({
      id: receptionist.id,
      name: receptionist.name,
      email: receptionist.email,
      role: 'receptionist',
    });

    onAuthenticated();
  };

  return (
    <ScreenContainer contentContainerStyle={styles.container}>      
      <ModernCard variant="elevated" borderRadius="xl" style={styles.card}>        
        <Text style={[styles.title, { color: theme.colors.foreground }]}>Receptionist sign in</Text>        
        <Text style={[styles.subtitle, { color: theme.colors.foregroundSecondary }]}>Access scheduling tools for clinic doctors.</Text>        
        <ModernInput label="Email or username" value={identifier} onChangeText={setIdentifier} placeholder="reception@clinic.com" autoCapitalize="none" leftIcon={<ModernIcon name="mail" size={18} color={theme.colors.foregroundMuted} />} />        
        <ModernInput label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Enter password" leftIcon={<ModernIcon name="lock" size={18} color={theme.colors.foregroundMuted} />} />        
        <ModernButton title="Sign in" variant="gradient" size="lg" onPress={handleLogin} />        
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

export default ReceptionistLoginScreen;

