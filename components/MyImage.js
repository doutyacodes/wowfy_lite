import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { baseURL } from "../backend/baseData";

const MyImage = ({ style, sourceObj, onPress }) => {
  const [imageError, setImageError] = useState(false);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  return (
    <TouchableOpacity onPress={() => navigation.navigate("ImageList")}>
      <Image
        style={style}
        source={{ uri: `${baseURL + sourceObj}` }}
        onError={(e) => {
          setLoading(false);
          setImageError(true);
        }}
        onLoadEnd={() => setLoading(false)}
      />

      {loading && (
        <ActivityIndicator
          style={styles.activityIndicator}
          animating={loading}
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  activityIndicator: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
});

export default MyImage;
