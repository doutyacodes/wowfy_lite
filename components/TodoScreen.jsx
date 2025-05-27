// TodoScreen.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import axios from "axios";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  RefreshControl,
  TouchableOpacity,
  Image,
  SafeAreaView,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { baseURL } from "../backend/baseData";
import TopBar from "./AppComponents/TopBar";
import TaskHomeCard from "./TaskHomeCard";
import { useQuery, useQueryClient } from '@tanstack/react-query';

const TodoScreen = () => {
  const navigation = useNavigation();
  const layout = useWindowDimensions();
  const queryClient = useQueryClient();
  const isFocused = useIsFocused();

  const [user, setUser] = useState(null);
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "inProgress", title: "In Progress" },
    { key: "arena", title: "Arena" },
  ]);

  // Fetch user data from AsyncStorage
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

  // Query function for In-Progress tasks
  const fetchTodoTasks = async () => {
    if (!user) return [];
    const response = await axios.get(
      `${baseURL}/getAlltodoTasks.php?user_id=${user.id}`
    );
    return response.data.tasks || [];
  };

  // Query function for Arena tasks
  const fetchArenaTasks = async () => {
    if (!user) return [];
    const response = await axios.get(
      `${baseURL}/getArenaTodos.php?user_id=${user.id}`
    );
    return response.data.tasks || [];
  };

  // Use React Query for in-progress tasks
  const {
    data: todoData = [],
    isLoading: isTodoLoading,
    refetch: refetchTodo,
    isRefetching: isRefetchingTodo,
  } = useQuery({
    queryKey: ['todoTasks', user?.id],
    queryFn: fetchTodoTasks,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Use React Query for arena tasks
  const {
    data: arenaTodo = [],
    isLoading: isArenaLoading,
    refetch: refetchArena,
    isRefetching: isRefetchingArena,
  } = useQuery({
    queryKey: ['arenaTasks', user?.id],
    queryFn: fetchArenaTasks,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Refetch data when the screen is focused
  useEffect(() => {
    if (isFocused && user) {
      refetchTodo();
      refetchArena();
    }
  }, [isFocused, user, refetchTodo, refetchArena]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    if (index == 0) {
      refetchTodo();
    } else {
      refetchArena();
    }
  }, [index, refetchTodo, refetchArena]);

  const isLoading = isTodoLoading || isArenaLoading;
  const isRefreshing = isRefetchingTodo || isRefetchingArena;

  const EmptyListComponent = ({ message }) => (
    <View style={styles.emptyContainer}>
      <Ionicons name="list-outline" size={60} color="#dadada" />
      <Text style={styles.emptyText}>{message}</Text>
    </View>
  );

  const InProgressRoute = () => (
    <View style={styles.tabContent}>
      {isTodoLoading ? (
        <ActivityIndicator size="large" color="#6366f1" />
      ) : (
        <FlatList
          data={todoData}
          keyExtractor={(item, index) => `inprogress-${item.challenge_id}-${index}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetchingTodo}
              onRefresh={() => refetchTodo()}
              colors={["#6366f1"]}
            />
          }
          ListEmptyComponent={
            <EmptyListComponent message="No in-progress tasks found" />
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => <TaskHomeCard item={item} />}
        />
      )}
    </View>
  );

  const ArenaRoute = () => (
    <View style={styles.tabContent}>
      {isArenaLoading ? (
        <ActivityIndicator size="large" color="#6366f1" />
      ) : (
        <FlatList
          data={arenaTodo}
          keyExtractor={(item, index) => `arena-${item.challenge_id}-${index}`}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetchingArena}
              onRefresh={() => refetchArena()}
              colors={["#6366f1"]}
            />
          }
          ListEmptyComponent={
            <EmptyListComponent message="No arena tasks available" />
          }
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          renderItem={({ item }) => <TaskHomeCard item={item} />}
        />
      )}
    </View>
  );

  const renderScene = SceneMap({
    inProgress: InProgressRoute,
    arena: ArenaRoute,
  });

  const renderTabBar = (props) => (
    <TabBar
      {...props}
      indicatorStyle={styles.tabIndicator}
      style={styles.tabBar}
      renderLabel={({ route, focused }) => (
        <Text
          style={[styles.tabLabel, focused ? styles.tabLabelFocused : {}]}
        >
          {route.title}
        </Text>
      )}
    />
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#f9fafb", "#f3f4f6"]} style={styles.container}>
        <TopBar user={user} />

        <TabView
          navigationState={{ index, routes }}
          renderScene={renderScene}
          onIndexChange={setIndex}
          initialLayout={{ width: layout.width }}
          renderTabBar={renderTabBar}
          style={styles.tabView}
        />

        <StatusBar style="dark" />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: hp(2),
    paddingHorizontal: wp(5),
  },
  pageTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  pageTitleText: {
    fontSize: hp(3),
    fontFamily: "raleway-bold",
    color: "#111827",
  },
  addButton: {
    backgroundColor: "#6366f1",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 4,
  },
  tabView: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: "transparent",
    elevation: 0,
    shadowOpacity: 0,
    borderRadius: 8,
    marginHorizontal: wp(5),
    marginVertical: hp(1),
  },
  tabIndicator: {
    backgroundColor: "#6366f1",
    height: 3,
    borderRadius: 3,
  },
  tabLabel: {
    fontSize: hp(1.8),
    fontFamily: "raleway-bold",
    color: "#6b7280",
    textTransform: "none",
  },
  tabLabelFocused: {
    color: "#111827",
  },
  tabContent: {
    flex: 1,
    paddingHorizontal: wp(5),
  },
  listContainer: {
    paddingVertical: hp(1),
    paddingBottom: hp(10),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: hp(10),
  },
  emptyText: {
    marginTop: hp(2),
    fontSize: hp(1.8),
    color: "#9ca3af",
    fontFamily: "raleway-bold",
  },
});

export default TodoScreen;