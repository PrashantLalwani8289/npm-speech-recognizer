import React, { useState, useEffect } from "react";
import Recorder from "recorder-js";

const SpeechRecognitionApp = () => {
  const [transcript, setTranscript] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [error, setError] = useState(null);
  const [audioContext, setAudioContext] = useState(null);
  const [recorder12, setRecorder] = useState(null);
  const [socket, setSocket] = useState(null);
  const [streamInterval, setStreamInterval] = useState(null);

  useEffect(() => {
    const ws = new WebSocket(
      "ws://localhost:3002/api/v1/blog/ws/transcribe-websocket"
    );
    const context = new (window.AudioContext || window.webkitAudioContext)();
    setAudioContext(context);
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
  //   useEffect(() => {
  //     if (socket) {
  //       socket.onmessage = (event) => {
  //         setTranscript((prev) => prev + " " + event.data);
  //       };
  //     }
  //   }, []);

  //   const startRecording = async () => {
  //     try {
  //       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  //       const recorder = new Recorder(audioContext);
  //       recorder.init(stream);
  //       recorder.start().then(() => {
  //         setRecorder(recorder);
  //         setIsRecording(true);

  //         // Stream audio data at intervals
  //         const interval = setInterval(async () => {
  //           if (recorder) {
  //             const { blob } = await recorder.getBuffer();
  //             const file = new File([blob], "audio_chunk.wav", {
  //               type: blob.type,
  //             });

  //             const convertToBase64 = (file) =>
  //               new Promise((resolve, reject) => {
  //                 const reader = new FileReader();
  //                 reader.readAsDataURL(file);
  //                 reader.onload = () => resolve(reader.result);
  //                 reader.onerror = (error) => reject(error);
  //               });

  //             const base64String = await convertToBase64(file);

  //             // Send audio data to WebSocket
  //             if (socket && socket.readyState === WebSocket.OPEN) {
  //               socket.send(base64String.split(",")[1]); // Send only the Base64 data
  //             }
  //           }
  //         }, 1000); // Send audio chunks every 1 second

  //         setStreamInterval(interval);
  //       });
  //     } catch (err) {
  //       setError("Microphone access denied or unavailable.");
  //     }
  //   };
  const startRecording = async () => {
    try {
      //   const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      //   const recorder = new Recorder(audioContext);
      //   recorder.init(stream);

      //   recorder.start();
      //   setRecorder(recorder);
      setIsRecording(true);

      // Stream audio data at intervals
      const interval = setInterval(async () => {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        const recorder = new Recorder(audioContext);
        recorder.init(stream);

        recorder.start();
        setRecorder(recorder);
        if (recorder !== null) {
          const { blob } = await recorder.stop();
          const file = new File([blob], "audio.wav", { type: blob.type });

          const convertToBase64 = (file) =>
            new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.readAsDataURL(file);
              reader.onload = () => resolve(reader.result);
              reader.onerror = (error) => reject(error);
            });

          convertToBase64(file).then((base64String) => {
            // Send audio data to WebSocket
            if (socket && socket.readyState === WebSocket.OPEN) {
              socket.send(base64String.split(",")[1]); // Send only the Base64 data
            }
          });
        }
      }, 3000); // Export and send audio chunks every second

      setStreamInterval(interval);
    } catch (err) {
      setError("Microphone access denied or unavailable.");
    }
  };
  const stopRecording = async () => {
    if (recorder12) {
      clearInterval(streamInterval);
      await recorder12.stop();
      setRecorder(null);
    }

    if (socket) {
      socket.close();
    }

    setIsRecording(false);
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
