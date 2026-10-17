const assert = require('assert');
const c = require('../js/calculo.js');

function aluno(p1, p2, f1, f2, final = null) { return c.avaliarAluno({ p1, p2, f1, f2, final }); }

// 1. Aprovado direto pela média
let r = aluno(8.5, 7.0, 9.0, 8.0);
assert.strictEqual(r.media, 8.2);
assert.strictEqual(r.status, c.STATUS.APROVADO);

// 2. Reprovado direto (projeto < 4)
r = aluno(6.0, 5.0, 3.5, 3.0);
assert.strictEqual(r.projeto, 3.25);
assert.strictEqual(r.status, c.STATUS.REPROVADO);
assert.strictEqual(r.permiteFinal, false);

// 3. Vai para a final, ainda sem nota
r = aluno(5.5, 6.0, 6.5, 6.0);
assert.strictEqual(r.media, 6.05);
assert.strictEqual(r.status, c.STATUS.FINAL);
assert.strictEqual(r.permiteFinal, true);

// 4. Vai para a final e é aprovado (projeto 4,75 + final 3,0)
r = aluno(6.5, 6.0, 5.0, 4.5, 3.0);
assert.strictEqual(r.status, c.STATUS.APROVADO);

// 5. Vai para a final e continua reprovado (projeto 4,0 + final 2,0)
r = aluno(6.0, 6.0, 4.0, 4.0, 2.0);
assert.strictEqual(r.status, c.STATUS.REPROVADO);

// Limites
assert.strictEqual(c.definirStatus(7.0, 0), c.STATUS.APROVADO);       // média exatamente 7
assert.strictEqual(c.definirStatus(6.99, 4.0), c.STATUS.FINAL);       // projeto exatamente 4
assert.strictEqual(c.definirStatus(6.99, 3.99), c.STATUS.REPROVADO);
assert.strictEqual(c.avaliarProvaFinal(4.0, 3.0), c.STATUS.APROVADO); // soma exatamente 7

// Pendente quando falta nota
assert.strictEqual(aluno(8, null, 8, 8).status, c.STATUS.PENDENTE);

// Validação de entrada
assert.strictEqual(c.interpretarNota('').valor, null);
assert.strictEqual(c.interpretarNota('7,5').valor, 7.5);
assert.strictEqual(c.interpretarNota('11').ok, false);
assert.strictEqual(c.interpretarNota('-1').ok, false);
assert.strictEqual(c.interpretarNota('abc').ok, false);

console.log('Todos os testes de cálculo passaram.');
