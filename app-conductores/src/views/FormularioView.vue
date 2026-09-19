<template>
  <div class="form-shell">

    <!-- ══ TOPBAR — PREOPERACIONAL ══ -->
    <header class="topbar">
      <div class="tb-left">
        <img :src="logoImg" alt="Logo" class="tb-logo" />
        <span class="tb-brand">PREOPERACIONAL</span>
      </div>
      <!-- Avatar con iniciales del inspector (solo decorativo) -->
      <div class="tb-avatar" :title="auth.fullName">{{ initiales }}</div>
    </header>

    <!-- ══ LOADING ══ -->
    <div v-if="loadingForm || checkingDuplicado" class="state-center">
      <div class="spinner"></div>
      <p class="state-txt">CARGANDO FORMULARIO...</p>
    </div>

    <!-- ══ EN VACACIONES ══ -->
    <div v-else-if="enVacaciones" class="done-screen">
      <div class="done-icon-wrap vac-icon">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" stroke="#f59e0b" stroke-width="3"/>
          <path d="M20 28l4-6h16l4 6M20 28v12a2 2 0 002 2h20a2 2 0 002-2V28M32 34v6M24 22h-2M42 22h-2" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3 class="done-title vac-title">EN VACACIONES</h3>
      <p class="done-sub">No puedes realizar la inspección preoperacional porque estás en período de vacaciones.</p>
      <div class="done-card" v-if="vacacionInfo">
        <div class="dc-row"><span>Inicio</span><strong>{{ vacacionInfo.fechaInicio }}</strong></div>
        <div class="dc-row"><span>Fin</span><strong>{{ vacacionInfo.fechaFin }}</strong></div>
      </div>
      <router-link to="/historial" class="btn-secondary">VER HISTORIAL</router-link>
    </div>

    <!-- ══ EN AUSENCIA ══ -->
    <div v-else-if="enAusencia" class="done-screen">
      <div class="done-icon-wrap aus-icon">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" stroke="#7c3aed" stroke-width="3"/>
          <path d="M22 22l20 20M42 22l-20 20" stroke="#7c3aed" stroke-width="2.5" stroke-linecap="round"/>
        </svg>
      </div>
      <h3 class="done-title aus-title">DÍA NO LABORAL</h3>
      <p class="done-sub">No puedes realizar la inspección preoperacional porque hoy es un día no laboral registrado.</p>
      <div class="done-card" v-if="ausenciaInfo">
        <div class="dc-row"><span>Motivo</span><strong>{{ motivoLabel(ausenciaInfo.motivo) }}</strong></div>
        <div class="dc-row"><span>Fecha</span><strong>{{ ausenciaInfo.fecha }}</strong></div>
      </div>
      <router-link to="/historial" class="btn-secondary">VER HISTORIAL</router-link>
    </div>

    <!-- ══ YA INSPECCIONÓ HOY ══ -->
    <div v-else-if="yaInspecciono" class="done-screen">
      <div class="done-icon-wrap">
        <svg width="64" height="64" viewBox="0 0 64 64" fill="none">
          <circle cx="32" cy="32" r="30" stroke="#27ae60" stroke-width="3"/>
          <path d="M20 32l8 9 16-18" stroke="#27ae60" stroke-width="3.5"
            stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </div>
      <h3 class="done-title">INSPECCIÓN COMPLETADA</h3>
      <p class="done-sub">Ya realizaste tu revisión de hoy. Solo se permite una por jornada.</p>
      <div class="done-card" v-if="inspeccionHoy">
        <div class="dc-row"><span>Vehículo</span><strong>{{ inspeccionHoy.placa }}</strong></div>
        <div class="dc-row"><span>Ciudad</span><strong>{{ inspeccionHoy.ciudad }}</strong></div>
        <div class="dc-row"><span>Hora</span><strong>{{ fmtHora(inspeccionHoy.fecha) }}</strong></div>
      </div>
      <!-- Botón historial: lleva a ver las inspecciones anteriores -->
      <router-link to="/historial" class="btn-secondary">VER HISTORIAL</router-link>
    </div>

    <!-- ══ ERROR ══ -->
    <div v-else-if="loadError" class="error-screen">
      <p class="error-msg">{{ loadError }}</p>
      <!-- Botón reintentar: vuelve a llamar loadForm() -->
      <button class="btn-secondary" @click="loadForm">REINTENTAR</button>
    </div>

    <!-- ══ FORMULARIO PRINCIPAL ══ -->
    <template v-else>
      <div class="content">

        <!-- ── INSPECTOR AUTORIZADO ──
             Muestra datos del conductor autenticado.
             Ciudad y teléfono vienen del campo user en el store (retornados por auth.service en backend). -->
        <div class="inspector-card">
          <p class="ic-eyebrow">INSPECTOR AUTORIZADO</p>
          <h2 class="ic-name">{{ auth.fullName }}</h2>
          <div class="ic-details">
            <!-- Cédula / ID del conductor -->
            <div class="ic-row">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1.5" y="2" width="11" height="10" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
                <path d="M4 6h6M4 8.5h4" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              <span>ID: {{ auth.cedula }}</span>
            </div>
            <!-- Correo electrónico del conductor -->
            <div class="ic-row">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <rect x="1" y="3" width="12" height="8" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
                <path d="M1 5.5L7 8.5L13 5.5" stroke="currentColor" stroke-width="1.2"/>
              </svg>
              <span>{{ auth.user?.email || '—' }}</span>
            </div>
            <!-- Ciudad del conductor (del perfil) -->
            <div v-if="auth.ciudad" class="ic-row">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1.5C4.5 1.5 2.5 3.5 2.5 6C2.5 9.5 7 12.5 7 12.5C7 12.5 11.5 9.5 11.5 6C11.5 3.5 9.5 1.5 7 1.5Z" stroke="currentColor" stroke-width="1.2"/>
                <circle cx="7" cy="6" r="1.5" stroke="currentColor" stroke-width="1.2"/>
              </svg>
              <span>{{ auth.ciudad }}</span>
            </div>
            <!-- Teléfono del conductor (del perfil) -->
            <div v-if="auth.telefono" class="ic-row">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M3 2.5C3 2 3.5 1.5 4 1.5h1.5c.3 0 .6.2.7.5l.8 2c.1.3 0 .6-.2.8L5.6 5.9C6.3 7.3 7 8 8.3 8.8l1.1-.9c.2-.2.5-.3.8-.2l2 .8c.3.1.5.4.5.7v1.5c0 .5-.5 1-1 1C5 12 2 7.5 2 4c0-1 .5-1.5 1-1.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
              </svg>
              <span>{{ auth.telefono }}</span>
            </div>
          </div>
        </div>

        <!-- ── VEHÍCULO EN INSPECCIÓN ──
             Placa viene del perfil del conductor (auth.placa) o se ingresa manualmente. -->
        <div class="vehicle-card">
          <p class="vc-eyebrow">VEHÍCULO EN INSPECCIÓN</p>
          <div class="vc-plate">{{ getPlaca() || '— — — — —' }}</div>
          <p class="vc-type">{{ contrato || 'Sin contrato asignado' }}</p>
        </div>

        <!-- ── VIGENCIA DE DOCUMENTOS ──
             Fechas de SOAT y Tecnicomecánica del perfil del conductor.
             Los badges se calculan automáticamente con vigenciaStatus(). -->
        <div v-if="auth.soatVigencia || auth.tecniVigencia" class="vigencia-section">
          <h3 class="vs-title">
            <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
              <path d="M8.5 1.5L14.5 4.5V9.5C14.5 13 11.5 15.5 8.5 17C5.5 15.5 2.5 13 2.5 9.5V4.5L8.5 1.5Z"
                stroke="#1a2540" stroke-width="1.4" stroke-linejoin="round"/>
              <path d="M6 9l2 2 4-4" stroke="#1a2540" stroke-width="1.4"
                stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Vigencia de Documentos
          </h3>
          <div class="vs-body">
            <!-- SOAT: verde=vigente, naranja=por vencer (<30 días), rojo=vencido -->
            <div v-if="auth.soatVigencia" class="vs-row">
              <div class="vs-left">
                <p class="vs-label">Vigencia SOAT</p>
                <p class="vs-date">{{ fmtFecha(auth.soatVigencia) }}</p>
              </div>
              <span class="vs-badge" :class="vigenciaStatus(auth.soatVigencia).cls">
                {{ vigenciaStatus(auth.soatVigencia).label }}
              </span>
            </div>
            <!-- Tecnicomecánica: misma lógica de colores -->
            <div v-if="auth.tecniVigencia" class="vs-row vs-row-last">
              <div class="vs-left">
                <p class="vs-label">Vigencia Tecnicomecánica</p>
                <p class="vs-date">{{ fmtFecha(auth.tecniVigencia) }}</p>
              </div>
              <span class="vs-badge" :class="vigenciaStatus(auth.tecniVigencia).cls">
                {{ vigenciaStatus(auth.tecniVigencia).label }}
              </span>
            </div>
          </div>
        </div>

        <!-- ── DATOS OPERATIVOS ──
             Solo placa (si no está en perfil) y contrato.
             CIUDAD se eliminó porque ya aparece en Inspector Autorizado. -->
        <div class="section">
          <h3 class="section-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1.5L12.5 4V10c0 2.5-1.8 4.7-4.5 5.5C5.3 14.7 3.5 12.5 3.5 10V4L8 1.5Z"
                stroke="currentColor" stroke-width="1.4"/>
            </svg>
            Datos Operativos
          </h3>

          <!-- Placa manual: solo aparece si el conductor no tiene placa asignada en el perfil -->
          <div v-if="!auth.placa" class="form-field" :class="{ invalid: fv.placa === false }">
            <label class="field-label">
              PLACA DEL VEHÍCULO <span class="req">*</span>
              <span class="field-hint">— Ej: ABC-123 (se usa para identificar el vehículo)</span>
            </label>
            <div class="field-box">
              <input
                v-model="placaManual"
                type="text" placeholder="ABC-123" maxlength="10"
                @input="placaManual = placaManual.toUpperCase().replace(/[^A-Z0-9-]/g, '')"
                @blur="fv.placa = /^[A-Z0-9-]{4,10}$/.test(placaManual)"
              />
            </div>
            <p v-if="fv.placa === false" class="field-err">Formato de placa inválido (ej: ABC-123)</p>
          </div>

          <!-- CONTRATO / ÁREA — Dropdown custom profesional -->
          <div class="form-field" :class="{ invalid: fv.contrato === false }">
            <label class="field-label">
              CONTRATO / ÁREA <span class="req">*</span>
              <span class="field-hint">— Selecciona el área de trabajo para este turno</span>
            </label>
            <!-- Botón que abre el dropdown -->
            <div
              class="cdd-trigger"
              :class="{ open: ddOpen, selected: !!contrato, invalid: fv.contrato === false }"
              @click="ddOpen = !ddOpen"
            >
              <span class="cdd-val">{{ contrato || 'Selecciona una opción' }}</span>
              <svg class="cdd-arrow" :class="{ rotated: ddOpen }"
                width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 6l4 4 4-4" stroke="currentColor" stroke-width="1.6"
                  stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
            </div>
            <!-- Lista de opciones -->
            <Transition name="dd-t">
              <div v-if="ddOpen" class="cdd-list">
                <button
                  v-for="opt in contratos"
                  :key="opt"
                  class="cdd-option"
                  :class="{ selected: contrato === opt }"
                  type="button"
                  @click="selectContrato(opt)"
                >
                  <svg v-if="contrato === opt" width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2.5 7l3 3.5L11.5 4" stroke="currentColor" stroke-width="1.8"
                      stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  <span v-else class="cdd-dot"></span>
                  {{ opt }}
                </button>
              </div>
            </Transition>
            <!-- Click fuera cierra el dropdown -->
            <div v-if="ddOpen" class="cdd-backdrop" @click="ddOpen = false"></div>
            <p v-if="fv.contrato === false" class="field-err">Selecciona un contrato</p>
          </div>
        </div>

        <!-- ── FOTO DEL VEHÍCULO ──
             Captura directamente desde la cámara (NO galería) gracias a
             capture="environment".  La imagen se sube a /uploads/image
             al momento de tomarla; el URL queda en vehiclePhotoUrl y se
             incluye en el payload del submit como imagenVehiculo. -->
        <div class="section">
          <h3 class="section-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="4" width="14" height="10" rx="2" stroke="currentColor" stroke-width="1.4"/>
              <circle cx="8" cy="9" r="2.8" stroke="currentColor" stroke-width="1.4"/>
              <path d="M5.5 4l1.5-2.5h3L11.5 4" stroke="currentColor" stroke-width="1.4"
                stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Foto del Vehículo
            <span class="required-badge" :class="vehiclePhotoUrl ? 'rb-ok' : 'rb-req'">
              {{ vehiclePhotoUrl ? '✓ Registrada' : '* Obligatoria' }}
            </span>
          </h3>

          <!-- Vista previa una vez tomada la foto -->
          <div v-if="vehiclePreview || vehiclePhotoUrl" class="photo-preview">
            <img :src="vehiclePreview || vehiclePhotoUrl" class="photo-img" alt="Foto del vehículo"/>
            <!-- Indicador de upload (spinning mientras sube) -->
            <div v-if="vehicleUploading" class="vp-status vp-uploading">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none" class="vp-spin">
                <circle cx="7" cy="7" r="5.5" stroke="rgba(255,255,255,.75)" stroke-width="1.5"
                  stroke-dasharray="18 10" stroke-linecap="round"/>
              </svg>
              Subiendo foto...
            </div>
            <!-- Error de upload -->
            <div v-else-if="vehicleUploadError" class="vp-status vp-error">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.3"/>
                <path d="M7 4.5V7.5M7 9.5v.3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
              </svg>
              Error al subir — toca CAMBIAR
            </div>
            <!-- Badge foto registrada -->
            <div v-else class="vp-status vp-ok">
              <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
                <path d="M2 7l3.5 4.5L12 3" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              FOTO REGISTRADA
            </div>
            <div class="photo-actions">
              <button type="button" class="photo-change" @click="openVehicleCamera"
                title="Tomar otra foto">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 2h3l1.5-1.5h3L11 2h1.5c.8 0 1.5.7 1.5 1.5v7.5c0 .8-.7 1.5-1.5 1.5H1.5C.7 12.5 0 11.8 0 11V3.5C0 2.7.7 2 1.5 2H2z"
                    stroke="currentColor" stroke-width="1.1" fill="none"/>
                  <circle cx="7" cy="7" r="2.3" stroke="currentColor" stroke-width="1.1"/>
                </svg>
                CAMBIAR FOTO
              </button>
            </div>
          </div>

          <!-- Botón tomar foto (solo visible si no hay foto aún) -->
          <button
            v-else
            type="button"
            class="photo-btn"
            @click="openVehicleCamera"
            :disabled="vehicleUploading"
            title="Abrir cámara del dispositivo"
          >
            <div class="photo-btn-icon">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <rect x="1.5" y="6" width="21" height="15" rx="3" stroke="currentColor" stroke-width="1.7"/>
                <circle cx="12" cy="13.5" r="4" stroke="currentColor" stroke-width="1.7"/>
                <circle cx="12" cy="13.5" r="1.6" fill="currentColor" opacity=".35"/>
                <path d="M8.5 6l2-3h3l2 3" stroke="currentColor" stroke-width="1.7"
                  stroke-linecap="round" stroke-linejoin="round"/>
                <circle cx="19" cy="9.5" r="1.2" fill="currentColor" opacity=".6"/>
              </svg>
            </div>
            <span class="photo-btn-text">
              {{ vehicleUploading ? 'SUBIENDO...' : 'TOMAR FOTO' }}
              <span class="photo-btn-sub" v-if="!vehicleUploading">Cámara trasera del dispositivo</span>
            </span>
          </button>

          <!-- Input oculto: capture="environment" fuerza la cámara trasera (no galería) -->
          <input
            ref="vehicleCameraRef"
            type="file"
            accept="image/*"
            capture="environment"
            class="file-input-hidden"
            @change="handleVehiclePhoto"
          />

          <!-- Error visible cuando se intentó enviar sin foto -->
          <p v-if="photoRequired && !vehiclePhotoUrl" class="photo-required-err">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.3"/>
              <path d="M7 4v3.5M7 9.5v.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
            </svg>
            La foto del vehículo es obligatoria para enviar la revisión
          </p>
        </div>

        <!-- ── BARRA DE PROGRESO + CHECKLIST OBLIGATORIO ──────────────
             Muestra el estado en tiempo real de todos los requisitos.
             isFormValid controla también si el botón ENVIAR está activo. -->

        <!-- Checklist visual de requisitos -->
        <div class="req-checklist">
          <span class="req-item" :class="contrato ? 'req-ok' : 'req-pending'">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path v-if="contrato" d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              <circle v-else cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2"/>
            </svg>
            Contrato
          </span>
          <span class="req-item" :class="vehiclePhotoUrl ? 'req-ok' : 'req-pending'">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path v-if="vehiclePhotoUrl" d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              <circle v-else cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2"/>
            </svg>
            Foto del vehículo
          </span>
          <span class="req-item" :class="pendingCount === 0 && totalQ > 0 ? 'req-ok' : 'req-pending'">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path v-if="pendingCount === 0 && totalQ > 0" d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
              <circle v-else cx="6" cy="6" r="5" stroke="currentColor" stroke-width="1.2"/>
            </svg>
            <template v-if="pendingCount > 0">{{ pendingCount }} pregunta{{ pendingCount > 1 ? 's' : '' }} pendiente{{ pendingCount > 1 ? 's' : '' }}</template>
            <template v-else>Preguntas completadas</template>
          </span>
        </div>

        <!-- Barra de progreso -->
        <div class="progress-row">
          <div class="pr-track">
            <div class="pr-fill" :style="{ width: progressPct + '%' }"></div>
          </div>
          <span class="pr-txt">{{ answeredCount }}/{{ totalQ }}</span>
        </div>

        <!-- ── PREGUNTAS DE INSPECCIÓN ──
             Se cargan desde el backend (/forms → preguntas activas).
             Tipos soportados: BOOLEAN (Bueno/Malo), SINO (Sí/No),
             NUMERO (valor numérico) y TEXTO (descripción libre). -->
        <div class="section" v-if="form?.questions?.length">
          <h3 class="section-title">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M8 1L14.5 5.5V10.5C14.5 13 11.5 15 8 15C4.5 15 1.5 13 1.5 10.5V5.5L8 1Z"
                stroke="currentColor" stroke-width="1.4"/>
              <path d="M5.5 8l2 2.5L11 6" stroke="currentColor" stroke-width="1.4"
                stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
            Inspección Revisión
          </h3>

          <div
            v-for="(q, idx) in form.questions"
            :key="q.id"
            class="q-block"
            :class="{ answered: isAnswered(q.id), 'q-error': qErr[q.id] }"
          >
            <!-- Ícono de categoría (decorativo, rota entre 8 íconos) -->
            <div class="qb-icon" v-html="qIconHtml(idx)"></div>
            <!-- Texto de la pregunta (viene del backend) -->
            <p class="qb-text">{{ q.texto }}</p>

            <!-- ── TIPO BOOLEAN: botones BUENO / MALO ──
                 BUENO → valor 'OK' → respuesta favorable
                 MALO  → valor 'NO' → respuesta desfavorable (requiere observación) -->
            <div v-if="q.tipo === 'BOOLEAN'">
              <div class="bm-group">
                <button
                  class="bm-btn bm-bueno"
                  :class="{ active: answers[q.id] === 'OK' }"
                  @click="selectAnswer(q.id, 'OK')"
                  type="button"
                  :aria-pressed="answers[q.id] === 'OK'"
                  title="Estado correcto / sin novedad"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l3.5 4L12 3" stroke="currentColor" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  BUENO
                </button>
                <button
                  class="bm-btn bm-malo"
                  :class="{ active: answers[q.id] === 'NO' }"
                  @click="selectAnswer(q.id, 'NO')"
                  type="button"
                  :aria-pressed="answers[q.id] === 'NO'"
                  title="Estado con novedad — requiere observación"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" stroke-width="2"
                      stroke-linecap="round"/>
                  </svg>
                  MALO
                </button>
              </div>

              <!-- Campo de observaciones: siempre visible, OBLIGATORIO solo cuando MALO -->
              <div class="obs-block obs-block--always">
                <label class="obs-label">
                  OBSERVACIONES
                  <span v-if="answers[q.id] === 'NO'" class="req">*</span>
                  <span v-else class="obs-opt">(opcional)</span>
                </label>
                <textarea
                  v-model="observaciones[q.id]"
                  :placeholder="answers[q.id] === 'NO'
                    ? 'Describe la falla o novedad técnica encontrada…'
                    : answers[q.id] === 'OK'
                      ? 'Agrega una observación si es necesario…'
                      : 'Selecciona BUENO o MALO primero…'"
                  :disabled="!answers[q.id]"
                  class="obs-textarea"
                  :class="{ 'obs-required': answers[q.id] === 'NO', 'obs-err-highlight': obsErr[q.id] }"
                  rows="3"
                  @input="obsErr[q.id] = false"
                ></textarea>
                <p v-if="obsErr[q.id]" class="field-err">
                  La observación es obligatoria cuando el estado es MALO
                </p>
              </div>
              <p v-if="qErr[q.id] && q.tipo === 'BOOLEAN'" class="field-err">
                Selecciona BUENO o MALO para continuar
              </p>
            </div>

            <!-- ── TIPO SINO: botones SÍ / NO ────────────────────────────
                 Para preguntas de confirmación personal.
                 Ej: ¿Se encuentra en condiciones de salud para conducir?
                 SÍ  → valor 'SI'  → respuesta afirmativa
                 NO  → valor 'NO'  → respuesta negativa
                 DIFERENCIA con BOOLEAN: BOOLEAN evalúa estado de componente
                 mecánico (Bueno/Malo). SINO confirma o niega una condición
                 personal (Sí/No). Semánticamente distintos. -->
            <div v-else-if="q.tipo === 'SINO'">
              <div class="bm-group">
                <button
                  class="bm-btn bm-bueno"
                  :class="{ active: answers[q.id] === 'SI' }"
                  @click="selectAnswer(q.id, 'SI')"
                  type="button"
                  :aria-pressed="answers[q.id] === 'SI'"
                  title="Responder Sí"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M2 7l3.5 4L12 3" stroke="currentColor" stroke-width="2"
                      stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                  SÍ
                </button>
                <button
                  class="bm-btn bm-malo"
                  :class="{ active: answers[q.id] === 'NO' }"
                  @click="selectAnswer(q.id, 'NO')"
                  type="button"
                  :aria-pressed="answers[q.id] === 'NO'"
                  title="Responder No"
                >
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                    <path d="M3 3l8 8M11 3L3 11" stroke="currentColor" stroke-width="2"
                      stroke-linecap="round"/>
                  </svg>
                  NO
                </button>
              </div>

              <!-- Observación opcional para SINO (no obligatoria en ningún caso) -->
              <div class="obs-block obs-block--always">
                <label class="obs-label">
                  OBSERVACIONES <span class="obs-opt">(opcional)</span>
                </label>
                <textarea
                  v-model="observaciones[q.id]"
                  :placeholder="answers[q.id]
                    ? 'Agrega una observación si es necesario…'
                    : 'Selecciona SÍ o NO primero…'"
                  :disabled="!answers[q.id]"
                  class="obs-textarea"
                  rows="2"
                  @input="obsErr[q.id] = false"
                ></textarea>
              </div>
              <p v-if="qErr[q.id]" class="field-err">
                Selecciona SÍ o NO para continuar
              </p>
            </div>

            <!-- ── TIPO NÚMERO: valor numérico ──
                 Ej: nivel de aceite, presión de llantas, kilometraje -->
            <div v-else-if="q.tipo === 'NUMERO'" class="obs-block">
              <label class="obs-label">VALOR NUMÉRICO <span class="req">*</span></label>
              <div class="field-box">
                <input
                  :value="answers[q.id] || ''"
                  type="number" inputmode="numeric"
                  placeholder="Ingresa un número"
                  @input="onNumberInput(q.id, $event)"
                  @blur="validateNumber(q.id)"
                  min="0"
                />
              </div>
              <p v-if="qErr[q.id]" class="field-err">Ingresa un valor numérico válido</p>
            </div>

            <!-- ── TIPO TEXTO: descripción libre ──
                 Para preguntas abiertas que requieren descripción textual -->
            <div v-else-if="q.tipo === 'TEXTO'" class="obs-block">
              <label class="obs-label">DESCRIPCIÓN <span class="req">*</span></label>
              <textarea
                :value="answers[q.id] || ''"
                class="obs-textarea"
                rows="3"
                placeholder="Escribe tu respuesta..."
                @input="onTextoInput(q.id, $event)"
                @blur="validateTexto(q.id)"
              ></textarea>
              <p v-if="qErr[q.id]" class="field-err">Este campo es requerido</p>
            </div>

          </div><!-- end q-block -->
        </div><!-- end section preguntas -->

        <!-- Error de envío -->
        <div v-if="submitError" class="submit-err">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <circle cx="8" cy="8" r="7" stroke="currentColor" stroke-width="1.4"/>
            <path d="M8 5v4M8 11v.5" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
          {{ submitError }}
        </div>

        <!-- ── BOTÓN ENVIAR REVISIÓN ──
             Deshabilitado hasta que isFormValid === true:
             · Contrato seleccionado
             · Foto del vehículo subida
             · Todas las preguntas respondidas
             Si el usuario lo intenta antes, submit() muestra el error exacto. -->
        <div class="submit-bar">
          <!-- Hint sobre qué falta (solo visible cuando el form está incompleto) -->
          <p v-if="!isFormValid && !submitting" class="submit-hint">
            <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
              <circle cx="6.5" cy="6.5" r="5.5" stroke="currentColor" stroke-width="1.2"/>
              <path d="M6.5 4v3M6.5 9v.5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/>
            </svg>
            <template v-if="!vehiclePhotoUrl">Toma la foto del vehículo</template>
            <template v-else-if="!contrato">Selecciona un contrato</template>
            <template v-else-if="pendingCount > 0">
              Faltan {{ pendingCount }} pregunta{{ pendingCount > 1 ? 's' : '' }}
            </template>
            <template v-else>Revisa los campos marcados en rojo</template>
          </p>

          <button
            class="btn-submit"
            :class="{ 'btn-submit--blocked': !isFormValid && !submitting }"
            :disabled="submitting || !isFormValid"
            @click="submit"
            type="button"
            :title="isFormValid ? 'Enviar inspección' : 'Completa todos los campos para enviar'"
          >
            <template v-if="!submitting">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M2 9l5 5L16 4" stroke="currentColor" stroke-width="2"
                  stroke-linecap="round" stroke-linejoin="round"/>
              </svg>
              ENVIAR REVISIÓN
            </template>
            <span v-else class="btn-dots">
              <span></span><span></span><span></span>
            </span>
          </button>
        </div>

      </div>
    </template>

    <!-- ══ OVERLAY DE ÉXITO ══ -->
    <Transition name="success-t">
      <div v-if="successDialog" class="success-overlay">
        <div class="success-card">
          <svg width="72" height="72" viewBox="0 0 72 72" fill="none">
            <circle cx="36" cy="36" r="34" stroke="#27ae60" stroke-width="3"/>
            <path d="M22 36l10 11 18-20" stroke="#27ae60" stroke-width="4"
              stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <h3>REVISIÓN ENVIADA</h3>
          <p>La inspección fue registrada correctamente en el sistema.</p>
          <!-- Botón continuar: cierra el overlay y recarga el estado -->
          <button @click="afterSuccess" title="Continuar al inicio">CONTINUAR</button>
        </div>
      </div>
    </Transition>

  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import logoImg from '../assets/Logo.png'
import { checkTodayInspection, getActiveForms, submitInspection, uploadImage } from '../services/inspection.service'
import { useAuthStore } from '../stores/auth'
import type { Form, InspeccionResumen, Question } from '../types'
import { validateImageFile } from '../utils/image'

const auth = useAuthStore()

const CONTRACT_OPTIONS = [
  'DISTRIBUCION Y ENTREGA',
  'CONTRATOS EXTERNOS (CLIENTES INTERADMINISTRATIVOS)',
] as const

/* ── Íconos de categoría (rotan entre 8 diseños) ─────────── */
const Q_ICONS_SVG = [
  `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="3.5" stroke="#2d6a8a" stroke-width="1.4"/>
    <path d="M10 3v2M10 15v2M3 10h2M15 10h2M5.2 5.2l1.4 1.4M13.4 13.4l1.4 1.4M5.2 14.8l1.4-1.4M13.4 6.6l1.4-1.4"
      stroke="#2d6a8a" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`,
  `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7" stroke="#2d6a8a" stroke-width="1.4"/>
    <circle cx="10" cy="10" r="2.5" stroke="#2d6a8a" stroke-width="1.4"/>
    <path d="M8 8l-3-3M12 8l3-3M8 12l-3 3M12 12l3 3" stroke="#2d6a8a" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`,
  `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="7.5" stroke="#2d6a8a" stroke-width="1.4"/>
    <circle cx="10" cy="10" r="3" stroke="#2d6a8a" stroke-width="1.4"/>
    <path d="M10 2.5v3.5M10 14v3.5M2.5 10h3.5M14 10h3.5" stroke="#2d6a8a" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`,
  `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 3C10 3 4.5 9 4.5 12.5C4.5 15.5 7 17.5 10 17.5C13 17.5 15.5 15.5 15.5 12.5C15.5 9 10 3 10 3Z"
      stroke="#2d6a8a" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M7.5 13.5C7.5 12.1 8.5 11 10 11" stroke="#2d6a8a" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`,
  `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <rect x="2" y="7" width="14" height="7" rx="1.5" stroke="#2d6a8a" stroke-width="1.4"/>
    <path d="M16 9.5v3M8 7V5.5M5 7V5.5" stroke="#2d6a8a" stroke-width="1.4" stroke-linecap="round"/>
    <path d="M5 10.5h10" stroke="#2d6a8a" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`,
  `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="10" r="3" stroke="#2d6a8a" stroke-width="1.4"/>
    <path d="M10 4v2M10 14v2M4 10h2M14 10h2M5.8 5.8l1.4 1.4M12.8 12.8l1.4 1.4M5.8 14.2l1.4-1.4M12.8 7.2l1.4-1.4"
      stroke="#2d6a8a" stroke-width="1.3" stroke-linecap="round"/>
  </svg>`,
  `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <circle cx="10" cy="7" r="3" stroke="#2d6a8a" stroke-width="1.4"/>
    <path d="M3 18c0-3.9 3.1-7 7-7s7 3.1 7 7" stroke="#2d6a8a" stroke-width="1.4" stroke-linecap="round"/>
  </svg>`,
  `<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
    <path d="M10 2L17 5.5V10.5C17 14 13.8 17 10 18.5C6.2 17 3 14 3 10.5V5.5L10 2Z"
      stroke="#2d6a8a" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M7 10l2 2.5 4-4" stroke="#2d6a8a" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>`,
]

function qIconHtml(idx: number): string {
  return `<div class="qi-wrap">${Q_ICONS_SVG[idx % Q_ICONS_SVG.length]}</div>`
}

function vigenciaStatus(dateStr: string | null): { label: string; cls: string } {
  if (!dateStr) return { label: 'VERIFICAR', cls: 'vs-gray' }

  const diff = (new Date(dateStr).getTime() - Date.now()) / 86_400_000

  if (diff < 0) return { label: 'VENCIDO', cls: 'vs-red' }
  if (diff <= 30) return { label: 'POR VENCER', cls: 'vs-orange' }

  return { label: 'VIGENTE', cls: 'vs-green' }
}

function fmtFecha(date: string | null): string {
  if (!date) return '—'

  return new Date(date).toLocaleDateString('es-CO', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function fmtHora(date: string): string {
  return new Date(date).toLocaleTimeString('es-CO', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function motivoLabel(m: string | null): string {
  const map: Record<string, string> = {
    PERMISO: 'Permiso',
    DIA_FAMILIA: 'Día de la Familia',
    VOTACION: 'Votaciones Electorales',
    CAPACITACION: 'Capacitación',
    FESTIVO_EMPRESA: 'Festivo Empresarial',
    OTRO: 'Otro',
  }
  return m && map[m] ? map[m] : (m || '—')
}

const form = ref<Form | null>(null)
const loadingForm = ref(false)
const loadError = ref('')
const submitting = ref(false)
const submitError = ref('')
const successDialog = ref(false)
const uploading = ref<number | null>(null)
const checkingDuplicado = ref(false)
const yaInspecciono = ref(false)
const inspeccionHoy = ref<InspeccionResumen | null>(null)
const enVacaciones = ref(false)
const vacacionInfo = ref<{ fechaInicio: string; fechaFin: string } | null>(null)
const enAusencia = ref(false)
const ausenciaInfo = ref<{ fecha: string; motivo: string | null } | null>(null)

const ddOpen = ref(false)
const contratos = CONTRACT_OPTIONS

const placaManual = ref('')
const contrato = ref('')
const answers = reactive<Record<number, string>>({})
const observaciones = reactive<Record<number, string>>({})
const photos = reactive<Record<number, string>>({})
const fileInputs = reactive<Record<number, HTMLInputElement>>({})
const fv = reactive<{ placa: boolean | null; contrato: boolean | null }>({
  placa: null,
  contrato: null,
})
const qErr = reactive<Record<number, boolean>>({})
const obsErr = reactive<Record<number, boolean>>({})
const photoErr = reactive<Record<number, string>>({})

const vehicleCameraRef = ref<HTMLInputElement | null>(null)
const vehiclePhotoUrl = ref<string | null>(null)
const vehiclePreview = ref<string | null>(null)
const vehicleUploading = ref(false)
const vehicleUploadError = ref(false)
/** Se activa cuando el conductor intenta enviar sin foto → muestra el error rojo */
const photoRequired     = ref(false)

const initiales = computed(() => {
  return (auth.fullName || 'U')
    .split(' ')
    .map((word: string) => word[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
})

const totalQ = computed(() => form.value?.questions?.length ?? 0)
const answeredCount = computed(() => {
  return form.value?.questions?.filter((question) => isAnswered(question.id)).length ?? 0
})
const progressPct = computed(() => {
  return totalQ.value ? Math.round((answeredCount.value / totalQ.value) * 100) : 0
})

function revokeVehiclePreview(): void {
  if (!vehiclePreview.value) return
  URL.revokeObjectURL(vehiclePreview.value)
  vehiclePreview.value = null
}

function getPlaca(): string {
  return auth.placa || placaManual.value.toUpperCase()
}

/**
 * Verifica si una pregunta tiene respuesta válida según su tipo.
 * Usado por la barra de progreso y por isFormValid.
 */
function isAnswered(id: number): boolean {
  const q = form.value?.questions.find(q => q.id === id)
  if (!q) return false
  const val = answers[id]
  if (q.tipo === 'BOOLEAN') return val === 'OK' || val === 'NO'
  if (q.tipo === 'SINO')    return val === 'SI' || val === 'NO'
  if (q.tipo === 'NUMERO')  return /^\d+(\.\d+)?$/.test((val || '').trim())
  if (q.tipo === 'TEXTO')   return (val || '').trim().length >= 1
  return false
}

/**
 * isFormValid — computed reactivo global.
 * true solo cuando:
 *  1. Placa válida (si no viene del perfil)
 *  2. Contrato seleccionado
 *  3. Foto del vehículo subida al servidor (vehiclePhotoUrl !== null)
 *  4. TODAS las preguntas respondidas según su tipo
 *  5. Preguntas BOOLEAN con valor 'NO' tienen observación no vacía
 */
const isFormValid = computed((): boolean => {
  if (!form.value?.questions?.length) return false

  // Placa válida
  if (!auth.placa && !/^[A-Z0-9-]{4,10}$/.test(placaManual.value)) return false

  // Contrato seleccionado
  if (!contrato.value) return false

  // Foto: no debe estar subiendo Y debe tener URL del servidor
  // vehicleUploading = true  → foto en curso  → bloquear
  // vehiclePhotoUrl = null   → sin foto       → bloquear
  // vehicleUploadError = true → falló subida  → bloquear
  if (vehicleUploading.value)    return false
  if (vehicleUploadError.value)  return false
  if (!vehiclePhotoUrl.value)    return false

  // Todas las preguntas válidas
  return form.value.questions.every(q => {
    const val = answers[q.id]

    if (q.tipo === 'BOOLEAN') {
      if (val !== 'OK' && val !== 'NO') return false
      if (val === 'NO' && !(observaciones[q.id] || '').trim()) return false
      return true
    }

    if (q.tipo === 'SINO')   return val === 'SI' || val === 'NO'
    if (q.tipo === 'NUMERO') return /^\d+(\.\d+)?$/.test((val || '').trim())
    if (q.tipo === 'TEXTO')  return (val || '').trim().length >= 1
    return true
  })
})

/** Preguntas aún sin responder — para feedback en la barra de progreso */
const pendingCount = computed((): number =>
  form.value?.questions.filter(q => !isAnswered(q.id)).length ?? 0
)

function selectContrato(opt: string): void {
  contrato.value = opt
  fv.contrato = true
  ddOpen.value = false
}

function selectAnswer(qId: number, value: string): void {
  answers[qId] = value
  qErr[qId] = false
  obsErr[qId] = false
}

function onNumberInput(qId: number, event: Event): void {
  const element = event.target as HTMLInputElement
  const cleanValue = element.value.replace(/[^0-9.]/g, '').replace(/(\..*)\.+/g, '$1')

  element.value = cleanValue
  answers[qId] = cleanValue
  qErr[qId] = false
}

function onTextoInput(qId: number, event: Event): void {
  const element = event.target as HTMLTextAreaElement
  const cleanValue = element.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s.,;:\-'°%()!?0-9]/g, '')

  element.value = cleanValue
  answers[qId] = cleanValue
  qErr[qId] = false
}

function validateNumber(qId: number): boolean {
  const ok = /^\d+(\.\d+)?$/.test((answers[qId] || '').trim())
  qErr[qId] = !ok
  return ok
}

function validateTexto(qId: number): boolean {
  const ok = (answers[qId] || '').trim().length >= 1
  qErr[qId] = !ok
  return ok
}

function validateQuestion(question: Question): boolean {
  if (question.tipo === 'BOOLEAN') {
    if (!answers[question.id]) {
      qErr[question.id] = true
      return false
    }

    if (answers[question.id] === 'NO' && !(observaciones[question.id] || '').trim()) {
      obsErr[question.id] = true
      return false
    }
  }

  // FIX: SINO requiere selección obligatoria (SÍ o NO), sin observación obligatoria
  if (question.tipo === 'SINO') {
    if (!answers[question.id]) {
      qErr[question.id] = true
      return false
    }
  }

  if (question.tipo === 'NUMERO') return validateNumber(question.id)
  if (question.tipo === 'TEXTO') return validateTexto(question.id)

  return true
}

function validateAll(): boolean {
  let valid = true

  if (!auth.placa && !/^[A-Z0-9-]{4,10}$/.test(placaManual.value)) {
    fv.placa = false
    valid = false
  }

  if (!contrato.value) {
    fv.contrato = false
    valid = false
  }

  form.value?.questions.forEach((question) => {
    if (!validateQuestion(question)) {
      valid = false
    }
  })

  return valid
}

async function openVehicleCamera(): Promise<void> {
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
    const { Capacitor } = await import('@capacitor/core')

    if (Capacitor.isNativePlatform()) {
      try {
        const status = await Camera.checkPermissions()
        if (status.camera !== 'granted') {
          const req = await Camera.requestPermissions({ permissions: ['camera'] })
          if (req.camera !== 'granted') {
            submitError.value = 'Permiso de cámara denegado. Actívalo en Configuración del dispositivo.'
            return
          }
        }
      } catch {
        submitError.value = 'No se pudo solicitar permiso de cámara.'
        return
      }

      vehicleUploading.value = true
      vehicleUploadError.value = false
      submitError.value = ''

      try {
        const image = await Camera.getPhoto({
          quality: 80,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Camera,
        })

        if (image.dataUrl) {
          revokeVehiclePreview()
          vehiclePreview.value = image.dataUrl
          await uploadVehicleDataUrl(image.dataUrl)
        }
      } catch (error) {
        console.warn('Capacitor camera error:', error)
        vehicleUploadError.value = true
        submitError.value = 'No fue posible capturar la foto.'
      } finally {
        vehicleUploading.value = false
      }
      return
    }
  } catch {
    // Native camera not available in web
  }

  // Fallback: HTML file input
  vehicleCameraRef.value?.click()
}

async function uploadVehicleDataUrl(dataUrl: string): Promise<void> {
  const blob = await (await fetch(dataUrl)).blob()
  const file = new File([blob], 'foto-vehiculo.jpg', { type: blob.type || 'image/jpeg' })

  const validation = validateImageFile(file)
  if (!validation.ok) {
    vehicleUploadError.value = true
    vehiclePhotoUrl.value = null
    revokeVehiclePreview()
    submitError.value = validation.message || 'La imagen capturada no es válida.'
    return
  }

  vehicleUploading.value = true
  vehicleUploadError.value = false
  submitError.value = ''

  try {
    vehiclePhotoUrl.value = await uploadImage(file)
    photoRequired.value = false
  } catch (error) {
    console.error('Vehicle photo upload error:', error)
    vehicleUploadError.value = true
    vehiclePhotoUrl.value = null
    submitError.value = 'No fue posible subir la foto del vehículo. Intenta nuevamente.'
  } finally {
    vehicleUploading.value = false
  }
}

async function handleVehiclePhoto(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  const validation = validateImageFile(file)
  if (!validation.ok) {
    vehicleUploadError.value = true
    vehiclePhotoUrl.value = null
    revokeVehiclePreview()
    submitError.value = validation.message || 'La imagen seleccionada no es válida.'
    input.value = ''
    return
  }

  revokeVehiclePreview()
  vehiclePreview.value = URL.createObjectURL(file)
  vehicleUploadError.value = false
  vehicleUploading.value = true
  submitError.value = ''

  try {
    vehiclePhotoUrl.value = await uploadImage(file)
    photoRequired.value = false  // foto registrada → limpiar el error
  } catch (error) {
    console.error('Vehicle photo error:', error)
    vehicleUploadError.value = true
    vehiclePhotoUrl.value = null
    submitError.value = 'No fue posible subir la foto del vehículo. Intenta nuevamente.'
  } finally {
    vehicleUploading.value = false
    input.value = ''
  }
}

async function openCamera(qId: number): Promise<void> {
  try {
    const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera')
    const { Capacitor } = await import('@capacitor/core')

    if (Capacitor.isNativePlatform()) {
      try {
        const status = await Camera.checkPermissions()
        if (status.camera !== 'granted') {
          const req = await Camera.requestPermissions({ permissions: ['camera'] })
          if (req.camera !== 'granted') {
            photoErr[qId] = 'Permiso de cámara denegado. Actívalo en Configuración del dispositivo.'
            return
          }
        }
      } catch {
        photoErr[qId] = 'No se pudo solicitar permiso de cámara.'
        return
      }

      await shootWithCapacitor(qId, Camera, CameraResultType, CameraSource)
      return
    }
  } catch (err: any) {
    // La cámara nativa no está disponible en web.
  }

  fileInputs[qId]?.click()
}

async function shootWithCapacitor(
  qId: number,
  Camera: any,
  CameraResultType: any,
  CameraSource: any,
): Promise<void> {
  uploading.value = qId
  photoErr[qId] = ''

  try {
    const image = await Camera.getPhoto({
      quality: 80,
      allowEditing: false,
      resultType: CameraResultType.DataUrl,
      source: CameraSource.Camera,
    })

    if (!image.dataUrl) return

    await uploadDataUrl(qId, image.dataUrl)
  } catch (error) {
    console.warn('Capacitor camera error:', error)
    photoErr[qId] = 'No fue posible capturar la imagen.'
  } finally {
    uploading.value = null
  }
}

async function onFileSelected(qId: number, event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]

  if (!file) return

  const validation = validateImageFile(file)
  if (!validation.ok) {
    photoErr[qId] = validation.message || 'La imagen seleccionada no es válida.'
    input.value = ''
    return
  }

  uploading.value = qId
  photoErr[qId] = ''

  try {
    photos[qId] = await uploadImage(file)
    answers[qId] = photos[qId]
    qErr[qId] = false
  } catch (error) {
    console.error('Image upload error:', error)
    photoErr[qId] = 'No fue posible subir la evidencia fotográfica.'
  } finally {
    uploading.value = null
    input.value = ''
  }
}

async function uploadDataUrl(qId: number, dataUrl: string): Promise<void> {
  const blob = await (await fetch(dataUrl)).blob()
  const file = new File([blob], `foto-${qId}.jpg`, { type: blob.type || 'image/jpeg' })
  const validation = validateImageFile(file)

  if (!validation.ok) {
    photoErr[qId] = validation.message || 'La imagen capturada no es válida.'
    return
  }

  photos[qId] = await uploadImage(file)
  answers[qId] = photos[qId]
  qErr[qId] = false
  photoErr[qId] = ''
}

async function checkDuplicado(): Promise<void> {
  checkingDuplicado.value = true

  try {
    const result = await checkTodayInspection()
    yaInspecciono.value = result.realizada
    inspeccionHoy.value = result.inspeccion
    enVacaciones.value = result.enVacaciones ?? false
    enAusencia.value = result.enAusencia ?? false
    ausenciaInfo.value = result.ausencia ?? null
  } catch (err: any) {
    yaInspecciono.value = false
    inspeccionHoy.value = null
    enVacaciones.value = false
    enAusencia.value = false
  } finally {
    checkingDuplicado.value = false
  }
}

async function loadForm(): Promise<void> {
  loadingForm.value = true
  loadError.value = ''

  try {
    const forms = await getActiveForms()
    const selectedForm = forms.find((item) => item.activo) || forms[0]

    if (!selectedForm) {
      throw new Error('Sin formularios activos.')
    }

    form.value = {
      ...selectedForm,
      questions: [...selectedForm.questions].sort((a, b) => a.orden - b.orden),
    }
  } catch (err: any) {
    const status = err?.response?.status
    const msg = err?.response?.data?.message || err?.message || String(err)
    if (status === 401) {
      loadError.value = 'Sesión expirada. Cierra sesión y vuelve a entrar.'
    } else if (msg.includes('Sin formularios') || msg.includes('activos')) {
      loadError.value = 'No hay formularios activos. Pide al administrador que ejecute el seed.'
    } else {
      loadError.value = 'Error: ' + msg
    }
    console.error('[loadForm]', err)
  } finally {
    loadingForm.value = false
  }
}

async function submit(): Promise<void> {
  submitError.value = ''

  if (vehicleUploading.value || uploading.value !== null) {
    submitError.value = 'Espera a que termine la carga de imágenes antes de enviar.'
    return
  }

  if (!form.value) {
    submitError.value = 'No hay un formulario disponible para enviar.'
    return
  }

  // Validación de foto — activa el error visible + scroll a la sección
  if (vehicleUploading.value) {
    submitError.value = 'Espera a que termine de subir la foto antes de enviar.'
    return
  }
  if (vehicleUploadError.value || !vehiclePhotoUrl.value) {
    photoRequired.value = true
    submitError.value = 'Debes tomar la foto del vehículo antes de enviar.'
    document.querySelector('.section-title')    // scroll a la sección de foto
      ?.closest('.section')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    return
  }

  if (!validateAll()) {
    // Mensaje específico: foto ok pero preguntas incompletas
    const pending = form.value.questions.filter(q => !isAnswered(q.id))
    submitError.value = pending.length > 0
      ? `Faltan ${pending.length} pregunta${pending.length > 1 ? 's' : ''} por responder.`
      : 'Corrige los errores marcados antes de enviar.'
    setTimeout(() => {
      document
        .querySelector('.q-error, .form-field.invalid')
        ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }, 100)
    return
  }

  submitting.value = true

  try {
    await submitInspection({
      formId: form.value.id,
      placa: getPlaca(),
      ciudad: auth.ciudad || 'No especificada',
      contrato: contrato.value,
      imagenVehiculoUrl: vehiclePhotoUrl.value || undefined,
      answers: form.value.questions.map((question) => {
        const rawValue = answers[question.id]
        const isPhoto = rawValue?.startsWith('http')

        return {
          questionId: question.id,
          valor: !rawValue || isPhoto ? undefined : rawValue,
          observacion: (observaciones[question.id] || '').trim() || undefined,
          imagenUrl: isPhoto ? rawValue : undefined,
        }
      }),
    })

    successDialog.value = true
  } catch (error: any) {
    if (error.response?.status === 409) {
      submitError.value = 'Ya realizaste tu inspección de hoy.'
      await checkDuplicado()
      return
    }

    submitError.value = 'Error al enviar. Intenta de nuevo.'
  } finally {
    submitting.value = false
  }
}

function afterSuccess(): void {
  successDialog.value = false
  void checkDuplicado()
}

onMounted(async () => {
  window.scrollTo(0, 0)
  await checkDuplicado()

  if (!yaInspecciono.value) {
    await loadForm()
  }
})

onBeforeUnmount(() => {
  revokeVehiclePreview()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Barlow:wght@400;500;600;700;800;900&family=Barlow+Condensed:wght@600;700;800;900&display=swap');

/* ── Shell ─────────────────────────────────────── */
.form-shell {
  min-height: 100dvh;
  background: #edf0f5;
  font-family: 'Barlow', sans-serif;
  padding-bottom: 90px;
}

/* ── Topbar ────────────────────────────────────── */
.topbar {
  background: #fff;
  padding: calc(env(safe-area-inset-top) + 10px) 18px 12px;
  display: flex; align-items: center; justify-content: space-between;
  border-bottom: 1px solid #e8ecf2;
  position: sticky; top: 0; z-index: 50;
}
.tb-left { display: flex; align-items: center; gap: 9px; }
.tb-logo { width: 32px; height: 32px; object-fit: contain; border-radius: 6px; }
.tb-brand {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 17px; font-weight: 900; color: #1a2540; letter-spacing: 2px;
}
.tb-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: #1a2540; color: #fff;
  font-size: 13px; font-weight: 700;
  display: flex; align-items: center; justify-content: center;
}

/* ── States ────────────────────────────────────── */
.state-center {
  display: flex; flex-direction: column; align-items: center;
  gap: 14px; padding: 80px 24px; color: #8892a4;
  font-family: 'Barlow Condensed', sans-serif; letter-spacing: 1px;
}
.spinner {
  width: 44px; height: 44px; border-radius: 50%;
  border: 3px solid #dde2ec; border-top-color: #1a2540;
  animation: spin 1s linear infinite;
}
@keyframes spin { to { transform: rotate(360deg) } }
.state-txt { font-size: 12px; letter-spacing: 1.5px; }

.done-screen {
  display: flex; flex-direction: column; align-items: center; gap: 14px; padding: 44px 24px;
}
.done-icon-wrap { animation: popIn .5s ease; }
@keyframes popIn { from{transform:scale(0)} to{transform:scale(1)} }
.done-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(18px, 5vw, 22px); font-weight: 900; color: #1a2540; letter-spacing: 2px; margin: 0;
}
.vac-icon circle { stroke: #f59e0b !important; }
.vac-icon path { stroke: #f59e0b !important; }
.aus-icon circle { stroke: #7c3aed !important; }
.aus-icon path { stroke: #7c3aed !important; }
.vac-title { color: #92400e !important; }
.done-sub { font-size: 14px; color: #8892a4; text-align: center; line-height: 1.6; margin: 0; }
.done-card {
  width: 100%; background: #fff; border-radius: 10px;
  padding: 14px 18px; box-shadow: 0 2px 10px rgba(0,0,0,.06);
}
.dc-row {
  display: flex; justify-content: space-between; padding: 7px 0;
  border-bottom: 1px solid #f1f5f9; font-size: 13px; color: #8892a4;
}
.dc-row:last-child { border: none; }
.dc-row strong { color: #1a2540; font-weight: 700; }
.btn-secondary {
  padding: 13px 32px; border-radius: 6px; background: #1a2540; color: #fff;
  border: none; font-family: 'Barlow Condensed', sans-serif;
  font-size: 14px; font-weight: 800; letter-spacing: 1.5px; cursor: pointer; text-decoration: none;
}
.error-screen { padding: 40px 24px; text-align: center; }
.error-msg { color: #e63d2f; font-size: 14px; margin-bottom: 16px; }

/* ── Content ───────────────────────────────────── */
.content { padding: 0 0 20px; }

/* ── Inspector card ────────────────────────────── */
.inspector-card {
  background: #fff; padding: 18px 18px 16px; border-bottom: 1px solid #e8ecf2;
}
.ic-eyebrow {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px; font-weight: 700; letter-spacing: 1.8px; color: #8892a4; margin: 0 0 4px;
}
.ic-name {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(20px, 5.5vw, 26px); font-weight: 900; color: #1a2540; margin: 0 0 12px; line-height: 1;
}
.ic-details { display: flex; flex-direction: column; gap: 5px; }
.ic-row { display: flex; align-items: center; gap: 7px; font-size: 13px; color: #5a6478; }

/* ── Vehicle card ──────────────────────────────── */
.vehicle-card {
  background: #1a2540; padding: 18px 18px 16px; text-align: center;
}
.vc-eyebrow {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px; font-weight: 700; letter-spacing: 2px;
  color: rgba(255,255,255,.4); margin: 0 0 10px;
}
.vc-plate {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(30px, 9vw, 42px); font-weight: 900; color: #fff;
  letter-spacing: 5px; margin: 0; text-shadow: 0 2px 14px rgba(0,0,0,.3);
}
.vc-type { font-size: 12px; color: rgba(255,255,255,.4); margin: 8px 0 0; letter-spacing: .5px; }

/* ── Vigencia de Documentos ────────────────────── */
.vigencia-section { background: #fff; margin-top: 8px; padding: 16px 18px; }
.vs-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 15px; font-weight: 700; letter-spacing: .5px;
  color: #1a2540; margin: 0 0 14px; display: flex; align-items: center; gap: 8px;
}
.vs-body { display: flex; flex-direction: column; }
.vs-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 0; border-bottom: 1px solid #f1f5f9;
}
.vs-row-last { border-bottom: none; }
.vs-left { flex: 1; }
.vs-label { font-size: 12px; color: #8892a4; margin: 0 0 2px; }
.vs-date {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(16px, 4.5vw, 19px); font-weight: 800; color: #1a2540; margin: 0; letter-spacing: .5px;
}
.vs-badge {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px; font-weight: 700; letter-spacing: 1px;
  padding: 5px 11px; border-radius: 20px;
  display: flex; align-items: center; gap: 5px; flex-shrink: 0;
}
.vs-badge::before {
  content: ''; width: 7px; height: 7px; border-radius: 50%;
  display: inline-block; background: currentColor; opacity: .7;
}
.vs-green  { background: #e8f7ee; color: #1a7a3e; }
.vs-orange { background: #fff3e0; color: #b45309; }
.vs-red    { background: #fdf3f3; color: #c0392b; }
.vs-gray   { background: #f1f5f9; color: #6b7280; }

/* ── Sections ──────────────────────────────────── */
.section { background: #fff; margin-top: 8px; padding: 16px 18px; }
.section-title {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 14px; font-weight: 700; letter-spacing: 1px;
  color: #1a2540; margin: 0 0 16px; display: flex; align-items: center; gap: 7px;
}

/* ── Form fields ───────────────────────────────── */
.form-field { margin-bottom: 20px; }
.field-label {
  font-family: 'Barlow Condensed', sans-serif;
  display: block; font-size: 11px; font-weight: 700;
  letter-spacing: 1.2px; color: #8892a4; margin-bottom: 7px;
}
.field-hint {
  font-family: 'Barlow', sans-serif;
  font-size: 10px; font-weight: 400; letter-spacing: 0; color: #b0bac8;
}
.req { color: #e63d2f; }
.field-box {
  display: flex; align-items: center;
  border: 1.5px solid #dde2ec; border-radius: 6px; background: #f8fafc; overflow: hidden;
}
.field-box input {
  flex: 1; padding: 11px 13px; border: none; outline: none; background: none;
  font-size: 16px; font-family: 'Barlow', sans-serif; color: #1a2540;
}
.field-box input:focus { background: #fff; }
.field-box input::placeholder { color: #b0bac8; }
.form-field.invalid .field-box { border-color: #e63d2f; }
.field-err { font-size: 11px; color: #e63d2f; font-weight: 600; margin: 5px 0 0; }

/* ── CONTRATO — Custom Dropdown ────────────────── */
.cdd-trigger {
  display: flex; align-items: center; justify-content: space-between;
  padding: 13px 15px; background: #f8fafc;
  border: 1.5px solid #dde2ec; border-radius: 8px;
  cursor: pointer; transition: all .15s; user-select: none;
  min-height: 48px;
}
.cdd-trigger:hover { border-color: #b0bac8; background: #fff; }
.cdd-trigger.open  { border-color: #1a2540; background: #fff; border-radius: 8px 8px 0 0; }
.cdd-trigger.selected .cdd-val { color: #1a2540; font-weight: 600; }
.cdd-trigger.invalid { border-color: #e63d2f; }

.cdd-val {
  font-size: 15px; font-family: 'Barlow', sans-serif;
  color: #b0bac8; flex: 1; line-height: 1.3;
}
.cdd-arrow {
  flex-shrink: 0; color: #8892a4;
  transition: transform .2s ease;
}
.cdd-arrow.rotated { transform: rotate(180deg); }

.cdd-list {
  background: #fff;
  border: 1.5px solid #1a2540; border-top: none;
  border-radius: 0 0 10px 10px;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(26,37,64,.12);
  position: relative; z-index: 20;
}
.cdd-option {
  width: 100%; padding: 14px 16px;
  display: flex; align-items: flex-start; gap: 10px;
  background: none; border: none; border-bottom: 1px solid #f1f5f9;
  cursor: pointer; text-align: left;
  font-family: 'Barlow', sans-serif; font-size: 14px; color: #3a4258;
  transition: background .12s;
  line-height: 1.4;
}
.cdd-option:last-child { border-bottom: none; }
.cdd-option:hover { background: #f0f4ff; color: #1a2540; }
.cdd-option.selected { background: #eef2ff; color: #1a2540; font-weight: 700; }
.cdd-option.selected svg { color: #1a2540; flex-shrink: 0; margin-top: 2px; }
.cdd-dot {
  width: 14px; height: 14px; flex-shrink: 0; margin-top: 2px;
  border-radius: 50%; border: 1.5px solid #d0d8e8;
  display: inline-block;
}

/* Backdrop para cerrar el dropdown al tocar fuera */
.cdd-backdrop {
  position: fixed; inset: 0; z-index: 10;
}

/* Animación del dropdown */
.dd-t-enter-active { animation: ddIn .18s ease; }
.dd-t-leave-active { animation: ddIn .12s reverse; }
@keyframes ddIn { from{opacity:0;transform:scaleY(.92)} to{opacity:1;transform:scaleY(1)} }

/* ── Progress ──────────────────────────────────── */
.progress-row {
  padding: 10px 18px; background: #fff;
  border-bottom: 1px solid #e8ecf2; display: flex; align-items: center; gap: 12px;
}
.pr-track { flex: 1; height: 4px; background: #e8ecf2; border-radius: 99px; overflow: hidden; }
.pr-fill  { height: 100%; background: linear-gradient(90deg,#1a2540,#e63d2f); border-radius: 99px; transition: width .5s ease; }
.pr-txt   { font-family: 'Barlow Condensed', sans-serif; font-size: 13px; font-weight: 700; color: #8892a4; white-space: nowrap; }

/* ── Checklist de requisitos ─────────────────────── */
.req-checklist {
  display: flex; flex-wrap: wrap; gap: 8px;
  padding: 10px 18px 0; background: #fff;
}
.req-item {
  display: inline-flex; align-items: center; gap: 5px;
  font-family: 'Barlow Condensed', sans-serif; font-size: 11px; font-weight: 700;
  letter-spacing: .5px; padding: 4px 10px; border-radius: 20px;
  transition: background .2s, color .2s;
}
.req-ok      { background: #e8f7ee; color: #1a7a3e; }
.req-pending { background: #f1f5f9; color: #8892a4; }

/* ── Hint encima del botón ───────────────────────── */
.submit-hint {
  display: flex; align-items: center; gap: 7px;
  font-size: 12px; color: #b45309; font-weight: 600;
  background: #fffbeb; border: 1px solid #fde68a;
  border-radius: 7px; padding: 8px 14px; margin: 0 18px 8px;
}

/* ── Botón bloqueado ─────────────────────────────── */
.btn-submit--blocked {
  background: #8892a4 !important;
  box-shadow: none !important;
  cursor: not-allowed;
}
.btn-submit--blocked:active { transform: none !important; }

/* ── Required badge en título de sección ────────────── */
.required-badge {
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 10px; font-weight: 700; letter-spacing: .8px;
  padding: 3px 9px; border-radius: 20px; margin-left: 8px;
  display: inline-flex; align-items: center;
  vertical-align: middle;
}
.rb-req { background: rgba(230,61,47,.12); color: #e63d2f; }
.rb-ok  { background: rgba(39,174,96,.12); color: #1a7a3e; }

/* ── Error de foto obligatoria ───────────────────────── */
.photo-required-err {
  display: flex; align-items: center; gap: 8px;
  margin-top: 10px;
  background: #fdf3f3; border: 1px solid #fecaca;
  border-radius: 8px; padding: 10px 14px;
  font-size: 13px; color: #e63d2f; font-weight: 600;
  animation: shake .35s ease;
}
@keyframes shake {
  0%,100% { transform: translateX(0); }
  25%      { transform: translateX(-6px); }
  75%      { transform: translateX(6px); }
}

/* ── Question blocks ───────────────────────────── */
.q-block { padding: 18px 0; border-bottom: 1px solid #f1f5f9; }
.q-block:last-child { border-bottom: none; }
.q-block.q-error { background: rgba(230,61,47,.025); border-radius: 6px; padding: 16px 8px; }
:deep(.qi-wrap) {
  width: 46px; height: 46px; background: #dff4f7; border-radius: 10px;
  display: flex; align-items: center; justify-content: center; margin-bottom: 12px;
}
.q-block.answered :deep(.qi-wrap) { background: #e8f7ee; }
.q-block.answered :deep(.qi-wrap) svg path,
.q-block.answered :deep(.qi-wrap) svg circle { stroke: #27ae60; }
.qb-text { font-size: clamp(13px, 3.5vw, 15px); font-weight: 600; color: #1a2540; margin: 0 0 12px; line-height: 1.45; }

/* ── BUENO / MALO ──────────────────────────────── */
.bm-group { display: flex; justify-content: center; gap: 10px; margin-bottom: 4px; }
.bm-btn {
  flex: 1; display: flex; align-items: center; justify-content: center; gap: 8px;
  padding: 12px 10px; border-radius: 10px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(14px, 3.8vw, 16px); font-weight: 700; letter-spacing: 1px;
  cursor: pointer; transition: all .15s; border: 1.5px solid transparent;
}
.bm-bueno { background: #f0f8f4; border-color: #27ae60; color: #27ae60; }
.bm-bueno.active { background: #27ae60; color: #fff; box-shadow: 0 4px 14px rgba(39,174,96,.35); }
.bm-malo  { background: #fdf3f3; border-color: #e63d2f; color: #e63d2f; }
.bm-malo.active  { background: #e63d2f; color: #fff; box-shadow: 0 4px 14px rgba(230,61,47,.35); }
.bm-btn:active:not(.active) { transform: scale(.97); }

/* ── Observations ──────────────────────────────── */
.obs-block       { margin-top: 10px; }
.obs-block--always { margin-top: 14px; }
.obs-label {
  font-family: 'Barlow Condensed', sans-serif;
  display: flex; align-items: center; gap: 5px;
  font-size: 11px; font-weight: 700; letter-spacing: 1.2px;
  color: #8892a4; margin-bottom: 7px;
}
.obs-opt { font-weight: 400; letter-spacing: 0; font-family: 'Barlow', sans-serif; font-size: 10px; }
.obs-textarea {
  width: 100%; padding: 12px 14px;
  border: 1.5px solid #dde2ec; border-radius: 8px;
  background: #f8fafc; font-size: 16px; font-family: 'Barlow', sans-serif; color: #1a2540;
  outline: none; resize: none; min-height: 80px; line-height: 1.5;
  transition: border-color .2s, background .2s; box-sizing: border-box;
}
.obs-textarea:focus { border-color: #1a2540; background: #fff; }
.obs-textarea::placeholder { color: #b0bac8; }
.obs-textarea:disabled { opacity: .45; cursor: not-allowed; background: #f4f5f8; }
.obs-required { border-color: #e63d2f !important; }
.obs-err-highlight { border-color: #e63d2f; background: #fff9f9; }

/* ── BOTÓN CÁMARA — diseño profesional ─────────── */
.photo-btn {
  width: 100%;
  padding: 0;
  border: none;
  border-radius: 12px;
  background: #1a2540;
  display: flex; flex-direction: row; align-items: center; gap: 0;
  cursor: pointer;
  overflow: hidden;
  box-shadow: 0 4px 18px rgba(26,37,64,.30);
  transition: background .15s, transform .12s, box-shadow .15s;
  position: relative;
}
.photo-btn:active  { transform: scale(.985); box-shadow: 0 2px 10px rgba(26,37,64,.2); }
.photo-btn:disabled { opacity: .55; cursor: not-allowed; transform: none; }

/* Franja izquierda con ícono */
.photo-btn-icon {
  flex-shrink: 0;
  width: 52px; height: 52px;
  background: rgba(255,255,255,.08);
  border-right: 1px solid rgba(255,255,255,.10);
  display: flex; align-items: center; justify-content: center;
  color: #fff;
  transition: background .15s;
}
.photo-btn:not(:disabled):active .photo-btn-icon { background: rgba(255,255,255,.14); }

/* Área de texto */
.photo-btn-text {
  flex: 1;
  padding: 0 14px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(13px, 3.5vw, 15px); font-weight: 800; letter-spacing: 1.5px;
  color: #fff;
  text-align: left;
}
.photo-btn-sub {
  display: block;
  font-family: 'Barlow', sans-serif;
  font-size: 11px; font-weight: 400; letter-spacing: .2px;
  color: rgba(255,255,255,.45);
  margin-top: 2px; letter-spacing: 0;
}

/* Flecha derecha */
.photo-btn::after {
  content: '';
  flex-shrink: 0;
  width: 32px; height: 52px;
  background: url("data:image/svg+xml,%3Csvg width='10' height='16' viewBox='0 0 10 16' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1l8 7-8 7' stroke='rgba(255,255,255,.3)' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E") center/10px no-repeat;
}

/* Preview de foto ya tomada */
.photo-preview {
  border-radius: 10px; overflow: hidden;
  box-shadow: 0 4px 16px rgba(0,0,0,.12);
}
.photo-img { width: 100%; height: 200px; object-fit: cover; display: block; }
.photo-actions {
  padding: 10px; background: #1a2540;
  display: flex; justify-content: flex-end;
}
.photo-change {
  padding: 7px 14px; border-radius: 5px; border: none;
  background: rgba(255,255,255,.15); color: #fff;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px; font-weight: 700; letter-spacing: .8px;
  cursor: pointer; display: flex; align-items: center; gap: 6px;
  transition: background .15s;
}
.photo-change:hover { background: rgba(255,255,255,.25); }

/* Input file oculto — no visible, disparado programáticamente */
.file-input-hidden {
  position: absolute; opacity: 0; pointer-events: none;
  width: 1px; height: 1px; overflow: hidden;
}

/* Indicador de carga de imagen */
.upload-progress {
  display: flex; align-items: center; gap: 8px;
  font-size: 12px; color: #5a6478; margin-top: 8px;
}
.spin-icon { animation: spin 1s linear infinite; }

/* ── Submit ────────────────────────────────────── */
.submit-err {
  margin: 0 18px 12px; background: #fdf3f3;
  border: 1px solid #fecaca; border-radius: 6px;
  padding: 11px 14px; display: flex; align-items: center; gap: 8px;
  font-size: 13px; color: #e63d2f; font-weight: 600;
}
.submit-bar {
  position: sticky; bottom: 0; z-index: 40;
  padding: 12px 18px calc(12px + env(safe-area-inset-bottom));
  background: #fff; border-top: 1px solid #e8ecf2;
}
.btn-submit {
  width: 100%; padding: 12px 20px; background: #1a2540; color: #fff;
  border: none; border-radius: 8px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(13px, 3.5vw, 15px); font-weight: 900; letter-spacing: 1.5px;
  cursor: pointer; transition: background .15s, transform .1s;
  box-shadow: 0 4px 18px rgba(26,37,64,.28);
  display: flex; align-items: center; justify-content: center; gap: 10px;
}
.btn-submit:hover:not(:disabled) { background: #0d1422; transform: translateY(-1px); }
.btn-submit:active:not(:disabled) { transform: translateY(0); }
.btn-submit:disabled { opacity: .65; cursor: not-allowed; }
.btn-dots { display: flex; gap: 5px; height: 20px; align-items: center; justify-content: center; }
.btn-dots span {
  width: 7px; height: 7px; border-radius: 50%;
  background: rgba(255,255,255,.8); animation: bounce .8s infinite;
}
.btn-dots span:nth-child(2){animation-delay:.13s}.btn-dots span:nth-child(3){animation-delay:.26s}
@keyframes bounce{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-7px)}}

/* ── Success overlay ───────────────────────────── */
.success-overlay {
  position: fixed; inset: 0; background: rgba(0,0,0,.6);
  z-index: 300; display: flex; align-items: center; justify-content: center; padding: 24px;
}
.success-card {
  background: #fff; border-radius: 14px; padding: 28px 24px;
  text-align: center; max-width: 300px; width: 100%;
}
.success-card h3 {
  font-family: 'Barlow Condensed', sans-serif; font-size: clamp(20px, 5vw, 24px);
  font-weight: 900; color: #1a2540; margin: 16px 0 8px; letter-spacing: 1.5px;
}
.success-card p { font-size: 14px; color: #8892a4; margin: 0 0 24px; line-height: 1.6; }
.success-card button {
  width: 100%; padding: 12px; background: #1a2540; color: #fff;
  border: none; border-radius: 8px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: clamp(13px, 3.5vw, 15px); font-weight: 800; letter-spacing: 1.5px; cursor: pointer;
}
.success-t-enter-active { animation: fadeIn .3s ease; }
.success-t-leave-active { animation: fadeIn .2s reverse; }
@keyframes fadeIn { from{opacity:0} to{opacity:1} }

/* ── Estado de upload de foto del vehículo ── */
.vp-status {
  display: flex; align-items: center; gap: 7px;
  padding: 7px 12px;
  font-family: 'Barlow Condensed', sans-serif;
  font-size: 12px; font-weight: 700; letter-spacing: .8px;
}
.vp-uploading { background: rgba(26,37,64,.82); color: rgba(255,255,255,.8); }
.vp-error     { background: rgba(200,40,30,.88); color: #fff; }
.vp-ok        { background: rgba(39,174,96,.85); color: #fff; }
.vp-spin      { animation: spin 1s linear infinite; flex-shrink: 0; }

</style>