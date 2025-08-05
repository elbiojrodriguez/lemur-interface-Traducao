// 🎙️ Reconhecimento de voz
const chatBox = document.getElementById('chatBox');
const langButtons = document.querySelectorAll('.lang-btn');

langButtons.forEach(button => {
  button.onclick = () => {
    const lang = button.dataset.lang;
    startSpeechRecognition(lang);
  };
});

function startSpeechRecognition(language) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    chatBox.textContent = "Reconhecimento de voz não suportado neste navegador.";
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = language;
  recognition.interimResults = true;
  recognition.continuous = false;

  chatBox.textContent = "🎤 Ouvindo...";

  recognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
    }
    chatBox.textContent = transcript;
  };

  recognition.onerror = (event) => {
    chatBox.textContent = "Erro: " + event.error;
  };

  recognition.onend = () => {
    chatBox.textContent += "\n✅ Fala encerrada.";
  };

  recognition.start();
}
