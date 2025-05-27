import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import { Audio, ResizeMode, Video } from "expo-av";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useRef, useState } from "react";
import { 
  Image, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  Animated,
  Dimensions,
  SafeAreaView,
  ActivityIndicator
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { Ionicons, MaterialIcons, Feather, AntDesign } from "@expo/vector-icons";
import { baseImgURL, baseURL, baseVidUrl } from "../backend/baseData";

// Get screen dimensions for responsive layouts
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const OptionButton = ({ option, isSelected, onPress, revealed }) => {
  // Animation refs
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.95)).current;
  
  useEffect(() => {
    if (isSelected == option.answer_text) {
      Animated.sequence([
        Animated.timing(scaleAnim, {
          toValue: 0.98,
          duration: 100,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
      
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [isSelected]);
  
  return (
    <Animated.View style={{
      transform: [{ scale: scaleAnim }],
      opacity: opacityAnim
    }}>
      <TouchableOpacity
        style={[
          styles.option,
          isSelected == option.answer_text && styles.selectedOption
        ]}
        onPress={() => onPress(option.answer_text)}
        disabled={isSelected !== "" || revealed}
        activeOpacity={0.8}
      >
        <Text 
          style={[
            styles.optionText,
            isSelected == option.answer_text && styles.selectedOptionText
          ]}
        >
          {option.answer_text}
        </Text>
        
        {isSelected == option.answer_text && (
          <View style={styles.selectedIndicator}>
            <AntDesign name="check" size={16} color="white" />
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

const QuizPageScreen = ({ route }) => {
  const { dataQuiz } = route.params;
  const [currentIndex, setCurrentIndex] = useState(route.params.currentIndex);
  const [user, setuser] = useState(route.params.user);
  const [marks, setMarks] = useState(0);
  const [isSelected, setIsSelected] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState("");
  const [shuffledOptions, setShuffledOptions] = useState([]);
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const videoRef = useRef(null);
  const [status, setStatus] = useState({});
  const [dataQuestion, setDataQuestion] = useState(dataQuiz[currentIndex]);
  const [timer, setTimer] = useState(dataQuestion.timer);
  const [sound, setSound] = useState();
  const [timerMilliseconds, setTimerMilliseconds] = useState(
    dataQuestion.timer * 1000
  );
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const timerProgressAnim = useRef(new Animated.Value(1)).current;
  
  const navigation = useNavigation();
  
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
    
    // Set the progress value
    Animated.timing(progressAnim, {
      toValue: (currentIndex + 1) / dataQuestion.count_question,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [currentIndex]);
  
  // Start timer animation
  useEffect(() => {
    Animated.timing(timerProgressAnim, {
      toValue: 0,
      duration: dataQuestion.timer * 1000,
      useNativeDriver: false,
    }).start();
  }, [dataQuestion]);
  
  useEffect(() => {
    const newDataQuestion = dataQuiz[currentIndex];
    if (newDataQuestion) {
      setDataQuestion(newDataQuestion);
      setTimer(newDataQuestion.timer);
      setTimerMilliseconds(newDataQuestion.timer * 1000);
      setIsSelected("");
      setRevealed(false);
      
      // Reset animations
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.95);
      timerProgressAnim.setValue(1);
      
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
        Animated.timing(timerProgressAnim, {
          toValue: 0,
          duration: newDataQuestion.timer * 1000,
          useNativeDriver: false,
        })
      ]).start();
    }
  }, [currentIndex, dataQuiz]);

  useEffect(() => {
    if (dataQuestion.type == "video") {
      (async () => {
        try {
          await videoRef.current?.loadAsync(
            {
              uri: `${baseVidUrl + dataQuestion.video}`,
            },
            { shouldPlay: true }
          );
        } catch (error) {
          console.error("Error loading video:", error);
        }
      })();
    }
    else if (dataQuestion.type == "audio") {
      (async () => {
        try {
          if (sound) {
            await sound.unloadAsync();
          }

          const { sound: newSound } = await Audio.Sound.createAsync({
            uri: `${baseVidUrl + dataQuestion.audio}`,
          });

          setSound(newSound);
          await newSound.playAsync();
        } catch (error) {
          console.error("Error loading audio:", error);
        }
      })();
    }
    
    return () => {
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [dataQuestion]);

  useEffect(() => {
    const countdown = setInterval(() => {
      setTimer((prevTimer) => {
        if (prevTimer <= 0) {
          clearInterval(countdown);
          return 0;
        }
        return prevTimer - 1;
      });
      setTimerMilliseconds((prevMilliseconds) => {
        if (prevMilliseconds <= 0) {
          clearInterval(countdown);
          return 0;
        }
        return prevMilliseconds - 1000;
      });
    }, 1000);

    return () => clearInterval(countdown);
  }, [timerMilliseconds, timer, currentIndex, dataQuestion]);

  useEffect(() => {
    // Find and set correct answer
    const correctItem = dataQuestion.options.find(
      (item) => item.answer == "yes"
    );
    if (correctItem) {
      setCorrectAnswer(correctItem.answer_text);
    }
  }, [dataQuestion]);

  useEffect(() => {
    const fetchMark = async () => {
      if (timer <= 0) {
        setRevealed(true);
        try {
          const response = await axios.post(
            `${baseURL}/add-quiz-progress.php`,
            {
              user_id: user.id,
              challenge_id: dataQuestion.challenge_id,
              marks: marks,
            },
            {
              headers: {
                "Content-Type": "multipart/form-data",
              },
            }
          );
          if (response.status == 200) {
            // Add delay for nicer UX
            setTimeout(() => {
              if (dataQuestion.count_question != currentIndex + 1) {
                if (route.params.live == "yes") {
                  navigation.replace("QuizLeaderScreen", {
                    challenge_id: dataQuestion.challenge_id,
                    user_id: user.id,
                    live: route.params.live,
                    currentIndex: currentIndex + 1,
                    dataQuiz: dataQuiz,
                    user: user,
                  });
                } else {
                  navigation.replace("QuizCountPage", {
                    challenge_id: dataQuestion.challenge_id,
                    user_id: user.id,
                    live: route.params.live,
                    currentIndex: currentIndex + 1,
                    dataQuiz: dataQuiz,
                    user: user,
                  });
                }
              } else {
                navigation.replace("QuizLeaderScreen", {
                  challenge_id: dataQuestion.challenge_id,
                  user_id: user.id,
                  live: "no",
                });
              }
            }, 2000);
          }
        } catch (error) {
          console.error("Error adding marks:", error);
        }
      }
    };
    fetchMark();
  }, [timer]);
  
  useEffect(() => {
    if (dataQuestion.options?.length > 0) {
      // Create a copy of the options array
      const optionsCopy = [...dataQuestion.options];
      // Shuffle the copy of options array
      const shuffled = shuffleArray(optionsCopy);
      // Update state with shuffled options
      setShuffledOptions(shuffled);
    }
  }, [dataQuestion]);

  // Function to shuffle array elements
  const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
  };

  const handleAnswer = async (optionText) => {
    if (isSelected) return;
    
    setIsSelected(optionText);
    setRevealed(true);
    
    let pointsEarned = 0;
    if (optionText == correctAnswer) {
      const remainingMilliseconds = timerMilliseconds;
      const maxMarks = 1000;
      pointsEarned = Math.max(0, ((maxMarks / (dataQuestion.timer * 1000)) * remainingMilliseconds).toFixed(2));
      setMarks(pointsEarned);
    }
    
    if (route.params.live == "no") {
      setLoading(true);
      try {
        let finalValue = dataQuestion.count_question != currentIndex + 1 ? "yes" : "no";
        
        const response = await axios.post(
          `${baseURL}/add-quiz-progress.php`,
          {
            user_id: user.id,
            challenge_id: dataQuestion.challenge_id,
            marks: pointsEarned,
            finalValue: finalValue,
          },
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        
        if (response.status == 200) {
          // Wait a moment to show the answer selection
          setTimeout(() => {
            if (dataQuestion.count_question != currentIndex + 1) {
              navigation.replace("QuizCountPage", {
                challenge_id: dataQuestion.challenge_id,
                user_id: user.id,
                live: route.params.live,
                currentIndex: currentIndex + 1,
                dataQuiz: dataQuiz,
                user: user,
              });
            } else {
              navigation.replace("QuizLeaderScreen", {
                challenge_id: dataQuestion.challenge_id,
                user_id: user.id,
                live: "no",
              });
            }
          }, 1500);
        }
      } catch (error) {
        console.error("Error adding marks:", error);
        setLoading(false);
      }
    }
  };

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });
  
  const timerColor = timerProgressAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: ['#FF5252', '#FFC107', '#4CAF50'],
  });

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <LinearGradient
        colors={['#f0f4ff', '#e6eeff']}
        style={styles.background}
      />
      
      {/* Header with progress */}
      <View style={styles.header}>
        <View style={styles.progressBarContainer}>
          <Animated.View 
            style={[
              styles.progressBarFill, 
              { width: progressWidth }
            ]} 
          />
        </View>
        
        <View style={styles.headerInfo}>
          <Text style={styles.questionCounter}>
            Question {currentIndex + 1}/{dataQuestion.count_question}
          </Text>
          
          <View style={styles.timerContainer}>
            <Animated.View 
              style={[
                styles.timerBackground,
                { backgroundColor: timerColor }
              ]}
            />
            <View style={styles.timerContent}>
              <Feather name="clock" size={16} color="#FFF" />
              <Text style={styles.timerText}>{timer}s</Text>
            </View>
          </View>
        </View>
      </View>
      
      {/* Question content */}
      <Animated.ScrollView
        style={[
          styles.contentContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }]
          }
        ]}
        contentContainerStyle={styles.contentContainerStyle}
        showsVerticalScrollIndicator={false}
      >
        {/* Question text */}
        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{dataQuestion.question}</Text>
        </View>
        
        {/* Media content */}
        {dataQuestion?.type == "image" && (
          <View style={styles.mediaContainer}>
            <Image
              source={{ uri: `${baseImgURL + dataQuestion.image}` }}
              style={styles.questionImage}
              resizeMode="contain"
            />
          </View>
        )}
        
        {dataQuestion?.type == "video" && (
          <View style={styles.mediaContainer}>
            <Video
              ref={videoRef}
              style={styles.videoPlayer}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              onPlaybackStatusUpdate={(status) => setStatus(() => status)}
            />
          </View>
        )}
        
        {dataQuestion?.type == "audio" && (
          <View style={styles.audioContainer}>
            <LinearGradient
              colors={['#4A80F0', '#7A97FF']}
              style={styles.audioGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="musical-notes" size={32} color="#FFF" />
              <Text style={styles.audioText}>Audio is now playing</Text>
            </LinearGradient>
          </View>
        )}
        
        {/* Options */}
        <View style={styles.optionsContainer}>
          {shuffledOptions.map((option, index) => (
            <OptionButton
              key={index}
              option={option}
              isSelected={isSelected}
              onPress={handleAnswer}
              revealed={revealed}
            />
          ))}
        </View>
      </Animated.ScrollView>
      
      {/* Loading overlay */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <BlurView intensity={50} style={styles.blurView}>
            <View style={styles.loadingIndicator}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.loadingText}>Moving to next question...</Text>
            </View>
          </BlurView>
        </View>
      )}
    </SafeAreaView>
  );
};

export default QuizPageScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  background: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  header: {
    paddingTop: 16,
    paddingHorizontal: 20,
  },
  progressBarContainer: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#4A80F0',
    borderRadius: 3,
  },
  headerInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  questionCounter: {
    fontSize: hp(1.6),
    fontFamily: 'raleway-semibold',
    color: '#555',
  },
  timerContainer: {
    minWidth: 70,
    height: 32,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  timerBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  timerContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  timerText: {
    color: '#FFF',
    fontFamily: 'raleway-bold',
    fontSize: hp(1.6),
    marginLeft: 4,
  },
  contentContainer: {
    flex: 1,
  },
  contentContainerStyle: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  questionContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  questionText: {
    fontSize: hp(2.2),
    fontFamily: 'raleway-bold',
    color: '#333',
    lineHeight: hp(3),
    textAlign: 'center',
  },
  mediaContainer: {
    marginTop: 16,
    alignItems: 'center',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#FFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  questionImage: {
    width: '100%',
    height: hp(25),
    borderRadius: 16,
  },
  videoPlayer: {
    width: '100%',
    height: hp(25),
    borderRadius: 16,
  },
  audioContainer: {
    marginTop: 16,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  audioGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
  },
  audioText: {
    color: '#FFF',
    marginLeft: 12,
    fontSize: hp(1.8),
    fontFamily: 'raleway-semibold',
  },
  optionsContainer: {
    marginTop: 20,
  },
  option: {
    backgroundColor: 'white',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  selectedOption: {
    backgroundColor: '#E3F2FD',
    borderColor: '#4A80F0',
    borderWidth: 2,
  },
  optionText: {
    fontSize: hp(1.8),
    fontFamily: 'raleway-medium',
    color: '#333',
    flex: 1,
  },
  selectedOptionText: {
    fontFamily: 'raleway-bold',
    color: '#4A80F0',
  },
  selectedIndicator: {
    backgroundColor: '#4A80F0',
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  blurView: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingIndicator: {
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    width: '80%',
    maxWidth: 300,
  },
  loadingText: {
    marginTop: 16,
    color: 'white',
    fontSize: hp(1.8),
    fontFamily: 'raleway-medium',
    textAlign: 'center',
  },
});