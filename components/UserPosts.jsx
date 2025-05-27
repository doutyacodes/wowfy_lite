import { Feather, FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import moment from "moment";
import React, { useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Animated,
  ActivityIndicator,
} from "react-native";
import MarqueeText from "react-native-marquee";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL, baseURL, baseVidUrl } from "../backend/baseData";
import { useVideoPlayer, VideoView } from "expo-video";

const UserPosts = ({ item, user_id }) => {
  const [heartActive, setHeartActive] = useState(item.already_liked);
  const [count, setCount] = useState(parseInt(item.like_count));
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const heartScale = React.useRef(new Animated.Value(1)).current;

  const toggleDescription = () => {
    setShowFullDescription((prevDescription) => !prevDescription);
  };
// Fix date parsing
const formattedDate = moment(
  item.created_at).fromNow();

  const navigation = useNavigation();

  const animateHeart = () => {
    Animated.sequence([
      Animated.timing(heartScale, {
        toValue: 1.3,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(heartScale, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleHeart = async () => {
    if (isLiking) return;
    
    setIsLiking(true);
    animateHeart();
    
    try {
      const response = await axios.get(
        `${baseURL}/toggle-post-likes.php?page_id=${item.page_id}&post_id=${item.post_id}&user_id=${user_id}`
      );

      if (response.status == 200) {
        if (heartActive) {
          setCount(count - 1);
        } else {
          setCount(count + 1);
        }
        setHeartActive(!heartActive);
      } else {
        console.error("Failed to toggle likes");
      }
    } catch (error) {
      console.error("Error while toggling likes:", error.message);
    } finally {
      setIsLiking(false);
    }
  };

  const player = useVideoPlayer(baseVidUrl + item.video, (player) => {
    // Player initialization if needed
    setVideoLoading(false);
  });

  const handleVideoLoadStart = () => {
    setVideoLoading(true);
  };

  const handleVideoLoad = () => {
    setVideoLoading(false);
  };

  return (
    <View style={styles.mainCard}>
      {/* Post Header with User Info */}
      <View style={styles.postHeader}>
        <View style={styles.userInfoContainer}>
          {item.user_image?.length > 0 ? (
            <Image
              style={styles.userAvatar}
              source={{ uri: `${baseImgURL + item.user_image}` }}
            />
          ) : (
            <View style={styles.userAvatarPlaceholder}>
              <Text style={styles.avatarText}>{item.first_character}</Text>
            </View>
          )}
          <View style={styles.userTextContainer}>
            <View style={styles.userNameRow}>
              <Text style={styles.userName}>{item.name}</Text>
              <Text style={styles.userAction}>shared a post</Text>
            </View>
            <Text style={styles.timestamp}>{formattedDate}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.moreButton}>
          <Feather name="more-horizontal" size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Post Content - Media or Text */}
      <View style={styles.contentContainer}>
        {/* Image Content */}
        {item.image && item.image?.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.9}
            style={styles.mediaContainer}
            onPress={() =>
              navigation.navigate("ImageViewingScreen", {
                imageLocation: `${baseImgURL + item.image}`,
              })
            }
          >
            <Image
              source={{ uri: `${baseImgURL + item.image}` }}
              style={styles.image}
              resizeMode="cover"
            />
            <TouchableOpacity 
              style={styles.expandButton}
              onPress={() =>
                navigation.navigate("ImageViewingScreen", {
                  imageLocation: `${baseImgURL + item.image}`,
                })
              }
            >
              <Feather name="maximize-2" size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </TouchableOpacity>
        )}

        {/* Video Content */}
        {item.video && item.video?.length > 0 && (
          <View style={styles.videoContainer}>
            <VideoView
              style={styles.video}
              player={player}
              allowsFullscreen
              allowsPictureInPicture
              onLoadStart={handleVideoLoadStart}
              onLoad={handleVideoLoad}
            />
            {videoLoading && (
              <View style={styles.videoLoading}>
                <ActivityIndicator size="large" color="#4F46E5" />
              </View>
            )}
          </View>
        )}

        {/* Text-only Post */}
        {item.textData &&
          item.textData?.length > 0 &&
          !item.video &&
          !item.image && (
            <TouchableOpacity
              style={styles.textOnlyContainer}
              onPress={toggleDescription}
              activeOpacity={0.8}
            >
              <Text style={styles.textContent}>
                {showFullDescription
                  ? item.textData
                  : item.textData.length > 150
                  ? `${item.textData.slice(0, 150)}...`
                  : item.textData}
              </Text>
              {item.textData.length > 150 && (
                <Text style={styles.readMoreText}>
                  {showFullDescription ? "Show less" : "Read more"}
                </Text>
              )}
            </TouchableOpacity>
          )}
      </View>

      {/* Caption below media */}
      {item.textData && item.textData?.length > 0 && (item.video || item.image) && (
        <TouchableOpacity
          style={styles.captionContainer}
          onPress={toggleDescription}
          activeOpacity={0.8}
        >
          <Text style={styles.captionText}>
            {showFullDescription
              ? item.textData
              : item.textData.length > 100
              ? `${item.textData.slice(0, 100)}...`
              : item.textData}
          </Text>
          {item.textData.length > 100 && (
            <Text style={styles.readMoreText}>
              {showFullDescription ? "Show less" : "Read more"}
            </Text>
          )}
        </TouchableOpacity>
      )}

      {/* Post Actions (Like, Comment) */}
      <View style={styles.actionsContainer}>
        <View style={styles.actionRow}>
          <TouchableOpacity
            onPress={handleHeart}
            style={styles.actionButton}
            disabled={isLiking}
          >
            <Animated.View style={{ transform: [{ scale: heartScale }] }}>
              {heartActive ? (
                <FontAwesome name="heart" size={20} color="#EF4444" />
              ) : (
                <FontAwesome5 name="heart" size={20} color="#64748B" />
              )}
            </Animated.View>
            <Text style={[styles.actionText, heartActive && styles.likedActionText]}>
              {count > 0 ? `${count} ${count == 1 ? 'like' : 'likes'}` : 'Like'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() =>
              navigation.navigate("CommentUser", {
                user_id: user_id,
                item: item,
              })
            }
            style={styles.actionButton}
          >
            <FontAwesome5 name="comment" size={20} color="#64748B" />
            <Text style={styles.actionText}>
              {item.comment_count > 0
                ? `${item.comment_count} ${parseInt(item.comment_count) == 1 ? 'comment' : 'comments'}`
                : 'Comment'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

export default UserPosts;

const styles = StyleSheet.create({
  mainCard: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  
  // Post Header
  postHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  userAvatar: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    marginRight: 12,
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  userAvatarPlaceholder: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: "#4F46E5",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  avatarText: {
    color: "white",
    fontSize: hp(2),
    fontFamily: "raleway-bold",
  },
  userTextContainer: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  userName: {
    fontFamily: "raleway-bold",
    fontSize: hp(1.7),
    color: "#1E293B",
    marginRight: 4,
  },
  userAction: {
    fontFamily: "raleway-medium",
    fontSize: hp(1.6),
    color: "#64748B",
  },
  timestamp: {
    fontFamily: "raleway",
    fontSize: hp(1.4),
    color: "#94A3B8",
    marginTop: 2,
  },
  moreButton: {
    padding: 8,
    marginLeft: 8,
  },
  
  // Content containers
  contentContainer: {
    width: "100%",
  },
  mediaContainer: {
    position: "relative",
    width: "100%",
  },
  image: {
    width: "100%",
    height: hp(40),
  },
  expandButton: {
    position: "absolute",
    top: 12,
    right: 12,
    backgroundColor: "rgba(0,0,0,0.5)",
    borderRadius: 8,
    padding: 8,
  },
  videoContainer: {
    width: "100%",
    height: hp(40),
    backgroundColor: "#F1F5F9",
    position: "relative",
  },
  video: {
    width: "100%",
    height: "100%",
  },
  videoLoading: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.1)",
  },
  textOnlyContainer: {
    padding: 16,
    backgroundColor: "#F8FAFC",
    minHeight: hp(15),
  },
  textContent: {
    fontFamily: "raleway",
    fontSize: hp(1.8),
    lineHeight: hp(2.6),
    color: "#334155",
  },
  captionContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 4,
  },
  captionText: {
    fontFamily: "raleway",
    fontSize: hp(1.7),
    lineHeight: hp(2.4),
    color: "#334155",
  },
  readMoreText: {
    fontFamily: "raleway-semibold",
    fontSize: hp(1.5),
    color: "#4F46E5",
    marginTop: 4,
  },
  
  // Actions section
  actionsContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 16,
  },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    paddingTop: 12,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 24,
    paddingVertical: 4,
  },
  actionText: {
    fontFamily: "raleway-medium",
    fontSize: hp(1.6),
    color: "#64748B",
    marginLeft: 8,
  },
  likedActionText: {
    color: "#EF4444",
  },
});