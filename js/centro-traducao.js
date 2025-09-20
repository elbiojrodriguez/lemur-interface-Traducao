// js/centro-traducao.js
class CentroTraducao {
    constructor() {
        this.dataChannel = null;
        this.callbackRecebimento = null;
    }

    configurarDataChannel(dataChannel) {
        this.dataChannel = dataChannel;
        
        this.dataChannel.onmessage = (event) => {
            if (this.callbackRecebimento && typeof event.data === 'string') {
                this.callbackRecebimento(event.data);
            }
        };

        this.dataChannel.onopen = () => {
            console.log('Canal de tradução estabelecido');
        };

        this.dataChannel.onerror = (error) => {
            console.error('Erro no canal de tradução:', error);
        };
    }

    definirCallbackRecebimento(callback) {
        if (typeof callback === 'function') {
            this.callbackRecebimento = callback;
        }
    }

    receberTextoTraduzido(texto) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            this.dataChannel.send(texto);
        } else {
            console.warn('Canal de dados não está disponível para envio');
        }
    }
}

// Exportar para uso global
window.centroTraducao = new CentroTraducao();
