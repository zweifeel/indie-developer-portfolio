/**
 * Professional Monochrome Developer Studio Design Tokens
 * Strictly neutral typography with WCAG 2.1 AA compliant contrast.
 * No neon text, no gradient headings, no colorful stats text.
 */
export const typographyTokens = {
  // Neutral Typography Hierarchy
  headingPrimary: '#F5F5F4',   // Stone-100: Main page titles and hero headline
  headingSecondary: '#E7E5E4', // Stone-200: Section titles, card names
  body: '#D6D3D1',             // Stone-300: High-legibility reading body text
  secondary: '#A8A29E',        // Stone-400: Explanatory text, labels
  metadata: '#8A8580',         // Refined Stone: Timestamps, tags, slugs, versions
  disabled: '#6B6661',         // Stone-600: Inactive/disabled states

  // Surfaces & Borders
  background: {
    main: '#090A0F',
    surface: '#0E1017',
    card: '#13151F',
    cardHover: '#181B28',
    cardBorder: '#232634',
    cardBorderHover: '#363A4D',
  },
  border: {
    subtle: '#1C1F2B',
    default: '#272B3B',
    highlight: '#3B4056',
  },

  // Focus and Micro-Interactions (Restricted to borders/focus rings only - never text)
  ui: {
    focusRing: '#94A3B8',
    activeDot: '#E2E8F0',
  },
} as const;
