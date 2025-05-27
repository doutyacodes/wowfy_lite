import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useState, useRef } from "react";
import { 
  Image, 
  StyleSheet, 
  Text, 
  TouchableOpacity, 
  View, 
  Share, 
  Alert,
  Platform,
  ScrollView,
  ActivityIndicator,
  Animated,
  SafeAreaView
} from "react-native";
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { baseImgURL } from "../backend/baseData";
import * as FileSystem from 'expo-file-system';
import * as MediaLibrary from 'expo-media-library';
import * as Sharing from 'expo-sharing';
import ViewShot from 'react-native-view-shot';

const CertificateViewer = ({ route }) => {
  const { imageLocation, item } = route.params;
  const navigation = useNavigation();
  const viewShotRef = useRef();
  const [isDownloading, setIsDownloading] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;
  
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };
  
  const handleImageLoad = () => {
    setIsImageLoaded(true);
    
    // Start animations when image loads
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const downloadCertificate = async () => {
    try {
      setIsDownloading(true);
      
      // Request permissions (for Android)
      if (Platform.OS == 'android') {
        const { status } = await MediaLibrary.requestPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('Permission Required', 'Please grant media library permissions to save the certificate.');
          setIsDownloading(false);
          return;
        }
      }
      
      // Capture the certificate view as an image
      const uri = await viewShotRef.current.capture();
      
      if (Platform.OS == 'ios') {
        // On iOS, use Share
        await Sharing.shareAsync(uri);
      } else {
        // On Android, save to media library
        const asset = await MediaLibrary.createAssetAsync(uri);
        await MediaLibrary.createAlbumAsync('Certificates', asset, false);
        Alert.alert('Success', 'Certificate saved to your gallery!');
      }
      setIsDownloading(false);
    } catch (error) {
      console.error('Error downloading certificate:', error);
      Alert.alert('Error', 'Failed to download certificate.');
      setIsDownloading(false);
    }
  };
  
  const shareWallpost = async () => {
    try {
      const message = `I've completed the "${item.challenge_title || 'Challenge'}" organized by ${item.page_title || 'the organizers'}! Check out my achievement.`;
      
      // Capture the certificate view as an image to share
      const uri = await viewShotRef.current.capture();
      
      await Share.share({
        message: message,
        url: uri,
        title: 'My Achievement Certificate',
      });
    } catch (error) {
      console.error('Error sharing certificate:', error);
      Alert.alert('Error', 'Failed to share certificate.');
    }
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#333" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>Certificate of Achievement</Text>
        
        <View style={{ width: 40 }} />
      </View>
      
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileCard}>
          {item.user_image?.length > 0 ? (
            <Image
              style={styles.avatar}
              source={{ uri: `${baseImgURL + item.user_image}` }}
            />
          ) : (
            <View style={[styles.avatar, styles.defaultAvatar]}>
              <Text style={styles.avatarText}>{item.first_character || "A"}</Text>
            </View>
          )}
          
          <View style={styles.userInfoContainer}>
            <Text style={styles.userName}>{item.name || "John Doe"}</Text>
            <Text style={styles.date}>{formatDate(item.end_date || new Date())}</Text>
          </View>
        </View>
        
        {!isImageLoaded && (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color="#6366f1" />
          </View>
        )}
        
        <Animated.View 
          style={[
            styles.certificateWrapper,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }]
            }
          ]}
        >
          <ViewShot ref={viewShotRef} style={styles.certificateContainer}>
            <LinearGradient
              colors={['#ffffff', '#f9fafb']}
              style={styles.certificateBackground}
            >
              {/* Certificate Header with Logos */}
              <View style={styles.certificateHeader}>
                <View style={styles.logoContainer}>
                  {/* Certificate Provider Logo - Left side */}
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
                  
                  {/* Wowfy Logo - Right side */}
                  <Image
                    source={require("../assets/logos/wowfy.png")}
                    style={styles.wowfyLogo}
                    resizeMode="contain"
                  />
                </View>
                
                <Image
                  source={require("../assets/images/badge.png")}
                  style={styles.certificateBadge}
                  resizeMode="contain"
                />
                <Text style={styles.certificateTitle}>CERTIFICATE</Text>
                <Text style={styles.certificateSubtitle}>OF ACHIEVEMENT</Text>
              </View>
              
              {/* Certificate Border */}
              <View style={styles.certificateBorder}>
                {/* Challenge Image */}
                <View style={styles.imageContainer}>
                  <Image
                    source={{ uri: imageLocation }}
                    style={styles.challengeImage}
                    resizeMode="cover"
                    onLoad={handleImageLoad}
                  />
                </View>
                
                {/* Certificate Content */}
                <View style={styles.certificateContent}>
                  <Text style={styles.presentedText}>THIS IS TO CERTIFY THAT</Text>
                  
                  <Text style={styles.recipientName}>{item.name || "John Doe"}</Text>
                  
                  <Text style={styles.certificateText}>
                    has successfully completed the challenge
                  </Text>
                  
                  <Text style={styles.challengeName}>
                    {item.challenge_title || "Medical College Junction"}
                  </Text>
                  
                  <Text style={styles.certificateDetails}>
                    organized by <Text style={styles.organizerName}>{item.page_title || "Kerala"}</Text> on {formatDate(item.end_date || "2023-11-16")}
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
                    <View style={styles.sealOuter}>
                      <View style={styles.sealInner}>
                        <Text style={styles.sealText}>CERTIFIED</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            </LinearGradient>
          </ViewShot>
        </Animated.View>
        
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.shareButton]}
            onPress={shareWallpost}
          >
            <Ionicons name="share-social" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>Share</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.downloadButton]}
            onPress={downloadCertificate}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="file-download" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Download</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
        
        <View style={styles.completionInfoContainer}>
          <Text style={styles.completionInfoTitle}>Challenge Completed</Text>
          <Text style={styles.completionInfoDescription}>
            You've successfully completed the challenge "{item.challenge_title || "Medical College Junction"}" 
            and earned this certificate. Share it with your friends and family!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

export default CertificateViewer;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingVertical: hp(1.5),
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: hp(2.2),
    fontFamily: 'raleway-bold',
    color: '#111827',
  },
  scrollContent: {
    padding: wp(4),
    paddingBottom: hp(5),
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: wp(4),
    marginBottom: hp(3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: wp(14),
    height: wp(14),
    borderRadius: wp(7),
    marginRight: wp(3),
  },
  defaultAvatar: {
    backgroundColor: "#6366f1",
    justifyContent: "center",
    alignItems: "center",
  },
  avatarText: {
    color: "white",
    fontSize: wp(6),
    fontFamily: "raleway-bold",
  },
  userInfoContainer: {
    flex: 1,
  },
  userName: {
    fontSize: hp(2),
    fontFamily: "raleway-bold",
    color: "#111827",
    marginBottom: hp(0.5),
  },
  date: {
    fontSize: hp(1.6),
    color: "#6b7280",
    fontFamily: "raleway",
  },
  loaderContainer: {
    height: hp(50),
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: hp(3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  certificateWrapper: {
    marginBottom: hp(3),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  certificateContainer: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  certificateBackground: {
    padding: wp(2),
  },
  certificateHeader: {
    alignItems: 'center',
    marginTop: hp(2),
    marginBottom: hp(2),
  },
  logoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: wp(4),
    marginBottom: hp(2),
  },
  providerLogo: {
    width: wp(16),
    height: wp(12),
    borderRadius: 8,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    padding: wp(1),
  },
  defaultLogo: {
    width: wp(16),
    height: wp(12),
    borderRadius: 8,
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4f46e5',
  },
  defaultLogoText: {
    color: 'white',
    fontSize: wp(6),
    fontFamily: 'raleway-bold',
  },
  wowfyLogo: {
    width: wp(16),
    height: wp(12),
  },
  certificateBadge: {
    width: wp(12),
    height: wp(12),
    marginBottom: hp(1),
  },
  certificateTitle: {
    fontSize: hp(3),
    fontFamily: "raleway-bold",
    color: "#111827",
    letterSpacing: 2,
  },
  certificateSubtitle: {
    fontSize: hp(1.6),
    fontFamily: "raleway-bold",
    color: "#6366f1",
    letterSpacing: 3,
    marginTop: hp(0.5),
  },
  certificateBorder: {
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    padding: wp(4),
    backgroundColor: '#ffffff',
  },
  imageContainer: {
    width: '100%',
    height: hp(20),
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: hp(3),
    borderWidth: 1,
    borderColor: '#f1f5f9',
  },
  challengeImage: {
    width: '100%',
    height: '100%',
  },
  certificateContent: {
    alignItems: 'center',
    paddingHorizontal: wp(2),
  },
  presentedText: {
    fontSize: hp(1.6),
    fontFamily: "raleway",
    color: "#6b7280",
    marginBottom: hp(1),
  },
  recipientName: {
    fontSize: hp(2.8),
    fontFamily: "raleway-bold",
    color: "#111827",
    marginBottom: hp(1.5),
    textAlign: 'center',
  },
  certificateText: {
    fontSize: hp(1.7),
    fontFamily: "raleway",
    color: "#4b5563",
    marginBottom: hp(0.8),
    textAlign: 'center',
  },
  challengeName: {
    fontSize: hp(2.2),
    fontFamily: "raleway-bold",
    color: "#6366f1",
    marginBottom: hp(1),
    textAlign: 'center',
  },
  certificateDetails: {
    fontSize: hp(1.7),
    fontFamily: "raleway",
    color: "#4b5563",
    marginBottom: hp(3),
    textAlign: 'center',
    lineHeight: hp(2.4),
  },
  organizerName: {
    fontFamily: "raleway-bold",
    color: "#111827",
  },
  signaturesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: wp(6),
    marginBottom: hp(3),
  },
  signatureColumn: {
    alignItems: 'center',
    width: wp(25),
  },
  signature: {
    width: wp(20),
    height: hp(3),
    marginBottom: hp(1),
  },
  signatureLine: {
    width: '100%',
    height: 1,
    backgroundColor: '#d1d5db',
    marginBottom: hp(0.8),
  },
  signatureTitle: {
    fontSize: hp(1.5),
    fontFamily: "raleway-bold",
    color: "#6b7280",
  },
  sealContainer: {
    position: 'absolute',
    bottom: -hp(1),
    right: wp(4),
    zIndex: 10,
  },
  sealOuter: {
    width: wp(16),
    height: wp(16),
    borderRadius: wp(8),
    backgroundColor: '#f9fafb',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sealInner: {
    width: wp(12),
    height: wp(12),
    borderRadius: wp(6),
    backgroundColor: '#6366f1',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4f46e5',
  },
  sealText: {
    fontSize: hp(1.2),
    fontFamily: "raleway-bold",
    color: "#ffffff",
    letterSpacing: 0.5,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: hp(3),
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: hp(1.5),
    paddingHorizontal: wp(6),
    borderRadius: 8,
    width: '48%',
  },
  shareButton: {
    backgroundColor: '#3b82f6',
  },
  downloadButton: {
    backgroundColor: '#6366f1',
  },
  actionButtonText: {
    color: '#ffffff',
    fontFamily: 'raleway-bold',
    fontSize: hp(1.8),
    marginLeft: wp(2),
  },
  completionInfoContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: wp(4),
    borderLeftWidth: 4,
    borderLeftColor: '#6366f1',
  },
  completionInfoTitle: {
    fontSize: hp(1.8),
    fontFamily: 'raleway-bold',
    color: '#111827',
    marginBottom: hp(1),
  },
  completionInfoDescription: {
    fontSize: hp(1.6),
    fontFamily: 'raleway',
    color: '#6b7280',
    lineHeight: hp(2.2),
  },
});