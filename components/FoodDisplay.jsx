import { useNavigation } from "@react-navigation/native";
import moment from "moment";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL } from "../backend/baseData";
const FoodDisplay = ({ item, type = "food" }) => {
  const challenge = item;
  const navigation = useNavigation();
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
    <View>
      <View
        style={{
          // marginTop: 10,
          padding: 5,
          borderRadius: 10,
        }}
      >
        <TouchableOpacity
          style={{
            flex: 1,
          }}
          onPress={() => {
            navigation.navigate("FoodLocation", {
              challenge: challenge,
              type: type,
            });
          }}
        >
          <View
            style={{
              padding: 5,
              gap: 10,
            }}
          >
            <View>
              <Image
                source={{ uri: `${baseImgURL + challenge.image}` }}
                style={{
                  width: wp(28),
                  minHeight: wp(28),
                  borderRadius: 15,
                  borderColor: "lightgray",
                  borderWidth: 1,
                }}
                resizeMode="cover"
              />
            </View>
            <View style={{ flexDirection: "column", gap: 3, flex: 1 }}>
              <Text
                style={{
                  fontSize: hp(1.9),
                  fontFamily: "raleway-semibold",
                  textAlign: "center",
                }}
              >
                {challenge.title?.length > 12
                  ? challenge.title.slice(0, 12) + "..."
                  : challenge.title}
              </Text>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default FoodDisplay;

const styles = StyleSheet.create({});
