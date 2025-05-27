// Challenges.js
import { useNavigation, useRoute } from "@react-navigation/native";
import moment from "moment";
import React from "react";
import {
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Divider } from "react-native-paper";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL } from "../backend/baseData";

const Challenges = ({ challenges }) => {
  const route = useRoute();
  const { movieId } = route.params;
  const navigation = useNavigation();

  // console.log(challenges.data);
  // console.log(challenges.data);

  return (
    <ScrollView style={styles.selectedMoviesContainer}>
      {challenges?.data?.length > 0 &&
        challenges?.data.map((challenge, index) => {
          if (challenge.completed == "true") {
            return;
          }
          const formattedDate = moment(challenge.start_date).fromNow();
          const endDate = moment(challenge.end_date);
          const now = moment();

          const duration = moment.duration(endDate.diff(now));

          let formattedEndDate;

          if (duration.asDays() >= 1) {
            formattedEndDate = Math.round(duration.asDays()) + " days";
          } else if (duration.asHours() >= 1) {
            formattedEndDate =
              Math.floor(duration.asHours()) +
              ":" +
              (duration.minutes() < 10 ? "0" : "") +
              duration.minutes() +
              " hrs";
          } else {
            formattedEndDate = duration.minutes() + " minutes";
          } // console.log(challenge.challenge_id)
          return (
            <View key={index}>
              <View>
                <TouchableOpacity
                  style={{ flex: 1, marginTop: 15 }}
                  onPress={() => {
                    navigation.navigate("ChallengeDetails", {
                      pageId: challenge.page_id,
                      challenge: challenge,
                      selectedMovie: challenges,
                    });
                  }}
                >
                  <View
                    style={{
                      backgroundColor: "white",
                      padding: 5,
                      borderRadius: 18,
                      flexDirection: "row",
                      // alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <View>
                      <Image
                        source={{ uri: `${baseImgURL + challenge.image}` }}
                        style={{
                          width: wp(30),
                          minHeight: wp(30),
                          borderRadius: 15,
                        }}
                        resizeMode="cover"
                      />
                    </View>
                    <View style={{ flexDirection: "column", gap: 3, flex: 1 }}>
                      <Text
                        style={{
                          fontSize: hp(1.9),
                          fontFamily: "raleway-bold",
                        }}
                      >
                        {challenge.title}
                      </Text>
                      <Text style={{ color: "gray" }}>{formattedDate}</Text>
                      <Divider style={{ width: "100%", marginVertical: 5 }} />
                      <View style={{ gap: 3 }}>
                        <View style={{ flexDirection: "row", gap: 15 }}>
                          <View>
                            <Text
                              style={{
                                fontSize: hp(1.5),
                              }}
                            >
                              Entry Fee
                            </Text>
                            <Text style={{ color: "gray" }}>
                              {challenge.entry_points == 0
                                ? "Nill"
                                : challenge.entry_points + " Points"}
                            </Text>
                          </View>
                          <View>
                            <Text
                              style={{
                                fontSize: hp(1.5),
                              }}
                            >
                              Reward Points
                            </Text>
                            <Text style={{ color: "gray", fontSize: hp(1.49) }}>
                              {challenge.reward_points == 0
                                ? "Nill"
                                : challenge.reward_points + " Points"}
                            </Text>
                          </View>
                        </View>
                        <View style={{ flexDirection: "row", gap: 5 }}>
                          <Text
                            style={{
                              fontSize: hp(1.5),
                            }}
                          >
                            Time Remaining :
                          </Text>
                          <Text
                            style={{
                              fontSize: hp(1.49),
                              color: "gray",
                            }}
                          >
                            {formattedEndDate}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </View>
                </TouchableOpacity>
              </View>
            </View>
          );
        })}

      {/* Popup */}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    position: "relative",
    width: "100%",
    height: 150,
    borderRadius: 10,
    overflow: "hidden",
  },
  overlayText: {
    position: "absolute",
    bottom: 0,
    width: "100%",
    height: "100%",
    backgroundColor: "rgba(0, 0, 0, 0.4)", // Adjust the opacity as needed
    padding: 50,
    textAlign: "center",
    fontSize: 20,
    fontFamily: "raleway-bold",
    color: "white",
  },
  selectedMoviesContainer: {
    flex: 1,
    padding: 10,
    height: "100%",
    width: "100%",
  },
  selectedMovieBlock: {
    position: "relative",
    width: "100%",
    marginBottom: 10,
    borderRadius: 10,
    overflow: "hidden",
    borderWidth: 1,
    // borderColor: 'grey',
    padding: 5,
  },
  movieInfoContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  selectedMovieImage: {
    width: 30,
    height: 40,
    borderRadius: 5,
  },
  caption: {
    fontSize: hp(1.3),
    color: "black",
  },
  selectedMovieName: {
    fontSize: 14,
    fontFamily: "raleway-bold",
    color: "black",
  },
  latestMediaContainer: {
    marginTop: 10,
    // backgroundColor: 'lightgrey',
    height: 150,
    width: "100%",
    borderRadius: 10,
  },
  border: {
    borderWidth: 1,
    borderColor: "lightgrey",
  },
});

export default Challenges;
