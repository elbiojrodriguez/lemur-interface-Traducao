```javascript
// 📦 Importa o núcleo WebRTC
import WebRTCCore from '../core/webrtc-core.js';

// 🎯 FUNÇÃO PARA OBTER IDIOMA COMPLETO
async function obterIdiomaCompleto(lang) {
  if (!lang) return 'pt-BR';
  if (lang.includes('-')) return lang; // Já está completo (ex: "pt-BR")
  
  try {
    // 📦 CARREGA O JSON DE BANDEIRAS
    const response = await fetch('assets/bandeiras/language-flags.json');
    const flags = await response.json();
    
    // 🔍 PROCURA O CÓDIGO COMPLETO NO JSON
    const codigoCompleto = Object.keys(flags).find(key => 
      key.startsWith(lang + '-')
    );
    
    // ✅ RETORNA O CÓDIGO COMPLETO ENCONTRADO
    return codigoCompleto || `${lang}-${lang.toUpperCase()}`;
    
  } catch (error) {
    console.error('Erro ao carregar JSON de bandeiras:', error);
    
    // 🆘 FALLBACK PARA CASOS DE ERRO
    const fallback = {
      'pt': 'pt-BR', 'es': 'es-ES', 'en': 'en-US',
      'fr': 'fr-FR', 'de': 'de-DE', 'it': 'it-IT',
      'ja': 'ja-JP', 'zh': 'zh-CN', 'ru': 'ru-RU'
    };
    
    return fallback[lang] || 'en-US';
  }
}

window.onload = async () => {
  // 🎥 Solicita acesso APENAS à câmera (SEM áudio) - PRIMEIRO!
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ 
      video: true, 
      audio: false 
    });
    
    // ✅ AGORA SIM: Inicializa WebRTC COM A STREAM
    window.rtcCore = new WebRTCCore(); // 👈 Torna global
    let localStream = stream; // 👈 Já temos a stream

    // 🆔 Exibe o ID do caller na interface
    const myId = crypto.randomUUID().substr(0, 8);
    document.getElementById('myId').textContent = myId;

    // 🔌 Inicializa conexão WebRTC
    window.rtcCore.initialize(myId);
    window.rtcCore.setupSocketHandlers();

    // ✅ Configura callback para receber mensagens
    window.rtcCore.setDataChannelCallback((mensagem) => {
      console.log('Mensagem recebida no caller:', mensagem);
      // Exibir na UI do caller
      const elemento = document.getElementById('texto-recebido');
      if (elemento) {
        elemento.textContent = mensagem;
      }
    });

    // 🔍 Extrai parâmetros do QR Code (receiver)
    const urlParams = new URLSearchParams(window.location.search);
    const receiverId = urlParams.get('targetId') || '';
    const receiverToken = urlParams.get('token') || '';
    const receiverLang = urlParams.get('lang') || 'pt-BR';

    // 💾 Armazena informações do receiver
    window.receiverInfo = {
      id: receiverId,
      token: receiverToken,
      lang: receiverLang
    };

    // 📞 Botão de chamada — envia idioma do caller para o receiver
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

    // 📺 Exibe vídeo remoto recebido
    window.rtcCore.setRemoteStreamCallback(stream => {
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

  } catch (error) {
    console.error("Erro ao solicitar acesso à câmera:", error);
    alert("Erro ao acessar a câmera. Verifique as permissões.");
    return; // ⛔ PARA TUDO se não tiver câmera
  }
};
```
