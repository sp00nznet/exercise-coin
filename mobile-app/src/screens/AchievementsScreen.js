import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl
} from 'react-native';
import api from '../services/api';

const CATEGORY_ICONS = {
  steps: 'footsteps',
  exercise: 'timer',
  mining: 'hammer',
  coins: 'coin',
  streak: 'flame',
  special: 'star'
};

const CATEGORY_NAMES = {
  steps: 'Steps',
  exercise: 'Exercise Time',
  mining: 'Mining',
  coins: 'Coins Earned',
  streak: 'Streaks',
  special: 'Special'
};

export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchAchievements = useCallback(async () => {
    try {
      const data = await api.getAchievements();
      setAchievements(data.achievements || []);
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAchievements();
  }, [fetchAchievements]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAchievements();
    setRefreshing(false);
  };

  // Group achievements by category
  const groupedAchievements = achievements.reduce((acc, achievement) => {
    const category = achievement.category;
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(achievement);
    return acc;
  }, {});

  // Count unlocked achievements
  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading achievements...</Text>
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
        <Text style={styles.headerTitle}>Achievements</Text>
        <Text style={styles.headerSubtitle}>
          {unlockedCount} / {totalCount} Unlocked
        </Text>
        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBar,
              { width: `${(unlockedCount / totalCount) * 100}%` }
            ]}
          />
        </View>
      </View>

      {Object.entries(groupedAchievements).map(([category, categoryAchievements]) => (
        <View key={category} style={styles.section}>
          <Text style={styles.sectionTitle}>
            {CATEGORY_NAMES[category] || category}
          </Text>

          {categoryAchievements.map((achievement) => (
            <View
              key={achievement.code}
              style={[
                styles.achievementCard,
                achievement.unlocked && styles.achievementCardUnlocked
              ]}
            >
              <View style={[
                styles.achievementIcon,
                achievement.unlocked && styles.achievementIconUnlocked
              ]}>
                <Text style={styles.achievementIconText}>
                  {achievement.unlocked ? 'U+1F3C6' : 'U+1F512'}
                </Text>
              </View>

              <View style={styles.achievementInfo}>
                <Text style={[
                  styles.achievementName,
                  !achievement.unlocked && styles.achievementNameLocked
                ]}>
                  {achievement.name}
                </Text>
                <Text style={styles.achievementDescription}>
                  {achievement.description}
                </Text>

                {!achievement.unlocked && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBackground}>
                      <View
                        style={[
                          styles.progressFill,
                          { width: `${Math.min(achievement.progress, 100)}%` }
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {Math.round(achievement.progress)}%
                    </Text>
                  </View>
                )}

                {achievement.unlocked && achievement.unlockedAt && (
                  <Text style={styles.unlockedDate}>
                    Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                  </Text>
                )}
              </View>

              {achievement.coinReward > 0 && (
                <View style={styles.rewardBadge}>
                  <Text style={styles.rewardText}>
                    +{achievement.coinReward} EXC
                  </Text>
                </View>
              )}
            </View>
          ))}
        </View>
      ))}

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Keep exercising to unlock more achievements!
        </Text>
      </View>
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
    alignItems: 'center'
  },
  headerTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold'
  },
  headerSubtitle: {
    color: '#888',
    fontSize: 16,
    marginTop: 8
  },
  progressBarContainer: {
    width: '100%',
    height: 8,
    backgroundColor: '#1a1a2e',
    borderRadius: 4,
    marginTop: 16,
    overflow: 'hidden'
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#e94560',
    borderRadius: 4
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 24
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12
  },
  achievementCard: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    opacity: 0.7
  },
  achievementCardUnlocked: {
    opacity: 1,
    borderWidth: 1,
    borderColor: '#4ade80'
  },
  achievementIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#16213e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14
  },
  achievementIconUnlocked: {
    backgroundColor: '#4ade80'
  },
  achievementIconText: {
    fontSize: 24
  },
  achievementInfo: {
    flex: 1
  },
  achievementName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  achievementNameLocked: {
    color: '#888'
  },
  achievementDescription: {
    color: '#888',
    fontSize: 13,
    marginTop: 4
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8
  },
  progressBackground: {
    flex: 1,
    height: 6,
    backgroundColor: '#16213e',
    borderRadius: 3,
    marginRight: 8,
    overflow: 'hidden'
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#e94560',
    borderRadius: 3
  },
  progressText: {
    color: '#888',
    fontSize: 12,
    width: 40,
    textAlign: 'right'
  },
  unlockedDate: {
    color: '#4ade80',
    fontSize: 12,
    marginTop: 6
  },
  rewardBadge: {
    backgroundColor: '#16213e',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12
  },
  rewardText: {
    color: '#4ade80',
    fontSize: 12,
    fontWeight: '600'
  },
  footer: {
    padding: 30,
    alignItems: 'center'
  },
  footerText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center'
  }
});
