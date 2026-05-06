# Test Gate — Referência: Testes de segurança

Obrigatório quando a task tocou em autenticação, dados do usuário, uploads ou controle de acesso.

## Checklist de segurança

- [ ] Acesso sem token → deve retornar 401
- [ ] Token expirado → deve retornar 401
- [ ] Token válido de outro usuário → deve retornar 403
- [ ] Usuário A tentando acessar recurso do usuário B → deve retornar 403
- [ ] Tenant A tentando acessar dados do tenant B → deve retornar 403
- [ ] Exceder rate limit → deve retornar 429
- [ ] Payload com SQL injection → deve ser rejeitado
- [ ] Payload com XSS → deve ser sanitizado
- [ ] Upload de arquivo com tipo inválido → deve ser rejeitado
- [ ] Upload de arquivo acima do tamanho máximo → deve ser rejeitado
