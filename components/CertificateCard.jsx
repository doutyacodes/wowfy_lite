import { useNavigation } from "@react-navigation/native";
import React, { useRef, useEffect } from "react";
import { 
  Image, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View,
  Animated,
  Platform
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { baseImgURL } from "../backend/baseData";

const CertificateCard = ({ item }) => {
  const navigation = useNavigation();
  
  // Animation values
  const shineAnim = useRef(new Animated.Value(-wp(100))).current;
  const scaleAnim = useRef(new Animated.Value(0.98)).current;
  
  useEffect(() => {
    // Start shine animation
    Animated.loop(
      Animated.timing(shineAnim, {
        toValue: wp(100),
        duration: 2000,
        useNativeDriver: true,
      })
    ).start();
    
    // Start scale animation
    Animated.timing(scaleAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, []);
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() =>
        navigation.navigate("CertificateViewer", {
          imageLocation: `${baseImgURL + item.image}`,
          item: item,
        })
      }
      style={styles.container}
    >
      <Animated.View style={[
        styles.cardContainer,
        { transform: [{ scale: scaleAnim }] }
      ]}>
        <LinearGradient
          colors={['#ffffff', '#f9fafb']}
          style={styles.certificateBackground}
        >
          {/* Certificate Border */}
          <View style={styles.certificateBorder}>
            {/* Certificate Header with Logos */}
            <View style={styles.certificateHeader}>
              {/* Logo Container */}
              <View style={styles.logoContainer}>
                {/* Provider Logo - Left */}
                {item.page_icon ? (
                  <Image
                    source={{ uri: `${baseImgURL + item.page_icon}` }}
                    style={styles.providerLogo}
                    resizeMode="contain"
                  />
                ) : (
                  item.icon ? (
                    <Image
                      source={{ uri: `${baseImgURL + item.icon}` }}
                      style={styles.providerLogo}
                      resizeMode="contain"
                    />
                  ) : (
                    <View style={styles.defaultLogo}>
                      <Text style={styles.defaultLogoText}>
                        {item.page_title ? item.page_title.charAt(0) : "C"}
                      </Text>
                    </View>
                  )
                )}

                {/* Wowfy Logo - Right */}
                <Image
                  source={require("../assets/logos/wowfy.png")}
                  style={styles.wowfyLogo}
                  resizeMode="contain"
                />
              </View>
              
              <LinearGradient
                colors={['#6366f1', '#4f46e5']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.headerBanner}
              >
                <Text style={styles.headerText}>CERTIFICATE OF ACHIEVEMENT</Text>
              </LinearGradient>
              
              <Image
                source={require("../assets/images/badge.png")}
                style={styles.certificateBadge}
                resizeMode="contain"
              />
            </View>
            
            {/* Certificate Content */}
            <View style={styles.certificateContent}>
              {/* Challenge Image */}
              <View style={styles.imageContainer}>
                <Image
                  style={styles.challengeImage}
                  source={{ uri: `${baseImgURL + item.image}` }}
                  resizeMode="cover"
                />
                
                {/* Shine effect */}
                <Animated.View
                  style={[
                    styles.shine,
                    {
                      transform: [{ translateX: shineAnim }],
                    },
                  ]}
                />
              </View>
              
              <View style={styles.certificateTextContent}>
                <Text style={styles.presentedText}>THIS IS TO CERTIFY THAT</Text>
                
                <Text style={styles.recipientName}>{item.name}</Text>
                
                <Text style={styles.certificateText}>
                  has successfully completed the
                </Text>
                
                <Text style={styles.challengeName}>
                  {item.challenge_title}
                </Text>
                
                <Text style={styles.certificateDetails}>
                  challenge organized by <Text style={styles.organizerName}>{item.page_title}</Text>
                </Text>
                
                <Text style={styles.certificateDate}>
                  {formatDate(item.end_date)}
                </Text>
                
                {/* Signatures */}
                <View style={styles.signaturesContainer}>
                  <View style={styles.signatureColumn}>
                    <Image
                      source={require("../assets/images/signature.png")}
                      style={styles.signature}
                      resizeMode="contain"
                    />
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureTitle}>Organizer</Text>
                  </View>
                  
                  <View style={styles.signatureColumn}>
                    <Image
                      source={require("../assets/images/signature.png")}
                      style={styles.signature}
                      resizeMode="contain"
                    />
                    <View style={styles.signatureLine} />
                    <Text style={styles.signatureTitle}>Director</Text>
                  </View>
                </View>
                
                {/* Certificate Seal */}
                <View style={styles.sealContainer}>
                  <MaterialCommunityIcons name="certificate" size={28} color="#6366f1" />
                </View>
              </View>
            </View>
          </View>
          
          {/* View Certificate Button */}
          <View style={styles.viewButtonContainer}>
            <TouchableOpacity
              style={styles.viewButton}
              activeOpacity={0.8}
              onPress={() =>
                navigation.navigate("CertificateViewer", {
                  imageLocation: `${baseImgURL + item.image}`,
                  item: item,
                })
              }
            >
              <Text style={styles.viewButtonText}>View Full Certificate</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
};

export default CertificateCard;

const styles = StyleSheet.create({
  container: {
    width: wp(90),
  },
  cardContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 6,
  },
  certificateBackground: {
    padding: wp(2),
  },
  certificateBorder: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    backgroundColor: '#ffffff',
    overflow: 'hidden',
  },
  certificateHeader: {
    alignItems: 'center',
    position: 'relative',
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: wp(2),
    paddingVertical: hp(1),
    backgroundColor: 'rgba(249, 250, 251, 0.8)',
    zIndex: 5,
  },
  providerLogo: {
    width: wp(14),
    height: hp(3.5),
    borderRadius: 6,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: wp(0.5),
  },
  defaultLogo: {
    width: wp(10),
    height: hp(3.5),
    borderRadius: 6,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4f46e5',
  },
  defaultLogoText: {
    color: 'white',
    fontSize: wp(4),
    fontFamily: 'raleway-bold',
  },
  wowfyLogo: {
    width: wp(14),
    height: hp(3.5),
  },
  headerBanner: {
    width: '100%',
    paddingVertical: hp(1),
    alignItems: 'center',
  },
  headerText: {
    fontSize: hp(1.8),
    fontFamily: 'raleway-bold',
    color: '#ffffff',
    letterSpacing: 1,
  },
  certificateBadge: {
    width: hp(6),
    height: hp(6),
    position: 'absolute',
    top: hp(3),
    zIndex: 10,
  },
  certificateContent: {
    padding: wp(3),
  },
  imageContainer: {
    width: '100%',
    height: hp(18),
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: hp(2),
    position: 'relative',
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  challengeImage: {
    width: '100%',
    height: '100%',
  },
  shine: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: wp(30),
    height: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    transform: [{ skewX: '-20deg' }],
  },
  certificateTextContent: {
    alignItems: 'center',
  },
  presentedText: {
    fontSize: hp(1.3),
    fontFamily: 'raleway',
    color: '#6b7280',
    marginBottom: hp(0.5),
  },
  recipientName: {
    fontSize: hp(2.2),
    fontFamily: 'raleway-bold',
    color: '#111827',
    marginBottom: hp(0.5),
    textAlign: 'center',
  },
  certificateText: {
    fontSize: hp(1.4),
    fontFamily: 'raleway',
    color: '#4b5563',
    marginBottom: hp(0.4),
    textAlign: 'center',
  },
  challengeName: {
    fontSize: hp(1.7),
    fontFamily: 'raleway-bold',
    color: '#6366f1',
    marginBottom: hp(0.4),
    textAlign: 'center',
  },
  certificateDetails: {
    fontSize: hp(1.4),
    fontFamily: 'raleway',
    color: '#4b5563',
    textAlign: 'center',
  },
  organizerName: {
    fontFamily: 'raleway-bold',
    color: '#111827',
  },
  certificateDate: {
    fontSize: hp(1.4),
    fontFamily: 'raleway-bold',
    color: '#4b5563',
    marginTop: hp(0.5),
    marginBottom: hp(1.5),
  },
  signaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: hp(1),
  },
  signatureColumn: {
    alignItems: 'center',
    width: wp(25),
  },
  signature: {
    width: wp(20),
    height: hp(2.5),
    marginBottom: hp(0.5),
  },
  signatureLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#d1d5db',
    marginBottom: hp(0.3),
  },
  signatureTitle: {
    fontSize: hp(1.2),
    fontFamily: 'raleway-bold',
    color: '#6b7280',
  },
  sealContainer: {
    position: 'absolute',
    bottom: -hp(1),
    right: wp(3),
    backgroundColor: '#ffffff',
    borderRadius: hp(2),
    width: hp(4),
    height: hp(4),
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  viewButtonContainer: {
    alignItems: 'center',
    marginTop: hp(1),
  },
  viewButton: {
    backgroundColor: '#6366f1',
    paddingVertical: hp(0.8),
    paddingHorizontal: wp(4),
    borderRadius: 8,
    shadowColor: '#6366f1',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  viewButtonText: {
    color: '#ffffff',
    fontFamily: 'raleway-bold',
    fontSize: hp(1.4),
  },
});