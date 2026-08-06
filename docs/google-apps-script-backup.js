/**
 * Google Apps Script — Backup de Leads (todos os formulários)
 *
 * Como implantar:
 *  1. Abra script.google.com e crie um novo projeto
 *  2. Cole este código substituindo o conteúdo padrão
 *  3. Clique em Implantar > Nova implantação
 *  4. Tipo: App da Web | Executar como: Eu | Acesso: Qualquer pessoa
 *  5. Copie a URL gerada e adicione como GOOGLE_SHEETS_BACKUP_URL
 *     nas variáveis de ambiente do Cloudflare Pages
 *  6. Certifique-se de que a planilha ativa tem pelo menos uma aba
 *
 * Colunas criadas automaticamente na primeira execução.
 */

var COLUMNS = [
  'timestamp', 'source',
  'nome', 'name', 'email', 'phone', 'telefone',
  'hotel', 'nome_propriedade', 'quartos',
  'diaria', 'ocupacao', 'otas', 'motor', 'channel', 'pms',
  'dor', 'ambicao', 'score', 'perfil',
  'veredicto', 'oportunidades', 'proximo_passo',
  'quer_reuniao', 'whatsapp'
];

function doPost(e) {
  try {
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    var data = JSON.parse(e.postData.contents);

    if (sheet.getLastRow() === 0) {
      sheet.appendRow(COLUMNS);
      sheet.getRange(1, 1, 1, COLUMNS.length)
        .setFontWeight('bold')
        .setBackground('#1a1a1a')
        .setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }

    var now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    var row = COLUMNS.map(function(col) {
      if (col === 'timestamp') return now;
      var val = data[col];
      return val !== undefined && val !== null ? String(val) : '';
    });

    sheet.appendRow(row);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Teste manual: execute esta função no editor para verificar a conexão
function testar() {
  var payload = {
    source: 'teste',
    nome: 'João Teste',
    phone: '11999999999',
    hotel: 'Pousada Teste',
    quartos: '10',
    score: '55',
    perfil: 'Em Desenvolvimento'
  };
  var fake = { postData: { contents: JSON.stringify(payload) } };
  var result = doPost(fake);
  Logger.log(result.getContent());
}
