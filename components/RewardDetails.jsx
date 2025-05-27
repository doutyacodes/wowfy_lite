import { AntDesign, Feather } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import * as Clipboard from "expo-clipboard";
import React, { useState } from "react";
import {
  Image,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { List } from "react-native-paper";
import QRCode from "react-native-qrcode-svg";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import Toast from "react-native-root-toast";
import { baseImgURL } from "../backend/baseData";
const RewardDetails = ({ route }) => {
  const { item, user } = route.params;
  const navigation = useNavigation();
  const [expanded, setExpanded] = useState(true);

  const [showCode, setShowCode] = useState(false);
  const handleLink = () => {
    Linking.openURL(`${item.link}`).catch((err) =>
      console.error("An error occurred", err)
    );
  };
  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(item.coupon);

    let toast = Toast.show("Coupon code copied successfully!", {
      duration: Toast.durations.SHORT,
      position: Toast.positions.BOTTOM,
      shadow: true,
      animation: true,
      hideOnPress: true,
      delay: 0,
      backgroundColor: "white", // Set background color to transparent
      textColor: "black",
      containerStyle: {
        backgroundColor: "white",
        borderRadius: 50,
        padding: 15,
      },
      onShow: () => {
        // Calls on toast's appear animation start
      },
      onShown: () => {
        // Calls on toast's appear animation end.
      },
      onHide: () => {
        // Calls on toast's hide animation start.
      },
      onHidden: () => {
        // Calls on toast's hide animation end.
      },
    });
  };
  const handlePress = () => setExpanded(!expanded);

  return (
    <View style={{ flex: 1, backgroundColor: "#e5e5e5" }}>
      <View style={{ width: wp(100), height: hp(30), position: "relative" }}>
        <Image
          source={{ uri: `${baseImgURL + item.image}` }}
          style={{ width: wp(100), height: hp(30), overflow: "hidden" }}
        />
        <TouchableOpacity
          style={{
            position: "absolute",
            top: 39,
            left: 20,
            backgroundColor: "rgba(255,255,255,0.2)",
            padding: 2,
            borderRadius: 100,
          }}
          onPress={() => navigation.goBack()}
        >
          <AntDesign name="closecircle" size={hp(3.3)} color="black" />
        </TouchableOpacity>
      </View>
      <ScrollView style={{ flex: 1, padding: 15, gap: 10, marginBottom: 40 }}>
        <Text
          style={{
            fontSize: hp(3),
            fontFamily: "raleway-bold",
          }}
        >
          {item.title}
        </Text>
        <Text
          style={{
            fontSize: hp(1.8),
            marginTop: 10,
            fontFamily: "raleway",
            fontStyle: "italic",
            color: "gray",
          }}
        >
          {item.description}
        </Text>
        {item.coupon ? (
          <View
            style={{
              padding: 2,
              paddingLeft: 10,
              borderColor: "lightgrey",
              borderWidth: 1,
              backgroundColor: "lightgrey",
              marginTop: 18,
              borderRadius: 19,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            {showCode ? (
              <Text>{item.coupon}</Text>
            ) : (
              <Text style={{ color: "black" }}>*********</Text>
            )}
            {showCode ? (
              <TouchableOpacity
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  backgroundColor: "#845EC2",
                  borderRadius: 19,
                }}
                onPress={copyToClipboard}
              >
                <Text style={{ color: "white" }}>Copy Code</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={{
                  paddingVertical: 10,
                  paddingHorizontal: 20,
                  backgroundColor: "#845EC2",
                  borderRadius: 19,
                }}
                onPress={() => setShowCode(true)}
              >
                <Text style={{ color: "white" }}>Get Code</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            {user && (
              <View
                style={{
                  justifyContent: "center",
                  alignItems: "center",
                  paddingTop: 20,
                }}
              >
                <View
                  style={{
                    padding: 10,
                    backgroundColor: "white",
                    borderRadius: 15,
                  }}
                >
                  <QRCode
                    value={`https://wowfy.com/?user_id=${user.mobile}`}
                    logo={require("../assets/images/wowcoin.png")}
                    logoSize={30}
                    size={wp(35)}
                    logoBackgroundColor="transparent"
                  />
                </View>
                <View
                  style={{
                    flexDirection: "row",
                    gap: 3,
                    marginTop: 14,
                    alignItems: "center",
                  }}
                >
                  <Feather name="info" size={hp(1.8)} color="gray" />
                  <Text
                    style={{
                      fontSize: hp(1.8),
                      // fontFamily: "raleway",
                      color: "gray",
                    }}
                  >
                    Please show this qr to the person incharge.
                  </Text>
                </View>
              </View>
            )}
          </>
        )}
        {item?.details?.length > 0 && (
          <List.Section>
            <List.Accordion
              title="Details"
              style={{ backgroundColor: "#e5e5e5" }}
            >
              {item?.details?.length > 0 &&
                item?.details?.map((item, index) => {
                  return (
                    <View key={index} style={styles.container}>
                      <Text style={styles.bullet}>•</Text>
                      <Text style={styles.text}>{item.detail}</Text>
                    </View>
                  );
                })}
            </List.Accordion>
          </List.Section>
        )}
      </ScrollView>
      <TouchableOpacity
        onPress={handleLink}
        style={{
          position: "absolute",
          bottom: 0,
          backgroundColor: "#2E53C0",
          padding: 10,
          height: 40,
          width: wp(100),
        }}
      >
        <Text style={{ textAlign: "center", color: "white" }}>Open Link</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RewardDetails;

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 5,
  },
  bullet: {
    fontSize: 20,
    marginRight: 5,
    color: "black", // Change color as needed
  },
  text: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
  },
});
