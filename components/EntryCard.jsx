// EntryCard.js
import { useIsFocused, useNavigation } from "@react-navigation/native";
import React, { useEffect, useState, useRef } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  SafeAreaView,
  StatusBar,
  Animated,
  Platform,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from "lottie-react-native";
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import TopBar from "./AppComponents/TopBar";

const EntryCard = ({ route }) => {
  const {
    userTaskId,
    tasks,
    maxSteps,
    userSId,
    challenge,
    duration,
    direction,
    navRoute,
  } = route.params;

  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const isFocused = useIsFocused();
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const buttonAnim = useRef(new Animated.Value(100)).current;
  
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
      } finally {
        setIsReady(true);
      }
    };

    fetchUser();
  }, [navigation]);
  
  useEffect(() => {
    if (isReady) {
      // Start animations when content is ready
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 700,
          useNativeDriver: true,
        }),
        Animated.timing(buttonAnim, {
          toValue: 0,
          duration: 800,
          delay: 300,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isReady, fadeAnim, slideAnim, buttonAnim]);

  const handleCompletion = () => {
    setLoading(true);
    // Add a slight delay for loading animation visibility
    setTimeout(() => {
      navigation.replace(navRoute, {
        userSId: userSId,
        challenge: challenge,
        tasks: tasks,
        maxSteps: maxSteps,
        direction: direction,
        userTaskId: userTaskId,
        duration: duration,
      });
    }, 600);
  };
  
  // Determine task type icons
  const getTaskTypeIcon = () => {
    const taskType = tasks?.task_type?.toLowerCase() || '';
    
    if (taskType.includes('map')) {
      return <Ionicons name="location" size={20} color="#6366f1" />;
    } else if (taskType.includes('step')) {
      return <MaterialCommunityIcons name="foot-print" size={20} color="#6366f1" />;
    } else if (taskType.includes('media') || taskType.includes('photo')) {
      return <Ionicons name="camera" size={20} color="#6366f1" />;
    } else if (taskType.includes('video')) {
      return <Ionicons name="videocam" size={20} color="#6366f1" />;
    } else {
      return <Ionicons name="checkmark-circle" size={20} color="#6366f1" />;
    }
  };
  
  // Find any requirements in the description
  const parseRequirements = () => {
    const description = tasks?.description || '';
    const requirements = [];
    
    // Look for patterns that might indicate requirements
    const lines = description.split(/\n|\.|;/).filter(line => line.trim()?.length > 10);
    
    // Choose the first 3 significant lines as "requirements"
    return lines.slice(0, 3);
  };

  if (!isReady) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6366f1" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      
      <View style={styles.topBarContainer}>
        <TopBar user={user} />
      </View>
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={22} color="#111827" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>Next Task</Text>
        </View>
        
        <View style={styles.backButton} />
      </View>
      
      <Animated.View 
        style={[
          styles.taskCardContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <LinearGradient
          colors={['#f9fafb', '#f3f4f6']}
          style={styles.taskCard}
        >
          <View style={styles.taskMetaRow}>
            <View style={styles.taskTypeChip}>
              {getTaskTypeIcon()}
              <Text style={styles.taskTypeText}>
                {tasks?.task_type?.charAt(0).toUpperCase() + tasks?.task_type?.slice(1) || 'Task'}
              </Text>
            </View>
            
            {duration > 0 && (
              <View style={styles.durationChip}>
                <Ionicons name="time-outline" size={16} color="#4b5563" />
                <Text style={styles.durationText}>{duration}s</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.taskTitle}>{tasks.task_name}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.rewardsContainer}>
            <View style={styles.rewardItem}>
              <View style={styles.rewardIconContainer}>
                <Ionicons name="star" size={18} color="#f59e0b" />
              </View>
              <View>
                <Text style={styles.rewardValue}>{tasks.reward_points || 0}</Text>
                <Text style={styles.rewardLabel}>Points</Text>
              </View>
            </View>
            
            {tasks.is_badge == "yes" && (
              <View style={styles.rewardItem}>
                <View style={styles.rewardIconContainer}>
                  <Ionicons name="ribbon" size={18} color="#ec4899" />
                </View>
                <View>
                  <Text style={styles.rewardValue}>Badge</Text>
                  <Text style={styles.rewardLabel}>Reward</Text>
                </View>
              </View>
            )}
            
            {maxSteps > 0 && (
              <View style={styles.rewardItem}>
                <View style={styles.rewardIconContainer}>
                  <MaterialCommunityIcons name="foot-print" size={18} color="#6366f1" />
                </View>
                <View>
                  <Text style={styles.rewardValue}>{maxSteps}</Text>
                  <Text style={styles.rewardLabel}>Steps</Text>
                </View>
              </View>
            )}
          </View>
        </LinearGradient>
      </Animated.View>
      
      <Animated.View 
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ translateY: slideAnim }]
          }
        ]}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.descriptionText}>{tasks.description}</Text>
          </View>
          
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Requirements</Text>
            
            {parseRequirements().map((requirement, index) => (
              <View key={index} style={styles.requirementItem}>
                <View style={styles.requirementBullet}>
                  <Ionicons name="checkmark" size={14} color="#ffffff" />
                </View>
                <Text style={styles.requirementText}>{requirement.trim()}</Text>
              </View>
            ))}
          </View>
          
          <View style={styles.disclaimerContainer}>
            <Text style={styles.disclaimerTitle}>Disclaimer</Text>
            <Text style={styles.disclaimerText}>
              By proceeding, you agree to the terms and conditions for this challenge. 
              Your progress will be tracked and may be shared with other participants.
            </Text>
          </View>
          
          <View style={styles.spacer} />
        </ScrollView>
      </Animated.View>
      
      <Animated.View
        style={[
          styles.bottomContainer,
          {
            transform: [{ translateY: buttonAnim }]
          }
        ]}
      >
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleCompletion}
          disabled={loading}
          activeOpacity={0.8}
        >
          {loading ? (
            <ActivityIndicator size="small" color="#ffffff" />
          ) : (
            <>
              <Text style={styles.nextButtonText}>CONTINUE TO TASK</Text>
              <Ionicons name="arrow-forward" size={20} color="#ffffff" />
            </>
          )}
        </TouchableOpacity>
      </Animated.View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
  },
  // topBarContainer: {
  //   paddingHorizontal: wp(4),
  //   paddingTop: Platform.OS == 'android' ? StatusBar.currentHeight : 0,
  // },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    marginVertical: hp(1),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: hp(2.4),
    fontFamily: 'raleway-bold',
    color: '#111827',
  },
  taskCardContainer: {
    paddingHorizontal: wp(4),
    marginBottom: hp(2),
  },
  taskCard: {
    borderRadius: 16,
    padding: hp(2),
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3.84,
    elevation: 3,
  },
  taskMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(1),
  },
  taskTypeChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    paddingVertical: hp(0.6),
    paddingHorizontal: wp(2),
    borderRadius: 16,
  },
  taskTypeText: {
    color: '#6366f1',
    fontFamily: 'raleway-bold',
    fontSize: hp(1.6),
    marginLeft: wp(1),
  },
  durationChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    paddingVertical: hp(0.6),
    paddingHorizontal: wp(2),
    borderRadius: 16,
  },
  durationText: {
    color: '#4b5563',
    fontFamily: 'raleway',
    fontSize: hp(1.6),
    marginLeft: wp(1),
  },
  taskTitle: {
    fontSize: hp(2.6),
    fontFamily: 'raleway-bold',
    color: '#111827',
    marginVertical: hp(1),
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: hp(1.5),
  },
  rewardsContainer: {
    flexDirection: 'row',
    marginTop: hp(1),
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(6),
  },
  rewardIconContainer: {
    width: wp(8),
    height: wp(8),
    borderRadius: wp(4),
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
  },
  rewardValue: {
    fontSize: hp(1.8),
    fontFamily: 'raleway-bold',
    color: '#111827',
  },
  rewardLabel: {
    fontSize: hp(1.4),
    fontFamily: 'raleway',
    color: '#6b7280',
  },
  contentContainer: {
    flex: 1,
    paddingHorizontal: wp(4),
  },
  scrollContent: {
    paddingBottom: hp(10),
  },
  sectionContainer: {
    marginBottom: hp(3),
  },
  sectionTitle: {
    fontSize: hp(2),
    fontFamily: 'raleway-bold',
    color: '#111827',
    marginBottom: hp(1.5),
  },
  descriptionText: {
    fontSize: hp(1.8),
    lineHeight: hp(2.6),
    fontFamily: 'raleway',
    color: '#4b5563',
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: hp(1.5),
  },
  requirementBullet: {
    width: wp(5),
    height: wp(5),
    borderRadius: wp(2.5),
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
    marginTop: hp(0.3),
  },
  requirementText: {
    fontSize: hp(1.7),
    fontFamily: 'raleway',
    color: '#4b5563',
    flex: 1,
  },
  disclaimerContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
    padding: hp(2),
    marginTop: hp(1),
  },
  disclaimerTitle: {
    fontSize: hp(1.7),
    fontFamily: 'raleway-bold',
    color: '#4b5563',
    marginBottom: hp(0.5),
  },
  disclaimerText: {
    fontSize: hp(1.6),
    lineHeight: hp(2.2),
    fontFamily: 'raleway',
    color: '#6b7280',
  },
  spacer: {
    height: hp(6),
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    paddingVertical: hp(2),
    paddingHorizontal: wp(4),
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  nextButton: {
    backgroundColor: '#6366f1',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    borderRadius: 10,
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 6,
  },
  nextButtonText: {
    fontSize: hp(2),
    fontFamily: 'raleway-bold',
    color: '#ffffff',
    marginRight: wp(2),
  },
});

export default EntryCard;