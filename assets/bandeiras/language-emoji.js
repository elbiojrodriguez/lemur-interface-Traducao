window.languageEmoji = {
  mapa: {},

  async carregarMapa() {
    const resposta = await fetch('assets/bandeiras/idiomas-bandeiras.txt');
    const texto = await resposta.text();
    const linhas = texto.split('\n');

    linhas.forEach(linha => {
      const [codigo, emoji] = linha.trim().split('=');
      if (codigo && emoji) {
        this.mapa[codigo.toLowerCase()] = emoji;
      }
    });
  },

  langFlag(lang) {
    const completo = lang.toLowerCase();
    const base = completo.split('-')[0];
    return this.mapa[completo] || this.mapa[base] || '🌐';
  }
};

window.languageEmoji.carregarMapa();
