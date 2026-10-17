# SGA - Sistema de Gestão Acadêmica (área do docente)

Projeto em HTML5, CSS3 e JavaScript puro (sem frameworks). Ícones: Bootstrap Icons via CDN.

## Como abrir no VS Code

1. `File > Open Folder...` e escolha a pasta `sga`.
2. Instale a extensão **Live Server** e clique em **Go Live** (ou abra `index.html` direto no navegador).

## Login de teste

- E-mail: `ana.menezes@maisunifacisa.com.br`
- Senha: `123456`

Também é possível criar um professor novo em `cadastro.html` (ele recebe as turmas modelo para testar).

## Estrutura

```
sga/
├── index.html        login
├── cadastro.html     cadastro de professor
├── home.html         turmas, tabela de notas e perfil (troca só a área central)
├── css/style.css
└── js/
    ├── dados.js      professores, turmas e alunos mocados
    ├── calculo.js    regras de negócio (seção 7)
    ├── storage.js    localStorage e sessão
    ├── auth.js       login e cadastro
    └── home.js       telas da home, edição de notas, perfil
```

## Regras de cálculo (js/calculo.js)

- Nota Individual = (P1 + P2) / 2
- Nota do Projeto = (Fase 1 + Fase 2) / 2
- Média Final = 0,4 × Individual + 0,6 × Projeto
- Média >= 7,0 → Aprovado; Média < 7,0 e Projeto < 4,0 → Reprovado; senão → Fará prova final
- Com nota da final lançada: Projeto + Final >= 7,0 → Aprovado; senão Reprovado
- Se faltar alguma nota, o aluno aparece como "Pendente" (não calcula média).

## Cenários de teste (turma Engenharia de Software, primeiros alunos)

1. Beatriz: aprovada direto pela média
2. Carlos e Fernanda: reprovados por projeto < 4,0
3. Daniela: vai para a final (sem nota lançada, campo Final editável)
4. Gustavo: foi para a final e foi aprovado
5. Helena: foi para a final e permaneceu reprovada

## Teste das regras no terminal

```
node test/calculo.test.js
```
