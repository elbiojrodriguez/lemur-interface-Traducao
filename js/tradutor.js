// tradutor.js - ARQUIVO ÚNICO SIMPLES
class Tradutor {
    constructor(idiomaDestino) {
        this.destino = idiomaDestino;
        this.urlServer = 'https://chat-tradutor.onrender.com';
    }

    async enviar(texto) {
        try {
            // ENVIA PARA SUA ROTA /translate-and-speak
            const response = await fetch(this.urlServer + '/translate-and-speak', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    text: texto,
                    targetLang: this.destino
                    // NÃO PRECISA sourceLang - API detecta sozinha!
                })
            });

            const data = await response.json();
            
            if (data.success) {
                // REPRODUZ ÁUDIO AUTOMATICAMENTE
                const audio = new Audio(data.audioData);
                audio.play();
                
                // RETORNA TEXTO TRADUZIDO
                return data.translatedText;
            }
        } catch (error) {
            console.error('Erro:', error);
        }
    }
}
