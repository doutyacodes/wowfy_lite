import React from "react";
import { Image, StyleSheet, Text, View, SafeAreaView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

const MaintenanceScreen = ({ route }) => {
  const { message } = route.params || { message: "We're currently updating our systems to serve you better. Please check back soon!" };
  
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image
          source={require("../assets/images/maintenance.png")}
          style={styles.maintenanceImage}
          resizeMode="contain"
        />
        
        <View style={styles.textContainer}>
          <Text style={styles.title}>
            Under Maintenance
          </Text>
          
          <Text style={styles.message}>
            {message}
          </Text>
        </View>
        
        <View style={styles.infoContainer}>
          <Ionicons name="time-outline" size={20} color="#6366f1" style={styles.infoIcon} />
          <Text style={styles.infoText}>
            We're working hard to get things back up and running. Thank you for your patience!
          </Text>
        </View>
        
        <View style={styles.statusContainer}>
          <View style={styles.statusIndicator} />
          <Text style={styles.statusText}>
            We'll be back shortly
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
};

export default MaintenanceScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: wp(6),
  },
  maintenanceImage: {
    width: wp(80),
    height: hp(40),
    marginBottom: hp(4),
  },
  textContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: hp(3),
  },
  title: {
    fontSize: hp(3),
    fontFamily: "raleway-bold",
    color: "#111827",
    marginBottom: hp(1.5),
  },
  message: {
    fontSize: hp(1.8),
    fontFamily: "raleway",
    color: "#6b7280",
    textAlign: "center",
    lineHeight: hp(2.6),
    paddingHorizontal: wp(2),
  },
  infoContainer: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    padding: hp(2),
    borderRadius: 12,
    marginBottom: hp(3),
    width: "90%",
    alignItems: "center",
  },
  infoIcon: {
    marginRight: wp(2),
  },
  infoText: {
    flex: 1,
    fontSize: hp(1.6),
    fontFamily: "raleway",
    color: "#4b5563",
    lineHeight: hp(2.2),
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: hp(2),
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
    marginRight: wp(2),
  },
  statusText: {
    fontSize: hp(1.5),
    fontFamily: "raleway-bold",
    color: "#10b981",
  },
});