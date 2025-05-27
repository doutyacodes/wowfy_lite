import React, { useState, useRef, useEffect } from "react";
import {
  ActivityIndicator,
  Dimensions,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useNavigation,
} from "@react-navigation/native";
import axios from "axios";
import { CountryPicker } from "react-native-country-codes-picker";
import { 
  heightPercentageToDP as hp,
  widthPercentageToDP as wp 
} from "react-native-responsive-screen";
import { Ionicons } from '@expo/vector-icons';
import { StatusBar } from "expo-status-bar";
import LottieView from "lottie-react-native";
import { baseURL } from "../backend/baseData";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

const { height, width } = Dimensions.get("window");

const OtpVerification = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  
  // State
  const [phoneNumber, setPhoneNumber] = useState("");
  const [confirm, setConfirm] = useState(null);
  const [show, setShow] = useState(false);
  const [countryCode, setCountryCode] = useState("+91");
  const [otpInputs, setOtpInputs] = useState(['', '', '', '', '', '']);
  const inputRefs = useRef([]);
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  
  // Check if user is already logged in
  const { isLoading: isCheckingUser } = useQuery({
    queryKey: ['checkUser'],
    queryFn: async () => {
      const userString = await AsyncStorage.getItem("user");
      if (userString) {
        const user = JSON.parse(userString);
        navigation.replace("InnerPage");
        return user;
      }
      return null;
    },
    // Only run this query once when component mounts
    staleTime: Infinity,
  });
  
  // Mutation for phone verification
  const phoneVerificationMutation = useMutation({
    mutationFn: async (phoneWithCode) => {
      const response = await axios.get(
        `${baseURL}/checkAlreadyUser.php?phone=${phoneWithCode}`
      );
      return response.data;
    },
    onSuccess: async (data) => {
      if (data.user) {
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        navigation.replace("InnerPage");
      } else {
        navigation.navigate("Signup", {
          uid: "123",
          phone: countryCode + phoneNumber,
        });
      }
    },
    onError: (error) => {
      console.error("Error during phone verification:", error);
    }
  });
  
  // Mutation for OTP verification
  const otpVerificationMutation = useMutation({
    mutationFn: async (phoneWithCode) => {
      // In a real app, you'd send the OTP here
      const response = await axios.get(
        `${baseURL}/checkAlreadyUser.php?phone=${phoneWithCode}`
      );
      return response.data;
    },
    onSuccess: async (data) => {
      if (data.user) {
        await AsyncStorage.setItem("user", JSON.stringify(data.user));
        queryClient.invalidateQueries(['checkUser']);
        navigation.replace("InnerPage");
      } else {
        navigation.navigate("Signup", {
          uid: "123",
          phone: countryCode + phoneNumber,
        });
      }
    },
    onError: (error) => {
      console.error("Error during OTP verification:", error);
    }
  });
  
  useEffect(() => {
    // Animate components when screen mounts
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  
  useEffect(() => {
    if (confirm) {
      // Reset OTP inputs when confirm state changes
      setOtpInputs(['', '', '', '', '', '']);
    }
  }, [confirm]);

  const handlePhoneVerification = () => {
    const phoneWithCode = countryCode + phoneNumber;
    phoneVerificationMutation.mutate(phoneWithCode);
  };

  const handleOtpVerification = () => {
    const phoneWithCode = countryCode + phoneNumber;
    otpVerificationMutation.mutate(phoneWithCode);
  };
  
  const handleOtpChange = (text, index) => {
    // Update the OTP input array
    const newOtpInputs = [...otpInputs];
    newOtpInputs[index] = text;
    setOtpInputs(newOtpInputs);
    
    // Move to next input if this one is filled
    if (text?.length == 1 && index < 5) {
      inputRefs.current[index + 1].focus();
    }
  };
  
  const handleOtpKeyPress = (e, index) => {
    // Handle backspace - move to previous input
    if (e.nativeEvent.key == 'Backspace' && index > 0 && otpInputs[index] == '') {
      inputRefs.current[index - 1].focus();
    }
  };
  
  // For demo purposes - toggle between phone input and OTP verification screens
  const toggleConfirmScreen = () => {
    if (!phoneNumber.trim()) {
      // Validation could be improved
      return;
    }
    setConfirm(!confirm);
  };

  // Check if any of the mutations are loading
  const isLoading = phoneVerificationMutation.isPending || otpVerificationMutation.isPending || isCheckingUser;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS == 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS == 'ios' ? 40 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[
            styles.container,
            {
              opacity: fadeAnim,
              transform: [{ translateY: slideAnim }]
            }
          ]}>
            <View style={styles.headerContainer}>
              <LottieView
                source={require("../assets/animation/login.json")}
                autoPlay
                loop
                style={styles.lottie}
              />
              
              <Text style={styles.headerTitle}>
                {confirm ? 'Verification Code' : 'Phone Verification'}
              </Text>
              
              <Text style={styles.headerSubtitle}>
                {confirm 
                  ? `We've sent a verification code to ${countryCode} ${phoneNumber}`
                  : 'We need to verify your phone number to get started'
                }
              </Text>
            </View>

            <View style={styles.formContainer}>
              {confirm ? (
                <>
                  <View style={styles.otpContainer}>
                    {otpInputs.map((digit, index) => (
                      <View key={index} style={styles.otpInputWrapper}>
                        <TextInput
                          ref={(ref) => inputRefs.current[index] = ref}
                          style={styles.otpInput}
                          keyboardType="numeric"
                          maxLength={1}
                          value={digit}
                          onChangeText={(text) => handleOtpChange(text, index)}
                          onKeyPress={(e) => handleOtpKeyPress(e, index)}
                          autoFocus={index == 0}
                        />
                      </View>
                    ))}
                  </View>
                  
                  <TouchableOpacity style={styles.resendContainer}>
                    <Text style={styles.resendText}>
                      Didn't receive the code? <Text style={styles.resendButton}>Resend</Text>
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    disabled={isLoading || otpInputs.join('')?.length !== 6}
                    style={[
                      styles.button, 
                      otpInputs.join('')?.length !== 6 && styles.buttonDisabled
                    ]}
                    onPress={handleOtpVerification}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Verify</Text>
                        <Ionicons name="arrow-forward" size={20} color="white" style={styles.buttonIcon} />
                      </>
                    )}
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.changeNumberButton}
                    onPress={toggleConfirmScreen}
                  >
                    <Ionicons name="arrow-back" size={18} color="#6366f1" style={styles.changeNumberIcon} />
                    <Text style={styles.changeNumberText}>Change Phone Number</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <View style={styles.phoneContainer}>
                    <View style={styles.phoneInputContainer}>
                      <TouchableOpacity
                        onPress={() => setShow(true)}
                        style={styles.countryCodeContainer}
                      >
                        <Text style={styles.countryCodeText}>{countryCode}</Text>
                        <Ionicons name="chevron-down" size={16} color="#6b7280" />
                      </TouchableOpacity>
                      
                      <TextInput
                        style={styles.phoneInput}
                        placeholder="Phone Number"
                        placeholderTextColor="#9ca3af"
                        onChangeText={setPhoneNumber}
                        keyboardType="phone-pad"
                        value={phoneNumber}
                      />
                    </View>
                    
                    <Text style={styles.phoneHelper}>
                      We'll send you a verification code to this number
                    </Text>
                  </View>
                  
                  <TouchableOpacity
                    disabled={isLoading || !phoneNumber.trim()}
                    style={[
                      styles.button,
                      !phoneNumber.trim() && styles.buttonDisabled
                    ]}
                    onPress={toggleConfirmScreen}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <>
                        <Text style={styles.buttonText}>Send Code</Text>
                        <Ionicons name="paper-plane" size={18} color="white" style={styles.buttonIcon} />
                      </>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
            
            <View style={styles.footerContainer}>
              <Text style={styles.footerText}>
                By continuing, you agree to our <Text style={styles.footerLink}>Terms of Service</Text> and <Text style={styles.footerLink}>Privacy Policy</Text>
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
      
      <CountryPicker
        show={show}
        searchMessage="Search country code..."
        style={styles.countryPicker}
        pickerButtonOnPress={(item) => {
          setCountryCode(item.dial_code);
          setShow(false);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: wp(6),
    paddingTop: Platform.OS == 'android' ? hp(4) : hp(2),
  },
  headerContainer: {
    alignItems: "center",
    marginBottom: hp(4),
  },
  lottie: {
    width: wp(70),
    height: hp(25),
    alignSelf: "center",
    marginBottom: hp(2),
  },
  headerTitle: {
    fontSize: hp(3),
    fontFamily: "raleway-bold",
    color: "#111827",
    marginBottom: hp(1),
  },
  headerSubtitle: {
    fontSize: hp(1.8),
    fontFamily: "raleway",
    color: "#6b7280",
    textAlign: "center",
    lineHeight: hp(2.4),
    paddingHorizontal: wp(4),
  },
  formContainer: {
    width: '100%',
    alignItems: 'center',
    marginTop: hp(2),
  },
  // Phone input section
  phoneContainer: {
    width: '100%',
    marginBottom: hp(4),
  },
  phoneInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: '100%',
    marginBottom: hp(1),
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: wp(3),
    paddingVertical: hp(1.5),
    backgroundColor: "#f9fafb",
    marginRight: wp(2),
    width: wp(20),
  },
  countryCodeText: {
    fontSize: hp(1.8),
    fontFamily: "raleway-bold",
    color: "#374151",
  },
  phoneInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    backgroundColor: "#ffffff",
    fontSize: hp(1.8),
    fontFamily: "raleway",
    color: "#111827",
  },
  phoneHelper: {
    fontSize: hp(1.6),
    fontFamily: "raleway",
    color: "#9ca3af",
    marginTop: hp(1),
  },
  // OTP input section
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: hp(3),
  },
  otpInputWrapper: {
    width: wp(12),
    height: wp(14),
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#f9fafb",
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  otpInput: {
    width: '100%',
    height: '100%',
    textAlign: 'center',
    fontSize: hp(2.5),
    fontFamily: "raleway-bold",
    color: "#111827",
  },
  resendContainer: {
    marginBottom: hp(4),
  },
  resendText: {
    fontSize: hp(1.6),
    fontFamily: "raleway",
    color: "#6b7280",
  },
  resendButton: {
    fontFamily: "raleway-bold",
    color: "#6366f1",
  },
  button: {
    backgroundColor: "#6366f1",
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(8),
    borderRadius: 12,
    width: '100%',
    shadowColor: "#6366f1",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: "#c7d2fe",
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: "white",
    fontSize: hp(1.8),
    fontFamily: "raleway-bold",
  },
  buttonIcon: {
    marginLeft: wp(2),
  },
  changeNumberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: hp(3),
  },
  changeNumberIcon: {
    marginRight: wp(1),
  },
  changeNumberText: {
    fontSize: hp(1.6),
    fontFamily: "raleway-bold",
    color: "#6366f1",
  },
  footerContainer: {
    marginTop: 'auto',
    paddingVertical: hp(4),
    alignItems: 'center',
  },
  footerText: {
    fontSize: hp(1.5),
    fontFamily: "raleway",
    color: "#9ca3af",
    textAlign: 'center',
    lineHeight: hp(2),
  },
  footerLink: {
    fontFamily: "raleway-bold",
    color: "#6366f1",
  },
  countryPicker: {
    modal: {
      height: hp(70),
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
    },
    backdrop: {
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
    },
    flag: {
      width: 20,
      height: 15,
      borderRadius: 2,
    },
  },
});

export default OtpVerification;