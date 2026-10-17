/* ==========================================================
   Tela home: turmas, tabela de notas (editável) e perfil
   ========================================================== */

const emailLogado = getSessao();
if (!emailLogado || !buscarProfessor(emailLogado)) location.replace('index.html');

const TAMANHO_PAGINA = 8;
const FOTO_MAX_MB = 2;

let perfil = getPerfil(emailLogado);
const estado = { view: 'turmas', turma: null, alunos: [], pagina: 1 };

const $conteudo = document.getElementById('conteudo');
const $titulo = document.getElementById('titulo');
const $subtitulo = document.getElementById('subtitulo');

/* ---------- utilidades ---------- */

function esc(texto) {
  return String(texto).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function iniciais(nome) {
  const partes = nome.trim().split(/\s+/);
  return ((partes[0]?.[0] || '') + (partes.length > 1 ? partes[partes.length - 1][0] : '')).toUpperCase();
}

let timerToast;
function toast(msg, tipo = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = `toast visivel ${tipo}`;
  clearTimeout(timerToast);
  timerToast = setTimeout(() => el.classList.remove('visivel'), 3200);
}

function atualizarAvatares() {
  document.querySelectorAll('[data-avatar]').forEach(el => {
    if (perfil.foto) {
      el.style.backgroundImage = `url("${perfil.foto}")`;
      el.textContent = '';
    } else {
      el.style.backgroundImage = '';
      el.textContent = iniciais(perfil.nome);
    }
  });
  document.getElementById('lateral-nome').textContent = 'Prof. ' + perfil.nome.split(' ').slice(0, 2).join(' ');
}

function definirCabecalho(titulo, subtitulo) {
  $titulo.textContent = titulo;
  $subtitulo.textContent = subtitulo;
}

function marcarMenu(view) {
  document.querySelectorAll('.nav button[data-view]').forEach(b => b.classList.toggle('ativo', b.dataset.view === view));
}

/* ---------- navegação (troca só a área central) ---------- */

function irPara(view, turmaId) {
  estado.view = view;
  marcarMenu(view === 'tabela' ? 'turmas' : view);
  if (view === 'turmas') renderTurmas();
  else if (view === 'tabela') abrirTurma(turmaId);
  else if (view === 'perfil') renderPerfil();
}

document.querySelectorAll('.nav button[data-view]').forEach(b => b.addEventListener('click', () => irPara(b.dataset.view)));
document.getElementById('atalho-perfil').addEventListener('click', () => irPara('perfil'));
document.getElementById('btn-sair').addEventListener('click', () => {
  encerrarSessao();
  location.href = 'index.html';
});

/* ---------- 1) cartões de turmas ---------- */

function renderTurmas() {
  definirCabecalho('Minhas turmas', 'Selecione uma turma para ver o diário de notas');
  const turmas = turmasDoProfessor(emailLogado);

  $conteudo.innerHTML = `
    <div class="grade-turmas">
      ${turmas.map(t => `
        <button class="turma" data-id="${t.id}" style="--cor:${t.cor}">
          <div class="inicial">${esc(t.disciplina[0])}</div>
          <h3>${esc(t.disciplina)}</h3>
          <div class="meta">${esc(t.periodo)}</div>
          <div class="meta">${t.qtd} alunos</div>
          <span class="abrir">Abrir turma <i class="bi bi-chevron-right"></i></span>
        </button>`).join('')}
    </div>
    <div class="cartao dica">
      <strong>Dica</strong>
      <span>Clique em um cartão de turma para abrir, no corpo desta mesma página, a tabela de alunos e notas daquela turma.</span>
    </div>`;

  $conteudo.querySelectorAll('.turma').forEach(c => c.addEventListener('click', () => irPara('tabela', c.dataset.id)));
}

/* ---------- 2) tabela de notas ---------- */

function abrirTurma(turmaId) {
  const turma = TURMAS.find(t => t.id === turmaId);
  estado.turma = turma;
  estado.alunos = alunosDaTurma(emailLogado, turmaId);
  estado.pagina = 1;
  definirCabecalho(turma.disciplina, `${turma.periodo} · ${estado.alunos.length} alunos matriculados`);

  $conteudo.innerHTML = `
    <button class="voltar" id="voltar"><i class="bi bi-chevron-left"></i> Voltar para minhas turmas</button>
    <div class="tabela-wrap">
      <table>
        <thead>
          <tr>
            <th>Matrícula</th><th>Nome do aluno</th><th>P1</th><th>P2</th><th>Proj. F1</th><th>Proj. F2</th>
            <th>Média</th><th>Status</th><th>Final</th><th></th>
          </tr>
        </thead>
        <tbody id="corpo"></tbody>
      </table>
    </div>
    <div class="rodape-tabela">
      <span id="resumo"></span>
      <div class="paginacao" id="paginacao"></div>
    </div>
    <div class="legenda">
      <span><span class="badge aprovado">Aprovado</span> média ≥ 7,0 ou projeto + final ≥ 7,0</span>
      <span><span class="badge final">Fará prova final</span> média &lt; 7,0 e projeto ≥ 4,0</span>
      <span><span class="badge reprovado">Reprovado</span> média &lt; 7,0 e projeto &lt; 4,0, ou projeto + final &lt; 7,0</span>
    </div>`;

  document.getElementById('voltar').addEventListener('click', () => irPara('turmas'));
  document.getElementById('corpo').addEventListener('change', aoEditarNota);
  document.getElementById('corpo').addEventListener('click', e => {
    const btn = e.target.closest('.editar');
    if (btn) btn.closest('tr').querySelector('input.nota')?.focus();
  });

  renderPagina();
}

function celulaStatus(av) {
  const classe = { Aprovado: 'aprovado', Reprovado: 'reprovado', 'Fará prova final': 'final', Pendente: 'pendente' }[av.status];
  return `<span class="badge ${classe}">${av.status}</span>`;
}

function celulaFinal(a, av) {
  if (!av.permiteFinal) return '-';
  return `<input class="nota" data-campo="final" type="text" inputmode="decimal" value="${a.final ?? ''}" aria-label="Nota da final de ${esc(a.nome)}">`;
}

function inputNota(a, campo, rotulo) {
  return `<td><input class="nota" data-campo="${campo}" type="text" inputmode="decimal" value="${a[campo] ?? ''}" aria-label="${rotulo} de ${esc(a.nome)}"></td>`;
}

function linhaHtml(a) {
  const av = avaliarAluno(a);
  return `
    <tr data-mat="${a.matricula}">
      <td>${a.matricula}</td>
      <td class="nome">${esc(a.nome)}</td>
      ${inputNota(a, 'p1', 'Prova 1')}${inputNota(a, 'p2', 'Prova 2')}
      ${inputNota(a, 'f1', 'Projeto fase 1')}${inputNota(a, 'f2', 'Projeto fase 2')}
      <td class="media">${formatarNota(av.media)}</td>
      <td class="status">${celulaStatus(av)}</td>
      <td class="final">${celulaFinal(a, av)}</td>
      <td><button class="btn-icone editar" title="Editar notas" aria-label="Editar notas"><i class="bi bi-pencil"></i></button></td>
    </tr>`;
}

function renderPagina() {
  const total = estado.alunos.length;
  const paginas = Math.max(1, Math.ceil(total / TAMANHO_PAGINA));
  estado.pagina = Math.min(Math.max(1, estado.pagina), paginas);
  const ini = (estado.pagina - 1) * TAMANHO_PAGINA;
  const fatia = estado.alunos.slice(ini, ini + TAMANHO_PAGINA);

  document.getElementById('corpo').innerHTML = fatia.map(linhaHtml).join('');
  document.getElementById('resumo').textContent = `Mostrando ${ini + 1}-${ini + fatia.length} de ${total} alunos`;
  renderPaginacao(paginas);
}

function renderPaginacao(paginas) {
  const atual = estado.pagina;
  const visiveis = new Set([1, paginas, atual - 1, atual, atual + 1].filter(p => p >= 1 && p <= paginas));
  const lista = [...visiveis].sort((a, b) => a - b);

  let html = `<button data-p="${atual - 1}" ${atual === 1 ? 'disabled' : ''} aria-label="Página anterior">&lt;</button>`;
  lista.forEach((p, i) => {
    if (i > 0 && p - lista[i - 1] > 1) html += '<span>…</span>';
    html += `<button data-p="${p}" class="${p === atual ? 'atual' : ''}">${p}</button>`;
  });
  html += `<button data-p="${atual + 1}" ${atual === paginas ? 'disabled' : ''} aria-label="Próxima página">&gt;</button>`;

  const el = document.getElementById('paginacao');
  el.innerHTML = html;
  el.querySelectorAll('button').forEach(b => b.addEventListener('click', () => {
    estado.pagina = Number(b.dataset.p);
    renderPagina();
  }));
}

/** Edição de uma nota: valida, salva, recalcula e atualiza só a linha do aluno. */
function aoEditarNota(e) {
  const input = e.target.closest('input.nota');
  if (!input) return;

  const tr = input.closest('tr');
  const aluno = estado.alunos.find(a => a.matricula === tr.dataset.mat);
  const campo = input.dataset.campo;
  const leitura = interpretarNota(input.value);

  if (!leitura.ok) {
    input.classList.add('invalida');
    toast(leitura.erro, 'erro');
    setTimeout(() => { input.value = aluno[campo] ?? ''; input.classList.remove('invalida'); }, 900);
    return;
  }

  aluno[campo] = leitura.valor;
  let av = avaliarAluno(aluno);
  // a nota da final só vale enquanto o aluno estiver na situação "Fará prova final"
  if (!av.permiteFinal && aluno.final !== null) {
    aluno.final = null;
    av = avaliarAluno(aluno);
  }

  const { p1, p2, f1, f2, final } = aluno;
  if (!salvarNotasAluno(emailLogado, estado.turma.id, aluno.matricula, { p1, p2, f1, f2, final })) {
    toast('Não foi possível salvar no navegador.', 'erro');
  }

  input.value = leitura.valor ?? '';
  tr.querySelector('.media').textContent = formatarNota(av.media);
  tr.querySelector('.status').innerHTML = celulaStatus(av);
  if (campo !== 'final') tr.querySelector('.final').innerHTML = celulaFinal(aluno, av);
}

/* ---------- 3) perfil e foto ---------- */

function renderPerfil() {
  definirCabecalho('Meu perfil', 'Atualize sua foto e seus dados cadastrais');

  $conteudo.innerHTML = `
    <div class="cartao perfil">
      <div class="perfil-foto">
        <div class="foto-wrap">
          <div class="avatar grande" data-avatar></div>
          <span class="cam"><i class="bi bi-camera"></i></span>
        </div>
        <div>
          <strong>Foto do perfil</strong>
          <small>PNG ou JPG, até ${FOTO_MAX_MB} MB. Recomendado 400x400 px.</small>
          <div class="acoes">
            <input type="file" id="foto" accept="image/png,image/jpeg" hidden>
            <button class="btn" id="alterar-foto">Alterar foto</button>
            <button class="btn btn-secundario" id="remover-foto">Remover</button>
          </div>
        </div>
      </div>

      <form id="form-perfil" novalidate>
        <div class="campo"><label for="p-nome">Nome completo</label>
          <input id="p-nome" value="${esc(perfil.nome)}"></div>
        <div class="campo"><label for="p-email">E-mail institucional</label>
          <input id="p-email" value="${esc(perfil.email)}" readonly></div>
        <div class="campo"><label for="p-disc">Disciplina principal</label>
          <input id="p-disc" value="${esc(perfil.disciplina)}"></div>
        <button class="btn" type="submit">Salvar</button>
      </form>
    </div>`;

  atualizarAvatares();

  const seletor = document.getElementById('foto');
  document.getElementById('alterar-foto').addEventListener('click', () => seletor.click());
  seletor.addEventListener('change', () => trocarFoto(seletor.files[0]));

  document.getElementById('remover-foto').addEventListener('click', () => {
    perfil.foto = null;
    salvarPerfil(emailLogado, { foto: null });
    atualizarAvatares();
    toast('Foto removida.', 'ok');
  });

  document.getElementById('form-perfil').addEventListener('submit', e => {
    e.preventDefault();
    const nome = document.getElementById('p-nome').value.trim();
    const disciplina = document.getElementById('p-disc').value.trim();
    if (nome.split(/\s+/).length < 2) return toast('Informe o nome completo.', 'erro');
    if (!disciplina) return toast('Informe a disciplina principal.', 'erro');

    salvarPerfil(emailLogado, { nome, disciplina });
    perfil = getPerfil(emailLogado);
    atualizarAvatares();
    toast('Dados atualizados.', 'ok');
  });
}

/** Valida a imagem, reduz para 400x400 e guarda como texto (data URL) no localStorage. */
function trocarFoto(arquivo) {
  if (!arquivo) return;
  if (!['image/png', 'image/jpeg'].includes(arquivo.type)) return toast('Use uma imagem PNG ou JPG.', 'erro');
  if (arquivo.size > FOTO_MAX_MB * 1024 * 1024) return toast(`A imagem deve ter até ${FOTO_MAX_MB} MB.`, 'erro');

  const leitor = new FileReader();
  leitor.onerror = () => toast('Não foi possível ler a imagem.', 'erro');
  leitor.onload = () => {
    const img = new Image();
    img.onerror = () => toast('Imagem inválida.', 'erro');
    img.onload = () => {
      const lado = 400;
      const canvas = document.createElement('canvas');
      canvas.width = canvas.height = lado;
      const corte = Math.min(img.width, img.height);
      canvas.getContext('2d').drawImage(img, (img.width - corte) / 2, (img.height - corte) / 2, corte, corte, 0, 0, lado, lado);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);

      if (!salvarPerfil(emailLogado, { foto: dataUrl })) return toast('Sem espaço no armazenamento do navegador.', 'erro');
      perfil.foto = dataUrl;
      atualizarAvatares();
      toast('Foto atualizada.', 'ok');
    };
    img.src = leitor.result;
  };
  leitor.readAsDataURL(arquivo);
}

/* ---------- início ---------- */

atualizarAvatares();
irPara(location.hash === '#perfil' ? 'perfil' : 'turmas');
