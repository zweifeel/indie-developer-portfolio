/**
 * Centralized Design & Typography Tokens
 * Meets WCAG 2.1 AA on dark backgrounds (#090a0f, #0f121d, #141826)
 */
export const typographyTokens = {
  heading: '#FAFAF9',       // Stone-50: Crisp, clean, non-glaring heading
  body: '#E7E5E4',          // Stone-200: Soft primary reading text
  secondary: '#A8A29E',     // Stone-400: Clear secondary descriptive text
  tertiary: '#78716C',      // Stone-500: Subdued metadata, timestamps, captions
  accent: '#67E8F9',        // Cyan-300: Elegant link & key interactive accent
  accentHover: '#A5F3FC',   // Cyan-200: Focused/hover state
  disabled: '#57534E',      // Stone-600: Readable disabled/inactive state
  border: {
    subtle: '#1C1917',      // Stone-900
    default: '#292524',     // Stone-800
    highlight: '#44403C',   // Stone-700
  },
  background: {
    main: '#090A0F',
    surface: '#0F121D',
    card: '#141824',
    cardHover: '#1A2030',
  },
} as const;
