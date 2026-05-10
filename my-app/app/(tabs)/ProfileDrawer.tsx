import { useEffect, useRef } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { Theme } from '../../src/constants/Theme';

type ProfileDrawerProps = {
  open: boolean;
  onClose: () => void;
  name: string;
  bio: string;
  onNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onSave: () => void;
  onSignOut: () => void;
  saving: boolean;
};

export default function ProfileDrawer({
  open,
  onClose,
  name,
  bio,
  onNameChange,
  onBioChange,
  onSave,
  saving,
  onSignOut,
}: ProfileDrawerProps) {
  const { colors, themeMode, setThemeMode } = useTheme();
  const drawerTranslate = useRef(new Animated.Value(400)).current;
  const overlayOpacity  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(drawerTranslate, {
        toValue:         open ? 0 : 400,
        duration:        280,
        easing:          Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue:         open ? 1 : 0,
        duration:        open ? 280 : 200,
        easing:          Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();
  }, [drawerTranslate, overlayOpacity, open]);

  return (
    <View style={styles.drawerLayer} pointerEvents="box-none">

      {/* ── Dim overlay ──────────────────────────────────────────────────── */}
      <Animated.View style={[styles.drawerOverlay, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      {/* ── Drawer panel ─────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.drawer,
          {
            transform:       [{ translateX: drawerTranslate }],
            backgroundColor: colors.surface  ?? '#1C1B1A',
            borderLeftColor: colors.border   ?? '#2E2C2A',
          },
        ]}
      >

        {/* ── Header ───────────────────────────────────────────────────── */}
        <View style={styles.drawerHeader}>
          <View style={styles.drawerTitleBlock}>
            <Text style={[styles.drawerLabel, { color: colors.ink ?? '#F0EBE3' }]}>
              Settings
            </Text>
            <Text style={[styles.drawerHint, { color: colors.muted ?? '#6B6760' }]}>
              Edit details · theme · sign out
            </Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.surface2 ?? '#252422', borderColor: colors.border ?? '#2E2C2A' }]}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={18} color={colors.muted ?? '#6B6760'} />
          </TouchableOpacity>
        </View>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <View style={[styles.divider, { backgroundColor: colors.border ?? '#2E2C2A' }]} />

        {/* ── Edit profile ─────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted ?? '#6B6760' }]}>
            EDIT PROFILE
          </Text>

          {/* Name field */}
          <View style={[styles.inputCard, { backgroundColor: colors.surface2 ?? '#252422', borderColor: colors.border ?? '#2E2C2A' }]}>
            <Text style={[styles.inputFloatLabel, { color: colors.muted ?? '#6B6760' }]}>NAME</Text>
            <TextInput
              value={name}
              onChangeText={onNameChange}
              placeholder="Your name"
              placeholderTextColor={colors.muted ?? '#6B6760'}
              style={[styles.inputField, { color: colors.ink ?? '#F0EBE3' }]}
            />
          </View>

          {/* Bio field */}
          <View style={[styles.inputCard, { backgroundColor: colors.surface2 ?? '#252422', borderColor: colors.border ?? '#2E2C2A' }]}>
            <Text style={[styles.inputFloatLabel, { color: colors.muted ?? '#6B6760' }]}>BIO</Text>
            <TextInput
              value={bio}
              onChangeText={onBioChange}
              placeholder="Your bio"
              placeholderTextColor={colors.muted ?? '#6B6760'}
              style={[styles.inputField, styles.bioField, { color: colors.ink ?? '#F0EBE3' }]}
              multiline
            />
          </View>

          {/* Save button — inverted high-contrast */}
          <TouchableOpacity
            style={[
              styles.saveBtn,
              { backgroundColor: colors.ink ?? '#F0EBE3' },
              saving && styles.saveBtnDisabled,
            ]}
            onPress={onSave}
            disabled={saving}
            activeOpacity={0.85}
          >
            <Text style={[styles.saveBtnText, { color: colors.background ?? '#111010' }]}>
              {saving ? 'Saving…' : 'Save changes'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <View style={[styles.divider, { backgroundColor: colors.border ?? '#2E2C2A' }]} />

        {/* ── Theme ────────────────────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted ?? '#6B6760' }]}>THEME</Text>
          <View style={styles.themeRow}>
            {(['light', 'dark'] as const).map((mode) => {
              const isActive = themeMode === mode;
              return (
                <TouchableOpacity
                  key={mode}
                  onPress={() => setThemeMode(mode)}
                  activeOpacity={0.8}
                  style={[
                    styles.themeOption,
                    {
                      backgroundColor: isActive
                        ? colors.accentSurface ?? '#2A2420'
                        : colors.surface2     ?? '#252422',
                      borderColor: isActive
                        ? colors.accent ?? '#C8A882'
                        : colors.border ?? '#2E2C2A',
                    },
                  ]}
                >
                  <Text style={styles.themeEmoji}>
                    {mode === 'light' ? '☀️' : '🌙'}
                  </Text>
                  <Text
                    style={[
                      styles.themeLabel,
                      {
                        color: isActive
                          ? colors.accent ?? '#C8A882'
                          : colors.muted  ?? '#6B6760',
                        fontFamily: isActive ? 'Nunito_700Bold' : 'Nunito_400Regular',
                      },
                    ]}
                  >
                    {mode === 'light' ? 'Light' : 'Dark'}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* ── Divider ──────────────────────────────────────────────────── */}
        <View style={[styles.divider, { backgroundColor: colors.border ?? '#2E2C2A' }]} />

        {/* ── Account / Sign out ───────────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.muted ?? '#6B6760' }]}>ACCOUNT</Text>
          <TouchableOpacity
            style={[
              styles.signOutBtn,
              {
                backgroundColor: colors.surface2 ?? '#252422',
                borderColor:     '#8B4444',
              },
            ]}
            onPress={onSignOut}
            activeOpacity={0.8}
          >
            <Text style={styles.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

      </Animated.View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  drawerLayer: {
    position: 'absolute',
    top:      0,
    right:    0,
    bottom:   0,
    left:     0,
    alignItems: 'flex-end',
  },

  drawerOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.52)',
  },

  drawer: {
    width:       '82%',
    height:      '100%',
    paddingTop:  60,
    paddingHorizontal: Theme.spacing.lg,
    borderLeftWidth: 1,
    shadowColor:    '#000',
    shadowOffset:   { width: -8, height: 0 },
    shadowOpacity:  0.4,
    shadowRadius:   28,
    elevation:      24,
    gap:            0,
  },

  // ── Header ──────────────────────────────────────────────────────────────

  drawerHeader: {
    flexDirection:  'row',
    alignItems:     'flex-start',
    justifyContent: 'space-between',
    marginBottom:   20,
    gap:            12,
  },

  drawerTitleBlock: {
    flex: 1,
    gap:  4,
  },

  drawerLabel: {
    fontFamily:    'DMSerifDisplay_400Regular',
    fontSize:      24,
    letterSpacing: -0.3,
    lineHeight:    30,
  },

  drawerHint: {
    fontFamily: 'Nunito_400Regular',
    fontSize:   12,
    lineHeight: 17,
  },

  closeBtn: {
    width:        36,
    height:       36,
    borderRadius: 18,
    borderWidth:  1,
    alignItems:   'center',
    justifyContent: 'center',
    marginTop:    2,
  },

  // ── Dividers ────────────────────────────────────────────────────────────

  divider: {
    height:        1,
    marginBottom:  20,
  },

  // ── Sections ────────────────────────────────────────────────────────────

  section: {
    gap:           10,
    marginBottom:  20,
  },

  sectionLabel: {
    fontFamily:    'Nunito_700Bold',
    fontSize:      10,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
    marginBottom:  2,
  },

  // ── Input cards ─────────────────────────────────────────────────────────

  // Floating-label style input — label sits above value inside the card
  inputCard: {
    borderWidth:       1,
    borderRadius:      14,
    paddingHorizontal: 14,
    paddingTop:        10,
    paddingBottom:     6,
    gap:               2,
  },

  inputFloatLabel: {
    fontFamily:    'Nunito_700Bold',
    fontSize:      9,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },

  inputField: {
    fontFamily:    'Nunito_400Regular',
    fontSize:      15,
    paddingVertical: 4,
  },

  bioField: {
    minHeight:         60,
    textAlignVertical: 'top',
  },

  // ── Save button ─────────────────────────────────────────────────────────

  saveBtn: {
    borderRadius:    Theme.borderRadius.full ?? 999,
    paddingVertical: 15,
    alignItems:      'center',
    marginTop:       4,
  },

  saveBtnDisabled: {
    opacity: 0.45,
  },

  saveBtnText: {
    fontFamily:    'Nunito_700Bold',
    fontSize:      14,
    letterSpacing: 0.2,
  },

  // ── Theme toggle ────────────────────────────────────────────────────────

  themeRow: {
    flexDirection: 'row',
    gap:           10,
  },

  themeOption: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            8,
    borderWidth:    1,
    borderRadius:   14,
    paddingVertical: 13,
  },

  themeEmoji: {
    fontSize: 15,
  },

  themeLabel: {
    fontSize: 13,
  },

  // ── Sign out ────────────────────────────────────────────────────────────

  signOutBtn: {
    borderWidth:     1,
    borderRadius:    Theme.borderRadius.full ?? 999,
    paddingVertical: 15,
    alignItems:      'center',
  },

  signOutText: {
    fontFamily:    'Nunito_700Bold',
    fontSize:      14,
    color:         '#8B4444',
    letterSpacing: 0.2,
  },
});