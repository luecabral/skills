---
name: vibesec
description: Use ao escrever qualquer código que lida com dados do usuário, autenticação, inputs de formulário, APIs externas ou banco de dados. Ativa automaticamente em qualquer implementação de feature para prevenir vulnerabilidades comuns. Use também quando o usuário diz "isso é seguro?", "tem algum problema de segurança aqui?" ou ao revisar código antes de um PR.
---

# VibeSec

Segurança desde o início, não como revisão posterior.

## Quando revisar

Revise automaticamente quando o código tocar em: autenticação e sessões, inputs de formulário ou parâmetros de URL, queries ao banco, APIs externas, upload de arquivos, dados sensíveis (senhas, tokens, CPF), controle de acesso.

## Dois modos de operação

- **Modo escrita** (default): ativa durante o desenvolvimento, ao tocar áreas sensíveis. Revisa o código que está sendo escrito.
- **Modo diff** (pré-PR / pré-merge): ativa quando há branch contra `main` ou PR aberto. Analisa **apenas o que mudou** (`git diff main..HEAD`), reduzindo falso positivo e mirando no escopo do PR. Use antes de pedir review e como gate final.

Se houver branch divergente de `main`, comece pelo modo diff e só expanda pro arquivo inteiro se o achado depender de contexto fora do diff.

## Processo

### Passo 1 — Percorrer o checklist (ver REFERENCE.md)

Categorias a verificar:
- Controle de acesso (IDOR)
- Inputs e sanitização (XSS / Injection)
- Autenticação e sessões
- Requisições externas (SSRF)
- Exposição de dados
- Sessão e cookies
- Rate limit e proteção contra abuso
- Security headers
- Multi-tenancy
- Gestão de segredos
- Uploads e conteúdo
- Concorrência e integridade
- LGPD e privacidade

### Passo 2 — Reportar

Para cada problema encontrado:

```
🚨 [TIPO DO PROBLEMA]
Arquivo: caminho/arquivo.ext — Linha X
Problema: [risco em linguagem clara]
Impacto: [o que um atacante poderia fazer]

❌ Código atual: [trecho]
✅ Correção: [trecho corrigido]
```

Classifique:
- **🚨 CRÍTICO** — exploração direta possível (IDOR, SQL injection, senhas em plain text)
- **⚠️ ALTO** — risco real mas com pré-condições
- **💡 MELHORIA** — boas práticas que reduzem superfície de ataque

### Passo 3 — Auto-ataque

Após o checklist, mude de perspectiva: pense como atacante com conhecimento do sistema.

Para cada achado de risco:
1. Como eu exploraria isso?
2. Qual o impacto máximo possível?
3. A correção realmente fecha esse vetor?

```
→ Identifica vulnerabilidade → Propõe correção → Reavalia como atacante
→ (repete até zerar críticos e altos)
```

Após listar todos os achados, pergunte se o usuário quer aplicar as correções.

## Regras

- Nunca ignore um problema por parecer improvável de ser explorado
- Se não tiver certeza, sinalize como revisão manual necessária
- Proponha sempre a correção, não apenas o problema

## Gate de CI (opcional, recomendado para o ink-connect)

Para virar gate automático antes do merge, adicione a action oficial da Anthropic no workflow do PR:

```yaml
# .github/workflows/security-review.yml
name: Security Review
on:
  pull_request:
    branches: [main]
jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      - uses: anthropics/claude-code-security-review@main
        with:
          anthropic_api_key: ${{ secrets.ANTHROPIC_API_KEY }}
```

A action roda em cima do diff do PR e comenta achados inline — complementa a `vibesec` na escrita, não substitui. Combina com a regra de só mergear com CI verde.
