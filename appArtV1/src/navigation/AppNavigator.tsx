import React, { useEffect, useMemo, useState } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import CreateRequestScreen from '../screens/CreateRequestScreen';
import ActivityUserPage from '../screens/activityUserPage';
import ActivityArtistPage from '../screens/activityArtistPage';
import ProfileScreen from '../screens/ProfileScreen';

import ArtistProfileScreen from '../screens/ArtistProfileScreen';
import RequestDetailsScreen from '../screens/RequestDetailsScreen';
import RoleSelectionScreen from '../screens/RoleSelectionScreen';
import SplashScreen from '../screens/SplashScreen';
import WelcomeScreen from '../screens/WelcomeScreen';
import SignInScreen from '../screens/SignInScreen';
import CreateAccountScreen from '../screens/CreateAccountScreen';

import CustomTabBar from '../components/CustomTabBar';
import { CreateModal } from '../components';

import { RootStackParamList } from '../types/navigation';
import { useAuthStore } from '../stores/authStore';
import { useCurrentUser } from '../hooks/useAuth';
import { useLanguage } from '../contexts/LanguageContext';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Main tab navigator - Role-based tabs
 */
const MainTabNavigator = () => {
  const { user, activeMode } = useAuthStore();
  const [createModalVisible, setCreateModalVisible] = useState(false);
  const { t, language } = useLanguage();

  const isArtistMode = activeMode === 'ARTIST' || user?.role === 'artist';
  const ActivityComponent = isArtistMode ? ActivityArtistPage : ActivityUserPage;

  return (
    <>
      <Tab.Navigator
        key={language}
        tabBar={(props) => <CustomTabBar {...props} />}
        screenOptions={{ headerShown: false }}
      >
        {isArtistMode ? (
          <>
            <Tab.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: t('nav.gallery'), tabBarLabel: t('nav.gallery') }}
            />
            <Tab.Screen
              name="Activity"
              component={ActivityComponent}
              options={{ title: t('nav.activity'), tabBarLabel: t('nav.activity') }}
            />
            <Tab.Screen
              name="Search"
              component={SearchScreen}
              options={{ title: t('nav.search'), tabBarLabel: t('nav.search') }}
            />
            <Tab.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: t('nav.profile'), tabBarLabel: t('nav.profile') }}
            />
          </>
        ) : (
          <>
            <Tab.Screen
              name="Home"
              component={HomeScreen}
              options={{ title: t('nav.home'), tabBarLabel: t('nav.home') }}
            />
            <Tab.Screen
              name="Search"
              component={SearchScreen}
              options={{ title: t('nav.search'), tabBarLabel: t('nav.search') }}
            />
            <Tab.Screen
              name="Create"
              component={CreateRequestScreen}
              options={{ title: t('nav.sendOrder'), tabBarLabel: t('nav.order') }}
              listeners={{
                tabPress: (e) => {
                  e.preventDefault();
                  setCreateModalVisible(true);
                },
              }}
            />
            <Tab.Screen
              name="Activity"
              component={ActivityComponent}
              options={{ title: t('nav.activity'), tabBarLabel: t('nav.activity') }}
            />
            <Tab.Screen
              name="Profile"
              component={ProfileScreen}
              options={{ title: t('nav.profile'), tabBarLabel: t('nav.profile') }}
            />
          </>
        )}
      </Tab.Navigator>

      {!isArtistMode && (
        <CreateModal
          visible={createModalVisible}
          onClose={() => setCreateModalVisible(false)}
        />
      )}
    </>
  );
};

/**
 * Stack navigator for onboarding + details + app
 */
const AppNavigator = () => {
  const { isAuthenticated, roleSelected, setUser, hasSeenWelcome } = useAuthStore();
  const { data: currentUser, isLoading: isLoadingUser } = useCurrentUser();
  const { language } = useLanguage();

  // Keep splash visible at least a bit for luxury feel
  const [splashAcknowledged, setSplashAcknowledged] = useState(false);

  // Sync store user from backend "me" endpoint (when authenticated)
  useEffect(() => {
    if (currentUser) setUser(currentUser);
  }, [currentUser, setUser]);

  const initialAuthRoute = useMemo<'Welcome' | 'SignIn'>(() => {
    return hasSeenWelcome ? 'SignIn' : 'Welcome';
  }, [hasSeenWelcome]);

  const showSplash = (!splashAcknowledged) || (isAuthenticated && isLoadingUser);
  const initialRouteName: keyof RootStackParamList = showSplash
    ? 'Splash'
    : isAuthenticated
      ? roleSelected
        ? 'MainTabs'
        : 'RoleSelection'
      : initialAuthRoute;
  const navigatorKey = `${language}-${initialRouteName}-${showSplash}`;

  return (
    <Stack.Navigator
      key={navigatorKey} // re-render stack when the visible flow changes
      initialRouteName={initialRouteName}
      screenOptions={{ headerShown: false }}
    >
      {showSplash ? (
        <Stack.Screen name="Splash">
          {(props) => (
            <SplashScreen
              {...props}
              onContinue={() => setSplashAcknowledged(true)}
            />
          )}
        </Stack.Screen>
      ) : isAuthenticated ? (
        <>
          {!roleSelected ? (
            <Stack.Screen name="RoleSelection" component={RoleSelectionScreen} />
          ) : (
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
          )}

          {/* Detail / modal screens that sit on top of tabs */}
          <Stack.Screen name="RequestDetails" component={RequestDetailsScreen} />
          <Stack.Screen name="ArtistProfile" component={ArtistProfileScreen} />
        </>
      ) : (
        <>
          <Stack.Screen name="Welcome" component={WelcomeScreen} />
          <Stack.Screen name="SignIn" component={SignInScreen} />
          <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
        </>
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
