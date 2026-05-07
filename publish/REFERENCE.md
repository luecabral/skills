# Publish — Checklist de Revisão

## Funcionalidade
- [ ] Faz o que foi proposto? Edge cases óbvios tratados?

## Segurança
- [ ] Inputs sanitizados em todas as camadas?
- [ ] Recursos verificam propriedade antes de retornar (sem IDOR)?
- [ ] Dados sensíveis não aparecem em logs ou respostas?
- [ ] Nenhuma secret no código ou arquivos commitados?
- [ ] Security headers configurados (CSP, HSTS, X-Frame-Options)?
- [ ] Rate limit em endpoints de auth e dados sensíveis?
- [ ] Cookies com `HttpOnly`, `Secure` e `SameSite`?
- [ ] Multi-tenancy: `tenant_id` validado em todas as queries?
- [ ] Uploads: MIME type, magic bytes e tamanho validados no servidor?
- [ ] Operações financeiras/contadores protegidos contra race condition?
- [ ] IA no sistema: inputs protegidos contra prompt injection?

## UX
- [ ] Ações assíncronas têm feedback visual (loading, sucesso, erro)?
- [ ] Mensagens de erro são específicas — nunca "Algo deu errado"?
- [ ] Empty states implementados?
- [ ] Interface volta ao estado correto após erro (não fica presa em loading)?
- [ ] Confirmação em ações destrutivas?
- [ ] Inputs têm `label` (não só placeholder)?
- [ ] Botões com ícone têm `aria-label`?
- [ ] Imagens têm `alt` descritivo?
- [ ] Navegação por Tab em ordem lógica?
- [ ] Componente já existe no projeto? (nunca recriar sem razão)

## Qualidade
- [ ] Sem `console.log`, `debugger` ou código de debug?
- [ ] Testes cobrem interface pública, não implementação interna?
