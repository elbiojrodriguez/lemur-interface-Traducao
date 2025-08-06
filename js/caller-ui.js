const express = require('express');
const WebSocket = require('ws');
const { SpeechClient } = require('@google-cloud/speech');
const { TranslationServiceClient } = require('@google-cloud/translate').v3;
const stream = require('stream');
const path = require('path');

const app = express();
const PORT = 8080;
const dirname = __dirname;

const GOOGLE_CONFIG = {
  keyFilename: path.join(dirname, 'GOOGLECREDENTIALSJSON.json'),
  projectId: 'transcricao-tempo-real-novo'
};

// Servir HTMLs
app.get('/', (req, res) => res.sendFile(path.join(dirname, 'index.html')));
app.get('/recepcao.html', (req, res) => res.sendFile(path.join(dirname, 'recepcao.html')));

const server = app.listen(PORT, () => {
  console.log(`🚀 Servidor rodando na porta ${PORT}`);
});

const wss = new WebSocket.Server({ server });

wss.on('connection', (ws) => {
  console.log('📡 Cliente conectado ✅');

  const speechClient = new SpeechClient(GOOGLE_CONFIG);
  const translationClient = new TranslationServiceClient(GOOGLE_CONFIG);

  let recognizeStream = null;
  let targetLanguage = '';
  let clientType = ''; // 'A' ou 'B'

  const speechRequest = {
    config: {
      encoding: 'WEBM_OPUS',
      sampleRateHertz: 48000,
      languageCode: 'pt-BR',
      alternativeLanguageCodes: ['en-US', 'es-ES', 'fr-FR', 'de-DE', 'ar-SA', 'zh-CN'],
      enableAutomaticPunctuation: true,
    },
    interimResults: false
  };

  ws.on('message', async (msg) => {
    try {
      const parsed = JSON.parse(msg);
      if (parsed.target !== undefined) {
        targetLanguage = parsed.target;
        clientType = parsed.clientType || '';
        console.log(`🌐 Idioma de destino: ${targetLanguage || 'Nenhum'} | Tipo: ${clientType}`);
        return;
      }
    } catch (e) {
      // Não é JSON, então é áudio
    }

    if (!recognizeStream) {
      recognizeStream = speechClient.streamingRecognize(speechRequest)
        .on('data', async (data) => {
          const result = data.results[0];
          if (result?.isFinal) {
            const transcript = result.alternatives[0].transcript;
            const detectedLanguage = result.languageCode || 'pt-BR';
            const sourceLanguage = detectedLanguage.split('-')[0];

            const response = {
              original: transcript,
              from: clientType
            };

            if (targetLanguage) {
              try {
                const [translation] = await translationClient.translateText({
                  parent: `projects/${GOOGLE_CONFIG.projectId}/locations/global`,
                  contents: [transcript],
                  mimeType: 'text/plain',
                  sourceLanguageCode: sourceLanguage,
                  targetLanguageCode: targetLanguage,
                });
                response.translated = translation.translations[0].translatedText;
              } catch (err) {
                console.error('❌ Erro na tradução:', err.message);
                response.translated = '[Erro na tradução]';
              }
            }

            // Envia para todos os clientes conectados
            wss.clients.forEach((client) => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(response));
              }
            });
          }
        });
    }

    const audioStream = new stream.PassThrough();
    audioStream.end(msg);
    audioStream.pipe(recognizeStream, { end: false });
  });

  ws.on('close', () => {
    if (recognizeStream) recognizeStream.destroy();
  });
});
