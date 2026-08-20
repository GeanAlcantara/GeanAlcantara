# Como colocar isso pra funcionar

## 1. Crie o repositório especial
No GitHub, crie um repositório **com o mesmo nome do seu usuário** (ex: se seu user é
`geanxyz`, o repo tem que se chamar `geanxyz/geanxyz`). O GitHub detecta automaticamente
e usa o README dele como a "capa" do seu perfil.

Se já existe, só copie os arquivos abaixo para dentro dele.

## 2. Estrutura de arquivos
Copie exatamente essa estrutura pro seu repositório:

```
seu-usuario/
├── .github/
│   └── workflows/
│       └── update-readme.yml
├── scripts/
│   └── generate-readme.mjs
└── README.md
```

## 3. Permissões do Actions (passo importante)
Por padrão, o token automático do Actions (`GITHUB_TOKEN`) só tem permissão de leitura.
Pra ele conseguir dar commit e push sozinho:

1. Vá em **Settings → Actions → General** no repositório
2. Em "Workflow permissions", marque **"Read and write permissions"**
3. Salve

Sem isso, o workflow roda mas falha no passo de `git push`.

## 4. Teste manual
Depois de subir os arquivos:
1. Vá na aba **Actions** do repositório
2. Clique no workflow "Update Profile README"
3. Clique em **"Run workflow"** (botão manual, graças ao `workflow_dispatch`)
4. Veja se ele roda sem erro e se o README foi atualizado

## 5. Deixa rodando sozinho
A partir daí ele roda automaticamente todo dia às 06:00 UTC (03:00 em Brasília),
sem você precisar tocar em nada. Você pode ajustar o horário mudando a linha `cron`
no arquivo `.github/workflows/update-readme.yml` — use https://crontab.guru pra
montar a expressão que quiser.

## 6. Personalize o README.md
O texto de introdução (bio, "o que eu faço", contato) é fixo — edite à vontade.
Só não mexa nos marcadores `<!--START_SECTION:xxx-->` / `<!--END_SECTION:xxx-->`,
é neles que o script escreve o conteúdo dinâmico.

## Próximos passos possíveis
- Trocar a fonte de dados: em vez de eventos públicos do GitHub, puxar de uma API
  sua da NexaTech (ex: "últimos projetos entregues")
- Adicionar um gráfico de contribuição animado (lib `Platane/snk`)
- Adicionar RSS de um blog/portfólio como seção extra
