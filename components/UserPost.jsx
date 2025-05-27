import { AntDesign, FontAwesome } from "@expo/vector-icons";
import BottomSheet, { BottomSheetScrollView } from "@gorhom/bottom-sheet"; // Import BottomSheet from the library
import { useNavigation } from "@react-navigation/native";
import { launchImageLibraryAsync, MediaTypeOptions } from "expo-image-picker"; // Import image picker functionality
import React, { forwardRef, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Divider } from "react-native-paper";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import Toast from "react-native-root-toast";
import { baseURL } from "../backend/baseData";

const UserPost = ({ route }) => {
  const [bottomSheetOpen, setBottomSheetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const bottomSheetRef = useRef(null);
  const { user_id } = route.params;
  const [textData, setTextData] = useState("");
  const [image, setImage] = useState(null);
  const [videoData, setVideoData] = useState(null);
  const navigation = useNavigation();
  const openBottomSheet = () => {
    if (bottomSheetRef.current) {
      bottomSheetRef.current.expand();
      setBottomSheetOpen(true);
    }
  };

  const pickImage = async () => {
    let result = await launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      quality: 0.8,
    });
  
    if (result.assets && result.assets?.length > 0) {
      setImage(result.assets[0].uri);
    }
  };
  
  const pickVideo = async () => {
    let result = await launchImageLibraryAsync({
      mediaTypes: ["videos"],
      videoMaxDuration: 50,
    });
  
    if (result.assets && result.assets?.length > 0) {
      setVideoData(result.assets[0].uri);
    }
  };
  

  useEffect(() => {
    openBottomSheet();
  }, []);
  const submitData = async () => {
    if (!textData && !image && !videoData) {
      Alert.alert("Sorry", "Empty posts are not allowed");
      return;
    }
    try {
      setIsLoading(true);

      const formData = new FormData();
      formData.append("user_id", user_id);
      formData.append("textData", textData);

      // Append image data if available
      if (image) {
        const imageUri = image;
        const imageName = imageUri.split("/").pop();
        const imageType = imageName.split(".").pop();
        const mimeType = `image/${imageType}`;
        formData.append("imageFile", {
          uri: imageUri,
          type: mimeType,
          name: imageName,
        });
      }

      // Append video data if available
      if (videoData) {
        const videoUri = videoData;
        const videoName = videoUri.split("/").pop();
        const videoType = videoName.split(".").pop();
        console.log(videoType);
        const mimeType = `video/${videoType}`;
        formData.append("videoFile", {
          uri: videoUri,
          type: mimeType,
          name: `video.${videoType}`,
        });
      }

      const apiUrl = `${baseURL}/add-posts.php`;
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        body: formData,
      });
      // console.log(response._data)

      const responseData = await response.json();
      // console.log(responseData);
      if (responseData.success) {
        const successMessage = `Post added successfully`;
        let toast = Toast.show(successMessage, {
          duration: Toast.durations.SHORT,
          position: Toast.positions.BOTTOM,
          shadow: true,
          animation: true,
          hideOnPress: true,
          delay: 0,
          backgroundColor: "white", // Set background color to transparent
          textColor: "black",
          containerStyle: {
            backgroundColor: "white",
            borderRadius: 50,
            padding: 15,
          },
          onShow: () => {
            // Calls on toast's appear animation start
          },
          onShown: () => {
            // Calls on toast's appear animation end.
          },
          onHide: () => {
            // Calls on toast's hide animation start.
          },
          onHidden: () => {
            // Calls on toast's hide animation end.
          },
        });
      } else {
        alert(`Error: ${responseData.message}`);
      }
    } catch (err) {
      console.log(err);
    } finally {
      setIsLoading(false);
    }
  };

  const MyScrollableComponent = forwardRef((props, ref) => (
    <ScrollView ref={ref} {...props} />
  ));

  return (
    <View style={{ flex: 1, padding: 15, paddingTop: 40 }}>
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <AntDesign name="close" size={24} color="gray" />
        </TouchableOpacity>
        <Text
          style={{ fontSize: 17, color: "gray", fontFamily: "raleway-bold" }}
        >
          Post
        </Text>
        <TouchableOpacity onPress={submitData} disabled={isLoading}>
          {isLoading ? (
            <ActivityIndicator size={"small"} color={"#3b99ff"} />
          ) : (
            <Text
              style={{
                fontSize: 17,
                color: "gray",
                fontFamily: "raleway-bold",
              }}
            >
              Submit
            </Text>
          )}
        </TouchableOpacity>
      </View>
      <ScrollView style={{ marginTop: 19, flex: 1 }}>
        <View
          style={{
            flex: 1,
            backgroundColor: "white",
            padding: 10,
            borderRadius: 15,
            minHeight: hp(43),
          }}
        >
          <TextInput
            placeholder={`Write your Posts`}
            style={{ width: "100%" }}
            multiline
            placeholderTextColor={"gray"}
            onChangeText={(text) => setTextData(text)}
          />
        </View>
        {image && (
          <Image
            source={{ uri: image }}
            style={{ width: 100, height: 100, marginTop: 10 }}
          />
        )}
      </ScrollView>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={["20%"]}
        index={0}
        onChange={(index) => console.log("Bottom Sheet Index:", index)}
      >
        <MyScrollableComponent style={styles.bottomSheetContent}>
          <View style={{ gap: 5 }}>
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingLeft: 20,
                gap: 19,
                paddingVertical: 20,
              }}
              onPress={pickImage} // Call pickImage function onPress
            >
              <FontAwesome name="image" size={24} color="#3b99ff" />
              <Text style={{ fontSize: 16, fontWeight: "600" }}>Add Photo</Text>
            </TouchableOpacity>
            <Divider />
            <TouchableOpacity
              style={{
                flexDirection: "row",
                alignItems: "center",
                paddingLeft: 20,
                gap: 19,
                paddingVertical: 20,
              }}
              onPress={pickVideo} // Call pickVideo function onPress
            >
              <FontAwesome name="video-camera" size={24} color="#3b99ff" />
              <Text style={{ fontSize: 16, fontWeight: "600" }}>Add Video</Text>
            </TouchableOpacity>
          </View>
        </MyScrollableComponent>
      </BottomSheet>
    </View>
  );
};

export default UserPost;

const styles = StyleSheet.create({});
