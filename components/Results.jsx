// Results.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  useFocusEffect,
  useIsFocused,
  useNavigation,
  useRoute,
} from "@react-navigation/native";
import axios from "axios";
import React, { useCallback, useEffect, useState } from "react";
import { FlatList, StyleSheet, View } from "react-native";
import { baseURL } from "../backend/baseData";
import RewardCard from "./RewardCard";

const Results = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { movieId } = route.params;
  const isFocused = useIsFocused();
  const [seletcedRewards, setSelectedRewards] = useState([]);
  const [user, setUser] = useState(null);
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
  useFocusEffect(
    useCallback(() => {
      const fetchRewards = async () => {
        try {
          // Only fetch rewards if user data is available
          if (user) {
            const response = await axios.get(
              `${baseURL}/getUserRewards.php?page_id=${movieId}&user_id=${user.id}`
            );

            if (response.status == 200) {
              setSelectedRewards(response.data);
              // console.log(response.data);
            } else {
              console.error("Failed to fetch rewards");
            }
          }
        } catch (error) {
          console.error("Error while fetching rewards:", error.message);
        }
      };

      fetchRewards();
    }, [isFocused, user, movieId])
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={seletcedRewards}
        keyExtractor={(item) => item.reward_id}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={
          <View>
            <View style={{ height: 10 }} />
          </View>
        }
        renderItem={({ index, item }) => (
          <RewardCard item={item} index={index} key={index} />
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  text: {
    fontSize: 18,
    fontFamily: "raleway-bold",
  },
});

export default Results;
