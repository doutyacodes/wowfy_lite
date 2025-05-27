import React from "react";
import {
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
const InviteComponent = ({ item, userData }) => {
  const phoneNumber = item.phoneNumbers[0].number;
  const referralCode = userData.referral_id;
  const userName = userData.name;

  const openWhatsAppOrSMS = async () => {
    const message = `Hey there,\n\nI've been hooked on Wowfy lately—it's an awesome app that's made my life a whole lot easier. If you're looking to join, why not use my referral code -- ${referralCode} ? We both get rewarded, and trust me, you won't regret it!\n\nDownload Wowfy now and let's enjoy the perks together.\n\nCheers,\n${userName}`;

    const isWhatsAppInstalled = await Linking.canOpenURL("whatsapp://send");

    if (isWhatsAppInstalled) {
      Linking.openURL(
        `whatsapp://send?phone=${phoneNumber}&text=${encodeURIComponent(
          message
        )}`
      );
    } else {
      Linking.openURL(`sms:${phoneNumber}&body=${message}`);
    }
  };

  return (
    <View
      style={{
        backgroundColor: "white",
        padding: 10,
        flexDirection: "row",
        alignItems: "center",
        gap: "10",
        borderRadius: 5,
      }}
    >
      <View
        style={{
          width: 60,
          height: 60,
          backgroundColor: "#ff8f8e",
          borderRadius: 50,
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Text
          style={{
            fontSize: 25,
            fontFamily: "raleway-bold",
            color: "white",
          }}
        >
          {item?.name?.charAt(0)}
        </Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: "raleway-bold", fontSize: 16 }}>
          {item.name}
        </Text>
      </View>
      {phoneNumber && (
        <TouchableOpacity
          style={{
            backgroundColor: "green",
            paddingHorizontal: 19,
            paddingVertical: 10,
            borderRadius: 12,
          }}
          onPress={openWhatsAppOrSMS}
        >
          <Text style={{ color: "white", fontFamily: "raleway-bold" }}>
            Invite
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

export default InviteComponent;

const styles = StyleSheet.create({});
