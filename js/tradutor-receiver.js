const serverURL = 'https://chat-tradutor.onrender.com';

const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.interimResults = false;
recognition.maxAlternatives = 1;

let idiomaB = 'fr-FR';
let idiomaA = 'pt-BR';

function setIdiomaB(codigo) {
  idiomaB = codigo;
  document.getElementById('idiomaB').value = codigo;
  atualizarBandeira('bandeiraB', codigo);
}

function setIdiomaA(codigo) {
  idiomaA = codigo;
  document.getElementById('idiomaA').value = codigo;
  atualizarBandeira('bandeiraA', codigo);
}

function atualizarBandeira(idElemento, codigoIdioma) {
  const bandeira = document.getElementById(idElemento);
  const pais = codigoIdioma.split('-')[1].toLowerCase();
  bandeira.src = `img/${pais}.png`;
}

function iniciarReconhecimento() {
  recognition.lang = idiomaB;
  recognition.start();
}

recognition.onresult = async (event) => {
  const textoOriginal = event.results[0][0].transcript;
  document.getElementById('textoB').value = textoOriginal;

  try {
    const respostaTraducao = await fetch(`${serverURL}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: textoOriginal,
        targetLang: idiomaA
      })
    });

    const dadosTraducao = await respostaTraducao.json();
    const textoTraduzido = dadosTraducao.translatedText;
    document.getElementById('textoA').value = textoTraduzido;

    sendToCaller(textoTraduzido); // Envia via WebRTC

    const respostaAudio = await fetch(`${serverURL}/speak`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: textoTraduzido,
        languageCode: idiomaA
      })
    });

    const blob = await respostaAudio.blob();
    const urlAudio = URL.createObjectURL(blob);
    const audio = new Audio(urlAudio);
    audio.play();
  } catch (erro) {
    console.error('Erro no processo de tradução/fala:', erro);
    alert('Falha ao traduzir ou gerar áudio');
  }
}

function receiveFromCaller(textoTraduzido) {
  document.getElementById('textoA').value = textoTraduzido;

  fetch(`${serverURL}/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      text: textoTraduzido,
      languageCode: idiomaA
    })
  })
  .then(res => res.blob())
  .then(blob => {
    const urlAudio = URL.createObjectURL(blob);
    const audio = new Audio(urlAudio);
    audio.play();
  })
  .catch(erro => {
    console.error('Erro ao gerar áudio:', erro);
    alert('Falha ao reproduzir áudio');
  });
}
