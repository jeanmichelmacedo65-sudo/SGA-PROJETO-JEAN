/* ==========================================================
   Persistência no navegador (localStorage) e helpers de sessão
   ========================================================== */

const CHAVES = {
  professores: 'sga:professores', // professores cadastrados pelo formulário
  perfis: 'sga:perfis',           // alterações de perfil (nome, disciplina, foto) por e-mail
  sessao: 'sga:sessao',           // e-mail do professor logado
  notas: 'sga:notas:'             // + e-mail => { turmaId: { matricula: {p1,p2,f1,f2,final} } }
};

const Store = {
  ler(chave, padrao) {
    try {
      const v = localStorage.getItem(chave);
      return v === null ? padrao : JSON.parse(v);
    } catch (e) { return padrao; }
  },
  gravar(chave, valor) {
    try {
      localStorage.setItem(chave, JSON.stringify(valor));
      return true;
    } catch (e) {
      console.error('Falha ao gravar no localStorage', e);
      return false;
    }
  }
};

/* ---------- Professores e sessão ---------- */

function listarProfessores() {
  return [...PROFESSORES_INICIAIS, ...Store.ler(CHAVES.professores, [])];
}

function buscarProfessor(email) {
  const alvo = String(email).trim().toLowerCase();
  return listarProfessores().find(p => p.email.toLowerCase() === alvo) || null;
}

function cadastrarProfessor(prof) {
  const cadastrados = Store.ler(CHAVES.professores, []);
  cadastrados.push(prof);
  return Store.gravar(CHAVES.professores, cadastrados);
}

function autenticar(email, senha) {
  const p = buscarProfessor(email);
  return p && p.senha === senha ? p : null;
}

function getSessao() { return Store.ler(CHAVES.sessao, null); }
function iniciarSessao(email) { Store.gravar(CHAVES.sessao, email.toLowerCase()); }
function encerrarSessao() { localStorage.removeItem(CHAVES.sessao); }

/** Perfil = dados do professor + alterações salvas (nome, disciplina, foto). */
function getPerfil(email) {
  const base = buscarProfessor(email);
  if (!base) return null;
  const extra = Store.ler(CHAVES.perfis, {})[email.toLowerCase()] || {};
  return { ...base, ...extra };
}

function salvarPerfil(email, dados) {
  const perfis = Store.ler(CHAVES.perfis, {});
  const chave = email.toLowerCase();
  perfis[chave] = { ...(perfis[chave] || {}), ...dados };
  return Store.gravar(CHAVES.perfis, perfis);
}

/* ---------- Turmas e notas ---------- */

function turmasDoProfessor(email) {
  const proprias = TURMAS.filter(t => t.professor.toLowerCase() === email.toLowerCase());
  return proprias.length ? proprias : TURMAS.filter(t => t.modelo);
}

/** Notas originais + edições feitas pelo professor (salvas no navegador). */
function alunosDaTurma(email, turmaId) {
  const edicoes = (Store.ler(CHAVES.notas + email.toLowerCase(), {})[turmaId]) || {};
  return ALUNOS_POR_TURMA[turmaId].map(a => ({ ...a, ...(edicoes[a.matricula] || {}) }));
}

function salvarNotasAluno(email, turmaId, matricula, notas) {
  const chave = CHAVES.notas + email.toLowerCase();
  const tudo = Store.ler(chave, {});
  tudo[turmaId] = tudo[turmaId] || {};
  tudo[turmaId][matricula] = notas;
  return Store.gravar(chave, tudo);
}
