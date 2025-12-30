import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { I18nManager, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { I18nextProvider, useTranslation } from 'react-i18next';
import * as Updates from 'expo-updates';
import { useFonts, Cairo_400Regular, Cairo_500Medium, Cairo_600SemiBold, Cairo_700Bold } from '@expo-google-fonts/cairo';
import type { TFunction } from 'i18next';

import i18n from '../i18n';

export type Language = 'en' | 'ar' | 'fr';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => Promise<void>;
  t: TFunction;
  isRTL: boolean;
  fontsLoaded: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);
const LANGUAGE_STORAGE_KEY = 'app_language';
const supportedLanguages: Language[] = ['en', 'ar', 'fr'];
const TRANSLATION_NAMESPACES = ['common', 'auth', 'home', 'profile', 'search', 'activity'] as const;

const LanguageProviderInner: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { t } = useTranslation(TRANSLATION_NAMESPACES);
  const [language, setLanguageState] = useState<Language>('en');
  const [isRTL, setIsRTL] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Load Arabic fonts (Cairo family)
  const [fontsLoaded] = useFonts({
    Cairo_400Regular,
    Cairo_500Medium,
    Cairo_600SemiBold,
    Cairo_700Bold,
  });

  const updateLayoutDirection = useCallback((nextRTL: boolean) => {
    try {
      if (I18nManager.isRTL !== nextRTL) {
        I18nManager.allowRTL(nextRTL);
        I18nManager.forceRTL(nextRTL);
      }
    } catch (error) {
      console.warn('RTL toggle failed:', error);
    }
  }, []);

  const applyLanguage = useCallback(
    async (lang: Language) => {
      const nextRTL = lang === 'ar';
      updateLayoutDirection(nextRTL);

      await i18n.changeLanguage(lang);
      setLanguageState(lang);
      setIsRTL(nextRTL);
    },
    [updateLayoutDirection]
  );

  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const stored = (await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY)) as Language | null;
        const initial = stored && supportedLanguages.includes(stored) ? stored : 'en';
        await applyLanguage(initial);
      } catch (error) {
        console.error('Failed to load language:', error);
      } finally {
        setIsReady(true);
      }
    };

    loadLanguage();
  }, [applyLanguage]);

  const setLanguage = useCallback(async (newLanguage: Language) => {
    if (!supportedLanguages.includes(newLanguage) || newLanguage === language) {
      return;
    }

    const nextRTL = newLanguage === 'ar';
    const needsReload = nextRTL !== I18nManager.isRTL;

    try {
      await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, newLanguage);
      await applyLanguage(newLanguage);

      if (needsReload) {
        if (Platform.OS === 'web') {
          const browser = globalThis as typeof globalThis & { location?: { reload: () => void } };
          browser.location?.reload();
          return;
        }

        try {
          await Updates.reloadAsync();
        } catch (reloadError) {
          console.warn('App reload failed after language change:', reloadError);
        }
      }
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  }, [applyLanguage, language]);

  if (!isReady || !fontsLoaded) {
    return null;
  }

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, isRTL, fontsLoaded }}>
      {children}
    </LanguageContext.Provider>
  );
};

interface LanguageProviderProps {
  children: ReactNode;
}

export const LanguageProvider: React.FC<LanguageProviderProps> = ({ children }) => (
  <I18nextProvider i18n={i18n}>
    <LanguageProviderInner>{children}</LanguageProviderInner>
  </I18nextProvider>
);

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
