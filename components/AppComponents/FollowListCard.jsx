import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import AwesomeAlert from "react-native-awesome-alerts";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import Toast from "react-native-root-toast";
import { baseImgURL, baseURL } from "../../backend/baseData";

const FollowListCard = ({ item, user }) => {
  const [following, setFollowing] = useState(
    item.following == "yes" ? true : false
  );
  const [showAlert, setShowAlert] = useState(false);
  const Navpass = "OtherUserScreen";
  const navigation = useNavigation();
  //   console.log("following",item)
  // console.log(following)
  useEffect(() => {
    setFollowing(item.following == "yes" ? true : false);
  }, [item.following]);

  const handleFollow = async () => {
    if (user) {
      try {
        baSeNav = `${baseURL}/toggle-user-follow.php?followed_user=${user.id}&user_id=${item.id}`;

        const response = await axios.get(`${baSeNav}`);
        console.log(response.data);
        if (response.status == 200) {
          setFollowing((prevFollowing) => !prevFollowing);
          if (following == false) {
            if (item.account_status) {
              if (item.account_status == "private") {
                let toast = Toast.show(
                  `You succesfully requested to follow ${item.name}`,
                  {
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
                  }
                );
                return;
              }
            }
            let toast = Toast.show(`You started following ${item.name}`, {
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
            let toast = Toast.show(`You unfollowed ${item.name}`, {
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
          }
        } else {
          console.error("Failed to toggle followers");
        }
      } catch (error) {
        console.error("Error while toggling followers:", error.message);
      }
    }
  };
  return (
    <>
      <View
        style={{
          flexDirection: "row",
          gap: 10,
          alignItems: "center",
          paddingVertical: 10,
        }}
      >
        <TouchableOpacity
          onPress={() =>
            navigation.navigate(Navpass, { user_id: item.user_id })
          }
          style={{
            flexDirection: "row",
            gap: 10,
            alignItems: "center",
            flex: 1,
          }}
        >
          {item.user_image ? (
            <Image
              source={{ uri: `${baseImgURL + item.user_image}` }}
              style={{
                width: wp(15),
                height: wp(15),
                borderRadius: wp(15),
              }}
            />
          ) : (
            <View
              style={{
                paddingHorizontal: 15,
                paddingVertical: 10,
                backgroundColor: "#ff8f8e",
                width: wp(15),
                height: wp(15),
                borderRadius: wp(15),
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Text
                style={{
                  fontSize: hp(2.3),
                  fontFamily: "raleway-bold",
                  color: "white",
                }}
              >
                {item.name.charAt(0)}
              </Text>
            </View>
          )}

          <Text
            style={{ fontSize: hp(1.8), fontFamily: "raleway-bold", flex: 1 }}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => {
            if (following) {
              setShowAlert(true);
            } else {
              handleFollow();
            }
          }}
          style={{
            shadowColor: "#000",
            backgroundColor: following ? "black" : "#0195f7",
            paddingVertical: 4,
            paddingHorizontal: 15,
            shadowOffset: {
              width: 0,
              height: 2,
            },
            shadowOpacity: 0.25,
            shadowRadius: 3.84,

            elevation: 5,
            borderRadius: 5,
            width: 110,
          }}
        >
          <Text
            style={{
              color: "white",
              fontFamily: "raleway-bold",
              textAlign: "center",
            }}
          >
            {following ? "Following" : "Follow"}
          </Text>
        </TouchableOpacity>
      </View>
      <AwesomeAlert
        show={showAlert}
        showProgress={false}
        title={`Unfollow ${item.name}`}
        message={`Are you sure you want to unfollow ${item.name}?`}
        closeOnTouchOutside={true}
        closeOnHardwareBackPress={false}
        showCancelButton={true}
        showConfirmButton={true}
        cancelText="Cancel"
        confirmText="Unfollow"
        confirmButtonColor="#DD6B55"
        onCancelPressed={() => setShowAlert(false)}
        onConfirmPressed={() => {
          handleFollow();
          setShowAlert(false);
        }}
      />
    </>
  );
};

export default FollowListCard;

const styles = StyleSheet.create({});
