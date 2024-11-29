import React, { useState, useEffect } from "react";
import axios from "axios";
import Recorder from "recorder-js";

const SpeechRecognitionApp = () => {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [recorder, setRecorder] = useState(null);

  // Check if the browser supports the native SpeechRecognition API
  const supportsNativeSpeechRecognition = () => {
    return "SpeechRecognition" in window || "webkitSpeechRecognition" in window;
  };

  useEffect(() => {
    // Initialize Web Audio API for Recorder.js if native SpeechRecognition is not available
    if (!supportsNativeSpeechRecognition()) {
      try {
        const context = new (window.AudioContext ||
          window.webkitAudioContext)();
        setAudioContext(context);
      } catch (err) {
        setError("Web Audio API is not supported in this browser.");
      }
    }

    return () => {
      if (audioContext) {
        audioContext.close();
      }
    };
  }, []);

  const startRecording = async () => {
    if (supportsNativeSpeechRecognition()) {
      // Use native SpeechRecognition API
      const SpeechRecognition =
        window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();

      recognition.continuous = true;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        const transcriptedText = event.results[event.resultIndex][0].transcript;
        setTranscript(
          (prevTranscript) => prevTranscript + " " + transcriptedText
        );
      };

      recognition.onerror = (event) => {
        setError(`Error occurred: ${event.error}`);
        setIsRecording(false);
      };

      recognition.onend = () => {
        if (isRecording) {
          recognition.start();
        }
      };

      recognition.start();
      setIsRecording(true);
    } else {
      // Use Recorder.js as fallback
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new Recorder(audioContext);
        recorder.init(stream);

        recorder.start().then(() => {
          setRecorder(recorder);
          setIsRecording(true);
        });
      } catch (err) {
        setError("Microphone access denied or unavailable.");
      }
    }
  };
  const convertToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };
  const stopRecording = async () => {
    if (supportsNativeSpeechRecognition()) {
      // Stop native SpeechRecognition API
      setIsRecording(false);
    } else {
      // Stop Recorder.js
      if (recorder) {
        const { blob } = await recorder.stop();
        console.log(blob, "blog");
        setIsRecording(false);
        const file = new File([blob], "audio.wav", { type: blob.type });
        console.log(file, "file");

        // Convert the File to Base64
        const base64String = await convertToBase64(file);
        console.log(base64String, "base64String");
        // Send audio blob to a speech-to-text API
        // const formData = new FormData();
        // formData.append("file", base64String);

        try {
          const response = await axios.post(
            "http://localhost:3002/api/v1/blog/transcribe-audio",
            { audio: base64String },
            {
              headers: {
                "Content-Type": "application/json",
              },
            }
          );
          console.log(response, "response");
          if (response.data.data) {
            setTranscript(response.data.data); // Assuming API response contains a 'transcript' field
          } else {
            console.log(response.message);
          }
        } catch (apiError) {
          console.error(apiError);
          setError("Error occurred while sending audio to API.");
        }
      }
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Speech Recognition with Polyfill</h1>
      <p>Click "Start" and speak into your microphone.</p>

      <div>
        <button onClick={startRecording} disabled={isRecording}>
          Start Recording
        </button>
        <button onClick={stopRecording} disabled={!isRecording}>
          Stop Recording
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
