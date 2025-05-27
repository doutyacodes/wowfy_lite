import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import {
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
  RefreshControl,
  Animated,
  StatusBar,
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { baseURL } from "../backend/baseData";
import NotificationItem from "./NotificationComponent/NotificationItem";

const NotificationScreen = () => {
  const [user, setUser] = useState(null);
  const [notificationDetails, setNotificationDetails] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasNewNotifications, setHasNewNotifications] = useState(false);
  const navigation = useNavigation();
  
  // Animation values
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  
  const { top } = useSafeAreaInsets();
  const paddingTop = Platform.OS == "android" ? StatusBar.currentHeight + 10 : 0;
  
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const storedUser = await AsyncStorage.getItem("user");
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
          
          // if (parsedUser?.steps == 1) {
            navigation.navigate("DetailSignup");
          // }
        } else {
          navigation.navigate("OtpVerification");
        }
      } catch (error) {
        console.error("Error while fetching user:", error.message);
      }
    };

    fetchUser();
  }, [navigation]);
  
  const fetchNotifications = async () => {
    if (!user) return;
    
    try {
      const response = await axios.get(
        `${baseURL}/getNotification.php?userId=${user.id}`
      );

      if (response.status == 200) {
        setNotificationDetails(response.data);
        
        // Check for unread notifications
        const hasUnread = response.data.some(item => item.seen == "no");
        setHasNewNotifications(hasUnread);
        
        // Start animations after data is loaded
        Animated.parallel([
          Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(slideAnim, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } catch (error) {
      console.error("Error while fetching notifications:", error.message);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };
  
  const markNotificationsAsSeen = async () => {
    if (!user) return;
    
    try {
      await axios.get(`${baseURL}/notificationSeen.php?userId=${user.id}`);
      setHasNewNotifications(false);
    } catch (error) {
      console.error("Error marking notifications as seen:", error.message);
    }
  };
  
  useEffect(() => {
    if (user) {
      fetchNotifications();
      
      // Mark notifications as seen after 2 seconds
      const timer = setTimeout(() => {
        markNotificationsAsSeen();
      }, 2000);
      
      return () => clearTimeout(timer);
    }
  }, [user]);
  
  const onRefresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };
  
  const renderHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Ionicons name="chevron-back" size={24} color="#111827" />
      </TouchableOpacity>
      
      <Text style={styles.headerTitle}>Notifications</Text>
      
      <TouchableOpacity
        style={styles.filterButton}
        disabled
      >
        {/* <Ionicons name="options-outline" size={22} color="#6366f1" /> */}
      </TouchableOpacity>
    </View>
  );
  
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="bell-off-outline" size={80} color="#e5e7eb" />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptyMessage}>
        You don't have any notifications yet. We'll notify you when something important happens.
      </Text>
      <TouchableOpacity
        style={styles.refreshButton}
        onPress={onRefresh}
      >
        <Ionicons name="refresh" size={18} color="#6366f1" />
        <Text style={styles.refreshButtonText}>Refresh</Text>
      </TouchableOpacity>
    </View>
  );
  
  const renderItem = ({ item, index }) => (
    <Animated.View
      style={[
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <NotificationItem item={item} index={index} />
    </Animated.View>
  );
  
  const renderSeparator = () => <View style={styles.separator} />;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
      
      {renderHeader()}
      
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading notifications...</Text>
        </View>
      ) : (
        <FlatList
          data={notificationDetails}
          renderItem={renderItem}
          keyExtractor={(item, index) => `notification-${index}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={renderSeparator}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#6366f1"]}
              tintColor="#6366f1"
            />
          }
        />
      )}
      
      {hasNewNotifications && (
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)', '#ffffff']}
          style={styles.buttonGradient}
        >
          <TouchableOpacity
            style={styles.markAsReadButton}
            onPress={markNotificationsAsSeen}
          >
            <Text style={styles.markAsReadText}>Mark all as read</Text>
          </TouchableOpacity>
        </LinearGradient>
      )}
    </SafeAreaView>
  );
};

export default NotificationScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop:25,
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: hp(2.3),
    fontFamily: "raleway-bold",
    color: "#111827",
  },
  filterButton: {
    width:0,
    height:0
  },
  listContent: {
    paddingHorizontal: wp(4),
    paddingTop: hp(1),
    paddingBottom: hp(10),
    flexGrow: 1,
  },
  separator: {
    height: 1,
    backgroundColor: "#f1f5f9",
    marginVertical: hp(1.5),
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loadingText: {
    marginTop: hp(2),
    fontSize: hp(1.8),
    fontFamily: "raleway",
    color: "#6b7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyTitle: {
    fontSize: hp(2.2),
    fontFamily: "raleway-bold",
    color: "#111827",
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  emptyMessage: {
    fontSize: hp(1.7),
    fontFamily: "raleway",
    color: "#6b7280",
    textAlign: "center",
    lineHeight: hp(2.4),
    marginBottom: hp(3),
    paddingHorizontal: wp(5),
  },
  refreshButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(4),
    borderRadius: 8,
  },
  refreshButtonText: {
    fontSize: hp(1.7),
    fontFamily: "raleway-bold",
    color: "#6366f1",
    marginLeft: wp(2),
  },
  buttonGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: hp(5),
    paddingBottom: hp(3),
    paddingHorizontal: wp(4),
    alignItems: "center",
  },
  markAsReadButton: {
    backgroundColor: "#6366f1",
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(6),
    borderRadius: 10,
    shadowColor: "#6366f1",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 6,
  },
  markAsReadText: {
    color: "#ffffff",
    fontSize: hp(1.8),
    fontFamily: "raleway-bold",
  },
});