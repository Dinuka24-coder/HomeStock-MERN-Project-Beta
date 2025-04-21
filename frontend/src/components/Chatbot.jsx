import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Avatar from './Avatar';
import "../styles/Chatbot.css";

const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      sender: "bot",
      text: "Hi there! I'm your Smart Bill Assistant. How can I help you today?",
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      emotion: "happy"
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [currentEmotion, setCurrentEmotion] = useState("happy");
  const [analysisWords, setAnalysisWords] = useState([]);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input on load
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // More sophisticated emotion detection
  const detectEmotion = (message) => {
    const lowerMsg = message.toLowerCase();
    
    // Dictionary of emotional keywords and their associated emotions
    const emotionalKeywords = {
      happy: ['thanks', 'thank', 'great', 'awesome', 'love', 'amazing', 'excellent', 'good', 'wonderful', 'appreciate'],
      sad: ['sorry', 'bad', 'terrible', 'unhappy', 'disappointed', 'error', 'wrong', 'issue', 'problem', 'fail'],
      excited: ['wow', 'incredible', 'fantastic', 'exciting', 'awesome', 'omg', '!', 'brilliant'],
      concerned: ['worried', 'concerned', 'anxious', 'nervous', 'trouble', 'difficult', 'hard', 'challenging'],
      confused: ['confused', 'unclear', 'don\'t understand', 'complicated', 'complex', 'what', 'how', 'why', '?'],
      angry: ['angry', 'upset', 'mad', 'frustrated', 'annoying', 'annoyed', 'terrible']
    };
    
    // Track detected keywords for animation effects
    const detectedWords = [];
    
    // Count emotional keywords in each category
    const emotionScores = Object.entries(emotionalKeywords).reduce((scores, [emotion, keywords]) => {
      const score = keywords.reduce((count, keyword) => {
        if (lowerMsg.includes(keyword)) {
          detectedWords.push(keyword);
          return count + 1;
        }
        return count;
      }, 0);
      scores[emotion] = score;
      return scores;
    }, {});
    
    // Set the words for animation highlights
    setAnalysisWords(detectedWords);
    
    // Find emotion with highest score
    const dominantEmotion = Object.entries(emotionScores).reduce(
      (max, [emotion, score]) => (score > max.score ? { emotion, score } : max),
      { emotion: "neutral", score: 0 }
    );
    
    // Return neutral for low scores or default to question if message ends with ?
    if (dominantEmotion.score === 0) {
      if (lowerMsg.trim().endsWith('?')) return "confused";
      return "neutral";
    }
    
    return dominantEmotion.emotion;
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    // Detect emotion from user input with more nuance
    const userEmotion = detectEmotion(input);
    
    // Add user message
    const userMessage = {
      sender: "user",
      text: input,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      emotion: userEmotion,
      analysisWords: [...analysisWords]  // Store detected words for animation
    };
    
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);
    
    // React to user emotion
    setIsSpeaking(true);
    setCurrentEmotion(userEmotion === "happy" ? "happy" : 
                    userEmotion === "excited" ? "excited" :
                    userEmotion === "sad" ? "concerned" : 
                    userEmotion === "angry" ? "concerned" :
                    userEmotion === "confused" ? "confused" : "neutral");

    try {
      const res = await fetch("http://localhost:3000/api/chatbot/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          message: input,
          emotion: userEmotion 
        })
      });
      
      const data = await res.json();
      
      // More sophisticated bot emotion determination
      let botEmotion = "neutral";
      if (data.reply.includes("sorry") || data.reply.includes("apologize")) {
        botEmotion = "sad";
      } else if (data.reply.match(/great|perfect|excellent|happy to help/i)) {
        botEmotion = "happy";
      } else if (data.reply.match(/let me help|I can assist|I'll|I will/i)) {
        botEmotion = "excited";
      } else if (data.reply.match(/\?|could you|would you/i)) {
        botEmotion = "confused";
      } else if (userEmotion === "confused") {
        botEmotion = "concerned"; // Bot shows concern when user is confused
      }
      
      // Dynamically set bot's emotion based on user's emotion and response content
      setCurrentEmotion(botEmotion);
      
      // Add a small delay to make the transition look more natural
      setTimeout(() => {
        setMessages(prev => [...prev, {
          sender: "bot",
          text: data.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          emotion: botEmotion
        }]);
      }, 500);
      
    } catch (error) {
      const errorMessage = {
        sender: "bot",
        text: "Sorry, I'm having trouble connecting right now. Please try again later.",
        isError: true,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        emotion: "sad"
      };
      
      setCurrentEmotion("sad");
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Keep speaking for slightly longer for more natural feel
      setTimeout(() => setIsSpeaking(false), 2000);
    }
  };

  const handleInputChange = (e) => {
    setInput(e.target.value);
    
    // Real-time reaction to typing with more expressiveness
    if (e.target.value.length > 0) {
      const typedEmotion = detectEmotion(e.target.value);
      
      // Make avatar more responsive to typing
      if (e.target.value.length > 20) {
        setCurrentEmotion(typedEmotion !== "neutral" ? typedEmotion : "confused");
      } else if (e.target.value.includes("?")) {
        setCurrentEmotion("confused");
      } else if (typedEmotion !== "neutral") {
        setCurrentEmotion(typedEmotion);
      } else {
        setCurrentEmotion("neutral");
      }
    } else {
      setCurrentEmotion("neutral");
      setAnalysisWords([]);
    }
  };

  // Animation variants for Framer Motion
  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { 
        type: "spring", 
        stiffness: 500, 
        damping: 30
      }
    },
    exit: { 
      opacity: 0, 
      y: -20, 
      transition: { duration: 0.2 } 
    }
  };
  
  const messageVariants = {
    hidden: { opacity: 0, y: 10, scale: 0.9 },
    visible: { 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        type: "spring", 
        stiffness: 500, 
        damping: 25, 
        mass: 0.8 
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.8, 
      transition: { duration: 0.2 } 
    }
  };

  return (
    <motion.div 
      className="chatbot-container"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
    >
      <motion.div 
        className="chatbot-header"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.5 }}
      >
        <motion.div 
          className="chatbot-avatar-container"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          <Avatar 
            isSpeaking={isSpeaking} 
            emotion={currentEmotion} 
          />
        </motion.div>
        <motion.h3 
          className="chatbot-title"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          Smart Bill Assistant
        </motion.h3>
      </motion.div>
      
      <div className="chatbot-window">
        <AnimatePresence>
          {messages.map((msg, idx) => (
            <motion.div 
              key={idx} 
              className={`message ${msg.sender} ${msg.isError ? 'error' : ''} message-${msg.emotion}`}
              variants={messageVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ delay: idx * 0.05 }}
              layout
            >
              <div className="message-content">
                <div className="message-text">
                  {msg.sender === "user" && msg.analysisWords && msg.analysisWords.length > 0 ? (
                    highlightWords(msg.text, msg.analysisWords)
                  ) : (
                    msg.text
                  )}
                </div>
                <motion.div 
                  className="message-timestamp"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.7 }}
                  transition={{ delay: 0.3 }}
                >
                  {msg.timestamp}
                </motion.div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        
        <AnimatePresence>
          {isLoading && (
            <motion.div 
              className="message bot"
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <div className="message-content">
                <div className="typing-indicator">
                  <motion.span
                    animate={{ 
                      y: [0, -10, 0],
                      opacity: [0.6, 1, 0.6]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1,
                      ease: "easeInOut"
                    }}
                  />
                  <motion.span
                    animate={{ 
                      y: [0, -10, 0],
                      opacity: [0.6, 1, 0.6]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1,
                      ease: "easeInOut",
                      delay: 0.2
                    }}
                  />
                  <motion.span
                    animate={{ 
                      y: [0, -10, 0],
                      opacity: [0.6, 1, 0.6]
                    }}
                    transition={{ 
                      repeat: Infinity, 
                      duration: 1,
                      ease: "easeInOut",
                      delay: 0.4
                    }}
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div ref={messagesEndRef} />
      </div>
      
      <motion.div 
        className="chatbot-input-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5 }}
      >
        <motion.input
          ref={inputRef}
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder="Type your message..."
          disabled={isLoading}
          className={input ? "active" : ""}
          whileFocus={{ scale: 1.02, boxShadow: "0 0 0 3px rgba(71, 118, 230, 0.2)" }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
        />
        <motion.button
          onClick={handleSend}
          disabled={isLoading || !input.trim()}
          className={input.trim() ? "active" : ""}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ scale: 0.9, opacity: 0.7 }}
          animate={{ 
            scale: input.trim() ? 1 : 0.9, 
            opacity: input.trim() ? 1 : 0.7 
          }}
          transition={{ type: "spring", stiffness: 500, damping: 25 }}
        >
          {isLoading ? (
            <motion.div 
              className="send-spinner"
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
            />
          ) : (
            <motion.svg 
              className="send-icon" 
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="2"
              initial={{ x: -5, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <path d="M22 2L11 13"></path>
              <path d="M22 2L15 22L11 13L2 9L22 2Z"></path>
            </motion.svg>
          )}
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

// Helper function to highlight emotional words in user messages
const highlightWords = (text, keywords) => {
  if (!keywords || keywords.length === 0) return text;
  
  let result = [];
  let lastIndex = 0;
  
  // Simple highlighting - in a real app you'd want to use a more robust approach
  for (let i = 0; i < text.length; i++) {
    for (const keyword of keywords) {
      if (text.toLowerCase().substring(i, i + keyword.length) === keyword) {
        // Add text before the keyword
        if (i > lastIndex) {
          result.push(text.substring(lastIndex, i));
        }
        
        // Add the highlighted keyword
        result.push(
          <motion.span 
            key={i} 
            className="highlighted-word"
            initial={{ backgroundColor: "rgba(143, 188, 255, 0)" }}
            animate={{ backgroundColor: "rgba(143, 188, 255, 0.3)" }}
            transition={{ duration: 0.5 }}
          >
            {text.substring(i, i + keyword.length)}
          </motion.span>
        );
        
        lastIndex = i + keyword.length;
        i += keyword.length - 1; // Skip ahead
        break;
      }
    }
  }
  
  // Add any remaining text
  if (lastIndex < text.length) {
    result.push(text.substring(lastIndex));
  }
  
  return result;
};

export default Chatbot;

//Still configuring the frontend of the chatbot