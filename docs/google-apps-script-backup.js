/**
 * Google Apps Script — Backup de Leads (abas separadas por formulário)
 *
 * Como implantar:
 *  1. Abra uma planilha Google → Extensões → Apps Script
 *  2. Cole este código substituindo o conteúdo padrão
 *  3. Implantar → Nova implantação → App da Web
 *     Executar como: Eu | Acesso: Qualquer pessoa
 *  4. Copie a URL e adicione como GOOGLE_SHEETS_BACKUP_URL
 *     em Cloudflare Pages → Settings → Environment Variables
 *
 * Abas criadas automaticamente na primeira submissão de cada fonte.
 */

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

function doPost(e) {
  try {
    var data = JSON.parse(e.postData.contents);
    var source = data.source || 'outros';

    var config = CONFIGS[source] || {
      aba: source,
      colunas: ['timestamp', 'source', 'nome', 'name', 'email', 'phone', 'telefone']
    };

    var ss    = SpreadsheetApp.getActiveSpreadsheet();
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

// Execute esta função no editor para criar todas as abas de uma vez
function criarTodasAsAbas() {
  var testes = [
    { source: 'aula-ao-vivo',    nome: 'Teste Aula',      telefone: '11900000001', nome_propriedade: 'Pousada X', quartos: '10' },
    { source: 'comunidade',      nome: 'Teste Comunidade', email: 'a@b.com', telefone: '11900000002', propriedade: 'Hotel Y', quartos: '20' },
    { source: 'diagnostico',     nome: 'Teste Diag',       phone: '11900000003', hotel: 'Resort Z', quartos: '50', score: '70', perfil: 'Em Desenvolvimento' },
    { source: 'wrp-inscricao',   name: 'Teste WRP',        email: 'c@d.com', phone: '11900000004', utm_source: 'instagram', utm_medium: 'pago' },
    { source: 'wrp-qualificacao',name: 'Teste Qual',       email: 'e@f.com', phone: '11900000005', nome_propriedade: 'Chalé W', quartos: '8' },
    { source: 'workshop-pago',   nome: 'Teste Pago',       email: 'g@h.com', telefone: '11900000006', hotel: 'Pousada V', quartos: '15' }
  ];

  testes.forEach(function(payload) {
    var fake = { postData: { contents: JSON.stringify(payload) } };
    doPost(fake);
    Logger.log('Aba criada: ' + payload.source);
  });

  Logger.log('Pronto! Todas as abas foram criadas.');
}
