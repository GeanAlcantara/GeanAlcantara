// scripts/generate-readme.mjs
// Busca atividade real do GitHub (via API) e reescreve trechos do README.md
// entre marcadores <!--START_SECTION:xxx--> ... <!--END_SECTION:xxx-->

import fs from 'node:fs/promises';

const USERNAME = process.env.GH_USERNAME;
const TOKEN = process.env.GH_TOKEN;
const README_PATH = 'README.md';

if (!USERNAME || !TOKEN) {
  console.error('Faltando GH_USERNAME ou GH_TOKEN nas env vars.');
  process.exit(1);
}

const headers = {
  Authorization: `Bearer ${TOKEN}`,
  Accept: 'application/vnd.github+json',
  'X-GitHub-Api-Version': '2022-11-28',
};

async function ghFetch(url) {
  const res = await fetch(url, { headers });
  if (!res.ok) {
    throw new Error(`Erro ao buscar ${url}: ${res.status} ${res.statusText}`);
  }
  return res.json();
}

// 1. Últimos eventos públicos (commits, PRs, issues abertas)
async function getRecentActivity() {
  const events = await ghFetch(
    `https://api.github.com/users/${USERNAME}/events/public?per_page=30`
  );

  const relevant = events.filter((e) =>
    ['PushEvent', 'PullRequestEvent', 'IssuesEvent', 'CreateEvent'].includes(e.type)
  );

  const lines = [];
  for (const e of relevant.slice(0, 5)) {
    const repo = e.repo.name;
    const date = new Date(e.created_at).toLocaleDateString('pt-BR');

    if (e.type === 'PushEvent') {
      const n = e.payload.commits?.length ?? 0;
      lines.push(`- 🔨 \`${n}\` commit(s) em [${repo}](https://github.com/${repo}) — ${date}`);
    } else if (e.type === 'PullRequestEvent') {
      lines.push(`- 🔀 PR ${e.payload.action} em [${repo}](https://github.com/${repo}) — ${date}`);
    } else if (e.type === 'IssuesEvent') {
      lines.push(`- 📌 Issue ${e.payload.action} em [${repo}](https://github.com/${repo}) — ${date}`);
    } else if (e.type === 'CreateEvent') {
      lines.push(`- ✨ Criou ${e.payload.ref_type} em [${repo}](https://github.com/${repo}) — ${date}`);
    }
  }

  return lines.length ? lines.join('\n') : '_Sem atividade pública recente._';
}

// 2. Linguagens mais usadas (baseado nos repositórios próprios)
async function getTopLanguages() {
  const repos = await ghFetch(
    `https://api.github.com/users/${USERNAME}/repos?per_page=100&sort=pushed`
  );

  const counts = {};
  for (const repo of repos) {
    if (repo.fork) continue;
    if (repo.language) {
      counts[repo.language] = (counts[repo.language] || 0) + 1;
    }
  }

  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 6);
  if (!sorted.length) return '_Sem dados de linguagem disponíveis._';

  return sorted
    .map(([lang, count]) => `\`${lang}\` (${count} repo${count > 1 ? 's' : ''})`)
    .join(' · ');
}

// 3. Estatísticas gerais
async function getStats() {
  const user = await ghFetch(`https://api.github.com/users/${USERNAME}`);
  return `📦 ${user.public_repos} repositórios públicos · 👥 ${user.followers} seguidores`;
}

function injectSection(content, sectionName, newValue) {
  const start = `<!--START_SECTION:${sectionName}-->`;
  const end = `<!--END_SECTION:${sectionName}-->`;
  const regex = new RegExp(`${start}[\\s\\S]*?${end}`);

  if (!regex.test(content)) {
    console.warn(`Marcador ${sectionName} não encontrado no README — pulando.`);
    return content;
  }

  return content.replace(regex, `${start}\n${newValue}\n${end}`);
}

async function main() {
  let readme = await fs.readFile(README_PATH, 'utf-8');

  const [activity, languages, stats] = await Promise.all([
    getRecentActivity(),
    getTopLanguages(),
    getStats(),
  ]);

  readme = injectSection(readme, 'activity', activity);
  readme = injectSection(readme, 'languages', languages);
  readme = injectSection(readme, 'stats', stats);

  const now = new Date().toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
  readme = injectSection(readme, 'updated', `_Última atualização automática: ${now}_`);

  await fs.writeFile(README_PATH, readme, 'utf-8');
  console.log('README atualizado com sucesso.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
