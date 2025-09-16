// ===== CONFIGURAÇÃO DE IDIOMAS =====
// Estes valores devem ser dinâmicos conforme os usuários da chamada
let IDIOMA_ORIGEM = 'pt-BR';    // Idioma do usuário local
let IDIOMA_DESTINO = 'en';      // Idioma do usuário remoto
const IDIOMA_FALA = 'en-US';    // Idioma para síntese de voz

// Mapeamento de bandeiras
const BANDEIRAS_IDIOMAS = {
    'pt-BR': '🇧🇷', 'en': '🇺🇸', 'es': '🇪🇸', 'fr': '🇫🇷', 
    'de': '🇩🇪', 'it': '🇮🇹', 'ja': '🇯🇵', 'zh-CN': '🇨🇳',
    'ru': '🇷🇺', 'ar': '🇸🇦', 'ko': '🇰🇷'
};

class VideoCallTranslator {
    constructor() {
        this.initializeElements();
        this.setupEventListeners();
        this.requestMicrophonePermission();
    }
    
    initializeElements() {
        // Elementos de tradução
        this.translatedText = document.getElementById('translatedText');
        this.recordButton = document.getElementById('recordButton');
        this.speakerButton = document.getElementById('speakerButton');
        this.recordingModal = document.getElementById('recordingModal');
        this.recordingTimer = document.getElementById('recordingTimer');
        
        // Elementos do seu layout existente
        this.localLangElement = document.querySelector('.local-Lang');
        this.remoterLangElement = document.querySelector('.remoter-Lang');
        
        // Configuração do reconhecimento de voz
        this.SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.SpeechSynthesis = window.speechSynthesis;
        
        if (this.SpeechRecognition) {
            this.recognition = new this.SpeechRecognition();
            this.recognition.lang = IDIOMA_ORIGEM;
            this.recognition.continuous = true;
            this.recognition.interimResults = true;
        }
        
        this.isRecording = false;
        this.recordingStartTime = 0;
        this.timerInterval = null;
    }
    
    setupEventListeners() {
        // Eventos dos botões
        this.recordButton.addEventListener('click', () => this.toggleRecording());
        this.speakerButton.addEventListener('click', () => this.toggleSpeech());
        
        // Eventos das bandeiras (para mudar idiomas se necessário)
        this.localLangElement.addEventListener('click', () => this.showLanguageSelector('origin'));
        this.remoterLangElement.addEventListener('click', () => this.showLanguageSelector('target'));
        
        // Configurar eventos de reconhecimento de voz
        if (this.recognition) {
            this.recognition.onresult = (event) => this.onRecognitionResult(event);
            this.recognition.onerror = (event) => this.onRecognitionError(event);
            this.recognition.onend = () => this.stopRecording();
        }
    }
    
    // Função para atualizar idiomas baseado nos usuários da chamada
    updateLanguages(localLang, remoteLang) {
        IDIOMA_ORIGEM = localLang;
        IDIOMA_DESTINO = remoteLang;
        
        // Atualizar bandeiras na interface
        this.localLangElement.textContent = BANDEIRAS_IDIOMAS[localLang] || '🌐';
        this.remoterLangElement.textContent = BANDEIRAS_IDIOMAS[remoteLang] || '🌐';
        
        // Atualizar reconhecimento de voz
        if (this.recognition) {
            this.recognition.lang = localLang;
        }
        
        console.log(`Idiomas atualizados: Local: ${localLang}, Remoto: ${remoteLang}`);
    }
    
    async requestMicrophonePermission() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());
            this.recordButton.disabled = false;
            this.translatedText.textContent = "🎤";
        } catch (error) {
            this.translatedText.textContent = "🚫";
            this.recordButton.disabled = true;
        }
    }
    
    toggleRecording() {
        if (this.isRecording) {
            this.stopRecording();
        } else {
            this.startRecording();
        }
    }
    
    startRecording() {
        if (!this.recognition) return;
        
        try {
            this.recognition.start();
            this.isRecording = true;
            this.recordButton.classList.add('recording');
            this.recordingStartTime = Date.now();
            this.startTimer();
            this.translatedText.textContent = "🎙️";
            this.recordingModal.classList.add('visible');
        } catch (error) {
            this.translatedText.textContent = "❌";
        }
    }
    
    stopRecording() {
        if (!this.isRecording) return;
        
        if (this.recognition) {
            this.recognition.stop();
        }
        
        this.isRecording = false;
        this.recordButton.classList.remove('recording');
        this.stopTimer();
        this.recordingModal.classList.remove('visible');
        this.translatedText.textContent = "⏳";
    }
    
    startTimer() {
        this.stopTimer();
        this.timerInterval = setInterval(() => this.updateTimer(), 1000);
    }
    
    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
    }
    
    updateTimer() {
        const elapsedSeconds = Math.floor((Date.now() - this.recordingStartTime) / 1000);
        const minutes = Math.floor(elapsedSeconds / 60);
        const seconds = elapsedSeconds % 60;
        this.recordingTimer.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }
    
    onRecognitionResult(event) {
        let finalTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
            if (event.results[i].isFinal) {
                finalTranscript += event.results[i][0].transcript;
            }
        }
        
        if (finalTranscript) {
            this.translatedText.textContent = "⏳";
            this.translateText(finalTranscript).then(translation => {
                this.translatedText.textContent = translation;
                this.speakerButton.disabled = false;
                this.speakTranslation(translation);
            });
        }
    }
    
    onRecognitionError(event) {
        if (event.error !== 'no-speech') {
            this.translatedText.textContent = "❌";
        }
        this.stopRecording();
    }
    
    async translateText(text) {
        try {
            const response = await fetch('https://chat-tradutor.onrender.com/translate', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, targetLang: IDIOMA_DESTINO })
            });
            
            const result = await response.json();
            return result.translatedText || "❌";
        } catch (error) {
            return "❌";
        }
    }
    
    speakTranslation(text) {
        if (!this.SpeechSynthesis) return;
        
        window.speechSynthesis.cancel();
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = IDIOMA_FALA;
        utterance.rate = 0.9;
        
        utterance.onstart = () => {
            this.speakerButton.textContent = '⏹';
        };
        
        utterance.onend = () => {
            this.speakerButton.textContent = '🔊';
        };
        
        window.speechSynthesis.speak(utterance);
    }
    
    toggleSpeech() {
        if (!this.SpeechSynthesis) return;
        
        if (window.speechSynthesis.speaking) {
            window.speechSynthesis.cancel();
            this.speakerButton.textContent = '🔊';
        } else {
            const textToSpeak = this.translatedText.textContent;
            if (textToSpeak && !['🎤', '⏳', '❌', '🚫'].includes(textToSpeak)) {
                this.speakTranslation(textToSpeak);
            }
        }
    }
    
    showLanguageSelector(type) {
        // Implementação simplificada - você pode expandir isso
        alert(`Alterar idioma ${type === 'origin' ? 'de origem' : 'de destino'}`);
    }
}

// Inicialização
document.addEventListener('DOMContentLoaded', () => {
    window.translator = new VideoCallTranslator();
    
    // Exemplo: como atualizar os idiomas quando você souber dos usuários
    // window.translator.updateLanguages('pt-BR', 'en');
});
