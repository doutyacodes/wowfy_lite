import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Image, Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL, baseURL } from "../backend/baseData";
const SearchCard = ({ item, userId }) => {
  const [following, setFollowing] = useState(false);
  //   console.log(userId)
  //   console.log(item.id)
  const fetchFollow = async (userId) => {
    try {
      const response = await axios.get(
        `${baseURL}/checkAlreadyFollowed.php?followed_user=${userId}&user_id=${item.id}`
      );
      if (response.status == 200) {
        if (response.data.followed == "yes") {
          setFollowing(true);
        }
        if (response.data.followed == "no") {
          setFollowing(false);
        }
      } else {
        console.error("Failed to fetch following");
      }
    } catch (error) {
      console.error("Error while fetching following:", error.message);
    }
  };
  useEffect(() => {
    // fetchFollow();
  }, [userId]);

  const navigation = useNavigation();
  const handleFollow = async () => {
    try {
      const response = await axios.get(
        `${baseURL}/toggle-user-follow.php?followed_user=${userId}&user_id=${item.id}`
      );
      if (response.status == 200) {
        if (following) {
          setFollowing(true);
        } else {
          setFollowing(false);
        }
      } else {
        console.error("Failed to toggle followers");
      }
    } catch (error) {
      console.error("Error while toggling followers:", error.message);
    }
  };
  return (
    <View
      style={{
        backgroundColor: "white",
        padding: 10,
        borderColor: "#909090",
        borderWidth: 1,
        borderRadius: 5,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        flexDirection: "row",
        alignItems: "center",
        gap: 5,
      }}
    >
      <TouchableOpacity
        style={{
          justifyContent: "center",
          alignItems: "center",
          height: wp(10),
          width: wp(10),
          backgroundColor: item.image?.length > 0 ? "transparent" : "#ff8f8e",
          borderRadius: 50,
        }}
        onPress={() =>
          navigation.navigate("OtherUserScreen", {
            user_id: item.id,
          })
        }
      >
        {item.image?.length > 0 ? (
          <Image
            source={{ uri: `${baseImgURL + item.image}` }}
            style={{
              width: wp(10),
              height: wp(10),
              borderRadius: 70,
              alignSelf: "center",
            }}
          />
        ) : (
          <Text
            style={{
              fontFamily: "raleway-bold",
              color: "white",
              fontSize: wp(3.5),
            }}
          >
            {item.first_character}
          </Text>
        )}
      </TouchableOpacity>
      <Text style={{ fontSize: hp(1.5), flex: 1 }}>{item.name}</Text>
      {/* <TouchableOpacity
        style={{
          padding: 5,
          borderRadius: 5,
          borderColor: following ? "black" : "green",
          borderWidth: 1,
        }}
        onPress={handleFollow}
      >
        <Text
          style={{ fontSize: hp(1.5), color: following ? "black" : "green" }}
        >
          {following ? "Following" : "Follow"}
        </Text>
      </TouchableOpacity> */}
    </View>
  );
};

export default SearchCard;
