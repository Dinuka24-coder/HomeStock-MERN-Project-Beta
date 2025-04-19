const express = require("express");
const router = express.Router();
const axios = require("axios");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Conversation history array
const conversationHistory = [];

// Smart Bill Manager Chat Endpoint
router.post("/chat", async (req, res) => {
  const userMessage = req.body.message;

  // Read project knowledge from file
  const filePath = path.join(__dirname, "../data/project-knowledge.txt");
  const projectInfo = fs.existsSync(filePath) 
    ? fs.readFileSync(filePath, "utf-8") 
    : `Smart Bill Manager is a MERN stack application for managing bills, inventory, and expenses.`;

  // Add user message to history
  conversationHistory.push({ role: "user", content: userMessage });

  const systemPrompt = `
${projectInfo}

You are an AI assistant for Smart Bill Manager with the following capabilities:
- Bill management (CRUD operations)
- Voice command processing
- Inventory tracking
- Expense management
- Payment due date tracking
- User authentication system
- Admin dashboard features

Current conversation context:
${conversationHistory.slice(-5).map(m => `${m.role}: ${m.content}`).join('\n')}

Guidelines:
1. Keep responses concise (1-2 sentences)
2. Be helpful and friendly
3. For technical questions, focus on MERN stack solutions
4. If unsure, ask clarifying questions

User Query: ${userMessage}
`;

  try {
    const response = await axios.post(
      "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.1",
      {
        inputs: systemPrompt,
        parameters: {
          max_new_tokens: 200,
          temperature: 0.8,
          top_p: 0.9,
          repetition_penalty: 1.2,
          return_full_text: false
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 10000 // 10 second timeout
      }
    );

    // Extract and clean the response
    let reply = response.data[0]?.generated_text || "I couldn't generate a response. Please try again.";
    
    // Clean up the response
    reply = reply
      .replace(systemPrompt, '')
      .replace(/Assistant:|AI:|Bot:/gi, '')
      .trim();

    // Add assistant reply to history
    conversationHistory.push({ role: "assistant", content: reply });

    res.json({
      reply,
      timestamp: new Date().toISOString(),
      system: "Smart Bill Manager Assistant",
      avatar: "https://i.imgur.com/7QqVYZT.png"
    });

  } catch (error) {
    console.error("Chat API error:", error.response?.data || error.message);
    
    // Fallback response
    const fallbackResponses = [
      "I'm having trouble processing that request right now.",
      "Let me check that information and get back to you.",
      "Our systems are a bit busy. Please try again in a moment."
    ];
    
    const randomFallback = fallbackResponses[Math.floor(Math.random() * fallbackResponses.length)];
    
    res.status(500).json({
      reply: randomFallback,
      isError: true,
      system: "Error"
    });
  }
});

module.exports = router;