/*
 * PROTÓTIPO ACADÊMICO - Esporte Clube Itapetininga
 * ------------------------------------------------
 * Autenticação SIMULADA no front-end.
 *
 * Este site é estático e não possui servidor. As credenciais abaixo estão
 * visíveis no código-fonte e qualquer pessoa pode contorná-las pelo console
 * do navegador. NÃO oferece segurança real e NÃO deve receber dados reais.
 *
 * Em produção, a validação precisaria acontecer em um backend, com senha
 * armazenada como hash e sessão controlada por token no servidor.
 */

(function () {
  'use strict';

  const CREDENCIAIS_DEMO = { usuario: 'admin', senha: 'eci2025' };
  const CHAVE_SESSAO = 'eci_sessao_admin';

  function lerSessao(storageName) {
    try {
      const storage = window[storageName];
      const valor = storage.getItem(CHAVE_SESSAO);

      if (!valor) {
        return null;
      }

      const sessao = JSON.parse(valor);
      return sessao && typeof sessao.usuario === 'string' ? sessao : null;
    } catch {
      return null;
    }
  }

  function obterSessao() {
    return lerSessao('sessionStorage') || lerSessao('localStorage');
  }

  function removerSessao(storageName) {
    try {
      window[storageName].removeItem(CHAVE_SESSAO);
    } catch {
      // Armazenamento indisponível: a ausência de sessão é o estado seguro.
    }
  }

  function encerrarSessao() {
    removerSessao('sessionStorage');
    removerSessao('localStorage');
    window.location.href = 'login.html';
  }

  function exigirSessao() {
    const sessao = obterSessao();

    if (!sessao) {
      window.location.replace('login.html');
      return null;
    }

    return sessao;
  }

  function gravarSessao(usuario, manterConectado) {
    const sessao = JSON.stringify({
      usuario,
      entradaEm: new Date().toISOString()
    });
    const storageName = manterConectado ? 'localStorage' : 'sessionStorage';
    const storageAlternativo = manterConectado ? 'sessionStorage' : 'localStorage';

    try {
      window[storageName].setItem(CHAVE_SESSAO, sessao);
    } catch {
      return false;
    }

    removerSessao(storageAlternativo);
    return true;
  }

  window.ECIAuth = {
    obterSessao,
    encerrarSessao,
    exigirSessao
  };

  function limparErros(formulario, alerta) {
    alerta.hidden = true;
    alerta.textContent = '';

    formulario.querySelectorAll('.login-field__error').forEach(function (mensagem) {
      mensagem.hidden = true;
      mensagem.textContent = '';
    });

    formulario.querySelectorAll('.login-field--erro').forEach(function (campo) {
      campo.classList.remove('login-field--erro');
    });

    formulario.querySelectorAll('.login-field__input').forEach(function (input) {
      input.removeAttribute('aria-invalid');
    });
  }

  function exibirErroCampo(input, mensagem) {
    const campo = input.closest('.login-field');
    const idMensagem = input.getAttribute('aria-describedby');
    const elementoMensagem = idMensagem ? document.getElementById(idMensagem) : null;

    input.setAttribute('aria-invalid', 'true');

    if (campo) {
      campo.classList.add('login-field--erro');
    }

    if (elementoMensagem) {
      elementoMensagem.textContent = mensagem;
      elementoMensagem.hidden = false;
    }
  }

  function configurarLogin(formulario) {
    const usuario = document.getElementById('usuario');
    const senha = document.getElementById('senha');
    const lembrar = document.getElementById('lembrar');
    const alerta = document.getElementById('login-alert');
    const toggleSenha = document.getElementById('toggle-senha');

    if (!usuario || !senha || !lembrar || !alerta) {
      return;
    }

    formulario.addEventListener('submit', function (event) {
      event.preventDefault();
      limparErros(formulario, alerta);

      const nomeUsuario = usuario.value.trim();
      const camposInvalidos = [];

      if (!nomeUsuario) {
        exibirErroCampo(usuario, 'Informe o nome de usuário.');
        camposInvalidos.push(usuario);
      }

      if (!senha.value) {
        exibirErroCampo(senha, 'Informe a senha.');
        camposInvalidos.push(senha);
      }

      if (camposInvalidos.length > 0) {
        camposInvalidos[0].focus();
        return;
      }

      if (nomeUsuario !== CREDENCIAIS_DEMO.usuario || senha.value !== CREDENCIAIS_DEMO.senha) {
        alerta.textContent = 'Usuário ou senha incorretos. Verifique os dados e tente novamente.';
        alerta.hidden = false;
        senha.value = '';
        usuario.focus();
        return;
      }

      if (!gravarSessao(nomeUsuario, lembrar.checked)) {
        alerta.textContent = 'Não foi possível iniciar a sessão neste navegador. Verifique as configurações de privacidade e tente novamente.';
        alerta.hidden = false;
        usuario.focus();
        return;
      }

      window.location.href = 'admin.html';
    });

    if (toggleSenha) {
      toggleSenha.addEventListener('click', function () {
        const senhaVisivel = senha.type === 'text';
        const textoToggle = toggleSenha.querySelector('.login-field__toggle-text');

        senha.type = senhaVisivel ? 'password' : 'text';
        toggleSenha.setAttribute('aria-pressed', senhaVisivel ? 'false' : 'true');

        if (textoToggle) {
          textoToggle.textContent = senhaVisivel ? 'Mostrar senha' : 'Ocultar senha';
        }
      });
    }
  }

  function inicializar() {
    if (document.body.classList.contains('admin-page')) {
      const sessao = window.ECIAuth.exigirSessao();

      if (!sessao) {
        return;
      }

      const nomeUsuario = document.getElementById('admin-usuario');
      const botaoSair = document.getElementById('btn-sair');

      if (nomeUsuario) {
        nomeUsuario.textContent = sessao.usuario;
      }

      if (botaoSair) {
        botaoSair.addEventListener('click', window.ECIAuth.encerrarSessao);
      }

      return;
    }

    const formulario = document.getElementById('login-form');

    if (!formulario) {
      return;
    }

    if (window.ECIAuth.obterSessao()) {
      window.location.href = 'admin.html';
      return;
    }

    configurarLogin(formulario);
  }

  document.addEventListener('DOMContentLoaded', inicializar);
})();
