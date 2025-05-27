// Home.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect, useNavigation } from "@react-navigation/native";
import axios from "axios";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
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

import { FontAwesome6 } from "@expo/vector-icons";
import * as Location from "expo-location";
import { GOOGLE_MAPS_APIKEY } from "../constants";
import TopBar from "./AppComponents/TopBar";

const Home = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [nowData, setNowData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [district, setDistrict] = useState("");

  const fetchLocation = async () => {
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== "granted") {
      setErrorMsg("Permission to access location was denied");
      return;
    }

    let location = await Location.getCurrentPositionAsync({});
    setLocation(location);
    // console.log(location)
    setIsLoading(true);

    // Reverse geocoding to get the district
    try {
      const response = await axios.get(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.coords.latitude},${location.coords.longitude}&key=${GOOGLE_MAPS_APIKEY}`
      );
      const addressComponents = response.data.results[0].address_components;
      const districtComponent = addressComponents.find((component) =>
        component.types.includes("administrative_area_level_3")
      );
      setDistrict(districtComponent.long_name);
    } catch (error) {
      console.error("Error fetching district:", error);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchLocation();
  }, []);

  let text = "Waiting..";
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = `Latitude: ${location.coords.latitude}, Longitude: ${location.coords.longitude}`;
    if (district) {
      text += `\nDistrict: ${district}`;
    }
  }
  useFocusEffect(
    useCallback(() => {
      const fetchallenge = async () => {
        if (district) {
          setIsLoading(true);
          try {
            // Only fetch rewards if user data is available
            const response = await axios.get(
              `${baseURL}/getOnePage.php?district=${district}`
            );

            if (response.status == 200) {
              // setNowData(response.data);
              console.log(response?.data?.data?.id);
              if (response?.data?.data?.id) {
                navigation.navigate("Moviehome", {
                  movieId: response?.data?.data?.id,
                  now: "yes",
                });
              }
            } else {
              console.error("Failed to fetch now");
            }
          } catch (error) {
            console.error("Error while fetching now:", error.message);
          } finally {
            setIsLoading(false);
          }
        }
      };
      fetchallenge();
    }, [district])
  );

  // Function to open the bottom sheet
  // console.log(district)
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
          // console.log(storedUser);
        } else {
          navigation.navigate("OtpVerification");
        }
      } catch (error) {
        console.error("Error while fetching user:", error.message);
      }
    };

    fetchUser();
  }, []);

  return (
    <View style={styles.container}>
      {!location && !isLoading ? (
        <View
          style={[
            {
              flex: 1,
              justifyContent: "flex-end",
              position: "relative",
              padding: 15,
              gap: 20,
            },
          ]}
        >
          <Text
            style={{
              fontSize: hp(3),
              color: "white",
              fontWeight: "bold",
            }}
          >
            Grant Location Permissions
          </Text>
          <Text
            style={{
              fontSize: hp(2),
              color: "white",
              fontWeight: "500",
              textAlign: "center",
            }}
          >
            To provide you with tailored services and relevant information,
            Wowfy needs access to your device's location!
          </Text>
          <View
            style={{
              flex: 1,
              zIndex: -10,
              backgroundColor: "black",
              opacity: Platform.OS == "ios" ? 0.6 : 0.8,
              height: hp(100),
              width: wp(100),
              position: "absolute",
            }}
          />
          <Image
            source={require("../assets/images/location1.jpeg")}
            style={{
              flex: 1,
              position: "absolute",
              height: hp(100),
              width: wp(100),
              zIndex: -15,
            }}
          />
          <TouchableOpacity
            style={{
              marginBottom: 50,
              padding: 20,
              backgroundColor: "#e77721",
              borderRadius: 10,
            }}
            onPress={fetchLocation}
          >
            <Text
              style={{
                fontSize: hp(2),
                color: "white",
                fontWeight: "bold",
                textAlign: "center",
              }}
            >
              Continue
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <View style={{ alignItems: "center" }}>
            <TopBar marginTop={40} user={user} />

            {district && (
              <View style={{ position: "relative" }}>
                <View>
                  <Text
                    style={{
                      marginBottom: 15,
                      fontSize: hp(2),
                      fontFamily: "raleway-bold",
                    }}
                  >
                    <FontAwesome6
                      name="location-dot"
                      size={hp(2)}
                      color="gray"
                    />{" "}
                    {district}
                  </Text>
                </View>
              </View>
            )}
          </View>
          {isLoading && (
            <View
              style={{
                flex: 1,
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <ActivityIndicator size="large" color="red" />
            </View>
          )}
        </>
      )}

      <StatusBar style="dark" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topLogo: {
    height: 50,
    width: 50,
    // marginRight:15
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20,
    marginTop: 10,
  },
  settingsIcon: {
    padding: 1,
    position: "relative",
    zIndex: 800,
    flexDirection: "row",
    gap: 20,
    alignItems: "center",
  },
  searchBar: {
    flex: 1,
    marginRight: 10,
    backgroundColor: "lightgrey",
    borderRadius: 20,
    padding: 10,
    height: 40,
  },
  searchInput: {
    flex: 1,
  },
  title: {
    fontSize: 25,
    fontFamily: "raleway-bold",
    color: "white",
    padding: 10,
    textAlign: "center",
  },

  moviesContainer: {
    // paddingTop: 20,
    width: "100%",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  avatarContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: wp(15),
    width: wp(15),
    backgroundColor: "#ff8f8e",
    borderRadius: 50,
  },
  detailsContainer: {
    gap: 5,
  },
  name: {
    fontSize: hp(1.9),
    fontFamily: "raleway-bold",
  },
  date: {
    fontSize: hp(1.8),
    color: "#898989",
  },
});

export default Home;
