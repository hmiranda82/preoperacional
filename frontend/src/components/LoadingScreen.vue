<template>
  <Teleport to="body">
    <Transition name="ls-fade" @after-leave="$emit('done')">
      <div v-if="visible" class="ls-root">

        <div class="ls-bg-dots"></div>

        <!-- Center content -->
        <div class="ls-center" :class="{ 'ls-center--in': ready }">

          <!-- Black card with round logo -->
          <div class="ls-card">
            <img :src="logoSrc" alt="Industrial Precision" class="ls-card-logo" />
          </div>

          <h1 class="ls-title">REVISION PREOPERACIONAL</h1>

          <p class="ls-subtitle">
            <span class="ls-bullet">•</span>
            Autenticando Acceso Administrativo...
          </p>

          <!-- Progress block -->
          <div class="ls-progress-wrap">
            <div class="ls-prog-meta">
              <span class="ls-status">STATUS: {{ statusMsg }}</span>
              <span class="ls-pct">{{ pct }}%</span>
            </div>
            <div class="ls-track">
              <div class="ls-fill" :style="{ width: pct + '%' }"></div>
            </div>
          </div>

          <!-- Tech info grid -->
          <div class="ls-info-row">
            <div class="ls-info-col">
              <span class="ls-info-label">PROTOCOLO</span>
              <span class="ls-info-val">SSL-AES-256</span>
            </div>
            <div class="ls-info-col">
              <span class="ls-info-label">INSTANCIA</span>
              <span class="ls-info-val">Admin_SRV_04</span>
            </div>
            <div class="ls-info-col">
              <span class="ls-info-label">REGIÓN</span>
              <span class="ls-info-val">LATAM-WEST</span>
            </div>
          </div>

          <!-- Cipher row -->
          <div class="ls-cipher">
            <span class="ls-cipher-dots">· · ·</span>
            <span class="ls-cipher-txt">CIFRADO DE GRADO INDUSTRIAL ACTIVO</span>
          </div>

        </div>

        <!-- Bottom footer bar -->
        <footer class="ls-footer">
          <div class="ls-footer-l">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <path d="M6.5 1L11.5 4V7.5c0 2.5-2 4.5-5 5-3-0.5-5-2.5-5-5V4L6.5 1Z"
                stroke="#8895a7" stroke-width="1.1" fill="none"/>
            </svg>
            MIRANDA-TECH © 2026
          </div>
          <div class="ls-footer-r">
            <span>V2.8.4-STABLE</span>
            <span class="ls-footer-dot"></span>
            <span class="ls-footer-secure">
              <span class="ls-green-dot"></span>
              CONEXIÓN SEGURA
            </span>
          </div>
        </footer>

      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import logoSrc from '@/assets/logo.png'
defineEmits(['done'])

/* ── Logo embebido (circular, sin fondo) ── */

const visible   = ref(true)
const ready     = ref(false)
const pct       = ref(0)
const statusMsg = ref('INICIANDO MÓDULOS')

const steps = [
  { p: 15,  m: 'VERIFICANDO CREDENCIALES'  },
  { p: 32,  m: 'CARGANDO CONFIGURACIÓN'    },
  { p: 55,  m: 'SINCRONIZANDO NÚCLEO'      },
  { p: 78,  m: 'AUTENTICANDO TERMINAL'     },
  { p: 94,  m: 'PREPARANDO PANEL'          },
  { p: 100, m: 'ACCESO CONCEDIDO'          },
]

onMounted(() => {
  setTimeout(() => { ready.value = true }, 80)
  let i = 0
  const tick = () => {
    if (i >= steps.length) { setTimeout(() => { visible.value = false }, 600); return }
    pct.value       = steps[i]!.p
    statusMsg.value = steps[i]!.m
    i++
    setTimeout(tick, i < steps.length ? 440 : 700)
  }
  setTimeout(tick, 280)
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Barlow:wght@400;500;600&display=swap');

.ls-root {
  position: fixed; inset: 0; z-index: 9999;
  background: #eef0f3;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  font-family: 'Barlow', sans-serif;
  overflow: hidden;
}

/* Subtle dot grid */
.ls-bg-dots {
  position: absolute; inset: 0; pointer-events: none;
  background-image: radial-gradient(rgba(26,37,64,.09) 1px, transparent 1px);
  background-size: 28px 28px;
}

/* Center block */
.ls-center {
  position: relative; z-index: 1;
  display: flex; flex-direction: column; align-items: center;
  width: min(480px, 90vw);
  opacity: 0; transform: translateY(18px);
  transition: opacity .65s ease, transform .65s cubic-bezier(.22,1,.36,1);
}
.ls-center--in { opacity: 1; transform: translateY(0); }

/* Black logo card */

.ls-card {
  width: 170px; height: 170px; border-radius: 28px;
  background: #09062B;
  box-shadow:
    0 12px 48px rgba(0,0,0,.20),
    0 4px 12px rgba(0,0,0,.12),
    inset 0 1px 0 rgba(255,255,255,.07);
  display: flex; align-items: center; justify-content: center;
  margin-bottom: 30px; overflow: hidden;
}
  
/* Logo is circular — no border-radius clip needed since PNG has transparent bg */
.ls-card-logo {
  width: 180px;
  height: 180px;
  border-radius: 28px;
  object-fit: contain;
  display: block;
}

/* Title */
.ls-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 32px; font-weight: 900; color: #1a2540;
  letter-spacing: 3px; margin: 0 0 9px; text-align: center;
}
.ls-subtitle {
  display: flex; align-items: center; gap: 8px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 13.5px; font-weight: 600; color: #6b7c93;
  letter-spacing: .5px; margin: 0 0 40px;
}
.ls-bullet { font-size: 18px; line-height: 1; color: #1a2540; }

/* Progress */
.ls-progress-wrap { width: 100%; margin-bottom: 34px; }
.ls-prog-meta {
  display: flex; justify-content: space-between; align-items: flex-end;
  margin-bottom: 10px;
}
.ls-status {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px; font-weight: 700; letter-spacing: 1.8px; color: #8895a7;
}
.ls-pct {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 34px; font-weight: 900; color: #1a2540; line-height: 1;
}
.ls-track {
  width: 100%; height: 6px;
  background: #d4d9e3; border-radius: 99px; overflow: hidden;
}
.ls-fill {
  height: 100%; border-radius: 99px;
  background: #1a2540;
  transition: width .44s cubic-bezier(.4,0,.2,1);
}

/* Info grid */
.ls-info-row { display: flex; gap: 52px; margin-bottom: 32px; }
.ls-info-col { display: flex; flex-direction: column; gap: 5px; }
.ls-info-label {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px; font-weight: 700; letter-spacing: 1.6px; color: #8895a7;
}
.ls-info-val { font-size: 13px; font-weight: 600; color: #1a2540; }

/* Cipher */
.ls-cipher { display: flex; flex-direction: column; align-items: center; gap: 5px; }
.ls-cipher-dots { font-size: 18px; letter-spacing: 7px; color: #b0bbc9; }
.ls-cipher-txt {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px; font-weight: 700; letter-spacing: 2.5px; color: #b0bbc9;
}

/* Footer */
.ls-footer {
  position: absolute; bottom: 0; left: 0; right: 0;
  padding: 14px 28px;
  display: flex; justify-content: space-between; align-items: center;
  border-top: 1px solid rgba(26,37,64,.07);
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 11px; font-weight: 600; letter-spacing: 1.2px; color: #8895a7;
}
.ls-footer-l { display: flex; align-items: center; gap: 8px; }
.ls-footer-r { display: flex; align-items: center; gap: 10px; }
.ls-footer-dot { width: 3px; height: 3px; border-radius: 50%; background: #b0bbc9; }
.ls-footer-secure { display: flex; align-items: center; gap: 6px; }
.ls-green-dot {
  width: 7px; height: 7px; border-radius: 50%; background: #22c55e;
  box-shadow: 0 0 6px rgba(34,197,94,.5);
  animation: gPulse 2s infinite;
}
@keyframes gPulse {
  0%,100% { opacity: 1; } 50% { opacity: .5; }
}

/* Transition */
.ls-fade-leave-active { transition: opacity .5s ease; }
.ls-fade-leave-to     { opacity: 0; }
</style>
