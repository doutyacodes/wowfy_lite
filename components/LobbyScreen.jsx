import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import axios from "axios";
import { Audio } from "expo-av";
import React, { useEffect, useState, useRef } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ImageBackground,
  Animated,
  Easing,
  StatusBar,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { Ionicons, MaterialCommunityIcons, FontAwesome5, Feather } from "@expo/vector-icons";
import { baseURL, baseVidUrl } from "../backend/baseData";

const TIME_BLOCK_SIZE = hp(9);

const TimerBlock = ({ value, label, color }) => {
  return (
    <View style={styles.timerBlockContainer}>
      <View style={[styles.timerBlock, { backgroundColor: color }]}>
        <Text style={styles.timerValue}>{value < 10 ? `0${value}` : value}</Text>
      </View>
      <Text style={styles.timerLabel}>{label}</Text>
    </View>
  );
};

const LobbyScreen = ({ route }) => {
  const [user, setUser] = useState(null);
  const [quizData, setQuizData] = useState(null);
  const [isQuizStarted, setIsQuizStarted] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigation = useNavigation();
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [completed, setCompleted] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [countdown3, setCountdown3] = useState(-2);
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const [seconds, setSeconds] = useState(0);
  const [sound, setSound] = useState();
  const [isLoading, setIsLoading] = useState(true);
  const [animateStart, setAnimateStart] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  const isFocused = useIsFocused();
  
  // Animate entrance
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      })
    ]).start();
  }, []);
  
  useEffect(() => {
    if (!quizData) return;

    const startTime = new Date(quizData.start_time);
    const timeDifferenceInSeconds = Math.floor(
      (currentTime.getTime() - startTime.getTime()) / 1000
    );

    const quizDurationInSeconds =
      quizData.duration_hours * 3600 + quizData.duration_minutes * 60;

    const calculatedProgressPercentage = Math.min(
      (timeDifferenceInSeconds / quizDurationInSeconds) * 100,
      100
    );

    setProgressPercentage(calculatedProgressPercentage);
  }, [quizData, currentTime]);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          navigation.navigate("OtpVerification");
        }
      } catch (error) {
        console.error("Error while fetching user:", error.message);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const fetchQuiz = async () => {
      if (user) {
        setIsLoading(true);
        try {
          const response = await axios.get(
            `${baseURL}/getSingleQuiz.php?userId=${user?.id}&challenge_id=${route.params.challenge.challenge_id}`
          );

          if (response.status == 200) {
            setQuizData(response.data.challenges);
          } else {
            console.error("Failed to fetch quiz");
          }
        } catch (error) {
          console.error("Error while fetching quiz:", error.message);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchQuiz();
  }, [user]);
  
  const convertTime = () => {
    const hrs = Math.floor(countdown3 / 3600);
    const mins = Math.floor((countdown3 % 3600) / 60);
    const secs = countdown3 % 60;
    setHours(hrs);
    setMinutes(mins);
    setSeconds(secs);
  };
  
  useEffect(() => {
    const intervalId = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(intervalId);
  }, []);
  
  useEffect(() => {
    convertTime();
  }, [quizData, countdown3]);
  
  const handleQuiz = async () => {
    if (!quizData) {
      Alert.alert("Quiz Alert", "Quiz data is not available.");
      return;
    }
    
    setAnimateStart(true);
    
    try {
      const response2 = await axios.post(
        `${baseURL}/createUserQuiz.php`,
        {
          user_id: user.id,
          challenge_id: quizData.challenge_id,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      
      if (response2.data.success) {
        setTimeout(() => {
          navigation.replace("QuizPageScreen", {
            currentIndex: 0,
            dataQuiz: quizData,
            user: user,
            live: quizData.live,
          });
        }, 1000);
      }
    } catch (error) {
      setAnimateStart(false);
      console.error("Error starting quiz:", error);
      Alert.alert("Error", "Failed to start the quiz. Please try again.");
    }
  };
  
  useEffect(() => {
    if (quizData) {
      const quizStartTime = new Date();
      const [hours, minutes, seconds] = quizData.start_time.split(":");
      quizStartTime.setHours(
        parseInt(hours, 10),
        parseInt(minutes, 10),
        parseInt(seconds, 10)
      );

      const differenceInMilliseconds = currentTime - quizStartTime;
      const differenceInSeconds = Math.floor(differenceInMilliseconds / 1000);

      if (currentTime > quizStartTime) {
        setCompleted(true);
      }

      if (quizStartTime > currentTime) {
        setCountdown(Math.abs(differenceInSeconds));
        setCountdown3(Math.abs(differenceInSeconds));
      }
    }
  }, [quizData, currentTime]);
  
  useEffect(() => {
    if (sound) {
      return () => {
        sound.unloadAsync();
      };
    }
  }, [sound]);
  
  useEffect(() => {
    if (isFocused && quizData && quizData.live == "yes") {
      loadSound();
    } else {
      if (sound) {
        sound.unloadAsync();
      }
    }
  }, [isFocused, quizData]);

  const loadSound = async () => {
    try {
      const { sound } = await Audio.Sound.createAsync(
        { uri: `${baseVidUrl + quizData.music}` },
        { shouldPlay: true }
      );
      setSound(sound);
    } catch (error) {
      console.error("Error loading audio:", error);
    }
  };
  
  useEffect(() => {
    if (quizData && quizData.live == "yes" && countdown3 >= 0) {
      const secondminus = setInterval(() => {
        setCountdown3((prevCount) => prevCount - 1);
      }, 1000);

      return () => clearInterval(secondminus);
    }
  }, [quizData, countdown3]);

  useEffect(() => {
    if (countdown3 == 0) {
      handleQuiz();
    }
  }, [countdown3]);

  const renderContent = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A80F0" />
          <Text style={styles.loadingText}>Loading quiz information...</Text>
        </View>
      );
    }
    
    if (!quizData) {
      return (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle" size={60} color="#FF6B6B" />
          <Text style={styles.errorTitle}>Quiz Not Available</Text>
          <Text style={styles.errorText}>
            We couldn't load the quiz information. Please try again later.
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (quizData.live == "yes" && completed) {
      return (
        <View style={styles.missedQuizContainer}>
          <Feather name="clock" size={70} color="#FF6B6B" />
          <Text style={styles.missedTitle}>Quiz Already Started</Text>
          <Text style={styles.missedText}>
            Sorry! You missed the start time for this live quiz.
          </Text>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      );
    }
    
    if (quizData.live == "yes" && !completed) {
      return (
        <View style={styles.liveCountdownContainer}>
          <View style={styles.quizInfoContainer}>
            <MaterialCommunityIcons 
              name="timer-sand" 
              size={60} 
              color="#4A80F0" 
              style={{marginBottom: 16}}
            />
            <Text style={styles.quizTitle}>{quizData.challenge_name || "Live Quiz"}</Text>
            <Text style={styles.quizDescription}>
              Get ready! The quiz will start in:
            </Text>
          </View>
          
          <View style={styles.timerContainer}>
            <TimerBlock value={hours} label="HOURS" color="#4A80F0" />
            <TimerBlock value={minutes} label="MINUTES" color="#FF416C" />
            <TimerBlock value={seconds} label="SECONDS" color="#4ADE80" />
          </View>
          
          <View style={styles.instructionsContainer}>
            <MaterialCommunityIcons name="information-outline" size={24} color="#4A80F0" />
            <Text style={styles.instructionsText}>
              The quiz will automatically start when the timer reaches zero.
              Make sure your sound is turned on!
            </Text>
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.regularQuizContainer}>
        <MaterialCommunityIcons name="head-question" size={80} color="#4A80F0" />
        
        <Text style={styles.quizTitle}>{quizData.challenge_name || "Quiz Challenge"}</Text>
        
        <View style={styles.quizInfoRow}>
          <View style={styles.quizInfoItem}>
            <Ionicons name="help-circle-outline" size={24} color="#4A80F0" />
            <Text style={styles.quizInfoValue}>{quizData.count_question || 0}</Text>
            <Text style={styles.quizInfoLabel}>Questions</Text>
          </View>
          
          <View style={styles.quizInfoDivider} />
          
          <View style={styles.quizInfoItem}>
            <Ionicons name="timer-outline" size={24} color="#4A80F0" />
            <Text style={styles.quizInfoValue}>
              {quizData.duration_minutes || 0}
            </Text>
            <Text style={styles.quizInfoLabel}>Minutes</Text>
          </View>
          
          <View style={styles.quizInfoDivider} />
          
          <View style={styles.quizInfoItem}>
            <Ionicons name="trophy-outline" size={24} color="#4A80F0" />
            <Text style={styles.quizInfoValue}>{quizData.reward_points || 0}</Text>
            <Text style={styles.quizInfoLabel}>Points</Text>
          </View>
        </View>
        
        <Text style={styles.readyText}>Are you ready to start?</Text>
        
        <TouchableOpacity 
          style={styles.startButton} 
          onPress={handleQuiz}
          disabled={animateStart}
        >
          {animateStart ? (
            <ActivityIndicator color="white" />
          ) : (
            <>
              <Text style={styles.startButtonText}>Start Quiz</Text>
              <Ionicons name="arrow-forward" size={20} color="white" />
            </>
          )}
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['rgba(18,18,24,0.93)', 'rgba(18,18,24,0.98)']}
        style={styles.gradientBackground}
      >
        <Animated.View 
          style={[
            styles.contentCard,
            {
              opacity: fadeAnim,
              transform: [{scale: scaleAnim}]
            }
          ]}
        >
          {renderContent()}
        </Animated.View>
      </LinearGradient>
    </SafeAreaView>
  );
};

export default LobbyScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradientBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  contentCard: {
    backgroundColor: "white",
    borderRadius: 24,
    width: "100%",
    maxWidth: 500,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 15,
  },
  
  // Loading state
  loadingContainer: {
    paddingVertical: 50,
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: hp(1.8),
    fontFamily: "raleway-medium",
    color: "#666",
  },
  
  // Error state
  errorContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  errorTitle: {
    fontSize: hp(2.8),
    fontFamily: "raleway-bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: hp(1.8),
    fontFamily: "raleway-medium",
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  backButton: {
    backgroundColor: "#4A80F0",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginTop: 16,
  },
  backButtonText: {
    color: "white",
    fontSize: hp(2),
    fontFamily: "raleway-bold",
  },
  
  // Missed quiz state
  missedQuizContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },
  missedTitle: {
    fontSize: hp(2.8),
    fontFamily: "raleway-bold",
    color: "#FF6B6B",
    marginTop: 16,
    marginBottom: 8,
  },
  missedText: {
    fontSize: hp(1.8),
    fontFamily: "raleway-medium",
    color: "#666",
    textAlign: "center",
    marginBottom: 24,
  },
  
  // Live countdown state
  liveCountdownContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  quizInfoContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  quizTitle: {
    fontSize: hp(3),
    fontFamily: "raleway-bold",
    color: "#333",
    marginBottom: 12,
    textAlign: "center",
  },
  quizDescription: {
    fontSize: hp(1.8),
    fontFamily: "raleway-medium",
    color: "#666",
    textAlign: "center",
  },
  timerContainer: {
    flexDirection: "row",
    justifyContent: "center",
    marginVertical: 24,
    gap: 12,
  },
  timerBlockContainer: {
    alignItems: "center",
  },
  timerBlock: {
    width: TIME_BLOCK_SIZE,
    height: TIME_BLOCK_SIZE,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  timerValue: {
    fontSize: hp(4),
    fontFamily: "raleway-bold",
    color: "white",
  },
  timerLabel: {
    fontSize: hp(1.5),
    fontFamily: "raleway-bold",
    color: "#666",
    marginTop: 8,
  },
  instructionsContainer: {
    flexDirection: "row",
    backgroundColor: "#F0F6FF",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    alignItems: "flex-start",
  },
  instructionsText: {
    flex: 1,
    fontSize: hp(1.6),
    fontFamily: "raleway",
    color: "#333",
    marginLeft: 10,
  },
  
  // Regular quiz state
  regularQuizContainer: {
    alignItems: "center",
    paddingVertical: 30,
  },
  quizInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 24,
    width: "100%",
    justifyContent: "center",
  },
  quizInfoItem: {
    alignItems: "center",
    paddingHorizontal: 8,
  },
  quizInfoDivider: {
    width: 1,
    height: "70%",
    backgroundColor: "#DDD",
    marginHorizontal: 16,
  },
  quizInfoValue: {
    fontSize: hp(2.5),
    fontFamily: "raleway-bold",
    color: "#333",
    marginTop: 6,
  },
  quizInfoLabel: {
    fontSize: hp(1.5),
    fontFamily: "raleway",
    color: "#666",
    marginTop: 2,
  },
  readyText: {
    fontSize: hp(2.2),
    fontFamily: "raleway-bold",
    color: "#333",
    marginVertical: 16,
  },
  startButton: {
    backgroundColor: "#4A80F0",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    shadowColor: "#4A80F0",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
    marginTop: 16,
  },
  startButtonText: {
    color: "white",
    fontSize: hp(2),
    fontFamily: "raleway-bold",
    marginRight: 8,
  },
});