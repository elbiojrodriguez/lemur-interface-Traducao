// js/media-manager.js
let mediaStream = null;

export async function getMediaStream() {
  if (mediaStream) return mediaStream;

  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: true,
      video: true
    });
    return mediaStream;
  } catch (err) {
    console.error("Erro ao acessar microfone/câmera:", err);
    throw err;
  }
}
