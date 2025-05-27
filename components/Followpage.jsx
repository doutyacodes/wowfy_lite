import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
  ActivityIndicator,
} from "react-native";
import { Divider, Modal, PaperProvider, Portal } from "react-native-paper";
import { AntDesign, Entypo, Feather } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL, baseURL } from "../backend/baseData";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";

const Followpage = ({ route }) => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [pages, setPages] = useState([]);
  const [visible, setVisible] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const showModal = () => setVisible(true);
  const hideModal = () => {
    setVisible(false);
    setSearchText("");
  };

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
  }, [navigation]);

  const handlePageSelection = (pageId) => {
    setSelectedEvents((prevSelected) => {
      if (prevSelected.includes(pageId)) {
        return prevSelected.filter((id) => id !== pageId);
      } else {
        return [...prevSelected, pageId];
      }
    });
  };

  useEffect(() => {
    const fetchPages = async () => {
      setIsLoading(true);
      try {
        const response = await axios.post(
          `${baseURL}/getAllPages.php`,
          {
            text: searchText,
          },
          {
            headers: {
              "Content-Type": "application/x-www-form-urlencoded",
            },
          }
        );

        if (response.status == 200) {
          setPages(response.data);
        } else {
          console.error("Invalid response format or failed to fetch pages");
          setPages([]);
        }
      } catch (error) {
        console.error("Error while fetching pages:", error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPages();
  }, [searchText]);

  const continueToNextScreen = async () => {
    if (selectedEvents?.length >= 2) {
      const selectedEventsWithImages = selectedEvents.map((pageId) =>
        pages.find((page) => page.id == pageId)
      );

      const data = {
        userId: user.id,
        selectedEvents: selectedEventsWithImages,
      };
      
      try {
        setIsLoading(true);
        const response = await axios.post(`${baseURL}/follow.php`, data, {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        });
        
        await AsyncStorage.setItem(
          "user",
          JSON.stringify({ ...user, steps: 3 })
        );
        navigation.replace("InnerPage");
      } catch (error) {
        console.error("Error:", error);
        alert("An error occurred. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    } else {
      // Show elegant toast instead of alert
      showToast("Please follow at least 2 pages to continue");
    }
  };

  const showToast = (message) => {
    // Custom toast implementation could go here
    alert(message); // Fallback to alert for now
  };

  const truncateText = (text, maxLength) => {
    if (text?.length <= maxLength) {
      return text;
    }
    return text.substring(0, maxLength) + "...";
  };

  const renderPageItem = ({ item, index }) => (
    <TouchableOpacity
      style={[
        styles.pageCard,
        selectedEvents.includes(item.id) && styles.selectedPage,
        { marginRight: index % 2 !== 0 ? 0 : 10 },
      ]}
      onPress={() => handlePageSelection(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: `${baseImgURL + item.icon}` }}
          style={styles.pageImage}
        />
        {selectedEvents.includes(item.id) && (
          <View style={styles.selectedIndicator}>
            <Feather name="check" size={16} color="white" />
          </View>
        )}
      </View>
      <View style={styles.pageInfo}>
        <Text style={styles.pageName} numberOfLines={1}>
          {item.title}
        </Text>
        <Text style={styles.pageType} numberOfLines={1}>
          {item.type}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const renderSearchItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.searchItem,
        selectedEvents.includes(item.id) && styles.selectedSearchItem,
      ]}
      onPress={() => handlePageSelection(item.id)}
      activeOpacity={0.7}
    >
      <Image
        source={{ uri: `${baseImgURL + item.icon}` }}
        style={styles.searchItemImage}
      />
      <View style={styles.searchItemInfo}>
        <Text style={styles.searchItemTitle}>{truncateText(item.title, 20)}</Text>
        <Text style={styles.searchItemType}>{item.type}</Text>
      </View>
      {selectedEvents.includes(item.id) && (
        <Feather name="check-circle" size={22} color="#4A80F0" />
      )}
    </TouchableOpacity>
  );

  return (
    <PaperProvider>
      <StatusBar barStyle="dark-content" backgroundColor="white" />
      <View style={styles.container}>
        <View style={styles.header}>
          <Image
            source={require("../assets/logos/wowfy.png")}
            style={styles.logo}
          />
          <Text style={styles.caption}>
            Follow at least <Text style={styles.highlightText}>2 pages</Text> to continue
          </Text>
          
          <TouchableOpacity
            onPress={showModal}
            style={styles.searchBar}
            activeOpacity={0.7}
          >
            <Entypo name="magnifying-glass" size={20} color="#A0A0A0" />
            <Text style={styles.searchPlaceholder}>Search pages...</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.selectionCount}>
          <Text style={styles.selectionText}>
            {selectedEvents?.length} selected
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A80F0" />
          </View>
        ) : (
          <FlatList
            data={pages}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.pagesContainer}
            showsVerticalScrollIndicator={false}
            renderItem={renderPageItem}
            ItemSeparatorComponent={<View style={{ height: 15 }} />}
            columnWrapperStyle={styles.columnWrapper}
          />
        )}

        <View style={styles.bottomContainer}>
          <TouchableOpacity
            style={[
              styles.continueButton,
              selectedEvents?.length < 2 && styles.continueButtonDisabled,
            ]}
            onPress={continueToNextScreen}
            disabled={selectedEvents?.length < 2}
          >
            <Text style={styles.continueButtonText}>Continue</Text>
          </TouchableOpacity>
        </View>

        <Portal>
          <Modal
            visible={visible}
            onDismiss={hideModal}
            contentContainerStyle={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Find Pages</Text>
                <TouchableOpacity onPress={hideModal} style={styles.closeButton}>
                  <AntDesign name="close" size={24} color="#333" />
                </TouchableOpacity>
              </View>
              
              <View style={styles.modalSearchContainer}>
                <Entypo name="magnifying-glass" size={20} color="#A0A0A0" />
                <TextInput
                  placeholder="Search pages..."
                  style={styles.modalSearchInput}
                  value={searchText}
                  onChangeText={setSearchText}
                  placeholderTextColor="#A0A0A0"
                  autoFocus
                />
                {searchText?.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchText("")}>
                    <AntDesign name="closecircle" size={16} color="#A0A0A0" />
                  </TouchableOpacity>
                )}
              </View>
              
              {isLoading ? (
                <View style={styles.modalLoadingContainer}>
                  <ActivityIndicator size="large" color="#4A80F0" />
                </View>
              ) : pages?.length > 0 ? (
                <FlatList
                  data={pages}
                  keyExtractor={(item) => item.id.toString()}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={styles.modalList}
                  renderItem={renderSearchItem}
                  ItemSeparatorComponent={() => <Divider style={styles.divider} />}
                />
              ) : (
                <View style={styles.noResultsContainer}>
                  <Feather name="search" size={50} color="#E0E0E0" />
                  <Text style={styles.noResultsText}>No pages found</Text>
                  <Text style={styles.noResultsSubText}>
                    Try different keywords or browse the suggested pages
                  </Text>
                </View>
              )}
            </View>
          </Modal>
        </Portal>
      </View>
    </PaperProvider>
  );
};

export default Followpage;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FD",
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: "white",
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  logo: {
    width: 60,
    height: 60,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 5,
  },
  caption: {
    fontSize: 16,
    fontFamily: "raleway-medium",
    textAlign: "center",
    marginBottom: 20,
    color: "#333",
  },
  highlightText: {
    fontFamily: "raleway-bold",
    color: "#4A80F0",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F7",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    marginHorizontal: 0,
  },
  searchPlaceholder: {
    marginLeft: 10,
    color: "#A0A0A0",
    fontSize: 14,
    fontFamily: "raleway-medium",
  },
  selectionCount: {
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  selectionText: {
    fontFamily: "raleway-bold",
    fontSize: 14,
    color: "#4A80F0",
  },
  pagesContainer: {
    paddingHorizontal: 15,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: "space-between",
  },
  pageCard: {
    width: wp(43),
    borderRadius: 16,
    backgroundColor: "white",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  selectedPage: {
    borderWidth: 2,
    borderColor: "#4A80F0",
  },
  imageContainer: {
    position: "relative",
    width: "100%",
    height: hp(18),
  },
  pageImage: {
    width: "100%",
    height: "100%",
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  selectedIndicator: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#4A80F0",
    justifyContent: "center",
    alignItems: "center",
  },
  pageInfo: {
    padding: 12,
  },
  pageName: {
    fontSize: 14,
    fontFamily: "raleway-bold",
    color: "#333",
    marginBottom: 4,
  },
  pageType: {
    fontSize: 12,
    fontFamily: "raleway-medium",
    color: "#888",
  },
  bottomContainer: {
    padding: 20,
    backgroundColor: "white",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 10,
  },
  continueButton: {
    backgroundColor: "#4A80F0",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  continueButtonDisabled: {
    backgroundColor: "#B8CEFB",
  },
  continueButtonText: {
    color: "white",
    fontFamily: "raleway-bold",
    fontSize: 16,
  },
  modalContainer: {
    backgroundColor: "white",
    marginHorizontal: 15,
    borderRadius: 20,
    overflow: "hidden",
    flex: 0.85,
  },
  modalContent: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  modalTitle: {
    fontSize: 18,
    fontFamily: "raleway-bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  modalSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F7",
    borderRadius: 12,
    margin: 15,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  modalSearchInput: {
    flex: 1,
    fontFamily: "raleway-medium",
    fontSize: 14,
    paddingHorizontal: 10,
    color: "#333",
  },
  modalList: {
    paddingBottom: 20,
  },
  searchItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 15,
  },
  selectedSearchItem: {
    backgroundColor: "#F5F8FF",
  },
  searchItemImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
  },
  searchItemInfo: {
    flex: 1,
    marginLeft: 15,
  },
  searchItemTitle: {
    fontSize: 14,
    fontFamily: "raleway-bold",
    color: "#333",
    marginBottom: 3,
  },
  searchItemType: {
    fontSize: 12,
    fontFamily: "raleway-medium",
    color: "#888",
  },
  divider: {
    height: 1,
    backgroundColor: "#F0F0F0",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalLoadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  noResultsContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 30,
  },
  noResultsText: {
    fontSize: 18,
    fontFamily: "raleway-bold",
    color: "#333",
    marginTop: 15,
    marginBottom: 5,
  },
  noResultsSubText: {
    fontSize: 14,
    fontFamily: "raleway-medium",
    color: "#888",
    textAlign: "center",
  },
});