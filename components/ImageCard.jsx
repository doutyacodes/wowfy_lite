import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import axios from "axios";
import { ResizeMode, Video } from "expo-av";
import React, { useEffect, useRef, useState } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL, baseURL, baseVidUrl } from "../backend/baseData";

const ImageCard = ({ item }) => {
  const [count, setCount] = useState(parseInt(item.like_count));
  const [heartActive, setHeartActive] = useState(false);
  const [user, setUser] = useState(null);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const videoRef = useRef(null);

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
  // console.log(item.user_id)
  const handleHeart = async () => {
    if (user) {
      try {
        const response = await axios.get(
          `${baseURL}/toggle-like-contest.php?challenge_id=${item.challenge_id}&task_id=${item.task_id}&contest_id=${item.id}&user_id=${user.id}&owner=${item.user_id}`
        );

        if (response.status == 200) {
          if (heartActive) {
            setCount(count - 1);
          } else {
            setCount(count + 1);
          }
          setHeartActive(!heartActive);
          // console.log(response.data)
        } else {
          console.error("Failed to toggle likes Image");
        }
      } catch (error) {
        console.error("Error while toggling likes Image:", error.message);
      }
    }
  };

  useEffect(() => {
    const fetchLike = async () => {
      if (user && isFocused) {
        try {
          const response = await axios.get(
            `${baseURL}/checkLikedContest.php?challenge_id=${item.challenge_id}&task_id=${item.task_id}&contest_id=${item.id}&user_id=${user.id}`
          );
          if (response.status == 200) {
            if (response.data.liked == "yes") {
              setHeartActive(true);
            }
            if (response.data.liked == "no") {
              setHeartActive(false);
            }
          } else {
            console.error("Failed to fetch likes Image");
          }
        } catch (error) {
          console.error("Error while fetching likes:", error.message);
        }
      }
    };

    fetchLike();
  }, [item, user, isFocused]);

  useEffect(() => {
    if (isFocused) {
      videoRef.current?.playAsync();
    } else {
      videoRef.current?.pauseAsync();
    }
  }, [isFocused]);

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        width: wp(100),
        height: hp(100),
      }}
    >
      {item.type == "video" ? (
        <Video
          ref={videoRef}
          source={{ uri: `${baseVidUrl + item.media_path}` }}
          style={{ width: "100%", height: hp(75) }}
          resizeMode={ResizeMode.CONTAIN}
          useNativeControls={true}
          isLooping={true}
        />
      ) : (
        <View>
          <Image
            source={{ uri: `${baseImgURL + item.media_path}` }}
            style={{ width: wp(100), height: hp(75) }}
            resizeMode="contain"
          />
        </View>
      )}

      <View
        style={{
          position: "absolute",
          zIndex: -1,
          bottom: 20,
          left: 10,
          padding: 10,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            width: wp(90),
            alignItems: "center",
          }}
        >
          <View style={{ flexDirection: "row", gap: 10, alignItems: "center" }}>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("OtherUserScreen", {
                  user_id: item.id,
                })
              }
              style={styles.avatarContainer}
            >
              <Text style={styles.avatarText}>{item.first_character}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() =>
                navigation.navigate("OtherUserScreen", {
                  user_id: item.user_id,
                })
              }
              style={styles.detailsContainer}
            >
              <Text style={styles.name}>{item.name}</Text>
            </TouchableOpacity>
          </View>
          <View>
            <View style={{ flexDirection: "row", gap: 5 }}>
              <TouchableOpacity
                onPress={handleHeart}
                style={{ ...styles.caption, marginLeft: 10 }}
              >
                {heartActive ? (
                  <FontAwesome name="heart" size={20} color="red" />
                ) : (
                  <FontAwesome5 name="heart" size={20} color="black" />
                )}
              </TouchableOpacity>
            </View>
            <Text style={{ marginLeft: 12 }}>{count}</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

export default ImageCard;

const styles = StyleSheet.create({
  avatarText: {
    fontFamily: "raleway-bold",
    color: "white",
    fontSize: wp(5),
  },
  avatarContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: wp(15),
    width: wp(15),
    backgroundColor: "#ff8f8e",
    borderRadius: 50,
  },
  detailsContainer: {
    gap: 5,
  },
  name: {
    fontSize: hp(2),
    fontFamily: "raleway-bold",
  },
});
