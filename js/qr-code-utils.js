export class QRCodeGenerator {
  static generate(containerId, text, size = 150) {
    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container #${containerId} não encontrado`);
      return null;
    }

    try {
      return new QRCode(container, {
        text,
        width: size,
        height: size,
        colorDark: "#000000",
        colorLight: "#ffffff",
      });
    } catch (e) {
      console.error('Erro ao gerar QR Code:', e);
      return null;
    }
  }
}

export class QRCodeScanner {
  static start(containerId, onScan) {
    if (!window.Html5QrcodeScanner) {
      console.error('Biblioteca Html5Qrcode não carregada');
      return null;
    }

    const container = document.getElementById(containerId);
    if (!container) {
      console.error(`Container #${containerId} não encontrado`);
      return null;
    }

    try {
      const qrScanner = new Html5QrcodeScanner(containerId, { 
        fps: 10, 
        qrbox: 250 
      });
      qrScanner.render(onScan);
      return qrScanner;
    } catch (e) {
      console.error('Erro ao iniciar scanner:', e);
      return null;
    }
  }

  // Novo método para limpeza
  static stop(scannerInstance) {
    if (scannerInstance && scannerInstance.clear) {
      scannerInstance.clear();
    }
  }
}
