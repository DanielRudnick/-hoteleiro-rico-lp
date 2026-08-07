/**
 * Google Apps Script — Backup de Leads (abas separadas por formulário)
 *
 * ── COMO USAR ────────────────────────────────────────────────────────
 *
 *  OPÇÃO A — Script vinculado à planilha (recomendado):
 *    1. Abra sua planilha Google
 *    2. Extensões → Apps Script
 *    3. Cole este código (substitua tudo)
 *    4. Deixe SPREADSHEET_ID = '' (vazio) — ele usa a planilha atual
 *
 *  OPÇÃO B — Script standalone (criado em script.google.com):
 *    1. Copie o ID da sua planilha da URL:
 *       docs.google.com/spreadsheets/d/SEU_ID_AQUI/edit
 *    2. Cole o ID na variável SPREADSHEET_ID abaixo
 *
 *  DEPOIS (nas duas opções):
 *    3. Salve (Ctrl+S)
 *    4. Selecione a função "criarTodasAsAbas" no menu e clique ▶ Executar
 *    5. Na primeira vez: clique "Analisar permissões" → escolha sua conta
 *       → "Avançado" → "Acessar [nome do projeto] (não seguro)" → Permitir
 *    6. As 6 abas serão criadas na planilha
 *    7. Implantar → Nova implantação → App da Web
 *       Executar como: Eu | Acesso: Qualquer pessoa → Implantar
 *    8. Copie a URL e adicione como GOOGLE_SHEETS_BACKUP_URL
 *       em Cloudflare Pages → Settings → Environment Variables
 */

var SPREADSHEET_ID = ''; // deixe vazio se criou via Extensões → Apps Script

var CONFIGS = {
  'aula-ao-vivo': {
    aba: 'Aula ao Vivo',
    colunas: ['timestamp', 'nome', 'telefone', 'nome_propriedade', 'quartos']
  },
  'comunidade': {
    aba: 'Comunidade',
    colunas: ['timestamp', 'nome', 'email', 'telefone', 'propriedade', 'quartos']
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
  },
  'wrp-inscricao': {
    aba: 'WRP Inscrição',
    colunas: [
      'timestamp', 'name', 'email', 'phone',
      'utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term'
    ]
  },
  'wrp-qualificacao': {
    aba: 'WRP Qualificação',
    colunas: ['timestamp', 'name', 'email', 'phone', 'nome_propriedade', 'quartos']
  },
  'workshop-pago': {
    aba: 'Workshop Pago',
    colunas: ['timestamp', 'nome', 'email', 'telefone', 'hotel', 'quartos']
  }
};

function getSheet() {
  var ss = SPREADSHEET_ID
    ? SpreadsheetApp.openById(SPREADSHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();
  if (!ss) throw new Error('Planilha não encontrada. Preencha SPREADSHEET_ID ou use Extensões → Apps Script de dentro de uma planilha.');
  return ss;
}

function getOrCreateTab(ss, config) {
  var sheet = ss.getSheetByName(config.aba);
  if (!sheet) {
    sheet = ss.insertSheet(config.aba);
    sheet.appendRow(config.colunas);
    sheet.getRange(1, 1, 1, config.colunas.length)
      .setFontWeight('bold')
      .setBackground('#1a1a1a')
      .setFontColor('#ffffff');
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doPost(e) {
  try {
    var data   = JSON.parse(e.postData.contents);
    var source = data.source || 'outros';
    var config = CONFIGS[source] || { aba: source, colunas: ['timestamp', 'source', 'nome', 'name', 'email', 'phone', 'telefone'] };

    var ss    = getSheet();
    var sheet = getOrCreateTab(ss, config);

    var now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
    var row = config.colunas.map(function(col) {
      if (col === 'timestamp') return now;
      var val = data[col];
      return (val !== undefined && val !== null) ? String(val) : '';
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

// ── Execute esta função primeiro para criar todas as abas ─────────────
function criarTodasAsAbas() {
  var ss = getSheet();

  Object.keys(CONFIGS).forEach(function(source) {
    var config = CONFIGS[source];
    getOrCreateTab(ss, config);
    Logger.log('✓ Aba criada: ' + config.aba);
  });

  Logger.log('Pronto! Abra a planilha para ver as ' + Object.keys(CONFIGS).length + ' abas.');
}
