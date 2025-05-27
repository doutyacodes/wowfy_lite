import AsyncStorage from "@react-native-async-storage/async-storage";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { widthPercentageToDP as wp } from "react-native-responsive-screen";
import Toast from "react-native-toast-message";

const TopicScreen = () => {
  const navigation = useNavigation();
  const [user, setUser] = useState(null);
  const [selectedEvents, setSelectedEvents] = useState([]);
  const [pages, setPages] = useState([]);

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

  useEffect(() => {
    if (user?.steps >= 3) {
      navigation.replace("InnerPage");
    }
  }, [user, navigation]);

  const InterestData = [
    {
      id: 1,
      category: "Places",
      image_url:
        "https://images.pexels.com/photos/533769/pexels-photo-533769.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      disable: false,
      type: "places",
    },
    {
      id: 2,
      category: "Elections",
      image_url: "https://i.imgur.com/CzXTtJV.jpg",
      disable: true,
      type: "election",
    },
    {
      id: 3,
      category: "Movies",
      image_url:
        "https://images.pexels.com/photos/33129/popcorn-movie-party-entertainment.jpg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      disable: true,
      type: "hotels",
    },
    {
      id: 4,
      category: "Hotels",
      image_url:
        "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      disable: true,
      type: "hotels",
    },
    {
      id: 5,
      category: "D",
      image_url:
        "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      disable: true,
      type: "hotels",
    },
    {
      id: 6,
      category: "E",
      image_url:
        "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      disable: true,
      type: "hotels",
    },
    {
      id: 7,
      category: "F",
      image_url:
        "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      disable: true,
      type: "hotels",
    },
    {
      id: 8,
      category: "G",
      image_url:
        "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      disable: true,
      type: "hotels",
    },
    {
      id: 9,
      category: "G",
      image_url:
        "https://images.pexels.com/photos/164595/pexels-photo-164595.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2",
      disable: true,
      type: "hotels",
    },
  ];

  const toggleSelection = (type) => {
    setSelectedEvents((prevSelected) => {
      if (prevSelected.includes(type)) {
        return prevSelected.filter((prevType) => prevType !== type);
      } else {
        return [...prevSelected, type];
      }
    });
    // console.log(type);
  };
  useEffect(() => {
    console.log(selectedEvents);
  }, [selectedEvents]);
  const showToast = () => {
    Toast.show({
      type: "error",
      text1: "Oops",
      text2: "Select Atleast one topic",
    });
  };
  const handleSubmit = () => {
    if (selectedEvents?.length > 0) {
      navigation.replace("Followpage", {
        selectedEvents: selectedEvents,
      });
    } else {
      showToast();
    }
  };

  return (
    <View style={styles.container}>
      <View
        style={{ justifyContent: "center", alignItems: "center", padding: 15 }}
      >
        <Image
          source={require("../assets/logos/wowfy.png")}
          style={styles.logo}
        />
        <Text style={styles.caption}>Select your preference here</Text>
      </View>
      <View style={{ flex: 1, padding: 15 }}>
        <FlatList
          data={InterestData}
          keyExtractor={(item, index) => index.toString()}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item, index }) => {
            const isSelected = selectedEvents.includes(item.type);
            const numColumns = 3; // Number of columns in your FlatList
            const itemWidth = (wp(100) - wp(4) * (numColumns + 1)) / numColumns; // Calculate item width

            return (
              <TouchableOpacity
                key={index}
                style={{
                  margin: wp(2),
                  width: item.id !== InterestData?.length ? itemWidth : wp(20), // Set width based on position
                }}
                disabled={item.disable}
                onPress={() => toggleSelection(item.type)}
              >
                <View
                  style={{
                    opacity: item.disable ? 0.6 : 1,
                    backgroundColor: isSelected ? "lightblue" : "white",
                    shadowColor: "#000",
                    shadowOffset: {
                      width: 0,
                      height: 2,
                    },
                    shadowOpacity: 0.25,
                    shadowRadius: 3.84,
                    elevation: 5,
                    padding: wp(2),
                    justifyContent: "center",
                    alignItems: "center",
                    borderRadius: wp(2),
                    overflow: "hidden",
                  }}
                >
                  <Image
                    source={{ uri: item.image_url }}
                    style={{
                      height: wp(20),
                      width: wp(20),
                      resizeMode: "cover",
                      borderRadius: wp(2),
                    }}
                  />
                  <View style={{ marginTop: wp(1) }}>
                    <Text
                      style={{ fontFamily: "raleway-bold", fontSize: wp(4) }}
                    >
                      {item.category}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      <View style={styles.btn}>
        <TouchableOpacity onPress={handleSubmit} style={styles.continueButton}>
          <Text style={styles.continueButtonText}>Continue</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default TopicScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logo: {
    resizeMode: "contain",
    width: 80,
    height: 80,
    top: 30,
  },
  caption: {
    fontSize: 18,
    marginBottom: 20,
    fontFamily: "raleway-bold",
    top: 20,
  },

  btn: {
    justifyContent: "center",
    alignItems: "center",
  },

  continueButton: {
    backgroundColor: "green",
    padding: 12,
    borderRadius: 10,
    marginBottom: 17,
  },
  continueButtonText: {
    color: "white",
    fontSize: 18,
    fontFamily: "raleway-bold",
    textAlign: "center",
  },

  containerStyle: {
    backgroundColor: "white",
    padding: 10,
    margin: 10,
    flex: 1,
    borderRadius: 25,
    position: "relative",
  },
  closeBtn: {
    position: "absolute",
    top: 5,
    right: 5,
    margin: 5,
  },
  containerModal: {
    flex: 1,
    backgroundColor: "white",
    padding: 10,
    flexDirection: "row",
    gap: 5,
    justifyContent: "space-between",
    alignItems: "center",
  },
});
