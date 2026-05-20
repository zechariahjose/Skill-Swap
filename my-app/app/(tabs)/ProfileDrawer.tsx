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

type SocialLinks = { slot1?: string; slot2?: string; slot3?: string; slot4?: string };

// â”€â”€â”€ InputCard â€” defined outside ProfileDrawer to prevent remount on every keystroke â”€â”€

function InputCard({ label, value, onChange, placeholder, multiline, secure, colors }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  multiline?: boolean;
  secure?: boolean;
  colors: any;
}) {
  return (
    <View style={[styles.inputCard, { backgroundColor: colors.surface2, borderColor: colors.border }]}>
      <Text style={[styles.inputFloatLabel, { color: colors.muted }]}>{label}</Text>
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder={placeholder ?? ''}
        placeholderTextColor={colors.muted}
        style={[styles.inputField, multiline && styles.bioField, { color: colors.ink }]}
        multiline={multiline}
        secureTextEntry={secure}
      />
    </View>
  );
}

type ProfileDrawerProps = {
  open: boolean;
  onClose: () => void;
  name: string;
  bio: string;
  location: string;
  pronouns: string;
  company: string;
  gmail: string;
  website: string;
  socialLinks: SocialLinks;
  portfolioItems: PortfolioItem[];
  portfolioLinks: PortfolioLink[];
  availabilityStatus?: AvailabilityStatus;
  onNameChange: (v: string) => void;
  onBioChange: (v: string) => void;
  onLocationChange: (v: string) => void;
  onPronounsChange: (v: string) => void;
  onCompanyChange: (v: string) => void;
  onGmailChange: (v: string) => void;
  onWebsiteChange: (v: string) => void;
  onSocialLinksChange: (v: SocialLinks) => void;
  onPickAvatar: () => Promise<void>;
  onPortfolioItemsChange: (items: PortfolioItem[]) => void;
  onPortfolioLinksChange: (links: PortfolioLink[]) => void;
  onAvailabilityChange: (status: AvailabilityStatus) => void;
  onSave: () => void;
  onSavePortfolio: (items: PortfolioItem[], links: PortfolioLink[]) => Promise<void>;
  onSignOut: () => void;
  onChangePassword: (value: string) => Promise<void>;
  onDeleteAccount: () => Promise<void>;
  saving: boolean;
};

export default function ProfileDrawer({
  open, onClose,
  name, bio, location, pronouns, company, gmail, website, socialLinks,
  portfolioItems, portfolioLinks, availabilityStatus,
  onNameChange, onBioChange, onLocationChange,
  onPronounsChange, onCompanyChange, onGmailChange, onWebsiteChange, onSocialLinksChange,
  onPickAvatar, onPortfolioItemsChange, onPortfolioLinksChange,
  onAvailabilityChange, onSave, onSavePortfolio,
  saving, onSignOut, onChangePassword, onDeleteAccount,
}: ProfileDrawerProps) {
  const { colors, themeMode, setThemeMode } = useTheme();
  const drawerTranslate = useRef(new Animated.Value(400)).current;
  const overlayOpacity  = useRef(new Animated.Value(0)).current;
  const [activeTab, setActiveTab] = useState<DrawerTab>('profile');

  // Portfolio item form
  const [itemTitle, setItemTitle]             = useState('');
  const [itemDescription, setItemDescription] = useState('');
  const [itemSkill, setItemSkill]             = useState('');
  const [itemMediaUrl, setItemMediaUrl]       = useState('');
  const [itemExternalLink, setItemExternalLink] = useState('');

  // External link form
  const [linkLabel, setLinkLabel] = useState('');
  const [linkUrl, setLinkUrl]     = useState('');

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

  // Portfolio item â€” only title is required
  const addPortfolioItem = async () => {
    if (!itemTitle.trim()) return;
    const next: PortfolioItem = {
      id: createId(),
      title: itemTitle.trim(),
      description: itemDescription.trim() || undefined,
      skillUsed: itemSkill.trim() || undefined,
      mediaType: 'link',
      mediaUrl: itemMediaUrl.trim() || '',
      externalLink: itemExternalLink.trim() || undefined,
    };
    const updated = [next, ...portfolioItems];
    onPortfolioItemsChange(updated);
    setItemTitle('');
    setItemDescription('');
    setItemSkill('');
    setItemMediaUrl('');
    setItemExternalLink('');
    await onSavePortfolio(updated, portfolioLinks);
  };

  // External link â€” both label and url required
  const addPortfolioLink = async () => {
    if (!linkLabel.trim() || !linkUrl.trim()) return;
    const next: PortfolioLink = {
      id: createId(),
      label: linkLabel.trim(),
      url: linkUrl.trim(),
    };
    // Use a local variable to avoid stale closure
    const updatedLinks = [next, ...portfolioLinks];
    onPortfolioLinksChange(updatedLinks);
    setLinkLabel('');
    setLinkUrl('');
    await onSavePortfolio(portfolioItems, updatedLinks);
  };

  const removePortfolioItem = async (id: string) => {
    const updated = portfolioItems.filter(x => x.id !== id);
    onPortfolioItemsChange(updated);
    await onSavePortfolio(updated, portfolioLinks);
  };

  const removePortfolioLink = async (id: string) => {
    const updated = portfolioLinks.filter(x => x.id !== id);
    onPortfolioLinksChange(updated);
    await onSavePortfolio(portfolioItems, updated);
  };

  // InputCard moved outside component â€” see below
  

  return (
    <View style={styles.drawerLayer} pointerEvents="box-none">
      <Animated.View style={[styles.drawerOverlay, { opacity: overlayOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <Animated.View style={[styles.drawer, {
        transform: [{ translateX: drawerTranslate }],
        backgroundColor: colors.surface ?? '#1C1B1A',
        borderLeftColor: colors.border ?? '#2E2C2A',
      }]}>
        <View style={styles.drawerHeader}>
          <View style={styles.drawerTitleBlock}>
            <Text style={[styles.drawerLabel, { color: colors.ink }]}>Settings</Text>
            <Text style={[styles.drawerHint, { color: colors.muted }]}>Manage your profile</Text>
          </View>
          <TouchableOpacity onPress={onClose}
            style={[styles.closeBtn, { backgroundColor: colors.surface2, borderColor: colors.border }]}
            activeOpacity={0.7}>
            <Ionicons name="close" size={18} color={colors.muted} />
          </TouchableOpacity>
        </View>

        <View style={[styles.tabBar, { borderColor: colors.border, backgroundColor: colors.surface2 }]}>
          {(['profile', 'portfolio', 'account', 'settings'] as DrawerTab[]).map((tab) => (
            <TouchableOpacity key={tab}
              style={[styles.tabBtn, {
                backgroundColor: activeTab === tab ? colors.surface : 'transparent',
                borderColor: activeTab === tab ? colors.border : 'transparent',
              }]}
              onPress={() => setActiveTab(tab)}>
              <Text style={[styles.tabBtnText, { color: activeTab === tab ? colors.ink : colors.muted }]}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

          {/* â”€â”€ PROFILE TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {activeTab === 'profile' && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>PROFILE INFO</Text>

              <TouchableOpacity style={[styles.primaryBtn, { backgroundColor: colors.ink }]} onPress={onPickAvatar}>
                <Text style={[styles.primaryBtnText, { color: colors.background }]}>Upload profile photo</Text>
              </TouchableOpacity>

              <InputCard colors={colors} label="NAME" value={name} onChange={onNameChange} placeholder="Your name" />
              <InputCard colors={colors} label="PRONOUNS" value={pronouns} onChange={onPronounsChange} placeholder="e.g. he/him, she/her, they/them" />
              <InputCard colors={colors} label="BIO" value={bio} onChange={onBioChange} placeholder="Your bio" multiline />
              <InputCard colors={colors} label="LOCATION" value={location} onChange={onLocationChange} placeholder="City, Country" />
              <InputCard colors={colors} label="COMPANY / SCHOOL" value={company} onChange={onCompanyChange} placeholder="Where you work or study" />
              <InputCard colors={colors} label="CONTACT EMAIL" value={gmail} onChange={onGmailChange} placeholder="your@email.com" />
              <InputCard colors={colors} label="WEBSITE" value={website} onChange={onWebsiteChange} placeholder="https://yoursite.com" />

              <Text style={[styles.sectionLabel, { color: colors.muted, marginTop: 4 }]}>SOCIAL ACCOUNTS</Text>
              <InputCard colors={colors} label="SOCIAL LINK 1" value={socialLinks.slot1 ?? ''} onChange={v => onSocialLinksChange({ ...socialLinks, slot1: v })} placeholder="https://github.com/..." />
              <InputCard colors={colors} label="SOCIAL LINK 2" value={socialLinks.slot2 ?? ''} onChange={v => onSocialLinksChange({ ...socialLinks, slot2: v })} placeholder="https://linkedin.com/..." />
              <InputCard colors={colors} label="SOCIAL LINK 3" value={socialLinks.slot3 ?? ''} onChange={v => onSocialLinksChange({ ...socialLinks, slot3: v })} placeholder="https://twitter.com/..." />
              <InputCard colors={colors} label="SOCIAL LINK 4" value={socialLinks.slot4 ?? ''} onChange={v => onSocialLinksChange({ ...socialLinks, slot4: v })} placeholder="https://instagram.com/..." />

              <View style={styles.availabilitySection}>
                <Text style={[styles.inputFloatLabel, { color: colors.muted }]}>AVAILABILITY</Text>
                <View style={styles.availabilityOptions}>
                  {([
                    { status: 'available' as const, label: 'Available to Swap', color: '#3F5A48' },
                    { status: 'busy' as const, label: 'Busy', color: '#8A857C' },
                    { status: 'learning_only' as const, label: 'Learning Only', color: '#6A4040' },
                  ]).map(({ status, label, color }) => {
                    const isSelected = availabilityStatus === status;
                    return (
                      <TouchableOpacity key={status} onPress={() => onAvailabilityChange(status)}
                        style={[styles.availabilityOption, {
                          backgroundColor: isSelected ? color : colors.surface2,
                          borderColor: isSelected ? color : colors.border,
                        }]} activeOpacity={0.8}>
                        <Text style={[styles.availabilityOptionText, { color: isSelected ? 'white' : colors.body }]}>{label}</Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.ink }, saving && styles.saveBtnDisabled]}
                onPress={onSave} disabled={saving}>
                <Text style={[styles.primaryBtnText, { color: colors.background }]}>{saving ? 'Saving...' : 'Save profile'}</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* â”€â”€ PORTFOLIO TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {activeTab === 'portfolio' && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>PORTFOLIO ITEMS</Text>
              <Text style={[styles.hintText, { color: colors.muted }]}>Only title is required.</Text>

              <InputCard colors={colors} label="TITLE *" value={itemTitle} onChange={setItemTitle} placeholder="Project or work title" />
              <InputCard colors={colors} label="DESCRIPTION" value={itemDescription} onChange={setItemDescription} placeholder="Short description" />
              <InputCard colors={colors} label="SKILL USED" value={itemSkill} onChange={setItemSkill} placeholder="e.g. React, Design" />
              <InputCard colors={colors} label="URL / LINK" value={itemMediaUrl} onChange={setItemMediaUrl} placeholder="https://..." />
              <InputCard colors={colors} label="EXTERNAL LINK (optional)" value={itemExternalLink} onChange={setItemExternalLink} placeholder="https://..." />

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.ink }, !itemTitle.trim() && styles.saveBtnDisabled]}
                onPress={addPortfolioItem} disabled={!itemTitle.trim()}>
                <Text style={[styles.primaryBtnText, { color: colors.background }]}>Add portfolio item</Text>
              </TouchableOpacity>

              {portfolioItems.map((item) => (
                <View key={item.id} style={[styles.listCard, { borderColor: colors.border, backgroundColor: colors.surface2 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listCardTitle, { color: colors.ink }]}>{item.title}</Text>
                    <Text style={[styles.listCardMeta, { color: colors.muted }]}>{item.skillUsed || 'General'}{item.mediaUrl ? ' Â· has link' : ''}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removePortfolioItem(item.id)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color="#8B4444" />
                  </TouchableOpacity>
                </View>
              ))}

              <Text style={[styles.sectionLabel, { color: colors.muted, marginTop: 8 }]}>EXTERNAL LINKS</Text>
              <Text style={[styles.hintText, { color: colors.muted }]}>Both label and URL are required.</Text>

              <InputCard colors={colors} label="LABEL" value={linkLabel} onChange={setLinkLabel} placeholder="GitHub, YouTube, Behance..." />
              <InputCard colors={colors} label="URL" value={linkUrl} onChange={setLinkUrl} placeholder="https://..." />

              <TouchableOpacity
                style={[styles.primaryBtn, { backgroundColor: colors.ink }, (!linkLabel.trim() || !linkUrl.trim()) && styles.saveBtnDisabled]}
                onPress={addPortfolioLink} disabled={!linkLabel.trim() || !linkUrl.trim()}>
                <Text style={[styles.primaryBtnText, { color: colors.background }]}>Add external link</Text>
              </TouchableOpacity>

              {portfolioLinks.map((link) => (
                <View key={link.id} style={[styles.listCard, { borderColor: colors.border, backgroundColor: colors.surface2 }]}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.listCardTitle, { color: colors.ink }]}>{link.label}</Text>
                    <Text style={[styles.listCardMeta, { color: colors.muted }]} numberOfLines={1}>{link.url}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removePortfolioLink(link.id)} hitSlop={8}>
                    <Ionicons name="trash-outline" size={18} color="#8B4444" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* â”€â”€ ACCOUNT TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {activeTab === 'account' && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>ACCOUNT SECURITY</Text>
              <InputCard colors={colors} label="NEW PASSWORD" value={newPassword} onChange={setNewPassword} placeholder="At least 6 characters" secure />
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

          {/* â”€â”€ SETTINGS TAB â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          {activeTab === 'settings' && (
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, { color: colors.muted }]}>APP SETTINGS</Text>
              <View style={styles.row}>
                {(['light', 'dark'] as const).map((mode) => {
                  const isActive = themeMode === mode;
                  return (
                    <TouchableOpacity key={mode} onPress={() => setThemeMode(mode)}
                      style={[styles.typeBtn, { flex: 1,
                        backgroundColor: isActive ? colors.accentSurface : colors.surface2,
                        borderColor: isActive ? colors.accent : colors.border,
                      }]}>
                      <Text style={[styles.typeBtnText, { color: isActive ? colors.accent : colors.muted }]}>
                        {mode === 'light' ? 'â˜€ï¸  Light' : 'ðŸŒ™  Dark'}
                      </Text>
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
    width: '86%', height: '100%', paddingTop: 60, paddingHorizontal: Theme.spacing.lg,
    borderLeftWidth: 1, shadowColor: '#000', shadowOffset: { width: -8, height: 0 },
    shadowOpacity: 0.4, shadowRadius: 28, elevation: 24,
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
  scrollContent: { paddingBottom: 120 },
  section: { gap: 10, marginBottom: 20 },
  sectionLabel: { fontFamily: 'Nunito_700Bold', fontSize: 10, letterSpacing: 1.6, textTransform: 'uppercase' },
  hintText: { fontFamily: 'Nunito_400Regular', fontSize: 11, marginTop: -4 },
  inputCard: { borderWidth: 1, borderRadius: 14, paddingHorizontal: 14, paddingTop: 10, paddingBottom: 6, gap: 2 },
  inputFloatLabel: { fontFamily: 'Nunito_700Bold', fontSize: 9, letterSpacing: 1.2, textTransform: 'uppercase' },
  inputField: { fontFamily: 'Nunito_400Regular', fontSize: 15, paddingVertical: 4 },
  bioField: { minHeight: 60, textAlignVertical: 'top' },
  availabilitySection: { gap: 8 },
  availabilityOptions: { gap: 8 },
  availabilityOption: { borderWidth: 1, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 14, alignItems: 'center' },
  availabilityOptionText: { fontFamily: 'Nunito_600SemiBold', fontSize: 14 },
  primaryBtn: { borderRadius: Theme.borderRadius.full, paddingVertical: 13, alignItems: 'center' },
  primaryBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 14, letterSpacing: 0.2 },
  saveBtnDisabled: { opacity: 0.35 },
  row: { flexDirection: 'row', gap: 10 },
  typeBtn: { borderWidth: 1, borderRadius: 12, paddingVertical: 9, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  typeBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 12 },
  listCard: { borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 10 },
  listCardTitle: { fontFamily: 'Nunito_700Bold', fontSize: 13 },
  listCardMeta: { fontFamily: 'Nunito_400Regular', fontSize: 11 },
  secondaryBtn: { borderWidth: 1, borderRadius: Theme.borderRadius.full, paddingVertical: 12, alignItems: 'center' },
  secondaryBtnText: { fontFamily: 'Nunito_700Bold', fontSize: 13 },
  dangerBtn: { borderWidth: 1, borderRadius: Theme.borderRadius.full, paddingVertical: 12, alignItems: 'center' },
  dangerText: { fontFamily: 'Nunito_700Bold', fontSize: 13, color: '#8B4444' },
});

