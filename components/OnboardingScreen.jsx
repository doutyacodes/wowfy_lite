import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  SafeAreaView,
  Platform,
  Image
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { MaterialIcons, Feather } from '@expo/vector-icons';
import LottieView from 'lottie-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';

const { width, height } = Dimensions.get('window');

// Key for AsyncStorage
const ONBOARDING_SHOWN_KEY = '@onboarding_completed';

const OnboardingScreen = ({ navigation }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;
  const animationRefs = useRef([]);

  // Animation values for transitions
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const translateY = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const onboardingData = [
    {
      id: '1',
      title: 'Complete Challenges',
      description: 'Join exciting challenges and showcase your skills to earn beautiful certificates of achievement.',
      animation: require('../assets/animation/challenges.json'),
      colors: ['#4338CA', '#6366F1'],
      icon: 'award',
    },
    {
      id: '2',
      title: 'Connect with Communities',
      description: 'Discover and connect with communities that share your interests and passions.',
      animation: require('../assets/animation/community.json'),
      colors: ['#9333EA', '#EC4899'],
      icon: 'users',
    },
    {
      id: '3',
      title: 'Share Achievements',
      description: 'Showcase your certificates and accomplishments with friends and on your professional profiles.',
      animation: require('../assets/animation/share.json'),
      colors: ['#047857', '#10B981'],
      icon: 'share-2',
    },
    {
      id: '4',
      title: 'Get Started!',
      description: 'Your journey to recognition and achievement begins now. Let\'s get started!',
      animation: require('../assets/animation/start.json'),
      colors: ['#B45309', '#F59E0B'],
      icon: 'zap',
    },
  ];

  useEffect(() => {
    checkOnboardingStatus();
    
    // Play the first animation
    if (animationRefs.current[0]) {
      animationRefs.current[0].reset();
      animationRefs.current[0].play();
    }
  }, []);

  // Fix animation play/reset when swiping
  useEffect(() => {
    // Reset all animations first
    onboardingData.forEach((_, index) => {
      if (animationRefs.current[index]) {
        animationRefs.current[index].reset();
      }
    });
    
    // Play current animation
    if (animationRefs.current[currentIndex]) {
      animationRefs.current[currentIndex].play();
    }
    
    // Update slideAnim to show the current slide with an elastic effect
    Animated.spring(slideAnim, {
      toValue: currentIndex * width * -1,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Slight pulse animation when changing slides
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 0.98,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 5,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
    
  }, [currentIndex, width]);

  const checkOnboardingStatus = async () => {
    try {
      const value = await AsyncStorage.getItem(ONBOARDING_SHOWN_KEY);
      if (value == 'true') {
        // navigateToApp();
      }
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    }
  };

  const markOnboardingComplete = async () => {
    try {
      await AsyncStorage.setItem(ONBOARDING_SHOWN_KEY, 'true');
    } catch (error) {
      console.error('Error saving onboarding status:', error);
    }
  };

  const navigateToApp = async() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    const userString = await AsyncStorage.getItem("user");
    const user = userString ? JSON.parse(userString) : null;
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: -30,
        duration: 500,
        useNativeDriver: true,
      }),
    ]).start(() => {
      markOnboardingComplete();
      navigation.replace(user ? "InnerPage" : "OtpVerification");
    });
  };

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentIndex < onboardingData.length - 1) {
      setCurrentIndex(currentIndex + 1);
    } else {
      navigateToApp();
    }
  };

  const handlePrev = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleSkip = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigateToApp();
  };

  const renderSlides = () => {
    return (
      <Animated.View
        style={[
          styles.slidesContainer,
          {
            width: onboardingData.length * width,
            transform: [
              { translateX: slideAnim },
              { scale: scaleAnim }
            ],
          },
        ]}
      >
        {onboardingData.map((item, index) => (
          <View key={item.id} style={styles.slideContainer}>
            <View style={styles.featureIconContainer}>
              <Feather name={item.icon} size={24} color="#fff" />
            </View>
            
            <View style={styles.animationContainer}>
              <LottieView
                ref={(animation) => {
                  animationRefs.current[index] = animation;
                }}
                source={item.animation}
                style={styles.animation}
                loop={true}
                autoPlay={false}
              />
            </View>
            
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
          </View>
        ))}
      </Animated.View>
    );
  };

  const Indicator = () => {
    return (
      <View style={styles.indicatorContainer}>
        {onboardingData.map((_, index) => {
          // Use fixed values for indicator widths
          const dotWidth = 8;
          const activeWidth = 24;
          
          // Simple indicator based on currentIndex
          const isActive = index == currentIndex;
          
          return (
            <Animated.View
              key={index.toString()}
              style={[
                styles.indicator,
                {
                  opacity: isActive ? 1 : 0.3,
                  width: isActive ? activeWidth : dotWidth,
                  backgroundColor: isActive ? '#fff' : 'rgba(255, 255, 255, 0.5)',
                },
              ]}
            />
          );
        })}
      </View>
    );
  };

  const BackgroundGradient = () => {
    const colors = onboardingData[currentIndex].colors;

    return (
      <Animated.View 
        style={[
          StyleSheet.absoluteFillObject,
          { opacity: fadeAnim }
        ]}
      >
        <LinearGradient
          style={StyleSheet.absoluteFillObject}
          colors={colors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        />
        {/* Mesh pattern overlay */}
        <View style={styles.meshPattern} />
      </Animated.View>
    );
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY }],
        },
      ]}
    >
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Gradient background */}
      <BackgroundGradient />

      <SafeAreaView style={styles.safeArea}>
        {/* Skip button */}
        <View style={styles.headerContainer}>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            activeOpacity={0.7}
          >
            <Text style={styles.skipButtonText}>Skip</Text>
          </TouchableOpacity>
        </View>

        {renderSlides()}

        <View style={styles.bottomContainer}>
          {/* Progress indicators */}
          <Indicator />

          {/* Navigation buttons */}
          <View style={styles.buttonContainer}>
            {currentIndex > 0 ? (
              <TouchableOpacity
                style={[styles.navButton, styles.prevButton]}
                onPress={handlePrev}
                activeOpacity={0.8}
              >
                <MaterialIcons name="arrow-back-ios" size={20} color="#fff" />
              </TouchableOpacity>
            ) : (
              <View style={styles.buttonSpacer} />
            )}

            <TouchableOpacity
              style={[styles.primaryButton]}
              onPress={handleNext}
              activeOpacity={0.8}
            >
              <Text style={styles.primaryButtonText}>
                {currentIndex == onboardingData.length - 1 ? "Get Started" : "Next"}
              </Text>
              <MaterialIcons
                name={currentIndex == onboardingData.length - 1 ? "login" : "arrow-forward-ios"}
                size={20}
                color="#fff"
                style={styles.primaryButtonIcon}
              />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  meshPattern: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'transparent',
    opacity: 0.15,
    backgroundImage: 'radial-gradient(circle at 20px 20px, rgba(255,255,255,0.2) 1px, transparent 0)',
    backgroundSize: '40px 40px',
  },
  safeArea: {
    flex: 1,
    paddingTop: Platform.OS == 'android' ? StatusBar.currentHeight : 0,
  },
  headerContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: wp(6),
    paddingTop: hp(2),
    zIndex: 10,
  },
  skipButton: {
    borderRadius: 20,
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  skipButtonText: {
    color: '#fff',
    fontSize: hp(1.8),
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  slidesContainer: {
    flexDirection: 'row',
  },
  slideContainer: {
    width,
    height: height - hp(25),
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(6),
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(2),
  },
  animationContainer: {
    width: '100%',
    height: hp(40),
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: hp(4),
  },
  animation: {
    width: wp(85),
    height: wp(85),
  },
  textContainer: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    padding: hp(4),
    borderRadius: 28,
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  title: {
    fontSize: hp(3.5),
    color: '#fff',
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: hp(2),
    letterSpacing: 0.5,
  },
  description: {
    fontSize: hp(2),
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: hp(3.1),
  },
  bottomContainer: {
    position: 'absolute',
    bottom: hp(6),
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  indicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: hp(4),
  },
  indicator: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: wp(1),
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    paddingHorizontal: wp(2),
  },
  buttonSpacer: {
    width: 50,
  },
  navButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  prevButton: {
    paddingLeft: 5,
  },
  primaryButton: {
    height: 56,
    paddingHorizontal: wp(6),
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: hp(2),
    fontWeight: 'bold',
    marginRight: wp(2),
  },
  primaryButtonIcon: {
    marginLeft: wp(1),
  },
});

export default OnboardingScreen;