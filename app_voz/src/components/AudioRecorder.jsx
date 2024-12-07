
import React, { useState, useRef } from "react";

function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
        audioChunks.current = [];

        // Enviar o áudio para o servidor backend
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.wav");

        try {
          const response = await fetch("http://localhost:3001/upload", {
            method: "POST",
            body: formData,
          });

          const data = await response.json();
          setTranscription(data.transcription); // Exibe a transcrição na tela
        } catch (error) {
          console.error("Erro ao enviar o áudio para transcrição:", error);
        }
      };

      mediaRecorder.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Erro ao acessar o microfone:", err);
    }
  };

  const stopRecording = () => {
    mediaRecorder.current.stop();
    setIsRecording(false);
  };

  return (
    <div>
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? "Parar Gravação" : "Iniciar Gravação"}
      </button>

      {/* Apenas exibe a transcrição, sem o player de áudio */}
      {transcription && (
        <div>
          <h3>Transcrição:</h3>
          <p>{transcription}</p>
        </div>
      )}
    </div>
  );
}

export default AudioRecorder;
