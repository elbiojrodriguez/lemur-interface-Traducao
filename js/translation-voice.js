document.addEventListener('DOMContentLoaded', function () {
  const recordButton = document.getElementById('recordButton');
  const originalText = document.getElementById('originalText');
  const translatedText = document.getElementById('translatedText');
  const flagElement = document.querySelector('.local-mic-Lang');

  // Obter idioma de origem da URL
  const params = new URLSearchParams(window.location.search);
  const sourceLang = params.get('lang') || 'pt-BR'; // idioma local (receiver)

  // Idioma de destino: prioridade para o que veio do caller via WebRTC
  const targetLang = window.targetTranslationLang || params.get('target') || 'es';

  // ENDPOINT da API de tradução
  const TRANSLATE_ENDPOINT = 'https://chat-tradutor.onrender.com/translate';

  // Verificar suporte ao reconhecimento de voz
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    originalText.textContent = "Seu navegador não suporta reconhecimento de voz. Tente usar Chrome ou Edge.";
    recordButton.style.display = 'none';
    return;
  }

  // Aplicar bandeira do idioma local
  async function aplicarBandeira(langCode) {
    try {
      const response = await fetch('assets/bandeiras/language-flags.json');
      const flags = await response.json();
      const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🏳️';
      if (flagElement) flagElement.textContent = bandeira;
    } catch (error) {
      console.error('Erro ao carregar bandeira:', error);
    }
  }

  aplicarBandeira(sourceLang);

  const recognition = new SpeechRecognition();
  recognition.lang = sourceLang;
  recognition.continuous = false;

  let isRecording = false;
  let pressTimer;

  // Função de tradução
  async function translateText(text, targetLang) {
    try {
      const response = await fetch(TRANSLATE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLang })
      });

      const result = await response.json();
      return result.translatedText || text;
    } catch (error) {
      console.error('Erro na tradução:', error);
      return "Erro na tradução. Verifique o console para detalhes.";
    }
  }

  // Eventos de gravação
  function startRecording() {
    try {
      recognition.start();
      recordButton.classList.add('recording');
      isRecording = true;
      originalText.textContent = "Ouvindo...";
      translatedText.textContent = "Aguardando para traduzir...";
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      originalText.textContent = "Erro ao acessar o microfone";
    }
  }

  function stopRecording() {
    recognition.stop();
    recordButton.classList.remove('recording');
    isRecording = false;
  }

  recordButton.addEventListener('mousedown', () => {
    pressTimer = setTimeout(startRecording, 300);
  });

  recordButton.addEventListener('mouseup', () => {
    clearTimeout(pressTimer);
    if (isRecording) stopRecording();
  });

  recordButton.addEventListener('touchstart', (e) => {
    e.preventDefault();
    pressTimer = setTimeout(startRecording, 300);
  });

  recordButton.addEventListener('touchend', (e) => {
    e.preventDefault();
    clearTimeout(pressTimer);
    if (isRecording) stopRecording();
  });

  recognition.onresult = function (event) {
    const transcript = event.results[0][0].transcript;
    originalText.textContent = transcript;
    translatedText.textContent = "Traduzindo...";

    translateText(transcript, targetLang).then(translation => {
      translatedText.textContent = translation;
    });
  };

  recognition.onerror = function (event) {
    console.error('Erro no reconhecimento de voz:', event.error);
    originalText.textContent = "Erro: " + event.error;
    stopRecording();
  };

  recognition.onend = function () {
    stopRecording();
  };
});
