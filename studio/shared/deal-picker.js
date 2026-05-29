/**
 * V3 Deal Picker — Componente compartilhado
 * Importar em qualquer módulo do studio com:
 *   <script src="../../shared/deal-picker.js"></script>
 *
 * Uso:
 *   V3DealPicker.open({ onSelect: function(deal) { ... } });
 *
 * Integração:
 *   Apps Script doGet?action=deals → JSON { status:'ok', deals:[...] }
 *   Fallback: dados demo internos enquanto pipeline não tem registros reais
 */

var V3DealPicker = (function() {

  // ── CONFIG ────────────────────────────────────────────────────────────────
  var API_URL = 'https://script.google.com/macros/s/AKfycbx8IXiynREkHQj53a3PIFzNvfa2LQFzEznZw3M78PFZ9NF7ds2hNwNzxU8OrKuteFMmhg/exec?action=deals';

  // Dados demo — substituídos automaticamente quando Apps Script retorna deals reais
  var DEMO_DEALS = [
    {
      ID: 'V3-001', Vertical: 'Real Estate Estruturado',
      Nome: 'Projeto Âncora', 'Tipo Ativo': 'CRI · Galpão Logístico',
      Valor: 'R$ 45M', Moeda: 'BRL', Status: 'Due Diligence',
      'Descrição Cega': 'CRI lastreado em galpão logístico de alto padrão no interior de SP. Inquilino com rating AAA. Prazo 7 anos. FII listado em B3 como estruturador.',
      Prazo: '7 anos', Responsavel: 'João'
    },
    {
      ID: 'V3-002', Vertical: 'Securitização · Crédito',
      Nome: 'Projeto Fluxo', 'Tipo Ativo': 'FIDC · Recebíveis Judiciais',
      Valor: 'R$ 120M', Moeda: 'BRL', Status: 'Estruturação',
      'Descrição Cega': 'FIDC com lastro em precatórios e créditos judiciais de alta qualidade. Cedente com histórico auditado de 5 anos. Estrutura sênior/subordinada com rating previsto AA.',
      Prazo: '5 anos', Responsavel: 'Hamilton'
    },
    {
      ID: 'V3-003', Vertical: 'Mineração · Commodities',
      Nome: 'Projeto Lítio', 'Tipo Ativo': 'Royalty · Cross-Border',
      Valor: 'US$ 80M', Moeda: 'USD', Status: 'Originação',
      'Descrição Cega': 'Estrutura de royalty sobre jazida de lítio em Minas Gerais com comprador asiático. Reservas certificadas por empresa internacional. Parceria com fundo de infraestrutura americano.',
      Prazo: '10 anos', Responsavel: 'João'
    },
    {
      ID: 'V3-004', Vertical: 'Real Estate Estruturado',
      Nome: 'Projeto Industrial PR', 'Tipo Ativo': 'SLB · Ativo Industrial',
      Valor: 'R$ 32M', Moeda: 'BRL', Status: 'Closing',
      'Descrição Cega': 'Sale-leaseback de complexo industrial no Paraná. Vendedor com balanço sólido e contrato de locação de longo prazo. Yield superior à NTN-B.',
      Prazo: '12 anos', Responsavel: 'Robson'
    },
    {
      ID: 'V3-005', Vertical: 'M&A · Cross-Border',
      Nome: 'Projeto Bridge', 'Tipo Ativo': 'M&A · Aquisição Estratégica',
      Valor: 'R$ 280M', Moeda: 'BRL', Status: 'Originação',
      'Descrição Cega': 'Aquisição de plataforma de distribuição com presença em 4 estados. Comprador estratégico asiático com aprovação regulatória pendente. Estrutura com earn-out de 24 meses.',
      Prazo: '24 meses', Responsavel: 'João'
    }
  ];

  // ── STATUS COLORS ─────────────────────────────────────────────────────────
  var STATUS_COLOR = {
    'Originação':   { bg: 'rgba(36,58,102,0.3)',    border: 'rgba(36,58,102,0.6)',    text: '#7A8FA8' },
    'Estruturação': { bg: 'rgba(201,168,76,0.08)',  border: 'rgba(201,168,76,0.3)',   text: '#C9A84C' },
    'Due Diligence':{ bg: 'rgba(232,201,122,0.08)', border: 'rgba(232,201,122,0.3)',  text: '#E8C97A' },
    'Closing':      { bg: 'rgba(74,222,128,0.08)',  border: 'rgba(74,222,128,0.3)',   text: '#4ade80' },
    'Concluído':    { bg: 'rgba(122,143,168,0.06)', border: 'rgba(122,143,168,0.2)',  text: '#7A8FA8' },
  };

  // ── CSS (injetado uma vez) ────────────────────────────────────────────────
  var CSS_ID = 'v3-deal-picker-css';
  function injectCSS() {
    if (document.getElementById(CSS_ID)) return;
    var s = document.createElement('style');
    s.id = CSS_ID;
    s.textContent = [
      // overlay
      '.v3dp-overlay{position:fixed;inset:0;background:rgba(9,8,26,0.88);z-index:9000;display:flex;align-items:center;justify-content:center;padding:24px;backdrop-filter:blur(6px);}',
      // modal
      '.v3dp-modal{background:#111F35;border:1px solid rgba(201,168,76,0.15);border-top:2px solid #C9A84C;width:100%;max-width:720px;max-height:80vh;display:flex;flex-direction:column;font-family:"DM Sans",sans-serif;}',
      // header
      '.v3dp-header{padding:20px 24px 16px;border-bottom:1px solid rgba(201,168,76,0.08);display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}',
      '.v3dp-title{font-size:9px;font-weight:700;letter-spacing:4px;text-transform:uppercase;color:#C9A84C;}',
      '.v3dp-close{background:transparent;border:none;color:#7A8FA8;font-size:18px;cursor:pointer;padding:0;line-height:1;font-family:sans-serif;}',
      '.v3dp-close:hover{color:#F0ECE4;}',
      // toolbar
      '.v3dp-toolbar{padding:12px 24px;border-bottom:1px solid rgba(201,168,76,0.06);display:flex;gap:8px;flex-shrink:0;}',
      '.v3dp-search{flex:1;background:rgba(9,8,26,0.6);border:1px solid rgba(201,168,76,0.12);color:#F0ECE4;font-family:"DM Sans",sans-serif;font-size:12px;padding:8px 12px;outline:none;}',
      '.v3dp-search::placeholder{color:rgba(122,143,168,0.35);}',
      '.v3dp-search:focus{border-color:rgba(201,168,76,0.35);}',
      '.v3dp-filter{background:rgba(9,8,26,0.6);border:1px solid rgba(201,168,76,0.12);color:#F0ECE4;font-family:"DM Sans",sans-serif;font-size:11px;padding:8px 10px;outline:none;-webkit-appearance:none;min-width:160px;}',
      '.v3dp-filter:focus{border-color:rgba(201,168,76,0.35);}',
      '.v3dp-filter option{background:#111F35;}',
      // lista
      '.v3dp-list{overflow-y:auto;flex:1;padding:12px;}',
      // deal card
      '.v3dp-deal{background:rgba(9,8,26,0.4);border:1px solid rgba(201,168,76,0.08);padding:14px 16px;margin-bottom:8px;cursor:pointer;transition:all 0.15s;}',
      '.v3dp-deal:hover{background:rgba(22,39,68,0.7);border-color:rgba(201,168,76,0.25);}',
      '.v3dp-deal:last-child{margin-bottom:0;}',
      '.v3dp-deal-top{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:6px;}',
      '.v3dp-deal-id{font-size:8px;font-weight:700;letter-spacing:2px;color:#243A66;font-family:monospace;}',
      '.v3dp-deal-status{font-size:7px;font-weight:700;letter-spacing:2px;text-transform:uppercase;padding:2px 8px;}',
      '.v3dp-deal-tipo{font-size:8px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#C9A84C;margin-bottom:4px;}',
      '.v3dp-deal-nome{font-size:14px;font-weight:700;color:#F0ECE4;margin-bottom:6px;line-height:1.25;}',
      '.v3dp-deal-desc{font-size:11px;color:#7A8FA8;line-height:1.55;margin-bottom:10px;}',
      '.v3dp-deal-meta{display:flex;gap:16px;}',
      '.v3dp-deal-val{font-size:13px;font-weight:800;color:#C9A84C;}',
      '.v3dp-deal-prazo{font-size:10px;color:#7A8FA8;}',
      '.v3dp-deal-resp{font-size:8px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:#243A66;margin-left:auto;}',
      // estado vazio / loading
      '.v3dp-empty{text-align:center;padding:40px 24px;color:#7A8FA8;font-size:12px;}',
      '.v3dp-loading{text-align:center;padding:32px;color:#C9A84C;font-size:9px;letter-spacing:3px;text-transform:uppercase;}',
      // footer
      '.v3dp-footer{padding:12px 24px;border-top:1px solid rgba(201,168,76,0.06);font-size:8px;color:rgba(122,143,168,0.4);letter-spacing:1px;flex-shrink:0;display:flex;justify-content:space-between;align-items:center;}',
      '.v3dp-footer-source{color:rgba(74,222,128,0.5);}',
    ].join('');
    document.head.appendChild(s);
  }

  // ── FETCH DEALS ───────────────────────────────────────────────────────────
  function fetchDeals(callback) {
    fetch(API_URL, { method: 'GET', mode: 'cors' })
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (data.status === 'ok' && data.deals && data.deals.length > 0) {
          callback(data.deals, 'Pipeline M&A — Apps Script');
        } else {
          callback(DEMO_DEALS, 'Demo — adicione deals na aba Pipeline M&A');
        }
      })
      .catch(function() {
        callback(DEMO_DEALS, 'Demo — sem conexão com Apps Script');
      });
  }

  // ── BUILD MODAL ───────────────────────────────────────────────────────────
  function buildModal(deals, source, onSelect) {
    var overlay = document.createElement('div');
    overlay.className = 'v3dp-overlay';
    overlay.id = 'v3dp-overlay';

    var verticals = ['Todos'].concat(
      deals.map(function(d) { return d.Vertical || d.vertical || ''; })
        .filter(function(v,i,a){ return v && a.indexOf(v)===i; })
    );

    overlay.innerHTML = [
      '<div class="v3dp-modal">',
        '<div class="v3dp-header">',
          '<span class="v3dp-title">Selecionar Deal do Pipeline</span>',
          '<button class="v3dp-close" onclick="V3DealPicker.close()">×</button>',
        '</div>',
        '<div class="v3dp-toolbar">',
          '<input class="v3dp-search" id="v3dp-search" placeholder="Buscar por nome, tipo, vertical..." oninput="V3DealPicker._filter()">',
          '<select class="v3dp-filter" id="v3dp-vfilter" onchange="V3DealPicker._filter()">',
            verticals.map(function(v){ return '<option value="'+v+'">'+v+'</option>'; }).join(''),
          '</select>',
        '</div>',
        '<div class="v3dp-list" id="v3dp-list"></div>',
        '<div class="v3dp-footer">',
          '<span>' + deals.length + ' deal(s) no pipeline</span>',
          '<span class="v3dp-footer-source">' + source + '</span>',
        '</div>',
      '</div>'
    ].join('');

    document.body.appendChild(overlay);

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) V3DealPicker.close();
    });

    // guardar estado interno
    V3DealPicker._deals    = deals;
    V3DealPicker._onSelect = onSelect;
    V3DealPicker._render(deals);
  }

  // ── RENDER CARDS ──────────────────────────────────────────────────────────
  function renderCards(deals) {
    var list = document.getElementById('v3dp-list');
    if (!list) return;
    if (deals.length === 0) {
      list.innerHTML = '<div class="v3dp-empty">Nenhum deal encontrado para esse filtro.</div>';
      return;
    }
    list.innerHTML = deals.map(function(d, i) {
      var status = d.Status || d.status || 'Originação';
      var sc = STATUS_COLOR[status] || STATUS_COLOR['Originação'];
      var statusBadge = '<span class="v3dp-deal-status" style="background:'+sc.bg+';border:1px solid '+sc.border+';color:'+sc.text+';">'+status+'</span>';
      return [
        '<div class="v3dp-deal" onclick="V3DealPicker._select('+i+')">',
          '<div class="v3dp-deal-top">',
            '<span class="v3dp-deal-id">'+(d.ID||'—')+'</span>',
            statusBadge,
          '</div>',
          '<div class="v3dp-deal-tipo">'+(d['Tipo Ativo']||d.tipo_ativo||d.Vertical||'')+'</div>',
          '<div class="v3dp-deal-nome">'+(d.Nome||d.nome||'Deal sem nome')+'</div>',
          '<div class="v3dp-deal-desc">'+(d['Descrição Cega']||d.descricao||'')+'</div>',
          '<div class="v3dp-deal-meta">',
            '<span class="v3dp-deal-val">'+(d.Valor||d.valor||'—')+'</span>',
            '<span class="v3dp-deal-prazo">'+(d.Prazo||d.prazo ? '· '+(d.Prazo||d.prazo) : '')+'</span>',
            '<span class="v3dp-deal-resp">'+(d.Responsavel||d.responsavel||'')+'</span>',
          '</div>',
        '</div>'
      ].join('');
    }).join('');

    // guardar índice de deals filtrados para _select
    V3DealPicker._filtered = deals;
  }

  // ── API PÚBLICA ───────────────────────────────────────────────────────────
  return {
    _deals: [],
    _filtered: [],
    _onSelect: null,

    open: function(opts) {
      injectCSS();
      if (document.getElementById('v3dp-overlay')) return;
      opts = opts || {};

      // mostrar loading
      var overlay = document.createElement('div');
      overlay.className = 'v3dp-overlay';
      overlay.id = 'v3dp-overlay';
      overlay.innerHTML = '<div class="v3dp-modal" style="max-height:200px;"><div class="v3dp-loading">Carregando pipeline...</div></div>';
      document.body.appendChild(overlay);
      overlay.addEventListener('click', function(e){ if(e.target===overlay) V3DealPicker.close(); });

      fetchDeals(function(deals, source) {
        V3DealPicker.close();
        buildModal(deals, source, opts.onSelect || function(){});
      });
    },

    close: function() {
      var el = document.getElementById('v3dp-overlay');
      if (el) el.remove();
    },

    _filter: function() {
      var q  = (document.getElementById('v3dp-search').value || '').toLowerCase();
      var vf = document.getElementById('v3dp-vfilter').value;
      var filtered = V3DealPicker._deals.filter(function(d) {
        var matchV = vf === 'Todos' || (d.Vertical||d.vertical||'') === vf;
        var txt = [(d.Nome||''),(d['Tipo Ativo']||''),(d.Vertical||''),(d['Descrição Cega']||'')].join(' ').toLowerCase();
        var matchQ = !q || txt.indexOf(q) > -1;
        return matchV && matchQ;
      });
      renderCards(filtered);
    },

    _render: renderCards,

    _select: function(i) {
      var deal = V3DealPicker._filtered[i];
      if (!deal) return;
      V3DealPicker.close();
      if (typeof V3DealPicker._onSelect === 'function') {
        V3DealPicker._onSelect(deal);
      }
    }
  };

})();
