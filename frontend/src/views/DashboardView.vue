<template>
  <div class="dash">

    <!-- Page header -->
    <div class="dash-header">
      <div>
        <h1 class="dash-title">PANEL CENTRAL</h1>
        <p class="dash-sub">Monitoreo en tiempo real de la flota industrial y estados operativos.
          <span v-if="lastUpdate" class="last-update">↻ {{ lastUpdate }}</span>
        </p>
      </div>
      <div class="dh-actions">
        <router-link to="/users" class="btn-action btn-action--primary">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="6.5" cy="5" r="2.5" stroke="currentColor" stroke-width="1.4"/><path d="M1.5 13c0-2.8 2.2-5 5-5s5 2.2 5 5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/><path d="M12 7v4M10 9h4" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          AGREGAR USUARIO
        </router-link>
        <router-link to="/questions" class="btn-action">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><rect x="2" y="2" width="11" height="11" rx="2" stroke="currentColor" stroke-width="1.4"/><path d="M5 7.5h5M7.5 5v5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          CUESTIONARIO
        </router-link>
        <router-link to="/reports" class="btn-action btn-action--primary">
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M2 2h11v11H2z" stroke="currentColor" stroke-width="1.4" fill="none"/><path d="M5 5h5M5 7.5h5M5 10h3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/></svg>
          REPORTE EJECUTIVO
        </router-link>
<!-- Selector de período del reporte -->
        <div class="period-selector">
          <button
            v-for="p in ([{k:'HOY',l:'HOY'},{k:'15D',l:'15 DÍAS'},{k:'MES',l:'MES'}] as const)"
            :key="p.k"
            class="ps-btn"
            :class="{ 'ps-btn--active': reportPeriod === p.k }"
            @click="reportPeriod = p.k"
          >{{ p.l }}</button>
        </div>
        <v-btn
          color="success"
          prepend-icon="mdi-microsoft-excel"
          :loading="exporting"
          @click="exportExcel"
          style="color:#fff"
        >
          Exportar Excel
        </v-btn>
      </div>
    </div>

    <!-- Error banner -->
    <div v-if="loadError" class="load-error" role="alert">
      <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><circle cx="7.5" cy="7.5" r="6.5" stroke="#e63d2f" stroke-width="1.3"/><path d="M7.5 4.5V8M7.5 10v.5" stroke="#e63d2f" stroke-width="1.3" stroke-linecap="round"/></svg>
      {{ loadError }}
      <button class="le-retry" @click="() => loadData()">Reintentar</button>
    </div>

    <!-- ══ MAIN GRID ══ -->
    <div id="report-content" class="dash-grid">

      <!-- ── ALERTAS CRÍTICAS ──────────────────────────────────
           Incluye: fallas mecánicas del día, conductores sin
           inspección, conductor no apto, SOAT vencido/por vencer,
           Tecnomecánica vencida/por vencer.
      ──────────────────────────────────────────────────────── -->
      <div class="card alerts-card">
        <div class="card-head">
          <div class="card-head-left">
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M7.5 1.5L13.5 12.5H1.5L7.5 1.5Z" stroke="#e63d2f" stroke-width="1.4" stroke-linejoin="round"/><path d="M7.5 6v3.5M7.5 11v.5" stroke="#e63d2f" stroke-width="1.4" stroke-linecap="round"/></svg>
            <span class="card-title">ALERTAS CRÍTICAS</span>
          </div>
          <span class="alert-badge" :class="alertItems.length ? 'ab-red' : 'ab-ok'">
            {{ alertItems.length }} URGENTE{{ alertItems.length !== 1 ? 'S' : '' }}
          </span>
        </div>

        <div v-if="loading" class="skel-list"><div v-for="n in 4" :key="n" class="skel-r"></div></div>

        <div v-else-if="!alertItems.length" class="no-alerts">
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"><circle cx="11" cy="11" r="9.5" stroke="#22c55e" stroke-width="1.4"/><path d="M7 11l3 3 5-5" stroke="#22c55e" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>
          Sin alertas activas — flota al día
        </div>

        <div v-else class="scroll-body">
          <div
            v-for="a in alertItems" :key="a.id"
            class="alert-item"
            :class="alertItemCls(a.tipo)"
            @click="a.tipo === 'missing' || a.tipo === 'no_apto' || a.tipo === 'falla'
              ? router.push('/responses')
              : router.push('/users')"
          >
            <!-- Ícono según tipo -->
            <div class="ai-icon" :class="alertIconCls(a.tipo)">
              <!-- SOAT -->
              <svg v-if="a.tipo === 'soat_vencido' || a.tipo === 'soat_pronto'" width="13" height="13" viewBox="0 0 13 13" fill="none">
                <rect x="1" y="2" width="11" height="9" rx="2" stroke="currentColor" stroke-width="1.2"/>
                <path d="M4 5.5h5M4 7.5h3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                <path d="M9 1v2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                <path d="M4 1v2" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              <!-- TECNO -->
              <svg v-else-if="a.tipo === 'tecno_vencido' || a.tipo === 'tecno_pronto'" width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" stroke-width="1.2"/>
                <path d="M6.5 4v3l2 1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              <!-- No apto -->
              <svg v-else-if="a.tipo === 'no_apto'" width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="4.5" r="2" stroke="currentColor" stroke-width="1.2"/>
                <path d="M2 11.5c0-2.5 2-4.5 4.5-4.5s4.5 2 4.5 4.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
                <path d="M10 2L11.5 3.5M11.5 2L10 3.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              <!-- Falla mecánica -->
              <svg v-else-if="a.tipo === 'falla'" width="13" height="13" viewBox="0 0 13 13" fill="none">
                <path d="M6.5 1.5L12 11H1L6.5 1.5Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/>
                <path d="M6.5 5v3M6.5 9.5v.3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              <!-- Missing -->
              <svg v-else width="13" height="13" viewBox="0 0 13 13" fill="none">
                <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" stroke-width="1.2"/>
                <path d="M6.5 4v3M6.5 9v.3" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
            </div>

            <div class="ai-text">
              <span class="ai-plate">{{ a.placa }}</span>
              <span v-if="a.nombre" class="ai-nombre">{{ a.nombre }}</span>
              <span class="ai-msg" :class="alertMsgCls(a.tipo)">{{ a.mensaje }}</span>
            </div>
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M4.5 3l4 3.5-4 3.5" stroke="#8895a7" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </div>
        </div>

        <button class="alert-more" @click="router.push('/responses')">
          VER TODAS LAS RESPUESTAS →
        </button>
      </div>

      <!-- ── ESTADO PREOPERACIONAL HOY ──────────────────────── -->
      <div class="card estado-card">
        <div class="card-head">
          <span class="card-title">ESTADO PREOPERACIONAL HOY</span>
          <div style="display:flex;align-items:center;gap:8px">
            <span class="card-date">{{ todayLabel }}</span>
            <span class="auto-tag"><span class="auto-dot"></span>LIVE</span>
          </div>
        </div>

        <!-- KPI boxes -->
        <div class="kpi-row">
          <div class="kpi-box kpi-dark">
            <span class="kn">{{ loading ? '—' : todayCount }}</span>
            <span class="kl">COMPLETADOS</span>
          </div>
          <div class="kpi-box kpi-light">
            <span class="kn kn-plain">{{ loading ? '—' : pendingCount }}</span>
            <span class="kl kl-plain">PENDIENTES</span>
          </div>
          <div class="kpi-box kpi-red">
            <span class="kn kn-red">{{ loading ? '—' : conductoresConNovedad }}</span>
            <span class="kl kl-red">CON NOVEDAD</span>
          </div>
        </div>

        <!-- CUMPLIMIENTO HOY -->
        <div class="cumpl-block">
          <div class="cumpl-row">
            <span class="cumpl-label">CUMPLIMIENTO HOY</span>
            <span class="cumpl-pct" :class="cumplCls">{{ cumplPct }}%</span>
          </div>
          <div class="cumpl-track">
            <div class="cumpl-fill" :class="cumplCls" :style="{ width: cumplPct + '%' }"></div>
          </div>
          <p class="cumpl-detail">
            <span class="cok">{{ todayCount }} completaron</span>
            <span class="csep"> · </span>
            <span :class="pendingCount > 0 ? 'cpend' : 'cok'">{{ pendingCount }} pendientes</span>
            <template v-if="conductoresConNovedad">
              <span class="csep"> · </span>
              <span class="cmiss">{{ conductoresConNovedad }} con novedad</span>
            </template>
            <span class="ctotal"> / {{ totalActiveConductors }}</span>
          </p>
        </div>

        <!-- Today's inspector list -->
        <div v-if="loading" class="skel-list"><div v-for="n in 3" :key="n" class="skel-r"></div></div>
        <div v-else class="ilist scroll-body">
          <template v-if="todayResponsesSorted.length">
            <div v-for="r in todayResponsesSorted" :key="r.id" class="irow">
              <div class="ir-av" :style="{ background: avColor(resolveName(r)) }">
                {{ resolveName(r).charAt(0).toUpperCase() }}
              </div>
              <div class="ir-info">
                <span class="ir-name">{{ resolveName(r) }}</span>
                <span class="ir-meta">
                  {{ resolveCedula(r) ? 'CC: ' + resolveCedula(r) : '' }}
                  {{ r.placa ? ' · ' + r.placa : '' }}
                </span>
              </div>
              <span class="ir-badge" :class="statusCls(r)">{{ statusLbl(r) }}</span>
            </div>
          </template>
          <div v-else class="no-data">
            Sin inspecciones registradas hoy
          </div>
        </div>
      </div>

    </div><!-- /dash-grid -->

    <!-- ══ GESTIÓN DE FLOTA ACTIVA ══ -->
    <div class="card fleet-card">
      <div class="fleet-head">
        <div class="fleet-head-left">
          <h2 class="fleet-title">GESTIÓN DE FLOTA ACTIVA</h2>
          <div class="fleet-chips">
            <span class="fc-chip fc-all">TODOS: {{ fleetUsers.length }}</span>
            <span class="fc-chip fc-ok">ACTIVOS: {{ activeUsers }}</span>
            <span class="fc-chip fc-red">INACTIVOS: {{ inactiveUsers }}</span>
            <span v-if="docAlertsCount" class="fc-chip fc-warn">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 1L10 9.5H1L5.5 1Z" stroke="currentColor" stroke-width="1.2" stroke-linejoin="round"/></svg>
              {{ docAlertsCount }} DOC{{ docAlertsCount !== 1 ? 'S' : '' }}
            </span>
            <span v-if="totalVacationCount" class="fc-chip fc-vac">
              <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M3 4l1.5-2h2L8 4M3 4v4a1 1 0 001 1h3a1 1 0 001-1V4M5.5 7v1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
              {{ totalVacationCount }} VAC{{ totalVacationCount !== 1 ? 'S' : '' }}
            </span>
          </div>
        </div>

        <!-- ── BÚSQUEDA POR PLACA O CONDUCTOR ── -->
        <div class="fleet-search" :class="{ 'fs-focus': searchFocus }">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.3"/>
            <path d="M9.5 9.5L13 13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          <input
            v-model="fleetSearch"
            type="text"
            placeholder="Buscar placa, conductor o cédula…"
            @focus="searchFocus = true"
            @blur="searchFocus = false"
            @keydown.escape="fleetSearch = ''"
            @input="fleetSearch = fleetSearch.toUpperCase()"
            style="text-transform:uppercase"
          />
          <button
            v-if="fleetSearch"
            class="fs-clear"
            @click="fleetSearch = ''"
            type="button"
            title="Limpiar búsqueda"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M2 2l8 8M10 2L2 10" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            </svg>
          </button>
          <button type="button" class="fs-cam" @click="openPlateReaderDash" title="Leer placa con cámara">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Search results summary -->
      <div v-if="fleetSearch.trim()" class="search-summary">
        <span v-if="filteredUsers.length">
          {{ filteredUsers.length }} resultado{{ filteredUsers.length !== 1 ? 's' : '' }} para
          <strong>"{{ fleetSearch.trim() }}"</strong>
        </span>
        <span v-else class="search-empty">
          Sin resultados para <strong>"{{ fleetSearch.trim() }}"</strong>
        </span>
      </div>

      <div v-if="loading" class="skel-list"><div v-for="n in 5" :key="n" class="skel-r skel-r--tall"></div></div>
      <div v-else-if="!filteredUsers.length && !fleetSearch" class="no-data" style="padding:28px">Sin conductores registrados</div>
      <div v-else-if="!filteredUsers.length" class="no-data" style="padding:28px">
        <svg width="32" height="32" viewBox="0 0 32 32" fill="none" style="margin-bottom:8px;opacity:.4"><circle cx="14" cy="14" r="9" stroke="#8895a7" stroke-width="1.8"/><path d="M21 21L29 29" stroke="#8895a7" stroke-width="1.8" stroke-linecap="round"/></svg>
        <div>No se encontraron resultados</div>
      </div>

      <div class="fleet-scroll">
      <table class="fleet-tbl">
        <thead>
          <tr>
            <th>CONDUCTOR</th>
            <th>ROL</th>
            <th>ÚLTIMA INSPECCIÓN</th>
            <th>CÉDULA</th>
            <th>PLACA</th>
            <th>SOAT</th>
            <th>TECNO</th>
            <th>ESTADO</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(u, i) in fleetPage" :key="u.id" :style="{ '--ri': i }">
            <td>
              <div class="fc-user">
                <div class="fc-av" :style="{ background: avColor(u.nombre) }">
                  {{ u.nombre.charAt(0).toUpperCase() }}
                </div>
                <div>
                  <div class="fc-name">{{ u.nombre }}</div>
                  <div class="fc-email">{{ u.email }}</div>
                </div>
              </div>
            </td>
            <td>
              <span class="frol" :class="u.rol === 'ADMIN' ? 'frol-admin' : 'frol-driver'">
                {{ u.rol === 'ADMIN' ? 'ADMINISTRADOR' : 'CONDUCTOR' }}
              </span>
            </td>
            <td class="ftd">{{ getLastRevision(u) }}</td>
            <td class="ftd fmono">{{ u.cedula }}</td>
            <td>
              <span v-if="u.placa" class="fplaca">{{ u.placa }}</span>
              <span v-else class="fna">Sin asignar</span>
            </td>

            <!-- SOAT column -->
            <td>
              <template v-if="u.soatVigencia">
                <span class="doc-badge" :class="docBadgeCls(u.soatVigencia)">
                  <span class="db-dot"></span>{{ docBadgeLbl(u.soatVigencia) }}
                </span>
              </template>
              <span v-else class="fna">—</span>
            </td>

            <!-- Tecnomecánica column -->
            <td>
              <template v-if="u.tecniVigencia">
                <span class="doc-badge" :class="docBadgeCls(u.tecniVigencia)">
                  <span class="db-dot"></span>{{ docBadgeLbl(u.tecniVigencia) }}
                </span>
              </template>
              <span v-else class="fna">—</span>
            </td>

            <td>
              <span class="fstatus" :class="u.enVacaciones ? 'fs-vacation' : (u.activo ? 'fs-active' : 'fs-inactive')">
                <span class="fs-dot"></span>
                {{ u.enVacaciones ? 'EN VACACIONES' : (u.activo ? 'ACTIVO' : 'INACTIVO') }}
              </span>
            </td>
            <td>
              <button class="fac-btn" @click="router.push('/users')" title="Ver">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><circle cx="7" cy="3.5" r="1.1" fill="currentColor"/><circle cx="7" cy="7" r="1.1" fill="currentColor"/><circle cx="7" cy="10.5" r="1.1" fill="currentColor"/></svg>
              </button>
            </td>
          </tr>
        </tbody>
      </table>
      </div>

      <!-- Pagination -->
      <div v-if="totalPages > 1" class="fleet-footer">
        <span class="ff-info">
          Mostrando {{ fleetPage.length }} de {{ filteredUsers.length }}
          <template v-if="fleetSearch.trim()"> (filtrado de {{ fleetUsers.length }})</template>
        </span>
        <div class="ff-nav">
          <button class="ff-btn" :disabled="page === 0" @click="page--">‹</button>
          <span class="ff-pg">{{ page + 1 }} / {{ totalPages }}</span>
          <button class="ff-btn" :disabled="page >= totalPages - 1" @click="page++">›</button>
        </div>
      </div>
    </div>

    <!-- Live toast -->
    <Transition name="toast-t">
      <div v-if="showToast" class="live-toast">
        <span class="lt-dot"></span>
        <span><strong>{{ todayCount }}</strong> inspección{{ todayCount !== 1 ? 'es' : '' }} registrada{{ todayCount !== 1 ? 's' : '' }} hoy</span>
      </div>
    </Transition>

    <!-- ══ MODAL LECTOR DE PLACAS ══ -->
    <Teleport to="body">
      <Transition name="modal">
        <div v-if="plateReaderOpenDash" class="modal-overlay" @click.self="closePlateReaderDash">
          <div class="modal-box" style="max-width:500px">
            <div class="modal-head">
              <h3>Leer placa</h3>
              <button class="modal-close" @click="closePlateReaderDash">&times;</button>
            </div>
            <div class="modal-body" style="text-align:center">
              <div v-if="plateReadingDash" class="plate-spinner">
                <div class="spinner"></div>
                <p>Procesando imagen...</p>
              </div>
              <div v-else-if="plateResultDash" class="plate-result">
                <div class="plate-badge-result">{{ plateResultDash.placa }}</div>
                <p v-if="plateResultDash.tipo" class="plate-tipo">{{ plateResultDash.tipo }}</p>
                <p class="plate-conf">Confianza: {{ (plateResultDash.confianza * 100).toFixed(1) }}%</p>
                <div class="plate-actions">
                  <button class="btn-primary" @click="acceptPlateDash">Buscar esta placa</button>
                  <button class="btn-cancel" @click="retakePlateDash">Tomar otra foto</button>
                </div>
              </div>
              <div v-else>
                <video ref="videoRefDash" autoplay playsinline class="plate-video"></video>
                <div class="plate-actions" style="margin-top:12px">
                  <button class="btn-primary" @click="capturePhotoDash">Capturar foto</button>
                  <button class="btn-cancel" @click="closePlateReaderDash">Cancelar</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import api from '../api'
import { useSearchStore } from '../stores/search'
import { generateExecutiveExcel } from '../utils/reportExcel'

const router = useRouter()
const search = useSearchStore()

/* ══════════════════════════════════════════════════════════════════
   ZONA HORARIA COLOMBIA
   America/Bogota = UTC-5, SIN cambio de hora (sin DST).
   Toda comparación de fechas de documentos (SOAT, Tecno) debe
   hacerse contra la fecha actual en Colombia, no en UTC.
══════════════════════════════════════════════════════════════════ */

/**
 * Devuelve la fecha actual en Colombia como objeto Date con
 * hora = medianoche local. Usa Intl.DateTimeFormat para obtener
 * año/mes/día correctos en America/Bogota.
 */
function todayColombia(): Date {
  const fmt = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const parts = fmt.formatToParts(new Date())
  const y = Number(parts.find(p => p.type === 'year')?.value)
  const m = Number(parts.find(p => p.type === 'month')?.value) - 1
  const d = Number(parts.find(p => p.type === 'day')?.value)
  return new Date(y, m, d)  // medianoche local
}

/**
 * Parsea una fecha ISO del backend como fecha local (sin offset).
 * El backend envía '2025-06-15T00:00:00.000Z' (UTC midnight).
 * Si lo parseamos con new Date() obtenemos '2025-06-14' en UTC-5.
 * Por eso extraemos solo YYYY-MM-DD y creamos como fecha local.
 */
function parseLocalDate(iso: string | null | undefined): Date | null {
  if (!iso) return null
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  return new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
}

/**
 * Días entre hoy (Colombia) y la fecha de vencimiento.
 * Negativo = vencido, 0 = vence hoy, positivo = días restantes.
 */
function diasHastaVencimiento(iso: string | null | undefined): number | null {
  const exp   = parseLocalDate(iso)
  if (!exp) return null
  const today = todayColombia()
  return Math.round((exp.getTime() - today.getTime()) / 86_400_000)
}

/* ── Umbrales de alertas Colombia ──────────────────────────── */
const DIAS_PROXIMO = 10   // ≤10 días → PROXIMO (naranja)
// Vencido: días < 0 | Proximo: 0-10 | Vigente: > 10

/* ── Types ─────────────────────────────────────────────────── */
interface User {
  id:             number
  nombre:         string
  email:          string
  cedula:         string
  placa?:         string
  rol:            'ADMIN' | 'CONDUCTOR' | 'DRIVER'
  activo:         boolean
  enVacaciones?:  boolean
  soatVigencia?:  string | null   // ISO date del backend
  tecniVigencia?: string | null   // ISO date del backend
}

interface Question {
  id:    number
  texto: string
  tipo:  'BOOLEAN' | 'SINO' | 'NUMERO' | 'TEXTO'
}

interface Answer {
  valor:        string | null
  observacion?: string | null
  question?:    Question
}

type AlertTipo =
  | 'no_apto'
  | 'soat_vencido'  | 'tecno_vencido'
  | 'soat_pronto'   | 'tecno_pronto'
  | 'falla'
  | 'missing'

interface AlertItem {
  id:      number
  placa:   string
  nombre:  string
  mensaje: string
  tipo:    AlertTipo
}

/* ── Constants ──────────────────────────────────────────────── */
const PAGE_SIZE = 10
const AV_COLORS = ['#1a2540','#2d4a7a','#3a6b8c','#4a5568','#2c5364','#1e3a5f'] as const
// Polling: resumen de inspecciones cada 15s y usuarios cada 60s
const POLL_SUMMARY_MS = 15_000
const POLL_USERS_MS   = 60_000

/* ── Tipos del resumen del servidor ─────────────────────────── */
interface RecentItem {
  id:      number
  fecha:   string
  placa:   string
  user?:   { id: number | null; nombre: string | null; cedula: string | null } | null
  answers: Array<{ valor: string; question?: { tipo: string } | null }>
}

interface DashboardSummary {
  fecha:                    string
  totalActiveConductors:    number
  totalVacationCount:       number
  todayCount:               number
  pendingCount:             number
  conductoresConNovedad:    number
  cumplPct:                 number
  submittedTodayIds:        number[]
  recent:                   RecentItem[]
  alerts:                   AlertItem[]
  lastRevision:             Record<number, string>
}

/* ── State ──────────────────────────────────────────────────── */
const users      = ref<User[]>([])
const summary    = ref<DashboardSummary | null>(null)
const loading    = ref(false)
const loadError  = ref('')
const showToast  = ref(false)
const page       = ref(0)
const exporting = ref(false)
const exportingPdf = ref(false)
// Período del reporte de cumplimiento: HOY | 15D | MES
const reportPeriod  = ref<'HOY' | '15D' | 'MES'>('HOY')
// fleetSearch: computed writable bidireccional con el search store.
// - Local input (fleet-search) → escribe en store → topbar refleja
// - Topbar (App.vue) → escribe en store → tabla filtra automáticamente
const fleetSearch = computed({
  get: () => search.query,
  set: (v: string) => { search.query = v },
})
const searchFocus = ref(false)
let   summaryTimer: ReturnType<typeof setInterval> | null = null
let   usersTimer:   ReturnType<typeof setInterval> | null = null
let   summaryPending = false

// Reset paginación cuando cambia la búsqueda
watch(() => search.query, () => { page.value = 0 })

/* ── Helpers ────────────────────────────────────────────────── */
function avColor(name: string): string {
  return AV_COLORS[(name || 'U').toUpperCase().charCodeAt(0) % AV_COLORS.length]!
}

function resolveName(r: RecentItem): string {
  if (r.user?.nombre) return r.user.nombre
  return 'Conductor'
}

function resolveCedula(r: RecentItem): string {
  if (r.user?.cedula) return r.user.cedula
  return ''
}

/* ── Document badge helpers ─────────────────────────────────── */
/**
 * Clase CSS del badge de documento (SOAT / Tecno) en la tabla.
 */
function docEstado(iso: string | null | undefined): 'VENCIDO' | 'PROXIMO' | 'VIGENTE' | null {
  const dias = diasHastaVencimiento(iso)
  if (dias === null) return null
  if (dias < 0)              return 'VENCIDO'
  if (dias <= DIAS_PROXIMO)  return 'PROXIMO'
  return 'VIGENTE'
}

function docBadgeCls(iso: string | null | undefined): string {
  const e = docEstado(iso)
  if (!e) return 'db-na'
  if (e === 'VENCIDO') return 'db-vencido'
  if (e === 'PROXIMO') return 'db-pronto'
  return 'db-ok'
}

/**
 * Texto del badge: fecha de vencimiento + días restantes.
 */
function docBadgeLbl(iso: string | null | undefined): string {
  const dias = diasHastaVencimiento(iso)
  if (dias === null) return '—'
  const estado = docEstado(iso)
  if (estado === 'VENCIDO') return 'VENCIDO'
  if (dias === 0)           return 'PROXIMO · HOY'
  if (estado === 'PROXIMO') return `PROXIMO · ${dias}d`
  return 'VIGENTE'
}

/* ── Alert visual helpers ───────────────────────────────────── */
function alertItemCls(tipo: AlertTipo): string {
  if (tipo === 'soat_vencido' || tipo === 'tecno_vencido' || tipo === 'no_apto') return 'ai--red'
  if (tipo === 'falla')                                                           return 'ai--red'
  if (tipo === 'soat_pronto' || tipo === 'tecno_pronto')                         return 'ai--amber'
  return 'ai--amber'  // missing
}

function alertIconCls(tipo: AlertTipo): string {
  if (tipo === 'soat_vencido' || tipo === 'tecno_vencido' || tipo === 'no_apto' || tipo === 'falla') return 'ai-icon--red'
  return 'ai-icon--amber'
}

function alertMsgCls(tipo: AlertTipo): string {
  if (tipo === 'soat_vencido' || tipo === 'tecno_vencido' || tipo === 'no_apto' || tipo === 'falla') return ''
  return 'ai-msg--amber'
}

/* ── Answer analysis ────────────────────────────────────────── */
function hasBad(r: RecentItem): boolean {
  return r.answers?.some(a =>
    a.valor === 'NO' || a.valor === 'false' || a.valor === 'MALO'
  ) ?? false
}

function hasObs(r: RecentItem): boolean {
  return r.answers?.some(a => a.valor === 'OBSERVACION') ?? false
}

function statusLbl(r: RecentItem): string {
  if (hasBad(r)) return 'CON NOVEDAD'
  if (hasObs(r)) return 'OBSERVACIÓN'
  return 'FINALIZADO'
}

function statusCls(r: RecentItem): string {
  if (hasBad(r)) return 'ir-badge--red'
  if (hasObs(r)) return 'ir-badge--obs'
  return 'ir-badge--ok'
}

/* ── KPIs de HOY (resumen compacto del servidor) ────────────── */
const todayResponsesSorted   = computed(() => summary.value?.recent ?? [])

const todayCount             = computed(() => summary.value?.todayCount ?? 0)

const submittedTodayIds      = computed((): Set<number> =>
  new Set(summary.value?.submittedTodayIds ?? [])
)

const totalActiveConductors  = computed(() => summary.value?.totalActiveConductors ?? 0)

const totalVacationCount     = computed(() => summary.value?.totalVacationCount ?? 0)

/* ── KPIs ───────────────────────────────────────────────────── */
const pendingCount          = computed(() => summary.value?.pendingCount ?? 0)
// conductoresConNovedad: lo calcula el servidor con las respuestas del día sin cortes
const conductoresConNovedad = computed(() => summary.value?.conductoresConNovedad ?? 0)

/* ── CUMPLIMIENTO HOY ───────────────────────────────────────── */
const cumplPct = computed(() => summary.value?.cumplPct ?? 0)
const cumplCls = computed(() => {
  if (cumplPct.value >= 80) return 'cg'
  if (cumplPct.value >= 50) return 'ca'
  return 'cr'
})

/* ══════════════════════════════════════════════════════════════
   ALERTAS CRÍTICAS (prioridad descendente)
   0 - no_apto       conductor no apto hoy
   1 - soat_vencido  SOAT expirado
   1 - tecno_vencido Tecno expirada
   2 - falla         falla mecánica detectada hoy
   3 - soat_pronto   SOAT por vencer ≤30 días
   3 - tecno_pronto  Tecno por vencer ≤30 días
   4 - missing       sin inspección hoy
══════════════════════════════════════════════════════════════ */
const alertItems = computed((): AlertItem[] => summary.value?.alerts ?? [])

/* Las alertas ahora las calcula el servidor (DashboardService.getSummary)
   con las respuestas completas del dia, sin el corte anterior de 500 registros. */

/* ── Contador de alertas de documentos (para chip en header) ── */
const docAlertsCount = computed(() =>
  alertItems.value.filter(a =>
    a.tipo === 'soat_vencido' || a.tipo === 'tecno_vencido' ||
    a.tipo === 'soat_pronto'  || a.tipo === 'tecno_pronto'
  ).length
)

/* ── Fleet search ───────────────────────────────────────────── */
const fleetUsers = computed(() =>
  users.value.filter(u => (u.rol as string) !== 'ADMIN')
)

const filteredUsers = computed(() => {
  const q = fleetSearch.value.toLowerCase().trim()
  // Igual que en Usuarios: los conductores inactivos/desactivados se ocultan del
  // listado (solo se vuelven a ver cuando se reactivan). 'activo===false' fuera.
  const base = fleetUsers.value.filter(u => u.activo !== false)
  if (!q) return base
  return base.filter(u =>
    u.nombre.toLowerCase().includes(q) ||
    (u.placa  ?? '').toLowerCase().includes(q) ||
    u.cedula.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q)
  )
})

/* ── Fleet pagination ───────────────────────────────────────── */
const totalPages    = computed(() => Math.max(1, Math.ceil(filteredUsers.value.length / PAGE_SIZE)))
const fleetPage     = computed(() =>
  filteredUsers.value.slice(page.value * PAGE_SIZE, (page.value + 1) * PAGE_SIZE)
)
const activeUsers   = computed(() => fleetUsers.value.filter(u => u.activo).length)
const inactiveUsers = computed(() => fleetUsers.value.filter(u => !u.activo).length)

const todayLabel = computed(() =>
  new Date().toLocaleDateString('es-CO', {
    day: 'numeric', month: 'long', year: 'numeric', timeZone: 'America/Bogota',
  }).toUpperCase()
)

function getLastRevision(u: User): string {
  const iso = summary.value?.lastRevision?.[u.id]
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleDateString('es-CO', {
      day: '2-digit', month: 'short', year: 'numeric', timeZone: 'America/Bogota',
    })
  } catch { return iso }
}

/* ── Export Excel ───────────────────────────────────────────── */
/**
 * exportExcel — Reporte de CUMPLIMIENTO PREOPERACIONAL
 *
 * Una sola hoja con:
 *  - Fila título + info período
 *  - Header: Motorizado | Placa | (días) | Inspección | Faltas
 *  - Celdas de día coloreadas: 🟢 verde (cumplió) | 🔴 rojo (incumplió)
 *    | 🟡 amarillo (vacaciones) | 🟠 naranja (descanso/festivo)
 */
async function exportExcel() {
  if (!users.value.length) return
  exporting.value = true
  try {
    const now = new Date()
    const params: any = { year: now.getFullYear(), month: now.getMonth() + 1 }
    const { data } = await api.get('/reports/executive', { params })
    await generateExecutiveExcel(data)
  } catch (e: any) {
    console.error('Error exporting Excel:', e)
  } finally {
    exporting.value = false
  }
}

async function exportPdf() {
  if (!users.value.length) return
  exportingPdf.value = true
  try {
    const el = document.getElementById('report-content')
    if (!el) return
    const html2pdf = (await import('html2pdf.js')).default
    const now = new Date()
    const month = now.toLocaleString('es-CO', { month: 'long', year: 'numeric' })
    await html2pdf()
      .set({
        margin: [10, 8, 10, 8],
        filename: `Reporte_Ejecutivo_${month.replace(/\s/g, '_')}.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF: { unit: 'mm', format: 'a3', orientation: 'landscape' },
      })
      .from(el)
      .save()
  } catch (e: any) {
    console.error('Error exporting PDF:', e)
  } finally {
    exportingPdf.value = false
  }
}


/* ── Data fetch + polling ───────────────────────────────────── */
const lastUpdate = ref<string | null>(null)

/** Fetches del resumen compacto (KPIs, alertas, recientes, últimas revisiones) */
async function loadSummary(opts: { silent?: boolean; toastOnNew?: boolean } = {}) {
  if (summaryPending) return            // in-flight guard: no superponer polls
  summaryPending = true
  const prevCount = summary.value?.todayCount ?? null
  try {
    const { data } = await api.get<DashboardSummary>('/dashboard/summary')
    summary.value = data
    loadError.value = ''
    lastUpdate.value = new Date().toLocaleTimeString('es-CO', { timeZone: 'America/Bogota', hour: '2-digit', minute: '2-digit', second: '2-digit' })
    if (opts.toastOnNew && prevCount !== null && data.todayCount > prevCount) {
      showToast.value = true
      setTimeout(() => { showToast.value = false }, 5000)
    }
  } catch (err: any) {
    if (opts.silent === false) {
      const s = err?.response?.status
      loadError.value = s === 401 ? 'Sesión expirada. Inicia sesión de nuevo.'
                      : s === 403 ? 'Sin permisos para ver esta sección.'
                      : 'Error al cargar datos. Verifica la conexión.'
    }
    console.error('[Dashboard summary]', err)
  } finally {
    summaryPending = false
  }
}

/** Fetches de usuarios (flota, badges SOAT/TECNO y plantilla) — cada 60s */
async function loadUsers(silent = true) {
  try {
    const uRes = await api.get<User[]>('/users')
    users.value = Array.isArray(uRes.data) ? uRes.data : []
  } catch (err: any) {
    if (silent === false) {
      const s = err?.response?.status
      loadError.value = s === 401 ? 'Sesión expirada. Inicia sesión de nuevo.'
                      : s === 403 ? 'Sin permisos para ver esta sección.'
                      : 'Error al cargar datos. Verifica la conexión.'
    }
    console.error('[Dashboard users]', err)
  }
}

async function loadData(silent = false) {
  if (!silent) loading.value = true
  loadError.value = ''
  await Promise.all([
    loadSummary({ silent, toastOnNew: silent }),
    loadUsers(silent),
  ])
  if (!silent) loading.value = false
}

function startPolling() {
  stopPolling()
  summaryTimer = setInterval(() => loadSummary({ silent: true, toastOnNew: true }), POLL_SUMMARY_MS)
  usersTimer   = setInterval(() => loadUsers(true), POLL_USERS_MS)
}
function stopPolling() {
  if (summaryTimer !== null) { clearInterval(summaryTimer); summaryTimer = null }
  if (usersTimer   !== null) { clearInterval(usersTimer);   usersTimer   = null }
}

/* Pausa el polling cuando la pestaña está oculta y lo reanuda al volver */
function onVisChange() {
  if (document.hidden) { stopPolling() }
  else { refreshSilently(); startPolling() }
}
async function refreshSilently() {
  await loadSummary({ silent: true, toastOnNew: true })
  await loadUsers(true)
}
document.addEventListener('visibilitychange', onVisChange)

onMounted(async () => {
  await loadData(false)
  if (todayCount.value > 0) {
    setTimeout(() => { showToast.value = true  }, 800)
    setTimeout(() => { showToast.value = false }, 5800)
  }
  startPolling()
})

onUnmounted(() => {
  stopPolling()
  stopCamDash()
  document.removeEventListener('visibilitychange', onVisChange)
})

/* ══ Plate Reader (Dashboard) ════════════════════ */
const PLATE_API_DASH = import.meta.env.VITE_PLATE_API || 'http://localhost:8000'
const plateReaderOpenDash = ref(false)
const plateReadingDash = ref(false)
const plateResultDash = ref<{placa:string;tipo:string;confianza:number;metodo:string;valida:boolean} | null>(null)
const videoRefDash = ref<HTMLVideoElement | null>(null)
let mediaStreamDash: MediaStream | null = null

async function openPlateReaderDash() {
  plateReaderOpenDash.value = true
  plateResultDash.value = null
  await startCamDash()
}
function closePlateReaderDash() {
  plateReaderOpenDash.value = false
  plateResultDash.value = null
  stopCamDash()
}
async function startCamDash() {
  stopCamDash()
  try {
    mediaStreamDash = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 1280, height: 720 } })
    await new Promise(r => setTimeout(r, 100))
    if (videoRefDash.value) videoRefDash.value.srcObject = mediaStreamDash
  } catch { alert('No se pudo acceder a la cámara') }
}
function stopCamDash() {
  if (mediaStreamDash) { mediaStreamDash.getTracks().forEach(t => t.stop()); mediaStreamDash = null }
}
async function capturePhotoDash() {
  const v = videoRefDash.value
  if (!v) return
  const c = document.createElement('canvas')
  c.width = v.videoWidth; c.height = v.videoHeight
  c.getContext('2d')!.drawImage(v, 0, 0)
  const blob = await new Promise<Blob>(r => c.toBlob(b => r(b!), 'image/jpeg', 0.9))
  stopCamDash(); plateReadingDash.value = true
  try {
    const fd = new FormData(); fd.append('file', blob, 'plate.jpg')
    const res = await fetch(`${PLATE_API_DASH}/read-plate`, { method: 'POST', body: fd })
    plateResultDash.value = await res.json()
  } catch { alert('Error conectando con el servidor de lectura') }
  finally { plateReadingDash.value = false }
}
function retakePlateDash() { plateResultDash.value = null; startCamDash() }
function acceptPlateDash() {
  if (plateResultDash.value?.placa) {
    fleetSearch.value = plateResultDash.value.placa
  }
  closePlateReaderDash()
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=Barlow:wght@400;500;600;700&display=swap');

.dash { font-family:'Barlow',sans-serif; max-width:1400px; }

/* ── Header ─────────────────────────────────────────────────── */
.dash-header{display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;gap:14px;flex-wrap:wrap}
.dash-title{font-family:'Barlow Condensed',sans-serif;font-size:34px;font-weight:900;color:#0d1422;margin:0 0 4px;letter-spacing:-.5px}
.dash-sub{font-size:13px;color:#8895a7;margin:0}
.last-update{display:inline-block;margin-left:10px;font-size:11px;font-weight:600;color:#22c55e;background:rgba(34,197,94,.1);padding:1px 8px;border-radius:4px;vertical-align:middle}
.dh-actions{display:flex;align-items:center;gap:8px;flex-wrap:wrap}
.btn-action{display:inline-flex;align-items:center;gap:7px;padding:9px 16px;border-radius:6px;border:1.5px solid #d4d9e3;background:#f2f4f7;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;color:#0d1422;cursor:pointer;text-decoration:none;transition:background .15s,border-color .15s;white-space:nowrap}
.btn-action:hover:not(:disabled){background:#e8eaf0;border-color:#b8bed0}
.btn-action:disabled{opacity:.5;cursor:not-allowed}
.btn-action--primary{background:#1a2540;border-color:#1a2540;color:#fff}
.btn-action--primary:hover{background:#0d1422}

/* ── Error ──────────────────────────────────────────────────── */
.load-error{display:flex;align-items:center;gap:9px;background:#fef2f2;border:1px solid #fecaca;border-radius:8px;padding:11px 16px;font-size:13px;color:#dc2626;margin-bottom:16px;font-weight:500}
.le-retry{margin-left:auto;padding:4px 12px;border-radius:5px;border:1px solid #fecaca;background:none;color:#dc2626;font-size:12px;font-weight:600;cursor:pointer}

/* ── Cards ──────────────────────────────────────────────────── */
.card{background:#fff;border:1px solid #e4e7ed;border-radius:10px;overflow:hidden}
.card-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1px solid #f0f2f6}
.card-head-left{display:flex;align-items:center;gap:8px}
.card-title{font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:800;letter-spacing:1.2px;color:#0d1422}
.card-date{font-size:12px;color:#8895a7;font-weight:500}
.alert-badge{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:.8px;padding:3px 9px;border-radius:4px}
.ab-red{background:rgba(230,61,47,.1);color:#e63d2f}
.ab-ok{background:rgba(34,197,94,.1);color:#166534}

/* ── Grid ───────────────────────────────────────────────────── */
.dash-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:16px}
@media(max-width:900px){.dash-grid{grid-template-columns:1fr}}

/* ── Alerts card ────────────────────────────────────────────── */
.alerts-card{border-left:3px solid #e63d2f;display:flex;flex-direction:column}
.estado-card{border-left:3px solid #1a2540;display:flex;flex-direction:column}
.no-alerts{display:flex;align-items:center;gap:8px;padding:20px 18px;font-size:13px;color:#4a5568;font-weight:500}

/* Scrollable body — usado en alertas, inspector list y flota */
.scroll-body{overflow-y:auto;max-height:320px}
.scroll-body::-webkit-scrollbar{width:4px}
.scroll-body::-webkit-scrollbar-track{background:transparent}
.scroll-body::-webkit-scrollbar-thumb{background:#d4d9e3;border-radius:99px}
.scroll-body::-webkit-scrollbar-thumb:hover{background:#b0bbc9}

.alert-item{display:flex;align-items:center;gap:10px;padding:10px 18px;border-bottom:1px solid #f5f7fa;cursor:pointer;transition:background .1s;flex-shrink:0}
.alert-item:last-child{border-bottom:none}
.alert-item:hover{background:#fffaf9}
.ai--red{border-left:2px solid #e63d2f}
.ai--amber{border-left:2px solid #f59e0b}

.ai-icon{width:26px;height:26px;border-radius:6px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.ai-icon--red{background:rgba(230,61,47,.1);color:#e63d2f}
.ai-icon--amber{background:rgba(245,158,11,.1);color:#d97706}

.ai-text{display:flex;flex-direction:column;gap:1px;flex:1;min-width:0}
.ai-plate{font-family:'Barlow Condensed',sans-serif;font-size:15px;font-weight:800;color:#0d1422;letter-spacing:.5px}
.ai-nombre{font-size:11px;color:#4a5568;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ai-msg{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:.6px;color:#e63d2f}
.ai-msg--amber{color:#d97706 !important}

.alert-more{display:block;width:100%;padding:10px 18px;background:none;border:none;border-top:1px solid #f0f2f6;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:1px;color:#0d1422;cursor:pointer;text-align:left;transition:color .15s;flex-shrink:0}
.alert-more:hover{color:#e63d2f}

/* ── KPIs ───────────────────────────────────────────────────── */
.kpi-row{display:flex;gap:10px;padding:14px 18px}
.kpi-box{flex:1;border-radius:8px;padding:14px 12px;display:flex;flex-direction:column;gap:6px}
.kpi-dark{background:#1a2540}
.kpi-light{background:#f5f7fa;border:1px solid #e4e7ed}
.kpi-red{background:#fff5f5;border:1px solid #fecaca}
.kn{font-family:'Barlow Condensed',sans-serif;font-size:34px;font-weight:900;line-height:1}
.kpi-dark .kn{color:#fff}
.kn-plain{color:#0d1422}
.kn-red{color:#e63d2f}
.kl{font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:1.5px}
.kpi-dark .kl{color:rgba(255,255,255,.45)}
.kl-plain{color:#8895a7}
.kl-red{color:#e63d2f}

/* ── CUMPLIMIENTO HOY ───────────────────────────────────────── */
.cumpl-block{padding:0 18px 14px;border-bottom:1px solid #f0f2f6}
.cumpl-row{display:flex;align-items:center;justify-content:space-between;margin-bottom:6px}
.cumpl-label{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.2px;color:#8895a7}
.cumpl-pct{font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:900;line-height:1}
.cg{color:#166534}.ca{color:#92400e}.cr{color:#e63d2f}
.cumpl-track{height:7px;background:#e8ecf2;border-radius:99px;overflow:hidden}
.cumpl-fill{height:100%;border-radius:99px;transition:width .6s ease}
.cumpl-fill.cg{background:#22c55e}.cumpl-fill.ca{background:#f59e0b}.cumpl-fill.cr{background:#e63d2f}
.cumpl-detail{margin:5px 0 0;font-size:11px;display:flex;flex-wrap:wrap;gap:3px;color:#8895a7}
.cok{color:#166534;font-weight:600}.cpend{color:#92400e;font-weight:600}
.cmiss{color:#e63d2f;font-weight:600}.csep{color:#d1d5db}.ctotal{color:#b0bbc9}

/* ── Inspector list ─────────────────────────────────────────── */
.ilist{padding:0 18px 14px}
.ilist.scroll-body{padding:0;max-height:260px}
.ilist.scroll-body .irow{padding:9px 18px}
.irow{display:flex;align-items:center;gap:10px;padding:10px 0;border-bottom:1px solid #f5f7fa}
.irow:last-child{border-bottom:none}
.ir-av{width:34px;height:34px;border-radius:50%;flex-shrink:0;color:#fff;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:800;display:flex;align-items:center;justify-content:center}
.ir-info{flex:1;min-width:0}
.ir-name{display:block;font-size:13px;font-weight:600;color:#0d1422;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.ir-meta{display:block;font-size:11px;color:#8895a7}
.ir-badge{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:.7px;padding:4px 9px;border-radius:4px;white-space:nowrap;flex-shrink:0}
.ir-badge--ok{background:#1a2540;color:#fff}
.ir-badge--obs{background:#fefce8;color:#854d0e;border:1px solid #fde68a}
.ir-badge--red{background:#fff5f5;color:#e63d2f;border:1px solid #fecaca}

/* ── No data ────────────────────────────────────────────────── */
.no-data{padding:22px 18px;text-align:center;font-size:13px;color:#8895a7}

/* ── Fleet ──────────────────────────────────────────────────── */
.fleet-card{margin-bottom:0}
.fleet-scroll{overflow-x:auto;overflow-y:auto;max-height:420px}
.fleet-scroll::-webkit-scrollbar{width:4px;height:4px}
.fleet-scroll::-webkit-scrollbar-track{background:transparent}
.fleet-scroll::-webkit-scrollbar-thumb{background:#d4d9e3;border-radius:99px}
.fleet-scroll::-webkit-scrollbar-thumb:hover{background:#b0bbc9}
.fleet-scroll .fleet-tbl thead th{position:sticky;top:0;background:#fff;z-index:2}
.fleet-head{display:flex;align-items:center;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #f0f2f6;flex-wrap:wrap;gap:12px}
.fleet-head-left{display:flex;align-items:center;gap:12px;flex-wrap:wrap}
.fleet-title{font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:900;color:#0d1422;letter-spacing:.5px;margin:0}
.fleet-chips{display:flex;gap:7px;align-items:center;flex-wrap:wrap}
.fc-chip{font-family:'Barlow Condensed',sans-serif;font-size:11px;font-weight:700;letter-spacing:.8px;padding:4px 10px;border-radius:5px;display:inline-flex;align-items:center;gap:4px}
.fc-all{background:#f2f4f7;color:#4a5568;border:1px solid #d4d9e3}
.fc-ok{background:#1a2540;color:#fff}
.fc-red{background:#fff5f5;color:#e63d2f;border:1px solid #fecaca}
.fc-warn{background:#fffbeb;color:#92400e;border:1px solid #fde68a}
.fc-vac{background:#fefce8;color:#854d0e;border:1px solid #fef08a}

/* ── Fleet search ───────────────────────────────────────────── */
.fleet-search{display:flex;align-items:center;gap:8px;background:#f8f9fc;border:1.5px solid #e4e7ed;border-radius:8px;padding:9px 13px;min-width:260px;color:#8895a7;transition:border-color .2s,background .2s}
.fs-focus{border-color:#1a2540;background:#fff}
.fleet-search input{border:none;outline:none;background:none;font-size:13px;font-family:'Barlow',sans-serif;color:#0d1422;flex:1;min-width:0}
.fleet-search input::placeholder{color:#b0bbc9}
.fs-clear{background:none;border:none;cursor:pointer;color:#b0bbc9;padding:0;display:flex;align-items:center;flex-shrink:0;transition:color .15s}
.fs-clear:hover{color:#4a5568}

.search-summary{padding:8px 20px;font-size:12px;color:#8895a7;border-bottom:1px solid #f0f2f6;background:#fafbfc}
.search-empty{color:#e63d2f}

/* ── Fleet table ────────────────────────────────────────────── */
.fleet-tbl{width:100%;border-collapse:collapse}
.fleet-tbl th{text-align:left;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.2px;color:#8895a7;padding:10px 14px;border-bottom:1px solid #f0f2f6;white-space:nowrap}
.fleet-tbl tbody tr{border-bottom:1px solid #f5f7fa;transition:background .1s;animation:rIn .3s ease calc(var(--ri,0)*.04s) both}
.fleet-tbl tbody tr:last-child{border-bottom:none}
.fleet-tbl tbody tr:hover{background:#fafbfc}
.fleet-tbl td{padding:10px 14px;font-size:13px;color:#0d1422;vertical-align:middle}
@keyframes rIn{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:translateX(0)}}

.fc-user{display:flex;align-items:center;gap:10px}
.fc-av{width:32px;height:32px;border-radius:8px;flex-shrink:0;color:#fff;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center}
.fc-name{font-size:13px;font-weight:600;color:#0d1422;white-space:nowrap}
.fc-email{font-size:11px;color:#8895a7}

.frol{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:.8px;padding:3px 9px;border-radius:4px}
.frol-admin{background:#1a2540;color:#fff}
.frol-driver{background:#f2f4f7;color:#4a5568;border:1px solid #d4d9e3}

.ftd{font-size:13px;color:#4a5568}
.fmono{font-variant-numeric:tabular-nums}
.fna{color:#b0bbc9;font-style:italic;font-size:11px}
.fplaca{display:inline-block;padding:2px 8px;background:#f2f4f7;border:1px solid #e4e7ed;border-radius:4px;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:.8px;color:#0d1422}

/* ── Document badges (SOAT / Tecno) ────────────────────────── */
.doc-badge{font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:.5px;padding:3px 8px;border-radius:4px;white-space:nowrap;display:inline-block}
.db-ok{background:#f0fdf4;color:#166534;border:1px solid #bbf7d0}
.db-pronto{background:#fffbeb;color:#92400e;border:1px solid #fde68a}
.db-critico{background:#fff7ed;color:#c2410c;border:1px solid #fed7aa}
.db-vencido{background:#fff5f5;color:#e63d2f;border:1px solid #fecaca;font-weight:800}
.db-na{color:#b0bbc9}
.db-dot{width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0}

.fstatus{display:inline-flex;align-items:center;gap:5px;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:.8px;padding:4px 9px;border-radius:4px}
.fs-dot{width:5px;height:5px;border-radius:50%;background:currentColor;flex-shrink:0}
.fs-active{background:#f0fdf4;color:#166534}
.fs-inactive{background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb}
.fs-vacation{background:#fffbeb;color:#92400e;border:1px solid #fde68a}

.fac-btn{width:28px;height:28px;border-radius:6px;background:none;border:1px solid #e4e7ed;cursor:pointer;color:#8895a7;display:flex;align-items:center;justify-content:center;transition:background .15s,color .15s}
.fac-btn:hover{background:#f2f4f7;color:#0d1422}

/* ── Pagination ─────────────────────────────────────────────── */
.fleet-footer{display:flex;align-items:center;justify-content:space-between;padding:11px 20px;border-top:1px solid #f0f2f6;flex-wrap:wrap;gap:8px}
.ff-info{font-size:12px;color:#8895a7}
.ff-nav{display:flex;align-items:center;gap:8px}
.ff-pg{font-size:12px;color:#4a5568;font-weight:600}
.ff-btn{padding:4px 12px;border-radius:5px;border:1.5px solid #d4d9e3;background:#f2f4f7;font-size:13px;font-weight:700;cursor:pointer;color:#0d1422;transition:background .15s;font-family:'Barlow Condensed',sans-serif}
.ff-btn:hover:not(:disabled){background:#e8eaf0}
.ff-btn:disabled{opacity:.4;cursor:not-allowed}

/* ── Skeleton ───────────────────────────────────────────────── */
.skel-list{padding:14px 18px;display:flex;flex-direction:column;gap:8px}
.skel-r{height:40px;border-radius:7px;background:linear-gradient(90deg,#f2f4f7 25%,#e8eaf0 50%,#f2f4f7 75%);background-size:400% 100%;animation:sk 1.5s infinite}
.skel-r--tall{height:52px}
@keyframes sk{0%{background-position:400%0}100%{background-position:-400%0}}

/* ── Toast ──────────────────────────────────────────────────── */
.live-toast{position:fixed;bottom:24px;right:24px;z-index:50;display:flex;align-items:center;gap:10px;background:#1a2540;color:#fff;border-radius:10px;padding:12px 18px;box-shadow:0 8px 32px rgba(0,0,0,.2);font-size:13px;font-weight:600}
.lt-dot{width:8px;height:8px;border-radius:50%;background:#22c55e;box-shadow:0 0 6px rgba(34,197,94,.6);animation:gp 2s infinite;flex-shrink:0}
@keyframes gp{0%,100%{opacity:1}50%{opacity:.4}}
.toast-t-enter-active{animation:tIn .4s cubic-bezier(.22,1,.36,1)}
.toast-t-leave-active{animation:tIn .3s reverse}
@keyframes tIn{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}

/* ── LIVE badge ─────────────────────────────────────────────── */
.auto-tag{display:inline-flex;align-items:center;gap:4px;padding:2px 7px;border-radius:99px;background:#f0fdf4;border:1px solid #bbf7d0;font-family:'Barlow Condensed',sans-serif;font-size:9px;font-weight:700;letter-spacing:.8px;color:#166534}
.auto-dot{width:5px;height:5px;border-radius:50%;background:#22c55e;animation:gp 2s infinite}
@keyframes spin{to{transform:rotate(360deg)}}
/* Period selector */
.period-selector{display:inline-flex;border:1.5px solid #d4d9e3;border-radius:6px;overflow:hidden;background:#f2f4f7}
.ps-btn{padding:7px 12px;background:none;border:none;border-right:1px solid #d4d9e3;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:.6px;color:#8895a7;cursor:pointer;transition:background .12s,color .12s;white-space:nowrap}
.ps-btn:last-child{border-right:none}
.ps-btn:hover:not(.ps-btn--active){background:#e8eaf0;color:#0d1422}
.ps-btn--active{background:#1a2540;color:#fff}

/* ── Plate Reader ───────────────────────────────── */
.fs-cam{width:34px;height:34px;border-radius:0 8px 8px 0;border:none;border-left:1px solid #e4e7ed;background:none;cursor:pointer;color:#8895a7;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:color .15s,background .15s}
.fs-cam:hover{color:#0d1422;background:#f2f4f7}
.plate-video{width:100%;border-radius:8px;background:#000;max-height:360px;object-fit:contain}
.plate-spinner{display:flex;flex-direction:column;align-items:center;gap:12px;padding:32px 0}
.spinner{width:36px;height:36px;border:3px solid #e4e7ed;border-top-color:#1a2540;border-radius:50%;animation:spin .7s linear infinite}
.plate-badge-result{display:inline-block;font-size:28px;font-weight:900;font-family:'Barlow Condensed',sans-serif;letter-spacing:3px;padding:10px 24px;background:#1a2540;color:#fff;border-radius:8px;margin:12px 0}
.plate-tipo{font-size:13px;color:#4a5568;margin:4px 0}
.plate-conf{font-size:12px;color:#8895a7;margin:4px 0 16px}
.plate-actions{display:flex;gap:8px;justify-content:center;flex-wrap:wrap}
.ff-input-row{display:flex;gap:6px;align-items:stretch}
.btn-read-plate{width:40px;border-radius:6px;border:1.5px solid #d4d9e3;background:#f2f4f7;cursor:pointer;color:#4a5568;display:flex;align-items:center;justify-content:center;flex-shrink:0;transition:color .15s,border-color .15s,background .15s}
.btn-read-plate:hover{color:#0d1422;border-color:#1a2540;background:#e8eaf0}
/* ── Modal global styles (shared) ──────────────── */
:global(.modal-overlay){position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px}
:global(.modal-box){background:#fff;border-radius:12px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.25)}
:global(.modal-head){display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #f0f2f6}
:global(.modal-head h3){font-size:16px;font-weight:700;margin:0}
:global(.modal-close){width:32px;height:32px;border:none;background:none;font-size:22px;cursor:pointer;color:#8895a7;border-radius:6px;display:flex;align-items:center;justify-content:center}
:global(.modal-close:hover){background:#f2f4f7;color:#0d1422}
:global(.modal-body){padding:20px}
:global(.modal-enter-active){animation:mIn .25s cubic-bezier(.22,1,.36,1)}
:global(.modal-leave-active){animation:mIn .2s reverse}
@keyframes mIn{from{opacity:0;transform:scale(.96)}to{opacity:1;transform:scale(1)}}
</style>