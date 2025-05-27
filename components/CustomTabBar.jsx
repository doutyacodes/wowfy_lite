import {
  Entypo,
  FontAwesome5,
  FontAwesome6,
  MaterialCommunityIcons,
  Ionicons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFocusEffect,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import { BlurView } from "expo-blur";
import React, { useCallback, useEffect, useState } from "react";
import { Image, Text, TouchableOpacity, View, StyleSheet } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  Easing,
} from "react-native-reanimated";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

const CustomTabBar = ({ state, descriptors, navigation }) => {
  const [displayView, setDisplayView] = useState("none");
  const [user, setUser] = useState(null);
  
  useFocusEffect(
    useCallback(() => {
      const fetchUserAndFollow = async () => {
        try {
          const userString = await AsyncStorage.getItem("user");
          if (userString) {
            const userObject = JSON.parse(userString);
            setUser(userObject);
          }
        } catch (error) {
          console.error(
            "Error fetching user from AsyncStorage:",
            error.message
          );
        }
      };

      fetchUserAndFollow();
    }, [])
  );
  
  const focusedOptions = descriptors[state.routes[state.index].key].options;
  const { navigate } = useNavigation();
  const routeName = useRoute();

  if (focusedOptions.tabBarVisible == false) {
    return null;
  }

  // Animation values
  const LeftbottomValue = useSharedValue(0);
  const LeftpositionValue = useSharedValue(0);
  const RightbottomValue = useSharedValue(0);
  const RightpositionValue = useSharedValue(0);
  const topIconBottomValue = useSharedValue(0);
  const topIconPositionValue = useSharedValue(0);
  const overlayOpacity = useSharedValue(0);
  
  const handleAnimatedButton = () => {
    const isOpening = displayView == "none";
    setDisplayView(isOpening ? "flex" : "none");

    // Animation timing configuration
    const config = {
      duration: 500,
      easing: Easing.bezier(0.25, 0.1, 0.25, 1),
    };

    // Animate overlay opacity
    overlayOpacity.value = withTiming(isOpening ? 1 : 0, config);

    // Animate button positions
    LeftbottomValue.value = withSpring(isOpening ? 95 : 0, {
      damping: 12,
      stiffness: 120,
    });
    RightbottomValue.value = withSpring(isOpening ? 95 : 0, {
      damping: 12,
      stiffness: 120,
    });
    topIconBottomValue.value = withSpring(isOpening ? 175 : 0, {
      damping: 12,
      stiffness: 120,
    });
    LeftpositionValue.value = withSpring(isOpening ? 85 : 0, {
      damping: 12,
      stiffness: 120,
    });
    RightpositionValue.value = withSpring(isOpening ? 85 : 0, {
      damping: 12,
      stiffness: 120,
    });
    topIconPositionValue.value = withSpring(isOpening ? 0 : 0, {
      damping: 12,
      stiffness: 120,
    });
  };

  const animatedStyles = useAnimatedStyle(() => ({
    display: LeftbottomValue.value == 0 ? "none" : "flex",
    position: "absolute",
    transform: [
      { translateY: -LeftbottomValue.value },
      { translateX: -LeftpositionValue.value },
    ],
    opacity: LeftbottomValue.value / 95, // Fade in as it animates
  }));

  const animatedStyles2 = useAnimatedStyle(() => ({
    display: RightbottomValue.value == 0 ? "none" : "flex",
    position: "absolute",
    transform: [
      { translateY: -RightbottomValue.value },
      { translateX: RightpositionValue.value },
    ],
    opacity: RightbottomValue.value / 95, // Fade in as it animates
  }));

  const animatedStyles3 = useAnimatedStyle(() => ({
    display: topIconBottomValue.value == 0 ? "none" : "flex",
    position: "absolute",
    transform: [
      { translateY: -topIconBottomValue.value },
      { translateX: topIconPositionValue.value },
    ],
    opacity: topIconBottomValue.value / 175, // Fade in as it animates
  }));

  const overlayAnimatedStyle = useAnimatedStyle(() => ({
    opacity: overlayOpacity.value,
  }));

  // Main button animation
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  const mainButtonAnimatedStyle = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale.value },
        { rotate: `${rotation.value}deg` },
      ],
    };
  });

  // Start the breathing and rotation animations
  useEffect(() => {
    // Breathing animation
    scale.value = withRepeat(
      withSpring(1.2, {
        duration: 1500,
        damping: 4,
        stiffness: 100,
      }),
      -1,
      true
    );

    // Subtle rotation animation
    rotation.value = withRepeat(
      withTiming(360, {
        duration: 10000,
        easing: Easing.linear,
      }),
      -1,
      false
    );

    // Clean up function
    return () => {
      scale.value = 1;
      rotation.value = 0;
    };
  }, []);

  return (
    <>
      {/* Overlay blur with animated opacity */}
      <TouchableOpacity
        onPress={() => {
          if (displayView == "flex") {
            handleAnimatedButton();
          }
        }}
        style={[
          styles.overlay,
          {
            display: displayView,
          },
        ]}
        activeOpacity={1}
      >
        <Animated.View style={[styles.overlay, overlayAnimatedStyle]}>
          <BlurView
            intensity={60}
            tint="dark"
            style={styles.blurView}
          />
        </Animated.View>
      </TouchableOpacity>

      <Animated.View style={styles.tabBarContainer}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];

          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index == index;

          const onPress = () => {
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigate(route.name, { user_id: user?.id });
            }
          };
          
          const onPress2 = (key, name) => {
            const event = navigation.emit({
              type: "tabPress",
              target: key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigate(name);
            }
            handleAnimatedButton();
          };
          
          const onPress3 = (name) => {
            navigate(name);
            handleAnimatedButton();
          };

          if (label == "BuzzwallScreen" || label == "Barcode" || label == "Arena") {
            return null;
          }
          
          let TextDisplay = "Home";
          // if (label == "BuzzwallScreen") TextDisplay = "BuzzWall";
          if (label == "Moviehome") TextDisplay = "Home";
          if (label == "TodoScreen") TextDisplay = "In Progress";
          if (label == "Home") TextDisplay = "";
          if (label == "Arena") TextDisplay = "Arena";
          if (label == "OtherUserScreen") TextDisplay = "Profile";
          if (label == "Peoples") TextDisplay = "Social";
          
          return (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={label == "Home" ? () => {} : onPress}
              style={styles.tabButton}
              key={route.name}
            >
              {label == "Home" ? (
                <View style={styles.centerButtonContainer}>
                  {/* Create Post Button */}
                  <Animated.View style={[animatedStyles]}>
                    <TouchableOpacity
                      onPress={() => 
                        navigate("UserPost", {
                          user_id: user?.id,
                        })
                      }
                      style={[styles.actionButton, styles.redButton]}
                    >
                      <FontAwesome5 name="pen-nib" size={28} color="white" />
                    </TouchableOpacity>
                    <Text style={styles.actionText}>Create Post</Text>
                  </Animated.View>

                  {/* Button that was previously for Location - keeping UI but changing functionality
                  <Animated.View style={[animatedStyles3]}>
                    <TouchableOpacity
                      onPress={() => onPress3("Home")}
                      style={[styles.actionButton, styles.greenButton]}
                    >
                      <Ionicons
                        name="location"
                        size={28}
                        color="white"
                      />
                    </TouchableOpacity>
                    <Text style={styles.actionText}>Location</Text>
                  </Animated.View> */}
                  
                  {/* Scan QR Button */}
                  <Animated.View style={[animatedStyles2]}>
                    <TouchableOpacity
                      onPress={() => onPress3("Barcode")}
                      style={[styles.actionButton, styles.blueButton]}
                    >
                      <MaterialCommunityIcons
                        name="qrcode-scan"
                        size={28}
                        color="white"
                      />
                    </TouchableOpacity>
                    <Text style={styles.actionText}>Scan QR</Text>
                  </Animated.View>
                  
                  {/* Main central button */}
                  <TouchableOpacity 
                    onPress={handleAnimatedButton}
                    style={styles.mainButtonOuter}
                    activeOpacity={0.9}
                  >
                    <Animated.View style={[mainButtonAnimatedStyle, styles.mainButtonInner]}>
                      <Image
                        source={require("../assets/images/now.png")}
                        style={styles.centerImage}
                        resizeMode="contain"
                      />
                    </Animated.View>
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  {label == "TodoScreen" && (
                    <View style={styles.tabContent}>
                      <FontAwesome6
                        name="person-running"
                        size={wp(6)}
                        color={isFocused ? "#6d28d9" : "#9ca3af"}
                        style={styles.tabIcon}
                      />
                      <Text
                        style={[
                          styles.tabText,
                          { color: isFocused ? "#6d28d9" : "#9ca3af" },
                        ]}
                      >
                        {TextDisplay}
                      </Text>
                      {isFocused && <View style={[styles.activeIndicator, styles.purpleIndicator]} />}
                    </View>
                  )}
                  
                  {/* {label == "BuzzwallScreen" && (
                    <View style={styles.tabContent}>
                      <Entypo
                        name="home"
                        size={wp(6)}
                        color={isFocused ? "#db3022" : "#9ca3af"}
                        style={styles.tabIcon}
                      />
                      <Text
                        style={[
                          styles.tabText,
                          { color: isFocused ? "#db3022" : "#9ca3af" },
                        ]}
                      >
                        {TextDisplay}
                      </Text>
                      {isFocused && <View style={[styles.activeIndicator, styles.redIndicator]} />}
                    </View>
                  )} */}
                  {label == "Moviehome" && (
                    <View style={styles.tabContent}>
                      <Entypo
                        name="home"
                        size={wp(6)}
                        color={isFocused ? "#db3022" : "#9ca3af"}
                        style={styles.tabIcon}
                      />
                      <Text
                        style={[
                          styles.tabText,
                          { color: isFocused ? "#db3022" : "#9ca3af" },
                        ]}
                      >
                        {TextDisplay}
                      </Text>
                      {isFocused && <View style={[styles.activeIndicator, styles.redIndicator]} />}
                    </View>
                  )}
                  
                  {label == "Arena" && (
                    <View style={styles.tabContent}>
                      <MaterialCommunityIcons
                        name="sword-cross"
                        size={wp(6)}
                        color={isFocused ? "#22c55e" : "#9ca3af"}
                        style={styles.tabIcon}
                      />
                      <Text
                        style={[
                          styles.tabText,
                          { color: isFocused ? "#22c55e" : "#9ca3af" },
                        ]}
                      >
                        {TextDisplay}
                      </Text>
                      {isFocused && <View style={[styles.activeIndicator, styles.greenIndicator]} />}
                    </View>
                  )}
                  
                  {label == "Peoples" && (
                    <View style={styles.tabContent}>
                      <FontAwesome6
                        name="users"
                        size={wp(6)}
                        color={isFocused ? "#6d28d9" : "#9ca3af"}
                        style={styles.tabIcon}
                      />
                      <Text
                        style={[
                          styles.tabText,
                          { color: isFocused ? "#6d28d9" : "#9ca3af" },
                        ]}
                      >
                        {TextDisplay}
                      </Text>
                      {isFocused && <View style={[styles.activeIndicator, styles.purpleIndicator]} />}
                    </View>
                  )}
                  
                  {label == "OtherUserScreen" && (
                    <View style={styles.tabContent}>
                      <FontAwesome5
                        name="user-alt"
                        size={wp(6)}
                        color={isFocused ? "#22c55e" : "#9ca3af"}
                        style={styles.tabIcon}
                      />
                      <Text
                        style={[
                          styles.tabText,
                          { color: isFocused ? "#22c55e" : "#9ca3af" },
                        ]}
                      >
                        {TextDisplay}
                      </Text>
                      {isFocused && <View style={[styles.activeIndicator, styles.greenIndicator]} />}
                    </View>
                  )}
                </>
              )}
            </TouchableOpacity>
          );
        })}
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    height: hp(100),
    width: wp(100),
    zIndex: 10,
  },
  blurView: {
    height: hp(100),
    width: wp(100),
    backgroundColor: "rgba(0,0,0,0.7)",
  },
  tabBarContainer: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderTopColor: "#f3f4f6",
    borderTopWidth: 1,
    paddingVertical: 8,
    paddingHorizontal: 5,
    position: "relative",
    zIndex: 15,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4.65,
    elevation: 8,
  },
  tabButton: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  tabContent: {
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    position: "relative",
    paddingTop: 4,
  },
  tabIcon: {
    marginBottom: 3,
  },
  tabText: {
    fontFamily: "raleway",
    fontSize: wp(2.5),
    marginTop: 2,
  },
  activeIndicator: {
    position: "absolute",
    bottom: -8,
    height: 3,
    width: wp(8),
    borderRadius: 3,
  },
  redIndicator: {
    backgroundColor: "#db3022",
  },
  purpleIndicator: {
    backgroundColor: "#6d28d9",
  },
  greenIndicator: {
    backgroundColor: "#22c55e",
  },
  centerButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  actionButton: {
    padding: 14,
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  redButton: {
    backgroundColor: "#f43f5e",
  },
  blueButton: {
    backgroundColor: "#3b82f6",
  },
  greenButton: {
    backgroundColor: "#22c55e",
  },
  actionText: {
    color: "white",
    marginTop: 5,
    fontFamily: "raleway",
    fontWeight: "500",
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 2,
    fontSize: wp(3),
  },
  mainButtonOuter: {
    padding: 3,
    borderRadius: 30,
    backgroundColor: "#ffffff",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
    elevation: 6,
  },
  mainButtonInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#ffffff",
    padding: 3,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#10b981",
  },
  centerImage: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
  },
});

export default CustomTabBar;