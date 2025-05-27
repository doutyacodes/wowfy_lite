import {
  AntDesign,
  Entypo,
  Feather,
  FontAwesome,
  FontAwesome5,
  Fontisto,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Dropdown } from "react-native-element-dropdown";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import Toast from "react-native-toast-message";
import { useDispatch } from "react-redux";
import { baseURL } from "../backend/baseData";
import {
  loginFailure,
  loginStart,
  loginSuccess,
} from "../context/features/auth/authSlice";
const DetailSignup = ({ navigation }) => {
  const today = new Date();
  const minDate = new Date(
    today.getFullYear() - 13,
    today.getMonth(),
    today.getDate()
  );
  const [formDataCheck, setFormDataCheck] = useState({
    gender: "",
    birth_date: new Date(),
    country: 101,
    state: "",
    referral_user_id: "",
    user_id: null,
  });
  const [items, setItems] = useState([]);
  const [stateList, setStateList] = useState([]);
  const [stateValues, setStateValues] = useState("");
  const [genderValues, setGenderValues] = useState("");
  const [user, setUser] = useState(null);
  const [genderList, setGenderList] = useState([
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
  ]);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const handleChange = (name, value) => {
    setFormDataCheck((prevFormData) => ({
      ...prevFormData,
      [name]: value,
    }));
  };
  useFocusEffect(
    useCallback(() => {
      const fetchUserAndNavigate = async () => {
        try {
          const userString = await AsyncStorage.getItem("user");
          const userData = JSON.parse(userString);
          setUser(JSON.parse(userString));
          if (userData) {
            handleChange("user_id", userData.id);
            if (userData?.steps == 2) {
              PassNav = "TopicScreen";
              navigation.replace(PassNav);
            } else if (userData?.steps >= 3) {
              PassNav = "InnerPage";
              navigation.replace(PassNav);
            }
          } else {
            navigation.replace("Signup");
          }
        } catch (error) {
          console.error("Error fetching user:", error.message);
        }
      };

      fetchUserAndNavigate();
    }, [])
  );
  const dispatch = useDispatch();

  const handleConfirm = (date) => {
    handleChange("birth_date", date);
    hideDatePicker();
  };
  const showToast = (errorData) => {
    Toast.show({
      type: "error",
      text1: "Oops",
      text2: errorData,
    });
  };
  const isPasswordStrong = (password) => {
    // Password must be at least 8 characters long and contain letters, numbers, and special characters
    const passwordRegex =
      /^(?=.*[a-zA-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };
  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };
  const handleLogin = async () => {
    const today = new Date();
    const birthDate = formDataCheck.birth_date;
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff == 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    // console.log("hello")
    // Check if age is at least 13
    if (age < 13) {
      showToast("You must be at least 13 years old to sign up.");
      return;
    }
    for (const key in formDataCheck) {
      if (
        key !== "referral_user_id" &&
        (formDataCheck[key] == "" || formDataCheck[key] == null)
      ) {
        let key2 = key;
        if (key == "birth_date") {
          key2 = "Date of Birth";
        }
        if (key == "gender") {
          key2 = "Gender";
        }
        if (key == "country") {
          key2 = "Country";
        }
        if (key == "state") {
          key2 = "State";
        }
        showToast(`${key2} is required`);
        return;
      }
    }

    if (user) {
      try {
        dispatch(loginStart());

        const response = await axios.post(
          `${baseURL}/signup2.php`,
          formDataCheck,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );
        // console.log(response.data)
        if (response.data.success) {
          const newDataJSON = JSON.stringify(response.data.user);

          // Check if data already exists in AsyncStorage
          AsyncStorage.getItem("user")
            .then((existingData) => {
              if (existingData) {
                // If data exists, overwrite it with new data
                AsyncStorage.setItem("user", newDataJSON)
                  .then(() => {
                    console.log(
                      "Existing data replaced with new data successfully."
                    );
                  })
                  .catch((error) => {
                    console.error("Error storing new data:", error);
                  });
              } else {
                // If data doesn't exist, create new data
                AsyncStorage.setItem("user", newDataJSON)
                  .then(() => {
                    console.log("New data created successfully.");
                  })
                  .catch((error) => {
                    console.error("Error storing new data:", error);
                  });
              }
            })
            .catch((error) => {
              console.error("Error retrieving existing data:", error);
            });
          await AsyncStorage.setItem(
            "user",
            JSON.stringify(response.data.user)
          );
          dispatch(loginSuccess(response.data.user));
          navigation.replace("TopicScreen");
        } else {
          console.error("Error:", response.data.error);
          dispatch(loginFailure(response.data.error));
          showToast(response.data.error);
        }
      } catch (error) {
        console.error("Error:", error.message);
      }
    }
  };

  const birthDate = new Date(formDataCheck.birth_date);
  const isBirthDateToday =
    today.getDate() == birthDate.getDate() &&
    today.getMonth() == birthDate.getMonth() &&
    today.getFullYear() == birthDate.getFullYear();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`${baseURL}/country.php`);

        if (response.status == 200) {
          setItems(response.data);
          // console.log(response.data);
        } else {
          console.error("Failed to fetch countries");
        }
      } catch (error) {
        console.error("Error while fetching countries:", error.message);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    // handleChange("country", values);
    const fetchState = async () => {
      try {
        const response = await axios.get(
          `${baseURL}/state.php?country_id=${formDataCheck.country}`
        );

        if (response.status == 200) {
          setStateList(response.data);
        } else {
          console.error("Failed to fetch states");
        }
      } catch (error) {
        console.error("Error while fetching states:", error.message);
      }
    };

    fetchState();
  }, [formDataCheck.country]);

  useEffect(() => {
    handleChange("state", stateValues);
  }, [stateValues]);

  useEffect(() => {
    handleChange("gender", genderValues);
  }, [genderValues]);
  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.header}>Signup</Text>
        <Text style={styles.subHeader}>Complete Your Profile</Text>

        <View style={styles.inputContainer}>
          <FontAwesome
            name="transgender"
            size={20}
            color="#0291B3"
            style={styles.inputIcon}
          />
          <View
            style={{
              backgroundColor: "transparent",
              paddingHorizontal: 10,
              paddingVertical: 10,
              flex: 1,
            }}
          >
            <Dropdown
              labelField="label"
              valueField="value"
              placeholderStyle={{ color: "#C7C7CD" }}
              selectedTextStyle={{ color: "#0291B3" }}
              placeholder="Select you gender"
              data={genderList}
              value={formDataCheck.gender}
              onChange={(item) => {
                handleChange("gender", item.value);
              }}
            />
          </View>
        </View>
        <TouchableOpacity
          style={styles.inputContainer}
          onPress={showDatePicker}
        >
          <Entypo
            name="calendar"
            size={24}
            color="#0291B3"
            style={styles.inputIcon}
          />
          <View style={{ flexDirection: "row", padding: 15 }}>
            {isBirthDateToday ? (
              <Text style={{ fontSize: hp(1.7), flex: 1, color: "#0291B3" }}>
                Date of Birth
              </Text>
            ) : (
              <Text style={{ fontSize: hp(1.7), flex: 1, color: "#0291B3" }}>
                {formDataCheck.birth_date.toLocaleDateString("en-GB")}
              </Text>
            )}
          </View>

          <DateTimePickerModal
            maximumDate={minDate}
            isVisible={isDatePickerVisible}
            mode="date"
            themeVariant="dark"
            display="inline"
            onConfirm={handleConfirm}
            onCancel={hideDatePicker}
          />
        </TouchableOpacity>
        <View style={styles.inputContainer}>
          <Fontisto
            name="world"
            size={20}
            color="#0291B3"
            style={styles.inputIcon}
          />
          <View
            style={{
              backgroundColor: "transparent",
              paddingHorizontal: 10,
              paddingVertical: 10,
              flex: 1,
            }}
          >
            <Dropdown
              labelField="label"
              dropdownPosition="top"
              valueField="value"
              selectedTextStyle={{ color: "#0291B3" }}
              placeholderStyle={{ color: "#C7C7CD" }}
              placeholder="Select you country"
              data={items}
              value={formDataCheck.country}
              onChange={(item) => {
                handleChange("country", item.value);
              }}
              search
              searchPlaceholder="Search your country.."
            />
          </View>
        </View>
        <View style={styles.inputContainer}>
          <Fontisto
            name="world"
            size={20}
            color="#0291B3"
            style={styles.inputIcon}
          />
          <View
            style={{
              backgroundColor: "transparent",
              paddingHorizontal: 10,
              paddingVertical: 10,
              flex: 1,
            }}
          >
            <Dropdown
              dropdownPosition="top"
              searchPlaceholder="Search your state.."
              labelField="label"
              valueField="value"
              search
              selectedTextStyle={{ color: "#0291B3" }}
              placeholderStyle={{ color: "#C7C7CD" }}
              placeholder="Select you state"
              data={stateList}
              value={formDataCheck.state}
              onChange={(item) => {
                handleChange("state", item.value);
              }}
            />
          </View>
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
            placeholder="Enter referral code"
            value={formDataCheck.referral_user_id}
            onChangeText={(text) => handleChange("referral_user_id", text)}
          />
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
          <Text style={styles.loginText}>Create account</Text>
        </TouchableOpacity>
        <View style={styles.line}></View>
        <Text style={styles.optionText}>or continue with</Text>
        <View style={styles.optionContainer}>
          <TouchableOpacity style={styles.optionButton}>
            <AntDesign name="apple1" size={26} color="black" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton}>
            <AntDesign name="google" size={26} color="#34A853" />
          </TouchableOpacity>
          <TouchableOpacity style={styles.optionButton}>
            <FontAwesome5 name="facebook" size={26} color="#1877F2" />
          </TouchableOpacity>
        </View>
        <TouchableOpacity
          onPress={() => navigation.navigate("OtpVerification")}
        >
          <Text style={styles.signUpText}>
            Already have an account?{" "}
            <Text style={styles.signUpLink}>Login</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "white",
    position: "relative",
    paddingTop: 35,
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
    marginTop: -100,
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
    marginBottom: 20,
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
    marginTop: 40,
  },
  signUpLink: {
    color: "#0291B3",
  },
  loginButton: {
    backgroundColor: "#0291B3",
    width: "100%",
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
  optionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "60%",
    marginTop: 5,
  },
  optionButton: {
    backgroundColor: "white",
    borderColor: "#ddd",
    borderWidth: 1,
    borderRadius: 50,
    width: 50,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    elevation: 3,
  },
  optionText: {
    color: "grey",
    marginBottom: 5,
    fontSize: 15,
  },
  line: {
    borderBottomColor: "white",
    borderBottomWidth: 1,
    width: "60%",
    marginTop: 65,
  },
});

export default DetailSignup;
