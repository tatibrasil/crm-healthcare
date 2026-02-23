// ============================================
// CRM Healthcare - Application Logic (with CRUD)
// + Chatwoot Dashboard App Integration
// ============================================

let currentPage = 'dashboard';
let selectedPatient = null;
let editingAppointment = null;
let editingPatient = null;
let isEmbeddedMode = false;
let chatwootContact = null;
let chatwootConversations = [];

// ---- Router ----
function navigateTo(page) {
  currentPage = page;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  const activeNav = document.querySelector(`[data-page="${page}"]`);
  if (activeNav) activeNav.classList.add('active');
  renderPage();
}

function renderPage() {
  const content = document.getElementById('page-content');
  const titleEl = document.getElementById('page-title');
  const breadcrumbEl = document.getElementById('breadcrumb');

  const pages = {
    dashboard: { title: 'Dashboard', bc: 'Home / Visão Geral', render: renderDashboard },
    pipeline: { title: 'Pipeline', bc: 'Home / Pipeline de Pacientes', render: renderPipeline },
    appointments: { title: 'Agendamentos', bc: 'Home / Agendamentos', render: renderAppointments },
    patients: { title: 'Pacientes', bc: 'Home / Lista de Pacientes', render: renderPatients },
    reports: { title: 'Relatórios', bc: 'Home / Relatórios e Métricas', render: renderReports },
    doctors: { title: 'Médicos', bc: 'Home / Cadastro de Médicos', render: renderDoctors },
    services: { title: 'Serviços', bc: 'Home / Exames, Procedimentos e Cirurgias', render: renderServices },
    availability: { title: 'Disponibilidade', bc: 'Home / Agenda dos Médicos', render: renderAvailability },
    'chatwoot-config': { title: 'Chatwoot', bc: 'Home / Configuração Chatwoot', render: renderChatwootConfig }
  };

  const p = pages[currentPage] || pages.dashboard;
  titleEl.textContent = p.title;
  breadcrumbEl.textContent = p.bc;
  content.innerHTML = '';
  p.render(content);
}

// ============================================
// DASHBOARD
// ============================================
function renderDashboard(container) {
  const kpis = store.getKPIs();
  container.innerHTML = `
    <div class="kpi-grid">
      <div class="kpi-card blue animate-in" style="animation-delay:0ms">
        <div class="kpi-header"><div class="kpi-icon">👥</div><span class="kpi-label">Total Pacientes</span></div>
        <div class="kpi-value">${kpis.totalPatients}</div>
        <div class="kpi-change positive">↑ 12% este mês</div>
      </div>
      <div class="kpi-card green animate-in" style="animation-delay:80ms">
        <div class="kpi-header"><div class="kpi-icon">📅</div><span class="kpi-label">Agendamentos Hoje</span></div>
        <div class="kpi-value">${kpis.todayAppts}</div>
        <div class="kpi-change positive">↑ ${kpis.pendingAppts} pendentes</div>
      </div>
      <div class="kpi-card orange animate-in" style="animation-delay:160ms">
        <div class="kpi-header"><div class="kpi-icon">🏥</div><span class="kpi-label">Em Tratamento</span></div>
        <div class="kpi-value">${kpis.inTreatment}</div>
        <div class="kpi-change positive">↑ ativo agora</div>
      </div>
      <div class="kpi-card purple animate-in" style="animation-delay:240ms">
        <div class="kpi-header"><div class="kpi-icon">✅</div><span class="kpi-label">Taxa de Conclusão</span></div>
        <div class="kpi-value">${kpis.conversionRate}%</div>
        <div class="kpi-change positive">↑ 5% este mês</div>
      </div>
    </div>
    <div class="dashboard-grid">
      <div class="card animate-in" style="animation-delay:300ms">
        <div class="card-header"><span class="card-title">📊 Pacientes por Etapa</span></div>
        <div class="card-body"><div class="bar-chart" id="stage-chart"></div></div>
      </div>
      <div class="card animate-in" style="animation-delay:350ms">
        <div class="card-header"><span class="card-title">🏥 Por Clínica</span></div>
        <div class="card-body"><div class="donut-chart" id="clinic-chart"></div></div>
      </div>
      <div class="card animate-in" style="animation-delay:400ms">
        <div class="card-header">
          <span class="card-title">🕐 Atividade Recente</span>
        </div>
        <div class="card-body" style="padding:8px 20px"><div class="activity-list" id="activity-list"></div></div>
      </div>
      <div class="card animate-in" style="animation-delay:450ms">
        <div class="card-header">
          <span class="card-title">📅 Próximos Agendamentos</span>
          <button class="btn btn-secondary" onclick="navigateTo('appointments')" style="font-size:11px;padding:4px 10px">Ver todos</button>
        </div>
        <div class="card-body" style="padding:8px 20px"><div id="upcoming-appointments"></div></div>
      </div>
    </div>
  `;
  renderStageChart(kpis.stageCounts);
  renderClinicChart(kpis.clinicCounts);
  renderActivityFeed();
  renderUpcomingWidget();
}

function renderStageChart(stageCounts) {
  const chart = document.getElementById('stage-chart');
  if (!chart) return;
  const maxVal = Math.max(...Object.values(stageCounts), 1);
  const colors = ['#6C63FF', '#00B4D8', '#F4A261', '#2EC4B6', '#06D6A0', '#E76F51'];
  chart.innerHTML = Object.entries(stageCounts).map(([name, count], i) => `
    <div class="bar-row">
      <span class="bar-label">${name}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(count / maxVal) * 100}%;background:${colors[i]}"><span>${count}</span></div>
      </div>
    </div>
  `).join('');
}

function renderClinicChart(clinicCounts) {
  const chart = document.getElementById('clinic-chart');
  if (!chart) return;
  const total = Object.values(clinicCounts).reduce((a, b) => a + b, 0) || 1;
  const colors = ['#6C63FF', '#00B4D8', '#2EC4B6', '#F4A261'];
  let offset = 0;
  const circ = 2 * Math.PI * 50;
  let circles = '', legend = '';
  Object.entries(clinicCounts).forEach(([name, count], i) => {
    const pct = count / total;
    circles += `<circle cx="70" cy="70" r="50" fill="none" stroke="${colors[i]}" stroke-width="16" stroke-dasharray="${pct * circ} ${circ - pct * circ}" stroke-dashoffset="${-offset * circ}" />`;
    legend += `<div class="legend-item"><span class="legend-dot" style="background:${colors[i]}"></span><span>${name}</span><span class="legend-value">${count}</span></div>`;
    offset += pct;
  });
  chart.innerHTML = `<svg class="donut-svg" viewBox="0 0 140 140">${circles}</svg><div class="donut-legend">${legend}</div>`;
}

function renderActivityFeed() {
  const list = document.getElementById('activity-list');
  if (!list) return;
  const activities = store.getActivities();
  list.innerHTML = activities.slice(0, 6).map(a => `
    <div class="activity-item">
      <div class="activity-icon">${a.icon}</div>
      <div class="activity-content">
        <p><strong>${a.patient}</strong> — ${a.desc}</p>
        <span class="activity-time">${a.time}</span>
      </div>
    </div>
  `).join('');
}

function renderUpcomingWidget() {
  const el = document.getElementById('upcoming-appointments');
  if (!el) return;
  const upcoming = store.getUpcomingAppointments(14);
  if (upcoming.length === 0) {
    el.innerHTML = '<div class="empty-state" style="padding:20px"><p>Nenhum agendamento próximo</p></div>';
    return;
  }
  el.innerHTML = upcoming.slice(0, 4).map(a => `
    <div class="activity-item" style="cursor:pointer" onclick="navigateTo('appointments')">
      <div class="activity-icon" style="background:${a.status === 'confirmado' ? 'rgba(34,197,94,0.1)' : 'rgba(245,158,11,0.1)'}">
        ${a.status === 'confirmado' ? '✅' : '⏳'}
      </div>
      <div class="activity-content">
        <p><strong>${a.patientName}</strong> — ${a.type}</p>
        <span class="activity-time">${formatDateBR(a.date)} às ${a.time} • ${a.clinic}</span>
      </div>
    </div>
  `).join('');
}

// ============================================
// PIPELINE
// ============================================
function renderPipeline(container) {
  container.innerHTML = `
    <div class="pipeline-toolbar">
      <div class="filter-group">
        <select class="filter-select" id="pipeline-clinic-filter" onchange="renderPipelineColumns()">
          <option value="">Todas as Clínicas</option>
          ${CLINICS.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
        <select class="filter-select" id="pipeline-specialty-filter" onchange="renderPipelineColumns()">
          <option value="">Todas Especialidades</option>
          ${SPECIALTIES.map(s => `<option value="${s}">${s}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-primary" onclick="openPatientForm()">+ Novo Paciente</button>
    </div>
    <div class="pipeline-container" id="pipeline-board"></div>
  `;
  renderPipelineColumns();
}

function renderPipelineColumns() {
  const board = document.getElementById('pipeline-board');
  if (!board) return;
  const clinicFilter = document.getElementById('pipeline-clinic-filter')?.value || '';
  const specFilter = document.getElementById('pipeline-specialty-filter')?.value || '';

  board.innerHTML = PIPELINE_STAGES.map(stage => {
    let patients = store.getPatientsByStage(stage.id);
    if (clinicFilter) patients = patients.filter(p => p.clinic === clinicFilter);
    if (specFilter) patients = patients.filter(p => p.specialty === specFilter);
    return `
      <div class="pipeline-column animate-in">
        <div class="pipeline-column-header">
          <span class="pipeline-column-title"><span>${stage.icon}</span> ${stage.name}</span>
          <span class="pipeline-column-count">${patients.length}</span>
        </div>
        <div class="pipeline-column-body" data-stage="${stage.id}"
          ondragover="handleDragOver(event)" ondragleave="handleDragLeave(event)" ondrop="handleDrop(event, '${stage.id}')">
          ${patients.map(p => renderPatientCard(p)).join('')}
        </div>
      </div>`;
  }).join('');
}

function renderPatientCard(patient) {
  const tags = patient.tags.slice(0, 3).map(t => {
    const info = getTagInfo(t);
    return `<span class="tag" style="background:${info.color}">${info.name}</span>`;
  }).join('');
  const initials = patient.name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const colors = ['#6C63FF', '#00B4D8', '#2EC4B6', '#F4A261', '#E76F51', '#8B5CF6'];
  return `
    <div class="patient-card" draggable="true" data-patient-id="${patient.id}"
      ondragstart="handleDragStart(event, ${patient.id})" ondragend="handleDragEnd(event)"
      onclick="openPatientModal(${patient.id})">
      <div class="patient-card-header">
        <div class="patient-avatar" style="background:${colors[patient.id % colors.length]}">${initials}</div>
        <div class="patient-card-info"><h4>${patient.name}</h4><span>${patient.specialty}</span></div>
      </div>
      <div class="patient-card-tags">${tags}</div>
      <div class="patient-card-footer">
        <span class="clinic-name">🏥 ${patient.clinic}</span>
        <span>${formatDateBR(patient.lastContact)}</span>
      </div>
    </div>`;
}

// Drag & Drop
let draggedPatientId = null;
function handleDragStart(e, id) { draggedPatientId = id; e.target.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; }
function handleDragEnd(e) { e.target.classList.remove('dragging'); document.querySelectorAll('.pipeline-column-body').forEach(c => c.classList.remove('drag-over')); }
function handleDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
function handleDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }
function handleDrop(e, stageId) {
  e.preventDefault(); e.currentTarget.classList.remove('drag-over');
  if (draggedPatientId !== null) { store.movePatient(draggedPatientId, stageId); renderPipelineColumns(); draggedPatientId = null; }
}

// ============================================
// APPOINTMENTS
// ============================================
function renderAppointments(container) {
  const sorted = [...store.getAppointments()].sort((a, b) => new Date(a.date + 'T' + a.time) - new Date(b.date + 'T' + b.time));
  const grouped = {};
  sorted.forEach(a => { if (!grouped[a.date]) grouped[a.date] = []; grouped[a.date].push(a); });

  const typeColors = { 'Retorno': '#F4A261', 'Primeira Consulta': '#6C63FF', 'Procedimento': '#2EC4B6', 'Exame': '#00B4D8' };

  container.innerHTML = `
    <div class="calendar-header">
      <div class="calendar-nav">
        <span class="calendar-month">📅 Todos os Agendamentos</span>
      </div>
      <div style="display:flex;gap:8px;align-items:center">
        <button class="btn btn-primary" onclick="openAppointmentForm()">+ Novo Agendamento</button>
      </div>
    </div>
    <div class="appointments-list">
      ${Object.entries(grouped).map(([date, appts]) => `
        <div style="margin-bottom:8px">
          <div style="font-size:12px;font-weight:600;color:var(--text-muted);padding:8px 0;text-transform:uppercase;letter-spacing:1px">${formatDateFull(date)}</div>
          ${appts.map(a => `
            <div class="appointment-item animate-in">
              <div class="appointment-time"><div class="time">${a.time}</div><div class="duration">${a.duration} min</div></div>
              <div class="appointment-divider" style="background:${typeColors[a.type] || '#6C63FF'}"></div>
              <div class="appointment-details">
                <h4>${a.patientName}</h4>
                <p>${a.type} — ${a.notes || ''}</p>
                <div class="appointment-meta"><span>🏥 ${a.clinic}</span><span>👨‍⚕️ ${a.doctor}</span></div>
              </div>
              <span class="appointment-status ${a.status}">${a.status === 'confirmado' ? '✅ Confirmado' : '⏳ Pendente'}</span>
              <div class="appointment-actions">
                <button title="Confirmar" onclick="event.stopPropagation();toggleApptStatus(${a.id})">✅</button>
                <button title="Editar" onclick="event.stopPropagation();openAppointmentForm(${a.id})">✏️</button>
                <button title="Cancelar" onclick="event.stopPropagation();deleteAppointment(${a.id})">🗑️</button>
              </div>
            </div>
          `).join('')}
        </div>
      `).join('')}
      ${sorted.length === 0 ? '<div class="empty-state"><div class="empty-icon">📅</div><p>Nenhum agendamento. Clique em "+ Novo Agendamento" para criar.</p></div>' : ''}
    </div>
  `;
}

function toggleApptStatus(id) {
  const appt = store.getAppointmentById(id);
  if (appt) {
    store.updateAppointment(id, { status: appt.status === 'confirmado' ? 'pendente' : 'confirmado' });
    renderPage();
  }
}

function deleteAppointment(id) {
  if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
    store.deleteAppointment(id);
    renderPage();
  }
}

// ============================================
// PATIENTS LIST
// ============================================
function renderPatients(container) {
  container.innerHTML = `
    <div class="patients-toolbar">
      <div class="filter-group">
        <div class="search-bar" style="position:relative">
          <span class="search-icon">🔍</span>
          <input type="text" id="patient-search" placeholder="Buscar paciente..." oninput="filterPatientTable()" style="width:240px">
        </div>
        <select class="filter-select" id="patient-stage-filter" onchange="filterPatientTable()">
          <option value="">Todas Etapas</option>
          ${PIPELINE_STAGES.map(s => `<option value="${s.id}">${s.icon} ${s.name}</option>`).join('')}
        </select>
        <select class="filter-select" id="patient-clinic-filter" onchange="filterPatientTable()">
          <option value="">Todas Clínicas</option>
          ${CLINICS.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-primary" onclick="openPatientForm()">+ Novo Paciente</button>
    </div>
    <div class="card">
      <table class="patients-table">
        <thead><tr><th>Paciente</th><th>Especialidade</th><th>Clínica</th><th>Etapa</th><th>Tags</th><th>Último Contato</th><th>Ações</th></tr></thead>
        <tbody id="patients-tbody"></tbody>
      </table>
    </div>
  `;
  filterPatientTable();
}

function filterPatientTable() {
  const search = document.getElementById('patient-search')?.value?.toLowerCase() || '';
  const stageFilter = document.getElementById('patient-stage-filter')?.value || '';
  const clinicFilter = document.getElementById('patient-clinic-filter')?.value || '';
  let patients = store.getPatients();
  if (search) patients = patients.filter(p => p.name.toLowerCase().includes(search) || p.phone.includes(search) || p.specialty.toLowerCase().includes(search));
  if (stageFilter) patients = patients.filter(p => p.stage === stageFilter);
  if (clinicFilter) patients = patients.filter(p => p.clinic === clinicFilter);

  const tbody = document.getElementById('patients-tbody');
  if (!tbody) return;
  const colors = ['#6C63FF', '#00B4D8', '#2EC4B6', '#F4A261', '#E76F51', '#8B5CF6'];

  tbody.innerHTML = patients.map(p => {
    const stageInfo = getStageInfo(p.stage);
    const initials = p.name.split(' ').map(n => n[0]).join('').slice(0, 2);
    const tags = p.tags.slice(0, 2).map(t => { const info = getTagInfo(t); return `<span class="tag" style="background:${info.color}">${info.name}</span>`; }).join('');
    return `
      <tr>
        <td onclick="openPatientModal(${p.id})" style="cursor:pointer">
          <div class="patient-name-cell">
            <div class="patient-avatar" style="background:${colors[p.id % colors.length]};width:32px;height:32px;font-size:12px">${initials}</div>
            <div><div class="name">${p.name}</div><div class="phone">${p.phone}</div></div>
          </div>
        </td>
        <td>${p.specialty}</td><td>${p.clinic}</td>
        <td><span class="stage-badge" style="color:${stageInfo?.color || '#fff'}">${stageInfo?.icon || ''} ${stageInfo?.name || ''}</span></td>
        <td><div style="display:flex;gap:4px">${tags}</div></td>
        <td>${formatDateBR(p.lastContact)}</td>
        <td>
          <div class="appointment-actions">
            <button title="Agendar" onclick="openAppointmentForm(null,${p.id})">📅</button>
            <button title="Editar" onclick="openPatientForm(${p.id})">✏️</button>
            <button title="Excluir" onclick="confirmDeletePatient(${p.id})">🗑️</button>
          </div>
        </td>
      </tr>`;
  }).join('');
}

function confirmDeletePatient(id) {
  const p = store.getPatientById(id);
  if (p && confirm(`Excluir o paciente "${p.name}"? Esta ação não pode ser desfeita.`)) {
    store.deletePatient(id);
    renderPage();
  }
}

// ============================================
// PATIENT DETAIL MODAL
// ============================================
function openPatientModal(patientId) {
  const p = store.getPatientById(patientId);
  if (!p) return;
  selectedPatient = p;
  const stageInfo = getStageInfo(p.stage);
  const initials = p.name.split(' ').map(n => n[0]).join('').slice(0, 2);
  const colors = ['#6C63FF', '#00B4D8', '#2EC4B6', '#F4A261', '#E76F51', '#8B5CF6'];
  const tags = p.tags.map(t => { const info = getTagInfo(t); return `<span class="tag" style="background:${info.color}">${info.name}</span>`; }).join('');
  const timeline = p.history.map(h => `
    <div class="timeline-item ${h.type}">
      <span class="timeline-type">${h.type}</span>
      <span class="timeline-date">${formatDateBR(h.date)}</span>
      <p class="timeline-desc">${h.desc}</p>
    </div>`).join('');

  // Patient appointments
  const appts = store.getAppointments().filter(a => a.patientId === p.id);
  const apptsHtml = appts.length > 0 ? appts.map(a => `
    <div class="appointment-item" style="margin-bottom:6px">
      <div class="appointment-time"><div class="time">${a.time}</div><div class="duration">${formatDateBR(a.date)}</div></div>
      <div class="appointment-divider" style="background:var(--accent-blue)"></div>
      <div class="appointment-details"><h4>${a.type}</h4><p>${a.doctor} • ${a.clinic}</p></div>
      <span class="appointment-status ${a.status}">${a.status === 'confirmado' ? '✅' : '⏳'}</span>
    </div>`).join('') : '<p style="color:var(--text-muted);font-size:13px">Nenhum agendamento</p>';

  const hasChatwoot = ChatwootAPI.isConfigured();

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-header">
      <h2>Perfil do Paciente</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <div class="patient-detail-header">
        <div class="patient-detail-avatar" style="background:${colors[p.id % colors.length]}">${initials}</div>
        <div class="patient-detail-info">
          <h3>${p.name}</h3>
          <p>${p.specialty} • ${p.clinic}</p>
          <div style="display:flex;gap:4px;margin-top:8px">${tags}</div>
        </div>
        <div style="margin-left:auto;display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn btn-primary" onclick="closeModal();openAppointmentForm(null,${p.id})" style="font-size:12px">📅 Agendar</button>
          <button class="btn btn-secondary" onclick="closeModal();openPatientForm(${p.id})" style="font-size:12px">✏️ Editar</button>
        </div>
      </div>

      ${hasChatwoot ? `
      <div class="cw-tabs">
        <button class="cw-tab active" onclick="switchPatientTab('dados', this)">📋 Dados</button>
        <button class="cw-tab" onclick="switchPatientTab('conversas', this);loadPatientConversations(${p.id})">💬 Conversas</button>
      </div>` : ''}

      <div id="patient-tab-dados" class="patient-tab-content active">
        <div class="patient-detail-grid">
          <div class="detail-field"><div class="detail-label">Telefone</div><div class="detail-value">${p.phone}</div></div>
          <div class="detail-field"><div class="detail-label">Email</div><div class="detail-value">${p.email}</div></div>
          <div class="detail-field"><div class="detail-label">Idade / Gênero</div><div class="detail-value">${p.age} anos • ${p.gender === 'M' ? 'Masculino' : 'Feminino'}</div></div>
          <div class="detail-field"><div class="detail-label">CPF</div><div class="detail-value">${p.cpf}</div></div>
          <div class="detail-field"><div class="detail-label">Etapa Atual</div><div class="detail-value">${stageInfo?.icon} ${stageInfo?.name}</div></div>
          <div class="detail-field"><div class="detail-label">Cadastrado em</div><div class="detail-value">${formatDateBR(p.createdAt)}</div></div>
        </div>
        <div class="detail-field" style="margin-bottom:20px"><div class="detail-label">Observações</div><div class="detail-value">${p.notes || 'Sem observações'}</div></div>
        
        <div class="section-header"><span class="section-title">📅 Agendamentos</span></div>
        <div style="margin-bottom:20px">${apptsHtml}</div>

        <div class="section-header"><span class="section-title">📋 Histórico de Atendimentos</span></div>
        <div class="timeline">${timeline}</div>
      </div>

      ${hasChatwoot ? `
      <div id="patient-tab-conversas" class="patient-tab-content">
        <div id="cw-conversations">
          <div class="cw-empty">
            <div class="cw-empty-icon">💬</div>
            <p>Clique na aba "Conversas" para carregar.</p>
          </div>
        </div>
      </div>` : ''}
    </div>`;
  selectedPatient = p.id;
  document.getElementById('modal-overlay').classList.add('active');
}

function switchPatientTab(tabId, btn) {
  document.querySelectorAll('.cw-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.patient-tab-content').forEach(t => t.classList.remove('active'));
  btn.classList.add('active');
  const tabEl = document.getElementById(`patient-tab-${tabId}`);
  if (tabEl) tabEl.classList.add('active');
}


function closeModal() {
  document.getElementById('modal-overlay').classList.remove('active');
  selectedPatient = null;
}

// ============================================
// PATIENT FORM (Create / Edit)
// ============================================
function openPatientForm(patientId) {
  const p = patientId ? store.getPatientById(patientId) : null;
  editingPatient = p;
  const isEdit = !!p;

  const tagCheckboxes = (category, catName) => {
    return TAGS[category].map(t => {
      const checked = p && p.tags.includes(t.id) ? 'checked' : '';
      return `<label class="form-checkbox"><input type="checkbox" name="tags" value="${t.id}" ${checked}><span class="tag" style="background:${t.color}">${t.name}</span></label>`;
    }).join('');
  };

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-header">
      <h2>${isEdit ? '✏️ Editar Paciente' : '👤 Novo Paciente'}</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <form id="patient-form" onsubmit="savePatient(event)">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Nome Completo *</label>
            <input type="text" class="form-input" name="name" value="${p?.name || ''}" required placeholder="Ex: Maria Silva">
          </div>
          <div class="form-group">
            <label class="form-label">Telefone *</label>
            <input type="text" class="form-input" name="phone" value="${p?.phone || ''}" required placeholder="+55 11 99999-0000">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" name="email" value="${p?.email || ''}" placeholder="paciente@email.com">
          </div>
          <div class="form-group">
            <label class="form-label">CPF</label>
            <input type="text" class="form-input" name="cpf" value="${p?.cpf || ''}" placeholder="000.000.000-00">
          </div>
          <div class="form-group">
            <label class="form-label">Idade</label>
            <input type="number" class="form-input" name="age" value="${p?.age || ''}" min="0" max="120" placeholder="Ex: 45">
          </div>
          <div class="form-group">
            <label class="form-label">Gênero</label>
            <select class="form-input" name="gender">
              <option value="F" ${p?.gender === 'F' ? 'selected' : ''}>Feminino</option>
              <option value="M" ${p?.gender === 'M' ? 'selected' : ''}>Masculino</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Clínica *</label>
            <select class="form-input" name="clinic" required>
              <option value="">Selecione...</option>
              ${CLINICS.map(c => `<option value="${c}" ${p?.clinic === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Especialidade *</label>
            <select class="form-input" name="specialty" required>
              <option value="">Selecione...</option>
              ${SPECIALTIES.map(s => `<option value="${s}" ${p?.specialty === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Etapa do Pipeline</label>
            <select class="form-input" name="stage">
              ${PIPELINE_STAGES.map(s => `<option value="${s.id}" ${p?.stage === s.id ? 'selected' : ''}>${s.icon} ${s.name}</option>`).join('')}
            </select>
          </div>
        </div>

        <div class="form-group" style="margin-top:16px">
          <label class="form-label">Observações</label>
          <textarea class="form-input form-textarea" name="notes" rows="3" placeholder="Observações sobre o paciente...">${p?.notes || ''}</textarea>
        </div>

        <div class="form-group" style="margin-top:16px">
          <label class="form-label">Tags — Especialidade</label>
          <div class="form-tags">${tagCheckboxes('especialidade')}</div>
        </div>
        <div class="form-group" style="margin-top:8px">
          <label class="form-label">Tags — Clínica</label>
          <div class="form-tags">${tagCheckboxes('clinica')}</div>
        </div>
        <div class="form-group" style="margin-top:8px">
          <label class="form-label">Tags — Prioridade</label>
          <div class="form-tags">${tagCheckboxes('prioridade')}</div>
        </div>

        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? '💾 Salvar Alterações' : '✅ Cadastrar Paciente'}</button>
        </div>
      </form>
    </div>`;
  document.getElementById('modal-overlay').classList.add('active');
}

function savePatient(e) {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const tags = Array.from(form.querySelectorAll('input[name="tags"]:checked')).map(cb => cb.value);

  const data = {
    name: fd.get('name'),
    phone: fd.get('phone'),
    email: fd.get('email') || '',
    cpf: fd.get('cpf') || '',
    age: parseInt(fd.get('age')) || 0,
    gender: fd.get('gender'),
    clinic: fd.get('clinic'),
    specialty: fd.get('specialty'),
    stage: fd.get('stage'),
    notes: fd.get('notes') || '',
    tags
  };

  if (editingPatient) {
    store.updatePatient(editingPatient.id, data);
  } else {
    store.addPatient(data);
  }

  closeModal();
  renderPage();
  editingPatient = null;
}

// ============================================
// APPOINTMENT FORM (Create / Edit)
// ============================================
function openAppointmentForm(apptId, preselectedPatientId) {
  const a = apptId ? store.getAppointmentById(apptId) : null;
  editingAppointment = a;
  const isEdit = !!a;
  const patients = store.getPatients();
  const selPatientId = a?.patientId || preselectedPatientId || '';

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-header">
      <h2>${isEdit ? '✏️ Editar Agendamento' : '📅 Novo Agendamento'}</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <form id="appointment-form" onsubmit="saveAppointment(event)">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Paciente *</label>
            <select class="form-input" name="patientId" required onchange="autofillApptFields(this)">
              <option value="">Selecione o paciente...</option>
              ${patients.map(p => `<option value="${p.id}" ${p.id == selPatientId ? 'selected' : ''}>${p.name} — ${p.phone}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Serviço *</label>
            <select class="form-input" name="type" required>
              ${store.getServices().map(s => { const cat = SERVICE_CATEGORIES.find(c => c.id === s.category); return `<option value="${s.name}" ${a?.type === s.name ? 'selected' : ''}>${cat?.icon || ''} ${s.name} (${s.duration}min)</option>`; }).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Data *</label>
            <input type="date" class="form-input" name="date" value="${a?.date || todayISO()}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Horário *</label>
            <input type="time" class="form-input" name="time" value="${a?.time || '09:00'}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Duração (min)</label>
            <select class="form-input" name="duration">
              <option value="15" ${a?.duration === 15 ? 'selected' : ''}>15 min</option>
              <option value="30" ${!a || a?.duration === 30 ? 'selected' : ''}>30 min</option>
              <option value="45" ${a?.duration === 45 ? 'selected' : ''}>45 min</option>
              <option value="60" ${a?.duration === 60 ? 'selected' : ''}>60 min</option>
              <option value="90" ${a?.duration === 90 ? 'selected' : ''}>90 min</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Clínica *</label>
            <select class="form-input" name="clinic" id="appt-clinic" required>
              <option value="">Selecione...</option>
              ${CLINICS.map(c => `<option value="${c}" ${a?.clinic === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Médico *</label>
            <select class="form-input" name="doctor" required>
              <option value="">Selecione...</option>
              ${store.getDoctors().map(d => `<option value="${d.name}" ${a?.doctor === d.name ? 'selected' : ''}>${d.name} — ${d.specialty}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Status</label>
            <select class="form-input" name="status">
              <option value="pendente" ${!a || a?.status === 'pendente' ? 'selected' : ''}>⏳ Pendente</option>
              <option value="confirmado" ${a?.status === 'confirmado' ? 'selected' : ''}>✅ Confirmado</option>
            </select>
          </div>
        </div>
        <div class="form-group" style="margin-top:16px">
          <label class="form-label">Observações</label>
          <textarea class="form-input form-textarea" name="notes" rows="2" placeholder="Observações sobre o agendamento...">${a?.notes || ''}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? '💾 Salvar' : '✅ Agendar'}</button>
        </div>
      </form>
    </div>`;

  // Auto-fill clinic if patient is preselected
  if (selPatientId) {
    const selPatient = store.getPatientById(parseInt(selPatientId));
    if (selPatient && !a) {
      const clinicSel = document.getElementById('appt-clinic');
      if (clinicSel) clinicSel.value = selPatient.clinic;
    }
  }

  document.getElementById('modal-overlay').classList.add('active');
}

function autofillApptFields(select) {
  const patientId = parseInt(select.value);
  const patient = store.getPatientById(patientId);
  if (patient) {
    const clinicSel = document.getElementById('appt-clinic');
    if (clinicSel) clinicSel.value = patient.clinic;
  }
}

function saveAppointment(e) {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const patientId = parseInt(fd.get('patientId'));
  const patient = store.getPatientById(patientId);

  const data = {
    patientId,
    patientName: patient?.name || 'Paciente',
    date: fd.get('date'),
    time: fd.get('time'),
    duration: parseInt(fd.get('duration')),
    type: fd.get('type'),
    clinic: fd.get('clinic'),
    doctor: fd.get('doctor'),
    status: fd.get('status'),
    notes: fd.get('notes') || ''
  };

  if (editingAppointment) {
    store.updateAppointment(editingAppointment.id, data);
  } else {
    store.addAppointment(data);
    // Add history entry to patient
    if (patient) {
      store.addHistoryEntry(patientId, { type: 'agendamento', desc: `${data.type} agendado — ${data.doctor} • ${data.clinic}` });
    }
  }

  closeModal();
  renderPage();
  editingAppointment = null;
}

// ============================================
// REPORTS
// ============================================
function renderReports(container) {
  const kpis = store.getKPIs();
  const monthly = store.getMonthlyData();

  container.innerHTML = `
    <div class="kpi-grid" style="margin-bottom:24px">
      <div class="kpi-card blue"><div class="kpi-header"><div class="kpi-icon">👥</div><span class="kpi-label">Total Pacientes</span></div><div class="kpi-value">${kpis.totalPatients}</div></div>
      <div class="kpi-card green"><div class="kpi-header"><div class="kpi-icon">✅</div><span class="kpi-label">Concluídos</span></div><div class="kpi-value">${kpis.completed}</div></div>
      <div class="kpi-card orange"><div class="kpi-header"><div class="kpi-icon">🚨</div><span class="kpi-label">Urgentes</span></div><div class="kpi-value">${kpis.urgentPatients}</div></div>
      <div class="kpi-card purple"><div class="kpi-header"><div class="kpi-icon">📈</div><span class="kpi-label">Taxa de Conclusão</span></div><div class="kpi-value">${kpis.conversionRate}%</div></div>
    </div>
    <div class="charts-grid">
      <div class="chart-container animate-in"><div class="chart-title">📊 Pacientes por Etapa do Funil</div><div class="bar-chart" id="report-stage-chart"></div></div>
      <div class="chart-container animate-in" style="animation-delay:100ms"><div class="chart-title">🏥 Pacientes por Clínica</div><div class="bar-chart" id="report-clinic-chart"></div></div>
      <div class="chart-container animate-in" style="animation-delay:200ms"><div class="chart-title">🩺 Pacientes por Especialidade</div><div class="bar-chart" id="report-specialty-chart"></div></div>
      <div class="chart-container animate-in" style="animation-delay:300ms"><div class="chart-title">📈 Novos Pacientes por Mês</div><div id="report-monthly-chart" style="display:flex;align-items:flex-end;gap:12px;height:200px;padding-top:20px"></div></div>
    </div>
    <div style="text-align:center;margin-top:16px">
      <button class="btn btn-primary" onclick="exportCSV()" style="font-size:13px;padding:10px 24px">📥 Exportar Relatório CSV</button>
    </div>
  `;
  renderBarChart('report-stage-chart', kpis.stageCounts, ['#6C63FF', '#00B4D8', '#F4A261', '#2EC4B6', '#06D6A0', '#E76F51']);
  renderBarChart('report-clinic-chart', kpis.clinicCounts, ['#6C63FF', '#00B4D8', '#2EC4B6', '#F4A261']);
  renderBarChart('report-specialty-chart', kpis.specialtyCounts, ['#FF6B6B', '#EE5A24', '#F9CA24', '#A29BFE', '#FD79A8', '#00CEC9']);
  renderMonthlyChart(monthly);
}

function renderBarChart(elId, data, colors) {
  const el = document.getElementById(elId);
  if (!el) return;
  const maxVal = Math.max(...Object.values(data), 1);
  el.innerHTML = Object.entries(data).map(([name, count], i) => `
    <div class="bar-row"><span class="bar-label">${name}</span><div class="bar-track"><div class="bar-fill" style="width:${(count / maxVal) * 100}%;background:${colors[i % colors.length]}"><span>${count}</span></div></div></div>
  `).join('');
}

function renderMonthlyChart(data) {
  const el = document.getElementById('report-monthly-chart');
  if (!el) return;
  const maxVal = Math.max(...data.map(d => d.novos), 1);
  el.innerHTML = data.map(d => `
    <div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px">
      <div style="display:flex;gap:4px;align-items:flex-end;height:160px;width:100%">
        <div style="flex:1;height:${(d.novos / maxVal) * 100}%;background:var(--gradient-primary);border-radius:4px 4px 0 0;min-height:8px" title="Novos: ${d.novos}"></div>
        <div style="flex:1;height:${(d.concluidos / maxVal) * 100}%;background:var(--gradient-success);border-radius:4px 4px 0 0;min-height:8px" title="Concluídos: ${d.concluidos}"></div>
      </div>
      <span style="font-size:11px;color:var(--text-muted)">${d.month}</span>
    </div>
  `).join('');
}

function exportCSV() {
  const patients = store.getPatients();
  const header = 'Nome,Telefone,Email,CPF,Idade,Gênero,Clínica,Especialidade,Etapa,Cadastrado,Último Contato\n';
  const rows = patients.map(p => {
    const stage = getStageInfo(p.stage);
    return `"${p.name}","${p.phone}","${p.email}","${p.cpf}",${p.age},"${p.gender}","${p.clinic}","${p.specialty}","${stage?.name || ''}","${p.createdAt}","${p.lastContact}"`;
  }).join('\n');
  const blob = new Blob(['\ufeff' + header + rows], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `relatorio_pacientes_${todayISO()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// ============================================
// DOCTORS MANAGEMENT
// ============================================
function renderDoctors(container) {
  const doctors = store.getDoctors();
  container.innerHTML = `
    <div class="patients-toolbar">
      <div class="filter-group"><span style="font-size:14px;font-weight:600;color:var(--text-primary)">👨‍⚕️ ${doctors.length} médico(s) cadastrados</span></div>
      <button class="btn btn-primary" onclick="openDoctorForm()">+ Novo Médico</button>
    </div>
    <div class="config-cards">
      ${doctors.map(d => {
    const initials = d.name.replace(/Dr\.?a?\s*/i, '').split(' ').map(n => n[0]).join('').slice(0, 2);
    const colors = ['#6C63FF', '#00B4D8', '#2EC4B6', '#F4A261', '#E76F51', '#8B5CF6'];
    const avail = store.getAvailabilityByDoctor(d.id);
    return `
        <div class="config-card animate-in">
          <div class="config-card-header">
            <div class="patient-avatar" style="background:${colors[d.id % colors.length]};width:44px;height:44px;font-size:16px">${initials}</div>
            <div class="config-card-info">
              <h3>${d.name}</h3>
              <p>${d.crm} • ${d.specialty}</p>
              <p style="font-size:11px;color:var(--text-muted);margin-top:4px">📱 ${d.phone} | ✉️ ${d.email}</p>
            </div>
            <div class="appointment-actions">
              <button title="Horários" onclick="navigateTo('availability')">📅</button>
              <button title="Editar" onclick="openDoctorForm(${d.id})">✏️</button>
              <button title="Excluir" onclick="confirmDeleteDoctor(${d.id})">🗑️</button>
            </div>
          </div>
          <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:12px">
            ${d.clinics.map(c => `<span class="tag" style="background:#6C63FF">${c}</span>`).join('')}
          </div>
          <div style="margin-top:10px;font-size:11px;color:var(--text-muted)">📅 ${avail.length} horário(s) configurados</div>
        </div>`;
  }).join('')}
      ${doctors.length === 0 ? '<div class="empty-state"><div class="empty-icon">👨‍⚕️</div><p>Nenhum médico cadastrado. Clique em "+ Novo Médico".</p></div>' : ''}
    </div>`;
}

function openDoctorForm(doctorId) {
  const d = doctorId ? store.getDoctorById(doctorId) : null;
  const isEdit = !!d;
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-header">
      <h2>${isEdit ? '✏️ Editar Médico' : '👨‍⚕️ Novo Médico'}</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <form id="doctor-form" onsubmit="saveDoctor(event, ${doctorId || 'null'})">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Nome Completo *</label>
            <input type="text" class="form-input" name="name" value="${d?.name || ''}" required placeholder="Dr. João Silva">
          </div>
          <div class="form-group">
            <label class="form-label">CRM *</label>
            <input type="text" class="form-input" name="crm" value="${d?.crm || ''}" required placeholder="CRM/SP 123456">
          </div>
          <div class="form-group">
            <label class="form-label">Especialidade *</label>
            <select class="form-input" name="specialty" required>
              <option value="">Selecione...</option>
              ${SPECIALTIES.map(s => `<option value="${s}" ${d?.specialty === s ? 'selected' : ''}>${s}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Telefone</label>
            <input type="text" class="form-input" name="phone" value="${d?.phone || ''}" placeholder="+55 11 99999-0000">
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" name="email" value="${d?.email || ''}" placeholder="medico@hospital.com">
          </div>
        </div>
        <div class="form-group" style="margin-top:16px">
          <label class="form-label">Clínicas onde atende *</label>
          <div class="form-tags">
            ${CLINICS.map(c => `<label class="form-checkbox"><input type="checkbox" name="clinics" value="${c}" ${d?.clinics?.includes(c) ? 'checked' : ''}><span class="tag" style="background:#6C63FF">${c}</span></label>`).join('')}
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? '💾 Salvar' : '✅ Cadastrar'}</button>
        </div>
      </form>
    </div>`;
  document.getElementById('modal-overlay').classList.add('active');
}

function saveDoctor(e, doctorId) {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const clinics = Array.from(form.querySelectorAll('input[name="clinics"]:checked')).map(cb => cb.value);
  if (clinics.length === 0) { alert('Selecione pelo menos uma clínica.'); return; }
  const data = { name: fd.get('name'), crm: fd.get('crm'), specialty: fd.get('specialty'), phone: fd.get('phone') || '', email: fd.get('email') || '', clinics };
  if (doctorId) store.updateDoctor(doctorId, data); else store.addDoctor(data);
  closeModal(); renderPage();
}

function confirmDeleteDoctor(id) {
  const d = store.getDoctorById(id);
  if (d && confirm(`Desativar o médico "${d.name}"?`)) { store.deleteDoctor(id); renderPage(); }
}

// ============================================
// SERVICES MANAGEMENT
// ============================================
function renderServices(container) {
  container.innerHTML = `
    <div class="patients-toolbar">
      <div class="filter-group">
        <select class="filter-select" id="service-cat-filter" onchange="filterServicesList()">
          <option value="">Todas Categorias</option>
          ${SERVICE_CATEGORIES.map(c => `<option value="${c.id}">${c.icon} ${c.name}</option>`).join('')}
        </select>
      </div>
      <button class="btn btn-primary" onclick="openServiceForm()">+ Novo Serviço</button>
    </div>
    <div class="config-cards" id="services-list"></div>`;
  filterServicesList();
}

function filterServicesList() {
  const catFilter = document.getElementById('service-cat-filter')?.value || '';
  let services = store.getServices();
  if (catFilter) services = services.filter(s => s.category === catFilter);
  const list = document.getElementById('services-list');
  if (!list) return;

  list.innerHTML = services.map(s => {
    const cat = SERVICE_CATEGORIES.find(c => c.id === s.category);
    return `
        <div class="config-card animate-in">
          <div class="config-card-header">
            <div class="patient-avatar" style="background:${cat?.color || '#666'};width:44px;height:44px;font-size:20px">${cat?.icon || '⚙️'}</div>
            <div class="config-card-info">
              <h3>${s.name}</h3>
              <p>${cat?.name || s.category} • ${s.duration} min</p>
              <p style="font-size:11px;color:var(--text-muted);margin-top:4px">${s.description || ''}</p>
            </div>
            <div style="text-align:right;margin-left:auto">
              <div style="font-size:18px;font-weight:700;color:var(--accent-green)">R$ ${s.price.toLocaleString('pt-BR')}</div>
              <div class="appointment-actions" style="margin-top:8px">
                <button title="Editar" onclick="openServiceForm(${s.id})">✏️</button>
                <button title="Excluir" onclick="confirmDeleteService(${s.id})">🗑️</button>
              </div>
            </div>
          </div>
        </div>`;
  }).join('');
  if (services.length === 0) list.innerHTML = '<div class="empty-state"><div class="empty-icon">🩺</div><p>Nenhum serviço cadastrado. Clique em "+ Novo Serviço".</p></div>';
}

function openServiceForm(serviceId) {
  const s = serviceId ? store.getServiceById(serviceId) : null;
  const isEdit = !!s;
  document.getElementById('modal-content').innerHTML = `
    <div class="modal-header">
      <h2>${isEdit ? '✏️ Editar Serviço' : '🩺 Novo Serviço'}</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <form id="service-form" onsubmit="saveService(event, ${serviceId || 'null'})">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Nome do Serviço *</label>
            <input type="text" class="form-input" name="name" value="${s?.name || ''}" required placeholder="Ex: Consulta Inicial">
          </div>
          <div class="form-group">
            <label class="form-label">Categoria *</label>
            <select class="form-input" name="category" required>
              ${SERVICE_CATEGORIES.map(c => `<option value="${c.id}" ${s?.category === c.id ? 'selected' : ''}>${c.icon} ${c.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Duração (min) *</label>
            <input type="number" class="form-input" name="duration" value="${s?.duration || 30}" required min="5" max="480" step="5">
          </div>
          <div class="form-group">
            <label class="form-label">Preço (R$)</label>
            <input type="number" class="form-input" name="price" value="${s?.price || 0}" min="0" step="0.01" placeholder="0.00">
          </div>
        </div>
        <div class="form-group" style="margin-top:16px">
          <label class="form-label">Descrição</label>
          <textarea class="form-input form-textarea" name="description" rows="2" placeholder="Descrição do serviço...">${s?.description || ''}</textarea>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? '💾 Salvar' : '✅ Cadastrar'}</button>
        </div>
      </form>
    </div>`;
  document.getElementById('modal-overlay').classList.add('active');
}

function saveService(e, serviceId) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = { name: fd.get('name'), category: fd.get('category'), duration: parseInt(fd.get('duration')), price: parseFloat(fd.get('price')) || 0, description: fd.get('description') || '' };
  if (serviceId) store.updateService(serviceId, data); else store.addService(data);
  closeModal(); renderPage();
}

function confirmDeleteService(id) {
  const s = store.getServiceById(id);
  if (s && confirm(`Desativar o serviço "${s.name}"?`)) { store.deleteService(id); renderPage(); }
}

// ============================================
// AVAILABILITY CALENDAR
// ============================================
let availWeekStart = getWeekStart(new Date());

function getWeekStart(date) {
  const d = new Date(date);
  const day = d.getDay();
  d.setDate(d.getDate() - day + 1); // Monday
  return d.toISOString().split('T')[0];
}

function renderAvailability(container) {
  const weekDates = [];
  const start = new Date(availWeekStart + 'T12:00:00');
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    weekDates.push(d.toISOString().split('T')[0]);
  }
  const dayNames = ['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'];
  const doctors = store.getDoctors();

  container.innerHTML = `
    <div class="calendar-header">
      <div class="calendar-nav">
        <button class="calendar-nav-btn" onclick="changeWeek(-1)">◀</button>
        <span class="calendar-month">📅 Semana: ${formatDateBR(weekDates[0])} — ${formatDateBR(weekDates[6])}</span>
        <button class="calendar-nav-btn" onclick="changeWeek(1)">▶</button>
      </div>
      <div style="display:flex;gap:8px">
        <select class="filter-select" id="avail-doctor-filter" onchange="renderAvailabilityGrid()">
          <option value="">Todos os Médicos</option>
          ${doctors.map(d => `<option value="${d.id}">${d.name}</option>`).join('')}
        </select>
        <button class="btn btn-primary" onclick="openAvailabilityForm()">+ Novo Horário</button>
      </div>
    </div>
    <div class="avail-grid" id="avail-grid">
      <div class="avail-header-row">
        <div class="avail-corner">Médico</div>
        ${weekDates.map((d, i) => {
    const dt = new Date(d + 'T12:00:00');
    const isToday = d === todayISO();
    return `<div class="avail-header-cell ${isToday ? 'today' : ''}">${dayNames[i]}<br><span>${dt.getDate()}</span></div>`;
  }).join('')}
      </div>
      <div id="avail-body"></div>
    </div>`;
  renderAvailabilityGrid();
}

function renderAvailabilityGrid() {
  const body = document.getElementById('avail-body');
  if (!body) return;
  const doctorFilter = document.getElementById('avail-doctor-filter')?.value || '';
  let doctors = store.getDoctors();
  if (doctorFilter) doctors = doctors.filter(d => d.id == doctorFilter);

  const weekDates = [];
  const start = new Date(availWeekStart + 'T12:00:00');
  for (let i = 0; i < 7; i++) {
    const d = new Date(start);
    d.setDate(d.getDate() + i);
    weekDates.push(d.toISOString().split('T')[0]);
  }
  const colors = ['#6C63FF', '#00B4D8', '#2EC4B6', '#F4A261', '#E76F51', '#8B5CF6'];

  body.innerHTML = doctors.map(doc => `
      <div class="avail-row">
        <div class="avail-doctor-cell">
          <div class="patient-avatar" style="background:${colors[doc.id % colors.length]};width:28px;height:28px;font-size:10px">${doc.name.replace(/Dr\.?a?\s*/i, '').split(' ').map(n => n[0]).join('').slice(0, 2)}</div>
          <div style="min-width:0">
            <div style="font-size:12px;font-weight:600;color:var(--text-primary);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${doc.name}</div>
            <div style="font-size:10px;color:var(--text-muted)">${doc.specialty}</div>
          </div>
        </div>
        ${weekDates.map(date => {
    const slots = store.getAvailableSlots(date, doc.id);
    if (slots.length === 0) {
      return `<div class="avail-cell empty" onclick="openAvailabilityForm(null,${doc.id},'${date}')"><span class="avail-add">+</span></div>`;
    }
    return `<div class="avail-cell">
            ${slots.map(slot => {
      const catIcons = slot.serviceCategories.map(c => SERVICE_CATEGORIES.find(sc => sc.id === c)?.icon || '').join('');
      return `<div class="avail-slot" onclick="openAvailabilityForm(${slot.id})" title="${slot.clinic}\n${slot.serviceCategories.join(', ')}">
                <span class="avail-time">${slot.startTime}-${slot.endTime}</span>
                <span class="avail-clinic">${slot.clinic.replace('Hospital ', 'H.').replace('Clínica ', 'Cl.')}</span>
                <span class="avail-cats">${catIcons}</span>
              </div>`;
    }).join('')}
          </div>`;
  }).join('')}
      </div>
    `).join('');
  if (doctors.length === 0) body.innerHTML = '<div class="empty-state" style="padding:40px"><div class="empty-icon">📅</div><p>Nenhum médico encontrado.</p></div>';
}

function changeWeek(direction) {
  const d = new Date(availWeekStart + 'T12:00:00');
  d.setDate(d.getDate() + (direction * 7));
  availWeekStart = d.toISOString().split('T')[0];
  renderPage();
}

function openAvailabilityForm(slotId, preDocId, preDate) {
  const s = slotId ? store.getAvailabilityById(slotId) : null;
  const isEdit = !!s;
  const doctors = store.getDoctors();

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-header">
      <h2>${isEdit ? '✏️ Editar Horário' : '📅 Novo Horário'}</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <form id="avail-form" onsubmit="saveAvailability(event, ${slotId || 'null'})">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Médico *</label>
            <select class="form-input" name="doctorId" required>
              <option value="">Selecione...</option>
              ${doctors.map(d => `<option value="${d.id}" ${(s?.doctorId === d.id || preDocId == d.id) ? 'selected' : ''}>${d.name}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Data *</label>
            <input type="date" class="form-input" name="date" value="${s?.date || preDate || todayISO()}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Início *</label>
            <input type="time" class="form-input" name="startTime" value="${s?.startTime || '08:00'}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Fim *</label>
            <input type="time" class="form-input" name="endTime" value="${s?.endTime || '12:00'}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Clínica *</label>
            <select class="form-input" name="clinic" required>
              <option value="">Selecione...</option>
              ${CLINICS.map(c => `<option value="${c}" ${s?.clinic === c ? 'selected' : ''}>${c}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-group" style="margin-top:16px">
          <label class="form-label">Tipos de atendimento disponíveis *</label>
          <div class="form-tags">
            ${SERVICE_CATEGORIES.map(c => `<label class="form-checkbox"><input type="checkbox" name="serviceCats" value="${c.id}" ${s?.serviceCategories?.includes(c.id) ? 'checked' : ''}><span class="tag" style="background:${c.color}">${c.icon} ${c.name}</span></label>`).join('')}
          </div>
        </div>
        <div class="form-actions">
          ${isEdit ? `<button type="button" class="btn" style="background:var(--accent-red);color:white;margin-right:auto" onclick="deleteAvailSlot(${slotId})">🗑️ Excluir</button>` : ''}
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">${isEdit ? '💾 Salvar' : '✅ Confirmar'}</button>
        </div>
      </form>
    </div>`;
  document.getElementById('modal-overlay').classList.add('active');
}

function saveAvailability(e, slotId) {
  e.preventDefault();
  const form = e.target;
  const fd = new FormData(form);
  const serviceCats = Array.from(form.querySelectorAll('input[name="serviceCats"]:checked')).map(cb => cb.value);
  if (serviceCats.length === 0) { alert('Selecione pelo menos um tipo de atendimento.'); return; }
  const data = {
    doctorId: parseInt(fd.get('doctorId')),
    date: fd.get('date'),
    startTime: fd.get('startTime'),
    endTime: fd.get('endTime'),
    clinic: fd.get('clinic'),
    serviceCategories: serviceCats
  };
  if (data.startTime >= data.endTime) { alert('O horário de início deve ser antes do horário de fim.'); return; }
  if (slotId) store.updateAvailability(slotId, data); else store.addAvailability(data);
  closeModal(); renderPage();
}

function deleteAvailSlot(id) {
  if (confirm('Excluir este horário?')) { store.deleteAvailability(id); closeModal(); renderPage(); }
}

// ============================================
// GLOBAL SEARCH
// ============================================
function handleGlobalSearch(e) {
  const query = e.target.value.trim();
  if (query.length >= 2 && currentPage !== 'patients') {
    navigateTo('patients');
    setTimeout(() => {
      const searchInput = document.getElementById('patient-search');
      if (searchInput) { searchInput.value = query; filterPatientTable(); }
    }, 100);
  }
}

// ============================================
// CHATWOOT CONFIG PAGE
// ============================================
function renderChatwootConfig(container) {
  const config = ChatwootAPI.getConfig() || {};
  const isConfigured = ChatwootAPI.isConfigured();

  container.innerHTML = `
    <div class="cw-config-page">
      <div class="cw-config-card animate-in">
        <div class="cw-config-header">
          <div class="cw-config-icon">💬</div>
          <div>
            <h2>Integração Chatwoot</h2>
            <p>Conecte o CRM com o Chatwoot para sincronizar contatos e conversas</p>
          </div>
          <div id="cw-connection-status" class="cw-connection-badge ${isConfigured ? 'checking' : 'offline'}">
            ${isConfigured ? '⏳ Verificando...' : '🔴 Desconectado'}
          </div>
        </div>

        <form id="cw-config-form" onsubmit="saveChatwootConfig(event)">
          <div class="form-grid">
            <div class="form-group">
              <label class="form-label">URL do Chatwoot *</label>
              <input type="url" class="form-input" name="baseUrl" value="${config.baseUrl || ''}" required placeholder="https://seu-chatwoot.example.com">
              <small class="form-hint">URL completa sem barra final</small>
            </div>
            <div class="form-group">
              <label class="form-label">Account ID *</label>
              <input type="text" class="form-input" name="accountId" value="${config.accountId || ''}" required placeholder="Ex: 2">
              <small class="form-hint">Número da conta no Chatwoot</small>
            </div>
            <div class="form-group" style="grid-column:1/-1">
              <label class="form-label">API Access Token *</label>
              <input type="password" class="form-input" name="apiToken" value="${config.apiToken || ''}" required placeholder="Seu token de acesso">
              <small class="form-hint">Gere em: Chatwoot → Profile Settings → Access Token</small>
            </div>
          </div>
          <div class="form-actions">
            <button type="button" class="btn btn-secondary" onclick="testChatwootConnection()">🔌 Testar Conexão</button>
            <button type="submit" class="btn btn-primary">💾 Salvar Configuração</button>
          </div>
        </form>
      </div>

      <div class="cw-config-card animate-in" style="animation-delay:100ms">
        <h3 style="margin-bottom:12px">ℹ️ Como funciona a integração</h3>
        <div class="cw-info-grid">
          <div class="cw-info-item">
            <div class="cw-info-icon">🔄</div>
            <div class="cw-info-text">
              <strong>Sincronização automática</strong>
              <p>Quando um contato é selecionado no Chatwoot, o CRM busca o paciente correspondente por telefone ou e-mail.</p>
            </div>
          </div>
          <div class="cw-info-item">
            <div class="cw-info-icon">💬</div>
            <div class="cw-info-text">
              <strong>Conversas no perfil</strong>
              <p>No perfil do paciente, você verá a aba "Conversas" com todo o histórico de mensagens do Chatwoot.</p>
            </div>
          </div>
          <div class="cw-info-item">
            <div class="cw-info-icon">📱</div>
            <div class="cw-info-text">
              <strong>Modo Dashboard App</strong>
              <p>Quando embutido no Chatwoot como Dashboard App, o CRM detecta automaticamente e adapta o layout.</p>
            </div>
          </div>
          <div class="cw-info-item">
            <div class="cw-info-icon">🏥</div>
            <div class="cw-info-text">
              <strong>Cadastro rápido</strong>
              <p>Se o contato do Chatwoot não existir no CRM, você pode cadastrá-lo com um clique.</p>
            </div>
          </div>
        </div>
      </div>

      ${isEmbeddedMode ? `
      <div class="cw-config-card animate-in" style="animation-delay:200ms;border-left:3px solid var(--accent-green)">
        <h3>✅ Modo Dashboard App ativo</h3>
        <p style="color:var(--text-muted);font-size:13px;margin-top:8px">O CRM está rodando dentro do Chatwoot como Dashboard App. A sincronização de contatos está ativa automaticamente.</p>
      </div>` : ''}
    </div>`;

  if (isConfigured) {
    testChatwootConnection(true);
  }
}

async function saveChatwootConfig(e) {
  e.preventDefault();
  const fd = new FormData(e.target);
  ChatwootAPI.saveConfig({
    baseUrl: fd.get('baseUrl'),
    accountId: fd.get('accountId'),
    apiToken: fd.get('apiToken')
  });
  await testChatwootConnection();
}

async function testChatwootConnection(silent = false) {
  const statusEl = document.getElementById('cw-connection-status');
  const dotEl = document.getElementById('cw-status-dot');

  if (statusEl) {
    statusEl.className = 'cw-connection-badge checking';
    statusEl.textContent = '⏳ Verificando...';
  }

  const result = await ChatwootAPI.testConnection();

  if (statusEl) {
    if (result.ok) {
      statusEl.className = 'cw-connection-badge online';
      statusEl.textContent = `🟢 Conectado — ${result.agent}`;
    } else {
      statusEl.className = 'cw-connection-badge offline';
      statusEl.textContent = `🔴 Erro: ${result.error}`;
    }
  }

  if (dotEl) {
    dotEl.className = `cw-status-indicator ${result.ok ? 'online' : 'offline'}`;
    dotEl.title = result.ok ? `Conectado: ${result.agent}` : 'Desconectado';
  }

  const headerBadge = document.getElementById('cw-header-badge');
  if (headerBadge) {
    headerBadge.classList.toggle('hidden', !result.ok);
  }

  if (!silent && !result.ok) {
    alert(`Falha na conexão com o Chatwoot:\n${result.error}`);
  }

  return result;
}

// ============================================
// CHATWOOT CONVERSATIONS IN PATIENT MODAL
// ============================================
async function loadPatientConversations(patientId) {
  if (!ChatwootAPI.isConfigured()) return;

  const patient = store.getPatientById(patientId);
  if (!patient) return;

  const conversationsDiv = document.getElementById('cw-conversations');
  if (!conversationsDiv) return;

  conversationsDiv.innerHTML = '<div class="cw-loading"><div class="cw-spinner"></div> Carregando conversas...</div>';

  try {
    let contact = null;

    // Try to find by linked ID first
    if (patient.chatwootContactId) {
      try {
        contact = await ChatwootAPI.getContact(patient.chatwootContactId);
      } catch { /* not found, search by phone */ }
    }

    // Fallback: search by phone
    if (!contact && patient.phone) {
      contact = await ChatwootAPI.findContactByPhone(patient.phone);
      if (contact) {
        store.linkPatientToChatwoot(patientId, contact.id);
      }
    }

    if (!contact) {
      conversationsDiv.innerHTML = `
              <div class="cw-empty">
                <div class="cw-empty-icon">🔍</div>
                <p>Nenhum contato encontrado no Chatwoot para este paciente.</p>
                <button class="btn btn-primary" style="margin-top:12px;font-size:12px" onclick="createChatwootContact(${patientId})">
                  ➕ Criar contato no Chatwoot
                </button>
              </div>`;
      return;
    }

    // Load conversations
    const conversations = await ChatwootAPI.getContactConversations(contact.id);

    if (conversations.length === 0) {
      conversationsDiv.innerHTML = `
              <div class="cw-empty">
                <div class="cw-empty-icon">💬</div>
                <p>Contato encontrado no Chatwoot, mas sem conversas.</p>
              </div>`;
      return;
    }

    conversationsDiv.innerHTML = conversations.map(conv => {
      const lastMsg = conv.messages && conv.messages.length > 0 ? conv.messages[conv.messages.length - 1] : null;
      const statusEmoji = conv.status === 'resolved' ? '✅' : conv.status === 'pending' ? '⏳' : '💬';
      const inboxName = conv.inbox_id ? `Inbox #${conv.inbox_id}` : '';
      const createdAt = conv.created_at ? new Date(conv.created_at * 1000).toLocaleDateString('pt-BR') : '';

      return `
            <div class="cw-conversation-card" onclick="openConversationMessages(${conv.id}, ${contact.id})">
              <div class="cw-conv-header">
                <span class="cw-conv-id">${statusEmoji} Conversa #${conv.id}</span>
                <span class="cw-conv-date">${createdAt}</span>
              </div>
              <div class="cw-conv-preview">${lastMsg?.content || 'Sem mensagens'}</div>
              <div class="cw-conv-meta">
                <span class="tag" style="background:${conv.status === 'resolved' ? '#06D6A0' : conv.status === 'pending' ? '#F4A261' : '#6C63FF'}">${conv.status || 'open'}</span>
                ${(conv.labels || []).map(l => `<span class="tag" style="background:#8B5CF6">${l}</span>`).join('')}
              </div>
            </div>`;
    }).join('');

  } catch (err) {
    conversationsDiv.innerHTML = `
          <div class="cw-empty">
            <div class="cw-empty-icon">⚠️</div>
            <p>Erro ao carregar conversas: ${err.message}</p>
          </div>`;
  }
}

async function openConversationMessages(conversationId, contactId) {
  const conversationsDiv = document.getElementById('cw-conversations');
  if (!conversationsDiv) return;

  conversationsDiv.innerHTML = '<div class="cw-loading"><div class="cw-spinner"></div> Carregando mensagens...</div>';

  try {
    const messages = await ChatwootAPI.getMessages(conversationId);

    const header = `
          <div class="cw-messages-header">
            <button class="btn btn-secondary" style="font-size:11px;padding:6px 12px" onclick="loadPatientConversations(${selectedPatient})">
              ← Voltar
            </button>
            <span style="font-weight:600;font-size:13px">Conversa #${conversationId}</span>
          </div>`;

    if (!messages || messages.length === 0) {
      conversationsDiv.innerHTML = header + '<div class="cw-empty"><p>Nenhuma mensagem encontrada.</p></div>';
      return;
    }

    const messagesHtml = messages.map(msg => {
      const isIncoming = msg.message_type === 0;
      const isActivity = msg.message_type === 2;
      const time = msg.created_at ? new Date(msg.created_at * 1000).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : '';
      const date = msg.created_at ? new Date(msg.created_at * 1000).toLocaleDateString('pt-BR') : '';

      if (isActivity) {
        return `<div class="cw-msg-activity">⚡ ${msg.content || 'Activity'} <span>${date} ${time}</span></div>`;
      }

      return `
            <div class="cw-msg ${isIncoming ? 'incoming' : 'outgoing'}">
              <div class="cw-msg-bubble">
                <div class="cw-msg-content">${msg.content || ''}</div>
                <div class="cw-msg-time">${date} ${time}</div>
              </div>
            </div>`;
    }).join('');

    conversationsDiv.innerHTML = header + `<div class="cw-messages-container">${messagesHtml}</div>`;

    // Scroll to bottom
    const msgContainer = conversationsDiv.querySelector('.cw-messages-container');
    if (msgContainer) msgContainer.scrollTop = msgContainer.scrollHeight;

  } catch (err) {
    conversationsDiv.innerHTML = `<div class="cw-empty"><p>Erro: ${err.message}</p></div>`;
  }
}

async function createChatwootContact(patientId) {
  const patient = store.getPatientById(patientId);
  if (!patient) return;

  try {
    const result = await ChatwootAPI.createContact({
      name: patient.name,
      phone_number: patient.phone,
      email: patient.email || undefined
    });
    if (result && result.payload && result.payload.contact) {
      store.linkPatientToChatwoot(patientId, result.payload.contact.id);
      alert('✅ Contato criado no Chatwoot!');
      loadPatientConversations(patientId);
    }
  } catch (err) {
    alert(`❌ Erro ao criar contato: ${err.message}`);
  }
}

function openChatwootConversation() {
  // If we have a patient selected and Chatwoot is configured, open conversations
  if (selectedPatient && ChatwootAPI.isConfigured()) {
    openPatientModal(selectedPatient);
  } else if (ChatwootAPI.isConfigured()) {
    // Navigate to patients page
    navigateTo('patients');
  } else {
    navigateTo('chatwoot-config');
  }
}

// ============================================
// CHATWOOT BRIDGE INTEGRATION
// ============================================
function handleChatwootContactChanged(contact) {
  if (!contact) return;
  console.log('[CRM] Chatwoot contact changed:', contact.name, contact.phone);

  chatwootContact = contact;

  // Try to find matching patient
  let patient = store.findPatientByChatwootId(contact.id);
  if (!patient) patient = store.findPatientByPhone(contact.phone);
  if (!patient && contact.email) patient = store.findPatientByEmail(contact.email);

  if (patient) {
    // Link if not linked yet
    if (!patient.chatwootContactId) {
      store.linkPatientToChatwoot(patient.id, contact.id);
    }
    // Auto-open patient modal or navigate to patient
    openPatientModal(patient.id);
  } else {
    // Show notification to create patient
    showChatwootNewPatientBanner(contact);
  }
}

function showChatwootNewPatientBanner(contact) {
  const content = document.getElementById('page-content');
  // Prepend banner
  const banner = document.createElement('div');
  banner.className = 'cw-new-patient-banner animate-in';
  banner.id = 'cw-new-patient-banner';
  banner.innerHTML = `
      <div class="cw-banner-content">
        <span class="cw-banner-icon">👤</span>
        <div>
          <strong>Novo contato do Chatwoot: ${contact.name || 'Sem nome'}</strong>
          <p style="margin:0;font-size:12px;color:var(--text-muted)">📱 ${contact.phoneRaw || contact.phone || '—'} | 📧 ${contact.email || '—'}</p>
        </div>
        <button class="btn btn-primary" style="font-size:11px;padding:6px 16px;margin-left:auto" onclick="quickCreateFromChatwoot()">
          ➕ Cadastrar como Paciente
        </button>
        <button class="cw-banner-close" onclick="document.getElementById('cw-new-patient-banner')?.remove()">✕</button>
      </div>`;

  // Remove existing
  document.getElementById('cw-new-patient-banner')?.remove();
  content.prepend(banner);
}

function quickCreateFromChatwoot() {
  if (!chatwootContact) return;
  // Open patient form pre-filled
  editingPatient = null;
  const c = chatwootContact;

  document.getElementById('modal-content').innerHTML = `
    <div class="modal-header">
      <h2>👤 Novo Paciente (via Chatwoot)</h2>
      <button class="modal-close" onclick="closeModal()">✕</button>
    </div>
    <div class="modal-body">
      <form id="patient-form" onsubmit="savePatientFromChatwoot(event, ${c.id})">
        <div class="form-grid">
          <div class="form-group">
            <label class="form-label">Nome Completo *</label>
            <input type="text" class="form-input" name="name" value="${c.name || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Telefone *</label>
            <input type="text" class="form-input" name="phone" value="${c.phoneRaw || c.phone || ''}" required>
          </div>
          <div class="form-group">
            <label class="form-label">Email</label>
            <input type="email" class="form-input" name="email" value="${c.email || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">CPF</label>
            <input type="text" class="form-input" name="cpf" value="" placeholder="000.000.000-00">
          </div>
          <div class="form-group">
            <label class="form-label">Idade</label>
            <input type="number" class="form-input" name="age" value="" min="0" max="120">
          </div>
          <div class="form-group">
            <label class="form-label">Gênero</label>
            <select class="form-input" name="gender"><option value="F">Feminino</option><option value="M">Masculino</option></select>
          </div>
          <div class="form-group">
            <label class="form-label">Clínica *</label>
            <select class="form-input" name="clinic" required>
              <option value="">Selecione...</option>
              ${CLINICS.map(cl => `<option value="${cl}">${cl}</option>`).join('')}
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Especialidade *</label>
            <select class="form-input" name="specialty" required>
              <option value="">Selecione...</option>
              ${SPECIALTIES.map(s => `<option value="${s}">${s}</option>`).join('')}
            </select>
          </div>
        </div>
        <div class="form-actions">
          <button type="button" class="btn btn-secondary" onclick="closeModal()">Cancelar</button>
          <button type="submit" class="btn btn-primary">✅ Cadastrar Paciente</button>
        </div>
      </form>
    </div>`;
  document.getElementById('modal-overlay').classList.add('active');
  document.getElementById('cw-new-patient-banner')?.remove();
}

function savePatientFromChatwoot(e, chatwootContactId) {
  e.preventDefault();
  const fd = new FormData(e.target);
  const data = {
    name: fd.get('name'),
    phone: fd.get('phone'),
    email: fd.get('email') || '',
    cpf: fd.get('cpf') || '',
    age: parseInt(fd.get('age')) || 0,
    gender: fd.get('gender'),
    clinic: fd.get('clinic'),
    specialty: fd.get('specialty'),
    stage: 'primeiro-contato',
    notes: 'Paciente criado a partir do Chatwoot',
    tags: [],
    chatwootContactId: chatwootContactId
  };
  const newPatient = store.addPatient(data);
  closeModal();
  openPatientModal(newPatient.id);
}

// ============================================
// EMBEDDED MODE
// ============================================
function initEmbeddedMode() {
  isEmbeddedMode = true;
  document.body.classList.add('embedded-mode');
  console.log('[CRM] Embedded mode activated');
}

// ============================================
// INIT
// ============================================
document.addEventListener('DOMContentLoaded', () => {
  // Detect embedded mode
  const embedded = ChatwootBridge.init();
  if (embedded) initEmbeddedMode();

  // Listen for Chatwoot events
  ChatwootBridge.on('contact-changed', handleChatwootContactChanged);

  // Auto-configure Chatwoot credentials (always update to ensure correct token)
  ChatwootAPI.saveConfig({
    baseUrl: 'https://saudedigital-chatwoot.6hqqfw.easypanel.host',
    accountId: '2',
    apiToken: 'QZYoPfb55VNBkrmZdHHB8VBx'
  });
  console.log('[CRM] Chatwoot configured with default credentials');

  renderPage();
  document.getElementById('modal-overlay').addEventListener('click', (e) => { if (e.target === e.currentTarget) closeModal(); });
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

  // Test Chatwoot connection on load (silent)
  if (ChatwootAPI.isConfigured()) {
    testChatwootConnection(true);
  }
});
