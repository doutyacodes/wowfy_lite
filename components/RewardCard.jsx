import { Entypo } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Card } from "react-native-paper";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL } from "../backend/baseData";

const RewardCard = ({ item, index, showModal, setInfoDetails }) => {
  let color = "#2fad72";
  let bgColor = "#d1fadf";
  if (item.status == "pending") {
    bgColor = "#d3d3d4";
    color = "gray";
  }
  if (item.status == "rejected") {
    color = "#842029";
    bgColor = "#f8d7da";
  }

  const handleComment = () => {
    if (item.comment?.length > 0) {
      setInfoDetails(item.comment);
      showModal();
    }
  };

  return (
    <Card style={styles.container} className="bg-white">
      <View style={styles.containerText} className="bg-white">
        <Image
          source={{ uri: `${baseImgURL}${item.image}` }}
          style={{ width: wp(15), height: wp(15), borderRadius: 50 }}
          className="border border-slate-400"
        />
        <View
          style={{
            width: 1,
            backgroundColor: "gray",
            height: "100%",
            marginHorizontal: 10,
            opacity: 0.2,
          }}
        />
        <View style={styles.outerContainer}>
          <View style={styles.innerContainer}>
            <Text style={styles.textDetails1}>
              {item.title?.length > 13
                ? item.title.slice(0, 13) + "..."
                : item.title}
            </Text>
          </View>
          <View style={styles.innerContainer}>
            <Text style={{ ...styles.textDetails2 }}>{item.date}</Text>
          </View>
        </View>
        <View
          style={{
            flex: 1,
            justifyContent: "center",
            alignItems: "center",
          }}
        >
          <TouchableOpacity
            style={{
              backgroundColor: bgColor,
              height: wp(13),
              width: wp(13),
              borderRadius: 50,
              justifyContent: "center",
              alignItems: "center",
            }}
            onPress={handleComment}
          >
            <Text
              style={{
                color: color,
                fontSize: wp(5),
                fontFamily: "raleway-bold",
              }}
            >
              {item.status == "rejected" ? (
                <Entypo name="info-with-circle" size={24} color="black" />
              ) : item.status == "completed" ? (
                `+` + item.reward_points
              ) : (
                item.reward_points
              )}
            </Text>
          </TouchableOpacity>
          <Text style={{ color: color }}>{item.status}</Text>
        </View>
      </View>
      {/* {item?.comment?.length>0 &&
      <View>
        <Text style={{...styles.textDetails,marginTop:10}}>Comment:</Text>
        <Text style={{...styles.textDetails,marginTop:5}}>{item.comment}</Text>
      </View>
      } */}
    </Card>
  );
};
const styles = StyleSheet.create({
  container: {
    width: wp(90),
    marginBottom: 5,
    padding: 10,
    marginHorizontal: 5,
  },
  containerText: {
    justifyContent: "space-between",
    alignItems: "center",
    flexDirection: "row",
  },
  text: {
    fontSize: hp(2.2),
    fontFamily: "raleway-bold",
  },
  outerContainer: {
    gap: 5,
  },
  innerContainer: {
    flexDirection: "row",
    gap: 5,
  },
  textDetails1: {
    fontSize: hp(1.8),
    fontFamily: "raleway-bold",
  },
  textDetails2: {
    fontSize: hp(1.6),
    color: "#898989",
  },
});
export default RewardCard;
