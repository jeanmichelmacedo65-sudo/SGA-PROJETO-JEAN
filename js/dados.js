/* ==========================================================
   Dados mocados do SGA (professores, turmas e alunos)
   Nada é buscado de servidor/API: tudo vive neste arquivo.
   ========================================================== */

const PROFESSORES_INICIAIS = [
  {
    nome: 'Ana Paula Menezes',
    email: 'ana.menezes@maisunifacisa.com.br',
    disciplina: 'Engenharia de Software',
    senha: '123456'
  },
  {
    nome: 'Carlos Henrique Souza',
    email: 'carlos.souza@maisunifacisa.com.br',
    disciplina: 'Banco de Dados II',
    senha: '123456'
  }
];

/* Turmas. Se o professor logado não for dono de nenhuma (ex.: recém-cadastrado),
   ele recebe as turmas modelo marcadas com "modelo: true" para poder testar o sistema. */
const TURMAS = [
  { id: 'eng-soft-2026-1', disciplina: 'Engenharia de Software', periodo: 'ADS 2026.1', cor: '#186FD9', qtd: 38, semente: 11, professor: 'ana.menezes@maisunifacisa.com.br', modelo: true },
  { id: 'bd2-2026-1',      disciplina: 'Banco de Dados II',      periodo: 'ADS 2026.1', cor: '#279E5B', qtd: 31, semente: 23, professor: 'ana.menezes@maisunifacisa.com.br', modelo: true },
  { id: 'web-2026-1',      disciplina: 'Programação Web',        periodo: 'ADS 2026.1', cor: '#F0A019', qtd: 42, semente: 37, professor: 'ana.menezes@maisunifacisa.com.br', modelo: true },
  { id: 'est-dados-2025-2',disciplina: 'Estrutura de Dados',     periodo: 'ADS 2025.2', cor: '#E63946', qtd: 29, semente: 51, professor: 'ana.menezes@maisunifacisa.com.br', modelo: true },
  { id: 'redes-2026-1',    disciplina: 'Redes de Computadores',  periodo: 'ADS 2026.1', cor: '#6F42C1', qtd: 26, semente: 67, professor: 'carlos.souza@maisunifacisa.com.br', modelo: false }
];

/* Os primeiros alunos da turma 1 cobrem os cenários de teste da seção 13 do enunciado. */
const ALUNOS_CENARIOS = [
  // 1. Aprovado direto pela média
  { nome: 'Beatriz Andrade Souza',   p1: 8.5, p2: 7.0, f1: 9.0, f2: 8.0, final: null },
  // 2. Reprovado direto (projeto < 4,0)
  { nome: 'Carlos Eduardo Lima',     p1: 6.0, p2: 5.0, f1: 3.5, f2: 3.0, final: null },
  // 3. Vai para a final (ainda sem nota da final)
  { nome: 'Daniela Ferreira Costa',  p1: 5.5, p2: 6.0, f1: 6.5, f2: 6.0, final: null },
  // 4. Aprovado direto
  { nome: 'Eduardo Nascimento',      p1: 9.0, p2: 8.5, f1: 9.5, f2: 9.0, final: null },
  // 5. Reprovado direto
  { nome: 'Fernanda Melo Rocha',     p1: 4.0, p2: 3.5, f1: 2.0, f2: 3.0, final: null },
  // 6. Foi para a final e foi aprovado (projeto 4,75 + final 3,0 >= 7)
  { nome: 'Gustavo Pereira Dias',    p1: 6.5, p2: 6.0, f1: 5.0, f2: 4.5, final: 3.0 },
  // 7. Foi para a final e permaneceu reprovado (projeto 4,0 + final 2,0 < 7)
  { nome: 'Helena Barbosa Alves',    p1: 6.0, p2: 6.0, f1: 4.0, f2: 4.0, final: 2.0 }
];

const NOMES = ['Ana', 'Bruno', 'Camila', 'Diego', 'Eduarda', 'Felipe', 'Gabriela', 'Henrique', 'Isabela', 'João',
  'Karina', 'Lucas', 'Mariana', 'Natália', 'Otávio', 'Paula', 'Rafael', 'Sofia', 'Thiago', 'Vitória'];
const SOBRENOMES = ['Almeida', 'Barros', 'Cardoso', 'Duarte', 'Escobar', 'Farias', 'Gomes', 'Holanda', 'Ibiapina',
  'Jesus', 'Monteiro', 'Neves', 'Oliveira', 'Pinto', 'Queiroz', 'Ramos', 'Santos', 'Teixeira', 'Vieira', 'Xavier'];

/** Gerador pseudo-aleatório determinístico: os mesmos alunos aparecem sempre. */
function criarGerador(semente) {
  let s = semente;
  return function () {
    s = (s * 1664525 + 1013904223) % 4294967296;
    return s / 4294967296;
  };
}

function notaAleatoria(rnd, min, max) {
  const passos = Math.round((max - min) / 0.5);
  return min + Math.floor(rnd() * (passos + 1)) * 0.5;
}

function gerarAlunos(turma, indiceTurma) {
  const rnd = criarGerador(turma.semente);
  const base = 2023100000 + indiceTurma * 1000;
  const lista = [];
  for (let i = 0; i < turma.qtd; i++) {
    const matricula = String(base + 521 + i);
    if (indiceTurma === 0 && i < ALUNOS_CENARIOS.length) {
      lista.push({ matricula, ...ALUNOS_CENARIOS[i] });
      continue;
    }
    const nome = NOMES[Math.floor(rnd() * NOMES.length)] + ' ' +
      SOBRENOMES[Math.floor(rnd() * SOBRENOMES.length)] + ' ' +
      SOBRENOMES[Math.floor(rnd() * SOBRENOMES.length)];
    const aluno = {
      matricula, nome,
      p1: notaAleatoria(rnd, 3, 10), p2: notaAleatoria(rnd, 3, 10),
      f1: notaAleatoria(rnd, 3, 10), f2: notaAleatoria(rnd, 3, 10),
      final: null
    };
    // alguns alunos que vão para a final já têm nota lançada
    const av = avaliarAluno(aluno);
    if (av.permiteFinal && rnd() > 0.6) aluno.final = notaAleatoria(rnd, 0, 6);
    lista.push(aluno);
  }
  return lista;
}

/** Alunos de cada turma, mocados em memória (indexados por id da turma). */
const ALUNOS_POR_TURMA = {};
TURMAS.forEach((t, i) => { ALUNOS_POR_TURMA[t.id] = gerarAlunos(t, i); });
