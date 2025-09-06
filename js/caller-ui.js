<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Caller - Videochamada WebRTC</title>

  <style>
    body {
      margin: 0;
      background: black;
      height: 100vh;
      overflow: hidden;
      font-family: Arial, sans-serif;
    }

    .container {
      position: relative;
      width: 100%;
      height: 100%;
    }

    .video-wrapper {
      position: relative;
      width: 100%;
      height: 100%;
    }

    /* Oculta a câmera local */
    #localVideo {
      display: none;
    }

    /* Exibe o vídeo remoto em PIP */
    #remoteVideo {
      position: absolute;
      bottom: 140px;
      right: 5px;
      width: 138px;
      height: 184px;
      border: 2px solid #4CAF50;
      border-radius: 8px;
      object-fit: cover;
      box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
      z-index: 10;
    }

    .controls {
      position: absolute;
      bottom: 225px;
      left: 110px;
      display: flex;
      flex-direction: column;
      gap: 16px;
      z-index: 20;
    }

    .controls button {
      width: 100px;
      height: 40px;
      border-radius: 20px;
      border: none;
      font-size: 18px;
      font-weight: bold;
      cursor: pointer;
      backdrop-filter: blur(6px);
      color: white;
      background: #4CAF50;
    }

    .info-overlay {
      position: absolute;
      top: 20px;
      left: 0;
      right: 0;
      z-index: 30;
      color: white;
      text-align: center;
      background: transparent;
      padding: 10px;
      border-radius: 0 0 10px 10px;
    }

    #myId {
      display: inline-block;
      font-size: 16px;
      font-weight: bold;
      background: rgba(255, 255, 255, 0.1);
      padding: 6px 12px;
      border-radius: 20px;
      user-select: all;
      cursor: pointer;
      color: white;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="video-wrapper">
      <video id="remoteVideo" autoplay playsinline></video>
    </div>
    <div class="video-wrapper">
      <video id="localVideo" autoplay muted playsinline></video>
    </div>

    <div class="controls">
      <button id="callActionBtn" style="display:none;">SEND 🚀</button>
    </div>

    <div class="info-overlay" style="display: none;">
      <span id="myId"></span>
    </div>
  </div>

  <!-- 🔌 Scripts externos -->
  <script src="https://lemur-signal.onrender.com/socket.io/socket.io.js"></script>
  <script type="module" src="js/caller-ui.js"></script>
</body>
</html>
