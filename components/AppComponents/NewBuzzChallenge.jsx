import { useNavigation } from "@react-navigation/native";
import React from "react";
import { 
  Image, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  Pressable,
  ImageBackground
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL } from "../../backend/baseData";
import { LinearGradient } from 'expo-linear-gradient';
import { Toast } from "react-native-toast-message/lib/src/Toast";

const NewBuzzChallenge = ({ challenge, formattedDate, formattedEndDate }) => {
  const navigation = useNavigation();
  
  const handleChallengePress = () => {
    if (challenge.frequency == "referral") {
      if (challenge.referral_count <= challenge.user_referral_count) {
        navigation.navigate("ChallengeDetails", {
          pageId: challenge.page_id,
          challenge: challenge,
          selectedMovie: challenge.selectedTitle,
        });
      } else {
        Toast.show({
          type: "info",
          text1: "More referrals needed",
          text2: `You need ${challenge.referral_count - challenge.user_referral_count} more referrals to complete this challenge`,
        });
      }
    } else {
      navigation.navigate("ChallengeDetails", {
        pageId: challenge.page_id,
        challenge: challenge,
        selectedMovie: challenge.selectedTitle,
      });
    }
  };

  const truncateText = (text, limit) => {
    if (!text) return '';
    if (text?.length <= limit) return text;
    return `${text.slice(0, limit).trim()}...`;
  };

  const getTimeRemainingColor = () => {
    // This is a placeholder - you could implement logic to change color based on urgency
    return "#FF7043";
  };

  return (
    <View style={styles.challengeCard}>
      {/* Header with page info */}
      <View style={styles.headerContainer}>
        <TouchableOpacity
          style={styles.profileSection}
          onPress={() => navigation.navigate("Moviehome", { movieId: challenge.page_id })}
        >
          <Image
            source={{ uri: `${baseImgURL + challenge.icon}` }}
            style={styles.profileIcon}
          />
          <View style={styles.headerTextContainer}>
            <View style={styles.headerTitleRow}>
              <Text style={styles.pageTitle}>{truncateText(challenge.page_title, 20)}</Text>
              <Text style={styles.actionText}>added a challenge</Text>
            </View>
            <Text style={styles.dateText}>{formattedDate}</Text>
          </View>
        </TouchableOpacity>
        
        {challenge.frequency == "referral" && (
          <View style={styles.referralCounter}>
            <Text style={styles.referralText}>
              <Text style={styles.currentReferral}>{challenge.user_referral_count}</Text>
              <Text style={styles.totalReferral}>/{challenge.referral_count}</Text>
            </Text>
            <Text style={styles.referralLabel}>Referrals</Text>
          </View>
        )}
      </View>

      {/* Challenge Content */}
      <Pressable
        style={styles.challengeContent}
        onPress={handleChallengePress}
        android_ripple={{ color: 'rgba(0, 0, 0, 0.1)' }}
      >
        {/* Challenge Image with Overlay Title */}
        <View style={styles.imageContainer}>
          <ImageBackground
            source={{ uri: `${baseImgURL + challenge.image}` }}
            style={styles.challengeImage}
            imageStyle={styles.challengeImageStyle}
          >
            <LinearGradient
              colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.7)']}
              style={styles.imageGradient}
            >
              <Text style={styles.challengeTitle}>
                {truncateText(challenge.title, 45)}
              </Text>
            </LinearGradient>
          </ImageBackground>
        </View>

        {/* Challenge Details Grid */}
        <View style={styles.detailsContainer}>
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="ticket-outline" size={hp(2.2)} color="#6200EA" />
            </View>
            <Text style={styles.detailLabel}>Entry Fee</Text>
            <Text style={styles.detailValue}>
              {challenge.entry_points == 0 ? "Free" : `${challenge.entry_points} Points`}
            </Text>
          </View>
          
          <View style={[styles.detailItem, styles.middleDetail]}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="trophy-outline" size={hp(2.2)} color="#00C853" />
            </View>
            <Text style={styles.detailLabel}>Reward</Text>
            <View style={styles.rewardContainer}>
              <Text style={styles.detailValue}>
                {challenge.reward_points == 0 ? "None" : `${challenge.reward_points} Points`}
              </Text>
              {challenge.rewards == "yes" && (
                <Image
                  source={require("../../assets/images/gift.gif")}
                  style={styles.giftIcon}
                />
              )}
            </View>
          </View>
          
          <View style={styles.detailItem}>
            <View style={styles.detailIconContainer}>
              <Ionicons name="time-outline" size={hp(2.2)} color={getTimeRemainingColor()} />
            </View>
            <Text style={styles.detailLabel}>Ends In</Text>
            <Text style={[styles.detailValue, { color: getTimeRemainingColor() }]}>
              {formattedEndDate}
            </Text>
          </View>
        </View>
        
        {/* Join Challenge Button */}
        <TouchableOpacity 
          style={styles.joinButton}
          onPress={handleChallengePress}
        >
          <Text style={styles.joinButtonText}>Join Challenge</Text>
          <Ionicons name="chevron-forward" size={16} color="white" />
        </TouchableOpacity>
      </Pressable>
    </View>
  );
};

export default NewBuzzChallenge;

const styles = StyleSheet.create({
  challengeCard: {
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: hp(2),
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  profileIcon: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: "#f5f5f5",
  },
  headerTextContainer: {
    marginLeft: wp(2.5),
    flex: 1,
  },
  headerTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
  },
  pageTitle: {
    fontFamily: "raleway-bold",
    fontSize: hp(1.8),
    color: "#212121",
    marginRight: 4,
  },
  actionText: {
    fontFamily: "raleway",
    fontSize: hp(1.7),
    color: "#616161",
  },
  dateText: {
    fontFamily: "raleway",
    fontSize: hp(1.4),
    color: "#9E9E9E",
    marginTop: 2,
  },
  referralCounter: {
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: wp(2.5),
    paddingVertical: hp(0.5),
    borderRadius: 12,
  },
  referralText: {
    fontFamily: "raleway-bold",
    fontSize: hp(1.8),
  },
  currentReferral: {
    color: "#4CAF50",
  },
  totalReferral: {
    color: "#757575",
  },
  referralLabel: {
    fontFamily: "raleway",
    fontSize: hp(1.2),
    color: "#757575",
  },
  challengeContent: {
    paddingBottom: hp(1.5),
  },
  imageContainer: {
    width: "100%",
    height: hp(18),
    backgroundColor: "#f0f0f0",
  },
  challengeImage: {
    width: "100%",
    height: "100%",
    justifyContent: "flex-end",
  },
  challengeImageStyle: {
    borderRadius: 0,
  },
  imageGradient: {
    padding: wp(4),
    paddingBottom: hp(1.5),
    width: "100%",
    justifyContent: "flex-end",
  },
  challengeTitle: {
    fontFamily: "raleway-bold",
    fontSize: hp(2.2),
    color: "white",
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
  },
  detailsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: wp(3),
    paddingVertical: hp(2),
    backgroundColor: "#FAFAFA",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  detailItem: {
    flex: 1,
    alignItems: "center",
  },
  middleDetail: {
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderLeftColor: "#EEEEEE",
    borderRightColor: "#EEEEEE",
  },
  detailIconContainer: {
    width: hp(4.5),
    height: hp(4.5),
    borderRadius: hp(2.25),
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: hp(0.7),
  },
  detailLabel: {
    fontFamily: "raleway-medium",
    fontSize: hp(1.4),
    color: "#757575",
    marginBottom: hp(0.3),
  },
  detailValue: {
    fontFamily: "raleway-bold",
    fontSize: hp(1.5),
    color: "#424242",
  },
  rewardContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  giftIcon: {
    height: hp(2.2),
    width: hp(2.2),
    marginLeft: 4,
  },
  joinButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6200EA",
    borderRadius: hp(4),
    paddingVertical: hp(1),
    paddingHorizontal: wp(6),
    marginHorizontal: wp(4),
    marginTop: hp(1),
  },
  joinButtonText: {
    fontFamily: "raleway-bold",
    fontSize: hp(1.6),
    color: "white",
    marginRight: 4,
  }
});