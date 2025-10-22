import { useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

type RootStackParamList = {
  Splash: undefined;
  Login: undefined;
  PatientSelection: undefined;
  Recording: { patient: Patient };
  ClinicalNotes: { patient: Patient; recordingDuration: number };
  PreviousPatients: undefined;
};

type Patient = {
  id: string;
  name: string;
  age: number;
  condition: string;
  priority: 'low' | 'medium' | 'high';
  waitTime: string;
  appointmentTime: string;
};

export const useNavigationWithLoading = () => {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [loadingVariant, setLoadingVariant] = useState<'default' | 'medical' | 'simulation' | 'analysis'>('medical');

  const navigateWithLoading = async (
    screen: keyof RootStackParamList,
    params?: any,
    options?: {
      message?: string;
      variant?: 'default' | 'medical' | 'simulation' | 'analysis';
      delay?: number;
    }
  ) => {
    const {
      message = 'Loading...',
      variant = 'medical',
      delay = 800
    } = options || {};

    setLoadingMessage(message);
    setLoadingVariant(variant);
    setIsLoading(true);

    // Simulate loading time
    setTimeout(() => {
      setIsLoading(false);
      navigation.navigate(screen as any, params);
    }, delay);
  };

  const replaceWithLoading = async (
    screen: keyof RootStackParamList,
    params?: any,
    options?: {
      message?: string;
      variant?: 'default' | 'medical' | 'simulation' | 'analysis';
      delay?: number;
    }
  ) => {
    const {
      message = 'Loading...',
      variant = 'medical',
      delay = 600
    } = options || {};

    setLoadingMessage(message);
    setLoadingVariant(variant);
    setIsLoading(true);

    setTimeout(() => {
      setIsLoading(false);
      navigation.replace(screen as any, params);
    }, delay);
  };

  return {
    isLoading,
    loadingMessage,
    loadingVariant,
    navigateWithLoading,
    replaceWithLoading,
    navigation
  };
};
