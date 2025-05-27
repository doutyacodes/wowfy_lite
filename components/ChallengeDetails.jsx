// ChallengeDetails.js
import { ResizeMode, Video } from "expo-av";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View
} from "react-native";

import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { Modal, PaperProvider, Portal, RadioButton } from "react-native-paper";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";
import { baseImgURL, baseURL, baseVidUrl } from "../backend/baseData";

import TopBar from "./AppComponents/TopBar";
import CertificateList from "./CertificateList";

const ChallengeDetails = ({ route }) => {
  const navigation = useNavigation();
  const { challenge, completeOne = null } = route.params;
  const scrollY = new Animated.Value(0);
  const queryClient = useQueryClient();

  const [user, setUser] = useState(null);
  const [checked, setChecked] = useState("latest");
  const [checked2, setChecked2] = useState("latest");
  const [visible, setVisible] = useState(false);
  const [visible2, setVisible2] = useState(false);
  const [loadingNext, setLoadingNext] = useState(false);

  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  const showModal2 = () => setVisible2(true);
  const hideModal2 = () => setVisible2(false);

  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [hp(25), hp(15)],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.4],
    extrapolate: "clamp",
  });

  const titleOpacity = scrollY.interpolate({
    inputRange: [0, 60, 120],
    outputRange: [1, 0.3, 0],
    extrapolate: "clamp",
  });

  const changeModal = (value) => {
    setChecked(value);
    hideModal();
  };

  const changeModal2 = (value) => {
    setChecked2(value);
    hideModal2();
  };

  // Fetch user data
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

  // Get challenge details
  const { data: challengeDetails, isLoading: isLoadingDetails } = useQuery({
    queryKey: ["challengeDetails", challenge.challenge_id, user?.id],
    queryFn: async () => {
      const response = await axios.get(
        `${baseURL}/getDetailsInnerpage.php?challenge_id=${challenge.challenge_id}&userId=${user.id}`
      );
      return response.data;
    },
    enabled: !!user?.id && !!challenge.challenge_id,
  });

  // Get leaderboard data
  const { data: leaderboardData } = useQuery({
    queryKey: ["leaderboard", challenge.challenge_id, challenge.frequency],
    queryFn: async () => {
      const urlData =
        challenge.frequency == "contest"
          ? "getLeaderContest"
          : "getLeaderData";
      const response = await axios.get(
        `${baseURL}/${urlData}.php?challenge_id=${challenge.challenge_id}`
      );
      return response.data.challenges || [];
    },
    enabled: !!challenge.challenge_id,
  });

  // Get task IDs
  const { data: taskIdData } = useQuery({
    queryKey: ["taskId", challenge.challenge_id],
    queryFn: async () => {
      const response = await axios.get(
        `${baseURL}/getOneTaskId.php?challenge_id=${challenge.challenge_id}`
      );
      return response.data;
    },
    enabled: !!challenge.challenge_id,
  });

  // Get task details (conditional)
  const { data: taskDetails } = useQuery({
    queryKey: [
      "singleTask",
      challenge.challenge_id,
      taskIdData?.task_id,
      user?.id,
    ],
    queryFn: async () => {
      const response = await axios.get(
        `${baseURL}/getOneTasks.php?challenge_id=${challenge.challenge_id}&task_id=${taskIdData.task_id}&user_id=${user?.id}`
      );
      return response.data;
    },
    enabled:
      !!taskIdData?.task_id &&
      challenge.visit == "yes" &&
      !!challenge.challenge_id &&
      !!user?.id,
  });

  // Get rewards (conditional)
  const { data: rewardsData } = useQuery({
    queryKey: ["rewards", challenge.challenge_id],
    queryFn: async () => {
      const response = await axios.get(
        `${baseURL}/getRewards.php?challenge_id=${challenge.challenge_id}`
      );
      return response.data;
    },
    enabled: !!challenge.challenge_id && challenge.rewards !== "no",
  });

  // Get people data
  const { data: peopleData, refetch: refetchPeople } = useQuery({
    queryKey: ["people", challenge.challenge_id, checked, user?.id],
    queryFn: async () => {
      const response = await axios.get(
        `${baseURL}/getPeople.php?challenge_id=${challenge.challenge_id}&sort=${checked}&userId=${user.id}`
      );
      return response.data || [];
    },
    enabled: !!challenge.challenge_id && !!user?.id,
  });

  // Get contest posts (conditional)
  const { data: contestData, refetch: refetchContest } = useQuery({
    queryKey: ["contestPosts", challenge.challenge_id, checked2],
    queryFn: async () => {
      const response = await axios.get(
        `${baseURL}/getContestPost.php?challenge_id=${challenge.challenge_id}&sort=${checked2}`
      );
      return response.data || [];
    },
    enabled: !!challenge.challenge_id && challenge.frequency == "contest",
  });

  // Effect hooks to refetch data when sorting changes
  useEffect(() => {
    if (checked && challenge.challenge_id && user?.id) {
      refetchPeople();
    }
  }, [checked, challenge.challenge_id, user?.id]);

  useEffect(() => {
    if (
      checked2 &&
      challenge.challenge_id &&
      challenge.frequency == "contest"
    ) {
      refetchContest();
    }
  }, [checked2, challenge.challenge_id, challenge.frequency]);

  const handleNext = async () => {
    try {
      setLoadingNext(true);
      if (
        (challenge.visit == "yes" || challenge.single_task == "yes") &&
        taskIdData?.task_id
      ) {
        navigation.navigate("VideoScreen", {
          tasks: taskIdData,
          pageId: challenge.page_id,
          challenge: challenge,
          userSId: user.id,
        });
      } else {
        navigation.navigate("ChallengesList", {
          pageId: challenge.challenge_id,
          selectedMovie: challengeDetails,
          challenge: challenge,
        });
      }
    } catch (error) {
      console.error("Navigation error:", error);
    } finally {
      setLoadingNext(false);
    }
  };

  // Tab content components
  const RulesRoute = () => (
    <ScrollView
      contentContainerStyle={styles.rulesContentContainer}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.ruleCard}>
        <Text style={styles.cardTitle}>{challenge.title}</Text>

        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Description</Text>
          <Text style={styles.description}>{challenge.description}</Text>
        </View>

        <View style={styles.entryFeeCard}>
          <View style={styles.feeHeader}>
            <Ionicons name="ticket-outline" size={18} color="#6366f1" />
            <Text style={styles.feeTitle}>ENTRY FEE</Text>
          </View>
          <Text style={styles.feeAmount}>
            {challenge.entry_points == 0
              ? "Free"
              : `${challenge.entry_points} Points`}
          </Text>
        </View>

        <View style={styles.prizeCard}>
          <View style={styles.feeHeader}>
            <Ionicons name="trophy-outline" size={18} color="#6366f1" />
            <Text style={styles.feeTitle}>PRIZE</Text>
          </View>
          <Text style={styles.prizeAmount}>{challenge.reward_points}</Text>
        </View>
      </View>

      {rewardsData?.title && (
        <View style={styles.rewardsSection}>
          <Text style={styles.rewardsTitle}>{rewardsData.title}</Text>

          <Text style={styles.rewardsSubtitle}>Description</Text>
          <Text style={styles.rewardsDescription}>
            {rewardsData.description}
          </Text>
        </View>
      )}
    </ScrollView>
  );

  const PeopleRoute = () => (
    <PaperProvider style={styles.tabContent}>
      {!peopleData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <>
          {peopleData?.length > 0 && (
            <View style={styles.sortHeaderContainer}>
              <TouchableOpacity style={styles.sortButton} onPress={showModal}>
                <Text style={styles.sortButtonText}>
                  {checked == "latest" ? "Latest" : "Most Liked"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6366f1" />
              </TouchableOpacity>

              <Portal>
                <Modal
                  visible={visible}
                  onDismiss={hideModal}
                  contentContainerStyle={styles.modalContainer}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Sort By</Text>
                    <TouchableOpacity onPress={hideModal}>
                      <Ionicons name="close" size={22} color="#374151" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => changeModal("latest")}
                  >
                    <RadioButton
                      value="latest"
                      status={checked == "latest" ? "checked" : "unchecked"}
                      color="#6366f1"
                      onPress={() => changeModal("latest")}
                    />
                    <Text style={styles.modalOptionText}>Latest</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => changeModal("likes")}
                  >
                    <RadioButton
                      value="likes"
                      status={checked == "likes" ? "checked" : "unchecked"}
                      color="#6366f1"
                      onPress={() => changeModal("likes")}
                    />
                    <Text style={styles.modalOptionText}>Most Likes</Text>
                  </TouchableOpacity>
                </Modal>
              </Portal>
            </View>
          )}

          <FlatList
            data={peopleData}
            keyExtractor={(item, index) => `person-${index}`}
            contentContainerStyle={styles.listContainer}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={60} color="#e0e0e0" />
                <Text style={styles.emptyPrimaryText}>No Participants Yet</Text>
                <Text style={styles.emptySecondaryText}>
                  Be the first to join this challenge!
                </Text>
              </View>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            renderItem={({ index, item }) => (
              <CertificateList
                key={index}
                item={item}
                index={index}
                user_id={user?.id}
                arena={null}
              />
            )}
          />
        </>
      )}
    </PaperProvider>
  );

  const EntriesRoute = () => (
    <PaperProvider style={styles.tabContent}>
      {!contestData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : (
        <>
          {contestData?.length > 0 && (
            <View style={styles.sortHeaderContainer}>
              <TouchableOpacity style={styles.sortButton} onPress={showModal2}>
                <Text style={styles.sortButtonText}>
                  {checked2 == "latest" ? "Latest" : "Most Liked"}
                </Text>
                <Ionicons name="chevron-down" size={16} color="#6366f1" />
              </TouchableOpacity>

              <Portal>
                <Modal
                  visible={visible2}
                  onDismiss={hideModal2}
                  contentContainerStyle={styles.modalContainer}
                >
                  <View style={styles.modalHeader}>
                    <Text style={styles.modalTitle}>Sort By</Text>
                    <TouchableOpacity onPress={hideModal2}>
                      <Ionicons name="close" size={22} color="#374151" />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => changeModal2("latest")}
                  >
                    <RadioButton
                      value="latest"
                      status={checked2 == "latest" ? "checked" : "unchecked"}
                      color="#6366f1"
                      onPress={() => changeModal2("latest")}
                    />
                    <Text style={styles.modalOptionText}>Latest</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.modalOption}
                    onPress={() => changeModal2("likes")}
                  >
                    <RadioButton
                      value="likes"
                      status={checked2 == "likes" ? "checked" : "unchecked"}
                      color="#6366f1"
                      onPress={() => changeModal2("likes")}
                    />
                    <Text style={styles.modalOptionText}>Most Likes</Text>
                  </TouchableOpacity>
                </Modal>
              </Portal>
            </View>
          )}

          {contestData?.length > 0 ? (
            <FlatList
              data={contestData}
              numColumns={3}
              keyExtractor={(item, index) => `media-${index}`}
              contentContainerStyle={styles.entriesContainer}
              showsVerticalScrollIndicator={false}
              renderItem={({ index, item }) => (
                <TouchableOpacity
                  style={styles.mediaItem}
                  onPress={() =>
                    navigation.navigate("ImageList", {
                      indexNumber: index,
                      challenge_id: challenge.challenge_id,
                      sort: checked2,
                    })
                  }
                >
                  {item.type == "video" ? (
                    <View style={styles.mediaItemContent}>
                      <Video
                        source={{ uri: `${baseVidUrl + item.media_path}` }}
                        style={styles.mediaPreview}
                        resizeMode={ResizeMode.COVER}
                      />
                      <View style={styles.videoIndicator}>
                        <Ionicons name="play" size={20} color="#ffffff" />
                      </View>
                    </View>
                  ) : (
                    <Image
                      source={{ uri: `${baseImgURL + item.media_path}` }}
                      style={styles.mediaPreview}
                    />
                  )}
                </TouchableOpacity>
              )}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Ionicons name="images-outline" size={60} color="#e0e0e0" />
              <Text style={styles.emptyPrimaryText}>No Entries Yet</Text>
              <Text style={styles.emptySecondaryText}>
                Be the first to submit your entry!
              </Text>
            </View>
          )}
        </>
      )}
    </PaperProvider>
  );

  const LeaderboardRoute = () => (
    <View style={styles.leaderboardContainer}>
      <View style={styles.leaderboardHeader}>
        <View style={styles.leaderboardMeta}>
          <Text style={styles.leaderboardMetaText}>
            {leaderboardData?.length > 0 ? leaderboardData?.length : 0}{" "}
            Participants
          </Text>
        </View>

        <View style={styles.leaderboardColumnHeaders}>
          <Text style={styles.leaderboardHeaderText}>Ranking</Text>
          <Text style={styles.leaderboardHeaderText}>
            {challenge.frequency == "contest" ? "Likes" : "Points"}
          </Text>
        </View>
      </View>

      {!leaderboardData ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
        </View>
      ) : leaderboardData?.length > 0 ? (
        <FlatList
          data={leaderboardData}
          keyExtractor={(item, index) => `leader-${index}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ index, item }) => (
            <View
              style={[
                styles.leaderItem,
                index < 3 ? styles.topRankerItem : null,
              ]}
            >
              <View style={styles.leaderInfoContainer}>
                <View
                  style={[
                    styles.rankCircle,
                    index == 0 ? styles.firstRank : null,
                    index == 1 ? styles.secondRank : null,
                    index == 2 ? styles.thirdRank : null,
                  ]}
                >
                  <Text
                    style={[
                      styles.rankNumber,
                      index < 3 ? styles.topRankNumber : null,
                    ]}
                  >
                    {item.ranking}
                  </Text>
                </View>

                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>{item.first_character}</Text>
                </View>

                <View style={styles.participantInfo}>
                  <Text style={styles.participantName}>{item.name}</Text>
                  {challenge.frequency !== "contest" && (
                    <Text style={styles.timeSpent}>
                      Spent {item.time_spent}
                    </Text>
                  )}
                </View>
              </View>

              <View style={styles.pointsContainer}>
                <Text style={styles.pointsText}>{item.points}</Text>
              </View>
            </View>
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Ionicons name="trophy-outline" size={60} color="#e0e0e0" />
          <Text style={styles.emptyPrimaryText}>Leaderboard Empty</Text>
          <Text style={styles.emptySecondaryText}>
            Complete the challenge to rank!
          </Text>
        </View>
      )}
    </View>
  );

  // Tab configuration
  const renderScene = SceneMap({
    rules: RulesRoute,
    ...(challenge.frequency == "contest" && { entries: EntriesRoute }),
    people: PeopleRoute,
    ...(typeof challenge.visit == "undefined" || challenge.visit == "no"
      ? { leaderboard: LeaderboardRoute }
      : {}),
  });

  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "rules", title: "Rules" },
    ...(challenge.frequency == "contest"
      ? [{ key: "entries", title: "Entries" }]
      : []),
    { key: "people", title: "People" },
    ...(typeof challenge.visit == "undefined" || challenge.visit == "no"
      ? [{ key: "leaderboard", title: "Leaderboard" }]
      : []),
  ]);

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      indicatorStyle={styles.tabIndicator}
      style={styles.tabBar}
      scrollEnabled={routes?.length > 3}
      tabStyle={{ width: layout.width / Math.min(routes?.length, 3) }}
      renderLabel={({ route, focused }) => (
        <Text style={[styles.tabLabel, focused ? styles.tabLabelFocused : {}]}>
          {route.title}
        </Text>
      )}
    />
  );

  // Show loading state
  if (isLoadingDetails || !challengeDetails?.banner) {
    return (
      <View style={styles.fullLoadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Loading challenge details...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Animated.View style={[styles.headerContainer, { height: headerHeight }]}>
        <Animated.View
          style={[styles.bannerContainer, { opacity: headerOpacity }]}
        >
          <Image
            source={{ uri: `${baseImgURL + challengeDetails.banner}` }}
            style={styles.bannerImage}
          />
          <LinearGradient
            colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.7)"]}
            style={styles.bannerGradient}
          />
        </Animated.View>

        <View style={styles.topBarContainer}>
          <TopBar color={"white"} user={user} />
        </View>

        <Animated.View
          style={[styles.challengeInfoContainer, { opacity: titleOpacity }]}
        >
          <View style={styles.profileCircle}>
            {challengeDetails.image?.length > 0 && (
              <Image
                source={{ uri: `${baseImgURL + challengeDetails.image}` }}
                style={styles.profileImage}
              />
            )}
          </View>

          <View style={styles.challengeTitle}>
            <Text style={styles.titleText} numberOfLines={2}>
              {challengeDetails.title}
            </Text>
          </View>
        </Animated.View>
      </Animated.View>

      <View style={styles.tabViewContainer}>
        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={renderTabBar}
          swipeEnabled={true}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            { useNativeDriver: false }
          )}
        />
      </View>

      {!completeOne && (
        <View style={styles.nextButtonContainer}>
          <TouchableOpacity
            onPress={handleNext}
            disabled={loadingNext}
            style={styles.nextButton}
          >
            {loadingNext ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <>
                <Text style={styles.nextButtonText}>NEXT</Text>
                <Ionicons name="arrow-forward" size={20} color="#ffffff" />
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  fullLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f9fafb",
  },
  loadingText: {
    marginTop: hp(2),
    fontSize: hp(1.8),
    fontFamily: "raleway",
    color: "#6b7280",
  },
  headerContainer: {
    width: "100%",
    overflow: "hidden",
  },
  bannerContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  bannerImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  bannerGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  topBarContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  challengeInfoContainer: {
    position: "absolute",
    bottom: 15,
    left: 15,
    flexDirection: "row",
    alignItems: "center",
  },
  profileCircle: {
    width: wp(16),
    height: wp(16),
    borderRadius: wp(8),
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#f97316",
    marginBottom: 20,
  },
  profileImage: {
    width: wp(16) - 4,
    height: wp(16) - 4,
    borderRadius: wp(8) - 2,
  },
  challengeTitle: {
    marginLeft: wp(3),
    flex: 1,
    paddingRight: wp(5),
  },
  titleText: {
    color: "white",
    fontSize: hp(2.4),
    fontFamily: "raleway-bold",
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  tabViewContainer: {
    flex: 1,
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    marginTop: -20,
    overflow: "hidden",
  },
  tabBar: {
    backgroundColor: "white",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  tabIndicator: {
    backgroundColor: "#6366f1",
    height: 3,
    borderRadius: 3,
  },
  tabLabel: {
    fontSize: hp(1.7),
    fontFamily: "raleway-bold",
    color: "#94a3b8",
    textTransform: "none",
  },
  tabLabelFocused: {
    color: "#6366f1",
  },
  tabContent: {
    flex: 1,
    backgroundColor: "white",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: hp(4),
  },

  // Rules tab styles
  rulesContentContainer: {
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
    paddingBottom: hp(6),
  },
  ruleCard: {
    backgroundColor: "white",
    padding: wp(4),
    paddingTop: hp(1),
  },
  cardTitle: {
    fontSize: hp(3),
    fontFamily: "raleway-boldItalic",
    color: "#111827",
    marginVertical: hp(3),
    textAlign: "center",
  },
  sectionContainer: {
    marginBottom: hp(3),
  },
  sectionTitle: {
    fontSize: hp(2),
    fontFamily: "raleway-bold",
    color: "#374151",
    marginBottom: hp(1),
  },
  description: {
    fontSize: hp(1.8),
    fontFamily: "raleway",
    color: "#6b7280",
    lineHeight: hp(2.5),
  },
  entryFeeCard: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: hp(2),
    marginBottom: hp(3),
  },
  feeHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(1),
  },
  feeTitle: {
    fontSize: hp(1.8),
    fontFamily: "raleway-bold",
    color: "#4b5563",
    marginLeft: wp(2),
  },
  feeAmount: {
    fontSize: hp(3.2),
    fontFamily: "raleway-bold",
    color: "#111827",
  },
  prizeCard: {
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: hp(2),
    marginBottom: hp(3),
  },
  prizeAmount: {
    fontSize: hp(3.2),
    fontFamily: "raleway-bold",
    color: "#111827",
  },
  rewardsSection: {
    marginTop: hp(2),
    padding: wp(4),
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  rewardsTitle: {
    fontSize: hp(2.4),
    fontFamily: "raleway-bold",
    color: "#111827",
    marginBottom: hp(2),
  },
  rewardsSubtitle: {
    fontSize: hp(1.8),
    fontFamily: "raleway-bold",
    color: "#4b5563",
    marginBottom: hp(1),
  },
  rewardsDescription: {
    fontSize: hp(1.8),
    fontFamily: "raleway",
    color: "#6b7280",
    lineHeight: hp(2.5),
  },

  // People tab styles
  listContainer: {
    paddingHorizontal: wp(5),
    paddingTop: hp(1),
    paddingBottom: hp(6),
  },
  sortHeaderContainer: {
    flexDirection: "row",
    justifyContent: "flex-end",
    padding: wp(5),
    paddingBottom: hp(1),
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
    borderRadius: 16,
  },
  sortButtonText: {
    fontSize: hp(1.6),
    fontFamily: "raleway-bold",
    color: "#6366f1",
    marginRight: wp(1),
  },
  modalContainer: {
    margin: wp(5),
    backgroundColor: "white",
    padding: hp(2),
    borderRadius: 12,
    elevation: 5,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(2),
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  modalTitle: {
    fontSize: hp(2),
    fontFamily: "raleway-bold",
    color: "#111827",
  },
  modalOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: hp(1.2),
  },
  modalOptionText: {
    fontSize: hp(1.8),
    fontFamily: "raleway",
    color: "#374151",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: hp(6),
  },
  emptyPrimaryText: {
    marginTop: hp(2),
    fontSize: hp(2),
    fontFamily: "raleway-bold",
    color: "#374151",
  },
  emptySecondaryText: {
    marginTop: hp(1),
    fontSize: hp(1.6),
    fontFamily: "raleway",
    color: "#6b7280",
    textAlign: "center",
  },

  // Entries tab styles
  entriesContainer: {
    paddingHorizontal: wp(1),
    paddingTop: hp(1),
    paddingBottom: hp(6),
  },
  mediaItem: {
    width: wp(30),
    height: wp(30),
    margin: wp(1),
  },
  mediaItemContent: {
    width: "100%",
    height: "100%",
    position: "relative",
  },
  mediaPreview: {
    width: "100%",
    height: "100%",
    borderRadius: 4,
  },
  videoIndicator: {
    position: "absolute",
    right: 5,
    bottom: 5,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: "center",
    alignItems: "center",
  },

  // Leaderboard tab styles
  leaderboardContainer: {
    flex: 1,
    backgroundColor: "white",
    paddingHorizontal: wp(5),
    paddingTop: hp(2),
  },
  leaderboardHeader: {
    marginBottom: hp(2),
  },
  leaderboardMeta: {
    marginBottom: hp(1),
  },
  leaderboardMetaText: {
    fontSize: hp(1.5),
    fontFamily: "raleway-bold",
    color: "#9ca3af",
  },
  leaderboardColumnHeaders: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingBottom: hp(1),
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  leaderboardHeaderText: {
    fontSize: hp(1.7),
    fontFamily: "raleway-bold",
    color: "#6b7280",
  },
  leaderItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(2),
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  topRankerItem: {
    backgroundColor: "#f9fafb",
    borderWidth: 2,
  },
  leaderInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  rankCircle: {
    width: hp(3.2),
    height: hp(3.2),
    borderRadius: hp(1.6),
    backgroundColor: "#f1f5f9",
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(2),
  },
  firstRank: {
    backgroundColor: "#fef9c3",
    borderWidth: 1,
    borderColor: "#fbbf24",
  },
  secondRank: {
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#94a3b8",
  },
  thirdRank: {
    backgroundColor: "#fef2f2",
    borderWidth: 1,
    borderColor: "#f87171",
  },
  rankNumber: {
    fontSize: hp(1.6),
    fontFamily: "raleway-bold",
    color: "#64748b",
  },
  topRankNumber: {
    color: "#111827",
  },
  avatarContainer: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    backgroundColor: "#fb923c",
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(3),
  },
  avatarText: {
    fontSize: hp(2),
    fontFamily: "raleway-bold",
    color: "white",
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: hp(1.8),
    fontFamily: "raleway-bold",
    color: "#111827",
  },
  timeSpent: {
    fontSize: hp(1.5),
    fontFamily: "raleway",
    color: "#6b7280",
  },
  pointsContainer: {
    paddingHorizontal: wp(2),
  },
  pointsText: {
    fontSize: hp(2.2),
    fontFamily: "raleway-bold",
    color: "#111827",
  },

  // Next button
  nextButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "white",
    paddingHorizontal: wp(5),
    paddingVertical: hp(2),
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  nextButton: {
    backgroundColor: "#6366f1",
    borderRadius: 10,
    paddingVertical: hp(1.5),
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  nextButtonText: {
    fontSize: hp(2),
    fontFamily: "raleway-bold",
    color: "white",
    marginRight: wp(2),
  },
});

export default ChallengeDetails;
