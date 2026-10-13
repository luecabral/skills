# Setup — como essa engrenagem funciona e como remontar num PC novo

Documento de transferência de máquina. O repositório sozinho **não** reconstrói o ambiente: boa parte do que faz as skills funcionarem mora fora dele, em hooks, symlinks e arquivos de configuração locais. Aqui está tudo.

Escrito em out/2026, a partir da máquina `luiza.cabral` (Windows 11 + WSL Ubuntu, usuário `luizacabral`).

---

## 1. O mapa

Dois sistemas operacionais na mesma máquina, com papéis diferentes:

- **Windows** é onde o repositório vive e onde as skills são editadas.
- **WSL (Ubuntu)** é onde você realmente desenvolve, e onde o Claude Code roda de verdade.

```
WINDOWS
  C:\Users\luiza.cabral\projects\skills        ← o repositório. Edita aqui.
        │  (hook post-commit, a cada commit na main)
        ├─ gera <skill>.md na raiz do repo
        ├─ copia os .md pra C:\Users\luiza.cabral\.claude\commands\   ← Claude Code do Windows
        ├─ git push luecabral
        └─ dispara git pull no WSL
                              │
WSL                           ▼
  /home/luizacabral/.claude/commands/          ← clone git de luecabral/main.
                                                  É o que o Claude Code do WSL lê.
  /home/luizacabral/.claude/hooks/             ← 2 hooks, NÃO versionados
  /home/luizacabral/.claude/settings.json      ← permissões e preferências, NÃO versionado
  /home/luizacabral/.claude.json               ← servidores MCP, NÃO versionado
  /home/luizacabral/.agents/skills/            ← skills antigas, fora do repo
  /home/luizacabral/.claude/skills/            ← symlinks pro .agents (só caveman ativo)
```

**Regra de ouro:** a fonte da verdade é sempre `<skill>/SKILL.md` no repositório do Windows. Todo o resto é destino gerado. Nunca edite `~/.claude/commands/` à mão — o hook sobrescreve.

---

## 2. O que está versionado (vem de graça no clone)

| Item | Onde |
|---|---|
| As duas skills | `maestro/`, `linear/` |
| Checklists e templates do maestro | `maestro/references/REFERENCE.md` |
| Flats gerados | `<skill>.md` na raiz |
| O hook de propagação | `.githooks/post-commit` e `.githooks/post-merge` |
| Ativador do hook | `setup.sh` |
| Publicação no marketplace da INK | `scripts/publicar-ink.sh` (ver `CLAUDE.md`) |
| Normalização de fim de linha | `.gitattributes` (`*.md text eol=lf`) |
| Instruções do repo | `CLAUDE.md`, `README.md`, este arquivo |

---

## 3. O que NÃO está versionado (se perde se você não copiar)

Copie estes caminhos da máquina antiga **antes de formatar**. É o que o clone não traz.

### 3.1. Hooks do Claude Code no WSL — `/home/luizacabral/.claude/hooks/`

Dois scripts, nenhum no git:

- **`validate-bash-safety.mjs`** — hook `PreToolUse` em comandos Bash. Modo **aviso**, nunca bloqueia (qualquer erro leva a exit 0). Avisa sobre `git push --force` sem `--force-with-lease` e sobre operações de produção (`--accept-data-loss`, `heroku run db:migrate`, `git push heroku`). É a rede que complementa as regras escritas no maestro.
- **`sync-local-skills.sh`** — hook `SessionStart`. Copia skills **local-only** (que existem só no Windows, fora do git) pro `~/.claude/commands` do WSL no início de cada sessão. Hoje a lista é `SKILLS=(maestro_ink)` — e o `maestro_ink` foi descartado em ago/2026, então o script é um no-op: ele checa se o `SKILL.md` existe e sai limpo se não existir. Mantenha o script (serve pro dia em que você tiver outra skill local-only) ou ajuste a lista.

Os dois são registrados em `~/.claude/settings.json`; copiar os scripts sem copiar o settings não ativa nada.

### 3.2. `~/.claude/settings.json` do WSL

Cerca de 11 KB. O que tem dentro:

- **`permissions.allow` com ~143 entradas** — é o que evita o Claude Code parar a cada comando pedindo permissão. **Esse é o item mais caro de reconstruir à mão.** Copie o arquivo.
- **`permissions.additionalDirectories`** — 4 diretórios extras liberados.
- **`hooks`** — registra os dois scripts acima (`PreToolUse` em `Bash`, `SessionStart` em `*`).
- Preferências: `effortLevel: high`, `autoCompactWindow: 350000`, `tui: fullscreen`, `theme: dark`, notificações de input e de agente ligadas.

### 3.3. `~/.claude.json` do WSL

Cerca de 74 KB. Guarda os **servidores MCP** e o histórico por projeto. MCP global configurado: **`ink-hub-mcp`**. Os outros conectores (Linear, GitHub, Google Drive, Figma, Canva) são ligados pela interface do app, não por esse arquivo — no PC novo é só reconectar.

### 3.4. Memória do Claude Code

`C:\Users\luiza.cabral\.claude\projects\C--Users-luiza-cabral--claude-commands\memory\`

Cinco arquivos, carregados em toda sessão:

- `MEMORY.md` — o índice (é o que entra no contexto)
- `user_perfil_pm_nao_tecnica.md` — perfil: PM, não técnica; citar o termo e explicar curto
- `feedback_skills_branch.md` — push direto na main, sem push manual (o hook pusha)
- `feedback_skills_sync.md` — editar no repo, o hook sincroniza
- `project_wsl_skills_setup.md` — os três lugares onde a skill vive

**Não estão no repositório porque ele é público.** Copie a pasta inteira. O caminho tem o nome do diretório de trabalho codificado (`C--Users-luiza-cabral--claude-commands`): se o usuário do Windows mudar no PC novo, o nome da pasta muda junto — crie a pasta com o nome novo e mova os arquivos pra lá.

### 3.5. Skills antigas fora do repo (WSL)

- `/home/luizacabral/.agents/skills/` — 17 skills antigas (`brainstorming`, `prd-to-issues`, `tdd`, `test-gate`, `smart-commit`, `publish`, `debugging`, `vibesec`, `review-pr`, `context-docs`, `incident-response`, `security-audit`, `ralph-loop`, `inkrivel_design_system`, `write-a-skill`, `caveman`).
- `/home/luizacabral/.claude/skills/` — diretório de **symlinks** apontando pro `.agents`. Em ago/2026 foram removidos todos menos **`caveman`**, o único ativo. Os arquivos originais continuam no `.agents`.
- `/home/luizacabral/.gemini/skills/` — o Gemini referencia o mesmo `.agents`. Apagar o `.agents` quebra o Gemini junto.

Se você não usa nenhuma delas além do caveman, dá pra levar só o `caveman` e deixar o resto pra trás.

---

## 4. Passo a passo no PC novo

Assumindo Windows + WSL Ubuntu instalados, e Claude Code instalado nos dois.

**1. Clone o repositório no Windows:**
```bash
git clone https://github.com/luecabral/skills.git ~/projects/skills
```
```bash
cd ~/projects/skills && bash setup.sh
```
O `setup.sh` aponta o git pros hooks versionados (`core.hooksPath=.githooks`). **Sem isso nada propaga.**

**2. Clone o repositório no WSL, no lugar certo:**
```bash
git clone https://github.com/luecabral/skills.git ~/.claude/commands
```
```bash
cd ~/.claude/commands && git remote rename origin luecabral
```
O diretório `~/.claude/commands` **é** o clone — não é uma cópia dentro dele. O remoto precisa se chamar `luecabral`, porque é esse nome que o hook do Windows usa no `git pull`.

**3. Confira os caminhos do hook.** O `.githooks/post-commit` usa `$HOME/.claude/commands` no Windows e chama `wsl.exe ... ~/.claude/commands`. Se o nome de usuário mudar, o `$HOME` resolve sozinho — mas confira.

**4. Restaure os arquivos não versionados** (seção 3), dentro do WSL:
```bash
mkdir -p ~/.claude/hooks && cp /caminho/backup/validate-bash-safety.mjs /caminho/backup/sync-local-skills.sh ~/.claude/hooks/ && chmod +x ~/.claude/hooks/sync-local-skills.sh
```
```bash
cp /caminho/backup/settings.json ~/.claude/settings.json && cp /caminho/backup/claude.json ~/.claude.json
```
Ajuste o `SRC_ROOT` dentro do `sync-local-skills.sh` se o caminho do Windows mudou.

**5. Memória:** copie a pasta `memory/` pro caminho equivalente no PC novo (seção 3.4).

**6. Caveman, se quiser:**
```bash
mkdir -p ~/.agents/skills ~/.claude/skills && cp -r /caminho/backup/caveman ~/.agents/skills/ && ln -s ~/.agents/skills/caveman ~/.claude/skills/caveman
```

**7. Teste a engrenagem inteira** com um commit vazio no Windows:
```bash
cd ~/projects/skills && git commit --allow-empty -m "chore: testa o hook"
```
Tem que sair isto, as três linhas:
```
✓ sincronizado com C:\Users\<voce>\.claude\commands
✓ push luecabral
✓ WSL atualizado
```
Se faltar alguma, o próprio hook diz qual comando rodar.

**8. Abra uma sessão nova** e confirme que `/maestro` e `/linear` aparecem.

---

## 5. Armadilhas conhecidas

- **O hook nunca apaga.** Ele copia `*.md` pro destino, mas não remove o que saiu do repo. Skill deletada continua aparecendo no `~/.claude/commands` do Windows até você apagar à mão. No WSL isso não acontece, porque lá é clone git.
- **O flat fica pendente depois do commit.** O hook regenera `<skill>.md` **depois** que o commit fecha, então ele aparece como modificado logo em seguida. Commite junto no próximo (`chore: flat copy do <skill>`).
- **Sessão aberta não recarrega skill.** Qualquer mudança só vale em sessão nova.
- **Não edite `~/.claude/commands/` direto.** É destino. No Windows o hook sobrescreve; no WSL o `git pull` reclama de arquivo não rastreado e trava a propagação.
- **`.gitattributes` força `eol=lf` nos `.md`.** Ao trazer arquivo do WSL pro repo, copie de dentro do WSL pra não introduzir CRLF.
- **O remoto `rsv-ink` foi excluído.** Clone antigo que ainda tenha `origin` apontando pra lá: `git remote remove origin` e depois `git branch --set-upstream-to=luecabral/main main`.
