// ===== IMPORTAÇÃO DO QR CODE =====
import { QRCodeGenerator } from './qr-code-utils.js';

// ===== IDENTIFICAÇÃO IMEDIATA DO HTML VIA TOKEN =====
const urlParams = new URLSearchParams(window.location.search);
const token = urlParams.get('token');
const fixedId = token ? token.slice(-8) : 'unknown';
window.fixedId = fixedId;

console.log("🆔 ID fixo gerado na carga:", fixedId);

// ===== WEBSRTC CORE - EM SEGUNDO PLANO =====
// ✅ Agora não bloqueia a interface!
let rtcCore = null;

function initializeWebRTCInBackground() {
    return new Promise((resolve) => {
        setTimeout(() => {
            rtcCore = new WebRTCCore();
            rtcCore.initialize(window.fixedId);
            rtcCore.setupSocketHandlers();
            console.log("✅ WebRTC inicializado em background");
            resolve(rtcCore);
        }, 100); // Pequeno delay para não bloquear a UI
    });
}

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

const textsToTranslateWebRTC = {
    "myId": "Your ID:",
    "connection-status": "Connection status:",
    "caller-waiting": "Waiting for connection...",
    "caller-connected": "Connected!",
    "caller-failed": "Connection failed"
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
    document.querySelectorAll('.app-mode').forEach(mode => {
        mode.classList.remove('active');
    });
    document.getElementById(modeId).classList.add('active');
}

// ===== FUNÇÕES PARA SOLICITAÇÃO DE PERMISSÕES ESPECÍFICAS =====
async function requestCameraPermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: false 
        });
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (error) {
        console.error('Erro ao acessar câmera:', error);
        return false;
    }
}

async function requestMicrophonePermission() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: false, 
            audio: true 
        });
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (error) {
        console.error('Erro ao acessar microfone:', error);
        return false;
    }
}

// ===== FUNÇÃO PARA GERAR QR CODE =====
function generateQRCode(name) {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const browserFullLang = navigator.language || 'pt-BR';
    
    const fullUrl = `https://lemur-interface-traducao.netlify.app/caller.html?token=${encodeURIComponent(token || '')}&browserId=${encodeURIComponent(window.fixedId)}&lang=${encodeURIComponent(browserFullLang)}&name=${encodeURIComponent(name || 'User')}`;
    
    console.log("QR Code URL:", fullUrl);
    QRCodeGenerator.generate("qrcode-modal", fullUrl, 200);
    document.getElementById('url-content-modal').textContent = fullUrl;
}

// ===== CONFIGURAÇÃO DE HANDLERS WEBSRTC =====
function setupWebRTCHandlers() {
    if (!rtcCore) return;
    
    rtcCore.onIncomingCall = (offer) => {
        console.log("📞 Chamada recebida!");
        updateConnectionStatus('connected');
        
        rtcCore.handleIncomingCall(offer, window.authorizedStream, (remoteStream) => {
            document.getElementById('remoteVideo').srcObject = remoteStream;
            console.log("✅ Conexão estabelecida com sucesso!");
        });
    };

    rtcCore.onCallEnded = () => {
        console.log("📞 Chamada finalizada");
        updateConnectionStatus('waiting');
        document.getElementById('remoteVideo').srcObject = null;
    };
}

function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        const texts = {
            'waiting': 'Aguardando conexão...',
            'connected': 'Conectado!',
            'failed': 'Conexão falhou'
        };
        statusElement.textContent = `Status: ${texts[status] || status}`;
    }
}

// ===== CÓDIGO PRINCIPAL =====
document.addEventListener('DOMContentLoaded', async () => {
    const nextButtonWelcome = document.getElementById('next-button-welcome');
    const nextButtonQrcode = document.getElementById('next-button-qrcode');
    const nameInput = document.getElementById('name-input');
    const welcomeScreen = document.getElementById('welcome-screen');
    const loaderContainer = document.getElementById('loader-container');
    const cameraCheckbox = document.getElementById('camera-checkbox');
    const microphoneCheckbox = document.getElementById('microphone-checkbox');
    
    let cameraGranted = false;
    let microphoneGranted = false;
    let userName = '';

    // ✅ INICIALIZA WEBSRTC EM SEGUNDO PLANO (não bloqueia)
    initializeWebRTCInBackground().then(() => {
        setupWebRTCHandlers();
    });

    // Processo de tradução inicial
    const browserLang = (navigator.language || 'en').split('-')[0];
    loaderContainer.style.display = 'flex';

    // Traduzir primeira tela
    for (const [elementId, text] of Object.entries(textsToTranslateWelcome)) {
        try {
            const translated = await translateText(text, browserLang);
            const element = document.getElementById(elementId);
            if (element) {
                if (elementId === 'name-input') {
                    element.placeholder = translated;
                } else {
                    element.textContent = translated;
                }
            }
        } catch (error) {
            console.error(`Erro ao traduzir ${elementId}:`, error);
        }
    }

    // Traduzir segunda tela
    for (const [elementId, text] of Object.entries(textsToTranslateQR)) {
        try {
            const translated = await translateText(text, browserLang);
            const element = document.getElementById(elementId);
            if (element) element.textContent = translated;
        } catch (error) {
            console.error(`Erro ao traduzir ${elementId}:`, error);
        }
    }

    loaderContainer.style.display = 'none';

    // EVENT LISTENERS CORRETOS PARA PERMISSÕES ESPECÍFICAS
    cameraCheckbox.addEventListener('click', async () => {
        cameraGranted = await requestCameraPermission();
        cameraCheckbox.classList.toggle('checked', cameraGranted);
    });

    microphoneCheckbox.addEventListener('click', async () => {
        microphoneGranted = await requestMicrophonePermission();
        microphoneCheckbox.classList.toggle('checked', microphoneGranted);
    });

    // Event listener para o botão Next
    nextButtonWelcome.addEventListener('click', async () => {
        userName = nameInput.value.trim();
        if (!userName || !cameraGranted || !microphoneGranted) {
            welcomeScreen.classList.add('error-state');
            setTimeout(() => welcomeScreen.classList.remove('error-state'), 1000);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            
            window.authorizedStream = stream;
            switchMode('qrcode-mode');
            generateQRCode(userName);
            
        } catch (error) {
            console.error('Erro ao acessar dispositivos:', error);
            alert('Erro ao acessar os dispositivos. Recarregue a página.');
        }
    });

    nextButtonQrcode.addEventListener('click', () => {
        switchMode('communication-mode');
        document.getElementById('localVideo').srcObject = window.authorizedStream;
        document.getElementById('myId').textContent = `ID: ${window.fixedId}`;
        updateConnectionStatus('waiting');
        
        // Traduzir elementos da tela WebRTC
        translateWebRTCTexts();
    });
});

async function translateWebRTCTexts() {
    const browserLang = (navigator.language || 'en').split('-')[0];
    for (const [elementId, text] of Object.entries(textsToTranslateWebRTC)) {
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
}
