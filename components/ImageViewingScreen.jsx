import { AntDesign } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";

const ImageViewingScreen = ({ route }) => {
  const { imageLocation } = route.params;
  //   console.log(imageLocation);
  const navigation = useNavigation();
  return (
    <View style={styles.container}>
      <Image
        source={{ uri: `${imageLocation}` }}
        style={styles.imageContainer}
      />
      <TouchableOpacity
        style={styles.closeBtn}
        onPress={() => navigation.goBack()}
      >
        <AntDesign name="closecircleo" size={24} color="black" />
      </TouchableOpacity>
      <StatusBar style="light" />
    </View>
  );
};

export default ImageViewingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    backgroundColor: "#E5E5E5",
  },
  imageContainer: {
    height: "100%",
    width: "100%",
    resizeMode: "contain",
  },
  closeBtn: {
    position: "absolute",
    padding: 30,
    top: 10,
    right: 10,
  },
});
