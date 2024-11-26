import React, { useState, useEffect, useRef } from "react";

const SpeechRecognitionApp = () => {
  const [transcript, setTranscript] = useState(""); // Captures spoken text
  const [isListening, setIsListening] = useState(false); // Tracks the listening state
  const [error, setError] = useState(null); // Captures any errors
  const recognitionRef = useRef(null); // Store the SpeechRecognition instance

  // Initialize Speech Recognition in useEffect
  useEffect(() => {
    if ("SpeechRecognition" in window || "webkitSpeechRecognition" in window) {
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true; // Stops after each phrase
      recognitionRef.current.interimResults = false; // Final results only
      recognitionRef.current.lang = "en-US"; // Set the language

      // On Result Event
      recognitionRef.current.onresult = (event) => {
        const transcriptedText = event.results[0][0].transcript;
        console.log("transcriptedText:", transcriptedText);
        setTranscript(transcriptedText);
      };

      // On Error Event
      recognitionRef.current.onerror = (event) => {
        setError(`Error occurred: ${event.error}`);
        setIsListening(false);
      };

      // On End Event
      recognitionRef.current.onend = () => {
        setIsListening(false);
      };
    } else {
      setError("Speech Recognition API is not supported in this browser.");
    }
  }, []);

  // Start Listening
  const startListening = () => {
    if (recognitionRef.current) {
      setIsListening(true);
      setError(null); // Clear previous errors
      recognitionRef.current.start();
    } else {
      setError("Speech Recognition is not initialized.");
    }
  };

  // Stop Listening
  const stopListening = () => {
    if (recognitionRef.current) {
      setIsListening(false);
      recognitionRef.current.stop();
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Speech Recognition in React</h1>
      <p>Click "Start" and speak into your microphone.</p>

      <div>
        <button onClick={startListening} disabled={isListening}>
          Start Listening
        </button>
        <button onClick={stopListening} disabled={!isListening}>
          Stop Listening
        </button>
      </div>

      <div style={{ marginTop: "20px" }}>
        <h3>Transcript:</h3>
        <p>{transcript || "Your speech will appear here..."}</p>
      </div>

      {error && (
        <div style={{ color: "red", marginTop: "10px" }}>
          <p>{error}</p>
        </div>
      )}
    </div>
  );
};

export default SpeechRecognitionApp;
