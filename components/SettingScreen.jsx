// Home.js
import { AntDesign, Entypo } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import axios from "axios";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import wowfy_black from "../assets/logos/wowfy_black.png";
import { baseImgURL, baseURL } from "../backend/baseData";

const SettingScreen = () => {
  const [user, setUser] = useState(null);
  const [image, setImage] = useState(null);
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const handleLogout = async () => {
    try {
      // Remove user data from AsyncStorage
      await AsyncStorage.removeItem("user");

      navigation.navigate("OtpVerification");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };
  useFocusEffect(
    useCallback(() => {
      const fetchUser = async () => {
        try {
          const userString = await AsyncStorage.getItem("user");
          if (userString) {
            const userObject = JSON.parse(userString);
            setUser(userObject);
          }
        } catch (error) {
          console.error(
            "Error fetching user from AsyncStorage:",
            error.message
          );
        }
      };

      fetchUser();
    }, [isFocused])
  );
  useEffect(() => {
    const getUserDetails = async () => {
      if (user) {
        try {
          const response = await axios.post(
            `${baseURL}/getUserEditDetails.php`,
            {
              id: user.id,
            },
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );
          if (response.status == 200) {
            const userData = response.data.data;
            if (userData?.image && userData?.image?.length > 0) {
              setImage(`${baseImgURL + userData.image}`);
            }
          } else {
            console.error("Failed to fetch user details");
          }
        } catch (error) {
          console.error("Error fetching user details:", error);
        }
      }
    };

    getUserDetails();
  }, [user]);
  return (
    <View style={styles.container}>
      <View style={{ alignItems: "center" }}>
        <Image source={wowfy_black} style={styles.topLogo} />
      </View>
      <View style={{ flex: 1, position: "absolute" }}>
        <View
        // Button Linear Gradient
        >
          <View style={styles.innerContainer}>
            <TouchableOpacity
              onPress={() =>
                user
                  ? navigation.navigate("OtherUserScreen", {
                      user_id: user.id,
                    })
                  : ""
              }
              style={styles.avatarView}
            >
              <View>
                <Image
                  size={24}
                  source={{
                    uri:
                      image && image?.length > 0
                        ? `${image}`
                        : "https://img.freepik.com/free-vector/businessman-character-avatar-isolated_24877-60111.jpg?w=740&t=st=1708156284~exp=1708156884~hmac=7b2ad92a15e3d41ac3f4cbbfcbfceb780ffd0266f37bdd3379870a7d2be3cddc",
                  }}
                  style={styles.avatarImage}
                />
              </View>
              <View style={{ gap: 2 }}>
                <Text style={styles.text1}>{user?.name}</Text>
              </View>
              <Entypo
                name="chevron-right"
                size={24}
                color="black"
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleLogout} style={styles.avatarView}>
              <View style={{ paddingVertical: 20 }}>
                <AntDesign name="logout" size={26} color="black" />
              </View>
              <View style={{ gap: 2 }}>
                <Text style={styles.text1}>Logout</Text>
              </View>
              <Entypo
                name="chevron-right"
                size={24}
                color="black"
                style={{ marginLeft: "auto" }}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <StatusBar style="dark" />
    </View>
  );
};

export default SettingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  topLogo: {
    height: 50,
    width: 50,
    top: 50,
    zIndex: 10,
  },
  btn: {
    minHeight: wp(25),
    width: wp(25),
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    gap: 5,
  },

  innerContainer: {
    paddingTop: 80,
    marginTop: 20,
  },
  avatarView: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    flexDirection: "row",
    gap: 10,
    // justifyContent: "center",
    alignItems: "center",
    width: wp(95),
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,

    elevation: 2,
    margin: 10,
    borderRadius: 10,
  },
  avatarImage: {
    height: wp(20),
    width: wp(20),
    resizeMode: "cover",
    borderRadius: 70,
  },
  text1: {
    color: "gray",
    fontSize: hp(2.2),
  },
});
