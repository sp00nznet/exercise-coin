import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import api from '../services/api';

const { width, height } = Dimensions.get('window');

export default function TreasureMapScreen() {
  const mapRef = useRef(null);
  const [location, setLocation] = useState(null);
  const [treasures, setTreasures] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedTreasure, setSelectedTreasure] = useState(null);

  // Drop modal state
  const [dropModalVisible, setDropModalVisible] = useState(false);
  const [dropAmount, setDropAmount] = useState('');
  const [dropMessage, setDropMessage] = useState('');
  const [dropping, setDropping] = useState(false);

  // Get user location and nearby treasures
  useEffect(() => {
    initializeLocation();
  }, []);

  const initializeLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'Location permission is required to use the treasure map');
        setLoading(false);
        return;
      }

      const currentLocation = await Location.getCurrentPositionAsync({});
      setLocation(currentLocation.coords);

      // Fetch nearby treasures
      await fetchNearbyTreasures(
        currentLocation.coords.latitude,
        currentLocation.coords.longitude
      );
    } catch (error) {
      console.error('Location error:', error);
      Alert.alert('Error', 'Failed to get your location');
    } finally {
      setLoading(false);
    }
  };

  const fetchNearbyTreasures = async (latitude, longitude) => {
    try {
      setRefreshing(true);
      const result = await api.findNearbyTreasure(latitude, longitude, 10000);
      if (result.success) {
        setTreasures(result.drops || []);
      }
    } catch (error) {
      console.error('Failed to fetch treasures:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    if (location) {
      await fetchNearbyTreasures(location.latitude, location.longitude);
    }
  };

  const handleDropTreasure = async () => {
    const amount = parseFloat(dropAmount);
    if (isNaN(amount) || amount < 0.01) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount (minimum 0.01 EXC)');
      return;
    }

    if (!location) {
      Alert.alert('Error', 'Location not available');
      return;
    }

    setDropping(true);
    try {
      const result = await api.dropTreasure(
        location.latitude,
        location.longitude,
        amount,
        dropMessage,
        '' // locationName - could be reverse geocoded
      );

      if (result.success) {
        Alert.alert('Success', `Dropped ${amount} EXC at your location!`);
        setDropModalVisible(false);
        setDropAmount('');
        setDropMessage('');
        await handleRefresh();
      } else {
        Alert.alert('Error', result.error || 'Failed to drop treasure');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to drop treasure');
    } finally {
      setDropping(false);
    }
  };

  const handleCollectTreasure = async (treasure) => {
    if (!location) {
      Alert.alert('Error', 'Location not available');
      return;
    }

    if (!treasure.canCollect) {
      Alert.alert(
        'Too Far',
        `You need to be within 50m of the treasure. Currently ${treasure.distance}m away.`
      );
      return;
    }

    try {
      const result = await api.collectTreasure(
        treasure.id,
        location.latitude,
        location.longitude
      );

      if (result.success) {
        Alert.alert(
          'Treasure Collected!',
          `You received ${result.amount} EXC${result.message ? `\n\nMessage: "${result.message}"` : ''}`
        );
        setSelectedTreasure(null);
        await handleRefresh();
      } else {
        Alert.alert('Error', result.error || 'Failed to collect treasure');
      }
    } catch (error) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to collect treasure');
    }
  };

  const centerOnUser = () => {
    if (location && mapRef.current) {
      mapRef.current.animateToRegion({
        latitude: location.latitude,
        longitude: location.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      });
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#e94560" />
        <Text style={styles.loadingText}>Getting your location...</Text>
      </View>
    );
  }

  if (!location) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.errorText}>Location not available</Text>
        <TouchableOpacity style={styles.retryButton} onPress={initializeLocation}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: location.latitude,
          longitude: location.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02
        }}
        showsUserLocation
        showsMyLocationButton={false}
      >
        {/* Treasure markers */}
        {treasures.map((treasure) => (
          <React.Fragment key={treasure.id}>
            <Marker
              coordinate={{
                latitude: treasure.location.latitude,
                longitude: treasure.location.longitude
              }}
              onPress={() => setSelectedTreasure(treasure)}
            >
              <View style={[
                styles.treasureMarker,
                treasure.dropType === 'random_drop' && styles.randomDropMarker
              ]}>
                <Text style={styles.treasureMarkerText}>
                  {treasure.dropType === 'random_drop' ? '🎁' : '💰'}
                </Text>
              </View>
            </Marker>
            {/* Collection radius circle */}
            <Circle
              center={{
                latitude: treasure.location.latitude,
                longitude: treasure.location.longitude
              }}
              radius={50}
              strokeColor={treasure.canCollect ? '#4ade80' : '#e94560'}
              fillColor={treasure.canCollect ? 'rgba(74, 222, 128, 0.2)' : 'rgba(233, 69, 96, 0.1)'}
              strokeWidth={2}
            />
          </React.Fragment>
        ))}
      </MapView>

      {/* Controls */}
      <View style={styles.controls}>
        <TouchableOpacity style={styles.controlButton} onPress={centerOnUser}>
          <Text style={styles.controlButtonText}>📍</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.controlButton} onPress={handleRefresh}>
          <Text style={styles.controlButtonText}>{refreshing ? '⏳' : '🔄'}</Text>
        </TouchableOpacity>
      </View>

      {/* Drop button */}
      <TouchableOpacity
        style={styles.dropButton}
        onPress={() => setDropModalVisible(true)}
      >
        <Text style={styles.dropButtonText}>Drop Treasure Here</Text>
      </TouchableOpacity>

      {/* Treasure count */}
      <View style={styles.treasureCount}>
        <Text style={styles.treasureCountText}>
          {treasures.length} treasure{treasures.length !== 1 ? 's' : ''} nearby
        </Text>
      </View>

      {/* Selected treasure panel */}
      {selectedTreasure && (
        <View style={styles.treasurePanel}>
          <TouchableOpacity
            style={styles.panelClose}
            onPress={() => setSelectedTreasure(null)}
          >
            <Text style={styles.panelCloseText}>×</Text>
          </TouchableOpacity>

          <Text style={styles.panelAmount}>{selectedTreasure.amount} EXC</Text>
          <Text style={styles.panelDropper}>
            {selectedTreasure.dropType === 'random_drop'
              ? '🎁 Random Drop'
              : `Dropped by ${selectedTreasure.droppedBy}`}
          </Text>
          {selectedTreasure.message && (
            <Text style={styles.panelMessage}>"{selectedTreasure.message}"</Text>
          )}
          <Text style={styles.panelDistance}>
            {selectedTreasure.distance}m away
          </Text>

          <TouchableOpacity
            style={[
              styles.collectButton,
              !selectedTreasure.canCollect && styles.collectButtonDisabled
            ]}
            onPress={() => handleCollectTreasure(selectedTreasure)}
          >
            <Text style={styles.collectButtonText}>
              {selectedTreasure.canCollect ? 'Collect Treasure' : 'Get Closer to Collect'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Drop modal */}
      <Modal
        visible={dropModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDropModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Drop Treasure</Text>
            <Text style={styles.modalSubtitle}>
              Leave coins at this location for others to find!
            </Text>

            <TextInput
              style={styles.modalInput}
              placeholder="Amount (EXC)"
              placeholderTextColor="#666"
              keyboardType="decimal-pad"
              value={dropAmount}
              onChangeText={setDropAmount}
            />

            <TextInput
              style={[styles.modalInput, styles.messageInput]}
              placeholder="Message (optional)"
              placeholderTextColor="#666"
              multiline
              value={dropMessage}
              onChangeText={setDropMessage}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButtonCancel}
                onPress={() => setDropModalVisible(false)}
              >
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalButtonDrop}
                onPress={handleDropTreasure}
                disabled={dropping}
              >
                <Text style={styles.modalButtonDropText}>
                  {dropping ? 'Dropping...' : 'Drop'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
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
    marginTop: 16,
    fontSize: 16
  },
  errorText: {
    color: '#e94560',
    fontSize: 16,
    marginBottom: 20
  },
  retryButton: {
    backgroundColor: '#e94560',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8
  },
  retryText: {
    color: '#fff',
    fontWeight: '600'
  },
  map: {
    flex: 1
  },
  controls: {
    position: 'absolute',
    top: 60,
    right: 16,
    gap: 8
  },
  controlButton: {
    backgroundColor: '#1a1a2e',
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4
  },
  controlButtonText: {
    fontSize: 20
  },
  dropButton: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#e94560',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#e94560',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6
  },
  dropButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600'
  },
  treasureCount: {
    position: 'absolute',
    top: 60,
    left: 16,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20
  },
  treasureCountText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500'
  },
  treasureMarker: {
    backgroundColor: '#4ade80',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#fff'
  },
  randomDropMarker: {
    backgroundColor: '#fbbf24'
  },
  treasureMarkerText: {
    fontSize: 20
  },
  treasurePanel: {
    position: 'absolute',
    bottom: 180,
    left: 20,
    right: 20,
    backgroundColor: '#1a1a2e',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  },
  panelClose: {
    position: 'absolute',
    top: 10,
    right: 14,
    zIndex: 1
  },
  panelCloseText: {
    color: '#888',
    fontSize: 28
  },
  panelAmount: {
    color: '#4ade80',
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  panelDropper: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 4
  },
  panelMessage: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 12,
    fontStyle: 'italic'
  },
  panelDistance: {
    color: '#e94560',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
    fontWeight: '500'
  },
  collectButton: {
    backgroundColor: '#4ade80',
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 16,
    alignItems: 'center'
  },
  collectButtonDisabled: {
    backgroundColor: '#333'
  },
  collectButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end'
  },
  modalContent: {
    backgroundColor: '#1a1a2e',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40
  },
  modalTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center'
  },
  modalSubtitle: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24
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
  messageInput: {
    height: 80,
    textAlignVertical: 'top'
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
    padding: 16,
    alignItems: 'center'
  },
  modalButtonCancelText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500'
  },
  modalButtonDrop: {
    flex: 1,
    backgroundColor: '#e94560',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center'
  },
  modalButtonDropText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  }
});
