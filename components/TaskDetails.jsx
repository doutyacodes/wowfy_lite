// TaskDetails.js
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  Image,
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
import axios from "axios";
import { LinearGradient } from 'expo-linear-gradient';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL, baseURL } from "../backend/baseData";
import TopBar from "./AppComponents/TopBar";
import { useQuery } from '@tanstack/react-query';

const TaskDetails = ({ route }) => {
  const navigation = useNavigation();
  const { challenge } = route.params;
  const [user, setUser] = useState(null);
  const [acceptLoading, setAcceptLoading] = useState(false);
  
  const fadeAnim = useState(new Animated.Value(0))[0];
  const slideAnim = useState(new Animated.Value(50))[0];
  
  // Fetch user data from AsyncStorage
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
  }, [navigation]);

  // TanStack Query hook for fetching task details
  const { data: tasks, isLoading, error } = useQuery({
    queryKey: ['taskDetails', challenge.challenge_id, challenge.task_id, user?.id],
    queryFn: async () => {
      const response = await axios.get(
        `${baseURL}/getOneTasks.php?challenge_id=${challenge.challenge_id}&task_id=${challenge.task_id}${user?.id ? `&user_id=${user.id}` : ''}`
      );
      return response.data;
    },
    enabled: !!challenge.challenge_id && !!challenge.task_id, // Only run query when we have both IDs
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  // Animation effect when data is loaded
  useEffect(() => {
    if (!isLoading && tasks) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true
        })
      ]).start();
    }
  }, [isLoading, tasks, fadeAnim, slideAnim]);

  const handleAccept = () => {
    setAcceptLoading(true);
    // Simulate loading for smoother UX
    setTimeout(() => {
      setAcceptLoading(false);
      navigation.navigate("VideoScreen", {
        pageId: challenge.id,
        challenge: challenge,
        tasks: tasks,
        userSId: user?.id,
      });
    }, 500);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" />
      <View style={styles.topBarContainer}>
        <TopBar user={user} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading task details...</Text>
        </View>
      ) : error ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.errorText}>Error loading task details. Please try again.</Text>
          <TouchableOpacity 
            style={styles.retryButton}
            onPress={() => queryClient.invalidateQueries(['taskDetails', challenge.challenge_id, challenge.task_id, user?.id])}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={styles.headerContainer}>
            <LinearGradient
              colors={['#f9fafb', '#f3f4f6']}
              style={styles.headerGradient}
            >
              <View style={styles.taskInfoContainer}>
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: `${baseImgURL + tasks?.image}` }}
                    style={styles.taskImage}
                  />
                </View>
                
                <View style={styles.taskTitleContainer}>
                  <Text style={styles.challengeTitle} numberOfLines={1}>
                    {tasks?.challenge_title}
                  </Text>
                  <Text style={styles.taskName} numberOfLines={2}>{tasks?.task_name}</Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.menuButton}
                  onPress={() => navigation.goBack()}
                >
                  <Ionicons name="chevron-back" size={24} color="#6366f1" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.taskMetaContainer}>
                <View style={styles.metaItem}>
                  <Ionicons name="time-outline" size={18} color="#6366f1" />
                  <Text style={styles.metaText}>
                    {tasks?.reward_points} Points
                  </Text>
                </View>
                
                <View style={styles.metaItem}>
                  <Ionicons name="trophy-outline" size={18} color="#6366f1" />
                  <Text style={styles.metaText}>
                    Level {tasks?.player_level || "1"}
                  </Text>
                </View>
                
                {/* Display completion status if available */}
                {tasks?.completed !== undefined && (
                  <View style={[styles.metaItem, styles.completionStatusContainer]}>
                    <Ionicons 
                      name={tasks.completed ? "checkmark-circle" : "time-outline"} 
                      size={18} 
                      color={tasks.completed ? "#10b981" : "#f59e0b"} 
                    />
                    <Text style={[styles.metaText, { 
                      color: tasks.completed ? "#10b981" : "#f59e0b" 
                    }]}>
                      {tasks.completed ? "Completed" : "Pending"}
                    </Text>
                  </View>
                )}
              </View>
            </LinearGradient>
          </View>
          
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
              <View style={styles.card}>
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Task Description</Text>
                  <Text style={styles.sectionContent}>{tasks?.description}</Text>
                </View>
                
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Requirements</Text>
                  <View style={styles.requirementItem}>
                    <View style={styles.requirementBullet}>
                      <Ionicons name="checkmark" size={14} color="#ffffff" />
                    </View>
                    <Text style={styles.requirementText}>
                      Complete the task as instructed
                    </Text>
                  </View>
                  
                  <View style={styles.requirementItem}>
                    <View style={styles.requirementBullet}>
                      <Ionicons name="checkmark" size={14} color="#ffffff" />
                    </View>
                    <Text style={styles.requirementText}>
                      Submit verification if requested
                    </Text>
                  </View>
                  
                  <View style={styles.requirementItem}>
                    <View style={styles.requirementBullet}>
                      <Ionicons name="checkmark" size={14} color="#ffffff" />
                    </View>
                    <Text style={styles.requirementText}>
                      Wait for approval from moderators
                    </Text>
                  </View>
                </View>
                
                <View style={styles.sectionContainer}>
                  <Text style={styles.sectionTitle}>Rewards</Text>
                  <View style={styles.rewardsContainer}>
                    <View style={styles.rewardItem}>
                      <View style={styles.rewardIconContainer}>
                        <Ionicons name="star" size={22} color="#fbbf24" />
                      </View>
                      <View style={styles.rewardInfo}>
                        <Text style={styles.rewardValue}>{tasks?.reward_points}</Text>
                        <Text style={styles.rewardLabel}>Points</Text>
                      </View>
                    </View>
                    
                    {tasks?.is_badge == "yes" && (
                      <View style={styles.rewardItem}>
                        <View style={styles.rewardIconContainer}>
                          <Ionicons name="ribbon" size={22} color="#ec4899" />
                        </View>
                        <View style={styles.rewardInfo}>
                          <Text style={styles.rewardValue}>Badge</Text>
                          <Text style={styles.rewardLabel}>Achievement</Text>
                        </View>
                      </View>
                    )}
                    
                    {tasks?.is_certificate == "yes" && (
                      <View style={styles.rewardItem}>
                        <View style={styles.rewardIconContainer}>
                          <MaterialIcons name="workspace-premium" size={22} color="#6366f1" />
                        </View>
                        <View style={styles.rewardInfo}>
                          <Text style={styles.rewardValue}>Certificate</Text>
                          <Text style={styles.rewardLabel}>Completion</Text>
                        </View>
                      </View>
                    )}
                  </View>
                </View>
                
                <View style={styles.disclaimerContainer}>
                  <Text style={styles.disclaimerTitle}>Disclaimer</Text>
                  <Text style={styles.disclaimerText}>
                    By accepting this task, you agree to follow all instructions and guidelines.
                    Your submission may be reviewed by moderators before approval.
                  </Text>
                </View>
              </View>
            </ScrollView>
          </Animated.View>
          
          <View style={styles.bottomContainer}>
            {tasks?.completed ? (
              <View style={styles.completedButton}>
                <Ionicons name="checkmark-circle" size={22} color="#ffffff" />
                <Text style={styles.completedButtonText}>TASK COMPLETED</Text>
              </View>
            ) : (
              <TouchableOpacity
                onPress={handleAccept}
                disabled={acceptLoading}
                style={styles.acceptButton}
                activeOpacity={0.7}
              >
                {acceptLoading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Text style={styles.acceptButtonText}>ACCEPT TASK</Text>
                    <Ionicons name="arrow-forward" size={20} color="#ffffff" />
                  </>
                )}
              </TouchableOpacity>
            )}
          </View>
        </>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: hp(2),
    fontSize: hp(1.8),
    fontFamily: 'raleway',
    color: '#6b7280',
  },
  errorText: {
    fontSize: hp(1.8),
    fontFamily: 'raleway',
    color: '#ef4444',
    textAlign: 'center',
    marginHorizontal: wp(10),
  },
  retryButton: {
    marginTop: hp(2),
    paddingVertical: hp(1),
    paddingHorizontal: wp(5),
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: hp(1.8),
    fontFamily: 'raleway-bold',
    color: '#ffffff',
  },
  headerContainer: {
    marginTop: hp(1),
    paddingHorizontal: wp(4),
  },
  headerGradient: {
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
  taskInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(3),
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskImage: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(2),
  },
  taskTitleContainer: {
    flex: 1,
    marginLeft: wp(3),
  },
  challengeTitle: {
    fontSize: hp(1.7),
    fontFamily: 'raleway',
    color: '#6b7280',
  },
  taskName: {
    fontSize: hp(2.2),
    fontFamily: 'raleway-bold',
    color: '#111827',
    marginTop: hp(0.5),
  },
  menuButton: {
    width: wp(10),
    height: wp(10),
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: wp(5),
    backgroundColor: '#ffffff',
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  taskMetaContainer: {
    flexDirection: 'row',
    marginTop: hp(2),
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: wp(5),
  },
  completionStatusContainer: {
    backgroundColor: '#f8fafc',
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  metaText: {
    marginLeft: wp(1),
    fontSize: hp(1.6),
    fontFamily: 'raleway-bold',
    color: '#4b5563',
  },
  contentContainer: {
    flex: 1,
    marginTop: hp(1),
    paddingHorizontal: wp(4),
  },
  scrollContent: {
    paddingBottom: hp(10),
  },
  card: {
    backgroundColor: '#ffffff',
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
  sectionContainer: {
    marginBottom: hp(3),
  },
  sectionTitle: {
    fontSize: hp(2),
    fontFamily: 'raleway-bold',
    color: '#111827',
    marginBottom: hp(1.5),
  },
  sectionContent: {
    fontSize: hp(1.8),
    lineHeight: hp(2.6),
    fontFamily: 'raleway',
    color: '#4b5563',
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
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
  },
  requirementText: {
    fontSize: hp(1.7),
    fontFamily: 'raleway',
    color: '#4b5563',
    flex: 1,
  },
  rewardsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: hp(1),
  },
  rewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: hp(2),
  },
  rewardIconContainer: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: wp(2),
  },
  rewardInfo: {
    flex: 1,
  },
  rewardValue: {
    fontSize: hp(1.8),
    fontFamily: 'raleway-bold',
    color: '#111827',
  },
  rewardLabel: {
    fontSize: hp(1.5),
    fontFamily: 'raleway',
    color: '#6b7280',
  },
  disclaimerContainer: {
    backgroundColor: '#f1f5f9',
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
  acceptButton: {
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
  acceptButtonText: {
    fontSize: hp(2),
    fontFamily: 'raleway-bold',
    color: '#ffffff',
    marginRight: wp(2),
  },
  completedButton: {
    backgroundColor: '#10b981',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(1.5),
    borderRadius: 10,
    shadowColor: '#10b981',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 6,
  },
  completedButtonText: {
    fontSize: hp(2),
    fontFamily: 'raleway-bold',
    color: '#ffffff',
    marginLeft: wp(2),
  },
});

export default TaskDetails;