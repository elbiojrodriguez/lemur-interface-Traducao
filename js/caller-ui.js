// ... (código anterior mantido até a parte do WebRTC)

// #############################################
// PARTE MODIFICADA: Criação dos controles DINÂMICOS de forma independente
// #############################################

// 1. Cria um container absoluto para os controles de idioma
const langControls = document.createElement('div');
langControls.style.position = 'fixed';  // Fixo na tela, não depende de .controls
langControls.style.bottom = '20px';
langControls.style.right = '20px';
langControls.style.zIndex = '100';
document.body.appendChild(langControls);  // Anexa diretamente ao body

// 2. Cria o balão do idioma detectado (igual ao original)
const detectedLangBubble = document.createElement('div');
detectedLangBubble.className = 'lang-bubble';
// ... (estilos e funcionalidades mantidos iguais)
langControls.appendChild(detectedLangBubble);

// 3. Cria o botão de seleção de idiomas (🌐) (igual ao original)
const langSelectButton = document.createElement('button');
langSelectButton.className = 'lang-select-btn';
langSelectButton.textContent = '🌐';
// ... (estilos e funcionalidades mantidos iguais)
langControls.appendChild(langSelectButton);

// 4. Cria o menu de idiomas (igual ao original)
const languageMenu = document.createElement('div');
languageMenu.className = 'language-menu';
// ... (estilos e funcionalidades mantidos iguais)
document.body.appendChild(languageMenu);

// ... (restante do código permanece IDÊNTICO, incluindo a lógica de voz)
