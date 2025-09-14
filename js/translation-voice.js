document.addEventListener('DOMContentLoaded', function () {
  // 🎛️ Elementos da interface
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

  // 🌐 Parâmetros da URL
  const params = new URLSearchParams(window.location.search);
  const defaultLang = params.get('lang') || navigator.language || 'pt-BR';
  const targetLang = window.targetTranslationLang || params.get('target') || 'en';

  let selectedLanguage = defaultLang;

  // 🌍 Endpoint da API de tradução
  const TRANSLATE_ENDPOINT = 'https://chat-tradutor.onrender.com/translate';

  // 🎙️ Verifica suporte ao reconhecimento de voz
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    originalText.textContent = "Seu navegador não suporta reconhecimento de voz. Tente usar Chrome ou Edge.";
    recordButton.style.display = 'none';
    return;
  }

  // 📝 Tradução dos títulos das caixas
  async function traduzirTitulos() {
    const textos = {
      originalTitle: "You said",
      translatedTitle: "Translated to"
    };

    for (const [id, texto] of Object.entries(textos)) {
      const el = document.getElementById(id);
      if (el) {
        try {
          const response = await fetch(TRANSLATE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: texto, targetLang: selectedLanguage })
          });

          const result = await response.json();
          el.textContent = result.translatedText || texto;
        } catch (error) {
          console.error('Erro ao traduzir título:', error);
          el.textContent = texto;
        }
      }
    }
  }

  traduzirTitulos();

  // 🎙️ Configura reconhecimento de voz
  const recognition = new SpeechRecognition();
  recognition.lang = selectedLanguage;
  recognition.continuous = false;

  let isRecording = false;
  let pressTimer;

  // 🔁 Função de tradução
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

  // 🎙️ Inicia gravação
  function startRecording() {
    try {
      recognition.lang = selectedLanguage;
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

  // 🛑 Encerra gravação
  function stopRecording() {
    recognition.stop();
    recordButton.classList.remove('recording');
    isRecording = false;
  }

  // 📥 Resultado do reconhecimento de voz
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

  // 🖱️ Pressionar para gravar
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

  // 🖱️ Clique simples → abre janela interativa
  recordButton.addEventListener('click', () => {
    voicePopup.style.display = 'block';
  });

  // ➤ Finalizar gravação pela janela
  finishRecording.addEventListener('click', () => {
    voicePopup.style.display = 'none';
    startRecording();
  });

  // 🌐 Alterna exibição da lista de idiomas
  languageToggle.addEventListener('click', () => {
    languageList.style.display = languageList.style.display === 'flex' ? 'none' : 'flex';
  });

  // 🌍 Seleciona idioma
  languageList.querySelectorAll('button').forEach(btn => {
    btn.addEventListener('click', () => {
      selectedLanguage = btn.dataset.lang;
      recognition.lang = selectedLanguage;
      langFlag.textContent = btn.textContent.split(' ')[0];
      languageList.style.display = 'none';
    });
  });
});
