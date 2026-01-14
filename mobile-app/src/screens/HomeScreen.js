import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity
} from 'react-native';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

export default function HomeScreen({ navigation }) {
  const user = useAuthStore((state) => state.user);
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboard = useCallback(async () => {
    try {
      const data = await api.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Failed to fetch dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboard();
    setRefreshing(false);
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num?.toString() || '0';
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
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
        <Text style={styles.greeting}>Welcome back,</Text>
        <Text style={styles.username}>{user?.username || 'User'}</Text>
      </View>

      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Total Coins Earned</Text>
        <Text style={styles.balanceAmount}>
          {dashboard?.user?.totalCoinsEarned?.toFixed(2) || '0.00'} EXC
        </Text>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {formatNumber(dashboard?.today?.steps)}
          </Text>
          <Text style={styles.statLabel}>Steps Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {dashboard?.today?.exerciseMinutes || 0}
          </Text>
          <Text style={styles.statLabel}>Minutes Today</Text>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {dashboard?.today?.coinsEarned?.toFixed(2) || '0.00'}
          </Text>
          <Text style={styles.statLabel}>Coins Today</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={styles.statValue}>
            {dashboard?.today?.sessions || 0}
          </Text>
          <Text style={styles.statLabel}>Sessions Today</Text>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>This Week</Text>
        <View style={styles.weeklyStats}>
          <View style={styles.weeklyItem}>
            <Text style={styles.weeklyValue}>
              {formatNumber(dashboard?.weekly?.steps)}
            </Text>
            <Text style={styles.weeklyLabel}>Total Steps</Text>
          </View>
          <View style={styles.weeklyItem}>
            <Text style={styles.weeklyValue}>
              {dashboard?.weekly?.exerciseMinutes || 0}
            </Text>
            <Text style={styles.weeklyLabel}>Minutes</Text>
          </View>
          <View style={styles.weeklyItem}>
            <Text style={styles.weeklyValue}>
              {dashboard?.weekly?.coinsEarned?.toFixed(1) || '0'}
            </Text>
            <Text style={styles.weeklyLabel}>Coins</Text>
          </View>
        </View>
      </View>

      <TouchableOpacity
        style={styles.startButton}
        onPress={() => navigation.navigate('Exercise')}
      >
        <Text style={styles.startButtonText}>Start Exercise Session</Text>
      </TouchableOpacity>

      {dashboard?.recentSessions?.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          {dashboard.recentSessions.slice(0, 3).map((session) => (
            <View key={session._id} style={styles.sessionItem}>
              <View>
                <Text style={styles.sessionDate}>
                  {new Date(session.createdAt).toLocaleDateString()}
                </Text>
                <Text style={styles.sessionStats}>
                  {session.totalSteps} steps • {Math.floor(session.durationSeconds / 60)}m
                </Text>
              </View>
              <View style={styles.sessionReward}>
                <Text style={[
                  styles.sessionStatus,
                  session.status === 'rewarded' && styles.statusRewarded
                ]}>
                  {session.status === 'rewarded'
                    ? `+${session.coinsEarned?.toFixed(2)} EXC`
                    : session.status}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
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
    padding: 20,
    paddingTop: 10
  },
  greeting: {
    color: '#888',
    fontSize: 16
  },
  username: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold'
  },
  balanceCard: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 20,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e94560'
  },
  balanceLabel: {
    color: '#888',
    fontSize: 14,
    marginBottom: 8
  },
  balanceAmount: {
    color: '#e94560',
    fontSize: 36,
    fontWeight: 'bold'
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    gap: 16
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  statValue: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold'
  },
  statLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4
  },
  section: {
    paddingHorizontal: 20,
    marginTop: 24
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12
  },
  weeklyStats: {
    flexDirection: 'row',
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16
  },
  weeklyItem: {
    flex: 1,
    alignItems: 'center'
  },
  weeklyValue: {
    color: '#e94560',
    fontSize: 20,
    fontWeight: 'bold'
  },
  weeklyLabel: {
    color: '#888',
    fontSize: 12,
    marginTop: 4
  },
  startButton: {
    backgroundColor: '#e94560',
    marginHorizontal: 20,
    marginTop: 24,
    borderRadius: 12,
    padding: 18,
    alignItems: 'center'
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  },
  sessionItem: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  sessionDate: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500'
  },
  sessionStats: {
    color: '#888',
    fontSize: 12,
    marginTop: 4
  },
  sessionReward: {
    alignItems: 'flex-end'
  },
  sessionStatus: {
    color: '#888',
    fontSize: 14,
    textTransform: 'capitalize'
  },
  statusRewarded: {
    color: '#4ade80',
    fontWeight: '600'
  }
});
