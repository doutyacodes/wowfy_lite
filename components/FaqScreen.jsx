import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import React, { useState, useRef, useEffect } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  SafeAreaView,
  Animated,
  TextInput,
  Platform,
} from "react-native";
import { List } from "react-native-paper";
import { LinearGradient } from 'expo-linear-gradient';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from "react-native-responsive-screen";

const FaqScreen = () => {
  const navigation = useNavigation();
  const [expandedId, setExpandedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredFaqs, setFilteredFaqs] = useState([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  
  const faqData = [
    {
      id: 1,
      question: "How do I join a challenge?",
      answer:
        "To join a challenge, simply navigate to the challenges section of the app, browse through the available challenges, and click on the 'Join' button next to the challenge you're interested in.",
      keywords: ["join", "challenge", "participate", "start"]
    },
    {
      id: 2,
      question: "Can I participate in multiple challenges at the same time?",
      answer:
        "Yes, you can participate in multiple challenges simultaneously. However, make sure you can commit enough time and effort to each challenge to make meaningful progress.",
      keywords: ["multiple", "challenges", "participate", "same time", "simultaneously"]
    },
    {
      id: 3,
      question: "What happens if I miss a day of the challenge?",
      answer:
        "Missing a day won't disqualify you from the challenge, but it might affect your progress. Try to stay consistent, but if you miss a day, you can always continue with the challenge from where you left off.",
      keywords: ["miss", "day", "skip", "continue", "progress"]
    },
    {
      id: 4,
      question: "How do I track my progress?",
      answer:
        "You can track your progress within each challenge by accessing the challenge details. Most challenges come with built-in progress tracking features that allow you to log your activities, view your achievements, and see how you compare to other participants.",
      keywords: ["track", "progress", "monitor", "status", "achievements"]
    },
    {
      id: 5,
      question: "What if I encounter technical issues during the challenge?",
      answer:
        "If you encounter any technical issues, such as app crashes or glitches, please reach out to our support team immediately. We're here to help you resolve any issues so you can continue enjoying the challenge.",
      keywords: ["technical", "issues", "bugs", "problems", "help", "support"]
    },
    {
      id: 6,
      question: "How do rewards work?",
      answer:
        "Rewards are earned by completing challenges and achieving specific milestones. Depending on the challenge, rewards can include points, badges, certificates, or other virtual achievements that showcase your accomplishments.",
      keywords: ["rewards", "points", "badges", "certificates", "earn"]
    },
    {
      id: 7,
      question: "Can I create my own challenge?",
      answer:
        "Currently, only verified organizations and partners can create challenges. However, we're considering adding user-created challenges in the future. Stay tuned for updates!",
      keywords: ["create", "own", "challenge", "custom"]
    },
  ];
  
  // Filter FAQ items based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredFaqs(faqData);
      return;
    }
    
    const query = searchQuery.toLowerCase().trim();
    const filtered = faqData.filter(item => {
      const matchesQuestion = item.question.toLowerCase().includes(query);
      const matchesAnswer = item.answer.toLowerCase().includes(query);
      const matchesKeywords = item.keywords.some(keyword => keyword.toLowerCase().includes(query));
      
      return matchesQuestion || matchesAnswer || matchesKeywords;
    });
    
    setFilteredFaqs(filtered);
  }, [searchQuery]);
  
  // Initial animation
  useEffect(() => {
    setFilteredFaqs(faqData);
    
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  }, []);
  
  const handleAccordionToggle = (id) => {
    setExpandedId(expandedId == id ? null : id);
  };
  
  const renderItem = ({ item }) => {
    const isExpanded = expandedId == item.id;
    
    return (
      <Animated.View style={styles.accordionContainer}>
        <TouchableOpacity
          style={[
            styles.questionContainer,
            isExpanded && styles.questionContainerExpanded
          ]}
          onPress={() => handleAccordionToggle(item.id)}
          activeOpacity={0.9}
        >
          <View style={styles.questionContent}>
            <Text style={styles.questionText}>{item.question}</Text>
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color="#6366f1"
            />
          </View>
        </TouchableOpacity>
        
        {isExpanded && (
          <View style={styles.answerContainer}>
            <Text style={styles.answerText}>{item.answer}</Text>
          </View>
        )}
      </Animated.View>
    );
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="chevron-back" size={24} color="#111827" />
        </TouchableOpacity>
        
        <Text style={styles.headerTitle}>FAQs</Text>
        
        <View style={{ width: 40 }} />
      </View>
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#9ca3af" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search FAQs..."
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery?.length > 0 && (
            <TouchableOpacity
              style={styles.clearButton}
              onPress={() => setSearchQuery('')}
            >
              <Ionicons name="close-circle" size={20} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      <View style={styles.content}>
        {filteredFaqs?.length > 0 ? (
          <Animated.View style={{ opacity: fadeAnim }}>
            <FlatList
              data={filteredFaqs}
              renderItem={renderItem}
              keyExtractor={(item) => item.id.toString()}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.listContent}
            />
          </Animated.View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={60} color="#e5e7eb" />
            <Text style={styles.emptyTitle}>No Results Found</Text>
            <Text style={styles.emptySubtitle}>
              We couldn't find any FAQs matching your search.
              Try different keywords or browse all FAQs.
            </Text>
            <TouchableOpacity
              style={styles.resetButton}
              onPress={() => setSearchQuery('')}
            >
              <Text style={styles.resetButtonText}>View All FAQs</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Can't find what you're looking for?
        </Text>
        <TouchableOpacity 
          style={styles.contactButton}
        >
          <Text style={styles.contactButtonText}>Contact Support</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default FaqScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: wp(4),
    paddingTop: Platform.OS == 'android' ? hp(2) : 0,
    paddingBottom: hp(1),
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: hp(2.4),
    fontFamily: 'raleway-bold',
    color: '#111827',
  },
  searchContainer: {
    paddingHorizontal: wp(4),
    marginBottom: hp(2),
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: wp(3),
    paddingVertical: Platform.OS == 'ios' ? hp(1.2) : 0,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: wp(2),
  },
  searchInput: {
    flex: 1,
    fontSize: hp(1.7),
    fontFamily: 'raleway',
    color: '#4b5563',
  },
  clearButton: {
    padding: 5,
  },
  content: {
    flex: 1,
  },
  listContent: {
    paddingBottom: hp(2),
  },
  accordionContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  questionContainer: {
    paddingVertical: hp(1.8),
    paddingHorizontal: wp(4),
    borderBottomWidth: 0,
  },
  questionContainerExpanded: {
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  questionContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  questionText: {
    fontSize: hp(1.8),
    fontFamily: 'raleway-bold',
    color: '#111827',
    flex: 1,
    paddingRight: wp(3),
  },
  answerContainer: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    backgroundColor: '#f9fafb',
  },
  answerText: {
    fontSize: hp(1.7),
    fontFamily: 'raleway',
    color: '#4b5563',
    lineHeight: hp(2.5),
  },
  separator: {
    height: hp(1.5),
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: wp(10),
  },
  emptyTitle: {
    fontSize: hp(2),
    fontFamily: 'raleway-bold',
    color: '#374151',
    marginTop: hp(2),
    marginBottom: hp(1),
  },
  emptySubtitle: {
    fontSize: hp(1.6),
    fontFamily: 'raleway',
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: hp(2.2),
  },
  resetButton: {
    marginTop: hp(2),
    paddingVertical: hp(1.2),
    paddingHorizontal: wp(5),
    backgroundColor: '#6366f1',
    borderRadius: 8,
  },
  resetButtonText: {
    fontSize: hp(1.6),
    fontFamily: 'raleway-bold',
    color: '#ffffff',
  },
  footer: {
    paddingHorizontal: wp(4),
    paddingVertical: hp(2),
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    alignItems: 'center',
  },
  footerText: {
    fontSize: hp(1.6),
    fontFamily: 'raleway',
    color: '#6b7280',
    marginBottom: hp(1),
  },
  contactButton: {
    paddingVertical: hp(1),
    paddingHorizontal: wp(4),
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  contactButtonText: {
    fontSize: hp(1.6),
    fontFamily: 'raleway-bold',
    color: '#4b5563',
  },
});