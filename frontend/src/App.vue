<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <a class="skip-link" href="#conteudo">Ir para o conteúdo</a>

  <header class="app-header">
    <div class="app-header__inner">
      <RouterLink class="marca" to="/painel" aria-label="Doomsday Vote, painel de auditoria">
        <span class="marca__simbolo" aria-hidden="true">
          <svg viewBox="0 0 32 32" width="30" height="30">
            <rect x="3" y="17" width="5" height="11" rx="1" fill="currentColor" />
            <rect x="11" y="12" width="5" height="16" rx="1" fill="currentColor" />
            <rect x="19" y="7" width="5" height="21" rx="1" fill="currentColor" />
            <path d="M3 10.5 12 4l7 4 8-6" fill="none" stroke="currentColor" stroke-width="2" />
          </svg>
        </span>
        <span class="marca__texto">
          <strong>Doomsday Vote</strong>
          <small>Auditoria de BUs</small>
        </span>
      </RouterLink>

      <nav class="nav" aria-label="Navegação principal">
        <RouterLink to="/painel">Painel</RouterLink>
        <RouterLink to="/mapa">Mapa</RouterLink>
      </nav>

      <div class="app-header__meta">
        <span class="selo-offline">
          <span class="selo-offline__ponto" aria-hidden="true"></span>
          Sistema offline
        </span>
        <span class="app-header__escopo">Presidente e Governador</span>
      </div>
    </div>
  </header>

  <main id="conteudo" class="app-main">
    <RouterView />
  </main>

  <footer class="app-footer">
    <p>
      Auditoria pós-eleição com BUs carregados manualmente. Sem tempo real, sem
      snapshots e sem percentual de apuração.
    </p>
  </footer>
</template>
