// js/receiver-ui.js CORRIGIDO
import { WebRTCCore } from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = async () => {
  try {
    // ✅ PRIMEIRO: Solicita CÂMERA (WebRTC)
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: false 
    });
    
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

    let localStream = stream;

    const params = new URLSearchParams(window.location.search);
    const token = params.get('token') || '';
    const lang = params.get('lang') || navigator.language || 'pt-BR';

    window.targetTranslationLang = lang;

    const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}&token=${encodeURIComponent(token)}&lang=${encodeURIComponent(lang)}`;
    QRCodeGenerator.generate("qrcode", callerUrl);

    window.rtcCore.initialize(myId);
    window.rtcCore.setupSocketHandlers();

    const localVideo = document.getElementById('localVideo');

    window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
      if (!localStream) return;

      console.log('🎯 Caller fala:', idiomaDoCaller);
      console.log('🎯 Eu (receiver) entendo:', lang);

      window.sourceTranslationLang = idiomaDoCaller;
      window.targetTranslationLang = lang;

      console.log('🎯 Vou traduzir:', idiomaDoCaller, '→', lang);

      window.rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
        remoteStream.getAudioTracks().forEach(track => track.enabled = false);

        const overlay = document.querySelector('.info-overlay');
        if (overlay) overlay.classList.add('hidden');

        localVideo.srcObject = remoteStream;

        window.targetTranslationLang = idiomaDoCaller || lang;
        console.log('🎯 Idioma definido para tradução:', window.targetTranslationLang);

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
          const traduzido = await translateText(texto, lang);
          el.textContent = traduzido;
        }
      }
    })();

    async function aplicarBandeira(langCode) {
      try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();

        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';

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

    // ✅✅✅ CORREÇÃO CRÍTICA: Data channel callback NÃO-BLOQUEANTE
    window.rtcCore.setDataChannelCallback((mensagem) => {
      console.log('Mensagem recebida no receiver:', mensagem);
      
      const elemento = document.getElementById('texto-recebido');
      if (elemento) {
        elemento.textContent = mensagem;
        
        // ✅ CORREÇÃO: Fala apenas se NÃO estiver gravando/selecionando idioma
        if (window.SpeechSynthesis && !window.isRecording && !window.isSelectingLanguage) {
          setTimeout(() => {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(mensagem);
            utterance.lang = window.targetTranslationLang || 'en-US';
            utterance.rate = 0.9;
            utterance.volume = 0.8;
            window.speechSynthesis.speak(utterance);
          }, 100);
        }
      }
    });

    // ✅ DEPOIS: Inicializar tradutor com prioridade
    setTimeout(() => {
      if (typeof initializeTranslator === 'function') {
        // ✅ CORREÇÃO: Define variáveis globais para controle
        window.isRecording = false;
        window.isSelectingLanguage = false;
        
        initializeTranslator();
      }
    }, 1000);
    
  } catch (error) {
    console.error("Erro ao solicitar acesso à câmera:", error);
    alert("Erro ao acessar a câmera. Verifique as permissões.");
    return;
  }
};
