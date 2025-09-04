// ===== CÓDIGO DE TRADUÇÃO =====
const TRANSLATE_ENDPOINT = 'https://chat-tradutor.onrender.com/translate';
const FIREBASE_API_URL = 'https://seu-servidor-firebase.com/check-online';
const LANGUAGE_FLAGS_URL = 'assets/bandeiras/language-flags.json'; // ✅ SEU JSON

// ✅ VARIÁVEL GLOBAL PARA BANDEIRAS
let languageFlags = {};

// ✅ CARREGAR BANDEIRAS DO JSON
async function loadLanguageFlags() {
    try {
        const response = await fetch(LANGUAGE_FLAGS_URL);
        languageFlags = await response.json();
    } catch (error) {
        console.error('Erro ao carregar bandeiras:', error);
        // ✅ FALLBACK PARA BANDEIRAS BÁSICAS
        languageFlags = {
            'en': '🇺🇸', 'es': '🇪🇸', 'pt': '🇧🇷', 'fr': '🇫🇷', 
            'de': '🇩🇪', 'it': '🇮🇹', 'ja': '🇯🇵', 'zh': '🇨🇳',
            'ru': '🇷🇺', 'ar': '🇸🇦', 'hi': '🇮🇳', 'ko': '🇰🇷'
        };
    }
}

// ✅ OBTER BANDEIRA CORRETA (função melhorada)
function getLanguageFlag(langCode) {
    if (!langCode) return '🌐';
    
    // Tenta encontrar exato primeiro
    if (languageFlags[langCode]) {
        return languageFlags[langCode];
    }
    
    // Tenta encontrar pelo código base (ex: 'es' para 'es-MX')
    const baseLang = langCode.split('-')[0];
    if (languageFlags[baseLang]) {
        return languageFlags[baseLang];
    }
    
    // Se não encontrar, retorna bandeira genérica
    return '🌐';
}

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
    "send-button": "SEND🚀"
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

async function checkUserOnline(targetBrowserId, firebaseToken) {
    try {
        const response = await fetch(FIREBASE_API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                targetBrowserId: targetBrowserId,
                token: firebaseToken
            })
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
            body: JSON.stringify({
                targetBrowserId: targetBrowserId,
                token: firebaseToken
            })
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

async function requestMediaPermissions() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
            video: true, 
            audio: true 
        });
        stream.getTracks().forEach(track => track.stop());
        return true;
    } catch (error) {
        console.error('Erro ao acessar dispositivos:', error);
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

// ===== WEBRTC =====
async function setupWebRTC() {
    try {
        // ✅ CARREGAR BANDEIRAS PRIMEIRO
        await loadLanguageFlags();
        
        // EXTRAIR DADOS DA URL
        const urlParams = new URLSearchParams(window.location.search);
        const targetBrowserId = urlParams.get('browserid');
        const firebaseToken = urlParams.get('token');
        const userLang = urlParams.get('lang');
        const userName = urlParams.get('name') || 'Usuário';
        
        // ✅ USAR FUNÇÃO MELHORADA PARA BANDEIRA
        const userFlag = getLanguageFlag(userLang);
        
        // ATUALIZAR BOX DE VÍDEO COM DADOS DO USUÁRIO
        const userNameDisplay = document.getElementById('user-name-display');
        const userLanguageDisplay = document.querySelector('.user-language');
        
        if (userNameDisplay) userNameDisplay.textContent = userName;
        if (userLanguageDisplay) userLanguageDisplay.textContent = userFlag;

        const WebRTCCore = await import('../core/webrtc-core.js');
        const rtcCore = new WebRTCCore.default();
        const myId = crypto.randomUUID().substr(0, 8);
        rtcCore.initialize(myId);
        rtcCore.setupSocketHandlers();

        let localStream = null;

        try {
            localStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: false 
            });
        } catch (error) {
            console.error("Erro ao acessar a câmera:", error);
        }

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
            
            rtcCore.startCall(targetBrowserId, localStream);
        });

        rtcCore.setRemoteStreamCallback(remoteStream => {
            remoteStream.getAudioTracks().forEach(track => track.enabled = false);
            const remoteVideo = document.getElementById('remoteVideo');
            if (remoteVideo) {
                remoteVideo.srcObject = remoteStream;
            }
        });
    } catch (error) {
        console.error('Erro ao carregar WebRTC:', error);
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

        switchMode('main-mode');
        document.getElementById('user-name-display').textContent = userName;
        startAdCycle();
        
        for (const [elementId, text] of Object.entries(textsToTranslateMain)) {
            try {
                const translated = await translateText(text, browserLang);
                const element = document.getElementById(elementId);
                if (element) element.textContent = translated;
            } catch (error) {
                console.error(`Erro ao traduzir ${elementId}:`, error);
            }
        }

        setTimeout(setupWebRTC, 1000);
    });
}

// ✅ CARREGAR BANDEIRAS AO INICIAR
loadLanguageFlags();
window.onload = initApp;
