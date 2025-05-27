import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackActions, useFocusEffect, useIsFocused, useNavigation } from "@react-navigation/native";
import axios from "axios";
import { Accelerometer, Magnetometer } from "expo-sensors";
import { StatusBar } from "expo-status-bar";
import LottieView from "lottie-react-native";
import React, { useCallback, useEffect, useState, useRef } from "react";
import {
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  BackHandler,
  Alert,
} from "react-native";
import CircularProgress from "react-native-circular-progress-indicator";
import { BlurView } from "expo-blur";
import { Modal, PaperProvider, Portal } from "react-native-paper";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  FadeIn,
} from "react-native-reanimated";
import { widthPercentageToDP as wp, heightPercentageToDP as hp } from "react-native-responsive-screen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { baseURL } from "../backend/baseData";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";

const { height, width } = Dimensions.get("window");

const STRIDE_LENGTH = 0.762; // Average stride length in meters
const PROGRESS_RADIUS = 110; // Fixed radius for progress circle

export default function AcceleroMeterScreen({ route }) {
  const { userSId, challenge, maxSteps, direction, userTaskId } = route.params;
  const [steps, setSteps] = useState(0);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [magnetometer, setMagnetometer] = useState(0);
  const [pointerColor, setPointerColor] = useState("#FF5757");
  const [newDirection, setNewDirection] = useState();
  const [newChallenges, setNewChallenges] = useState();
  const [newDuration, setNewDuration] = useState(0);
  const [navRoute, setNavRoute] = useState(0);
  const [newSteps, setNewSteps] = useState(0);
  const [newUserTaskId, setNewUserTaskId] = useState(null);
  const [user, setUser] = useState(null);
  const [visible2, setVisible2] = useState(false);
  const [calories, setCalories] = useState(0);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation values
  const progressValue = useSharedValue(0);
  const stepAnimation = useSharedValue(1);
  const tasks = challenge;
  const navigation = useNavigation();
  const accelSubscriptionRef = useRef(null);
  const lottieRef = useRef(null);
  
  // Handle back button to prevent accidental exits
  useEffect(() => {
    const backAction = () => {
      Alert.alert(
        "Exit Challenge?", 
        "Are you sure you want to exit? Your current progress will be saved.",
        [
          { text: "Stay", onPress: () => null, style: "cancel" },
          { text: "Exit", onPress: () => navigation.goBack() }
        ]
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener(
      "hardwareBackPress",
      backAction
    );

    return () => backHandler.remove();
  }, []);
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          navigation.replace("OtpVerification");
        }
      } catch (error) {
        console.error("Error while fetching user:", error.message);
      }
    };

    fetchUser();
  }, []);

  const showModal = () => {
    setVisible(true);
  };
  
  const hideModal = () => {
    setVisible(false);
  };
  
  const showModal2 = () => {
    setVisible2(true);
  };
  
  const hideModal2 = () => {
    setVisible2(false);
  };
  
  useEffect(() => {
    // Update progress animation value
    progressValue.value = withTiming((steps / maxSteps) * 100, {
      duration: 500,
    });
    
    // Calculate approximate calories burned (very rough estimate)
    // Average person burns about 0.04 calories per step
    setCalories(Math.round(steps * 0.04 * 10) / 10);
  }, [steps]);
  
  useEffect(() => {
    _toggle();
    return () => {
      _unsubscribe();
    };
  }, []);

  const _toggle = () => {
    if (subscription) {
      _unsubscribe();
    } else {
      _subscribe();
    }
  };

  const _subscribe = () => {
    setSubscription(
      Magnetometer.addListener((data) => {
        setMagnetometer(_angle(data));
      })
    );
  };

  const _unsubscribe = () => {
    subscription && subscription.remove();
    setSubscription(null);
  };

  const _angle = (magnetometer) => {
    let angle = 0;
    if (magnetometer) {
      let { x, y, z } = magnetometer;
      if (Math.atan2(y, x) >= 0) {
        angle = Math.atan2(y, x) * (180 / Math.PI);
      } else {
        angle = (Math.atan2(y, x) + 2 * Math.PI) * (180 / Math.PI);
      }
    }
    return Math.round(angle);
  };

  const stopSensors = () => {
    if (accelSubscriptionRef.current) {
      accelSubscriptionRef.current.remove();
      accelSubscriptionRef.current = null;
    }
  };

  const startAccelerometer = () => {
    if (!accelSubscriptionRef.current && !isCompleted) {
      accelSubscriptionRef.current = Accelerometer.addListener(({ x, y, z }) => {
        const acceleration = Math.sqrt(x ** 2 + y ** 2 + z ** 2);
        const threshold = 1.2;

        setPointerColor("#4CAF50");

        if (acceleration > threshold) {
          stepAnimation.value = withSpring(1.2, { damping: 10 }, () => {
            stepAnimation.value = withTiming(1, { duration: 300 });
          });
          
          setSteps((prevSteps) => {
            const newSteps = prevSteps + 1;

            if (newSteps >= maxSteps) {
              completeChallenge(newSteps);
              return maxSteps; // Cap at max steps
            } else if (newSteps % 10 == 0) {
              sendProgress(newSteps);
            }

            return newSteps;
          });
        }
      });
    }
  };

  const completeChallenge = async (finalSteps) => {
    if (isCompleted) return; // Prevent multiple completions
    
    setIsCompleted(true);
    stopSensors();
    setIsLoading(true);
    
    try {
      // Send final progress
      await endProgress();
      
      // Check for next task
      if (tasks.multiple == "yes") {
        await checkNextTask();
      } else {
        showModal2();
      }
    } catch (error) {
      console.error("Error completing challenge:", error);
      Alert.alert(
        "Error", 
        "There was a problem completing the challenge. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };
  
  const endProgress = async () => {
    try {
      console.log("Request payload:", {
  userTaskId: userTaskId,
  steps: maxSteps,
  challenge_id: challenge.challenge_id,
  userId: user?.id ? user?.id : userSId,
  task_id: tasks?.task_id,
});

      const response = await axios.post(
        `${baseURL}/userEndProgress.php`,
        {
          userTaskId: userTaskId,
          steps: maxSteps,
          challenge_id: challenge.challenge_id,
          userId: user?.id ? user?.id : userSId,
          task_id: tasks?.task_id,
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status == 200) {
        console.log("End progress success");
        return true;
      } else {
        console.error(
          "Error:",
          response.data ? response.data.error : "Unknown error"
        );
        return false;
      }
    } catch (error) {
      console.error("Error sending end progress:", error.message);
      throw error;
    }
  };
  
  const sendProgress = async (stepCount) => {
    try {
      const response = await axios.post(
        `${baseURL}/userTaskProgress.php`,
        {
          userTaskId: userTaskId,
          steps: stepCount,
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.status == 200) {
        console.log("Progress update sent");
      } else {
        console.error(
          "Error:",
          response.data ? response.data.error : "Unknown error"
        );
      }
    } catch (error) {
      console.error("Error sending progress:", error.message);
    }
  };
  
  const checkNextTask = async () => {
    try {
      const response = await axios.get(
        `${baseURL}/checkNextTaskExist.php?task_id=${tasks.task_id}&challenge_id=${tasks.challenge_id}&user_id=${user?.id}`
      );
      
      if (response.data.next == "yes") {
        setNewChallenges(response.data);
        setNewSteps(response.data.steps);
        setNewDirection(response.data.direction);
        
        try {
          const response2 = await axios.post(
            `${baseURL}/createUserTasks.php`,
            {
              task_id: response.data.task_id,
              user_id: userSId,
              entry_points: response.data.entry_points,
            },
            {
              headers: {
                "Content-Type": "application/x-www-form-urlencoded",
              },
            }
          );
          
          setNewUserTaskId(response2.data.task.userTaskId);
          setNewDuration(response.data.duration);
          
          if (response.data.task_type == "videoCapture") {
            setNavRoute("VideoTesting");
          } else if (response.data.task_type == "mediaCapture") {
            setNavRoute("SelfieScreen");
          } else if (response.data.task_type == "stepCounter") {
            setNavRoute("AcceleroMeterScreen");
          }
          
          showModal();
        } catch (error) {
          console.error("Error creating user tasks:", error);
          throw error;
        }
      } else {
        showModal2();
      }
    } catch (error) {
      console.error("Error checking next task:", error);
      throw error;
    }
  };

  useEffect(() => {
    startAccelerometer();
    
    return () => {
      stopSensors();
    };
  }, []);

  const isFocused = useIsFocused();
  useFocusEffect(
    useCallback(() => {
      const calculatedProgress = (steps / maxSteps) * 100;
      setProgress(calculatedProgress > 100 ? 100 : calculatedProgress);
    }, [isFocused, steps])
  );

  const distanceInKm = (steps * STRIDE_LENGTH) / 1000;

  const handleCompletion = () => {
    navigation.replace("EntryCard", {
      navRoute: navRoute,
      userSId: userSId,
      challenge: newChallenges,
      tasks: newChallenges,
      maxSteps: newSteps,
      direction: newDirection,
      userTaskId: newUserTaskId,
      duration: newDuration,
    });
  };

  // Step counter animation style
  const animatedStepStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: stepAnimation.value }],
    };
  });

  const { top } = useSafeAreaInsets();
  const paddingTop = top > 10 ? top : 30;
  
  return (
    <PaperProvider>
      <Portal>
        <Modal
          visible={visible}
          onDismiss={hideModal}
          contentContainerStyle={styles.modalContainer}
          dismissable={false}
        >
          <BlurView intensity={90} style={styles.blurContainer}>
            <Animated.View 
              entering={FadeIn.duration(400)} 
              style={styles.successContainer}
            >
              <Text style={styles.modalTitle}>CHALLENGE COMPLETED</Text>
              <LottieView
                source={require("../assets/animation/success.json")}
                style={styles.successAnimation}
                autoPlay
                loop
              />
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() =>
                  navigation.replace("SelfieScreenShare", {
                    userSId,
                    challenge,
                    navRoute: navRoute,
                    userSIds: userSId,
                    challenge: newChallenges,
                    tasks: newChallenges,
                    maxSteps: newSteps,
                    direction: newDirection,
                    userTaskId: newUserTaskId,
                    duration: newDuration,
                    next: "yes",
                  })
                }
              >
                <Text style={styles.buttonText}>Share Your Moment</Text>
              </TouchableOpacity>
              <TouchableOpacity
                              style={styles.certificateButton}
                              onPress={() =>
                                navigation.navigate("TaskCertificateViewer", {
                                  taskId: tasks.task_id,
                                  userId: userSId,
                                })
                              }
                            >
                              <Text style={styles.certificateButtonText}>
                                View Certificate
                              </Text>
                            </TouchableOpacity>
              <TouchableOpacity style={styles.nextButton} onPress={handleCompletion}>
                <Text style={styles.buttonText}>Go to Next Task</Text>
              </TouchableOpacity>
            </Animated.View>
          </BlurView>
        </Modal>
        
        <Modal
          visible={visible2}
          onDismiss={hideModal2}
          contentContainerStyle={styles.modalContainer}
          dismissable={false}
        >
          <BlurView intensity={90} style={styles.blurContainer}>
            <Animated.View 
              entering={FadeIn.duration(400)} 
              style={styles.successContainer}
            >
              <Text style={styles.modalTitle}>CHALLENGE COMPLETED</Text>
              <LottieView
                source={require("../assets/animation/success.json")}
                style={styles.successAnimation}
                autoPlay
                loop
              />
              <TouchableOpacity
                style={styles.shareButton}
                onPress={() =>
                  navigation.replace("SelfieScreenShare", {
                    userSId,
                    challenge,
                    tasks,
                    next: "no",
                  })
                }
              >
                <Text style={styles.buttonText}>Share Your Moment</Text>
              </TouchableOpacity>
              <TouchableOpacity
                              style={styles.certificateButton}
                              onPress={() =>
                                navigation.navigate("TaskCertificateViewer", {
                                  taskId: tasks?.task_id,
                                  userId: userSId,
                                })
                              }
                            >
                              <Text style={styles.certificateButtonText}>
                                View Certificate
                              </Text>
                            </TouchableOpacity>
              <TouchableOpacity
                style={styles.homeButton}
                onPress={() => navigation.dispatch(StackActions.popToTop())}
              >
                <Text style={styles.buttonText}>Go Home</Text>
              </TouchableOpacity>
            </Animated.View>
          </BlurView>
        </Modal>
      </Portal>
      
      <LinearGradient
        colors={['rgba(18, 18, 24, 0.9)', 'rgba(18, 18, 24, 0.98)']}
        style={styles.gradientOverlay}
      >
        <StatusBar style="light" />
        
        <View style={[styles.container, { paddingTop: paddingTop }]}>
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.backButton}
              onPress={() => {
                Alert.alert(
                  "Exit Challenge?", 
                  "Are you sure you want to exit? Your current progress will be saved.",
                  [
                    { text: "Stay", onPress: () => null, style: "cancel" },
                    { text: "Exit", onPress: () => navigation.goBack() }
                  ]
                );
              }}
            >
              <Ionicons name="arrow-back" size={24} color="white" />
            </TouchableOpacity>
            
            <View style={styles.headerTextContainer}>
              <Text style={styles.headerTitle}>Step Challenge</Text>
              <Text style={styles.headerSubtitle}>{challenge.challenge_name || challenge.challenge_title || "Daily Walk"}</Text>
            </View>
            
            <View style={styles.headerSpacer} />
          </View>
          
          <View style={styles.progressSection}>
            <View style={styles.progressContainer}>
              <CircularProgress
                value={progress}
                maxValue={100}
                radius={PROGRESS_RADIUS}
                progressValueStyle={{ fontFamily: 'System', fontSize: 20, color: '#FFFFFF', fontWeight: '600' }}
                title={`${Math.round(progress)}%`}
                titleStyle={{ fontFamily: 'System', fontSize: 16, color: '#CCCCCC' }}
                activeStrokeColor="#4ADE80"
                activeStrokeSecondaryColor="#06B6D4"
                inActiveStrokeColor="#2A2A3A"
                inActiveStrokeOpacity={0.5}
                inActiveStrokeWidth={15}
                activeStrokeWidth={15}
                showProgressValue={false}
              />
              
              <Animated.View style={[styles.stepsOverlay, animatedStepStyle]}>
                <Text style={styles.currentSteps}>{steps}</Text>
                <Text style={styles.targetSteps}>of {maxSteps} steps</Text>
              </Animated.View>
            </View>
            
            <View style={styles.statsContainer}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{distanceInKm.toFixed(2)} km</Text>
                <Text style={styles.statLabel}>Distance</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{calories}</Text>
                <Text style={styles.statLabel}>Calories</Text>
              </View>
              
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{Math.round((steps / maxSteps) * 100)}%</Text>
                <Text style={styles.statLabel}>Complete</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.animationContainer}>
            <LottieView
              ref={lottieRef}
              source={require("../assets/animation/walking.json")}
              autoPlay
              loop
              style={styles.lottieAnimation}
            />
            
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <LottieView
                  source={require("../assets/animation/loading.json")}
                  autoPlay
                  loop
                  style={styles.loadingAnimation}
                />
                <Text style={styles.loadingText}>Completing Challenge...</Text>
              </View>
            )}
          </View>
          
          {!isCompleted && (
            <View style={styles.tipsContainer}>
              <Text style={styles.tipTitle}>Walking Tips</Text>
              <Text style={styles.tipText}>- Keep a steady pace for accurate counting</Text>
              <Text style={styles.tipText}>- Hold your phone naturally while walking</Text>
              <Text style={styles.tipText}>- Move your phone slightly to register steps</Text>
            </View>
          )}
        </View>
      </LinearGradient>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  gradientOverlay: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  container: {
    flex: 1,
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    alignItems: 'center',
    flex: 1,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#AAAAAA',
    marginTop: 5,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 44,
  },
  progressSection: {
    alignItems: 'center',
  },
  progressContainer: {
    marginVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepsOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currentSteps: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  targetSteps: {
    fontSize: 14,
    color: '#AAAAAA',
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
    marginTop: 30,
  },
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 15,
    width: wp(28),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  statLabel: {
    fontSize: 12,
    color: '#AAAAAA',
    marginTop: 4,
  },
  animationContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    position: 'relative',
  },
  lottieAnimation: {
    width: width * 0.8,
    height: height * 0.3,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(18, 18, 24, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  loadingAnimation: {
    width: 100,
    height: 100,
  },
  loadingText: {
    fontSize: 16,
    color: '#FFFFFF',
    marginTop: 10,
  },
  tipsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginTop: 20,
    marginBottom: 20,
  },
  tipTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  tipText: {
    fontSize: 14,
    color: '#AAAAAA',
    marginBottom: 6,
  },
  modalContainer: {
    margin: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blurContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successContainer: {
    backgroundColor: 'rgba(22, 22, 30, 0.95)',
    padding: 25,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    width: wp(90),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
    marginBottom: 20,
    textAlign: 'center',
  },
  successAnimation: {
    width: 180,
    height: 180,
    marginVertical: 10,
  },
  shareButton: {
    backgroundColor: '#3B82F6',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  nextButton: {
    backgroundColor: '#4ADE80',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#4ADE80',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  homeButton: {
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  certificateButton: {
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 25,
    borderRadius: 30,
    minWidth: wp(80),
    marginBottom: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  certificateButtonText: {
    fontSize: 16,
    color: "white",
    fontFamily: "raleway-bold",
    textAlign: "center",
  },
});