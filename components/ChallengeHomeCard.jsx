import moment from "moment";
import React, { useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { baseURL } from "../backend/baseData";

import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import NewBuzzChallenge from "./AppComponents/NewBuzzChallenge";
import CertificateList from "./CertificateList";
import Posts from "./Posts";

const ChallengeHomeCard = ({ challenge, index, user, arena, district }) => {
  const [selectedMovie, setSelectedMovie] = useState([]);
  // alert(challenge.already_liked)
  // console.log(challenge.page_id)
  const navigation = useNavigation();
  useEffect(() => {
    const fetchMovie = async () => {
      if (challenge.info_type == "challenge" || arena == "yes") {
        try {
          if (!user || !user.id) {
            // If user or user.id doesn't exist, skip the fetch
            return;
          }

          const response = await axios.get(
            `${baseURL}/getOneChallenge.php?id=${challenge.page_id}&userId=${user.id}&district=${district}`
          );

          if (response.status == 200) {
            setSelectedMovie(response.data);
            // console.log(response.data);
          } else {
            console.error("Failed to fetch movie");
          }
        } catch (error) {
          console.error("Error while fetching movie:", error.message);
        }
      }
    };

    fetchMovie();
  }, [user]);

  if (challenge.completed == "true") {
    return;
  }
  let formattedEndDate;
  let formattedDate;

  if (challenge.info_type == "challenge" || arena == "yes") {
    formattedDate = moment(challenge.start_date).fromNow();
    const endDate = moment(challenge.end_date);
    const now = moment();

    const duration = moment.duration(endDate.diff(now));

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
    }
  }
  // alert(challenge.user_referral_count)
  return (
    <View key={index}>
      {challenge.info_type == "challenge" || arena == "yes" ? (
        <NewBuzzChallenge
          challenge={challenge}
          formattedDate={formattedDate}
          formattedEndDate={formattedEndDate}
        />
      ) : challenge.info_type == "post" ? (
        <Posts item={challenge} user_id={user?.id} />
      ) : (
        <CertificateList
          item={challenge}
          index={index}
          user_id={user?.id}
          arena={null}
        />
      )}
    </View>
  );
};

export default ChallengeHomeCard;

const styles = StyleSheet.create({});
