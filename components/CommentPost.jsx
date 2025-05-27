import React, { useEffect, useRef, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Animated,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { Entypo, Ionicons, Feather, MaterialCommunityIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import Toast from "react-native-root-toast";
import { baseImgURL, baseURL } from "../backend/baseData";
import PostCommentStructure from "./AppComponents/PostCommentStructure";
import PostReplyStructure from "./AppComponents/PostReplyStructure";
import { BlurView } from "expo-blur";

// Custom Toast component
const CustomToast = ({ visible, message, onDismiss }) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.delay(2000),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start(() => {
        onDismiss();
      });
    }
  }, [visible, fadeAnim, onDismiss]);

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.toastContainer,
        {
          opacity: fadeAnim,
          transform: [
            {
              translateY: fadeAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [20, 0],
              }),
            },
          ],
        },
      ]}
    >
      <View style={styles.toastContent}>
        <Feather name="check-circle" size={20} color="#4CAF50" />
        <Text style={styles.toastText}>{message}</Text>
      </View>
    </Animated.View>
  );
};

// Empty Comments component
const EmptyComments = () => (
  <View style={styles.emptyCommentsContainer}>
    <MaterialCommunityIcons name="comment-text-outline" size={60} color="#DDDDDD" />
    <Text style={styles.emptyCommentsTitle}>No comments yet</Text>
    <Text style={styles.emptyCommentsSubtitle}>Be the first to share your thoughts</Text>
  </View>
);

// Comment component
const CommentItem = ({ 
  item, 
  user_id, 
  showReplies, 
  toggleReplies, 
  showReplyBox, 
  setShowReplyBox,
  showOptions,
  setShowOptions,
  handleReply,
  handleReply2,
  textInputRefs,
  replyText,
  setReplyText,
  handleComment,
  fetchComments
}) => {
  return (
    <View style={styles.commentContainer}>
      <View style={styles.commentHeader}>
        <TouchableOpacity
          onPress={() => {
            navigation.navigate("OtherUserScreen", {
              user_id: item.user_id,
            });
          }}
        >
          {item.user_image?.length > 0 ? (
            <Image
              style={styles.commentAvatar}
              source={{
                uri: `${baseImgURL + item.user_image}`,
              }}
            />
          ) : (
            <View style={styles.commentAvatarPlaceholder}>
              <Text style={styles.commentAvatarText}>
                {item.first_character}
              </Text>
            </View>
          )}
        </TouchableOpacity>
        
        <View style={styles.commentMetadata}>
          <Text style={styles.commentUsername}>{item.name}</Text>
          {/* Time stamp would go here */}
        </View>
        
        <TouchableOpacity
          style={styles.commentOptionsButton}
          onPress={() => {
            setShowOptions(showOptions == item.id ? 0 : item.id);
          }}
        >
          <Entypo name="dots-three-horizontal" size={18} color="#999" />
        </TouchableOpacity>
      </View>
      
      <PostCommentStructure
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
      
      {/* Reply section */}
      {item.replies && item.replies?.length > 0 && (
        <View style={styles.repliesContainer}>
          <TouchableOpacity
            style={styles.showRepliesButton}
            onPress={() => toggleReplies(item.id)}
          >
            <Text style={styles.showRepliesText}>
              {showReplies[item.id] ? (
                <>
                  <Feather name="chevron-up" size={14} color="#6C63FF" /> Hide replies
                </>
              ) : (
                <>
                  <Feather name="chevron-down" size={14} color="#6C63FF" /> Show {item.replies?.length} {item.replies?.length == 1 ? 'reply' : 'replies'}
                </>
              )}
            </Text>
          </TouchableOpacity>
          
          {/* Replies list */}
          <View style={styles.repliesList}>
            {item.replies.map((reply, replyIndex) => (
              <Animated.View 
                key={reply.id}
                style={[
                  styles.replyItemContainer,
                  { 
                    display: showReplies[item.id] ? 'flex' : 'none',
                    opacity: showReplies[item.id] ? 1 : 0 
                  }
                ]}
              >
                <PostReplyStructure
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
              </Animated.View>
            ))}
          </View>
        </View>
      )}
      
      {/* Reply input box */}
      {showReplyBox == item.id && (
        <View style={styles.replyInputContainer}>
          <TextInput
            ref={(ref) => {
              textInputRefs.current[`${item.id}`] = ref;
            }}
            style={styles.replyInput}
            placeholder="Write your reply..."
            placeholderTextColor="#999"
            value={replyText}
            onChangeText={setReplyText}
            multiline
          />
          <TouchableOpacity
            style={[
              styles.replySendButton,
              !replyText.trim() && styles.replySendButtonDisabled
            ]}
            onPress={handleComment}
            disabled={!replyText.trim()}
          >
            <Ionicons 
              name="send" 
              size={20} 
              color={replyText.trim() ? "#6C63FF" : "#BBBBBB"} 
            />
          </TouchableOpacity>
        </View>
      )}
      
      {/* Reply connection line */}
      {item.replies &&
        item.replies?.length > 0 &&
        showReplies[item.id] && (
          <View style={styles.replyConnector} />
        )}
    </View>
  );
};

const CommentPost = ({ route }) => {
  const { user_id, item } = route.params;
  const navigation = useNavigation();
  const [commentText, setCommentText] = useState("");
  const [replyText, setReplyText] = useState("");
  const [parentComment, setParentComment] = useState(0);
  const [subParent, setSubParent] = useState(0);
  const [commentData, setCommentData] = useState([]);
  const [showReplies, setShowReplies] = useState({});
  const [showReplyBox, setShowReplyBox] = useState(null);
  const [showOptions, setShowOptions] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const textInputRef = useRef(null);
  const textInputRefs = useRef({});
  const flatListRef = useRef(null);

  const fetchComments = async () => {
    if (item) {
      setLoading(true);
      try {
        const response = await axios.get(
          `${baseURL}/getPostComments.php?post_id=${item.post_id}&userId=${user_id}`
        );

        if (response.status == 200) {
          setCommentData(response.data);
        } else {
          console.error("Failed to fetch comments");
        }
      } catch (error) {
        console.error("Error while fetching comments:", error.message);
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchComments();
  }, [item]);

  const displayToast = (message) => {
    setToastMessage(message);
    setShowToast(true);
  };

  const handleComment = async () => {
    const commentToSend = parentComment ? replyText : commentText;
    
    if (!commentToSend.trim()) return;
    
    try {
      const response = await axios.post(
        `${baseURL}/add-post-comment.php`,
        {
          parent_comment_id: parentComment,
          comment_text: commentToSend,
          post_id: item.post_id,
          user_id: user_id,
          sub_parent: subParent,
          page_id: item.page_id,
        },
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );
      
      if (response.status == 200 && response.data.success) {
        // Reset states
        setCommentText("");
        setReplyText("");
        setShowReplyBox(null);
        setParentComment(0);
        setSubParent(0);
        
        // Blur input
        if (textInputRef.current) {
          textInputRef.current.blur();
        }
        
        // Display toast
        displayToast("Comment added successfully");
        
        // Fetch updated comments
        await fetchComments();
        
        // Scroll to bottom for new comments
        if (!parentComment && flatListRef.current) {
          setTimeout(() => {
            flatListRef.current.scrollToEnd({ animated: true });
          }, 300);
        }
      } else {
        displayToast("Failed to add comment");
      }
    } catch (error) {
      console.error("Error:", error.message);
      displayToast("Failed to add comment");
    }
  };

  const toggleReplies = (commentId) => {
    setShowReplyBox(null);
    setShowReplies((prevState) => ({
      ...prevState,
      [commentId]: !prevState[commentId],
    }));
  };

  const handleReply = (parentId) => {
    setReplyText("");
    setParentComment(parentId);
    setSubParent(0);
    setShowReplyBox(parentId);
    
    setTimeout(() => {
      if (textInputRefs.current[`${parentId}`]) {
        textInputRefs.current[`${parentId}`].focus();
      }
    }, 100);
  };

  const handleReply2 = (parentId, sub) => {
    setReplyText("");
    setParentComment(parentId);
    setSubParent(sub);
    setShowReplyBox(parentId);
    
    setTimeout(() => {
      if (textInputRefs.current[`${parentId}`]) {
        textInputRefs.current[`${parentId}`].focus();
      }
    }, 100);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS == "ios" ? "padding" : "height"}
      style={styles.container}
      keyboardVerticalOffset={Platform.OS == "ios" ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Comments</Text>
        <View style={styles.headerRight}>
          {/* Placeholder for header right items if needed */}
        </View>
      </View>
      
      <View style={styles.commentsContainer}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#6C63FF" />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={commentData}
            keyExtractor={(item, index) => `comment-${item.id || index}`}
            contentContainerStyle={commentData?.length == 0 ? {flex: 1} : {paddingBottom: 20}}
            showsVerticalScrollIndicator={false}
            ItemSeparatorComponent={() => <View style={styles.commentSeparator} />}
            ListEmptyComponent={<EmptyComments />}
            renderItem={({ item }) => (
              <CommentItem
                item={item}
                user_id={user_id}
                showReplies={showReplies}
                toggleReplies={toggleReplies}
                showReplyBox={showReplyBox}
                setShowReplyBox={setShowReplyBox}
                showOptions={showOptions}
                setShowOptions={setShowOptions}
                handleReply={handleReply}
                handleReply2={handleReply2}
                textInputRefs={textInputRefs}
                replyText={replyText}
                setReplyText={setReplyText}
                handleComment={handleComment}
                fetchComments={fetchComments}
              />
            )}
          />
        )}
      </View>
      
      <View style={styles.commentInputContainer}>
        <View style={styles.commentInputWrapper}>
          <TextInput
            style={styles.commentInput}
            placeholder="Write a comment..."
            placeholderTextColor="#999"
            value={commentText}
            onChangeText={setCommentText}
            multiline
            ref={textInputRef}
            onFocus={() => {
              // Reset any reply state when focusing on main comment input
              setShowReplyBox(null);
              setParentComment(0);
              setSubParent(0);
            }}
          />
          <TouchableOpacity
            style={[
              styles.sendButton,
              !commentText.trim() && styles.sendButtonDisabled
            ]}
            onPress={handleComment}
            disabled={!commentText.trim()}
          >
            <Ionicons 
              name="send" 
              size={24} 
              color={commentText.trim() ? "#6C63FF" : "#BBBBBB"} 
            />
          </TouchableOpacity>
        </View>
      </View>
      
      {/* Custom Toast */}
      <CustomToast
        visible={showToast}
        message={toastMessage}
        onDismiss={() => setShowToast(false)}
      />
    </KeyboardAvoidingView>
  );
};

export default CommentPost;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontFamily: 'raleway-bold',
    textAlign: 'center',
  },
  headerRight: {
    width: 30, // Balance the header
  },
  commentsContainer: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCommentsContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyCommentsTitle: {
    fontSize: 18,
    fontFamily: 'raleway-bold',
    color: '#333',
    marginTop: 16,
  },
  emptyCommentsSubtitle: {
    fontSize: 14,
    fontFamily: 'raleway',
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  commentContainer: {
    position: 'relative',
    paddingBottom: 8,
  },
  commentSeparator: {
    height: 16,
  },
  commentHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  commentAvatar: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
  },
  commentAvatarPlaceholder: {
    width: wp(10),
    height: wp(10),
    borderRadius: wp(5),
    backgroundColor: '#6C63FF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  commentAvatarText: {
    fontFamily: 'raleway-bold',
    color: 'white',
    fontSize: wp(4),
  },
  commentMetadata: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  commentUsername: {
    fontFamily: 'raleway-bold',
    fontSize: 15,
    color: '#333',
  },
  commentTimestamp: {
    fontFamily: 'raleway',
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  commentOptionsButton: {
    padding: 4,
  },
  repliesContainer: {
    marginLeft: wp(10) + 12, // Avatar width + margin
    marginTop: 8,
  },
  showRepliesButton: {
    marginBottom: 8,
  },
  showRepliesText: {
    fontFamily: 'raleway-medium',
    fontSize: 14,
    color: '#6C63FF',
  },
  repliesList: {
    marginLeft: 8,
  },
  replyItemContainer: {
    marginBottom: 12,
  },
  replyConnector: {
    position: 'absolute',
    left: wp(5),
    top: wp(14), // Adjust based on avatar position
    bottom: 0,
    width: 1.5,
    backgroundColor: '#F0F0F0',
    zIndex: -1,
  },
  replyInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginTop: 12,
    marginLeft: wp(10) + 12, // Avatar width + margin
    backgroundColor: '#F8F8F8',
    borderRadius: 20,
    padding: 4,
  },
  replyInput: {
    flex: 1,
    fontFamily: 'raleway',
    fontSize: 14,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
  },
  replySendButton: {
    padding: 8,
    borderRadius: 20,
    marginLeft: 4,
  },
  replySendButtonDisabled: {
    opacity: 0.5,
  },
  commentInputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  commentInputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#F8F8F8',
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  commentInput: {
    flex: 1,
    fontFamily: 'raleway',
    fontSize: 15,
    paddingVertical: 10,
    maxHeight: 120,
  },
  sendButton: {
    padding: 8,
    marginLeft: 8,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  toastContainer: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 1000,
  },
  toastContent: {
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 50,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  toastText: {
    fontFamily: 'raleway-medium',
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
});