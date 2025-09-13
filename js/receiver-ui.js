import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();

  // 🔒 Captura o ID vindo da URL (ex: receiver.html?yz456)
  const url = window.location.href;
  const fixedId = url.split('?')[1] || crypto.randomUUID().substr(0, 8);

  // 🔁 Simula crypto.randomUUID() com valor fixo
  function fakeRandomUUID(fixedValue) {
    return {
      substr: function(start, length) {
        return fixedValue.substr(start, length);
      }
    };
  }

  const myId = fakeRandomUUID(fixedId).substr(0, 8); // ← ID vindo do Flutter

  let localStream = null;

   // Solicita acesso à câmera logo na abertura
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      remoteVideo.srcObject = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });
  
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // 🔗 Captura os parâmetros reais da URL
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';
  const lang = params.get('lang') || 'en';

  // 📦 Monta a URL final que será usada no QR Code
  const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}&token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}`;

  // 🧾 Gera o QR Code com essa URL
  QRCodeGenerator.generate("qrcode", callerUrl);

  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');

  rtcCore.onIncomingCall = (offer) => {
    if (!localStream) {
      console.warn("Stream local não disponível");
      return;
    }

    rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
      remoteStream.getAudioTracks().forEach(track => track.enabled = false);

      const overlay = document.querySelector('.info-overlay');
      if (overlay) overlay.classList.add('hidden');

      localVideo.srcObject = remoteStream;
    });
  };

  // 🌍 Endpoint de tradução
  const TRANSLATE_ENDPOINT = 'https://chat-tradutor.onrender.com/translate';

  // 🔁 Função de tradução
  async function translateText(text, targetLang) {
    try {
      if (targetLang === 'en') return text;

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

  // 🧾 Frases e elementos a traduzir
  const frasesParaTraduzir = {
    "translator-label": "Live translation. No filters. No platform.",
    "qr-modal-title": "This is your online key",
    "qr-modal-description": "You can ask to scan, share or print on your business card."
  };

  // 🚀 Traduz e aplica na interface
  (async () => {
    for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
      const el = document.getElementById(id);
      if (el) {
        const traduzido = await translateText(texto, lang);
        el.textContent = traduzido;
      }
    }
  })();

  // 🏳️ Função para carregar bandeira com fallback inteligente
async function aplicarBandeira(langCode) {
  try {
    const response = await fetch('assets/bandeiras/language-flags.json');
    const flags = await response.json();

    // Tenta código completo, depois só o prefixo (ex: "es-MX" → "es")
    const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🏳️';

    // Aplica em .local-mic-Lang
    const localLangElement = document.querySelector('.local-mic-Lang');
    if (localLangElement) {
      localLangElement.textContent = bandeira;
    }

    // Aplica em .remoter-Lang
    const remoteLangElement = document.querySelector('.remoter-Lang');
    if (remoteLangElement) {
      remoteLangElement.textContent = bandeira;
    }

  } catch (error) {
    console.error('Erro ao carregar bandeira:', error);
  }
}


  // 🧭 Aplica a bandeira com base no idioma da URL
  aplicarBandeira(lang);
};
