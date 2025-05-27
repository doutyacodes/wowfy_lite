// Live.js
import React from "react";
import { StyleSheet, Text, View } from "react-native";

const Live = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This is the Live content</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  text: {
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default Live;
