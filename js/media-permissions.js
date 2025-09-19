// js/media-permissions.js
class MediaPermissionManager {
    constructor() {
        this.videoStream = null;
        this.audioStream = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;
        
        try {
            console.log('Solicitando permissões de mídia...');
            
            // ✅ CAPTURA EXATAMENTE como seu WebRTC precisa
            const fullStream = await navigator.mediaDevices.getUserMedia({ 
                video: true, 
                audio: true 
            });
            
            // ✅ MANTÉM o stream completo para WebRTC
            this.fullStream = fullStream;
            
            // ✅ SEPARA streams para tradutor (apenas áudio)
            this.videoStream = new MediaStream(fullStream.getVideoTracks());
            this.audioStream = new MediaStream(fullStream.getAudioTracks());
            
            this.initialized = true;
            console.log('Permissões concedidas - Streams preparados');
            
        } catch (error) {
            console.error("Erro ao solicitar permissões:", error);
            throw error;
        }
    }

    // ✅ MÉTODO NOVO: Retorna stream COMPLETO para WebRTC
    getFullStream() {
        if (!this.initialized) {
            throw new Error('MediaPermissionManager não inicializado');
        }
        return this.fullStream;
    }

    getVideoStream() {
        if (!this.initialized) {
            throw new Error('MediaPermissionManager não inicializado');
        }
        return this.videoStream;
    }

    getAudioStream() {
        if (!this.initialized) {
            throw new Error('MediaPermissionManager não inicializado');
        }
        return this.audioStream;
    }

    stopAllTracks() {
        if (this.fullStream) {
            this.fullStream.getTracks().forEach(track => track.stop());
        }
        this.initialized = false;
    }
}

// 🌐 Cria instância global
window.mediaPermissions = new MediaPermissionManager();
