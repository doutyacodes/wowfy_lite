import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Divider } from "react-native-paper";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL } from "../backend/baseData";

const VisitCard = ({ selectedMovie, challenge }) => {
  const [completedData, setCompletedData] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    if (challenge.completed == "true") {
      setCompletedData(true);
    }
  }, [challenge.completed]);

  let formattedEndDate;
  let formattedDate;

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

  return (
    <View
      style={{
        backgroundColor: "white",
        marginTop: 10,
        padding: 5,
        borderRadius: 13,
      }}
    >
      <TouchableOpacity
        style={{
          paddingLeft: 5,
          flexDirection: "row",
          gap: 10,
          alignItems: "center",
          opacity: completedData ? 0.5 : 1,
        }}
      >
        <Image
          source={{ uri: `${baseImgURL + challenge.icon}` }}
          style={{
            width: wp(10),
            minHeight: wp(12),
            borderRadius: 10,
          }}
          resizeMode="contain"
        />

        <View style={{ flexDirection: "row", gap: 2, alignItems: "center" }}>
          <Text style={{ fontFamily: "raleway-bold", fontSize: hp(1.8) }}>
            {challenge.page_title}
          </Text>
        </View>
      </TouchableOpacity>
      <TouchableOpacity
        style={{ flex: 1, marginTop: 8 }}
        onPress={() => {
          completedData
            ? ""
            : navigation.navigate("ChallengeDetails", {
                pageId: challenge.page_id,
                challenge: challenge,
                selectedMovie: selectedMovie,
              });
        }}
      >
        <View
          style={{
            padding: 5,
            flexDirection: "row",
            gap: 10,
            opacity: completedData ? 0.5 : 1,
          }}
        >
          <View>
            <Image
              source={{ uri: `${baseImgURL + challenge.image}` }}
              style={{
                width: wp(30),
                minHeight: wp(30),
                borderRadius: 15,
              }}
              resizeMode="cover"
            />
          </View>
          <View style={{ flexDirection: "column", gap: 3, flex: 1 }}>
            <Text style={{ fontSize: hp(1.9), fontFamily: "raleway-bold" }}>
              {challenge.title}
            </Text>
            <Text style={{ color: "gray" }}>{formattedDate}</Text>
            <Divider style={{ width: "100%", marginVertical: 5 }} />
            <View style={{ gap: 3 }}>
              <View style={{ flexDirection: "row", gap: 15 }}>
                <View>
                  <Text
                    style={{
                      fontSize: hp(1.5),
                    }}
                  >
                    Entry Fee
                  </Text>
                  <Text style={{ color: "gray", fontSize: hp(1.49) }}>
                    {challenge.entry_points == 0
                      ? "Nill"
                      : challenge.entry_points + " Points"}
                  </Text>
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: hp(1.5),
                    }}
                  >
                    Reward Points
                  </Text>
                  <Text style={{ color: "gray" }}>
                    {challenge.reward_points == 0
                      ? "Nill"
                      : challenge.reward_points + " Points"}
                  </Text>
                </View>
              </View>
              <View style={{ flexDirection: "row", gap: 5 }}>
                <Text
                  style={{
                    fontSize: hp(1.5),
                  }}
                >
                  Time Remaining :
                </Text>
                <Text
                  style={{
                    fontSize: hp(1.49),
                    color: "gray",
                  }}
                >
                  {formattedEndDate}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
      {completedData && (
        <Image
          source={require("../assets/images/badge.png")}
          style={{
            width: wp(20),
            minHeight: wp(20),
            borderRadius: 15,
            position: "absolute",
            top: 10,
            right: 5,
          }}
          resizeMode="cover"
        />
      )}
    </View>
  );
};

export default VisitCard;

const styles = StyleSheet.create({});
