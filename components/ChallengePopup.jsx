// ChallengePopup.js
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { baseImgURL } from "../backend/baseData";

const ChallengePopup = ({
  challengeId,
  onAcceptChallenge,
  onCancel,
  movie,
  title,
  image,
  description,
}) => {
  // Destructure the movie object to get the required information

  // Determine the overlay text based on challengeId
  const challengeText = challengeId == 1 ? movie.challenge1 : movie.challenge2;

  return (
    <View style={styles.popupContainer}>
      <View style={styles.popupContent}>
        <View style={styles.headerContainer}>
          <Image
            source={{ uri: `${baseImgURL + image}` }}
            style={styles.movieImage}
          />
          <Text style={styles.popupText}>{title}</Text>
        </View>
        <Text style={{ fontWeight: "bold", fontSize: 25, marginTop: 10 }}>
          {challengeText}
        </Text>
        <Text style={{ fontSize: 18, marginVertical: 10 }}>{description}</Text>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.popupButton, styles.cancelButton]}
            onPress={onCancel}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.popupButton, styles.acceptButton]}
            onPress={onAcceptChallenge}
          >
            <Text style={styles.buttonText}>Accept</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  popupContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  popupContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
    alignItems: "center",
    width: "85%",
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  movieImage: {
    width: 50,
    height: 60,
    marginRight: 10,
    margin: 5,
    borderRadius: 5,
  },
  popupText: {
    fontSize: 20,
    color: "black",
    fontWeight: "bold",
  },
  buttonContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "70%",
    marginTop: 20,
  },
  popupButton: {
    flex: 1,
    padding: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  acceptButton: {
    backgroundColor: "green",
    // marginRight: 5,
    marginLeft: 2,
  },
  cancelButton: {
    backgroundColor: "gray",
    // marginLeft: 5,
    marginRight: 2,
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
});

export default ChallengePopup;
