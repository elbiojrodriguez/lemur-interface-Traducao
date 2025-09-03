// ===== CÓDIGO DE TRADUÇÃO =====
const TRANSLATE_ENDPOINT = 'https://chat-tradutor.onrender.com/translate';

const textsToTranslate = {
  "Instant-title": "Live translation. No filters. No platform.",
  "send-button": "SEND🚀"
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

async function translatePage() {
  const browserLang = (navigator.language || 'en').split('-')[0];

  for (const [elementId, text] of Object.entries(textsToTranslate)) {
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
}

// ===== CÓDIGO DOS ANÚNCIOS =====
let topAdVisible = false;
let bottomAdVisible = false;
let topAdClosed = false;
let bottomAdClosed = false;
let adInterval;

function startAdCycle() {
    setTimeout(() => {
        showAds();
        
        adInterval = setInterval(() => {
            hideAds();
            setTimeout(showAds, 2000);
        }, 7000);
    }, 5000);
}

function showAds() {
    if (!topAdClosed) {
        const topAd = document.getElementById('ad-top');
        topAd.classList.add('visible');
        topAdVisible = true;
    }
    
    if (!bottomAdClosed) {
        const bottomAd = document.getElementById('ad-bottom');
        bottomAd.classList.add('visible');
        bottomAdVisible = true;
    }
}

function hideAds() {
    if (topAdVisible) {
        const topAd = document.getElementById('ad-top');
        topAd.classList.remove('visible');
        topAdVisible = false;
    }
    
    if (bottomAdVisible) {
        const bottomAd = document.getElementById('ad-bottom');
        bottomAd.classList.remove('visible');
        bottomAdVisible = false;
    }
}

function closeAd(position) {
    if (position === 'top') {
        const topAd = document.getElementById('ad-top');
        topAd.classList.remove('visible');
        topAdVisible = false;
        topAdClosed = true;
    } else if (position === 'bottom') {
        const bottomAd = document.getElementById('ad-bottom');
        bottomAd.classList.remove('visible');
        bottomAdVisible = false;
        bottomAdClosed = true;
    }
    
    if (topAdClosed && bottomAdClosed) {
        clearInterval(adInterval);
    }
}

// ===== FUNÇÃO DE INICIALIZAÇÃO =====
async function initApp() {
    await translatePage();
    startAdCycle();
    
    // Configurar evento do botão
    document.getElementById('send-button').addEventListener('click', function() {
        alert('Funcionalidade de envio será implementada!');
    });
}

// ===== INICIAR APLICAÇÃO =====
window.onload = initApp;
