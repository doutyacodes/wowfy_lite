import { Feather, FontAwesome, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import wowfy from "../../assets/logos/wowfy.png";
import wowfy_white from "../../assets/logos/wowfy_white.png";
import { baseURL } from "../../backend/baseData";
import { useSafeAreaInsets } from "react-native-safe-area-context";
const TopBar = ({ marginTop, color, user }) => {
  const [count, setCount] = useState(0);
  const navigation = useNavigation();
  useEffect(() => {
    const fetchNotification = async () => {
      if (user) {
        try {
          // Only fetch rewards if user data is available
          const response = await axios.get(
            `${baseURL}/getNotificationseen.php?userId=${user.id}`
          );

          if (response.status == 200) {
            setCount(response.data?.length || 0);
            // console.log(response.data);
          } else {
            console.error("Failed to fetch notification");
          }
        } catch (error) {
          console.error("Error while fetching notification:", error.message);
        }
      }
    };
    fetchNotification();
  }, [user]);
  const { top } = useSafeAreaInsets();
  const paddingTop = top > 0 ? top + 5 : 30;
  return (
    <View
      style={{
        paddingTop: paddingTop,
        paddingHorizontal:15,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        // paddingHorizontal: 10,
        // marginBottom: 15,
        width: "100%",
      }}
    >
      <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
        <TouchableOpacity
          onPress={() => navigation.getParent("LeftDrawer").openDrawer()}
        >
          <Feather name="menu" size={24} color={color ? color : "black"} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.navigate("SearchScreen")}>
          <Feather name="search" size={24} color={color ? color : "black"} />
        </TouchableOpacity>
      </View>
      <View style={{ alignItems: "center" }}>
        <Image
          source={color ? wowfy_white : wowfy}
          style={styles.topLogo}
        />
      </View>

      <View style={{ flexDirection: "row", alignItems: "center", gap: 18 }}>
        <TouchableOpacity
          onPress={() => navigation.navigate("NotificationScreen")}
          style={{ position: "relative" }}
        >
          <Ionicons
            name="notifications"
            size={24}
            color={color ? color : "black"}
          />
          {count > 0 && (
            <View
              style={{
                position: "absolute",
                top: 0,
                right: 2,
                height: 5,
                width: 5,
                backgroundColor: "red",
                borderRadius: 10,
              }}
            />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={{ padding: 1 }}
          onPress={() => navigation.getParent("RightDrawer").openDrawer()}
        >
          <FontAwesome name="gear" size={26} color={color ? color : "black"} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TopBar;

const styles = StyleSheet.create({
  topLogo: {
    height: 45,
    width: 45,
    // marginTop: 50,
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
