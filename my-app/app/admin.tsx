import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Avatar from './components/Avatar';
import { Colors } from '../src/constants/Colors';
import { Theme } from '../src/constants/Theme';
import {
  deleteSkill,
  deleteSwapRequest,
  deleteUser,
  getAllSkills,
  getAllSwapRequests,
  getAllUsers,
} from '../src/firebase/firestore';
import { Skill, SwapRequest, User } from '../src/types';

// SECURITY WARNING: This admin panel is currently accessible via hardcoded
// credentials in login.tsx. This is a DEVELOPMENT/TESTING feature only.
// REMOVE or SECURE this functionality before production deployment.
// ⚠️  DEVELOPMENT ONLY — remove or gate behind a real auth check before production.

type Tab = 'users' | 'skills' | 'requests';

const STATUS_COLOR: Record<string, string> = {
  pending:   '#C8A882',
  accepted:  '#3D6B50',
  rejected:  '#8B4444',
  completed: '#6B6760',
};

export default function AdminScreen() {
  const [users,     setUsers]     = useState<User[]>([]);
  const [skills,    setSkills]    = useState<Skill[]>([]);
  const [requests,  setRequests]  = useState<SwapRequest[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [refreshing,setRefreshing]= useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('users');

  const loadData = async () => {
    try {
      const [u, s, r] = await Promise.all([
        getAllUsers(),
        getAllSkills(),
        getAllSwapRequests(),
      ]);
      setUsers(u);
      setSkills(s);
      setRequests(r);
    } catch {
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // ── Delete handlers ────────────────────────────────────────────────────────

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      'Delete User',
      `Delete ${user.name}? This also removes their skills and requests.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(user.uid);
              setUsers(prev     => prev.filter(u => u.uid !== user.uid));
              setSkills(prev    => prev.filter(s => s.userId !== user.uid));
              setRequests(prev  => prev.filter(r => r.fromUserId !== user.uid && r.toUserId !== user.uid));
            } catch { Alert.alert('Error', 'Failed to delete user'); }
          },
        },
      ]
    );
  };

  const handleDeleteSkill = (skill: Skill) => {
    Alert.alert('Delete Skill', `Delete "${skill.title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteSkill(skill.id);
            setSkills(prev => prev.filter(s => s.id !== skill.id));
          } catch { Alert.alert('Error', 'Failed to delete skill'); }
        },
      },
    ]);
  };

  const handleDeleteRequest = (req: SwapRequest) => {
    Alert.alert('Delete Request', 'Delete this swap request?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteSwapRequest(req.id);
            setRequests(prev => prev.filter(r => r.id !== req.id));
          } catch { Alert.alert('Error', 'Failed to delete request'); }
        },
      },
    ]);
  };

  // ── Derived stats ─────────────────────────────────────────────────────────

  const pending   = requests.filter(r => r.status === 'pending').length;
  const accepted  = requests.filter(r => r.status === 'accepted').length;
  const rejected  = requests.filter(r => r.status === 'rejected').length;

  // ── Render helpers ────────────────────────────────────────────────────────

  const renderUser = ({ item }: { item: User }) => {
    const joined = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      : null;
    const userSkillCount = skills.filter(s => s.userId === item.uid).length;

    return (
      <View style={styles.item}>
        <Avatar initials={item.initials ?? item.name?.[0] ?? '?'} size={40} />
        <View style={styles.itemBody}>
          <Text style={styles.itemTitle}>{item.name}</Text>
          {item.bio ? (
            <Text style={styles.itemSub} numberOfLines={1}>{item.bio}</Text>
          ) : null}
          <View style={styles.itemMetaRow}>
            <Text style={styles.itemMeta}>{userSkillCount} skill{userSkillCount !== 1 ? 's' : ''}</Text>
            {joined && <Text style={styles.itemMetaDot}>·</Text>}
            {joined && <Text style={styles.itemMeta}>joined {joined}</Text>}
          </View>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteUser(item)} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={17} color="#8B4444" />
        </TouchableOpacity>
      </View>
    );
  };

  const renderSkill = ({ item }: { item: Skill }) => (
    <View style={styles.item}>
      <View style={[styles.typePill, item.type === 'offer' ? styles.typePillOffer : styles.typePillNeed]}>
        <Text style={[styles.typePillText, item.type === 'offer' ? styles.typePillTextOffer : styles.typePillTextNeed]}>
          {item.type === 'offer' ? '🙋' : '🔍'}
        </Text>
      </View>
      <View style={styles.itemBody}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemSub} numberOfLines={1}>
          {item.description || 'No description'}
        </Text>
        <View style={styles.itemMetaRow}>
          <Text style={styles.itemMeta}>{item.category}</Text>
          <Text style={styles.itemMetaDot}>·</Text>
          <Text style={styles.itemMeta}>{item.userName}</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteSkill(item)} activeOpacity={0.7}>
        <Ionicons name="trash-outline" size={17} color="#8B4444" />
      </TouchableOpacity>
    </View>
  );

  const renderRequest = ({ item }: { item: SwapRequest }) => {
    const statusColor = STATUS_COLOR[item.status] ?? Colors.muted;
    const date = item.createdAt
      ? new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
      : null;

    return (
      <View style={styles.item}>
        <View style={styles.itemBody}>
          {/* From → To */}
          <View style={styles.swapRoute}>
            <Text style={styles.swapName}>{item.fromUserName}</Text>
            <Ionicons name="arrow-forward" size={12} color={Colors.muted} style={styles.swapArrow} />
            <Text style={styles.swapName}>{item.toUserName}</Text>
          </View>
          {/* Skills */}
          <View style={styles.swapSkills}>
            <Text style={styles.swapSkill} numberOfLines={1}>{item.offeredSkillTitle}</Text>
            <Text style={styles.swapSep}>↔</Text>
            <Text style={styles.swapSkill} numberOfLines={1}>{item.requestedSkillTitle}</Text>
          </View>
          {/* Status + date */}
          <View style={styles.itemMetaRow}>
            <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
            <Text style={[styles.statusText, { color: statusColor }]}>{item.status}</Text>
            {date && <Text style={styles.itemMetaDot}>·</Text>}
            {date && <Text style={styles.itemMeta}>{date}</Text>}
          </View>
        </View>
        <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteRequest(item)} activeOpacity={0.7}>
          <Ionicons name="trash-outline" size={17} color="#8B4444" />
        </TouchableOpacity>
      </View>
    );
  };

  // ── Active list data ───────────────────────────────────────────────────────

  const listData  = activeTab === 'users'    ? users
                  : activeTab === 'skills'   ? skills
                  : requests;

  const listKey   = activeTab === 'users'    ? (i: User)        => i.uid
                  : activeTab === 'skills'   ? (i: Skill)       => i.id
                  : (i: SwapRequest) => i.id;

  const renderRow = activeTab === 'users'    ? renderUser
                  : activeTab === 'skills'   ? renderSkill
                  : renderRequest;

  // ── Loading ───────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <Text style={styles.loadingText}>Loading…</Text>
      </View>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────

  return (
    <View style={styles.screen}>
      <FlatList
        data={listData as any[]}
        keyExtractor={listKey as any}
        renderItem={renderRow as any}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.muted} />
        }

        ListHeaderComponent={
          <View>

            {/* ── Header ────────────────────────────────────────────── */}
            <View style={styles.pageHeader}>
              <View>
                <Text style={styles.pageSubLabel}>SKILL SWAP · INTERNAL</Text>
                <Text style={styles.pageTitle}>Admin Panel</Text>
              </View>
              <TouchableOpacity
                style={styles.signOutBtn}
                onPress={() => router.replace('/(auth)/login')}
                activeOpacity={0.8}
              >
                <Text style={styles.signOutText}>Sign out</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.divider} />

            {/* ── Overview stats ────────────────────────────────────── */}
            <View style={styles.sectionBlock}>
              <Text style={styles.sectionLabel}>OVERVIEW</Text>

              {/* Primary stat row */}
              <View style={styles.statRow}>
                <StatCard label="USERS"  value={users.length}    />
                <StatCard label="SKILLS" value={skills.length}   />
                <StatCard label="SWAPS"  value={requests.length} />
              </View>

              {/* Swap status row */}
              <View style={styles.statRow}>
                <StatusCard label="PENDING"  value={pending}  color="#C8A882" bg="#2A2420" border="#C8A882" />
                <StatusCard label="ACCEPTED" value={accepted} color="#3D6B50" bg="#1C2820" border="#3D6B50" />
                <StatusCard label="REJECTED" value={rejected} color="#8B4444" bg="#1C1010" border="#8B4444" />
              </View>
            </View>

            <View style={styles.divider} />

            {/* ── Tab bar ───────────────────────────────────────────── */}
            <View style={styles.tabTrack}>
              {(['users', 'skills', 'requests'] as Tab[]).map((tab) => {
                const count = tab === 'users' ? users.length : tab === 'skills' ? skills.length : requests.length;
                const isActive = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    style={[styles.tabItem, isActive && styles.tabItemActive]}
                    activeOpacity={0.8}
                  >
                    <Text style={[styles.tabLabel, isActive && styles.tabLabelActive]}>
                      {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    </Text>
                    <View style={[styles.tabCount, isActive && styles.tabCountActive]}>
                      <Text style={[styles.tabCountText, isActive && styles.tabCountTextActive]}>
                        {count}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>

          </View>
        }

        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>Nothing here yet.</Text>
          </View>
        }
      />
    </View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <View style={statStyles.card}>
      <Text style={statStyles.label}>{label}</Text>
      <Text style={statStyles.value}>{value}</Text>
    </View>
  );
}

function StatusCard({
  label, value, color, bg, border,
}: {
  label: string; value: number; color: string; bg: string; border: string;
}) {
  return (
    <View style={[statStyles.card, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[statStyles.label, { color }]}>{label}</Text>
      <Text style={[statStyles.value, { color }]}>{value}</Text>
    </View>
  );
}

const statStyles = StyleSheet.create({
  card: {
    flex:            1,
    backgroundColor: Colors.surface ?? '#1C1B1A',
    borderWidth:     1,
    borderColor:     Colors.border  ?? '#2E2C2A',
    borderRadius:    14,
    padding:         14,
    gap:             6,
  },
  label: {
    fontFamily:    'Nunito_700Bold',
    fontSize:      9,
    color:         Colors.muted ?? '#6B6760',
    letterSpacing: 1.2,
  },
  value: {
    fontFamily:    'DMSerifDisplay_400Regular',
    fontSize:      26,
    color:         Colors.ink   ?? '#F0EBE3',
    letterSpacing: -0.5,
  },
});

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({

  screen: {
    flex: 1,
    backgroundColor: Colors.background ?? '#111010',
  },

  loadingScreen: {
    flex:           1,
    backgroundColor: Colors.background ?? '#111010',
    alignItems:     'center',
    justifyContent: 'center',
  },

  loadingText: {
    fontFamily: 'Nunito_400Regular',
    fontSize:   15,
    color:      Colors.muted ?? '#6B6760',
  },

  listContent: {
    paddingBottom: 48,
  },

  // ── Header ──────────────────────────────────────────────────────────────

  pageHeader: {
    flexDirection:     'row',
    alignItems:        'flex-end',
    justifyContent:    'space-between',
    paddingHorizontal: Theme.spacing.lg,
    paddingTop:        60,
    paddingBottom:     20,
  },

  pageSubLabel: {
    fontFamily:    'Nunito_700Bold',
    fontSize:      9,
    color:         Colors.muted ?? '#6B6760',
    letterSpacing: 1.6,
    marginBottom:  6,
  },

  pageTitle: {
    fontFamily:    'DMSerifDisplay_400Regular',
    fontSize:      30,
    color:         Colors.ink ?? '#F0EBE3',
    letterSpacing: -0.5,
  },

  signOutBtn: {
    borderWidth:       1,
    borderColor:       '#8B4444',
    borderRadius:      Theme.borderRadius.full ?? 999,
    paddingHorizontal: 16,
    paddingVertical:   8,
  },

  signOutText: {
    fontFamily: 'Nunito_700Bold',
    fontSize:   12,
    color:      '#8B4444',
  },

  divider: {
    height:          1,
    backgroundColor: Colors.border ?? '#2E2C2A',
    marginBottom:    20,
  },

  // ── Section block ────────────────────────────────────────────────────────

  sectionBlock: {
    paddingHorizontal: Theme.spacing.lg,
    gap:               10,
    marginBottom:      20,
  },

  sectionLabel: {
    fontFamily:    'Nunito_700Bold',
    fontSize:      10,
    color:         Colors.muted ?? '#6B6760',
    letterSpacing: 1.6,
    marginBottom:  2,
  },

  statRow: {
    flexDirection: 'row',
    gap:           8,
  },

  // ── Tab bar ──────────────────────────────────────────────────────────────

  tabTrack: {
    flexDirection:     'row',
    marginHorizontal:  Theme.spacing.lg,
    backgroundColor:   Colors.surface ?? '#1C1B1A',
    borderRadius:      14,
    borderWidth:       1,
    borderColor:       Colors.border  ?? '#2E2C2A',
    padding:           4,
    gap:               4,
    marginBottom:      16,
  },

  tabItem: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'center',
    gap:            6,
    paddingVertical: 10,
    borderRadius:   10,
  },

  tabItemActive: {
    backgroundColor: Colors.surface2 ?? '#252422',
  },

  tabLabel: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize:   12,
    color:      Colors.muted ?? '#6B6760',
  },

  tabLabelActive: {
    color:      Colors.ink ?? '#F0EBE3',
    fontFamily: 'Nunito_700Bold',
  },

  tabCount: {
    backgroundColor: Colors.background ?? '#111010',
    borderRadius:    999,
    paddingHorizontal: 6,
    paddingVertical:   2,
  },

  tabCountActive: {
    backgroundColor: Colors.accentSurface ?? '#2A2420',
  },

  tabCountText: {
    fontFamily: 'Nunito_700Bold',
    fontSize:   10,
    color:      Colors.muted ?? '#6B6760',
  },

  tabCountTextActive: {
    color: Colors.accent ?? '#C8A882',
  },

  // ── List items ───────────────────────────────────────────────────────────

  item: {
    flexDirection:     'row',
    alignItems:        'center',
    gap:               12,
    backgroundColor:   Colors.surface ?? '#1C1B1A',
    borderWidth:       1,
    borderColor:       Colors.border  ?? '#2E2C2A',
    borderRadius:      14,
    padding:           14,
    marginHorizontal:  Theme.spacing.lg,
  },

  itemBody: {
    flex: 1,
    gap:  3,
  },

  itemTitle: {
    fontFamily:    'DMSerifDisplay_400Regular',
    fontSize:      16,
    color:         Colors.ink  ?? '#F0EBE3',
    letterSpacing: -0.2,
  },

  itemSub: {
    fontFamily: 'Nunito_400Regular',
    fontSize:   12,
    color:      Colors.muted  ?? '#6B6760',
    lineHeight: 17,
  },

  itemMetaRow: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
    marginTop:     2,
  },

  itemMeta: {
    fontFamily: 'Nunito_400Regular',
    fontSize:   11,
    color:      Colors.muted ?? '#6B6760',
  },

  itemMetaDot: {
    fontFamily: 'Nunito_400Regular',
    fontSize:   11,
    color:      Colors.border ?? '#2E2C2A',
  },

  // Delete button
  deleteBtn: {
    width:           32,
    height:          32,
    borderRadius:    10,
    backgroundColor: '#1C1010',
    borderWidth:     1,
    borderColor:     '#3A2020',
    alignItems:      'center',
    justifyContent:  'center',
  },

  // ── Type pill (skills) ───────────────────────────────────────────────────

  typePill: {
    width:          36,
    height:         36,
    borderRadius:   10,
    alignItems:     'center',
    justifyContent: 'center',
  },

  typePillOffer: {
    backgroundColor: '#2A2420',
    borderWidth:     1,
    borderColor:     '#C8A882',
  },

  typePillNeed: {
    backgroundColor: Colors.surface2 ?? '#252422',
    borderWidth:     1,
    borderColor:     Colors.border   ?? '#2E2C2A',
  },

  typePillText:      { fontSize: 16 },
  typePillTextOffer: {},
  typePillTextNeed:  {},

  // ── Swap request items ───────────────────────────────────────────────────

  swapRoute: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },

  swapName: {
    fontFamily:    'DMSerifDisplay_400Regular',
    fontSize:      15,
    color:         Colors.ink ?? '#F0EBE3',
    letterSpacing: -0.2,
  },

  swapArrow: {
    marginHorizontal: 2,
  },

  swapSkills: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           6,
  },

  swapSkill: {
    flex:       1,
    fontFamily: 'Nunito_400Regular',
    fontSize:   12,
    color:      Colors.body  ?? '#B8B2AA',
  },

  swapSep: {
    fontFamily: 'Nunito_400Regular',
    fontSize:   12,
    color:      Colors.muted ?? '#6B6760',
  },

  statusDot: {
    width:        5,
    height:       5,
    borderRadius: 2.5,
  },

  statusText: {
    fontFamily: 'Nunito_600SemiBold',
    fontSize:   11,
  },

  // ── Empty ────────────────────────────────────────────────────────────────

  emptyWrap: {
    paddingHorizontal: Theme.spacing.lg,
    paddingTop:        24,
    alignItems:        'center',
  },

  emptyText: {
    fontFamily: 'Nunito_400Regular',
    fontSize:   14,
    color:      Colors.muted ?? '#6B6760',
  },
});