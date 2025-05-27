import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  FlatList,
  Dimensions,
  StatusBar,
  TextInput,
  ActivityIndicator,
  Animated,
  Platform,
  SafeAreaView,
} from "react-native";
import {
  useIsFocused,
  useNavigation,
  useFocusEffect,
} from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Location from "expo-location";
import SwiperFlatList from "react-native-swiper-flatlist";
import { Dropdown } from "react-native-element-dropdown";
import { Divider, Modal, PaperProvider, Tooltip } from "react-native-paper";
import AwesomeAlert from "react-native-awesome-alerts";
import Toast from "react-native-toast-message";
import Toast2 from "react-native-root-toast";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import {
  Feather,
  Ionicons,
  MaterialCommunityIcons,
  Entypo,
  MaterialIcons,
  FontAwesome5,
} from "@expo/vector-icons";

import { baseImgURL, baseURL } from "../backend/baseData";
import { GOOGLE_MAPS_APIKEY } from "../constants";
import { airportData } from "../constants/dummyData";

import TopBar from "./AppComponents/TopBar";
import ChallengeHomeCardVisit from "./ChallengeHomeCardVisit";
import NewVisitCard from "./NewVisitCard";
import Posts from "./Posts";
import CertificateList from "./CertificateList";
import FoodDisplay from "./FoodDisplay";

// Animation imports
import Animated2, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
} from "react-native-reanimated";

// Define main category tabs
const MAIN_CATEGORIES = [
  { key: "Experience", title: "Experience", icon: "grid" },
  { key: "Challenges", title: "Challenges", icon: "target" },
  { key: "Certificates", title: "Certificates", icon: "star" },
];

// Define sub-category tabs
const SUB_CATEGORIES = [
  // {
  //   key: "fourth",
  //   title: "Places",
  //   parent: "Experience",
  //   icon: "trending-up",
  // },
  { key: "food", title: "Food", parent: "Experience", icon: "restaurant" },
  {
    key: "experience",
    title: "Activities",
    parent: "Experience",
    icon: "activity",
  },
  {
    key: "event",
    title: "Events",
    parent: "Experience",
    icon: "activity",
  },
  // { key: "itinerary", title: "Itinerary", parent: "Experience", icon: "map" },

  { key: "first", title: "Challenges", parent: "Challenges", icon: "target" },
  { key: "fifth", title: "Quiz", parent: "Challenges", icon: "help-circle" },
  {
    key: "seventh",
    title: "Completed",
    parent: "Challenges",
    icon: "check-circle",
  },

  {
    key: "second",
    title: "Certificates",
    parent: "Certificates",
    icon: "award",
  },
  { key: "third", title: "Posts", parent: "Certificates", icon: "image" },
];

// Component for the tab indicator
const TabIndicator = ({ width, position }) => {
  return (
    <Animated.View
      style={[
        styles.tabIndicator,
        {
          width,
          transform: [{ translateX: position }],
        },
      ]}
    />
  );
};

// Component for section header
const SectionHeader = ({ title, onSeeAllPress }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {onSeeAllPress && (
      <TouchableOpacity onPress={onSeeAllPress}>
        <Text style={styles.seeAllText}>See All</Text>
      </TouchableOpacity>
    )}
  </View>
);

// Component for empty state
const EmptyState = ({ icon, title, subtitle }) => (
  <View style={styles.emptyStateContainer}>
    <Feather name={icon} size={60} color="#DDD" />
    <Text style={styles.emptyStateTitle}>{title}</Text>
    <Text style={styles.emptyStateSubtitle}>{subtitle}</Text>
  </View>
);

// Component for onboarding/tutorial slide
const TutorialSlide = ({
  item,
  index,
  totalSlides,
  onNextPress,
  onFinishPress,
}) => (
  <View style={styles.tutorialContainer}>
    <View style={styles.tutorialContent}>
      {item.image && (
        <Image
          source={{ uri: `${baseImgURL + item.image}` }}
          style={styles.tutorialImage}
          resizeMode="contain"
        />
      )}
      {item.title && <Text style={styles.tutorialTitle}>{item.title}</Text>}
      {item.description && (
        <Text style={styles.tutorialDescription}>{item.description}</Text>
      )}
    </View>

    <View style={styles.tutorialButtonContainer}>
      {index + 1 == totalSlides ? (
        <TouchableOpacity style={styles.tutorialButton} onPress={onFinishPress}>
          <Text style={styles.tutorialButtonText}>Get Started</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={styles.tutorialButton}
          onPress={() => onNextPress(index)}
        >
          <Text style={styles.tutorialButtonText}>Next</Text>
          <Feather
            name="arrow-right"
            size={18}
            color="white"
            style={{ marginLeft: 8 }}
          />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

// Main component
const Moviehome = ({ route }) => {
  // Route params
  const { movieId } = route.params;
  const nowParam = route.params?.now ? route.params.now : null;

  // Navigation and focus state
  const navigation = useNavigation();
  const isFocused = useIsFocused();

  // Window dimensions
  const { width } = Dimensions.get("window");

  // References
  const swiperRef = useRef(null);
  const scrollViewRef = useRef(null);
  const tabScrollViewRef = useRef(null);
  const statsSection = () => (
    <Animated.View style={[styles.statsSection, { opacity: headerOpacity }]}>
      {/* <TouchableOpacity
        style={styles.stat}
        onPress={() => setShowFollowersModal(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.statValue}>{selectedMovie.followers || 0}</Text>
        <Text style={styles.statLabel}>Followers</Text>
      </TouchableOpacity>

      <View style={styles.statDivider} /> */}

      <View style={styles.stat}>
        <Text style={styles.statValue}>{totalPoints || 0}</Text>
        <Text style={styles.statLabel}>Points</Text>
      </View>

      <View style={styles.statDivider} />

      <View style={styles.stat}>
        <Text style={styles.statValue}>{selectedMovie.level || 1}</Text>
        <Text style={styles.statLabel}>Level</Text>
      </View>
    </Animated.View>
  );

  // 2. Add state for followers modal
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersData, setFollowersData] = useState([]);
  const [isLoadingFollowers, setIsLoadingFollowers] = useState(false);

  const fetchFollowers = async () => {
    if (!user || !movieId) return;

    setIsLoadingFollowers(true);
    try {
      const response = await axios.get(
        `${baseURL}/getPageFollowers.php?page_id=${movieId}&userId=${user.id}`
      );

      if (response.status == 200) {
        setFollowersData(response.data || []);
      }
    } catch (error) {
      console.error("Error fetching followers:", error);
      Toast.show({
        type: "error",
        text1: "Error",
        text2: "Could not load followers",
        position: "bottom",
      });
    } finally {
      setIsLoadingFollowers(false);
    }
  };

  // 4. Call the fetch function when modal opens
  useEffect(() => {
    if (showFollowersModal) {
      fetchFollowers();
    }
  }, [showFollowersModal]);
  const FollowersModal = () => (
    <Modal
      visible={showFollowersModal}
      transparent={true}
      animationType="slide"
      onRequestClose={() => setShowFollowersModal(false)}
    >
      <SafeAreaView style={styles.followerModalSafeArea}>
        <View style={styles.followerModalContainer}>
          {/* Modal Header */}
          {/* <View style={styles.followerModalHeader}>
            <Text style={styles.followerModalTitle}>Followers</Text>
            <TouchableOpacity
              onPress={() => setShowFollowersModal(false)}
              style={styles.followerModalClose}
            >
              <Feather name="x" size={24} color="#333" />
            </TouchableOpacity>
          </View> */}

          {/* Divider */}
          {/* <View style={styles.followerModalDivider} /> */}

          {/* Followers List */}
          {isLoadingFollowers ? (
            <View style={styles.followerModalLoading}>
              <ActivityIndicator size="large" color="#4A80F0" />
              <Text style={styles.followerModalLoadingText}>
                Loading followers...
              </Text>
            </View>
          ) : followersData?.length > 0 ? (
            <FlatList
              data={followersData}
              keyExtractor={(item, index) => `follower-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.followerItem}
                  onPress={() => {
                    setShowFollowersModal(false);
                    navigation.navigate("OtherUserScreen", {
                      user_id: item.user_id,
                    });
                  }}
                >
                  {item.user_image ? (
                    <Image
                      source={{ uri: `${baseImgURL + item.user_image}` }}
                      style={styles.followerAvatar}
                    />
                  ) : (
                    <View style={styles.followerAvatarPlaceholder}>
                      <Text style={styles.followerAvatarText}>
                        {item.name?.charAt(0) || "?"}
                      </Text>
                    </View>
                  )}

                  <View style={styles.followerInfo}>
                    <Text style={styles.followerName}>{item.name}</Text>
                    {item.location && (
                      <Text style={styles.followerMeta}>{item.location}</Text>
                    )}
                  </View>

                  <Feather name="chevron-right" size={20} color="#CCC" />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => (
                <View style={styles.followerSeparator} />
              )}
              contentContainerStyle={styles.followersList}
            />
          ) : (
            <View style={styles.emptyFollowers}>
              <Feather name="users" size={60} color="#DDD" />
              <Text style={styles.emptyFollowersText}>No followers yet</Text>
              <Text style={styles.emptyFollowersSubText}>
                Share this page to get more followers
              </Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </Modal>
  );

  // Loading and UI states
  const [isLoading, setIsLoading] = useState(true);
  const [showAlert, setShowAlert] = useState(false);
  const [visible, setVisible] = useState(false);
  const [see, setSee] = useState(false);
  const [justLoading, setJustLoading] = useState(false);

  // User data
  const [user, setUser] = useState(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [totalPoints, setTotalPoints] = useState(0);

  // Location data
  const [location, setLocation] = useState(null);
  const [district, setDistrict] = useState("");
  const [errorMsg, setErrorMsg] = useState(null);

  // Page/Movie data
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [allStates, setAllStates] = useState([]);
  const [postData, setPostData] = useState([]);
  const [peopleData, setPeopleData] = useState([]);
  const [completeOne, setCompleteOne] = useState([]);

  // Challenge data
  const [filterChallenges, setFilterChallenges] = useState([]);
  const [bootcamp, setBootcamp] = useState([]);
  const [challengeState, setChallengeState] = useState([]);
  const [streakState, setstreakState] = useState([]);
  const [quizState, setQuizState] = useState([]);
  const [biriyaniData, setBiriyaniData] = useState([]);
  const [quizStateLive, setQuizStateLive] = useState([]);
  const [treasureState, settreasureState] = useState([]);
  const [challengesNormal, setChallengesNormal] = useState([]);
  const [contestData, setContestData] = useState([]);

  // Food and experience data
  const [foodChallenge, setFoodChallenge] = useState([]);
  const [entertainment, setEntertainment] = useState([]);
  const [experienceChallenge, setExperienceChallenge] = useState([]);
  const [trendingFood, setTrendingFood] = useState([]);
  const [trendingExperience, setTrendingExperience] = useState([]);
  const [trendingEvent, setTrendingEvent] = useState([]);

  // Constituency data
  const [items, setItems] = useState([]);
  const [states, setStates] = useState(1);
  const [constituentsList, setConstituentsList] = useState([]);
  const [constituency, setConstituency] = useState("");
  const [alreadySelected, setAlreadySelected] = useState(false);

  // Navigation states
  const [activeRouteIndex, setActiveRouteIndex] = useState("food");
  const [mainRouteIndex, setMainRouteIndex] = useState("Experience");

  // Tutorial/instructions
  const [instructionData, setInstructionData] = useState([]);

  // Animated values
  const scale = useSharedValue(1);

  // Calculate the position for the tab indicator
  const tabPosition = useRef(new Animated.Value(0)).current;

  // Animation style for profile image border
  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  // Scroll animation values
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [Platform.OS == "ios" ? hp(28) : hp(32), hp(22)],
    extrapolate: "clamp",
  });

  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 80, 120],
    outputRange: [1, 0.8, 0],
    extrapolate: "clamp",
  });

  const compactHeaderOpacity = scrollY.interpolate({
    inputRange: [80, 130],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // Initialize animation for the profile image
  useEffect(() => {
    scale.value = withRepeat(
      withSpring(1.1, {
        duration: 2000,
        damping: 3,
        stiffness: 100,
      }),
      -1,
      true
    );

    return () => {
      scale.value = 1;
    };
  }, []);

  // Check for seen tutorial
  useEffect(() => {
    const fetchData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("pages");
        if (storedUser) {
          setSee(false);
        } else {
          setSee(true);
        }
      } catch (error) {
        console.error("Error while fetching user:", error.message);
      }
    };

    fetchData();
  }, []);

  // Request location permissions
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

      // Reverse geocoding to get the district
      try {
        const response = await axios.get(
          `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.coords.latitude},${location.coords.longitude}&key=${GOOGLE_MAPS_APIKEY}`
        );
        const addressComponents = response.data.results[0].address_components;
        const districtComponent = addressComponents.find((component) =>
          component.types.includes("administrative_area_level_3")
        );
        setDistrict(districtComponent.long_name);
      } catch (error) {
        console.error("Error fetching district:", error);
      }
    })();
  }, []);

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

  // Check for already selected constituency
  useEffect(() => {
    const checkAlreadySelected = async () => {
      if (user) {
        try {
          const response = await axios.get(
            `${baseURL}/checkAlreadyConstituency.php?user_id=${user.id}&page_id=${movieId}`
          );

          if (response.status == 200) {
            if (response?.data?.already_exist == "yes") {
              setAlreadySelected(true);
            }
          } else {
            console.error("Failed to fetch already constituency");
          }
        } catch (error) {
          console.error(
            "Error while fetching already constituency:",
            error.message
          );
        }
      }
    };

    checkAlreadySelected();
  }, [user]);

  // Fetch states for constituency dropdown
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${baseURL}/state-constituents.php`);

        if (response.status == 200) {
          setItems(response.data);
          setConstituency("");
        } else {
          console.error("Failed to fetch countries");
        }
      } catch (error) {
        console.error("Error while fetching countries:", error.message);
      }
    };

    fetchData();
  }, []);

  // Fetch constituency list when state changes
  useEffect(() => {
    const fetchState = async () => {
      try {
        const response = await axios.get(
          `${baseURL}/constituents.php?StateCode=${states}`
        );

        if (response.status == 200) {
          setConstituentsList(response.data);
        } else {
          console.error("Failed to fetch constituency");
        }
      } catch (error) {
        console.error("Error while fetching constituency:", error.message);
      }
    };

    fetchState();
  }, [states]);

  // Fetch page/movie details
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!user || !user.id) {
          return;
        }

        setIsLoading(true);

        const movieResponse = await axios.get(
          `${baseURL}/getDetailsInnerpage.php?id=${movieId}&userId=${user.id}${
            nowParam ? "&now=yes" : ""
          }`
        );

        setSelectedMovie(movieResponse.data);
        setIsFollowing(movieResponse.data.following == "true" ? true : false);
      } catch (error) {
        console.error("Error while fetching data:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [user, movieId, isFocused, nowParam]);

  // Fetch all data for the page
  useFocusEffect(
    useCallback(() => {
      const fetchData = async () => {
        try {
          if (!user || !user.id) {
            return;
          }

          setIsLoading(true);

          // Fetch all data in parallel
          const [
            peopleResponse,
            completedResponse,
            postsResponse,
            fullResponse,
            challengeResponse,
            challengesResponse,
            streakResponse,
            quizResponse,
            quizResponseLive,
            treasureResponse,
            bootcampResponse,
            contestResponse,
            foodResponse,
            biriyaniResponse,
            foodTrendingResponse,
            expTrendingResponse,
            eventTrendingResponse,
            entertainmentResponse,
            experienceResponse,
            normalChallenges,
            totalPointsResponse,
          ] = await Promise.all([
            axios.get(
              `${baseURL}/getPeoplePage.php?page_id=${movieId}&userId=${user.id}`
            ),
            axios.get(
              `${baseURL}/getEachCompleted.php?userId=${user.id}&page_id=${movieId}`
            ),
            axios.get(
              `${baseURL}/getPagePosts.php?page_id=${movieId}&userId=${user.id}`
            ),
            axios.get(
              `${baseURL}/getEachPageVisit.php?userId=${user.id}&page_id=${movieId}`
            ),
            axios.get(
              `${baseURL}/getTrendingPageVisit.php?userId=${user.id}&page_id=${movieId}`
            ),
            axios.get(
              `${baseURL}/getEachTrendingState.php?userId=${user.id}&page_id=${movieId}`
            ),
            axios.get(
              `${baseURL}/getEachStreakState.php?userId=${user.id}&page_id=${movieId}`
            ),
            axios.get(
              `${baseURL}/getEachQuiz.php?userId=${user.id}&page_id=${movieId}`
            ),
            axios.get(
              `${baseURL}/getEachLiveQuiz.php?userId=${user.id}&page_id=${movieId}`
            ),
            axios.get(
              `${baseURL}/getEachTreasureState.php?userId=${user.id}&page_id=${movieId}`
            ),
            axios.get(
              `${baseURL}/getEachBootcampVisit.php?userId=${user.id}&page_id=${movieId}`
            ),
            axios.get(
              `${baseURL}/getEachContestState.php?userId=${user.id}&page_id=${movieId}`
            ),
            axios.get(
              `${baseURL}/getFoodChallenge.php?userId=${user.id}&page_id=${movieId}`
            ),
            axios.get(
              `${baseURL}/getBiriyani.php?userId=${user.id}&page_id=${movieId}`
            ),
            axios.get(
              `${baseURL}/getTrendingFood.php?userId=${user.id}&page_id=${movieId}`
            ),
            axios.get(
              `${baseURL}/getTrendingActivity.php?userId=${user.id}&page_id=${movieId}`
            ),
            axios.get(
              `${baseURL}/getTrendingEvents.php?userId=${user.id}&page_id=${movieId}`
            ),
            axios.get(
              `${baseURL}/getEntertainment.php?userId=${user.id}&page_id=${movieId}`
            ),
            axios.get(
              `${baseURL}/getExperienceChallenge.php?userId=${user.id}&page_id=${movieId}`
            ),
            axios.get(
              `${baseURL}/getChallengeVisit.php?userId=${user.id}&page_id=${movieId}`
            ),
            axios.get(
              `${baseURL}/totalPoints.php?page_id=${movieId}&user_id=${user.id}`
            ),
          ]);

          // Update all state values
          setPeopleData(peopleResponse.data);
          setCompleteOne(completedResponse.data);
          setPostData(postsResponse.data);
          setAllStates(fullResponse.data);
          setFilterChallenges(challengeResponse.data.data);
          setChallengesNormal(filterData(challengesResponse.data));
          setstreakState(filterData(streakResponse.data));
          setQuizState(quizResponse.data);
          setQuizStateLive(quizResponseLive.data);
          settreasureState(filterData(treasureResponse.data));
          setBootcamp(filterData(bootcampResponse.data));
          setContestData(filterData(contestResponse.data));
          setFoodChallenge(foodResponse.data);
          setBiriyaniData(biriyaniResponse.data);
          setTrendingFood(foodTrendingResponse.data);
          setTrendingExperience(expTrendingResponse.data);
          setTrendingEvent(eventTrendingResponse.data);
          setEntertainment(entertainmentResponse.data);
          setExperienceChallenge(experienceResponse.data);
          setChallengeState(normalChallenges.data);
          setTotalPoints(totalPointsResponse.data.total_points);
          // console.log({
          //   peopleData: peopleResponse.data,
          //   completeOne: completedResponse.data,
          //   postData: postsResponse.data,
          //   allStates: fullResponse.data,
          //   filterChallenges: challengeResponse.data.data,
          //   challengesNormal: filterData(challengesResponse.data),
          //   streakState: filterData(streakResponse.data),
          //   quizState: quizResponse.data,
          //   quizStateLive: quizResponseLive.data,
          //   treasureState: filterData(treasureResponse.data),
          //   bootcamp: filterData(bootcampResponse.data),
          //   contestData: filterData(contestResponse.data),
          //   foodChallenge: foodResponse.data,
          //   biriyaniData: biriyaniResponse.data,
          //   trendingFood: foodTrendingResponse.data,
          //   trendingExperience: expTrendingResponse.data,
          //   entertainment: entertainmentResponse.data,
          //   experienceChallenge: experienceResponse.data,
          //   totalPoints: totalPointsResponse.data.total_points,
          // });
          
        } catch (error) {
          console.error("Error while fetching data:", error.message);
        } finally {
          setIsLoading(false);
        }
      };

      fetchData();
    }, [isFocused, user, movieId])
  );

  // Filter data based on parameters
  const filterData = (data) => {
    if (data?.length > 1) {
      if (nowParam != "yes") {
        return data.filter(
          (item) =>
            !(item.oper_for == "location" || item.oper_for == "specific")
        );
      }
    }
    return data;
  };

  // Mark tutorial as seen
  const displayTuts = async () => {
    await AsyncStorage.setItem("pages", "true");
    setSee(false);
  };

  // Navigate to next tutorial slide
  const goToNextPage = (index) => {
    if (index <= instructionData?.length) {
      if (swiperRef.current) {
        swiperRef.current.scrollToIndex({ index: index + 1, animated: true });
      }
    }
  };

  // Toggle follow/unfollow
  const toggleFollow = async () => {
    if (user) {
      try {
        const response = await axios.get(
          `${baseURL}/event-Follow.php?page_id=${movieId}&userId=${user.id}`
        );
        setShowAlert(false);

        if (isFollowing == false) {
          Toast2.show(`You started following ${selectedMovie.title}`, {
            duration: Toast2.durations.SHORT,
            position: Toast2.positions.BOTTOM,
            shadow: true,
            animation: true,
            hideOnPress: true,
            delay: 0,
            backgroundColor: "white",
            textColor: "black",
            containerStyle: {
              backgroundColor: "white",
              borderRadius: 50,
              padding: 15,
            },
          });
        } else {
          Toast2.show(`You unfollowed ${selectedMovie.title}`, {
            duration: Toast2.durations.SHORT,
            position: Toast2.positions.BOTTOM,
            shadow: true,
            animation: true,
            hideOnPress: true,
            delay: 0,
            backgroundColor: "white",
            textColor: "black",
            containerStyle: {
              backgroundColor: "white",
              borderRadius: 50,
              padding: 15,
            },
          });
        }

        setIsFollowing((prevIsFollowing) => !prevIsFollowing);
      } catch (error) {
        console.error("Error while following:", error);
      } finally {
        setShowAlert(false);
      }
    }
  };

  // Show toast message
  const showToast = (errorData) => {
    Toast.show({
      type: "error",
      text1: "Oops",
      text2: errorData,
    });
  };

  // Handle constituency submission
  const handleSubmit = async () => {
    if (!states) {
      showToast("You must select a state.");
      return;
    }
    if (!constituency) {
      showToast("You must select a constituency.");
      return;
    }
    if (!user) {
      return;
    }

    try {
      const response = await axios.post(
        `${baseURL}/user-constituency.php`,
        {
          stateCode: states,
          user_id: user.id,
          page_id: movieId,
          constituency: constituency,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (response.data.success) {
        setAlreadySelected(true);
      }
    } catch (error) {
      console.error("Error:", error.message);
    }
  };

  // Toggle menu visibility
  const toggleMenu = () => setVisible(!visible);

  // Change tab with delay for smooth transition
  const handleTabChange = (routeKey) => {
    setJustLoading(true);
    setTimeout(() => {
      setActiveRouteIndex(routeKey);
      setJustLoading(false);
    }, 200);
  };

  // Handle main category change
  const handleMainCategoryChange = (category) => {
    setMainRouteIndex(category.key);

    // Set default subcategory for this main category
    const defaultSubCategory = SUB_CATEGORIES.find(
      (route) => route.parent == category.key
    );
    if (defaultSubCategory) {
      setActiveRouteIndex(defaultSubCategory.key);
    }

    // Scroll to the beginning of the tab bar
    if (tabScrollViewRef.current) {
      tabScrollViewRef.current.scrollTo({ x: 0, animated: true });
    }
  };

  // Render content based on active route
  const renderContent = () => {
    switch (activeRouteIndex) {
      case "first":
        return renderChallenges();
      case "second":
        return renderCertificates();
      case "third":
        return renderPosts();
      case "fourth":
        return renderTrending();
      case "fifth":
        return renderQuizzes();
      case "sixth":
        return renderNow();
      case "seventh":
        return renderCompleted();
      case "food":
        return renderFood();
      case "experience":
        return renderExperience();
      case "event":
        return renderEvent();
      case "itinerary":
        return renderItinerary();
      default:
        return renderTrending();
    }
  };

  // Render certificates section
  const renderCertificates = () => (
    <ScrollView
      style={styles.contentScrollView}
      showsVerticalScrollIndicator={false}
    >
      {peopleData?.length > 0 ? (
        peopleData.map((item, index) => (
          <View key={index} style={styles.certificateCard}>
            <CertificateList
              item={item}
              index={index}
              user_id={user.id}
              arena={null}
            />
          </View>
        ))
      ) : (
        <EmptyState
          icon="award"
          title="No Certificates Yet"
          subtitle="Complete challenges to earn certificates"
        />
      )}
    </ScrollView>
  );

  // Render posts section
  const renderPosts = () => (
    <ScrollView
      style={styles.contentScrollView}
      showsVerticalScrollIndicator={false}
    >
      {postData?.length > 0 ? (
        postData.map((item, index) => (
          <View key={index} style={styles.postCard}>
            <Posts item={item} index={index} user_id={user?.id} />
          </View>
        ))
      ) : (
        <EmptyState
          icon="image"
          title="No Posts Yet"
          subtitle="Check back later for new content"
        />
      )}
    </ScrollView>
  );

  // Render trending section
  const renderTrending = () => (
    <ScrollView
      style={styles.contentScrollView}
      showsVerticalScrollIndicator={false}
    >
      {filterChallenges?.length > 0 && (
        <View style={styles.sectionContainer}>
          <SectionHeader title={`Trending In ${selectedMovie.title}`} />
          <FlatList
            data={filterChallenges}
            keyExtractor={(item, index) => `trending-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
            renderItem={({ item }) => (
              <NewVisitCard
                challenge={item}
                selectedMovie={item.selectedTitle}
              />
            )}
          />
        </View>
      )}
{/* {console.log("districtsData",allStates?.districtsData)} */}
      {allStates?.districtsData?.length > 0 &&
        allStates.districtsData.map(
          (item, index) =>
            item.challenges?.length > 0 && (
              <View key={`district-${index}`} style={styles.sectionContainer}>
                <SectionHeader title={item.title} />
                <FlatList
                  data={item.challenges}
                  keyExtractor={(challenge, idx) =>
                    `district-${index}-challenge-${idx}`
                  }
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.horizontalListContent}
                  renderItem={({ item }) => (
                    <NewVisitCard
                      challenge={item}
                      selectedMovie={item.selectedTitle}
                    />
                  )}
                />
              </View>
            )
        )}

      {/* Show empty state if no content */}
      {filterChallenges?.length == 0 &&
        (!allStates?.districtsData ||
          allStates.districtsData.every(
            (item) => !item.challenges?.length
          )) && (
          <EmptyState
            icon="trending-up"
            title="No Trending Content"
            subtitle="Check back later for trending challenges"
          />
        )}
    </ScrollView>
  );

  // Render food section
  const renderFood = () => (
    <ScrollView
      style={styles.contentScrollView}
      showsVerticalScrollIndicator={false}
    >
      {trendingFood?.challenges?.length > 0 && (
        <View style={styles.sectionContainer}>
          <SectionHeader title="Trending Foods" />
          <FlatList
            data={trendingFood.challenges}
            keyExtractor={(item, index) => `trending-food-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
            renderItem={({ item, index }) => (
              <FoodDisplay item={item} key={index} type="food" />
            )}
          />
        </View>
      )}

      {foodChallenge?.challenges?.length > 0 && (
        <View style={styles.sectionContainer}>
          <SectionHeader title="Breakfast" />
          <FlatList
            data={foodChallenge.challenges}
            keyExtractor={(item, index) => `breakfast-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
            renderItem={({ item, index }) => (
              <FoodDisplay item={item} key={index} type="food" />
            )}
          />
        </View>
      )}

      {biriyaniData?.challenges?.length > 0 && (
        <View style={styles.sectionContainer}>
          <SectionHeader title="Biryani" />
          <FlatList
            data={biriyaniData.challenges}
            keyExtractor={(item, index) => `biryani-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
            renderItem={({ item, index }) => (
              <FoodDisplay item={item} key={index} type="food" />
            )}
          />
        </View>
      )}

      {/* Show empty state if no content */}
      {!trendingFood?.challenges?.length &&
        !foodChallenge?.challenges?.length &&
        !biriyaniData?.challenges?.length && (
          <EmptyState
            icon="coffee"
            title="No Food Content"
            subtitle="Check back later for food challenges"
          />
        )}
    </ScrollView>
  );

  // Render experience section
  const renderExperience = () => (
    <ScrollView
      style={styles.contentScrollView}
      showsVerticalScrollIndicator={false}
    >
      {trendingExperience?.challenges?.length > 0 && (
        <View style={styles.sectionContainer}>
          <SectionHeader title="Trending Activities" />
          <FlatList
            data={trendingExperience.challenges}
            keyExtractor={(item, index) => `trending-exp-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
            renderItem={({ item, index }) => (
              <FoodDisplay item={item} key={index} type="experience" />
            )}
          />
        </View>
      )}

      {experienceChallenge?.challenges?.length > 0 && (
        <View style={styles.sectionContainer}>
          <SectionHeader title="Arts" />
          <FlatList
            data={experienceChallenge.challenges}
            keyExtractor={(item, index) => `arts-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
            renderItem={({ item, index }) => (
              <FoodDisplay item={item} key={index} type="experience" />
            )}
          />
        </View>
      )}

      {entertainment?.challenges?.length > 0 && (
        <View style={styles.sectionContainer}>
          <SectionHeader title="Entertainment" />
          <FlatList
            data={entertainment.challenges}
            keyExtractor={(item, index) => `entertainment-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
            renderItem={({ item, index }) => (
              <FoodDisplay item={item} key={index} type="experience" />
            )}
          />
        </View>
      )}

      {/* Show empty state if no content */}
      {!trendingExperience?.challenges?.length &&
        !experienceChallenge?.challenges?.length &&
        !entertainment?.challenges?.length && (
          <EmptyState
            icon="activity"
            title="No Activities"
            subtitle="Check back later for experience challenges"
          />
        )}
    </ScrollView>
  );

  // Render experience section
  const renderEvent = () => (
    <ScrollView
      style={styles.contentScrollView}
      showsVerticalScrollIndicator={false}
    >
    

      {trendingEvent?.challenges?.length > 0 && (
        <View style={styles.sectionContainer}>
          <SectionHeader title="Arts" />
          <FlatList
            data={trendingEvent.challenges}
            keyExtractor={(item, index) => `arts-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
            renderItem={({ item, index }) => (
              <FoodDisplay item={item} key={index} type="experience" />
            )}
          />
        </View>
      )}

      {/* Show empty state if no content */}
      {!trendingEvent?.challenges?.length && (
          <EmptyState
            icon="activity"
            title="No Events"
            subtitle="Check back later for experience challenges"
          />
        )}
    </ScrollView>
  );

  // Render itinerary section
  const renderItinerary = () => (
    <ScrollView
      style={styles.contentScrollView}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Feather
            name="search"
            size={20}
            color="#888"
            style={styles.searchIcon}
          />
          <TextInput
            placeholder="Search flights, hotels, or itineraries"
            style={styles.searchInput}
            placeholderTextColor="#999"
          />
        </View>
      </View>

      <View style={styles.flightListContainer}>
        {airportData?.length > 0 ? (
          airportData.map((item, index) => (
            <TouchableOpacity
              key={`flight-${index}`}
              style={styles.flightCard}
              onPress={() => navigation.navigate("FlightDetail")}
              activeOpacity={0.7}
            >
              <View style={styles.flightHeader}>
                <View style={styles.airlineInfo}>
                  <Image
                    source={{ uri: item.airline_logo }}
                    style={styles.airlineLogo}
                    resizeMode="contain"
                  />
                  <View>
                    <Text style={styles.airlineName}>
                      {item.airline}{" "}
                      <Text style={styles.flightNumber}>
                        {item.flight_number}
                      </Text>
                    </Text>
                    <Text style={styles.flightClass}>{item.class}</Text>
                  </View>
                </View>

                <View style={styles.priceTag}>
                  <Text style={styles.priceText}>${item.price || "199"}</Text>
                </View>
              </View>

              <View style={styles.flightRoute}>
                <View style={styles.routePoint}>
                  <Text style={styles.cityCode}>
                    {item.departure_code || "NYC"}
                  </Text>
                  <Text style={styles.cityName}>{item.departure_city}</Text>
                  <Text style={styles.flightTime}>{item.departure_time}</Text>
                </View>

                <View style={styles.routeConnection}>
                  <Text style={styles.flightDuration}>{item.duration}</Text>
                  <View style={styles.routeLine}>
                    <View style={styles.routeDot} />
                    <View style={styles.routeDashedLine} />
                    <MaterialIcons
                      name="flight"
                      size={20}
                      color="#4A80F0"
                      style={styles.planeIcon}
                    />
                    <View style={styles.routeDashedLine} />
                    <View style={styles.routeDot} />
                  </View>
                  <Text style={styles.flightStops}>
                    {parseInt(item.stops) > 0
                      ? `${item.stops} stop${
                          parseInt(item.stops) > 1 ? "s" : ""
                        }`
                      : "Direct"}
                  </Text>
                </View>

                <View style={styles.routePoint}>
                  <Text style={styles.cityCode}>
                    {item.arrival_code || "LAX"}
                  </Text>
                  <Text style={styles.cityName}>{item.arrival_city}</Text>
                  <Text style={styles.flightTime}>{item.arrival_time}</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <EmptyState
            icon="map"
            title="No Itineraries"
            subtitle="No travel itineraries available at the moment"
          />
        )}
      </View>
    </ScrollView>
  );

  // Render challenges section
  const renderChallenges = () => (
    <ScrollView
      style={styles.contentScrollView}
      showsVerticalScrollIndicator={false}
    >
      {challengesNormal?.challenges?.length > 0 && (
        <View style={styles.sectionContainer}>
          <SectionHeader
            title={
              challengesNormal.state
                ? `Trending in ${challengesNormal.state}`
                : "Trending Challenges"
            }
          />
          <FlatList
            data={challengesNormal.challenges}
            keyExtractor={(item, index) => `normal-challenge-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
            renderItem={({ item, index }) => (
              <ChallengeHomeCardVisit
                now={nowParam}
                challenge={item}
                user={user}
                key={index}
                index={index}
                arena={null}
                district={district}
              />
            )}
          />
        </View>
      )}

      {bootcamp?.challenges?.length > 0 && (
        <View style={styles.sectionContainer}>
          <SectionHeader title="Bootcamp" />
          <FlatList
            data={bootcamp.challenges}
            keyExtractor={(item, index) => `bootcamp-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
            renderItem={({ item, index }) => (
              <ChallengeHomeCardVisit
                now={nowParam}
                challenge={item}
                user={user}
                key={index}
                index={index}
                arena={null}
                district={district}
              />
            )}
          />
        </View>
      )}

      {challengeState?.challenges?.length > 0 && (
        <View style={styles.sectionContainer}>
          <SectionHeader title="Challenges" />
          <FlatList
            data={challengeState.challenges}
            keyExtractor={(item, index) => `challenge-state-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
            renderItem={({ item, index }) => (
              <ChallengeHomeCardVisit
                now={nowParam}
                challenge={item}
                user={user}
                key={index}
                index={index}
                arena={null}
                district={district}
              />
            )}
          />
        </View>
      )}

      {streakState?.challenges?.length > 0 && (
        <View style={styles.sectionContainer}>
          <SectionHeader title="Streaks" />
          <FlatList
            data={streakState.challenges}
            keyExtractor={(item, index) => `streak-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
            renderItem={({ item, index }) => (
              <ChallengeHomeCardVisit
                now={nowParam}
                challenge={item}
                user={user}
                key={index}
                index={index}
                arena={null}
                district={district}
              />
            )}
          />
        </View>
      )}

      {treasureState?.challenges?.length > 0 && (
        <View style={styles.sectionContainer}>
          <SectionHeader title="Treasure Hunt" />
          <FlatList
            data={treasureState.challenges}
            keyExtractor={(item, index) => `treasure-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
            renderItem={({ item, index }) => (
              <ChallengeHomeCardVisit
                now={nowParam}
                challenge={item}
                user={user}
                key={index}
                index={index}
                arena={null}
                district={district}
              />
            )}
          />
        </View>
      )}

      {/* Show empty state if no content */}
      {!challengesNormal?.challenges?.length &&
        !bootcamp?.challenges?.length &&
        !challengeState?.challenges?.length &&
        !streakState?.challenges?.length &&
        !treasureState?.challenges?.length && (
          <EmptyState
            icon="target"
            title="No Challenges"
            subtitle="Check back later for new challenges"
          />
        )}
    </ScrollView>
  );

  // Render quizzes section
  const renderQuizzes = () => (
    <ScrollView
      style={styles.contentScrollView}
      showsVerticalScrollIndicator={false}
    >
      {quizStateLive?.challenges?.length > 0 && (
        <View style={styles.sectionContainer}>
          <SectionHeader title="Live Quiz" />
          <FlatList
            data={quizStateLive.challenges}
            keyExtractor={(item, index) => `live-quiz-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
            renderItem={({ item, index }) => (
              <ChallengeHomeCardVisit
                now={nowParam}
                challenge={item}
                user={user}
                key={index}
                index={index}
                arena={null}
                district={district}
              />
            )}
          />
        </View>
      )}

      {contestData?.challenges?.length > 0 && (
        <View style={styles.sectionContainer}>
          <SectionHeader title="Contest" />
          <FlatList
            data={contestData.challenges}
            keyExtractor={(item, index) => `contest-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
            renderItem={({ item, index }) => (
              <ChallengeHomeCardVisit
                now={nowParam}
                challenge={item}
                user={user}
                key={index}
                index={index}
                arena={null}
                district={district}
              />
            )}
          />
        </View>
      )}

      {quizState?.challenges?.length > 0 && (
        <View style={styles.sectionContainer}>
          <SectionHeader title="Quiz" />
          <FlatList
            data={quizState.challenges}
            keyExtractor={(item, index) => `quiz-${index}`}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalListContent}
            renderItem={({ item, index }) => (
              <ChallengeHomeCardVisit
                now={nowParam}
                challenge={item}
                user={user}
                key={index}
                index={index}
                arena={null}
                district={district}
              />
            )}
          />
        </View>
      )}

      {/* Show empty state if no content */}
      {!quizStateLive?.challenges?.length &&
        !contestData?.challenges?.length &&
        !quizState?.challenges?.length && (
          <EmptyState
            icon="help-circle"
            title="No Quizzes"
            subtitle="Check back later for new quizzes and contests"
          />
        )}
    </ScrollView>
  );

  // Render constituency selection (Now section)
  const renderNow = () => (
    <ScrollView
      style={styles.contentScrollView}
      showsVerticalScrollIndicator={false}
    >
      {!alreadySelected &&
      (selectedMovie?.type == "election" ||
        selectedMovie?.type == "political-party") ? (
        <View style={styles.constituencyCard}>
          <Text style={styles.constituencyTitle}>Select your constituency</Text>

          <View style={styles.dropdownWrapper}>
            <Text style={styles.dropdownLabel}>Select State</Text>
            <Dropdown
              labelField="label"
              valueField="value"
              placeholderStyle={styles.dropdownPlaceholder}
              placeholder="Select your State"
              data={items}
              value={states}
              onChange={(item) => {
                setStates(item.value);
              }}
              search
              searchPlaceholder="Search your State..."
              style={styles.dropdown}
              selectedTextStyle={styles.dropdownSelectedText}
              containerStyle={styles.dropdownContainer}
            />
          </View>

          <View style={styles.dropdownWrapper}>
            <Text style={styles.dropdownLabel}>Select Constituency</Text>
            <Dropdown
              labelField="label"
              valueField="value"
              placeholderStyle={styles.dropdownPlaceholder}
              placeholder="Select your constituency"
              data={constituentsList}
              value={constituency}
              onChange={(item) => {
                setConstituency(item.value);
              }}
              search
              searchPlaceholder="Search your constituency..."
              style={styles.dropdown}
              selectedTextStyle={styles.dropdownSelectedText}
              containerStyle={styles.dropdownContainer}
            />
          </View>

          <TouchableOpacity
            style={styles.constituencySubmitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.constituencySubmitText}>Submit</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <EmptyState
          icon="map-pin"
          title={
            alreadySelected
              ? "Constituency Selected"
              : "No Constituency Selection Needed"
          }
          subtitle={
            alreadySelected
              ? "You have already selected your constituency"
              : "This page does not require constituency selection"
          }
        />
      )}
    </ScrollView>
  );

  // Render completed challenges section
  const renderCompleted = () => (
    <ScrollView
      style={styles.contentScrollView}
      showsVerticalScrollIndicator={false}
    >
      {completeOne?.challenges?.length > 0 ? (
        <View style={styles.completedChallengesContainer}>
          {completeOne.challenges.map((item, index) => (
            <ChallengeHomeCardVisit
              now={nowParam}
              challenge={item}
              user={user}
              key={`completed-${index}`}
              index={index}
              arena={null}
              district={district}
              completeOne={true}
            />
          ))}
        </View>
      ) : (
        <EmptyState
          icon="check-circle"
          title="No Completed Challenges"
          subtitle="Complete challenges to see them here"
        />
      )}
    </ScrollView>
  );

  // Render compact header for scroll state
  const renderCompactHeader = () => (
    <Animated.View
      style={[styles.compactHeader, { opacity: compactHeaderOpacity }]}
    >
      <View style={styles.compactHeaderContent}>
        <TouchableOpacity
          style={styles.compactHeaderBack}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>

        <View style={styles.compactHeaderTitle}>
          <Text style={styles.compactHeaderText} numberOfLines={1}>
            {selectedMovie?.title}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.compactHeaderAction}
          onPress={toggleFollow}
        >
          <Ionicons
            name={isFollowing ? "checkmark-circle" : "add-circle"}
            size={24}
            color="white"
          />
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  if (isLoading || !selectedMovie) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A80F0" />
        <Text style={styles.loadingText}>Loading page details...</Text>
      </View>
    );
  }

  return (
    <PaperProvider>
      <SafeAreaView style={styles.safeArea}>
        <StatusBar
          translucent
          backgroundColor="transparent"
          barStyle="light-content"
        />

        {/* Tutorial/Onboarding Overlay */}
        {see && instructionData?.length > 0 && (
          <BlurView intensity={100} tint="dark" style={styles.tutorialOverlay}>
            <SwiperFlatList
              ref={swiperRef}
              horizontal
              showPagination
              data={instructionData}
              renderItem={({ item, index }) => (
                <TutorialSlide
                  item={item}
                  index={index}
                  totalSlides={instructionData?.length}
                  onNextPress={goToNextPage}
                  onFinishPress={displayTuts}
                />
              )}
              paginationDefaultColor="rgba(255, 255, 255, 0.3)"
              paginationActiveColor="white"
              paginationStyleItem={styles.paginationDot}
            />
          </BlurView>
        )}

        {/* Main Content */}
        <View style={styles.container}>
          {/* Compact Header for Scroll State */}
          {renderCompactHeader()}

          {/* Content with Animated Header */}
          <Animated.ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            scrollEventThrottle={16}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: false }
            )}
          >
            {/* Header Section */}
            <Animated.View style={[styles.header, ]}>
              {/* Header Background */}
              <View style={styles.headerBackground}>
                {selectedMovie.banner ? (
                  <Image
                    source={{ uri: `${baseImgURL + selectedMovie.banner}` }}
                    style={styles.headerBanner}
                  />
                ) : (
                  <LinearGradient
                    colors={["#4A80F0", "#1A53B0"]}
                    style={styles.headerBanner}
                  />
                )}

                {/* Gradient Overlay */}
                <LinearGradient
                  colors={["rgba(0,0,0,0.1)", "rgba(0,0,0,0.8)"]}
                  style={styles.headerOverlay}
                />
              </View>

              {/* TopBar Component */}
              <TopBar color="white" user={user} />

              {/* Profile Section */}
              <Animated.View
                style={[styles.profileSection, { opacity: headerOpacity }]}
              >
                <View style={styles.profileInfo}>
                  {/* Profile Image with Animated Border */}
                  <View style={styles.profileImageContainer}>
                    <Animated2.View
                      style={[
                        styles.profileImageBorder,
                        nowParam && animatedStyle,
                      ]}
                    >
                      <View style={styles.profileImageWrapper}>
                        {selectedMovie.image?.length > 0 ? (
                          <Image
                            source={{
                              uri: `${baseImgURL + selectedMovie.image}`,
                            }}
                            style={styles.profileImage}
                          />
                        ) : (
                          <View style={styles.profileImagePlaceholder}>
                            <Text style={styles.profileImageText}>
                              {selectedMovie.title?.charAt(0) || "?"}
                            </Text>
                          </View>
                        )}
                      </View>
                    </Animated2.View>

                    {/* "Now" badge for nowParam */}
                    {nowParam && (
                      <View style={styles.nowBadge}>
                        <LinearGradient
                          colors={["#FF9500", "#FF5E3A"]}
                          style={styles.nowBadgeGradient}
                        >
                          <Text style={styles.nowBadgeText}>NOW</Text>
                        </LinearGradient>
                      </View>
                    )}
                  </View>

                  {/* Profile Title and Type */}
                  <View style={styles.profileTitleContainer}>
                    <Text style={styles.profileTitle} numberOfLines={2}>
                      {selectedMovie.title}
                    </Text>
                    <Text style={styles.profileType}>
                      {selectedMovie.type.charAt(0).toUpperCase() +
                        selectedMovie.type.slice(1)}
                    </Text>
                  </View>
                </View>

                {/* Options Menu */}
                <View style={styles.profileOptions}>
                  <TouchableOpacity
                    style={styles.optionsButton}
                    onPress={toggleMenu}
                  >
                    <Entypo
                      name="dots-three-vertical"
                      size={22}
                      color="white"
                    />
                  </TouchableOpacity>

                  {/* Dropdown Menu */}
                  {visible && (
                    <View style={styles.optionsMenu}>
                      <TouchableOpacity
                        style={styles.optionItem}
                        onPress={() => {
                          setVisible(false);
                          navigation.navigate("FeedbackScreen", {
                            page_id: movieId,
                            user_id: user?.id,
                            type: "feedback",
                          });
                        }}
                      >
                        <Feather
                          name="message-circle"
                          size={16}
                          color="#333"
                          style={styles.optionIcon}
                        />
                        <Text style={styles.optionText}>Feedback</Text>
                      </TouchableOpacity>

                      <Divider style={styles.optionDivider} />

                      <TouchableOpacity
                        style={styles.optionItem}
                        onPress={() => {
                          setVisible(false);
                          navigation.navigate("FeedbackScreen", {
                            page_id: movieId,
                            user_id: user?.id,
                            type: "complaint",
                          });
                        }}
                      >
                        <Feather
                          name="alert-triangle"
                          size={16}
                          color="#333"
                          style={styles.optionIcon}
                        />
                        <Text style={styles.optionText}>Complaint</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              </Animated.View>

              {/* Stats Section */}
              <Animated.View
                style={[styles.statsSection, { opacity: headerOpacity }]}
              >
                {/* <View style={styles.stat}>
                  <Text style={styles.statValue}>
                    {selectedMovie.followers || 0}
                  </Text>
                  <Text style={styles.statLabel}>Followers</Text>
                </View> */}

                {/* <View style={styles.statDivider} /> */}

                <View style={styles.stat}>
                  <Text style={styles.statValue}>{totalPoints || 0}</Text>
                  <Text style={styles.statLabel}>Points</Text>
                </View>

                <View style={styles.statDivider} />

                <View style={styles.stat}>
                  <Text style={styles.statValue}>
                    {selectedMovie.level || 1}
                  </Text>
                  <Text style={styles.statLabel}>Level</Text>
                </View>
              </Animated.View>

              {/* Action Buttons */}
              <Animated.View
                style={[styles.actionButtons, { opacity: headerOpacity }]}
              >
                {/* <TouchableOpacity
                  style={[
                    styles.actionButton,
                    isFollowing ? styles.followingButton : styles.followButton,
                  ]}
                  onPress={() => {
                    if (isFollowing) {
                      setShowAlert(true);
                    } else {
                      toggleFollow();
                    }
                  }}
                >
                  {isFollowing ? (
                    <Feather
                      name="check"
                      size={16}
                      color="white"
                      style={styles.actionButtonIcon}
                    />
                  ) : (
                    <Feather
                      name="plus"
                      size={16}
                      color="white"
                      style={styles.actionButtonIcon}
                    />
                  )}
                  <Text style={styles.actionButtonText}>
                    {isFollowing
                      ? "Following"
                      : totalPoints > 0
                      ? "Follow Again"
                      : "Follow"}
                  </Text>
                </TouchableOpacity> */}

                {isFollowing && (
                  <>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() =>
                        navigation.navigate("LeaderScreen", { pageId: movieId })
                      }
                    >
                      <Feather
                        name="award"
                        size={16}
                        color="white"
                        style={styles.actionButtonIcon}
                      />
                      <Text style={styles.actionButtonText}>Leaderboard</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() =>
                        navigation.navigate("UserRewards", { movieId: movieId })
                      }
                    >
                      <Feather
                        name="gift"
                        size={16}
                        color="white"
                        style={styles.actionButtonIcon}
                      />
                      <Text style={styles.actionButtonText}>Rewards</Text>
                    </TouchableOpacity>
                  </>
                )}
              </Animated.View>
            </Animated.View>

            {/* Tab Navigation */}
            <View style={styles.tabNavigationContainer}>
              {/* Main Category Tabs */}
              <View style={styles.mainTabsContainer}>
                {MAIN_CATEGORIES.map((category, index) => (
                  <TouchableOpacity
                    key={`main-tab-${index}`}
                    style={[
                      styles.mainTab,
                      mainRouteIndex == category.key && styles.activeMainTab,
                    ]}
                    onPress={() => handleMainCategoryChange(category)}
                  >
                    <Feather
                      name={category.icon}
                      size={16}
                      color={
                        mainRouteIndex == category.key ? "#4A80F0" : "#888"
                      }
                      style={styles.mainTabIcon}
                    />
                    <Text
                      style={[
                        styles.mainTabText,
                        mainRouteIndex == category.key &&
                          styles.activeMainTabText,
                      ]}
                    >
                      {category.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Sub-Category Tabs */}
              <ScrollView
                ref={tabScrollViewRef}
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.subTabsContainer}
                contentContainerStyle={styles.subTabsContent}
              >
                {SUB_CATEGORIES.filter(
                  (route) => route.parent == mainRouteIndex
                ).map((route, index) => (
                  <TouchableOpacity
                    key={`sub-tab-${index}`}
                    style={[
                      styles.subTab,
                      activeRouteIndex == route.key && styles.activeSubTab,
                    ]}
                    onPress={() => handleTabChange(route.key)}
                  >
                    {route.icon =="restaurant" ?(<Ionicons
                      name={route.icon}
                      size={16}
                      color={
                        activeRouteIndex == route.key ? "#4A80F0" : "#888"
                      }
                      style={styles.subTabIcon}
                    />):
                    (<Feather
                      name={route.icon}
                      size={14}
                      color={
                        activeRouteIndex == route.key ? "#4A80F0" : "#888"
                      }
                      style={styles.subTabIcon}
                    />)}
                    <Text
                      style={[
                        styles.subTabText,
                        activeRouteIndex == route.key &&
                          styles.activeSubTabText,
                      ]}
                    >
                      {route.title}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Page Content */}
            <View style={styles.contentContainer}>
              {justLoading ? (
                <View style={styles.loadingContent}>
                  <ActivityIndicator size="small" color="#4A80F0" />
                </View>
              ) : (
                renderContent()
              )}
            </View>
          </Animated.ScrollView>
        </View>

        {/* Unfollow Confirmation Alert */}
        <AwesomeAlert
          show={showAlert}
          showProgress={false}
          title={`Unfollow ${selectedMovie?.title}`}
          message={`Are you sure you want to unfollow ${selectedMovie?.title}?`}
          closeOnTouchOutside={true}
          closeOnHardwareBackPress={false}
          showCancelButton={true}
          showConfirmButton={true}
          cancelText="Cancel"
          confirmText="Unfollow"
          confirmButtonColor="#FF5A5F"
          cancelButtonTextStyle={styles.alertCancelButtonText}
          confirmButtonTextStyle={styles.alertConfirmButtonText}
          titleStyle={styles.alertTitle}
          messageStyle={styles.alertMessage}
          contentContainerStyle={styles.alertContainer}
          onCancelPressed={() => setShowAlert(false)}
          onConfirmPressed={toggleFollow}
        />
        <FollowersModal />
      </SafeAreaView>
    </PaperProvider>
  );
};

// Styles
const styles = StyleSheet.create({
  // Container and layout styles
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8F9FD",
  },
  scrollView: {
    flex: 1,
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
    fontFamily: "raleway-medium",
    color: "#666",
  },
  loadingContent: {
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
  },

  // Header styles
  header: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
  },
  headerBackground: {
    ...StyleSheet.absoluteFillObject,
  },
  headerBanner: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  headerOverlay: {
    ...StyleSheet.absoluteFillObject,
  },
  profileSection: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  profileInfo: {
    flexDirection: "row",
    flex: 1,
    alignItems: "center",
  },
  profileImageContainer: {
    position: "relative",
    marginRight: 16,
  },
  profileImageBorder: {
    padding: 3,
    backgroundColor: "#FF9500",
    borderRadius: wp(10) + 3,
  },
  profileImageWrapper: {
    width: wp(20),
    height: wp(20),
    borderRadius: wp(10),
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  profileImage: {
    width: "100%",
    height: "100%",
    resizeMode: "contain",
  },
  profileImagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#4A80F0",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImageText: {
    fontSize: 24,
    fontFamily: "raleway-bold",
    color: "white",
  },
  nowBadge: {
    position: "absolute",
    bottom: -8,
    left: "50%",
    transform: [{ translateX: -25 }],
    zIndex: 1,
  },
  nowBadgeGradient: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: "white",
  },
  nowBadgeText: {
    color: "white",
    fontSize: 12,
    fontFamily: "raleway-bold",
  },
  profileTitleContainer: {
    flex: 1,
  },
  profileTitle: {
    fontSize: 20,
    fontFamily: "raleway-bold",
    color: "white",
    marginBottom: 4,
  },
  profileType: {
    fontSize: 14,
    fontFamily: "raleway-medium",
    color: "rgba(255,255,255,0.8)",
  },
  profileOptions: {
    position: "relative",
  },
  optionsButton: {
    padding: 8,
  },
  optionsMenu: {
    position: "absolute",
    top: 40,
    right: 0,
    width: wp(45),
    backgroundColor: "white",
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
  },
  optionIcon: {
    marginRight: 10,
  },
  optionText: {
    fontSize: 14,
    fontFamily: "raleway-medium",
    color: "#333",
  },
  optionDivider: {
    backgroundColor: "#f0f0f0",
  },
  statsSection: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingVertical: 12,
    justifyContent: "space-around",
    alignItems: "center",
  },
  stat: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 18,
    fontFamily: "raleway-bold",
    color: "white",
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "raleway-medium",
    color: "rgba(255,255,255,0.8)",
    marginTop: 2,
  },
  statDivider: {
    height: 24,
    width: 1,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  actionButtons: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 16,
    justifyContent: "space-around",
    gap:10
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#4A80F0",
    borderRadius: 24,
    minWidth: 100,
    justifyContent: "center",
  },
  followButton: {
    backgroundColor: "#4A80F0",
  },
  followingButton: {
    backgroundColor: "#4CAF50",
  },
  actionButtonIcon: {
    marginRight: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontFamily: "raleway-bold",
    color: "white",
  },

  // Compact header styles (shown when scrolling)
  compactHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: "#4A80F0",
    zIndex: 100,
    height: Platform.OS == "ios" ? 90 : 60,
    paddingTop: Platform.OS == "ios" ? 40 : 10,
  },
  compactHeaderContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    height: 50,
  },
  compactHeaderBack: {
    width: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  compactHeaderTitle: {
    flex: 1,
    alignItems: "center",
  },
  compactHeaderText: {
    color: "white",
    fontSize: 18,
    fontFamily: "raleway-bold",
  },
  compactHeaderAction: {
    width: 40,
    justifyContent: "center",
    alignItems: "center",
  },

  // Tab navigation styles
  tabNavigationContainer: {
    backgroundColor: "white",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  mainTabsContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  mainTab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  activeMainTab: {
    borderBottomWidth: 2,
    borderBottomColor: "#4A80F0",
  },
  mainTabIcon: {
    marginRight: 6,
  },
  mainTabText: {
    fontSize: 14,
    fontFamily: "raleway-medium",
    color: "#888",
  },
  activeMainTabText: {
    fontFamily: "raleway-bold",
    color: "#4A80F0",
  },
  subTabsContainer: {
    flexGrow: 0,
    paddingVertical: 8,
  },
  subTabsContent: {
    paddingHorizontal: 12,
  },
  subTab: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 16,
  },
  activeSubTab: {
    backgroundColor: "#F0F6FF",
  },
  subTabIcon: {
    marginRight: 6,
  },
  subTabText: {
    fontSize: 13,
    fontFamily: "raleway-medium",
    color: "#888",
  },
  activeSubTabText: {
    fontFamily: "raleway-bold",
    color: "#4A80F0",
  },
  tabIndicator: {
    position: "absolute",
    bottom: 0,
    height: 3,
    backgroundColor: "#4A80F0",
    borderRadius: 3,
  },

  // Content styles
  contentContainer: {
    backgroundColor: "#F8F9FD",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    // marginTop: -20,
    flex: 1,
    paddingTop: 20,
    paddingBottom: 40,
  },
  contentScrollView: {
    flex: 1,
    padding: 16,
  },
  sectionContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "raleway-bold",
    color: "#333",
  },
  seeAllText: {
    fontSize: 14,
    fontFamily: "raleway-medium",
    color: "#4A80F0",
  },
  horizontalListContent: {
    paddingBottom: 8,
  },
  certificateCard: {
    marginBottom: 16,
  },
  postCard: {
    marginBottom: 16,
  },

  // Empty state styles
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 32,
    minHeight: 300,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontFamily: "raleway-bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateSubtitle: {
    fontSize: 14,
    fontFamily: "raleway-medium",
    color: "#888",
    textAlign: "center",
    lineHeight: 20,
  },

  // Food section styles
  foodContainer: {
    flex: 1,
  },

  // Experience section styles
  experienceContainer: {
    flex: 1,
  },

  // Itinerary/Flight styles
  searchContainer: {
    marginBottom: 16,
  },
  searchInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontFamily: "raleway",
    fontSize: 15,
    color: "#333",
  },
  flightListContainer: {
    gap: 16,
  },
  flightCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  flightHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  airlineInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  airlineLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  airlineName: {
    fontSize: 16,
    fontFamily: "raleway-bold",
    color: "#333",
  },
  flightNumber: {
    color: "#888",
    fontFamily: "raleway-medium",
  },
  flightClass: {
    fontSize: 12,
    fontFamily: "raleway",
    color: "#888",
  },
  priceTag: {
    backgroundColor: "#F0F6FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  priceText: {
    color: "#4A80F0",
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  flightRoute: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 8,
  },
  routePoint: {
    alignItems: "center",
    width: 80,
  },
  cityCode: {
    fontFamily: "raleway-bold",
    fontSize: 18,
    color: "#333",
    marginBottom: 4,
  },
  cityName: {
    fontFamily: "raleway-medium",
    fontSize: 12,
    color: "#888",
    marginBottom: 4,
    textAlign: "center",
  },
  flightTime: {
    fontFamily: "raleway",
    fontSize: 12,
    color: "#333",
  },
  routeConnection: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  flightDuration: {
    fontSize: 12,
    fontFamily: "raleway-medium",
    color: "#333",
    marginBottom: 8,
  },
  routeLine: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    justifyContent: "center",
  },
  routeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#4A80F0",
  },
  routeDashedLine: {
    flex: 1,
    height: 1,
    borderWidth: 0.5,
    borderColor: "#4A80F0",
    borderStyle: "dashed",
  },
  planeIcon: {
    transform: [{ rotate: "90deg" }],
    marginHorizontal: 4,
  },
  flightStops: {
    fontSize: 12,
    fontFamily: "raleway",
    color: "#888",
    marginTop: 8,
  },

  // Completed challenges styles
  completedChallengesContainer: {
    gap: 16,
  },

  // Constituency selection styles
  constituencyCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  constituencyTitle: {
    fontSize: 18,
    fontFamily: "raleway-bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 24,
  },
  dropdownWrapper: {
    marginBottom: 16,
  },
  dropdownLabel: {
    fontSize: 14,
    fontFamily: "raleway-medium",
    color: "#666",
    marginBottom: 8,
  },
  dropdown: {
    height: 50,
    borderColor: "#E0E0E0",
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "#F9F9F9",
    paddingHorizontal: 16,
  },
  dropdownPlaceholder: {
    color: "#999",
    fontFamily: "raleway",
  },
  dropdownSelectedText: {
    color: "#333",
    fontFamily: "raleway-medium",
  },
  dropdownContainer: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  constituencySubmitButton: {
    backgroundColor: "#4A80F0",
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 16,
    alignItems: "center",
  },
  constituencySubmitText: {
    color: "white",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },

  // Alert dialog styles
  alertContainer: {
    borderRadius: 16,
    padding: 8,
  },
  alertTitle: {
    fontFamily: "raleway-bold",
    fontSize: 18,
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  alertMessage: {
    fontFamily: "raleway-medium",
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  alertCancelButtonText: {
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  alertConfirmButtonText: {
    fontFamily: "raleway-bold",
    fontSize: 14,
  },

  // Tutorial/Onboarding styles
  tutorialOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  tutorialContainer: {
    flex: 1,
    width: Dimensions.get("window").width,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  tutorialContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: "100%",
  },
  tutorialImage: {
    width: wp(80),
    height: hp(40),
    resizeMode: "contain",
    marginBottom: 24,
  },
  tutorialTitle: {
    fontSize: 24,
    fontFamily: "raleway-bold",
    color: "white",
    textAlign: "center",
    marginBottom: 16,
  },
  tutorialDescription: {
    fontSize: 16,
    fontFamily: "raleway-medium",
    color: "white",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 24,
  },
  tutorialButtonContainer: {
    marginBottom: 40,
  },
  tutorialButton: {
    flexDirection: "row",
    backgroundColor: "#4A80F0",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 30,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 200,
  },
  tutorialButtonText: {
    color: "white",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  followerModalSafeArea: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  followerModalContainer: {
    flex: 1,
    backgroundColor: "white",
    marginTop: 60,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  followerModalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  followerModalTitle: {
    fontSize: 18,
    fontFamily: "raleway-bold",
    color: "#333",
  },
  followerModalClose: {
    padding: 4,
  },
  followerModalDivider: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },
  followerModalLoading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  followerModalLoadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    fontFamily: "raleway",
  },
  followersList: {
    padding: 16,
  },
  followerItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  followerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  followerAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4A80F0",
    justifyContent: "center",
    alignItems: "center",
  },
  followerAvatarText: {
    fontSize: 20,
    fontFamily: "raleway-bold",
    color: "white",
  },
  followerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  followerName: {
    fontSize: 16,
    fontFamily: "raleway-bold",
    color: "#333",
    marginBottom: 2,
  },
  followerMeta: {
    fontSize: 14,
    fontFamily: "raleway",
    color: "#888",
  },
  followerSeparator: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginLeft: 66,
  },
  emptyFollowers: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyFollowersText: {
    fontSize: 18,
    fontFamily: "raleway-bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyFollowersSubText: {
    fontSize: 14,
    fontFamily: "raleway",
    color: "#888",
    textAlign: "center",
    maxWidth: "80%",
  },
  // Make stats clickable
  stat: {
    alignItems: "center",
    paddingVertical: 4,
  },
});

export default Moviehome;
