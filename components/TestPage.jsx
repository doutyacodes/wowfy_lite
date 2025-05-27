import * as BackgroundFetch from "expo-background-fetch";
import { Magnetometer } from "expo-sensors";
import * as TaskManager from "expo-task-manager";
import React, { useEffect, useState } from "react";
import { Button, StyleSheet, Text, View } from "react-native";

const BACKGROUND_TASK_NAME = "magnetometer-task";

// Define the background task (currently cannot access magnetometer directly)
TaskManager.defineTask(async ({ data, error }) => {
  if (error) {
    console.error(error);
    return;
  }
  // This example demonstrates accessing Magnetometer in the foreground after being triggered from background
  console.log(
    "Background task triggered, attempting foreground magnetometer read..."
  );
  try {
    await Magnetometer.requestPermissionsAsync();
    const magnetometerData = await Magnetometer.getCurrentValueAsync();
    console.log("Background task (foreground read):", magnetometerData);
  } catch (err) {
    console.error(err);
  }
});

function Testapge() {
  const [magnetometerData, setMagnetometerData] = useState(null);
  const [isBackgroundTaskRegistered, setIsBackgroundTaskRegistered] =
    useState(false);

  useEffect(() => {
    (async () => {
      await Magnetometer.requestPermissionsAsync();
      const data = await Magnetometer.getCurrentValueAsync();
      setMagnetometerData(data);
    })();
  }, []);

  const handleStartBackgroundTask = async () => {
    try {
      await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
        minimumInterval: 15 * 60, // 15 minutes (demonstration, adjust as needed)
        stopOnTerminate: false,
        startOnBoot: true,
      });
      setIsBackgroundTaskRegistered(true);
    } catch (error) {
      console.error("Error registering background task:", error);
    }
  };

  const handleStopBackgroundTask = async () => {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME);
      setIsBackgroundTaskRegistered(false);
    } catch (error) {
      console.error("Error unregistering background task:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text>Foreground Magnetometer Data:</Text>
      {magnetometerData && (
        <Text>
          x: {magnetometerData.x.toFixed(2)} μT, y:{" "}
          {magnetometerData.y.toFixed(2)} μT, z: {magnetometerData.z.toFixed(2)}{" "}
          μT
        </Text>
      )}
      <Button
        title={
          isBackgroundTaskRegistered
            ? "Stop Background Task"
            : "Start Background Task"
        }
        onPress={
          isBackgroundTaskRegistered
            ? handleStopBackgroundTask
            : handleStartBackgroundTask
        }
      />
      <Text style={styles.disclaimer}>
        * Background magnetometer access is currently not directly supported in
        Expo. * This example demonstrates triggering a background task, but
        reading may not work.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  disclaimer: {
    fontSize: 12,
    fontStyle: "italic",
    marginTop: 20,
  },
});

export default Testapge;
