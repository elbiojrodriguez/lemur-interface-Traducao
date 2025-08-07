// 🌐 Botão de seleção de idiomas
const langSelectButton = document.createElement('button');
langSelectButton.className = 'lang-select-btn';
langSelectButton.textContent = '🌐';
langSelectButton.title = 'Selecionar idioma';
langSelectButton.style.background = 'none';
langSelectButton.style.border = 'none';
langSelectButton.style.cursor = 'pointer';
langSelectButton.style.fontSize = '40px';
langSelectButton.style.position = 'absolute';
langSelectButton.style.bottom = '20px';
langSelectButton.style.right = '20px';
langSelectButton.style.zIndex = '100';
document.body.appendChild(langSelectButton);

// 📋 Menu flutuante de idiomas
const languageMenu = document.createElement('div');
languageMenu.className = 'language-menu';
languageMenu.style.display = 'none';
languageMenu.style.position = 'absolute';
languageMenu.style.backgroundColor = 'white';
languageMenu.style.borderRadius = '8px';
languageMenu.style.boxShadow = '0 2px 10px rgba(0,0,0,0.2)';
languageMenu.style.padding = '10px';
languageMenu.style.zIndex = '1000';
languageMenu.style.minWidth = '60px';
document.body.appendChild(languageMenu);

// 🌍 Lista de idiomas
const languages = [
  { code: 'en-US', flag: '🇺🇸', name: 'English' },
  { code: 'pt-BR', flag: '🇧🇷', name: 'Português' },
  { code: 'es-ES', flag: '🇪🇸', name: 'Español' },
  { code: 'fr-FR', flag: '🇫🇷', name: 'Français' },
  { code: 'de-DE', flag: '🇩🇪', name: 'Deutsch' },
  { code: 'ja-JP', flag: '🇯🇵', name: '日本語' },
  { code: 'zh-CN', flag: '🇨🇳', name: '中文' },
  { code: 'ru-RU', flag: '🇷🇺', name: 'Русский' },
  { code: 'ar-SA', flag: '🇸🇦', name: 'العربية' }
];

// 🧩 Adiciona os idiomas ao menu
languages.forEach(lang => {
  const langBtn = document.createElement('button');
  langBtn.className = 'lang-option';
  langBtn.innerHTML = `${lang.flag}`;
  langBtn.title = lang.name;
  langBtn.style.display = 'block';
  langBtn.style.width = '100%';
  langBtn.style.padding = '8px 12px';
  langBtn.style.textAlign = 'center';
  langBtn.style.border = 'none';
  langBtn.style.background = 'none';
  langBtn.style.cursor = 'pointer';
  langBtn.style.borderRadius = '4px';
  langBtn.style.margin = '2px 0';
  langBtn.style.fontSize = '24px';
  langBtn.addEventListener('mouseover', () => {
    langBtn.style.backgroundColor = '#f0f0f0';
  });
  langBtn.addEventListener('mouseout', () => {
    langBtn.style.backgroundColor = 'transparent';
  });
  languageMenu.appendChild(langBtn);
});

// 📌 Posiciona o menu acima do botão 🌐
langSelectButton.addEventListener('click', (e) => {
  e.stopPropagation();
  languageMenu.style.display = 'block';

  setTimeout(() => {
    const rect = langSelectButton.getBoundingClientRect();
    const menuHeight = languageMenu.offsetHeight;
    languageMenu.style.left = `${rect.left}px`;
    languageMenu.style.top = `${rect.top - menuHeight - 10}px`;
  }, 0);
});

// ❌ Fecha o menu ao clicar fora
document.addEventListener('click', () => {
  languageMenu.style.display = 'none';
});
