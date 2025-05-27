import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { ResizeMode, Video } from "expo-av";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import React, { useEffect, useRef, useState } from "react";
import { 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  StatusBar,
  ActivityIndicator,
  SafeAreaView,
  Animated,
  Platform
} from "react-native";
import { 
  heightPercentageToDP as hp,
  widthPercentageToDP as wp 
} from "react-native-responsive-screen";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { baseURL } from "../backend/baseData";

const VideoScreen = ({ route }) => {
  const { tasks, pageId, challenge, userSId } = route.params;
  const [isLoading, setIsLoading] = useState(false);
  const [videoLoading, setVideoLoading] = useState(true);
  const [taskData, setTaskData] = useState({
    task_id: tasks.task_id,
    user_id: "",
    entry_points: tasks.entry_points,
  });
  
  const videoRef = useRef(null);
  const [playbackStatus, setPlaybackStatus] = useState({});
  const [isPaused, setIsPaused] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const navigation = useNavigation();
  
  // Determine the next screen route based on task type
  let navRoute;
  if (tasks.task_type == "map") {
    navRoute = "MapScreen";
  } else if (tasks.task_type == "stepCounter") {
    navRoute = "AcceleroMeterScreen";
  } else if (tasks.task_type == "mediaCapture") {
    navRoute = "SelfieScreen";
  } else if (tasks.task_type == "videoCapture") {
    navRoute = "VideoTesting";
  } else {
    navRoute = "";
  }

  useEffect(() => {
    const fetchUserId = async () => {
      try {
        const user = await AsyncStorage.getItem("user");
        if (user) {
          const userObject = JSON.parse(user);
          const userId = userObject.id;
          setTaskData(prevData => ({
            ...prevData,
            user_id: userId,
          }));
        }
      } catch (error) {
        console.error("Error fetching user ID from AsyncStorage:", error);
      }
    };

    fetchUserId();

    // Load video
    (async () => {
      try {
        await videoRef.current.loadAsync(
          {
            uri: "https://videos.pexels.com/video-files/26222953/11940395_1080_1920_30fps.mp4",
          },
          { shouldPlay: true }
        );
      } catch (error) {
        console.error("Error loading video:", error);
      }
    })();
  }, []);

  // Handle animation when video is loaded
  useEffect(() => {
    if (!videoLoading) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [videoLoading, fadeAnim, slideAnim]);

  const continueToNextScreen = async () => {
    try {
      setIsLoading(true);
      const response = await axios.post(
        `${baseURL}/createUserTasks.php`,
        taskData,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      
      const userTaskId = response.data.task.userTaskId;
      navigation.replace(navRoute, {
        taskData: taskData,
        tasks: tasks,
        pageId: pageId,
        challenge: {...challenge,...taskData},
        maxSteps: tasks.steps,
        userTaskId: userTaskId,
        userSId: userSId,
        direction: tasks.direction,
        Title: tasks.task_name,
        latitudes: tasks?.map_info?.latitude ? tasks?.map_info?.latitude : null,
        longitudes: tasks?.map_info?.longitude ? tasks?.map_info?.longitude : null,
        reach_distance: tasks?.map_info?.reach_distance ? tasks?.map_info?.reach_distance : null,
        duration: tasks?.duration ? tasks.duration : 0,
      });
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePlayPause = () => {
    if (playbackStatus.isPlaying) {
      videoRef.current.pauseAsync();
      setIsPaused(true);
    } else {
      videoRef.current.playAsync();
      setIsPaused(false);
    }
  };
  
  const handleVideoStatus = (status) => {
    setPlaybackStatus(status);
    if (status.isLoaded && videoLoading) {
      setVideoLoading(false);
    }
  };
  
  const handleBack = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" translucent />
      
      {/* Video */}
      <Video
        ref={videoRef}
        style={styles.video}
        resizeMode={ResizeMode.COVER}
        onPlaybackStatusUpdate={handleVideoStatus}
        isLooping={true}
      />
      
      {/* Loading Overlay */}
      {videoLoading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Loading introduction video...</Text>
        </View>
      )}
      
      {/* Content Overlay */}
      <Animated.View 
        style={[
          styles.overlay,
          { opacity: fadeAnim }
        ]}
      >
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={handleBack}
          >
            <BlurView intensity={80} tint="dark" style={styles.blurButton}>
              <Ionicons name="chevron-back" size={24} color="#ffffff" />
            </BlurView>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.playPauseButton}
            onPress={handlePlayPause}
          >
            <BlurView intensity={80} tint="dark" style={styles.blurButton}>
              <Ionicons 
                name={isPaused ? "play" : "pause"} 
                size={22} 
                color="#ffffff" 
              />
            </BlurView>
          </TouchableOpacity>
        </View>
        
        {/* Bottom Content */}
        <LinearGradient
          colors={['transparent', 'rgba(0,0,0,0.7)', 'rgba(0,0,0,0.9)']}
          style={styles.bottomGradient}
        >
          <Animated.View 
            style={[
              styles.contentContainer,
              { transform: [{ translateY: slideAnim }] }
            ]}
          >
            <Text style={styles.titleText}>{tasks.task_name}</Text>
            
            <View style={styles.infoContainer}>
              {tasks.task_type == "map" && (
                <View style={styles.infoItem}>
                  <Ionicons name="map-outline" size={18} color="#E5E7EB" />
                  <Text style={styles.infoText}>Location Task</Text>
                </View>
              )}
              
              {tasks.task_type == "stepCounter" && (
                <View style={styles.infoItem}>
                  <Ionicons name="footsteps-outline" size={18} color="#E5E7EB" />
                  <Text style={styles.infoText}>{tasks.steps || 'N/A'} Steps</Text>
                </View>
              )}
              
              {tasks.task_type == "mediaCapture" && (
                <View style={styles.infoItem}>
                  <Ionicons name="camera-outline" size={18} color="#E5E7EB" />
                  <Text style={styles.infoText}>Photo Capture</Text>
                </View>
              )}
              
              {tasks.task_type == "videoCapture" && (
                <View style={styles.infoItem}>
                  <Ionicons name="videocam-outline" size={18} color="#E5E7EB" />
                  <Text style={styles.infoText}>Video Capture</Text>
                </View>
              )}
              
              {tasks.duration > 0 && (
                <View style={styles.infoItem}>
                  <Ionicons name="timer-outline" size={18} color="#E5E7EB" />
                  <Text style={styles.infoText}>{tasks.duration}s Duration</Text>
                </View>
              )}
              
              <View style={styles.infoItem}>
                <Ionicons name="star-outline" size={18} color="#E5E7EB" />
                <Text style={styles.infoText}>{tasks.reward_points || 0} Points</Text>
              </View>
            </View>
            
            <Text style={styles.descriptionText}>
              Tap start when you're ready!
            </Text>
            
            <TouchableOpacity
              style={[
                styles.startButton,
                isLoading ? styles.startButtonDisabled : {}
              ]}
              disabled={isLoading || videoLoading}
              onPress={continueToNextScreen}
              activeOpacity={0.8}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <>
                  <Text style={styles.startButtonText}>START TASK</Text>
                  <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                </>
              )}
            </TouchableOpacity>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  video: {
    flex: 1,
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  loadingText: {
    color: "#ffffff",
    marginTop: hp(2),
    fontSize: hp(1.8),
    fontFamily: "raleway",
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: "space-between",
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: wp(5),
    paddingTop: Platform.OS == 'android' ? StatusBar.currentHeight + hp(2) : hp(2),
  },
  backButton: {
    alignSelf: 'flex-start',
  },
  playPauseButton: {
    alignSelf: 'flex-start',
  },
  blurButton: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  bottomGradient: {
    paddingHorizontal: wp(5),
    paddingBottom: Platform.OS == 'ios' ? hp(4) : hp(3),
    paddingTop: hp(10),
  },
  contentContainer: {
    width: '100%',
  },
  titleText: {
    fontSize: hp(3),
    fontFamily: 'raleway-bold',
    color: '#ffffff',
    marginBottom: hp(2),
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  infoContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: hp(2.5),
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(4),
    marginBottom: hp(1),
    backgroundColor: 'rgba(0,0,0,0.3)',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: 16,
  },
  infoText: {
    color: '#E5E7EB',
    fontFamily: 'raleway',
    fontSize: hp(1.6),
    marginLeft: wp(1),
  },
  descriptionText: {
    fontSize: hp(1.8),
    fontFamily: 'raleway',
    color: '#D1D5DB',
    marginBottom: hp(3),
    lineHeight: hp(2.4),
  },
  startButton: {
    backgroundColor: '#6366f1',
    borderRadius: 12,
    paddingVertical: hp(1.8),
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 8,
  },
  startButtonDisabled: {
    backgroundColor: '#6366f180',
  },
  startButtonText: {
    fontSize: hp(2),
    fontFamily: 'raleway-bold',
    color: '#ffffff',
    marginRight: wp(2),
  },
});

export default VideoScreen;