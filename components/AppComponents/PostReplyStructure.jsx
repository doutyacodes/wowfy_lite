import { Entypo } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL } from "../../backend/baseData";
import PostCommentStructure from "./PostCommentStructure";

const ReplyStructure = ({
  item,
  isVisible,
  handleReply,
  handleReply2,
  showReplyBox,
  setShowReplyBox,
  parentId,
  fetchComments,
  setShowOptions,
  showOptions,
  user_id,
}) => {
  //   const formattedDate = moment(item.created_at).fromNow();
  const navigation = useNavigation();
  // console.log(parentId)
  return isVisible ? (
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
          <Text style={styles.avatarText}>{item.first_character}</Text>
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
          <Text style={{ fontFamily: "raleway-bold", fontSize: 16 }}>
            {item.name}
          </Text>
          {/* <Text style={{ color: "gray", opacity: 0.7, fontSize: 13 }}>
            {formattedDate}
          </Text> */}
          <View style={{ marginLeft: "auto" }}>
            <TouchableOpacity>
              <Entypo
                name="dots-three-horizontal"
                size={20}
                color="gray"
                onPress={() => {
                  showOptions == item.id
                    ? setShowOptions(0)
                    : setShowOptions(item.id);
                }}
              />
            </TouchableOpacity>
          </View>
        </View>
        <PostCommentStructure
          comment_text={item.comment_text}
          commentId={item.id}
          handleReply={handleReply}
          handleReply2={handleReply2}
          showReplyBox={showReplyBox}
          setShowReplyBox={setShowReplyBox}
          reply={true}
          parentId={parentId}
          fetchComments={fetchComments}
          setShowOptions={setShowOptions}
          showOptions={showOptions}
          user_id={user_id}
          item={item}
        />
      </View>
    </View>
  ) : null;
};

export default ReplyStructure;

const styles = StyleSheet.create({
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
