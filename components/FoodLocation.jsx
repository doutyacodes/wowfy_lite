import React, { useState, useCallback } from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet, Platform, RefreshControl, ActivityIndicator } from "react-native";
import { Portal, Modal, RadioButton, PaperProvider } from "react-native-paper";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";
import { heightPercentageToDP as hp, widthPercentageToDP as wp } from "react-native-responsive-screen";
import { Feather, Ionicons, MaterialCommunityIcons, Entypo } from "@expo/vector-icons";
import Animated, { 
  FadeIn, 
  FadeInDown,
  ZoomIn,
  interpolate, 
  useAnimatedScrollHandler, 
  useAnimatedStyle, 
  useSharedValue 
} from "react-native-reanimated";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import * as Location from "expo-location";
import { useQuery, useQueryClient, QueryClient, QueryClientProvider } from "@tanstack/react-query";
import StoreDetails from "./AppComponents/StoreDetails";
import CertificateList from "./CertificateList";
import { baseImgURL, baseURL } from "../backend/baseData";
import { GOOGLE_MAPS_APIKEY } from "../constants";

// Create the QueryClient instance
const queryClient = new QueryClient();

const AnimatedFlatList = Animated.createAnimatedComponent(Animated.FlatList);

// Wrapper component that provides the QueryClientProvider
const FoodLocationWrapper = (props) => (
  <QueryClientProvider client={queryClient}>
    <FoodLocation {...props} />
  </QueryClientProvider>
);

const FoodLocation = ({ route }) => {
  const { challenge, type = "food" } = route.params;
  const [refreshing, setRefreshing] = useState(false);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState("latest");
  const [visible, setVisible] = useState(false);
  const navigation = useNavigation();
  const layout = { width: 360 };
  const [index, setIndex] = useState(0);
  const scrollY = useSharedValue(0);
  const queryClient = useQueryClient();

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);

  const changeModal = (value) => {
    setChecked(value);
    hideModal();
    queryClient.invalidateQueries({ queryKey: ['people'] });
  };

  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const headerStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      scrollY.value,
      [0, 100],
      [0, 1],
      'clamp'
    );
    
    return {
      opacity
    };
  });

  const imageStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      scrollY.value,
      [-100, 0, 100],
      [1.1, 1, 0.9],
      'clamp'
    );
    
    return {
      transform: [{ scale }]
    };
  });

  // Get user location
  const { isLoading: isLocationLoading, data: locationData } = useQuery({
    queryKey: ['location'],
    queryFn: async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        throw new Error("Permission to access location was denied");
      }

      const position = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });
      
      setLocation(position);
      return position;
    },
    retry: 1,
    onError: (error) => {
      setErrorMsg(error.message);
    }
  });

  // Get user data
  const { data: userData } = useQuery({
    queryKey: ['user'],
    queryFn: async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (!storedUser) {
        navigation.navigate("OtpVerification");
        return null;
      }
      const parsedUser = JSON.parse(storedUser);
      setUser(parsedUser);
      return parsedUser;
    }
  });

  // Calculate distance safely
  const calculateDistance = async (origin, destination) => {
    try {
      // Validate origin and destination
      if (!origin || !origin.latitude || !origin.longitude) {
        console.warn("Invalid origin coordinates");
        return null;
      }
      
      if (!destination || !destination.latitude || !destination.longitude) {
        console.warn("Invalid destination coordinates");
        return null;
      }
      
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${origin.latitude},${origin.longitude}&destinations=${destination.latitude},${destination.longitude}&key=${GOOGLE_MAPS_APIKEY}`
      );
      
      if (response.data && 
          response.data.rows && 
          response.data.rows[0] && 
          response.data.rows[0].elements && 
          response.data.rows[0].elements[0] && 
          response.data.rows[0].elements[0].distance) {
        return response.data.rows[0].elements[0].distance.value;
      }
      
      return null;
    } catch (error) {
      console.error("Error calculating distance:", error);
      return null;
    }
  };

  // Get single store data
  const { data: prevStoreData } = useQuery({
    queryKey: ['singleStore', user?.id, challenge?.challenge_id, location],
    queryFn: async () => {
      if (!user?.id || !location?.coords) return [];
      
      try {
        const response = await axios.get(
          `${baseURL}/getSinglestore.php?challenge_id=${challenge.challenge_id}&user_id=${user?.id}&page_id=${challenge.page_id}`
        );
        
        if (response.data && Object.keys(response.data)?.length > 0) {
          const store = response.data;
          const distance = await calculateDistance(
            location.coords, 
            {
              latitude: parseFloat(store.latitude) || 0,
              longitude: parseFloat(store.longitude) || 0,
            }
          );
          return [{ ...store, distance }];
        }
        return [];
      } catch (error) {
        console.error("Error fetching single store:", error);
        return [];
      }
    },
    enabled: !!user?.id && !!location?.coords,
  });

  // Get all stores data
  const { data: storeData, isLoading: isStoresLoading } = useQuery({
    queryKey: ['stores', challenge?.challenge_id, location],
    queryFn: async () => {
      if (!location?.coords) return [];
      
      try {
        const response = await axios.get(
          `${baseURL}/getStoreDetails.php?challenge_id=${challenge.challenge_id}&page_id=${challenge.page_id}`
        );
        
        if (response.data) {
          const stores = response.data;
          const storesWithDistances = await Promise.all(
            stores.map(async (store) => {
              // Skip invalid coordinates
              if (!store.latitude || !store.longitude) {
                return { ...store, distance: 9999999 };
              }
              
              const distance = await calculateDistance(
                location.coords,
                {
                  latitude: parseFloat(store.latitude) || 0,
                  longitude: parseFloat(store.longitude) || 0,
                }
              );
              return { ...store, distance: distance || 9999999 };
            })
          );
          
          return storesWithDistances.sort(
            (a, b) => parseFloat(a.distance) - parseFloat(b.distance)
          );
        }
        return [];
      } catch (error) {
        console.error("Error fetching stores:", error);
        return [];
      }
    },
    enabled: !!location?.coords,
  });

  // Get movie details
  const { data: movieData } = useQuery({
    queryKey: ['movie', challenge?.page_id, user?.id],
    queryFn: async () => {
      try {
        const response = await axios.get(
          `${baseURL}/getDetailsInnerpage.php?id=${challenge.page_id}&userId=${user?.id}`
        );
        return response.data;
      } catch (error) {
        console.error("Error fetching movie details:", error);
        return {};
      }
    },
    enabled: !!user?.id && !!challenge?.page_id,
  });

  // Get people data
  const { data: peopleData, isLoading: isPeopleLoading } = useQuery({
    queryKey: ['people', challenge?.challenge_id, checked, user?.id],
    queryFn: async () => {
      try {
        const response = await axios.get(
          `${baseURL}/getPeople.php?challenge_id=${challenge.challenge_id}&sort=${checked}&userId=${user?.id}`
        );
        return response.data || [];
      } catch (error) {
        console.error("Error fetching people data:", error);
        return [];
      }
    },
    enabled: !!challenge?.challenge_id && !!checked && !!user?.id,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ['user'] });
    await queryClient.invalidateQueries({ queryKey: ['location'] });
    await queryClient.invalidateQueries({ queryKey: ['singleStore'] });
    await queryClient.invalidateQueries({ queryKey: ['stores'] });
    await queryClient.invalidateQueries({ queryKey: ['movie'] });
    await queryClient.invalidateQueries({ queryKey: ['people'] });
    setRefreshing(false);
  }, [queryClient]);

  const [routes] = useState([
    { key: "rules", title: "About" },
    { key: "available", title: "Places" },
    { key: "people", title: "Community" },
  ]);
console.log("API Request Parameters:", {
    // Basic request parameters
    
    fullUrls: {
      getSinglestore: `${baseURL}/getSinglestore.php?challenge_id=${challenge.challenge_id}&user_id=${user?.id}&page_id=${challenge.page_id}`,
      getStoreDetails: `${baseURL}/getStoreDetails.php?challenge_id=${challenge.challenge_id}&page_id=${challenge.page_id}`,
      getDetailsInnerpage: `${baseURL}/getDetailsInnerpage.php?id=${challenge.page_id}&userId=${user?.id}`,
      getPeople: `${baseURL}/getPeople.php?challenge_id=${challenge.challenge_id}&sort=${checked}&userId=${user?.id}`,
    }
  });
  // Render the header section
  const renderHeader = () => (
    <View style={styles.headerContainer}>
      <Animated.View style={[styles.bannerContainer, imageStyle]}>
        <Image
          source={{ 
            uri: movieData?.banner ? `${baseImgURL + movieData.banner}` : 'https://via.placeholder.com/500x300?text=Banner' 
          }}
          style={styles.bannerImage}
        />
        <LinearGradient
          colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)', 'rgba(0,0,0,0.8)']}
          style={styles.bannerGradient}
        />
      </Animated.View>
      
      <Animated.View style={[styles.headerBlur, headerStyle]}>
        <BlurView intensity={80} tint="dark" style={styles.blurContent}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {movieData?.title || 'Loading...'}
          </Text>
        </BlurView>
      </Animated.View>
      
      <View style={styles.topBar}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
        {user && (
          <TouchableOpacity 
            style={styles.profileButton}
            onPress={() => navigation.navigate('Profile')}
          >
            {user.profile_pic ? (
              <Image 
                source={{ uri: user.profile_pic }} 
                style={styles.profileImage} 
              />
            ) : (
              <View style={styles.profileInitial}>
                <Text style={styles.initialText}>
                  {user.name ? user.name.charAt(0).toUpperCase() : '?'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}
      </View>
      
      <View style={styles.challengeInfoContainer}>
        <Animated.View 
          entering={ZoomIn.delay(200).duration(500)}
          style={styles.imageContainer}
        >
          {movieData?.image ? (
            <Image
              source={{ uri: `${baseImgURL + movieData.image}` }}
              style={styles.challengeImage}
            />
          ) : (
            <View style={styles.placeholderImage}>
              <Feather name="image" size={32} color="#999" />
            </View>
          )}
        </Animated.View>
        
        <View style={styles.challengeDetails}>
          <Animated.Text 
            entering={FadeIn.delay(300).duration(600)}
            style={styles.challengeTitle} 
            numberOfLines={2}
          >
            {challenge?.title || 'Challenge Title'}
          </Animated.Text>
          
          <Animated.View 
            entering={FadeIn.delay(500).duration(600)}
            style={styles.challengeStats}
          >
            <View style={styles.statItem}>
              <Feather name="award" size={16} color="#FFD700" />
              <Text style={styles.statText}>
                {challenge?.reward_points || 0}
              </Text>
            </View>
            
            <View style={styles.statSeparator} />
            
            <View style={styles.statItem}>
              <Feather name="users" size={16} color="#64B5F6" />
              <Text style={styles.statText}>
                {peopleData?.length || 0} joined
              </Text>
            </View>
            
            <View style={styles.statSeparator} />
            
            <View style={styles.statItem}>
              <Feather name="map-pin" size={16} color="#4CAF50" />
              <Text style={styles.statText}>
                {storeData?.length || 0} places
              </Text>
            </View>
          </Animated.View>
        </View>
      </View>
    </View>
  );

  const RulesRoute = () => (
    <AnimatedFlatList
      data={[1]}
      keyExtractor={() => "rules"}
      contentContainerStyle={styles.rulesContainer}
      showsVerticalScrollIndicator={false}
      renderItem={() => (
        <Animated.View entering={FadeInDown.duration(800)}>
          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Feather name="info" size={20} color="#333" />
              <Text style={styles.sectionTitle}>Description</Text>
            </View>
            <Text style={styles.description}>{challenge?.description || 'No description available'}</Text>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Feather name="log-in" size={20} color="#333" />
              <Text style={styles.sectionTitle}>Entry Fee</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoValue}>
                {challenge?.entry_points == 0 ? "Free Entry" : `${challenge?.entry_points} Points`}
              </Text>
              <Text style={styles.infoSubtext}>
                {challenge?.entry_points == 0 
                  ? "No points needed to join this challenge" 
                  : "Points will be deducted upon joining"
                }
              </Text>
            </View>
          </View>

          <View style={styles.sectionContainer}>
            <View style={styles.sectionHeader}>
              <Feather name="award" size={20} color="#333" />
              <Text style={styles.sectionTitle}>Prize</Text>
            </View>
            <View style={styles.infoCard}>
              <Text style={styles.infoValue}>{challenge?.reward_points || 0}</Text>
              <Text style={styles.infoSubtext}>
                Complete the challenge to earn this reward
              </Text>
            </View>
          </View>
          
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              By participating in this challenge, you agree to our Challenge Terms and Community Guidelines.
            </Text>
          </View>
        </Animated.View>
      )}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5271FF" />
      }
    />
  );

  const PlaceRoute = () => (
    <AnimatedFlatList
      data={[1]}
      keyExtractor={() => "places"}
      contentContainerStyle={styles.placesContainer}
      showsVerticalScrollIndicator={false}
      renderItem={() => (
        <>
          {isLocationLoading || isStoresLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator color="#5271FF" size="large" />
              <Text style={styles.loaderText}>Finding nearby places...</Text>
            </View>
          ) : (
            <Animated.View entering={FadeInDown.duration(800)}>
              {prevStoreData && prevStoreData?.length > 0 && (
                <View style={styles.previousSection}>
                  <View style={styles.sectionHeader}>
                    <Feather name="clock" size={20} color="#333" />
                    <Text style={styles.sectionTitle}>Previous Visit</Text>
                  </View>
                  <View style={styles.previousStoreCard}>
                    <StoreDetails user_id={user?.id} item={prevStoreData[0]} />
                  </View>
                </View>
              )}
              
              <View style={styles.availableSection}>
                <View style={styles.sectionHeader}>
                  <Feather name="map-pin" size={20} color="#333" />
                  <Text style={styles.sectionTitle}>
                    Available {type == "food" ? "Restaurants" : "Places"}
                  </Text>
                </View>
                
                {storeData?.length > 0 ? (
                  storeData.map((item, index) => (
                    <Animated.View 
                      key={index}
                      entering={FadeInDown.delay(index * 100).duration(500)}
                      style={styles.storeCard}
                    >
                      <StoreDetails user_id={user?.id} item={item} />
                    </Animated.View>
                  ))
                ) : (
                  <View style={styles.emptyState}>
                    <Feather name="map-pin" size={40} color="#ccc" />
                    <Text style={styles.emptyTitle}>No places available yet</Text>
                    <Text style={styles.emptySubtitle}>We're working on adding more locations</Text>
                  </View>
                )}
              </View>
            </Animated.View>
          )}
        </>
      )}
      onScroll={scrollHandler}
      scrollEventThrottle={16}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5271FF" />
      }
    />
  );

  const PeopleRoute = () => (
    <PaperProvider style={{ flex: 1, backgroundColor: "white" }}>
      {peopleData?.length > 0 && (
        <View style={styles.sortContainer}>
          <TouchableOpacity 
            style={styles.sortButton} 
            onPress={showModal}
          >
            <Text style={styles.sortText}>
              {checked == "latest" ? "Latest" : "Most Likes"}
            </Text>
            <Entypo name="chevron-down" size={16} color="#5271FF" />
          </TouchableOpacity>
          
          <Portal>
            <Modal
              visible={visible}
              onDismiss={hideModal}
              contentContainerStyle={styles.containerStyle}
            >
              <Text style={styles.modalTitle}>Sort By</Text>
              <View style={styles.radioOption}>
                <RadioButton
                  value="latest"
                  status={checked == "latest" ? "checked" : "unchecked"}
                  onPress={() => changeModal("latest")}
                  color="#5271FF"
                />
                <Text style={styles.radioText}>Latest</Text>
              </View>
              <View style={styles.radioOption}>
                <RadioButton
                  value="likes"
                  status={checked == "likes" ? "checked" : "unchecked"}
                  onPress={() => changeModal("likes")}
                  color="#5271FF"
                />
                <Text style={styles.radioText}>Most Likes</Text>
              </View>
            </Modal>
          </Portal>
        </View>
      )}
      
      {isPeopleLoading ? (
        <View style={styles.loaderContainer}>
          <ActivityIndicator color="#5271FF" size="large" />
          <Text style={styles.loaderText}>Loading community posts...</Text>
        </View>
      ) : (
        <Animated.FlatList
          data={peopleData || []}
          keyExtractor={(item, index) => `${item?.id || ''}-${index}`}
          contentContainerStyle={styles.peopleContainer}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
          renderItem={({ item, index }) => (
            <Animated.View entering={FadeInDown.delay(index * 50).duration(400)}>
              <CertificateList
                key={index}
                item={item}
                index={index}
                user_id={user?.id}
                arena={null}
              />
            </Animated.View>
          )}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Feather name="users" size={40} color="#ccc" />
              <Text style={styles.emptyTitle}>No community posts yet</Text>
              <Text style={styles.emptySubtitle}>Be the first to share your experience!</Text>
            </View>
          }
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#5271FF" />
          }
        />
      )}
    </PaperProvider>
  );

  const renderScene = SceneMap({
    rules: RulesRoute,
    available: PlaceRoute,
    people: PeopleRoute,
  });

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {renderHeader()}
      
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={layout}
        style={styles.tabView}
        swipeEnabled={true}
        renderTabBar={(props) => (
          <TabBar
            {...props}
            indicatorStyle={styles.tabIndicator}
            style={styles.tabBar}
            renderLabel={({ route, focused }) => (
              <Text
                style={[
                  styles.tabLabel,
                  focused && styles.tabLabelFocused
                ]}
              >
                {route.title}
              </Text>
            )}
            tabStyle={styles.tab}
            pressColor="rgba(82, 113, 255, 0.1)"
          />
        )}
      />
      
      <StatusBar style="light" />
    </SafeAreaView>
  );
};

export default FoodLocationWrapper;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFC",
  },
  headerContainer: {
    height: hp(32),
    position: "relative",
    zIndex: 1,
  },
  bannerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: hp(32),
    zIndex: -1,
  },
  bannerImage: {
    height: "100%", 
    width: "100%", 
    resizeMode: "cover"
  },
  bannerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: hp(32),
  },
  headerBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: Platform.OS == 'ios' ? hp(12) : hp(10),
    zIndex: 10,
  },
  blurContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: Platform.OS == 'ios' ? hp(6) : hp(4),
  },
  headerTitle: {
    color: 'white',
    fontSize: hp(2.2),
    fontWeight: '700',
    textAlign: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: Platform.OS == 'ios' ? hp(6) : hp(4),
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.5)',
  },
  profileImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  profileInitial: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#5271FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialText: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: '700',
  },
  challengeInfoContainer: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    alignItems: 'center',
  },
  imageContainer: {
    height: wp(18),
    width: wp(18),
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#5271FF',
    overflow: 'hidden',
    backgroundColor: 'white',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  challengeImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  placeholderImage: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  challengeDetails: {
    flex: 1,
    marginLeft: 12,
  },
  challengeTitle: {
    fontSize: hp(2.6),
    fontWeight: '700',
    color: 'white',
    marginBottom: 8,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  challengeStats: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    marginLeft: 4,
    color: 'white',
    fontSize: hp(1.6),
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  statSeparator: {
    width: 1,
    height: '80%',
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    marginHorizontal: 8,
  },
  tabView: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: 'white',
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  tab: {
    paddingVertical: 12,
  },
  tabLabel: {
    fontSize: hp(1.8),
    fontWeight: '500',
    color: '#8E8E93',
    textTransform: 'none',
  },
  tabLabelFocused: {
    color: '#5271FF',
    fontWeight: '700',
  },
  tabIndicator: {
    backgroundColor: '#5271FF',
    height: 3,
    borderRadius: 3,
  },
  
  // Rules Tab Styles
  rulesContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  sectionContainer: {
    marginBottom: 20,
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: hp(2),
    fontWeight: '700',
    color: '#333',
    marginLeft: 10,
  },
  description: {
    fontSize: hp(1.8),
    lineHeight: hp(2.6),
    fontWeight: '400',
    color: '#555',
  },
  infoCard: {
    backgroundColor: '#F6F8FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#5271FF',
  },
  infoValue: {
    fontSize: hp(3),
    fontWeight: '700',
    color: '#5271FF',
    marginBottom: 4,
  },
  infoSubtext: {
    fontSize: hp(1.6),
    fontWeight: '400',
    color: '#777',
  },
  termsContainer: {
    marginTop: 12,
    padding: 16,
  },
  termsText: {
    fontSize: hp(1.4),
    color: '#8E8E93',
    textAlign: 'center',
    lineHeight: hp(2),
  },
  
  // Places Tab Styles
  placesContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loaderContainer: {
    marginTop: hp(10),
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loaderText: {
    marginTop: 16,
    fontSize: hp(1.8),
    fontWeight: '400',
    color: '#666',
    textAlign: 'center',
  },
  previousSection: {
    marginBottom: 24,
  },
  previousStoreCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: 'rgba(82, 113, 255, 0.2)',
    overflow: 'hidden',
  },
  availableSection: {
    marginBottom: 24,
  },
  storeCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 6,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#F0F0F5',
    overflow: 'hidden',
  },
  emptyState: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  emptyTitle: {
    fontSize: hp(2),
    fontWeight: '600',
    color: '#8E8E93',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: hp(1.6),
    fontWeight: '400',
    color: '#8E8E93',
    marginTop: 8,
    textAlign: 'center',
  },
  
  // People Tab Styles
  sortContainer: {
    padding: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    backgroundColor: '#F6F8FF',
    borderRadius: 20,
    alignSelf: 'flex-end',
    paddingHorizontal: 16,
  },
  sortText: {
    fontSize: hp(1.6),
    fontWeight: '500',
    color: '#5271FF',
    marginRight: 4,
  },
  containerStyle: {
    backgroundColor: 'white',
    padding: 24,
    margin: 20,
    borderRadius: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: hp(2.2),
    fontWeight: '700',
    color: '#333',
    marginBottom: 20,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  radioText: {
    fontSize: hp(1.8),
    fontWeight: '500',
    color: '#333',
  },
  peopleContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  peopleCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  peopleHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F5',
  },
  peopleUser: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  peopleAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#5271FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  peopleInitial: {
    color: 'white',
    fontSize: hp(1.8),
    fontWeight: '600',
  },
  peopleName: {
    fontSize: hp(1.8),
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  peopleDate: {
    fontSize: hp(1.4),
    fontWeight: '400',
    color: '#8E8E93',
  },
  peopleContent: {
    padding: 16,
  },
  peopleCaption: {
    fontSize: hp(1.6),
    fontWeight: '400',
    color: '#333',
    lineHeight: hp(2.2),
  },
  peopleFooter: {
    flexDirection: 'row',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F5',
  },
  peopleAction: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  peopleActionText: {
    fontSize: hp(1.6),
    fontWeight: '500',
    color: '#666',
    marginLeft: 8,
  },
});