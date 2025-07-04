import {createLocalizedPathnamesNavigation} from 'next-intl/navigation';

export const locales = ['en', 'es'] as const;
export const localePrefix = 'always';

// The `pathnames` object holds pairs of internal names and translated paths.
// The key is the internal name of the path, and the value is an object
// with the translated paths for each locale.
export const pathnames = {
  '/': '/',
  '/dashboard': {
    en: '/dashboard',
    es: '/dashboard'
  },
  '/editor': {
    en: '/editor',
    es: '/editor'
  },
  '/files': {
    en: '/files',
    es: '/archivos'
  },
  '/exercises': {
    en: '/exercises',
    es: '/ejercicios'
  },
  '/evaluations': {
    en: '/evaluations',
    es: '/evaluaciones'
  },
  '/html-presenter': {
    en: '/html-presenter',
    es: '/presentador-html'
  },
  '/groups': {
    en: '/groups',
    es: '/grupos'
  },
  '/login': {
    en: '/login',
    es: '/iniciar-sesion'
  },
  '/signup': {
    en: '/signup',
    es: '/registro'
  }
};

export const {Link, redirect, usePathname, useRouter} =
  createLocalizedPathnamesNavigation({locales, localePrefix, pathnames});
