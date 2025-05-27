import {
  AntDesign,
  Entypo,
  FontAwesome6,
  MaterialCommunityIcons,
} from "@expo/vector-icons";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from "@react-navigation/drawer";
import { NavigationContainer } from "@react-navigation/native";
import {
  createStackNavigator,
  TransitionPresets,
} from "@react-navigation/stack";
import React from "react";
import { Text, View } from "react-native";
import { heightPercentageToDP as hp } from "react-native-responsive-screen";
import AcceleroMeterScreen from "../components/AcceleroMeterScreen.jsx";
import ArenaScreen from "../components/ArenaScreen.jsx";
import BarCodeScreen from "../components/BarCodeScreen.jsx";
import BuzzwallScreen from "../components/BuzzwallScreen.jsx";
import CameraScreen from "../components/CameraScreen.jsx";
import CertificateViewer from "../components/CertificateViewer.jsx";
import ChallengeDetails from "../components/ChallengeDetails";
import Challenges from "../components/Challenges";
import ChallengesList from "../components/ChallengesList.jsx";
import CommentPeople from "../components/CommentPeople.jsx";
import CommentPost from "../components/CommentPost.jsx";
import CommentUser from "../components/CommentUser.jsx";
import CustomDrawer from "../components/CustomDrawer.jsx";
import CustomNestedDrawer from "../components/CustomNestedDrawer.jsx";
import CustomTabBar from "../components/CustomTabBar.jsx";
import DetailSignup from "../components/DetailSignup.jsx";
import EditProfile from "../components/EditProfile.jsx";
import EntryCard from "../components/EntryCard.jsx";
import FaqScreen from "../components/FaqScreen.jsx";
import FeedbackScreen from "../components/FeedbackScreen.jsx";
import FlightDetail from "../components/FlightDetail.jsx";
import Followpage from "../components/Followpage.jsx";
import FoodApprovalScreen from "../components/FoodApprovalScreen.jsx";
import FoodLocation from "../components/FoodLocation.jsx";
import FoodMap from "../components/FoodMap.jsx";
import ForceUpdate from "../components/ForceUpdate.jsx";
import FriendsScreen from "../components/FriendsScreen.jsx";
import Home from "../components/Home";
import ImageList from "../components/ImagesList.jsx";
import ImageViewingScreen from "../components/ImageViewingScreen.jsx";
import LeaderScreen from "../components/LeaderScreen.jsx";
import LobbyScreen from "../components/LobbyScreen.jsx";
import Login from "../components/Login";
import MaintenanceScreen from "../components/MaintenanceScreen.jsx";
import MapScreen from "../components/MapScreen.jsx";
import Moviehome from "../components/Moviehome";
import NoInternet from "../components/NoInternet.jsx";
import NotificationScreen from "../components/NotificationScreen.jsx";
import OtherUserScreen from "../components/OtherUserScreen.jsx";
import OtpVerification from "../components/OtpVerification.jsx";
import PeopleScreen from "../components/PeopleScreen.jsx";
import QuizComplete from "../components/QuizComplete.jsx";
import QuizCountPage from "../components/QuizCountPage.jsx";
import QuizLeaderScreen from "../components/QuizLeaderScreen";
import QuizPageScreen from "../components/QuizPageScreen.jsx";
import ReferralPage from "../components/ReferralPage.jsx";
import RewardDetails from "../components/RewardDetails.jsx";
import SearchScreen from "../components/SearchScreen.jsx";
import SelfieScreen from "../components/SelfieScreen.jsx";
import SelfieScreenShare from "../components/SelfieScreenShare.jsx";
import SettingScreen from "../components/SettingScreen.jsx";
import SignUp from "../components/SignUp";
import SinglePeople from "../components/SinglePeople.jsx";
import SingleUserPost from "../components/SingleUserPost.jsx";
import TaskDetails from "../components/TaskDetails";
import TestScreen from "../components/TestScreen.jsx";
import TodoScreen from "../components/TodoScreen.jsx";
import TopicScreen from "../components/TopicScreen.jsx";
import UserPost from "../components/UserPost.jsx";
import UserRewards from "../components/UserRewards.jsx";
import VideoScreen from "../components/VideoScreen";
import VideoTesting from "../components/VideoTesting.jsx";
import WelcomeScreen from "../components/WelcomeScreen";
import OnboardingScreen from "../components/OnboardingScreen.jsx";
import TaskCertificateViewer from "../components/TaskCertificateViewer.jsx";
const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const Drawer = createDrawerNavigator();
const NestedDrawer = createDrawerNavigator(); // Create a nested drawer navigator

function InnerPage() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Moviehome"
      sceneContainerStyle={{ position: "relative" }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
       <Tab.Screen
        name="Moviehome"
        options={() => ({
          tabBarButton: () => null,
        })}
        initialParams={{ movieId: 1 }}
        component={Moviehome}
      />
      <Tab.Screen
        name="BuzzwallScreen"
        component={BuzzwallScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Entypo
                name="home"
                size={28}
                color={focused ? "#db3022" : "gray"}
              />
              {
                <Text
                  style={{
                    fontSize: hp(1.5),
                    color: focused ? "#db3022" : "gray",
                  }}
                >
                  Buzzwall
                </Text>
              }
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="TodoScreen"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <FontAwesome6
                name="person-running"
                size={28}
                color={focused ? "purple" : "gray"}
              />
              {
                <Text
                  style={{
                    fontSize: hp(1.5),
                    color: focused ? "purple" : "gray",
                  }}
                >
                  In Progress
                </Text>
              }
            </View>
          ),
        }}
        component={TodoScreen}
      />
      <Tab.Screen
        name="Home"
        component={Home}
        options={{
          tabBarIcon: ({ focused }) => (
            <View
              style={{
                alignItems: "center",
                justifyContent: "center",
                position: "relative",
              }}
            >
              <AntDesign
                name="pluscircle"
                size={hp(8)}
                color={focused ? "#db3022" : "gray"}
                // style={{position:"absolute",bottom:0}}
              />
              {
                <Text
                  style={{
                    fontSize: hp(1.5),
                    color: focused ? "#db3022" : "gray",
                  }}
                ></Text>
              }
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Arena"
        component={ArenaScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <MaterialCommunityIcons
                name="sword-cross"
                size={28}
                color={focused ? "green" : "gray"}
              />
              {
                <Text
                  style={{
                    fontSize: hp(1.5),
                    color: focused ? "green" : "gray",
                  }}
                >
                  Arena
                </Text>
              }
            </View>
          ),
        }}
      />

      <Tab.Screen
        name="Peoples"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <FontAwesome6
                name="users"
                size={28}
                color={focused ? "purple" : "gray"}
              />
              {
                <Text
                  style={{
                    fontSize: hp(1.5),
                    color: focused ? "purple" : "gray",
                  }}
                >
                  People
                </Text>
              }
            </View>
          ),
        }}
        component={PeopleScreen}
      />
      <Tab.Screen
        name="OtherUserScreen"
        component={OtherUserScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={{ alignItems: "center", justifyContent: "center" }}>
              <MaterialCommunityIcons
                name="sword-cross"
                size={28}
                color={focused ? "green" : "gray"}
              />
              {
                <Text
                  style={{
                    fontSize: hp(1.5),
                    color: focused ? "green" : "gray",
                  }}
                >
                  Arena
                </Text>
              }
            </View>
          ),
        }}
      />

     
      <Tab.Screen
        name="Barcode"
        options={() => ({
          tabBarButton: () => null,
        })}
        component={BarCodeScreen}
      />
    </Tab.Navigator>
  );
}

const AppNavigator = () => {
  return (
    <Stack.Navigator
      initialRouteName="WelcomeScreen"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="InnerPage" component={InnerPage} />
      <Stack.Screen name="FoodMap" component={FoodMap} />
      <Stack.Screen name="FriendsScreen" component={FriendsScreen} />
      <Stack.Screen
        name="TaskCertificateViewer"
        component={TaskCertificateViewer}
      />
      <Stack.Screen name="TestScreen" component={TestScreen} />
      <Stack.Screen name="QuizCountPage" component={QuizCountPage} />
      <Stack.Screen name="FeedbackScreen" component={FeedbackScreen} />
      <Stack.Screen name="FlightDetail" component={FlightDetail} />
      <Stack.Screen name="CertificateViewer" component={CertificateViewer} />
      <Stack.Screen
        name="CommentPeople"
        options={{
          ...TransitionPresets.ModalPresentationIOS,
          headerShadowVisible: false,
          headerShown: false,
        }}
        component={CommentPeople}
      />
      <Stack.Screen
        name="CommentPost"
        options={{
          ...TransitionPresets.ModalPresentationIOS,
          headerShadowVisible: false,
          headerShown: false,
        }}
        component={CommentPost}
      />
      <Stack.Screen
        name="CommentUser"
        options={{
          ...TransitionPresets.ModalPresentationIOS,
          headerShadowVisible: false,
          headerShown: false,
        }}
        component={CommentUser}
      />
      <Stack.Screen name="QuizComplete" component={QuizComplete} />
      <Stack.Screen name="OtpVerification" component={OtpVerification} />
      <Stack.Screen name="NotificationScreen" component={NotificationScreen} />
      <Stack.Screen name="RewardDetails" component={RewardDetails} />
      <Stack.Screen name="FoodLocation" component={FoodLocation} />
      <Stack.Screen
        name="SearchScreen"
        component={SearchScreen}
        options={{
          headerShadowVisible: false,
          headerShown: false,
        }}
      />
      <Stack.Screen name="CameraScreen" component={CameraScreen} />
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
      <Stack.Screen name="FoodApprovalScreen" component={FoodApprovalScreen} />
      <Stack.Screen name="NoInternet" component={NoInternet} />
      <Stack.Screen name="LobbyScreen" component={LobbyScreen} />
      <Stack.Screen name="QuizPageScreen" component={QuizPageScreen} />
      <Stack.Screen name="Login" component={Login} />
      <Stack.Screen name="WelcomeScreen" component={WelcomeScreen} />
      <Stack.Screen name="FaqScreen" component={FaqScreen} />
      <Stack.Screen name="Followpage" component={Followpage} />
      <Stack.Screen name="ReferralPage" component={ReferralPage} />
      <Stack.Screen name="DetailSignup" component={DetailSignup} />
      <Stack.Screen name="SinglePeople" component={SinglePeople} />
      <Stack.Screen name="SingleUserPost" component={SingleUserPost} />
      <Stack.Screen name="Signup" component={SignUp} />
      <Stack.Screen name="Challenges" component={Challenges} />
      <Stack.Screen name="TopicScreen" component={TopicScreen} />
      <Stack.Screen name="QuizLeaderScreen" component={QuizLeaderScreen} />
      <Stack.Screen name="ChallengeDetails" component={ChallengeDetails} />
      <Stack.Screen name="ChallengesList" component={ChallengesList} />
      <Stack.Screen name="TaskDetails" component={TaskDetails} />
      <Stack.Screen name="VideoScreen" component={VideoScreen} />
      {/* <Stack.Screen name="OtherUserScreen" component={OtherUserScreen} /> */}
      <Stack.Screen name="EditProfile" component={EditProfile} />
      <Stack.Screen name="EntryCard" component={EntryCard} />
      <Stack.Screen name="ImageList" component={ImageList} />
      <Stack.Screen name="UserPost" component={UserPost} />
      <Stack.Screen
        name="AcceleroMeterScreen"
        component={AcceleroMeterScreen}
      />
      <Stack.Screen name="SelfieScreen" component={SelfieScreen} />
      <Stack.Screen name="MapScreen" component={MapScreen} />
      <Stack.Screen name="VideoTesting" component={VideoTesting} />
      <Stack.Screen name="UserRewards" component={UserRewards} />
      <Stack.Screen name="Settings" component={SettingScreen} />
      <Stack.Screen name="SelfieScreenShare" component={SelfieScreenShare} />
      <Stack.Screen
        options={{ gestureEnabled: false }}
        name="Maintenance"
        component={MaintenanceScreen}
      />
      <Stack.Screen
        options={{ gestureEnabled: false }}
        name="ForceUpdate"
        component={ForceUpdate}
      />

      <Stack.Screen
        name="ImageViewingScreen"
        options={{ orientation: "all" }}
        component={ImageViewingScreen}
      />
      <Stack.Screen name="LeaderScreen" component={LeaderScreen} />
    </Stack.Navigator>
  );
};

const DrawerStack = () => {
  return (
    <NavigationContainer>
      {/* <NetworkCheck serverUrl={`${baseURL}`} /> */}

      <Drawer.Navigator
        drawerContent={(props) => <CustomDrawer {...props} />}
        screenListeners={{
          state: (e) => {
            // Do something with the state
            console.log("state changed", e.data);
          },
        }}
        id="RightDrawer"
        screenOptions={{ headerShown: false, drawerPosition: "right" }}
        initialRouteName="AllPage"
      >
        <Drawer.Screen
          name="NestedDrawerScreen"
          component={NestedDrawerScreen}
          options={{ swipeEnabled: false }}
        />
      </Drawer.Navigator>
    </NavigationContainer>
  );
};
const NestedDrawerScreen = () => {
  return (
    <NestedDrawer.Navigator
      id="LeftDrawer"
      drawerContent={(props) => <CustomNestedDrawer {...props} />} // You can create a separate custom drawer component for the nested drawer
      screenOptions={{ headerShown: false, drawerPosition: "left" }}
      initialRouteName="AllPage"
    >
      <NestedDrawer.Screen
        name="AllPage"
        component={AppNavigator}
        options={{ swipeEnabled: false }}
      />
    </NestedDrawer.Navigator>
  );
};

export default DrawerStack;
