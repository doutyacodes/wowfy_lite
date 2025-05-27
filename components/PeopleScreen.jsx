// PeopleScreen.js
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import axios from "axios";
import { StatusBar } from "expo-status-bar";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
  Animated,
  Image,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { Ionicons, FontAwesome } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { baseURL } from "../backend/baseData";
import TopBar from "./AppComponents/TopBar";
import CertificateList from "./CertificateList";
import { useQuery, useQueryClient } from '@tanstack/react-query';

const PeopleScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const scrollY = new Animated.Value(0);
  const isFocused = useIsFocused();
  const queryClient = useQueryClient();

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

  // People data fetch function for React Query
  const fetchPeople = async () => {
    if (!user) return [];
    
    const response = await axios.get(
      `${baseURL}/getBuzzPeople.php?userId=${user.id}`
    );
    
    return response.data || [];
  };

  // Use React Query to manage data fetching
  const {
    data: peopleData = [],
    isLoading,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ['people', user?.id],
    queryFn: fetchPeople,
    enabled: !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes cache
  });

  // Refetch data when the screen is focused
  useEffect(() => {
    if (isFocused && user) {
      refetch();
    }
  }, [isFocused, user, refetch]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(() => {
    refetch();
  }, [refetch]);

  // Animation for header opacity on scroll
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  // Empty state component
  const EmptyListComponent = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="people-outline" size={70} color="#e0e0e0" />
      <Text style={styles.emptyPrimaryText}>No Connections Found</Text>
      <Text style={styles.emptySecondaryText}>
        Start exploring to connect with others
      </Text>
      <TouchableOpacity
        style={styles.emptyButton}
        onPress={() => navigation.navigate("SearchScreen")}
      >
        <Text style={styles.emptyButtonText}>Explore Now</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient colors={["#f9fafb", "#f3f4f6"]} style={styles.container}>
        <Animated.View style={[styles.headerBlur, { opacity: headerOpacity }]}>
          <BlurView intensity={80} tint="light" style={styles.blurContent} />
        </Animated.View>

        <TopBar user={user} />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.searchBar}
            onPress={() => navigation.navigate("SearchScreen")}
          >
            <Ionicons
              name="search-outline"
              size={20}
              color="#9ca3af"
              style={styles.searchIcon}
            />
            <Text style={styles.searchPlaceholder}>Explore Connections...</Text>
          </TouchableOpacity>
        </View>

        {isLoading && !isRefetching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        ) : (
          <Animated.FlatList
            data={peopleData}
            keyExtractor={(item, index) => `person-${item.people_data_id || index}`}
            contentContainerStyle={styles.peopleContainer}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={isRefetching}
                onRefresh={onRefresh}
                colors={["#6366f1"]}
              />
            }
            ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
            renderItem={({ item, index }) => (
              <CertificateList
                item={item}
                index={index}
                user_id={user?.id}
                arena={null}
              />
            )}
            ListEmptyComponent={!isLoading ? <EmptyListComponent /> : null}
            onScroll={Animated.event(
              [{ nativeEvent: { contentOffset: { y: scrollY } } }],
              { useNativeDriver: true }
            )}
          />
        )}

        <TouchableOpacity
          style={styles.fabButton}
          onPress={() => navigation.navigate("SearchScreen")}
        >
          <Ionicons name="people" size={24} color="#ffffff" />
        </TouchableOpacity>

        <StatusBar style="dark" />
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerBlur: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: hp(16),
    zIndex: 1,
  },
  blurContent: {
    ...StyleSheet.absoluteFillObject,
  },
  header: {
    paddingTop: hp(2),
    paddingHorizontal: wp(5),
    zIndex: 2,
  },
  pageTitle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: hp(2),
    marginBottom: hp(1.5),
  },
  pageTitleText: {
    fontSize: hp(3),
    fontFamily: "raleway-bold",
    color: "#111827",
  },
  filterButton: {
    padding: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#ffffff",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ffffff",
    paddingVertical: hp(1.4),
    paddingHorizontal: wp(4),
    borderRadius: 12,
    marginBottom: hp(1),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchPlaceholder: {
    color: "#9ca3af",
    fontFamily: "raleway",
    fontSize: hp(1.7),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  peopleContainer: {
    paddingTop: hp(1),
    paddingBottom: hp(10),
    paddingHorizontal: wp(5),
  },
  emptyContainer: {
    paddingVertical: hp(10),
    alignItems: "center",
    justifyContent: "center",
  },
  emptyPrimaryText: {
    marginTop: hp(2),
    fontFamily: "raleway-bold",
    fontSize: hp(2.2),
    color: "#374151",
  },
  emptySecondaryText: {
    marginTop: hp(1),
    fontFamily: "raleway",
    fontSize: hp(1.7),
    color: "#6b7280",
    textAlign: "center",
    maxWidth: "80%",
  },
  emptyButton: {
    marginTop: hp(3),
    backgroundColor: "#6366f1",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(8),
    borderRadius: 8,
  },
  emptyButtonText: {
    color: "#ffffff",
    fontFamily: "raleway-bold",
    fontSize: hp(1.7),
  },
  fabButton: {
    position: "absolute",
    bottom: hp(3),
    right: wp(5),
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#6366f1",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
    zIndex: 10,
  },
});

export default PeopleScreen;