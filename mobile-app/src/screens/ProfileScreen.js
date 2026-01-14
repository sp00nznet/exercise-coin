import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  TextInput,
  Linking
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

export default function ProfileScreen() {
  const { user, logout, updateUser } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Modal states
  const [editProfileVisible, setEditProfileVisible] = useState(false);
  const [changePasswordVisible, setChangePasswordVisible] = useState(false);
  const [editUsername, setEditUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const fetchData = useCallback(async () => {
    try {
      const [statsData, leaderboardData] = await Promise.all([
        api.getExerciseStats(),
        api.getLeaderboard('all', 5)
      ]);

      setStats(statsData);
      setLeaderboard(leaderboardData.leaderboard || []);
    } catch (error) {
      console.error('Failed to fetch profile data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', style: 'destructive', onPress: logout }
      ]
    );
  };

  const handleEditProfile = () => {
    setEditUsername(user?.username || '');
    setEditProfileVisible(true);
  };

  const handleSaveProfile = async () => {
    if (!editUsername.trim()) {
      Alert.alert('Error', 'Username cannot be empty');
      return;
    }

    try {
      const response = await api.updateProfile({ username: editUsername.trim() });
      if (updateUser) {
        updateUser({ username: editUsername.trim() });
      }
      setEditProfileVisible(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to update profile');
    }
  };

  const handleChangePassword = () => {
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setChangePasswordVisible(true);
  };

  const handleSavePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'All fields are required');
      return;
    }

    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    try {
      await api.changePassword(currentPassword, newPassword);
      setChangePasswordVisible(false);
      Alert.alert('Success', 'Password changed successfully');
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to change password');
    }
  };

  const handleNotifications = () => {
    Alert.alert(
      'Notifications',
      'Notification settings coming soon! This feature will allow you to customize alerts for mining rewards, exercise milestones, and more.',
      [{ text: 'OK' }]
    );
  };

  const handleHelpSupport = () => {
    Alert.alert(
      'Help & Support',
      'How can we help you?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Visit FAQ',
          onPress: () => Linking.openURL('https://github.com/sp00nznet/exercise-coin#readme')
        },
        {
          text: 'Report Issue',
          onPress: () => Linking.openURL('https://github.com/sp00nznet/exercise-coin/issues')
        }
      ]
    );
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  const formatDuration = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.username?.charAt(0)?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.username}>{user?.username}</Text>
        <Text style={styles.email}>{user?.email}</Text>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {formatNumber(stats?.lifetime?.totalSteps)}
          </Text>
          <Text style={styles.statLabel}>Total Steps</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {formatDuration(stats?.lifetime?.totalExerciseSeconds || 0)}
          </Text>
          <Text style={styles.statLabel}>Exercise Time</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats?.lifetime?.totalCoinsEarned?.toFixed(2) || '0'}
          </Text>
          <Text style={styles.statLabel}>Coins Earned</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {formatDuration(stats?.lifetime?.totalMiningSeconds || 0)}
          </Text>
          <Text style={styles.statLabel}>Mining Time</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Earners</Text>
        {leaderboard.map((entry, index) => (
          <View
            key={entry._id || index}
            style={[
              styles.leaderboardItem,
              entry.username === user?.username && styles.leaderboardItemHighlight
            ]}
          >
            <View style={styles.rankBadge}>
              <Text style={styles.rankText}>{index + 1}</Text>
            </View>
            <View style={styles.leaderboardInfo}>
              <Text style={styles.leaderboardName}>{entry.username}</Text>
              <Text style={styles.leaderboardStats}>
                {formatNumber(entry.totalSteps || 0)} steps
              </Text>
            </View>
            <Text style={styles.leaderboardCoins}>
              {(entry.totalCoinsEarned || 0).toFixed(2)} EXC
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>

        <TouchableOpacity style={styles.menuItem} onPress={handleEditProfile}>
          <Text style={styles.menuText}>Edit Profile</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleChangePassword}>
          <Text style={styles.menuText}>Change Password</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleNotifications}>
          <Text style={styles.menuText}>Notifications</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleHelpSupport}>
          <Text style={styles.menuText}>Help & Support</Text>
          <Text style={styles.menuArrow}>›</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.menuItem, styles.logoutItem]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.version}>Exercise Coin v1.0.0</Text>

      {/* Edit Profile Modal */}
      <Modal
        visible={editProfileVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setEditProfileVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Edit Profile</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Username"
              placeholderTextColor="#666"
              value={editUsername}
              onChangeText={setEditUsername}
              autoCapitalize="none"
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setEditProfileVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonSave}
                onPress={handleSaveProfile}
              >
                <Text style={styles.modalButtonSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Change Password Modal */}
      <Modal
        visible={changePasswordVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setChangePasswordVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Change Password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Current Password"
              placeholderTextColor="#666"
              secureTextEntry
              value={currentPassword}
              onChangeText={setCurrentPassword}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="New Password"
              placeholderTextColor="#666"
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
            <TextInput
              style={styles.modalInput}
              placeholder="Confirm New Password"
              placeholderTextColor="#666"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setChangePasswordVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonSave}
                onPress={handleSavePassword}
              >
                <Text style={styles.modalButtonSaveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f23'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f0f23'
  },
  loadingText: {
    color: '#888',
    fontSize: 16
  },
  header: {
    alignItems: 'center',
    paddingVertical: 30
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e94560',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16
  },
  avatarText: {
    color: '#fff',
    fontSize: 32,
    fontWeight: 'bold'
  },
  username: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold'
  },
  email: {
    color: '#888',
    fontSize: 14,
    marginTop: 4
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    marginBottom: 20
  },
  statItem: {
    width: '50%',
    padding: 8
  },
  statValue: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    color: '#e94560',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16
  },
  leaderboardItem: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  leaderboardItemHighlight: {
    borderWidth: 1,
    borderColor: '#e94560'
  },
  rankBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#16213e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  rankText: {
    color: '#e94560',
    fontWeight: 'bold',
    fontSize: 14
  },
  leaderboardInfo: {
    flex: 1
  },
  leaderboardName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500'
  },
  leaderboardStats: {
    color: '#888',
    fontSize: 12,
    marginTop: 2
  },
  leaderboardCoins: {
    color: '#4ade80',
    fontSize: 14,
    fontWeight: '600'
  },
  menuItem: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  menuText: {
    color: '#fff',
    fontSize: 16
  },
  menuArrow: {
    color: '#888',
    fontSize: 20
  },
  logoutItem: {
    marginTop: 8
  },
  logoutText: {
    color: '#ef4444',
    fontSize: 16
  },
  version: {
    color: '#666',
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: 30
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400
  },
  modalTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center'
  },
  modalInput: {
    backgroundColor: '#0f0f23',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333'
  },
  modalButtons: {
    flexDirection: 'row',
    marginTop: 12,
    gap: 12
  },
  modalButtonCancel: {
    flex: 1,
    backgroundColor: '#333',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center'
  },
  modalButtonCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  },
  modalButtonSave: {
    flex: 1,
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center'
  },
  modalButtonSaveText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});
