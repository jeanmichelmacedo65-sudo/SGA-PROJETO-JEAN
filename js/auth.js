/* ==========================================================
   Login e cadastro
   ========================================================== */

function mostrarAviso(texto, tipo) {
  const el = document.getElementById('aviso');
  el.innerHTML = texto ? `<div class="aviso ${tipo}">${texto}</div>` : '';
}

/* ---------- Login ---------- */

const formLogin = document.getElementById('form-login');
if (formLogin) {
  // Já logado? Vai direto para a home.
  if (getSessao() && buscarProfessor(getSessao())) location.replace('home.html');

  const params = new URLSearchParams(location.search);
  if (params.get('cadastrado')) {
    mostrarAviso('Cadastro realizado com sucesso! Faça login para continuar.', 'ok');
    document.getElementById('email').value = params.get('cadastrado');
  }

  document.getElementById('ver-senha').addEventListener('click', e => {
    const campo = document.getElementById('senha');
    const mostrar = campo.type === 'password';
    campo.type = mostrar ? 'text' : 'password';
    e.currentTarget.innerHTML = `<i class="bi bi-eye${mostrar ? '-slash' : ''}"></i>`;
  });

  document.getElementById('esqueci').addEventListener('click', e => {
    e.preventDefault();
    mostrarAviso('Recuperação de senha não disponível nesta versão do protótipo.', 'erro');
  });

  formLogin.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('email').value.trim();
    const senha = document.getElementById('senha').value;

    if (!email || !senha) return mostrarAviso('Informe e-mail e senha.', 'erro');

    const prof = autenticar(email, senha);
    if (!prof) return mostrarAviso('E-mail ou senha incorretos.', 'erro');

    iniciarSessao(prof.email);
    location.href = 'home.html';
  });
}

/* ---------- Cadastro ---------- */

const formCadastro = document.getElementById('form-cadastro');
if (formCadastro) {
  const campos = ['nome', 'email', 'disciplina', 'senha', 'confirmar'];

  function erroCampo(id, msg) {
    const campo = document.getElementById(id).closest('.campo');
    campo.classList.toggle('invalido', !!msg);
    campo.querySelector('.erro').textContent = msg || '';
    return !msg;
  }

  function validarCadastro() {
    const v = Object.fromEntries(campos.map(c => [c, document.getElementById(c).value.trim()]));
    const senhaBruta = document.getElementById('senha').value;
    const confirmaBruta = document.getElementById('confirmar').value;
    let ok = true;

    ok = erroCampo('nome', v.nome.split(/\s+/).length >= 2 ? '' : 'Informe o nome completo.') && ok;
    const emailValido = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email);
    let msgEmail = emailValido ? '' : 'Informe um e-mail válido.';
    if (emailValido && buscarProfessor(v.email)) msgEmail = 'Este e-mail já está cadastrado.';
    ok = erroCampo('email', msgEmail) && ok;
    ok = erroCampo('disciplina', v.disciplina ? '' : 'Informe a disciplina principal.') && ok;
    ok = erroCampo('senha', senhaBruta.length >= 6 ? '' : 'A senha deve ter ao menos 6 caracteres.') && ok;
    ok = erroCampo('confirmar', confirmaBruta === senhaBruta && confirmaBruta ? '' : 'As senhas não coincidem.') && ok;
    return ok ? { ...v, senha: senhaBruta } : null;
  }

  formCadastro.addEventListener('submit', e => {
    e.preventDefault();
    const dados = validarCadastro();
    if (!dados) return;

    const salvo = cadastrarProfessor({
      nome: dados.nome, email: dados.email.toLowerCase(), disciplina: dados.disciplina, senha: dados.senha
    });
    if (!salvo) return mostrarAviso('Não foi possível salvar o cadastro no navegador.', 'erro');

    location.href = 'index.html?cadastrado=' + encodeURIComponent(dados.email.toLowerCase());
  });
}
