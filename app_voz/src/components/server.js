const express = require('express');
const { SpeechClient } = require('@google-cloud/speech');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const { Readable } = require('stream');

// Configuração do Google Cloud
const client = new SpeechClient({
  keyFilename: path.join(__dirname, 'your-google-credentials.json'), // caminho para sua chave JSON
});

// Configuração do Express
const app = express();
const port = 3001;

// Configuração de upload de arquivos com multer
const upload = multer({ dest: 'uploads/' });

// Função para converter áudio em texto
const transcribeAudio = async (audioFilePath) => {
  const encoding = 'LINEAR16';
  const sampleRateHertz = 16000;
  const languageCode = 'en-US';

  const request = {
    config: {
      encoding: encoding,
      sampleRateHertz: sampleRateHertz,
      languageCode: languageCode,
    },
    interimResults: false, // Se você quiser resultados intermediários, defina como true
  };

  const file = fs.readFileSync(audioFilePath);
  const audioBytes = file.toString('base64');

  const [response] = await client.recognize({
    ...request,
    audio: {
      content: audioBytes,
    },
  });

  const transcription = response.results
    .map(result => result.alternatives[0].transcript)
    .join('\n');

  return transcription;
};

// Rota para upload de áudio
app.post('/upload', upload.single('audio'), async (req, res) => {
  const audioFilePath = req.file.path;

  try {
    const transcription = await transcribeAudio(audioFilePath);
    res.json({ transcription });
  } catch (error) {
    console.error(error);
    res.status(500).send('Erro ao transcrever áudio');
  }
});

// Inicia o servidor
app.listen(port, () => {
  console.log(`Servidor backend rodando na porta ${port}`);
});
