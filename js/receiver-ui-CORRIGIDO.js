// js/receiver-ui-CORRIGIDO.js
import { WebRTCCore } from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = async () => {
  try {
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
      window.sourceTranslationLang = idiomaDoCaller;
      window.targetTranslationLang = lang;

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

    // ✅✅✅ CORREÇÃO CRÍTICA: REMOVIDA A TRADUÇÃO AUTOMÁTICA QUE CONFLITA
    // Apenas define o texto original sem traduzir automaticamente
    setTimeout(() => {
      const label = document.getElementById('translator-label');
      const title = document.getElementById('qr-modal-title');
      const description = document.getElementById('qr-modal-description');
      
      if (label) label.textContent = "Live translation. No filters. No platform.";
      if (title) title.textContent = "This is your online key";
      if (description) description.textContent = "You can ask to scan, share or print on your business card.";
    }, 3000); // ✅ Executa DEPOIS de tudo estar carregado

    async function aplicarBandeira(langCode) {
      try {
        const response = await fetch('assets/bandeiras/language-flags.json');
        const flags = await response.json();
        const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';
        
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
      }
    }

    aplicarBandeira(lang);

    // ✅ Data channel callback simplificado
    window.rtcCore.setDataChannelCallback((mensagem) => {
      console.log('Mensagem recebida no receiver:', mensagem);
      const elemento = document.getElementById('texto-recebido');
      if (elemento) elemento.textContent = mensagem;
    });

    // ✅ Inicializa o tradutor com prioridade máxima
    setTimeout(() => {
      if (typeof initializeTranslator === 'function') {
        initializeTranslator();
      }
    }, 1000);
    
  } catch (error) {
    console.error("Erro ao solicitar acesso à câmera:", error);
    return;
  }
};
