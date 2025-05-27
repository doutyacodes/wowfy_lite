import React, { useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Dialog, Portal } from "react-native-paper";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
const BadgeListCard = ({ item }) => {
  const [open, setOpen] = useState(false);
  const openBadge = () => {
    setOpen(true);
  };
  const closeBadge = () => {
    setOpen(false);
  };
  return (
    <>
      <TouchableOpacity onPress={openBadge}>
        <Image
          source={{ uri: `${item.image}` }}
          style={{
            height: wp(20),
            width: wp(20),
            borderRadius: 120,
          }}
        />
      </TouchableOpacity>

      <Portal>
        <Dialog
          style={{
            backgroundColor: "white",
            padding: 10,
            justifyContent: "center",
          }}
          visible={open}
          onDismiss={closeBadge}
        >
          <View
            style={{
              backgroundColor: "white",
              alignItems: "center",
              gap: 20,
              marginBottom: 15,
            }}
          >
            <Image
              source={{ uri: `${item.image}` }}
              style={{
                width: wp(35),
                height: wp(35),
                borderRadius: 120,
                backgroundColor: item.color,
              }}
            />
            <Text
              style={{
                fontSize: hp(2.5),
                fontFamily: "raleway-bold",
                letterSpacing: 1,
                textAlign: "center",
              }}
            >
              {item.name}
            </Text>
            <Text
              style={{
                fontSize: hp(2),
                fontFamily: "raleway-semibold",
                color: "#6E6060",
                letterSpacing: 1,
                textAlign: "center",
                lineHeight: 30,
              }}
            >
              {item.description}
            </Text>
            <TouchableOpacity
              style={{
                backgroundColor: "red",
                paddingHorizontal: 25,
                paddingVertical: 5,
                borderRadius: 10,
              }}
              onPress={closeBadge}
            >
              <Text
                style={{
                  fontSize: hp(2.5),
                  color: "white",
                  fontFamily: "raleway-bold",
                }}
              >
                OK
              </Text>
            </TouchableOpacity>
          </View>
        </Dialog>
      </Portal>
    </>
  );
};

export default BadgeListCard;

const styles = StyleSheet.create({});
