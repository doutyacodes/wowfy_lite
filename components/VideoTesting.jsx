import { AntDesign, MaterialIcons, Ionicons, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackActions, useNavigation } from "@react-navigation/native";
import axios from "axios";
import { Audio, ResizeMode, Video } from "expo-av";
import { CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import LottieView from "lottie-react-native";
import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  Animated,
} from "react-native";
import {
  MD3Colors,
  Modal,
  PaperProvider,
  Portal,
  ProgressBar,
} from "react-native-paper";
import { baseURL } from "../backend/baseData";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { BlurView } from "expo-blur";

export default function VideoTesting({ route }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [audioPermission, setAudioPermission] = useState(null);
  const [recording, setRecording] = useState(false);
  const [videoSource, setVideoSource] = useState(null);
  const [facing, setFacing] = useState("back");
  const cameraRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [newDirection, setNewDirection] = useState();
  const [newChallenges, setNewChallenges] = useState();
  const [newDuration, setNewDuration] = useState(0);
  const [navRoute, setNavRoute] = useState(0);
  const [newSteps, setNewSteps] = useState(0);
  const [newUserTaskId, setNewUserTaskId] = useState(null);
  const [visible, setVisible] = useState(false);
  const [visible2, setVisible2] = useState(false);
  const [user, setUser] = useState(null);
  const [timeDisplay, setTimeDisplay] = useState("0:00");
  const [recordingStartTime, setRecordingStartTime] = useState(null);
  const navigation = useNavigation();
  
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const uploadButtonScale = useRef(new Animated.Value(1)).current;
  const timerRef = useRef(null);

  // Extract params from route
  const { userTaskId, tasks, userSId, challenge, duration } = route.params;
  // Parse duration and ensure it's a valid number with fallback to 30 seconds
  const maxDuration = parseInt(duration, 10) || 30;

  useEffect(() => {
    if (recording) {
      // Start pulsing animation for record button
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
      
      // Set recording start time
      setRecordingStartTime(Date.now());
      
      // Start the timer for tracking progress
      startTimer();
    } else {
      // Reset animation when not recording
      pulseAnim.setValue(1);
      
      // Clear the timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    
    // Cleanup function to clear timer when component unmounts
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, [recording]);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        } else {
          navigation.replace("Login");
        }
      } catch (error) {
        console.error("Error while fetching user:", error.message);
      }
    };

    fetchUser();
  }, []);

  useEffect(() => {
    const setupPermissions = async () => {
      await requestPermission();
      await getAudioPermission();
    };
    
    setupPermissions();
    
    // Cleanup when component unmounts
    return () => {
      if (recording) {
        stopRecording();
      }
    };
  }, []);

  const startTimer = () => {
    // Set initial values
    setProgress(0);
    setTimeDisplay("0:00");
    
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
    
    timerRef.current = setInterval(() => {
      if (!recordingStartTime) return;
      
      const elapsed = (Date.now() - recordingStartTime) / 1000; // seconds
      
      // Format time display
      const minutes = Math.floor(elapsed / 60);
      const seconds = Math.floor(elapsed % 60);
      setTimeDisplay(`${minutes}:${seconds < 10 ? '0' : ''}${seconds}`);
      
      // Calculate progress - convert to integer to avoid precision errors
      // Using Math.floor to ensure we don't exceed 1.0
      const progressValue = Math.floor((elapsed / maxDuration) * 100) / 100;
      setProgress(progressValue);
      
      // Stop recording if max duration reached
      if (elapsed >= maxDuration) {
        stopRecording();
      }
    }, 500); // Update every half second to reduce precision issues
  };

  const showModal = () => {
    setVisible(true);
  };

  const showModal2 = () => {
    setVisible2(true);
  };

  const hideModal = () => setVisible(false);

  const hideModal2 = () => setVisible2(false);

  const getAudioPermission = async () => {
    try {
      const { status } = await Audio.requestPermissionsAsync();
      setAudioPermission(status === "granted");
    } catch (error) {
      console.error("Error getting audio permission:", error);
    }
  };

  function toggleCameraType() {
    setFacing((current) => (current === "back" ? "front" : "back"));
  }

  const startRecording = async () => {
    if (cameraRef.current && audioPermission) {
      try {
        if (recording) {
          await stopRecording();
        } else {
          setRecording(true);
          setRecordingStartTime(Date.now());
          
          // Use minimal options to reduce chance of errors
          const result = await cameraRef.current.recordAsync({
            maxDuration: maxDuration,
            quality: '720p',
          });
          
          if (result && result.uri) {
            setVideoSource(result.uri);
          } else {
            console.error("Failed to get video URI");
            Alert.alert("Recording Error", "Failed to get video URI");
          }
        }
      } catch (error) {
        console.error("Error during recording:", error);
        Alert.alert("Recording Error", "There was a problem with your recording. Please try again.");
        setRecording(false);
      }
    } else if (!audioPermission) {
      Alert.alert(
        "Permission Required", 
        "Microphone access is needed to record video with sound.",
        [{ text: "OK", onPress: () => getAudioPermission() }]
      );
    } else if (!permission?.granted) {
      Alert.alert(
        "Permission Required", 
        "Camera access is needed to record video.",
        [{ text: "OK", onPress: () => requestPermission() }]
      );
    }
  };

  const stopRecording = async () => {
    if (cameraRef.current && recording) {
      try {
        if (cameraRef.current?._cameraRef?.current?.stopRecording) {
          await cameraRef.current._cameraRef.current.stopRecording();
        } else {
          console.log("stopRecording method not available");
        }
      } catch (error) {
        console.error("Error stopping recording:", error);
      } finally {
        setRecording(false);
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
    }
  };

  const submitSave = async () => {
    if (!videoSource) {
      Alert.alert("Oops!", "You need to record a video first!");
      return;
    }
    
    Animated.sequence([
      Animated.timing(uploadButtonScale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true
      }),
      Animated.timing(uploadButtonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true
      })
    ]).start();
    
    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("imageFile", {
        uri: videoSource,
        type: "video/mp4",
        name: `video_${Date.now()}.mp4`,
      });
      formData.append("userTaskId", userTaskId);
      formData.append("taskId", tasks.task_id);
      formData.append("userSId", userSId);
      formData.append("challenge_id", challenge.challenge_id);
      formData.append("media_type", "video");

      const response = await axios.post(`${baseURL}/add-media.php`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.status == 200) {
        console.log("Video upload successful");
      } else {
        console.error("Unexpected status code:", response.status);
        throw new Error("Upload failed with status " + response.status);
      }

      const checkNext = async () => {
        try {
          const response = await axios.get(
            `${baseURL}/checkNextTaskExist.php?task_id=${tasks.task_id}&challenge_id=${tasks.challenge_id}&user_id=${user?.id}`
          );

          if (response.data.next === "yes") {
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
              if (response.data.task_type === "videoCapture") {
                setNavRoute("VideoTesting");
              }
              if (response.data.task_type === "mediaCapture") {
                setNavRoute("SelfieScreen");
              }
              if (response.data.task_type === "stepCounter") {
                setNavRoute("AcceleroMeterScreen");
              }
              showModal();
            } catch (error) {
              console.error("Error creating user task:", error);
              Alert.alert("Error", "Could not create the next task. Please try again.");
            }
          } else {
            showModal2();
          }
        } catch (error) {
          console.error("Error checking next task:", error);
          Alert.alert("Error", "Could not check for next task. Please try again.");
        }
      };

      if (tasks.multiple === "yes") {
        checkNext();
      } else {
        showModal2();
      }
    } catch (error) {
      console.error("Error submitting video:", error);
      Alert.alert("Upload Failed", "Could not upload your video. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

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

  const handleBack = () => {
    if (recording) {
      stopRecording();
    }
    navigation.goBack();
  };

  const RecordingIndicator = () => (
    <View style={styles.recordingIndicator}>
      <Animated.View 
        style={[
          styles.recordingDot,
          {opacity: pulseAnim.interpolate({
            inputRange: [1, 1.2],
            outputRange: [1, 0.5]
          })}
        ]} 
      />
      <Text style={styles.recordingText}>Recording</Text>
    </View>
  );

  // Format the total duration as a display string
  const formatDuration = () => {
    const minutes = Math.floor(maxDuration / 60);
    const seconds = maxDuration % 60;
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  // Calculate remaining time for display
  const calculateRemainingTime = () => {
    if (!recordingStartTime) return formatDuration();
    
    const elapsedMs = Date.now() - recordingStartTime;
    const remainingSeconds = Math.max(0, maxDuration - (elapsedMs / 1000));
    const minutes = Math.floor(remainingSeconds / 60);
    const seconds = Math.floor(remainingSeconds % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (!permission) {
    return (
      <View style={styles.permissionContainer}>
        <ActivityIndicator size="large" color="#0096b1" />
        <Text style={styles.permissionText}>Loading camera...</Text>
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Ionicons name="camera-off-outline" size={hp(8)} color="#0096b1" />
        <Text style={styles.permissionTitle}>Camera Permission Required</Text>
        <Text style={styles.permissionText}>
          We need access to your camera to record videos for this challenge
        </Text>
        <TouchableOpacity
          style={styles.permissionButton}
          onPress={requestPermission}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <PaperProvider>
      <SafeAreaView style={styles.safeArea}>
        <Portal>
          <Modal
            dismissable={false}
            visible={visible}
            onDismiss={hideModal}
            contentContainerStyle={styles.modalContainer}
          >
            <View style={styles.successContainer}>
              <Text style={styles.successTitle}>
                CHALLENGE COMPLETED
              </Text>
              <LottieView
                source={require("../assets/animation/success.json")}
                style={styles.lottie}
                autoPlay
                loop={false}
              />
            </View>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => handleCompletion()}
            >
              <Text style={styles.modalButtonText}>
                NEXT CHALLENGE
              </Text>
            </TouchableOpacity>
          </Modal>
          
          <Modal
            dismissable={false}
            visible={visible2}
            onDismiss={hideModal2}
            contentContainerStyle={styles.modalContainer}
          >
            <View style={styles.successContainer}>
              <Text style={styles.successTitle}>
                CHALLENGE COMPLETED
              </Text>
              <LottieView
                source={require("../assets/animation/success.json")}
                style={styles.lottie}
                autoPlay
                loop={false}
              />
            </View>
            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => navigation.dispatch(StackActions.popToTop())}
            >
              <Text style={styles.modalButtonText}>
                BACK TO HOME
              </Text>
            </TouchableOpacity>
          </Modal>
        </Portal>
        
        <View style={styles.container}>
          <TouchableOpacity 
            style={styles.backButton} 
            onPress={handleBack}
          >
            <Ionicons name="chevron-back" size={hp(3)} color="white" />
          </TouchableOpacity>
          
          {recording && <RecordingIndicator />}
          
          {videoSource ? (
            <>
              <Video
                source={{ uri: videoSource }}
                style={styles.camera}
                resizeMode={ResizeMode.COVER}
                useNativeControls
              />
              <BlurView intensity={90} style={styles.controlsOverlay}>
                <View style={styles.previewControls}>
                  <Animated.View style={{transform: [{scale: uploadButtonScale}]}}>
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={submitSave}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size={hp(3)} color="white" />
                      ) : (
                        <>
                          <Feather name="upload" size={hp(3)} color="white" />
                          <Text style={styles.actionButtonText}>Upload</Text>
                        </>
                      )}
                    </TouchableOpacity>
                  </Animated.View>
                  
                  <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => setVideoSource(null)}
                  >
                    <Feather name="refresh-cw" size={hp(3)} color="white" />
                    <Text style={styles.actionButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              </BlurView>
            </>
          ) : (
            <>
              <CameraView
                ref={cameraRef}
                style={styles.camera}
                facing={facing}
                ratio="16:9"
                mode="video"
              />
              
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={styles.smallButton}
                  onPress={toggleCameraType}
                  disabled={recording}
                >
                  <Ionicons 
                    name="camera-reverse-outline" 
                    size={hp(3)} 
                    color={recording ? "rgba(255,255,255,0.5)" : "white"} 
                  />
                </TouchableOpacity>
                
                <Animated.View style={[{transform: [{scale: pulseAnim}]}]}>
                  <TouchableOpacity
                    style={[
                      styles.captureButton,
                      recording && styles.recordingButton
                    ]}
                    onPress={startRecording}
                  >
                    {recording ? (
                      <Ionicons name="stop" size={hp(3.5)} color="white" />
                    ) : (
                      <Ionicons name="videocam" size={hp(3.5)} color="white" />
                    )}
                  </TouchableOpacity>
                </Animated.View>
                
                <View style={{width: hp(6)}} /> 
              </View>
              
              {!recording && (
                <View style={styles.instructionContainer}>
                  <Text style={styles.instructionText}>
                    Tap the camera button to start recording
                  </Text>
                  <Text style={styles.durationText}>
                    Maximum duration: {formatDuration()}
                  </Text>
                </View>
              )}
            </>
          )}
          
          {recording && (
            <View style={styles.timerContainer}>
              <View style={styles.progressBarContainer}>
                <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
              </View>
              <View style={styles.timerTextContainer}>
                <Text style={styles.elapsedTimeText}>{timeDisplay}</Text>
                <Text style={styles.remainingTimeText}>
                  Remaining: {calculateRemainingTime()}
                </Text>
              </View>
            </View>
          )}
          
          <StatusBar style="light" />
        </View>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#000",
  },
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  camera: {
    flex: 1,
  },
  backButton: {
    position: "absolute",
    top: hp(2),
    left: wp(5),
    zIndex: 100,
    padding: 8,
    borderRadius: 30,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  buttonContainer: {
    position: "absolute",
    bottom: hp(5),
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: wp(8),
  },
  smallButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    padding: hp(2),
    borderRadius: 30,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.3)",
  },
  captureButton: {
    backgroundColor: "#0096b1",
    padding: hp(2.5),
    borderRadius: 50,
    borderWidth: 4,
    borderColor: "rgba(255,255,255,0.5)",
  },
  recordingButton: {
    backgroundColor: "#FF3B30",
  },
  // Custom progress bar elements to replace ProgressBar component
  progressBarContainer: {
    height: 5,
    width: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0096b1',
  },
  timerContainer: {
    position: "absolute",
    bottom: hp(20),
    left: wp(5),
    right: wp(5),
    alignItems: "center",
  },
  timerTextContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 10,
  },
  elapsedTimeText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
  },
  remainingTimeText: {
    fontSize: 16,
    color: "rgba(255,255,255,0.8)",
  },
  recordingIndicator: {
    position: "absolute",
    top: hp(2),
    right: wp(5),
    zIndex: 100,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#FF3B30",
    marginRight: 6,
  },
  recordingText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  controlsOverlay: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingVertical: hp(4),
  },
  previewControls: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: wp(6),
  },
  actionButton: {
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 30,
    alignItems: "center",
    minWidth: wp(25),
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.2)",
  },
  actionButtonText: {
    color: "white",
    marginTop: 5,
    fontWeight: "600",
  },
  modalContainer: {
    backgroundColor: "white",
    margin: 20,
    borderRadius: 20,
    padding: 25,
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
  successContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  successTitle: {
    fontSize: 28,
    color: "#0096b1",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
  },
  lottie: {
    width: 150,
    height: 150,
    marginVertical: 10,
  },
  modalButton: {
    backgroundColor: "#0096b1",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    marginTop: 20,
    width: "100%",
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
  modalButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
  instructionContainer: {
    position: "absolute",
    top: hp(15),
    left: 0,
    right: 0,
    alignItems: "center",
  },
  instructionText: {
    color: "white",
    fontSize: 18,
    fontWeight: "600",
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 10,
  },
  durationText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionTitle: {
    color: "white",
    fontSize: 22,
    fontWeight: "bold",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  permissionText: {
    color: "rgba(255,255,255,0.8)",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  permissionButton: {
    backgroundColor: "#0096b1",
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignItems: "center",
  },
  permissionButtonText: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
  },
});