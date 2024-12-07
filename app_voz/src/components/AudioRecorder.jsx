import React, { useState, useRef, useEffect } from "react";

function AudioRecorder() {
  const [isRecording, setIsRecording] = useState(false);
  const [audioURL, setAudioURL] = useState(null);
  const [transcription, setTranscription] = useState("");
  const [devices, setDevices] = useState([]);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const mediaRecorder = useRef(null);
  const audioChunks = useRef([]);

  useEffect(() => {
    // Lista os dispositivos de entrada de áudio disponíveis
    navigator.mediaDevices.enumerateDevices().then((deviceList) => {
      const audioDevices = deviceList.filter((device) => device.kind === "audioinput");
      setDevices(audioDevices);
      if (audioDevices.length > 0) {
        setSelectedDevice(audioDevices[0].deviceId); // Seleciona o primeiro dispositivo por padrão
      }
    });
  }, []);

  const startRecording = async () => {
    try {
      // Configurações de áudio para melhorar a qualidade
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: selectedDevice ? { exact: selectedDevice } : undefined,
          sampleRate: 44100, // Taxa de amostragem
          channelCount: 2, // Estéreo
          noiseSuppression: true, // Redução de ruído
          echoCancellation: true, // Cancelamento de eco
        },
      });

      mediaRecorder.current = new MediaRecorder(stream);

      mediaRecorder.current.ondataavailable = (event) => {
        audioChunks.current.push(event.data);
      };

      mediaRecorder.current.onstop = async () => {
        const audioBlob = new Blob(audioChunks.current, { type: "audio/wav" });
        audioChunks.current = [];

        // Cria uma URL para reprodução do áudio
        const audioURL = URL.createObjectURL(audioBlob);
        setAudioURL(audioURL);

        // Envia o áudio para o servidor backend
        const formData = new FormData();
        formData.append("audio", audioBlob, "recording.wav");

        try {
          const response = await fetch("http://localhost:3001/upload", {
            method: "POST",
            body: formData,
          });

          if (!response.ok) {
            throw new Error(`Erro no servidor: ${response.statusText}`);
          }

          const data = await response.json();
          setTranscription(data.transcription);
        } catch (error) {
          console.error("Erro ao enviar o áudio para transcrição:", error);
          setTranscription("Erro ao processar a transcrição");
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
      {/* Seleção de microfone */}
      {devices.length > 0 && (
        <div>
          <label htmlFor="microphone">Selecionar microfone: </label>
          <select
            id="microphone"
            onChange={(e) => setSelectedDevice(e.target.value)}
            value={selectedDevice || ""}
          >
            {devices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Microfone ${device.deviceId}`}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Botão para iniciar ou parar a gravação */}
      <button onClick={isRecording ? stopRecording : startRecording}>
        {isRecording ? "Parar Gravação" : "Iniciar Gravação"}
      </button>

      {isRecording && <p>Gravando...</p>}

      {/* Player de áudio para reprodução */}
      {audioURL && (
        <div>
          <h3>Áudio Gravado:</h3>
          <audio controls src={audioURL}></audio>
        </div>
      )}

      {/* Transcrição exibida */}
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
