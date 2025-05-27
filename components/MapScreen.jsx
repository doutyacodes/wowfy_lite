import {
  Ionicons,
  FontAwesome5,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackActions, useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient, useMutation } from "@tanstack/react-query";
import axios from "axios";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  Platform,
  Animated,
} from "react-native";
import MapView, {
  AnimatedRegion,
  Circle,
  Marker,
  PROVIDER_GOOGLE,
  Polyline,
} from "react-native-maps";
import MapViewDirections from "react-native-maps-directions";
import { Modal, Portal, Provider as PaperProvider } from "react-native-paper";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseURL } from "../backend/baseData";
import { GOOGLE_MAPS_APIKEY } from "../constants";
import { BlurView } from "expo-blur";

const { width, height } = Dimensions.get("window");
const ASPECT_RATIO = width / height;
const LATITUDE_DELTA = 0.0922;
const LONGITUDE_DELTA = LATITUDE_DELTA * ASPECT_RATIO;

const MapScreen = ({ route }) => {
  const queryClient = useQueryClient();
  const navigation = useNavigation();
  const mapRef = useRef(null);
  const infoCardHeight = useRef(new Animated.Value(120)).current;

  // Route params
  const {
    Title,
    latitudes,
    longitudes,
    reach_distance,
    userSId,
    challenge,
    maxSteps,
    userTaskId,
    tasks,
  } = route.params;

  // Convert reach_distance to a number and ensure it's treated as meters
  const reachDistanceMeters = parseFloat(reach_distance) || 100; // Default to 100m if parsing fails

  // State
  const [visible, setVisible] = useState(false);
  const [origin, setOrigin] = useState(null);
  const [destination, setDestination] = useState(null);
  const [currentUserLocation, setCurrentUserLocation] = useState(null);
  const [address, setAddress] = useState(null);
  const [distance, setDistance] = useState(null);
  const [distanceInMeters, setDistanceInMeters] = useState(null);
  const [straightLineDistance, setStraightLineDistance] = useState(null);
  const [locationSubscription, setLocationSubscription] = useState(null);
  const [direction, setDirection] = useState(null);
  const [newChallenges, setNewChallenges] = useState();
  const [newSteps, setNewSteps] = useState(0);
  const [isWithinRadius, setIsWithinRadius] = useState(false);
  const [currentPlace, setCurrentPlace] = useState("");
  const [infoExpanded, setInfoExpanded] = useState(false);
  const [isInitialMapFitDone, setIsInitialMapFitDone] = useState(false);
  const [mapType, setMapType] = useState("standard");
  const [showDirectionLine, setShowDirectionLine] = useState(true);
  const [showStraightLine, setShowStraightLine] = useState(true);

  const [animatedRegion, setAnimatedRegion] = useState(
    new AnimatedRegion({
      latitude: parseFloat(latitudes || 0),
      longitude: parseFloat(longitudes || 0),
      latitudeDelta: LATITUDE_DELTA,
      longitudeDelta: LONGITUDE_DELTA,
    })
  );

  const mode = "driving";

  // Set modal visibility
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);

  // Toggle info card expansion
  const toggleInfoCard = () => {
    Animated.timing(infoCardHeight, {
      toValue: infoExpanded ? 120 : 220,
      duration: 300,
      useNativeDriver: false,
    }).start();
    setInfoExpanded(!infoExpanded);
  };

  // Toggle between map types
  const toggleMapType = () => {
    setMapType((prevType) =>
      prevType == "standard" ? "satellite" : "standard"
    );
  };

  // Toggle direction line visibility
  const toggleDirectionLine = () => {
    setShowDirectionLine((prev) => !prev);
  };

  // Toggle straight line visibility
  const toggleStraightLine = () => {
    setShowStraightLine((prev) => !prev);
  };

  // Query to fetch user data
  const { data: user } = useQuery({
    queryKey: ["mapUser"],
    queryFn: async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      throw new Error("User not found");
    },
    onError: () => {
      navigation.replace("OtpVerification");
    },
  });

  // Query to fetch location name
  const { data: locationName } = useQuery({
    queryKey: ["locationName", latitudes, longitudes],
    queryFn: async () => {
      const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitudes},${longitudes}&key=${GOOGLE_MAPS_APIKEY}`;
      const response = await axios.get(url);
      const { results } = response.data;
      if (results && results?.length > 0) {
        return results[0].address_components[2].long_name;
      }
      return "Location not found";
    },
    onSuccess: (data) => {
      setCurrentPlace(data);
    },
  });

  // Mutation for completing a challenge
  const completeMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.post(
        `${baseURL}/userEndProgress.php`,
        {
          userTaskId: userTaskId,
          steps: 0,
          challenge_id: challenge.challenge_id,
          userId: userSId,
          end: "yes",
          task_id: tasks.task_id,
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      return response.data;
    },
    onSuccess: () => {
      showModal();
      // Check for next tasks if this one is part of a sequence
      if (tasks.multiple == "yes") {
        checkNextTaskMutation.mutate();
      }
    },
    onError: (error) => {
      console.error("Error completing challenge:", error);
    },
  });

  // Mutation for checking next task
  const checkNextTaskMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.get(
        `${baseURL}/checkNextTaskExist.php?task_id=${tasks.task_id}&challenge_id=${tasks.challenge_id}&user_id=${user?.id}`
      );
      return response.data;
    },
    onSuccess: async (data) => {
      if (data.next == "yes") {
        setNewChallenges(data);
        setNewSteps(data.steps);
        setDirection(data.direction);

        try {
          const response = await axios.post(
            `${baseURL}/createUserTasks.php`,
            {
              task_id: data.task_id,
              user_id: userSId,
              entry_points: data.entry_points,
            },
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );
        } catch (error) {
          console.error("Error creating next task:", error);
        }
      }
    },
    onError: (error) => {
      console.error("Error checking next task:", error);
    },
  });

  // Calculate straight-line distance (haversine formula)
  const calculateStraightLineDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lon2 - lon1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  // Initialize location tracking
  useEffect(() => {
    const initLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          return;
        }

        // Initialize with current position
        let initialLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });
        const { latitude: currentLatitude, longitude: currentLongitude } =
          initialLocation.coords;

        // Set current user location
        const userLoc = {
          latitude: currentLatitude,
          longitude: currentLongitude,
        };

        setCurrentUserLocation(userLoc);
        setOrigin(userLoc);

        const destinationCoords = {
          latitude: parseFloat(latitudes),
          longitude: parseFloat(longitudes),
        };

        setDestination(destinationCoords);

        // Get initial address
        getAddressFromCoordinates(currentLatitude, currentLongitude);

        // Calculate initial distances (both route and straight-line)
        calculateDistance(
          currentLatitude,
          currentLongitude,
          parseFloat(latitudes),
          parseFloat(longitudes)
        );

        const initialStraightDist = calculateStraightLineDistance(
          currentLatitude,
          currentLongitude,
          parseFloat(latitudes),
          parseFloat(longitudes)
        );
        setStraightLineDistance(initialStraightDist);

        // Set up high-precision location tracking
        const subscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.BestForNavigation,
            distanceInterval: 5, // Update every 5 meters of movement
            timeInterval: 3000, // Or at least every 3 seconds
          },
          (newLocation) => {
            const { latitude, longitude } = newLocation.coords;

            // Update user position
            const newUserLocation = {
              latitude,
              longitude,
            };

            setCurrentUserLocation(newUserLocation);

            // Update animated region for smooth map updates
            setAnimatedRegion({
              latitude: parseFloat(latitude),
              longitude: parseFloat(longitude),
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            });

            // Calculate distances
            calculateDistance(
              latitude,
              longitude,
              parseFloat(latitudes),
              parseFloat(longitudes)
            );

            const newStraightDist = calculateStraightLineDistance(
              latitude,
              longitude,
              parseFloat(latitudes),
              parseFloat(longitudes)
            );
            setStraightLineDistance(newStraightDist);
          }
        );

        setLocationSubscription(subscription);
      } catch (error) {
        console.error("Error initializing location:", error);
      }
    };

    initLocation();

    // Cleanup location subscription on unmount
    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, []);

  // Fit map to route when origin and destination are set
  useEffect(() => {
    if (origin && destination && mapRef.current && !isInitialMapFitDone) {
      // Only fit to coordinates once to avoid constant re-centering
      mapRef.current.fitToCoordinates([origin, destination], {
        edgePadding: { top: 50, right: 50, bottom: 150, left: 50 },
        animated: true,
      });
      setIsInitialMapFitDone(true);
    }
  }, [origin, destination, isInitialMapFitDone]);

  // Helper for returning to home screen
  const handleCompletion = () => {
    navigation.dispatch(StackActions.popToTop());
  };

  // Get address from coordinates
  const getAddressFromCoordinates = async (latitude, longitude) => {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${GOOGLE_MAPS_APIKEY}`;

    try {
      const response = await axios.get(url);
      const currentAddress = response.data.results[0].formatted_address;
      setAddress(currentAddress);
      return currentAddress;
    } catch (error) {
      console.error("Error fetching address:", error);
      return null;
    }
  };

  // Calculate distance between user and destination
  const calculateDistance = async (userLat, userLng, destLat, destLng) => {
    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?origins=${userLat},${userLng}&destinations=${destLat},${destLng}&mode=${mode}&key=${GOOGLE_MAPS_APIKEY}`;

    try {
      const response = await axios.get(url);
      const currentDistance = response.data.rows[0].elements[0].distance.text;
      setDistance(currentDistance);

      // Parse distance value (handles both km and m formats from Google)
      let meters = 0;
      if (currentDistance.includes("km")) {
        // If distance is in km, convert to meters
        const km = parseFloat(currentDistance.replace(/[^0-9.]/g, ""));
        meters = km * 1000;
      } else {
        // If distance is already in meters
        meters = parseFloat(currentDistance.replace(/[^0-9.]/g, ""));
      }

      setDistanceInMeters(meters);

      // Check if user is within completion radius
      const wasWithinRadius = isWithinRadius;
      const nowWithinRadius = meters <= reachDistanceMeters;

      setIsWithinRadius(nowWithinRadius);

      // Only trigger completion when the user ENTERS the radius
      // (prevents multiple completions when staying in the radius)
      if (nowWithinRadius && !wasWithinRadius) {
        completeMutation.mutate();
      }
    } catch (error) {
      console.error("Error calculating distance:", error);
    }
  };

  // Calculate ETA based on distance
  const calculateETA = () => {
    if (distance) {
      let distanceNum;
      // Handle both km and m formats from Google
      if (distance.includes("km")) {
        distanceNum = parseFloat(distance.replace(/[^0-9.]/g, ""));
      } else {
        // If in meters, convert to km for calculation
        distanceNum = parseFloat(distance.replace(/[^0-9.]/g, "")) / 1000;
      }

      // Assuming average speed of 30 km/h
      const estimatedMinutes = Math.round((distanceNum / 30) * 60);

      if (estimatedMinutes < 60) {
        return `${estimatedMinutes} min`;
      } else {
        const hours = Math.floor(estimatedMinutes / 60);
        const mins = estimatedMinutes % 60;
        return `${hours} hr ${mins} min`;
      }
    }
    return "Calculating...";
  };

  // Format distance for display
  const formatDistance = () => {
    if (!distance) return "Loading...";
    return distance.toUpperCase();
  };

  // Format reach distance for UI
  const formatReachDistance = () => {
    if (reachDistanceMeters >= 1000) {
      return `${(reachDistanceMeters / 1000).toFixed(1)} km`;
    } else {
      return `${reachDistanceMeters} meters`;
    }
  };

  // Format straight-line distance for UI
  const formatStraightLineDistance = () => {
    if (!straightLineDistance) return "Calculating...";

    if (straightLineDistance >= 1000) {
      return `${(straightLineDistance / 1000).toFixed(2)} km`;
    } else {
      return `${Math.round(straightLineDistance)} m`;
    }
  };

  // Re-center map on user location
  const centerOnUser = () => {
    if (mapRef.current && currentUserLocation) {
      mapRef.current.animateToRegion(
        {
          latitude: currentUserLocation.latitude,
          longitude: currentUserLocation.longitude,
          latitudeDelta: LATITUDE_DELTA / 2, // Zoom in a bit
          longitudeDelta: LONGITUDE_DELTA / 2,
        },
        1000
      );
    }
  };

  // Center map to show both user and destination
  const centerOnRoute = () => {
    if (mapRef.current && currentUserLocation && destination) {
      mapRef.current.fitToCoordinates([currentUserLocation, destination], {
        edgePadding: { top: 70, right: 70, bottom: 150, left: 70 },
        animated: true,
      });
    }
  };

  return (
    <PaperProvider>
      <StatusBar style="light" />
      <SafeAreaView style={styles.container}>
        <Portal>
          <Modal
            visible={visible}
            onDismiss={hideModal}
            contentContainerStyle={styles.modalContainer}
            dismissable={false}
          >
            <BlurView intensity={100} style={styles.successContainer}>
              <Text style={styles.successTitle}>CHALLENGE COMPLETED</Text>
              <LottieView
                source={require("../assets/animation/success.json")}
                style={styles.lottieAnimation}
                autoPlay
                loop
              />
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() =>
                  navigation.replace("SelfieScreenShare", {
                    userSId,
                    challenge,
                    tasks,
                    next: "no",
                  })
                }
              >
                <Text style={styles.shareButtonText}>
                  Share Your Moment With Us
                </Text>
              </TouchableOpacity>

              {/* New certificate button */}
              <TouchableOpacity
                style={styles.certificateButton}
                onPress={() =>
                  navigation.navigate("TaskCertificateViewer", {
                    taskId: tasks.task_id,
                    userId: userSId,
                  })
                }
              >
                <Text style={styles.certificateButtonText}>
                  View Certificate
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.homeButton}
                onPress={handleCompletion}
              >
                <Text style={styles.homeButtonText}>Go to Home</Text>
              </TouchableOpacity>
            </BlurView>
          </Modal>
        </Portal>

        <View style={styles.mapContainer}>
          <MapView
            ref={mapRef}
            provider={PROVIDER_GOOGLE}
            style={styles.map}
            initialRegion={{
              latitude: parseFloat(latitudes),
              longitude: parseFloat(longitudes),
              latitudeDelta: LATITUDE_DELTA,
              longitudeDelta: LONGITUDE_DELTA,
            }}
            showsUserLocation={true}
            followsUserLocation={false}
            showsCompass={true}
            showsTraffic={true}
            mapType={mapType}
            mapPadding={{ top: 50, right: 0, bottom: 0, left: 0 }}
          >
            {/* Navigation route line */}
            {origin && destination && showDirectionLine && (
              <MapViewDirections
                origin={origin}
                destination={destination}
                apikey={GOOGLE_MAPS_APIKEY}
                strokeWidth={4}
                strokeColor="#4F6DF5"
                mode={"DRIVING"}
                precision="high"
                lineDashPattern={[0]}
                onReady={(result) => {
                  // Save the route coordinates to prevent redrawing
                  if (!direction) {
                    setDirection(result);
                    // Fit map to route once if not done yet
                    if (!isInitialMapFitDone) {
                      mapRef.current.fitToCoordinates(result.coordinates, {
                        edgePadding: {
                          top: 50,
                          right: 50,
                          bottom: 150,
                          left: 50,
                        },
                        animated: true,
                      });
                      setIsInitialMapFitDone(true);
                    }
                  }
                }}
                resetOnChange={false}
              />
            )}

            {/* Direct straight line to destination */}
            {currentUserLocation && destination && showStraightLine && (
              <Polyline
                coordinates={[
                  {
                    latitude: currentUserLocation.latitude,
                    longitude: currentUserLocation.longitude,
                  },
                  {
                    latitude: destination.latitude,
                    longitude: destination.longitude,
                  },
                ]}
                strokeWidth={3}
                strokeColor="#FF3B30"
                lineDashPattern={[5, 5]}
              />
            )}

            {/* Destination marker */}
            {destination && (
              <Marker coordinate={destination} title={tasks.task_name}>
                <View style={styles.destinationMarker}>
                  <MaterialCommunityIcons
                    name="map-marker"
                    size={40}
                    color="#FF3B30"
                  />
                </View>
              </Marker>
            )}

            {/* User's current position marker (custom) */}
            {currentUserLocation && (
              <Marker
                coordinate={currentUserLocation}
                title="Your location"
                flat={true}
              >
                <View style={styles.userLocationMarker}>
                  <View style={styles.userLocationDot} />
                  <View style={styles.userLocationAccuracy} />
                </View>
              </Marker>
            )}

            {/* Completion radius circle */}
            <Circle
              center={{
                latitude: parseFloat(latitudes),
                longitude: parseFloat(longitudes),
              }}
              radius={reachDistanceMeters}
              strokeWidth={2}
              strokeColor="#4F6DF5"
              fillColor="rgba(79, 109, 245, 0.2)"
            />
          </MapView>
        </View>

        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Top Status Card */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <MaterialCommunityIcons
              name="map-marker-distance"
              size={22}
              color="#4F6DF5"
            />
            <Text style={styles.statusText}>{formatDistance()}</Text>
          </View>
          <View style={styles.statusRow}>
            <Ionicons name="time-outline" size={22} color="#4F6DF5" />
            <Text style={styles.statusText}>ETA: {calculateETA()}</Text>
          </View>
        </View>

        {/* Direct Distance Indicator */}
        <View style={styles.directDistanceCard}>
          <View style={styles.directDistanceRow}>
            <MaterialCommunityIcons
              name="ray-start-end"
              size={18}
              color="#FF3B30"
            />
            <Text style={styles.directDistanceText}>
              Direct: {formatStraightLineDistance()}
            </Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={centerOnUser}>
            <Ionicons name="locate" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={centerOnRoute}>
            <MaterialCommunityIcons name="crop-free" size={22} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={toggleMapType}>
            <FontAwesome5 name="layer-group" size={18} color="#fff" />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: showDirectionLine ? "#4F6DF5" : "#999" },
            ]}
            onPress={toggleDirectionLine}
          >
            <MaterialCommunityIcons
              name="navigation-variant"
              size={22}
              color="#fff"
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.actionButton,
              { backgroundColor: showStraightLine ? "#FF3B30" : "#999" },
            ]}
            onPress={toggleStraightLine}
          >
            <MaterialCommunityIcons
              name="ray-start-end"
              size={22}
              color="#fff"
            />
          </TouchableOpacity>
        </View>

        {/* Location Status Indicator */}
        <View
          style={[
            styles.locationStatusBadge,
            { backgroundColor: isWithinRadius ? "#4CD964" : "#FF3B30" },
          ]}
        >
          <Text style={styles.locationStatusText}>
            {isWithinRadius ? "In Challenge Zone" : "Outside Zone"}
          </Text>
        </View>

        {/* Bottom Info Card */}
        <Animated.View style={[styles.infoCard, { height: infoCardHeight }]}>
          <TouchableOpacity
            style={styles.expandHandle}
            onPress={toggleInfoCard}
          >
            <View style={styles.expandHandleBar} />
          </TouchableOpacity>

          <View style={styles.infoCardContent}>
            <View style={styles.locationContainer}>
              <View style={styles.locationRow}>
                <View
                  style={[styles.locationDot, { backgroundColor: "#4F6DF5" }]}
                />
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationLabel}>Current Location</Text>
                  <Text style={styles.locationText} numberOfLines={1}>
                    {address || "Determining your location..."}
                  </Text>
                </View>
              </View>

              <View style={styles.verticalLine} />

              <View style={styles.locationRow}>
                <View
                  style={[styles.locationDot, { backgroundColor: "#FF3B30" }]}
                />
                <View style={styles.locationTextContainer}>
                  <Text style={styles.locationLabel}>Destination</Text>
                  <Text style={styles.locationText} numberOfLines={1}>
                    {tasks.task_name}
                  </Text>
                </View>
              </View>
            </View>

            {infoExpanded && (
              <View style={styles.extraInfo}>
                <Text style={styles.challengeTitle}>
                  {challenge.challenge_name}
                </Text>
                <Text style={styles.challengeDescription}>
                  You need to be within {formatReachDistance()} of the
                  destination to complete this challenge.
                </Text>
                <View style={styles.distanceDetails}>
                  <View style={styles.distanceDetailRow}>
                    <MaterialCommunityIcons
                      name="navigation-variant"
                      size={16}
                      color="#4F6DF5"
                    />
                    <Text style={styles.distanceDetailText}>
                      Route distance:{" "}
                      {distanceInMeters
                        ? `${distanceInMeters.toFixed(0)} meters`
                        : "Calculating..."}
                    </Text>
                  </View>
                  <View style={styles.distanceDetailRow}>
                    <MaterialCommunityIcons
                      name="ray-start-end"
                      size={16}
                      color="#FF3B30"
                    />
                    <Text style={styles.distanceDetailText}>
                      Direct distance:{" "}
                      {straightLineDistance
                        ? `${Math.round(straightLineDistance)} meters`
                        : "Calculating..."}
                    </Text>
                  </View>
                </View>
              </View>
            )}
          </View>
        </Animated.View>
      </SafeAreaView>
    </PaperProvider>
  );
};

export default MapScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FA",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#4F6DF5",
    fontFamily: "raleway-semibold",
  },
  backButton: {
    position: "absolute",
    top: Platform.OS == "ios" ? 50 : 40,
    left: 20,
    height: 42,
    width: 42,
    borderRadius: 21,
    backgroundColor: "#4F6DF5",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  statusCard: {
    position: "absolute",
    top: Platform.OS == "ios" ? 50 : 40,
    alignSelf: "center",
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 50,
    paddingHorizontal: 15,
    paddingVertical: 10,
    justifyContent: "space-between",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    gap: 15,
    minWidth: 200,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  statusText: {
    fontFamily: "raleway-semibold",
    fontSize: 14,
    color: "#333",
  },
  directDistanceCard: {
    position: "absolute",
    top: Platform.OS == "ios" ? 100 : 90,
    right: 20,
    backgroundColor: "white",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  directDistanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  directDistanceText: {
    fontFamily: "raleway-medium",
    fontSize: 13,
    color: "#333",
  },
  actionButtons: {
    position: "absolute",
    right: 20,
    top: height / 2 - 120,
    gap: 10,
  },
  actionButton: {
    backgroundColor: "#4F6DF5",
    height: 45,
    width: 45,
    borderRadius: 22.5,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  locationStatusBadge: {
    position: "absolute",
    top: Platform.OS == "ios" ? 100 : 90,
    alignSelf: "center",
    paddingHorizontal: 15,
    paddingVertical: 6,
    borderRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  locationStatusText: {
    color: "white",
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  infoCard: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 10,
    padding: 20,
    paddingTop: 5,
  },
  expandHandle: {
    alignSelf: "center",
    width: 50,
    height: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  expandHandleBar: {
    width: 40,
    height: 5,
    backgroundColor: "#DCDCDC",
    borderRadius: 5,
  },
  infoCardContent: {
    flex: 1,
    paddingTop: 10,
  },
  locationContainer: {
    flex: 1,
  },
  locationRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  locationDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 15,
  },
  verticalLine: {
    width: 2,
    height: 20,
    backgroundColor: "#DCDCDC",
    marginLeft: 5,
    marginBottom: 10,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationLabel: {
    fontSize: 12,
    color: "#666",
    fontFamily: "raleway",
  },
  locationText: {
    fontSize: 16,
    color: "#333",
    fontFamily: "raleway-bold",
  },
  extraInfo: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
    paddingTop: 10,
  },
  challengeTitle: {
    fontSize: 16,
    fontFamily: "raleway-bold",
    color: "#4F6DF5",
    marginBottom: 5,
  },
  challengeDescription: {
    fontSize: 14,
    fontFamily: "raleway",
    color: "#666",
    lineHeight: 20,
    marginBottom: 5,
  },
  distanceDetails: {
    marginTop: 10,
  },
  distanceDetailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
    gap: 8,
  },
  distanceDetailText: {
    fontSize: 13,
    fontFamily: "raleway-medium",
    color: "#444",
  },
  userLocationMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  userLocationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#4F6DF5",
    borderWidth: 3,
    borderColor: "#fff",
  },
  userLocationAccuracy: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(79, 109, 245, 0.2)",
    borderWidth: 1,
    borderColor: "rgba(79, 109, 245, 0.3)",
    position: "absolute",
  },
  destinationMarker: {
    alignItems: "center",
    justifyContent: "center",
  },
  modalContainer: {
    margin: 20,
    borderRadius: 20,
    overflow: "hidden",
  },
  successContainer: {
    padding: 25,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "rgba(255,255,255,0.98)",
  },
  successTitle: {
    fontSize: 28,
    color: "#4F6DF5",
    fontFamily: "raleway-bold",
    textAlign: "center",
    letterSpacing: 1,
    marginBottom: 10,
  },
  lottieAnimation: {
    width: 200,
    height: 200,
  },
  shareButton: {
    backgroundColor: "#4F6DF5",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    minWidth: wp(80),
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  shareButtonText: {
    fontSize: 16,
    color: "white",
    fontFamily: "raleway-bold",
    textAlign: "center",
  },
  homeButton: {
    backgroundColor: "#fff",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    minWidth: wp(80),
    borderWidth: 1,
    borderColor: "#4F6DF5",
  },
  homeButtonText: {
    fontSize: 16,
    color: "#4F6DF5",
    fontFamily: "raleway-bold",
    textAlign: "center",
  },
  certificateButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    minWidth: wp(80),
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  certificateButtonText: {
    fontSize: 16,
    color: "white",
    fontFamily: "raleway-bold",
    textAlign: "center",
  },
});
