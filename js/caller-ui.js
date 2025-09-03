// ===== CÓDIGO PRINCIPAL DO CALLER =====
class CallerUI {
    constructor() {
        this.rtcCore = null;
        this.localStream = null;
        this.remoteStream = null;
        this.targetBrowserId = null;
        this.contactName = null;
        this.contactLang = null;
        
        this.initialize();
    }

    async initialize() {
        // Ler parâmetros da URL
        this.readUrlParameters();
        
        // Exibir informações do contato
        this.displayContactInfo();
        
        // Configurar event listeners
        this.setupEventListeners();
        
        // Pré-inicializar WebRTC
        await this.preInitializeWebRTC();
    }

    readUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        
        this.targetBrowserId = urlParams.get('browserId');
        this.contactName = decodeURIComponent(urlParams.get('name') || 'Usuário');
        this.contactLang = decodeURIComponent(urlParams.get('lang') || 'pt-BR');
        
        console.log('Parâmetros recebidos:', {
            targetBrowserId: this.targetBrowserId,
            contactName: this.contactName,
            contactLang: this.contactLang
        });
    }

    displayContactInfo() {
        document.getElementById('contact-name').textContent = this.contactName;
        document.getElementById('contact-lang').textContent = `Idioma: ${this.getLanguageName(this.contactLang)}`;
    }

    getLanguageName(langCode) {
        const languages = {
            'pt': 'Português',
            'pt-BR': 'Português (Brasil)',
            'en': 'Inglês',
            'es': 'Espanhol',
            'fr': 'Francês',
            'de': 'Alemão',
            'it': 'Italiano',
            'ja': 'Japonês',
            'zh': 'Chinês',
            'ru': 'Russo'
        };
        
        return languages[langCode] || langCode;
    }

    setupEventListeners() {
        document.getElementById('connect-button').addEventListener('click', () => {
            this.startConnection();
        });

        document.getElementById('end-call-button').addEventListener('click', () => {
            this.endCall();
        });
    }

    async preInitializeWebRTC() {
        try {
            // Solicitar acesso à câmera (apenas vídeo)
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: false
            });
            
            // Pré-inicializar WebRTC
            this.rtcCore = new WebRTCCore();
            const myId = crypto.randomUUID().substr(0, 8);
            this.rtcCore.initialize(myId);
            
            // Configurar callback para stream remoto
            this.rtcCore.setRemoteStreamCallback((remoteStream) => {
                this.handleRemoteStream(remoteStream);
            });
            
            document.getElementById('status-text').textContent = 'Pronto para conectar!';
            document.getElementById('connect-button').disabled = false;
            
        } catch (error) {
            console.error('Erro ao inicializar WebRTC:', error);
            document.getElementById('status-text').textContent = 'Erro ao acessar câmera';
        }
    }

    async startConnection() {
        if (!this.rtcCore || !this.targetBrowserId) {
            console.error('WebRTC não inicializado ou targetBrowserId não definido');
            return;
        }

        document.getElementById('connect-button').disabled = true;
        document.getElementById('status-text').textContent = 'Conectando...';
        
        try {
            // Iniciar chamada
            this.rtcCore.startCall(this.targetBrowserId, this.localStream);
            
            // Mostrar próprio vídeo em PIP
            document.getElementById('localVideo').srcObject = this.localStream;
            
            // Esperar um pouco e mudar para modo de comunicação
            setTimeout(() => {
                this.switchToCommunicationMode();
            }, 2000);
            
        } catch (error) {
            console.error('Erro ao iniciar chamada:', error);
            document.getElementById('status-text').textContent = 'Erro na conexão';
            document.getElementById('connect-button').disabled = false;
        }
    }

    handleRemoteStream(remoteStream) {
        this.remoteStream = remoteStream;
        
        // Silenciar áudio se houver
        remoteStream.getAudioTracks().forEach(track => track.enabled = false);
        
        // Exibir vídeo remoto
        document.getElementById('remoteVideo').srcObject = remoteStream;
        
        document.getElementById('status-text').textContent = 'Conectado!';
    }

    switchToCommunicationMode() {
        // Esconder modo de conexão, mostrar modo de comunicação
        document.querySelectorAll('.app-mode').forEach(mode => {
            mode.classList.remove('active');
        });
        document.getElementById('communication-mode').classList.add('active');
        
        // Exibir ID da conexão
        document.getElementById('connection-id').textContent = `Conectado à: ${this.targetBrowserId}`;
    }

    endCall() {
        // Parar todas as tracks de mídia
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
        }
        if (this.remoteStream) {
            this.remoteStream.getTracks().forEach(track => track.stop());
        }
        
        // Fechar conexão WebRTC
        if (this.rtcCore && this.rtcCore.peer) {
            this.rtcCore.peer.close();
        }
        
        // Recarregar a página para reiniciar
        window.location.reload();
    }
}

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    new CallerUI();
});
