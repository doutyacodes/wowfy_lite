// BuzzwallScreen.js
import { AntDesign, Entypo } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useIsFocused,
  useNavigation,
} from "@react-navigation/native";
import axios from "axios";
import { StatusBar } from "expo-status-bar";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Divider, PaperProvider } from "react-native-paper";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL, baseURL } from "../backend/baseData";
import TopBar from "./AppComponents/TopBar";
import ChallengeHomeCard from "./ChallengeHomeCard";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

const BuzzwallScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [textDataBottom, setTextDataBottom] = useState("");
  const [isVisibleModal, setIsVisibleModal] = useState(false);
  const [see, setSee] = useState(false);
  const [user, setUser] = useState(null);
  const isFocused = useIsFocused();
  const [loginData, setLoginData] = useState([]);
  const [goldStar, setGoldStar] = useState(0);
  const [grayStar, setGrayStar] = useState(7);
  const [currentPage, setCurrentPage] = useState(0);
  const swiperRef = useRef(null);

  // Fetch user from AsyncStorage
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          // if (parsedUser?.steps == 1) {
            // navigation.navigate("DetailSignup");
          // }
        } else {
          navigation.navigate("OtpVerification");
        }
      } catch (error) {
        console.error("Error while fetching user:", error.message);
      }
    };

    fetchUser();

    const fetchData = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("buzzwall");
        if ((storedUser || isVisibleModal) && storedUser) {
          setSee(false);
        } else {
          setSee(true);
        }
      } catch (error) {
        console.error("Error while fetching buzzwall setting:", error.message);
      }
    };

    fetchData();
  }, []);

  // Query for buzzwall challenges
  const {
    data: filterChallenges = [],
    isLoading: challengesLoading,
    refetch: refetchChallenges
  } = useQuery({
    queryKey: ['buzzwallChallenges', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      
      const response = await axios.get(
        `${baseURL}/getBuzzWall.php?userId=${user.id}`
      );
      
      return response.data;
    },
    enabled: !!user?.id,
    // This ensures data updates whenever this screen is focused
    refetchOnMount: true,
    refetchOnWindowFocus: true,
  });

  // Query for instructions
  const {
    data: instructionData = [],
    isLoading: instructionsLoading,
  } = useQuery({
    queryKey: ['instructions', 'buzzwall'],
    queryFn: async () => {
      const response = await axios.get(
        `${baseURL}/getInstructions.php?type=buzzwall`
      );
      
      return response.data.data;
    },
  });

  // Mutation for daily login
  const dailyLoginMutation = useMutation({
    mutationFn: async (userId) => {
      const response = await axios.post(
        `${baseURL}/dailyLoginApi.php`,
        {
          user_id: userId,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );
      return response.data;
    },
    onSuccess: (data) => {
      if (data.already_logged == "no") {
        setLoginData(data);
        setIsVisibleModal(true);
        const goldValue = parseInt(data.login_count);
        setGoldStar(goldValue);
        setGrayStar(7 - goldValue);
      }
    }
  });

  // Run the login mutation when user data is available
  useEffect(() => {
    if (user?.id) {
      dailyLoginMutation.mutate(user.id);
    }
  }, [user]);

  // Refetch data when screen is focused
  useEffect(() => {
    if (isFocused && user?.id) {
      refetchChallenges();
    }
  }, [isFocused, user]);

  const goToNextPage = (index) => {
    if (index <= instructionData?.length) {
      if (swiperRef.current) {
        swiperRef.current.scrollToIndex({ index: index + 1, animated: true });
      }
    }
  };

  const FirstRoute = () => (
    <PaperProvider style={{ flex: 1, height: "100%", width: "100%" }}>
      <FlatList
        data={filterChallenges}
        keyExtractor={(item, index) => `challenge-${index}`}
        contentContainerStyle={styles.moviesContainer}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={
          <View>
            <View style={{ height: 15 }} />
          </View>
        }
        ListEmptyComponent={() => (
          <View className="flex-1 flex justify-center p-3 items-center">
            {challengesLoading ? (
              <ActivityIndicator size="large" color="red" />
            ) : (
              <TouchableOpacity
                onPress={() => navigation.navigate("SearchScreen")}
                className=" justify-center items-center border border-dashed border-stone-300 p-6 space-y-6 rounded-2xl bg-white shadow-md shadow-stone-300"
                style={{
                  height: hp(40),
                  width: "100%",
                }}
              >
                <AntDesign name="pluscircleo" size={hp(10)} color="#a8a29e" />

                <Text className="text-stone-300 text-xl text-center">
                  Search Pages
                </Text>
              </TouchableOpacity>
            )}
          </View>
        )}
        renderItem={({ index, item }) => (
          <ChallengeHomeCard
            challenge={item}
            user={user}
            key={index}
            index={index}
            arena={null}
          />
        )}
      />
    </PaperProvider>
  );

  const { width, height } = Dimensions.get("window");
  
  return (
    <View style={styles.container}>
      <View style={{ alignItems: "center" }}>
        <TopBar marginTop={40} user={user} />
      </View>
      <Divider />
      <View style={styles.titleContainer}>
        <Text style={styles.title}>BUZZ WALL</Text>
      </View>
      <FirstRoute />

      <StatusBar style="light" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
  topLogo: {
    height: 50,
    width: 50,
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
    backgroundColor: "#fc9419",
    width: "100%",
    position: "relative",
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
  containerStyle: {
    backgroundColor: "transparent",
    padding: 20,
    shadowColor: "transparent",
  },
});

export default BuzzwallScreen;