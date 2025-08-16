// code/qr-code-utils.js

export class QRCodeGenerator {
  static generate(containerId, text, size = 180) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Elemento com ID "${containerId}" não encontrado.`);
      return;
    }

    // Limpa QR anterior, se houver
    container.innerHTML = '';

    return new QRCode(container, {
      text,
      width: size,
      height: size,
      colorDark: "#000000",
      colorLight: "#ffffff",
    });
  }

  static generateUserQRCode(containerId, userName) {
    if (!userName || typeof userName !== 'string') {
      throw new Error("Nome do usuário inválido.");
    }

    const targetId = crypto.randomUUID().substr(0, 8);
    const lang = navigator.language || 'en';
    const baseUrl = 'https://lemur-interface-traducao.netlify.app/caller.html';

    const url = `${baseUrl}?targetId=${targetId}&lang=${encodeURIComponent(lang)}&nome=${encodeURIComponent(userName.trim())}`;

    return QRCodeGenerator.generate(containerId, url);
  }
}
