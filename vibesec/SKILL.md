---
name: vibesec
description: Use ao escrever qualquer código que lida com dados do usuário, autenticação, inputs de formulário, APIs externas ou banco de dados. Ativa automaticamente em qualquer implementação de feature para prevenir vulnerabilidades comuns. Use também quando o usuário diz "isso é seguro?", "tem algum problema de segurança aqui?" ou ao revisar código antes de um PR.
---

# VibeSec

Segurança desde o início, não como revisão posterior.

## Quando revisar

Revise automaticamente quando o código tocar em: autenticação e sessões, inputs de formulário ou parâmetros de URL, queries ao banco, APIs externas, upload de arquivos, dados sensíveis (senhas, tokens, CPF), controle de acesso.

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
