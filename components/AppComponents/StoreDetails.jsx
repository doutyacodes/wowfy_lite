import { Entypo, MaterialIcons, Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import axios from "axios";
import React, { useMemo } from "react";
import {
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  ActivityIndicator,
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import Toast from "react-native-toast-message";
import { baseImgURL, baseURL } from "../../backend/baseData";
import { BlurView } from "expo-blur";

const StoreDetails = ({ item, user_id }) => {
  const navigation = useNavigation();
  const [loading, setLoading] = React.useState(false);

  // Check if user is close enough to the location (within 50 meters)
  const isNearby = useMemo(() => {
    return parseInt(item.distance) <= 50;
  }, [item.distance]);

  const handlePress = () => {
    navigation.navigate("FoodMap", {
      item: item,
      user_id: user_id,
    });
  };

  const continueToNextScreen = async () => {
    if (!isNearby) {
      // This is now a fallback in case someone clicks a disabled button
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(
        `${baseURL}/createUserChallenge.php`,
        {
          user_id: user_id,
          challenge_id: item.challenge_id,
          page_id: item.page_id,
        },
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      if (response.data.success) {
        navigation.navigate("FoodApprovalScreen", {
          item: item,
          completed_id: response.data.completed_id,
        });
      }
    } catch (error) {
      console.error("Error:", error);
      Toast.show({
        type: "error",
        text1: "Something went wrong",
        text2: "Please try again later",
        visibilityTime: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const statusColor = item.opened == "yes" ? "#10b981" : "#ef4444";
  const distance = (parseInt(item.distance) / 1000).toFixed(1);

  return (
    <View style={styles.card}>
      {/* Header with Image and Name */}
      <View style={styles.header}>
        <Image
          source={{ uri: `${baseImgURL + item.image}` }}
          style={styles.image}
          resizeMode="cover"
        />

        <View style={styles.nameContainer}>
          <Text style={styles.name} numberOfLines={2}>
            {item.name}
          </Text>

          <View style={styles.statusContainer}>
            <View
              style={[styles.statusIndicator, { backgroundColor: statusColor }]}
            />
            <Text style={styles.statusText}>
              {item.opened == "yes" ? "Open Now" : "Closed"}
            </Text>
          </View>
        </View>
      </View>

      {/* Distance Info */}
      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <MaterialIcons name="location-on" size={18} color="#6366f1" />
          <Text style={styles.infoText}>
            <Text style={styles.infoValue}>{distance}</Text> km away
          </Text>
        </View>

        {!isNearby && (
          <View style={styles.locationWarning}>
            <MaterialIcons name="place" size={14} color="#9ca3af" />
            <Text style={styles.warningText}>
              You need to be at this location
            </Text>
          </View>
        )}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity
          style={styles.mapButton}
          onPress={handlePress}
          activeOpacity={0.7}
        >
          <MaterialIcons name="map" size={20} color="#ffffff" />
          <Text style={styles.buttonText}>Directions</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.challengeButton,
            !isNearby && styles.challengeButtonDisabled,
          ]}
          onPress={continueToNextScreen}
          activeOpacity={isNearby ? 0.7 : 1}
          disabled={!isNearby || loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" size="small" />
          ) : (
            <>
              <Ionicons
                name="camera"
                size={20}
                color={isNearby ? "#ffffff" : "#9ca3af"}
              />
              <Text
                style={[
                  styles.buttonText,
                  !isNearby && styles.buttonTextDisabled,
                ]}
              >
                Start Challenge
              </Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginVertical: 10,
    marginHorizontal: 2,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 5,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  image: {
    width: hp(7),
    height: hp(7),
    borderRadius: 10,
  },
  nameContainer: {
    flex: 1,
    marginLeft: 12,
  },
  name: {
    fontSize: hp(2),
    fontFamily: "raleway-bold",
    color: "#1f2937",
    marginBottom: 4,
  },
  statusContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statusIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: hp(1.5),
    color: "#6b7280",
    fontFamily: "raleway-medium",
  },
  infoContainer: {
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#f3f4f6",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
  },
  infoText: {
    fontSize: hp(1.6),
    color: "#6b7280",
    marginLeft: 6,
    fontFamily: "raleway-medium",
  },
  infoValue: {
    color: "#1f2937",
    fontFamily: "raleway-bold",
  },
  locationWarning: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  warningText: {
    fontSize: hp(1.4),
    color: "#9ca3af",
    marginLeft: 4,
    fontFamily: "raleway-medium",
    fontStyle: "italic",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginRight: 8,
    justifyContent: "center",
  },
  challengeButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1.5,
    marginLeft: 8,
    justifyContent: "center",
  },
  challengeButtonDisabled: {
    backgroundColor: "#e5e7eb",
  },
  buttonText: {
    color: "#ffffff",
    fontFamily: "raleway-bold",
    fontSize: hp(1.6),
    marginLeft: 6,
  },
  buttonTextDisabled: {
    color: "#9ca3af",
  },
});

export default StoreDetails;
