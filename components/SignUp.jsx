import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Image,
  Dimensions,
} from "react-native";
import Toast from "react-native-toast-message";
import { useDispatch } from "react-redux";
import { baseURL } from "../backend/baseData";
import {
  loginFailure,
  loginStart,
  loginSuccess,
} from "../context/features/auth/authSlice";

const { width, height } = Dimensions.get("window");

const SignUp = ({ navigation, route }) => {
  const [formDataCheck, setFormDataCheck] = useState({
    name: "",
    password: null,
    confirmPassword: null,
    uid: route.params?.uid || null,
    phone: route.params?.phone || null,
  });
  
  const [isFocused, setIsFocused] = useState(false);
  const dispatch = useDispatch();

  const handleChange = (name, value) => {
    setFormDataCheck((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };

  const showToast = (errorData) => {
    Toast.show({
      type: "error",
      text1: "Oops",
      text2: errorData,
    });
  };
  
  const isPasswordStrong = (password) => {
    const passwordRegex =
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleLogin = async () => {
    if (formDataCheck.name === "" || formDataCheck.name === null) {
      showToast("Name is required");
      return;
    }

    try {
      dispatch(loginStart());

      const response = await axios.post(
        `${baseURL}/signup1.php`,
        formDataCheck,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      
      if (response.data.success) {
        await AsyncStorage.setItem("user", JSON.stringify(response.data.user));
        dispatch(loginSuccess(response.data.user));
        navigation.replace("Followpage");
      } else {
        dispatch(loginFailure(response.data.error));
        showToast(response.data.error);
      }
    } catch (error) {
      dispatch(loginFailure("Connection error. Please try again."));
      showToast("Connection error. Please try again.");
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <View style={styles.content}>
          <View style={styles.headerContainer}>
            <Image 
              source={require('../assets/logos/wowfy.png')} 
              style={styles.logo}
              resizeMode="contain"
            />
            <Text style={styles.header}>Create Account</Text>
            <Text style={styles.subHeader}>
              Let's get started with your journey
            </Text>
          </View>

          <View style={styles.formContainer}>
            <View 
              style={[
                styles.inputContainer, 
                isFocused && styles.inputContainerFocused
              ]}
            >
              <Feather
                name="user"
                size={20}
                color="#0291B3"
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                placeholder="Your full name"
                placeholderTextColor="#9CA3AF"
                onChangeText={(text) => handleChange("name", text)}
                value={formDataCheck.name}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
              />
            </View>

            <TouchableOpacity 
              style={styles.loginButton} 
              onPress={handleLogin}
              activeOpacity={0.8}
            >
              <Text style={styles.loginText}>Continue</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity 
              onPress={() => navigation.replace("OtpVerification")}
              style={styles.loginLinkContainer}
            >
              <Text style={styles.signUpText}>
                Already have an account?{" "}
              </Text>
              <Text style={styles.signUpLink}>Login</Text>
            </TouchableOpacity>

            <View style={styles.termsContainer}>
              <Text style={styles.termsText}>
                By continuing, you agree to our{" "}
                <Text style={styles.termsLink}>Terms of Service</Text>{" "}
                and{" "}
                <Text style={styles.termsLink}>Privacy Policy</Text>
              </Text>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "space-between",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "android" ? 20 : 0,
    paddingBottom: 24,
  },
  headerContainer: {
    alignItems: "center",
    marginTop: height * 0.05,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 20,
  },
  header: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 8,
  },
  subHeader: {
    fontSize: 16,
    color: "#6B7280",
    marginBottom: 10,
    textAlign: "center",
  },
  formContainer: {
    width: "100%",
    marginVertical: height * 0.05,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    borderRadius: 12,
    backgroundColor: "#F9FAFB",
    marginBottom: 20,
    paddingHorizontal: 12,
    height: 56,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  inputContainerFocused: {
    borderColor: "#0291B3",
    backgroundColor: "#F0FBFF",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1F2937",
  },
  loginButton: {
    backgroundColor: "#0291B3",
    borderRadius: 12,
    height: 56,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#0291B3",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  loginText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  footer: {
    alignItems: "center",
    marginBottom: height * 0.02,
  },
  loginLinkContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 20,
  },
  signUpText: {
    color: "#6B7280",
    fontSize: 14,
  },
  signUpLink: {
    color: "#0291B3",
    fontWeight: "600",
    fontSize: 14,
  },
  termsContainer: {
    alignItems: "center",
    paddingHorizontal: 20,
  },
  termsText: {
    fontSize: 12,
    color: "#9CA3AF",
    textAlign: "center",
    lineHeight: 18,
  },
  termsLink: {
    color: "#0291B3",
    fontWeight: "500",
  },
});

export default SignUp