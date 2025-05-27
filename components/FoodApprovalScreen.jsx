import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import axios from "axios";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Button,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseURL } from "../backend/baseData";
export default function FoodApprovalScreen({ route }) {
  const { item, completed_id } = route.params;

  const [facing, setFacing] = useState("back");
  const [isLoading, setIsLoading] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const cameraRef = useRef(null);
  const [photoUri, setPhotoUri] = useState(null);
  const [user, setUser] = useState(null);
  const takePicture = async () => {
    if (cameraRef) {
      const photo = await cameraRef.current.takePictureAsync();
      setPhotoUri(photo);
      //   console.log(uri);
    }
  };
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
  }, []);

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: "center" }}>
          We need your permission to show the camera
        </Text>
        <Button onPress={requestPermission} title="Grant Permission" />
      </View>
    );
  }
  function toggleCameraFacing() {
    setFacing((current) => (current == "back" ? "front" : "back"));
  }
  const submitSave = async () => {
    if (!photoUri) {
      Alert.alert("Oops!", "You need to take a cute selfie first! 📸");
      return;
    }

    try {
      setIsLoading(true);
      const formData = new FormData();

      // Append captured image
      formData.append("imageFile", {
        uri: photoUri.uri,
        type: "image/jpeg",
        name: `selfies_${Date.now()}.jpg`,
      });
      // console.log(formData._parts);
      // Append other parameters from route.params
      formData.append("user_id", user?.id);
      formData.append("challenge_id", item.challenge_id);
      formData.append("moderator_id", item.store_id);
      formData.append("page_id", item.page_id);
      formData.append("completed_id", completed_id);

      // Make an Axios request to your PHP backend API
      const response = await axios.post(
        `${baseURL}/add-approval.php`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      console.log("API Response:", response.data);
      if (response.data.success) {
        setPhotoUri(null);

        navigation.navigate("Moviehome", {
          movieId: item.page_id,
        });
      }

      // Navigate to the desired screen
    } catch (error) {
      console.error("Error submitting data:", error);
    } finally {
      setIsLoading(false);
    }
  };
  return (
    <View style={styles.container}>
      {isFocused &&
        (!photoUri ? (
          <CameraView
            ref={cameraRef}
            style={styles.camera}
            facing={facing}
          ></CameraView>
        ) : (
          <>
            <Image
              source={{ uri: photoUri.uri }}
              style={{
                // ...styles.camera,
                height: hp(70),
                transform: [{ scaleX: facing == "front" ? -1 : 1 }],
              }}
            />
          </>
        ))}

      <View
        style={{ width: wp(100), height: hp(30), backgroundColor: "black" }}
      >
        <View style={{ width: wp(100), flex: 1 }}>
          <View
            style={{ height: 5, width: wp(100), backgroundColor: "white" }}
          />
          <View
            style={{
              flex: 1,
              justifyContent: "space-between",
              alignItems: "center",
              flexDirection: "row",
              padding: 10,
            }}
          >
            <TouchableOpacity
              style={{ minHeight: hp(5), minWidth: hp(5) }}
              onPress={() => setPhotoUri(null)}
              disabled={!photoUri ? true : false}
            >
              {photoUri && (
                <MaterialIcons name="close" size={hp(5)} color="white" />
              )}
            </TouchableOpacity>
            <TouchableOpacity
              style={{
                padding: 5,
                backgroundColor: "white",
                borderRadius: 100,
              }}
              onPress={takePicture}
            >
              <View
                style={{
                  height: hp(5),
                  width: hp(5),
                  backgroundColor: "white",
                  borderRadius: 100,
                  borderWidth: 1,
                }}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={toggleCameraFacing}>
              <MaterialIcons
                name="flip-camera-ios"
                size={hp(5)}
                color="white"
              />
            </TouchableOpacity>
          </View>
        </View>
        <View style={{ marginBottom: hp(2.9), padding: 10, width: wp(100) }}>
          {photoUri && (
            <TouchableOpacity
              style={{
                backgroundColor: "#F2613F",
                padding: 10,
                paddingHorizontal: 20,
                borderRadius: 12,
                alignSelf: "center",
                flexDirection: "row",
                gap: 15,
              }}
              onPress={submitSave}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Text style={{ color: "white", fontSize: hp(2) }}>
                    Submiting
                  </Text>
                  <ActivityIndicator size="small" color="white" />
                </>
              ) : (
                <Text style={{ color: "white", fontSize: hp(2) }}>Submit</Text>
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // justifyContent: "center",
    backgroundColor: "black",
  },
  camera: {
    flex: 1,
  },
});
