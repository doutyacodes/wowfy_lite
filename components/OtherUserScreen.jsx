import {
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { LinearGradient } from "expo-linear-gradient";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState, useCallback } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import LottieView from "lottie-react-native";
import AwesomeAlert from "react-native-awesome-alerts";
import {
  Divider,
  ProgressBar,
  Provider,
  Switch,
  Tooltip,
} from "react-native-paper";
import SwiperFlatList from "react-native-swiper-flatlist";
import { baseImgURL, baseURL } from "../backend/baseData";
import BadgeListCard from "./BadgeListCard";
import CertificateList from "./CertificateList";
import CompletedChallenges from "./CompletedChallenges";
import TaskHomeCard from "./TaskHomeCard";
import UserPosts from "./UserPosts";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const OtherUserScreen = ({ route }) => {
  const { user_id } = route.params;
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const queryClient = useQueryClient();
  
  // Local state
  const [user, setUser] = useState(null);
  const [activeRouteIndex, setActiveRouteIndex] = useState("first");
  const [showAlert, setShowAlert] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch current user from AsyncStorage
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userString = await AsyncStorage.getItem("user");
        if (userString) {
          setUser(JSON.parse(userString));
        }
      } catch (error) {
        console.error("Error fetching user from AsyncStorage:", error.message);
      }
    };

    fetchUserData();
  }, []);

  // Handle refresh for pull-to-refresh functionality
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    
    // Invalidate and refetch all relevant queries
    queryClient.invalidateQueries(['userProfile', user_id]);
    queryClient.invalidateQueries(['followStatus', user_id]);
    queryClient.invalidateQueries(['followers', user_id]);
    queryClient.invalidateQueries(['completedChallenges', user_id]);
    queryClient.invalidateQueries(['achievements', user_id]);
    queryClient.invalidateQueries(['visitedPlaces', user_id]);
    
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, [user_id, queryClient]);

  // User Profile Query
  const {
    data: userData = {},
    isLoading: isUserDataLoading,
    refetch: refetchUserData,
  } = useQuery({
    queryKey: ['userProfile', user_id, user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
      const response = await axios.get(
        `${baseURL}/getOtherUser.php?user_id=${user_id}&other_user=${user.id}`
      );
      return response.data || {};
    },
    enabled: !!user?.id && isFocused,
    refetchOnWindowFocus: true,
    refetchInterval: 30000, // Refetch every 30 seconds
    staleTime: 1000 * 30, // Consider data stale after 30 seconds
  });

  // Follow Status Query
  const {
    data: followData = { followed: "no" },
    isLoading: isFollowLoading,
    refetch: refetchFollowStatus,
  } = useQuery({
    queryKey: ['followStatus', user_id, user?.id],
    queryFn: async () => {
      if (!user?.id) return { followed: "no" };
      const response = await axios.get(
        `${baseURL}/checkAlreadyFollowed.php?followed_user=${user_id}&user_id=${user?.id}`
      );
      return response.data || { followed: "no" };
    },
    enabled: !!user?.id && isFocused && (parseInt(user_id) !== user?.id),
  });

  // Followers Details Query
  const {
    data: followersDetails = [],
    isLoading: isFollowersLoading,
    refetch: refetchFollowers,
  } = useQuery({
    queryKey: ['followers', user_id, user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await axios.get(
        `${baseURL}/getFollowers.php?user_id=${user_id}&follow_user=${user.id}`
      );
      return response.data || [];
    },
    enabled: !!user?.id && isFocused,
  });

  // Completed Challenges Query
  const {
    data: completedData = [],
    isLoading: isCompletedLoading,
    refetch: refetchCompleted,
  } = useQuery({
    queryKey: ['completedChallenges', user_id],
    queryFn: async () => {
      const response = await axios.get(
        `${baseURL}/getCompletedChallenge.php?userId=${user_id}`
      );
      console.log("response",response.data)
      if (response.status == 200 && response.data.success) {
        return response.data.data.challenge || [];
      }
      return [];
    },
    enabled: isFocused,
    refetchInterval: 15000, // Refetch every 15 seconds to keep challenges updated
    staleTime: 1000 * 10, // Consider data stale after 10 seconds
  });

  // Achievements Query
  const {
    data: achieveData = [],
    isLoading: isAchieveLoading,
    refetch: refetchAchievements,
  } = useQuery({
    queryKey: ['achievements', user_id],
    queryFn: async () => {
      const response = await axios.get(
        `${baseURL}/getAchievementList.php?userId=${user_id}`
      );
      if (response.status == 200 && response.data.success) {
        return response.data.data.challenge || [];
      }
      return [];
    },
    enabled: isFocused,
    refetchInterval: 15000, // Refetch every 15 seconds
    staleTime: 1000 * 10, // Consider data stale after 10 seconds
  });

  // Visited Places Query
  const {
    data: completedVisit = [],
    isLoading: isVisitLoading,
    refetch: refetchVisits,
  } = useQuery({
    queryKey: ['visitedPlaces', user_id],
    queryFn: async () => {
      const response = await axios.get(
        `${baseURL}/getVisitedCompleted.php?user_id=${user_id}`
      );
      return response.data.tasks || [];
    },
    enabled: !!user_id && isFocused,
  });

  // Badges Query (placeholder - implement when needed)
  const {
    data: badgeData = [],
    isLoading: isBadgeLoading,
  } = useQuery({
    queryKey: ['badges', user_id],
    queryFn: async () => {
      // Implement badge API call when available
      return [];
    },
    enabled: false, // Disabled until API is available
  });

  // Toggle Follow Mutation
  const toggleFollowMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.get(
        `${baseURL}/toggle-user-follow.php?followed_user=${user_id}&user_id=${user?.id}`
      );
      return response.data;
    },
    onSuccess: () => {
      // Invalidate and refetch relevant queries
      queryClient.invalidateQueries(['userProfile', user_id]);
      queryClient.invalidateQueries(['followStatus', user_id]);
      queryClient.invalidateQueries(['followers', user_id]);
    },
  });

  // Toggle Account Privacy Mutation
  const toggleAccountMutation = useMutation({
    mutationFn: async () => {
      const response = await axios.get(
        `${baseURL}/toggle-account.php?user_id=${user?.id}`
      );
      return response.data;
    },
    onSuccess: () => {
      setShowAlert(false);
      // Invalidate and refetch user profile data
      queryClient.invalidateQueries(['userProfile', user_id]);
    },
  });

  // Achievement Action Mutation
  const achievementMutation = useMutation({
    mutationFn: async ({ userId, challengeId }) => {
      const response = await axios.post(
        `${baseURL}/achievementAdded.php`,
        {
          user_id: userId,
          challenge_id: challengeId,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data.success) {
        alert(data.message);
      }
      // Invalidate and refetch achievements
      queryClient.invalidateQueries(['achievements', user_id]);
      queryClient.invalidateQueries(['completedChallenges', user_id]);
    },
  });

  // Refetch all data when the screen comes into focus
  useEffect(() => {
    if (isFocused && user?.id) {
      refetchUserData();
      refetchFollowStatus();
      refetchFollowers();
      refetchCompleted();
      refetchAchievements();
      refetchVisits();
    }
  }, [isFocused, user?.id]);

  // Toggle follow handler
  const handleToggleFollow = () => {
    if (user && parseInt(user_id) !== user.id) {
      toggleFollowMutation.mutate();
    }
  };

  // Toggle account privacy handler
  const handleToggleAccount = () => {
    if (user) {
      toggleAccountMutation.mutate();
    }
  };

  // Achievement handler
  const fetchAchievementData = (userId, challengeId) => {
    achievementMutation.mutate({ userId, challengeId });
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("user");
      navigation.navigate("OtpVerification");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  // Tab routes
  const [routes] = useState([
    { key: "first", title: "Overview", icon: "information-circle-outline" },
    { key: "second", title: "Posts", icon: "list-outline" },
    { key: "fifth", title: "User Posts", icon: "person-outline" },
    // { key: "third", title: "Places", icon: "location-outline" },
    { key: "fourth", title: "Challenges", icon: "trophy-outline" },
  ]);

  // Derived values
  const isFollowing = followData?.followed == "yes";
  const followName = userData.follow_name || "Follow";
  const isSwitchOn = userData.account_status == "private";
  const count = parseInt(userData.followers || 0);
  const items = userData.peopleCard || [];
  const postUser = userData.UserCard || [];

  // Check if user can view content
  const canViewContent = 
    userData.account_status == "public" || 
    (followName !== "Follow" && followName !== "Requested") || 
    parseInt(user_id) == user?.id;

  // Self-following check (prevent following yourself)
  const isSelfProfile = user?.id == parseInt(user_id);
console.log(`current user : ${user?.id}`,user_id)
  // Loading state
  const isLoading = 
    isUserDataLoading || 
    isFollowLoading || 
    isFollowersLoading || 
    isCompletedLoading || 
    isAchieveLoading || 
    isVisitLoading;

  // Render achievement items in swiper
  const renderItems = ({ item, index }) => (
    <View style={{ height: hp(14), width: wp(85), marginRight: 10 }}>
      <CompletedChallenges
        item={item}
        index={index}
        currentUser={user?.id}
        user_id={user_id}
        fetchAchievementData={fetchAchievementData}
      />
    </View>
  );

  // Tab content rendering
  const FirstRoute = () => {
    return (
      <ScrollView 
        style={styles.contentContainer} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#6200EE"]}
            tintColor="#6200EE"
          />
        }
      >
        {badgeData?.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Badges</Text>
              {badgeData?.length > 3 && (
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              )}
            </View>
            <FlatList
              data={badgeData}
              horizontal
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ width: 15 }} />}
              renderItem={({ item }) => <BadgeListCard item={item} />}
              contentContainerStyle={{ paddingHorizontal: 5, paddingVertical: 10 }}
            />
          </View>
        )}

        {achieveData?.length > 0 && (
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Achievements</Text>
              {achieveData?.length > 3 && (
                <TouchableOpacity>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              )}
            </View>
            <SwiperFlatList
              showPagination
              data={achieveData}
              renderItem={renderItems}
              horizontal
              paginationDefaultColor="#E0E0E0"
              paginationActiveColor="#6200EE"
              paginationStyleItem={{
                width: 8,
                height: 8,
                borderRadius: 4,
                margin: 3,
                marginTop: 10,
              }}
              paginationStyleItemActive={{
                opacity: 1,
                width: 10,
                height: 10,
              }}
              paginationStyleItemInactive={{
                opacity: 0.5,
              }}
            />
          </View>
        )}

        <View style={styles.aboutSection}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            {userData.bio || "This user hasn't added a bio yet."}
          </Text>
        </View>
      </ScrollView>
    );
  };

  const SecondRoute = () => {
    return (
      <View style={styles.contentContainer}>
        {items?.length > 0 ? (
          <FlatList
            data={items}
            keyExtractor={(item, index) => `certificate-${index}`}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#6200EE"]}
                tintColor="#6200EE"
              />
            }
            ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
            renderItem={({ index, item }) => (
              <CertificateList
                item={item}
                index={index}
                user_id={user?.id}
                arena={null}
              />
            )}
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.emptyStateContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#6200EE"]}
                tintColor="#6200EE"
              />
            }
          >
            <Ionicons name="document-text-outline" size={60} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>No certificates yet</Text>
          </ScrollView>
        )}
      </View>
    );
  };

  const SecondRoute2 = () => {
    return (
      <View style={styles.contentContainer}>
        {postUser?.length > 0 ? (
          <FlatList
            data={postUser}
            keyExtractor={(item, index) => `post-${index}`}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#6200EE"]}
                tintColor="#6200EE"
              />
            }
            ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
            renderItem={({ index, item }) => (
              <UserPosts
                item={item}
                index={index}
                user_id={user?.id}
                arena={null}
              />
            )}
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.emptyStateContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#6200EE"]}
                tintColor="#6200EE"
              />
            }
          >
            <Ionicons name="images-outline" size={60} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>No posts yet</Text>
          </ScrollView>
        )}
      </View>
    );
  };

  const ThirdRoute = () => {
    return (
      <View style={styles.contentContainer}>
        {completedVisit?.length > 0 ? (
          <FlatList
            data={completedVisit}
            keyExtractor={(item, index) => `visit-${index}`}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#6200EE"]}
                tintColor="#6200EE"
              />
            }
            ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
            renderItem={({ index, item }) => <TaskHomeCard item={item} />}
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.emptyStateContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#6200EE"]}
                tintColor="#6200EE"
              />
            }
          >
            <Ionicons name="location-outline" size={60} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>No places visited yet</Text>
          </ScrollView>
        )}
      </View>
    );
  };

  const FourthRoute = () => {
    return (
      <View style={styles.contentContainer}>
        {completedData?.length > 0 ? (
          <FlatList
            data={completedData}
            keyExtractor={(item, index) => `challenge-${index}`}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#6200EE"]}
                tintColor="#6200EE"
              />
            }
            ItemSeparatorComponent={() => <View style={{ height: 15 }} />}
            renderItem={({ item, index }) => (
              <CompletedChallenges
                item={item}
                index={index}
                currentUser={user?.id}
                user_id={user_id}
                fetchAchievementData={fetchAchievementData}
              />
            )}
          />
        ) : (
          <ScrollView
            contentContainerStyle={styles.emptyStateContainer}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={["#6200EE"]}
                tintColor="#6200EE"
              />
            }
          >
            <Ionicons name="trophy-outline" size={60} color="#CCCCCC" />
            <Text style={styles.emptyStateText}>No challenges completed yet</Text>
          </ScrollView>
        )}
      </View>
    );
  };

  // Tab content router
  const renderContent = () => {
    switch (activeRouteIndex) {
      case "first":
        return <FirstRoute />;
      case "second":
        return <SecondRoute />;
      case "fifth":
        return <SecondRoute2 />;
      case "third":
        return <ThirdRoute />;
      case "fourth":
        return <FourthRoute />;
      default:
        return <FirstRoute />;
    }
  };

  // Loading state
  if (isLoading && !userData.name) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6200EE" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <Provider>
      <View style={styles.container}>
        <StatusBar style="light" />
        
        {/* Profile Header Section */}
        <View style={styles.headerContainer}>
          <LinearGradient
            colors={["#37789C", "#8B2C4E"]}
            style={styles.gradientBackground}
            start={[0, 0]}
            end={[1, 0]}
          />
          
          {/* Top Bar with Back Button */}
          <View style={styles.topBar}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="chevron-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerActions}>
              {user?.id == parseInt(user_id) && (
                <TouchableOpacity 
                  style={styles.editButton}
                  onPress={() => navigation.navigate("EditProfile", { user_id: user.id })}
                >
                  <FontAwesome name="edit" size={18} color="white" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          {/* User Profile Basic Info */}
          <View style={styles.profileInfoContainer}>
            <View style={styles.avatarContainer}>
              {userData.user_image?.length > 0 ? (
                <Image
                  source={{ uri: `${baseImgURL + userData.user_image}` }}
                  style={styles.avatarImage}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {userData.first_character || userData.name?.charAt(0) || "?"}
                  </Text>
                </View>
              )}
              
              {userData.streak_day == "yes" && (
                <View style={styles.streakBadge}>
                  <LottieView
                    source={require("../assets/animation/fire.json")}
                    style={{ width: 24, height: 24 }}
                    autoPlay
                    loop
                  />
                </View>
              )}
            </View>
            
            <View style={styles.userInfoText}>
              <View style={styles.nameAndLevel}>
                <Text style={styles.userName}>{userData.name || "User"}</Text>
                <View style={styles.levelBadge}>
                  <Text style={styles.levelText}>Lv. {userData.level || 1}</Text>
                </View>
              </View>
              
              {/* Stats Row */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userData.friends_count || 0}</Text>
                  <Text style={styles.statLabel}>Friends</Text>
                </View>
                <View style={styles.statSeparator} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{userData.following || 0}</Text>
                  <Text style={styles.statLabel}>Following</Text>
                </View>
                <View style={styles.statSeparator} />
                <View style={styles.statItem}>
                  <Text style={styles.statValue}>{count}</Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View>
              </View>
            </View>
          </View>
          
          {/* Follow Button Row - Only show if not viewing own profile */}
          {user && !isSelfProfile && (
            <View style={styles.followButtonContainer}>
              <TouchableOpacity
                style={[
                  styles.followButton,
                  followName == "Following" || followName == "Friends" 
                    ? styles.followingButton 
                    : followName == "Requested" 
                      ? styles.requestedButton 
                      : {}
                ]}
                onPress={handleToggleFollow}
                disabled={toggleFollowMutation.isLoading}
              >
                {toggleFollowMutation.isLoading ? (
                  <ActivityIndicator size="small" color="white" style={{ marginRight: 8 }} />
                ) : followName == "Following" || followName == "Friends" ? (
                  <Ionicons name="checkmark" size={16} color="white" style={styles.followIcon} />
                ) : followName == "Requested" ? (
                  <Ionicons name="time-outline" size={16} color="white" style={styles.followIcon} />
                ) : (
                  <Ionicons name="person-add" size={16} color="white" style={styles.followIcon} />
                )}
                <Text style={styles.followButtonText}>{followName}</Text>
              </TouchableOpacity>
            </View>
          )}
          
          {/* Account Settings Switch (if viewing own profile) */}
          {user?.id == parseInt(user_id) && (
            <View style={styles.accountPrivacyContainer}>
              <View style={styles.accountPrivacyInfo}>
                <Feather name={isSwitchOn ? "lock" : "globe"} size={18} color="white" />
                <Text style={styles.accountPrivacyText}>
                  {isSwitchOn ? "Private Account" : "Public Account"}
                </Text>
              </View>
              <Switch
                value={isSwitchOn}
                onValueChange={() => setShowAlert(true)}
                color="#6200EE"
                disabled={toggleAccountMutation.isLoading}
              />
            </View>
          )}
        </View>
        
        {/* Tab Navigation */}
        {canViewContent && (
          <View style={styles.tabContainer}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabScrollContainer}
            >
              {routes.map((route) => (
                <TouchableOpacity
                  key={route.key}
                  style={[
                    styles.tabButton,
                    activeRouteIndex == route.key && styles.activeTabButton
                  ]}
                  onPress={() => setActiveRouteIndex(route.key)}
                >
                  <Ionicons 
                    name={route.icon} 
                    size={20} 
                    color={activeRouteIndex == route.key ? "#6200EE" : "#757575"} 
                  />
                  <Text 
                    style={[
                      styles.tabButtonText,
                      activeRouteIndex == route.key && styles.activeTabButtonText
                    ]}
                  >
                    {route.title}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        {/* Content Area */}
        {canViewContent ? (
          renderContent()
        ) : (
          <View style={styles.privateAccountContainer}>
            <Ionicons name="lock-closed" size={50} color="#CCCCCC" />
            <Text style={styles.privateAccountTitle}>Private Account</Text>
            <Text style={styles.privateAccountText}>
              Follow this account to see their content
            </Text>
          </View>
        )}
        
        {/* Account Privacy Alert Dialog */}
        <AwesomeAlert
          show={showAlert}
          showProgress={toggleAccountMutation.isLoading}
          title="Change Account Privacy"
          message={`Switch to ${isSwitchOn ? "public" : "private"} account?`}
          closeOnTouchOutside={true}
          closeOnHardwareBackPress={true}
          showCancelButton={true}
          showConfirmButton={true}
          cancelText="Cancel"
          confirmText="Change"
          confirmButtonColor="#6200EE"
          onCancelPressed={() => setShowAlert(false)}
          onConfirmPressed={handleToggleAccount}
          titleStyle={styles.alertTitle}
          messageStyle={styles.alertMessage}
          cancelButtonTextStyle={styles.alertCancelButtonText}
          confirmButtonTextStyle={styles.alertConfirmButtonText}
        />
      </View>
    </Provider>
  );
};

export default OtherUserScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9F9",
  },
  
  // Loading state styles
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9F9F9",
  },
  loadingText: {
    marginTop: 12,
    fontSize: hp(1.8),
    color: "#6200EE",
    fontFamily: "raleway-semibold",
  },
  
  // Header styles
  headerContainer: {
    paddingBottom: 16,
  },
  gradientBackground: {
    position: "absolute",
    width: "100%",
    height: "100%",
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
  },
  topBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: 48,
    paddingBottom: 8,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  
  // Profile info section
  profileInfoContainer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    flexDirection: "row",
    alignItems: "center",
  },
  avatarContainer: {
    position: "relative",
    marginRight: 20,
  },
  avatarImage: {
    width: wp(22),
    height: wp(22),
    borderRadius: wp(11),
    borderWidth: 3,
    borderColor: "white",
  },
  avatarPlaceholder: {
    width: wp(22),
    height: wp(22),
    borderRadius: wp(11),
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "white",
  },
  avatarText: {
    fontSize: wp(9),
    color: "white",
    fontFamily: "raleway-bold",
  },
  streakBadge: {
    position: "absolute",
    bottom: -5,
    right: -5,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },
  userInfoText: {
    flex: 1,
  },
  nameAndLevel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
  },
  userName: {
    fontSize: hp(2.4),
    color: "white",
    fontFamily: "raleway-bold",
    marginRight: 10,
  },
  levelBadge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  levelText: {
    fontSize: hp(1.6),
    color: "white",
    fontFamily: "raleway-semibold",
  },
  
  // Stats row
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  statItem: {
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: hp(2.2),
    color: "white",
    fontFamily: "raleway-bold",
    marginBottom: 4,
  },
  statLabel: {
    fontSize: hp(1.5),
    color: "rgba(255, 255, 255, 0.8)",
    fontFamily: "raleway-medium",
  },
  statSeparator: {
    width: 1,
    height: "80%",
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    alignSelf: "center",
  },

  // Follow buttons
  followButtonContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 12
  },
  followButton: {
    flex: 2,
    backgroundColor: "#6200EE",
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  followingButton: {
    backgroundColor: "#3e2465",
  },
  requestedButton: {
    backgroundColor: "#4A4A4A",
  },
  followIcon: {
    marginRight: 6,
  },
  followButtonText: {
    color: "white",
    fontSize: hp(1.7),
    fontFamily: "raleway-semibold",
  },
  messageButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  messageButtonText: {
    color: "white",
    fontSize: hp(1.7),
    fontFamily: "raleway-semibold",
  },

  // Account privacy toggle
  accountPrivacyContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 16,
    paddingHorizontal: 20,
  },
  accountPrivacyInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  accountPrivacyText: {
    fontSize: hp(1.7),
    color: "white",
    fontFamily: "raleway-semibold",
  },

  // XP Progress section
  progressSection: {
    paddingHorizontal: 20,
    marginTop: 16,
  },
  xpTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  currentXpText: {
    fontSize: hp(1.5),
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "raleway-medium",
  },
  totalXpText: {
    fontSize: hp(1.8),
    color: "white",
    fontFamily: "raleway-bold",
  },
  nextXpText: {
    fontSize: hp(1.5),
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "raleway-medium",
  },
  progressBarContainer: {
    marginBottom: 8,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  levelTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  currentLevelText: {
    fontSize: hp(1.5),
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "raleway-medium",
  },
  nextLevelText: {
    fontSize: hp(1.5),
    color: "rgba(255, 255, 255, 0.7)",
    fontFamily: "raleway-medium",
  },

  // Tab navigation
  tabContainer: {
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  tabScrollContainer: {
    paddingVertical: 8,
  },
  tabButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
  },
  activeTabButton: {
    backgroundColor: "rgba(98, 0, 238, 0.1)",
  },
  tabButtonText: {
    marginLeft: 6,
    fontSize: hp(1.6),
    color: "#757575",
    fontFamily: "raleway-semibold",
  },
  activeTabButtonText: {
    color: "#6200EE",
  },

  // Content containers
  contentContainer: {
    flex: 1,
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  sectionCard: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: hp(2),
    fontFamily: "raleway-bold",
    color: "#333333",
  },
  seeAllText: {
    fontSize: hp(1.6),
    color: "#6200EE",
    fontFamily: "raleway-semibold",
  },
  aboutSection: {
    backgroundColor: "white",
    borderRadius: 16,
    marginBottom: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  aboutText: {
    fontSize: hp(1.7),
    lineHeight: hp(2.5),
    color: "#555555",
    marginTop: 8,
    fontFamily: "raleway-regular",
  },
  listContainer: {
    paddingBottom: 20,
  },

  // Empty states
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: hp(1.8),
    color: "#757575",
    fontFamily: "raleway-medium",
    marginTop: 12,
  },
  privateAccountContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  privateAccountTitle: {
    fontSize: hp(2.2),
    fontFamily: "raleway-bold",
    color: "#333333",
    marginTop: 16,
  },
  privateAccountText: {
    fontSize: hp(1.8),
    fontFamily: "raleway-regular",
    color: "#757575",
    textAlign: "center",
    marginTop: 8,
  },

  // Alert styles
  alertTitle: {
    fontSize: hp(2),
    fontFamily: "raleway-bold",
    color: "#333333",
  },
  alertMessage: {
    fontSize: hp(1.8),
    fontFamily: "raleway-regular",
    color: "#555555",
  },
  alertCancelButtonText: {
    fontSize: hp(1.8),
    fontFamily: "raleway-semibold",
  },
  alertConfirmButtonText: {
    fontSize: hp(1.8),
    fontFamily: "raleway-semibold",
    color: "white",
  },
});