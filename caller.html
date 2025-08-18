<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Caller - Videochamada Mobile</title>
  <link rel="stylesheet" href="style.css" />
  <link rel="stylesheet" href="responsivo.css" />
  <style>
    /* Estilo para a nova info do usuário */
    .user-info {
      position: absolute;
      top: 20px;
      left: 20px;
      background: rgba(0,0,0,0.7);
      color: white;
      padding: 10px 15px;
      border-radius: 20px;
      display: flex;
      align-items: center;
      gap: 10px;
      z-index: 100;
      font-size: 1.2rem;
    }
  </style>
</head>
<body>
  <!-- Novo elemento (será preenchido via JavaScript) -->
  <div id="userInfoDisplay" class="user-info" style="display: none;"></div>

  <!-- Estrutura original (não alterada) -->
  <div class="container">
    <div class="video-wrapper">
      <video id="remoteVideo" autoplay playsinline></video>
    </div>

    <div class="video-wrapper">
      <video id="localVideo" autoplay muted playsinline></video>
    </div>

    <div class="controls">
      <button id="callActionBtn" class="call-button">SEND 🚀</button>
    </div>

    <div class="info-overlay" style="display: none;">
      <span id="myId"></span>
    </div>
  </div>

  <script src="https://lemur-signal.onrender.com/socket.io/socket.io.js"></script>
  <script type="module">
    import WebRTCCore from '../core/webrtc-core.js';

    // ✅ Função da API de bandeiras (solução definitiva)
    async function getFlagEmoji(lang) {
      try {
        const response = await fetch(`https://language-flags.fly.dev/${lang}`);
        return await response.text(); // Retorna o emoji (ex: 🇧🇷)
      } catch {
        return '🌐'; // Fallback se falhar
      }
    }

    window.onload = async () => {
      // Extrai parâmetros da URL
      const urlParams = new URLSearchParams(window.location.search);
      const userName = urlParams.get('name') || 'Visitante';
      const userLang = urlParams.get('lang') || 'en';
      
      // Obtém a bandeira (via API)
      const userFlag = await getFlagEmoji(userLang);

      // Exibe as informações
      const userInfoDisplay = document.getElementById('userInfoDisplay');
      userInfoDisplay.innerHTML = `${userName} ${userFlag}`;
      userInfoDisplay.style.display = 'flex';

      // --------------------------------------------
      // 🔥 TUDO ABAIXO É O SEU CÓDIGO ORIGINAL (não alterado)
      // --------------------------------------------
      const rtcCore = new WebRTCCore();
      const myId = crypto.randomUUID().substr(0, 8);
      document.getElementById('myId').textContent = myId;
      rtcCore.initialize(myId);
      rtcCore.setupSocketHandlers();

      const localVideo = document.getElementById('localVideo');
      const remoteVideo = document.getElementById('remoteVideo');
      let targetId = null;
      let localStream = null;

      // 🔓 Solicita acesso à câmera
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

      // 🔇 Silencia qualquer áudio recebido
      rtcCore.setRemoteStreamCallback(stream => {
        stream.getAudioTracks().forEach(track => track.enabled = false);
        localVideo.srcObject = stream;
      });
    };
  </script>
</body>
</html>
