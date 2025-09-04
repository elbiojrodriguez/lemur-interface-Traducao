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
    
    // Gera o QR code (usando a biblioteca externa)
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
    const cameraCheckbox = document.getElementById('camera-checkbox');
    const microphoneCheckbox = document.getElementById('microphone-checkbox');
    const userIdDisplay = document.getElementById('user-id-display'); // Novo elemento para mostrar o ID
    
    // Variáveis de estado
    let cameraGranted = false;
    let microphoneGranted = false;
    let userName = '';

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
        
        // ✅ GERA E EXIBE O ID DE 7 DÍGITOS NA TERCEIRA TELA
        const urlParams = new URLSearchParams(window.location.search);
        const token = urlParams.get('token');
        const fixedId = token ? token.slice(-7) : 'unknown';
        
        // Exibe o ID na tela
        userIdDisplay.textContent = `Seu ID: ${fixedId}`;
        
        // Também exibe o nome do usuário
        document.getElementById('user-name-display').textContent = userName;
    });
});
