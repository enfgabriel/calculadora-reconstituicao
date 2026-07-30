# Reconstitui — Central de cálculos de enfermagem

Aplicação web leve, responsiva e sem dependências externas para apoio à conferência de cálculos de enfermagem.

Inclui temas claro, escuro, alto contraste e modo plantão, com preferência salva no navegador para o tema.

## Módulos

- **Reconstituição e aspiração:** concentração, volume e marca em seringas U-100, U-40 ou graduadas em mL (1, 3, 5, 10, 20 e 60 mL).
- **Gotejamento:** gotas ou microgotas por minuto a partir do volume, tempo e fator informado no equipo.
- **Bomba de infusão:** duração estimada a partir do volume e da velocidade em mL/h.
- **Dose por peso:** dose por aplicação, dose diária dividida ou mcg/kg/min em bomba, com volume/velocidade conforme a concentração disponível.
- **Oxigenoterapia:** autonomia estimada do cilindro, tempo planejado, margem operacional e alerta de insuficiência para transporte/procedimento.
- **Compostos líquidos:** converte dose alvo, gotas ou mL em volume a aspirar/administrar, com unidade por componente, via selecionada, preparo direto/diluído e apresentações salvas editáveis.

## Princípios de segurança

- A aplicação não prescreve doses, diluentes, vias ou tempos.
- Escalas U-100/U-40 são apresentadas separadamente de seringas graduadas em mL.
- Em U-100, o app reforça que a marcação da seringa não é a unidade terapêutica do medicamento.
- O fator de gotejamento deve ser conferido no rótulo do equipo.
- Apresentações salvas em compostos são atalhos editáveis: confirme sempre bula/frasco e protocolo.
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
dose por horário = (mg/kg/dia × peso) / doses por dia
mL/h = (mcg/kg/min × peso × 60 / 1000) / concentração em mg/mL
oxigênio útil (L) = (pressão atual − reserva) × volume interno do cilindro
autonomia (min) = oxigênio útil / fluxo total em L/min
tempo planejado com margem = tempo necessário × (1 + margem%)
volume do composto = dose alvo do componente / concentração final por mL
dose entregue do componente = volume em mL × concentração final por mL
concentração final diluída = concentração original × volume usado / volume final
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
