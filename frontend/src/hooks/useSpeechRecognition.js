import { useState, useEffect } from "react";

const useSpeechRecognition = (onCommandRecognized) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("browser not supporting.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = "en-US"; // 🔥 English Only (For now)
    
    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = (e) => console.error("Speech recognition error:", e);

    recognition.onresult = (event) => {
      const speechText = event.results[0][0].transcript.toLowerCase(); // Convert to lowercase
      setTranscript(speechText);
      onCommandRecognized(speechText); // Process command
    };

    if (isListening) {
      recognition.start();
    } else {
      recognition.stop();
    }

    return () => recognition.stop();
  }, [isListening]);

  return { isListening, transcript, setIsListening };
};

export default useSpeechRecognition;