import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import axios from "axios";
import { CameraView, useCameraPermissions } from "expo-camera";
import LottieView from "lottie-react-native";
import { useEffect, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";
import AwesomeAlert from "react-native-awesome-alerts";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseURL } from "../backend/baseData";

export default function BarCodeScreen() {
  const [facing, setFacing] = useState("back");
  const [permission, requestPermission] = useCameraPermissions();
  const isFocused = useIsFocused();
  const [selectedMovie, setSelectedMovie] = useState([]);
  const [challenge, setChallenge] = useState([]);
  const navigation = useNavigation();
  const [showAlert, setShowAlert] = useState(false);
  const [pending, setPending] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [firstTime, setFirstTime] = useState(false);

  const [user, setUser] = useState(null);
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

  const handleBarcodeScanned = (scanningResult) => {
    // Vibration.vibrate(100);
    const scannedData = scanningResult.data.toLowerCase();
    const url = new URL(scannedData);
    const type = url.searchParams.get("type");
    if (type == "challenge") {
      const challenge_id = url.searchParams.get("challenge_id");
      const page_id = url.searchParams.get("page_id");
      if (challenge_id && type && page_id) {
        const fetchMovie = async () => {
          try {
            if (!user?.id) {
              // If user or user.id doesn't exist, skip the fetch
              return;
            }

            const response = await axios.get(
              `${baseURL}/getDetailsInnerpageChallenge.php?id=${page_id}&userId=${user?.id}&challenge_id=${challenge_id}`
            );

            if (response.status == 200) {
              setSelectedMovie(response.data);
              if (response.data.completed == "yes") {
                setCompleted(true);
              }
              if (response.data.pending == "yes") {
                setPending(true);
              }
              if (response.data.first_time == "yes") {
                setFirstTime(true);
              }
              setShowAlert(true);
              // console.log(response.data);
            } else {
              console.error("Failed to fetch challenge");
            }
          } catch (error) {
            console.error("Error while fetching challenge:", error.message);
          }
        };

        fetchMovie();
        const fetchChallenge = async () => {
          try {
            if (!user?.id) {
              // If user or user.id doesn't exist, skip the fetch
              return;
            }

            const response = await axios.get(
              `${baseURL}/getChallengeOne.php?challenge_id=${challenge_id}&user_id=${user?.id}`
            );

            if (response.status == 200) {
              setChallenge(response.data);
            } else {
              console.error("Failed to fetch page details");
            }
          } catch (error) {
            console.error("Error while fetching page details:", error.message);
          }
        };

        fetchChallenge();
      }
    } else if (type == "page") {
      const page_id = url.searchParams.get("page_id");
      // console.log(type)
      navigation.navigate("Moviehome", {
        movieId: page_id,
        now: "yes",
      });
    } else {
      console.log(type);
    }
  };

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
  let heading = "Challenge Completed Already";
  let messageForUser =
    "The challenge you were looking for has already been completed by you or the challenge is already over.";
  let AcceptBtn = "Ok";

  if (completed) {
    heading = "Challenge Completed Already";
    messageForUser =
      "The challenge you were looking for has already been completed by you or the challenge is already over.";
    let AcceptBtn = "Ok";
  } else if (firstTime) {
    heading = "Welcome to the New Challenge";
    messageForUser =
      "You are about to enter a new challenge. Do you wish to proceed?";
    AcceptBtn = "Yes";
  } else if (pending) {
    heading = "Finish Your Challenge";
    messageForUser =
      "You have already started this challenge. Do you wish to continue?";
    AcceptBtn = "Yes";
  }
  const handleNavigation = () => {
    setShowAlert(false);

    if (completed) {
      setShowAlert(false);
    } else if (firstTime) {
      navigation.navigate("ChallengeDetails", {
        challenge: challenge,
        selectedMovie: selectedMovie,
      });
    } else if (pending) {
      navigation.navigate("ChallengesList", {
        challenge: challenge,
        selectedMovie: selectedMovie,
      });
    }
  };

  return (
    <View style={styles.container}>
      {isFocused && !showAlert ? (
        <CameraView
          style={styles.camera}
          facing={facing}
          barcodeScannerSettings={{
            barcodeTypes: ["qr"],
          }}
          onBarcodeScanned={handleBarcodeScanned}
        >
          <View style={{ flex: 1, alignItems: "center", marginTop: hp(20) }}>
            <LottieView
              source={require("../assets/animation/qr.json")}
              style={{ width: wp(80), height: wp(80) }}
              autoPlay
              loop
            />
          </View>
        </CameraView>
      ) : null}
      <View
        style={{
          flex: 1,
          alignItems: "center",
          position: "absolute",
          marginTop: hp(20),
        }}
      >
        <AwesomeAlert
          show={showAlert}
          showProgress={false}
          title={heading}
          message={messageForUser}
          closeOnTouchOutside={true}
          closeOnHardwareBackPress={true}
          showCancelButton={true}
          showConfirmButton={true}
          cancelText="Cancel"
          confirmText={AcceptBtn}
          confirmButtonColor="#DD6B55"
          onCancelPressed={() => setShowAlert(false)}
          onConfirmPressed={() => {
            handleNavigation();
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
  },
  camera: {
    flex: 1,
  },
});
