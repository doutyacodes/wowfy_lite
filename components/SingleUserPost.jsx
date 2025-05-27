import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import axios from "axios";
import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { baseURL } from "../backend/baseData";
import UserPosts from "./UserPosts";

const SingleUserPost = ({ route }) => {
  const [userPost, setUserPost] = useState([]);
  const isFocused = useIsFocused();
  const { id } = route.params.item;
  //   console.log(id)
  useFocusEffect(
    useCallback(() => {
      const fetchPeople = async () => {
        try {
          // Only fetch rewards if user data is available
          const response = await axios.get(
            `${baseURL}/getSingleUserpost.php?id=${id}`
          );
          // console.log(response.data);
          if (response.status == 200) {
            setUserPost(response.data);
            // console.log(response.data);
          } else {
            console.error("Failed to fetch post user");
          }
        } catch (error) {
          console.error("Error while fetching post user:", error.message);
        }
      };

      fetchPeople();
    }, [isFocused])
  );
  return (
    <View style={{ flex: 1 }}>
      <UserPosts
        item={userPost}
        index={1}
        user_id={userPost.user_id}
        arena={null}
      />
    </View>
  );
};

export default SingleUserPost;

const styles = StyleSheet.create({});
