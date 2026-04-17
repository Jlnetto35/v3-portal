/**
 * V3 Content Studio — Gerador de PDF
 * Uso: node gerar-pdf.js
 * Instalar: npm install puppeteer
 */

const puppeteer = require('puppeteer');
const path = require('path');

const ARQUIVOS = [
  {
    entrada: 'modules/documentos/teaser-combustivel-abr2026.html',
    saida:   'exports/teaser-combustivel-abr2026.pdf',
    nome:    'Teaser Cego — Álcool Combustível Abr/2026'
  }
  // Adicionar mais arquivos aqui conforme novos módulos forem criados
];

async function gerarPDF(entrada, saida, nome) {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page    = await browser.newPage();

  const url = 'file://' + path.resolve(__dirname, entrada).replace(/\\/g, '/');
  console.log('Carregando:', url);

  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 });

  // Aguarda fontes carregarem
  await page.evaluateHandle('document.fonts.ready');

  await page.pdf({
    path:              path.resolve(__dirname, saida),
    format:            'A4',
    printBackground:   true,   // fundo navy obrigatório
    margin:            { top: '0', right: '0', bottom: '0', left: '0' },
    preferCSSPageSize: true
  });

  await browser.close();
  console.log('PDF gerado:', saida);
}

async function main() {
  const fs = require('fs');
  if (!fs.existsSync(path.resolve(__dirname, 'exports'))) {
    fs.mkdirSync(path.resolve(__dirname, 'exports'));
  }

  for (const arq of ARQUIVOS) {
    try {
      console.log('\nGerando:', arq.nome);
      await gerarPDF(arq.entrada, arq.saida, arq.nome);
    } catch (e) {
      console.error('Erro em', arq.nome, ':', e.message);
    }
  }

  console.log('\nConcluído. PDFs em: v3-studio/exports/');
}

main();
