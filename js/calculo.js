/* ==========================================================
   Regras de negócio do SGA (seção 7 do enunciado)
   Funções pequenas e especializadas, sem acesso ao DOM.
   ========================================================== */

const NOTA_MIN = 0;
const NOTA_MAX = 10;
const PESO_INDIVIDUAL = 0.4;
const PESO_PROJETO = 0.6;
const MEDIA_APROVACAO = 7.0;
const PROJETO_MINIMO_PARA_FINAL = 4.0;

const STATUS = {
  APROVADO: 'Aprovado',
  REPROVADO: 'Reprovado',
  FINAL: 'Fará prova final',
  PENDENTE: 'Pendente' // faltam notas lançadas (não faz parte das regras, só evita cálculo incompleto)
};

/** Evita erros de ponto flutuante (ex.: 6.999999) arredondando em 2 casas. */
function arredondar(n) {
  return Math.round(n * 100) / 100;
}

function notaValida(v) {
  return typeof v === 'number' && isFinite(v) && v >= NOTA_MIN && v <= NOTA_MAX;
}

/** Converte o texto digitado em nota. Vazio => null (nota ainda não lançada). */
function interpretarNota(texto) {
  const t = String(texto ?? '').trim().replace(',', '.');
  if (t === '') return { ok: true, valor: null };
  const n = Number(t);
  if (!isFinite(n)) return { ok: false, erro: 'Digite um número válido.' };
  if (n < NOTA_MIN || n > NOTA_MAX) return { ok: false, erro: 'A nota deve estar entre 0 e 10.' };
  return { ok: true, valor: arredondar(n) };
}

/** Nota Individual = média aritmética de Prova 1 e Prova 2. */
function calcularNotaIndividual(p1, p2) {
  return arredondar((p1 + p2) / 2);
}

/** Nota do Projeto = média aritmética da Fase 1 e Fase 2. */
function calcularNotaProjeto(f1, f2) {
  return arredondar((f1 + f2) / 2);
}

/** Média Final = 40% Individual + 60% Projeto. */
function calcularMediaFinal(individual, projeto) {
  return arredondar(PESO_INDIVIDUAL * individual + PESO_PROJETO * projeto);
}

/** Status inicial (antes da prova final): exatamente três casos exclusivos. */
function definirStatus(mediaFinal, notaProjeto) {
  if (mediaFinal >= MEDIA_APROVACAO) return STATUS.APROVADO;
  if (notaProjeto < PROJETO_MINIMO_PARA_FINAL) return STATUS.REPROVADO;
  return STATUS.FINAL;
}

/** Resultado após o lançamento da prova final: Projeto + Final >= 7 => Aprovado. */
function avaliarProvaFinal(notaProjeto, notaFinal) {
  return arredondar(notaProjeto + notaFinal) >= MEDIA_APROVACAO ? STATUS.APROVADO : STATUS.REPROVADO;
}

/**
 * Avalia um aluno completo.
 * @param {{p1,p2,f1,f2,final}} n notas (null = não lançada)
 * @returns {{individual,projeto,media,status,permiteFinal}}
 */
function avaliarAluno(n) {
  const base = [n.p1, n.p2, n.f1, n.f2];
  if (!base.every(notaValida)) {
    return { individual: null, projeto: null, media: null, status: STATUS.PENDENTE, permiteFinal: false };
  }
  const individual = calcularNotaIndividual(n.p1, n.p2);
  const projeto = calcularNotaProjeto(n.f1, n.f2);
  const media = calcularMediaFinal(individual, projeto);
  let status = definirStatus(media, projeto);
  const permiteFinal = status === STATUS.FINAL;
  if (permiteFinal && notaValida(n.final)) {
    status = avaliarProvaFinal(projeto, n.final);
  }
  return { individual, projeto, media, status, permiteFinal };
}

/** Formata nota para exibição: 8 -> "8.0", 6.05 -> "6.05". */
function formatarNota(v) {
  if (v === null || v === undefined) return '-';
  const s = String(arredondar(v));
  return s.includes('.') ? s : s + '.0';
}

if (typeof module !== 'undefined') {
  module.exports = {
    STATUS, arredondar, notaValida, interpretarNota, calcularNotaIndividual,
    calcularNotaProjeto, calcularMediaFinal, definirStatus, avaliarProvaFinal,
    avaliarAluno, formatarNota
  };
}
