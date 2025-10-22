import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { useTheme } from '../themes/ThemeContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import ModernIcon from './ModernIcon';
import Logo from './Logo';

const { width } = Dimensions.get('window');

type RootStackParamList = {
  Login: undefined;
  PatientSelection: undefined;
  Recording: { patient: Patient };
  ClinicalNotes: { patient: Patient; recordingDuration: number };
  PreviousPatients: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface Patient {
  id: string;
  name: string;
  age: number;
  condition: string;
  priority: 'low' | 'medium' | 'high';
  waitTime: string;
  appointmentTime: string;
}

interface HamburgerMenuProps {
  isVisible: boolean;
  onClose: () => void;
}

const HamburgerMenu: React.FC<HamburgerMenuProps> = ({ isVisible, onClose }) => {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProp>();
  const [slideAnim] = useState(new Animated.Value(-width));

  React.useEffect(() => {
    if (isVisible) {
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }).start();
    } else {
      Animated.spring(slideAnim, {
        toValue: -width,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }).start();
    }
  }, [isVisible, slideAnim]);

  const handleNavigation = (screen: keyof RootStackParamList) => {
    onClose();
    if (screen !== 'PatientSelection') {
      navigation.navigate(screen as any);
    }
  };

  const menuItems = [
    {
      id: 'queue',
      title: 'Patient Queue',
      subtitle: 'View and manage patient queue',
      icon: 'users',
      screen: 'PatientSelection' as const,
      color: theme.colors.primary,
    },
    {
      id: 'previous',
      title: 'Previous Patients',
      subtitle: 'View completed consultations',
      icon: 'calendar',
      screen: 'PreviousPatients' as const,
      color: theme.colors.medicalSuccess,
    },
  ];

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity
          style={styles.overlayTouchable}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <View
            style={[
              styles.menuContainer,
              { backgroundColor: theme.colors.surface },
            ]}
          >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Logo width={48} height={48} />
            </View>
            <Text style={[styles.appTitle, { color: theme.colors.foreground }]}>
              MediEase Clinic
            </Text>
            <Text style={[styles.appSubtitle, { color: theme.colors.foregroundSecondary }]}>
              Professional Healthcare
            </Text>
          </View>

          {/* Menu Items */}
          <View style={styles.menuItems}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, { borderBottomColor: theme.colors.borderLight }]}
                onPress={() => handleNavigation(item.screen)}
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, { backgroundColor: `${item.color}15` }]}>
                  <ModernIcon name={item.icon} size={24} color={item.color} />
                </View>
                <View style={styles.menuContent}>
                  <Text style={[styles.menuTitle, { color: theme.colors.foreground }]}>
                    {item.title}
                  </Text>
                  <Text style={[styles.menuSubtitle, { color: theme.colors.foregroundSecondary }]}>
                    {item.subtitle}
                  </Text>
                </View>
                <ModernIcon name="chevron-right" size={20} color={theme.colors.foregroundMuted} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: theme.colors.borderLight }]}>
            <Text style={[styles.footerText, { color: theme.colors.foregroundMuted }]}>
              Version 1.0.0
            </Text>
          </View>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    flexDirection: 'row',
  },
  overlayTouchable: {
    flex: 1,
  },
  menuContainer: {
    width: width * 0.8,
    maxWidth: 320,
    height: '100%',
    ...StyleSheet.flatten({
      shadowColor: '#000',
      shadowOffset: { width: -2, height: 0 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 16,
    }),
  },
  header: {
    padding: 24,
    paddingTop: 48,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  logoContainer: {
    marginBottom: 16,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  appSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  menuItems: {
    flex: 1,
    paddingTop: 16,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  menuIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 14,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default HamburgerMenu;
