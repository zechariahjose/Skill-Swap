import { useMemo, useState } from 'react';
import { router } from 'expo-router';
import {
  Alert,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import CategoryChip from '../components/CategoryChip';
import EmptyState from '../components/EmptyState';
import SkeletonCard from '../components/SkeletonCard';
import SkillCard from '../components/SkillCard';
import Avatar from '../components/Avatar';
import { Theme } from '../../src/constants/Theme';
import { useAuthContext } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import { createSwapRequest, getSkillsByUser } from '../../src/firebase/firestore';
import { useSkills } from '../../src/hooks/useSkills';
import { CATEGORIES, Category, Skill } from '../../src/types';

function getGreeting(name?: string) {
  const h = new Date().getHours();
  let greeting = 'Good evening';
  if (h < 12) greeting = 'Good morning';
  else if (h < 17) greeting = 'Good afternoon';
  return `${greeting}${name ? `, ${name}` : ''}`;
}

export default function HomeScreen() {
  const { skills, loading, refreshSkills } = useSkills();
  const { userProfile }                    = useAuthContext();
  const { colors }                         = useTheme();
  const [search, setSearch]                = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | 'All'>('All');
  const [refreshing, setRefreshing]        = useState(false);

  const styles = getStyles(colors);

  const filteredSkills = useMemo(() => {
    return skills.filter((skill) => {
      if (skill.userId === userProfile?.uid) return false;
      const categoryOk = selectedCategory === 'All' || skill.category === selectedCategory;
      const query      = search.toLowerCase().trim();
      const textOk     =
        query.length === 0 ||
        skill.title.toLowerCase().includes(query) ||
        skill.description.toLowerCase().includes(query);
      return categoryOk && textOk;
    });
  }, [search, selectedCategory, skills, userProfile?.uid]);

  const activeUsers = useMemo(() => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000;
    const users  = new Map<string, { initials: string; name: string }>();
    skills.forEach((skill) => {
      const createdAt = skill.createdAt;
      const timestamp =
        createdAt instanceof Date
          ? createdAt.getTime()
          : typeof createdAt === 'object' && createdAt !== null && 'seconds' in createdAt
          ? (createdAt as { seconds: number }).seconds * 1000
          : 0;
      if (timestamp >= cutoff && !users.has(skill.userId)) {
        users.set(skill.userId, { initials: skill.userInitials, name: skill.userName });
      }
    });
    return Array.from(users.values()).slice(0, 8);
  }, [skills]);

  const onRefresh = async () => {
    setRefreshing(true);
    try { await refreshSkills(); } finally { setRefreshing(false); }
  };

  const sendSwapRequest = async (requestedSkill: Skill) => {
    if (!userProfile) return;
    try {
      const mySkills     = await getSkillsByUser(userProfile.uid);
      const offeredSkill = mySkills.find((s) => s.type === 'offer');
      if (!offeredSkill) {
        Alert.alert('Add a skill first', 'Post at least one offered skill before requesting swaps.');
        return;
      }
      await createSwapRequest({
        fromUserId:          userProfile.uid,
        fromUserName:        userProfile.name,
        fromUserInitials:    userProfile.initials,
        toUserId:            requestedSkill.userId,
        toUserName:          requestedSkill.userName,
        toUserInitials:      requestedSkill.userInitials,
        offeredSkillId:      offeredSkill.id,
        offeredSkillTitle:   offeredSkill.title,
        requestedSkillId:    requestedSkill.id,
        requestedSkillTitle: requestedSkill.title,
        status:              'pending',
      });
      Alert.alert('Request sent', 'Your swap request has been sent.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Request failed';
      Alert.alert('Unable to send request', message);
    }
  };

  const firstName = userProfile?.name?.split(' ')[0] ?? 'there';

  return (
    <View style={styles.screen}>
      <FlatList
        data={filteredSkills}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.muted}
          />
        }
        renderItem={({ item, index }) => (
          <View style={[styles.cardPad, index === 0 && styles.cardFirst]}>
            <SkillCard skill={item} onSwapPress={sendSwapRequest} />
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.cardGap} />}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContent}

        ListHeaderComponent={
          <View style={styles.header}>

            {/* ── Top bar: greeting (left) + notification button (right) ── */}
            <View style={styles.topBar}>

              {/* Left: badge + headline + subline stacked */}
              <View style={styles.greetingBlock}>
                <View style={[styles.greetingBadge, { backgroundColor: colors.softSurface ?? colors.surface }]}>
                  <Ionicons name="sparkles" size={11} color={colors.muted} />
                  <Text style={[styles.greetingBadgeText, { color: colors.muted }]}>
                    {getGreeting(firstName)}
                  </Text>
                </View>

                <Text style={styles.headline}>
                  {'What will you\n'}
                  <Text style={[styles.headlineAccent, { color: colors.accent ?? '#C8A882' }]}>learn</Text>
                  {' today?'}
                </Text>

                <Text style={[styles.subHeadline, { color: colors.muted }]}>
                  {filteredSkills.length > 0
                    ? `${filteredSkills.length} skills available to swap`
                    : 'Explore skills from your community'}
                </Text>
              </View>

              {/* Right: notification button — pinned to top-right, aligned with badge */}
              <TouchableOpacity
                onPress={() => router.push('/notifications')}
                style={[styles.notificationButton, { backgroundColor: colors.softSurface ?? colors.surface }]}
                activeOpacity={0.7}
              >
                <Ionicons name="notifications-outline" size={20} color={colors.ink} />
                {/* Uncomment when you have an unread count: */}
                {/* <View style={[styles.notificationBadge, { backgroundColor: colors.statusRed, borderColor: colors.background }]}>
                  <Text style={styles.notificationBadgeText}>3</Text>
                </View> */}
              </TouchableOpacity>

            </View>

            {/* ── Search bar ────────────────────────────────────────── */}
            <View style={[styles.searchWrapper, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Ionicons name="search" size={15} color={colors.muted} />
              <TextInput
                value={search}
                onChangeText={setSearch}
                placeholder="Search skills…"
                placeholderTextColor={colors.muted}
                style={[styles.searchInput, { color: colors.ink }]}
                returnKeyType="search"
              />
              {search.length > 0 && (
                <TouchableOpacity onPress={() => setSearch('')} hitSlop={8}>
                  <Ionicons name="close-circle" size={15} color={colors.muted} />
                </TouchableOpacity>
              )}
            </View>

            {/* ── Active Today ──────────────────────────────────────── */}
            {activeUsers.length > 0 && (
              <View style={styles.section}>
                <SectionHeader label="Active Today" colors={colors} />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.peopleRow}
                >
                  {activeUsers.map((member, i) => (
                    <View key={member.initials + member.name + i} style={styles.personItem}>
                      <View style={[styles.avatarRing, { borderColor: colors.border }]}>
                        <Avatar initials={member.initials} size={44} />
                      </View>
                      <Text
                        style={[styles.personName, { color: colors.muted }]}
                        numberOfLines={1}
                      >
                        {member.name.split(' ')[0]}
                      </Text>
                    </View>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── Category chips ────────────────────────────────────── */}
            <FlatList
              data={['All', ...CATEGORIES.map((c) => c.label)] as (Category | 'All')[]}
              horizontal
              keyExtractor={(item) => item}
              showsHorizontalScrollIndicator={false}
              renderItem={({ item }) => (
                <CategoryChip
                  label={item}
                  selected={selectedCategory === item}
                  onPress={() => setSelectedCategory(item)}
                />
              )}
              contentContainerStyle={styles.chips}
            />

            {/* ── Skill Board header ────────────────────────────────── */}
            <View style={styles.boardHeader}>
              <SectionHeader label="Skill Board" colors={colors} />
              {!loading && filteredSkills.length > 0 && (
                <View style={[styles.countPill, { backgroundColor: colors.softSurface ?? colors.surface }]}>
                  <Text style={[styles.countText, { color: colors.muted }]}>
                    {filteredSkills.length}
                  </Text>
                </View>
              )}
            </View>

            {/* ── Skeleton loading ─────────────────────────────────── */}
            {loading && (
              <View style={styles.skeletonWrap}>
                <SkeletonCard />
                <SkeletonCard />
                <SkeletonCard />
              </View>
            )}

          </View>
        }

        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyWrap}>
              <EmptyState
                emoji="✦"
                title="Nothing here yet"
                subtitle="Try another category, or be the first to post a skill."
              />
            </View>
          ) : null
        }
      />
    </View>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({
  label,
  colors,
}: {
  label: string;
  colors: typeof import('../../src/constants/Colors').Colors;
}) {
  return (
    <View style={sectionStyles.row}>
      <View style={[sectionStyles.dot, { backgroundColor: colors.accent ?? '#C8A882' }]} />
      <Text style={[sectionStyles.label, { color: colors.muted }]}>
        {label.toUpperCase()}
      </Text>
    </View>
  );
}

const sectionStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
    marginBottom:  12,
  },
  dot: {
    width:        5,
    height:       5,
    borderRadius: 2.5,
  },
  label: {
    fontFamily:    'Nunito_700Bold',
    fontSize:      10,
    letterSpacing: 1.8,
    textTransform: 'uppercase',
  },
});

// ─── Screen styles ────────────────────────────────────────────────────────────

const getStyles = (colors: typeof import('../../src/constants/Colors').Colors) =>
  StyleSheet.create({

    screen: {
      flex: 1,
      backgroundColor: colors.background ?? '#111010',
    },

    listContent: {
      paddingBottom: 100,
    },

    header: {
      paddingBottom: 8,
    },

    // ── Top bar ───────────────────────────────────────────────────────────
    // Row: greeting block takes all remaining space (flex:1),
    // notification button sits flush top-right aligned with the badge pill.

    topBar: {
      flexDirection:     'row',
      alignItems:        'flex-start',   // both children anchor to top
      paddingTop:        56,             // safe area + breathing room
      paddingHorizontal: Theme.spacing.lg,
      paddingBottom:     20,
      gap:               12,
    },

    // ── Greeting ──────────────────────────────────────────────────────────

    greetingBlock: {
      flex: 1,                           // takes all width except notification btn
      gap:  0,
    },

    greetingBadge: {
      flexDirection:     'row',
      alignItems:        'center',
      gap:               6,
      alignSelf:         'flex-start',
      borderRadius:      Theme.borderRadius.full,
      paddingHorizontal: 12,
      paddingVertical:   7,
      marginBottom:      16,
    },

    greetingBadgeText: {
      fontFamily:    'Nunito_600SemiBold',
      fontSize:      11,
      letterSpacing: 0.4,
    },

    headline: {
      fontFamily:    'DMSerifDisplay_400Regular',
      fontSize:      34,
      color:         colors.ink ?? '#F0EBE3',
      lineHeight:    42,
      letterSpacing: -0.8,
    },

    headlineAccent: {
      // color applied inline
    },

    subHeadline: {
      fontFamily: 'Nunito_400Regular',
      fontSize:   13,
      marginTop:  10,
      lineHeight: 20,
    },

    // ── Notification button ───────────────────────────────────────────────
    // Sits at top of the row, vertically aligned with the greeting badge pill.
    // No marginTop — topBar's paddingTop handles vertical placement.

    notificationButton: {
      width:          40,
      height:         40,
      borderRadius:   20,
      alignItems:     'center',
      justifyContent: 'center',
      borderWidth:    1,
      borderColor:    colors.border ?? '#2E2C2A',
      // Matches greeting badge height (7+7 padding + 11 font ≈ 34px) — close enough
      // to sit on the same optical line when alignItems:'flex-start' is on topBar.
      marginTop:      20,
    },

    notificationBadge: {
      position:     'absolute',
      top:          -3,
      right:        -3,
      width:        18,
      height:       18,
      borderRadius: 9,
      alignItems:   'center',
      justifyContent: 'center',
      borderWidth:  2,
    },

    notificationBadgeText: {
      color:      'white',
      fontSize:   9,
      fontFamily: 'Nunito_700Bold',
    },

    // ── Search ────────────────────────────────────────────────────────────

    searchWrapper: {
      flexDirection:     'row',
      alignItems:        'center',
      gap:               10,
      marginHorizontal:  Theme.spacing.lg,
      marginBottom:      24,
      borderRadius:      16,
      borderWidth:       1,
      paddingHorizontal: 16,
      paddingVertical:   13,
    },

    searchInput: {
      flex:       1,
      fontFamily: 'Nunito_400Regular',
      fontSize:   14,
    },

    // ── Active Today ──────────────────────────────────────────────────────

    section: {
      paddingBottom:     20,
      paddingHorizontal: Theme.spacing.lg,
    },

    peopleRow: {
      gap: 16,
    },

    personItem: {
      alignItems: 'center',
      width:      56,
      gap:        6,
    },

    avatarRing: {
      borderWidth:  1.5,
      borderRadius: 999,
      padding:      2,
    },

    personName: {
      fontFamily: 'Nunito_400Regular',
      fontSize:   11,
      textAlign:  'center',
    },

    // ── Category chips ────────────────────────────────────────────────────

    chips: {
      paddingHorizontal: Theme.spacing.lg,
      paddingBottom:     20,
      gap:               8,
    },

    // ── Skill Board ───────────────────────────────────────────────────────

    boardHeader: {
      flexDirection:     'row',
      alignItems:        'center',
      justifyContent:    'space-between',
      paddingHorizontal: Theme.spacing.lg,
      marginBottom:      4,
    },

    countPill: {
      borderRadius:      Theme.borderRadius.full,
      paddingHorizontal: 12,
      paddingVertical:   5,
    },

    countText: {
      fontFamily: 'Nunito_700Bold',
      fontSize:   11,
    },

    // ── Cards ─────────────────────────────────────────────────────────────

    cardPad: {
      paddingHorizontal: Theme.spacing.lg,
    },

    cardFirst: {
      marginTop: 8,
    },

    cardGap: {
      height: 10,
    },

    // ── Skeleton ──────────────────────────────────────────────────────────

    skeletonWrap: {
      paddingHorizontal: Theme.spacing.lg,
      gap:               10,
      marginTop:         8,
    },

    // ── Empty ─────────────────────────────────────────────────────────────

    emptyWrap: {
      paddingHorizontal: Theme.spacing.lg,
      paddingTop:        8,
    },
  });