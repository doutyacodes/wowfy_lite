import React, { useCallback, useState, useRef } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Share,
  Alert,
  Platform,
} from "react-native";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import axios from "axios";
import AwesomeAlert from "react-native-awesome-alerts";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL, baseURL } from "../backend/baseData";
import { 
  Feather, 
  FontAwesome, 
  FontAwesome5, 
  Ionicons, 
  MaterialCommunityIcons,
  Octicons 
} from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const PeopleCard = ({ item, user_id }) => {
  // State variables
  const [heartActive, setHeartActive] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [reportMenu, setReportMenu] = useState(false);
  const [count, setCount] = useState(parseInt(item.like_count));
  const [selectedMovie, setSelectedMovie] = useState([]);
  const [visitingPageId, setVisitingPageId] = useState(null);
  const [challenge, setChallenge] = useState([]);
  const [imageLoading, setImageLoading] = useState(true);
  const [isDoubleTapped, setIsDoubleTapped] = useState(false);
  
  // Navigation and focus hooks
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const lastTap = useRef(null);
  
  // Fetch data when component is focused
  useFocusEffect(
    useCallback(() => {
      // Fetch like status
      const fetchLike = async () => {
        try {
          const response = await axios.get(
            `${baseURL}/checkAlreadyLiked.php?challenge_id=${item.challenge_id}&people_id=${item.id}&user_id=${user_id}`
          );
          
          if (response.status == 200) {
            if (response.data.liked == "yes") {
              setHeartActive(true);
            } else if (response.data.liked == "no") {
              setHeartActive(false);
            }
            setVisitingPageId(response.data.user_pageId);
          }
        } catch (error) {
          console.error("Error while fetching likes:", error.message);
        }
      };
      
      // Fetch movie details
      const fetchMovie = async () => {
        try {
          if (!user_id) return;
          
          const response = await axios.get(
            `${baseURL}/getOneChallenge.php?id=${item.page_id}&userId=${user_id}`
          );
          
          if (response.status == 200) {
            setSelectedMovie(response.data);
          }
        } catch (error) {
          console.error("Error while fetching movie:", error.message);
        }
      };
      
      // Fetch challenge details
      const fetchChallenge = async () => {
        try {
          if (!user_id) return;
          
          const response = await axios.get(
            `${baseURL}/getChallengeOne.php?challenge_id=${item.challenge_id}&user_id=${user_id}`
          );
          
          if (response.status == 200) {
            setChallenge(response.data);
          }
        } catch (error) {
          console.error("Error while fetching challenge:", error.message);
        }
      };
      
      // Fetch all data in parallel
      Promise.all([fetchLike(), fetchMovie(), fetchChallenge()]);
    }, [isFocused, user_id, item.challenge_id, item.id, item.page_id])
  );
  
  // Show/hide report alert
  const toggleReportAlert = () => {
    setShowAlert(!showAlert);
    setReportMenu(false);
  };
  
  // Show/hide report menu
  const toggleReportMenu = () => {
    setReportMenu(!reportMenu);
  };
  
  // Handle report submission
  const handleReport = async () => {
    try {
      const response = await axios.get(
        `${baseURL}/report-media.php?challenge_id=${item.challenge_id}&people_id=${item.id}&user_id=${user_id}`
      );
      
      if (response.status == 200) {
        // Report submitted successfully
        Alert.alert(
          "Report Submitted",
          "Thank you for your report. We'll review it shortly."
        );
      }
    } catch (error) {
      console.error("Error while reporting media:", error.message);
      Alert.alert(
        "Error",
        "Failed to submit report. Please try again later."
      );
    }
    setShowAlert(false);
  };
  
  // Handle like/unlike
  const handleHeart = async () => {
    try {
      const response = await axios.get(
        `${baseURL}/toggle-like.php?challenge_id=${item.challenge_id}&people_id=${item.id}&user_id=${user_id}`
      );
      
      if (response.status == 200) {
        if (heartActive) {
          setCount(count - 1);
        } else {
          setCount(count + 1);
          animateHeart();
        }
        setHeartActive(!heartActive);
      }
    } catch (error) {
      console.error("Error while toggling likes:", error.message);
    }
  };
  
  // Handle double tap to like
  const handleDoubleTap = () => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;
    
    if (lastTap.current && now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double tap detected
      if (!heartActive) {
        handleHeart();
      } else {
        animateHeart();
      }
      lastTap.current = null;
    } else {
      // First tap
      lastTap.current = now;
    }
  };
  
  // Animate heart icon on like
  const animateHeart = () => {
    setIsDoubleTapped(true);
    scaleAnim.setValue(0);
    
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(500),
      Animated.timing(scaleAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsDoubleTapped(false);
    });
  };
  
  // Handle share
  const handleShare = async () => {
    try {
      const shareMessage = `Check out this amazing challenge completed by ${item.name} on ${item.page_title} - ${item.challenge_title}!`;
      
      await Share.share({
        message: shareMessage,
        url: `${baseImgURL + item.image}`,
        title: 'Challenge Completed',
      });
    } catch (error) {
      console.error("Error sharing content:", error);
    }
  };
  
  // Navigate to challenge
  const handleNavigation = () => {
    if (item.complete == "yes") {
      navigation.navigate("Moviehome", {
        movieId: item.page_id,
      });
    } else if (item.complete == "no") {
      navigation.navigate("ChallengeDetails", {
        pageId: item.page_id,
        challenge: challenge,
        selectedMovie: selectedMovie,
      });
    }
  };
  
  return (
    <View style={styles.cardContainer}>
      {/* Card Header */}
      <View style={styles.cardHeader}>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate("OtherUserScreen", {
              user_id: item.user_id,
            });
          }}
          style={styles.userInfo}
        >
          {/* User Avatar */}
          <View style={styles.avatarContainer}>
            {item.user_image?.length > 0 ? (
              <Image
                style={styles.avatarImage}
                source={{ uri: `${baseImgURL + item.user_image}` }}
              />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>{item.first_character}</Text>
              </View>
            )}
          </View>
          
          {/* User Details */}
          <View style={styles.userDetailsContainer}>
            <Text style={styles.userName}>{item.name}</Text>
            <Text style={styles.postDate}>{item.date}</Text>
          </View>
        </TouchableOpacity>
        
        {/* Options Button */}
        <TouchableOpacity
          style={styles.optionsButton}
          onPress={toggleReportMenu}
        >
          <Feather name="more-vertical" size={24} color="#555" />
        </TouchableOpacity>
        
        {/* Options Menu */}
        {reportMenu && (
          <View style={styles.optionsMenu}>
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={toggleReportAlert}
            >
              <Octicons name="report" size={16} color="#E53935" style={styles.optionIcon} />
              <Text style={styles.optionText}>Report</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.optionItem}
              onPress={handleShare}
            >
              <Feather name="share-2" size={16} color="#555" style={styles.optionIcon} />
              <Text style={styles.optionText}>Share</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      {/* Challenge Info */}
      <TouchableOpacity
        style={styles.challengeInfoContainer}
        onPress={handleNavigation}
      >
        <Image
          source={{ uri: `${baseImgURL + item.icon}` }}
          style={styles.challengeIcon}
        />
        <View style={styles.challengeDetails}>
          <Text style={styles.challengeName}>
            {item.page_title} - {item.challenge_title}
          </Text>
          <Text style={styles.challengeStatus}>
            <Text style={styles.statusHighlight}>Completed</Text> {item.challenge_title} challenge
          </Text>
        </View>
      </TouchableOpacity>
      
      {/* Card Image */}
      <TouchableOpacity
        activeOpacity={0.9}
        // onPress={() =>
        //   navigation.navigate("ImageViewingScreen", {
        //     imageLocation: `${baseImgURL + item.image}`,
        //   })
        // }
        onLongPress={handleShare}
        delayLongPress={500}
        onPress={handleDoubleTap}
        style={styles.imageContainer}
      >
        <Image
          style={styles.cardImage}
          source={{ uri: `${baseImgURL + item.image}` }}
          onLoadStart={() => setImageLoading(true)}
          onLoadEnd={() => setImageLoading(false)}
        />
        
        {imageLoading && (
          <View style={styles.imageLoadingContainer}>
            <View style={styles.imageLoadingIndicator} />
          </View>
        )}
        
        {/* Double-tap Heart Animation */}
        {isDoubleTapped && (
          <Animated.View 
            style={[
              styles.heartAnimationContainer,
              {
                transform: [
                  { 
                    scale: scaleAnim.interpolate({
                      inputRange: [0, 0.5, 1],
                      outputRange: [0, 1.2, 1]
                    })
                  }
                ],
                opacity: scaleAnim.interpolate({
                  inputRange: [0, 0.1, 0.8, 1],
                  outputRange: [0, 1, 1, 0]
                })
              }
            ]}
          >
            <FontAwesome name="heart" size={wp(20)} color="white" />
          </Animated.View>
        )}
      </TouchableOpacity>
      
      {/* Card Actions */}
      <View style={styles.cardActions}>
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleHeart}
          >
            {heartActive ? (
              <FontAwesome name="heart" size={22} color="#E53935" />
            ) : (
              <FontAwesome5 name="heart" size={22} color="#333" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={() =>
              navigation.navigate("CommentPost", {
                user_id: user_id,
                item: {
                  post_id: item.id,
                  page_id: item.page_id,
                },
              })
            }
          >
            <FontAwesome5 name="comment" size={22} color="#333" />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.actionButton}
            onPress={handleShare}
          >
            <Feather name="share" size={22} color="#333" />
          </TouchableOpacity>
        </View>
        
        {/* Like Count */}
        {count > 0 && (
          <Text style={styles.likeCount}>
            {count} {count == 1 ? 'like' : 'likes'}
          </Text>
        )}
      </View>
      
      {/* Report Alert */}
      <AwesomeAlert
        show={showAlert}
        showProgress={false}
        title="Report Content"
        message="Are you sure you want to report this content as inappropriate?"
        closeOnTouchOutside={true}
        closeOnHardwareBackPress={false}
        showCancelButton={true}
        showConfirmButton={true}
        cancelText="Cancel"
        confirmText="Report"
        confirmButtonColor="#E53935"
        onCancelPressed={toggleReportAlert}
        onConfirmPressed={handleReport}
        titleStyle={styles.alertTitle}
        messageStyle={styles.alertMessage}
        contentContainerStyle={styles.alertContainer}
        cancelButtonTextStyle={styles.alertCancelText}
        confirmButtonTextStyle={styles.alertConfirmText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  // Card Container
  cardContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    marginHorizontal: 12,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: "hidden",
  },
  
  // Card Header
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomColor: "#F0F0F0",
    borderBottomWidth: 1,
    position: "relative",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarContainer: {
    height: wp(10),
    width: wp(10),
    borderRadius: wp(5),
    overflow: "hidden",
    marginRight: 12,
  },
  avatarImage: {
    height: "100%",
    width: "100%",
    borderRadius: wp(5),
  },
  avatarPlaceholder: {
    height: "100%",
    width: "100%",
    backgroundColor: "#FF5E7D",
    borderRadius: wp(5),
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontFamily: "raleway-bold",
    color: "white",
    fontSize: wp(4),
  },
  userDetailsContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontFamily: "raleway-bold",
    color: "#333",
  },
  postDate: {
    fontSize: 12,
    fontFamily: "raleway",
    color: "#888",
    marginTop: 2,
  },
  optionsButton: {
    padding: 8,
    marginLeft: 8,
  },
  optionsMenu: {
    position: "absolute",
    top: 48,
    right: 16,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
    zIndex: 100,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  optionIcon: {
    marginRight: 8,
  },
  optionText: {
    fontSize: 14,
    fontFamily: "raleway-medium",
    color: "#333",
  },
  
  // Challenge Info
  challengeInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#F9F9F9",
    borderBottomColor: "#F0F0F0",
    borderBottomWidth: 1,
  },
  challengeIcon: {
    height: wp(9),
    width: wp(9),
    borderRadius: 8,
  },
  challengeDetails: {
    marginLeft: 12,
    flex: 1,
  },
  challengeName: {
    fontSize: 14,
    fontFamily: "raleway-bold",
    color: "#333",
    marginBottom: 2,
  },
  challengeStatus: {
    fontSize: 12,
    fontFamily: "raleway",
    color: "#666",
  },
  statusHighlight: {
    fontFamily: "raleway-bold",
    color: "#4CAF50",
  },
  
  // Card Image
  imageContainer: {
    position: "relative",
    width: "100%",
    height: wp(90),
    backgroundColor: "#F0F0F0",
  },
  cardImage: {
    width: "100%",
    height: "100%",
    resizeMode: "cover",
  },
  imageLoadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
  },
  imageLoadingIndicator: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#DDD",
    borderTopColor: "#4A80F0",
    transform: [{ rotate: "45deg" }],
  },
  heartAnimationContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.2)",
  },
  
  // Card Actions
  cardActions: {
    padding: 16,
  },
  actionButtons: {
    flexDirection: "row",
    marginBottom: 8,
  },
  actionButton: {
    marginRight: 20,
  },
  likeCount: {
    fontSize: 14,
    fontFamily: "raleway-bold",
    color: "#333",
    marginTop: 4,
  },
  
  // Alert Styles
  alertContainer: {
    borderRadius: 16,
    overflow: "hidden",
  },
  alertTitle: {
    fontFamily: "raleway-bold",
    fontSize: 18,
    textAlign: "center",
    color: "#333",
  },
  alertMessage: {
    fontFamily: "raleway",
    fontSize: 14,
    textAlign: "center",
    color: "#666",
  },
  alertCancelText: {
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
  alertConfirmText: {
    fontFamily: "raleway-bold",
    fontSize: 14,
  },
});

export default PeopleCard;