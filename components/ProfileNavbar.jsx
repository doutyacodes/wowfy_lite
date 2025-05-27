import { FontAwesome } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Text } from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";

const ProfileNavbar = ({ route, isSelected }) => {
  const [activeNav, setActiveNav] = useState(false);
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const onPressIn = () => {
    scale.value = withSpring(0.9);
  };

  const onPressOut = () => {
    scale.value = withSpring(1);
  };

  return (
    <TouchableOpacity
      onPressIn={onPressIn}
      onPressOut={onPressOut}
      onPress={() => setActiveNav(!activeNav)}
      activeOpacity={0}
    >
      <Animated.View
        style={[
          styles.container,
          isSelected && styles.selectedContainer,
          animatedStyle,
        ]}
      >
        <FontAwesome
          name={route.icon}
          size={22}
          color={isSelected ? "#48BFFF" : "black"}
        />
        {isSelected && (
          <Text style={[styles.text, isSelected && styles.selectedText]}>
            {route.title}
          </Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 15,
    borderRadius: 15,
  },
  selectedContainer: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.43,
    shadowRadius: 9.51,
    elevation: 15,
  },
  text: {
    margin: 8,
    fontFamily: "raleway-bold",
    fontSize: hp(1.8),
  },
  selectedText: {
    color: "#48BFFF",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 7,
    },
    shadowOpacity: 0.43,
    shadowRadius: 9.51,
    elevation: 15,
  },
});

export default ProfileNavbar;
