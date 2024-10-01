let excelData = []; // Variável para armazenar os dados do Excel ou ODS

// Função para ler o arquivo Excel ou ODS e extrair os dados
document.getElementById('file-input').addEventListener('change', function (e) {
    const file = e.target.files[0];
    const reader = new FileReader();
    reader.onload = function (e) {
        const data = new Uint8Array(e.target.result);
        const workbook = XLSX.read(data, { type: 'array' });

        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        // Converte os dados da planilha para JSON, capturando inclusive valores vazios
        excelData = XLSX.utils.sheet_to_json(sheet, { defval: "" });

        // Exibe os dados no console para garantir que estão corretos
        console.log('Dados lidos do arquivo:', excelData);

        alert(`Dados do arquivo carregados com sucesso! Total de registros: ${excelData.length}`);
    };
    reader.readAsArrayBuffer(file);
});

// Função para sanitizar o texto mantendo espaços e caracteres especiais
function sanitizeTextForQRCode(text) {
    // Substitui apenas os caracteres que causariam problemas na geração do QR code
    return text.replace(/[#&%]/g, encodeURIComponent);
}

// Função para gerar o QR Code
function gerarQRCode(text, containerId) {
    const qrCodeContainer = document.createElement('div'); // Cria um novo div para cada QR Code
    qrCodeContainer.id = containerId;
    qrCodeContainer.classList.add('qrcode'); // Adiciona uma classe para estilizar o QR Code

    // Sanitiza o texto, mas mantendo os espaços e os caracteres especiais como acentos
    const sanitizedText = sanitizeTextForQRCode(text);

    new QRCode(qrCodeContainer, {
        text: sanitizedText, // O texto será gerado com caracteres especiais e espaços preservados
        width: 150,
        height: 150
    });

    return qrCodeContainer;
}

// Função para gerar QR Codes com base nos dados do Excel ou ODS
function gerarQRCodesComExcel() {
    const qrContainer = document.getElementById('qrcode-container');
    qrContainer.innerHTML = '';  // Limpa os QR codes anteriores

    // Verifica se os dados da planilha estão carregados
    if (excelData.length === 0) {
        alert("Nenhum dado foi carregado da planilha.");
        return;
    }

    // Percorre todas as linhas do arquivo Excel/ODS e gera QR codes
excelData.forEach((row, index) => {
    // Acessa o conteúdo de 'COD' e 'Acabamento'
    const cod = row.COD || `Sem Código ${index + 1}`;  // Se não houver COD, usar substituto
    const acab = row.Acabamento || "Sem Informação";   // Se não houver Acabamento, usar substituto

    // Gera o texto do QR code com uma quebra de linha (\n) para leitura correta
    const qrCodeText = `${cod}\n ${acab}`;  // Exemplo: 'COD123-45/AB\nFinishing-Type A/B'

    // Exibir o texto do QR Code para verificar
    console.log(`QR Code gerado: ${qrCodeText}`);

    const qrCodeElement = gerarQRCode(qrCodeText, `qrcode-${index}`);
    qrContainer.appendChild(qrCodeElement);

    // Ajusta o conteúdo para exibição, convertendo \n em <br> para quebrar a linha na página
    const infoText = document.createElement('div');
    infoText.classList.add('info-text');
    infoText.innerHTML = qrCodeText.replace(/\n/g, '<br>');  // Substitui \n por <br> para exibição HTML

    qrCodeElement.appendChild(infoText);
});

alert(`Foram gerados QR codes para ${excelData.length} registros da planilha.`);


}


// Função para exportar QR codes e informações para PDF em um por página (formato para impressora Argox)
function exportarPDF() {
    const doc = new jspdf.jsPDF({
        orientation: 'landscape', // Configura o PDF em modo paisagem
        unit: 'mm',
        format: [75, 100] // Configura o tamanho da etiqueta em milímetros: 100mm x 75mm
    });

    const qrCodes = document.querySelectorAll('.qrcode');

    qrCodes.forEach((qr, index) => {
        const qrCanvas = qr.querySelector('canvas');
        const qrText = qr.querySelector('.info-text').textContent;

        // Tamanho do QR code
        const qrSize = 40; // Tamanho do QR code em mm
        const x = (75 - qrSize) / 2; // Centraliza o QR code horizontalmente na página (100mm largura)
        const y = (100 - qrSize) / 2;  // Centraliza o QR code verticalmente na página (75mm altura)

        // Adiciona uma nova página apenas após o primeiro QR code
        if (index > 0) {
            doc.addPage();
        }

        const qrImage = qrCanvas.toDataURL('image/png');
        doc.addImage(qrImage, 'PNG', x, y, qrSize, qrSize); // Adiciona o QR code centralizado

        // Define o tamanho da fonte
        doc.setFontSize(8);

        // Manipula o texto para garantir que \n seja respeitado tanto na leitura quanto na impressão
        const splitText = qrText.split('\n'); // Divide o texto onde há quebras de linha (\n)

        // Exibe cada linha de texto abaixo do QR code, com espaçamento entre as linhas
        splitText.forEach((line, i) => {
            doc.text(line, x, y + qrSize + 5 + (i * 5)); // Posição da linha de texto com espaçamento
        });
    });

    doc.save('qrcodes-argox.pdf');
}


// Evento para gerar múltiplos QR codes com base no input do usuário ou Excel/ODS
document.getElementById('generate-btn').addEventListener('click', function () {
    if (excelData.length > 0) {
        gerarQRCodesComExcel(); // Gera a partir do Excel/ODS
    } else {
        const prefix = document.getElementById('prefix-input').value || "";
        const startNumber = parseInt(document.getElementById('start-input').value, 10);
        const quantity = parseInt(document.getElementById('quantity-input').value, 10);
        const info = document.getElementById('info-input').value || "";

        gerarMultiplosQRCodes(prefix, startNumber, quantity, info); // Gera a partir dos inputs
    }
});

// Função para limpar os dados
document.getElementById('limpardados').addEventListener('click', function () {
    document.getElementById('qrcode-container').innerHTML = '';
    document.getElementById('prefix-input').value = '';
    document.getElementById('start-input').value = '1';
    document.getElementById('quantity-input').value = '';
    document.getElementById('info-input').value = '';
    document.getElementById('file-input').value = '';
    excelData = [];
});

// Evento para exportar QR codes para PDF
document.getElementById('pdf-btn').addEventListener('click', function () {
    exportarPDF();
});