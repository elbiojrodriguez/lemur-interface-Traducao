import WebRTCCore from '../core/webrtc-core.js';

// Função para carregar as bandeiras do arquivo JSON
const loadLanguageFlags = async () => {
  try {
    const response = await fetch('../assets/bandeiras/flags.json');
    if (!response.ok) throw new Error("Falha ao carregar bandeiras");
    return await response.json();
  } catch (error) {
    console.error("Usando fallback de bandeiras:", error);
    // Fallback básico caso o arquivo não carregue
    return {
      'pt-BR': '🇧🇷',
      'pt-PT': '🇵🇹',
      'en': '🇺🇸',
      'en-US': '🇺🇸',
      'es': '🇪🇸',
      'fr': '🇫🇷',
      'de': '🇩🇪'
    };
  }
};

// Função principal assíncrona
window.onload = async () => {
  // Carrega as bandeiras primeiro
  const LANGUAGE_FLAGS = await loadLanguageFlags();

  // Extrai parâmetros da URL
  const urlParams = new URLSearchParams(window.location.search);
  const userName = urlParams.get('name') || 'Visitante';
  const userLang = urlParams.get('lang') || 'en';
  
  // Lógica inteligente para bandeiras
  const getFlagForLanguage = (langCode) => {
    // 1. Tenta o código completo (ex: pt-BR)
    if (LANGUAGE_FLAGS[langCode]) {
      return LANGUAGE_FLAGS[langCode];
    }
    
    // 2. Tenta o código base (ex: pt)
    const baseLang = langCode.split('-')[0];
    if (LANGUAGE_FLAGS[baseLang]) {
      return LANGUAGE_FLAGS[baseLang];
    }
    
    // 3. Fallback para globo
    return '🌐';
  };

  const userFlag = getFlagForLanguage(userLang);

  // Exibe as informações do usuário
  const userInfoDisplay = document.getElementById('userInfoDisplay');
  if (userInfoDisplay) {
    userInfoDisplay.textContent = `${userName} ${userFlag}`;
    userInfoDisplay.style.display = 'flex';
  }

  // -----------------------------------------------------------------
  // TUDO ABAIXO DESTE PONTO PERMANECE EXATAMENTE IGUAL AO ORIGINAL
  // -----------------------------------------------------------------
  
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  document.getElementById('myId').textContent = myId;
  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');
  const remoteVideo = document.getElementById('remoteVideo');
  let targetId = null;
  let localStream = null;

  // Solicita acesso à câmera
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
      remoteVideo.srcObject = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // Verifica se há ID na URL
  const targetIdFromUrl = urlParams.get('targetId');
  
  if (targetIdFromUrl) {
    targetId = targetIdFromUrl;
    document.getElementById('callActionBtn').style.display = 'block';
  }

  // Configura o botão de chamada
  document.getElementById('callActionBtn').onclick = () => {
    if (!targetId || !localStream) return;
    rtcCore.startCall(targetId, localStream);
  };

  // Silencia qualquer áudio recebido
  rtcCore.setRemoteStreamCallback(stream => {
    stream.getAudioTracks().forEach(track => track.enabled = false);
    localVideo.srcObject = stream;
  });
};
