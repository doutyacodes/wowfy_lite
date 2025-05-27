import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef } from "react";
import { 
  Image, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  Animated,
  StatusBar
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import LottieView from "lottie-react-native";

const AnimatedTouchable = Animated.createAnimatedComponent(TouchableOpacity);

const QuizComplete = ({ route }) => {
  const navigation = useNavigation();
  const { user_id, challenge_id } = route.params;
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const translateYAnim = useRef(new Animated.Value(50)).current;
  const buttonsAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Staggered animations for different elements
    Animated.sequence([
      // First animate the success icon
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Then animate the congratulations text
      Animated.timing(translateYAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      // Finally animate the buttons
      Animated.timing(buttonsAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#4A80F0', '#1A53B0']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.background}
      />
      
      <Image
        source={require("../assets/images/doodle.jpg")}
        style={styles.backgroundImage}
      />
      
      <View style={styles.contentContainer}>
        {/* Congratulations Text */}
        <Animated.View style={[
          styles.titleContainer,
          {
            transform: [{ translateY: translateYAnim }],
            opacity: fadeAnim,
          }
        ]}>
          <Text style={styles.titleText}>Congratulations!</Text>
          <Text style={styles.subtitleText}>You've successfully completed the quiz</Text>
        </Animated.View>
        
        {/* Success Icon */}
        <Animated.View style={[
          styles.iconContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          }
        ]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.3)', 'rgba(255,255,255,0.1)']}
            style={styles.iconGradient}
          >
            <Ionicons name="checkmark-circle" size={wp(30)} color="white" />
          </LinearGradient>
        </Animated.View>
        
        {/* Action Buttons */}
        <Animated.View style={[
          styles.buttonsContainer,
          {
            opacity: buttonsAnim,
            transform: [
              { translateY: Animated.multiply(buttonsAnim, -20) }
            ],
          }
        ]}>
          <TouchableOpacity
            style={styles.shareButton}
            onPress={() => navigation.replace("CameraScreen", {
              user_id: user_id,
              challenge_id: challenge_id,
            })}
          >
            <LinearGradient
              colors={['#FF9500', '#FF5E3A']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="share-outline" size={24} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Share Your Moment</Text>
            </LinearGradient>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={styles.homeButton}
            onPress={() => navigation.replace("InnerPage")}
          >
            <LinearGradient
              colors={['#4CAF50', '#2E7D32']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.buttonGradient}
            >
              <Ionicons name="home-outline" size={24} color="white" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Return Home</Text>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>
      
      {/* Confetti particles */}
      <View style={styles.confettiContainer}>
        <LottieView
          source={require("../assets/animation/confetti.json")}
          autoPlay
          loop={false}
          style={styles.confetti}
        />
      </View>
    </SafeAreaView>
  );
};

export default QuizComplete;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  backgroundImage: {
    resizeMode: "cover",
    height: hp(100),
    width: wp(100),
    opacity: 0.1,
    position: "absolute",
  },
  contentContainer: {
    flex: 1,
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: hp(8),
  },
  titleContainer: {
    alignItems: "center",
  },
  titleText: {
    fontSize: hp(4),
    fontFamily: "raleway-bold",
    color: "white",
    textAlign: "center",
    marginBottom: hp(1),
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  subtitleText: {
    fontSize: hp(2),
    fontFamily: "raleway-medium",
    color: "rgba(255, 255, 255, 0.8)",
    textAlign: "center",
  },
  iconContainer: {
    width: wp(60),
    height: wp(60),
    borderRadius: wp(30),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    overflow: 'hidden',
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonsContainer: {
    width: '100%',
    paddingHorizontal: wp(5),
    gap: hp(2),
  },
  shareButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#FF5E3A",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  homeButton: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: "#2E7D32",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(2),
  },
  buttonIcon: {
    marginRight: wp(2),
  },
  buttonText: {
    color: 'white',
    fontSize: hp(2.2),
    fontFamily: 'raleway-bold',
  },
  confettiContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
    pointerEvents: 'none',
  },
  confetti: {
    width: '100%',
    height: '100%',
  },
});