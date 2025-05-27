import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import axios from "axios";
import moment from "moment";
import React, { useCallback, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Divider } from "react-native-paper";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import Toast from "react-native-toast-message";
import { baseImgURL, baseURL } from "../backend/baseData";
import CertificateList from "./CertificateList";
import Posts from "./Posts";

const ChallengeHomeCardVisit = ({
  challenge,
  index,
  user,
  arena,
  district,
  now = null,
  completeOne = null,
}) => {
  const [selectedMovie, setSelectedMovie] = useState([]);
  console.log("challenge.open_for",challenge.open_for)
  const [unlockChallenge, setUnlockChallenge] = useState(() => {
    if (
      challenge.open_for == "everyone" ||
      challenge.open_for == "specific"
    ) {
      return true;
    } else if (challenge.open_for == "location" && now && now == "yes") {
      return true;
    } else if (challenge.open_for == "location") {
      return false;
    } else {
      return !!now;
    }
  });

  const isFocused = useIsFocused();
  // console.log(challenge.visit)
  const navigation = useNavigation();

  useFocusEffect(
    useCallback(() => {
      const fetchMovie = async () => {
        if (challenge.info_type == "challenge" || arena == "yes") {
          try {
            if (!user || !user.id) {
              // If user or user.id doesn't exist, skip the fetch
              return;
            }

            const response = await axios.get(
              `${baseURL}/getOneChallenge.php?id=${challenge.page_id}&userId=${user.id}&district=${district}`
            );

            if (response.status == 200) {
              setSelectedMovie(response.data);
              // console.log(response.data);
            } else {
              console.error("Failed to fetch movie");
            }
          } catch (error) {
            console.error("Error while fetching movie:", error.message);
          }
        }
      };

      fetchMovie();
    }, [isFocused, user])
  );

  if (challenge.completed == "true" && !completeOne) {
    return;
  }
  if (challenge.open_for !== "everyone" && !now) {
    return;
  }
  let formattedEndDate;
  let formattedDate;
  let navUrl = "ChallengeDetails";
  if (challenge.frequency == "quiz") {
    navUrl = "LobbyScreen";
  }
  if (challenge.info_type == "challenge" || arena == "yes") {
    formattedDate = moment(challenge.start_date).fromNow();
    const endDate = moment(challenge.end_date);
    const now = moment();

    const duration = moment.duration(endDate.diff(now));

    if (duration.asDays() >= 1) {
      formattedEndDate = Math.round(duration.asDays()) + " days";
    } else if (duration.asHours() >= 1) {
      formattedEndDate =
        Math.floor(duration.asHours()) +
        ":" +
        (duration.minutes() < 10 ? "0" : "") +
        duration.minutes() +
        " hrs";
    } else {
      formattedEndDate = duration.minutes() + " minutes";
    }
  }
  // alert(challenge.user_referral_count)
  return (
    <View key={index}>
      {challenge.info_type == "challenge" || arena == "yes" ? (
        <View
          style={{
            backgroundColor: "white",
            // marginTop: 10,
            padding: 5,
            borderRadius: 10,
            shadowColor: "#000",
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,

            elevation: 5,
            marginVertical: 10,
            marginHorizontal: 5,
            borderTopWidth: 1,
            borderTopColor: "#e5e5e5",
          }}
        >
          <TouchableOpacity
            style={{
              flex: 1,
              position: "relative",
            }}
            onPress={() => {
              if (unlockChallenge || completeOne) {
                challenge.frequency == "referral"
                  ? challenge.referral_count <= challenge.user_referral_count
                    ? navigation.navigate(navUrl, {
                        pageId: challenge.page_id,
                        challenge: challenge,
                        selectedMovie: selectedMovie,
                        completeOne: completeOne,
                      })
                    : Toast.show({
                        type: "info",
                        text1: "Sorry",
                        text2: `You need ${challenge.referral_count}  referrals to complete this challenge`,
                      })
                  : navigation.navigate(navUrl, {
                      pageId: challenge.page_id,
                      challenge: challenge,
                      selectedMovie: selectedMovie,
                      completeOne: completeOne,
                    });
              } else {
                Toast.show({
                  type: "info",
                  text1: "Sorry",
                  text2: `You need to scan the qr to start the challenge`,
                });
              }
            }}
          >
            <View
              style={{
                padding: 5,
                // flexDirection: "row",
                // alignItems: "center",
                gap: 10,
              }}
            >
              <View>
                <Image
                  source={{ uri: `${baseImgURL + challenge.image}` }}
                  style={{
                    height: hp(15), // Adjust the height of the image as needed
                    width: completeOne ? "100%" : wp(80),
                    borderRadius: 13,
                    opacity: unlockChallenge || completeOne ? 1 : 0.3,
                  }}
                  resizeMode="cover"
                />
                {challenge.open_for == "specific" && (
                  <Image
                    source={require("../assets/images/now.png")}
                    style={{
                      width: wp(9),
                      height: wp(9),
                      position: "absolute",
                      top: 10,
                      right: 8,
                    }}
                    resizeMode="contain"
                  />
                )}
              </View>
              <View style={{ flexDirection: "column", gap: 1, flex: 1 }}>
                <Text style={{ fontSize: hp(1.9), fontFamily: "raleway-bold" }}>
                  {challenge.title?.length > 30
                    ? challenge.title.slice(0, 30) + "..."
                    : challenge.title}
                </Text>

                <Divider style={{ width: "100%", marginVertical: 5 }} />
                <View style={{ gap: 3 }}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-around",
                    }}
                  >
                    <View>
                      <Text
                        style={{
                          fontSize: hp(1.5),
                          fontFamily: "raleway",
                        }}
                      >
                        Entry Fee
                      </Text>
                      <Text style={{ color: "gray", fontFamily: "raleway" }}>
                        {challenge.entry_points == 0
                          ? "Nill"
                          : challenge.entry_points + " Points"}
                      </Text>
                    </View>
                    <View>
                      <Text
                        style={{
                          fontSize: hp(1.5),
                          fontFamily: "raleway",
                        }}
                      >
                        Reward Points
                      </Text>
                      <View
                        style={{ flexDirection: "row", alignItems: "center" }}
                      >
                        <Text style={{ color: "gray", fontSize: hp(1.49) }}>
                          {challenge.reward_points == 0
                            ? "Nill"
                            : challenge.reward_points + " Points"}
                        </Text>
                        {challenge.reward_points !== 0 &&
                          challenge.rewards == "yes" && (
                            <Text
                              style={{ color: "gray", fontFamily: "raleway" }}
                            >
                              {" "}
                              +{" "}
                            </Text>
                          )}
                        {challenge.rewards == "yes" && (
                          <Image
                            source={require("../assets/images/gift.gif")}
                            style={{ height: 20, width: 20 }}
                          />
                        )}
                      </View>
                    </View>
                    <View>
                      <Text
                        style={{
                          fontSize: hp(1.5),
                          fontFamily: "raleway",
                        }}
                      >
                        Time Remaining
                      </Text>
                      <Text
                        style={{
                          fontSize: hp(1.49),
                          color: "gray",
                        }}
                      >
                        {completeOne ? "Expired" : formattedEndDate}
                      </Text>
                    </View>
                  </View>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        </View>
      ) : challenge.info_type == "post" ? (
        <Posts user_id={user?.id} item={challenge} />
      ) : (
        <CertificateList
          item={challenge}
          index={index}
          user_id={user?.id}
          arena={null}
        />
      )}
    </View>
  );
};

export default ChallengeHomeCardVisit;

const styles = StyleSheet.create({});
