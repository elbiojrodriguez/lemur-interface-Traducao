window.onload = () => {
  const textDisplay = document.getElementById('textDisplay');

  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    textDisplay.innerHTML = '<div class="phrase-box final-text">Seu navegador não suporta reconhecimento de voz.</div>';
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.continuous = true;
  recognition.interimResults = true;
  recognition.lang = 'pt-BR';

  recognition.onresult = (event) => {
    textDisplay.innerHTML = ''; // Limpa antes de atualizar

    for (let i = event.resultIndex; i < event.results.length; ++i) {
      const result = event.results[i];
      const div = document.createElement('div');
      div.className = 'phrase-box ' + (result.isFinal ? 'final-text' : 'interim-box');
      div.textContent = result[0].transcript;
      textDisplay.appendChild(div);
    }
  };

  recognition.onerror = (event) => {
    console.error('Erro no reconhecimento de voz:', event.error);
  };

  recognition.start();
};
