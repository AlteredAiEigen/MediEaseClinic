import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TextInput, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  Dimensions,
  Alert
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/RootNavigator';
import Icon from '../../components/Icon';
import { useTheme } from '../../themes/ThemeContext';
import { Theme } from '../../themes';
import Logo from '../../components/Logo';
import { useAppContext } from '../../context/AppContext';

type Props = NativeStackScreenProps<RootStackParamList, 'Landing'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IS_TABLET = SCREEN_WIDTH >= 768;

const LandingScreen: React.FC<Props> = ({ navigation }) => {
  const theme = useTheme();
  const styles = React.useMemo(() => createStyles(theme), [theme]);
  const { setCurrentUser } = useAppContext();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const handleDirectLogin = () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    
    setIsLoading(true);
    
    // Demo login - hardcoded for simplicity
    if (email.trim().toLowerCase() === 'admin@gmail.com' && password === 'Admin@123') {
      setCurrentUser({
        id: 'admin-1',
        name: 'MediEase Demo Clinic',
        email: 'admin@gmail.com',
        role: 'admin',
      });
      setIsLoading(false);
      // Navigation is handled automatically by RootNavigator based on currentUser state
      return;
    }
    
    if (email.trim().toLowerCase() === 'doctor@gmail.com' && password === 'Doctor@123') {
      setCurrentUser({
        id: 'doctor-demo-1',
        name: 'Dr. Jane Smith',
        email: 'doctor@gmail.com',
        role: 'doctor',
      });
      setIsLoading(false);
      return;
    }
    
    if (email.trim().toLowerCase() === 'reception@gmail.com' && password === 'Reception@123') {
      setCurrentUser({
        id: 'receptionist-demo-1',
        name: 'Sarah Johnson',
        email: 'reception@gmail.com',
        role: 'receptionist',
      });
      setIsLoading(false);
      return;
    }
    
    // If no match
    setIsLoading(false);
    Alert.alert('Invalid credentials', 'Try the demo accounts shown below.');
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      <View style={styles.contentContainer}>
        {/* Left side - Logo */}
        <View style={styles.logoSection}>
          <View style={styles.logoWrapper}>
            <Logo width={IS_TABLET ? 160 : 120} height={IS_TABLET ? 160 : 120} />
          </View>
          <Text style={[styles.title, { color: theme.colors.foreground }]}>
            MediEase Clinic
          </Text>
          <Text style={[styles.subtitle, { color: theme.colors.foregroundSecondary }]}>
            Healthcare Management Platform
          </Text>
        </View>

        {/* Right side - Login Form */}
        <View style={styles.formSection}>
          <View style={styles.formContainer}>
            <Text style={[styles.formTitle, { color: theme.colors.foreground }]}>
              Sign In
            </Text>
            
            <View style={styles.inputContainer}>
              <Icon name="mail" size={20} color={theme.colors.foregroundMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.foreground, borderColor: theme.colors.border }]}
                placeholder="Email or Username"
                placeholderTextColor={theme.colors.foregroundMuted}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />
            </View>
            
            <View style={styles.inputContainer}>
              <Icon name="lock" size={20} color={theme.colors.foregroundMuted} style={styles.inputIcon} />
              <TextInput
                style={[styles.input, { color: theme.colors.foreground, borderColor: theme.colors.border }]}
                placeholder="Password"
                placeholderTextColor={theme.colors.foregroundMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>
            
            <TouchableOpacity
              style={[styles.loginButton, { backgroundColor: theme.colors.primary }]}
              onPress={handleDirectLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <View style={styles.loaderContainer}>
                  <Logo width={24} height={24} />
                </View>
              ) : (
                <Text style={styles.loginButtonText}>Sign In</Text>
              )}
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.signupButton} 
              onPress={() => navigation.navigate('Signup')}
            >
              <Text style={[styles.signupButtonText, { color: theme.colors.primary }]}>
                Sign Up for Clinic
              </Text>
            </TouchableOpacity>
            
            <View style={styles.demoAccountsContainer}>
              <Text style={[styles.demoTitle, { color: theme.colors.primary }]}>Demo Accounts:</Text>
              <Text style={[styles.demoText, { color: theme.colors.foreground }]}>Admin: admin@gmail.com / Admin@123</Text>
              <Text style={[styles.demoText, { color: theme.colors.foreground }]}>Doctor: doctor@gmail.com / Doctor@123</Text>
              <Text style={[styles.demoText, { color: theme.colors.foreground }]}>Receptionist: reception@gmail.com / Reception@123</Text>
            </View>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (theme: Theme) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    flex: 1,
    flexDirection: IS_TABLET ? 'row' : 'column',
  },
  logoSection: {
    flex: IS_TABLET ? 1 : undefined,
    height: IS_TABLET ? '100%' : SCREEN_HEIGHT * 0.4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(45, 212, 191, 0.1)',
    padding: 20,
  },
  logoWrapper: {
    backgroundColor: 'white',
    borderRadius: IS_TABLET ? 80 : 60,
    padding: IS_TABLET ? 24 : 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  title: {
    fontSize: IS_TABLET ? 36 : 28,
    fontWeight: '800',
    marginTop: 24,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: IS_TABLET ? 18 : 16,
    marginTop: 8,
    textAlign: 'center',
  },
  formSection: {
    flex: IS_TABLET ? 1 : undefined,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  formContainer: {
    width: '100%',
    maxWidth: 400,
    padding: 20,
  },
  formTitle: {
    fontSize: IS_TABLET ? 28 : 24,
    fontWeight: '700',
    marginBottom: 24,
    textAlign: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    height: IS_TABLET ? 56 : 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: IS_TABLET ? 18 : 16,
  },
  loginButton: {
    height: IS_TABLET ? 56 : 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  loginButtonText: {
    color: 'white',
    fontSize: IS_TABLET ? 18 : 16,
    fontWeight: '600',
  },
  signupButton: {
    marginTop: 16,
    height: IS_TABLET ? 56 : 48,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  signupButtonText: {
    fontSize: IS_TABLET ? 18 : 16,
    fontWeight: '600',
  },
  demoAccountsContainer: {
    marginTop: 32,
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 8,
  },
  demoTitle: {
    fontSize: IS_TABLET ? 18 : 16,
    fontWeight: '700',
    marginBottom: 8,
  },
  demoText: {
    fontSize: IS_TABLET ? 16 : 14,
    marginBottom: 4,
  },
  loaderContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LandingScreen;
