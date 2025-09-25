// translation-voice.js - Adiciona controle de voz aos HTMLs existentes

// Aguarda a página carregar
document.addEventListener('DOMContentLoaded', function() {
    
    // Configuração baseada no HTML (caller ou receiver)
    const isCaller = document.title.includes('Caller');
    const config = {
        meuIdioma: isCaller ? 'portugues' : 'ingles',
        idiomaParceiro: isCaller ? 'ingles' : 'portugues'
    };

    // Cria o tradutor
    window.tradutor = new TradutorBidirecional(config);

    // Adiciona botão de microfone à caixa de texto existente
    const textBox = document.querySelector('.text-box');
    if (textBox) {
        const micButton = document.createElement('button');
        micButton.innerHTML = '🎤';
        micButton.style.cssText = `
            position: absolute;
            bottom: 10px;
            right: 10px;
            width: 40px;
            height: 40px;
            border-radius: 50%;
            border: none;
            background: #007bff;
            color: white;
            font-size: 18px;
            cursor: pointer;
            z-index: 1000;
        `;
        
        micButton.onclick = function() {
            window.tradutor.iniciarReconhecimentoVoz();
            micButton.style.background = '#dc3545';
            setTimeout(() => micButton.style.background = '#007bff', 2000);
        };

        textBox.style.position = 'relative';
        textBox.appendChild(micButton);
    }

    // Inicia reconhecimento automaticamente após permissões
    navigator.mediaDevices.getUserMedia({ audio: true })
        .then(() => {
            console.log('Microfone permitido - tradutor pronto');
            // Opcional: iniciar automaticamente
            // window.tradutor.iniciarReconhecimentoVoz();
        })
        .catch(err => {
            console.log('Microfone não permitido para tradutor');
        });
});
