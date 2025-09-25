// tradutor-simples.js - SISTEMA BIDIRECIONAL MINIMALISTA
// ✅ ADEQUADO PARA SEU server.js EXISTENTE

let gravando = false;
const reconhecimento = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

// 1️⃣ INICIALIZAÇÃO
function iniciarTradutor() {
    reconhecimento.continuous = false;
    reconhecimento.interimResults = false;
    reconhecimento.lang = document.querySelector('.local-Lang').getAttribute('data-lang');
    
    reconhecimento.onresult = async function(event) {
        const textoFalado = event.results[0][0].transcript;
        document.getElementById('translatedText').textContent = "⏳ Traduzindo...";
        await traduzirEFalar(textoFalado);
    };
    
    document.getElementById('recordButton').onclick = function() {
        if (!gravando) {
            reconhecimento.start();
            gravando = true;
            document.getElementById('recordButton').style.background = '#ff4444';
        } else {
            reconhecimento.stop();
            gravando = false;
            document.getElementById('recordButton').style.background = '';
        }
    };
}

// 2️⃣ TRADUZIR E FALAR - ✅ COMPATÍVEL COM SEU SERVER
async function traduzirEFalar(texto) {
    try {
        // Pega idiomas das bandeiras (formato xx-XX)
        const deIdioma = document.querySelector('.local-Lang').getAttribute('data-lang');
        const paraIdioma = document.querySelector('.remoter-Lang').getAttribute('data-lang');
        
        // ✅ TRADUÇÃO - COMPATÍVEL COM SEU /translate
        const respostaTraducao = await fetch('https://chat-tradutor.onrender.com/translate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: texto,
                targetLang: paraIdioma.split('-')[0] // ✅ "pt-BR" → "pt"
            })
        });
        
        const dados = await respostaTraducao.json();
        
        if (!dados.success) throw new Error(dados.error);
        
        const translatedText = dados.translatedText;
        document.getElementById('translatedText').textContent = translatedText;
        
        // ✅ TTS - COMPATÍVEL COM SEU /speak
        const respostaAudio = await fetch('https://chat-tradutor.onrender.com/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: translatedText,
                languageCode: paraIdioma // ✅ "pt-BR" (formato completo)
            })
        });
        
        if (!respostaAudio.ok) throw new Error('Erro no áudio');
        
        const blob = await respostaAudio.blob();
        const url = URL.createObjectURL(blob);
        
        // Toca áudio primeiro
        await new Audio(url).play();
        
        // Envia via WebRTC
        if (window.rtcDataChannel) {
            window.rtcDataChannel.send(translatedText);
        }
        
    } catch (erro) {
        console.error('Erro:', erro);
        document.getElementById('translatedText').textContent = "❌ Erro na tradução";
    }
}

// 3️⃣ RECEBER MENSAGENS - ✅ COMPATÍVEL
if (window.rtcCore) {
    window.rtcCore.setDataChannelCallback(async function(mensagem) {
        document.getElementById('texto-recebido').textContent = mensagem;
        
        const idiomaLocal = document.querySelector('.local-Lang').getAttribute('data-lang');
        
        const respostaAudio = await fetch('https://chat-tradutor.onrender.com/speak', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                text: mensagem,
                languageCode: idiomaLocal
            })
        });
        
        const blob = await respostaAudio.blob();
        const url = URL.createObjectURL(blob);
        await new Audio(url).play();
    });
}

// 4️⃣ INICIAR
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', iniciarTradutor);
} else {
    iniciarTradutor();
}
