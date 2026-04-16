import { StyleSheet } from 'react-native';
import { Colors } from './Colors';
 
export const Theme = {
  borderRadius: {
    sm: 8,
    md: 14,
    lg: 20,
    xl: 28,
    full: 999,
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },
  shadow: {
    card: {
      shadowColor: '#2D2D2D',
      shadowOffset: { width: 0, height: 3 },
      shadowOpacity: 0.08,
      shadowRadius: 12,
      elevation: 4,
    },
    btn: {
      shadowColor: '#C4623A',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 8,
      elevation: 6,
    },
  },
};
 
export const globalStyles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.cream,
  },
  card: {
    backgroundColor: Colors.sand,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.md,
    ...Theme.shadow.card,
  },
  btnPrimary: {
    backgroundColor: Colors.terracotta,
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 14,
    paddingHorizontal: 28,
    alignItems: 'center',
    ...Theme.shadow.btn,
  },
  btnPrimaryText: {
    color: Colors.white,
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
    letterSpacing: 0.3,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 13,
    paddingHorizontal: 28,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: Colors.terracotta,
  },
  btnSecondaryText: {
    color: Colors.terracotta,
    fontSize: 15,
    fontFamily: 'Nunito_700Bold',
  },
  heading: {
    fontFamily: 'DMSerifDisplay_400Regular',
    color: Colors.charcoal,
    fontSize: 28,
    lineHeight: 34,
  },
  subheading: {
    fontFamily: 'Nunito_700Bold',
    color: Colors.charcoal,
    fontSize: 16,
  },
  body: {
    fontFamily: 'Nunito_400Regular',
    color: Colors.charcoal,
    fontSize: 14,
    lineHeight: 20,
  },
  muted: {
    fontFamily: 'Nunito_400Regular',
    color: Colors.muted,
    fontSize: 13,
  },
  input: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.md,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 14,
    fontFamily: 'Nunito_400Regular',
    fontSize: 15,
    color: Colors.charcoal,
    borderWidth: 1.5,
    borderColor: Colors.sandDark,
  },
  inputFocused: {
    borderColor: Colors.terracotta,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});