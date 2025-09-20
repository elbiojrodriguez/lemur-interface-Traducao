// 📦 Importa o núcleo WebRTC
import WebRTCCore from '../core/webrtc-core.js';

// 🎯 FUNÇÃO PARA OBTER IDIOMA COMPLETO
async function obterIdiomaCompleto(lang) {
  if (!lang) return 'pt-BR';
  if (lang.includes('-')) return lang;

  try {
    const response = await fetch('assets/bandeiras/language-flags.json');
    const flags = await response.json();
    const codigoCompleto = Object.keys(flags).find(key => key.startsWith(lang + '-'));
    return codigoCompleto || `${lang}-${lang.toUpperCase()}`;
  } catch (error) {
    console.error('Erro ao carregar JSON de bandeiras:', error);
    const fallback = {
      'pt': 'pt-BR', 'es': 'es-ES', 'en': 'en-US',
      'fr': 'fr-FR', 'de': 'de-DE', 'it': 'it-IT',
      'ja': 'ja-JP', 'zh': 'zh-CN', 'ru': 'ru-RU'
    };
    return fallback[lang] || 'en-US';
  }
}

window.onload = async () => {
  // 🎥 Inicializa permissões de mídia com áudio e vídeo
  try {
    await window.mediaPermissions.initialize();
  } catch (error) {
    console.error("Erro ao inicializar permissões de mídia:", error);
    return;
  }

  // 🧠 Inicializa variáveis principais
  const chatInputBox = document.querySelector('.chat-input-box');
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  const localStream = window.mediaPermissions.getFullStream();

  document.getElementById('myId').textContent = myId;

  // 🔌 Inicializa conexão WebRTC
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  // 🔍 Extrai parâmetros do QR Code
  const urlParams = new URLSearchParams(window.location.search);
  const receiverId = urlParams.get('targetId') || '';
  const receiverToken = urlParams.get('token') || '';
  const receiverLang = urlParams.get('lang') || 'pt-BR';

  window.receiverInfo = {
    id: receiverId,
    token: receiverToken,
    lang: receiverLang
  };

  // 📞 Botão de chamada — envia idioma do caller para o receiver
  if (receiverId) {
    document.getElementById('callActionBtn').style.display = 'block';

    document.getElementById('callActionBtn').onclick = async () => {
      const meuIdioma = await obterIdiomaCompleto(navigator.language);
      console.log('🚀 Idioma do Caller sendo enviado:', meuIdioma);
      alert(`📞 Enviando meu idioma: ${meuIdioma}`);
      rtcCore.startCall(receiverId, localStream, meuIdioma);
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
  const navegadorLang = await obterIdiomaCompleto(navigator.language);

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

  // 🏳️ Bandeiras
  async function aplicarBandeiraLocal(langCode) {
    try {
      const response = await fetch('assets/bandeiras/language-flags.json');
      const flags = await response.json();
      const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

      document.querySelector('.local-mic-Lang')?.textContent = bandeira;
      document.querySelector('.local-Lang')?.textContent = bandeira;
    } catch (error) {
      console.error('Erro ao carregar bandeira local:', error);
    }
  }

  async function aplicarBandeiraRemota(langCode) {
    try {
      const response = await fetch('assets/bandeiras/language-flags.json');
      const flags = await response.json();
      const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';
      document.querySelector('.remoter-Lang')?.textContent = bandeira;
    } catch (error) {
      console.error('Erro ao carregar bandeira remota:', error);
      document.querySelector('.remoter-Lang')?.textContent = '🔴';
    }
  }

  aplicarBandeiraLocal(navegadorLang);
  aplicarBandeiraRemota(receiverLang);
};
