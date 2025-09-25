// translation-voice.js - Conecta microfone com o tradutor existente

// Aguarda a página carregar
document.addEventListener('DOMContentLoaded', function() {
    
    // Configuração baseada no HTML (caller ou receiver)
    const isCaller = document.title.includes('Caller');
    const config = {
        meuIdioma: isCaller ? 'portugues' : 'ingles',
        idiomaParceiro: isCaller ? 'ingles' : 'portugues'
    };

    // Cria o tradutor
    window.tradutor = new TradutorBidirecional(config);

    // Adiciona botão de microfone à caixa de texto existente
    const textBox = document.querySelector('.text-box');
    if (textBox) {
        const micButton = document.createElement('button');
        micButton.innerHTML = '🎤';
        micButton.style.cssText = `
            position: absolute;
            bottom: 10px;
            right: 10px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            background: #007bff;
            color: white;
            font-size: 18px;
            cursor: pointer;
            z-index: 1000;
        `;
        
        micButton.onclick = function() {
            iniciarReconhecimentoVoz();
            micButton.style.background = '#dc3545';
            setTimeout(() => micButton.style.background = '#007bff', 2000);
        };

        textBox.style.position = 'relative';
        textBox.appendChild(micButton);
    }

    // FUNÇÃO DE RECONHECIMENTO DE VOZ CORRIGIDA
    function iniciarReconhecimentoVoz() {
        if (!('webkitSpeechRecognition' in window)) {
            alert('Reconhecimento de voz não suportado neste navegador');
            return;
        }
        
        const recognition = new webkitSpeechRecognition();
        recognition.continuous = false; // Para após falar
        recognition.interimResults = false; // Só resultado final
        recognition.lang = config.meuIdioma === 'portugues' ? 'pt-BR' : 'en-US';

        recognition.onresult = function(event) {
            const textoFalado = event.results[0][0].transcript;
            console.log('Texto falado:', textoFalado);
            
            // MOSTRAR O TEXTO FALADO NA TELA ANTES DE TRADUZIR
            const translatedTextElement = document.getElementById('translatedText');
            if (translatedTextElement) {
                translatedTextElement.innerHTML = `<div style="color: blue;">🎤 Falado: ${textoFalado}</div>`;
            }
            
            // Envia para tradução automaticamente
            if (window.tradutor && window.tradutor.enviarMensagem) {
                window.tradutor.enviarMensagem(textoFalado);
            }
        };

        recognition.onerror = function(event) {
            console.error('Erro no reconhecimento:', event.error);
            
            // Mostrar erro na tela
            const translatedTextElement = document.getElementById('translatedText');
            if (translatedTextElement) {
                translatedTextElement.innerHTML = `<div style="color: red;">❌ Erro: ${event.error}</div>`;
            }
        };

        recognition.onend = function() {
            console.log('Reconhecimento de voz terminado');
        };

        recognition.start();
        
        // Mostrar status na tela
        const translatedTextElement = document.getElementById('translatedText');
        if (translatedTextElement) {
            translatedTextElement.innerHTML = '<div style="color: orange;">🎤 Ouvindo... Fale agora</div>';
        }
    }

    // Inicia reconhecimento automaticamente após permissões
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
            console.log('Microfone permitido - tradutor pronto');
        })
        .catch(err => {
            console.log('Microfone não permitido para tradutor');
        });
});
