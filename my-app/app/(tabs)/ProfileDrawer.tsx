import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/context/ThemeContext';
import { Theme } from '../../src/constants/Theme';
import { AvailabilityStatus, PortfolioItem, PortfolioLink } from '../../src/types';

type DrawerTab = 'profile' | 'portfolio' | 'account' | 'settings';

type ProfileDrawerProps = {
  open: boolean;
  onClose: () => void;
  name: string;
  bio: string;
  location: string;
  portfolioItems: PortfolioItem[];
  portfolioLinks: PortfolioLink[];
  availabilityStatus?: AvailabilityStatus;
  onNameChange: (value: string) => void;
  onBioChange: (value: string) => void;
  onLocationChange: (value: string) => void;
  onPickAvatar: () => Promise<void>;
  onPortfolioItemsChange: (items: PortfolioItem[]) => void;
  onPortfolioLinksChange: (links: PortfolioLink[]) => void;
  onAvailabilityChange: (status: AvailabilityStatus) => void;
  onSave: () => void;
  onSignOut: () => void;
  onChangePassword: (value: string) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  saving: boolean;
};

export default function ProfileDrawer({
  open,
  onClose,
  name,
  bio,
  location,
  portfolioItems,
  portfolioLinks,
  availabilityStatus,
  onNameChange,
  onBioChange,
  onLocationChange,
  onPickAvatar,
  onPortfolioItemsChange,
  onPortfolioLinksChange,
  onAvailabilityChange,
  onSave,
  saving,
  onSignOut,
  onChangePassword,
  onDeleteAccount,
}: ProfileDrawerProps) {
  const { colors, themeMode, setThemeMode } = useTheme();
  const drawerTranslate = useRef(new Animated.Value(400)).current;
  const overlayOpacity = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState<DrawerTab>('profile');
  const [itemTitle, setItemTitle] = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemSkill, setItemSkill] = useState('');
  const [itemMediaUrl, setItemMediaUrl] = useState('');
  const [itemExternalLink, setItemExternalLink] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    Animated.parallel([
      Animated.timing(drawerTranslate, {
        toValue: open ? 0 : 400,
        duration: 280,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(overlayOpacity, {
        toValue: open ? 1 : 0,
        duration: open ? 280 : 200,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    ]).start();
  }, [drawerTranslate, overlayOpacity, open]);

  const createId = () => `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

  const addPortfolioItem = () => {
    if (!itemTitle.trim() || !itemMediaUrl.trim()) return;
    const next: PortfolioItem = {
      id: createId(),
      title: itemTitle.trim(),
      description: itemDescription.trim(),
      skillUsed: itemSkill.trim(),
      mediaType: 'link',
      mediaUrl: itemMediaUrl.trim(),
      externalLink: itemExternalLink.trim() || undefined,
    };
    onPortfolioItemsChange([next, ...portfolioItems]);
    setItemTitle('');
    setItemDescription('');
    setItemSkill('');
    setItemMediaUrl('');
    setItemExternalLink('');
  };

  const addPortfolioLink = () => {
    if (!linkLabel.trim() || !linkUrl.trim()) return;
    const next: PortfolioLink = {
      id: createId(),
      label: linkLabel.trim(),
      url: linkUrl.trim(),
    };
    onPortfolioLinksChange([next, ...portfolioLinks]);
    setLinkLabel('');
    setLinkUrl('');
  };

  return (
    <View style={styles.drawerLayer} pointerEvents="box-none">
      <Animated.View style={[styles.drawerOverlay, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View
        style={[
          styles.drawer,
          {
            transform: [{ translateX: drawerTranslate }],
            backgroundColor: colors.surface ?? '#1C1B1A',
            borderLeftColor: colors.border ?? '#2E2C2A',
          },
        ]}
      >
        <View style={styles.drawerHeader}>
          <View style={styles.drawerTitleBlock}>
            <Text style={[styles.drawerLabel, { color: colors.ink ?? '#F0EBE3' }]}>Drawer</Text>
            <Text style={[styles.drawerHint, { color: colors.muted ?? '#6B6760' }]}>Organized profile controls</Text>
          </View>
          <TouchableOpacity
            onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.surface2 ?? '#252422', borderColor: colors.border ?? '#2E2C2A' }]}
            activeOpacity={0.7}
          >
            <Ionicons name="close" size={18} color={colors.muted ?? '#6B6760'} />
          </TouchableOpacity>
        </View>

        <View style={[styles.tabBar, { borderColor: colors.border, backgroundColor: colors.surface2 }]}>
          {[
            { key: 'profile', label: 'Profile' },
            { key: 'portfolio', label: 'Portfolio' },
            { key: 'account', label: 'Account' },
            { key: 'settings', label: 'Settings' },
          ].map((tab) => (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.tabBtn,
                {
                  backgroundColor: activeTab === tab.key ? colors.surface : 'transparent',
                  borderColor: activeTab === tab.key ? colors.border : 'transparent',
                },
              ]}
              onPress={() => setActiveTab(tab.key as DrawerTab)}
            >
              <Text style={[styles.tabBtnText, { color: activeTab === tab.key ? colors.ink : colors.muted }]}>{tab.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {activeTab === 'profile' && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>PROFILE INFO</Text>

              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.ink }]} onPress={onPickAvatar}>
                <Text style={[styles.primaryBtnText, { color: colors.background }]}>Upload profile photo</Text>
              </TouchableOpacity>

              <View style={[styles.inputCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <Text style={[styles.inputFloatLabel, { color: colors.muted }]}>NAME</Text>
                <TextInput value={name} onChangeText={onNameChange} placeholder="Your name" placeholderTextColor={colors.muted} style={[styles.inputField, { color: colors.ink }]} />
              </View>

              <View style={[styles.inputCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <Text style={[styles.inputFloatLabel, { color: colors.muted }]}>BIO</Text>
                <TextInput value={bio} onChangeText={onBioChange} placeholder="Your bio" placeholderTextColor={colors.muted} style={[styles.inputField, styles.bioField, { color: colors.ink }]} multiline />
              </View>

              <View style={[styles.inputCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <Text style={[styles.inputFloatLabel, { color: colors.muted }]}>LOCATION / ADDRESS</Text>
                <TextInput value={location} onChangeText={onLocationChange} placeholder="City, Area, Country" placeholderTextColor={colors.muted} style={[styles.inputField, { color: colors.ink }]} />
              </View>

              <View style={styles.availabilitySection}>
                <Text style={[styles.inputFloatLabel, { color: colors.muted }]}>AVAILABILITY</Text>
                <View style={styles.availabilityOptions}>
                  {[
                    { status: 'available' as const, label: 'Available to Swap', color: '#3F5A48' },
                    { status: 'busy' as const, label: 'Busy', color: '#8A857C' },
                    { status: 'learning_only' as const, label: 'Learning Only', color: '#6A4040' },
                  ].map(({ status, label, color }) => {
                    const isSelected = availabilityStatus === status;
                    return (
                      <TouchableOpacity
                        key={status}
                        onPress={() => onAvailabilityChange(status)}
                        style={[
                          styles.availabilityOption,
                          {
                            backgroundColor: isSelected ? color : colors.surface2,
                            borderColor: isSelected ? color : colors.border,
                          },
                        ]}
                        activeOpacity={0.8}
                      >
                        <Text style={[styles.availabilityOptionText, { color: isSelected ? 'white' : colors.body }]}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.ink }, saving && styles.saveBtnDisabled]} onPress={onSave} disabled={saving}>
                <Text style={[styles.primaryBtnText, { color: colors.background }]}>{saving ? 'Saving...' : 'Save profile'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'portfolio' && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>PORTFOLIO ITEMS</Text>

              <View style={[styles.inputCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <Text style={[styles.inputFloatLabel, { color: colors.muted }]}>TITLE</Text>
                <TextInput value={itemTitle} onChangeText={setItemTitle} placeholder="Project title" placeholderTextColor={colors.muted} style={[styles.inputField, { color: colors.ink }]} />
              </View>
              <View style={[styles.inputCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <Text style={[styles.inputFloatLabel, { color: colors.muted }]}>DESCRIPTION</Text>
                <TextInput value={itemDescription} onChangeText={setItemDescription} placeholder="Short description" placeholderTextColor={colors.muted} style={[styles.inputField, { color: colors.ink }]} />
              </View>
              <View style={[styles.inputCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <Text style={[styles.inputFloatLabel, { color: colors.muted }]}>SKILL USED</Text>
                <TextInput value={itemSkill} onChangeText={setItemSkill} placeholder="Skill used" placeholderTextColor={colors.muted} style={[styles.inputField, { color: colors.ink }]} />
              </View>
              <View style={[styles.inputCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <Text style={[styles.inputFloatLabel, { color: colors.muted }]}>MEDIA URL</Text>
                <TextInput value={itemMediaUrl} onChangeText={setItemMediaUrl} placeholder="https://..." placeholderTextColor={colors.muted} style={[styles.inputField, { color: colors.ink }]} />
              </View>
              <View style={[styles.inputCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <Text style={[styles.inputFloatLabel, { color: colors.muted }]}>OPTIONAL EXTERNAL LINK</Text>
                <TextInput value={itemExternalLink} onChangeText={setItemExternalLink} placeholder="https://..." placeholderTextColor={colors.muted} style={[styles.inputField, { color: colors.ink }]} />
              </View>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.ink }]} onPress={addPortfolioItem}>
                <Text style={[styles.primaryBtnText, { color: colors.background }]}>Add portfolio item</Text>
              </TouchableOpacity>

              {portfolioItems.map((item) => (
                <View key={item.id} style={[styles.listCard, { borderColor: colors.border, backgroundColor: colors.surface2 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listCardTitle, { color: colors.ink }]}>{item.title}</Text>
                    <Text style={[styles.listCardMeta, { color: colors.muted }]}>{item.mediaType} · {item.skillUsed || 'General'}</Text>
                  </View>
                  <TouchableOpacity onPress={() => onPortfolioItemsChange(portfolioItems.filter((x) => x.id !== item.id))}>
                    <Ionicons name="trash-outline" size={18} color="#8B4444" />
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={[styles.sectionLabel, { color: colors.muted, marginTop: 8 }]}>EXTERNAL LINKS</Text>
              <View style={[styles.inputCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <Text style={[styles.inputFloatLabel, { color: colors.muted }]}>LABEL</Text>
                <TextInput value={linkLabel} onChangeText={setLinkLabel} placeholder="GitHub, YouTube..." placeholderTextColor={colors.muted} style={[styles.inputField, { color: colors.ink }]} />
              </View>
              <View style={[styles.inputCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <Text style={[styles.inputFloatLabel, { color: colors.muted }]}>URL</Text>
                <TextInput value={linkUrl} onChangeText={setLinkUrl} placeholder="https://..." placeholderTextColor={colors.muted} style={[styles.inputField, { color: colors.ink }]} />
              </View>
              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.ink }]} onPress={addPortfolioLink}>
                <Text style={[styles.primaryBtnText, { color: colors.background }]}>Add external link</Text>
              </TouchableOpacity>

              {portfolioLinks.map((link) => (
                <View key={link.id} style={[styles.listCard, { borderColor: colors.border, backgroundColor: colors.surface2 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listCardTitle, { color: colors.ink }]}>{link.label}</Text>
                    <Text style={[styles.listCardMeta, { color: colors.muted }]} numberOfLines={1}>{link.url}</Text>
                  </View>
                  <TouchableOpacity onPress={() => onPortfolioLinksChange(portfolioLinks.filter((x) => x.id !== link.id))}>
                    <Ionicons name="trash-outline" size={18} color="#8B4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {activeTab === 'account' && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>ACCOUNT SECURITY</Text>
              <View style={[styles.inputCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
                <Text style={[styles.inputFloatLabel, { color: colors.muted }]}>NEW PASSWORD</Text>
                <TextInput value={newPassword} onChangeText={setNewPassword} placeholder="At least 6 characters" placeholderTextColor={colors.muted} style={[styles.inputField, { color: colors.ink }]} secureTextEntry />
              </View>
              <TouchableOpacity style={[styles.secondaryBtn, { borderColor: colors.border }]} onPress={() => onChangePassword(newPassword)}>
                <Text style={[styles.secondaryBtnText, { color: colors.ink }]}>Change password</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dangerBtn, { borderColor: '#8B4444' }]} onPress={onDeleteAccount}>
                <Text style={styles.dangerText}>Delete account</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.dangerBtn, { borderColor: '#8B4444' }]} onPress={onSignOut}>
                <Text style={styles.dangerText}>Sign out</Text>
              </TouchableOpacity>
            </View>
          )}

          {activeTab === 'settings' && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>APP SETTINGS</Text>
              <View style={styles.row}>
                {(['light', 'dark'] as const).map((mode) => {
                  const isActive = themeMode === mode;
                  return (
                    <TouchableOpacity
                      key={mode}
                      onPress={() => setThemeMode(mode)}
                      style={[
                        styles.typeBtn,
                        {
                          flex: 1,
                          backgroundColor: isActive ? colors.accentSurface : colors.surface2,
                          borderColor: isActive ? colors.accent : colors.border,
                        },
                      ]}
                    >
                      <Text style={[styles.typeBtnText, { color: isActive ? colors.accent : colors.muted }]}>{mode === 'light' ? 'Light' : 'Dark'}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  drawerLayer: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'flex-end' },
  drawerOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.52)' },
  drawer: {
    width: '86%',
    height: '100%',
    paddingTop: 60,
    paddingHorizontal: Theme.spacing.lg,
    borderLeftWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 28,
    elevation: 24,
  },
  drawerHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14, gap: 12 },
  drawerTitleBlock: { flex: 1, gap: 4 },
  drawerLabel: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 24, letterSpacing: -0.3, lineHeight: 30 },
  drawerHint: { fontFamily: 'Nunito_400Regular', fontSize: 12, lineHeight: 17 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', marginTop: 2 },
  tabBar: { flexDirection: 'row', borderWidth: 1, borderRadius: Theme.borderRadius.full, padding: 4, marginBottom: 12 },
  tabBtn: { flex: 1, borderRadius: Theme.borderRadius.full, borderWidth: 1, alignItems: 'center', justifyContent: 'center', minHeight: 30 },
  tabBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 11 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 24 },
  section: { gap: 10, marginBottom: 20 },
  sectionLabel: { fontFamily: 'Nunito_700Bold', fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase' },
  inputCard: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6, gap: 2 },
  inputFloatLabel: { fontFamily: 'Nunito_700Bold', fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase' },
  inputField: { fontFamily: 'Nunito_400Regular', fontSize: 15, paddingVertical: 4 },
  bioField: { minHeight: 60, textAlignVertical: 'top' },
  availabilitySection: { gap: 8 },
  availabilityOptions: { gap: 8 },
  availabilityOption: { borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center' },
  availabilityOptionText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14 },
  primaryBtn: { borderRadius: Theme.borderRadius.full ?? 999, paddingVertical: 13, alignItems: 'center' },
  primaryBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 14, letterSpacing: 0.2 },
  saveBtnDisabled: { opacity: 0.45 },
  row: { flexDirection: 'row', gap: 10 },
  typeBtn: { borderWidth: 1, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  typeBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 12, textTransform: 'capitalize' },
  listCard: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  listCardTitle: { fontFamily: 'Nunito_700Bold', fontSize: 13 },
  listCardMeta: { fontFamily: 'Nunito_400Regular', fontSize: 11 },
  secondaryBtn: { borderWidth: 1, borderRadius: Theme.borderRadius.full ?? 999, paddingVertical: 12, alignItems: 'center' },
  secondaryBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 13 },
  dangerBtn: { borderWidth: 1, borderRadius: Theme.borderRadius.full ?? 999, paddingVertical: 12, alignItems: 'center' },
  dangerText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#8B4444' },
});
