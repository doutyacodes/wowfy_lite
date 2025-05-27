import React, { useEffect, useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  SafeAreaView,
  Platform,
  StatusBar,
  Animated,
  Keyboard,
  ActivityIndicator,
  Image,
} from "react-native";
import { Feather, Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseURL, baseImgURL } from "../backend/baseData";
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { BlurView } from "expo-blur";

// Recent search pill component
const RecentSearchPill = ({ text, onPress }) => (
  <TouchableOpacity 
    style={styles.recentSearchPill} 
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Feather name="clock" size={14} color="#666" style={styles.pillIcon} />
    <Text style={styles.pillText} numberOfLines={1}>{text}</Text>
  </TouchableOpacity>
);

// Search result item component
const SearchResultItem = ({ item, user, navigation }) => {
  let navigateToScreen;
  let navigationParams;
  
  if (item.type == "user") {
    navigateToScreen = "OtherUserScreen";
    navigationParams = { user_id: item.id };
  } else {
    navigateToScreen = "Moviehome";
    navigationParams = { movieId: item.id };
  }
  
  const handlePress = () => {
    navigation.navigate(navigateToScreen, navigationParams);
  };
  
  return (
    <TouchableOpacity 
      style={styles.resultItem} 
      onPress={handlePress}
      activeOpacity={0.7}
    >
      {/* Avatar or Icon */}
      {item.type == "user" ? (
        item.user_image ? (
          <Image 
            source={{ uri: `${baseImgURL + item.user_image}` }}
            style={styles.resultAvatar}
          />
        ) : (
          <View style={styles.resultAvatarPlaceholder}>
            <Text style={styles.resultAvatarText}>
              {item.first_character || item.name?.charAt(0)}
            </Text>
          </View>
        )
      ) : (
        item.icon ? (
          <Image 
            source={{ uri: `${baseImgURL + item.icon}` }}
            style={styles.resultIcon}
          />
        ) : (
          <View style={styles.resultIconPlaceholder}>
            <Feather name="bookmark" size={18} color="#FFF" />
          </View>
        )
      )}
      
      {/* Content */}
      <View style={styles.resultContent}>
        <Text style={styles.resultTitle} numberOfLines={1}>
          {item.name || item.title}
        </Text>
        <Text style={styles.resultSubtitle} numberOfLines={1}>
          {item.type == "user" ? "User" : item.type || "Page"}
        </Text>
      </View>
      
      {/* Action Icon */}
      <View style={styles.resultAction}>
        <Ionicons 
          name={item.type == "user" ? "person-outline" : "bookmark-outline"} 
          size={20} 
          color="#888"
        />
      </View>
    </TouchableOpacity>
  );
};

// Empty state component
const EmptyState = ({ searching, query }) => {
  const animation = useRef(new Animated.Value(0)).current;
  
  useEffect(() => {
    Animated.timing(animation, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();
  }, []);
  
  return (
    <Animated.View 
      style={[
        styles.emptyStateContainer,
        {
          opacity: animation,
          transform: [
            {
              translateY: animation.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <Feather 
        name={searching ? "search" : "activity"} 
        size={60} 
        color="#E0E0E0"
      />
      <Text style={styles.emptyStateTitle}>
        {searching ? "No results found" : "Search"}
      </Text>
      <Text style={styles.emptyStateSubtitle}>
        {searching 
          ? `We couldn't find any results for "${query}"`
          : "Search for users, pages, and interests"
        }
      </Text>
    </Animated.View>
  );
};

const SearchScreen = () => {
  const navigation = useNavigation();
  const queryClient = useQueryClient();
  const [user, setUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const searchInputRef = useRef(null);
  
  // For animations
  const searchBarAnimation = useRef(new Animated.Value(0)).current;
  
  // Fetch user data from AsyncStorage
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userString = await AsyncStorage.getItem("user");
        if (userString) {
          setUser(JSON.parse(userString));
        } else {
          navigation.replace("OtpVerification");
        }
      } catch (error) {
        console.error("Error fetching user from AsyncStorage:", error.message);
      }
    };
    
    fetchUserData();
  }, []);
  
  // Load recent searches when component mounts
  useEffect(() => {
    const loadRecentSearches = async () => {
      try {
        const savedSearches = await AsyncStorage.getItem("recentSearches");
        if (savedSearches) {
          setRecentSearches(JSON.parse(savedSearches));
        }
      } catch (error) {
        console.error("Error loading recent searches:", error);
      }
    };
    
    loadRecentSearches();
  }, []);
  
  // Animate search bar on mount
  useEffect(() => {
    Animated.timing(searchBarAnimation, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
    
    // Focus the search input
    setTimeout(() => {
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }, 100);
  }, []);

  // Define search query function
  const fetchSearchResults = async () => {
    if (!user || !searchQuery || searchQuery.length == 0) {
      return [];
    }
    
    const response = await axios.get(
      `${baseURL}/getSearchUser.php?q=${searchQuery}&user_id=${user.id}`
    );
    
    return response.data || [];
  };
  
  // Use React Query for search
  const {
    data: searchData = [],
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ['search', searchQuery, user?.id],
    queryFn: fetchSearchResults,
    enabled: !!searchQuery && !!user,
    staleTime: 1000 * 60 * 5, // 5 minutes
    cacheTime: 1000 * 60 * 10, // 10 minutes
    onSettled: () => {
      if (searchQuery?.length > 0) {
        setIsSearching(true);
      }
    },
  });
  
  // Debounced search handler
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (user && searchQuery?.length > 0) {
        refetch();
      } else if (searchQuery?.length == 0) {
        setIsSearching(false);
      }
    }, 500);
    
    return () => clearTimeout(delayDebounceFn);
  }, [searchQuery, user, refetch]);
  
  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.length == 0) {
      setIsSearching(false);
    }
  };
  
  const clearSearch = () => {
    setSearchQuery("");
    setIsSearching(false);
    
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  };
  
  const saveRecentSearch = async (query) => {
    if (!query.trim()) return;
    
    try {
      // Add to beginning and remove duplicates
      const updatedSearches = [
        query,
        ...recentSearches.filter(item => item !== query)
      ].slice(0, 5); // Keep only 5 most recent
      
      setRecentSearches(updatedSearches);
      await AsyncStorage.setItem("recentSearches", JSON.stringify(updatedSearches));
    } catch (error) {
      console.error("Error saving recent search:", error);
    }
  };
  
  const handleResultPress = (item) => {
    // Save the search query when user taps a result
    saveRecentSearch(searchQuery);
    
    let navigateToScreen;
    let navigationParams;
    
    if (item.type == "user") {
      navigateToScreen = "OtherUserScreen";
      navigationParams = { user_id: item.id };
    } else {
      navigateToScreen = "Moviehome";
      navigationParams = { movieId: item.id };
    }
    
    navigation.navigate(navigateToScreen, navigationParams);
  };
  
  const handleRecentSearchPress = (query) => {
    setSearchQuery(query);
    // The useEffect with debounce will handle the search
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Animated.View 
          style={[
            styles.searchBarContainer,
            {
              opacity: searchBarAnimation,
              transform: [
                {
                  translateY: searchBarAnimation.interpolate({
                    inputRange: [0, 1],
                    outputRange: [10, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <View style={styles.searchBar}>
            <Feather name="search" size={20} color="#888" style={styles.searchIcon} />
            
            <TextInput
              ref={searchInputRef}
              style={styles.searchInput}
              placeholder="Search for users, pages, or interests"
              placeholderTextColor="#9E9E9E"
              value={searchQuery}
              onChangeText={handleSearch}
              returnKeyType="search"
              onSubmitEditing={() => {
                Keyboard.dismiss();
                if (searchQuery?.length > 0) {
                  saveRecentSearch(searchQuery);
                }
              }}
            />
            
            {searchQuery?.length > 0 && (
              <TouchableOpacity 
                style={styles.clearButton}
                onPress={clearSearch}
              >
                <Feather name="x" size={18} color="#888" />
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </View>
      
      {/* Recent Searches */}
      {!isSearching && recentSearches?.length > 0 && (
        <View style={styles.recentSearchesContainer}>
          <View style={styles.recentSearchesHeader}>
            <Text style={styles.recentSearchesTitle}>Recent Searches</Text>
            <TouchableOpacity
              onPress={async () => {
                setRecentSearches([]);
                await AsyncStorage.removeItem("recentSearches");
              }}
            >
              <Text style={styles.clearAllText}>Clear All</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.recentSearchesList}>
            {recentSearches.map((search, index) => (
              <RecentSearchPill
                key={`recent-${index}`}
                text={search}
                onPress={() => handleRecentSearchPress(search)}
              />
            ))}
          </View>
        </View>
      )}
      
      {/* Search Results */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A80F0" />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      ) : (
        <FlatList
          data={searchData}
          keyExtractor={(item, index) => `search-result-${index}`}
          renderItem={({ item }) => (
            <SearchResultItem 
              item={item} 
              user={user} 
              navigation={navigation} 
            />
          )}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListEmptyComponent={() => (
            <EmptyState 
              searching={isSearching}
              query={searchQuery}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1, marginTop: Platform.OS == "android" ? 30 : 0
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingTop: Platform.OS == "android" ? 16 : 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  searchBarContainer: {
    flex: 1,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F7",
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#333",
    fontFamily: "raleway",
    paddingVertical: 8,
  },
  clearButton: {
    padding: 8,
  },
  recentSearchesContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  recentSearchesHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  recentSearchesTitle: {
    fontSize: 16,
    fontFamily: "raleway-bold",
    color: "#333",
  },
  clearAllText: {
    fontSize: 14,
    fontFamily: "raleway",
    color: "#4A80F0",
  },
  recentSearchesList: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  recentSearchPill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0F0F0",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
    marginBottom: 8,
    maxWidth: wp(40),
  },
  pillIcon: {
    marginRight: 6,
  },
  pillText: {
    fontSize: 14,
    fontFamily: "raleway",
    color: "#333",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    fontFamily: "raleway",
    color: "#666",
  },
  resultsList: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    flexGrow: 1,
  },
  resultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  resultAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  resultAvatarPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#4A80F0",
    justifyContent: "center",
    alignItems: "center",
  },
  resultAvatarText: {
    fontSize: 20,
    fontFamily: "raleway-bold",
    color: "#FFF",
  },
  resultIcon: {
    width: 50,
    height: 50,
    borderRadius: 12,
  },
  resultIconPlaceholder: {
    width: 50,
    height: 50,
    borderRadius: 12,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  resultContent: {
    flex: 1,
    marginLeft: 14,
  },
  resultTitle: {
    fontSize: 16,
    fontFamily: "raleway-bold",
    color: "#333",
    marginBottom: 4,
  },
  resultSubtitle: {
    fontSize: 14,
    fontFamily: "raleway",
    color: "#888",
  },
  resultAction: {
    paddingLeft: 8,
  },
  separator: {
    height: 1,
    backgroundColor: "#F0F0F0",
    marginVertical: 4,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingBottom: 60,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontFamily: "raleway-bold",
    color: "#333",
    marginTop: 20,
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    fontFamily: "raleway",
    color: "#888",
    textAlign: "center",
    lineHeight: 22,
  },
});

export default SearchScreen;