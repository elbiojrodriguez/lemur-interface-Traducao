// ===== WEBSRTC CORE - PRIORIDADE MÁXIMA =====
// 1. ✅ WEBSRTC PRIMEIRO (antes de tudo)
const rtcCore = new WebRTCCore();

// ===== GERADOR DE ID ALEATÓRIO PARA CALLER =====
function generateCallerId() {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
}

// ===== OBTÉM ID DO RECEIVER DA URL =====
function getReceiverIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('browserId');
}

// ✅ INICIALIZA WEBSRTC COM ID ALEATÓRIO
const myCallerId = generateCallerId();
rtcCore.initialize(myCallerId);
rtcCore.setupSocketHandlers();

// ===== CONEXÃO AUTOMÁTICA =====
let connectionAttempts = 0;
const maxConnectionAttempts = 5;

function attemptAutomaticConnection(localStream) {
    const receiverTargetId = getReceiverIdFromURL();
    
    if (!receiverTargetId) {
        console.log("⏳ Aguardando ID do receiver...");
        if (connectionAttempts < maxConnectionAttempts) {
            connectionAttempts++;
            setTimeout(() => attemptAutomaticConnection(localStream), 1000);
        }
        return;
    }

    console.log("🔗 Conectando automaticamente ao receiver:", receiverTargetId);
    rtcCore.startCall(receiverTargetId, localStream);
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

const textsToTranslateMain = {
    "Instant-title": "Live translation. No filters. No platform.",
    "send-button": "SEND🚀",
    "user-name-display": "User",
    "message-input": "Type your message...",
    "connection-status": "Connection status:",
    "connecting": "Connecting...",
    "connected": "Connected!",
    "failed": "Connection failed"
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

// ===== CÓDIGO DOS ANÚNCIOS =====
let topAdVisible = false;
let bottomAdVisible = false;
let topAdClosed = false;
let bottomAdClosed = false;
let adInterval;

function startAdCycle() {
    setTimeout(() => {
        showAds();
        adInterval = setInterval(() => {
            hideAds();
            setTimeout(showAds, 2000);
        }, 7000);
    }, 5000);
}

function showAds() {
    if (!topAdClosed) {
        const topAd = document.getElementById('ad-top');
        topAd.classList.add('visible');
        topAdVisible = true;
    }
    if (!bottomAdClosed) {
        const bottomAd = document.getElementById('ad-bottom');
        bottomAd.classList.add('visible');
        bottomAdVisible = true;
    }
}

function hideAds() {
    if (topAdVisible) {
        const topAd = document.getElementById('ad-top');
        topAd.classList.remove('visible');
        topAdVisible = false;
    }
    if (bottomAdVisible) {
        const bottomAd = document.getElementById('ad-bottom');
        bottomAd.classList.remove('visible');
        bottomAdVisible = false;
    }
}

function closeAd(position) {
    if (position === 'top') {
        const topAd = document.getElementById('ad-top');
        topAd.classList.remove('visible');
        topAdVisible = false;
        topAdClosed = true;
    } else if (position === 'bottom') {
        const bottomAd = document.getElementById('ad-bottom');
        bottomAd.classList.remove('visible');
        bottomAdVisible = false;
        bottomAdClosed = true;
    }
    if (topAdClosed && bottomAdClosed) {
        clearInterval(adInterval);
    }
}

// ===== CONFIGURAÇÃO DE HANDLERS WEBSRTC =====
rtcCore.setRemoteStreamCallback(stream => {
    document.getElementById('remoteVideo').srcObject = stream;
    updateConnectionStatus('connected');
});

rtcCore.onCallEnded = () => {
    console.log("📞 Chamada finalizada");
    updateConnectionStatus('waiting');
    document.getElementById('remoteVideo').srcObject = null;
};

function updateConnectionStatus(status) {
    const statusElement = document.getElementById('connection-status');
    if (statusElement) {
        const texts = {
            'waiting': 'Aguardando conexão...',
            'connecting': 'Conectando...',
            'connected': 'Conectado!',
            'failed': 'Conexão falhou'
        };
        statusElement.textContent = `Status: ${texts[status] || status}`;
    }
}

// ===== FUNÇÃO DE INICIALIZAÇÃO =====
async function initApp() {
    const nextButtonWelcome = document.getElementById('next-button-welcome');
    const nameInput = document.getElementById('name-input');
    const welcomeScreen = document.getElementById('welcome-screen');
    const cameraCheckbox = document.getElementById('camera-checkbox');
    const microphoneCheckbox = document.getElementById('microphone-checkbox');
    
    let cameraGranted = false;
    let microphoneGranted = false;
    let userName = '';
    let localStream = null;

    // Traduzir textos da tela de boas-vindas
    const browserLang = (navigator.language || 'en').split('-')[0];
    
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
            localStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            
            document.getElementById('localVideo').srcObject = localStream;
            switchMode('main-mode');
            document.getElementById('user-name-display').textContent = userName;
            startAdCycle();
            updateConnectionStatus('connecting');
            
            // ✅ CONEXÃO AUTOMÁTICA (sem botão!)
            attemptAutomaticConnection(localStream);
            
            // TRADUZIR TEXTO DA TELA PRINCIPAL
            for (const [elementId, text] of Object.entries(textsToTranslateMain)) {
                try {
                    const translated = await translateText(text, browserLang);
                    const element = document.getElementById(elementId);
                    if (element) {
                        if (elementId === 'message-input') {
                            element.placeholder = translated;
                        } else {
                            element.textContent = translated;
                        }
                    }
                } catch (error) {
                    console.error(`Erro ao traduzir ${elementId}:`, error);
                }
            }

        } catch (error) {
            console.error('Erro ao acessar dispositivos:', error);
            alert('Erro ao acessar os dispositivos. Recarregue a página.');
        }
    });

    // Configurar evento do botão SEND
    document.getElementById('send-button').addEventListener('click', function() {
        alert('Mensagem enviada! (Funcionalidade será implementada)');
    });
}

// ===== INICIAR APLICAÇÃO =====
window.onload = initApp;
