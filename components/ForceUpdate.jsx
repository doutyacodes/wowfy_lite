import React, { useEffect } from "react";
import { 
  Image, 
  Linking, 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity,
  StatusBar,
  Animated 
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { Feather } from "@expo/vector-icons";

const ForceUpdate = () => {
  // Animation values
  const fadeAnim = new Animated.Value(0);
  const slideAnim = new Animated.Value(50);
  const buttonScaleAnim = new Animated.Value(0.95);

  useEffect(() => {
    // Start animations when component mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        friction: 6,
        tension: 40,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const openPlayStoreListing = async () => {
    // Button press animation
    Animated.sequence([
      Animated.timing(buttonScaleAnim, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(buttonScaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 50,
        useNativeDriver: true,
      })
    ]).start();

    // Replace with your app's package name
    const url = "market://details?id=YOUR_APP_PACKAGE_NAME"; 
    try {
      await Linking.openURL(url);
    } catch (error) {
      // Fallback to Play Store website if market link fails
      await Linking.openURL("https://play.google.com/store/apps/details?id=YOUR_APP_PACKAGE_NAME");
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      
      <Animated.View 
        style={[
          styles.content, 
          { 
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }] 
          }
        ]}
      >
        <View style={styles.imageContainer}>
          <Image
            source={require("../assets/images/update.png")}
            style={styles.image}
            resizeMode="contain"
          />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Time To Update!</Text>
          <Text style={styles.description}>
            We've added exciting new features and fixed bugs to make your experience smoother than ever.
          </Text>
          
          <View style={styles.bulletPointsContainer}>
            <View style={styles.bulletPoint}>
              <Feather name="check-circle" size={18} color="#4CAF50" />
              <Text style={styles.bulletText}>Enhanced performance</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Feather name="check-circle" size={18} color="#4CAF50" />
              <Text style={styles.bulletText}>New exciting features</Text>
            </View>
            <View style={styles.bulletPoint}>
              <Feather name="check-circle" size={18} color="#4CAF50" />
              <Text style={styles.bulletText}>Important security fixes</Text>
            </View>
          </View>
        </View>

        <Animated.View style={{ transform: [{ scale: buttonScaleAnim }] }}>
          <TouchableOpacity 
            onPress={openPlayStoreListing} 
            style={styles.button}
            activeOpacity={0.8}
          >
            <Feather name="download" size={20} color="white" style={styles.buttonIcon} />
            <Text style={styles.buttonText}>Update Now</Text>
          </TouchableOpacity>
        </Animated.View>

        <Text style={styles.versionText}>Current version: 2.4.1</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: hp(5),
    paddingHorizontal: wp(6),
  },
  imageContainer: {
    width: wp(90),
    height: hp(35),
    justifyContent: "center",
    alignItems: "center",
  },
  image: {
    width: "100%",
    height: "100%",
  },
  textContainer: {
    width: "100%",
    alignItems: "center",
    marginBottom: hp(4),
  },
  title: {
    fontSize: hp(3),
    fontFamily: "raleway-bold",
    marginBottom: hp(1.5),
    color: "#333",
    textAlign: "center",
  },
  description: {
    fontSize: hp(1.8),
    fontFamily: "raleway-bold",
    textAlign: "center",
    color: "#666",
    marginBottom: hp(2.5),
    lineHeight: hp(2.4),
  },
  bulletPointsContainer: {
    alignSelf: "flex-start",
    marginTop: hp(1),
    width: "100%",
  },
  bulletPoint: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: hp(1),
  },
  bulletText: {
    marginLeft: 10,
    fontSize: hp(1.7),
    fontFamily: "raleway-bold",
    color: "#555",
  },
  button: {
    flexDirection: "row",
    paddingHorizontal: wp(10),
    paddingVertical: hp(1.8),
    backgroundColor: "#FF6376",
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    elevation: 4,
    shadowColor: "#FF6376",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
  },
  buttonIcon: {
    marginRight: 8,
  },
  buttonText: {
    fontSize: hp(2),
    color: "white",
    fontFamily: "raleway-bold",
  },
  versionText: {
    marginTop: hp(3),
    fontSize: hp(1.5),
    color: "#999",
    fontFamily: "raleway-bold",
  }
});

export default ForceUpdate;