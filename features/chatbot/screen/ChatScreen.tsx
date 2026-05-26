// import React, { useState, useRef, useEffect } from "react";
// import {
//   View,
//   Text,
//   StyleSheet,
//   FlatList,
//   TextInput,
//   TouchableOpacity,
//   KeyboardAvoidingView,
//   Platform,
//   ActivityIndicator,
//   Keyboard,
// } from "react-native";
// import { Ionicons } from "@expo/vector-icons";
// import { getFamilyAIResponse } from "../services/chatBotServices";
// import { AppHeader } from "../../../src/components/AppHeader";
// import { SafeAreaView } from "react-native-safe-area-context";
// import { useAppStore } from "../../../src/store/useAppStore";

// interface Message {
//   id: string;
//   text: string;
//   sender: "user" | "ai";
// }

// export default function ChatBotScreen() {
//   const { chatHistory, addMessage } = useAppStore();

//   const [inputText, setInputText] = useState("");
//   const [isTyping, setIsTyping] = useState(false);

//   const flatListRef = useRef<FlatList>(null);

//   const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

//   useEffect(() => {
//     const showSub = Keyboard.addListener("keyboardDidShow", () =>
//       setIsKeyboardOpen(true),
//     );
//     const hideSub = Keyboard.addListener("keyboardDidHide", () =>
//       setIsKeyboardOpen(false),
//     );
//     return () => {
//       showSub.remove();
//       hideSub.remove();
//     };
//   }, []);
//   const handleSend = async () => {
//     if (inputText.trim() === "") return;

//     const userMsg: Message = {
//       id: Date.now().toString(),
//       text: inputText,
//       sender: "user",
//     };

//     addMessage(userMsg);

//     const currentInput = inputText;

//     setInputText("");
//     setIsTyping(true);

//     try {
//       const historyForAI = chatHistory.map((msg) => ({
//         role: msg.sender === "user" ? "user" : "model",
//         parts: [{ text: msg.text }],
//       }));

//       const aiResponse = await getFamilyAIResponse(currentInput, historyForAI);

//       const aiMsg: Message = {
//         id: (Date.now() + 1).toString(),
//         text: aiResponse,
//         sender: "ai",
//       };

//       addMessage(aiMsg);
//     } catch (error) {
//       console.error("Chat Error:", error);

//       addMessage({
//         id: Date.now().toString(),
//         text: "Sorry, I'm having trouble connecting right now.",
//         sender: "ai",
//       });
//     } finally {
//       setIsTyping(false);

//       setTimeout(() => {
//         flatListRef.current?.scrollToEnd({
//           animated: true,
//         });
//       }, 100);
//     }
//   };

//   const renderMessage = ({ item }: { item: Message }) => (
//     <View
//       style={[
//         styles.bubble,
//         item.sender === "user" ? styles.userBubble : styles.aiBubble,
//       ]}
//     >
//       <Text
//         style={[
//           styles.messageText,
//           item.sender === "user" ? styles.userText : styles.aiText,
//         ]}
//       >
//         {item.text}
//       </Text>
//     </View>
//   );

//   return (
//     <SafeAreaView style={styles.safeArea} edges={["top"]}>
//       <View style={styles.screen}>
//         <AppHeader title="Family AI Assistant" />
//         <KeyboardAvoidingView
//           style={styles.container}
//           behavior={Platform.OS === "ios" ? "padding" : "padding"}
//           keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
//         >
//           <FlatList
//             ref={flatListRef}
//             data={chatHistory}
//             keyExtractor={(item) => item.id}
//             renderItem={renderMessage}
//             showsVerticalScrollIndicator={false}
//             contentContainerStyle={styles.listContent}
//             onContentSizeChange={() =>
//               flatListRef.current?.scrollToEnd({
//                 animated: true,
//               })
//             }
//           />

//           {isTyping && (
//             <ActivityIndicator
//               size="small"
//               color="#1E3A8A"
//               style={styles.loader}
//             />
//           )}

//           <SafeAreaView edges={["bottom"]} style={styles.inputWrapper}>
//             {/* <View style={styles.inputContainer}> */}
//             <View
//               style={[
//                 styles.inputContainer,
//                 {
//                   paddingBottom: isKeyboardOpen ? 0 : 0,
//                 },
//               ]}
//             >
//               <TextInput
//                 style={styles.input}
//                 placeholder="Ask me anything..."
//                 placeholderTextColor="#94A3B8"
//                 value={inputText}
//                 onChangeText={setInputText}
//                 autoCorrect={false}
//                 multiline
//               />

//               <TouchableOpacity
//                 style={styles.sendBtn}
//                 onPress={handleSend}
//                 activeOpacity={0.8}
//               >
//                 <Ionicons name="send" size={22} color="white" />
//               </TouchableOpacity>
//             </View>
//           </SafeAreaView>
//         </KeyboardAvoidingView>
//       </View>
//     </SafeAreaView>
//   );
// }

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: "#1E3A8A",
//   },
//   screen: {
//     flex: 1,
//     backgroundColor: "#F8FAFC",
//   },
//   container: {
//     flex: 1,
//     backgroundColor: "#F8FAFC",
//   },

//   listContent: {
//     padding: 15,
//     paddingBottom: 90,
//   },

//   bubble: {
//     maxWidth: "80%",
//     paddingHorizontal: 14,
//     paddingVertical: 12,
//     borderRadius: 20,
//     marginBottom: 12,
//   },

//   userBubble: {
//     alignSelf: "flex-end",
//     backgroundColor: "#1E3A8A",
//     borderBottomRightRadius: 4,
//   },

//   aiBubble: {
//     alignSelf: "flex-start",
//     backgroundColor: "#E2E8F0",
//     borderBottomLeftRadius: 4,
//   },

//   messageText: {
//     fontSize: 16,
//     lineHeight: 22,
//   },

//   userText: {
//     color: "white",
//   },

//   aiText: {
//     color: "#1E293B",
//   },

//   loader: {
//     marginBottom: 10,
//     alignSelf: "center",
//   },

//   inputWrapper: {
//     backgroundColor: "white",
//     borderTopWidth: 1,
//     borderTopColor: "#E2E8F0",
//     marginBottom: 0,
//     paddingBottom: 0,
//   },

//   inputContainer: {
//     flexDirection: "row",
//     alignItems: "flex-end",
//     paddingHorizontal: 12,
//     paddingTop: 10,
//     // paddingBottom:iskeyboardopen?20:0,
//     // paddingBottom: Platform.OS === "ios" ? 20 : 0,
//     backgroundColor: "white",
//   },

//   input: {
//     flex: 1,
//     backgroundColor: "#F1F5F9",
//     borderRadius: 25,
//     paddingHorizontal: 18,
//     paddingVertical: 12,
//     fontSize: 16,
//     maxHeight: 120,
//     color: "#0F172A",
//   },

//   sendBtn: {
//     width: 50,
//     height: 50,
//     borderRadius: 25,
//     backgroundColor: "#1E3A8A",
//     justifyContent: "center",
//     alignItems: "center",
//     marginLeft: 10,
//   },
// });

import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Keyboard,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { getFamilyAIResponse } from "../services/chatBotServices";
import { AppHeader } from "../../../src/components/AppHeader";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAppStore } from "../../../src/store/useAppStore";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Message {
  id: string;
  text: string;
  sender: "user" | "ai";
}

const AI_DISCLOSURE_KEY = "@family_hut_ai_disclosure_accepted";

export default function ChatBotScreen() {
  const { chatHistory, addMessage } = useAppStore();

  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showDisclosure, setShowDisclosure] = useState(false);

  const flatListRef = useRef<FlatList>(null);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Check if user already accepted the AI privacy disclosure
  useEffect(() => {
    const checkDisclosure = async () => {
      try {
        const hasAccepted = await AsyncStorage.getItem(AI_DISCLOSURE_KEY);
        if (hasAccepted !== "true") {
          setShowDisclosure(true);
        }
      } catch (e) {
        setShowDisclosure(true); // Fallback to show if storage fails
      }
    };
    checkDisclosure();
  }, []);

  const handleAcceptDisclosure = async () => {
    try {
      await AsyncStorage.setItem(AI_DISCLOSURE_KEY, "true");
      setShowDisclosure(false);
    } catch (e) {
      setShowDisclosure(false);
    }
  };

  useEffect(() => {
    const showSub = Keyboard.addListener("keyboardDidShow", () =>
      setIsKeyboardOpen(true),
    );
    const hideSub = Keyboard.addListener("keyboardDidHide", () =>
      setIsKeyboardOpen(false),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const handleSend = async () => {
    if (inputText.trim() === "") return;

    // Automatically dismiss disclosure on first message if they haven't manually closed it
    if (showDisclosure) {
      handleAcceptDisclosure();
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      text: inputText,
      sender: "user",
    };

    addMessage(userMsg);
    const currentInput = inputText;
    setInputText("");
    setIsTyping(true);

    try {
      const historyForAI = chatHistory.map((msg) => ({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.text }],
      }));

      const aiResponse = await getFamilyAIResponse(currentInput, historyForAI);

      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: aiResponse,
        sender: "ai",
      };

      addMessage(aiMsg);
    } catch (error) {
      console.error("Chat Error:", error);

      addMessage({
        id: Date.now().toString(),
        text: "Sorry, I'm having trouble connecting right now.",
        sender: "ai",
      });
    } finally {
      setIsTyping(false);

      setTimeout(() => {
        flatListRef.current?.scrollToEnd({
          animated: true,
        });
      }, 100);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.bubble,
        item.sender === "user" ? styles.userBubble : styles.aiBubble,
      ]}
    >
      <Text
        style={[
          styles.messageText,
          item.sender === "user" ? styles.userText : styles.aiText,
        ]}
      >
        {item.text}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.screen}>
        <AppHeader title="Family AI Assistant" />
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "padding"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
        >
          <FlatList
            ref={flatListRef}
            data={chatHistory}
            keyExtractor={(item) => item.id}
            renderItem={renderMessage}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({
                animated: true,
              })
            }
          />

          {isTyping && (
            <ActivityIndicator
              size="small"
              color="#1E3A8A"
              style={styles.loader}
            />
          )}

          {/* AI Privacy Disclosure Card for Apple Guidelines */}
          {showDisclosure && (
            <View style={styles.disclosureCard}>
              <View style={styles.disclosureHeader}>
                <Ionicons name="shield-checkmark" size={18} color="#1E3A8A" />
                <Text style={styles.disclosureTitle}>Privacy Disclosure</Text>
              </View>
              <Text style={styles.disclosureText}>
                To provide smart assistant features, text messages typed here
                are securely transmitted to our AI partner (Google Gemini) to
                generate replies. No personal identity data (like your name or
                email) is shared.
              </Text>
              <TouchableOpacity
                style={styles.disclosureBtn}
                onPress={handleAcceptDisclosure}
                activeOpacity={0.7}
              >
                <Text style={styles.disclosureBtnText}>
                  Acknowledge & Continue
                </Text>
              </TouchableOpacity>
            </View>
          )}

          <SafeAreaView edges={["bottom"]} style={styles.inputWrapper}>
            <View
              style={[
                styles.inputContainer,
                {
                  paddingBottom: isKeyboardOpen ? 0 : 0,
                },
              ]}
            >
              <TextInput
                style={styles.input}
                placeholder="Ask me anything..."
                placeholderTextColor="#94A3B8"
                value={inputText}
                onChangeText={setInputText}
                autoCorrect={false}
                multiline
              />

              <TouchableOpacity
                style={styles.sendBtn}
                onPress={handleSend}
                activeOpacity={0.8}
              >
                <Ionicons name="send" size={22} color="white" />
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#1E3A8A",
  },
  screen: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  container: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  listContent: {
    padding: 15,
    paddingBottom: 20, // Reduced from 90 to handle layout cleanly
  },
  bubble: {
    maxWidth: "80%",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#1E3A8A",
    borderBottomRightRadius: 4,
  },
  aiBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#E2E8F0",
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  userText: {
    color: "white",
  },
  aiText: {
    color: "#1E293B",
  },
  loader: {
    marginBottom: 10,
    alignSelf: "center",
  },
  /* --- New Disclosure Card Styles --- */
  disclosureCard: {
    backgroundColor: "#EFF6FF",
    borderTopWidth: 2,
    borderTopColor: "#1E3A8A",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  disclosureHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  disclosureTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1E3A8A",
    marginLeft: 6,
  },
  disclosureText: {
    fontSize: 12,
    color: "#475569",
    lineHeight: 17,
    marginBottom: 10,
  },
  disclosureBtn: {
    backgroundColor: "#1E3A8A",
    borderRadius: 8,
    paddingVertical: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  disclosureBtnText: {
    color: "white",
    fontSize: 13,
    fontWeight: "600",
  },
  /* ---------------------------------- */
  inputWrapper: {
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#E2E8F0",
    marginBottom: 0,
    paddingBottom: 0,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 12,
    paddingTop: 10,
    backgroundColor: "white",
  },
  input: {
    flex: 1,
    backgroundColor: "#F1F5F9",
    borderRadius: 25,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 16,
    maxHeight: 120,
    color: "#0F172A",
  },
  sendBtn: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#1E3A8A",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 10,
  },
});
