import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Platform,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { TabBar, TabView } from "react-native-tab-view";
import { baseImgURL, baseURL } from "../backend/baseData";

// Medal component for top 3 positions
const PositionMedal = ({ position }) => {
  const colors = {
    1: ["#FFD700", "#FFC800"],  // Gold
    2: ["#C0C0C0", "#A9A9A9"],  // Silver
    3: ["#CD7F32", "#A05A2C"],  // Bronze
  };
  
  const icons = {
    1: "trophy",
    2: "medal",
    3: "medal",
  };

  if (position > 3) return null;

  return (
    <LinearGradient
      colors={colors[position]}
      style={styles.medalContainer}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <MaterialCommunityIcons name={icons[position]} size={position == 1 ? 14 : 12} color="white" />
    </LinearGradient>
  );
};

// Leaderboard Row Component
const LeaderboardRow = ({ item, index, navigation }) => {
  const isTopThree = item.ranking <= 3;
  
  return (
    <View style={[
      styles.leaderboardRow,
      isTopThree && styles.topThreeRow
    ]}>
      <View style={styles.rankAndUser}>
        <View style={styles.rankingContainer}>
          {item.ranking <= 3 ? (
            <PositionMedal position={item.ranking} />
          ) : (
            <Text style={styles.rankingText}>{item.ranking}</Text>
          )}
        </View>
        
        <TouchableOpacity
          style={styles.userContainer}
          onPress={() => navigation.navigate("OtherUserScreen", { user_id: item.id })}
        >
          {item.user_image ? (
            <Image
              source={{ uri: `${baseImgURL + item.user_image}` }}
              style={styles.userAvatar}
            />
          ) : (
            <View style={[
              styles.userAvatarPlaceholder,
              isTopThree && styles[`topThreePlaceholder${item.ranking}`]
            ]}>
              <Text style={styles.userAvatarText}>
                {item.first_character}
              </Text>
            </View>
          )}
          
          <View style={styles.userInfo}>
            <Text style={styles.userName} numberOfLines={1}>{item.name}</Text>
            {item.time_spent && (
              <Text style={styles.userSubInfo}>Active for {item.time_spent}</Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
      
      <View style={styles.pointsContainer}>
        <Text style={[
          styles.pointsText,
          isTopThree && styles.topThreePoints
        ]}>
          {item.total_points}
        </Text>
        <Text style={styles.pointsLabel}>pts</Text>
      </View>
    </View>
  );
};

// Tab Routes
const LeaderboardTab = ({ data, navigation, title, isLoading, totalParticipants }) => {
  const animatedValue = new Animated.Value(0);
  
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [data]);

  return (
    <View style={styles.tabContainer}>
      <View style={styles.tabHeader}>
        <Text style={styles.participantsText}>
          {totalParticipants || 0} Participants
        </Text>
        <Text style={styles.timeframeText}>{title} Ranking</Text>
      </View>
      
      <View style={styles.columnLabels}>
        <Text style={styles.rankingLabel}>Ranking</Text>
        <Text style={styles.pointsLabel}>Points</Text>
      </View>
      
      {isLoading ? (
        <View style={styles.tabLoadingContainer}>
          <ActivityIndicator size="small" color="#4A80F0" />
          <Text style={styles.tabLoadingText}>Loading rankings...</Text>
        </View>
      ) : data?.length > 0 ? (
        <FlatList
          data={data}
          keyExtractor={(item, index) => `${title}-${index}`}
          renderItem={({ item, index }) => (
            <Animated.View style={{
              opacity: animatedValue,
              transform: [{ 
                translateY: animatedValue.interpolate({
                  inputRange: [0, 1],
                  outputRange: [20, 0]
                })
              }]
            }}>
              <LeaderboardRow item={item} index={index} navigation={navigation} />
            </Animated.View>
          )}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.leaderboardList}
        />
      ) : (
        <View style={styles.emptyStateContainer}>
          <MaterialCommunityIcons name="trophy-outline" size={60} color="#DDD" />
          <Text style={styles.emptyStateText}>No participants yet</Text>
          <Text style={styles.emptyStateSubtext}>Be the first to earn points!</Text>
        </View>
      )}
    </View>
  );
};

const LeaderScreen = ({ route }) => {
  const { pageId } = route.params;
  const navigation = useNavigation();
  const layout = useWindowDimensions();
  const isFocused = useIsFocused();
  const queryClient = useQueryClient();
  
  // State
  const [headerHeight] = useState(new Animated.Value(hp(25)));
  const [index, setIndex] = useState(0);
  const [routes, setRoutes] = useState([]);

  // Fetch user with Tanstack Query
  const { data: user } = useQuery({
    queryKey: ['leaderboardUser'],
    queryFn: async () => {
      const storedUser = await AsyncStorage.getItem("user");
      if (storedUser) {
        return JSON.parse(storedUser);
      }
      throw new Error("User not found");
    },
    onError: () => {
      navigation.navigate("OtpVerification");
    }
  });

  // Fetch leaderboard data
  const { 
    data: leaderboardData, 
    isLoading: isLeaderboardLoading 
  } = useQuery({
    queryKey: ['leaderboardData', pageId, user?.id],
    queryFn: async () => {
      const response = await axios.get(
        `${baseURL}/getUserLeader.php?user_id=${user.id}&page_id=${pageId}`
      );
      return response.data;
    },
    enabled: !!user?.id
  });

  // Fetch page details
  const { data: selectedMovie = {}, isLoading: isPageLoading } = useQuery({
    queryKey: ['pageDetails', pageId, user?.id],
    queryFn: async () => {
      const response = await axios.get(
        `${baseURL}/getDetailsInnerpage.php?id=${pageId}&userId=${user.id}`
      );
      return response.data;
    },
    enabled: !!user?.id
  });

  // Update routes based on available timeframes
  useEffect(() => {
    if (leaderboardData?.available_timeframes) {
      const timeframeLabels = {
        daily: 'Daily',
        weekly: 'Weekly',
        monthly: 'Monthly',
        quarterly: 'Quarterly',
        yearly: 'Yearly'
      };

      const newRoutes = leaderboardData.available_timeframes.map(timeframe => ({
        key: timeframe,
        title: timeframeLabels[timeframe] || timeframe
      }));

      setRoutes(newRoutes);
      
      // Reset index if current index is invalid
      if (index >= newRoutes.length) {
        setIndex(0);
      }
    }
  }, [leaderboardData?.available_timeframes]);

  // Invalidate queries when screen is focused
  useEffect(() => {
    if (isFocused && user?.id) {
      queryClient.invalidateQueries(['pageDetails', pageId, user.id]);
      queryClient.invalidateQueries(['leaderboardData', pageId, user.id]);
    }
  }, [isFocused, pageId, user?.id, queryClient]);

  // Determine if all data is loading
  const isLoading = isPageLoading || isLeaderboardLoading || !user?.id;

  // Get current timeframe data
  const getCurrentTimeframeData = () => {
    if (!leaderboardData?.leaderboards || !routes[index]) {
      return { data: [], single: null, totalParticipants: 0 };
    }
    
    const currentTimeframe = routes[index].key;
    const timeframeData = leaderboardData.leaderboards[currentTimeframe] || {};
    
    return {
      data: timeframeData.data || [],
      single: timeframeData.single || null,
      totalParticipants: timeframeData.total_participants || 0
    };
  };

  // Render tab scenes
  const renderScene = ({ route }) => {
    const timeframeData = leaderboardData?.leaderboards?.[route.key] || {};
    
    return (
      <LeaderboardTab 
        data={timeframeData.data || []} 
        navigation={navigation} 
        title={route.title} 
        isLoading={isLeaderboardLoading}
        totalParticipants={timeframeData.total_participants || 0}
      />
    );
  };

  // Custom tab bar
  const renderTabBar = (props) => (
    <TabBar
      {...props}
      indicatorStyle={styles.tabIndicator}
      style={styles.tabBar}
      labelStyle={styles.tabLabel}
      activeColor="#4A80F0"
      inactiveColor="#888888"
      renderLabel={({ route, focused, color }) => (
        <Text style={[styles.tabLabel, { color: focused ? "#4A80F0" : "#888888" }]}>
          {route.title}
        </Text>
      )}
      scrollEnabled={routes.length > 3}
      tabStyle={routes.length > 3 ? { width: 'auto', minWidth: 80 } : undefined}
    />
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A80F0" />
        <Text style={styles.loadingText}>Loading leaderboard...</Text>
      </View>
    );
  }

  // If no timeframes are available
  if (!routes.length) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        
        {/* Header with back button */}
        <View style={styles.simpleHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.simpleHeaderTitle}>Leaderboard</Text>
          <View style={styles.rightPlaceholder} />
        </View>

        <View style={styles.emptyStateContainer}>
          <MaterialCommunityIcons name="trophy-off-outline" size={80} color="#DDD" />
          <Text style={styles.emptyStateText}>Leaderboard Not Available</Text>
          <Text style={styles.emptyStateSubtext}>This page doesn't have any active leaderboard timeframes.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const currentData = getCurrentTimeframeData();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Header Section */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        {/* Banner Image with Gradient Overlay */}
        <View style={styles.bannerContainer}>
          {selectedMovie.banner ? (
            <Image
              source={{ uri: `${baseImgURL + selectedMovie.banner}` }}
              style={styles.bannerImage}
            />
          ) : (
            <View style={styles.bannerPlaceholder} />
          )}
          
          {/* Gradient Overlay */}
          <LinearGradient
            colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
            style={styles.bannerOverlay}
          />
        </View>
        
        {/* Top Navigation Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.screenTitle}>Leaderboard</Text>
          
          <View style={styles.rightPlaceholder} />
        </View>
        
        {/* Page Info */}
        <View style={styles.pageInfoContainer}>
          <View style={styles.pageImageContainer}>
            {selectedMovie.image ? (
              <Image
                source={{ uri: `${baseImgURL + selectedMovie.image}` }}
                style={styles.pageImage}
              />
            ) : (
              <View style={styles.pageImagePlaceholder}>
                <Text style={styles.pageImageText}>
                  {selectedMovie.title?.charAt(0) || "?"}
                </Text>
              </View>
            )}
          </View>
          
          <View style={styles.pageTitleContainer}>
            <Text style={styles.pageTitle} numberOfLines={1}>
              {selectedMovie.title}
            </Text>
            
            {selectedMovie.type && (
              <View style={styles.pageTypeContainer}>
                <Text style={styles.pageTypeText}>{selectedMovie.type}</Text>
              </View>
            )}
          </View>
        </View>
      </Animated.View>
      
      {/* User's Current Rank Card (if applicable) */}
      {currentData.single && (
        <View style={styles.userRankCard}>
          <Text style={styles.userRankTitle}>Your Ranking</Text>
          
          <View style={styles.userRankInfo}>
            <View style={styles.userRankItem}>
              <Text style={styles.userRankPosition}>#{currentData.single.ranking}</Text>
              <Text style={styles.userRankPoints}>{currentData.single.total_points} pts</Text>
              <Text style={styles.userRankTimeframe}>{routes[index]?.title}</Text>
            </View>
          </View>
        </View>
      )}
      
      {/* Tab View for Leaderboards */}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
        style={styles.tabView}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FD",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F8F9FD",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    fontFamily: "raleway-medium",
  },
  tabLoadingContainer: {
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  tabLoadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
    fontFamily: "raleway",
  },
  simpleHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS == "android" ? StatusBar.currentHeight + 10 : 10,
    paddingBottom: 10,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  simpleHeaderTitle: {
    fontSize: 18,
    color: "#333",
    fontFamily: "raleway-bold",
  },
  header: {
    position: "relative",
  },
  bannerContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  bannerPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#4A80F0",
  },
  bannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: Platform.OS == "android" ? StatusBar.currentHeight + 10 : 10,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  screenTitle: {
    fontSize: 18,
    color: "white",
    fontFamily: "raleway-bold",
  },
  rightPlaceholder: {
    width: 40,
  },
  pageInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingBottom: 20,
    marginTop: "auto",
    zIndex: 10,
  },
  pageImageContainer: {
    width: wp(16),
    height: wp(16),
    borderRadius: wp(8),
    borderWidth: 2,
    borderColor: "white",
    overflow: "hidden",
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
  },
  pageImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  pageImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#4A80F0",
    justifyContent: "center",
    alignItems: "center",
  },
  pageImageText: {
    fontSize: 24,
    fontFamily: "raleway-bold",
    color: "white",
  },
  pageTitleContainer: {
    marginLeft: 12,
    flex: 1,
  },
  pageTitle: {
    fontSize: 20,
    fontFamily: "raleway-bold",
    color: "white",
    marginBottom: 4,
  },
  pageTypeContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  pageTypeText: {
    fontSize: 12,
    fontFamily: "raleway-medium",
    color: "white",
  },
  userRankCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: -20,
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 20,
  },
  userRankTitle: {
    fontSize: 14,
    fontFamily: "raleway-bold",
    color: "#666",
    marginBottom: 8,
  },
  userRankInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  userRankItem: {
    alignItems: "center",
  },
  userRankPosition: {
    fontSize: 22,
    fontFamily: "raleway-bold",
    color: "#4A80F0",
  },
  userRankPoints: {
    fontSize: 16,
    fontFamily: "raleway-bold",
    color: "#333",
  },
  userRankTimeframe: {
    fontSize: 12,
    fontFamily: "raleway",
    color: "#888",
    marginTop: 2,
  },
  tabView: {
    flex: 1,
    marginTop: 10,
  },
  tabBar: {
    backgroundColor: "white",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tabLabel: {
    fontSize: 14,
    fontFamily: "raleway-bold",
    textTransform: "none",
  },
  tabIndicator: {
    backgroundColor: "#4A80F0",
    height: 3,
    borderRadius: 3,
  },
  tabContainer: {
    flex: 1,
    backgroundColor: "white",
  },
  tabHeader: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  participantsText: {
    fontSize: 12,
    fontFamily: "raleway-medium",
    color: "#888",
    marginBottom: 4,
  },
  timeframeText: {
    fontSize: 16,
    fontFamily: "raleway-bold",
    color: "#333",
  },
  columnLabels: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  rankingLabel: {
    fontSize: 13,
    fontFamily: "raleway-bold",
    color: "#888",
  },
  pointsLabel: {
    fontSize: 13,
    fontFamily: "raleway-bold",
    color: "#888",
  },
  leaderboardList: {
    padding: 10,
    paddingBottom: 30,
  },
  leaderboardRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 10,
    backgroundColor: "white",
    borderRadius: 12,
  },
  topThreeRow: {
    backgroundColor: "#F8F9FD",
    borderWidth: 1,
    borderColor: "#F0F0F0",
  },
  rankAndUser: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  rankingContainer: {
    width: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  rankingText: {
    fontSize: 16,
    fontFamily: "raleway-bold",
    color: "#666",
  },
  medalContainer: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  userContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginLeft: 10,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FF5E7D",
    justifyContent: "center",
    alignItems: "center",
  },
  topThreePlaceholder1: {
    backgroundColor: "#FFD700",
  },
  topThreePlaceholder2: {
    backgroundColor: "#C0C0C0",
  },
  topThreePlaceholder3: {
    backgroundColor: "#CD7F32",
  },
  userAvatarText: {
    fontSize: 16,
    fontFamily: "raleway-bold",
    color: "white",
  },
  userInfo: {
    marginLeft: 10,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontFamily: "raleway-bold",
    color: "#333",
  },
  userSubInfo: {
    fontSize: 12,
    fontFamily: "raleway",
    color: "#888",
    marginTop: 2,
  },
  pointsContainer: {
    alignItems: "flex-end",
  },
  pointsText: {
    fontSize: 18,
    fontFamily: "raleway-bold",
    color: "#333",
  },
  topThreePoints: {
    color: "#4A80F0",
  },
  separator: {
    height: 10,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    marginTop: 50,
  },
  emptyStateText: {
    fontSize: 18,
    fontFamily: "raleway-bold",
    color: "#333",
    marginTop: 20,
  },
  emptyStateSubtext: {
    fontSize: 14,
    fontFamily: "raleway",
    color: "#888",
    marginTop: 10,
    textAlign: "center",
  },
});

export default LeaderScreen;