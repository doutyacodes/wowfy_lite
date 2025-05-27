import { View, Text, Image, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { useNavigation } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';

const NoInternet = () => {
  const navigation = useNavigation();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetry = async () => {
    setIsRetrying(true);
    
    try {
      const state = await NetInfo.fetch();
      if (state.isConnected) {
        navigation.goBack(); // Navigate back to the previous screen
      } else {
        Alert.alert(
          'No Connection', 
          'Still no internet connection. Please check your settings and try again.',
          [{ text: 'OK', onPress: () => setIsRetrying(false) }]
        );
      }
    } catch (error) {
      console.error("Error checking connection:", error);
      setIsRetrying(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Image 
          source={require("../assets/images/no-wifi.png")} 
          style={styles.image}
          resizeMode="contain" 
        />
        
        <Text style={styles.title}>No Internet Connection</Text>
        
        <Text style={styles.message}>
          We can't reach our servers at the moment. Please check your connection and try again.
        </Text>
        
        <View style={styles.infoContainer}>
          <Ionicons name="information-circle-outline" size={20} color="#6b7280" />
          <Text style={styles.infoText}>
            Make sure Wi-Fi or cellular data is turned on and then try again.
          </Text>
        </View>
        
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={handleRetry}
          disabled={isRetrying}
          activeOpacity={0.8}
        >
          {isRetrying ? (
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>Checking...</Text>
            </View>
          ) : (
            <View style={styles.buttonContent}>
              <Ionicons name="refresh" size={20} color="#ffffff" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Try Again</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default NoInternet;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    width: '100%',
    paddingHorizontal: wp(8),
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    height: hp(20),
    width: hp(20),
    marginBottom: hp(3),
  },
  title: {
    fontSize: hp(2.8),
    fontFamily: 'raleway-bold',
    color: '#111827',
    marginBottom: hp(2),
    textAlign: 'center',
  },
  message: {
    fontSize: hp(1.8),
    fontFamily: 'raleway',
    color: '#4b5563',
    textAlign: 'center',
    lineHeight: hp(2.6),
    marginBottom: hp(4),
  },
  infoContainer: {
    flexDirection: 'row',
    backgroundColor: '#f3f4f6',
    padding: hp(2),
    borderRadius: 12,
    marginBottom: hp(4),
    width: '100%',
    alignItems: 'flex-start',
  },
  infoText: {
    fontSize: hp(1.6),
    fontFamily: 'raleway',
    color: '#6b7280',
    marginLeft: wp(2),
    flex: 1,
    lineHeight: hp(2.2),
  },
  retryButton: {
    backgroundColor: '#6366f1',
    paddingVertical: hp(1.6),
    paddingHorizontal: wp(6),
    borderRadius: 12,
    width: wp(60),
    alignItems: 'center',
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0, 
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: wp(2),
  },
  buttonText: {
    fontSize: hp(1.8),
    fontFamily: 'raleway-bold',
    color: '#ffffff',
  },
});