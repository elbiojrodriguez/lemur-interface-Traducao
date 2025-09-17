// 📦 Importa o núcleo WebRTC e o gerenciador de mídia
import WebRTCCore from '../core/webrtc-core.js';
import { getMediaStream } from './media-manager.js';

window.onload = async () => {
  // 🧠 Inicializa variáveis principais
  const chatInputBox = document.querySelector('.chat-input-box');
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  let localStream = null;

  // 🆔 Exibe o ID do caller na interface
  document.getElementById('myId').textContent = myId;

  // 🎥 Solicita acesso à câmera e microfone via gerenciador
  try {
    localStream = await getMediaStream();
    document.getElementById("localVideo").srcObject = localStream;
  } catch (error) {
    console.error("Erro ao obter stream compartilhado:", error);
  }

  // 🔌 Inicializa conexão WebRTC
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  // 🔍 Extrai parâmetros do QR Code (receiver)
  const urlParams = new URLSearchParams(window.location.search);
  const receiverId = urlParams.get('targetId') || '';
  const receiverToken = urlParams.get('token') || '';
  const receiverLang = urlParams.get('lang') || 'pt-BR';

  // 💾 Armazena informações do receiver para uso futuro
  window.receiverInfo = {
    id: receiverId,
    token: receiverToken,
    lang: receiverLang
  };

  // 📞 Botão de chamada — envia idioma do caller para o receiver
  if (receiverId) {
    document.getElementById('callActionBtn').style.display = 'block';

    document.getElementById('callActionBtn').onclick = () => {
      if (localStream) {
        const callerLang = navigator.language || 'pt-BR';
        rtcCore.startCall(receiverId, localStream, callerLang);
      }
    };
  }

  // 📺 Exibe vídeo remoto recebido
  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    const remoteVideo = document.getElementById('remoteVideo');
    remoteVideo.srcObject = stream;
  });

  // 🌐 Tradução automática da interface
  const TRANSLATE_ENDPOINT = 'https://chat-tradutor.onrender.com/translate';
  const navegadorLang = navigator.language || 'pt-BR';

  const frasesParaTraduzir = {
    "translator-label": "Live translation. No filters. No platform."
  };

  async function translateText(text, targetLang) {
    try {
      const response = await fetch(TRANSLATE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang })
      });

      const result = await response.json();
      return result.translatedText || text;
    } catch (error) {
      console.error('Erro na tradução:', error);
      return text;
    }
  }

  (async () => {
    for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
      const el = document.getElementById(id);
      if (el) {
        const traduzido = await translateText(texto, navegadorLang);
        el.textContent = traduzido;
      }
    }
  })();

  // 🏳️ Aplica bandeiras
  async function aplicarBandeiraLocal(langCode) {
    try {
      const response = await fetch('assets/bandeiras/language-flags.json');
      const flags = await response.json();
      const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

      const localLangElement = document.querySelector('.local-mic-Lang');
      if (localLangElement) localLangElement.textContent = bandeira;

      const localLangDisplay = document.querySelector('.local-Lang');
      if (localLangDisplay) localLangDisplay.textContent = bandeira;
    } catch (error) {
      console.error('Erro ao carregar bandeira local:', error);
    }
  }

  async function aplicarBandeiraRemota(langCode) {
    try {
      const response = await fetch('assets/bandeiras/language-flags.json');
      const flags = await response.json();
      const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

      const remoteLangElement = document.querySelector('.remoter-Lang');
      if (remoteLangElement) remoteLangElement.textContent = bandeira;
    } catch (error) {
      console.error('Erro ao carregar bandeira remota:', error);
      const remoteLangElement = document.querySelector('.remoter-Lang');
      if (remoteLangElement) remoteLangElement.textContent = '🔴';
    }
  }

  aplicarBandeiraLocal(navegadorLang);
  aplicarBandeiraRemota(receiverLang);
};
