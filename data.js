// ============================================
// CRM Healthcare - Camada de Dados (com Persistência)
// ============================================

const STORAGE_KEYS = {
  patients: 'crm_patients',
  appointments: 'crm_appointments',
  activities: 'crm_activities',
  doctors: 'crm_doctors',
  services: 'crm_services',
  availability: 'crm_availability'
};

const PIPELINE_STAGES = [
  { id: 'primeiro-contato', name: 'Primeiro Contato', icon: '📞', color: '#6C63FF' },
  { id: 'triagem', name: 'Triagem', icon: '📋', color: '#00B4D8' },
  { id: 'agendado', name: 'Agendado', icon: '📅', color: '#F4A261' },
  { id: 'em-tratamento', name: 'Em Tratamento', icon: '🏥', color: '#2EC4B6' },
  { id: 'concluido', name: 'Concluído', icon: '✅', color: '#06D6A0' },
  { id: 'retorno', name: 'Retorno', icon: '🔄', color: '#E76F51' }
];

const TAGS = {
  especialidade: [
    { id: 'dor-cronica', name: 'Dor Crônica', color: '#FF6B6B' },
    { id: 'dor-aguda', name: 'Dor Aguda', color: '#EE5A24' },
    { id: 'pos-operatorio', name: 'Pós-operatório', color: '#F9CA24' },
    { id: 'fibromialgia', name: 'Fibromialgia', color: '#A29BFE' },
    { id: 'cefaleia', name: 'Cefaleia', color: '#FD79A8' },
    { id: 'lombalgia', name: 'Lombalgia', color: '#00CEC9' }
  ],
  clinica: [
    { id: 'hospital-central', name: 'Hospital Central', color: '#6C63FF' },
    { id: 'clinica-norte', name: 'Clínica Norte', color: '#00B4D8' },
    { id: 'clinica-sul', name: 'Clínica Sul', color: '#2EC4B6' },
    { id: 'clinica-leste', name: 'Clínica Leste', color: '#F4A261' }
  ],
  prioridade: [
    { id: 'urgente', name: 'Urgente', color: '#FF3838' },
    { id: 'normal', name: 'Normal', color: '#3742fa' },
    { id: 'retorno-tag', name: 'Retorno', color: '#2ed573' }
  ],
  tipo: [
    { id: 'primeira-consulta', name: 'Primeira Consulta', color: '#6C63FF' },
    { id: 'retorno-tipo', name: 'Retorno', color: '#F4A261' },
    { id: 'procedimento', name: 'Procedimento', color: '#E76F51' },
    { id: 'exame', name: 'Exame', color: '#00B4D8' }
  ]
};

const CLINICS = ['Hospital Central', 'Clínica Norte', 'Clínica Sul', 'Clínica Leste'];
const SPECIALTIES = ['Dor Crônica', 'Dor Aguda', 'Pós-operatório', 'Fibromialgia', 'Cefaleia', 'Lombalgia'];

const SERVICE_CATEGORIES = [
  { id: 'consulta', name: 'Consulta', icon: '🩺', color: '#6C63FF' },
  { id: 'retorno', name: 'Retorno', icon: '🔄', color: '#F4A261' },
  { id: 'exame', name: 'Exame', icon: '🔬', color: '#00B4D8' },
  { id: 'procedimento', name: 'Procedimento', icon: '💉', color: '#2EC4B6' },
  { id: 'cirurgia', name: 'Cirurgia', icon: '🏥', color: '#E76F51' }
];

const DEFAULT_DOCTORS = [
  { id: 1, name: 'Dr. Paulo Henrique', crm: 'CRM/SP 123456', specialty: 'Dor Crônica', phone: '+55 11 99999-2001', email: 'paulo.h@hospital.com', clinics: ['Hospital Central'], active: true },
  { id: 2, name: 'Dra. Mariana Costa', crm: 'CRM/SP 234567', specialty: 'Cefaleia', phone: '+55 11 99999-2002', email: 'mariana.c@hospital.com', clinics: ['Clínica Sul', 'Clínica Norte'], active: true },
  { id: 3, name: 'Dr. Ricardo Almeida', crm: 'CRM/SP 345678', specialty: 'Fibromialgia', phone: '+55 11 99999-2003', email: 'ricardo.a@hospital.com', clinics: ['Clínica Norte'], active: true },
  { id: 4, name: 'Dr. Carlos Eduardo', crm: 'CRM/SP 456789', specialty: 'Dor Crônica', phone: '+55 11 99999-2004', email: 'carlos.e@hospital.com', clinics: ['Clínica Leste'], active: true },
  { id: 5, name: 'Dra. Fernanda Torres', crm: 'CRM/SP 567890', specialty: 'Lombalgia', phone: '+55 11 99999-2005', email: 'fernanda.t@hospital.com', clinics: ['Hospital Central', 'Clínica Sul'], active: true },
  { id: 6, name: 'Dr. André Gomes', crm: 'CRM/SP 678901', specialty: 'Dor Aguda', phone: '+55 11 99999-2006', email: 'andre.g@hospital.com', clinics: ['Hospital Central'], active: true }
];

const DEFAULT_SERVICES = [
  { id: 1, name: 'Consulta Inicial', category: 'consulta', duration: 30, price: 350, description: 'Primeira avaliação do paciente', active: true },
  { id: 2, name: 'Retorno', category: 'retorno', duration: 20, price: 200, description: 'Consulta de acompanhamento', active: true },
  { id: 3, name: 'Bloqueio Anestésico', category: 'procedimento', duration: 60, price: 1200, description: 'Bloqueio anestésico para controle de dor', active: true },
  { id: 4, name: 'Infiltração Articular', category: 'procedimento', duration: 45, price: 800, description: 'Infiltração com corticoide em articulação', active: true },
  { id: 5, name: 'Ressonância Magnética', category: 'exame', duration: 45, price: 900, description: 'Exame de imagem por RM', active: true },
  { id: 6, name: 'Tomografia', category: 'exame', duration: 30, price: 600, description: 'Tomografia computadorizada', active: true },
  { id: 7, name: 'Eletroneuromiografia', category: 'exame', duration: 60, price: 750, description: 'ENMG para avaliação neuromuscular', active: true },
  { id: 8, name: 'Cirurgia Hérnia de Disco', category: 'cirurgia', duration: 180, price: 15000, description: 'Microdiscectomia lombar', active: true },
  { id: 9, name: 'Radiofrequência', category: 'procedimento', duration: 90, price: 3500, description: 'Ablação por radiofrequência para dor crônica', active: true },
  { id: 10, name: 'Acupuntura', category: 'procedimento', duration: 45, price: 250, description: 'Sessão de acupuntura para controle de dor', active: true }
];

const DEFAULT_AVAILABILITY = [
  { id: 1, doctorId: 1, date: '2026-02-24', startTime: '08:00', endTime: '12:00', clinic: 'Hospital Central', serviceCategories: ['consulta', 'retorno', 'procedimento'] },
  { id: 2, doctorId: 1, date: '2026-02-26', startTime: '08:00', endTime: '12:00', clinic: 'Hospital Central', serviceCategories: ['consulta', 'retorno', 'procedimento'] },
  { id: 3, doctorId: 2, date: '2026-02-24', startTime: '14:00', endTime: '18:00', clinic: 'Clínica Sul', serviceCategories: ['consulta', 'retorno'] },
  { id: 4, doctorId: 2, date: '2026-02-25', startTime: '08:00', endTime: '12:00', clinic: 'Clínica Norte', serviceCategories: ['consulta', 'retorno', 'exame'] },
  { id: 5, doctorId: 3, date: '2026-02-25', startTime: '09:00', endTime: '17:00', clinic: 'Clínica Norte', serviceCategories: ['consulta', 'retorno', 'procedimento'] },
  { id: 6, doctorId: 4, date: '2026-02-24', startTime: '08:00', endTime: '16:00', clinic: 'Clínica Leste', serviceCategories: ['consulta', 'retorno', 'procedimento', 'cirurgia'] },
  { id: 7, doctorId: 5, date: '2026-02-27', startTime: '08:00', endTime: '12:00', clinic: 'Hospital Central', serviceCategories: ['consulta', 'retorno'] },
  { id: 8, doctorId: 6, date: '2026-02-24', startTime: '07:00', endTime: '13:00', clinic: 'Hospital Central', serviceCategories: ['consulta', 'procedimento', 'cirurgia'] }
];

// ---- Default Data ----
const DEFAULT_PATIENTS = [
  {
    id: 1, name: 'Maria Silva', phone: '+55 11 99999-1001', email: 'maria.silva@email.com',
    age: 45, gender: 'F', cpf: '123.456.789-01',
    stage: 'em-tratamento', tags: ['dor-cronica', 'hospital-central', 'normal'],
    clinic: 'Hospital Central', specialty: 'Dor Crônica',
    notes: 'Paciente com dor lombar crônica há 3 anos. Iniciou protocolo de fisioterapia.',
    createdAt: '2026-01-15', lastContact: '2026-02-20',
    history: [
      { date: '2026-02-20', type: 'consulta', desc: 'Retorno - melhora de 40% na escala de dor' },
      { date: '2026-02-05', type: 'procedimento', desc: 'Bloqueio anestésico lombar' },
      { date: '2026-01-15', type: 'consulta', desc: 'Primeira consulta - avaliação inicial' }
    ]
  },
  {
    id: 2, name: 'João Santos', phone: '+55 11 99999-1002', email: 'joao.santos@email.com',
    age: 62, gender: 'M', cpf: '234.567.890-12',
    stage: 'agendado', tags: ['fibromialgia', 'clinica-norte', 'normal', 'retorno-tipo'],
    clinic: 'Clínica Norte', specialty: 'Fibromialgia',
    notes: 'Diagnóstico de fibromialgia. Tratamento multidisciplinar em andamento.',
    createdAt: '2026-01-20', lastContact: '2026-02-18',
    history: [
      { date: '2026-02-18', type: 'mensagem', desc: 'Confirmação de retorno para 25/02' },
      { date: '2026-01-20', type: 'consulta', desc: 'Primeira consulta - diagnóstico fibromialgia' }
    ]
  },
  {
    id: 3, name: 'Ana Oliveira', phone: '+55 11 99999-1003', email: 'ana.oliveira@email.com',
    age: 38, gender: 'F', cpf: '345.678.901-23',
    stage: 'primeiro-contato', tags: ['cefaleia', 'clinica-sul', 'urgente', 'primeira-consulta'],
    clinic: 'Clínica Sul', specialty: 'Cefaleia',
    notes: 'Relatou episódios frequentes de enxaqueca. Aguardando agendamento.',
    createdAt: '2026-02-21', lastContact: '2026-02-21',
    history: [
      { date: '2026-02-21', type: 'mensagem', desc: 'Primeiro contato via WhatsApp - relato de enxaqueca' }
    ]
  },
  {
    id: 4, name: 'Carlos Mendes', phone: '+55 11 99999-1004', email: 'carlos.mendes@email.com',
    age: 55, gender: 'M', cpf: '456.789.012-34',
    stage: 'triagem', tags: ['lombalgia', 'hospital-central', 'normal', 'primeira-consulta'],
    clinic: 'Hospital Central', specialty: 'Lombalgia',
    notes: 'Encaminhado pela emergência. Dor lombar intensa após esforço físico.',
    createdAt: '2026-02-19', lastContact: '2026-02-20',
    history: [
      { date: '2026-02-20', type: 'exame', desc: 'Solicitação RM coluna lombar' },
      { date: '2026-02-19', type: 'consulta', desc: 'Avaliação na emergência - encaminhado para especialista' }
    ]
  },
  {
    id: 5, name: 'Fernanda Lima', phone: '+55 11 99999-1005', email: 'fernanda.lima@email.com',
    age: 29, gender: 'F', cpf: '567.890.123-45',
    stage: 'concluido', tags: ['pos-operatorio', 'clinica-norte', 'normal'],
    clinic: 'Clínica Norte', specialty: 'Pós-operatório',
    notes: 'Cirurgia de hérnia de disco realizada com sucesso. Alta do acompanhamento.',
    createdAt: '2025-11-10', lastContact: '2026-02-10',
    history: [
      { date: '2026-02-10', type: 'consulta', desc: 'Último retorno - alta do acompanhamento' },
      { date: '2026-01-05', type: 'consulta', desc: 'Retorno pós-cirúrgico - boa evolução' },
      { date: '2025-12-01', type: 'procedimento', desc: 'Cirurgia hérnia de disco L4-L5' },
      { date: '2025-11-10', type: 'consulta', desc: 'Avaliação pré-cirúrgica' }
    ]
  },
  {
    id: 6, name: 'Roberto Alves', phone: '+55 11 99999-1006', email: 'roberto.alves@email.com',
    age: 70, gender: 'M', cpf: '678.901.234-56',
    stage: 'retorno', tags: ['dor-cronica', 'clinica-leste', 'retorno-tag'],
    clinic: 'Clínica Leste', specialty: 'Dor Crônica',
    notes: 'Paciente idoso com dor crônica generalizada. Acompanhamento contínuo.',
    createdAt: '2025-09-01', lastContact: '2026-02-15',
    history: [
      { date: '2026-02-15', type: 'mensagem', desc: 'Agendou retorno para março' },
      { date: '2026-01-20', type: 'consulta', desc: 'Ajuste de medicação - gabapentina' },
      { date: '2025-12-15', type: 'consulta', desc: 'Retorno trimestral - estável' },
      { date: '2025-09-01', type: 'consulta', desc: 'Primeira consulta' }
    ]
  },
  {
    id: 7, name: 'Patrícia Costa', phone: '+55 11 99999-1007', email: 'patricia.costa@email.com',
    age: 42, gender: 'F', cpf: '789.012.345-67',
    stage: 'em-tratamento', tags: ['dor-aguda', 'hospital-central', 'urgente'],
    clinic: 'Hospital Central', specialty: 'Dor Aguda',
    notes: 'Dor aguda pós-acidente. Internada para controle da dor.',
    createdAt: '2026-02-18', lastContact: '2026-02-22',
    history: [
      { date: '2026-02-22', type: 'procedimento', desc: 'Aplicação de bloqueio epidural' },
      { date: '2026-02-20', type: 'exame', desc: 'TC coluna - fratura T12' },
      { date: '2026-02-18', type: 'consulta', desc: 'Admissão via emergência - acidente automobilístico' }
    ]
  },
  {
    id: 8, name: 'Lucas Ferreira', phone: '+55 11 99999-1008', email: 'lucas.ferreira@email.com',
    age: 35, gender: 'M', cpf: '890.123.456-78',
    stage: 'agendado', tags: ['cefaleia', 'clinica-sul', 'normal', 'primeira-consulta'],
    clinic: 'Clínica Sul', specialty: 'Cefaleia',
    notes: 'Encaminhado pelo neurologista. Cefaleia tensional frequente.',
    createdAt: '2026-02-10', lastContact: '2026-02-19',
    history: [
      { date: '2026-02-19', type: 'mensagem', desc: 'Confirmou consulta para 26/02' },
      { date: '2026-02-10', type: 'mensagem', desc: 'Primeiro contato - agendamento realizado' }
    ]
  },
  {
    id: 9, name: 'Beatriz Rodrigues', phone: '+55 11 99999-1009', email: 'beatriz.rod@email.com',
    age: 58, gender: 'F', cpf: '901.234.567-89',
    stage: 'triagem', tags: ['dor-cronica', 'clinica-norte', 'normal'],
    clinic: 'Clínica Norte', specialty: 'Dor Crônica',
    notes: 'Paciente com artrite reumatoide e dor crônica associada.',
    createdAt: '2026-02-17', lastContact: '2026-02-21',
    history: [
      { date: '2026-02-21', type: 'exame', desc: 'Solicitação de exames laboratoriais' },
      { date: '2026-02-17', type: 'consulta', desc: 'Primeira avaliação - encaminhada para exames' }
    ]
  },
  {
    id: 10, name: 'Ricardo Souza', phone: '+55 11 99999-1010', email: 'ricardo.souza@email.com',
    age: 48, gender: 'M', cpf: '012.345.678-90',
    stage: 'primeiro-contato', tags: ['lombalgia', 'clinica-leste', 'normal'],
    clinic: 'Clínica Leste', specialty: 'Lombalgia',
    notes: 'Entrou em contato pelo WhatsApp pedindo informações sobre tratamento de lombalgia.',
    createdAt: '2026-02-22', lastContact: '2026-02-22',
    history: [
      { date: '2026-02-22', type: 'mensagem', desc: 'Primeiro contato via WhatsApp' }
    ]
  },
  {
    id: 11, name: 'Camila Duarte', phone: '+55 11 99999-1011', email: 'camila.d@email.com',
    age: 33, gender: 'F', cpf: '111.222.333-44',
    stage: 'concluido', tags: ['dor-aguda', 'hospital-central', 'normal'],
    clinic: 'Hospital Central', specialty: 'Dor Aguda',
    notes: 'Tratamento de dor pós-operatória concluído com sucesso.',
    createdAt: '2025-12-01', lastContact: '2026-01-30',
    history: [
      { date: '2026-01-30', type: 'consulta', desc: 'Alta - sem queixas de dor' },
      { date: '2026-01-10', type: 'consulta', desc: 'Retorno - melhora significativa' },
      { date: '2025-12-01', type: 'procedimento', desc: 'Início do protocolo de analgesia' }
    ]
  },
  {
    id: 12, name: 'Marcos Pereira', phone: '+55 11 99999-1012', email: 'marcos.p@email.com',
    age: 65, gender: 'M', cpf: '222.333.444-55',
    stage: 'em-tratamento', tags: ['fibromialgia', 'clinica-leste', 'normal'],
    clinic: 'Clínica Leste', specialty: 'Fibromialgia',
    notes: 'Tratamento multidisciplinar: fisioterapia + medicação + terapia ocupacional.',
    createdAt: '2026-01-05', lastContact: '2026-02-19',
    history: [
      { date: '2026-02-19', type: 'consulta', desc: 'Sessão de fisioterapia #8 - progresso bom' },
      { date: '2026-02-05', type: 'consulta', desc: 'Avaliação mensal - ajuste de tratamento' },
      { date: '2026-01-05', type: 'consulta', desc: 'Primeira consulta - diagnóstico fibromialgia' }
    ]
  }
];

const DEFAULT_APPOINTMENTS = [
  { id: 1, patientId: 2, patientName: 'João Santos', date: '2026-02-25', time: '09:00', duration: 30, type: 'Retorno', clinic: 'Clínica Norte', doctor: 'Dr. Ricardo Almeida', status: 'confirmado', notes: 'Retorno fibromialgia' },
  { id: 2, patientId: 8, patientName: 'Lucas Ferreira', date: '2026-02-26', time: '10:30', duration: 45, type: 'Primeira Consulta', clinic: 'Clínica Sul', doctor: 'Dra. Mariana Costa', status: 'confirmado', notes: 'Cefaleia tensional - encaminhamento neurologia' },
  { id: 3, patientId: 3, patientName: 'Ana Oliveira', date: '2026-02-24', time: '14:00', duration: 30, type: 'Primeira Consulta', clinic: 'Clínica Sul', doctor: 'Dra. Mariana Costa', status: 'pendente', notes: 'Avaliação enxaqueca' },
  { id: 4, patientId: 1, patientName: 'Maria Silva', date: '2026-02-27', time: '08:30', duration: 60, type: 'Procedimento', clinic: 'Hospital Central', doctor: 'Dr. Paulo Henrique', status: 'confirmado', notes: 'Sessão de fisioterapia' },
  { id: 5, patientId: 6, patientName: 'Roberto Alves', date: '2026-03-05', time: '11:00', duration: 30, type: 'Retorno', clinic: 'Clínica Leste', doctor: 'Dr. Carlos Eduardo', status: 'pendente', notes: 'Retorno trimestral' },
  { id: 6, patientId: 7, patientName: 'Patrícia Costa', date: '2026-02-23', time: '15:30', duration: 45, type: 'Procedimento', clinic: 'Hospital Central', doctor: 'Dr. Paulo Henrique', status: 'confirmado', notes: 'Reavaliação pós-bloqueio' },
  { id: 7, patientId: 9, patientName: 'Beatriz Rodrigues', date: '2026-02-28', time: '09:30', duration: 30, type: 'Retorno', clinic: 'Clínica Norte', doctor: 'Dr. Ricardo Almeida', status: 'pendente', notes: 'Resultado de exames' },
  { id: 8, patientId: 12, patientName: 'Marcos Pereira', date: '2026-02-24', time: '16:00', duration: 60, type: 'Procedimento', clinic: 'Clínica Leste', doctor: 'Dr. Carlos Eduardo', status: 'confirmado', notes: 'Sessão fisioterapia #9' }
];

const DEFAULT_ACTIVITIES = [
  { id: 1, type: 'mensagem', patient: 'Ricardo Souza', desc: 'Novo contato via WhatsApp', time: '10 min atrás', icon: '💬', timestamp: Date.now() - 600000 },
  { id: 2, type: 'consulta', patient: 'Patrícia Costa', desc: 'Bloqueio epidural realizado', time: '2h atrás', icon: '💉', timestamp: Date.now() - 7200000 },
  { id: 3, type: 'agendamento', patient: 'Ana Oliveira', desc: 'Consulta agendada - 24/02', time: '3h atrás', icon: '📅', timestamp: Date.now() - 10800000 },
  { id: 4, type: 'exame', patient: 'Beatriz Rodrigues', desc: 'Exames laboratoriais solicitados', time: '5h atrás', icon: '🔬', timestamp: Date.now() - 18000000 },
  { id: 5, type: 'mensagem', patient: 'João Santos', desc: 'Confirmou retorno para 25/02', time: '1 dia atrás', icon: '✅', timestamp: Date.now() - 86400000 },
  { id: 6, type: 'pipeline', patient: 'Carlos Mendes', desc: 'Movido para Triagem', time: '1 dia atrás', icon: '📋', timestamp: Date.now() - 86400000 },
  { id: 7, type: 'consulta', patient: 'Marcos Pereira', desc: 'Fisioterapia #8 concluída', time: '3 dias atrás', icon: '🏥', timestamp: Date.now() - 259200000 },
  { id: 8, type: 'mensagem', patient: 'Maria Silva', desc: 'Lembrete de consulta enviado', time: '3 dias atrás', icon: '📱', timestamp: Date.now() - 259200000 }
];

// ---- Storage Manager ----
class DataStore {
  constructor() {
    this.patients = this._load(STORAGE_KEYS.patients, DEFAULT_PATIENTS);
    this.appointments = this._load(STORAGE_KEYS.appointments, DEFAULT_APPOINTMENTS);
    this.activities = this._load(STORAGE_KEYS.activities, DEFAULT_ACTIVITIES);
    this.doctors = this._load(STORAGE_KEYS.doctors, DEFAULT_DOCTORS);
    this.services = this._load(STORAGE_KEYS.services, DEFAULT_SERVICES);
    this.availability = this._load(STORAGE_KEYS.availability, DEFAULT_AVAILABILITY);
  }

  _load(key, defaults) {
    try {
      const stored = localStorage.getItem(key);
      if (stored) return JSON.parse(stored);
    } catch (e) { console.warn('Error loading from storage:', e); }
    return JSON.parse(JSON.stringify(defaults));
  }

  _save(key, data) {
    try { localStorage.setItem(key, JSON.stringify(data)); }
    catch (e) { console.warn('Error saving to storage:', e); }
  }

  _nextId(arr) {
    return arr.length > 0 ? Math.max(...arr.map(i => i.id)) + 1 : 1;
  }

  // ---- Patients CRUD ----
  getPatients() { return this.patients; }

  getPatientById(id) { return this.patients.find(p => p.id === id); }

  getPatientsByStage(stageId) { return this.patients.filter(p => p.stage === stageId); }

  addPatient(patient) {
    patient.id = this._nextId(this.patients);
    patient.createdAt = new Date().toISOString().split('T')[0];
    patient.lastContact = patient.createdAt;
    patient.history = patient.history || [
      { date: patient.createdAt, type: 'mensagem', desc: 'Cadastro realizado no sistema' }
    ];
    this.patients.push(patient);
    this._save(STORAGE_KEYS.patients, this.patients);
    this.addActivity('cadastro', patient.name, 'Novo paciente cadastrado', '👤');
    return patient;
  }

  updatePatient(id, updates) {
    const idx = this.patients.findIndex(p => p.id === id);
    if (idx === -1) return null;
    Object.assign(this.patients[idx], updates);
    this._save(STORAGE_KEYS.patients, this.patients);
    return this.patients[idx];
  }

  deletePatient(id) {
    this.patients = this.patients.filter(p => p.id !== id);
    this.appointments = this.appointments.filter(a => a.patientId !== id);
    this._save(STORAGE_KEYS.patients, this.patients);
    this._save(STORAGE_KEYS.appointments, this.appointments);
  }

  movePatient(patientId, newStage) {
    const patient = this.getPatientById(patientId);
    if (!patient) return false;
    const oldStage = patient.stage;
    patient.stage = newStage;
    patient.lastContact = new Date().toISOString().split('T')[0];
    const stageInfo = PIPELINE_STAGES.find(s => s.id === newStage);
    patient.history.unshift({
      date: patient.lastContact,
      type: 'pipeline',
      desc: `Movido para ${stageInfo?.name || newStage}`
    });
    this._save(STORAGE_KEYS.patients, this.patients);
    this.addActivity('pipeline', patient.name, `Movido para ${stageInfo?.name || newStage}`, stageInfo?.icon || '🔄');
    return true;
  }

  searchPatients(query) {
    const q = query.toLowerCase();
    return this.patients.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.phone.includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.specialty.toLowerCase().includes(q) ||
      p.clinic.toLowerCase().includes(q)
    );
  }

  addHistoryEntry(patientId, entry) {
    const patient = this.getPatientById(patientId);
    if (!patient) return;
    entry.date = entry.date || new Date().toISOString().split('T')[0];
    patient.history.unshift(entry);
    patient.lastContact = entry.date;
    this._save(STORAGE_KEYS.patients, this.patients);
  }

  // ---- Appointments CRUD ----
  getAppointments() { return this.appointments; }

  getAppointmentById(id) { return this.appointments.find(a => a.id === id); }

  addAppointment(appt) {
    appt.id = this._nextId(this.appointments);
    this.appointments.push(appt);
    this._save(STORAGE_KEYS.appointments, this.appointments);
    this.addActivity('agendamento', appt.patientName,
      `${appt.type} agendado - ${formatDateBR(appt.date)} às ${appt.time}`, '📅');
    // Also move patient to 'agendado' if in first stages
    const patient = this.getPatientById(appt.patientId);
    if (patient && (patient.stage === 'primeiro-contato' || patient.stage === 'triagem')) {
      this.movePatient(appt.patientId, 'agendado');
    }
    return appt;
  }

  updateAppointment(id, updates) {
    const idx = this.appointments.findIndex(a => a.id === id);
    if (idx === -1) return null;
    Object.assign(this.appointments[idx], updates);
    this._save(STORAGE_KEYS.appointments, this.appointments);
    return this.appointments[idx];
  }

  deleteAppointment(id) {
    const appt = this.getAppointmentById(id);
    this.appointments = this.appointments.filter(a => a.id !== id);
    this._save(STORAGE_KEYS.appointments, this.appointments);
    if (appt) {
      this.addActivity('cancelamento', appt.patientName, `Agendamento cancelado`, '❌');
    }
  }

  getUpcomingAppointments(days = 7) {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const limit = new Date(now);
    limit.setDate(limit.getDate() + days);
    return this.appointments.filter(a => {
      const d = new Date(a.date + 'T12:00:00');
      return d >= now && d <= limit;
    }).sort((a, b) => {
      const dA = new Date(a.date + 'T' + a.time);
      const dB = new Date(b.date + 'T' + b.time);
      return dA - dB;
    });
  }

  getTodayAppointments() {
    const today = new Date().toISOString().split('T')[0];
    return this.appointments.filter(a => a.date === today);
  }

  // ---- Activities ----
  getActivities() { return this.activities; }

  addActivity(type, patient, desc, icon) {
    const activity = {
      id: this._nextId(this.activities),
      type, patient, desc, icon,
      time: 'agora',
      timestamp: Date.now()
    };
    this.activities.unshift(activity);
    if (this.activities.length > 50) this.activities = this.activities.slice(0, 50);
    this._save(STORAGE_KEYS.activities, this.activities);
    return activity;
  }

  // ---- KPIs ----
  getKPIs() {
    const totalPatients = this.patients.length;
    const todayAppts = this.getTodayAppointments().length;
    const pendingAppts = this.appointments.filter(a => a.status === 'pendente').length;
    const urgentPatients = this.patients.filter(p => p.tags.includes('urgente')).length;
    const inTreatment = this.patients.filter(p => p.stage === 'em-tratamento').length;
    const completed = this.patients.filter(p => p.stage === 'concluido').length;
    const conversionRate = totalPatients > 0 ? Math.round((completed / totalPatients) * 100) : 0;

    const clinicCounts = {};
    this.patients.forEach(p => { clinicCounts[p.clinic] = (clinicCounts[p.clinic] || 0) + 1; });

    const specialtyCounts = {};
    this.patients.forEach(p => { specialtyCounts[p.specialty] = (specialtyCounts[p.specialty] || 0) + 1; });

    const stageCounts = {};
    PIPELINE_STAGES.forEach(s => { stageCounts[s.name] = this.patients.filter(p => p.stage === s.id).length; });

    return { totalPatients, todayAppts, pendingAppts, urgentPatients, inTreatment, completed, conversionRate, clinicCounts, specialtyCounts, stageCounts };
  }

  getMonthlyData() {
    return [
      { month: 'Set', novos: 2, concluidos: 0 },
      { month: 'Out', novos: 3, concluidos: 1 },
      { month: 'Nov', novos: 4, concluidos: 1 },
      { month: 'Dez', novos: 5, concluidos: 2 },
      { month: 'Jan', novos: 6, concluidos: 3 },
      { month: 'Fev', novos: 4, concluidos: 2 }
    ];
  }

  // ---- Doctors CRUD ----
  getDoctors() { return this.doctors.filter(d => d.active !== false); }
  getAllDoctors() { return this.doctors; }
  getDoctorById(id) { return this.doctors.find(d => d.id === id); }
  getDoctorNames() { return this.getDoctors().map(d => d.name); }

  addDoctor(doctor) {
    doctor.id = this._nextId(this.doctors);
    doctor.active = true;
    this.doctors.push(doctor);
    this._save(STORAGE_KEYS.doctors, this.doctors);
    this.addActivity('config', doctor.name, 'Novo médico cadastrado', '👨‍⚕️');
    return doctor;
  }

  updateDoctor(id, updates) {
    const idx = this.doctors.findIndex(d => d.id === id);
    if (idx === -1) return null;
    Object.assign(this.doctors[idx], updates);
    this._save(STORAGE_KEYS.doctors, this.doctors);
    return this.doctors[idx];
  }

  deleteDoctor(id) {
    const doc = this.getDoctorById(id);
    if (doc) {
      doc.active = false;
      this._save(STORAGE_KEYS.doctors, this.doctors);
    }
  }

  // ---- Services CRUD ----
  getServices() { return this.services.filter(s => s.active !== false); }
  getAllServices() { return this.services; }
  getServiceById(id) { return this.services.find(s => s.id === id); }
  getServicesByCategory(cat) { return this.getServices().filter(s => s.category === cat); }

  addService(service) {
    service.id = this._nextId(this.services);
    service.active = true;
    this.services.push(service);
    this._save(STORAGE_KEYS.services, this.services);
    this.addActivity('config', service.name, 'Novo serviço cadastrado', '⚙️');
    return service;
  }

  updateService(id, updates) {
    const idx = this.services.findIndex(s => s.id === id);
    if (idx === -1) return null;
    Object.assign(this.services[idx], updates);
    this._save(STORAGE_KEYS.services, this.services);
    return this.services[idx];
  }

  deleteService(id) {
    const svc = this.getServiceById(id);
    if (svc) {
      svc.active = false;
      this._save(STORAGE_KEYS.services, this.services);
    }
  }

  // ---- Availability CRUD ----
  getAvailability() { return this.availability; }
  getAvailabilityByDoctor(doctorId) { return this.availability.filter(a => a.doctorId === doctorId); }
  getAvailabilityByDate(date) { return this.availability.filter(a => a.date === date); }
  getAvailabilityById(id) { return this.availability.find(a => a.id === id); }

  addAvailability(slot) {
    slot.id = this._nextId(this.availability);
    this.availability.push(slot);
    this._save(STORAGE_KEYS.availability, this.availability);
    const doc = this.getDoctorById(slot.doctorId);
    this.addActivity('config', doc?.name || 'Médico', `Disponibilidade configurada - ${formatDateBR(slot.date)}`, '📅');
    return slot;
  }

  updateAvailability(id, updates) {
    const idx = this.availability.findIndex(a => a.id === id);
    if (idx === -1) return null;
    Object.assign(this.availability[idx], updates);
    this._save(STORAGE_KEYS.availability, this.availability);
    return this.availability[idx];
  }

  deleteAvailability(id) {
    this.availability = this.availability.filter(a => a.id !== id);
    this._save(STORAGE_KEYS.availability, this.availability);
  }

  getAvailableSlots(date, doctorId, serviceCat) {
    let slots = this.availability.filter(a => a.date === date);
    if (doctorId) slots = slots.filter(a => a.doctorId === doctorId);
    if (serviceCat) slots = slots.filter(a => a.serviceCategories.includes(serviceCat));
    return slots;
  }

  hasConflict(doctorId, date, startTime, endTime, excludeId) {
    return this.availability.some(a =>
      a.doctorId === doctorId && a.date === date && a.id !== excludeId &&
      ((startTime >= a.startTime && startTime < a.endTime) || (endTime > a.startTime && endTime <= a.endTime) || (startTime <= a.startTime && endTime >= a.endTime))
    );
  }

  // ---- Chatwoot Integration ----
  findPatientByPhone(phone) {
    if (!phone) return null;
    const normalized = phone.replace(/[^\d+]/g, '');
    return this.patients.find(p => {
      const pPhone = (p.phone || '').replace(/[^\d+]/g, '');
      return pPhone === normalized || pPhone.endsWith(normalized.slice(-9)) || normalized.endsWith(pPhone.slice(-9));
    }) || null;
  }

  findPatientByEmail(email) {
    if (!email) return null;
    return this.patients.find(p => p.email && p.email.toLowerCase() === email.toLowerCase()) || null;
  }

  findPatientByChatwootId(chatwootContactId) {
    if (!chatwootContactId) return null;
    return this.patients.find(p => p.chatwootContactId === chatwootContactId) || null;
  }

  linkPatientToChatwoot(patientId, chatwootContactId) {
    const patient = this.getPatientById(patientId);
    if (!patient) return null;
    patient.chatwootContactId = chatwootContactId;
    this._save(STORAGE_KEYS.patients, this.patients);
    return patient;
  }

  // ---- Reset ----
  resetAll() {
    this.patients = JSON.parse(JSON.stringify(DEFAULT_PATIENTS));
    this.appointments = JSON.parse(JSON.stringify(DEFAULT_APPOINTMENTS));
    this.activities = JSON.parse(JSON.stringify(DEFAULT_ACTIVITIES));
    this.doctors = JSON.parse(JSON.stringify(DEFAULT_DOCTORS));
    this.services = JSON.parse(JSON.stringify(DEFAULT_SERVICES));
    this.availability = JSON.parse(JSON.stringify(DEFAULT_AVAILABILITY));
    this._save(STORAGE_KEYS.patients, this.patients);
    this._save(STORAGE_KEYS.appointments, this.appointments);
    this._save(STORAGE_KEYS.activities, this.activities);
    this._save(STORAGE_KEYS.doctors, this.doctors);
    this._save(STORAGE_KEYS.services, this.services);
    this._save(STORAGE_KEYS.availability, this.availability);
  }
}

// ---- Global helpers ----
function getTagInfo(tagId) {
  for (const category of Object.values(TAGS)) {
    const tag = category.find(t => t.id === tagId);
    if (tag) return tag;
  }
  return { id: tagId, name: tagId, color: '#666' };
}

function getStageInfo(stageId) {
  return PIPELINE_STAGES.find(s => s.id === stageId);
}

function formatDateBR(dateStr) {
  if (!dateStr) return '-';
  const [y, m, d] = dateStr.split('-');
  return `${d}/${m}/${y}`;
}

function formatDateFull(dateStr) {
  const days = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];
  const months = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
  const d = new Date(dateStr + 'T12:00:00');
  return `${days[d.getDay()]}, ${d.getDate()} de ${months[d.getMonth()]}`;
}

function todayISO() {
  return new Date().toISOString().split('T')[0];
}

// Initialize
const store = new DataStore();
