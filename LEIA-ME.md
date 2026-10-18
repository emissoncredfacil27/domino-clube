# Dominó Clube — código inicial

Abra index.html em um navegador. Não requer instalação ou bibliotecas externas. Para links compartilháveis, hospede o arquivo por HTTPS. Este pacote entrega estrutura de telas, fluxo e um motor local de partidas contra robôs. Não entrega um serviço multiplayer em produção.

## Telas e fluxo

| Tela | Conteúdo e ação |
|---|---|
| Início | Modalidades, desempenho local e criar mesa |
| Criar mesa | Nome, 2/4 participantes, modalidade, nível dos robôs, sem aposta ou valor simulado mínimo R$ 5 |
| Convite | Código, resumo completo das regras, valor, taxa, aceite e WhatsApp com mensagem pronta |
| Carteira | Estado indisponível para saldo/Pix/saques, preferência de limite diário e pausa local |
| Partida | Turnos, pontas, mão, estoque, quantidade de pedras adversárias e desistência |
| Resultado | Vencedor/empate, todas as mãos, pontos e histórico local |
| Ajustes | Cor de pedras/mesa e intervalo dos robôs |

Fluxo local: Início → Criar → Revisar e aceitar → Iniciar com robôs → Partida → Resultado.
Fluxo online planejado: dono cria → amigos abrem convite → servidor apresenta regras e valor oficiais → todos aceitam a mesma versão → dono inicia → servidor valida lugares/aceites/reservas → partida → liquidação única → resultado.

O botão WhatsApp abre uma mensagem para o usuário escolher o destinatário e enviar. O link contém configuração da demonstração; não é uma sala compartilhada. Quem abrir poderá iniciar sua própria simulação. Não há lista de presença nem sincronização entre aparelhos.

## Regras da casa implementadas

São propostas iniciais, não uma afirmação de que os nomes tenham regras universais. Validar especialmente Ponta de 5 antes da versão final.

- Duplo-seis: 28 pedras, 7 por participante, 2 ou 4 jogadores individuais, sem duplas por equipe. Primeiro jogador aleatório; primeira pedra livre.
- Clássico: comprar até encontrar encaixe ou acabar o estoque; passar apenas sem encaixe. Vence quem esvazia a mão; trancamento vence menor soma na mão; igualdade resulta em empate.
- Fechado: não compra. Pedras não distribuídas permanecem fora do jogo. Todos passarem consecutivamente encerra a rodada; menor soma vence, igualdade empata.
- Ponta de 5: compra como Clássico; soma das duas pontas, quando múltiplo positivo de 5, rende essa quantidade de pontos. Sem ramificações por duplas. Ao bater ou trancar, maior pontuação vence; menor soma na mão desempata. Persistindo igualdade, empate. Uma rodada por partida; sem meta de 100/150 pontos nesta versão.
- Robô fácil escolhe jogada aleatória; médio prioriza descartar a maior soma; difícil também prioriza pontos em Ponta de 5. Não há busca profunda nem acesso às mãos adversárias para decidir.
- Ao concluir, exibe todas as mãos, incluindo em abandono.

## Apostas e segurança: escopo inicial

Não há dinheiro real, cadastro real, upload de documentos, verificação de identidade/idade, depósito, saque, saldo financeiro ou bloqueio de valores. A declaração de idade é somente uma etapa visual. Os botões Pix/saque ficam desabilitados. O valor exibido é simulado; estatísticas locais podem ser alteradas pelo próprio usuário.

Proposta de regras para futura integração, a ser validada antes do lançamento:

1. Todos aceitam o mesmo valor em centavos, mínimo 500, regras versionadas e taxa explícita. Taxa proposta no protótipo: zero. Prêmio teórico: valor por pessoa × número de participantes.
2. Cancelamento antes do início devolve todas as reservas. Empate devolve reservas integralmente e sem taxa.
3. Desistência após o início: em 2 jogadores, vitória do adversário; em 4, encerramento da mesa e devolução das reservas nesta proposta inicial, sujeita à revisão por risco de abuso. O protótipo apenas registra abandono, sem liquidar prêmio.
4. Queda de conexão: prazo proposto de 120 segundos para reconectar com a mesma identidade. O servidor mantém a mesa pausada; expirado o prazo, aplica a regra de desistência. Falha do serviço invalida a partida e devolve reservas. Esses temporizadores NÃO estão implementados no arquivo local.
5. Não permitir apostas contra robôs com dinheiro real. Limites diários e pausa validados no servidor antes de aceitar depósitos ou entrar em partidas valendo. Conta pausada conserva acesso ao histórico e saque disponível conforme estado da transação.
6. Exibir em toda confirmação de aposta: 18+, valor individual, total, taxa, prêmio, regra de empate, desistência e desconexão, aviso de jogo responsável.

## Arquitetura para implementação online

Frontend HTTPS → API autenticada → serviço autoritativo de mesas/turnos → banco transacional. Canal WebSocket ou equivalente transmite presença e eventos com número sequencial; reconexão recupera snapshot autorizado. Servidor embaralha, valida movimentos e envia a cada jogador somente sua mão e as contagens adversárias. Revela mãos apenas no encerramento.

Módulos separados: identidade/idade via provedor; pagamentos; livro financeiro; partidas; auditoria; limites e pausa. Nenhum segredo do provedor no HTML. Seleção de provedor e viabilidade regulatória ainda não avaliadas. Este pacote não certifica autorização para operar apostas.

### Contratos de API propostos (não implementados)

| Método / rota | Responsabilidade |
|---|---|
| POST /sessions | Autenticar usuário, sessão segura e proteção contra abuso |
| POST /identity/sessions | Criar sessão do provedor de identidade; sem guardar documento no navegador |
| POST /rooms | Criar mesa com enum de modalidade, 2/4 lugares, valor inteiro em centavos e versão das regras |
| GET /invites/:token | Mostrar resumo público mínimo da mesa, sem dados pessoais nem mãos |
| POST /rooms/:id/join | Ocupar lugar atomicamente, impedindo duplicidade e excesso de vagas |
| POST /rooms/:id/accept | Registrar usuário, valor, taxa e hash/versão das regras aceitas |
| POST /rooms/:id/start | Somente dono; validar ocupação, aceites, identidade, pausa e saldo de todos |
| POST /rooms/:id/moves | Validar turno, pedra, ponta e sequência esperada; rejeitar duplicação |
| GET /rooms/:id/events?after=N | Eventos autorizados para recuperação de conexão |
| POST /rooms/:id/leave | Aplicar política de desistência no servidor |
| GET /wallet | Saldo disponível/bloqueado e extrato paginado autenticado |
| POST /pix/deposits | Criar cobrança no provedor com chave de idempotência e limite diário atômico |
| POST /withdrawals | Validar titularidade, saldo disponível e reservar valor até confirmação |
| POST /webhooks/payments | Verificar assinatura, impedir replay e conciliar evento oficial do provedor |
| PATCH /account/limits | Aplicar limite no servidor; definir política para aumentos e reduções |
| POST /account/pause | Impedir novas apostas/depósitos durante a pausa |

### Dados e invariantes

users, identity_checks, account_controls, rooms, seats, rule_versions, consents, matches, match_events, wallet_accounts, ledger_entries, payment_events, withdrawals, settlements.

- Dinheiro em centavos inteiros, nunca ponto flutuante. Livro financeiro de partidas dobradas, imutável e conciliado com o provedor.
- Transação única para reservar o valor de todos ao iniciar: se um falhar, desfazer todas as reservas e não iniciar.
- Liquidação com restrição única por match_id. Confirmar resultado autoritativo antes de transferir reservas ao vencedor e taxa à conta do app.
- Webhooks deduplicados por ID oficial do evento. Depósitos só creditados após confirmação autenticada do provedor; nunca pelo retorno visual do Pix.
- Autorização por usuário/mesa em todas as rotas, proteção CSRF conforme mecanismo de sessão, rate limiting, logs de auditoria sem documentos/segredos.
- Convite online com token aleatório opaco, expiração e regras recuperadas do servidor. Não confiar em valor ou regra enviados pelo link.
- Saque com estados requested → reserved → submitted → paid/failed; falha conciliada libera reserva uma vez.

## Próximas entregas

1. Confirmar as regras locais e se 4 jogadores significa individual ou duplas.
2. Implementar backend, presença, convite real, reconexão e testes de concorrência sem dinheiro.
3. Integrar identidade e controles de conta.
4. Avaliar operação de apostas e provedor adequado antes de integrar pagamentos reais.

## Limitações de verificação

O pacote inclui testes automáticos de conservação das 28 pedras, encaixes e conclusão de partidas simuladas nas três modalidades com 2/4 jogadores e nos três níveis. A interface não foi validada visualmente em um iPhone nesta execução.
