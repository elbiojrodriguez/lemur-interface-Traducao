// ===== CÓDIGO DE TRADUÇÃO =====
const TRANSLATE_ENDPOINT = 'https://chat-tradutor.onrender.com/translate';

const textsToTranslateWelcome = {
    <h2 id="welcome-title">Welcome!</h2>,
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

// ===== FUNÇÕES DE NAVEGAÇÃO =====
function switchMode(modeId) {
    document.querySelectorAll('.app-mode').forEach(mode => {
        mode.classList.remove('active');
    });
    document.getElementById(modeId).classList.add('active');
}

// ===== FUNÇÃO PARA SOLICITAÇÃO DE PERMISSÕES =====
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

// ===== FUNÇÃO DE INICIALIZAÇÃO =====
async function initApp() {
    // Configurar evento do botão Next da tela de boas-vindas
    const nextButtonWelcome = document.getElementById('next-button-welcome');
    const nameInput = document.getElementById('name-input');
    const welcomeScreen = document.getElementById('welcome-screen');
    const cameraCheckbox = document.getElementById('camera-checkbox');
    const microphoneCheckbox = document.getElementById('microphone-checkbox');
    
    let cameraGranted = false;
    let microphoneGranted = false;
    let userName = '';

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

    // Event listeners para checkboxes
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

    // Event listener para o botão Next
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

        // Mudar para tela principal
        switchMode('main-mode');
        
        // Atualizar nome do usuário na tela principal
        document.getElementById('user-name-display').textContent = userName;
        
        // Iniciar anúncios e traduzir tela principal
        startAdCycle();
        
        // Traduzir textos da tela principal
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
    });

    // Configurar evento do botão SEND da tela principal
    document.getElementById('send-button').addEventListener('click', function() {
        alert('Mensagem enviada! (Funcionalidade será implementada)');
    });
}

// ===== INICIAR APLICAÇÃO =====
window.onload = initApp;
