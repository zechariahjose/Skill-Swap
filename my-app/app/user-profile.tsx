import { useLocalSearchParams, router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Linking,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './components/Avatar';
import SkillCard from './components/SkillCard';
import SocialLinkChip from './components/SocialLinkChip';
import { Theme } from '../src/constants/Theme';
import { useAuthContext } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';
import {
  getUserById,
  getSkillsByUser,
  createConnection,
  getConnectionBetweenUsers,
} from '../src/firebase/firestore';
import { Skill, User, AvailabilityStatus } from '../src/types';

function getAvailMeta(status?: AvailabilityStatus) {
  switch (status) {
    case 'available': return { label: 'Available to Swap', color: '#3F5A48' };
    case 'busy': return { label: 'Busy', color: '#8A857C' };
    case 'learning_only': return { label: 'Learning Only', color: '#6A4040' };
    default: return { label: 'Status Unknown', color: '#8A857C' };
  }
}

function SectionHeader({ label, count, colors }: { label: string; count?: number; colors: any }) {
  return (
    <View style={secStyles.row}>
      <View style={[secStyles.dot, { backgroundColor: colors.accent }]} />
      <Text style={[secStyles.label, { color: colors.muted }]}>{label.toUpperCase()}</Text>
      {count !== undefined && <Text style={[secStyles.count, { color: colors.muted }]}>{count}</Text>}
    </View>
  );
}

const secStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  dot: { width: 5, height: 5, borderRadius: 2.5 },
  label: { fontFamily: 'Nunito_700Bold', fontSize: 10, letterSpacing: 1.8, textTransform: 'uppercase', flex: 1 },
  count: { fontFamily: 'Nunito_700Bold', fontSize: 12 },
});

export default function UserProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { userProfile: currentUser } = useAuthContext();
  const { colors } = useTheme();
  const [user, setUser] = useState<User | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'none' | 'pending' | 'connected'>('none');
  const [isCurrentUser, setIsCurrentUser] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const styles = getStyles(colors);

  useEffect(() => {
    if (!userId) { router.back(); return; }
    loadUserProfile();
  }, [userId]);

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      const isOwn = userId === currentUser?.uid;
      setIsCurrentUser(isOwn);
      const userData = await getUserById(userId);
      if (!userData) { Alert.alert('User not found'); router.back(); return; }
      setUser(userData);
      const userSkills = await getSkillsByUser(userId);
      setSkills(userSkills);
      if (!isOwn && currentUser) {
        const conn = await getConnectionBetweenUsers(currentUser.uid, userId);
        if (conn?.status === 'accepted') setConnectionStatus('connected');
        else if (conn?.status === 'pending') setConnectionStatus('pending');
        else setConnectionStatus('none');
      }
    } catch (err) {
      console.error(err);
      Alert.alert('Error', 'Failed to load user profile');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleConnect = async () => {
    if (!currentUser || !user || connecting) return;
    try {
      setConnecting(true);
      await createConnection(currentUser.uid, user.uid);
      setConnectionStatus('pending');
    } catch { Alert.alert('Error', 'Failed to send connection request'); }
    finally { setConnecting(false); }
  };

  if (loading) return (
    <View style={[styles.screen, styles.centered]}>
      <Text style={styles.loadingText}>Loading profile...</Text>
    </View>
  );

  if (!user) return (
    <View style={[styles.screen, styles.centered]}>
      <Text style={styles.loadingText}>User not found</Text>
    </View>
  );

  const avail = getAvailMeta(user.availabilityStatus);
  const offersCount = skills.filter(s => s.type === 'offer').length;
  const needsCount = skills.filter(s => s.type === 'need').length;
  const memberSince = user.createdAt ? new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : null;
  const portfolioItems = user.portfolioItems ?? [];
  const portfolioLinks = user.portfolioLinks ?? [];

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadUserProfile(); }} tintColor={colors.accent} />}>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name='arrow-back' size={20} color={colors.ink} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Profile</Text>
        <View style={styles.topBarSpacer} />
      </View>
      <View style={styles.heroCard}>
        <Avatar initials={user.initials} imageUri={user.avatar} size={76} />
        <View style={styles.nameBlock}>
          <Text style={styles.profileName}>{user.name}</Text>
          {user.bio ? <Text style={styles.profileBio}>{user.bio}</Text> : <Text style={styles.profileBioEmpty}>No bio yet.</Text>}
        </View>
        <View style={[styles.availBadge, { backgroundColor: avail.color }]}>
          <Text style={styles.availText}>{avail.label}</Text>
        </View>
        {!isCurrentUser && connectionStatus === 'none' && (
          <TouchableOpacity style={[styles.connectBtn, connecting && styles.connectBtnDisabled]} onPress={handleConnect} disabled={connecting} activeOpacity={0.85}>
            <Ionicons name='person-add-outline' size={16} color={colors.background} />
            <Text style={[styles.connectBtnText, { color: colors.background }]}>{connecting ? 'Sending...' : 'Connect'}</Text>
          </TouchableOpacity>
        )}
        {connectionStatus === 'pending' && (
          <View style={[styles.statusPill, { backgroundColor: colors.softSurface, borderColor: colors.border }]}>
            <Ionicons name='time-outline' size={14} color={colors.muted} />
            <Text style={[styles.statusPillText, { color: colors.muted }]}>Request sent</Text>
          </View>
        )}
        {connectionStatus === 'connected' && (
          <View style={[styles.statusPill, { backgroundColor: '#3F5A4818', borderColor: '#3F5A4840' }]}>
            <Ionicons name='checkmark-circle' size={14} color='#3F5A48' />
            <Text style={[styles.statusPillText, { color: '#3F5A48' }]}>Connected</Text>
          </View>
        )}
        <View style={styles.statsDivider} />
        <View style={styles.statsRow}>
          <View style={styles.statItem}><Text style={styles.statNumber}>{offersCount}</Text><Text style={styles.statLabel}>offering</Text></View>
          <View style={styles.statSep} />
          <View style={styles.statItem}><Text style={styles.statNumber}>{needsCount}</Text><Text style={styles.statLabel}>looking for</Text></View>
          <View style={styles.statSep} />
          <View style={styles.statItem}><Text style={styles.statNumber}>{user.totalSwaps ?? 0}</Text><Text style={styles.statLabel}>swaps</Text></View>
        </View>
      </View>
      <View style={styles.section}>
        <SectionHeader label='About' colors={colors} />
        <View style={styles.infoCard}>
          <Text style={styles.infoCardText}>{user.bio?.trim() || 'This user has not written a bio yet.'}</Text>
          {!!user.pronouns && (
            <View style={styles.metaRow}>
              <Ionicons name="person-outline" size={13} color={colors.muted} />
              <Text style={styles.metaText}>{user.pronouns}</Text>
            </View>
          )}
          {!!user.location && (
            <View style={styles.metaRow}>
              <Ionicons name="location-outline" size={13} color={colors.muted} />
              <Text style={styles.metaText}>{user.location}</Text>
            </View>
          )}
          {!!user.company && (
            <View style={styles.metaRow}>
              <Ionicons name="business-outline" size={13} color={colors.muted} />
              <Text style={styles.metaText}>{user.company}</Text>
            </View>
          )}
          {!!memberSince && <View style={styles.metaRow}><Ionicons name='calendar-outline' size={13} color={colors.muted} /><Text style={styles.metaText}>Member since {memberSince}</Text></View>}
          {!!user.rating && (
            <View style={styles.metaRow}>
              <Ionicons name="star" size={13} color="#F5C842" />
              <Text style={styles.metaText}>{user.rating.toFixed(1)} rating</Text>
            </View>
          )}
          {!!user.website && (
            <TouchableOpacity style={styles.metaRow} onPress={() => Linking.openURL(user.website!).catch(() => {})} activeOpacity={0.7}>
              <Ionicons name="globe-outline" size={13} color={colors.accent} />
              <Text style={[styles.metaText, { color: colors.accent }]} numberOfLines={1}>{user.website.replace(/^https?:\/\/(www\.)?/, '')}</Text>
            </TouchableOpacity>
          )}
          {!!user.gmail && (
            <View style={styles.metaRow}>
              <Ionicons name="mail-outline" size={13} color={colors.muted} />
              <Text style={styles.metaText}>{user.gmail}</Text>
            </View>
          )}
          {user.socialLinks && Object.values(user.socialLinks).some(Boolean) && (
            <View style={styles.socialList}>
              {Object.values(user.socialLinks).filter(Boolean).map((link, i) => (
                <SocialLinkChip key={i} url={link!} />
              ))}
            </View>
          )}
        </View>
      </View>
      {(portfolioItems.length > 0 || portfolioLinks.length > 0) && (
        <View style={styles.section}>
          <SectionHeader label='Portfolio' colors={colors} />
          {portfolioItems.length > 0 && (
            <FlatList horizontal data={portfolioItems} keyExtractor={item => item.id} showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.portfolioRow}
              renderItem={({ item }) => (
                <TouchableOpacity activeOpacity={0.88} style={styles.portfolioCard} onPress={() => { const t = item.externalLink || item.mediaUrl; if (t) Linking.openURL(t).catch(() => {}); }}>
                  <View style={styles.portfolioBadge}><Text style={styles.portfolioBadgeText}>{item.mediaType.toUpperCase()}</Text></View>
                  <Text style={styles.portfolioTitle} numberOfLines={2}>{item.title}</Text>
                  {!!item.skillUsed && <Text style={styles.portfolioMeta}>{item.skillUsed}</Text>}
                  {!!item.description && <Text style={styles.portfolioDesc} numberOfLines={2}>{item.description}</Text>}
                  <View style={styles.portfolioLinkRow}><Ionicons name='open-outline' size={12} color={colors.muted} /><Text style={styles.portfolioLinkText}>View work</Text></View>
                </TouchableOpacity>
              )} />
          )}
          {portfolioLinks.length > 0 && (
            <View style={[styles.infoCard, portfolioItems.length > 0 ? { marginTop: 12 } : {}]}>
              {portfolioLinks.map((link, i) => (
                <TouchableOpacity key={link.id} onPress={() => Linking.openURL(link.url).catch(() => {})}
                  style={[styles.linkRow, i > 0 && { borderTopWidth: 1, borderTopColor: colors.border, marginTop: 8, paddingTop: 8 }]} activeOpacity={0.7}>
                  <Ionicons name='link-outline' size={15} color={colors.accent} />
                  <Text style={styles.linkText}>{link.label}</Text>
                  <Ionicons name='chevron-forward' size={14} color={colors.muted} />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      )}
      <View style={styles.section}>
        <SectionHeader label='Skills' count={skills.length} colors={colors} />
        {skills.length === 0 ? (
          <View style={styles.infoCard}><Text style={styles.infoCardText}>This user has not added any skills yet.</Text></View>
        ) : (
          <View>{skills.map((item, i) => <View key={item.id}>{i > 0 && <View style={{ height: 10 }} />}<SkillCard skill={item} showConnectButton={false} /></View>)}</View>
        )}
      </View>
    </ScrollView>
  );
}

const getStyles = (colors: any) => StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background ?? '#F2F0EC' },
  content: { paddingBottom: 100 },
  centered: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { fontFamily: 'Nunito_400Regular', fontSize: Theme.fontSize.body, color: colors.muted },
  topBar: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: Theme.spacing.lg, paddingTop: 56, paddingBottom: 16 },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
  topBarTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 22, color: colors.ink, letterSpacing: -0.3, flex: 1, textAlign: 'center' },
  topBarSpacer: { width: 40 },
  heroCard: { marginHorizontal: Theme.spacing.lg, backgroundColor: colors.surface, borderRadius: 24, borderWidth: 1, borderColor: colors.border, paddingTop: 32, paddingBottom: 0, paddingHorizontal: Theme.spacing.lg, alignItems: 'center', gap: 10 },
  nameBlock: { alignItems: 'center', gap: 4 },
  profileName: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 26, color: colors.ink, letterSpacing: -0.5, textAlign: 'center' },
  profileBio: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: colors.muted, fontStyle: 'italic', textAlign: 'center', maxWidth: 240, lineHeight: 20 },
  profileBioEmpty: { fontFamily: 'Nunito_400Regular', fontSize: 14, color: colors.border, fontStyle: 'italic' },
  availBadge: { paddingHorizontal: Theme.spacing.md, paddingVertical: Theme.spacing.xs, borderRadius: Theme.borderRadius.full },
  availText: { fontFamily: 'Nunito_700Bold', fontSize: Theme.fontSize.small, color: 'white' },
  connectBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.ink, paddingHorizontal: Theme.spacing.lg, paddingVertical: 10, borderRadius: Theme.borderRadius.full },
  connectBtnDisabled: { opacity: 0.5 },
  connectBtnText: { fontFamily: 'Nunito_700Bold', fontSize: Theme.fontSize.small },
  statusPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: Theme.spacing.md, paddingVertical: 7, borderRadius: Theme.borderRadius.full, borderWidth: 1 },
  statusPillText: { fontFamily: 'Nunito_600SemiBold', fontSize: Theme.fontSize.small },
  statsDivider: { width: '100%', height: 1, backgroundColor: colors.border, marginTop: 4 },
  statsRow: { flexDirection: 'row', width: '100%', paddingVertical: 20 },
  statItem: { flex: 1, alignItems: 'center', gap: 3 },
  statNumber: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 20, color: colors.ink, letterSpacing: -0.3 },
  statLabel: { fontFamily: 'Nunito_400Regular', fontSize: 11, color: colors.muted, letterSpacing: 0.3 },
  statSep: { width: 1, height: 36, backgroundColor: colors.border, alignSelf: 'center' },
  section: { paddingHorizontal: Theme.spacing.lg, paddingTop: 28 },
  infoCard: { borderRadius: Theme.borderRadius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: Theme.spacing.md },
  infoCardText: { fontFamily: 'Nunito_400Regular', fontSize: Theme.fontSize.small, color: colors.body, lineHeight: 20 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 8 },
  metaText: { fontFamily: 'Nunito_400Regular', fontSize: Theme.fontSize.small, color: colors.muted },
  portfolioRow: { gap: Theme.spacing.md, paddingBottom: 4 },
  portfolioCard: { width: 220, borderRadius: Theme.borderRadius.lg, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, padding: Theme.spacing.md, gap: 4 },
  portfolioBadge: { alignSelf: 'flex-start', borderRadius: Theme.borderRadius.full, backgroundColor: colors.softSurface, paddingHorizontal: Theme.spacing.sm, paddingVertical: 3, marginBottom: 4 },
  portfolioBadgeText: { fontFamily: 'Nunito_700Bold', fontSize: 9, color: colors.muted, letterSpacing: 0.8 },
  portfolioTitle: { fontFamily: 'DMSerifDisplay_400Regular', fontSize: 18, color: colors.ink, lineHeight: 22 },
  portfolioMeta: { fontFamily: 'Nunito_700Bold', fontSize: 10, color: colors.muted, textTransform: 'uppercase', letterSpacing: 0.6 },
  portfolioDesc: { fontFamily: 'Nunito_400Regular', fontSize: Theme.fontSize.small, color: colors.body, lineHeight: 18 },
  portfolioLinkRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 },
  portfolioLinkText: { fontFamily: 'Nunito_600SemiBold', fontSize: 11, color: colors.muted },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  linkText: { fontFamily: 'Nunito_700Bold', fontSize: Theme.fontSize.small, color: colors.accent, flex: 1 },
  socialList: { marginTop: 8, borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 4 },
});
