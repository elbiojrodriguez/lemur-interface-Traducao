import WebRTCCore from '../core/webrtc-core.js';
import { QRCodeGenerator } from './qr-code-utils.js';

window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  let localStream = null;

  // 🌐 Configuração de idiomas (nova adição)
  const languages = [
    {code:'en-US', flag:'🇺🇸', welcomeText:'I am', speakText:'I speak'},
    {code:'pt-BR', flag:'🇧🇷', welcomeText:'Eu sou', speakText:'Eu falo'},
    {code:'es-ES', flag:'🇪🇸', welcomeText:'Yo soy', speakText:'Yo hablo'},
    {code:'fr-FR', flag:'🇫🇷', welcomeText:'Je suis', speakText:'Je parle'},
    {code:'de-DE', flag:'🇩🇪', welcomeText:'Ich bin', speakText:'Ich spreche'},
    {code:'ja-JP', flag:'🇯🇵', welcomeText:'私は', speakText:'私は話します'},
    {code:'zh-CN', flag:'🇨🇳', welcomeText:'我是', speakText:'我说'},
    {code:'ru-RU', flag:'🇷🇺', welcomeText:'Я', speakText:'Я говорю'},
    {code:'ar-SA', flag:'🇸🇦', welcomeText:'أنا', speakText:'أنا أتكلم'}
  ];

  // 🔍 Detecta idioma do navegador (nova adição)
  const browserLang = navigator.language || 'pt-BR';
  const userLanguage = languages.find(l => l.code === browserLang) || 
                      languages.find(l => l.code.startsWith(browserLang.split('-')[0])) || 
                      languages[1];

  // 🔒 Original: Solicita acesso à câmera e microfone
  navigator.mediaDevices.getUserMedia({ video: true, audio: true })
    .then(stream => {
      localStream = stream;
      rtcCore.initialize(myId);
      rtcCore.setupSocketHandlers();

      const localVideo = document.getElementById('localVideo');

      // 🎯 Modificado: Quando receber uma chamada (exibe dados do caller)
      rtcCore.onIncomingCall = (offer) => {
        if (!localStream) {
          console.warn("Stream local não disponível");
          return;
        }

        rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
          remoteStream.getAudioTracks().forEach(track => track.enabled = false);

          const qrElement = document.getElementById('qrcode');
          if (qrElement) qrElement.style.display = 'none';

          localVideo.srcObject = remoteStream;

          // ✨ Nova adição: Exibe dados do caller
          if (offer.senderData) {
            const callerLang = languages.find(l => l.code === offer.senderData.lang) || userLanguage;
            document.getElementById('welcomeMessage').textContent = 
              `${userLanguage.welcomeText} ${offer.senderData.name} e ${userLanguage.speakText} ${callerLang.flag}`;
          }
        });
      };

      // 🧩 Original: Geração do QR Code + nova exibição local
      const nomeInput = document.getElementById("nome");
      const sobrenomeInput = document.getElementById("sobrenome");

      if (!nomeInput || !sobrenomeInput) return;

      sobrenomeInput.addEventListener("focus", () => {
        const nome = nomeInput.value.trim();
        const sobrenome = sobrenomeInput.value.trim();

        if (nome !== "") {
          const nomeCompleto = `${nome} ${sobrenome}`.trim();
          const url = `${window.location.origin}/caller.html?targetId=${myId}&lang=${encodeURIComponent(browserLang)}&nome=${encodeURIComponent(nomeCompleto)}`;
          QRCodeGenerator.generate("qrcode", url);

          // ✨ Nova adição: Exibe mensagem local
          document.getElementById('welcomeMessage').textContent = 
            `${userLanguage.welcomeText} ${nomeCompleto} e ${userLanguage.speakText} ${userLanguage.flag}`;
        } else {
          alert("Por favor, digite seu nome.");
        }
      });
    })
    .catch(error => {
      console.error("Permissão negada ou erro ao acessar câmera/microfone:", error);
      alert("É necessário permitir acesso à câmera e microfone para continuar.");
    });
};
