import { Pedometer } from "expo-sensors";
import React, { useEffect, useState } from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";

const PedometerScreen = () => {
  const [isTracking, setIsTracking] = useState(false);
  const [subscription, setSubscription] = useState(null);
  const [steps, setSteps] = useState(0);
  const [distance, setDistance] = useState(0);

  const calculateDistance = (steps) => {
    // Assuming 1 step = 1 meter
    return steps / 1.3;
  };

  const startTracking = async () => {
    try {
      const newSubscription = Pedometer.watchStepCount((result) => {
        setSteps(result.steps || 0);
        setDistance(calculateDistance(result.steps || 0));
      });
      setSubscription(newSubscription);
      setIsTracking(true);
    } catch (error) {
      console.error("Error starting pedometer:", error);
    }
  };

  const stopTracking = () => {
    if (subscription) {
      subscription.remove();
      setSubscription(null);
    }
    setIsTracking(false);
  };

  const resumeTracking = () => {
    startTracking();
  };

  const finishTracking = () => {
    stopTracking();
    Alert.alert(
      "Tracking Summary",
      `You traveled ${distance.toFixed(2)} meters.`
    );
  };

  useEffect(() => {
    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, [subscription]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Step Tracker</Text>
      <Animated.View
        entering={FadeIn.duration(500)}
        exiting={FadeOut.duration(500)}
        style={styles.dataContainer}
      >
        <Text style={styles.label}>Steps:</Text>
        <Text style={styles.value}>{steps}</Text>
      </Animated.View>
      <Animated.View
        entering={FadeIn.duration(500)}
        exiting={FadeOut.duration(500)}
        style={styles.dataContainer}
      >
        <Text style={styles.label}>Distance (m):</Text>
        <Text style={styles.value}>{distance.toFixed(2)}</Text>
      </Animated.View>

      {!isTracking ? (
        <Animated.View
          entering={FadeIn.duration(700)}
          exiting={FadeOut.duration(700)}
        >
          <TouchableOpacity style={styles.button} onPress={startTracking}>
            <Text style={styles.buttonText}>Start Tracking Steps</Text>
          </TouchableOpacity>
        </Animated.View>
      ) : (
        <Animated.View
          entering={FadeIn.duration(700)}
          exiting={FadeOut.duration(700)}
        >
          <TouchableOpacity style={styles.button} onPress={stopTracking}>
            <Text style={styles.buttonText}>Stop Tracking</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={resumeTracking}>
            <Text style={styles.buttonText}>Resume</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.button} onPress={finishTracking}>
            <Text style={styles.buttonText}>Finish Tracking</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1c1c1c", // Dark background color
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 30,
    color: "#ffffff", // Title color
    textAlign: "center",
  },
  dataContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
    backgroundColor: "#292929", // Card-like container
    padding: 15,
    borderRadius: 10,
    width: "100%",
    justifyContent: "space-between",
  },
  label: {
    fontSize: 20,
    color: "#bdbdbd", // Label color
  },
  value: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff", // Value color
  },
  button: {
    marginTop: 20,
    padding: 15,
    backgroundColor: "#3498db", // Button color
    borderRadius: 10,
    width: 250,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
    elevation: 5,
  },
  buttonText: {
    color: "#fff", // Button text color
    fontSize: 18,
    fontWeight: "bold",
  },
});

export default PedometerScreen;
