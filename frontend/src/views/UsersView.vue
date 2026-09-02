<template>
  <div class="page">

    <!-- ── Encabezado ────────────────────────────── -->
    <div class="page-head">
      <div>
        <h1 class="page-title">USUARIOS</h1>
        <p class="page-sub">Gestiona conductores y administradores del sistema</p>
      </div>
      <button class="btn-primary" @click="openCreate">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M7 1v12M1 7h12" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>
        </svg>
        NUEVO USUARIO
      </button>
    </div>

    <!-- ── Filtros ────────────────────────────────── -->
    <div class="filter-bar">
      <div class="search-box" :class="{'sfocus': sfocus}">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.3"/>
          <path d="M9.5 9.5L13 13" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
        </svg>
        <input
          v-model="search"
          placeholder="Buscar por nombre, cédula o correo…"
          @focus="sfocus=true" @blur="sfocus=false"
          aria-label="Buscar usuarios"
        />
      </div>
      <div class="chips">
        <button
          v-for="r in ROLES" :key="r.val"
          class="chip" :class="{'chip--on': roleF===r.val}"
          @click="roleF=r.val"
        >{{ r.lbl }}</button>
        <button
          class="chip" :class="{'chip--on chip--inactivos': roleF==='INACTIVOS'}"
          @click="roleF = roleF==='INACTIVOS' ? 'CONDUCTOR' : 'INACTIVOS'"
        >Inactivos</button>
      </div>
    </div>

    <!-- ── Tabla ──────────────────────────────────── -->
    <div class="tcard">
      <div v-if="loading" class="skel-wrap">
        <div v-for="n in 5" :key="n" class="skel-r"></div>
      </div>

      <div v-else-if="!filtered.length" class="empty-state">
        <svg width="52" height="52" viewBox="0 0 52 52" fill="none">
          <circle cx="26" cy="26" r="24" stroke="#d4d9e3" stroke-width="2"/>
          <circle cx="26" cy="19" r="7.5" stroke="#d4d9e3" stroke-width="2"/>
          <path d="M9 46c0-9.4 7.6-17 17-17s17 7.6 17 17" stroke="#d4d9e3" stroke-width="2" stroke-linecap="round"/>
        </svg>
        <p class="empty-t">Sin usuarios registrados</p>
        <p class="empty-s">Crea el primer usuario para comenzar</p>
      </div>

      <table v-else class="tbl">
        <thead>
          <tr>
            <th>USUARIO</th>
            <th>CÉDULA</th>
            <th>CIUDAD</th>
            <th>TELÉFONO</th>
            <th v-if="roleF !== 'ADMIN'">PLACA</th>
            <th>ROL</th>
            <th v-if="roleF !== 'ADMIN'">SOAT</th>
            <th v-if="roleF !== 'ADMIN'">TECNOMECÁNICA</th>
            <th>ESTADO</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(u, i) in pageItems" :key="u.id" :style="{'--ri': i}">
            <td>
              <div class="u-cell">
                <div class="u-av" :style="{background: avBg(u.nombre)}">
                  {{ u.nombre?.charAt(0)?.toUpperCase() }}
                </div>
                <div>
                  <div class="u-name">{{ u.nombre }}</div>
                  <div class="u-email">{{ u.email }}</div>
                </div>
              </div>
            </td>
            <td class="td-mono">{{ u.cedula }}</td>
            <td class="td-mono">{{ u.ciudad || '—' }}</td>
            <td class="td-mono">{{ u.telefono || '—' }}</td>
            <td v-if="roleF !== 'ADMIN'">
              <span v-if="u.placa" class="placa-badge">{{ u.placa }}</span>
              <span v-else class="td-empty">—</span>
            </td>
            <td>
              <span class="rbadge" :class="u.rol==='ADMIN' ? 'rb-admin' : 'rb-driver'">
                {{ u.rol==='ADMIN' ? 'ADMIN' : 'CONDUCTOR' }}
              </span>
            </td>
            <td v-if="roleF !== 'ADMIN'">
              <span v-if="soatStatus(u.soatVigencia)" class="doc-badge" :class="soatStatus(u.soatVigencia)?.cls">
                {{ soatStatus(u.soatVigencia)?.lbl }}
              </span>
              <span v-else class="td-empty">—</span>
            </td>
            <td v-if="roleF !== 'ADMIN'">
              <span v-if="soatStatus(u.tecniVigencia)" class="doc-badge" :class="soatStatus(u.tecniVigencia)?.cls">
                {{ soatStatus(u.tecniVigencia)?.lbl }}
              </span>
              <span v-else class="td-empty">—</span>
            </td>
            <td>
              <span class="sbadge" :class="u.enVacaciones ? 'sb-vac' : (u.activo ? 'sb-on' : 'sb-off')">
                {{ u.enVacaciones ? 'EN VACACIONES' : (u.activo ? 'ACTIVO' : 'INACTIVO') }}
              </span>
            </td>
            <td>
              <div class="row-btns">
                <button v-if="u.activo === false" class="rb-act" @click="reactivate(u)" title="Reactivar usuario">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M6.5 1.5v10M1.5 6.5h10" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
                  </svg>
                </button>
                <button class="rb-key" @click="askReset(u)" title="Restablecer contraseña (token de un solo uso)">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <circle cx="4.5" cy="8.5" r="2.8" stroke="currentColor" stroke-width="1.3"/>
                    <path d="M6.5 6.5L11 2M9 4l1.8 1.8M10.5 2.5l1.3 1.3" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button class="rb-edit" @click="openEdit(u)" title="Editar usuario">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M8.5 2L11 4.5L4 11.5H1.5v-2.5L8.5 2Z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/>
                  </svg>
                </button>
                <button class="rb-del" @click="askDelete(u)" title="Eliminar usuario">
                  <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                    <path d="M2 3.5h9M4.5 3.5V2.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 .5.5v1M10 3.5l-.7 7a.9.9 0 0 1-.9.8H4.6a.9.9 0 0 1-.9-.8L3 3.5" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        </tbody>
      </table>

      <!-- Paginación -->
      <div v-if="!loading && filtered.length" class="pg-foot">
        <span class="pg-info">
          Mostrando {{ pageItems.length }} de {{ filtered.length }} usuario{{ filtered.length !== 1 ? 's' : '' }}
          <template v-if="search.trim()"> (filtrando)</template>
        </span>
        <div class="pg-nav">
          <button class="pg-btn" :disabled="page === 0" @click="page--" aria-label="Página anterior">‹</button>
          <span class="pg-pg">{{ page + 1 }} / {{ totalPages }}</span>
          <button class="pg-btn" :disabled="page >= totalPages - 1" @click="page++" aria-label="Página siguiente">›</button>
        </div>
      </div>
    </div>

    <!-- ════════════════════════════════════════════
         MODAL: CREAR / EDITAR
    ════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="modal-t">
        <div v-if="modalOpen" class="modal-overlay" @click.self="closeModal"
          role="dialog" :aria-modal="true" :aria-label="editing ? 'Editar usuario' : 'Crear usuario'">
          <div class="modal-box">

            <!-- Header del modal -->
            <div class="modal-head">
              <div class="modal-icon" :class="editing ? 'mi-edit' : 'mi-new'">
                <svg v-if="!editing" width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <circle cx="9" cy="6.5" r="3" stroke="currentColor" stroke-width="1.5"/>
                  <path d="M3 16c0-3.3 2.7-6 6-6s6 2.7 6 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                  <path d="M13.5 7.5v3M12 9h3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
                <svg v-else width="18" height="18" viewBox="0 0 18 18" fill="none">
                  <path d="M12.5 2.5l3 3L6 15H3v-3L12.5 2.5Z" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </div>
              <div>
                <h3 class="modal-title">{{ editing ? 'Editar usuario' : 'Nuevo usuario' }}</h3>
                <p class="modal-sub">{{ editing ? 'Modifica los datos del usuario' : 'Completa los campos para crear el usuario' }}</p>
              </div>
              <button class="modal-close" @click="closeModal" aria-label="Cerrar">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 2.5l9 9M11.5 2.5l-9 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                </svg>
              </button>
            </div>

            <!-- Cuerpo del formulario -->
            <div class="modal-body">
              <div class="form-grid">

                <!-- NOMBRE COMPLETO -->
                <div class="ff ff--full">
                  <label class="ff-label">Nombre completo <span class="req">*</span></label>
                  <input
                    v-model="mf.nombre"
                    type="text"
                    class="ff-input"
                    :class="{'ff-input--err': ferr.nombre}"
                    placeholder="Ej: Juan Carlos Pérez"
                    autocomplete="off"
                    @input="mf.nombre = mf.nombre.replace(/[^a-zA-ZáéíóúÁÉÍÓÚüÜñÑ\s]/g,''); ferr.nombre=false"
                    @blur="ferr.nombre = !mf.nombre.trim()"
                  />
                  <p v-if="ferr.nombre" class="ff-err">El nombre es obligatorio</p>
                </div>

                <!-- CÉDULA -->
                <div class="ff">
                  <label class="ff-label">Cédula <span class="req">*</span></label>
                  <input
                    v-model="mf.cedula"
                    type="text"
                    inputmode="numeric"
                    class="ff-input"
                    :class="{'ff-input--err': ferr.cedula}"
                    placeholder="Ej: 1234567890"
                    maxlength="12"
                    @input="mf.cedula = mf.cedula.replace(/\D/g,''); ferr.cedula=false"
                    @blur="ferr.cedula = !/^\d{6,12}$/.test(mf.cedula)"
                  />
                  <p v-if="ferr.cedula" class="ff-err">Ingresa entre 6 y 12 dígitos</p>
                </div>

                <!-- EMAIL -->
                <div class="ff">
                  <label class="ff-label">Correo electrónico <span class="req">*</span></label>
                  <div class="ff-ico-wrap">
                    <svg class="ff-ico" width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <rect x="1" y="3" width="13" height="9" rx="1.5" stroke="currentColor" stroke-width="1.2"/>
                      <path d="M1 5.5L7.5 9L14 5.5" stroke="currentColor" stroke-width="1.2"/>
                    </svg>
                    <input
                      v-model.trim="mf.email"
                      type="email"
                      inputmode="email"
                      class="ff-input ff-input--ico"
                      :class="{'ff-input--err': ferr.email}"
                      placeholder="correo@empresa.com"
                      autocomplete="off"
                      @blur="ferr.email = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mf.email)"
                      @input="ferr.email=false"
                    />
                  </div>
                  <p v-if="ferr.email" class="ff-err">Correo electrónico inválido</p>
                </div>

                <!-- CONTRASEÑA (solo crear, o siempre para SUPER_ROOT) -->
                <div class="ff" v-if="!editing || auth.isSuperRoot">
                  <label class="ff-label">Contraseña <span class="req">*</span></label>
                  <div class="pwd-field">
                    <input
                      v-model="mf.password"
                      :type="showPwd ? 'text' : 'password'"
                      class="ff-input"
                      :class="{'ff-input--err': ferr.password}"
                      :placeholder="editing ? 'Dejar vacío para no cambiarla (mín. 8 si se edita)' : 'Mínimo 8 caracteres'"
                      autocomplete="new-password"
                      @blur="ferr.password = mf.password.length > 0 && mf.password.length < 8"
                      @input="ferr.password=false"
                    />
                    <button type="button" class="pwd-eye" @click="showPwd=!showPwd" tabindex="-1" :aria-label="showPwd?'Ocultar':'Mostrar'">
                      <svg v-if="!showPwd" width="15" height="15" viewBox="0 0 15 15" fill="none"><ellipse cx="7.5" cy="7.5" rx="6" ry="4" stroke="currentColor" stroke-width="1.2"/><circle cx="7.5" cy="7.5" r="2" stroke="currentColor" stroke-width="1.2"/></svg>
                      <svg v-else width="15" height="15" viewBox="0 0 15 15" fill="none"><path d="M1 1l13 13M5.5 5.6A2.2 2.2 0 0 0 9.4 9.5M3 3.5C1.8 4.7 1.1 6.1 1 7.5c.9 3 3.6 5 6.5 5 1.1 0 2.2-.3 3.1-.9M5.3 2.8C6 2.6 6.7 2.5 7.5 2.5c2.9 0 5.6 2 6.5 5" stroke="currentColor" stroke-width="1.2" stroke-linecap="round"/></svg>
                    </button>
                  </div>
                  <p v-if="ferr.password" class="ff-err">Mínimo 8 caracteres</p>
                </div>

                <!-- TELÉFONO -->
                <div class="ff">
                  <label class="ff-label">Teléfono <span class="req">*</span></label>
                  <div class="ff-ico-wrap">
                    <svg class="ff-ico" width="15" height="15" viewBox="0 0 15 15" fill="none">
                      <path d="M3.5 1.5h2.7l1 3-1.7 1a8.5 8.5 0 0 0 4 4l1-1.7 3 1V11a1 1 0 0 1-1 1A10.5 10.5 0 0 1 2.5 2.5a1 1 0 0 1 1-1Z" stroke="currentColor" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                    <input
                      v-model="mf.telefono"
                      type="tel"
                      inputmode="tel"
                      class="ff-input ff-input--ico"
                      placeholder="+57 300 000 0000"
                      @input="mf.telefono = mf.telefono.replace(/[^\d+\s\-()]/g,'')"
                    />
                  </div>
                </div>

                <!-- CIUDAD — Selector con búsqueda de ciudades de Colombia -->
                <div class="ff">
                  <label class="ff-label">Ciudad <span class="req">*</span></label>
                  <div class="city-field" ref="cityRef">
                    <div class="ff-ico-wrap">
                      <svg class="ff-ico" width="15" height="15" viewBox="0 0 15 15" fill="none">
                        <circle cx="7.5" cy="6" r="2.8" stroke="currentColor" stroke-width="1.2"/>
                        <path d="M7.5 14C7.5 14 2 10.5 2 6a5.5 5.5 0 0 1 11 0c0 4.5-5.5 8-5.5 8Z" stroke="currentColor" stroke-width="1.2"/>
                      </svg>
                      <input
                        v-model="cityQ"
                        type="text"
                        class="ff-input ff-input--ico"
                        placeholder="Escribe o selecciona una ciudad"
                        autocomplete="off"
                        @focus="cityOpen=true"
                        @input="cityOpen=true; mf.ciudad=''"
                        @blur="onCityBlur"
                        aria-haspopup="listbox"
                        :aria-expanded="cityOpen"
                      />
                    </div>
                    <!-- Ciudad seleccionada badge -->
                    <div v-if="mf.ciudad" class="city-badge">
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 9.5C5 9.5 1 7 1 4a4 4 0 0 1 8 0c0 3-4 5.5-4 5.5Z" stroke="#1a2540" stroke-width="1.1"/><circle cx="5" cy="4" r="1.5" stroke="#1a2540" stroke-width="1.1"/></svg>
                      {{ mf.ciudad }}
                      <button type="button" @click.stop="clearCity" aria-label="Limpiar ciudad">×</button>
                    </div>
                    <!-- Dropdown de ciudades -->
                    <Transition name="city-drop">
                      <ul v-if="cityOpen && cityList.length" class="city-list" role="listbox">
                        <li
                          v-for="c in cityList" :key="c"
                          class="city-opt"
                          role="option"
                          @mousedown.prevent="pickCity(c)"
                        >
                          <svg width="11" height="11" viewBox="0 0 11 11" fill="none"><path d="M5.5 10C5.5 10 1.5 7 1.5 4a4 4 0 0 1 8 0C9.5 7 5.5 10 5.5 10Z" stroke="#8895a7" stroke-width="1.1"/></svg>
                          {{ c }}
                        </li>
                      </ul>
                      <div v-else-if="cityOpen && cityQ.length >= 2" class="city-empty">
                        Sin ciudades para "{{ cityQ }}"
                      </div>
                    </Transition>
                  </div>
                </div>

                <!-- DÍAS LABORALES (solo conductores) -->
                <div v-if="mf.rol === 'CONDUCTOR'" class="ff ff--full">
                  <label class="ff-label">DÍAS LABORALES <span class="req">*</span></label>
                  <div class="dias-laborales-grid">
                    <label v-for="d in DIAS_SEMANA" :key="d.val" class="dl-chip" :class="{ 'dl-chip--on': mf.diasLaborales.split(',').includes(d.val) }">
                      <input type="checkbox" :value="d.val" :checked="mf.diasLaborales.split(',').includes(d.val)" @change="toggleDiaLaboral(d.val)" class="dl-check" />
                      <span>{{ d.lbl }}</span>
                    </label>
                  </div>
                </div>

                <!-- PLACA (solo conductores) -->
                <div v-if="mf.rol === 'CONDUCTOR'" class="ff">
                  <label class="ff-label">Placa asignada <span class="req">*</span></label>
                  <div class="ff-input-row">
                    <input
                      v-model="mf.placa"
                      type="text"
                      class="ff-input"
                      :class="{'ff-input--err': ferr.placa}"
                      placeholder="Ej: ABC123"
                      maxlength="8"
                      style="text-transform:uppercase;letter-spacing:1px;flex:1"
                      @input="mf.placa = mf.placa.toUpperCase().replace(/[^A-Z0-9\-]/g,''); ferr.placa=false"
                      @blur="ferr.placa = mf.placa.length > 0 && !/^[A-Z]{3}[\d]{3,4}$|^[A-Z]{3}-[\d]{3}$|^[A-Z0-9]{4,8}$/.test(mf.placa)"
                    />
                    <button type="button" class="btn-read-plate" @click="openPlateReader" title="Leer placa con cámara">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                        <circle cx="12" cy="13" r="4"/>
                      </svg>
                    </button>
                  </div>
                  <p v-if="ferr.placa" class="ff-err">Formato inválido (ej: ABC123)</p>
                </div>

                <!-- Modal lector de placas -->
                <Teleport to="body">
                  <Transition name="modal">
                    <div v-if="plateReaderOpen" class="modal-overlay" @click.self="closePlateReader">
                      <div class="modal-box" style="max-width:500px">
                        <div class="modal-head">
                          <h3>Leer placa</h3>
                          <button class="modal-close" @click="closePlateReader">&times;</button>
                        </div>
                        <div class="modal-body" style="text-align:center">
                          <div v-if="plateReading" class="plate-spinner">
                            <div class="spinner"></div>
                            <p>Procesando imagen...</p>
                          </div>
                          <div v-else-if="plateResult" class="plate-result">
                            <div class="plate-badge-result">{{ plateResult.placa }}</div>
                            <p v-if="plateResult.tipo" class="plate-tipo">{{ plateResult.tipo }}</p>
                            <p class="plate-conf">Confianza: {{ (plateResult.confianza * 100).toFixed(1) }}%</p>
                            <div class="plate-actions">
                              <button class="btn-primary" @click="acceptPlate">Usar esta placa</button>
                              <button class="btn-cancel" @click="retakePlate">Tomar otra foto</button>
                            </div>
                          </div>
                          <div v-else>
                            <video ref="videoRef" autoplay playsinline class="plate-video"></video>
                            <div class="plate-actions" style="margin-top:12px">
                              <button class="btn-primary" @click="capturePhoto">Capturar foto</button>
                              <button class="btn-cancel" @click="closePlateReader">Cancelar</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </Transition>
                </Teleport>

                <!-- ROL -->
                <div class="ff">
                  <label class="ff-label">Rol en el sistema <span class="req">*</span></label>
                  <div class="sel-wrap">
                    <select v-model="mf.rol" class="ff-input">
                      <option value="CONDUCTOR">Conductor</option>
                      <option value="ADMIN">Administrador</option>
                    </select>
                    <svg class="sel-arr" width="12" height="12" viewBox="0 0 12 12" fill="none">
                      <path d="M3 4.5l3 3 3-3" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                </div>

                <!-- SOAT VIGENCIA (solo conductores) -->
                <div v-if="mf.rol === 'CONDUCTOR'" class="ff">
                  <label class="ff-label">
                    Vencimiento SOAT <span class="req">*</span>
                    <span v-if="soatStatus(mf.soatVigencia)" class="vig-status" :class="soatStatus(mf.soatVigencia)?.cls">
                      {{ soatStatus(mf.soatVigencia)?.lbl }}
                    </span>
                  </label>
                  <input
                    v-model="mf.soatVigencia"
                    type="date"
                    class="ff-input"
                    :class="{'ff-input--warn': soatStatus(mf.soatVigencia)?.cls === 'warn', 'ff-input--danger': soatStatus(mf.soatVigencia)?.cls === 'danger'}"
                    title="Fecha de vencimiento del SOAT"
                  />
                </div>

                <!-- TECNOMECÁNICA VIGENCIA (solo conductores) -->
                <div v-if="mf.rol === 'CONDUCTOR'" class="ff">
                  <label class="ff-label">
                    Vencimiento Tecnomecánica <span class="req">*</span>
                    <span v-if="soatStatus(mf.tecniVigencia)" class="vig-status" :class="soatStatus(mf.tecniVigencia)?.cls">
                      {{ soatStatus(mf.tecniVigencia)?.lbl }}
                    </span>
                  </label>
                  <input
                    v-model="mf.tecniVigencia"
                    type="date"
                    class="ff-input"
                    :class="{'ff-input--warn': soatStatus(mf.tecniVigencia)?.cls === 'warn', 'ff-input--danger': soatStatus(mf.tecniVigencia)?.cls === 'danger'}"
                    title="Fecha de vencimiento de la Tecnomecánica"
                  />
                </div>

              </div><!-- /form-grid -->

              <!-- Error global del modal -->
              <div v-if="mError" class="modal-err" role="alert">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="#dc2626" stroke-width="1.2"/>
                  <path d="M7 4v3.5M7 9.5v.5" stroke="#dc2626" stroke-width="1.2" stroke-linecap="round"/>
                </svg>
                {{ mError }}
              </div>
            </div>

            <!-- Footer del modal -->
            <div class="modal-foot">
              <button class="btn-cancel" @click="closeModal">Cancelar</button>
              <button class="btn-save" :disabled="mSaving" @click="saveUser">
                <span v-if="!mSaving">{{ editing ? 'Guardar cambios' : 'Crear usuario' }}</span>
                <span v-else class="btn-dots"><span></span><span></span><span></span></span>
              </button>
            </div>

          </div><!-- /modal-box -->
        </div>
      </Transition>
    </Teleport>

    <!-- ════════════════════════════════════════════
         MODAL: CONFIRMAR ELIMINACIÓN
    ════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="modal-t">
        <div v-if="delModal" class="modal-overlay" @click.self="delModal=false">
          <div class="modal-box modal-sm">
            <div class="del-icon">🗑️</div>
            <h3 class="del-title">¿Eliminar usuario?</h3>
            <p class="del-body">
              Estás a punto de eliminar a <strong>{{ toDelete?.nombre }}</strong>.<br/>
              Esta acción no se puede deshacer.
            </p>
            <div class="del-actions">
              <button class="btn-cancel" @click="delModal=false">Cancelar</button>
              <button class="btn-danger" :disabled="deleting" @click="doDelete">Sí, eliminar</button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <!-- ════════════════════════════════════════════
         MODAL: RESET DE CONTRASEÑA (TOKEN)
    ════════════════════════════════════════════ -->
    <Teleport to="body">
      <Transition name="modal-t">
        <div v-if="resetModal" class="modal-overlay" @click.self="closeReset">
          <div class="modal-box modal-sm">
            <template v-if="!resetToken">
              <div class="del-icon">🔑</div>
              <h3 class="del-title">Restablecer contraseña</h3>
              <p class="del-body">
                Se generará un <strong>token de un solo uso</strong> para
                <strong>{{ resetTarget?.nombre }}</strong>. El usuario deberá ingresarlo
                en la pantalla "Restablecer contraseña" para crear una nueva.<br/>
                Válido por <strong>30 minutos</strong>.
              </p>
              <p v-if="resetError" class="modal-err">{{ resetError }}</p>
              <div class="del-actions">
                <button class="btn-cancel" @click="closeReset">Cancelar</button>
                <button class="btn-save" :disabled="resetLoading" @click="generateReset">
                  {{ resetLoading ? 'Generando…' : 'Generar token' }}
                </button>
              </div>
            </template>
            <template v-else>
              <div class="del-icon">✅</div>
              <h3 class="del-title">Token generado</h3>
              <p class="del-body">
                Entrega este token a <strong>{{ resetTarget?.nombre }}</strong>.
                <strong>Se mostrará solo esta vez</strong> y expira a las
                <strong>{{ resetExpires }}</strong>.
              </p>
              <div class="rt-token" @click="copyResetToken" title="Clic para copiar">{{ resetToken }}</div>
              <p v-if="resetCopied" class="rt-copied">Copiado al portapapeles</p>
              <p v-if="resetError" class="modal-err">{{ resetError }}</p>
              <div class="del-actions">
                <button class="btn-save" @click="copyResetToken">Copiar</button>
                <button class="btn-cancel" @click="closeReset">Cerrar</button>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>

  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, onBeforeUnmount, watch } from 'vue'
import api from '../api'
import { useAuthStore } from '../stores/auth'
const auth = useAuthStore()

/* ── Tipos ──────────────────────────────────────────── */
interface User {
  id:             number
  cedula:         string
  nombre:         string
  email:          string
  telefono:      string
  placa:         string
  ciudad:        string
  soatVigencia:  string
  tecniVigencia: string
  rol:            string
  activo:         boolean
  enVacaciones?:  boolean
}

/* ── Ciudades de Colombia ────────────────────────────
   Lista completa cubriendo todos los departamentos,
   ordenada alfabéticamente para búsqueda eficiente.
─────────────────────────────────────────────────── */
const CITIES: readonly string[] = Object.freeze([
  'Acacías','Aguachica','Aguazul','Apartadó','Arauca','Armenia',
  'Baranoa','Barranquilla','Barrancabermeja','Bello','Bogotá D.C.','Bucaramanga','Buenaventura','Buga',
  'Calarcá','Cali','Caloto','Campoalegre','Cartago','Caucasia','Cereté','Chaparral','Chía',
  'Chiquinquirá','Chinchiná','Circasia','Codazzi','Corozal','Cúcuta',
  'Duitama','Dosquebradas',
  'El Banco','El Carmen de Bolívar','Envigado','Espinal',
  'Facatativá','Florencia','Floridablanca','Florida','Fundación','Fusagasugá',
  'Garzón','Galapa','Girardot','Girón','Granada',
  'Honda','Huila',
  'Ibagué','Ipiales','Istmina','Itagüí',
  'Jamundí',
  'La Dorada','La Hormiga','La Jagua de Ibirico','La Plata','La Primavera',
  'La Unión','La Virginia','Leticia','Líbano','Lorica','Los Patios',
  'Madrid','Magangué','Maicao','Malambo','Manizales','Medellín','Melgar','Mitú',
  'Mocoa','Mompós','Montenegro','Montería','Morroa','Mosquera',
  'Neiva',
  'Ocaña',
  'Paipa','Palmira','Pamplona','Pasto','Pereira','Piedecuesta','Pitalito',
  'Planeta Rica','Plato','Popayán','Puerto Asís','Puerto Boyacá','Puerto Carreño',
  'Puerto Nariño','Puerto Tejada',
  'Quibdó','Quimbaya',
  'Riohacha','Rionegro','Riosucio',
  'Sabanalarga','Sahagún','San Gil','San José del Guaviare','San Juan del Cesar',
  'San Marcos','San Martín','San Vicente del Caguán','Santa Marta','Santa Rosa de Cabal',
  'Santander de Quilichao','Saravena','Sincelejo','Soacha','Soledad','Sogamoso','Socorro',
  'Tame','Tuluá','Tumaco','Tunja','Túquerres','Turbaco','Turbo',
  'Valledupar','Villa del Rosario','Villamaría','Villanueva','Villavicencio',
  'Yopal','Yumbo',
  'Zipaquirá',
].sort((a, b) => a.localeCompare(b, 'es')))

/* ── Constantes ─────────────────────────────────────── */
const ROLES = [
  { val: 'CONDUCTOR', lbl: 'Conductores'     },
  { val: 'ADMIN',     lbl: 'Administradores' },
  { val: 'ALL',       lbl: 'Todos'           },
]
const AV_BG = ['#1a2540','#2d4a7a','#3a6b8c','#4a5568','#2c5364'] as const
const DIAS_SEMANA = [
  { val: '0', lbl: 'Dom' },
  { val: '1', lbl: 'Lun' },
  { val: '2', lbl: 'Mar' },
  { val: '3', lbl: 'Mié' },
  { val: '4', lbl: 'Jue' },
  { val: '5', lbl: 'Vie' },
  { val: '6', lbl: 'Sáb' },
]

/* ── Estado ─────────────────────────────────────────── */
const users      = ref<User[]>([])
const loading    = ref(false)
const search     = ref('')
const sfocus     = ref(false)
const roleF      = ref('CONDUCTOR')
const modalOpen  = ref(false)
const delModal   = ref(false)
const deleting   = ref(false)
const editing    = ref(false)
const mSaving    = ref(false)
const mError     = ref('')
const toDelete   = ref<User | null>(null)
const showPwd    = ref(false)
const cityRef    = ref<HTMLElement | null>(null)

// Reset de contraseña (token de un solo uso entregado por el admin)
const resetModal   = ref(false)
const resetTarget  = ref<User | null>(null)
const resetLoading = ref(false)
const resetError   = ref('')
const resetToken   = ref('')
const resetExpires = ref('')
const resetCopied  = ref(false)

// City autocomplete
const cityQ    = ref('')
const cityOpen = ref(false)

// Form reactive
const mf = reactive({
  id: 0, nombre: '', cedula: '', email: '', password: '',
  telefono: '', placa: '', ciudad: '',
  soatVigencia: '', tecniVigencia: '',
  diasLaborales: '1,2,3,4,5',
  rol: 'CONDUCTOR',
})

// Per-field validation flags
const ferr = reactive({
  nombre: false, cedula: false, email: false,
  password: false, placa: false, ciudad: false, soatVigencia: false, tecniVigencia: false,
})

/* ── Plate Reader ─────────────────────────────────── */
const PLATE_API = import.meta.env.VITE_PLATE_API || 'http://localhost:8000'
const plateReaderOpen = ref(false)
const plateReading = ref(false)
const plateResult = ref<{placa:string;tipo:string;confianza:number;metodo:string;valida:boolean} | null>(null)
const videoRef = ref<HTMLVideoElement | null>(null)
let mediaStream: MediaStream | null = null

async function openPlateReader() {
  plateReaderOpen.value = true
  plateResult.value = null
  await startCamera()
}

function closePlateReader() {
  plateReaderOpen.value = false
  plateResult.value = null
  stopCamera()
}

async function startCamera() {
  stopCamera()
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment', width: 1280, height: 720 } })
    await new Promise(resolve => setTimeout(resolve, 100))
    if (videoRef.value) videoRef.value.srcObject = mediaStream
  } catch { alert('No se pudo acceder a la cámara') }
}

function stopCamera() {
  if (mediaStream) {
    mediaStream.getTracks().forEach(t => t.stop())
    mediaStream = null
  }
}

async function capturePhoto() {
  const video = videoRef.value
  if (!video) return
  const canvas = document.createElement('canvas')
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  canvas.getContext('2d')!.drawImage(video, 0, 0)
  const blob = await new Promise<Blob>(resolve => canvas.toBlob(b => resolve(b!), 'image/jpeg', 0.9))
  stopCamera()
  plateReading.value = true
  try {
    const fd = new FormData()
    fd.append('file', blob, 'plate.jpg')
    const res = await fetch(`${PLATE_API}/read-plate`, { method: 'POST', body: fd })
    plateResult.value = await res.json()
  } catch { alert('Error al conectar con el servidor de lectura de placas') }
  finally { plateReading.value = false }
}

function retakePlate() {
  plateResult.value = null
  startCamera()
}

function acceptPlate() {
  if (plateResult.value?.placa) {
    mf.placa = plateResult.value.placa
    ferr.placa = false
  }
  closePlateReader()
}

onBeforeUnmount(() => stopCamera())

/* ── Computed ───────────────────────────────────────── */
const filtered = computed(() => {
  const q = search.value.toLowerCase()
  return users.value.filter(u => {
    // SUPER_ROOT nunca se muestra en el listado
    if (u.rol === 'SUPER_ROOT') return false

    // Filtro "Inactivos": solo usuarios archivados (con historial)
    if (roleF.value === 'INACTIVOS') {
      if (u.activo !== false) return false
      const qm = !q
        || u.nombre?.toLowerCase().includes(q)
        || u.cedula?.includes(q)
        || u.email?.toLowerCase().includes(q)
        || u.ciudad?.toLowerCase().includes(q)
      return qm
    }

    // Usuarios eliminados/desactivados (con historial) se ocultan del listado
    if (u.activo === false) return false

    const match = !q
      || u.nombre?.toLowerCase().includes(q)
      || u.cedula?.includes(q)
      || u.email?.toLowerCase().includes(q)
      || u.ciudad?.toLowerCase().includes(q)
    return match && (roleF.value === 'ALL' || u.rol === roleF.value)
  })
})

/* ── Paginación de la tabla (tras `filtered`) ──────────── */
const PAGE_SIZE = 20
const page = ref(0)
const totalPages = computed(() => Math.max(1, Math.ceil(filtered.value.length / PAGE_SIZE)))
const pageItems  = computed(() =>
  filtered.value.slice(page.value * PAGE_SIZE, (page.value + 1) * PAGE_SIZE)
)

// Al cambiar búsqueda o filtro de rol se regresa a la primera página
watch([search, roleF], () => { page.value = 0 })
// Si se borra/reactiva el último registro de la última página, se ajusta la página
watch(totalPages, tp => { if (page.value > tp - 1) page.value = Math.max(0, tp - 1) })

/** Ciudades filtradas para el dropdown */
const cityList = computed(() => {
  const q = cityQ.value.trim().toLowerCase()
  if (!q) return CITIES.slice(0, 10) as string[]
  return CITIES.filter(c => c.toLowerCase().includes(q)).slice(0, 12) as string[]
})

/* ── Helpers ────────────────────────────────────────── */
function avBg(name?: string): string {
  const n = name || 'U'
  return AV_BG[n.charCodeAt(0) % AV_BG.length]!
}

function toggleDiaLaboral(val: string) {
  const arr = mf.diasLaborales.split(',').filter(Boolean)
  const idx = arr.indexOf(val)
  if (idx >= 0) {
    arr.splice(idx, 1)
  } else {
    arr.push(val)
    arr.sort((a, b) => Number(a) - Number(b))
  }
  mf.diasLaborales = arr.length ? arr.join(',') : '1,2,3,4,5'
}


/** Returns status for document expiry dates */
/**
 * docVigencia — devuelve la fecha de vencimiento formateada
 * con el color correcto según estado (sin mostrar días ni etiquetas).
 *
 * COLOMBIA (UTC-5, sin DST): se extrae YYYY-MM-DD directamente del
 * ISO string para evitar el desplazamiento de un día que ocurre al
 * parsear '2025-06-15T00:00:00.000Z' con new Date() en UTC-5.
 *
 * Colores:
 *   > 10 días → verde  (vigente)
 *   0–10 días → ámbar  (próximo a vencer)
 *   < 0 días  → rojo   (vencido)
 */
function docVigencia(dateStr?: string | null): { lbl: string; cls: string } | null {
  if (!dateStr) return null

  // Extraer YYYY-MM-DD sin offset TZ
  const m = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/)
  if (!m) return null
  const exp = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))

  // Fecha de hoy en Colombia (Intl.DateTimeFormat → sin depender del TZ del servidor)
  const fmt   = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Bogota',
    year: 'numeric', month: '2-digit', day: '2-digit',
  })
  const parts = fmt.formatToParts(new Date())
  const today = new Date(
    Number(parts.find(p => p.type === 'year')?.value),
    Number(parts.find(p => p.type === 'month')?.value) - 1,
    Number(parts.find(p => p.type === 'day')?.value)
  )

  const days = Math.round((exp.getTime() - today.getTime()) / 86_400_000)

  // Fecha legible en español Colombia, sin contar días ni etiquetas
  // Formato DD/MM/YYYY
  const dd  = String(exp.getDate()).padStart(2, '0')
  const mm  = String(exp.getMonth() + 1).padStart(2, '0')
  const lbl = `${dd}/${mm}/${exp.getFullYear()}`

  if (days < 0)         return { lbl, cls: 'dv-vencido' }   // rojo
  if (days <= 10)       return { lbl, cls: 'dv-proximo' }   // ámbar
  return                       { lbl, cls: 'dv-vigente' }   // verde
}

/** Alias — se mantiene para no romper el uso en el modal de edición */
function soatStatus(dateStr?: string | null) {
  return docVigencia(dateStr)
}

/** Format date string to readable es-CO format */
function fmtDate(d?: string | null): string {
  if (!d) return '—'
  try { return new Date(d).toLocaleDateString('es-CO', { day:'2-digit', month:'short', year:'numeric' }) }
  catch { return d }
}

/* ── Ciudad handlers ────────────────────────────────── */
function pickCity(city: string) {
  mf.ciudad = city
  cityQ.value = city
  cityOpen.value = false
}

function clearCity() {
  mf.ciudad = ''
  cityQ.value = ''
  cityOpen.value = false
}

function onCityBlur() {
  // Delay lets mousedown fire before blur closes dropdown
  setTimeout(() => {
    cityOpen.value = false
    // If text doesn't match a city exactly, restore selected value
    if (mf.ciudad && cityQ.value !== mf.ciudad) {
      cityQ.value = mf.ciudad
    }
  }, 200)
}

// Close city dropdown on outside click
function onDocClick(e: MouseEvent) {
  if (cityRef.value && !cityRef.value.contains(e.target as Node)) {
    cityOpen.value = false
  }
}
onMounted(() => document.addEventListener('click', onDocClick))
onBeforeUnmount(() => document.removeEventListener('click', onDocClick))

/* ── Modal lifecycle ────────────────────────────────── */
function openCreate() {
  editing.value = false
  showPwd.value = false
  Object.assign(mf, { id:0, nombre:'', cedula:'', email:'', password:'', telefono:'', placa:'', ciudad:'', soatVigencia:'', tecniVigencia:'', diasLaborales:'1,2,3,4,5', rol:'CONDUCTOR' })
  Object.assign(ferr, { nombre:false, cedula:false, email:false, password:false, placa:false })
  cityQ.value    = ''
  cityOpen.value = false
  mError.value   = ''
  modalOpen.value = true
}

function openEdit(u: User & any) {
  editing.value = true
  showPwd.value = false
  // Solo asignamos los campos que acepta el DTO — nunca spreads completos del objeto
  // para evitar que activo/createdAt/driver/admin lleguen al backend y sean rechazados
  const dl = u.diasLaborales || u.driver?.diasLaborales || '1,2,3,4,5'
  Object.assign(mf, {
    id:            u.id,
    nombre:        u.nombre        || '',
    cedula:        u.cedula        || '',
    email:         u.email         || '',
    password:      '',
    telefono:      u.telefono      || '',
    placa:         u.placa         || '',
    ciudad:        u.ciudad        || '',
    soatVigencia:  u.soatVigencia  ? String(u.soatVigencia).slice(0, 10)  : '',
    tecniVigencia: u.tecniVigencia ? String(u.tecniVigencia).slice(0, 10) : '',
    diasLaborales: dl,
    rol:           u.rol === 'ADMIN' ? 'ADMIN' : 'CONDUCTOR',
  })
  Object.assign(ferr, { nombre:false, cedula:false, email:false, password:false, placa:false })
  cityQ.value    = u.ciudad || ''
  cityOpen.value = false
  mError.value   = ''
  modalOpen.value = true
}

function closeModal() {
  modalOpen.value = false
  cityOpen.value  = false
  mError.value    = ''
}

function askDelete(u: User) {
  toDelete.value = u
  delModal.value = true
}

/* ── Reset de contraseña ────────────────────────────── */
function askReset(u: User) {
  resetTarget.value = u
  resetToken.value = ''
  resetExpires.value = ''
  resetError.value = ''
  resetCopied.value = false
  resetModal.value = true
}

function closeReset() {
  resetModal.value = false
  resetTarget.value = null
}

async function generateReset() {
  if (!resetTarget.value || resetLoading.value) return
  resetLoading.value = true
  resetError.value = ''
  try {
    const res = await api.post<{ token: string; expiresAt: string }>('/auth/generate-reset', { userId: resetTarget.value.id })
    resetToken.value = res.data.token
    resetExpires.value = new Date(res.data.expiresAt).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
    await loadUsers()
  } catch (e: any) {
    const msg = e?.response?.data?.message
    resetError.value = Array.isArray(msg) ? msg[0] : (msg || 'No fue posible generar el token.')
  } finally {
    resetLoading.value = false
  }
}

async function copyResetToken() {
  if (!resetToken.value) return
  try {
    await navigator.clipboard.writeText(resetToken.value)
    resetCopied.value = true
    setTimeout(() => { resetCopied.value = false }, 2000)
  } catch {
    resetError.value = 'No se pudo copiar automáticamente. Selecciónalo y copia manualmente.'
  }
}

/* ── Validación completa ────────────────────────────── */
function validateForm(): boolean {
  const errNombre   = !mf.nombre.trim()
  const errCedula   = !/^\d{6,12}$/.test(mf.cedula)
  const errEmail    = !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(mf.email)
  const errTelefono  = mf.telefono.length === 0 || !/^[\d+\s\-()]+$/.test(mf.telefono)
  const errPassword = mf.password.length > 0 && mf.password.length < 8
  const errPasswordReq = !editing.value && mf.password.length < 8
  const isDriver = mf.rol === 'CONDUCTOR'
  const errPlaca    = isDriver && mf.placa.length > 0 && !/^[A-Z]{3}[\d]{3,4}$|^[A-Z]{3}-[\d]{3}$|^[A-Z0-9]{4,8}$/.test(mf.placa)

  const errCiudad = !mf.ciudad || !mf.ciudad.trim();
  const errSoat = isDriver && !mf.soatVigencia;
  const errTecni = isDriver && !mf.tecniVigencia;

  Object.assign(ferr, {
    nombre:   errNombre,
    cedula:   errCedula,
    email:    errEmail,
    telefono: errTelefono,
    password: errPassword || errPasswordReq,
    placa:    errPlaca,
    ciudad:   errCiudad,
    soatVigencia: errSoat,
    tecniVigencia: errTecni,
  })

  if (errNombre)   { mError.value = 'El nombre completo es obligatorio.'; return false }
  if (errCedula)   { mError.value = 'La cédula debe tener entre 6 y 12 dígitos.'; return false }
  if (errEmail)    { mError.value = 'Ingresa un correo electrónico válido.'; return false }
  if (errPassword) { mError.value = 'La contraseña debe tener mínimo 8 caracteres.'; return false }
  if (errPlaca)    { mError.value = 'El formato de placa no es válido (ej: ABC123).'; return false }
  if (errCiudad)   { mError.value = 'La ciudad es obligatoria.'; return false }
  if (errSoat)     { mError.value = 'La fecha de vencimiento del SOAT es obligatoria.'; return false }
  if (errTecni)    { mError.value = 'La fecha de vencimiento de la Tecnomecánica es obligatoria.'; return false }
  if (errTelefono) { mError.value = 'El teléfono contiene caracteres inválidos.'; return false }
  return true
}

/* ── API ────────────────────────────────────────────── */
async function loadUsers() {
  loading.value = true
  try {
    const res = await api.get<User[]>('/users')
    users.value = Array.isArray(res.data) ? res.data : []
  } catch (e: any) {
    console.error('[UsersView] load:', e)
  } finally {
    loading.value = false
  }
}

async function saveUser() {
  mError.value = ''
  if (!validateForm()) return

  mSaving.value = true
  // Build clean payload — mapear rol→role y CONDUCTOR→DRIVER para el backend
  const { id: _id, rol, ...rest } = mf as any
  const roleValue = rol === 'CONDUCTOR' ? 'DRIVER' : (rol || 'DRIVER')
  const basePayload = { ...rest, role: roleValue }
  const payload = editing.value
    ? auth.isSuperRoot
      ? { ...basePayload, password: basePayload.password || undefined }
      : (() => { const { password: _pw, ...p } = basePayload; return p })()
    : { ...basePayload }

  try {
    editing.value
      ? await api.put(`/users/${mf.id}`, payload)
      : await api.post('/users', payload)
    closeModal()
    await loadUsers()
  } catch (e: any) {
    const msg = e?.response?.data?.message
    mError.value = Array.isArray(msg) ? msg[0] : (msg || 'Error al guardar. Intenta de nuevo.')
  } finally {
    mSaving.value = false
  }
}

async function doDelete() {
  if (!toDelete.value || deleting.value) return
  deleting.value = true
  try {
    await api.delete(`/users/${toDelete.value.id}`)
  } catch (e: any) {
    // 204 No Content is success — axios may throw on empty body in some configs
    const status = e?.response?.status
    if (status !== 204 && status !== 200) {
      console.error('[UsersView] delete error:', e)
      return
    }
  } finally {
    deleting.value = false
    delModal.value = false
    await loadUsers()
  }
}

const reactivating = ref<number | null>(null)

async function reactivate(u: User) {
  if (reactivating.value !== null) return
  reactivating.value = u.id
  try {
    await api.put(`/users/${u.id}`, { isActive: true })
    await loadUsers()
  } catch (e: any) {
    const msg = e?.response?.data?.message
    console.error('[UsersView] reactivate error:', e)
    mError.value = Array.isArray(msg) ? msg[0] : (msg || 'Error al reactivar el usuario.')
  } finally {
    reactivating.value = null
  }
}

onMounted(async () => {
  await loadUsers()
})
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800&family=Barlow:wght@400;500;600;700&display=swap');

.page { font-family:'Barlow',sans-serif; max-width:1400px; }

/* Header */
.page-head { display:flex;align-items:flex-start;justify-content:space-between;margin-bottom:20px;gap:12px;flex-wrap:wrap; }
.page-title { font-family:'Barlow Condensed',sans-serif;font-size:30px;font-weight:900;color:#0d1422;margin:0 0 4px;letter-spacing:.5px; }
.page-sub   { font-size:13px;color:#8895a7;margin:0; }
.btn-primary { display:inline-flex;align-items:center;gap:7px;background:#1a2540;color:#fff;border:none;border-radius:7px;padding:10px 18px;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:700;letter-spacing:1px;cursor:pointer;box-shadow:0 3px 12px rgba(26,37,64,.25);transition:background .15s,transform .1s; }
.btn-primary:hover { background:#0d1422;transform:translateY(-1px); }

/* Filters */
.filter-bar { display:flex;align-items:center;gap:10px;margin-bottom:14px;flex-wrap:wrap; }
.search-box { display:flex;align-items:center;gap:8px;background:#fff;border:1.5px solid #e4e7ed;border-radius:7px;padding:9px 13px;flex:1;min-width:200px;color:#8895a7;transition:border-color .2s; }
.sfocus { border-color:#1a2540; }
.search-box input { flex:1;border:none;outline:none;background:none;font-size:14px;font-family:'Barlow',sans-serif;color:#0d1422; }
.search-box input::placeholder { color:#b0bbc9; }
.chips { display:flex;gap:6px;flex-wrap:wrap; }
.chip { padding:7px 14px;border-radius:6px;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:.5px;cursor:pointer;border:1.5px solid #e4e7ed;background:#fff;color:#4a5568;transition:all .15s; }
.chip--on { background:#1a2540;border-color:#1a2540;color:#fff; }
.chip--inactivos.chip--on { background:#6b7280;border-color:#6b7280; }

/* ── Paginación de usuarios ────────────────────────── */
.pg-foot { display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;padding:10px 14px;border-top:1px solid #f0f2f6;font-size:12px;color:#8895a7; }
.pg-nav { display:flex;align-items:center;gap:6px; }
.pg-btn { min-width:28px;height:28px;border-radius:6px;border:1.5px solid #e4e7ed;background:#fff;color:#4a5568;cursor:pointer;font-size:14px;line-height:1;display:flex;align-items:center;justify-content:center;transition:all .15s; }
.pg-btn:hover:not(:disabled) { border-color:#1a2540;color:#1a2540; }
.pg-btn:disabled { opacity:.45;cursor:not-allowed; }
.pg-pg { font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:.5px;color:#0d1422; }

/* Table */
.tcard { background:#fff;border:1px solid #e4e7ed;border-radius:10px;overflow:hidden; }
.skel-wrap { padding:14px;display:flex;flex-direction:column;gap:8px; }
.skel-r { height:44px;border-radius:7px;background:linear-gradient(90deg,#f2f4f7 25%,#e8eaf0 50%,#f2f4f7 75%);background-size:400% 100%;animation:skel 1.5s infinite; }
@keyframes skel { 0%{background-position:400%0}100%{background-position:-400%0} }
.empty-state { text-align:center;padding:56px;display:flex;flex-direction:column;align-items:center;gap:10px; }
.empty-t { font-family:'Barlow Condensed',sans-serif;font-size:18px;font-weight:800;color:#0d1422;margin:0; }
.empty-s { font-size:13px;color:#8895a7;margin:0; }
.tbl { width:100%;border-collapse:collapse; }
.tbl th { text-align:left;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.2px;color:#8895a7;padding:10px 14px;border-bottom:1px solid #f0f2f6;white-space:nowrap; }
.tbl tbody tr { border-bottom:1px solid #f5f7fa;animation:rIn .3s ease calc(var(--ri,0)*.04s) both;transition:background .1s; }
.tbl tbody tr:last-child { border-bottom:none; }
.tbl tbody tr:hover { background:#fafbfc; }
.tbl td { padding:11px 14px;vertical-align:middle;font-size:13px;color:#0d1422; }
@keyframes rIn { from{opacity:0;transform:translateX(-5px)}to{opacity:1;transform:translateX(0)} }
.u-cell { display:flex;align-items:center;gap:10px; }
.u-av   { width:32px;height:32px;border-radius:8px;color:#fff;font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:800;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.u-name  { font-size:13px;font-weight:600;color:#0d1422; }
.u-email { font-size:11px;color:#8895a7; }
.td-mono  { font-size:12px;color:#4a5568;font-variant-numeric:tabular-nums; }
.td-empty { color:#b0bbc9; }
.placa-badge { display:inline-block;padding:2px 8px;background:#f2f4f7;border:1px solid #e4e7ed;border-radius:4px;font-family:'Barlow Condensed',sans-serif;font-size:12px;font-weight:700;letter-spacing:.8px; }
.rbadge  { font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:.8px;padding:3px 9px;border-radius:4px; }
.rb-admin  { background:#1a2540;color:#fff; }
.rb-driver { background:#f2f4f7;color:#4a5568;border:1px solid #d4d9e3; }
.sbadge { display:inline-flex;align-items:center;gap:5px;font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:.8px;padding:3px 9px;border-radius:4px; }
.sbadge::before { content:'';width:5px;height:5px;border-radius:50%;background:currentColor; }
.sb-on  { background:#f0fdf4;color:#166534; }
.sb-off { background:#f9fafb;color:#6b7280;border:1px solid #e5e7eb; }
.sb-vac { background:#fffbeb;color:#92400e;border:1px solid #fde68a; }
.row-btns { display:flex;gap:4px; }
.rb-edit,.rb-del { width:28px;height:28px;border-radius:6px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s; }.rb-edit { background:rgba(26,37,64,.07);color:#1a2540; } .rb-edit:hover { background:rgba(26,37,64,.14); }
.rb-del  { background:rgba(230,61,47,.07);color:#e63d2f; } .rb-del:hover  { background:rgba(230,61,47,.14); }
.rb-key  { width:28px;height:28px;border-radius:6px;border:none;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:background .15s;background:rgba(180,83,9,.08);color:#b45309; } .rb-key:hover { background:rgba(180,83,9,.16); }
.rt-token { font-family:'Courier New',monospace;font-size:13px;letter-spacing:.5px;word-break:break-all;background:#0d1422;color:#7dd3fc;border-radius:8px;padding:12px 14px;cursor:pointer;user-select:all;margin:4px 0 2px;transition:opacity .15s; }
.rt-token:hover { opacity:.88; }
.rt-copied { font-size:12px;font-weight:700;color:#166534;margin:4px 0 0; }
.rb-act  { background:rgba(22,101,52,.08);color:#166534; } .rb-act:hover  { background:rgba(22,101,52,.16); }

/* ── Días laborales grid ───────────────────────────── */
.dias-laborales-grid { display:flex;gap:6px;flex-wrap:wrap; }
.dl-chip { display:flex;align-items:center;gap:5px;padding:7px 12px;border-radius:6px;border:1.5px solid #e4e7ed;background:#f8f9fa;cursor:pointer;transition:all .15s;font-size:12px;font-weight:600;color:#4a5568; }
.dl-chip:hover { border-color:#1a2540;background:#f0f4f8; }
.dl-chip--on { background:#1a2540;border-color:#1a2540;color:#fff; }
.dl-check { display:none; }

/* ── Modal overlay ──────────────────────── */
.modal-overlay { position:fixed;inset:0;background:rgba(0,0,0,.45);backdrop-filter:blur(3px);z-index:500;display:flex;align-items:center;justify-content:center;padding:16px; }
.modal-box { background:#fff;border:1px solid #e4e7ed;border-radius:12px;width:100%;max-width:560px;max-height:92vh;display:flex;flex-direction:column;box-shadow:0 20px 60px rgba(0,0,0,.18); }
.modal-sm  { max-width:360px;text-align:center;padding:32px 28px; }

/* Modal head */
.modal-head { display:flex;align-items:flex-start;gap:12px;padding:20px 22px 16px;border-bottom:1px solid #f0f2f6;flex-shrink:0; }
.modal-icon { width:40px;height:40px;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0; }
.mi-new  { background:#f0f4f8;color:#1a2540; }
.mi-edit { background:#fff8f0;color:#c2830a; }
.modal-title { font-family:'Barlow Condensed',sans-serif;font-size:16px;font-weight:800;color:#0d1422;margin:0 0 2px;letter-spacing:.3px; }
.modal-sub   { font-size:12px;color:#8895a7;margin:0; }
.modal-close { margin-left:auto;background:none;border:none;cursor:pointer;color:#8895a7;display:flex;padding:6px;border-radius:7px;transition:background .15s;flex-shrink:0; }
.modal-close:hover { background:#f2f4f7; }

/* Modal body */
.modal-body { padding:18px 22px;overflow-y:auto;flex:1; }
.form-grid  { display:grid;grid-template-columns:1fr 1fr;gap:14px; }
@media(max-width:480px){ .form-grid { grid-template-columns:1fr; } }

.ff { display:flex;flex-direction:column;gap:5px;position:relative; }
.ff--full { grid-column:1/-1; }
.ff-label { font-family:'Barlow Condensed',sans-serif;font-size:10px;font-weight:700;letter-spacing:1.2px;color:#4a5568; }
.req { color:#e63d2f; }
.ff-input {
  border:1.5px solid #e4e7ed;border-radius:7px;background:#f8f9fa;
  padding:10px 12px;font-size:14px;font-family:'Barlow',sans-serif;
  color:#0d1422;outline:none;transition:all .2s;width:100%;
}
.ff-input:focus { border-color:#1a2540;background:#fff;box-shadow:0 0 0 3px rgba(26,37,64,.08); }
.ff-input--err  { border-color:#e63d2f !important; }
.ff-input--err:focus { box-shadow:0 0 0 3px rgba(230,61,47,.08) !important; }
.ff-err { font-size:11px;color:#e63d2f;font-weight:600;margin:3px 0 0; }

/* Icon inside input */
.ff-ico-wrap { position:relative; }
.ff-ico { position:absolute;left:11px;top:50%;transform:translateY(-50%);color:#8895a7;pointer-events:none; }
.ff-input--ico { padding-left:32px; }

/* Password eye */
.pwd-field { position:relative; }
.pwd-field .ff-input { padding-right:36px; }
.pwd-eye { position:absolute;right:10px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:#8895a7;display:flex;transition:color .15s;padding:2px; }
.pwd-eye:hover { color:#1a2540; }

/* City autocomplete */
.city-field { position:relative; }
.city-badge {
  display:inline-flex;align-items:center;gap:5px;margin-top:5px;
  font-size:12px;font-weight:600;color:#1a2540;
  background:#f0f4f8;border:1px solid #d4d9e3;border-radius:5px;padding:3px 9px;
}
.city-badge button { background:none;border:none;cursor:pointer;color:#8895a7;font-size:15px;padding:0 2px;line-height:1;transition:color .15s; }
.city-badge button:hover { color:#e63d2f; }
.city-list {
  position:absolute;top:calc(100% + 4px);left:0;right:0;z-index:700;
  background:#fff;border:1.5px solid #e4e7ed;border-radius:8px;
  box-shadow:0 8px 28px rgba(0,0,0,.12);
  max-height:220px;overflow-y:auto;margin:0;padding:0;list-style:none;
}
.city-opt {
  display:flex;align-items:center;gap:7px;padding:9px 13px;
  font-size:13px;color:#0d1422;cursor:pointer;
  border-bottom:1px solid #f5f7fa;transition:background .1s;
}
.city-opt:last-child { border-bottom:none; }
.city-opt:hover      { background:#f2f4f7; }
.city-empty { padding:10px 13px;font-size:13px;color:#8895a7;font-style:italic; }

/* City dropdown transition */
.city-drop-enter-active { animation:cdIn .18s ease; }
.city-drop-leave-active { animation:cdIn .14s reverse; }
@keyframes cdIn { from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)} }

/* Select */
.sel-wrap { position:relative; }
.sel-wrap .ff-input { appearance:none;padding-right:28px;cursor:pointer; }
.sel-arr { position:absolute;right:10px;top:50%;transform:translateY(-50%);pointer-events:none;color:#8895a7; }

/* Modal error */
.modal-err { display:flex;align-items:flex-start;gap:8px;background:#fef2f2;border:1px solid #fecaca;border-radius:7px;padding:10px 13px;font-size:13px;color:#dc2626;margin-top:13px; }

/* Modal foot */
.modal-foot { display:flex;justify-content:flex-end;gap:9px;padding:14px 22px;border-top:1px solid #f0f2f6;flex-shrink:0; }
.btn-cancel { padding:9px 18px;border-radius:7px;border:1.5px solid #e4e7ed;background:#fff;color:#4a5568;font-size:13px;font-weight:600;font-family:'Barlow',sans-serif;cursor:pointer;transition:all .15s; }
.btn-cancel:hover { background:#f2f4f7; }
.btn-save { padding:9px 20px;border-radius:7px;background:#1a2540;color:#fff;border:none;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;letter-spacing:.5px;cursor:pointer;min-width:130px;display:flex;align-items:center;justify-content:center;transition:background .15s; }
.btn-save:hover { background:#0d1422; }
.btn-save:disabled { opacity:.65;cursor:not-allowed; }
.btn-danger { padding:9px 20px;border-radius:7px;background:#e63d2f;color:#fff;border:none;font-family:'Barlow Condensed',sans-serif;font-size:14px;font-weight:700;letter-spacing:.5px;cursor:pointer;transition:background .15s; }
.btn-danger:hover { background:#c42d20; }

.btn-dots { display:flex;gap:4px;height:18px;align-items:center; }
.btn-dots span { width:5px;height:5px;border-radius:50%;background:rgba(255,255,255,.8);animation:bd .7s infinite; }
.btn-dots span:nth-child(2){animation-delay:.12s}.btn-dots span:nth-child(3){animation-delay:.24s}
@keyframes bd{0%,80%,100%{transform:translateY(0)}40%{transform:translateY(-5px)}}

.del-icon  { font-size:46px;margin-bottom:14px; }
.doc-badge { font-family:'Barlow Condensed',sans-serif;font-size:13px;font-weight:600;letter-spacing:.2px;padding:0; }
/* Colores de fecha según vigencia — solo color, sin fondo ni borde */
.doc-badge.dv-vigente { color:#166534; }   /* verde — > 10 días */
.doc-badge.dv-proximo { color:#92400e; }   /* ámbar — 0 a 10 días */
.doc-badge.dv-vencido { color:#e63d2f; font-weight:700; }  /* rojo — vencido */
.ff-input--warn   { border-color:#f59e0b !important; }
.ff-input--danger { border-color:#e63d2f !important; }
.vig-status { font-size:9px;font-weight:700;padding:1px 6px;border-radius:3px;margin-left:5px;letter-spacing:.5px; }
.vig-status.ok     { background:#f0fdf4;color:#166534; }
.vig-status.dv-vigente { background:#f0fdf4;color:#166534; }
.vig-status.dv-proximo { background:#fffbeb;color:#92400e; }
.vig-status.dv-vencido { background:#fff5f5;color:#e63d2f; font-weight:700; }
.del-title { font-family:'Barlow Condensed',sans-serif;font-size:20px;font-weight:900;color:#0d1422;margin:0 0 8px;letter-spacing:.3px; }
.del-body  { font-size:13px;color:#4a5568;line-height:1.6;margin:0 0 22px; }
.del-actions { display:flex;justify-content:center;gap:9px; }

.modal-t-enter-active { animation:mIn .22s cubic-bezier(.22,1,.36,1); }
.modal-t-leave-active { animation:mIn .16s ease reverse; }
@keyframes mIn { from{opacity:0;transform:scale(.95)}to{opacity:1;transform:scale(1)} }

/* ── Plate Reader ───────────────────────────────── */
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
@keyframes spin{to{transform:rotate(360deg)}}

/* ── Modal global styles ───────────────────────── */
:global(.modal-overlay){position:fixed;inset:0;z-index:1000;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px}
:global(.modal-box){background:#fff;border-radius:12px;width:100%;max-width:480px;max-height:90vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.25)}
:global(.modal-head){display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #f0f2f6}
:global(.modal-head h3){font-size:16px;font-weight:700;margin:0}
:global(.modal-close){width:32px;height:32px;border:none;background:none;font-size:22px;cursor:pointer;color:#8895a7;border-radius:6px;display:flex;align-items:center;justify-content:center}
:global(.modal-close:hover){background:#f2f4f7;color:#0d1422}
:global(.modal-body){padding:20px}
:global(.modal-enter-active){animation:mIn .25s cubic-bezier(.22,1,.36,1)}
:global(.modal-leave-active){animation:mIn .2s reverse}
</style>