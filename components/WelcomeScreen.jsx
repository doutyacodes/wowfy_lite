import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useState, useEffect } from "react";
import { 
  ImageBackground, 
  StyleSheet, 
  View, 
  ActivityIndicator,
  Animated,
  Dimensions
} from "react-native";
import axios from "axios";
import { baseURL } from "../backend/baseData";

// Import version check
import VersionCheck from "react-native-version-check-expo";
const ONBOARDING_SHOWN_KEY = '@onboarding_completed';

const WelcomeScreen = () => {
  const navigation = useNavigation();
  const isFocused = useIsFocused();
  const [isLoading, setIsLoading] = useState(true);
  
  // Animation setup
  const fadeAnim = new Animated.Value(0);
  const scaleAnim = new Animated.Value(0.95);

  useEffect(() => {
    // Start animation on component mount
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Function to check app maintenance and updates
      const checkAppStatus = async () => {
        setIsLoading(true);
        
        try {
          const currentVersion = VersionCheck.getCurrentVersion();
          console.log("Current app version:", currentVersion);
          
          // Check for app updates and maintenance
          const response = await axios.get(
            `${baseURL}/checkAppUpdate.php?app_version=${currentVersion}`
          );
          
          if (response.data.maintenance == "yes") {
            setTimeout(() => {
              navigation.replace("Maintenance", {
                message: response.data.maintenance_message,
              });
            }, 1500);
          } 
          else if (response.data.force_update == "yes") {
            setTimeout(() => {
              navigation.replace("ForceUpdate");
            }, 1500);
          } 
          else {
            // If no maintenance or update required, proceed with user check
            await checkUserAndOnboarding();
          }
        } catch (error) {
          console.error("Error checking app status:", error.message);
          // Fallback to user check if status check fails
          await checkUserAndOnboarding();
        } finally {
          setIsLoading(false);
        }
      };
      
      // Function to check onboarding status and user login
      const checkUserAndOnboarding = async () => {
        try {
          // Check onboarding status first
          const onboardingComplete = await AsyncStorage.getItem(ONBOARDING_SHOWN_KEY);
          
          // If onboarding hasn't been shown, navigate there
          if (onboardingComplete !== 'true') {
            setTimeout(() => {
              navigation.replace("Onboarding");
            }, 2000);
            return;
          }
          
          // If onboarding is complete, check user status
          const userString = await AsyncStorage.getItem("user");
          const user = userString ? JSON.parse(userString) : null;
          
          // Determine where to navigate
          const destinationScreen = user ? "InnerPage" : "OtpVerification";
          
          setTimeout(() => {
            navigation.replace(destinationScreen);
          }, 2000);
        } catch (error) {
          console.error("Error checking user/onboarding status:", error.message);
          // Navigate to onboarding as a fallback to ensure users see it
          setTimeout(() => {
            navigation.replace("Onboarding");
          }, 2000);
        }
      };

      // Start the app status check
      checkAppStatus();
      
      // Cleanup function
      return () => {
        // Cancel any pending operations if needed
      };
    }, [isFocused, navigation])
  );

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <Animated.View 
        style={[
          styles.animatedContainer, 
          { 
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
      >
        <ImageBackground
          source={require("../assets/splash.png")}
          style={styles.logo}
          resizeMode="cover"
        >
          {isLoading && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}
        </ImageBackground>
      </Animated.View>
    </View>
  );
};

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000", // Fallback background color
  },
  animatedContainer: {
    flex: 1,
  },
  logo: {
    flex: 1,
    width: width,
    height: height,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loaderContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  }
});

export default WelcomeScreen;