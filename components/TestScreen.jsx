import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Toast from "react-native-root-toast";

const TestScreen = () => {
  const pressData1 = () => {
    // Show toast message
    let toast = Toast.show("Data 1 Pressed", {
      duration: Toast.durations.SHORT,
      position: Toast.positions.BOTTOM,
      shadow: true,
      animation: true,
      hideOnPress: true,
      delay: 0,
      backgroundColor: "blue", // Set background color to transparent

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

  return (
    <View style={{ justifyContent: "center", alignItems: "center", flex: 1 }}>
      <TouchableOpacity onPress={pressData1}>
        <Text>TestScreen</Text>
      </TouchableOpacity>
    </View>
  );
};

export default TestScreen;

const styles = StyleSheet.create({});
