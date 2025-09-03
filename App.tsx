import React from 'react';
import { NavigationContainer, DefaultTheme, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { AuthProvider, useAuth } from './src/providers/AuthProvider';
import { PlayerProvider } from './src/providers/PlayerProvider';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { LoginScreen } from './src/screens/LoginScreen';
import { SignUpScreen } from './src/screens/SignUpScreen';
import { ResetPasswordScreen } from './src/screens/ResetPasswordScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { HumanDashboard } from './src/screens/HumanDashboard';
import { DemonDashboard } from './src/screens/DemonDashboard';
import { Platform } from 'react-native';
import { WebLoginScreen } from './src/screens/WebLoginScreen';
import { WebSignUpScreen } from './src/screens/WebSignUpScreen';
import { WebResetPasswordScreen } from './src/screens/WebResetPasswordScreen';
import { EmailSentScreen } from './src/screens/EmailSentScreen';

const darkTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: '#0B0B0C',
    text: '#E6E8EB',
    border: '#2A2E33',
    primary: '#E6F14A',
    card: '#0B0B0C',
    notification: '#E6F14A',
  },
};

type RootStackParamList = {
  Welcome: undefined;
  Login: undefined;
  SignUp: undefined;
  ResetPassword: undefined;
  Home: undefined;
  HumanDashboard: undefined;
  DemonDashboard: undefined;
  EmailSent: undefined;
  // Web-specific routes to avoid conflicts
  WebLogin: undefined;
  WebSignUp: undefined;
  WebResetPassword: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const RootNavigator = () => {
  // More robust platform detection
  const isWeb = Platform.OS === 'web';
  const isMobile = Platform.OS === 'ios' || Platform.OS === 'android';
  
  // Enhanced logging for debugging
  console.log('=== PLATFORM DETECTION ===');
  console.log('Platform.OS:', Platform.OS);
  console.log('Platform.Version:', Platform.Version);
  console.log('Platform.isTV:', Platform.isTV);
  console.log('Is Web:', isWeb);
  console.log('Is Mobile:', isMobile);
  console.log('========================');
  
  // Ensure mobile users get mobile screens
  if (isMobile && !isWeb) {
    console.log('✅ Routing to MOBILE screens');
  } else if (isWeb) {
    console.log('✅ Routing to WEB screens');
  } else {
    console.log('⚠️ Unknown platform, defaulting to mobile');
  }
  
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {isWeb ? (
        <>
          {/* Web screens */}
          <Stack.Screen name="WebLogin" component={WebLoginScreen} />
          <Stack.Screen name="WebSignUp" component={WebSignUpScreen} />
          <Stack.Screen name="WebResetPassword" component={WebResetPasswordScreen} />
          <Stack.Screen name="EmailSent" component={EmailSentScreen} />
          <Stack.Screen name="HumanDashboard" component={HumanDashboard} />
          <Stack.Screen name="DemonDashboard" component={DemonDashboard} />

        </>
      ) : (
        <>
          {/* Mobile screens */}
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
          <Stack.Screen name="ResetPassword" component={ResetPasswordScreen} />
          <Stack.Screen name="EmailSent" component={EmailSentScreen} />
          <Stack.Screen name="HumanDashboard" component={HumanDashboard} />
          <Stack.Screen name="DemonDashboard" component={DemonDashboard} />

        </>
      )}
    </Stack.Navigator>
  );
};

export default function App() {
  // Log the platform at app startup
  console.log('🚀 App starting on platform:', Platform.OS);
  
  return (
    <AuthProvider>
      <PlayerProvider>
        <NavigationContainer theme={darkTheme}>
          <RootNavigator />
        </NavigationContainer>
      </PlayerProvider>
    </AuthProvider>
  );
}
