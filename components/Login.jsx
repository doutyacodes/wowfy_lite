import { Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import React, { useCallback, useState } from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { baseURL } from "../backend/baseData";

const Login = ({ navigation, route }) => {
  useFocusEffect(
    useCallback(() => {
      const fetchUser = async () => {
        try {
          const storedUser = await AsyncStorage.getItem("user");
          if (storedUser) {
            // console.log(storedUser);
            if (storedUser) {
              handleChange("user_id", storedUser.id);
              if (storedUser?.steps == 2) {
                PassNav = "TopicScreen";
                navigation.replace(PassNav);
              } else if (storedUser?.steps >= 3) {
                PassNav = "InnerPage";
                navigation.replace(PassNav);
              }
            }
          } else {
            // navigation.navigate("OtpVerification")
          }
        } catch (error) {
          console.error("Error while fetching user:", error.message);
        }
      };

      fetchUser();
    }, [])
  );
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    try {
      const response = await axios.post(
        `${baseURL}/checkUserExist2.php`,
        {
          username: username,
          password: password,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      // console.log(response.data);
      if (response.data.page_exists == "yes") {
        // User details found, save in AsyncStorage
        const userData = response.data.data;
        await AsyncStorage.setItem("user", JSON.stringify(userData));
        setIsLoading(false); // Set isLoading to false once OTP is confirmed

        // if (response.data.data.steps >= 2) {
          navigation.replace("InnerPage");
        // } else if (response.data.data.steps == 1) {
          // navigation.replace("DetailSignup");
        // }
      } else {
        Alert.alert("Sorry", "No user exist with these credentials");
      }
    } catch (error) {
      setIsLoading(false); // Set isLoading to false once OTP is confirmed

      console.error("Error fetching user details:", error);
    }
  };

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  return (
    <View style={styles.container}>
      <View style={styles.curveTop}>
        <Svg
          width="450"
          height="400"
          viewBox="0 0 1440 320"
          preserveAspectRatio="none"
        >
          <Path
            d="M0,128L80,117.3C160,107,320,85,480,96C640,107,800,149,960,154.7C1120,160,1280,128,1360,112L1440,96L1440,0L1360,0C1280,0,1120,0,960,0C800,0,640,0,480,0C320,0,160,0,80,0L0,0Z"
            fill="#0291b3"
          />
        </Svg>
      </View>
      <View style={styles.content}>
        <Text style={styles.header}>Welcome Back</Text>
        <Text style={styles.subHeader}>Login to your account</Text>
        <View style={styles.inputContainer}>
          <Feather
            name="user"
            size={20}
            color="#0291B3"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Username"
            onChangeText={setUsername}
            value={username}
          />
        </View>
        <View style={styles.inputContainer}>
          <Feather
            name="lock"
            size={20}
            color="#0291B3"
            style={styles.inputIcon}
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry={true}
            onChangeText={setPassword}
            value={password}
          />
        </View>
        <View style={styles.rememberForgot}>
          <TouchableOpacity
            onPress={toggleRememberMe}
            style={styles.rememberMe}
          >
            <Text>{rememberMe ? "☑️" : "⬜️"}</Text>
            <Text style={styles.rememberMeLabel}>Remember Me</Text>
          </TouchableOpacity>
          <TouchableOpacity>
            <Text style={styles.forgotPassword}>Forgotten Password?</Text>
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => navigation.navigate("OtpVerification")}
        >
          <Text style={styles.signUpText}>
            Don't have an account?{" "}
            <Text style={styles.signUpLink}>Register</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    position: "relative",
  },
  curveTop: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "20%",
    zIndex: 1,
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
    zIndex: 2,
    marginTop: 80,
  },
  header: {
    fontSize: 32,
    fontFamily: "raleway-bold",
    color: "#0291B3",
    marginBottom: 10,
    fontFamily: "Arial",
  },
  subHeader: {
    fontSize: 16,
    color: "#999999",
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    margin: 10,
    borderWidth: 1,
    borderColor: "#0291B3",
    borderRadius: 15,
  },
  inputIcon: {
    marginRight: 10,
    marginLeft: 10,
  },
  input: {
    flex: 1,
    height: 50,
    paddingLeft: 10,
  },
  rememberForgot: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginTop: 5,
    marginBottom: 20,
  },
  rememberMe: {
    flexDirection: "row",
    alignItems: "center",
  },
  rememberMeLabel: {
    marginLeft: 5,
    color: "#0291B3",
  },
  forgotPassword: {
    color: "#0291B3",
  },
  signUpText: {
    color: "grey",
    marginTop: 10,
  },
  signUpLink: {
    color: "#0291B3",
  },
  loginButton: {
    backgroundColor: "#0291B3",
    width: "60%",
    height: 50,
    borderRadius: 25,
    marginTop: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  loginText: {
    color: "white",
    fontFamily: "raleway-bold",
    fontSize: 18,
    paddingVertical: 10,
  },
});

export default Login;
