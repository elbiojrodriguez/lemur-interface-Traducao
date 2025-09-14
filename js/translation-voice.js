document.addEventListener('DOMContentLoaded', function () {
  const recordButton = document.getElementById('recordButton');
  const originalText = document.getElementById('originalText');
  const translatedText = document.getElementById('translatedText');
  const originalTitle = document.getElementById('originalTitle');
  const translatedTitle = document.getElementById('translatedTitle');
  const voicePopup = document.getElementById('voicePopup');
  const languageToggle = document.getElementById('languageToggle');
  const languageList = document.getElementById('languageList');
  const finishRecording = document.getElementById('finishRecording');
  const langFlag = document.getElementById('langFlag');

  const defaultLang = 'pt-BR';
  const targetLang = 'en';
  let selectedLanguage = defaultLang;

  const TRANSLATE_ENDPOINT = 'https://chat-tradutor.onrender.com/translate';

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    originalText.textContent = "Seu navegador não suporta reconhecimento de voz.";
    recordButton.style.display = 'none';
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = selectedLanguage;
  recognition.continuous = false;

  function startRecording() {
    try {
      recognition.lang = selectedLanguage;
      recognition.start();
      voicePopup.style.display = 'block';
      originalText.textContent = "Ouvindo...";
      translatedText.textContent = "Aguardando para traduzir...";
    } catch (error) {
      console.error('Erro ao iniciar gravação:', error);
      originalText.textContent = "Erro ao acessar o microfone";
    }
  }

  function stopRecording() {
    recognition.stop();
    voicePopup.style.display = 'none';
  }

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
      return "Erro na tradução.";
    }
  }

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

  // 🎤 Clicar no botão inicia gravação
  recordButton.addEventListener('click', () => {
    startRecording();
  });

  // ✅ Finalizar gravação
  finishRecording.addEventListener('click', () => {
    stopRecording();
  });

  // 🌐 Mostrar/esconder lista de idiomas
  languageToggle.addEventListener('click', () => {
    languageList.style.display = languageList.style.display === 'flex' ? 'none' : 'flex';
  });

  // 🌍 Selecionar idioma
  languageList.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedLanguage = btn.dataset.lang;
      recognition.lang = selectedLanguage;
      langFlag.textContent = btn.textContent.split(' ')[0];
      languageList.style.display = 'none';
    });
  });
});
