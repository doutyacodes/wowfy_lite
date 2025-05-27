import { FontAwesome5 } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import React, { useEffect, useState } from "react";
import { Image, ScrollView, Text, TouchableOpacity, View } from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import Barcode from "./AppComponents/Barcode";

const FlightDetail = () => {
  // State for countdown timer
  const [timeLeft, setTimeLeft] = useState(0); // 01:59 hours in seconds
  const [timeLeft2, setTimeLeft2] = useState(7199); // 01:59 hours in seconds

  useEffect(() => {
    if (timeLeft > 0) {
      const timerId = setInterval(() => {
        setTimeLeft((prevTime) => prevTime - 1);
      }, 1000);

      return () => clearInterval(timerId);
    }
  }, [timeLeft]);
  useEffect(() => {
    if (timeLeft2 > 0) {
      const timerId = setInterval(() => {
        setTimeLeft2((prevTime) => prevTime - 1);
      }, 1000);

      return () => clearInterval(timerId);
    }
  }, [timeLeft2]);

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins
      .toString()
      .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <ScrollView className="flex-1">
      <View className="flex-1 relative ">
        <View style={{ height: hp(30), width: wp(100) }} className="relative">
          <Image
            source={require("../assets/images/map.jpg")}
            resizeMode="cover"
            className="w-full h-full"
          />
          <BlurView
            className="z-20 absolute bg-black/50"
            style={{ height: hp(40), width: wp(100) }}
          />
          <Text className="text-white text-3xl">HU</Text>
          <Image
            source={require("../assets/images/flight.png")}
            style={{
              height: wp(20),
              width: wp(20),
              bottom: hp(10),
              right: wp(10),
            }}
            className="absolute z-40"
            resizeMode="cover"
          />
          <Text
            style={{
              width: wp(70),
              bottom: hp(10),
              left: wp(10),
              fontFamily: "raleway-bold",
            }}
            className="absolute z-40 text-white text-3xl"
          >
            Indigo Flight
          </Text>
        </View>
        <View
          className="shadow-lg  z-50 bg-white space-y-3 p-3"
          style={{ minHeight: hp(70), width: wp(100) }}
        >
          <View
            className="bg-white w-full rounded-md border border-black/5 py-5 px-4 justify-center space-y-4"
            style={{
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
              // minHeight: hp(30),
              // gap: 10,
            }}
          >
            <View className="w-full flex-row justify-between items-center">
              <View style={{ gap: 5, flex: 1 }}>
                <Text className="text-black/50 text-sm text-center">From</Text>
                <Text
                  style={{ fontFamily: "raleway-bold" }}
                  className="text-lg text-center"
                >
                  COK
                </Text>
              </View>
              <View>
                <FontAwesome5 name="plane" size={24} color="gray" />
              </View>
              <View style={{ gap: 5, flex: 1 }}>
                <Text className="text-black/50 text-sm text-center">To</Text>
                <Text
                  style={{ fontFamily: "raleway-bold" }}
                  className="text-lg text-center"
                >
                  BLR
                </Text>
              </View>
            </View>
            <View className="w-full flex-row justify-between">
              <View style={{ gap: 5, flex: 1 }}>
                <Text className="text-black/50 text-sm text-center">Date</Text>
                <Text className="font-bold text-lg text-center">
                  09 DEC 2024
                </Text>
              </View>
              <View style={{ gap: 5, flex: 1 }}>
                <Text className="text-black/50 text-sm text-center">ID</Text>
                <Text className="font-bold text-lg text-center">QP-1359</Text>
              </View>
            </View>
            <View className="w-full flex-row justify-between">
              <View style={{ gap: 5, flex: 1 }}>
                <Text className="text-black/50 text-sm text-center">
                  Scheduled Departure
                </Text>
                <Text className="font-bold text-lg text-center">09:30 AM</Text>
              </View>
              <View style={{ gap: 5, flex: 1 }}>
                <Text className="text-black/50 text-sm text-center">GATE</Text>
                <Text className="font-bold text-lg text-center">HP3</Text>
              </View>
            </View>
            <View className="mt-3 w-full">
              <Barcode value="QP-1359" format="CODE128" height={60} />
            </View>
          </View>
          <View
            className="bg-white w-full rounded-md border border-black/5 p-2 flex-row justify-between items-center"
            style={{
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Text className="text-xl font-bold">Check-in</Text>
            <View className="p-1 py-3 space-y-2 justify-center items-center bg-white">
              <Text
                className="text-black/40 text-xs mt-2"
                style={{ fontFamily: "raleway" }}
              >
                Time remaining
              </Text>
              <Text className="text-xl font-bold">{formatTime(timeLeft)}</Text>
            </View>
          </View>
          <View
            className="bg-white w-full rounded-md border border-black/5 p-2 flex-row justify-between items-center"
            style={{
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Text className="text-xl font-bold">Security Check</Text>
            <View className="p-1 py-3 space-y-2 justify-center items-center bg-white">
              <Text
                className="text-black/40 text-xs mt-2"
                style={{ fontFamily: "raleway" }}
              >
                Do you completed security check?
              </Text>
              <View className="flex-row items-center" style={{ gap: 4 }}>
                <TouchableOpacity className="bg-green-500 rounded-xl py-1 px-5">
                  <Text className="text-white text-lg">Yes</Text>
                </TouchableOpacity>
                <TouchableOpacity className="bg-red-500 rounded-xl py-1 px-5">
                  <Text className="text-white text-lg">No</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
          <View
            className="bg-white w-full rounded-md border border-black/5 p-2 flex-row justify-between items-center"
            style={{
              shadowColor: "#000",
              shadowOffset: {
                width: 0,
                height: 2,
              },
              shadowOpacity: 0.25,
              shadowRadius: 3.84,
              elevation: 5,
            }}
          >
            <Text className="text-xl font-bold">Boarding</Text>
            <View className="p-1 py-3 space-y-2 justify-center items-center bg-white">
              <Text
                className="text-black/40 text-sm mt-2"
                style={{ fontFamily: "raleway" }}
              >
                Time remaining
              </Text>
              <Text className="text-xl font-bold">{formatTime(timeLeft2)}</Text>
            </View>
          </View>
        </View>
      </View>
    </ScrollView>
  );
};

export default FlightDetail;
