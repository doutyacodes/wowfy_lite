import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useRef, useState } from "react";
import { Dimensions, FlatList, StyleSheet, View } from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseURL } from "../backend/baseData";
import ImageCard from "./ImageCard";
const { width, height } = Dimensions.get("window");

const ImageList = ({ route }) => {
  const [data, setData] = useState([]);
  const { indexNumber, challenge_id, sort } = route.params;
  const flatListRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchContestPost = async () => {
      try {
        const response = await axios.get(
          `${baseURL}/getContestPost.php?challenge_id=${challenge_id}&sort=${sort}`
        );

        if (response.status == 200) {
          setData(response.data);
        } else {
          console.error("Failed to fetch contest");
        }
      } catch (error) {
        console.error("Error while fetching contest:", error.message);
      }
    };

    fetchContestPost();
  }, []);

  useEffect(() => {
    scrollToIndex();
  }, [data]); // Trigger when data changes

  const scrollToIndex = () => {
    if (data?.length > 0 && indexNumber !== null && indexNumber < data?.length) {
      flatListRef.current.scrollToIndex({
        animated: true,
        index: indexNumber,
      });
    }
  };

  const getItemLayout = (_, index) => ({
    length: width,
    offset: width * index,
    index,
  });

  return (
    <View style={{ flex: 1 }}>
      <FlatList
        ref={flatListRef}
        pagingEnabled
        data={data}
        renderItem={({ item, index }) => <ImageCard item={item} />}
        keyExtractor={(item) => item.id.toString()}
        getItemLayout={getItemLayout}
        style={{ height: height }} // Adjust the height to fill the screen
      />
    </View>
  );
};

export default ImageList;

const styles = StyleSheet.create({
  avatarText: {
    fontFamily: "raleway-bold",
    color: "white",
    fontSize: wp(5),
  },
  avatarContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: wp(15),
    width: wp(15),
    backgroundColor: "#ff8f8e",
    borderRadius: 50,
  },
  detailsContainer: {
    gap: 5,
  },
  name: {
    fontSize: hp(2),
    fontFamily: "raleway-bold",
  },
});
