window.onload = () => {
  const rtcCore = new WebRTCCore();
  const myId = crypto.randomUUID().substr(0, 8);
  let localStream = null;

  // Solicita acesso à câmera
  navigator.mediaDevices.getUserMedia({ video: true, audio: false })
    .then(stream => {
      localStream = stream;
    })
    .catch(error => {
      console.error("Erro ao acessar a câmera:", error);
    });

  // 🆕 Obtém o idioma do navegador
  const userLang = navigator.language || navigator.userLanguage;

  // Gera QR Code com link para caller, incluindo idioma
  const callerUrl = `${window.location.origin}/caller.html?targetId=${myId}&lang=${encodeURIComponent(userLang)}`;
  QRCodeGenerator.generate("qrcode", callerUrl);

  rtcCore.initialize(myId);
  rtcCore.setupSocketHandlers();

  const localVideo = document.getElementById('localVideo');

  rtcCore.onIncomingCall = (offer) => {
    if (!localStream) {
      console.warn("Stream local não disponível");
      return;
    }

    rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
      // 🔇 Silencia áudio recebido
      remoteStream.getAudioTracks().forEach(track => track.enabled = false);

      // 🔥 Oculta o QR Code (sem alterar mais nada)
      const qrElement = document.getElementById('qrcode');
      if (qrElement) qrElement.style.display = 'none';

      // Exibe vídeo remoto no PIP
      localVideo.srcObject = remoteStream;
    });
  };
};
