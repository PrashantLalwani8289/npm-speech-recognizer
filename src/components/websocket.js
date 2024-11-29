import React, { useState, useEffect } from "react";
import Recorder from "recorder-js";

const SpeechRecognitionApp = () => {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [recorder, setRecorder] = useState(null);
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    const context = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(context);

    const ws = new WebSocket(
      "ws://localhost:3002/api/v1/blog/ws/transcribe-websocket"
    );
    ws.onmessage = (event) => {
      setTranscript((prev) => prev + " " + event.data);
    };
    ws.onerror = (event) => {
      setError("WebSocket error occurred.");
      console.error(event);
    };
    ws.onclose = () => {
      console.log("WebSocket closed.");
    };
    setSocket(ws);

    return () => {
      context.close();
      ws.close();
    };
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new Recorder(audioContext);
      recorder.init(stream);
      recorder.start().then(() => {
        setRecorder(recorder);
        setIsRecording(true);
      });
    } catch (err) {
      setError("Microphone access denied or unavailable.");
    }
  };

  const stopRecording = async () => {
    if (recorder && socket) {
      const { blob } = await recorder.stop();
      const file = new File([blob], "audio.wav", { type: blob.type });

      const convertToBase64 = (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = () => resolve(reader.result);
          reader.onerror = (error) => reject(error);
        });

      const base64String = await convertToBase64(file);

      // Send audio data to WebSocket
      socket.send(base64String.split(",")[1]); // Send only the Base64 data
      setIsRecording(false);
    }
  };

  return (
    <div style={{ textAlign: "center", marginTop: "50px" }}>
      <h1>Speech Recognition with WebSocket</h1>
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
