import { FontAwesome, FontAwesome5 } from "@expo/vector-icons";
import axios from "axios";
import React, { useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Divider } from "react-native-paper";
import Toast from "react-native-toast-message";
import { baseURL } from "../../backend/baseData";

const PostCommentStructure = ({
  comment_text,
  commentId,
  handleReply,
  handleReply2,
  fetchComments,
  setShowReplyBox,
  reply,
  parentId,
  showOptions,
  user_id,
  item,
}) => {
  const [heartActive, setHeartActive] = useState(
    item.already_liked ? item.already_liked : false
  );
  const [count, setCount] = useState(
    parseInt(item.post_comment_likes_count ? item.post_comment_likes_count : 0)
  );
  const handleHeart = async () => {
    // Alert.alert(item.post_id)
    try {
      const response = await axios.get(
        `${baseURL}/toggle-post-comments.php?post_id=${item.post_id}&page_id=${item.page_id}&comment_author=${item.user_id}&comment_id=${item.id}&user_id=${user_id}`
      );
      // console.log(response.data)

      if (response.status == 200) {
        if (!heartActive) {
          setCount((prevCount) => prevCount + 1);
        } else {
          setCount((prevCount) => prevCount - 1);
        }
        setHeartActive((prevHeart) => !prevHeart);
        // console.log(response.data)
      } else {
        console.error("Failed to toggle likes comment");
      }
    } catch (error) {
      Alert.alert(item.post_id);
      console.error("Error while toggling likes comment:", error.message);
    }
  };
  const HandleReplyCheck = () => {
    if (reply) {
      handleReply2(parentId, commentId); // Invoke handleReply2 directly
    } else {
      handleReply(parentId); // Invoke handleReply directly
    }
    setShowReplyBox(parentId);
  };

  // console.log(parentId)
  const handleDelete = async (id) => {
    try {
      const response = await axios.get(
        `${baseURL}/delete-post-comment.php?id=${id}`
      );
      // console.log(response.data);
      if (response.status == 200) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: `Comment deleted successfully`,
        });

        fetchComments();
      } else {
        Toast.show({
          type: "error",
          text1: "Oops",
          text2: `Something went wrong!!`,
        });
      }
    } catch (error) {
      console.error("Error:", error.message);
      Toast.show({
        type: "error",
        text1: "Oops",
        text2: `Something went wrong!!.please try again`,
      });
    }
  };
  const showAlertFunction2 = () => {
    Alert.alert(
      "Delete Comment",
      "Are you sure you want to delete this comment?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Delete",
          onPress: () => handleDelete(commentId),
        },
      ]
    );
  };
  const handleReport = async () => {
    try {
      const response = await axios.get(
        `${baseURL}/report-post-comment.php?comment_id=${item.id}&post_id=${item.post_id}&user_id=${item.user_id}&reported_user=${user_id}`
      );

      // console.log(response.data);
      if (response.status == 200) {
        Toast.show({
          type: "success",
          text1: "Success",
          text2: `Comment reported successfully`,
        });

        fetchComments();
      } else {
        console.error("Failed to report media");
      }
    } catch (error) {
      console.error("Error while report media:", error.message);
    }
  };
  const showAlertFunction = () => {
    Alert.alert(
      "Report Comment",
      "Are you sure you want to report this comment?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Report",
          onPress: () => handleReport(),
        },
      ]
    );
  };
  return (
    <View style={{ position: "relative" }}>
      <TouchableOpacity>
        <Text
          style={{
            fontSize: 14,
            color: "#525252",
            fontStyle: item.reported == "no" ? "normal" : "italic",
          }}
        >
          {item.reported == "no"
            ? comment_text
            : "This comment is reported by you."}
        </Text>
      </TouchableOpacity>
      <View
        style={{
          flexDirection: "row",
          gap: 15,
          marginTop: 10,
          alignItems: "center",
        }}
      >
        <TouchableOpacity
          onPress={handleHeart}
          style={{
            flexDirection: "row",
            gap: 5,
            alignItems: "center",
            padding: 3,
          }}
        >
          {heartActive ? (
            <FontAwesome name="heart" size={15} color="red" />
          ) : (
            <FontAwesome5 name="heart" size={15} color="black" />
          )}
          <Text> {count} likes</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={HandleReplyCheck}>
          <Text style={{ fontWeight: "600", fontSize: 13 }}>Reply</Text>
        </TouchableOpacity>
      </View>
      {showOptions == commentId && (
        <View
          style={{
            position: "absolute",
            backgroundColor: "white",
            right: 0,
            top: 0,
            borderWidth: 0.5,
            borderColor: "#e5e5e5",
            zIndex: 50,
            borderRadius: 13,
          }}
        >
          {item.user_id == user_id && (
            <>
              <TouchableOpacity
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: 3,
                  padding: 6,
                  paddingHorizontal: 17,
                }}
                onPress={showAlertFunction2}
              >
                <Text>Delete</Text>
                <FontAwesome name="trash" size={15} color="red" />
              </TouchableOpacity>
              <Divider />
            </>
          )}
          <TouchableOpacity
            onPress={showAlertFunction}
            style={{
              flexDirection: "row",
              alignItems: "center",
              gap: 3,
              padding: 6,
              paddingHorizontal: 17,
            }}
          >
            <Text>Report</Text>
            <FontAwesome name="info-circle" size={15} color="red" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

export default PostCommentStructure;

const styles = StyleSheet.create({});
