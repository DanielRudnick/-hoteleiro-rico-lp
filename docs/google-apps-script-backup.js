/**
 * Google Apps Script — Backup de Leads (abas separadas por formulário)
 *
 * Como implantar:
 *  1. Abra script.google.com e crie um novo projeto vinculado a uma planilha
 *     (Extensões > Apps Script dentro da planilha, ou crie em script.google.com
 *      e defina SpreadsheetApp.openById('SEU_ID') abaixo)
 *  2. Cole este código substituindo o conteúdo padrão
 *  3. Clique em Implantar > Nova implantação
 *  4. Tipo: App da Web | Executar como: Eu | Acesso: Qualquer pessoa
 *  5. Copie a URL gerada e adicione como GOOGLE_SHEETS_BACKUP_URL
 *     nas variáveis de ambiente do Cloudflare Pages
 *
 * Cada formulário vai para sua própria aba. As abas e cabeçalhos
 * são criados automaticamente na primeira submissão de cada fonte.
 */

var CONFIGS = {
  'aula-ao-vivo': {
    aba: 'Aula ao Vivo',
    colunas: [
      'timestamp', 'nome', 'telefone', 'nome_propriedade', 'quartos'
    ]
  },
  'workshop-gratuito': {
    aba: 'Workshop Gratuito',
    colunas: [
      'timestamp', 'name', 'email', 'phone', 'nome_propriedade', 'quartos'
    ]
  },
  'comunidade': {
    aba: 'Comunidade',
    colunas: [
      'timestamp', 'nome', 'email', 'telefone', 'phone', 'propriedade', 'quartos'
    ]
  },
  'diagnostico': {
    aba: 'Diagnóstico',
    colunas: [
      'timestamp', 'nome', 'phone', 'hotel',
      'quartos', 'diaria', 'ocupacao', 'otas', 'motor', 'channel', 'pms',
      'dor', 'ambicao', 'score', 'perfil',
      'veredicto', 'oportunidades', 'proximo_passo',
      'quer_reuniao', 'whatsapp'
    ]
  }
};

// Fallback para fontes não mapeadas
var COLUNAS_PADRAO = ['timestamp', 'source', 'nome', 'name', 'email', 'phone', 'telefone'];

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var source = data.source || 'outros';

    var config = CONFIGS[source] || {
      aba: source.charAt(0).toUpperCase() + source.slice(1),
      colunas: COLUNAS_PADRAO
    };

    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(config.aba);

    if (!sheet) {
      sheet = ss.insertSheet(config.aba);
      var header = sheet.getRange(1, 1, 1, config.colunas.length);
      sheet.appendRow(config.colunas);
      header.setFontWeight('bold')
            .setBackground('#1a1a1a')
            .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    var now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    var row = config.colunas.map(function(col) {
      if (col === 'timestamp') return now;
      var val = data[col];
      return val !== undefined && val !== null ? String(val) : '';
    });

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true, aba: config.aba }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Teste manual: execute no editor do Apps Script para validar cada fonte
function testar() {
  var testes = [
    { source: 'aula-ao-vivo', nome: 'Maria Teste', telefone: '11999990001', nome_propriedade: 'Pousada Sol', quartos: '12' },
    { source: 'workshop-gratuito', name: 'João Teste', email: 'joao@teste.com', phone: '11999990002', nome_propriedade: 'Hotel Mar', quartos: '30' },
    { source: 'comunidade', nome: 'Carlos Teste', email: 'carlos@teste.com', telefone: '11999990003', propriedade: 'Chalé das Montanhas', quartos: '8' },
    { source: 'diagnostico', nome: 'Ana Teste', phone: '11999990004', hotel: 'Resort Bela Vista', quartos: '50', score: '72', perfil: 'Bem Estruturado' }
  ];

  testes.forEach(function(payload) {
    var fake = { postData: { contents: JSON.stringify(payload) } };
    var result = doPost(fake);
    Logger.log(result.getContent());
  });
}
