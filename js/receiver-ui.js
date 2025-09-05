// ===== IMPORTAÇÕES =====
import { QRCodeGenerator } from './qr-code-utils.js';
import WebRTCCore from '../core/webrtc-core.js';

// ===== VARIÁVEIS GLOBAIS WEBRTC =====
let rtcCore = null;
let myFixedId = ''; // ✅ ID FIXO (8 dígitos do token)

// ===== CONFIGURAÇÃO DE TRADUÇÃO =====
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
    document.querySelectorAll('.app-mode').forEach(mode => {
        mode.classList.remove('active');
    });
    document.getElementById(modeId).classList.add('active');
}

// ===== FUNÇÃO PARA SOLICITAÇÃO DE PERMISSÕES (PADRÃO) =====
async function requestMediaPermissions(type) {
    try {
        const constraints = { 
            video: type === 'camera', 
            audio: type === 'microphone' 
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (error) {
        console.error(`Erro ao acessar ${type}:`, error);
        return false;
    }
}

// ===== FUNÇÃO PARA GERAR QR CODE =====
function generateQRCode(name) {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const browserFullLang = navigator.language || 'pt-BR';
    
    // ✅ CORREÇÃO: Usar EXATAMENTE os 8 dígitos do token (igual ao QR code)
    myFixedId = token ? token.slice(-8) : 'unknown';
    
    const fullUrl = `https://lemur-interface-traducao.netlify.app/caller.html?token=${encodeURIComponent(token || '')}&browserid=${encodeURIComponent(myFixedId)}&lang=${encodeURIComponent(browserFullLang)}&name=${encodeURIComponent(name || 'User')}`;
    
    console.log("QR Code URL:", fullUrl);
    console.log("Receiver ID:", myFixedId); // ✅ Deve ser "936ff2cd"
    
    QRCodeGenerator.generate("qrcode-modal", fullUrl, 200);
    document.getElementById('url-content-modal').textContent = fullUrl;
}

// ===== FUNÇÃO PARA INICIALIZAR WEBRTC =====
async function initializeWebRTC() {
    try {
        // ✅ CORREÇÃO: Inicializar WebRTC CORRETAMENTE
        rtcCore = new WebRTCCore();
        rtcCore.initialize(myFixedId);
        rtcCore.setupSocketHandlers(); // ✅ CONFIGURAR HANDLERS PRIMEIRO
        
        // ✅ Configurar handler de chamadas entrantes
        rtcCore.onIncomingCall = (offer) => {
            handleIncomingCall(offer, window.authorizedStream);
        };
        
        // ✅ Usar stream autorizada
        const localStream = window.authorizedStream;
        
        if (!localStream) {
            throw new Error('Stream de câmera não disponível');
        }
        
        // ✅ Mostrar próprio vídeo
        const localVideo = document.getElementById('localVideo');
        if (localVideo) localVideo.srcObject = localStream;
        
        // ✅ Mensagem de status
        const statusElement = document.getElementById('myId');
        if (statusElement) {
            statusElement.textContent = `ID: ${myFixedId} (Aguardando conexão...)`;
        }
        
        console.log("✅ WebRTC inicializado. Aguardando chamadas... ID:", myFixedId);

    } catch (error) {
        console.error("❌ Erro ao inicializar WebRTC:", error);
        const statusElement = document.getElementById('myId');
        if (statusElement) {
            statusElement.textContent = "Erro na conexão. Recarregue a página.";
        }
    }
}

// ===== FUNÇÃO PARA LIDAR COM CHAMADAS ENTRANTES =====
async function handleIncomingCall(offer, localStream) {
    if (!localStream) {
        console.error("Stream local não disponível!");
        return;
    }

    rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
        // 🔇 Silencia áudio recebido
        remoteStream.getAudioTracks().forEach(track => track.enabled = false);
        
        // ✅ Exibe vídeo remoto
        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo) {
            remoteVideo.srcObject = remoteStream;
            remoteVideo.style.display = 'block';
        }
        
        // ✅ Oculta imagem estática
        const staticImage = document.querySelector('.camera-feed');
        if (staticImage) staticImage.style.display = 'none';
        
        // ✅ Oculta QR code
        const qrElement = document.getElementById('qrcode-modal');
        if (qrElement) qrElement.style.display = 'none';
        
        // ✅ Atualiza status
        const statusElement = document.getElementById('myId');
        if (statusElement) {
            statusElement.textContent = `ID: ${myFixedId} (Conectado)`;
        }
        
        console.log("✅ Conexão WebRTC estabelecida!");
    });
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

    // ===== PROCESSO DE TRADUÇÃO =====
    const browserLang = (navigator.language || 'en').split('-')[0];
    loaderContainer.style.display = 'flex';

    // Traduz textos da primeira tela
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

    // Traduz textos da segunda tela
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

    // Event listeners
    cameraCheckbox.addEventListener('click', async () => {
        cameraGranted = await requestMediaPermissions('camera');
        cameraCheckbox.classList.toggle('checked', cameraGranted);
    });

    microphoneCheckbox.addEventListener('click', async () => {
        microphoneGranted = await requestMediaPermissions('microphone');
        microphoneCheckbox.classList.toggle('checked', microphoneGranted);
    });

    nextButtonWelcome.addEventListener('click', async () => {
        userName = nameInput.value.trim();
        let hasError = false;

        if (!userName) hasError = true;
        if (!cameraGranted || !microphoneGranted) hasError = true;

        if (hasError) {
            welcomeScreen.classList.add('error-state');
            setTimeout(() => welcomeScreen.classList.remove('error-state'), 1000);
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: false 
            });
            
            window.authorizedStream = stream;
            switchMode('qrcode-mode');
            generateQRCode(userName);
            
        } catch (error) {
            console.error('Erro ao acessar câmera:', error);
            alert('Erro ao acessar a câmera. Por favor, recarregue a página.');
        }
    });

    nextButtonQrcode.addEventListener('click', () => {
        switchMode('communication-mode');
        
        // ✅ Exibir ID fixo (8 dígitos do token)
        const userIdDisplay = document.createElement('div');
        userIdDisplay.className = 'user-id-display';
        userIdDisplay.id = 'myId';
        userIdDisplay.textContent = `Seu ID: ${myFixedId}`;
        
        const boxPrincipal = document.querySelector('#communication-mode .box-principal');
        if (boxPrincipal) {
            const firstChild = boxPrincipal.firstChild;
            boxPrincipal.insertBefore(userIdDisplay, firstChild);
        }
        
        document.getElementById('user-name-display').textContent = userName;
        initializeWebRTC();
    });
});
