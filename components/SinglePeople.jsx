import { useFocusEffect, useIsFocused } from "@react-navigation/native";
import axios from "axios";
import React, { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import { baseURL } from "../backend/baseData";
import CertificateList from "./CertificateList";

const SinglePeople = ({ route }) => {
  const [peopleData, setPeopleData] = useState([]);
  const isFocused = useIsFocused();
  const { id } = route.params.item;
  //   console.log(id)
  useFocusEffect(
    useCallback(() => {
      const fetchPeople = async () => {
        try {
          // Only fetch rewards if user data is available
          const response = await axios.get(
            `${baseURL}/getSinglePeople.php?id=${id}`
          );
          // console.log(response.data);
          if (response.status == 200) {
            setPeopleData(response.data);
            // console.log(response.data);
          } else {
            console.error("Failed to fetch people");
          }
        } catch (error) {
          console.error("Error while fetching people:", error.message);
        }
      };

      fetchPeople();
    }, [isFocused])
  );
  return (
    <View style={{ flex: 1 }}>
      <CertificateList
        item={peopleData}
        index={1}
        user_id={peopleData.user_id}
        arena={null}
        singleData={true}
      />
    </View>
  );
};

export default SinglePeople;

const styles = StyleSheet.create({});
