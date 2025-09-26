// 📦 Importa o núcleo WebRTC
import { WebRTCCore } from '../core/webrtc-core.js';

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

// ===== FUNÇÃO SIMPLES PARA ENVIAR TEXTO =====
function enviarParaOutroCelular(texto) {
  if (window.rtcDataChannel && window.rtcDataChannel.isOpen()) {
    window.rtcDataChannel.send(texto);
    console.log('✅ Texto enviado:', texto);
  } else {
    console.log('⏳ Canal não disponível ainda. Tentando novamente...');
    setTimeout(() => enviarParaOutroCelular(texto), 1000);
  }
}

// 🌐 Tradução apenas para texto
async function translateText(text, targetLang) {
  try {
    const response = await fetch('https://chat-tradutor.onrender.com/translate', {
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

window.onload = async () => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
   let localStream = stream;
   document.getElementById('localVideo').srcObject = localStream;

    window.rtcCore = new WebRTCCore();

    // ✅ CORRETO: Mostra APENAS o que recebe do outro celular
    window.rtcCore.setDataChannelCallback((mensagem) => {
      console.log('📩 Mensagem recebida:', mensagem);

      const elemento = document.getElementById('texto-recebido');
      if (elemento) {
        elemento.textContent = "";
        elemento.style.opacity = 0;
        elemento.style.transition = "opacity 1s ease-in-out";
      }

      if (window.SpeechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(mensagem);
        utterance.lang = window.targetTranslationLang || 'pt-BR';
        utterance.rate = 0.9;
        utterance.volume = 0.8;

        utterance.onstart = () => {
          if (elemento) {
            elemento.textContent = mensagem; // ✅ MOSTRA APENAS O QUE RECEBE
            setTimeout(() => {
              elemento.style.opacity = 1;
            }, 100);
          }
        };

        window.speechSynthesis.speak(utterance);
      }
    });

    const myId = crypto.randomUUID().substr(0, 8);
    document.getElementById('myId').textContent = myId;

    window.rtcCore.initialize(myId);
    window.rtcCore.setupSocketHandlers();

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
          alert(`📞 Enviando meu idioma: ${meuIdioma}`);
          window.rtcCore.startCall(receiverId, localStream, meuIdioma);
        }
      };
    }

    window.rtcCore.setRemoteStreamCallback(stream => {
      stream.getAudioTracks().forEach(track => track.enabled = false);
      const remoteVideo = document.getElementById('remoteVideo');
      remoteVideo.srcObject = stream;
    });

    const navegadorLang = await obterIdiomaCompleto(navigator.language);

    // ✅ MANTIDO: Tradução dos títulos da interface
    const frasesParaTraduzir = {
      "translator-label": "Real-time Translation."
    };

    (async () => {
      for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
        const el = document.getElementById(id);
        if (el) {
          const traduzido = await translateText(texto, navegadorLang);
          el.textContent = traduzido;
        }
      }
    })();

    // 🏳️ Aplica bandeira do idioma local
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

    // 🏳️ Aplica bandeira do idioma remoto
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

  } catch (error) {
    console.error("Erro ao solicitar acesso à câmera:", error);
    alert("Erro ao acessar a câmera. Verifique as permissões.");
    return;
  }
};
