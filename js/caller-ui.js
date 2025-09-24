import WebRTCCore from "./webrtc-core.js";

const localVideo = document.getElementById("local-video");
const remoteVideo = document.getElementById("remote-video");
const canalTexto = document.getElementById("canal-texto");
const canalEnviar = document.getElementById("canal-enviar");
const canalStatus = document.getElementById("canal-status");

const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
localVideo.srcObject = stream;

const callerId = crypto.randomUUID();
const rtc = new WebRTCCore(callerId, stream, true);
rtc.criarCanalDeDados();

const urlParams = new URLSearchParams(window.location.search);
const receiverId = urlParams.get("targetId");
const token = urlParams.get("token");
const lang = urlParams.get("lang");

rtc.inicializarSocket(token);

rtc.onCallReady = () => {
  document.getElementById("call-button").style.display = "block";
};

rtc.onRemoteStream = (stream) => {
  remoteVideo.srcObject = stream;
};

rtc.onDataChannelMessage = (msg) => {
  canalStatus.innerText = "Mensagem recebida!";
  canalTexto.value = msg;
};

canalEnviar.addEventListener("click", () => {
  const texto = canalTexto.value;
  rtc.enviarMensagemViaCanalDeDados(texto);
  canalStatus.innerText = "Mensagem enviada!";
});

document.getElementById("call-button").addEventListener("click", () => {
  rtc.iniciarChamada(receiverId);
});

async function obterIdiomaCompleto(lang) {
  if (lang === "pt") return "pt-BR";
  if (lang === "en") return "en-US";
  return lang;
}

const navegadorLang = await obterIdiomaCompleto(navigator.language);

const frasesParaTraduzir = {
  "translator-label": "Live translation. No filters. No platform."
};

(async () => {
  for (const [id, texto] of Object.entries(frasesParaTraduzir)) {
    const el = document.getElementById(id);
    if (el) {
      const traduzido = await translateText(texto, navegadorLang, false);
      el.textContent = traduzido;
    }
  }
})();
