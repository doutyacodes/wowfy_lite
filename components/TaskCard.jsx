import React from "react";
import { useNavigation } from "@react-navigation/native";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { baseImgURL } from "../backend/baseData";
import { Ionicons } from "@expo/vector-icons";

const TaskCard = ({ item, index, userId, disabled = false }) => {
  const frequency = item.frequency;
  const isCompleted = item.completed == true;
  const navigation = useNavigation();

  // Skip rendering treasure tasks that are completed
  if (isCompleted && frequency == "treasure") {
    return null;
  }

  // Determine the task type icon based on task_type
  const getTaskTypeIcon = () => {
    switch (item.task_type) {
      case 'map':
        return <Ionicons name="map-outline" size={16} color="#6366f1" />;
      case 'stepCounter':
        return <Ionicons name="footsteps-outline" size={16} color="#6366f1" />;
      case 'mediaCapture':
        return <Ionicons name="camera-outline" size={16} color="#6366f1" />;
      case 'videoCapture':
        return <Ionicons name="videocam-outline" size={16} color="#6366f1" />;
      default:
        return <Ionicons name="document-text-outline" size={16} color="#6366f1" />;
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        isCompleted ? styles.completedContainer : null,
        disabled && !isCompleted ? styles.disabledContainer : null,
      ]}
      activeOpacity={isCompleted || disabled ? 1 : 0.7}
      onPress={() =>
        !isCompleted && !disabled &&
        navigation.navigate("TaskDetails", {
          challenge: item,
        })
      }
      disabled={disabled || isCompleted}
    >
      {/* Task number indicator */}
      <View style={[
        styles.indexBadge,
        isCompleted ? styles.completedIndexBadge : null,
        disabled && !isCompleted ? styles.disabledIndexBadge : null,
      ]}>
        <Text style={[
          styles.indexText,
          isCompleted ? styles.completedIndexText : null,
          disabled && !isCompleted ? styles.disabledIndexText : null,
        ]}>
          {index + 1}
        </Text>
      </View>

      {/* Task image */}
      <Image
        source={{ uri: `${baseImgURL + item.image}` }}
        style={[
          styles.taskImage,
          isCompleted ? styles.completedImage : null,
          disabled && !isCompleted ? styles.disabledImage : null,
        ]}
      />

      {/* Task details */}
      <View style={styles.detailsContainer}>
        <Text 
          style={[
            styles.taskName,
            isCompleted ? styles.completedText : null,
            disabled && !isCompleted ? styles.disabledText : null,
          ]} 
          numberOfLines={2}
        >
          {item.task_name}
        </Text>
        
        <View style={styles.metaContainer}>
          {/* Task type indicator */}
          <View style={styles.typeContainer}>
            {getTaskTypeIcon()}
            <Text style={styles.typeText}>
              {item.task_type.charAt(0).toUpperCase() + item.task_type.slice(1)}
            </Text>
          </View>
          
          {/* Points indicator */}
          <View style={styles.pointsContainer}>
            <Ionicons name="star-outline" size={16} color="#f59e0b" />
            <Text style={styles.pointsText}>{item.reward_points}</Text>
          </View>
        </View>
        
        {/* Status indicator */}
        <View style={[
          styles.statusIndicator, 
          isCompleted ? styles.completedStatus : 
          disabled ? styles.lockedStatus : styles.pendingStatus
        ]}>
          <Text style={[
            styles.statusText,
            isCompleted ? styles.completedStatusText : 
            disabled ? styles.lockedStatusText : styles.pendingStatusText
          ]}>
            {isCompleted ? "Completed" : disabled ? "Locked" : "Pending"}
          </Text>
        </View>
      </View>
      
      {/* Action indicator */}
      <View style={styles.actionContainer}>
        {isCompleted ? (
          <View style={styles.completedIcon}>
            <Ionicons name="checkmark-circle" size={24} color="#10b981" />
          </View>
        ) : disabled ? (
          <View style={styles.lockedIcon}>
            <Ionicons name="lock-closed" size={24} color="#9ca3af" />
          </View>
        ) : (
          <View style={styles.arrowIcon}>
            <Ionicons name="chevron-forward" size={24} color="#6366f1" />
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    padding: 16,
    borderRadius: 16,
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  completedContainer: {
    backgroundColor: "#f8fafc",
    borderColor: "#e2e8f0",
    borderWidth: 1,
  },
  disabledContainer: {
    backgroundColor: "#f9fafb",
    borderColor: "#e5e7eb",
    borderWidth: 1,
  },
  indexBadge: {
    width: wp(8),
    height: wp(8),
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#e0e7ff",
    borderRadius: 12,
    marginRight: 12,
  },
  completedIndexBadge: {
    backgroundColor: "#d1fae5",
  },
  disabledIndexBadge: {
    backgroundColor: "#f3f4f6",
  },
  indexText: {
    fontSize: hp(1.8),
    fontFamily: "raleway-bold",
    color: "#6366f1",
  },
  completedIndexText: {
    color: "#10b981",
  },
  disabledIndexText: {
    color: "#9ca3af",
  },
  taskImage: {
    width: wp(16),
    height: wp(16),
    borderRadius: 12,
    marginRight: 14,
    backgroundColor: "#f3f4f6",
  },
  completedImage: {
    opacity: 0.7,
  },
  disabledImage: {
    opacity: 0.5,
  },
  detailsContainer: {
    flex: 1,
    justifyContent: "space-between",
  },
  taskName: {
    fontSize: hp(2),
    fontFamily: "raleway-bold",
    color: "#111827",
    marginBottom: 6,
  },
  completedText: {
    color: "#64748b",
    textDecorationLine: "line-through",
  },
  disabledText: {
    color: "#9ca3af",
  },
  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: wp(4),
  },
  typeText: {
    fontSize: hp(1.5),
    fontFamily: "raleway",
    color: "#6366f1",
    marginLeft: 4,
  },
  pointsContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  pointsText: {
    fontSize: hp(1.5),
    fontFamily: "raleway-bold",
    color: "#f59e0b",
    marginLeft: 4,
  },
  statusIndicator: {
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  pendingStatus: {
    backgroundColor: "#e0e7ff",
  },
  completedStatus: {
    backgroundColor: "#d1fae5",
  },
  lockedStatus: {
    backgroundColor: "#f3f4f6",
  },
  statusText: {
    fontSize: hp(1.5),
    fontFamily: "raleway-bold",
  },
  pendingStatusText: {
    color: "#6366f1",
  },
  completedStatusText: {
    color: "#10b981",
  },
  lockedStatusText: {
    color: "#9ca3af",
  },
  actionContainer: {
    marginLeft: wp(2),
  },
  arrowIcon: {
    height: hp(5),
    justifyContent: "center",
    alignItems: "center",
  },
  completedIcon: {
    height: hp(5),
    justifyContent: "center",
    alignItems: "center",
  },
  lockedIcon: {
    height: hp(5),
    justifyContent: "center",
    alignItems: "center",
  },
});

export default TaskCard;