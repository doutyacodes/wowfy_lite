import {
  AntDesign,
  Entypo,
  FontAwesome,
  FontAwesome6,
  Ionicons,
  MaterialIcons,
} from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDrawerStatus } from "@react-navigation/drawer";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL, baseURL } from "../backend/baseData";
import { useQuery, useQueryClient } from '@tanstack/react-query';

const CustomDrawer = () => {
  const [user, setUser] = useState(null);
  const isFocused = useIsFocused();
  const navigation = useNavigation();
  const isDrawerOpen = useDrawerStatus() == "open";
  const queryClient = useQueryClient();

  // Fetch user data from AsyncStorage
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userString = await AsyncStorage.getItem("user");
        if (userString) {
          setUser(JSON.parse(userString));
        }
      } catch (error) {
        console.error("Error fetching user from AsyncStorage:", error.message);
      }
    };

    fetchUserData();
  }, []);

  // Use React Query for profile data
  const { 
    data: userData = {}, 
    isLoading: isProfileLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['userProfile', user?.id],
    queryFn: async () => {
      if (!user?.id) return {};
      const response = await axios.get(`${baseURL}/getOtherUser.php?user_id=${user.id}`);
      return response.data || {};
    },
    enabled: !!user?.id && isDrawerOpen,
    staleTime: 1000 * 60 * 1, // 1 minute
    refetchInterval: isDrawerOpen ? 10000 : false, // Auto-refresh every 10 seconds if drawer is open
  });

  // Refresh user data when drawer opens
  useEffect(() => {
    if (isDrawerOpen && user?.id) {
      queryClient.invalidateQueries(['userProfile', user.id]);
    }
  }, [isDrawerOpen, user?.id, queryClient]);

  const handleLogout = async () => {
    try {
      await AsyncStorage.removeItem("user");
      navigation.navigate("OtpVerification");
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const MenuButton = ({ icon, title, onPress, iconComponent: IconComponent = MaterialIcons, iconColor = "#4F46E5", disabled = false }) => (
    <TouchableOpacity 
      onPress={onPress} 
      style={[styles.menuButton, disabled && styles.menuButtonDisabled]}
      activeOpacity={disabled ? 1 : 0.7}
      disabled={disabled}
    >
      <View style={styles.menuButtonInner}>
        <View style={[styles.iconContainer, { backgroundColor: `${iconColor}10` }]}>
          <IconComponent 
            name={icon} 
            size={hp(2.5)} 
            color={iconColor} 
          />
        </View>
        <Text style={[styles.menuButtonText, disabled && styles.menuButtonTextDisabled]}>
          {title}
        </Text>
        <View style={styles.arrowContainer}>
          <Ionicons 
            name="chevron-forward" 
            size={hp(2)} 
            color={disabled ? "#CBD5E1" : "#94A3B8"} 
          />
        </View>
      </View>
    </TouchableOpacity>
  );

  if (!user) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Profile Header */}
      <LinearGradient
        colors={['#4F46E5', '#3730A3']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.profileHeader}
      >
        {isProfileLoading ? (
          <View style={styles.loadingProfile}>
            <ActivityIndicator size="small" color="#FFFFFF" />
          </View>
        ) : (
          <>
            <TouchableOpacity 
              style={styles.profileImageContainer}
              onPress={() => navigation.navigate("OtherUserScreen", { user_id: user?.id })}
              activeOpacity={0.8}
            >
              {userData.user_image?.length > 0 ? (
                <Image
                  source={{ uri: `${baseImgURL + userData.user_image}` }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.profilePlaceholder}>
                  <Text style={styles.profilePlaceholderText}>
                    {userData.first_character || user?.name?.charAt(0)?.toUpperCase() || "?"}
                  </Text>
                </View>
              )}
              <View style={styles.editBadge}>
                <Ionicons name="pencil" size={hp(1.2)} color="#FFFFFF" />
              </View>
            </TouchableOpacity>

            <Text style={styles.profileName}>{userData.name || user?.name || "User"}</Text>

            <View style={styles.statsContainer}>
              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => navigation.navigate("FriendsScreen", { user: user })}
              >
                <Text style={styles.statNumber}>{userData.followers || 0}</Text>
                <Text style={styles.statLabel}>Followers</Text>
              </TouchableOpacity>

              <View style={styles.statDivider} />

              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => navigation.navigate("FriendsScreen", { user: user })}
              >
                <Text style={styles.statNumber}>{userData.following || 0}</Text>
                <Text style={styles.statLabel}>Following</Text>
              </TouchableOpacity>

              <View style={styles.statDivider} />

              <TouchableOpacity 
                style={styles.statItem}
                onPress={() => navigation.navigate("FriendsScreen", { user: user })}
              >
                <Text style={styles.statNumber}>{userData.friends_count || 0}</Text>
                <Text style={styles.statLabel}>Friends</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </LinearGradient>

      {/* Menu Scroll View */}
      <ScrollView 
        style={styles.menuContainer}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.menuContentContainer}
      >
        <MenuButton 
          icon="user-circle-o" 
          title="My Profile" 
          onPress={() => navigation.navigate("OtherUserScreen", { user_id: user?.id })}
          iconComponent={FontAwesome}
          iconColor="#4F46E5" // Indigo
        />
        <MenuButton 
          icon="user-plus" 
          title="Referral Challenges" 
          onPress={() => navigation.navigate("ReferralPage")}
          iconComponent={FontAwesome}
          iconColor="#F97316" // Orange
        />
        <MenuButton 
          icon="perm-media" 
          title="Add Posts" 
          onPress={() => navigation.navigate("UserPost", { user_id: user?.id })}
          iconColor="#10B981" // Green
        />
        <MenuButton 
          icon="circle-info" 
          title="About Us" 
          onPress={() => {/* TODO: Implement About Us Screen */}}
          iconComponent={FontAwesome6}
          iconColor="#6366F1" // Purple
        />
        <MenuButton 
          icon="phone" 
          title="Contact Us" 
          onPress={() => {/* TODO: Implement Contact Us Screen */}}
          iconComponent={Entypo}
          iconColor="#EC4899" // Pink
        />
        <MenuButton 
          icon="questioncircle" 
          title="FAQ" 
          onPress={() => navigation.navigate("FaqScreen")}
          iconComponent={AntDesign}
          iconColor="#0EA5E9" // Light blue
        />
        <MenuButton 
          icon="settings" 
          title="Settings" 
          onPress={() => {/* TODO: Implement Settings Screen */}}
          iconColor="#6B7280" // Gray
        />
        
        <View style={styles.logoutSection}>
          <MenuButton 
            icon="logout" 
            title="Logout" 
            onPress={handleLogout}
            iconComponent={MaterialIcons}
            iconColor="#EF4444" // Red
          />
        </View>
      </ScrollView>
      
      {/* Version info */}
      <View style={styles.versionContainer}>
        <Text style={styles.versionText}>Version 1.0.0</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  loadingProfile: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileHeader: {
    paddingTop: Platform.OS == 'ios' ? 50 : 30,
    paddingBottom: 24,
    alignItems: 'center',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  profileImageContainer: {
    width: wp(24),
    height: wp(24),
    borderRadius: wp(12),
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 3,
    borderColor: 'rgba(255,255,255,0.4)',
    position: 'relative',
  },
  profileImage: {
    width: '100%',
    height: '100%',
    borderRadius: wp(12),
  },
  profilePlaceholder: {
    width: '100%',
    height: '100%',
    borderRadius: wp(12),
    backgroundColor: 'rgba(255,255,255,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profilePlaceholderText: {
    color: 'white',
    fontSize: wp(8),
    fontFamily: 'raleway-bold',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4F46E5',
    width: hp(2.8),
    height: hp(2.8),
    borderRadius: hp(1.4),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  profileName: {
    color: 'white',
    fontSize: hp(2.4),
    fontFamily: 'raleway-bold',
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '80%',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    color: 'white',
    fontSize: hp(2),
    fontFamily: 'raleway-bold',
  },
  statLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: hp(1.4),
    fontFamily: 'raleway',
    marginTop: 2,
  },
  statDivider: {
    height: hp(4),
    width: 1,
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  menuContainer: {
    flex: 1,
  },
  menuContentContainer: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 16,
  },
  menuButton: {
    marginBottom: 12,
    borderRadius: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  menuButtonDisabled: {
    opacity: 0.7,
  },
  menuButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  menuButtonText: {
    flex: 1,
    fontSize: hp(1.8),
    color: '#1E293B',
    fontFamily: 'raleway-semibold',
  },
  menuButtonTextDisabled: {
    color: '#94A3B8',
  },
  arrowContainer: {
    padding: 4,
  },
  logoutSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
  },
  versionContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
  },
  versionText: {
    color: '#94A3B8',
    fontSize: hp(1.4),
    fontFamily: 'raleway',
  },
});

export default CustomDrawer;