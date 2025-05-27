import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  StatusBar,
  useWindowDimensions,
  SafeAreaView,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { TabView, TabBar } from "react-native-tab-view";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { 
  AntDesign, 
  Feather, 
  MaterialCommunityIcons, 
  Ionicons 
} from "@expo/vector-icons";
import wowfy_white from "../assets/logos/wowfy_white.png";

// Reward Card Component
const RewardCard = ({ item, onPress }) => {
  const statusColors = {
    pending: { color: "#FF9800", icon: "clock" },
    approved: { color: "#4CAF50", icon: "check-circle" },
    rejected: { color: "#F44336", icon: "x-circle" },
    claimed: { color: "#2196F3", icon: "gift" },
  };
  
  const status = item.status.toLowerCase();
  const statusInfo = statusColors[status] || statusColors.pending;
  
  return (
    <TouchableOpacity 
      style={styles.rewardCard} 
      onPress={onPress}
      activeOpacity={0.9}
    >
      <LinearGradient
        colors={['#6938ef', '#8F6AFF']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.rewardCardGradient}
      >
        <View style={styles.rewardCardContent}>
          <View style={styles.rewardCardLeft}>
            <Text style={styles.rewardTitle}>{item.title}</Text>
            {item.comment && (
              <Text style={styles.rewardComment}>{item.comment}</Text>
            )}
          </View>
          
          <View style={styles.rewardCardRight}>
            <Text style={styles.rewardPoints}>{item.reward_points}</Text>
            <Text style={styles.rewardPointsLabel}>points</Text>
          </View>
        </View>
        
        <View style={styles.rewardCardFooter}>
          <View style={[styles.rewardStatusBadge, { backgroundColor: statusInfo.color }]}>
            <Feather name={statusInfo.icon} size={12} color="white" style={styles.rewardStatusIcon} />
            <Text style={styles.rewardStatusText}>{status.charAt(0).toUpperCase() + status.slice(1)}</Text>
          </View>
          
          <Text style={styles.rewardDate}>{item.date || "May 15, 2023"}</Text>
        </View>
      </LinearGradient>
    </TouchableOpacity>
  );
};

// Available Rewards Component
const AvailableRewards = () => {
  const availableRewards = [
    {
      id: "1",
      title: "Free Movie Ticket",
      description: "Redeem for a free movie ticket at any partner theater",
      points: 500,
      image: "ticket",
    },
    {
      id: "2",
      title: "Coffee Voucher",
      description: "Free coffee at any partner cafe",
      points: 300,
      image: "coffee",
    },
    {
      id: "3",
      title: "Amazon Gift Card",
      description: "$10 Amazon gift card for your online shopping",
      points: 1000,
      image: "gift",
    },
    {
      id: "4",
      title: "Premium Subscription",
      description: "1 month of premium subscription",
      points: 800,
      image: "star",
    },
  ];
  
  const renderRewardItem = ({ item }) => (
    <TouchableOpacity style={styles.availableRewardCard} activeOpacity={0.8}>
      <View style={styles.availableRewardIcon}>
        <MaterialCommunityIcons 
          name={item.image} 
          size={30} 
          color="#6938ef" 
        />
      </View>
      
      <View style={styles.availableRewardContent}>
        <Text style={styles.availableRewardTitle}>{item.title}</Text>
        <Text style={styles.availableRewardDescription} numberOfLines={2}>
          {item.description}
        </Text>
      </View>
      
      <View style={styles.availableRewardPoints}>
        <Text style={styles.availableRewardPointsValue}>{item.points}</Text>
        <Text style={styles.availableRewardPointsLabel}>points</Text>
        <TouchableOpacity style={styles.claimButton}>
          <Text style={styles.claimButtonText}>Claim</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );
  
  return (
    <View style={styles.tabContent}>
      <FlatList
        data={availableRewards}
        renderItem={renderRewardItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.availableRewardsList}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

// Featured Rewards Component
const FeaturedRewards = () => {
  const featuredRewards = [
    {
      id: "1",
      title: "VIP Movie Premiere",
      description: "Get exclusive access to upcoming movie premieres",
      points: 1500,
      bgColor: ["#FF4B2B", "#FF416C"],
    },
    {
      id: "2",
      title: "Celebrity Meet & Greet",
      description: "Meet your favorite celebrity at special events",
      points: 5000,
      bgColor: ["#11998e", "#38ef7d"],
    },
  ];
  
  return (
    <View style={styles.tabContent}>
      <Text style={styles.featuredHeading}>Limited Time Offers</Text>
      
      {featuredRewards.map((reward) => (
        <TouchableOpacity key={reward.id} style={styles.featuredCard} activeOpacity={0.9}>
          <LinearGradient
            colors={reward.bgColor}
            style={styles.featuredCardGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <View style={styles.featuredCardContent}>
              <View>
                <MaterialCommunityIcons name="star-circle" size={40} color="rgba(255,255,255,0.9)" />
                <Text style={styles.featuredTitle}>{reward.title}</Text>
                <Text style={styles.featuredDescription}>{reward.description}</Text>
              </View>
              
              <View style={styles.featuredPoints}>
                <Text style={styles.featuredPointsValue}>{reward.points}</Text>
                <Text style={styles.featuredPointsLabel}>points</Text>
                <TouchableOpacity style={styles.featuredClaimButton}>
                  <Text style={styles.featuredClaimText}>Claim Now</Text>
                </TouchableOpacity>
              </View>
            </View>
          </LinearGradient>
        </TouchableOpacity>
      ))}
      
      <AvailableRewards />
    </View>
  );
};

// History Component
const HistoryRewards = () => {
  const historyData = [
    {
      title: "Amazon Gift Card",
      reward_points: 1000,
      status: "approved",
      date: "June 5, 2023",
    },
    {
      title: "Premium Subscription",
      reward_points: 800,
      status: "claimed",
      date: "May 22, 2023",
    },
    {
      title: "Movie Ticket",
      reward_points: 500,
      status: "pending",
      comment: "Processing your request",
      date: "May 15, 2023",
    },
    {
      title: "Coffee Voucher",
      reward_points: 300,
      status: "rejected",
      comment: "Expired promotion",
      date: "April 30, 2023",
    },
  ];
  
  return (
    <View style={styles.tabContent}>
      <FlatList
        data={historyData}
        renderItem={({ item }) => <RewardCard item={item} />}
        keyExtractor={(item, index) => `history-${index}`}
        contentContainerStyle={styles.historyList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={() => (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="history" size={60} color="#E0E0E0" />
            <Text style={styles.emptyStateTitle}>No rewards history</Text>
            <Text style={styles.emptyStateSubtitle}>
              Your claimed rewards will appear here
            </Text>
          </View>
        )}
      />
    </View>
  );
};

const RewardScreen = () => {
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "featured", title: "Featured" },
    { key: "available", title: "Available" },
    { key: "history", title: "History" },
  ]);
  
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [hp(30), hp(20)],
    extrapolate: 'clamp',
  });
  
  const opacityRange = scrollY.interpolate({
    inputRange: [0, 60, 100],
    outputRange: [1, 0.5, 0],
    extrapolate: 'clamp',
  });
  
  // Render the scene for each tab
  const renderScene = ({ route }) => {
    switch (route.key) {
      case "featured":
        return <FeaturedRewards />;
      case "available":
        return <AvailableRewards />;
      case "history":
        return <HistoryRewards />;
      default:
        return null;
    }
  };
  
  // Custom tab bar
  const renderTabBar = (props) => (
    <TabBar
      {...props}
      indicatorStyle={styles.tabIndicator}
      style={styles.tabBar}
      labelStyle={styles.tabLabel}
      activeColor="#6938ef"
      inactiveColor="#888888"
      renderLabel={({ route, focused, color }) => (
        <Text style={[styles.tabLabel, { color }]}>
          {route.title}
        </Text>
      )}
    />
  );
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar translucent backgroundColor="transparent" barStyle="light-content" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={["#6938ef", "#8F6AFF"]}
          style={styles.headerGradient}
        >
          <View style={styles.appLogoContainer}>
            <Image source={wowfy_white} style={styles.appLogo} />
          </View>
          
          <Animated.View style={[styles.headerContent, { opacity: opacityRange }]}>
            <Text style={styles.headerTitle}>Rewards</Text>
            <Text style={styles.headerSubtitle}>Earn and redeem points</Text>
          </Animated.View>
          
          <View style={styles.pointsCardContainer}>
            <View style={styles.pointsCard}>
              <LinearGradient
                colors={["#FFFFFF", "#F8F8F8"]}
                style={styles.pointsCardGradient}
              >
                <View style={styles.pointsCardContent}>
                  <View style={styles.starContainer}>
                    <AntDesign name="star" size={hp(7)} color="#FFD700" />
                  </View>
                  
                  <View style={styles.pointsInfo}>
                    <Text style={styles.pointsValue}>365</Text>
                    <Text style={styles.pointsLabel}>Available Points</Text>
                  </View>
                </View>
                
                <TouchableOpacity style={styles.earnMoreButton}>
                  <Text style={styles.earnMoreButtonText}>Earn More</Text>
                  <Feather name="chevron-right" size={16} color="#6938ef" />
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        </LinearGradient>
      </Animated.View>
      
      {/* Tab View */}
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        renderTabBar={renderTabBar}
        style={styles.tabView}
        onSwipeStart={() => {}}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FD",
  },
  header: {
    width: "100%",
    overflow: "hidden",
  },
  headerGradient: {
    flex: 1,
    paddingTop: StatusBar.currentHeight || 0,
  },
  appLogoContainer: {
    alignItems: "center",
    marginTop: hp(3),
  },
  appLogo: {
    height: hp(5),
    width: hp(5),
    resizeMode: "contain",
  },
  headerContent: {
    paddingHorizontal: 20,
    paddingTop: hp(2),
  },
  headerTitle: {
    fontSize: hp(3),
    fontFamily: "raleway-bold",
    color: "white",
  },
  headerSubtitle: {
    fontSize: hp(1.8),
    fontFamily: "raleway",
    color: "rgba(255, 255, 255, 0.8)",
    marginTop: 5,
  },
  pointsCardContainer: {
    paddingHorizontal: 20,
    paddingTop: hp(2),
    paddingBottom: hp(2),
  },
  pointsCard: {
    borderRadius: 16,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  pointsCardGradient: {
    borderRadius: 16,
  },
  pointsCardContent: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  starContainer: {
    marginRight: 16,
  },
  pointsInfo: {
    flex: 1,
  },
  pointsValue: {
    fontSize: hp(3),
    fontFamily: "raleway-bold",
    color: "#333",
  },
  pointsLabel: {
    fontSize: hp(1.8),
    fontFamily: "raleway",
    color: "#888",
    marginTop: 2,
  },
  earnMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#EEE",
  },
  earnMoreButtonText: {
    fontSize: hp(1.8),
    fontFamily: "raleway-bold",
    color: "#6938ef",
    marginRight: 4,
  },
  tabView: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: "white",
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  tabLabel: {
    fontSize: hp(1.8),
    fontFamily: "raleway-bold",
    textTransform: "none",
  },
  tabIndicator: {
    backgroundColor: "#6938ef",
    height: 3,
  },
  tabContent: {
    flex: 1,
    backgroundColor: "#F8F9FD",
  },
  
  // History tab styles
  historyList: {
    padding: 16,
  },
  rewardCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  rewardCardGradient: {
    borderRadius: 16,
  },
  rewardCardContent: {
    flexDirection: "row",
    padding: 16,
  },
  rewardCardLeft: {
    flex: 1,
  },
  rewardTitle: {
    fontSize: hp(2),
    fontFamily: "raleway-bold",
    color: "white",
    marginBottom: 6,
  },
  rewardComment: {
    fontSize: hp(1.6),
    fontFamily: "raleway",
    color: "rgba(255, 255, 255, 0.8)",
  },
  rewardCardRight: {
    alignItems: "center",
    justifyContent: "center",
  },
  rewardPoints: {
    fontSize: hp(2.5),
    fontFamily: "raleway-bold",
    color: "white",
  },
  rewardPointsLabel: {
    fontSize: hp(1.4),
    fontFamily: "raleway",
    color: "rgba(255, 255, 255, 0.8)",
  },
  rewardCardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "rgba(0, 0, 0, 0.1)",
  },
  rewardStatusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  rewardStatusIcon: {
    marginRight: 4,
  },
  rewardStatusText: {
    fontSize: hp(1.4),
    fontFamily: "raleway-bold",
    color: "white",
  },
  rewardDate: {
    fontSize: hp(1.4),
    fontFamily: "raleway",
    color: "rgba(255, 255, 255, 0.8)",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 30,
    marginTop: 50,
  },
  emptyStateTitle: {
    fontSize: hp(2.2),
    fontFamily: "raleway-bold",
    color: "#333",
    marginTop: 20,
  },
  emptyStateSubtitle: {
    fontSize: hp(1.8),
    fontFamily: "raleway",
    color: "#888",
    marginTop: 10,
    textAlign: "center",
  },
  
  // Available Rewards tab styles
  availableRewardsList: {
    padding: 16,
  },
  availableRewardCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  availableRewardIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(105, 56, 239, 0.1)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 16,
  },
  availableRewardContent: {
    flex: 1,
    justifyContent: "center",
  },
  availableRewardTitle: {
    fontSize: hp(1.9),
    fontFamily: "raleway-bold",
    color: "#333",
    marginBottom: 6,
  },
  availableRewardDescription: {
    fontSize: hp(1.6),
    fontFamily: "raleway",
    color: "#888",
    lineHeight: hp(2.2),
  },
  availableRewardPoints: {
    justifyContent: "center",
    alignItems: "center",
    paddingLeft: 16,
  },
  availableRewardPointsValue: {
    fontSize: hp(2.2),
    fontFamily: "raleway-bold",
    color: "#6938ef",
  },
  availableRewardPointsLabel: {
    fontSize: hp(1.4),
    fontFamily: "raleway",
    color: "#888",
    marginBottom: 8,
  },
  claimButton: {
    backgroundColor: "rgba(105, 56, 239, 0.1)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  claimButtonText: {
    fontSize: hp(1.5),
    fontFamily: "raleway-bold",
    color: "#6938ef",
  },
  
  // Featured Rewards tab styles
  featuredHeading: {
    fontSize: hp(2.2),
    fontFamily: "raleway-bold",
    color: "#333",
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 12,
  },
  featuredCard: {
    borderRadius: 16,
    overflow: "hidden",
    marginHorizontal: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  featuredCardGradient: {
    padding: 20,
  },
  featuredCardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  featuredTitle: {
    fontSize: hp(2.2),
    fontFamily: "raleway-bold",
    color: "white",
    marginTop: 12,
    marginBottom: 8,
  },
  featuredDescription: {
    fontSize: hp(1.6),
    fontFamily: "raleway",
    color: "rgba(255, 255, 255, 0.8)",
    maxWidth: wp(50),
    lineHeight: hp(2.2),
  },
  featuredPoints: {
    alignItems: "center",
    justifyContent: "center",
  },
  featuredPointsValue: {
    fontSize: hp(2.6),
    fontFamily: "raleway-bold",
    color: "white",
  },
  featuredPointsLabel: {
    fontSize: hp(1.4),
    fontFamily: "raleway",
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 12,
  },
  featuredClaimButton: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  featuredClaimText: {
    fontSize: hp(1.6),
    fontFamily: "raleway-bold",
    color: "white",
  },
});

export default RewardScreen;