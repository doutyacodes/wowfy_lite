import { Entypo, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import axios from "axios";
import * as Clipboard from "expo-clipboard";
import React, { useCallback, useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import coins from "../assets/images/coins.png";
import share from "../assets/images/share.png";
import user_join from "../assets/images/user_join.png";
import { baseURL } from "../backend/baseData";
import TopBar from "./AppComponents/TopBar";

const ReferralPage = () => {
  const [user, setUser] = useState(null);
  const [userData, setUserData] = useState([]);
  const [referralData, setReferralData] = useState([]);
  const [monthCount, setMonthCount] = useState(0);
  const [totalCount, setTotalCount] = useState(0);

  const navigation = useNavigation();
  const isFocused = useIsFocused();
  useFocusEffect(
    useCallback(() => {
      const fetchUserAndFollow = async () => {
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

      fetchUserAndFollow();
    }, [isFocused])
  );
  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(userData.referral_id);
  };
  const onShare = async () => {
    try {
      const result = await Share.share({
        message: `Hey there,
  
          I've been hooked on Wowfy lately—it's an awesome app that's made my life a whole lot easier. If you're looking to join, why not use my referral code -- ${userData.referral_id} ? We both get rewarded, and trust me, you won't regret it!
          
          Download Wowfy now and let's enjoy the perks together.
          
          Cheers,
          ${userData.name}`,
      });
      if (result.action == Share.sharedAction) {
        if (result.activityType) {
          // shared with activity type of result.activityType
        } else {
          // shared
        }
      } else if (result.action == Share.dismissedAction) {
        // dismissed
      }
    } catch (error) {
      Alert.alert(error.message);
    }
  };
  useEffect(() => {
    const fetchPeople = async () => {
      if (user) {
        try {
          const response = await axios.get(
            `${baseURL}/getOtherUser.php?user_id=${user.id}`
          );
          if (response.status == 200) {
            setUserData(response.data);
          } else {
            console.error("Failed to fetch other");
          }
        } catch (error) {
          console.error("Error while fetching other:", error.message);
        }
      }
    };

    fetchPeople();
    const getReferData = async () => {
      if (user) {
        try {
          const response = await axios.get(
            `${baseURL}/getReferData.php?userId=${user.id}`
          );
          if (response.status == 200) {
            setReferralData(response.data.challenges);
            // console.log(response.data.challenges);
          } else {
            console.error("Failed to fetch refer");
          }
        } catch (error) {
          console.error("Error while fetching refer:", error.message);
        }
      }
    };

    getReferData();
    const getReferralcounts = async () => {
      if (user) {
        try {
          const response = await axios.get(
            `${baseURL}/getReferralcounts.php?user_id=${user.id}`
          );
          if (response.status == 200) {
            setTotalCount(response.data.total_count);
            setMonthCount(response.data.this_month);
            // console.log(response.data.challenges);
          } else {
            console.error("Failed to fetch referral");
          }
        } catch (error) {
          console.error("Error while fetching referral:", error.message);
        }
      }
    };

    getReferralcounts();
  }, [user]);
  const getCurrentMonth = () => {
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];
    const currentDate = new Date();
    return months[currentDate.getMonth()];
  };
  return (
    <ScrollView style={styles.container}>
      <View
        style={{
          minHeight: hp(30),
          backgroundColor: "#5340eb",
          paddingHorizontal: 10,
          position: "relative",
          paddingBottom: 20,
        }}
      >
        <TopBar marginTop={40} color={"white"} user={user} />

        <View>
          <Text style={{ color: "#e8e5fc", fontSize: hp(2.5) }}>
            Refer Your Friends
          </Text>
          <Text
            style={{
              color: "white",
              fontSize: hp(4),
              fontFamily: "raleway-bold",
            }}
          >
            Earn Rewards
          </Text>
        </View>
        <View
          style={{
            backgroundColor: "white",
            padding: 10,
            borderRadius: 5,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 10,
            },
            shadowOpacity: 0.51,
            shadowRadius: 13.16,

            elevation: 20,
            marginTop: 10,
          }}
        >
          <View
            style={{
              flex: 1,
              flexDirection: "row",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              <Text
                style={{
                  color: "#bdbdbd",
                  fontSize: hp(1.9),
                  textAlign: "center",
                }}
              >
                Total Referrals
              </Text>
              <Text
                style={{
                  fontFamily: "raleway-bold",
                  textAlign: "center",
                  fontSize: hp(2.5),
                }}
              >
                {totalCount}
              </Text>
            </View>
            <View
              style={{ borderWidth: 0.25, height: "100%", borderColor: "gray" }}
            />
            <View style={{ justifyContent: "center", alignItems: "center" }}>
              <Text
                style={{
                  color: "#bdbdbd",
                  fontSize: hp(1.9),
                  textAlign: "center",
                }}
              >
                Total Referrals in {getCurrentMonth()}
              </Text>
              <Text
                style={{
                  fontFamily: "raleway-bold",
                  textAlign: "center",
                  fontSize: hp(2.5),
                }}
              >
                {monthCount}
              </Text>
            </View>
          </View>
        </View>
        <View
          style={{
            justifyContent: "center",
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
            marginTop: 15,
          }}
        >
          <TouchableOpacity onPress={copyToClipboard}>
            <Text style={{ color: "white", fontSize: hp(2) }}>
              {userData.referral_id}
            </Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={copyToClipboard}>
            <MaterialIcons name="content-copy" size={hp(2)} color="white" />
          </TouchableOpacity>
          <TouchableOpacity onPress={onShare}>
            <Entypo name="share" size={hp(2)} color="white" />
          </TouchableOpacity>
        </View>
      </View>
      <View style={{ padding: 10 }}>
        <View
          style={{
            backgroundColor: "#f6f5fe",
            gap: 15,
            padding: 10,
            borderRadius: 5,
          }}
        >
          <View style={{ flexDirection: "row", gap: 15, alignItems: "center" }}>
            <View
              style={{
                padding: 10,
                borderRadius: 50,
                backgroundColor: "white",
              }}
            >
              <Image
                source={share}
                style={{ width: hp(3.5), height: hp(3.5) }}
              />
            </View>
            <Text
              style={{
                fontFamily: "raleway-bold",
                fontSize: hp(2),
                flex: 1,
                lineHeight: 25,
              }}
            >
              Invite your friends to install the app with the link
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 15, alignItems: "center" }}>
            <View
              style={{
                padding: 10,
                borderRadius: 50,
                backgroundColor: "white",
              }}
            >
              <Image
                source={user_join}
                style={{ width: hp(3.5), height: hp(3.5) }}
              />
            </View>
            <Text
              style={{
                fontFamily: "raleway-bold",
                fontSize: hp(2),
                flex: 1,
                lineHeight: 25,
              }}
            >
              Your friend login with the referral Id
            </Text>
          </View>
          <View style={{ flexDirection: "row", gap: 15, alignItems: "center" }}>
            <View
              style={{
                padding: 10,
                borderRadius: 50,
                backgroundColor: "white",
              }}
            >
              <Image
                source={coins}
                style={{ width: hp(3.5), height: hp(3.5) }}
              />
            </View>
            <Text
              style={{
                fontFamily: "raleway-bold",
                fontSize: hp(2),
                flex: 1,
                lineHeight: 25,
              }}
            >
              You will be rewarded with Wowcoins
            </Text>
          </View>
        </View>
        <View>
          {referralData?.length > 0 &&
            referralData.map((item, index) => {
              if (item.user_referral_count >= item.referral_count) {
                return null; // Render nothing if user's referral count is greater than or equal to referral count
              }
              return (
                <View
                  key={index}
                  style={{
                    backgroundColor: "white",
                    shadowColor: "#000",
                    marginTop: 10,
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.23,
                    shadowRadius: 2.62,

                    elevation: 4,
                    borderRadius: 5,
                    padding: 10,
                  }}
                >
                  <View
                    style={{
                      flexDirection: "row",
                      gap: 10,
                      alignItems: "center",
                    }}
                  >
                    <Image
                      source={require("../assets/images/wowcoin.png")}
                      style={{ width: wp(12), height: wp(12) }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontWeight: "bold", fontSize: hp(2) }}>
                        Refer {item.referral_count} people and get{" "}
                        {item.reward_points} wowcoins
                      </Text>
                    </View>
                    <Text style={{ fontWeight: "bold", fontSize: hp(1.9) }}>
                      {item.user_referral_count}/{item.referral_count}
                    </Text>
                  </View>
                </View>
              );
            })}
        </View>
      </View>
    </ScrollView>
  );
};

export default ReferralPage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topLogo: {
    height: 50,
    width: 50,
    // marginRight:15
  },
  settingsIcon: {
    padding: 1,
    position: "relative",
    zIndex: 800,
    flexDirection: "row",
    gap: 20,
    alignItems: "center",
  },
});
