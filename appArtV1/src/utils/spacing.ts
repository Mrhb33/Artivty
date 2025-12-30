/**
 * Spacing System - Consistent spacing across the app
 *
 * Screen Padding: 16-20px (use 'screen' or 'screen-lg')
 * Vertical Rhythm: 8/12/16px (use 'xs', 'sm', 'md' for consistent spacing)
 */

// Screen padding (horizontal margins for content)
export const SPACING = {
  // Screen padding (16-20px range)
  screen: 16,    // Standard screen padding (4 in Tailwind)
  screenLg: 20,  // Larger screen padding (5 in Tailwind)

  // Vertical rhythm (8/12/16px scale for consistent spacing)
  xs: 8,   // Small gaps (2 in Tailwind)
  sm: 12,  // Medium gaps (3 in Tailwind)
  md: 16,  // Large gaps (4 in Tailwind)

  // Content spacing (within components)
  content: 16,   // Card content padding (4 in Tailwind)
  contentSm: 12, // Smaller content padding (3 in Tailwind)

  // Element spacing
  element: 8,    // Between small elements (2 in Tailwind)
  elementMd: 12, // Between medium elements (3 in Tailwind)
  elementLg: 16, // Between large elements (4 in Tailwind)
} as const;

// Common spacing combinations for screens
export const SCREEN_SPACING = {
  // Horizontal padding for screens
  horizontal: `px-${SPACING.screen / 4}`, // 'px-4' = 16px

  // Vertical spacing between sections
  section: `mb-${SPACING.md / 4}`,     // 'mb-4' = 16px
  sectionSm: `mb-${SPACING.sm / 4}`,   // 'mb-3' = 12px

  // Content spacing
  content: `p-${SPACING.content / 4}`, // 'p-4' = 16px
} as const;
