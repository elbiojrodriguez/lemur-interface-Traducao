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

// ===== FUNÇÃO PARA GERAR QR CODE =====
function generateQRCode(name) {
    const urlParams = new URLSearchParams(window.location.search);
    const token = urlParams.get('token');
    const browserFullLang = navigator.language || 'pt-BR';
    const fixedId = token ? token.slice(-7) : 'unknown';
    
    const fullUrl = `https://lemur-interface-traducao.netlify.app/caller.html?token=${encodeURIComponent(token || '')}&browserId=${encodeURIComponent(fixedId)}&lang=${encodeURIComponent(browserFullLang)}&name=${encodeURIComponent(name || 'User')}`;
    
    console.log("QR Code URL:", fullUrl);
    
    // Gera o QR code
    new QRCode(document.getElementById("qrcode-modal"), {
        text: fullUrl,
        width: 200,
        height: 200
    });
    
    document.getElementById('url-content-modal').textContent = fullUrl;
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

    // Event listener para o botão da tela de QR Code
    nextButtonQrcode.addEventListener('click', () => {
        switchMode('communication-mode');
        
        // ✅ GERA E EXIBE O ID DE 7 DÍGITOS
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const fixedId = token ? token.slice(-7) : 'unknown';
        
        // Exibe o ID na terceira tela
        const userIdDisplay = document.createElement('div');
        userIdDisplay.className = 'user-id-display';
        userIdDisplay.id = 'user-id-display';
        userIdDisplay.textContent = `Seu ID: ${fixedId}`;
        
        // Adiciona o ID display no início do box-principal
        const boxPrincipal = document.querySelector('#communication-mode .box-principal');
        const firstChild = boxPrincipal.firstChild;
        boxPrincipal.insertBefore(userIdDisplay, firstChild);
        
        // Também exibe o nome do usuário
        document.getElementById('user-name-display').textContent = userName;
    });
});
