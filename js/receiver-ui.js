// ===== IMPORTAÇÃO DO QR CODE =====
import { QRCodeGenerator } from './qr-code-utils.js';

// ===== CÓDIGO DE TRADUÇÃO =====
const TRANSLATE_ENDPOINT = 'https://chat-tradutor.onrender.com/translate';

const textsToTranslateWelcome = {
    "welcome-title": "Welcome!",
    "translator-label": "Live translation. No filters. No platform.",
    "name-input": "Your name",
    "next-button-welcome": "Next",
    "camera-text": "Allow camera access",
    "microphone-text": "Allow microphone access"
};

const textsToTranslateQR = {
    "qr-modal-title": "This is your online key",
    "qr-modal-description": "You can ask to scan, share or print on your business card.",
    "next-button-qrcode": "Start Connection"
};

async function translateText(text, targetLang) {
    try {
        if (targetLang === 'en') return text;

        const response = await fetch(TRANSLATE_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text, targetLang })
        });

        const result = await response.json();
        return result.translatedText || text;

    } catch (error) {
        console.error('Erro na tradução:', error);
        return text;
    }
}

// ===== FUNÇÕES DE NAVEGAÇÃO =====
function switchMode(modeId) {
    // Esconde todos os modos
    document.querySelectorAll('.app-mode').forEach(mode => {
        mode.classList.remove('active');
    });
    
    // Mostra o modo solicitado
    document.getElementById(modeId).classList.add('active');
}

// ===== FUNÇÃO PARA SOLICITAÇÃO DE PERMISSÕES =====
async function requestMediaPermissions() {
    try {
        // Solicita acesso à câmera e microfone
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
        });
        
        // Para as tracks imediatamente (apenas queríamos a permissão)
        stream.getTracks().forEach(track => track.stop());
        
        return true;
        
    } catch (error) {
        console.error('Erro ao acessar dispositivos:', error);
        return false;
    }
}

// ===== FUNÇÃO PARA GERAR QR CODE =====
function generateQRCode(name) {
    // Obtém os parâmetros da URL atual (enviados pelo app Flutter)
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token'); // Token do Firebase
    const browserFullLang = navigator.language || 'pt-BR';
    
    // Gera ID fixo com últimos 7 dígitos do token
    const fixedId = token ? token.slice(-7) : 'unknown';
    
    // URL com TODOS os parâmetros necessários para o caller
    const fullUrl = `https://lemur-interface-traducao.netlify.app/caller.html?token=${encodeURIComponent(token || '')}&browserId=${encodeURIComponent(fixedId)}&lang=${encodeURIComponent(browserFullLang)}&name=${encodeURIComponent(name || 'User')}`;
    
    console.log("QR Code URL:", fullUrl);
    
    // Gera o QR code
    QRCodeGenerator.generate("qrcode-modal", fullUrl, 200);
    document.getElementById('url-content-modal').textContent = fullUrl;
}

// ===== FUNÇÃO PARA INICIALIZAR WEBRTC =====
async function initializeWebRTC() {
    try {
        // ✅ USA A STREAM JÁ AUTORIZADA (não pede permissão de novo)
        const localStream = window.authorizedStream;
        
        if (!localStream) {
            throw new Error('Stream de câmera não disponível');
        }

        // Obtém o token da URL (enviado pelo app Flutter)
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        
        // Gera ID FIXO com últimos 7 dígitos do token
        const fixedId = token ? token.slice(-7) : crypto.randomUUID().substr(0, 7);
        
        // Inicializa WebRTC com ID FIXO
        const rtcCore = new WebRTCCore();
        
        // 🔥 REGISTRA NO SERVER COM ID FIXO
        rtcCore.initialize(fixedId);
        
        // Exibe o ID fixo para conexão
        document.getElementById('myId').textContent = fixedId;
        console.log("📡 Registrado no servidor com ID:", fixedId);

        // Configura callback para stream remoto
        rtcCore.setRemoteStreamCallback((remoteStream) => {
            // Silencia áudio recebido (se houver)
            remoteStream.getAudioTracks().forEach(track => track.enabled = false);
            
            // Exibe vídeo remoto no PIP
            document.getElementById('localVideo').srcObject = remoteStream;
            console.log("✅ Conexão WebRTC estabelecida!");
        });

        // Handler para chamadas recebidas
        rtcCore.onIncomingCall = (offer) => {
            console.log("📞 Chamada recebida!", offer);
            
            if (!localStream) {
                console.warn("Stream local não disponível");
                return;
            }

            rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
                console.log("✅ Chamada atendida com sucesso!");
            });
        };

        console.log("🟢 WebRTC inicializado. Aguardando conexão...");

    } catch (error) {
        console.error("❌ Erro no WebRTC:", error);
        alert("Erro na conexão. Recarregue a página.");
    }
}

// ===== CÓDIGO PRINCIPAL =====
document.addEventListener('DOMContentLoaded', async () => {
    // Elementos da interface
    const nextButtonWelcome = document.getElementById('next-button-welcome');
    const nextButtonQrcode = document.getElementById('next-button-qrcode');
    const nameInput = document.getElementById('name-input');
    const welcomeScreen = document.getElementById('welcome-screen');
    const loaderContainer = document.getElementById('loader-container');
    const cameraCheckbox = document.getElementById('camera-checkbox');
    const microphoneCheckbox = document.getElementById('microphone-checkbox');
    
    // Variáveis de estado
    let cameraGranted = false;
    let microphoneGranted = false;
    let userName = '';

    // Processo de tradução inicial
    const browserLang = (navigator.language || 'en').split('-')[0];
    
    // Mostra loader durante tradução
    loaderContainer.style.display = 'flex';

    // Traduz textos da primeira tela
    for (const [elementId, text] of Object.entries(textsToTranslateWelcome)) {
        try {
            const translated = await translateText(text, browserLang);
            const element = document.getElementById(elementId);

            if (element) {
                if (elementId === 'name-input') {
                    element.placeholder = translated;
                } else if (elementId === 'next-button-welcome') {
                    element.textContent = translated;
                } else {
                    element.textContent = translated;
                }
            }
        } catch (error) {
            console.error(`Erro ao traduzir ${elementId}:`, error);
        }
    }

    // Traduz textos da segunda tela
    for (const [elementId, text] of Object.entries(textsToTranslateQR)) {
        try {
            const translated = await translateText(text, browserLang);
            const element = document.getElementById(elementId);

            if (element) {
                element.textContent = translated;
            }
        } catch (error) {
            console.error(`Erro ao traduzir ${elementId}:`, error);
        }
    }

    // Esconde o loader
    loaderContainer.style.display = 'none';

    // Event listener para os checkboxes
    cameraCheckbox.addEventListener('click', async () => {
        cameraGranted = await requestMediaPermissions();
        if (cameraGranted) {
            cameraCheckbox.classList.add('checked');
        } else {
            cameraCheckbox.classList.remove('checked');
        }
    });

    microphoneCheckbox.addEventListener('click', async () => {
        microphoneGranted = await requestMediaPermissions();
        if (microphoneGranted) {
            microphoneCheckbox.classList.add('checked');
        } else {
            microphoneCheckbox.classList.remove('checked');
        }
    });

    // Event listener para o botão Next da tela de boas-vindas
    nextButtonWelcome.addEventListener('click', async () => {
        userName = nameInput.value.trim();
        let hasError = false;

        if (!userName) {
            hasError = true;
        }

        if (!cameraGranted || !microphoneGranted) {
            hasError = true;
        }

        if (hasError) {
            welcomeScreen.classList.add('error-state');
            setTimeout(() => {
                welcomeScreen.classList.remove('error-state');
            }, 1000);
            return;
        }

        // ✅ CAPTURA A STREAM DA CÂMERA JÁ AUTORIZADA!
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: false 
            });
            
            // 🔥 GUARDA A STREAM PARA USAR DEPOIS!
            window.authorizedStream = stream;
            
            // Avança para a tela de QR Code
            switchMode('qrcode-mode');
            generateQRCode(userName);
            
        } catch (error) {
            console.error('Erro ao acessar câmera:', error);
            alert('Erro ao acessar a câmera. Por favor, recarregue a página.');
        }
    });

    // Event listener para o botão da tela de QR Code
    nextButtonQrcode.addEventListener('click', () => {
        // Avança para a tela de comunicação WebRTC
        switchMode('communication-mode');
        initializeWebRTC();
    });
});
