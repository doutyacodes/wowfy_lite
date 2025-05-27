import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { Card } from "react-native-paper";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { useQuery } from '@tanstack/react-query';
import { baseImgURL, baseURL } from "../backend/baseData";
import TopBar from "./AppComponents/TopBar";
import TaskCard from "./TaskCard";

const ChallengesList = ({ route }) => {
  const navigation = useNavigation();
  const { selectedMovie, challenge } = route.params;
  const [user, setUser] = useState(null);

  // Fetch user data from AsyncStorage
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Error while fetching user:", error.message);
      }
    };

    fetchUser();
  }, []);

  // Use TanStack Query to fetch tasks
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['allTasks', challenge.challenge_id, user?.id],
    queryFn: async () => {
      const response = await axios.get(
        `${baseURL}/getAllTasks.php?challenge_id=${challenge.challenge_id}&user_id=${user.id}`
      );
      return response.data.tasks;
    },
    enabled: !!user?.id && !!challenge.challenge_id, // Only run query when we have both IDs
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchOnWindowFocus: true,
  });

  return (
    <View style={styles.container}>
      <View style={{ position: "relative" }}>
        <View style={[styles.LinearGradient, { zIndex: -10 }]}>
          <Image
            source={{ uri: `${baseImgURL + selectedMovie.banner}` }}
            style={{ height: "100%", width: "100%", resizeMode: "cover" }}
          />
        </View>
        <View
          style={[
            styles.LinearGradient,
            {
              zIndex: -5,
              backgroundColor: "black",
              opacity: Platform.OS == "ios" ? 0.6 : 0.8,
            },
          ]}
        />

        <TopBar color={"white"} user={user} />
        <View style={{ padding: 15 }}>
          <View
            style={{
              flexDirection: "row",
              justifyContent: "space-between",
            }}
          >
            <View
              style={{
                flexDirection: "row",
                gap: 5,
                alignItems: "center",
              }}
            >
              <View>
                <View
                  style={[
                    {
                      padding: 3,
                      backgroundColor: "orange",
                      borderRadius: 120,
                    },
                  ]}
                >
                  <View
                    style={{
                      justifyContent: "center",
                      alignItems: "center",
                      height: wp(20),
                      width: wp(20),
                      backgroundColor: "white",
                      borderRadius: 50,
                      position: "relative",
                    }}
                  >
                    {selectedMovie.image?.length > 0 && (
                      <Image
                        source={{
                          uri: `${baseImgURL + selectedMovie.image}`,
                        }}
                        style={{
                          width: wp(20),
                          height: wp(20),
                          borderRadius: 50,
                          resizeMode: "contain",
                          backgroundColor: "white",
                        }}
                      />
                    )}
                  </View>
                </View>
              </View>
              <View style={{ gap: 7 }}>
                <Text
                  style={{
                    fontSize: hp(2.2),
                    fontFamily: "raleway-bold",
                    color: "white",
                  }}
                >
                  {selectedMovie.title}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading tasks...</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            Could not load tasks. Please try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => refetch()}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <Card style={styles.card}>
          <FlatList
            data={data}
            keyExtractor={(item, index) => `task-${index}-${item.task_id}`}
            contentContainerStyle={styles.tasksContainer}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No tasks available</Text>
              </View>
            }
            renderItem={({ index, item }) => {
              // Check if the challenge type is "ordered"
              const isOrdered = challenge.challenge_type == "ordered";

              // If ordered, ensure previous tasks are completed
              const previousCompleted =
                index == 0 || (data[index - 1]?.completed == true);

              // Determine if the task should be disabled
              const isDisabled =
                isLoading ||
                (isOrdered && !previousCompleted);

              return (
                <TaskCard
                  item={item}
                  index={index}
                  disabled={isDisabled}
                  userId={user?.id}
                />
              );
            }}
          />
        </Card>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: hp(1.5),
    fontSize: hp(1.8),
    fontFamily: 'raleway',
    color: '#6b7280',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  errorText: {
    fontSize: hp(1.8),
    fontFamily: 'raleway',
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: hp(2),
  },
  retryButton: {
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(6),
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: hp(1.8),
    fontFamily: 'raleway-bold',
    color: '#ffffff',
  },
  emptyContainer: {
    padding: hp(5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontSize: hp(1.8),
    fontFamily: 'raleway',
    color: '#6b7280',
    textAlign: 'center',
  },
  LinearGradient: {
    position: "absolute",
    width: "100%",
    height: "100%",
  },
  card: {
    flex: 1,
    width: wp(95),
    marginTop: 10,
  },
  tasksContainer: {
    paddingTop: 20,
    width: "100%",
    justifyContent: "space-between",
    paddingHorizontal: 10,
    paddingBottom: hp(4),
  },
});

export default ChallengesList;