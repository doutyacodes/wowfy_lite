// ArenaScreen.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import axios from "axios";
import { LinearGradient } from "expo-linear-gradient";
import * as Location from "expo-location";
import { StatusBar } from "expo-status-bar";
import LottieView from "lottie-react-native";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { SceneMap } from "react-native-tab-view";
import { baseURL } from "../backend/baseData";
import { GOOGLE_MAPS_APIKEY } from "../constants";
import ChallengeHomeCard from "./ChallengeHomeCard";
import { useQuery, useQueryClient } from '@tanstack/react-query';

const ArenaScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const isFocused = useIsFocused();

  const [user, setUser] = useState(null);
  const [location, setLocation] = useState(null);
  const [errorMsg, setErrorMsg] = useState(null);
  const [district, setDistrict] = useState(null);
  
  // Fetch user from AsyncStorage
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

  // Get location and district
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        setErrorMsg("Permission to access location was denied");
        return;
      }

      let location = await Location.getCurrentPositionAsync({});
      setLocation(location);

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
      }
    })();
  }, []);

  // Refetch queries when screen is focused
  useEffect(() => {
    if (isFocused) {
      queryClient.invalidateQueries(['leaderData']);
      if (user && district) {
        queryClient.invalidateQueries(['challenges', user.id, district]);
        queryClient.invalidateQueries(['totalPoints', user.id]);
      }
    }
  }, [isFocused, user, district, queryClient]);

  // Query for leaderboard data
  const { data: leaderData = [] } = useQuery({
    queryKey: ['leaderData'],
    queryFn: async () => {
      const response = await axios.get(`${baseURL}/getArenaLeader.php`);
      if (response.status == 200) {
        return response.data.data || [];
      }
      throw new Error('Failed to fetch arena leader');
    },
    enabled: isFocused
  });

  // Query for challenges
  const { data: filterChallenges = [] } = useQuery({
    queryKey: ['challenges', user?.id, district],
    queryFn: async () => {
      const response = await axios.get(
        `${baseURL}/getArenaChallenge.php?userId=${user.id}&district=${district}`
      );
      if (response.status == 200) {
        return response.data.challenges || [];
      }
      throw new Error('Failed to fetch arena challenges');
    },
    enabled: !!user && !!district && isFocused
  });

  // Query for total points
  const { data: count = 0 } = useQuery({
    queryKey: ['totalPoints', user?.id],
    queryFn: async () => {
      const response = await axios.get(
        `${baseURL}/totalPoints.php?user_id=${user.id}`
      );
      if (response.status == 200) {
        return response.data.total_points;
      }
      throw new Error('Failed to fetch total points');
    },
    enabled: !!user && isFocused
  });

  let text = "Waiting..";
  if (errorMsg) {
    text = errorMsg;
  } else if (location) {
    text = `Latitude: ${location.coords.latitude}, Longitude: ${location.coords.longitude}`;
    if (district) {
      text += `\nDistrict: ${district}`;
    }
  }

  const FirstRoute = () => (
    <View style={{ flex: 1, height: "100%", width: "100%" }}>
      <FlatList
        data={filterChallenges}
        keyExtractor={(item, index) => index}
        contentContainerStyle={styles.moviesContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={
          <View>
            <View style={{ height: 5 }} />
          </View>
        }
        renderItem={({ index, item }) => (
          <ChallengeHomeCard
            challenge={item}
            user={user}
            key={index}
            index={index}
            arena={"yes"}
            district={district}
          />
        )}
      />
    </View>
  );

  const ThirdRoute = () => (
    <View style={{ flex: 1, backgroundColor: "white", padding: 15 }}>
      <View>
        <Text
          style={{
            fontSize: hp(1.4),
            color: "#898989",
            fontFamily: "raleway-bold",
          }}
        >
          Total {leaderData?.length > 0 ? leaderData?.length : 0} Partcipants
        </Text>
      </View>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginTop: 10,
        }}
      >
        <Text
          style={{
            fontSize: hp(1.8),
            color: "#898989",
            fontFamily: "raleway-bold",
          }}
        >
          Ranking
        </Text>
        <Text
          style={{
            fontSize: hp(1.8),
            color: "#898989",
            fontFamily: "raleway-bold",
          }}
        >
          Points
        </Text>
      </View>
      <View>
        <FlatList
          data={leaderData}
          keyExtractor={(item) => item.ranking.toString()}
          contentContainerStyle={styles.moviesContainer}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={
            <View>
              <View style={{ height: 10 }} />
            </View>
          }
          renderItem={({ index, item }) => (
            <View>
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <Text
                    style={{
                      fontSize: hp(1.9),
                      fontFamily: "raleway-bold",
                      width: wp(8),
                    }}
                  >
                    {item.ranking}
                  </Text>
                  <View style={styles.avatarContainer}>
                    <Text style={styles.avatarText}>
                      {item.first_character}
                    </Text>
                  </View>
                  <View style={styles.detailsContainer}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.date}>
                      {/* Spent {item.time_spent} */}
                    </Text>
                  </View>
                </View>
                <View>
                  <Text
                    style={{
                      fontSize: hp(2.2),
                      fontFamily: "raleway-bold",
                    }}
                  >
                    {item.total_points}
                  </Text>
                </View>
              </View>
            </View>
          )}
        />
      </View>
    </View>
  );
  const renderScene = SceneMap({
    first: FirstRoute,
    third: ThirdRoute,
  });

  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "first", title: "Challenges" },
    { key: "third", title: "Leaderboard" },
  ]);
  return (
    <View style={styles.container}>
      <LinearGradient
        // Background Linear Gradient
        colors={["blue", "rgba(186, 85, 211, 1)"]}
        style={{ position: "absolute", height: hp(100), width: wp(100) }}
      />
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <LottieView
          source={require("../assets/animation/soon.json")}
          style={{ width: wp(100), height: hp(100) }}
          autoPlay
          loop
        />
      </View>
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
    // marginTop: 50,
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
  titleContainer: {
    backgroundColor: "#E32636",
    width: "100%",
    marginTop: 15,
  },
  title: {
    fontSize: 25,
    fontFamily: "raleway-bold",
    color: "white",
    padding: 10,
    textAlign: "center",
  },
  selectedMoviesContainer: {
    marginTop: 15,
  },
  movieInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: {
    marginLeft: 10,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  selectedMovieBlock: {
    width: "100%",
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "grey",
    padding: 5,
  },
  moviesContainer: {
    paddingTop: 20,
    width: "100%",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  selectedMovieImage: {
    width: 30,
    height: 40,
    borderRadius: 5,
  },
  caption: {
    fontSize: 14,
    color: "black",
  },
  latestMediaContainer: {
    marginTop: 10,
    backgroundColor: "lightgrey",
    height: 150,
    width: "100%",
    borderRadius: 10,
  },
  selectedMovieName: {
    fontSize: 14,
    fontFamily: "raleway-bold",
    color: "black",
  },
  pointsText: {
    fontSize: 14,
  },
  avatarText: {
    fontFamily: "raleway-bold",
    color: "white",
    fontSize: wp(5),
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
  containerStyle: {
    margin: 20,
    backgroundColor: "white",
    padding: 20,
    borderRadius: 20,
  },
});

export default ArenaScreen;