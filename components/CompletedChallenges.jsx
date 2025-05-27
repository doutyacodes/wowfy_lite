import { Entypo, FontAwesome6, Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useState, useRef } from "react";
import { 
  Image, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  AccessibilityInfo,
  Animated,
} from "react-native";
import { Modal, PaperProvider, Portal, Button } from "react-native-paper";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL } from "../backend/baseData";

const CompletedChallenges = ({
  item,
  user_id,
  currentUser,
  fetchAchievementData,
}) => {
  const [visible, setVisible] = useState(false);
  const [userText, setUserText] = useState(false);
  const animation = useRef(new Animated.Value(1)).current;
  
  useEffect(() => {
    // Initialize achievement status from props
    setUserText(item.achieved ? true : false);
  }, [item.achieved]);
  
  const showModal = () => setVisible(true);
  const hideModal = () => setVisible(false);
  
  const handleButtonClick = () => {
    // Animate the card when achievement status changes
    Animated.sequence([
      Animated.timing(animation, {
        toValue: 1.05,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(animation, {
        toValue: 1,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start();
    
    fetchAchievementData(currentUser, item.challenge_id);
    setUserText(!userText);
    hideModal();
    
    // Announce the action to screen readers
    const message = userText 
      ? "Removed from achievements" 
      : "Added to achievements";
    AccessibilityInfo.announceForAccessibility(message);
  };
  
  // Determine image URI with fallback
  const imageURI = item.uploaded_image?.length > 0
    ? `${baseImgURL + item.uploaded_image}`
    : `${baseImgURL + item.image}`;
  
  const achievementStatus = userText ? "In achievements" : "Not in achievements";
  const modalButtonText = userText ? "Remove from achievements" : "Add to achievements";
  
  return (
    <PaperProvider>
      <Animated.View
        style={[
          styles.cardContainer,
          { transform: [{ scale: animation }] },
          userText && styles.cardAchieved
        ]}
        accessible={true}
        accessibilityLabel={`Challenge ${item.page_title}, ${item.title}. Points earned: ${item.earned_points}. Rank: ${item.user_rank}. ${achievementStatus}`}
      >
        <View style={styles.cardContent}>
          <View style={styles.rowContainer}>
            <View style={styles.imageWrapper}>
              <Image
                style={styles.challengeImage}
                source={{ uri: imageURI }}
                accessible={true}
                accessibilityLabel={`Challenge image for ${item.title}`}
              />
              {item.arena === "yes" && (
                <View 
                  style={styles.arenaIndicator}
                  accessible={true}
                  accessibilityLabel="Arena challenge"
                >
                  <FontAwesome6 name="building-columns" size={16} color={"white"} />
                </View>
              )}
            </View>
            
            <View style={styles.textContainer}>
              <View style={styles.titleContainer}>
                <Text style={styles.titleText} numberOfLines={1}>{item.page_title}</Text>
                {user_id == currentUser && (
                  <TouchableOpacity 
                    onPress={showModal}
                    style={styles.menuButton}
                    accessible={true}
                    accessibilityLabel="Options menu"
                    accessibilityHint="Opens options to manage this challenge"
                    accessibilityRole="button"
                  >
                    <Entypo name="dots-three-vertical" size={20} color="#64748B" />
                  </TouchableOpacity>
                )}
              </View>
              
              <Text style={styles.subtitleText} numberOfLines={2}>{item.title}</Text>
              
              {/* Stats row */}
              <View style={styles.statsContainer}>
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="star-circle" size={18} color="#6366F1" />
                  <Text style={styles.statValue}>{item.earned_points}</Text>
                  <Text style={styles.statLabel}>points</Text>
                </View>
                
                <View style={styles.statDivider} />
                
                <View style={styles.statItem}>
                  <MaterialCommunityIcons name="trophy" size={18} color="#F59E0B" />
                  <Text style={styles.statValue}>#{item.user_rank}</Text>
                  <Text style={styles.statLabel}>rank</Text>
                </View>
              </View>
            </View>
          </View>
        </View>
        
        {/* Achievement status indicator */}
        {userText && (
          <View style={styles.achievementBadge}>
            <MaterialCommunityIcons name="medal" size={16} color="white" />
            <Text style={styles.achievementText}>Achievement</Text>
          </View>
        )}
        
        <Portal>
          <Modal
            visible={visible}
            onDismiss={hideModal}
            contentContainerStyle={styles.modalContainer}
          >
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>Challenge Options</Text>
              
              <TouchableOpacity 
                style={[
                  styles.modalButton,
                  userText ? styles.modalButtonRemove : styles.modalButtonAdd
                ]}
                onPress={handleButtonClick}
                accessible={true}
                accessibilityLabel={modalButtonText}
                accessibilityRole="button"
              >
                <Ionicons 
                  name={userText ? "trash-outline" : "trophy-outline"} 
                  size={18} 
                  color="white" 
                  style={styles.modalButtonIcon}
                />
                <Text style={styles.modalButtonText}>{modalButtonText}</Text>
              </TouchableOpacity>
              
              <Button 
                mode="text" 
                onPress={hideModal} 
                style={styles.cancelButton}
                labelStyle={styles.cancelButtonText}
              >
                Cancel
              </Button>
            </View>
          </Modal>
        </Portal>
      </Animated.View>
    </PaperProvider>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
    borderRadius: 16,
    overflow: "hidden",
    position: "relative",
    marginHorizontal: 2,
    height: hp(14),
  },
  cardAchieved: {
    borderLeftWidth: 4,
    borderLeftColor: "#6366F1",
  },
  cardContent: {
    padding: 12,
    height: "100%",
  },
  rowContainer: {
    flexDirection: "row", 
    gap: 12,
    height: "100%",
  },
  imageWrapper: {
    position: "relative",
    alignSelf: "center",
  },
  challengeImage: {
    width: wp(18), 
    height: wp(18), 
    borderRadius: 10,
  },
  arenaIndicator: {
    position: "absolute", 
    bottom: -6, 
    right: -6,
    backgroundColor: "#10B981",
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "white",
    zIndex: 1,
  },
  textContainer: {
    flex: 1,
    justifyContent: "space-between",
    paddingVertical: 2,
  },
  titleContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  titleText: {
    fontSize: hp(1.8), 
    fontFamily: "raleway-bold",
    color: "#1E293B",
    marginBottom: 4,
    flex: 1,
  },
  subtitleText: {
    fontSize: hp(1.6), 
    fontFamily: "raleway-semibold",
    color: "#475569",
    marginBottom: 8,
    lineHeight: hp(2),
    flex: 1,
  },
  statsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  statValue: {
    fontSize: hp(1.6),
    fontFamily: "raleway-bold",
    color: "#334155",
    marginLeft: 4,
    marginRight: 2,
  },
  statLabel: {
    fontSize: hp(1.5),
    fontFamily: "raleway",
    color: "#64748B",
  },
  statDivider: {
    width: 1,
    height: "70%",
    backgroundColor: "#E2E8F0",
    marginHorizontal: 8,
  },
  menuButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  achievementBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: "#6366F1",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderBottomLeftRadius: 10,
  },
  achievementText: {
    color: "white",
    fontSize: hp(1.4),
    fontFamily: "raleway-semibold",
    marginLeft: 4,
  },
  
  // Modal styles
  modalContainer: {
    margin: 20,
    backgroundColor: "white",
    borderRadius: 16,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  modalContent: {
    padding: 16,
  },
  modalTitle: {
    fontSize: hp(2),
    fontFamily: "raleway-bold",
    color: "#1E293B",
    marginBottom: 16,
    textAlign: "center",
  },
  modalButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  modalButtonAdd: {
    backgroundColor: "#6366F1",
  },
  modalButtonRemove: {
    backgroundColor: "#EF4444",
  },
  modalButtonIcon: {
    marginRight: 8,
  },
  modalButtonText: {
    fontSize: hp(1.7),
    fontFamily: "raleway-bold",
    color: "white",
  },
  cancelButton: {
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: hp(1.7),
    fontFamily: "raleway-semibold",
    color: "#64748B",
  },
});

export default CompletedChallenges;