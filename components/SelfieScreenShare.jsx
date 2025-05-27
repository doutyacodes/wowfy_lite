import { MaterialIcons, Ionicons } from "@expo/vector-icons";
import {
  StackActions,
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import axios from "axios";
import { CameraView, useCameraPermissions } from "expo-camera";
import { StatusBar } from "expo-status-bar";
import { useRef, useState, useEffect } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  TextInput,
  Animated,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseURL } from "../backend/baseData";

export default function SelfieScreenShare({ route }) {
  const [facing, setFacing] = useState("front");
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);
  const [caption, setCaption] = useState("");
  const [capturedPhoto, setCapturedPhoto] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [flashMode, setFlashMode] = useState("off");
  const [showGuide, setShowGuide] = useState(true);
  const [keyboardVisible, setKeyboardVisible] = useState(false);

  const navigation = useNavigation();
  const isFocused = useIsFocused();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  // Start pulse animation for capture button
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Listen for keyboard events
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    );
    
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
        Animated.timing(slideAnim, {
          toValue: 30,
          duration: 300,
          useNativeDriver: true,
        }).start();
      }
    );
    
    return () => {
      keyboardDidHideListener.remove();
      keyboardDidShowListener.remove();
    };
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

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }
  
  const {
    userTaskId,
    tasks,
    userSId,
    challenge,
    navRoute,
    userSIds,
    maxSteps,
    direction,
    duration,
    next,
  } = route.params || {};

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
    
    if (caption.trim()?.length <= 0) {
      Alert.alert("Missing Caption", "Please add a caption to your photo before submitting.");
      return;
    }
    
    try {
      setIsLoading(true);
      const formData = new FormData();

      // Append captured image
      formData.append("imageFile", {
        uri: capturedPhoto.uri,
        type: "image/jpeg",
        name: `selfie_${Date.now()}.jpg`,
      });

      // Append other parameters from route.params
      formData.append("caption", caption);
      formData.append("user_id", userSId);
      formData.append("challenge_id", challenge.challenge_id);
      formData.append("task_id", tasks.task_id);
      formData.append("next", next);

      // Make an Axios request to your PHP backend API
      const response = await axios.post(
        `${baseURL}/add-people-media.php`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      
      if (response.status == 200) {
        setCapturedPhoto(null);
        if (next && next == "yes") {
          navigation.replace("EntryCard", {
            navRoute: navRoute,
            userSId: userSId,
            challenge: challenge,
            tasks: tasks,
            maxSteps: maxSteps,
            direction: direction,
            userTaskId: userTaskId,
            duration: duration,
          });
        } else {
          navigation.dispatch(StackActions.popToTop());
        }
      }
    } catch (error) {
      console.error("Error submitting data:", error);
      Alert.alert(
        "Upload Failed", 
        "There was a problem uploading your photo. Please try again."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
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
        
        <Text style={styles.headerTitle}>Share Your Moment</Text>
        
        <View style={styles.placeholder}></View>
      </View>
      
      <KeyboardAvoidingView 
        behavior={Platform.OS == "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        {/* Main Content */}
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
                  
                  {/* Caption input */}
                  <Animated.View 
                    style={[
                      styles.captionContainer,
                      {
                        transform: [{ translateY: slideAnim }]
                      }
                    ]}
                  >
                    <BlurView intensity={40} tint="dark" style={styles.captionBlur}>
                      <TextInput
                        style={styles.captionInput}
                        placeholder="Write a caption..."
                        placeholderTextColor="rgba(255,255,255,0.7)"
                        value={caption}
                        onChangeText={setCaption}
                        multiline
                        maxLength={150}
                      />
                      
                      <Text style={styles.captionCounter}>
                        {caption?.length}/150
                      </Text>
                    </BlurView>
                  </Animated.View>
                  
                  {/* Bottom action buttons */}
                  {!keyboardVisible && (
                    <View style={styles.previewActions}>
                      <TouchableOpacity 
                        style={styles.previewActionButton}
                        onPress={() => setCapturedPhoto(null)}
                      >
                        <LinearGradient
                          colors={['#FF4B2B', '#FF416C']}
                          style={styles.actionButtonGradient}
                        >
                          <Ionicons name="close" size={24} color="white" />
                        </LinearGradient>
                        <Text style={styles.actionButtonText}>Retake</Text>
                      </TouchableOpacity>
                      
                      <TouchableOpacity 
                        style={[
                          styles.previewActionButton,
                          isLoading && styles.disabledButton
                        ]}
                        onPress={submitSave}
                        disabled={isLoading || caption.trim()?.length == 0}
                      >
                        <LinearGradient
                          colors={['#4A80F0', '#1A53B0']}
                          style={styles.actionButtonGradient}
                        >
                          {isLoading ? (
                            <ActivityIndicator color="white" size="small" />
                          ) : (
                            <Ionicons name="arrow-up" size={24} color="white" />
                          )}
                        </LinearGradient>
                        <Text style={styles.actionButtonText}>
                          {isLoading ? "Uploading..." : "Share"}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              ) : (
                <>
                  {isFocused && (
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
                                Take a photo to share with your friends
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
            </>
          )}
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  keyboardAvoidingView: {
    flex: 1,
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
  captionContainer: {
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
    borderRadius: 16,
    overflow: 'hidden',
  },
  captionBlur: {
    padding: 15,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  captionInput: {
    flex: 1,
    color: 'white',
    fontSize: hp(2),
    fontFamily: 'raleway-medium',
    minHeight: 40,
    maxHeight: 80,
  },
  captionCounter: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: hp(1.6),
    marginLeft: 10,
    marginTop: 2,
  },
  previewActions: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  previewActionButton: {
    alignItems: 'center',
  },
  actionButtonGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  actionButtonText: {
    color: 'white',
    fontSize: hp(1.8),
    fontFamily: 'raleway-medium',
  },
  disabledButton: {
    opacity: 0.5,
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
});