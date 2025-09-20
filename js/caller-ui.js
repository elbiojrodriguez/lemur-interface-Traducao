import WebRTCCore from '../core/webrtc-core.js';

async function obterIdiomaCompleto(lang) {
  if (!lang) return 'pt-BR';
  if (lang.includes('-')) return lang;
  
  try {
    const response = await fetch('assets/bandeiras/language-flags.json');
    const flags = await response.json();
    const codigoCompleto = Object.keys(flags).find(key => 
      key.startsWith(lang + '-')
    );
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
  try {
    await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
  } catch (error) {
    console.error("Erro ao solicitar acesso à câmera:", error);
  }

  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  let localStream = null;
  let dataChannel = null;
  let recognition = null;

  document.getElementById('myId').textContent = myId;

  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  const urlParams = new URLSearchParams(window.location.search);
  const receiverId = urlParams.get('targetId') || '';
  const receiverToken = urlParams.get('token') || '';
  const receiverLang = urlParams.get('lang') || 'pt-BR';

  window.receiverInfo = {
    id: receiverId,
    token: receiverToken,
    lang: receiverLang
  };

  if (receiverId) {
    document.getElementById('callActionBtn').style.display = 'block';

    document.getElementById('callActionBtn').onclick = async () => {
      if (localStream) {
        const meuIdioma = await obterIdiomaCompleto(navigator.language);
        console.log('🚀 Idioma do Caller sendo enviado:', meuIdioma);
        
        dataChannel = rtcCore.startCall(receiverId, localStream, meuIdioma);
        
        rtcCore.setDataChannelCallback((message) => {
          displayReceivedText(message);
        });

        startSpeechRecognition(meuIdioma, receiverLang);
      }
    };
  }

  function startSpeechRecognition(myLang, targetLang) {
    if (!('webkitSpeechRecognition' in window)) {
      console.error('Reconhecimento de fala não suportado');
      return;
    }

    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = myLang;

    recognition.onresult = async (event) => {
      let finalText = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalText += event.results[i][0].transcript;
        }
      }

      if (finalText) {
        const translated = await translateText(finalText, targetLang);
        if (rtcCore.dataChannel && rtcCore.dataChannel.readyState === 'open') {
          rtcCore.sendText(translated);
        } else {
          console.error('DataChannel não está aberto');
        }
      }
    };

    recognition.start();
  }

  async function translateText(text, targetLang) {
    const TRANSLATE_ENDPOINT = 'https://chat-tradutor.onrender.com/translate';
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

  function displayReceivedText(text) {
    const chatDisplay = document.getElementById('chat-display');
    if (chatDisplay) {
      const messageElement = document.createElement('div');
      messageElement.className = 'remote-message';
      messageElement.textContent = text;
      chatDisplay.appendChild(messageElement);
    }
  }

  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    const remoteVideo = document.getElementById('remoteVideo');
    remoteVideo.srcObject = stream;
  });

  const navegadorLang = await obterIdiomaCompleto(navigator.language);

  const frasesParaTraduzir = {
    "translator-label": "Live translation. No filters. No platform."
  };

  async function translateInterfaceText(text, targetLang) {
    const TRANSLATE_ENDPOINT = 'https://chat-tradutor.onrender.com/translate';
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
        const traduzido = await translateInterfaceText(texto, navegadorLang);
        el.textContent = traduzido;
      }
    }
  })();

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
