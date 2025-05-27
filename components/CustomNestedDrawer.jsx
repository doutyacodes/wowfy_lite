import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDrawerStatus } from "@react-navigation/drawer";
import { useIsFocused, useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useState, useRef } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
  TextInput,
  AccessibilityInfo,
  ScrollView,
  Platform,
  Animated,
} from "react-native";
import { Divider } from "react-native-paper";
import QRCode from "react-native-qrcode-svg";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL, baseURL } from "../backend/baseData";
import { Ionicons, MaterialCommunityIcons, Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useQuery, useQueryClient } from '@tanstack/react-query';

const AccordionItem = ({ 
  title, 
  icon, 
  isOpen, 
  onToggle, 
  children,
  itemCount,
  badgeColor
}) => {
  const accessibilityHint = isOpen 
    ? `Double tap to collapse ${title} section` 
    : `Double tap to expand ${title} section. Contains ${itemCount} items`;
  
  return (
    <View style={styles.accordionContainer}>
      <TouchableOpacity 
        style={[
          styles.accordionHeader,
          isOpen && styles.accordionHeaderActive
        ]} 
        onPress={onToggle}
        activeOpacity={0.7}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${title} section`}
        accessibilityHint={accessibilityHint}
        accessibilityState={{ expanded: isOpen }}
      >
        <View style={styles.accordionHeaderLeft}>
          <View style={[styles.iconContainer, { backgroundColor: badgeColor || '#4F46E5' }]}>
            <MaterialCommunityIcons name={icon} size={18} color="#FFF" />
          </View>
          <Text style={styles.accordionTitle}>{title}</Text>
        </View>
        
        <View style={styles.accordionHeaderRight}>
          {itemCount > 0 && (
            <View style={[styles.countBadge, { backgroundColor: badgeColor || '#4F46E5' }]}>
              <Text style={styles.countText}>{itemCount}</Text>
            </View>
          )}
          <Ionicons 
            name={isOpen ? "chevron-up" : "chevron-down"} 
            size={18} 
            color="#94a3b8" 
            accessibilityElementsHidden={true}
            importantForAccessibility="no"
          />
        </View>
      </TouchableOpacity>
      
      {isOpen && (
        <View 
          style={styles.accordionContent}
          accessibilityLiveRegion="polite" 
        >
          {children}
        </View>
      )}
    </View>
  );
};

const UserItem = ({ item, onPress, showCharBadge = false }) => {
  // Create an accessible label that describes the user
  const accessibilityLabel = `${item.name || "User"}`;
  const subInfo = item.info ? `. ${item.info}` : "";
  
  const badgeColor = showCharBadge ? "#4F46E5" : "#F97316";
  
  return (
    <TouchableOpacity
      style={styles.userItemContainer}
      onPress={onPress}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel + subInfo}
      accessibilityHint="Double tap to view profile"
    >
      {item.user_image?.length > 0 ? (
        <Image
          source={{ uri: `${baseImgURL + item.user_image}` }}
          style={styles.userAvatar}
          accessible={true}
          accessibilityLabel={`${item.name}'s profile picture`}
          accessibilityRole="image"
        />
      ) : (
        <View style={[
          styles.userAvatarPlaceholder,
          { backgroundColor: badgeColor }
        ]}>
          <Text style={styles.userAvatarText}>
            {item.first_character || item.name?.charAt(0)?.toUpperCase() || "?"}
          </Text>
        </View>
      )}
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.name}</Text>
        {item.info && (
          <Text style={styles.userSubInfo}>{item.info}</Text>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.userAction}
        onPress={onPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const PageItem = ({ item, onPress }) => {
  return (
    <TouchableOpacity
      style={styles.pageItemContainer}
      onPress={onPress}
      activeOpacity={0.7}
      accessible={true}
      accessibilityRole="button"
      accessibilityLabel={`Page: ${item.title}`}
      accessibilityHint={item.type ? `Type: ${item.type}. Double tap to open page` : "Double tap to open page"}
    >
      <Image
        source={{ uri: `${baseImgURL + item.icon}` }}
        style={styles.pageIcon}
        accessible={true}
        accessibilityLabel={`${item.title} page icon`}
        accessibilityRole="image"
      />
      <View style={styles.pageInfo}>
        <Text style={styles.pageName}>{item.title}</Text>
        {item.type && (
          <Text style={styles.pageType}>{item.type}</Text>
        )}
      </View>
      
      <TouchableOpacity 
        style={styles.pageAction}
        onPress={onPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <Ionicons name="chevron-forward" size={16} color="#94a3b8" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const EmptyState = ({ icon, message }) => (
  <View 
    style={styles.emptyStateContainer}
    accessible={true}
    accessibilityLabel={message}
  >
    <Feather name={icon} size={36} color="#94a3b8" />
    <Text style={styles.emptyStateText}>{message}</Text>
  </View>
);

const CustomNestedDrawer = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [user, setUser] = useState(null);
  const [activeAccordion, setActiveAccordion] = useState(null);
  const [isSearchActive, setIsSearchActive] = useState(false);
  
  const isFocused = useIsFocused();
  const isDrawerOpen = useDrawerStatus() == "open";
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const searchInputRef = useRef(null);
  const scrollViewRef = useRef(null);

  const toggleAccordion = (accordionId) => {
    const newActiveAccordion = activeAccordion == accordionId ? null : accordionId;
    setActiveAccordion(newActiveAccordion);
    
    // Scroll to make the accordion visible when opened
    if (newActiveAccordion && scrollViewRef.current) {
      // Add a delay to ensure the accordion content is rendered
      setTimeout(() => {
        scrollViewRef.current.scrollTo({ 
          y: getAccordionPosition(newActiveAccordion), 
          animated: true 
        });
      }, 100);
    }
    
    // Announce the accordion state change for screen readers
    if (newActiveAccordion) {
      AccessibilityInfo.announceForAccessibility(`${accordionId} section expanded`);
    } else {
      AccessibilityInfo.announceForAccessibility(`${accordionId} section collapsed`);
    }
  };

  const getAccordionPosition = (accordionId) => {
    // These are approximate positions based on component hierarchy
    switch (accordionId) {
      case 'pages': return 0;
      case 'friends': return 200;
      case 'followers': return 400;
      case 'following': return 600;
      default: return 0;
    }
  };

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

  // Reset active accordion when drawer closes
  useEffect(() => {
    if (!isDrawerOpen) {
      setActiveAccordion(null);
    }
  }, [isDrawerOpen]);

  // React Query hooks for different data types
  // const { 
  //   data: userPages = [], 
  //   isLoading: isPagesLoading 
  // } = useQuery({
  //   queryKey: ['userPages', user?.id],
  //   queryFn: async () => {
  //     if (!user?.id) return [];
  //     const response = await axios.get(`${baseURL}/getAllUserPages.php?user_id=${user.id}`);
  //     return response.data || [];
  //   },
  //   enabled: !!user?.id && isDrawerOpen,
  //   staleTime: 1000 * 60 * 5, // 5 minutes
  // });

  const { 
    data: followers = [], 
    isLoading: isFollowersLoading 
  } = useQuery({
    queryKey: ['followers', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await axios.get(`${baseURL}/getUserFollowers.php?user_id=${user.id}`);
      return response.data || [];
    },
    enabled: !!user?.id && isDrawerOpen,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { 
    data: following = [], 
    isLoading: isFollowingLoading 
  } = useQuery({
    queryKey: ['following', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await axios.get(`${baseURL}/getUserFollowing.php?user_id=${user.id}`);
      return response.data || [];
    },
    enabled: !!user?.id && isDrawerOpen,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { 
    data: friends = [], 
    isLoading: isFriendsLoading 
  } = useQuery({
    queryKey: ['friends', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await axios.get(`${baseURL}/getUserFriends.php?user_id=${user.id}`);
      return response.data || [];
    },
    enabled: !!user?.id && isDrawerOpen,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const { 
    data: searchData = [], 
    isLoading: isSearchLoading,
    isFetching: isSearchFetching
  } = useQuery({
    queryKey: ['searchUsers', searchQuery, user?.id],
    queryFn: async () => {
      if (!user?.id || !searchQuery.trim()) return [];
      const response = await axios.get(
        `${baseURL}/getSearchUser.php?q=${searchQuery}&user_id=${user.id}`
      );
      return response.data || [];
    },
    enabled: !!user?.id && !!searchQuery.trim(),
    keepPreviousData: true,
    staleTime: 1000 * 60 * 1, // 1 minute
    onSuccess: (data) => {
      if (searchQuery.trim()) {
        setIsSearchActive(true);
        // Announce search results for screen readers
        const resultCount = data.length;
        AccessibilityInfo.announceForAccessibility(
          `${resultCount} ${resultCount == 1 ? 'result' : 'results'} found`
        );
      }
    }
  });

  // Handle search input changes with debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setIsSearchActive(false);
    }
  }, [searchQuery]);

  // const isLoading = isPagesLoading || isFollowersLoading || isFollowingLoading || isFriendsLoading;
  const isLoading =  isFollowersLoading || isFollowingLoading || isFriendsLoading;

  // Create a function to render a scrollable list for each accordion
  const renderScrollableList = (data, keyPrefix, renderItem, emptyIcon, emptyMessage, isLoading, loaderColor) => {
    if (isLoading) {
      return (
        <View style={styles.miniLoader}>
          <ActivityIndicator size="small" color={loaderColor} />
        </View>
      );
    }
    
    if (!data || data.length == 0) {
      return <EmptyState icon={emptyIcon} message={emptyMessage} />;
    }
    
    // Use ScrollView instead of FlatList to enable proper scrolling within accordion
    return (
      <ScrollView 
        style={styles.scrollableListContainer}
        contentContainerStyle={styles.scrollableListContent}
        nestedScrollEnabled={true}
        showsVerticalScrollIndicator={true}
      >
        {data?.length >0 && data?.map((item, index) => (
          <React.Fragment key={`${keyPrefix}-${index}`}>
            {index > 0 && <Divider style={styles.divider} />}
            {renderItem(item)}
          </React.Fragment>
        ))}
      </ScrollView>
    );
  };

  if (!user) {
    return (
      <View 
        style={styles.loadingContainer}
        accessible={true}
        accessibilityLabel="Loading user data"
        accessibilityState={{ busy: true }}
      >
        <ActivityIndicator size="large" color="#4F46E5" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <LinearGradient
        colors={['#f0f9ff', '#e0f2fe']} // Changed from white to light blue
        style={styles.gradientBackground}
      >
        <View style={styles.profileSection}>
          {user && user.user_image ? (
            <Image 
              source={{ uri: `${baseImgURL + user.user_image}` }} 
              style={styles.profileImage} 
              accessible={true}
              accessibilityLabel="Your profile picture"
              accessibilityRole="image"
            />
          ) : (
            <View style={styles.profileImagePlaceholder}>
              <Text style={styles.profileImageText}>
                {user?.name?.charAt(0)?.toUpperCase() || "?"}
              </Text>
            </View>
          )}
          
          <Text style={styles.profileName}>{user?.name || "User"}</Text>
          <Text style={styles.profileInfo}>{user?.mobile || ""}</Text>
          
          <View 
            style={styles.qrCodeContainer}
            accessible={true}
            accessibilityLabel="Your QR code for sharing profile"
          >
            <QRCode
              value={`https://wowfy.com/?user_id=${user?.mobile}`}
              logo={require("../assets/images/wowcoin.png")}
              logoSize={20}
              size={100}
              logoBackgroundColor="transparent"
              color="#1e293b"
              backgroundColor="#FFFFFF"
            />
          </View>
        </View>
        
        <View style={styles.searchContainer}>
          <Feather 
            name="search" 
            size={16} 
            color="#64748b" 
            style={styles.searchIcon}
            accessibilityElementsHidden={true}
            importantForAccessibility="no"
          />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            accessible={true}
            accessibilityLabel="Search users"
            accessibilityHint="Enter a name to search for users"
          />
          {searchQuery?.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setSearchQuery("");
                setIsSearchActive(false);
              }}
              accessible={true}
              accessibilityLabel="Clear search"
              accessibilityRole="button"
            >
              <Feather name="x" size={16} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>
        
        {isSearchActive ? (
          <View 
            style={styles.searchResultsContainer}
            accessibilityLiveRegion="polite"
          >
            <View style={styles.searchHeaderContainer}>
              <Text 
                style={styles.searchResultsTitle}
                accessible={true}
                accessibilityLabel={`${searchData?.length || 0} search results`}
              >
                Search Results
              </Text>
              {(isSearchLoading || isSearchFetching) && (
                <ActivityIndicator size="small" color="#4F46E5" />
              )}
            </View>
            
            {searchData?.length > 0 ? (
              <ScrollView
                style={styles.searchResultsList}
                contentContainerStyle={styles.searchResultsContent}
                showsVerticalScrollIndicator={true}
              >
                {searchData?.length >0 && searchData?.map((item, index) => (
                  <React.Fragment key={`search-${index}`}>
                    {index > 0 && <Divider style={styles.divider} />}
                    <UserItem 
                      item={item} 
                      onPress={() => {
                        setSearchQuery("");
                        setIsSearchActive(false);
                        navigation.navigate("OtherUserScreen", {
                          user_id: item.id,
                        });
                      }}
                    />
                  </React.Fragment>
                ))}
              </ScrollView>
            ) : (
              <EmptyState icon="users" message="No users found" />
            )}
          </View>
        ) : (
          <ScrollView
            ref={scrollViewRef}
            style={styles.accordionsContainer}
            contentContainerStyle={styles.accordionsContentContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* <AccordionItem
              title="Pages"
              icon="book-open-page-variant"
              isOpen={activeAccordion == "pages"}
              onToggle={() => toggleAccordion("pages")}
              itemCount={userPages?.length}
              badgeColor="#4F46E5" // Indigo
            >
              {renderScrollableList(
                userPages,
                'page',
                (item) => (
                  <PageItem
                    item={item}
                    onPress={() =>
                      navigation.navigate("Moviehome", {
                        movieId: item.id,
                      })
                    }
                  />
                ),
                "book-open",
                "No pages found",
                isPagesLoading,
                "#4F46E5"
              )}
            </AccordionItem> */}
            
            <AccordionItem
              title="Friends"
              icon="account-group"
              isOpen={activeAccordion == "friends"}
              onToggle={() => toggleAccordion("friends")}
              itemCount={friends?.length}
              badgeColor="#10B981" // Green
            >
              {renderScrollableList(
                friends,
                'friend',
                (item) => (
                  <UserItem
                    item={item}
                    onPress={() => {
                      navigation.navigate("OtherUserScreen", {
                        user_id: item?.goto_id,
                      });
                    }}
                  />
                ),
                "users",
                "No friends yet",
                isFriendsLoading,
                "#10B981"
              )}
            </AccordionItem>
            
            <AccordionItem
              title="Followers"
              icon="account-multiple"
              isOpen={activeAccordion == "followers"}
              onToggle={() => toggleAccordion("followers")}
              itemCount={followers?.length}
              badgeColor="#F97316" // Orange
            >
              {renderScrollableList(
                followers,
                'follower',
                (item) => (
                  <UserItem
                    item={item}
                    onPress={() => {
                      navigation.navigate("OtherUserScreen", {
                        user_id: item?.followed_user,
                      });
                    }}
                  />
                ),
                "users",
                "No followers yet",
                isFollowersLoading,
                "#F97316"
              )}
            </AccordionItem>
            
            <AccordionItem
              title="Following"
              icon="account-arrow-right"
              isOpen={activeAccordion == "following"}
              onToggle={() => toggleAccordion("following")}
              itemCount={following?.length}
              badgeColor="#6366F1" // Purple
            >
              {renderScrollableList(
                following,
                'following',
                (item) => (
                  <UserItem
                    item={item}
                    showCharBadge={true}
                    onPress={() => {
                      navigation.navigate("OtherUserScreen", {
                        user_id: item?.user_id,
                      });
                    }}
                  />
                ),
                "users",
                "Not following anyone yet",
                isFollowingLoading,
                "#6366F1"
              )}
            </AccordionItem>
          </ScrollView>
        )}
      </LinearGradient>
    </SafeAreaView>
  );
};

export default CustomNestedDrawer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e0f2fe',
  },
  gradientBackground: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
  },
  profileSection: {
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileImageText: {
    fontSize: 32,
    fontFamily: 'raleway-bold',
    color: 'white',
  },
  profileName: {
    fontSize: 20,
    fontFamily: 'raleway-bold',
    color: '#1e293b',
    marginTop: 12,
  },
  profileInfo: {
    fontSize: 14,
    fontFamily: 'raleway',
    color: '#64748b',
    marginTop: 4,
  },
  qrCodeContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 8,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginHorizontal: 16,
    marginVertical: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#1e293b',
    fontFamily: 'raleway',
    fontSize: 14,
    paddingVertical: 8,
  },
  clearButton: {
    padding: 8,
  },
  searchHeaderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  searchResultsContainer: {
    flex: 1,
    marginTop: 8,
  },
  searchResultsTitle: {
    fontSize: 16,
    fontFamily: 'raleway-bold',
    color: '#1e293b',
  },
  searchResultsList: {
    flex: 1,
  },
  searchResultsContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  accordionsContainer: {
    flex: 1,
  },
  accordionsContentContainer: {
    paddingBottom: 20,
  },
  accordionContainer: {
    marginBottom: 8,
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderRadius: 10,
    marginHorizontal: 16,
    minHeight: 56,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  accordionHeaderActive: {
    backgroundColor: '#f0f9ff',
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    shadowOpacity: 0,
    elevation: 0,
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accordionHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  accordionTitle: {
    fontSize: 15,
    fontFamily: 'raleway-bold',
    color: '#1e293b',
  },
  countBadge: {
    borderRadius: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
    marginRight: 8,
  },
  countText: {
    color: 'white',
    fontSize: 12,
    fontFamily: 'raleway-bold',
  },
  accordionContent: {
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
    overflow: 'hidden',
  },
  scrollableListContainer: {
    maxHeight: 300,
  },
  scrollableListContent: {
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  divider: {
    backgroundColor: '#e0f2fe',
    height: 1,
    marginVertical: 4,
  },
  userItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 54,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  userAvatarText: {
    fontSize: 16,
    fontFamily: 'raleway-bold',
    color: 'white',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontFamily: 'raleway-bold',
    color: '#1e293b',
  },
  userSubInfo: {
    fontSize: 12,
    fontFamily: 'raleway',
    color: '#64748b',
  },
  userAction: {
    padding: 4,
  },
  pageItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 54,
  },
  pageIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
  },
  pageInfo: {
    marginLeft: 12,
    flex: 1,
  },
  pageName: {
    fontSize: 14,
    fontFamily: 'raleway-bold',
    color: '#1e293b',
  },
  pageType: {
    fontSize: 12,
    fontFamily: 'raleway',
    color: '#64748b',
  },
  pageAction: {
    padding: 4,
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  emptyStateText: {
    fontSize: 14,
    fontFamily: 'raleway-medium',
    color: '#94a3b8',
    marginTop: 8,
    textAlign: 'center',
  },
  miniLoader: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
});