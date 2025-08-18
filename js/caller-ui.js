import WebRTCCore from '../core/webrtc-core.js';

// =============================================
// 1. TRADUÇÃO AUTOMÁTICA (IGUAL AO RECEIVER)
// =============================================
const TRANSLATE_ENDPOINT = 'https://chat-tradutor.onrender.com/translate';

const textsToTranslate = {
  "welcome-title": "Welcome!",
  "translator-label": "Real-Time Translator",
  "name-input": "Type your name",
  "next-button": "Next"
};

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

async function translatePage() {
  const browserLang = (navigator.language || 'en').split('-')[0];
  for (const [elementId, text] of Object.entries(textsToTranslate)) {
    try {
      const translated = await translateText(text, browserLang);
      const element = document.getElementById(elementId);
      if (element) {
        elementId === 'name-input' 
          ? (element.placeholder = translated) 
          : (element.textContent = translated);
      }
    } catch (error) {
      console.error(`Erro ao traduzir ${elementId}:`, error);
    }
  }
}

// =============================================
// 2. LÓGICA ORIGINAL DO CALLER (SEM ALTERAÇÕES)
// =============================================
const loadLanguageFlags = async () => {
  try {
    const response = await fetch('../assets/bandeiras/flags.json');
    if (!response.ok) throw new Error("Falha ao carregar bandeiras");
    return await response.json();
  } catch (error) {
    console.error("Usando fallback de bandeiras:", error);
    return {
      'pt-BR': '🇧🇷', 'pt-PT': '🇵🇹', 'en': '🇺🇸', 'en-US': '🇺🇸',
      'es': '🇪🇸', 'fr': '🇫🇷', 'de': '🇩🇪'
    };
  }
};

// =============================================
// 3. FUNÇÃO PRINCIPAL (COM NOVOS AJUSTES)
// =============================================
window.onload = async () => {
  // A. TRADUZ A TELA INICIAL (NOVO)
  await translatePage();

  // B. LÓGICA DAS BANDEIRAS (ORIGINAL)
  const LANGUAGE_FLAGS = await loadLanguageFlags();
  const urlParams = new URLSearchParams(window.location.search);
  const userName = urlParams.get('name') || 'Visitante';
  const userLang = urlParams.get('lang') || 'en';

  const getFlagForLanguage = (langCode) => {
    if (LANGUAGE_FLAGS[langCode]) return LANGUAGE_FLAGS[langCode];
    const baseLang = langCode.split('-')[0];
    return LANGUAGE_FLAGS[baseLang] || '🌐';
  };

  // C. EXIBE INFORMAÇÕES DO USUÁRIO (ORIGINAL)
  const userInfoDisplay = document.getElementById('userInfoDisplay');
  if (userInfoDisplay) {
    userInfoDisplay.textContent = `${userName} ${getFlagForLanguage(userLang)}`;
    userInfoDisplay.style.display = 'flex';
  }

  // D. CONTROLE DA TELA INICIAL (NOVO)
  document.getElementById('next-button').addEventListener('click', () => {
    const name = document.getElementById('name-input').value.trim();
    if (!name) return;

    document.getElementById('initial-screen').style.display = 'none';
    document.querySelector('.container').style.display = 'block';
  });

  // E. LÓGICA WEBRTC (ORIGINAL - SEM MUDANÇAS)
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  document.getElementById('myId').textContent = myId;
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  let targetId = urlParams.get('targetId');
  let localStream = null;

  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      remoteVideo.srcObject = stream;
    })
    .catch(console.error);

  if (targetId) {
    document.getElementById('callActionBtn').style.display = 'block';
  }

  document.getElementById('callActionBtn').onclick = () => {
    if (!targetId || !localStream) return;
    rtcCore.startCall(targetId, localStream);
  };

  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    localVideo.srcObject = stream;
  });
};
