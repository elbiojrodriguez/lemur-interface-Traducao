import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = async () => {
  try {
    await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
  } catch (error) {
    console.error("Erro ao solicitar acesso à câmera e microfone:", error);
  }

  const rtcCore = new WebRTCCore();

  const url = window.location.href;
  const fixedId = url.split('?')[1] || crypto.randomUUID().substr(0, 8);

  function fakeRandomUUID(fixedValue) {
    return {
      substr: function(start, length) {
        return fixedValue.substr(start, length);
      }
    };
  }

  const myId = fakeRandomUUID(fixedId).substr(0, 8);

  let localStream = null;
  let callerLang = 'en'; // valor padrão

  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  const params = new URLSearchParams(window.location.search);
  const token = params.get('token') || '';
  const lang = params.get('lang') || 'pt-BR'; // idioma do receiver

  const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}&token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}`;
  QRCodeGenerator.generate("qrcode", callerUrl);

  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');

  rtcCore.onIncomingCall = (offer, receivedCallerLang) => {
    if (!localStream) {
      console.warn("Stream local não disponível");
      return;
    }

    callerLang = receivedCallerLang || 'en';

    rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
      remoteStream.getAudioTracks().forEach(track => track.enabled = false);

      const overlay = document.querySelector('.info-overlay');
      if (overlay) overlay.classList.add('hidden');

      localVideo.srcObject = remoteStream;

      // ✅ Define idioma de destino para tradução
      window.targetTranslationLang = callerLang;

      // ✅ Aplica bandeira do caller
      aplicarBandeiraRemota(callerLang);
    });
  };

  const TRANSLATE_ENDPOINT = 'https://chat-tradutor.onrender.com/translate';

  async function translateText(text, targetLang) {
    try {
      if (targetLang === lang) return text;

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

  const frasesParaTraduzir = {
    "translator-label": "Live translation. No filters. No platform.",
    "qr-modal-title": "This is your online key",
    "qr-modal-description": "You can ask to scan, share or print on your business card."
  };

  (async () => {
    for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
      const el = document.getElementById(id);
      if (el) {
        const traduzido = await translateText(texto, lang);
        el.textContent = traduzido;
      }
    }
  })();

  // ✅ Aplica bandeira do receiver (local)
  async function aplicarBandeira(langCode) {
    try {
      const response = await fetch('assets/bandeiras/language-flags.json');
      const flags = await response.json();

      const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🏳️';

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

  // ✅ Aplica bandeira do caller (remoto)
  async function aplicarBandeiraRemota(langCode) {
    try {
      const response = await fetch('assets/bandeiras/language-flags.json');
      const flags = await response.json();

      const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🏳️';

      const remoteLangElement = document.querySelector('.remoter-Lang');
      if (remoteLangElement) {
        remoteLangElement.textContent = bandeira;
      }

    } catch (error) {
      console.error('Erro ao carregar bandeira remota:', error);
    }
  }

  aplicarBandeira(lang);
};
