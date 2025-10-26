import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAppContext } from '../context/AppContext';

// Auth Screens
import SplashScreen from '../screens/SplashScreen';
import LandingScreen from '../screens/Auth/LandingScreen';
import SignupScreen from '../screens/Auth/SignupScreen';

// Admin Screens
import AdminDashboardScreen from '../screens/Admin/AdminDashboardScreen';

// Doctor Screens
import DoctorDashboardScreen from '../screens/Doctor/DoctorDashboardScreen';

// Receptionist Screens
import ReceptionistDashboardScreen from '../screens/Receptionist/ReceptionistDashboardScreen';

// Patient Screens
import PatientDetailsScreen from '../screens/PatientDetailsScreen';

export type RootStackParamList = {
  Splash: undefined;
  Landing: undefined;
  Signup: undefined;
  AdminDashboard: undefined;
  DoctorDashboard: undefined;
  ReceptionistDashboard: undefined;
  PatientDetails: { patient: any };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  const { currentUser } = useAppContext();
  const [showSplash, setShowSplash] = React.useState(true);

  React.useEffect(() => {
    // Show splash for 2 seconds
    const timer = setTimeout(() => {
      setShowSplash(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'fade',
        }}
      >
        {showSplash ? (
          <Stack.Screen name="Splash" component={SplashScreen} />
        ) : currentUser ? (
          // User is logged in
          <>
            {currentUser.role === 'admin' ? (
              <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
            ) : currentUser.role === 'doctor' ? (
              <Stack.Screen name="DoctorDashboard" component={DoctorDashboardScreen} />
            ) : (
              <Stack.Screen name="ReceptionistDashboard" component={ReceptionistDashboardScreen} />
            )}
            <Stack.Screen name="PatientDetails" component={PatientDetailsScreen} />
          </>
        ) : (
          // User is not logged in
          <>
            <Stack.Screen name="Landing" component={LandingScreen} />
            <Stack.Screen name="Signup" component={SignupScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

export default RootNavigator;


