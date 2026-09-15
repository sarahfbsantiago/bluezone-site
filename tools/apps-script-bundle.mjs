// Gera apps-script/CODIGOS-ATUAIS.md com os 7 arquivos .gs em blocos, para colar no editor do Apps Script.
// Uso: npm run apps-script:bundle
import { readFileSync, writeFileSync } from 'node:fs'

const files = ['Config', 'Bluezone', 'Bluenews', 'Blueprint', 'Main', 'Util', 'Resposta']
const today = new Date().toLocaleDateString('pt-BR')
const out = [
  '# Apps Script — códigos atuais para colar\n',
  `Gerado em ${today} por \`npm run apps-script:bundle\` a partir de \`apps-script/*.gs\`. Não edite aqui: edite os .gs e gere de novo.\n`,
  'No editor do Apps Script (conta contato@abluezone.com.br), para **cada** arquivo abaixo: abra o arquivo de mesmo nome, apague tudo e cole o bloco inteiro. Depois: `TESTE_EMAIL` em Resposta.gs → Executar `testarResposta` → ler o Registro de execução → Implantar > Gerenciar implantações > lápis > Nova versão. Passo a passo completo em `apps-script/README.md`.\n',
  'Arquivos do projeto: ' + files.map((f) => `\`${f}\``).join(', ') + '.\n',
]
for (const f of files) {
  const code = readFileSync(new URL(`../apps-script/${f}.gs`, import.meta.url), 'utf8').replace(/\s+$/, '')
  out.push(`\n## ${f}.gs\n\n\`\`\`javascript\n${code}\n\`\`\`\n`)
}
writeFileSync(new URL('../apps-script/CODIGOS-ATUAIS.md', import.meta.url), out.join('\n'))
console.log(`apps-script/CODIGOS-ATUAIS.md gerado (${files.length} arquivos)`)
