/**
 * Dark Developer Studio Design Tokens
 * Solid typography hierarchy (no gradient text) with authentic developer studio accents (Cyan, Emerald, Amber).
 */
export const studioTokens = {
  // Solid Typography Hierarchy (Never multi-color gradients inside words/headings)
  typography: {
    headingPrimary: '#FFFFFF',    // Pure White: Primary headings
    headingSecondary: '#F5F5F4',  // Stone-100: Secondary titles, card names
    body: '#D6D3D1',              // Stone-300: High-legibility reading body text
    secondary: '#A8A29E',         // Stone-400: Explanatory text, labels
    metadata: '#78716C',          // Stone-500: Timestamps, tags, slugs, versions
    disabled: '#57534E',          // Stone-600: Inactive/disabled states
  },

  // Developer Studio Accent System (Icons, Badges, Borders, Buttons, Indicators)
  accents: {
    cyan: {
      default: '#22D3EE',
      hover: '#06B6D4',
      glow: '#0891B2',
      surface: 'rgba(8, 145, 178, 0.15)',
      border: 'rgba(8, 145, 178, 0.4)',
    },
    emerald: {
      default: '#34D399',
      hover: '#10B981',
      surface: 'rgba(5, 150, 105, 0.15)',
      border: 'rgba(5, 150, 105, 0.4)',
    },
    amber: {
      default: '#FBBF24',
      hover: '#F59E0B',
      surface: 'rgba(217, 119, 6, 0.15)',
      border: 'rgba(217, 119, 6, 0.4)',
    },
  },

  // Surfaces & Backgrounds
  surfaces: {
    base: '#0B0D13',
    card: '#0F1118',
    cardHover: '#131622',
    navbar: '#090B11',
    border: '#1C1F2B',
    borderHighlight: '#2A3042',
  },
} as const;

export const typographyTokens = studioTokens.typography;
