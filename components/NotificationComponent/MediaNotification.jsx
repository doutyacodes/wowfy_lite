import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import GreenIcon from "../../assets/images/green-tick.png";
import RedIcon from "../../assets/images/red-alert.png";

const MediaNotification = ({ item }) => {
  const navigation = useNavigation();
  const isApproved = item.info_type == "media_approved";
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() =>
        navigation.navigate("ChallengeDetails", {
          challenge: item.challenge,
          completeOne: true,
        })
      }
      activeOpacity={0.8}
    >
      <View style={styles.contentContainer}>
        <View style={[
          styles.iconContainer,
          isApproved ? styles.approvedIconContainer : styles.rejectedIconContainer
        ]}>
          <Image
            style={styles.statusIcon}
            source={isApproved ? GreenIcon : RedIcon}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.textContainer}>
          <View style={styles.headerContainer}>
            <Text style={[
              styles.statusText,
              isApproved ? styles.approvedText : styles.rejectedText
            ]}>
              {isApproved ? "Media Approved" : "Media Rejected"}
            </Text>
            
            <Text style={styles.timeText}>{item.time || "Just now"}</Text>
          </View>
          
          <Text style={styles.messageText}>
            Your media for challenge "{item.challenge?.title || 'Challenge'}" has been 
            {isApproved ? " approved." : " rejected."}
          </Text>
          
          <View style={styles.actionContainer}>
            <Text style={styles.viewDetailsText}>View details</Text>
            <Ionicons name="chevron-forward" size={14} color="#6366f1" />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
};

export default MediaNotification;

const styles = StyleSheet.create({
  container: {
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(2),
    backgroundColor: "#ffffff",
    borderRadius: 12,
  },
  contentContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
  },
  iconContainer: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    justifyContent: "center",
    alignItems: "center",
    marginRight: wp(3),
    padding: 8,
  },
  approvedIconContainer: {
    backgroundColor: "rgba(16, 185, 129, 0.1)",
  },
  rejectedIconContainer: {
    backgroundColor: "rgba(239, 68, 68, 0.1)",
  },
  statusIcon: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    flex: 1,
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: hp(0.5),
  },
  statusText: {
    fontSize: hp(1.8),
    fontFamily: "raleway-bold",
  },
  approvedText: {
    color: "#10b981",
  },
  rejectedText: {
    color: "#ef4444",
  },
  timeText: {
    fontSize: hp(1.4),
    fontFamily: "raleway",
    color: "#9ca3af",
  },
  messageText: {
    fontSize: hp(1.6),
    fontFamily: "raleway",
    color: "#4b5563",
    lineHeight: hp(2.2),
    marginBottom: hp(1),
  },
  actionContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  viewDetailsText: {
    fontSize: hp(1.5),
    fontFamily: "raleway-bold",
    color: "#6366f1",
    marginRight: wp(1),
  },
});