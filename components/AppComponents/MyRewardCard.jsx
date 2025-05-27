import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL } from "../../backend/baseData";

const MyRewardCard = ({ item, index, user }) => {
  const navigation = useNavigation();
  return (
    <View style={[styles.container, { padding: 5 }]}>
      {(item.expire == "yes" || item.cancelled == "yes") && (
        <View
          style={{
            position: "absolute",
            zIndex: 50,
            left: 0,
            right: 0,
            top: 0,
            bottom: 0,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontFamily: "raleway-bold",
              color: item.expire == "yes" ? "black" : "red",
              fontSize: hp(1.7),
            }}
          >
            {item.expire == "yes" ? "Expired" : "Cancelled"}
          </Text>
        </View>
      )}

      <TouchableOpacity
        onPress={() => {
          item.expire == "yes" || item.cancelled == "yes"
            ? console.log("pressed")
            : navigation.navigate("RewardDetails", {
                item: item,
                user: user,
              });
        }}
        style={{
          flex: 1,
          backgroundColor: "white",
          borderRadius: 13,
          overflow: "hidden",
          borderColor:
            item.expire == "yes" || item.cancelled == "yes"
              ? "black"
              : "lightgrey",
          borderWidth: 1,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 2,
          },
          shadowOpacity: 0.25,
          shadowRadius: 3.84,
          opacity: item.expire == "yes" || item.cancelled == "yes" ? 0.1 : 1,
          elevation: 5,
        }}
      >
        <Image
          source={{ uri: `${baseImgURL + item.image}` }}
          style={{ width: wp(48) - 5, height: hp(6), overflow: "hidden" }}
        />
        <View style={{ flex: 1, paddingHorizontal: 5 }}>
          <Text
            style={{
              fontSize: hp(2.1),
              fontFamily: "raleway-bold",
            }}
          >
            {item.title}
          </Text>
          <Text
            style={{
              fontSize: hp(1.4),
              marginTop: 10,
              fontFamily: "raleway",
              fontStyle: "italic",
              color: "gray",
            }}
          >
            {item.description?.length > 80
              ? item.description.slice(0, 80) + "..."
              : item.description}
          </Text>
        </View>
      </TouchableOpacity>
    </View>
  );
};

export default MyRewardCard;

const styles = StyleSheet.create({
  container: {
    width: wp(48),
    height: wp(48),
    // Add other common styles here
  },
});
