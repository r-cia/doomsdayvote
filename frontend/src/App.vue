<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <a class="skip-link" href="#conteudo">Ir para o conteúdo</a>

  <header class="faixa">
    <RouterLink
      class="marca"
      to="/painel"
      aria-label="Doomsday Vote, painel de conferência de boletins de urna"
    >
      <img
        class="marca__logo"
        src="/doomsday.png"
        alt=""
        aria-hidden="true"
      />
      <span class="marca__texto">
        <strong>Doomsday Vote</strong>
        <small>conferência de boletins de urna</small>
      </span>
    </RouterLink>

    <nav class="nav" aria-label="Seções do sistema">
      <RouterLink to="/painel">Painel</RouterLink>
      <RouterLink :to="{ path: '/painel', hash: '#mapa' }">Mapa</RouterLink>
    </nav>

    <p class="classificacao">
      <span><i aria-hidden="true"></i>Não oficial · TSE</span>
    </p>
  </header>

  <main id="conteudo">
    <RouterView />
  </main>
</template>
