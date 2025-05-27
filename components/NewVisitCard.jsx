import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { 
  Image, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  Animated,
  Platform
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL } from "../backend/baseData";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const NewVisitCard = ({ selectedMovie, challenge }) => {
  const [completedData, setCompletedData] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState("");
  const navigation = useNavigation();
  
  // Animation value for card press feedback
  const scaleAnim = new Animated.Value(1);
  
  // Handle card press animation
  const onPressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };
  
  const onPressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 300,
      useNativeDriver: true,
    }).start();
  };

  useEffect(() => {
    // Set completed status
    if (challenge.completed == "true") {
      setCompletedData(true);
    }
    
    // Format time remaining
    updateTimeRemaining();
    
    // Update time remaining every minute
    const intervalId = setInterval(updateTimeRemaining, 60000);
    
    return () => clearInterval(intervalId);
  }, [challenge]);
  
  // Format the remaining time
  const updateTimeRemaining = () => {
    const endDate = moment(challenge.end_date);
    const now = moment();
    const duration = moment.duration(endDate.diff(now));
    
    if (duration.asDays() >= 1) {
      setTimeRemaining(Math.round(duration.asDays()) + " days left");
    } else if (duration.asHours() >= 1) {
      setTimeRemaining(
        Math.floor(duration.asHours()) +
        ":" +
        (duration.minutes() < 10 ? "0" : "") +
        duration.minutes() +
        " hrs left"
      );
    } else if (duration.asMinutes() > 0) {
      setTimeRemaining(duration.minutes() + " minutes left");
    } else {
      setTimeRemaining("Ending soon");
    }
  };
  
  // Format challenge date
  const formattedDate = moment(challenge.start_date).fromNow();
  
  // Truncate text with ellipsis
  const truncateText = (text, limit) => {
    if (!text) return '';
    if (text?.length <= limit) return text;
    return `${text.slice(0, limit).trim()}...`;
  };
  
  // Handle card press
  const handlePress = () => {
    if (!completedData) {
      navigation.navigate("ChallengeDetails", {
        pageId: challenge.page_id,
        challenge: challenge,
        selectedMovie: selectedMovie,
      });
    }
  };

  return (
    <Animated.View style={[
      styles.container,
      { transform: [{ scale: scaleAnim }] },
      completedData && styles.completedContainer
    ]}>
      <TouchableOpacity
        style={styles.cardTouchable}
        onPress={handlePress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        activeOpacity={0.9}
        disabled={completedData}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: `${baseImgURL + challenge.image}` }}
            style={styles.challengeImage}
            resizeMode="cover"
          />
          
          {/* Time indicator */}
          {!completedData && (
            <View style={styles.timeContainer}>
              <Ionicons name="time-outline" size={hp(1.4)} color="#FFFFFF" />
              <Text style={styles.timeText}>{timeRemaining}</Text>
            </View>
          )}
          
          {/* Completion badge */}
          {completedData && challenge.finished == "true" && (
            <View style={styles.badgeContainer}>
              <Image
                source={require("../assets/images/badge.png")}
                style={styles.badgeImage}
                resizeMode="contain"
              />
            </View>
          )}
          
          {/* Gradient overlay */}
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.gradient}
            start={{ x: 0.5, y: 0 }}
            end={{ x: 0.5, y: 1 }}
          />
        </View>
        
        <View style={styles.contentContainer}>
          <Text style={styles.titleText} numberOfLines={2}>
            {challenge.title}
          </Text>
          
          <View style={styles.metaContainer}>
            <Text style={styles.dateText}>{formattedDate}</Text>
            
            {completedData ? (
              <View style={styles.completedBadge}>
                <Text style={styles.completedText}>Completed</Text>
              </View>
            ) : (
              <View style={styles.pointsBadge}>
                <Text style={styles.pointsText}>
                  {challenge.reward_points || 0} pts
                </Text>
              </View>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default NewVisitCard;

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 16,
    margin: wp(1.5),
    width: wp(42),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 3,
    overflow: "hidden",
  },
  completedContainer: {
    opacity: 0.75,
  },
  cardTouchable: {
    overflow: "hidden",
    borderRadius: 16,
  },
  imageContainer: {
    position: "relative",
    height: wp(42),
    width: "100%",
  },
  challengeImage: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  timeContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: "row",
    alignItems: "center",
    zIndex: 10,
  },
  timeText: {
    color: "white",
    fontSize: hp(1.3),
    fontFamily: "raleway-medium",
    marginLeft: 3,
  },
  badgeContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 10,
  },
  badgeImage: {
    width: wp(10),
    height: wp(10),
  },
  gradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  contentContainer: {
    padding: 12,
  },
  titleText: {
    fontSize: hp(1.8),
    fontFamily: "raleway-bold",
    color: "#333",
    marginBottom: 8,
  },
  metaContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dateText: {
    fontSize: hp(1.4),
    fontFamily: "raleway-regular",
    color: "#777",
  },
  pointsBadge: {
    backgroundColor: "#f0f0f0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  pointsText: {
    fontSize: hp(1.3),
    fontFamily: "raleway-bold",
    color: "#6200EA",
  },
  completedBadge: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  completedText: {
    fontSize: hp(1.3),
    fontFamily: "raleway-bold",
    color: "white",
  },
});