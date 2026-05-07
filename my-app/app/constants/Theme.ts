import { StyleSheet } from 'react-native';
import { Colors } from './Colors';

export const Theme = {
  borderRadius: {
    sm:   6,
    md:   10,
    lg:   12,    // cards (V3)
    xl:   20,    // auth card panel
    xxl:  20,
    full: 999,   // pill buttons only
    wave: 14,
  },
  spacing: {
    xs:  4,
    sm:  8,
    md:  16,
    lg:  24,
    xl:  32,
    xxl: 48,
  },
  // V3 type scale — keep dramatic contrast
  fontSize: {
    label: 11,
    small: 13,
    body: 15,
    h2: 20,
    h1: 26,
    title: 28,
    display: 34,
  },
  shadow: {
    // Kept minimal — for FAB only
    card: {
      shadowColor: 'transparent',
      elevation: 0,
    },
    btn: {
      shadowColor: Colors.ink,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.10,
      shadowRadius: 10,
      elevation: 6,
    },
    float: {
      shadowColor: Colors.ink,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.10,
      shadowRadius: 12,
      elevation: 8,
    },
    glow: {
      shadowColor: Colors.accent,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.18,
      shadowRadius: 6,
      elevation: 3,
    },
  },
};

export const globalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.paper,
  },
  surface: {
    backgroundColor: Colors.surface,
  },
  // Section label — small caps, tracked, muted
  sectionLabel: {
    fontFamily: 'Nunito_700Bold',
    fontSize: Theme.fontSize.label,
    color: Colors.muted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
  },
  // Pill CTA button
  btnPrimary: {
    backgroundColor: Colors.ink,
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 15,
    alignItems: 'center',
  },
  btnPrimaryText: {
    color: Colors.white,
    fontSize: Theme.fontSize.body,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 0.3,
  },
  // Display heading
  displayHeading: {
    fontFamily: 'DMSerifDisplay_400Regular',
    color: Colors.ink,
    fontSize: Theme.fontSize.display,
    lineHeight: 39,
    letterSpacing: -0.5,
  },
  heading: {
    fontFamily: 'DMSerifDisplay_400Regular',
    color: Colors.ink,
    fontSize: Theme.fontSize.h1,
    lineHeight: 32,
    letterSpacing: -0.5,
  },
  subheading: {
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.body,
    fontSize: Theme.fontSize.body,
  },
  body: {
    fontFamily: 'Nunito_400Regular',
    color: Colors.body,
    fontSize: Theme.fontSize.body,
    lineHeight: 24,
  },
  muted: {
    fontFamily: 'Nunito_400Regular',
    color: Colors.muted,
    fontSize: Theme.fontSize.small,
  },
  // Bottom-border-only input
  input: {
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingVertical: 12,
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.body,
    color: Colors.body,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  // Accent text link
  textLink: {
    fontFamily: 'Nunito_700Bold',
    fontSize: Theme.fontSize.small,
    color: Colors.accent,
  },
});