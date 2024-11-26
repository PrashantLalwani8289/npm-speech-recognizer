import React, { useState, useEffect } from "react";
import annyang from "annyang";

const AnnyangApp = () => {
  const [transcript, setTranscript] = useState(""); // Captures spoken text
  const [isListening, setIsListening] = useState(false); // Tracks listening state
  const [error, setError] = useState(null); // Error handling

  useEffect(() => {
    // Check if Annyang is supported
    if (annyang) {
      // Set language
      annyang.setLanguage("en-US");

      // Define commands (an empty command to capture everything)
      const commands = {
        "*speech": (speech) => {
          // Update transcript state with captured speech
          setTranscript((prevTranscript) => prevTranscript + " " + speech);
        },
      };

      // Add commands to Annyang
      annyang.addCommands(commands);

      // Error handling
      annyang.addCallback("error", (error) => {
        setError(`Error occurred: ${error}`);
        setIsListening(false);
      });

      // Restart listening automatically if it stops unexpectedly
      annyang.addCallback("end", () => {
        if (isListening) {
          annyang.start();
        }
      });
    } else {
      setError("Annyang is not supported in this browser.");
    }

    // Cleanup function to stop Annyang when component unmounts
    return () => {
      if (annyang) {
        annyang.abort();
      }
    };
  }, [isListening]);

  // Start listening
  const startListening = () => {
    if (annyang) {
      setIsListening(true);
      setError(null); // Clear any previous errors
      annyang.start({ autoRestart: true, continuous: true }); // Start Annyang
    } else {
      setError("Annyang is not initialized.");
    }
  };

  // Stop listening
  const stopListening = () => {
    if (annyang) {
      setIsListening(false);
      annyang.abort();
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Annyang Speech Recognition in React</h1>
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

export default AnnyangApp;
