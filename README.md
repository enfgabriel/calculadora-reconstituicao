# Reconstitui — Central de cálculos de enfermagem

Aplicação web leve, responsiva e sem dependências externas para apoio à conferência de cálculos de enfermagem.

Inclui temas claro, escuro e alto contraste, com preferência salva no navegador.

## Módulos

- **Reconstituição e aspiração:** concentração, volume e marca em seringas U-100, U-40 ou graduadas em mL (1, 3, 5, 10, 20 e 60 mL).
- **Gotejamento:** gotas ou microgotas por minuto a partir do volume, tempo e fator informado no equipo.
- **Bomba de infusão:** duração estimada a partir do volume e da velocidade em mL/h.
- **Dose por peso:** dose total e volume a partir de uma prescrição em mg/kg, com campo opcional para limite máximo já prescrito/protocolar.
- **Oxigenoterapia:** autonomia estimada de cilindro em fluxo contínuo, com pressão, reserva, volume interno e fluxo informados pelo profissional.
- **Compostos líquidos:** converte dose alvo, gotas ou mL em volume a aspirar e mostra os mg entregues por componente.

## Princípios de segurança

- A aplicação não prescreve doses, diluentes, vias ou tempos.
- Escalas U-100/U-40 são apresentadas separadamente de seringas graduadas em mL.
- O fator de gotejamento deve ser conferido no rótulo do equipo.
- Resultados não substituem dupla checagem, bula, prescrição ou protocolo institucional.

## Fórmulas

```text
concentração = conteúdo do frasco / volume final
volume a aspirar = dose / concentração
marca da escala = volume × unidades da escala por mL
gotas/min = volume × fator do equipo / tempo total em minutos
mL/h = volume / tempo em horas
tempo de bomba = volume / velocidade
dose total = mg/kg prescritos × peso
volume da dose = dose total / concentração disponível
oxigênio útil (L) = (pressão atual − reserva) × volume interno do cilindro
autonomia (min) = oxigênio útil / fluxo total em L/min
volume do composto = dose alvo do componente / concentração em mg/mL
dose entregue do componente = volume em mL × concentração em mg/mL
volume em mL = gotas / gotas por mL
```

## Executar e testar

Sirva os arquivos por HTTP e abra `index.html`. Para testar a lógica:

```bash
node calculator.test.mjs
```

## Referências técnicas

- Ministério da Saúde — Fundamentos de Enfermagem / cálculo de medicação.
- Ministério da Saúde — protocolos com cálculo de gotejamento.
- Cofen/Coren-SP — Cálculo Seguro: cálculo e diluição de medicamentos.
- Ministério da Saúde — Protocolo de segurança na prescrição, uso e administração de medicamentos.

## Versão online atual

[Abrir a calculadora publicada](https://enfgabriel.github.io/calculadora-reconstituicao/)
