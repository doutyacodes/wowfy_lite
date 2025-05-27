import { Entypo } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useEffect, useState } from "react";
import {
  FlatList,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { TouchableOpacity } from "react-native-gesture-handler";
import { Divider } from "react-native-paper";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import { SceneMap, TabBar, TabView } from "react-native-tab-view";
import { baseURL } from "../backend/baseData";
import FollowListCard from "./AppComponents/FollowListCard";

const FriendsScreen = ({ route }) => {
  const { user } = route.params;
  const [followCount, setFollowCount] = useState(0);
  const [followersCount, setFollowersCount] = useState(0);
  const [friends_count, setFriends_count] = useState(0);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [friends, setFriends] = useState([]);
  useEffect(() => {
    const fetchFollowers = async () => {
      if (user) {
        try {
          const response = await axios.get(
            `${baseURL}/getUserFollowers.php?user_id=${user.id}`
          );
          if (response.status == 200) {
            setFollowers(response.data);
            setFollowersCount(response.data?.length);
            // console.log(response.data);
          } else {
            console.error("Failed to fetch followers");
          }
        } catch (error) {
          console.error("Error while fetching followers:", error.message);
        }
      }
    };

    fetchFollowers();
    const fetchFollowing = async () => {
      if (user) {
        try {
          const response = await axios.get(
            `${baseURL}/getUserFollowing.php?user_id=${user.id}`
          );
          if (response.status == 200) {
            setFollowing(response.data);
            setFollowCount(response.data?.length);

            //   console.log(response.data?.length);
          } else {
            console.error("Failed to fetch following");
          }
        } catch (error) {
          console.error("Error while fetching following:", error.message);
        }
      }
    };

    fetchFollowing();
    const fetchFriends = async () => {
      if (user) {
        try {
          const response = await axios.get(
            `${baseURL}/getUserFriends.php?user_id=${user.id}`
          );
          if (response.status == 200) {
            setFriends(response.data);
            setFriends_count(response.data?.length);

            // console.log(response.data);
          } else {
            console.error("Failed to fetch friends");
          }
        } catch (error) {
          console.error("Error while fetching friends:", error.message);
        }
      }
    };

    fetchFriends();
  }, [user]);
  const navigation = useNavigation();
  const FollowRoute = () => {
    return (
      <FlatList
        data={following}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View>
            {/* <View style={{ height: 10 }} /> */}
            <Divider />
          </View>
        )}
        renderItem={({ item, index }) => {
          return <FollowListCard item={item} index={index} user={user} />;
        }}
        ListEmptyComponent={() => (
          <View
            style={{ justifyContent: "center", alignItems: "center", flex: 1 }}
          >
            <Text style={{ fontFamily: "raleway-bold", fontSize: hp(2) }}>
              No users.
            </Text>
          </View>
        )}
        contentContainerStyle={{ flex: 1, padding: 15 }}
      />
    );
  };
  const FollowerRoute = () => {
    return (
      <FlatList
        data={followers}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View>
            {/* <View style={{ height: 10 }} /> */}
            <Divider />
          </View>
        )}
        renderItem={({ item, index }) => {
          return <FollowListCard item={item} index={index} user={user} />;
        }}
        ListEmptyComponent={() => (
          <View
            style={{ justifyContent: "center", alignItems: "center", flex: 1 }}
          >
            <Text style={{ fontFamily: "raleway-bold", fontSize: hp(2) }}>
              No users.
            </Text>
          </View>
        )}
        contentContainerStyle={{ flex: 1, padding: 15 }}
      />
    );
  };
  const FriendRoute = () => {
    return (
      <FlatList
        data={friends}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => (
          <View>
            {/* <View style={{ height: 10 }} /> */}
            <Divider />
          </View>
        )}
        renderItem={({ item, index }) => {
          return <FollowListCard item={item} index={index} user={user} />;
        }}
        ListEmptyComponent={() => (
          <View
            style={{ justifyContent: "center", alignItems: "center", flex: 1 }}
          >
            <Text style={{ fontFamily: "raleway-bold", fontSize: hp(2) }}>
              No users.
            </Text>
          </View>
        )}
        contentContainerStyle={{ flex: 1, padding: 15 }}
      />
    );
  };

  const renderScene = SceneMap({
    followers: FollowerRoute,
    following: FollowRoute,
    friends: FriendRoute,
  });
  const layout = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const [routes] = useState([
    { key: "followers", title: `Followers` },

    { key: "following", title: `Following` },
    { key: "friends", title: `Friends` },
  ]);
  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: "white",
        marginTop: Platform.OS == "android" ? 30 : 0,
      }}
    >
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 15,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Entypo name="chevron-left" size={24} color="black" />
        </TouchableOpacity>
        <Text style={{ fontSize: hp(2.1), fontFamily: "raleway-bold" }}>
          {user.name?.length > 30 ? user.name.slice(0, 30) + "..." : user.name}
        </Text>

        <View />
      </View>
      <TabView
        navigationState={{ index, routes }}
        renderScene={renderScene}
        onIndexChange={setIndex}
        initialLayout={{ width: layout.width }}
        indicatorStyle={{ backgroundColor: "white" }}
        style={{ backgroundColor: "white" }}
        swipeEnabled={true}
        renderTabBar={(props) => (
          <TabBar
            indicatorStyle={{ backgroundColor: "black" }}
            {...props}
            renderLabel={({ route, color }) => (
              <Text
                style={{
                  color: "black",
                  marginVertical: 8,
                  fontFamily: "raleway-bold",
                  fontSize: hp(1.5),
                }}
              >
                {route.title}
              </Text>
            )}
            style={{ backgroundColor: "white" }}
          />
        )} // <-- add this line
      />
    </SafeAreaView>
  );
};

export default FriendsScreen;

const styles = StyleSheet.create({});
