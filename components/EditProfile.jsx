import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  SafeAreaView,
} from "react-native";
import { AntDesign, Feather, MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import * as ImagePicker from "expo-image-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import Toast from "react-native-toast-message";
import { baseImgURL, baseURL } from "../backend/baseData";
import { Dropdown } from "react-native-element-dropdown";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const InputField = ({ 
  icon, 
  placeholder, 
  value, 
  onChangeText, 
  editable = true,
  secureTextEntry = false,
  keyboardType = "default"
}) => {
  return (
    <View style={styles.inputContainer}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#9E9E9E"
        value={value}
        onChangeText={onChangeText}
        editable={editable}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
      />
    </View>
  );
};

const CustomDropdown = ({ icon, placeholder, data, value, onChange }) => {
  return (
    <View style={styles.dropdownContainer}>
      <View style={styles.iconContainer}>
        {icon}
      </View>
      <Dropdown
        style={styles.dropdown}
        placeholderStyle={styles.dropdownPlaceholder}
        selectedTextStyle={styles.dropdownSelectedText}
        itemTextStyle={styles.dropdownItemText}
        containerStyle={styles.dropdownListContainer}
        activeColor="rgba(106, 90, 205, 0.1)"
        data={data}
        labelField="label"
        valueField="value"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </View>
  );
};

const EditProfile = ({ route }) => {
  const { user_id } = route.params;
  const navigation = useNavigation();
  
  const [image, setImage] = useState(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  
  // Calculate minimum age date (13 years old)
  const today = new Date();
  const minDate = new Date(
    today.getFullYear() - 13,
    today.getMonth(),
    today.getDate()
  );
  
  const [dataForm, setDataForm] = useState({
    name: "",
    gender: "",
    birth_date: minDate,
    id: user_id,
  });
  
  const genderList = [
    { label: "Male", value: "Male" },
    { label: "Female", value: "Female" },
    { label: "Other", value: "Other" },
  ];

  useEffect(() => {
    fetchUserDetails();
  }, []);

  const fetchUserDetails = async () => {
    try {
      setInitialLoading(true);
      const response = await axios.post(
        `${baseURL}/getUserEditDetails.php`,
        {
          id: user_id,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (response.status == 200) {
        const userData = response.data.data;
        
        // Parse the birth date
        const birthDateParts = userData.birth_date.split("/");
        const birthDate = new Date(
          parseInt(birthDateParts[2]), // Year
          parseInt(birthDateParts[1]) - 1, // Month (zero-based)
          parseInt(birthDateParts[0]) // Day
        );
        
        // Update the form data
        setDataForm({
          name: userData.name || "",
          gender: userData.gender || "",
          birth_date: birthDate,
          id: user_id,
        });
        
        // Set profile image if exists
        if (userData?.image && userData?.image?.length > 0) {
          setImage(`${baseImgURL + userData.image}`);
        }
      } else {
        showToast("Failed to load profile details");
      }
    } catch (error) {
      console.error("Error fetching user details:", error);
      showToast("Error loading profile details");
    } finally {
      setInitialLoading(false);
    }
  };

  const pickImage = async () => {
    try {
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        setUploadingImage(true);
        const imageUri = result.assets[0].uri;
        setImage(imageUri);
        
        // Prepare image for upload
        const imageName = imageUri.split("/").pop();
        const imageType = imageName.split(".").pop(); 
        const mimeType = `image/${imageType}`;
        
        // Create FormData
        const formData = new FormData();
        formData.append("id", user_id);
        formData.append("photo", {
          uri: imageUri,
          type: mimeType,
          name: imageName,
        });

        // Upload image
        const response = await fetch(`${baseURL}/editUploadImage.php`, {
          method: "POST",
          headers: {
            "Content-Type": "multipart/form-data",
          },
          body: formData,
        });

        const responseData = await response.json();
        
        if (responseData.success) {
          showSuccessToast("Profile picture updated");
        } else {
          showToast(responseData.message || "Failed to upload image");
          // Revert to previous image
          fetchUserDetails();
        }
      }
    } catch (error) {
      console.error("Error picking or uploading image:", error);
      showToast("Error uploading image");
    } finally {
      setUploadingImage(false);
    }
  };

  const updateField = (fieldName, value) => {
    setDataForm({ ...dataForm, [fieldName]: value });
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (date) => {
    updateField("birth_date", date);
    hideDatePicker();
  };

  const validateForm = () => {
    if (!dataForm.name.trim()) {
      showToast("Please enter your name");
      return false;
    }
    
    if (!dataForm.gender) {
      showToast("Please select your gender");
      return false;
    }
    
    if (!dataForm.birth_date) {
      showToast("Please select your birth date");
      return false;
    }
    
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    
    try {
      setIsLoading(true);
      
      const response = await axios.post(
        `${baseURL}/updateUser.php`, 
        dataForm, 
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (response.data.success) {
        // Update local storage
        const storedUser = await AsyncStorage.getItem("user");
        const currentUser = JSON.parse(storedUser);
        const updatedUserDetails = response.data.user;
        
        // Update relevant fields
        const updatedUser = {
          ...currentUser,
          birth_date: updatedUserDetails.birth_date,
          gender: updatedUserDetails.gender,
          id: updatedUserDetails.id,
          image: updatedUserDetails.image,
          name: updatedUserDetails.name,
        };
        
        await AsyncStorage.setItem("user", JSON.stringify(updatedUser));
        
        showSuccessToast("Profile updated successfully");
        
        // Navigate back after a short delay
        setTimeout(() => {
          navigation.replace("OtherUserScreen", {
            user_id: user_id,
          });
        }, 1000);
      } else {
        showToast(response.data.error || "Failed to update profile");
      }
    } catch (error) {
      console.error("Error updating profile:", error);
      showToast("Error updating profile");
    } finally {
      setIsLoading(false);
    }
  };

  const showToast = (message) => {
    Toast.show({
      type: "error",
      text1: "Error",
      text2: message,
      position: "bottom",
      visibilityTime: 3000,
    });
  };

  const showSuccessToast = (message) => {
    Toast.show({
      type: "success",
      text1: "Success",
      text2: message,
      position: "bottom",
      visibilityTime: 3000,
    });
  };

  if (initialLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#6A5ACD" />
        <Text style={styles.loadingText}>Loading profile...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Feather name="arrow-left" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Edit Profile</Text>
        <View style={styles.rightPlaceholder} />
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require("../assets/logos/wowfy_black.png")}
            style={styles.logo}
            resizeMode="contain"
          />
        </View>
        
        <View style={styles.profileImageContainer}>
          <TouchableOpacity
            onPress={pickImage}
            disabled={uploadingImage}
            style={styles.profileImageWrapper}
          >
            {image ? (
              <Image
                source={{ uri: image }}
                style={styles.profileImage}
              />
            ) : (
              <View style={styles.profileImagePlaceholder}>
                <Text style={styles.profileImagePlaceholderText}>
                  {dataForm.name?.charAt(0)?.toUpperCase() || "?"}
                </Text>
              </View>
            )}
            
            <View style={styles.cameraIconContainer}>
              {uploadingImage ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Feather name="camera" size={16} color="#fff" />
              )}
            </View>
          </TouchableOpacity>
          
          <Text style={styles.changePhotoText}>Change Profile Photo</Text>
        </View>
        
        <View style={styles.formContainer}>
          <InputField
            icon={<Feather name="user" size={20} color="#6A5ACD" />}
            placeholder="Enter your name"
            value={dataForm.name}
            onChangeText={(text) => updateField("name", text)}
          />
          
          <CustomDropdown
            icon={<MaterialIcons name="person-outline" size={20} color="#6A5ACD" />}
            placeholder="Select your gender"
            data={genderList}
            value={dataForm.gender}
            onChange={(item) => updateField("gender", item.value)}
          />
          
          <TouchableOpacity
            style={styles.datePickerButton}
            onPress={showDatePicker}
          >
            <View style={styles.iconContainer}>
              <Feather name="calendar" size={20} color="#6A5ACD" />
            </View>
            <Text style={styles.datePickerText}>
              {dataForm.birth_date?.toLocaleDateString("en-GB") || "Select birth date"}
            </Text>
          </TouchableOpacity>
          
          <DateTimePickerModal
            isVisible={isDatePickerVisible}
            mode="date"
            maximumDate={minDate}
            onConfirm={handleConfirm}
            onCancel={hideDatePicker}
          />
          
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            <LinearGradient
              colors={['#6A5ACD', '#9370DB']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButtonGradient}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.submitButtonText}>SAVE CHANGES</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#666",
    fontFamily: "raleway-medium",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontFamily: "raleway-bold",
    color: "#333",
  },
  rightPlaceholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 20,
  },
  logo: {
    width: 60,
    height: 60,
  },
  profileImageContainer: {
    alignItems: "center",
    marginTop: 24,
  },
  profileImageWrapper: {
    position: "relative",
  },
  profileImage: {
    width: wp(30),
    height: wp(30),
    borderRadius: wp(15),
  },
  profileImagePlaceholder: {
    width: wp(30),
    height: wp(30),
    borderRadius: wp(15),
    backgroundColor: "#E8E8FD",
    justifyContent: "center",
    alignItems: "center",
  },
  profileImagePlaceholderText: {
    fontSize: wp(12),
    color: "#6A5ACD",
    fontFamily: "raleway-bold",
  },
  cameraIconContainer: {
    position: "absolute",
    bottom: 0,
    right: 0,
    backgroundColor: "#6A5ACD",
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  changePhotoText: {
    marginTop: 12,
    color: "#6A5ACD",
    fontSize: 14,
    fontFamily: "raleway-medium",
  },
  formContainer: {
    padding: 24,
    marginTop: 16,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8FD",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  iconContainer: {
    width: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
    color: "#333",
    fontFamily: "raleway",
  },
  dropdownContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8FD",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  dropdown: {
    flex: 1,
    paddingRight: 16,
    paddingVertical: 8,
  },
  dropdownPlaceholder: {
    color: "#9E9E9E",
    fontSize: 16,
    fontFamily: "raleway",
  },
  dropdownSelectedText: {
    color: "#333",
    fontSize: 16,
    fontFamily: "raleway",
  },
  dropdownItemText: {
    color: "#333",
    fontSize: 16,
    fontFamily: "raleway",
  },
  dropdownListContainer: {
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#FFFFFF",
    marginTop: 8,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  datePickerButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8F8FD",
    borderRadius: 12,
    marginBottom: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  datePickerText: {
    flex: 1,
    paddingVertical: 16,
    paddingRight: 16,
    fontSize: 16,
    color: "#333",
    fontFamily: "raleway",
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 12,
    overflow: "hidden",
    shadowColor: "#6A5ACD",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonGradient: {
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "raleway-bold",
    letterSpacing: 1,
  },
});

export default EditProfile;