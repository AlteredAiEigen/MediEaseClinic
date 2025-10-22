import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import ScreenContainer from '../../components/Layout/ScreenContainer';
import RoleCard from '../../components/RoleCard';
import { useTheme } from '../../themes/ThemeContext';

interface RoleSelectionScreenProps {
  onSelectAdmin: () => void;
  onSelectDoctor: () => void;
  onSelectReceptionist: () => void;
}

const RoleSelectionScreen: React.FC<RoleSelectionScreenProps> = ({ onSelectAdmin, onSelectDoctor, onSelectReceptionist }) => {
  const theme = useTheme();

  return (
    <ScreenContainer contentContainerStyle={styles.container}>      
      <View style={styles.header}>        
        <Text style={[styles.title, { color: theme.colors.foreground }]}>Choose how you want to sign in</Text>        
        <Text style={[styles.subtitle, { color: theme.colors.foregroundSecondary }]}>Admins manage clinic setup, doctors review patient queues, receptionists schedule appointments.</Text>      
      </View>      
      <View style={styles.grid}>        
        <RoleCard title="Sign in as Admin" description="Manage clinic details, doctor roster, receptionist access, and global appointments." icon="settings" onPress={onSelectAdmin} />        
        <RoleCard title="Sign in as Doctor" description="See your patient queue, review stats, and manage consultations." icon="stethoscope" onPress={onSelectDoctor} />        
        <RoleCard title="Sign in as Receptionist" description="Schedule, reschedule, and cancel appointments for clinic doctors." icon="calendar" onPress={onSelectReceptionist} />      
      </View>    
  </ScreenContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 24,
    flexGrow: 1,
    justifyContent: 'center',
  },
  header: {
    gap: 12,
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 540,
  },
  grid: {
    width: '100%',
    gap: 16,
  },
});

export default RoleSelectionScreen;

