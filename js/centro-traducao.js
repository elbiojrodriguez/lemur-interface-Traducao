// js/centro-traducao.js
class CentroTraducao {
    constructor() {
        this.dataChannel = null;
        this.onTextoRecebidoCallback = null;
    }

    configurarDataChannel(canal) {
        this.dataChannel = canal;
        
        this.dataChannel.onmessage = (event) => {
            const textoRecebido = event.data;
            if (this.onTextoRecebidoCallback && typeof textoRecebido === 'string') {
                this.onTextoRecebidoCallback(textoRecebido);
            }
        };

        this.dataChannel.onopen = () => {
            console.log('Canal de tradução estabelecido');
        };

        this.dataChannel.onerror = (error) => {
            console.error('Erro no canal de tradução:', error);
        };
    }

    receberTextoTraduzido(textoTraduzido) {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
            try {
                this.dataChannel.send(textoTraduzido);
            } catch (error) {
                console.error('Erro ao enviar texto traduzido:', error);
            }
        } else {
            console.warn('Canal de dados não está disponível para envio');
        }
    }

    definirCallbackRecebimento(callback) {
        if (typeof callback === 'function') {
            this.onTextoRecebidoCallback = callback;
        } else {
            console.error('Callback deve ser uma função');
        }
    }
}

// Exportar para uso nos outros módulos
const centroTraducao = new CentroTraducao();
