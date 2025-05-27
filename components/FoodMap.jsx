import { AntDesign, Entypo, MaterialIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import BottomSheet from "@gorhom/bottom-sheet";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import * as Location from "expo-location";
import React, { useEffect, useRef, useState, useCallback, useMemo } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  StatusBar,
  Animated,
  Dimensions,
  ScrollView,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Polyline } from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen";
import { baseImgURL, baseURL } from "../backend/baseData";
import { GOOGLE_MAPS_APIKEY } from "../constants";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import LottieView from 'lottie-react-native';

const { width, height } = Dimensions.get('window');
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.02;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

// Custom components for a cleaner organization
const Pulse = () => {
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animate = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => animate());
    };

    animate();
  }, []);

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View
        style={{
          position: 'absolute',
          width: 50,
          height: 50,
          borderRadius: 25,
          backgroundColor: 'rgba(239, 68, 68, 0.2)',
          opacity: pulseAnim,
          transform: [
            {
              scale: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 2],
              }),
            },
          ],
        }}
      />
      <Animated.View
        style={{
          position: 'absolute',
          width: 25,
          height: 25,
          borderRadius: 12.5,
          backgroundColor: 'rgba(239, 68, 68, 0.4)',
          opacity: pulseAnim,
          transform: [
            {
              scale: pulseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [1, 1.5],
              }),
            },
          ],
        }}
      />
      <View style={{ width: 15, height: 15, borderRadius: 7.5, backgroundColor: '#ef4444' }} />
    </View>
  );
};

// Bottom sheet content component - using regular ScrollView to fix the issue
const BottomSheetContent = ({ item, openCamera }) => {
  const animation = useRef(null);
  
  useEffect(() => {
    if (animation.current) {
      animation.current.play();
    }
  }, []);

  return (
    <View style={styles.bottomSheetContent}>
      <View style={styles.successContainer}>
        <View style={{ width: 150, height: 150, justifyContent: 'center', alignItems: 'center' }}>
          <AntDesign name="checkcircle" size={hp(8)} color="#22c55e" />
        </View>
        <Text style={styles.successTitle}>
          You have reached your destination!
        </Text>
        <Text style={styles.successSubtitle}>
          Complete your challenge by taking a photo of your experience
        </Text>
      </View>
      
      <TouchableOpacity
        style={styles.cameraButton}
        onPress={() => openCamera("yes")}
        activeOpacity={0.8}
      >
        <Ionicons name="camera" size={22} color="white" />
        <Text style={styles.cameraButtonText}>
          Take a Photo
        </Text>
      </TouchableOpacity>

      <View style={styles.infoBox}>
        <View style={styles.infoIconContainer}>
          <Ionicons name="information" size={hp(2)} color="#3b82f6" />
        </View>
        <Text style={styles.infoText}>
          Please take a photo once you've received your food to complete the challenge and earn your reward.
        </Text>
      </View>
    </View>
  );
};

const FoodMap = ({ route }) => {
  const [isMapReady, setIsMapReady] = useState(false);
  const [mapRegion, setMapRegion] = useState(null);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [alertShown, setAlertShown] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [eta, setEta] = useState(null);
  const [distance, setDistance] = useState(null);
  const [prevCoords, setPrevCoords] = useState(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  const [mapPadding, setMapPadding] = useState({ top: 0, right: 0, bottom: 0, left: 0 });
  const [isTracking, setIsTracking] = useState(true);
  
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const bottomSheetRef = useRef(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { item, user_id } = route.params;

  // Initialize with correct types to prevent errors
  const destination = useMemo(() => ({
    latitude: parseFloat(item?.latitude) || 0,
    longitude: parseFloat(item?.longitude) || 0,
    latitudeDelta: LATITUDE_DELTA,
    longitudeDelta: LONGITUDE_DELTA,
  }), [item]);

  // Animation for user location updates
  useEffect(() => {
    const pulsate = () => {
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start(() => pulsate());
    };

    pulsate();
  }, []);

  // Enhanced real-time location tracking
  const locationCheck = async () => {
    setIsLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setErrorMsg("Permission to access location was denied");
      setIsLoading(false);
      return;
    }

    // Set up location tracking with more frequent updates
    const locationSubscription = await Location.watchPositionAsync(
      {
        accuracy: Location.Accuracy.BestForNavigation,
        distanceInterval: 5, // Update every 5 meters
        timeInterval: 1000, // Update every 1 second
      },
      (newLocation) => {
        const { latitude, longitude } = newLocation.coords;
        
        // Store current location
        setLocation(newLocation);
        
        // Update region (map view)
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: LATITUDE_DELTA,
          longitudeDelta: LONGITUDE_DELTA,
        };
        setMapRegion(newRegion);
        
        // Add to route coordinates for tracking path
        setRouteCoordinates(prevCoords => [
          ...prevCoords,
          { latitude, longitude }
        ]);
        
        // Store previous coordinates for animation
        setPrevCoords({ latitude, longitude });
        
        // Calculate distance to destination
        const calculatedDistance = getDistance(
          latitude,
          longitude,
          destination.latitude,
          destination.longitude
        );
        
        setDistance(calculatedDistance);
        setIsLoading(false);

        // Show bottom sheet when user is close to destination
        if (calculatedDistance < 30 && !alertShown) {
          openBottomSheet();
          addProgress();
          setAlertShown(true);
        }
        
        // Fit map to show both user and destination
        if (mapRef.current && isMapReady && isTracking) {
          mapRef.current.fitToCoordinates(
            [
              { latitude, longitude },
              destination
            ],
            {
              edgePadding: { 
                top: 100, 
                right: 50, 
                bottom: height * 0.4, 
                left: 50 
              },
              animated: true,
            }
          );
        }

        // Fade in destination card
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }).start();
      }
    );

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  };

  useEffect(() => {
    const cleanup = locationCheck();
    return () => {
      if (cleanup && typeof cleanup.then == 'function') {
        cleanup.then(removeFunc => {
          if (removeFunc) removeFunc();
        });
      }
    };
  }, [alertShown]);

  // Haversine formula for more accurate distance calculation
  const getDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    const d = R * c;
    return d;
  };

  const openBottomSheet = useCallback(() => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.expand();
      
      // Adjust map padding to accommodate the bottom sheet
      setMapPadding({ 
        top: mapPadding.top,
        right: mapPadding.right,
        bottom: height * 0.4, // 40% of screen height for bottom sheet
        left: mapPadding.left
      });
    }
  }, [mapPadding]);

  const openCamera = async (id) => {
    try {
      const response = await axios.post(
        `${baseURL}/createUserChallenge.php`,
        {
          user_id: user_id,
          challenge_id: item.challenge_id,
          page_id: item.page_id,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      
      if (id) {
        if (response.data.success) {
          navigation.navigate("FoodApprovalScreen", {
            item: item,
            completed_id: response.data.completed_id,
          });
        }
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const addProgress = async () => {
    try {
      const response = await axios.post(
        `${baseURL}/add-progress-store.php`,
        {
          user_id: user_id,
          challenge_id: item.challenge_id,
          store_id: item.store_id,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      
      if (response.data.success) {
        openCamera();
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  // Handle ETA update from MapViewDirections
  const onDirectionsReady = (result) => {
    const { duration, distance, coordinates } = result;
    setEta(duration);
    
    // Set the full route coordinates for better display
    if (coordinates && coordinates.length > 0) {
      // Only initialize once to avoid performance issues with constant updates
      if (routeCoordinates.length == 0) {
        setRouteCoordinates(coordinates);
      }
    }
  };

  // Modern map style
  const mapStyle = [
    {
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#f5f5f5"
        }
      ]
    },
    {
      "elementType": "labels.icon",
      "stylers": [
        {
          "visibility": "on"
        }
      ]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#616161"
        }
      ]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [
        {
          "color": "#f5f5f5"
        }
      ]
    },
    {
      "featureType": "administrative.land_parcel",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#bdbdbd"
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#eeeeee"
        }
      ]
    },
    {
      "featureType": "poi",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#757575"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#e5e5e5"
        }
      ]
    },
    {
      "featureType": "poi.park",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#9e9e9e"
        }
      ]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#ffffff"
        }
      ]
    },
    {
      "featureType": "road.arterial",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#757575"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#dadada"
        }
      ]
    },
    {
      "featureType": "road.highway",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#616161"
        }
      ]
    },
    {
      "featureType": "road.local",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#9e9e9e"
        }
      ]
    },
    {
      "featureType": "transit.line",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#e5e5e5"
        }
      ]
    },
    {
      "featureType": "transit.station",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#eeeeee"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [
        {
          "color": "#c9c9c9"
        }
      ]
    },
    {
      "featureType": "water",
      "elementType": "labels.text.fill",
      "stylers": [
        {
          "color": "#9e9e9e"
        }
      ]
    }
  ];

  // Format ETA into readable time
  const formatETA = (minutes) => {
    if (!minutes) return "Calculating...";
    
    if (minutes < 1) {
      return "Less than a minute";
    } else if (minutes < 60) {
      return `${Math.round(minutes)} min`;
    } else {
      const hours = Math.floor(minutes / 60);
      const mins = Math.round(minutes % 60);
      return `${hours}h ${mins}m`;
    }
  };

  // Format distance in meters or kilometers
  const formatDistance = (meters) => {
    if (!meters) return "Calculating...";
    
    if (meters < 1000) {
      return `${Math.round(meters)} m`;
    } else {
      return `${(meters / 1000).toFixed(1)} km`;
    }
  };

  // Toggle tracking mode
  const toggleTracking = () => {
    setIsTracking(!isTracking);
    
    if (!isTracking && mapRef.current && mapRegion) {
      // If turning tracking back on, recenter map
      mapRef.current.animateToRegion(mapRegion, 500);
    }
  };

  // Calculate snapPoints only once
  const snapPoints = useMemo(() => ['40%'], []);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#ef4444" />
          <Text style={styles.loadingText}>Finding your location...</Text>
          {errorMsg && <Text style={styles.errorText}>{errorMsg}</Text>}
        </View>
      ) : (
        <>
          <MapView
            ref={mapRef}
            style={styles.map}
            initialRegion={mapRegion}
            provider={PROVIDER_GOOGLE}
            customMapStyle={mapStyle}
            showsUserLocation={false} // We'll create our own user marker
            showsMyLocationButton={false}
            followsUserLocation={isTracking}
            showsCompass={false}
            showsTraffic={false}
            showsBuildings={true}
            showsIndoors={false}
            paddingAdjustmentBehavior="automatic"
            mapPadding={mapPadding}
            onMapReady={() => setIsMapReady(true)}
          >
            {/* Destination Marker */}
            <Marker 
              coordinate={destination} 
              title={item.name}
              description="Your destination"
              anchor={{ x: 0.5, y: 0.5 }}
            >
              <View style={styles.destinationMarkerContainer}>
                <View style={styles.destinationMarker}>
                  <Entypo name="location-pin" size={24} color="white" />
                </View>
                <View style={styles.destinationDot} />
              </View>
            </Marker>

            {/* User location marker with animation */}
            {mapRegion && (
              <Marker
                ref={markerRef}
                coordinate={mapRegion}
                title="You are here"
                anchor={{ x: 0.5, y: 0.5 }}
              >
                <Pulse />
              </Marker>
            )}

            {/* Route line */}
            {mapRegion && (
              <MapViewDirections
                origin={mapRegion}
                destination={destination}
                apikey={GOOGLE_MAPS_APIKEY}
                strokeWidth={5}
                strokeColor="#ef4444"
                optimizeWaypoints={true}
                onReady={onDirectionsReady}
                lineDashPattern={[0]}
              />
            )}
            
            {/* User's path trail */}
            {routeCoordinates.length > 0 && (
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="rgba(65, 105, 225, 0.3)"
                strokeWidth={3}
              />
            )}
          </MapView>

          {/* Map control buttons */}
          <View style={styles.mapControlsContainer}>
            {/* Back button */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.mapControlButton}
            >
              <Ionicons name="arrow-back" size={22} color="#374151" />
            </TouchableOpacity>
            
            {/* Toggle tracking button */}
            <TouchableOpacity
              onPress={toggleTracking}
              style={[
                styles.mapControlButton, 
                isTracking ? styles.activeTrackingButton : null
              ]}
            >
              <MaterialIcons 
                name={isTracking ? "gps-fixed" : "gps-not-fixed"} 
                size={22} 
                color={isTracking ? "#ef4444" : "#374151"} 
              />
            </TouchableOpacity>
          </View>

          {/* Journey information card */}
          {eta && (
            <View style={styles.journeyCard}>
              <View style={styles.journeyItem}>
                <View style={[styles.journeyIcon, styles.etaIcon]}>
                  <MaterialIcons name="timer" size={18} color="#3b82f6" />
                </View>
                <View>
                  <Text style={styles.journeyLabel}>Arrival in</Text>
                  <Text style={styles.journeyValue}>{formatETA(eta)}</Text>
                </View>
              </View>
              
              <View style={styles.journeySeparator} />
              
              <View style={styles.journeyItem}>
                <View style={[styles.journeyIcon, styles.distanceIcon]}>
                  <MaterialIcons name="directions" size={18} color="#8b5cf6" />
                </View>
                <View>
                  <Text style={styles.journeyLabel}>Distance</Text>
                  <Text style={styles.journeyValue}>{formatDistance(distance)}</Text>
                </View>
              </View>
            </View>
          )}

          {/* Destination card with fade-in animation */}
          <Animated.View 
            style={[
              styles.destinationCard,
              {
                opacity: fadeAnim,
                transform: [
                  {
                    translateY: fadeAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [50, 0],
                    }),
                  },
                ],
              }
            ]}
          >
            <Text style={styles.destinationLabel}>
              Your Destination
            </Text>
            <View style={styles.destinationContent}>
              <Image
                source={{ uri: baseImgURL + item.image }}
                style={styles.destinationImage}
              />
              <View style={styles.destinationDetails}>
                <Text style={styles.destinationName}>
                  {item.name?.length > 25
                    ? `${item.name.substring(0, 25)}...`
                    : item.name}
                </Text>
                <View style={styles.destinationDistance}>
                  <Entypo name="location" size={14} color="#ef4444" />
                  <Text style={styles.destinationDistanceText}>
                    {distance ? `${formatDistance(distance)} away` : "Loading distance..."}
                  </Text>
                </View>
              </View>
            </View>
          </Animated.View>
          
          {/* Fixed Bottom Sheet implementation without ScrollView dependency */}
          <BottomSheet
            ref={bottomSheetRef}
            index={-1}
            snapPoints={snapPoints}
            enablePanDownToClose={true}
            handleIndicatorStyle={styles.bottomSheetIndicator}
            backgroundStyle={styles.bottomSheetBackground}
          >
            <BottomSheetContent 
              item={item} 
              openCamera={openCamera} 
            />
          </BottomSheet>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
    position: "relative",
  },
  map: {
    width: "100%",
    height: "100%",
  },
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  loadingText: {
    marginTop: 16,
    fontSize: hp(2),
    color: "#4b5563",
    fontFamily: "raleway",
  },
  errorText: {
    marginTop: 8,
    color: "#ef4444",
    fontSize: hp(1.8),
    textAlign: "center",
    fontFamily: "raleway",
  },
  // Map controls
  mapControlsContainer: {
    position: "absolute",
    top: 16,
    left: 16,
    flexDirection: "column",
    gap: 12,
  },
  mapControlButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  activeTrackingButton: {
    backgroundColor: "white",
    borderWidth: 2,
    borderColor: "#ef4444",
  },
  // Journey card
  journeyCard: {
    position: "absolute",
    top: 16,
    right: 16,
    left: 70,
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  journeyItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  journeyIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  etaIcon: {
    backgroundColor: "rgba(59, 130, 246, 0.1)",
  },
  distanceIcon: {
    backgroundColor: "rgba(139, 92, 246, 0.1)",
  },
  journeyLabel: {
    fontSize: hp(1.5),
    color: "#6b7280",
    fontFamily: "raleway",
  },
  journeyValue: {
    fontSize: hp(1.8),
    color: "#1f2937",
    fontFamily: "raleway-bold",
  },
  journeySeparator: {
    width: 1,
    height: "70%",
    backgroundColor: "#e5e7eb",
    marginHorizontal: 8,
  },
  // Destination card
  destinationCard: {
    position: "absolute",
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: "white",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  destinationLabel: {
    fontSize: hp(1.6),
    color: "#6b7280",
    fontFamily: "raleway",
    marginBottom: 8,
  },
  destinationContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  destinationImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#f3f4f6",
  },
  destinationDetails: {
    marginLeft: 12,
    flex: 1,
  },
  destinationName: {
    fontSize: hp(2),
    color: "#1f2937",
    fontFamily: "raleway-bold",
    marginBottom: 4,
  },
  destinationDistance: {
    flexDirection: "row",
    alignItems: "center",
  },
  destinationDistanceText: {
    fontSize: hp(1.6),
    color: "#6b7280",
    fontFamily: "raleway",
    marginLeft: 4,
  },
  // Markers
  destinationMarkerContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  destinationMarker: {
    backgroundColor: "#ef4444",
    padding: 8,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  destinationDot: {
    position: "absolute",
    bottom: 0,
    width: 10,
    height: 10,
    backgroundColor: "white",
    borderRadius: 5,
    borderWidth: 2,
    borderColor: "#ef4444",
  },
  // Bottom sheet
  bottomSheetBackground: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  bottomSheetIndicator: {
    backgroundColor: "#9ca3af",
    width: 40,
    height: 4,
  },
  bottomSheetContent: {
    padding: 24,
    paddingBottom: 48,
  },
  // Success content
  successContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  successTitle: {
    fontSize: hp(2.4),
    fontFamily: "raleway-bold",
    color: "#1f2937",
    textAlign: "center",
    marginTop: 8,
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: hp(1.8),
    fontFamily: "raleway",
    color: "#6b7280",
    textAlign: "center",
    marginHorizontal: 16,
  },
  cameraButton: {
    backgroundColor: "#ef4444",
    borderRadius: 16,
    paddingVertical: 16,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#ef4444",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    marginBottom: 20,
  },
  cameraButtonText: {
    color: "white",
    fontSize: hp(1.8),
    fontFamily: "raleway-bold",
    marginLeft: 8,
  },
  infoBox: {
    flexDirection: "row",
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 16,
    alignItems: "flex-start",
  },
  infoIconContainer: {
    backgroundColor: "#dbeafe",
    padding: 8,
    borderRadius: 20,
    marginRight: 12,
  },
  infoText: {
    flex: 1,
    fontSize: hp(1.6),
    fontFamily: "raleway",
    color: "#3b82f6",
    lineHeight: hp(2.2),
  }
});

export default FoodMap;