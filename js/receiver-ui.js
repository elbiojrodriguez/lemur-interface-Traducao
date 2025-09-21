import { WebRTCCore } from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

// Variável global para controle do idioma de tradução
window.targetTranslationLang = null;
window.sourceTranslationLang = null;

window.onload = async () => {
  try {
    // ✅ Solicita acesso à câmera
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: false 
    });
    
    // ✅ Inicializa WebRTC
    window.rtcCore = new WebRTCCore();

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

    // ✅ Configura stream da câmera
    let localStream = stream;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || '';
    const lang = params.get('lang') || navigator.language || 'pt-BR';

    // ✅ Define idioma padrão (apenas se não foi definido anteriormente)
    if (!window.targetTranslationLang) {
      window.targetTranslationLang = lang;
    }
    
    // ✅ Mantém o idioma de origem como o do caller que será recebido
    window.sourceTranslationLang = null;

    const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}&token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}`;
    QRCodeGenerator.generate("qrcode", callerUrl);

    window.rtcCore.initialize(myId);
    window.rtcCore.setupSocketHandlers();

    const localVideo = document.getElementById('localVideo');

    window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
      if (!localStream) return;

      console.log('🎯 Caller fala:', idiomaDoCaller);
      console.log('🎯 Eu (receiver) entendo:', window.targetTranslationLang);

      // ✅ CORREÇÃO: Define o idioma de ORIGEM (caller) e mantém o de DESTINO (receiver)
      window.sourceTranslationLang = idiomaDoCaller;
      // NÃO altera window.targetTranslationLang para preservar a escolha do usuário

      console.log('🎯 Vou traduzir:', idiomaDoCaller, '→', window.targetTranslationLang);

      window.rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
        remoteStream.getAudioTracks().forEach(track => track.enabled = false);

        const overlay = document.querySelector('.info-overlay');
        if (overlay) overlay.classList.add('hidden');

        localVideo.srcObject = remoteStream;

        // ✅ Exibe informação clara sobre a tradução
        console.log('🎯 Idioma de origem (caller):', window.sourceTranslationLang);
        console.log('🎯 Idioma de destino (receiver):', window.targetTranslationLang);
        
        // ✅ Aplica bandeira do idioma recebido (caller)
        if (idiomaDoCaller) {
          aplicarBandeiraRemota(idiomaDoCaller);
        } else {
          document.querySelector('.remoter-Lang').textContent = '🔴';
        }
      });
    };

    const TRANSLATE_ENDPOINT = 'https://chat-tradutor.onrender.com/translate';

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

    const frasesParaTraduzir = {
      "translator-label": "Live translation. No filters. No platform.",
      "qr-modal-title": "This is your online key",
      "qr-modal-description": "You can ask to scan, share or print on your business card."
    };

    (async () => {
      for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
        const el = document.getElementById(id);
        if (el) {
          const traduzido = await translateText(texto, window.targetTranslationLang);
          el.textContent = traduzido;
        }
      }
    })();

    async function aplicarBandeira(langCode) {
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

    aplicarBandeira(lang);

    // ✅ Configura callback para receber mensagens
    window.rtcCore.setDataChannelCallback((mensagem) => {
      console.log('Mensagem recebida no receiver:', mensagem);
      const elemento = document.getElementById('texto-recebido');
      if (elemento) {
        elemento.textContent = mensagem;
      }
    });

    // ✅ Inicializar tradutor
    setTimeout(() => {
      if (typeof initializeTranslator === 'function') {
        initializeTranslator();
      }
    }, 1000);
    
  } catch (error) {
    console.error("Erro ao solicitar acesso à câmera:", error);
    alert("Erro ao acessar a câmera. Verifique as permissões.");
    return;
  }
};

// ✅ Função para alterar o idioma de destino (a ser chamada pelo botão da UI)
window.setTranslationLanguage = function(langCode) {
  window.targetTranslationLang = langCode;
  console.log('Idioma de tradução alterado para:', langCode);
  
  // Atualiza a bandeira local
  aplicarBandeira(langCode);
};
