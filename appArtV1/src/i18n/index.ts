import i18n from 'i18next';
import type { InitOptions } from 'i18next';
import { initReactI18next } from 'react-i18next';

import activityEn from '../locales/en/activity.json';
import activityAr from '../locales/ar/activity.json';
import activityFr from '../locales/fr/activity.json';
import authEn from '../locales/en/auth.json';
import authAr from '../locales/ar/auth.json';
import authFr from '../locales/fr/auth.json';
import commonEn from '../locales/en/common.json';
import commonAr from '../locales/ar/common.json';
import commonFr from '../locales/fr/common.json';
import homeEn from '../locales/en/home.json';
import homeAr from '../locales/ar/home.json';
import homeFr from '../locales/fr/home.json';
import profileEn from '../locales/en/profile.json';
import profileAr from '../locales/ar/profile.json';
import profileFr from '../locales/fr/profile.json';
import searchEn from '../locales/en/search.json';
import searchAr from '../locales/ar/search.json';
import searchFr from '../locales/fr/search.json';

const resources = {
  en: {
    activity: activityEn,
    auth: authEn,
    common: commonEn,
    home: homeEn,
    profile: profileEn,
    search: searchEn,
  },
  ar: {
    activity: activityAr,
    auth: authAr,
    common: commonAr,
    home: homeAr,
    profile: profileAr,
    search: searchAr,
  },
  fr: {
    activity: activityFr,
    auth: authFr,
    common: commonFr,
    home: homeFr,
    profile: profileFr,
    search: searchFr,
  },
};

const i18nConfig: InitOptions = {
  resources,
  fallbackLng: 'en',
  lng: 'en',
  ns: ['common', 'auth', 'home', 'search', 'profile', 'activity'],
  defaultNS: 'common',
  compatibilityJSON: 'v4',
  interpolation: {
    escapeValue: false,
  },
  react: {
    useSuspense: false,
  },
};

void i18n.use(initReactI18next).init(i18nConfig);

export default i18n;
