import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  RefreshControl
} from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import QRCode from 'react-native-qrcode-svg';
import api from '../services/api';

export default function SendCoinsScreen() {
  const [activeTab, setActiveTab] = useState('send'); // 'send', 'qr', 'scan'
  const [refreshing, setRefreshing] = useState(false);

  // Send by username state
  const [username, setUsername] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [sendMessage, setSendMessage] = useState('');
  const [sending, setSending] = useState(false);

  // QR creation state
  const [qrAmount, setQrAmount] = useState('');
  const [qrMessage, setQrMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const [activeQR, setActiveQR] = useState(null);
  const [pendingTransfers, setPendingTransfers] = useState([]);

  // Scanner state
  const [hasPermission, setHasPermission] = useState(null);
  const [scanned, setScanned] = useState(false);

  // Transfer history
  const [history, setHistory] = useState([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [pendingRes, historyRes] = await Promise.all([
        api.getPendingTransfers(),
        api.getTransferHistory()
      ]);
      setPendingTransfers(pendingRes.transfers || []);
      setHistory(historyRes.transfers || []);
    } catch (error) {
      console.error('Failed to fetch transfer data:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  // Send coins by username
  const handleSendCoins = async () => {
    const amount = parseFloat(sendAmount);
    if (!username.trim()) {
      Alert.alert('Error', 'Please enter a username');
      return;
    }
    if (isNaN(amount) || amount < 0.01) {
      Alert.alert('Error', 'Please enter a valid amount (minimum 0.01 EXC)');
      return;
    }

    setSending(true);
    try {
      const result = await api.sendCoins(username.trim(), amount, sendMessage);
      if (result.success) {
        Alert.alert('Success', `Sent ${amount} EXC to ${username}`);
        setUsername('');
        setSendAmount('');
        setSendMessage('');
        await fetchData();
      } else {
        Alert.alert('Error', result.error || 'Failed to send coins');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send coins');
    } finally {
      setSending(false);
    }
  };

  // Create QR transfer
  const handleCreateQR = async () => {
    const amount = parseFloat(qrAmount);
    if (isNaN(amount) || amount < 0.01) {
      Alert.alert('Error', 'Please enter a valid amount (minimum 0.01 EXC)');
      return;
    }

    setCreating(true);
    try {
      const result = await api.createQRTransfer(amount, qrMessage);
      if (result.success) {
        setActiveQR(result.transfer);
        setQrAmount('');
        setQrMessage('');
        await fetchData();
      } else {
        Alert.alert('Error', result.error || 'Failed to create QR');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create QR');
    } finally {
      setCreating(false);
    }
  };

  // Cancel QR transfer
  const handleCancelQR = async (transferId) => {
    Alert.alert(
      'Cancel Transfer',
      'Are you sure? The coins will be returned to your wallet.',
      [
        { text: 'No', style: 'cancel' },
        {
          text: 'Yes, Cancel',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await api.cancelQRTransfer(transferId);
              if (result.success) {
                Alert.alert('Cancelled', `${result.refundedAmount} EXC returned to your wallet`);
                setActiveQR(null);
                await fetchData();
              }
            } catch (error) {
              Alert.alert('Error', 'Failed to cancel transfer');
            }
          }
        }
      ]
    );
  };

  // Request scanner permission
  const requestScannerPermission = async () => {
    const { status } = await BarCodeScanner.requestPermissionsAsync();
    setHasPermission(status === 'granted');
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to scan QR codes');
    }
  };

  // Handle scanned QR code
  const handleBarCodeScanned = async ({ type, data }) => {
    setScanned(true);

    try {
      const parsed = JSON.parse(data);
      if (parsed.type !== 'exc_transfer') {
        Alert.alert('Invalid QR', 'This is not an Exercise Coin transfer QR code');
        return;
      }

      Alert.alert(
        'Claim Transfer',
        `Receive ${parsed.amount} EXC?`,
        [
          {
            text: 'Cancel',
            style: 'cancel',
            onPress: () => setScanned(false)
          },
          {
            text: 'Claim',
            onPress: async () => {
              try {
                const result = await api.claimQRTransfer(parsed.code);
                if (result.success) {
                  Alert.alert(
                    'Success!',
                    `Received ${result.amount} EXC from ${result.fromUsername}${result.message ? `\n\n"${result.message}"` : ''}`
                  );
                  await fetchData();
                } else {
                  Alert.alert('Error', result.error || 'Failed to claim transfer');
                }
              } catch (error) {
                Alert.alert('Error', error.response?.data?.error || 'Failed to claim transfer');
              }
              setScanned(false);
            }
          }
        ]
      );
    } catch (e) {
      Alert.alert('Invalid QR', 'Could not read QR code data');
      setScanned(false);
    }
  };

  const renderSendTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Send to Username</Text>

      <TextInput
        style={styles.input}
        placeholder="Username"
        placeholderTextColor="#666"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Amount (EXC)"
        placeholderTextColor="#666"
        keyboardType="decimal-pad"
        value={sendAmount}
        onChangeText={setSendAmount}
      />

      <TextInput
        style={[styles.input, styles.messageInput]}
        placeholder="Message (optional)"
        placeholderTextColor="#666"
        multiline
        value={sendMessage}
        onChangeText={setSendMessage}
      />

      <TouchableOpacity
        style={styles.primaryButton}
        onPress={handleSendCoins}
        disabled={sending}
      >
        <Text style={styles.primaryButtonText}>
          {sending ? 'Sending...' : 'Send Coins'}
        </Text>
      </TouchableOpacity>
    </View>
  );

  const renderQRTab = () => (
    <View style={styles.tabContent}>
      {activeQR ? (
        <View style={styles.qrDisplay}>
          <Text style={styles.qrTitle}>Show this QR code</Text>
          <Text style={styles.qrSubtitle}>
            The recipient can scan to receive {activeQR.amount} EXC
          </Text>

          <View style={styles.qrContainer}>
            <QRCode
              value={activeQR.qrData}
              size={200}
              backgroundColor="#fff"
              color="#000"
            />
          </View>

          <Text style={styles.qrAmount}>{activeQR.amount} EXC</Text>
          {activeQR.message && (
            <Text style={styles.qrMessage}>"{activeQR.message}"</Text>
          )}

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={() => handleCancelQR(activeQR.id)}
          >
            <Text style={styles.cancelButtonText}>Cancel & Refund</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <Text style={styles.sectionTitle}>Create QR Transfer</Text>
          <Text style={styles.sectionSubtitle}>
            Generate a QR code that anyone can scan to receive coins
          </Text>

          <TextInput
            style={styles.input}
            placeholder="Amount (EXC)"
            placeholderTextColor="#666"
            keyboardType="decimal-pad"
            value={qrAmount}
            onChangeText={setQrAmount}
          />

          <TextInput
            style={[styles.input, styles.messageInput]}
            placeholder="Message (optional)"
            placeholderTextColor="#666"
            multiline
            value={qrMessage}
            onChangeText={setQrMessage}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleCreateQR}
            disabled={creating}
          >
            <Text style={styles.primaryButtonText}>
              {creating ? 'Creating...' : 'Generate QR Code'}
            </Text>
          </TouchableOpacity>

          {pendingTransfers.length > 0 && (
            <View style={styles.pendingSection}>
              <Text style={styles.pendingSectionTitle}>Pending Transfers</Text>
              {pendingTransfers.map((transfer) => (
                <TouchableOpacity
                  key={transfer.id}
                  style={styles.pendingItem}
                  onPress={() => setActiveQR(transfer)}
                >
                  <Text style={styles.pendingAmount}>{transfer.amount} EXC</Text>
                  <Text style={styles.pendingAction}>Tap to show QR</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </>
      )}
    </View>
  );

  const renderScanTab = () => (
    <View style={styles.tabContent}>
      {hasPermission === null ? (
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={requestScannerPermission}
        >
          <Text style={styles.primaryButtonText}>Enable Camera</Text>
        </TouchableOpacity>
      ) : hasPermission === false ? (
        <Text style={styles.errorText}>Camera permission denied</Text>
      ) : (
        <View style={styles.scannerContainer}>
          <BarCodeScanner
            onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}
            style={styles.scanner}
          />
          <View style={styles.scannerOverlay}>
            <View style={styles.scannerFrame} />
          </View>
          <Text style={styles.scannerHint}>
            Point at an Exercise Coin QR code
          </Text>
          {scanned && (
            <TouchableOpacity
              style={styles.rescanButton}
              onPress={() => setScanned(false)}
            >
              <Text style={styles.rescanButtonText}>Scan Again</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'send' && styles.activeTab]}
          onPress={() => setActiveTab('send')}
        >
          <Text style={[styles.tabText, activeTab === 'send' && styles.activeTabText]}>
            Send
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'qr' && styles.activeTab]}
          onPress={() => setActiveTab('qr')}
        >
          <Text style={[styles.tabText, activeTab === 'qr' && styles.activeTabText]}>
            QR Code
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'scan' && styles.activeTab]}
          onPress={() => {
            setActiveTab('scan');
            if (hasPermission === null) {
              requestScannerPermission();
            }
          }}
        >
          <Text style={[styles.tabText, activeTab === 'scan' && styles.activeTabText]}>
            Scan
          </Text>
        </TouchableOpacity>
      </View>

      {activeTab === 'send' && renderSendTab()}
      {activeTab === 'qr' && renderQRTab()}
      {activeTab === 'scan' && renderScanTab()}

      {/* Transfer history */}
      {history.length > 0 && (
        <View style={styles.historySection}>
          <Text style={styles.historySectionTitle}>Recent Transfers</Text>
          {history.slice(0, 10).map((transfer) => (
            <View key={transfer.id} style={styles.historyItem}>
              <View style={styles.historyIcon}>
                <Text>{transfer.type === 'sent' ? '📤' : '📥'}</Text>
              </View>
              <View style={styles.historyInfo}>
                <Text style={styles.historyUser}>
                  {transfer.type === 'sent' ? `To ${transfer.otherUser}` : `From ${transfer.otherUser}`}
                </Text>
                <Text style={styles.historyDate}>
                  {new Date(transfer.completedAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={[
                styles.historyAmount,
                transfer.type === 'sent' ? styles.amountSent : styles.amountReceived
              ]}>
                {transfer.type === 'sent' ? '-' : '+'}{transfer.amount} EXC
              </Text>
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
  tabs: {
    flexDirection: 'row',
    padding: 16,
    gap: 8
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#1a1a2e',
    borderRadius: 10,
    alignItems: 'center'
  },
  activeTab: {
    backgroundColor: '#e94560'
  },
  tabText: {
    color: '#888',
    fontSize: 15,
    fontWeight: '500'
  },
  activeTabText: {
    color: '#fff'
  },
  tabContent: {
    padding: 20
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 8
  },
  sectionSubtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 20
  },
  input: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333'
  },
  messageInput: {
    height: 80,
    textAlignVertical: 'top'
  },
  primaryButton: {
    backgroundColor: '#e94560',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  qrDisplay: {
    alignItems: 'center'
  },
  qrTitle: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600'
  },
  qrSubtitle: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    marginBottom: 24
  },
  qrContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 16
  },
  qrAmount: {
    color: '#4ade80',
    fontSize: 32,
    fontWeight: 'bold',
    marginTop: 20
  },
  qrMessage: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
    fontStyle: 'italic'
  },
  cancelButton: {
    marginTop: 24,
    paddingVertical: 14,
    paddingHorizontal: 24,
    backgroundColor: '#333',
    borderRadius: 10
  },
  cancelButtonText: {
    color: '#ef4444',
    fontSize: 16,
    fontWeight: '500'
  },
  pendingSection: {
    marginTop: 32
  },
  pendingSectionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12
  },
  pendingItem: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  pendingAmount: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  pendingAction: {
    color: '#e94560',
    fontSize: 14
  },
  scannerContainer: {
    height: 400,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative'
  },
  scanner: {
    flex: 1
  },
  scannerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center'
  },
  scannerFrame: {
    width: 220,
    height: 220,
    borderWidth: 2,
    borderColor: '#e94560',
    borderRadius: 16
  },
  scannerHint: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16
  },
  rescanButton: {
    backgroundColor: '#e94560',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    marginTop: 16,
    alignSelf: 'center'
  },
  rescanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  errorText: {
    color: '#ef4444',
    fontSize: 16,
    textAlign: 'center'
  },
  historySection: {
    padding: 20,
    paddingTop: 0
  },
  historySectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16
  },
  historyItem: {
    backgroundColor: '#1a1a2e',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center'
  },
  historyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#16213e',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12
  },
  historyInfo: {
    flex: 1
  },
  historyUser: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500'
  },
  historyDate: {
    color: '#888',
    fontSize: 12,
    marginTop: 2
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '600'
  },
  amountSent: {
    color: '#ef4444'
  },
  amountReceived: {
    color: '#4ade80'
  }
});
