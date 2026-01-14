import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  Share,
  Alert
} from 'react-native';
import api from '../services/api';

export default function WalletScreen() {
  const [balance, setBalance] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [daemonStatus, setDaemonStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchWalletData = useCallback(async () => {
    try {
      const [balanceData, txData, statusData] = await Promise.all([
        api.getWalletBalance(),
        api.getTransactions(20),
        api.getDaemonStatus()
      ]);

      setBalance(balanceData);
      setTransactions(txData.transactions || []);
      setDaemonStatus(statusData);
    } catch (error) {
      console.error('Failed to fetch wallet data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchWalletData();
    setRefreshing(false);
  };

  const shareAddress = async () => {
    if (!balance?.walletAddress) return;

    try {
      await Share.share({
        message: `My Exercise Coin wallet address: ${balance.walletAddress}`
      });
    } catch (error) {
      Alert.alert('Error', 'Failed to share address');
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'running': return '#4ade80';
      case 'starting': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#888';
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading wallet...</Text>
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
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Your Balance</Text>
        <Text style={styles.balanceAmount}>
          {balance?.balance?.toFixed(4) || '0.0000'} EXC
        </Text>
        {balance?.pending > 0 && (
          <Text style={styles.pendingAmount}>
            +{balance.pending.toFixed(4)} pending
          </Text>
        )}
      </View>

      <View style={styles.addressCard}>
        <Text style={styles.addressLabel}>Wallet Address</Text>
        <Text style={styles.addressText} numberOfLines={1} ellipsizeMode="middle">
          {balance?.walletAddress || 'Not generated'}
        </Text>
        <TouchableOpacity style={styles.shareButton} onPress={shareAddress}>
          <Text style={styles.shareButtonText}>Share Address</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.daemonCard}>
        <View style={styles.daemonHeader}>
          <Text style={styles.daemonTitle}>Mining Daemon</Text>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(daemonStatus?.status) + '20' }
          ]}>
            <View style={[
              styles.statusDot,
              { backgroundColor: getStatusColor(daemonStatus?.status) }
            ]} />
            <Text style={[
              styles.statusText,
              { color: getStatusColor(daemonStatus?.status) }
            ]}>
              {daemonStatus?.status || 'unknown'}
            </Text>
          </View>
        </View>
        {daemonStatus?.miningActive && (
          <Text style={styles.miningActive}>Mining in progress...</Text>
        )}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Transaction History</Text>

        {transactions.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No transactions yet</Text>
            <Text style={styles.emptySubtext}>
              Start exercising to earn your first coins!
            </Text>
          </View>
        ) : (
          transactions.map((tx) => (
            <View key={tx._id} style={styles.transactionItem}>
              <View style={styles.txLeft}>
                <Text style={styles.txType}>
                  {tx.type === 'mining_reward' ? 'Mining Reward' : tx.type}
                </Text>
                <Text style={styles.txDate}>{formatDate(tx.createdAt)}</Text>
              </View>
              <View style={styles.txRight}>
                <Text style={[
                  styles.txAmount,
                  tx.type === 'mining_reward' && styles.txAmountPositive
                ]}>
                  {tx.type === 'mining_reward' ? '+' : ''}{tx.amount.toFixed(4)} EXC
                </Text>
                <Text style={[
                  styles.txStatus,
                  tx.status === 'confirmed' && styles.txStatusConfirmed
                ]}>
                  {tx.status}
                </Text>
              </View>
            </View>
          ))
        )}
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
  balanceCard: {
    backgroundColor: '#1a1a2e',
    margin: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e94560'
  },
  balanceLabel: {
    color: '#888',
    fontSize: 14
  },
  balanceAmount: {
    color: '#e94560',
    fontSize: 40,
    fontWeight: 'bold',
    marginTop: 8
  },
  pendingAmount: {
    color: '#f59e0b',
    fontSize: 14,
    marginTop: 8
  },
  addressCard: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16
  },
  addressLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8
  },
  addressText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'monospace'
  },
  shareButton: {
    backgroundColor: '#16213e',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 12
  },
  shareButtonText: {
    color: '#e94560',
    fontSize: 14,
    fontWeight: '500'
  },
  daemonCard: {
    backgroundColor: '#1a1a2e',
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 12,
    padding: 16
  },
  daemonHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  daemonTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
    textTransform: 'capitalize'
  },
  miningActive: {
    color: '#4ade80',
    fontSize: 14,
    marginTop: 8
  },
  section: {
    paddingHorizontal: 20,
    paddingBottom: 30
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16
  },
  emptyState: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 30,
    alignItems: 'center'
  },
  emptyText: {
    color: '#888',
    fontSize: 16
  },
  emptySubtext: {
    color: '#666',
    fontSize: 14,
    marginTop: 8
  },
  transactionItem: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  txLeft: {},
  txType: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500'
  },
  txDate: {
    color: '#888',
    fontSize: 12,
    marginTop: 4
  },
  txRight: {
    alignItems: 'flex-end'
  },
  txAmount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  txAmountPositive: {
    color: '#4ade80'
  },
  txStatus: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
    textTransform: 'capitalize'
  },
  txStatusConfirmed: {
    color: '#4ade80'
  }
});
