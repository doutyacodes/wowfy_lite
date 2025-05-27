import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL } from "../../backend/baseData";

const CommentNotification = ({ item }) => {
  const navigation = useNavigation();
  
  // Determine notification icon based on type
  const getNotificationIcon = () => {
    switch(item.info_type) {
      case 'user_replied':
        return <Ionicons name="chatbubble-outline" size={16} color="#6366f1" />;
      case 'user_post_comment':
        return <Ionicons name="chatbox-outline" size={16} color="#6366f1" />;
      case 'user_comment_liked':
        return <Ionicons name="heart-outline" size={16} color="#6366f1" />;
      default:
        return <Ionicons name="notifications-outline" size={16} color="#6366f1" />;
    }
  };
  
  // Get notification message based on type
  const getNotificationMessage = () => {
    switch(item.info_type) {
      case 'user_replied':
        return "replied to your comment";
      case 'user_post_comment':
        return "commented on your post";
      case 'user_comment_liked':
        return "liked your comment";
      default:
        return "interacted with your content";
    }
  };
  
  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() =>
        navigation.navigate("CommentUser", {
          user_id: item.user_id,
          item: { post_id: item.post_id },
        })
      }
      activeOpacity={0.7}
    >
      <View style={styles.leftContent}>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate("OtherUserScreen", {
              user_id: item.other_user,
            });
          }}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          {item.user_image?.length > 0 ? (
            <Image
              style={styles.avatar}
              source={{ uri: `${baseImgURL + item.user_image}` }}
            />
          ) : (
            <View style={styles.defaultAvatar}>
              <Text style={styles.avatarText}>{item.first_character || "?"}</Text>
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.textContainer}>
          <Text style={styles.messageText}>
            <Text style={styles.userName}>{item.name}</Text>{" "}
            {getNotificationMessage()}
          </Text>
          
          <View style={styles.metaContainer}>
            {getNotificationIcon()}
            <Text style={styles.timeText}>{item.time || "Just now"}</Text>
          </View>
        </View>
      </View>
      
      <View style={styles.rightContent}>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );
};

export default CommentNotification;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(2),
    borderRadius: 12,
    backgroundColor: "#ffffff",
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatar: {
    width: hp(5.5),
    height: hp(5.5),
    borderRadius: hp(2.75),
    backgroundColor: "#f3f4f6",
  },
  defaultAvatar: {
    width: hp(5.5),
    height: hp(5.5),
    borderRadius: hp(2.75),
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    fontFamily: "raleway-bold",
    color: "white",
    fontSize: hp(2),
  },
  textContainer: {
    marginLeft: wp(3),
    flex: 1,
  },
  messageText: {
    fontSize: hp(1.7),
    fontFamily: "raleway",
    color: "#4b5563",
    lineHeight: hp(2.3),
  },
  userName: {
    fontFamily: "raleway-bold",
    color: "#111827",
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hp(0.5),
  },
  timeText: {
    fontSize: hp(1.4),
    fontFamily: "raleway",
    color: "#9ca3af",
    marginLeft: wp(1.5),
  },
  rightContent: {
    paddingLeft: wp(2),
  },
});