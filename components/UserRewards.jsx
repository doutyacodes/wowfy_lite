import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ScrollView,
  Animated,
  ActivityIndicator,
  useWindowDimensions,
  Platform,
  StatusBar,
  SafeAreaView,
} from "react-native";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { TabView, TabBar } from "react-native-tab-view";
import {
  DataTable,
  Divider,
  Modal,
  PaperProvider,
  Portal,
  ProgressBar,
} from "react-native-paper";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { Feather, MaterialCommunityIcons, Ionicons, FontAwesome5 } from "@expo/vector-icons";
import { baseImgURL, baseURL } from "../backend/baseData";
import TopBar from "./AppComponents/TopBar";
import MyRewardCard from "./AppComponents/MyRewardCard";
import RewardCard from "./RewardCard";

// Reward Detail Modal Component
const RewardDetailModal = ({ visible, hideModal, infoDetails }) => {
  return (
    <Modal
      visible={visible}
      onDismiss={hideModal}
      contentContainerStyle={styles.modalContainer}
    >
      <View style={styles.modalHeader}>
        <Text style={styles.modalTitle}>Reward Details</Text>
        <TouchableOpacity onPress={hideModal} style={styles.closeButton}>
          <Feather name="x" size={24} color="#666" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.modalDivider} />
      
      <View style={styles.modalContent}>
        <Text style={styles.modalSubtitle}>Reason</Text>
        <Text style={styles.modalText}>{infoDetails}</Text>
      </View>
    </Modal>
  );
};

// Empty State Component
const EmptyState = ({ type }) => {
  const config = {
    rewards: {
      icon: "gift-outline",
      title: "No rewards available",
      subtitle: "Complete activities to earn rewards",
    },
    history: {
      icon: "time-outline",
      title: "No reward history",
      subtitle: "Your claimed rewards will appear here",
    },
  };
  
  const content = config[type] || config.rewards;
  
  return (
    <View style={styles.emptyContainer}>
      <Ionicons name={content.icon} size={60} color="#DDD" />
      <Text style={styles.emptyTitle}>{content.title}</Text>
      <Text style={styles.emptySubtitle}>{content.subtitle}</Text>
    </View>
  );
};

// Rank Card Component
const RankCard = ({ title, rank, points }) => {
  return (
    <View style={styles.rankCardRow}>
      <View style={styles.rankCardLabel}>
        <Text style={styles.rankCardLabelText}>{title}</Text>
      </View>
      
      <View style={styles.rankCardStats}>
        <View style={styles.rankStat}>
          <Text style={styles.rankStatValue}>{rank || "0"}</Text>
          <Text style={styles.rankStatLabel}>Rank</Text>
        </View>
        
        <View style={styles.pointsStat}>
          <Text style={styles.pointsStatValue}>{points || "0"}</Text>
          <Text style={styles.pointsStatLabel}>Points</Text>
        </View>
      </View>
    </View>
  );
};

// Level Progress Component
const LevelProgress = ({ currentLevel, nextLevel, currentXp, nextLevelXp, thisLevelXp, progressPercent }) => {
  return (
    <View style={styles.levelCard}>
      <View style={styles.levelHeader}>
        <Text style={styles.levelCardTitle}>Level Progress</Text>
      </View>
      
      <View style={styles.xpContainer}>
        <Text style={styles.xpText}>{thisLevelXp} XP</Text>
        <View style={styles.xpDivider} />
        <Text style={styles.xpText}>{nextLevelXp} XP</Text>
      </View>
      
      <View style={styles.progressContainer}>
        <ProgressBar
          progress={progressPercent ? progressPercent / 100 : 0}
          color="#4A80F0"
          style={styles.progressBar}
        />
      </View>
      
      <View style={styles.levelLabelsContainer}>
        <View style={styles.levelLabel}>
          <Text style={styles.levelNumber}>Level {currentLevel}</Text>
          <MaterialCommunityIcons name="medal" size={16} color="#FFD700" />
        </View>
        
        <View style={styles.levelLabel}>
          <Text style={styles.levelNumber}>Level {nextLevel}</Text>
          <MaterialCommunityIcons name="medal" size={16} color="#C0C0C0" />
        </View>
      </View>
      
      <View style={styles.xpNeededContainer}>
        <Text style={styles.xpNeededText}>
          {nextLevelXp - currentXp} XP needed for next level
        </Text>
      </View>
    </View>
  );
};

const UserRewards = ({ route }) => {
  const { movieId } = route.params;
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const layout = useWindowDimensions();
  const scrollY = useRef(new Animated.Value(0)).current;
  
  // State
  const [user, setUser] = useState(null);
  const [selectedMovie, setSelectedMovie] = useState({});
  const [selectedRewards, setSelectedRewards] = useState([]);
  const [myRewards, setMyRewards] = useState([]);
  const [totalPoints, setTotalPoints] = useState(0);
  
  // Ranking data
  const [weekly, setWeekly] = useState({});
  const [monthly, setMonthly] = useState({});
  const [quarterly, setQuarterly] = useState({});
  
  // UI state
  const [visible, setVisible] = useState(false);
  const [infoDetails, setInfoDetails] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "first", title: "Stats" },
    { key: "second", title: "Rewards" },
    { key: "third", title: "History" },
  ]);
  
  // Header animations
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [hp(25), hp(20)],
    extrapolate: 'clamp',
  });
  
  // Modal functions
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  
  // Fetch user data from AsyncStorage
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          navigation.navigate("OtpVerification");
        }
      } catch (error) {
        console.error("Error while fetching user:", error.message);
      }
    };
    
    fetchUser();
  }, []);
  
  // Fetch data when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (!user) return;
      
      setIsLoading(true);
      
      // Create all API requests
      const requests = [
        // Get page details
        axios.get(`${baseURL}/getDetailsInnerpage.php?id=${movieId}&userId=${user.id}`),
        
        // Get user rewards
        axios.get(`${baseURL}/getUserRewards.php?page_id=${movieId}&user_id=${user.id}`),
        
        // Get total points
        axios.get(`${baseURL}/totalPoints.php?page_id=${movieId}&user_id=${user.id}`),
        
        // Get page rewards
        axios.get(`${baseURL}/getPageRewards.php?page_id=${movieId}&userId=${user.id}`),
        
        // Get weekly rank
        axios.get(`${baseURL}/getUserRank.php?page_id=${movieId}&user_id=${user.id}&timeline=weekly`),
        
        // Get monthly rank
        axios.get(`${baseURL}/getUserRank.php?page_id=${movieId}&user_id=${user.id}&timeline=monthly`),
        
        // Get seasonal rank
        axios.get(`${baseURL}/getUserRank.php?page_id=${movieId}&user_id=${user.id}&timeline=season`),
      ];
      
      // Execute all requests in parallel
      Promise.all(requests)
        .then(([
          movieResponse,
          rewardsResponse,
          pointsResponse,
          pageRewardsResponse,
          weeklyResponse,
          monthlyResponse,
          seasonalResponse
        ]) => {
          // Set page details
          setSelectedMovie(movieResponse.data);
          
          // Set rewards
          setSelectedRewards(rewardsResponse.data || []);
          
          // Set total points
          if (pointsResponse.data && pointsResponse.status == 200) {
            setTotalPoints(pointsResponse.data.total_points || 0);
          }
          
          // Set page rewards
          if (pageRewardsResponse.data && pageRewardsResponse.data.my_rewards) {
            setMyRewards(pageRewardsResponse.data.my_rewards || []);
          }
          
          // Set weekly rank
          if (weeklyResponse.data && weeklyResponse.data.success) {
            setWeekly(weeklyResponse.data.data || {});
          }
          
          // Set monthly rank
          if (monthlyResponse.data && monthlyResponse.data.success) {
            setMonthly(monthlyResponse.data.data || {});
          }
          
          // Set seasonal rank
          if (seasonalResponse.data && seasonalResponse.data.success) {
            setQuarterly(seasonalResponse.data.data || {});
          }
        })
        .catch(error => {
          console.error("Error fetching data:", error.message);
        })
        .finally(() => {
          setIsLoading(false);
        });
    }, [user, movieId, isFocused])
  );
  
  // Tab scenes
  const renderScene = ({ route }) => {
    switch (route.key) {
      case "first":
        return (
          <ScrollView 
            style={styles.tabContent}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.statsContainer}
          >
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Rankings</Text>
              <View style={styles.rankingsCard}>
                <RankCard 
                  title="Weekly" 
                  rank={weekly?.rank} 
                  points={weekly?.total_points} 
                />
                <Divider style={styles.rankDivider} />
                <RankCard 
                  title="Monthly" 
                  rank={monthly?.rank} 
                  points={monthly?.total_points} 
                />
                <Divider style={styles.rankDivider} />
                <RankCard 
                  title="Seasonal" 
                  rank={quarterly?.rank} 
                  points={quarterly?.total_points} 
                />
              </View>
            </View>
            
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Level Progress</Text>
              <LevelProgress 
                currentLevel={selectedMovie?.level}
                nextLevel={selectedMovie?.next_level}
                currentXp={selectedMovie?.total_xp}
                nextLevelXp={selectedMovie?.next_level_xp}
                thisLevelXp={selectedMovie?.this_level_xp}
                progressPercent={selectedMovie?.percent_to_next_level}
              />
            </View>
            
            <View style={styles.statsSection}>
              <Text style={styles.sectionTitle}>Total Points</Text>
              <View style={styles.pointsTotalCard}>
                <View style={styles.pointsTotalContent}>
                  <FontAwesome5 name="star" size={30} color="#FFD700" solid />
                  <Text style={styles.pointsTotalValue}>{totalPoints}</Text>
                  <Text style={styles.pointsTotalLabel}>lifetime points earned</Text>
                </View>
                
                {/* <TouchableOpacity style={styles.pointsHistoryButton}>
                  <Text style={styles.pointsHistoryText}>View Points History</Text>
                  <Feather name="chevron-right" size={16} color="#4A80F0" />
                </TouchableOpacity> */}
              </View>
            </View>
          </ScrollView>
        );
      
      case "second":
        return (
          <View style={styles.tabContent}>
            {myRewards?.length > 0 ? (
              <FlatList
                data={myRewards}
                keyExtractor={(item, index) => `reward-${index}`}
                renderItem={({ item, index }) => (
                  <MyRewardCard item={item} index={index} user={user} />
                )}
                contentContainerStyle={styles.rewardsGrid}
                numColumns={2}
                showsVerticalScrollIndicator={false}
                ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
              />
            ) : (
              <EmptyState type="rewards" />
            )}
          </View>
        );
      
      case "third":
        return (
          <View style={styles.tabContent}>
            {selectedRewards?.length > 0 ? (
              <FlatList
                data={selectedRewards}
                keyExtractor={(item, index) => `history-${index}`}
                renderItem={({ item, index }) => (
                  <RewardCard
                    item={item}
                    index={index}
                    showModal={showModal}
                    setInfoDetails={setInfoDetails}
                  />
                )}
                contentContainerStyle={styles.historyList}
                showsVerticalScrollIndicator={false}
              />
            ) : (
              <EmptyState type="history" />
            )}
          </View>
        );
      
      default:
        return null;
    }
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
        <Text style={[styles.tabLabel, { color }]}>
          {route.title}
        </Text>
      )}
    />
  );
  
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A80F0" />
        <Text style={styles.loadingText}>Loading rewards...</Text>
      </View>
    );
  }
  
  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
        
        {/* Animated Header */}
        <Animated.View style={[styles.header, { height: headerHeight }]}>
          {/* Background Image & Overlay */}
          <View style={styles.headerBackground}>
            {selectedMovie.banner ? (
              <Image
                source={{ uri: `${baseImgURL + selectedMovie.banner}` }}
                style={styles.bannerImage}
              />
            ) : (
              <View style={styles.bannerPlaceholder} />
            )}
            
            <LinearGradient
              colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.8)']}
              style={styles.bannerOverlay}
            />
          </View>
          
          {/* Top Bar */}
          <TopBar color="white" user={user} />
          
          {/* Page Info */}
          <View style={styles.pageInfoContainer}>
            <View style={styles.pageIconWrapper}>
              <View style={styles.pageIconBorder}>
                <View style={styles.pageIconContainer}>
                  {selectedMovie.image ? (
                    <Image
                      source={{ uri: `${baseImgURL + selectedMovie.image}` }}
                      style={styles.pageIcon}
                    />
                  ) : (
                    <View style={styles.pageIconPlaceholder} />
                  )}
                </View>
              </View>
            </View>
            
            <View style={styles.pageTitleContainer}>
              <Text style={styles.pageTitle} numberOfLines={2}>
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
        
        {/* Tab View */}
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={renderTabBar}
          style={styles.tabView}
        />
        
        {/* Reward Details Modal */}
        <Portal>
          <RewardDetailModal
            visible={visible}
            hideModal={hideModal}
            infoDetails={infoDetails}
          />
        </Portal>
      </SafeAreaView>
    </PaperProvider>
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
    marginTop: 16,
    fontSize: 16,
    fontFamily: "raleway",
    color: "#666",
  },
  
  // Header styles
  header: {
    width: "100%",
    overflow: "hidden",
  },
  headerBackground: {
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
    backgroundColor: "#333",
  },
  bannerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  pageInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    marginTop: "auto",
    paddingBottom: 16,
  },
  pageIconWrapper: {
    padding: 3,
    backgroundColor: "#FFA500",
    borderRadius: wp(10) + 3,
  },
  pageIconBorder: {
    backgroundColor: "white",
    borderRadius: wp(10),
    padding: 1,
  },
  pageIconContainer: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  pageIcon: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  pageIconPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#F0F0F0",
  },
  pageTitleContainer: {
    flex: 1,
    marginLeft: 15,
  },
  pageTitle: {
    fontSize: hp(2.2),
    fontFamily: "raleway-bold",
    color: "white",
    marginBottom: 5,
  },
  pageTypeContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 12,
    alignSelf: "flex-start",
  },
  pageTypeText: {
    fontSize: 12,
    fontFamily: "raleway",
    color: "white",
  },
  
  // Tab View styles
  tabView: {
    flex: 1,
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
  },
  tabContent: {
    flex: 1,
    backgroundColor: "#F8F9FD",
  },
  
  // Stats tab styles
  statsContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  statsSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "raleway-bold",
    color: "#333",
    marginBottom: 12,
  },
  rankingsCard: {
    backgroundColor: "white",
    borderRadius: 16,
    paddingVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  rankCardRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  rankCardLabel: {
    width: 80,
  },
  rankCardLabelText: {
    fontSize: 14,
    fontFamily: "raleway-bold",
    color: "#666",
  },
  rankCardStats: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  rankStat: {
    alignItems: "center",
  },
  rankStatValue: {
    fontSize: 18,
    fontFamily: "raleway-bold",
    color: "#4A80F0",
    marginBottom: 2,
  },
  rankStatLabel: {
    fontSize: 12,
    fontFamily: "raleway",
    color: "#999",
  },
  pointsStat: {
    alignItems: "center",
  },
  pointsStatValue: {
    fontSize: 18,
    fontFamily: "raleway-bold",
    color: "#FF9500",
    marginBottom: 2,
  },
  pointsStatLabel: {
    fontSize: 12,
    fontFamily: "raleway",
    color: "#999",
  },
  rankDivider: {
    backgroundColor: "#F0F0F0",
    height: 1,
    marginHorizontal: 16,
  },
  levelCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  levelHeader: {
    marginBottom: 16,
  },
  levelCardTitle: {
    fontSize: 14,
    fontFamily: "raleway-bold",
    color: "#666",
  },
  xpContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  xpText: {
    fontSize: 12,
    fontFamily: "raleway-bold",
    color: "#666",
  },
  xpDivider: {
    flex: 1,
    height: 1,
    backgroundColor: "#F0F0F0",
    marginHorizontal: 8,
  },
  progressContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#E0E0E0",
  },
  levelLabelsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  levelLabel: {
    flexDirection: "row",
    alignItems: "center",
  },
  levelNumber: {
    fontSize: 13,
    fontFamily: "raleway-bold",
    color: "#666",
    marginRight: 4,
  },
  xpNeededContainer: {
    alignItems: "center",
  },
  xpNeededText: {
    fontSize: 12,
    fontFamily: "raleway",
    color: "#666",
  },
  pointsTotalCard: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  pointsTotalContent: {
    alignItems: "center",
    padding: 20,
  },
  pointsTotalValue: {
    fontSize: 32,
    fontFamily: "raleway-bold",
    color: "#333",
    marginVertical: 8,
  },
  pointsTotalLabel: {
    fontSize: 14,
    fontFamily: "raleway",
    color: "#666",
  },
  pointsHistoryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#F0F0F0",
  },
  pointsHistoryText: {
    fontSize: 14,
    fontFamily: "raleway-bold",
    color: "#4A80F0",
    marginRight: 4,
  },
  
  // Rewards tab styles
  rewardsGrid: {
    padding: 12,
  },
  
  // History tab styles
  historyList: {
    padding: 16,
  },
  
  // Empty state styles
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontFamily: "raleway-bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    fontFamily: "raleway",
    color: "#999",
    textAlign: "center",
    lineHeight: 20,
  },
  
  // Modal styles
  modalContainer: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 16,
    overflow: "hidden",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "raleway-bold",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  modalDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },
  modalContent: {
    padding: 16,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: "raleway-bold",
    color: "#FF5722",
    marginBottom: 8,
  },
  modalText: {
    fontSize: 14,
    fontFamily: "raleway",
    color: "#666",
    lineHeight: 22,
  },
});

export default UserRewards;