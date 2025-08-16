// code/qr-code-utils.js

export class QRCodeGenerator {
  static generateUserQRCode(containerId, userName) {
    if (!userName || typeof userName !== 'string') {
      throw new Error("Nome do usuário inválido.");
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.warn(`Elemento com ID "${containerId}" não encontrado.`);
      return;
    }

    // Limpa QR anterior, se houver
    container.innerHTML = '';

    const targetId = crypto.randomUUID().substr(0, 8);
    const lang = navigator.language || 'en';
    const baseUrl = 'https://lemur-interface-traducao.netlify.app/caller.html';

    const url = `${baseUrl}?targetId=${targetId}&lang=${encodeURIComponent(lang)}&nome=${encodeURIComponent(userName.trim())}`;

    new QRCode(container, {
      text: url,
      width: 180,
      height: 180,
      colorDark: "#000000",
      colorLight: "#ffffff",
    });
  }
}
