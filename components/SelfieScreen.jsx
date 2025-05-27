import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StackActions, useNavigation } from "@react-navigation/native";
import axios from "axios";
import { CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import LottieView from "lottie-react-native";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  Animated,
  Easing,
} from "react-native";
import { BlurView } from "expo-blur";
import { PaperProvider, Portal } from "react-native-paper";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { LinearGradient } from "expo-linear-gradient";
import { baseURL } from "../backend/baseData";

export default function SelfieScreen({ route }) {
  const [facing, setFacing] = useState("front");
  const [permission, requestPermission] = useCameraPermissions();
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [newDirection, setNewDirection] = useState();
  const [newChallenges, setNewChallenges] = useState();
  const [newDuration, setNewDuration] = useState(0);
  const [navRoute, setNavRoute] = useState(0);
  const [newSteps, setNewSteps] = useState(0);
  const [newUserTaskId, setNewUserTaskId] = useState(null);
  const [visible, setVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [visible2, setVisible2] = useState(false);
  const [flashMode, setFlashMode] = useState("off");
  const [showGuide, setShowGuide] = useState(true);
  const [user, setUser] = useState(null);
  const navigation = useNavigation();
  const cameraRef = useRef(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  
  // Start pulse animation for capture button
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);
  
  // Start fade animation when component mounts
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start();
    
    // Hide guide after 3 seconds
    const timer = setTimeout(() => {
      setShowGuide(false);
    }, 3000);
    
    return () => clearTimeout(timer);
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
  
  const showModal2 = () => {
    setVisible2(true);
  };
  
  const hideModal = () => setVisible(false);
  const hideModal2 = () => setVisible2(false);
  
  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }
  
  const { userTaskId, tasks, userSId, challenge } = route.params ?? {};

  const takePicture = async () => {
    if (cameraRef && cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.8,
          skipProcessing: false,
        });
        
        // Create animation when photo is captured
        Animated.sequence([
          Animated.timing(fadeAnim, {
            toValue: 0.4,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start();
        
        setCapturedPhoto(photo);
      } catch (error) {
        console.error("Error taking picture:", error);
        Alert.alert("Error", "Failed to take picture. Please try again.");
      }
    }
  };

  function toggleCameraType() {
    setFacing((current) => (current == "back" ? "front" : "back"));
  }
  
  function toggleFlash() {
    setFlashMode((current) => (current == "off" ? "on" : "off"));
  }
  
  const submitSave = async () => {
    if (!capturedPhoto) {
      Alert.alert("Oops!", "You need to take a photo first! 📸");
      return;
    }
    
    setIsLoading(true);

    try {
      const formData = new FormData();

      // Append captured image
      formData.append("imageFile", {
        uri: capturedPhoto.uri,
        type: "image/jpeg",
        name: `selfie_${Date.now()}.jpg`,
      });

      // Append other parameters from route.params
      formData.append("userTaskId", userTaskId);
      formData.append("taskId", tasks.task_id);
      formData.append("userSId", userSId);
      formData.append("challenge_id", challenge.challenge_id);
      formData.append("media_type", "photo");

      // Make an Axios request to your PHP backend API
      const response = await axios.post(`${baseURL}/add-media.php`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Reset capturedPhoto state
      setCapturedPhoto(null);

      if (response.status == 200) {
        console.log("success");
      } else {
        console.error("Unexpected status code:", response.status);
      }
      
      const checkNext = async () => {
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
              }
              if (response.data.task_type == "mediaCapture") {
                setNavRoute("SelfieScreen");
              }
              if (response.data.task_type == "stepCounter") {
                setNavRoute("AcceleroMeterScreen");
              }
              
              showModal();
            } catch (error) {
              console.error("Error creating user tasks:", error);
            }
          } else {
            showModal2();
          }
        } catch (error) {
          console.error("Error checking next task:", error);
          throw error;
        }
      };
      
      if (tasks.multiple == "yes") {
        checkNext();
      } else {
        showModal2();
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      Alert.alert("Error", "Failed to upload image. Please try again.");
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
  
  return (
    <PaperProvider>
      <Portal>
        {/* Modal for Next Task */}
        <Modal
          visible={visible}
          onDismiss={hideModal}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.successModal}>
              <LottieView
                source={require("../assets/animation/success.json")}
                style={styles.lottieAnimation}
                autoPlay
                loop
              />
              
              <Text style={styles.successTitle}>Challenge Completed!</Text>
              <Text style={styles.successSubtitle}>Great job! Ready for your next task?</Text>
              
              <TouchableOpacity 
                style={styles.successButton}
                onPress={handleCompletion}
              >
                <LinearGradient
                  colors={['#4A80F0', '#1A53B0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.buttonText}>Continue to Next Task</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        
        {/* Modal for Challenge Completion */}
        <Modal
          visible={visible2}
          onDismiss={hideModal2}
          transparent={true}
          animationType="fade"
        >
          <View style={styles.modalOverlay}>
            <View style={styles.successModal}>
              <LottieView
                source={require("../assets/animation/success.json")}
                style={styles.lottieAnimation}
                autoPlay
                loop
              />
              
              <Text style={styles.successTitle}>Congratulations!</Text>
              <Text style={styles.successSubtitle}>You've completed all the challenges</Text>
              
              <TouchableOpacity 
                style={styles.successButton}
                onPress={() => navigation.dispatch(StackActions.popToTop())}
              >
                <LinearGradient
                  colors={['#4A80F0', '#1A53B0']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.gradientButton}
                >
                  <Text style={styles.buttonText}>Return Home</Text>
                  <Ionicons name="home" size={20} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </Portal>

      <SafeAreaView style={styles.container}>
        <StatusBar style="light" />
        
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Text style={styles.headerTitle}>Take a Photo</Text>
          
          <View style={styles.placeholder}></View>
        </View>

        {/* Camera View */}
        <Animated.View 
          style={[
            styles.cameraContainer, 
            { 
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }] 
            }
          ]}
        >
          {!permission.granted ? (
            <View style={styles.permissionContainer}>
              <Ionicons name="camera-outline" size={80} color="white" />
              <Text style={styles.permissionText}>
                We need camera access to take photos
              </Text>
              <TouchableOpacity 
                style={styles.permissionButton}
                onPress={requestPermission}
              >
                <Text style={styles.permissionButtonText}>Grant Permission</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              {capturedPhoto ? (
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: capturedPhoto.uri }}
                    style={[
                      styles.preview,
                      {transform: [{ scaleX: facing == "front" ? -1 : 1 }]}
                    ]}
                  />
                  
                  {/* Overlay with buttons */}
                  <BlurView style={styles.previewOverlay} intensity={30} tint="dark">
                    <TouchableOpacity 
                      style={styles.previewButton}
                      onPress={() => setCapturedPhoto(null)}
                    >
                      <Ionicons name="close-circle" size={62} color="rgba(255,255,255,0.9)" />
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.previewButton}
                      onPress={submitSave}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <ActivityIndicator size="large" color="white" />
                      ) : (
                        <Ionicons name="checkmark-circle" size={75} color="rgba(255,255,255,0.9)" />
                      )}
                    </TouchableOpacity>
                  </BlurView>
                </View>
              ) : (
                <>
                  <CameraView
                    style={styles.camera}
                    facing={facing}
                    ref={cameraRef}
                    flashMode={flashMode}
                  />
                  
                  {/* Camera UI Overlay */}
                  <View style={styles.cameraControls}>
                    {/* Top controls */}
                    <View style={styles.topControls}>
                      {/* <TouchableOpacity 
                        style={styles.controlButton}
                        onPress={toggleFlash}
                      >
                        <Ionicons 
                          name={flashMode == "on" ? "flash" : "flash-off"} 
                          size={24} 
                          color="white" 
                        />
                      </TouchableOpacity> */}
                      
                      {showGuide && (
                        <Animated.View 
                          style={[
                            styles.guideContainer,
                            {opacity: fadeAnim}
                          ]}
                        >
                          <Text style={styles.guideText}>
                            Position yourself in the frame and tap the button to capture
                          </Text>
                        </Animated.View>
                      )}
                    </View>
                    
                    {/* Bottom controls */}
                    <View style={styles.bottomControls}>
                      <View style={styles.bottomControlsInner}>
                        <View style={styles.spacer} />
                        
                        <Animated.View 
                          style={{
                            transform: [{scale: pulseAnim}]
                          }}
                        >
                          <TouchableOpacity 
                            style={styles.captureButton}
                            onPress={takePicture}
                          >
                            <View style={styles.captureButtonInner} />
                          </TouchableOpacity>
                        </Animated.View>
                        
                        <TouchableOpacity 
                          style={styles.flipButton}
                          onPress={toggleCameraType}
                        >
                          <Ionicons name="camera-reverse" size={30} color="white" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                </>
              )}
            </>
          )}
        </Animated.View>
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: hp(2.5),
    fontFamily: 'raleway-bold',
  },
  placeholder: {
    width: 40,
  },
  cameraContainer: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
    borderRadius: 20,
    margin: 10,
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'space-between',
  },
  topControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    alignItems: 'center',
  },
  controlButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 8,
    padding: 10,
    marginLeft: 10,
    maxWidth: '80%',
  },
  guideText: {
    color: 'white',
    fontSize: hp(1.8),
    fontFamily: 'raleway',
    textAlign: 'center',
  },
  bottomControls: {
    padding: 20,
  },
  bottomControlsInner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  spacer: {
    width: 50,
  },
  captureButton: {
    width: hp(9),
    height: hp(9),
    borderRadius: hp(4.5),
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'white',
  },
  captureButtonInner: {
    width: hp(7),
    height: hp(7),
    borderRadius: hp(3.5),
    backgroundColor: 'white',
  },
  flipButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewContainer: {
    flex: 1,
    position: 'relative',
  },
  preview: {
    flex: 1,
    borderRadius: 20,
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 120,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  previewButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  permissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#333',
    borderRadius: 20,
    padding: 20,
  },
  permissionText: {
    color: 'white',
    fontSize: hp(2),
    fontFamily: 'raleway-medium',
    textAlign: 'center',
    marginVertical: 20,
  },
  permissionButton: {
    backgroundColor: '#4A80F0',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 10,
    marginTop: 20,
  },
  permissionButtonText: {
    color: 'white',
    fontSize: hp(2),
    fontFamily: 'raleway-bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  successModal: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    width: '85%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  lottieAnimation: {
    width: 150,
    height: 150,
  },
  successTitle: {
    fontSize: hp(3),
    fontFamily: 'raleway-bold',
    color: '#4A80F0',
    marginTop: 10,
  },
  successSubtitle: {
    fontSize: hp(2),
    fontFamily: 'raleway',
    color: '#666',
    textAlign: 'center',
    marginTop: 10,
    marginBottom: 20,
  },
  successButton: {
    width: '100%',
    marginTop: 10,
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: hp(2),
    fontFamily: 'raleway-bold',
    marginRight: 8,
  },
});