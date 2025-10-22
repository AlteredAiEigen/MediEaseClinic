import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import ScreenContainer from '../../components/Layout/ScreenContainer';
import ModernCard from '../../components/ModernCard';
import ModernInput from '../../components/ModernInput';
import ModernButton from '../../components/ModernButton';
import Icon from '../../components/Icon';
import { useTheme } from '../../themes/ThemeContext';
import { DoctorRange, useAppContext } from '../../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const { setClinicProfile } = useAppContext();

  const [clinicName, setClinicName] = useState('');
  const [doctorRange, setDoctorRange] = useState<DoctorRange>('1-10');
  const [adminEmail, setAdminEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSubmit = () => {
    if (!clinicName || !adminEmail || !password || !confirmPassword) {
      Alert.alert('Missing information', 'Fill all required fields.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password mismatch', 'Make sure passwords match.');
      return;
    }

    setClinicProfile({
      clinicName,
      doctorRange,
      adminEmail,
      adminPassword: password,
    });

    Alert.alert('Success', 'Clinic account created! You can now login.');
    navigation.navigate('Landing');
  };

  return (
    <ScreenContainer scrollable contentContainerStyle={styles.container}>      
      <ModernCard variant="elevated" borderRadius="xl" style={styles.card}>        
        <Text style={[styles.title, { color: theme.colors.foreground }]}>Create Clinic Account</Text>        
        <Text style={[styles.subtitle, { color: theme.colors.foregroundSecondary }]}>Sign up to manage your clinic admins, doctors, and appointments.</Text>        
        <ModernInput label="Clinic name" placeholder="MediEase Healthcare" value={clinicName} onChangeText={setClinicName} leftIcon={<Icon name="home" size={18} color={theme.colors.foregroundMuted} />} />        
        <View style={styles.rangeContainer}>          
          <Text style={[styles.rangeLabel, { color: theme.colors.foregroundSecondary }]}>Number of doctors</Text>          
          <View style={styles.rangeButtons}>            
            {(['1-10', '10-20', '20+'] as DoctorRange[]).map((option) => {              
              const isSelected = option === doctorRange;              
              return (                
                <ModernButton                  key={option}                  title={option}                  variant={isSelected ? 'primary' : 'outline'}                  size="sm"                  onPress={() => setDoctorRange(option)}                  style={[styles.rangeButton, isSelected && { borderWidth: 0 }]}                  textStyle={{ color: isSelected ? theme.colors.surface : theme.colors.primary }}                />              
              );            })}          
          </View>        
        </View>        
        <ModernInput label="Admin email" value={adminEmail} onChangeText={setAdminEmail} keyboardType="email-address" placeholder="admin@clinic.com" autoCapitalize="none" leftIcon={<Icon name="mail" size={18} color={theme.colors.foregroundMuted} />} />        
        <ModernInput label="Password" value={password} onChangeText={setPassword} secureTextEntry placeholder="Create password" leftIcon={<Icon name="lock" size={18} color={theme.colors.foregroundMuted} />} />        
        <ModernInput label="Confirm password" value={confirmPassword} onChangeText={setConfirmPassword} secureTextEntry placeholder="Repeat password" leftIcon={<Icon name="lock" size={18} color={theme.colors.foregroundMuted} />} />        
        <ModernButton title="Create clinic admin" size="lg" variant="gradient" onPress={handleSubmit} style={styles.submitButton} />        
        <ModernButton title="Back to landing" size="md" variant="ghost" onPress={() => navigation.goBack()} />      
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
    maxWidth: 520,
    padding: 24,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 16,
    lineHeight: 22,
  },
  rangeContainer: {
    gap: 12,
  },
  rangeLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  rangeButtons: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  rangeButton: {
    minWidth: 90,
  },
  submitButton: {
    marginTop: 12,
  },
});

export default SignupScreen;
