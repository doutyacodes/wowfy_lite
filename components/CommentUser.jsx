import { Entypo, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

import axios from "axios";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import Toast from "react-native-root-toast";
import { baseImgURL, baseURL } from "../backend/baseData";
import UserCommentStructure from "./AppComponents/UserCommentStructure";
import UserReplyStructure from "./AppComponents/UserReplyStructure";
const CommentUser = ({ route }) => {
  const { user_id, item } = route.params;
  const navigation = useNavigation();
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [parentComment, setParentComment] = useState(0);
  const [subParent, setSubParent] = useState(0);
  const [commentData, setCommentData] = useState([]); // Initialize to null
  const [showReplies, setShowReplies] = useState({});
  const [showReplyBox, setShowReplyBox] = useState(null);
  const [showOptions, setShowOptions] = useState(0);

  const fetchComments = async () => {
    if (item) {
      try {
        const response = await axios.get(
          `${baseURL}/getUserComment.php?post_id=${item.post_id}&userId=${user_id}`
        );
        // console.log(response.data)
        if (response.status == 200) {
          // console.log(response.data);
          setCommentData(response.data);
        } else {
          console.error("Failed to fetch comments");
        }
      } catch (error) {
        console.error("Error while fetching comments:", error.message);
      }
    }
  };
  useEffect(() => {
    fetchComments();
  }, [item]);
  const textInputRef = useRef(null);
  const textInputRefs = useRef({});

  // console.log(item);
  const pressData1 = () => {
    // Show toast message
    let toast = Toast.show("Comment added successfully", {
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
  };
  const handleComment = async () => {
    try {
      const response = await axios.post(
        `${baseURL}/add-user-comment.php`,
        {
          parent_comment_id: parentComment,
          comment_text: commentText ? commentText : replyText,
          post_id: item.post_id,
          user_id: user_id,
          sub_parent: subParent,
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      // console.log(response.data);
      if (response.status == 200 && response.data.success) {
        pressData1();
        if (textInputRef.current) {
          textInputRef.current.blur();
        }
        setCommentText("");
        fetchComments();
      } else {
        console.log(`Something went wrong!!`);
      }
    } catch (error) {
      console.error("Error:", error.message);
    }
  };

  const toggleReplies = (commentId) => {
    setShowReplyBox(0);
    setShowReplies((prevState) => ({
      ...prevState,
      [commentId]: !prevState[commentId],
    }));
  };
  const handleReply = (parentId) => {
    console.log("handle reply called with parent id ", parentId);
    setReplyText("");
    setCommentText("");
    setParentComment(parentId);
    // Focus on the text input
    // if (textInputRef.current) {
    //   textInputRef.current.focus();
    // }
    if (textInputRefs.current[parentId]) {
      textInputRefs.current[parentId].focus();
    }
  };
  const handleReply2 = (parentId, sub) => {
    console.log("handle reply called with parent id ", parentId);
    setReplyText("");
    setCommentText("");
    // Focus on the text input
    setParentComment(parentId);
    setSubParent(sub);
    // if (textInputRef.current) {
    //   textInputRef.current.focus();
    // }
    if (textInputRefs.current[parentId]) {
      textInputRefs.current[parentId].focus();
    }
  };

  return (
    <View
      style={{
        flex: 1,
        justifyContent: "flex-end",
        backgroundColor: "white",
        padding: 15,
      }}
    >
      <View style={{ flex: 1 }}>
        <FlatList
          ListEmptyComponent={() => (
            <View
              style={{
                justifyContent: "center",
                alignItems: "center",
                flex: 1,
              }}
            >
              <Text style={{ fontFamily: "raleway-bold", fontSize: hp(2) }}>
                No comments yet.
              </Text>
            </View>
          )}
          contentContainerStyle={{ flex: 1 }}
          data={commentData}
          keyExtractor={(item, index) => index}
          ItemSeparatorComponent={
            <View>
              <View style={{ height: 20 }} />
            </View>
          }
          showsVerticalScrollIndicator={false}
          renderItem={({ index, item }) => {
            // const formattedDate = moment(item.created_at).fromNow();

            return (
              <View style={{ position: "relative" }}>
                <View style={{ flexDirection: "row", gap: 15 }}>
                  <TouchableOpacity
                    onPress={() => {
                      navigation.navigate("OtherUserScreen", {
                        user_id: item.user_id,
                      });
                    }}
                    style={styles.avatarContainer}
                  >
                    {item.user_image?.length > 0 ? (
                      <Image
                        style={{
                          width: wp(12),
                          height: wp(12),
                          borderRadius: 50,
                        }}
                        source={{
                          uri: `${baseImgURL + item.user_image}`,
                        }}
                      />
                    ) : (
                      <Text style={styles.avatarText}>
                        {item.first_character}
                      </Text>
                    )}
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <View
                      style={{
                        flex: 1,
                        flexDirection: "row",
                        gap: 10,
                        alignItems: "center",
                        marginBottom: 5,
                      }}
                    >
                      <Text
                        style={{ fontFamily: "raleway-bold", fontSize: 16 }}
                      >
                        {item.name}
                      </Text>
                      {/* <Text
                        style={{ color: "gray", opacity: 0.7, fontSize: 13 }}
                      >
                        {formattedDate}
                      </Text> */}
                      <View style={{ marginLeft: "auto" }}>
                        <TouchableOpacity
                          onPress={() => {
                            showOptions == item.id
                              ? setShowOptions(0)
                              : setShowOptions(item.id);
                          }}
                        >
                          <Entypo
                            name="dots-three-horizontal"
                            size={20}
                            color="gray"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>
                    <UserCommentStructure
                      comment_text={item.comment_text}
                      commentId={item.id}
                      handleReply={handleReply}
                      handleReply2={handleReply2}
                      showReplyBox={showReplyBox}
                      setShowReplyBox={setShowReplyBox}
                      parentId={item.id}
                      fetchComments={fetchComments}
                      setShowOptions={setShowOptions}
                      showOptions={showOptions}
                      user_id={user_id}
                      item={item}
                    />
                    {item.replies && item.replies?.length > 0 && (
                      <View style={{ marginTop: 19 }}>
                        <TouchableOpacity
                          style={{ marginBottom: 10 }}
                          onPress={() => toggleReplies(item.id)}
                        >
                          <Text>
                            {showReplies[item.id]
                              ? "Hide Replies"
                              : "Show Replies"}
                          </Text>
                        </TouchableOpacity>
                        {/* Replies */}
                        <View style={{ gap: 12 }}>
                          {item.replies.map((reply, replyIndex) => (
                            <UserReplyStructure
                              key={reply.id}
                              item={reply}
                              isVisible={showReplies[item.id]}
                              handleReply={handleReply}
                              handleReply2={handleReply2}
                              showReplyBox={showReplyBox}
                              setShowReplyBox={setShowReplyBox}
                              reply={false}
                              parentId={item.id}
                              fetchComments={fetchComments}
                              setShowOptions={setShowOptions}
                              showOptions={showOptions}
                              user_id={user_id}
                            />
                          ))}
                        </View>
                      </View>
                    )}
                    {showReplyBox == item.id && (
                      <View
                        style={{ marginTop: 10, flexDirection: "row", gap: 3 }}
                      >
                        <View
                          style={{
                            backgroundColor: "#e5e5e5",
                            borderRadius: 12,
                            flex: 1,
                          }}
                        >
                          <TextInput
                            testID={`${item.id}`} // Add unique testID
                            ref={(ref) => {
                              textInputRefs.current[`${item.id}`] = ref;
                            }}
                            onChangeText={(text) => setReplyText(text)}
                            style={{ flex: 1, padding: 10 }}
                            placeholder="Write your reply"
                          />
                        </View>
                        <TouchableOpacity
                          style={{
                            padding: 10,
                            paddingHorizontal: 15,
                            borderRadius: 8,
                          }}
                          onPress={handleComment}
                        >
                          <Ionicons name="send" size={24} color="#8B42FC" />
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
                {/* line left */}
                {item.replies &&
                  item.replies?.length > 0 &&
                  showReplies[item.id] && (
                    <View
                      style={{
                        position: "absolute",
                        height: "100%",
                        borderWidth: 0.7,
                        borderColor: "#e5e5e5",
                        top: 0,
                        left: wp(6),
                        zIndex: -2,
                      }}
                    />
                  )}
              </View>
            );
          }}
        />
      </View>
      <View
        style={{
          paddingBottom: 15,
          paddingHorizontal: 19,
          paddingVertical: 10,
          width: wp(100),
          backgroundColor: "white",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            gap: 5,
            alignItems: commentText?.length > 2 ? "flex-end" : "center",
          }}
        >
          <TextInput
            style={{
              flex: 1,
              backgroundColor: "#E5E5E5",
              padding: 10,
              paddingTop: 10,
              borderRadius: 26,
            }}
            onChangeText={(text) => setCommentText(text)}
            multiline
            placeholder={`Write a comment...`}
            ref={textInputRef}
          />

          {commentText?.trim()?.length > 0 && (
            <TouchableOpacity
              style={{
                padding: 10,
                paddingHorizontal: 15,
                borderRadius: 8,
              }}
              onPress={handleComment}
            >
              <Ionicons name="send" size={24} color="#8B42FC" />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
};

export default CommentUser;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    // alignItems: "center",
    // justifyContent: "flex-start",
    marginVertical: 50,
  },
  topLogo: {
    height: 50,
    width: 50,
  },
  card: {
    backgroundColor: "white",
    padding: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    gap: 8,
  },
  avatarContainer: {
    justifyContent: "center",
    alignItems: "center",
    height: wp(12),
    width: wp(12),
    backgroundColor: "#ff8f8e",
    borderRadius: 50,
  },
  avatarContainer2: {
    justifyContent: "center",
    alignItems: "center",
    height: wp(10),
    width: wp(10),
    backgroundColor: "#ff8f8e",
    borderRadius: 50,
  },
  avatarText: {
    fontFamily: "raleway-bold",
    color: "white",
    fontSize: wp(5),
  },
  avatarText2: {
    fontFamily: "raleway-bold",
    color: "white",
    fontSize: wp(4),
  },
  detailsContainer: {
    gap: 5,
  },
  name: {
    fontSize: hp(1.9),
    fontFamily: "raleway-bold",
  },
  date: {
    fontSize: hp(1.6),
    color: "#898989",
  },
  reportIcon: {
    marginLeft: "auto",
  },
  image: {
    height: wp(80),
    height: wp(80),
    borderRadius: 10,
  },
  captionContainer: {
    paddingTop: 10,
  },
  caption: {
    fontSize: hp(1.9),
    fontFamily: "raleway-bold",
  },
});
