import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import axios from "axios";
import { CameraView, useCameraPermissions } from "expo-camera";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  Animated,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Keyboard,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseURL } from "../backend/baseData";

export default function CameraScreen({ route }) {
  const { user_id, challenge_id } = route.params;

  const [facing, setFacing] = useState("back");
  const [isLoading, setIsLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const [captureMode, setCaptureMode] = useState("photo");
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const cameraRef = useRef(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [caption, setCaption] = useState("");
  const [user, setUser] = useState(null);
  const captionInputRef = useRef(null);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const shutterAnim = useRef(new Animated.Value(1)).current;
  
  // Animate photo capture
  const animateShutter = () => {
    Animated.sequence([
      Animated.timing(shutterAnim, {
        toValue: 1.2,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(shutterAnim, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };
  
  // Start fade-in animation when component mounts
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
  }, []);

  // Listen for keyboard events
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      'keyboardDidShow',
      () => {
        setKeyboardVisible(true);
      }
    );
    const keyboardDidHideListener = Keyboard.addListener(
      'keyboardDidHide',
      () => {
        setKeyboardVisible(false);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);
  
  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    animateShutter();
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
        skipProcessing: false,
      });
      setPhotoUri(photo);
      
      // Focus on caption input after taking photo with a slight delay
      setTimeout(() => {
        if (captionInputRef.current) {
          captionInputRef.current.focus();
        }
      }, 500);
    } catch (error) {
      console.error("Error taking picture:", error);
      Alert.alert("Error", "Failed to take picture. Please try again.");
    }
  };
  
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

  if (!permission) {
    // Camera permissions are still loading
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4A80F0" />
      </View>
    );
  }

  function toggleCameraFacing() {
    setFacing((current) => (current == "back" ? "front" : "back"));
  }
  
  const submitImage = async () => {
    if (!photoUri) {
      Alert.alert("Missing Photo", "Please take a photo first.");
      return;
    }
    
    if (caption.trim()?.length == 0) {
      Alert.alert("Missing Caption", "Please add a caption to your photo.");
      captionInputRef.current?.focus();
      return;
    }
    
    try {
      setIsLoading(true);
      const formData = new FormData();

      // Append captured image
      formData.append("imageFile", {
        uri: photoUri.uri,
        type: "image/jpeg",
        name: `selfies_${Date.now()}.jpg`,
      });
      
      // Append other parameters
      formData.append("caption", caption);
      formData.append("user_id", user_id);
      formData.append("challenge_id", challenge_id);

      // Make API request
      const response = await axios.post(
        `${baseURL}/add-quiz-media.php`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        setPhotoUri(null);
        navigation.replace("InnerPage");
      } else {
        throw new Error("Upload failed");
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
  
  const renderPermissionScreen = () => (
    <SafeAreaView style={styles.permissionContainer}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['#4A80F0', '#1A53B0']}
        style={styles.permissionBackground}
      >
        <View style={styles.permissionContent}>
          <Ionicons name="camera-outline" size={80} color="white" />
          <Text style={styles.permissionTitle}>Camera Access Required</Text>
          <Text style={styles.permissionText}>
            We need access to your camera to take photos. Your photos will only be
            used for this challenge and won't be shared without your permission.
          </Text>
          
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={requestPermission}
          >
            <Text style={styles.permissionButtonText}>Grant Permission</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </SafeAreaView>
  );
  
  if (!permission.granted) {
    return renderPermissionScreen();
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      {/* Camera View or Preview */}
      <View style={styles.cameraContainer}>
        {isFocused && !photoUri ? (
          <>
            <CameraView
              ref={cameraRef}
              style={styles.camera}
              facing={facing}
            />
            
            {/* Camera UI Overlay */}
            <View style={styles.cameraOverlay}>
              {/* Top Controls */}
              <View style={styles.topControls}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="chevron-back" size={24} color="white" />
                </TouchableOpacity>
              </View>
              
              {/* Capture Guidelines */}
              <View style={styles.captureGuide}>
                <Text style={styles.captureGuideText}>
                  Take a photo to share your experience
                </Text>
              </View>
            </View>
          </>
        ) : (
          photoUri && (
            <View style={styles.previewContainer}>
              <Image
                source={{ uri: photoUri.uri }}
                style={[
                  styles.previewImage,
                  { transform: [{ scaleX: facing == "front" ? -1 : 1 }] }
                ]}
                resizeMode="cover"
              />
              
              <LinearGradient
                colors={['transparent', 'rgba(0,0,0,0.7)']}
                style={styles.previewGradient}
              />
            </View>
          )
        )}
      </View>
      
      {/* Caption Input (for photo preview) */}
      {photoUri && (
        <KeyboardAvoidingView
          behavior={Platform.OS == "ios" ? "padding" : null}
          style={styles.captionAvoidingView}
          keyboardVerticalOffset={Platform.OS == "ios" ? 90 : 0}
        >
          <View style={styles.captionContainer}>
            <TextInput
              ref={captionInputRef}
              style={styles.captionInput}
              placeholder="Write a caption..."
              placeholderTextColor="rgba(255,255,255,0.7)"
              value={caption}
              onChangeText={setCaption}
              multiline
              accessible={true}
              accessibilityLabel="Caption input. Write a description for your photo."
              accessibilityHint="Enter a caption for your photo"
            />
          </View>
        </KeyboardAvoidingView>
      )}
      
      {/* Bottom Controls */}
      <KeyboardAvoidingView
        behavior={Platform.OS == "ios" ? "padding" : "height"}
        style={[
          styles.bottomControlsContainer,
          keyboardVisible && styles.bottomControlsContainerKeyboard
        ]}
      >
        <LinearGradient
          colors={['rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
          style={styles.bottomGradient}
        >
          <View style={styles.bottomControls}>
            {!photoUri ? (
              <>
                <View style={styles.controlSpacer} />
                
                <Animated.View style={{ transform: [{ scale: shutterAnim }] }}>
                  <TouchableOpacity
                    style={styles.captureButton}
                    onPress={takePicture}
                    accessible={true}
                    accessibilityLabel="Take photo button"
                    accessibilityHint="Take a photo with the camera"
                  >
                    <View style={styles.captureButtonInner} />
                  </TouchableOpacity>
                </Animated.View>
                
                <TouchableOpacity
                  style={styles.flipButton}
                  onPress={toggleCameraFacing}
                  accessible={true}
                  accessibilityLabel="Flip camera button"
                  accessibilityHint="Switch between front and back camera"
                >
                  <Ionicons name="camera-reverse" size={30} color="white" />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => setPhotoUri(null)}
                  disabled={isLoading}
                  accessible={true}
                  accessibilityLabel="Retake photo button"
                  accessibilityHint="Discard current photo and take a new one"
                >
                  <Text style={styles.cancelButtonText}>Retake</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.submitButton}
                  onPress={submitImage}
                  disabled={isLoading}
                  accessible={true}
                  accessibilityLabel="Share photo button"
                  accessibilityHint="Submit photo with caption"
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <Text style={styles.submitButtonText}>Share</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </LinearGradient>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#000",
  },
  cameraContainer: {
    flex: 1,
    position: "relative",
  },
  camera: {
    flex: 1,
  },
  cameraOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 2,
  },
  topControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    paddingTop: Platform.OS == "ios" ? 0 : 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  captureGuide: {
    position: "absolute",
    bottom: 100,
    left: 0,
    right: 0,
    alignItems: "center",
  },
  captureGuideText: {
    color: "white",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    overflow: "hidden",
    fontSize: hp(1.8),
    fontFamily: "raleway",
  },
  bottomControlsContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 3,
  },
  bottomControlsContainerKeyboard: {
    bottom: Platform.OS == "ios" ? 260 : 0, // Adjust as needed for keyboard height
  },
  bottomGradient: {
    paddingTop: 20,
    paddingBottom: Platform.OS == "ios" ? 30 : 20,
  },
  bottomControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  controlSpacer: {
    width: 40,
  },
  captureButton: {
    width: hp(8),
    height: hp(8),
    borderRadius: hp(4),
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "white",
  },
  captureButtonInner: {
    width: hp(7),
    height: hp(7),
    borderRadius: hp(3.5),
    backgroundColor: "white",
  },
  flipButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  previewContainer: {
    flex: 1,
    position: "relative",
  },
  previewImage: {
    flex: 1,
    resizeMode: "cover",
  },
  previewGradient: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 150,
  },
  captionAvoidingView: {
    position: "absolute",
    bottom: 100,
    left: 0, 
    right: 0,
    zIndex: 4,
  },
  captionContainer: {
    marginHorizontal: 20,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.2)",
  },
  captionInput: {
    color: "white",
    fontSize: hp(2),
    fontFamily: "raleway-medium",
    minHeight: 40,
  },
  cancelButton: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  cancelButtonText: {
    color: "white",
    fontSize: hp(1.8),
    fontFamily: "raleway-bold",
  },
  submitButton: {
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 8,
    backgroundColor: "#4A80F0",
  },
  submitButtonText: {
    color: "white",
    fontSize: hp(1.8),
    fontFamily: "raleway-bold",
  },
  permissionContainer: {
    flex: 1,
    backgroundColor: "#4A80F0",
  },
  permissionBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  permissionContent: {
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
    maxWidth: 400,
  },
  permissionTitle: {
    fontSize: hp(3),
    fontFamily: "raleway-bold",
    color: "white",
    marginTop: 20,
    marginBottom: 10,
    textAlign: "center",
  },
  permissionText: {
    fontSize: hp(2),
    fontFamily: "raleway",
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    marginBottom: 30,
    lineHeight: hp(2.8),
  },
  permissionButton: {
    backgroundColor: "white",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 10,
  },
  permissionButtonText: {
    fontSize: hp(2),
    fontFamily: "raleway-bold",
    color: "#4A80F0",
  },
});