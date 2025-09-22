document.addEventListener('DOMContentLoaded', () => {
  initializeTranslator();
});

async function initializeTranslator() {
  const IDIOMA_ORIGEM = window.callerLang || navigator.language || 'pt-BR';
  const IDIOMA_DESTINO = window.targetTranslationLang || new URLSearchParams(window.location.search).get('lang') || 'en';
  const IDIOMA_FALA = getIdiomaFala(IDIOMA_DESTINO);

  const recordButton = document.getElementById('recordButton');
  const translatedText = document.getElementById('translatedText');
  const currentLanguageFlag = document.getElementById('currentLanguageFlag');
  const worldButton = document.getElementById('worldButton');
  const languageDropdown = document.getElementById('languageDropdown');
  const languageOptions = document.querySelectorAll('.language-option');
  const speakerButton = document.getElementById('speakerButton');
  const sendButton = document.getElementById('sendButton');

  if (!recordButton || !translatedText || !currentLanguageFlag || !worldButton || !languageDropdown) return;

  currentLanguageFlag.textContent = await getBandeira(IDIOMA_ORIGEM);
  translatedText.textContent = "🎤";

  const recognition = setupRecognition(IDIOMA_ORIGEM);
  setupLanguageSelector(recognition);
  setupRecording(recognition);
  setupSpeaker();
  setupSendButton();

  await requestMicrophonePermission();

  function getIdiomaFala(lang) {
    const map = {
      en: 'en-US', pt: 'pt-BR', es: 'es-ES', fr: 'fr-FR', de: 'de-DE', it: 'it-IT'
    };
    return lang.includes('-') ? lang : map[lang] || 'en-US';
  }

  async function getBandeira(lang) {
    try {
      const res = await fetch('assets/bandeiras/language-flags.json');
      const flags = await res.json();
      return flags[lang] || flags[lang.split('-')[0]] || '🎌';
    } catch {
      return '🎌';
    }
  }

  function setupLanguageSelector(recognitionInstance) {
    worldButton.addEventListener('click', e => {
      e.preventDefault();
      e.stopPropagation();
      languageDropdown.classList.toggle('show');
    });

    document.addEventListener('click', e => {
      if (!languageDropdown.contains(e.target) && e.target !== worldButton) {
        languageDropdown.classList.remove('show');
      }
    });

    languageOptions.forEach(option => {
      option.addEventListener('click', async () => {
        const novoIdioma = option.getAttribute('data-lang');
        currentLanguageFlag.textContent = await getBandeira(novoIdioma);
        recognitionInstance.lang = novoIdioma;
        translatedText.textContent = "✅";
        setTimeout(() => translatedText.textContent = "🎤", 1000);
      });
    });
  }

  function setupRecognition(lang) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = lang;
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = async event => {
      let finalTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        }
      }
      if (finalTranscript) {
        translatedText.textContent = "⏳";
        const translation = await translateText(finalTranscript);
        translatedText.textContent = translation;
        enviarParaOutroCelular(translation);
      }
    };

    recognition.onerror = () => translatedText.textContent = "❌";
    return recognition;
  }

  async function translateText(text) {
    try {
      const res = await fetch('https://chat-tradutor.onrender.com/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          sourceLang: IDIOMA_ORIGEM,
          targetLang: IDIOMA_DESTINO
        })
      });
      const data = await res.json();
      return data.translatedText || text;
    } catch {
      return text;
    }
  }

  function enviarParaOutroCelular(texto) {
    if (window.rtcDataChannel && window.rtcDataChannel.isOpen()) {
      window.rtcDataChannel.send(texto);
    }
  }

  async function requestMicrophonePermission() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop());
      recordButton.disabled = false;
    } catch {
      translatedText.textContent = "🚫";
      recordButton.disabled = true;
    }
  }

  function setupRecording(recognitionInstance) {
    recordButton.addEventListener('click', () => {
      if (recordButton.disabled) return;
      recognitionInstance.start();
      translatedText.textContent = "🎙️";
    });
  }

  function setupSpeaker() {
    if (!window.speechSynthesis || !speakerButton) return;

    speakerButton.addEventListener('click', () => {
      const text = translatedText.textContent;
      if (!text || ["🎤", "⏳", "❌"].includes(text)) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = IDIOMA_FALA;
      utterance.rate = 0.9;
      utterance.volume = 0.8;
      window.speechSynthesis.speak(utterance);
    });
  }

  function setupSendButton() {
    if (sendButton) {
      sendButton.addEventListener('click', () => {
        translatedText.textContent = "⏳";
      });
    }
  }
}
