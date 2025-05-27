import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState, useRef } from "react";
import { 
  Image, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  SafeAreaView,
  Animated,
  ScrollView
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons, MaterialCommunityIcons, FontAwesome5 } from "@expo/vector-icons";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL, baseURL } from "../backend/baseData";

const LeaderboardItem = ({ rank, user, score, isCurrentUser, isTopThree }) => {
  const itemRef = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(itemRef, {
      toValue: 1,
      duration: 500,
      delay: rank * 150,
      useNativeDriver: true
    }).start();
  }, []);
  
  const getRankColor = () => {
    switch(rank) {
      case 1: return "#FFD700"; // Gold
      case 2: return "#C0C0C0"; // Silver
      case 3: return "#CD7F32"; // Bronze
      default: return "#4A80F0"; // Default blue
    }
  };
  
  const getRankIcon = () => {
    switch(rank) {
      case 1: return "trophy";
      case 2: return "medal";
      case 3: return "medal";
      default: return null;
    }
  };
  
  return (
    <Animated.View 
      style={[
        styles.leaderboardItem,
        isCurrentUser && styles.currentUserItem,
        isTopThree && styles.topThreeItem,
        { 
          opacity: itemRef,
          transform: [{ 
            translateY: itemRef.interpolate({
              inputRange: [0, 1],
              outputRange: [50, 0]
            })
          }]
        }
      ]}
    >
      <View style={styles.rankContainer}>
        {getRankIcon() ? (
          <View style={[styles.medalContainer, { backgroundColor: getRankColor() }]}>
            <MaterialCommunityIcons 
              name={getRankIcon()} 
              size={16} 
              color="white" 
            />
          </View>
        ) : (
          <Text style={styles.rankText}>#{rank}</Text>
        )}
      </View>
      
      <View style={styles.userContainer}>
        <View style={styles.avatarContainer}>
          {user.image ? (
            <Image
              source={{ uri: `${baseImgURL + user.image}` }}
              style={styles.avatar}
            />
          ) : (
            <LinearGradient
              colors={isCurrentUser ? ['#4A80F0', '#1A53B0'] : ['#FF9500', '#FF5E3A']}
              style={styles.avatarPlaceholder}
            >
              <Text style={styles.avatarText}>
                {user.first_character}
              </Text>
            </LinearGradient>
          )}
        </View>
        
        <Text style={[
          styles.nameText,
          isCurrentUser && styles.currentUserText
        ]}>
          {user.name}
        </Text>
      </View>
      
      <View style={styles.scoreContainer}>
        <Text style={[
          styles.scoreText,
          isCurrentUser && styles.currentUserText
        ]}>
          {score}
        </Text>
        <Text style={styles.pointsLabel}>pts</Text>
      </View>
    </Animated.View>
  );
};

const QuizLeaderScreen = ({ route }) => {
  const navigation = useNavigation();
  const [leaderBoard, setLeaderBoard] = useState({});
  const [currentIndex, setCurrentIndex] = useState(
    route.params.currentIndex ? route.params.currentIndex : 0
  );
  const [loading, setLoading] = useState(true);
  const { user_id, challenge_id } = route.params;
  
  const headerFadeAnim = useRef(new Animated.Value(0)).current;
  const scaleTitleAnim = useRef(new Animated.Value(0.9)).current;
  
  useEffect(() => {
    // Animate header elements
    Animated.parallel([
      Animated.timing(headerFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      }),
      Animated.timing(scaleTitleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true
      })
    ]).start();
    
    const fetchQuiz = async () => {
      if (user_id) {
        setLoading(true);
        try {
          const response = await axios.get(
            `${baseURL}/getQuizLeader.php?user_id=${user_id}&challenge_id=${challenge_id}`
          );

          if (response.status == 200) {
            setLeaderBoard(response.data);
          } else {
            console.error("Failed to fetch leadership data");
          }
        } catch (error) {
          console.error("Error while fetching leadership data:", error.message);
        } finally {
          setLoading(false);
        }
      }
    };

    fetchQuiz();
    
    // Auto-navigate if live quiz
    if (route.params.live == "yes") {
      const timer = setTimeout(() => {
        navigation.replace("QuizPageScreen", {
          currentIndex: route.params.currentIndex,
          dataQuiz: route.params.dataQuiz,
          user: route.params.user,
          live: route.params.live,
        });
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [user_id]);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="light" />
      
      <LinearGradient
        colors={['#4A80F0', '#1A53B0']}
        style={styles.background}
      >
        <Image
          source={require("../assets/images/doodle.jpg")}
          style={styles.backgroundPattern}
        />
        
        {/* Header */}
        <Animated.View style={[
          styles.header,
          { 
            opacity: headerFadeAnim,
            transform: [{ scale: scaleTitleAnim }]
          }
        ]}>
          <Animated.Text style={styles.headerTitle}>
            Leaderboard
          </Animated.Text>
          <View style={styles.headerDivider} />
          <Text style={styles.headerSubtitle}>
            {route.params.live == "yes" ? "Standings after this question" : "Final Results"}
          </Text>
        </Animated.View>
        
        {/* Main Content */}
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
          {/* Top 3 Section */}
          {(leaderBoard.first_place || leaderBoard.second_place || leaderBoard.third_place) && (
            <View style={styles.topThreeSection}>
              {leaderBoard.first_place && (
                <LeaderboardItem 
                  rank={1}
                  user={leaderBoard.first_place}
                  score={leaderBoard.first_place.marks}
                  isCurrentUser={leaderBoard.first_place.id == user_id}
                  isTopThree={true}
                />
              )}
              
              {leaderBoard.second_place && (
                <LeaderboardItem 
                  rank={2}
                  user={leaderBoard.second_place}
                  score={leaderBoard.second_place.marks}
                  isCurrentUser={leaderBoard.second_place.id == user_id}
                  isTopThree={true}
                />
              )}
              
              {leaderBoard.third_place && (
                <LeaderboardItem 
                  rank={3}
                  user={leaderBoard.third_place}
                  score={leaderBoard.third_place.marks}
                  isCurrentUser={leaderBoard.third_place.id == user_id}
                  isTopThree={true}
                />
              )}
            </View>
          )}
          
          {/* Others Section */}
          {leaderBoard.others && leaderBoard.others?.length > 0 && (
            <View style={styles.othersSection}>
              <Text style={styles.sectionTitle}>Other Players</Text>
              
              {leaderBoard.others.map((item, index) => (
                <LeaderboardItem 
                  key={`other-${index}`}
                  rank={item.rank}
                  user={item}
                  score={item.marks}
                  isCurrentUser={item.id == user_id}
                  isTopThree={false}
                />
              ))}
            </View>
          )}
          
          {/* Current User Section */}
          {leaderBoard.user_place && leaderBoard.user_place.id == user_id && (
            <View style={styles.yourScoreSection}>
              <Text style={styles.sectionTitle}>Your Score</Text>
              
              <LeaderboardItem 
                rank={leaderBoard.user_place.rank}
                user={leaderBoard.user_place}
                score={leaderBoard.user_place.marks}
                isCurrentUser={true}
                isTopThree={false}
              />
            </View>
          )}
          
          {/* Next Button */}
          {currentIndex == 0 && route.params.live !== "yes" && (
            <View style={styles.actionsContainer}>
              <TouchableOpacity
                style={styles.nextButton}
                onPress={() =>
                  navigation.replace("QuizComplete", {
                    user_id: user_id,
                    challenge_id: challenge_id,
                  })
                }
              >
                <LinearGradient
                  colors={['#FF9500', '#FF5E3A']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.nextButtonGradient}
                >
                  <Text style={styles.nextButtonText}>Continue</Text>
                  <Ionicons name="arrow-forward" size={20} color="white" />
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
        
        {/* Auto-continue Message for Live Quiz */}
        {route.params.live == "yes" && (
          <View style={styles.autoContinueMessage}>
            <Ionicons name="time-outline" size={20} color="white" />
            <Text style={styles.autoContinueText}>
              Auto-continuing to next question...
            </Text>
          </View>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

export default QuizLeaderScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#4A80F0',
  },
  background: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  backgroundPattern: {
    position: 'absolute',
    resizeMode: "cover",
    height: hp(100),
    width: wp(100),
    opacity: 0.1,
  },
  header: {
    paddingTop: hp(2),
    paddingBottom: hp(3),
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: hp(4),
    fontFamily: 'raleway-bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    textShadowColor: 'rgba(0, 0, 0, 0.2)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 3,
  },
  headerDivider: {
    width: wp(20),
    height: 4,
    backgroundColor: 'white',
    borderRadius: 2,
    marginVertical: hp(1.5),
    opacity: 0.7,
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: hp(1.8),
    fontFamily: 'raleway-medium',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: hp(8),
  },
  topThreeSection: {
    marginHorizontal: wp(4),
    marginBottom: hp(3),
  },
  othersSection: {
    marginHorizontal: wp(4),
    marginBottom: hp(3),
  },
  yourScoreSection: {
    marginHorizontal: wp(4),
    marginBottom: hp(3),
  },
  sectionTitle: {
    color: 'white',
    fontSize: hp(2.2),
    fontFamily: 'raleway-bold',
    marginBottom: hp(1.5),
    marginTop: hp(1),
    opacity: 0.9,
  },
  leaderboardItem: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    marginBottom: hp(1.5),
    padding: hp(1.5),
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 5,
  },
  topThreeItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 6,
  },
  currentUserItem: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 2,
    borderColor: '#4A80F0',
  },
  rankContainer: {
    width: wp(10),
    alignItems: 'center',
    justifyContent: 'center',
  },
  medalContainer: {
    width: hp(3.5),
    height: hp(3.5),
    borderRadius: hp(1.75),
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  rankText: {
    color: '#333',
    fontSize: hp(2),
    fontFamily: 'raleway-bold',
  },
  userContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: wp(3),
  },
  avatar: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
  },
  avatarPlaceholder: {
    width: hp(5),
    height: hp(5),
    borderRadius: hp(2.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: hp(2.2),
    fontFamily: 'raleway-bold',
  },
  nameText: {
    fontSize: hp(1.8),
    fontFamily: 'raleway-bold',
    color: '#333',
  },
  currentUserText: {
    color: '#4A80F0',
  },
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: hp(2.2),
    fontFamily: 'raleway-bold',
    color: '#333',
  },
  pointsLabel: {
    fontSize: hp(1.2),
    fontFamily: 'raleway',
    color: '#666',
    marginTop: -hp(0.5),
  },
  actionsContainer: {
    marginTop: hp(2),
    paddingHorizontal: wp(4),
  },
  nextButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#FF9500',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  nextButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(2),
  },
  nextButtonText: {
    color: 'white',
    fontSize: hp(2.2),
    fontFamily: 'raleway-bold',
    marginRight: wp(2),
  },
  autoContinueMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(5),
    borderRadius: 30,
    position: 'absolute',
    bottom: hp(5),
    alignSelf: 'center',
  },
  autoContinueText: {
    color: 'white',
    fontSize: hp(1.6),
    fontFamily: 'raleway-medium',
    marginLeft: wp(1),
  },
});