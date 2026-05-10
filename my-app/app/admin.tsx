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
import { Colors } from '../src/constants/Colors';
import { Theme } from '../src/constants/Theme';
import { deleteSkill, deleteSwapRequest, deleteUser, getAllSkills, getAllSwapRequests, getAllUsers } from '../src/firebase/firestore';
import { Skill, SwapRequest, User } from '../src/types';

export default function AdminScreen() {
  const [users, setUsers] = useState<User[]>([]);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [requests, setRequests] = useState<SwapRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = async () => {
    try {
      const [usersData, skillsData, requestsData] = await Promise.all([
        getAllUsers(),
        getAllSkills(),
        getAllSwapRequests(),
      ]);
      setUsers(usersData);
      setSkills(skillsData);
      setRequests(requestsData);
    } catch (error) {
      console.error('Error loading admin data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDeleteUser = (user: User) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to delete ${user.name}? This will also delete their skills and requests.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteUser(user.uid);
              setUsers(users.filter(u => u.uid !== user.uid));
              setSkills(skills.filter(s => s.userId !== user.uid));
              setRequests(requests.filter(r => r.fromUserId !== user.uid && r.toUserId !== user.uid));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete user');
            }
          },
        },
      ]
    );
  };

  const handleDeleteSkill = (skill: Skill) => {
    Alert.alert(
      'Delete Skill',
      `Are you sure you want to delete "${skill.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSkill(skill.id);
              setSkills(skills.filter(s => s.id !== skill.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete skill');
            }
          },
        },
      ]
    );
  };

  const handleDeleteRequest = (request: SwapRequest) => {
    Alert.alert(
      'Delete Request',
      'Are you sure you want to delete this swap request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteSwapRequest(request.id);
              setRequests(requests.filter(r => r.id !== request.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete request');
            }
          },
        },
      ]
    );
  };

  const renderUser = ({ item }: { item: User }) => (
    <View style={styles.item}>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.name}</Text>
        <Text style={styles.itemSubtitle}>{item.bio || 'No bio'}</Text>
        <Text style={styles.itemMeta}>ID: {item.uid}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDeleteUser(item)}
      >
        <Ionicons name="trash" size={20} color={Colors.danger} />
      </TouchableOpacity>
    </View>
  );

  const renderSkill = ({ item }: { item: Skill }) => (
    <View style={styles.item}>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.title}</Text>
        <Text style={styles.itemSubtitle}>{item.description || 'No description'}</Text>
        <Text style={styles.itemMeta}>{item.category} • {item.type} • {item.userName}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDeleteSkill(item)}
      >
        <Ionicons name="trash" size={20} color={Colors.danger} />
      </TouchableOpacity>
    </View>
  );

  const renderRequest = ({ item }: { item: SwapRequest }) => (
    <View style={styles.item}>
      <View style={styles.itemContent}>
        <Text style={styles.itemTitle}>{item.fromUserName} → {item.toUserName}</Text>
        <Text style={styles.itemSubtitle}>{item.offeredSkillTitle} ↔ {item.requestedSkillTitle}</Text>
        <Text style={styles.itemMeta}>{item.status} • {item.createdAt?.toDateString()}</Text>
      </View>
      <TouchableOpacity
        style={styles.deleteBtn}
        onPress={() => handleDeleteRequest(item)}
      >
        <Ionicons name="trash" size={20} color={Colors.danger} />
      </TouchableOpacity>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <Text style={styles.loading}>Loading admin data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Admin Panel</Text>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.replace('/(auth)/login')}
        >
          <Ionicons name="log-out" size={24} color={Colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Users ({users.length})</Text>
        <FlatList
          data={users}
          keyExtractor={(item) => item.uid}
          renderItem={renderUser}
          scrollEnabled={false}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skills ({skills.length})</Text>
        <FlatList
          data={skills}
          keyExtractor={(item) => item.id}
          renderItem={renderSkill}
          scrollEnabled={false}
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Swap Requests ({requests.length})</Text>
        <FlatList
          data={requests}
          keyExtractor={(item) => item.id}
          renderItem={renderRequest}
          scrollEnabled={false}
        />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loading: {
    ...Theme.body,
    textAlign: 'center',
    marginTop: 50,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Theme.spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    ...Theme.heading,
    fontSize: 24,
  },
  backBtn: {
    padding: Theme.spacing.sm,
  },
  section: {
    padding: Theme.spacing.lg,
  },
  sectionTitle: {
    ...Theme.heading,
    fontSize: 18,
    marginBottom: Theme.spacing.md,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Theme.spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
  },
  itemContent: {
    flex: 1,
  },
  itemTitle: {
    ...Theme.body,
    fontWeight: '600',
  },
  itemSubtitle: {
    ...Theme.bodySmall,
    color: Colors.muted,
    marginTop: 2,
  },
  itemMeta: {
    ...Theme.bodySmall,
    color: Colors.muted,
    marginTop: 2,
  },
  deleteBtn: {
    padding: Theme.spacing.sm,
  },
});