import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View, ActivityIndicator } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL, baseURL } from "../../backend/baseData";

const FollowRequest = ({ item, index }) => {
  const [toggled, setToggled] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigation = useNavigation();
  
  const handleConfirm = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${baseURL}/approveFollow.php?followed_user=${item.followed_user}&user_id=${item.user_id}`
      );
      
      if (response.status == 200) {
        setToggled(true);
      } else {
        console.error("Failed to approve follower");
      }
    } catch (error) {
      console.error("Error while approving follower:", error.message);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleDelete = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get(
        `${baseURL}/deleteFollow.php?followed_user=${item.followed_user}&user_id=${item.user_id}`
      );
      
      if (response.status == 200) {
        setDeleted(true);
      } else {
        console.error("Failed to delete follow request");
      }
    } catch (error) {
      console.error("Error while deleting follow request:", error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (deleted) {
    return null; // If deleted, render nothing
  }

  return (
    <View style={styles.container}>
      <View style={styles.userInfoContainer}>
        <TouchableOpacity
          style={styles.avatarTouchable}
          onPress={() => {
            navigation.navigate("OtherUserScreen", {
              user_id: item.user_id,
            });
          }}
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
        
        <View style={styles.userDetails}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.name}
          </Text>
          
          {toggled ? (
            <View style={styles.followingIndicator}>
              <Ionicons name="checkmark-circle" size={14} color="#10b981" />
              <Text style={styles.followingText}>Started following you</Text>
            </View>
          ) : (
            <Text style={styles.requestText}>Requested to follow you</Text>
          )}
        </View>
      </View>
      
      {!toggled && (
        <View style={styles.actionButtons}>
          {isLoading ? (
            <ActivityIndicator size="small" color="#6366f1" />
          ) : (
            <>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleConfirm}
                activeOpacity={0.8}
              >
                <Text style={styles.confirmButtonText}>Confirm</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
                activeOpacity={0.8}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
};

export default FollowRequest;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(2),
    backgroundColor: "#ffffff",
    borderRadius: 12,
  },
  userInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  avatarTouchable: {
    marginRight: wp(3),
  },
  avatar: {
    width: hp(5.5),
    height: hp(5.5),
    borderRadius: hp(2.75),
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
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: hp(1.8),
    fontFamily: "raleway-bold",
    color: "#111827",
    marginBottom: hp(0.3),
  },
  requestText: {
    fontSize: hp(1.5),
    fontFamily: "raleway",
    color: "#6b7280",
  },
  followingIndicator: {
    flexDirection: "row",
    alignItems: "center",
  },
  followingText: {
    fontSize: hp(1.5),
    fontFamily: "raleway",
    color: "#10b981",
    marginLeft: wp(1),
  },
  actionButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: wp(2),
  },
  confirmButton: {
    backgroundColor: "#6366f1",
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(3),
    borderRadius: 8,
  },
  confirmButtonText: {
    color: "white",
    fontFamily: "raleway-bold",
    fontSize: hp(1.5),
  },
  deleteButton: {
    paddingVertical: hp(0.7),
    paddingHorizontal: wp(3),
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  deleteButtonText: {
    fontFamily: "raleway-bold",
    fontSize: hp(1.5),
    color: "#4b5563",
  },
});