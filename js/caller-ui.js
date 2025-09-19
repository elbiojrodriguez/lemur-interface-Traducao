// 📦 Importa o núcleo WebRTC
import WebRTCCore from '../core/webrtc-core.js';

window.onload = async () => {
  // 🎥 Solicita acesso APENAS à câmera (SEM áudio)
  try {
    await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  } catch (error) {
    console.error("Erro ao solicitar acesso à câmera:", error);
  }

  // 🧠 Inicializa variáveis principais
  const chatInputBox = document.querySelector('.chat-input-box');
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  let localStream = null;

  // 🆔 Exibe o ID do caller na interface
  document.getElementById('myId').textContent = myId;

  // 🔌 Inicializa conexão WebRTC
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  // 🎥 Captura vídeo local (SEM áudio)
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // 🔍 Extrai parâmetros do QR Code (receiver)
  const urlParams = new URLSearchParams(window.location.search);
  const receiverId = urlParams.get('targetId') || '';
  const receiverToken = urlParams.get('token') || '';
  const receiverLang = urlParams.get('lang') || 'pt-BR';

  // 💾 Armazena informações do receiver para uso futuro (ex: Firebase)
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
        rtcCore.startCall(receiverId, localStream, callerLang); // ✅ envia idioma do caller
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

  // 📝 Aplica traduções na interface
  (async () => {
    for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
      const el = document.getElementById(id);
      if (el) {
        const traduzido = await translateText(texto, navegadorLang);
        el.textContent = traduzido;
      }
    }
  })();

  // 🏳️ Aplica bandeira do idioma local (caller)
  async function aplicarBandeiraLocal(langCode) {
    try {
      const response = await fetch('assets/bandeiras/language-flags.json');
      const flags = await response.json();
      const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

      const localLangElement = document.querySelector('.local-mic-Lang');
      if (localLangElement) {
        localLangElement.textContent = bandeira;
      }

      const localLangDisplay = document.querySelector('.local-Lang');
      if (localLangDisplay) {
        localLangDisplay.textContent = bandeira;
      }
    } catch (error) {
      console.error('Erro ao carregar bandeira local:', error);
    }
  }

  // 🏳️ Aplica bandeira do idioma do receiver (remoto)
  async function aplicarBandeiraRemota(langCode) {
    try {
      const response = await fetch('assets/bandeiras/language-flags.json');
      const flags = await response.json();
      const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

      const remoteLangElement = document.querySelector('.remoter-Lang');
      if (remoteLangElement) {
        remoteLangElement.textContent = bandeira;
      }
    } catch (error) {
      console.error('Erro ao carregar bandeira remota:', error);
      const remoteLangElement = document.querySelector('.remoter-Lang');
      if (remoteLangElement) {
        remoteLangElement.textContent = '🔴';
      }
    }
  }

  // 🚩 Aplica bandeiras iniciais
  aplicarBandeiraLocal(navegadorLang);
  aplicarBandeiraRemota(receiverLang);
};
