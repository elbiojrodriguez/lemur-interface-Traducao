// code/translator.js

export async function translateText(text, targetLang) {
  if (!text.trim()) {
    throw new Error('Texto vazio. Nada para traduzir.');
  }

  const response = await fetch('https://chat-tradutor.onrender.com/translate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ text, targetLang })
  });

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Erro desconhecido na tradução');
  }

  return data.translatedText;
}
