import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState, useRef } from "react";
import { 
  Image, 
  StyleSheet, 
  Text, 
  View, 
  Animated,
  StatusBar
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { SafeAreaView } from "react-native-safe-area-context";

const QuizCountPage = ({ route }) => {
  const navigation = useNavigation();
  const [currentCount, setCurrentCount] = useState(route.params.currentIndex + 1);
  
  // Animation values
  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    // Start entrance animation
    Animated.parallel([
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();
    
    // Navigate to quiz after delay
    const timer = setTimeout(() => {
      navigation.replace("QuizPageScreen", {
        currentIndex: route.params.currentIndex,
        dataQuiz: route.params.dataQuiz,
        user: route.params.user,
        live: route.params.live,
      });
    }, 1000);

    // Clear the timer on component unmount
    return () => clearTimeout(timer);
  }, []);
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <LinearGradient
        colors={['#4A80F0', '#1A53B0']} 
        style={styles.background}
      />
      
      <Image
        source={require("../assets/images/doodle.jpg")}
        style={styles.backgroundImage}
      />
      
      <View style={styles.content}>
        <Text style={styles.questionText}>Question</Text>
        
        <Animated.View style={[
          styles.countCircle,
          {
            transform: [{ scale: scaleAnim }],
            opacity: opacityAnim
          }
        ]}>
          <LinearGradient
            colors={['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.1)']}
            style={styles.countGradient}
          >
            <Text style={styles.countNumber}>{currentCount}</Text>
          </LinearGradient>
        </Animated.View>
        
        <View style={styles.iconContainer}>
          <Ionicons name="help-circle" size={30} color="rgba(255,255,255,0.7)" />
        </View>
      </View>
    </SafeAreaView>
  );
};

export default QuizCountPage;

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
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  questionText: {
    color: "white",
    fontSize: hp(4),
    fontFamily: "raleway-bold",
    marginBottom: hp(4),
    textTransform: "uppercase",
    letterSpacing: 2,
    opacity: 0.9,
  },
  countCircle: {
    height: wp(50),
    width: wp(50),
    borderRadius: wp(25),
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
    overflow: 'hidden',
  },
  countGradient: {
    height: '100%',
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  countNumber: {
    fontSize: wp(24),
    fontFamily: "raleway-bold",
    color: "white",
    textShadowColor: 'rgba(0, 0, 0, 0.3)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  iconContainer: {
    position: 'absolute',
    bottom: hp(10),
    flexDirection: 'row',
    justifyContent: 'center',
  }
});