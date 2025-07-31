<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Caller - Videochamada Mobile</title>
  <link rel="stylesheet" href="style.css" />
</head>
<body>
  <div class="remote-container">
    <video id="remoteVideo" autoplay playsinline></video>
  </div>

  <div class="local-pip">
    <video id="localVideo" autoplay muted playsinline></video>
  </div>

  <div class="controls">
    <button id="callActionBtn">Call</button>
  </div>

  <div class="info-overlay">
    <span id="myId"></span>
  </div>

  <script src="https://lemur-signal.onrender.com/socket.io/socket.io.js"></script>
  <script type="module" src="js/caller-ui.js"></script>
</body>
</html>
