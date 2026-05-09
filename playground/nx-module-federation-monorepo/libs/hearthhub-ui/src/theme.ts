import { extendTheme } from '@chakra-ui/react';

export const hearthHubTheme = extendTheme({
  fonts: {
    body: 'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    heading:
      'Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
  },
  radii: {
    md: '8px',
    lg: '8px',
    xl: '8px',
  },
  colors: {
    hearth: {
      50: '#eef8f3',
      100: '#d7ede2',
      500: '#177052',
      600: '#075f45',
      700: '#064b39',
      800: '#06372c',
      900: '#03281f',
    },
    ember: {
      50: '#fff0eb',
      100: '#ffd9cc',
      500: '#dc5135',
      700: '#9d341f',
    },
    gold: {
      50: '#fff8e6',
      100: '#f8e7b3',
      500: '#c28b22',
      700: '#7d5615',
    },
  },
  styles: {
    global: {
      body: {
        bg: '#f6f4ee',
        color: '#111827',
      },
    },
  },
});
