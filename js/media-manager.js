let mediaStream = null;

export async function getMediaStream() {
  if (mediaStream) return mediaStream;

  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    console.error("getUserMedia não é suportado neste navegador.");
    throw new Error("getUserMedia não suportado");
  }

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
