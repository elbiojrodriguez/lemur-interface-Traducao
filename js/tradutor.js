// tradutor.js - BIDIRECIONAL para caller e receiver
class TradutorBidirecional {
    constructor(config) {
        this.meuIdioma = config.meuIdioma;
        this.idiomaParceiro = config.idiomaParceiro;
        this.urlServer = 'https://chat-tradutor.onrender.com';
        this.socket = io('https://lemur-signal.onrender.com'); // SEU SERVER WebRTC
        
        this.setupSocket();
    }

    setupSocket() {
        // Recebe mensagens do parceiro via WebRTC DataChannel
        this.socket.on('mensagem-traduzida', (data) => {
            this.exibirMensagemRecebida(data);
        });
    }

    async enviarMensagem(texto) {
        try {
            // 1. Traduz para o idioma do parceiro
            const response = await fetch(this.urlServer + '/translate-and-speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: texto,
                    targetLang: this.idiomaParceiro
                })
            });

            const data = await response.json();
            
            if (data.success) {
                // 2. Exibe minha mensagem traduzida
                this.exibirMinhaMensagem(texto, data.translatedText);
                
                // 3. Envia para o parceiro via WebRTC
                this.socket.emit('enviar-mensagem', {
                    textoOriginal: texto,
                    textoTraduzido: data.translatedText,
                    audioData: data.audioData
                });

                // 4. Toca áudio da minha tradução
                this.tocarAudio(data.audioData);
            }
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
        }
    }

    exibirMinhaMensagem(original, traduzido) {
        // Exibe na caixa de texto existente
        const textElement = document.getElementById('translatedText');
        if (textElement) {
            textElement.innerHTML = `
                <div style="color: blue;">🇧🇷 ${original}</div>
                <div style="color: green;">🌍 ${traduzido}</div>
            `;
        }
    }

    exibirMensagemRecebida(data) {
        // Exibe mensagem do parceiro
        const textElement = document.getElementById('translatedText');
        if (textElement) {
            textElement.innerHTML = `
                <div style="color: red;">🇺🇸 ${data.textoOriginal}</div>
                <div style="color: purple;">🌍 ${data.textoTraduzido}</div>
            `;
        }
        
        // Toca áudio da mensagem recebida
        this.tocarAudio(data.audioData);
    }

    tocarAudio(audioData) {
        const audio = new Audio(audioData);
        audio.play().catch(e => console.log('Audio bloqueado:', e));
    }

    // Reconhecimento de voz automático
    iniciarReconhecimentoVoz() {
        if (!('webkitSpeechRecognition' in window)) return;
        
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = this.meuIdioma === 'portugues' ? 'pt-BR' : 'en-US';

        recognition.onresult = (event) => {
            const texto = event.results[event.results.length - 1][0].transcript;
            
            // Quando para de falar, envia automaticamente
            if (event.results[event.results.length - 1].isFinal) {
                this.enviarMensagem(texto);
            }
        };

        recognition.start();
    }
}
