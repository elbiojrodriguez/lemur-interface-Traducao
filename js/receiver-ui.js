// ===== IMPORTAÇÕES =====
import { QRCodeGenerator } from './qr-code-utils.js';
import WebRTCCore from '../core/webrtc-core.js'; // ✅ ADICIONAR ESTA LINHA

// ===== VARIÁVEIS GLOBAIS WEBRTC =====
let rtcCore = null;
let myFixedId = ''; // ✅ ID FIXO (7 dígitos do token)

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
    
    // ✅ CORREÇÃO 1: Usar ID consistente (igual ao caller)
    myFixedId = crypto.randomUUID().substr(0, 8); // ✅ Igual ao caller
    
    // ✅ CORREÇÃO: "browserid" (com i minúsculo)
    const fullUrl = `https://lemur-interface-traducao.netlify.app/caller.html?token=${encodeURIComponent(token || '')}&browserid=${encodeURIComponent(myFixedId)}&lang=${encodeURIComponent(browserFullLang)}&name=${encodeURIComponent(name || 'User')}`;
    
    console.log("QR Code URL:", fullUrl);
    
    // ✅ CORREÇÃO: Usar QRCodeGenerator em vez de QRCode
    QRCodeGenerator.generate("qrcode-modal", fullUrl, 200);
    
    document.getElementById('url-content-modal').textContent = fullUrl;
}

// ===== FUNÇÃO PARA INICIALIZAR WEBRTC =====
async function initializeWebRTC() {
    try {
        // ✅ CORREÇÃO 2: Garantir que os socket handlers estão configurados
        rtcCore = new WebRTCCore();
        rtcCore.initialize(myFixedId);
        rtcCore.setupSocketHandlers(); // ✅ ISSO É CRÍTICO
        
        // ✅ Configurar o handler DEVE ser feito após setupSocketHandlers
        rtcCore.onIncomingCall = (offer) => {
            handleIncomingCall(offer, window.authorizedStream);
        };
        
        // ✅ USA A STREAM JÁ AUTORIZADA
        const localStream = window.authorizedStream;
        
        if (!localStream) {
            throw new Error('Stream de câmera não disponível');
        }
        
        // ✅ MOSTRA O PRÓPRIO VÍDEO (opcional)
        document.getElementById('localVideo').srcObject = localStream;
        
        // ✅ MENSAGEM DE STATUS
        document.getElementById('myId').textContent = `ID: ${myFixedId} (Aguardando conexão...)`;
        console.log("✅ WebRTC inicializado. Aguardando chamadas...");

    } catch (error) {
        console.error("❌ Erro ao inicializar WebRTC:", error);
        document.getElementById('myId').textContent = "Erro na conexão. Recarregue a página.";
    }
}

// ===== FUNÇÃO PARA LIDAR COM CHAMADAS ENTRANTES =====
async function handleIncomingCall(offer, localStream) {
    // ✅ CORREÇÃO 3: Garantir que a stream está disponível
    if (!localStream) {
        console.error("Stream local não disponível!");
        return;
    }

    rtcCore.handleIncomingCall(offer, localStream, (remoteStream) => {
        // 🔇 Silencia áudio recebido
        remoteStream.getAudioTracks().forEach(track => track.enabled = false);
        
        // ✅ EXIBE VÍDEO REMOTO NO BOX
        const remoteVideo = document.getElementById('remoteVideo');
        if (remoteVideo) {
            remoteVideo.srcObject = remoteStream;
            remoteVideo.style.display = 'block';
        }
        
        // ✅ OCULTA IMAGEM ESTÁTICA
        const staticImage = document.querySelector('.camera-feed');
        if (staticImage) staticImage.style.display = 'none';
        
        // ✅ OCULTA ELEMENTOS DESNECESSÁRIOS
        const qrElement = document.getElementById('qrcode-modal');
        if (qrElement) qrElement.style.display = 'none';
        
        // ✅ ATUALIZA STATUS
        document.getElementById('myId').textContent = `ID: ${myFixedId} (Conectado)`;
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
    // ===== FIM DA TRADUÇÃO =====

    // Event listener para os checkboxes (PADRÃO)
    cameraCheckbox.addEventListener('click', async () => {
        cameraGranted = await requestMediaPermissions('camera');
        cameraCheckbox.classList.toggle('checked', cameraGranted);
    });

    microphoneCheckbox.addEventListener('click', async () => {
        microphoneGranted = await requestMediaPermissions('microphone');
        microphoneCheckbox.classList.toggle('checked', microphoneGranted);
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

        try {
            // ✅ SOLICITA APENAS VÍDEO (igual ao primeiro arquivo)
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

    // Event listener para o botão da tela de QR Code
    nextButtonQrcode.addEventListener('click', () => {
        switchMode('communication-mode');
        
        // ✅ GERA E EXIBE O ID DE 8 DÍGITOS (consistente com caller)
        const userIdDisplay = document.createElement('div');
        userIdDisplay.className = 'user-id-display';
        userIdDisplay.id = 'myId';
        userIdDisplay.textContent = `Seu ID: ${myFixedId}`;
        
        // Adiciona o ID display no início do box-principal
        const boxPrincipal = document.querySelector('#communication-mode .box-principal');
        const firstChild = boxPrincipal.firstChild;
        boxPrincipal.insertBefore(userIdDisplay, firstChild);
        
        // Também exibe o nome do usuário
        document.getElementById('user-name-display').textContent = userName;
        
        // ✅ INICIALIZA WEBRTC
        initializeWebRTC();
    });
});
