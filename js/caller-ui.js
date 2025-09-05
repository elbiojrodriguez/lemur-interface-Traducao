// ===== CONFIGURAÇÕES =====
const TRANSLATE_ENDPOINT = 'https://chat-tradutor.onrender.com/translate';
const FIREBASE_API_URL = 'https://seu-servidor-firebase.com/check-online';
const LANGUAGE_FLAGS_URL = 'assets/bandeiras/language-flags.json';

let languageFlags = {};
let rtcCore = null;

// ===== TRADUÇÃO =====
const textsToTranslateWelcome = {
    "welcome-title": "Welcome!", 
    "translator-label-welcome": "Live translation. No filters. No platform.",
    "name-input": "Your name", 
    "next-button-welcome": "Next", 
    "camera-text": "Allow camera access",
    "microphone-text": "Allow microphone access"
};

// ✅ TEXTOS DA SEGUNDA TELA COM IDs ÚNICOS
const textsToTranslateMain = {
    "translator-label-main": "Live translation. No filters. No platform.",
    "callActionBtn": "SEND🚀"
};

async function translateText(text, targetLang) {
    if (targetLang === 'en') return text;
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
        return text;
    }
}

async function loadLanguageFlags() {
    try {
        const response = await fetch(LANGUAGE_FLAGS_URL);
        languageFlags = await response.json();
    } catch (error) {
        console.error('Erro ao carregar bandeiras:', error);
        languageFlags = {
            'en':'🇺🇸','es':'🇪🇸','pt':'🇧🇷','fr':'🇫🇷','de':'🇩🇪',
            'it':'🇮🇹','ja':'🇯🇵','zh':'🇨🇳','ru':'🇷🇺','ar':'🇸🇦',
            'hi':'🇮🇳','ko':'🇰🇷'
        };
    }
}

function getLanguageFlag(langCode) {
    if (!langCode) return '🌐';
    if (languageFlags[langCode]) return languageFlags[langCode];
    const baseLang = langCode.split('-')[0];
    return languageFlags[baseLang] || '🌐';
}

// ✅ FUNÇÃO PARA TRADUZIR SEGUNDA TELA
async function translateMainScreen(browserLang) {
    for (const [elementId, text] of Object.entries(textsToTranslateMain)) {
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

function sendUserMetadata(targetId, userName, userLang) {
    if (window.socket) {
        window.socket.emit('user-metadata', { 
            to: targetId, 
            name: userName, 
            lang: userLang 
        });
    }
}

async function checkUserOnline(targetBrowserId, firebaseToken) {
    try {
        const response = await fetch(FIREBASE_API_URL, {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetBrowserId, token: firebaseToken })
        });
        const result = await response.json();
        return result.isOnline;
    } catch (error) {
        console.error('Erro ao verificar online:', error);
        return false;
    }
}

async function wakeUpUser(targetBrowserId, firebaseToken) {
    try {
        await fetch('https://seu-servidor-firebase.com/wake-up', {
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetBrowserId, token: firebaseToken })
        });
    } catch (error) {
        console.error('Erro ao acordar usuário:', error);
    }
}

function switchMode(modeId) {
    document.querySelectorAll('.app-mode').forEach(mode => {
        mode.classList.remove('active');
    });
    document.getElementById(modeId).classList.add('active');
}

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

// ===== WEBRTC =====
async function setupWebRTC() {
    try {
        // ✅ MOSTRAR LOADER E TEXTO "Conectando..."
        const connectionStatus = document.querySelector('.connection-status');
        const connectionText = document.getElementById('connection-text');
        connectionText.textContent = 'Conectando...';
        connectionStatus.classList.remove('error', 'connected');
        
        await loadLanguageFlags();
        
        const urlParams = new URLSearchParams(window.location.search);
        const targetBrowserId = urlParams.get('browserid');
        const firebaseToken = urlParams.get('token');
        const userLang = urlParams.get('lang');
        const userName = urlParams.get('name') || 'Usuário';
        
        const browserLang = (navigator.language || 'en').split('-')[0];
        
        // ✅ TRADUZIR SEGUNDA TELA
        await translateMainScreen(browserLang);
        
        const userFlag = getLanguageFlag(userLang);
        document.getElementById('user-name-display').textContent = userName;
        document.querySelector('.user-language').textContent = userFlag;

        rtcCore = new window.WebRTCCore();
        const myId = crypto.randomUUID().substr(0, 8);
        rtcCore.initialize(myId);
        rtcCore.setupSocketHandlers();

        const localStream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: false 
        });

        if (targetBrowserId) {
            document.getElementById('callActionBtn').style.display = 'block';
        }

        document.getElementById('callActionBtn').addEventListener('click', async function() {
            if (!targetBrowserId || !localStream) return;
            
            const isOnline = await checkUserOnline(targetBrowserId, firebaseToken);
            if (!isOnline) {
                await wakeUpUser(targetBrowserId, firebaseToken);
                alert('Usuário está offline. Enviando notificação...');
                return;
            }
            
            sendUserMetadata(targetBrowserId, userName, userLang);
            rtcCore.startCall(targetBrowserId, localStream);
        });

        rtcCore.setRemoteStreamCallback(remoteStream => {
            remoteStream.getAudioTracks().forEach(track => track.enabled = false);
            const remoteVideo = document.getElementById('remoteVideo');
            if (remoteVideo) remoteVideo.srcObject = remoteStream;
            
            // ✅ CONEXÃO ESTABELECIDA - MOSTRAR "Conectado!"
            connectionText.textContent = 'Conectado!';
            connectionStatus.classList.add('connected');
        });
        
    } catch (error) {
        console.error('Erro no WebRTC:', error);
        // ✅ ERRO NA CONEXÃO
        const connectionText = document.getElementById('connection-text');
        connectionText.textContent = 'Erro na conexão. Tente novamente.';
        document.querySelector('.connection-status').classList.add('error');
    }
}

// ===== INICIALIZAÇÃO =====
async function initApp() {
    await loadLanguageFlags();
    
    const nextButtonWelcome = document.getElementById('next-button-welcome');
    const nameInput = document.getElementById('name-input');
    const welcomeScreen = document.getElementById('welcome-screen');
    const cameraCheckbox = document.getElementById('camera-checkbox');
    const microphoneCheckbox = document.getElementById('microphone-checkbox');
    
    let cameraGranted = false;
    let microphoneGranted = false;
    let userName = '';

    const browserLang = (navigator.language || 'en').split('-')[0];
    
    // ✅ TRADUZIR PRIMEIRA TELA
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
        if (!userName || !cameraGranted || !microphoneGranted) {
            welcomeScreen.classList.add('error-state');
            setTimeout(() => welcomeScreen.classList.remove('error-state'), 1000);
            return;
        }

        switchMode('main-mode');
        document.getElementById('user-name-display').textContent = userName;
        
        // ✅ REMOVER: setTimeout(setupWebRTC, 1000);
        // ✅ ADICIONAR: Iniciar WebRTC IMEDIATAMENTE
        setupWebRTC();
    });
}

window.addEventListener('load', initApp);
