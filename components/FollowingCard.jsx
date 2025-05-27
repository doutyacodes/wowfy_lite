import axios from "axios";
import React, { useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL, baseURL } from "../backend/baseData";
const FollowingCard = ({ item, user_id }) => {
  const [followingUser, setFollowingUser] = useState(
    item.followed_user == "yes" ? true : false
  );
  // console.log(item.following);
  const toggleFollow = async () => {
    if (user_id) {
      if (item.followed_user != user_id) {
        try {
          const response = await axios.get(
            `${baseURL}/toggle-user-follow.php?followed_user=${followed_user}&user_id=${user_id}`
          );

          if (response.status == 200) {
            setFollowingUser(!followingUser);
            // console.log(response.data);
          } else {
            console.error("Failed to toggle followers");
          }
        } catch (error) {
          console.error("Error while toggling followers:", error.message);
        }
      }
    }
  };
  return (
    <View
      style={{
        marginTop: 20,
        paddingHorizontal: 10,
        flexDirection: "row",
        gap: 5,
        alignItems: "center",
      }}
    >
      <View
        style={{
          justifyContent: "center",
          alignItems: "center",
          height: wp(15),
          width: wp(15),
          backgroundColor: "#ff8f8e",
          borderRadius: 50,
        }}
      >
        {item.user_image?.length > 0 ? (
          <Image
            source={{ uri: `${baseImgURL + item.user_image}` }}
            style={{
              width: wp(15),
              height: wp(15),
              borderRadius: 50,
            }}
          />
        ) : (
          <Text
            style={{
              fontFamily: "raleway-bold",
              color: "white",
              fontSize: wp(5),
            }}
          >
            {item.first_character}
          </Text>
        )}
      </View>
      <Text
        style={{
          fontSize: hp(1.9),
          fontFamily: "raleway-semibold",
          flex: 1,
          textAlign: "center",
        }}
      >
        {item.name}
      </Text>
      <TouchableOpacity
        style={{
          backgroundColor: item.followed_user != user_id ? "#0866ff" : "gray",
          padding: 8,
          borderRadius: 3,
        }}
        onPress={toggleFollow}
      >
        <Text
          style={{
            fontSize: hp(1.7),
            fontFamily: "raleway-bold",
            color: "white",
          }}
        >
          {followingUser ? "Unfollow" : "Follow"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default FollowingCard;

const styles = StyleSheet.create({});
