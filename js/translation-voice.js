document.addEventListener('DOMContentLoaded', function() {
    const recordButton = document.getElementById('recordButton');
    const originalText = document.getElementById('originalText');
    const translatedText = document.getElementById('translatedText');
    
    // ENDPOINT da API de tradução
    const TRANSLATE_ENDPOINT = 'https://chat-tradutor.onrender.com/translate';
    
    // Verificar se o navegador suporta reconhecimento de voz
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        originalText.textContent = "Seu navegador não suporta reconhecimento de voz. Tente usar Chrome ou Edge.";
        recordButton.style.display = 'none';
        return;
    }
    
    const recognition = new SpeechRecognition();
    recognition.lang = 'pt-BR';
    recognition.continuous = false;
    
    let isRecording = false;
    let pressTimer;
    
    // Função de tradução usando sua API
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
    
    // Iniciar gravação quando o botão for pressionado
    recordButton.addEventListener('mousedown', function() {
        pressTimer = setTimeout(function() {
            startRecording();
        }, 300);
    });
    
    // Parar gravação quando o botão for solto
    recordButton.addEventListener('mouseup', function() {
        clearTimeout(pressTimer);
        if (isRecording) {
            stopRecording();
        }
    });
    
    // Também para touch events para dispositivos móveis
    recordButton.addEventListener('touchstart', function(e) {
        e.preventDefault();
        pressTimer = setTimeout(function() {
            startRecording();
        }, 300);
    });
    
    recordButton.addEventListener('touchend', function(e) {
        e.preventDefault();
        clearTimeout(pressTimer);
        if (isRecording) {
            stopRecording();
        }
    });
    
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
    
    recognition.onresult = function(event) {
        const transcript = event.results[0][0].transcript;
        originalText.textContent = transcript;
        translatedText.textContent = "Traduzindo...";
        
        // Usar sua API para traduzir o texto
        translateText(transcript, 'en').then(translation => {
            translatedText.textContent = translation;
        });
    };
    
    recognition.onerror = function(event) {
        console.error('Erro no reconhecimento de voz:', event.error);
        originalText.textContent = "Erro: " + event.error;
        stopRecording();
    };
    
    recognition.onend = function() {
        stopRecording();
    };
});
