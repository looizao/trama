import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'

export type Locale = 'pt-BR' | 'en'
export type Theme = 'light' | 'dark'

const pt: Record<string, string> = {
  'Loading workspace…': 'Carregando espaço de trabalho…',
  'A space for possibility': 'Um espaço de possibilidades',
  'Shape a look.': 'Crie um visual.',
  'Show the journey.': 'Mostre a evolução.',
  'A considered workspace for visagism professionals and the people behind every transformation.': 'Um espaço pensado para profissionais de visagismo e para as pessoas por trás de cada transformação.',
  'Welcome back': 'Boas-vindas de volta',
  'Sign in to your studio': 'Entre no seu estúdio',
  'Continue working with your clients and their visual journeys.': 'Continue acompanhando seus clientes e a evolução de seus visuais.',
  'Email address': 'Endereço de e-mail',
  'Password': 'Senha',
  'Signing in…': 'Entrando…',
  'Sign in': 'Entrar',
  'WORKSPACE': 'ESPAÇO DE TRABALHO',
  'Clients': 'Clientes',
  'Administration': 'Administração',
  'Admin': 'Admin',
  'Sign out': 'Sair',
  'admin': 'administrador',
  'professional': 'profissional',
  'Language': 'Idioma',
  'Theme': 'Tema',
  'Light theme': 'Tema claro',
  'Dark theme': 'Tema escuro',
  'Switch to light theme': 'Mudar para o tema claro',
  'Switch to dark theme': 'Mudar para o tema escuro',
  'YOUR STUDIO': 'SEU ESTÚDIO',
  'Every person, every possibility, all in one place.': 'Cada pessoa e cada possibilidade em um só lugar.',
  '+ New client': '+ Novo cliente',
  'Add a client': 'Adicionar cliente',
  'Name': 'Nome',
  'Email (optional)': 'E-mail (opcional)',
  'Private notes': 'Anotações privadas',
  'Cancel': 'Cancelar',
  'Create client': 'Criar cliente',
  'Client directory': 'Lista de clientes',
  'Search clients': 'Buscar clientes',
  'No email added': 'Sem e-mail cadastrado',
  'Added': 'Adicionado em',
  'No matching clients': 'Nenhum cliente encontrado',
  'Your first client starts here': 'Seu primeiro cliente começa aqui',
  'Try another name or email.': 'Tente outro nome ou e-mail.',
  'Create a client to begin a visual journey.': 'Crie um cliente para começar uma jornada visual.',
  '← All clients': '← Todos os clientes',
  'CLIENT WORKSPACE': 'ESPAÇO DO CLIENTE',
  'A private space for this client’s look and hair journey.': 'Um espaço privado para acompanhar o visual e o cabelo deste cliente.',
  '+ New journey': '+ Nova jornada',
  'Start a journey': 'Iniciar jornada',
  'Journey name': 'Nome da jornada',
  'Spring transformation': 'Transformação de primavera',
  'Description': 'Descrição',
  'Your goals for this consultation': 'Objetivos desta consulta',
  'Create journey': 'Criar jornada',
  'Journeys': 'Jornadas',
  'Explore looks and document progress': 'Explore visuais e registre a evolução',
  'Started': 'Iniciada em',
  'No journeys yet': 'Nenhuma jornada ainda',
  'Create a journey to collect photos, generate looks, and show progress.': 'Crie uma jornada para reunir fotos, gerar visuais e mostrar a evolução.',
  '← Client workspace': '← Espaço do cliente',
  'VISUAL JOURNEY': 'JORNADA VISUAL',
  'Explore, compare, and curate each step.': 'Explore, compare e organize cada etapa.',
  'Image gallery': 'Galeria de imagens',
  'Progression': 'Evolução',
  'Images': 'Imagens',
  'Original': 'Original',
  'Generated': 'Gerada',
  'Client source portrait': 'Retrato original do cliente',
  'Generated look': 'Visual gerado',
  'Place image in milestone': 'Associar imagem a uma etapa',
  'Not in progression': 'Fora da evolução',
  'look': 'visual',
  'No images yet': 'Nenhuma imagem ainda',
  'Upload a portrait to begin exploring looks.': 'Envie um retrato para começar a explorar visuais.',
  'No images selected yet. Use the gallery to add one.': 'Nenhuma imagem selecionada. Use a galeria para adicionar uma.',
  'Build the progression': 'Monte a evolução',
  'Add milestones and choose which images tell this client’s story.': 'Adicione etapas e escolha as imagens que contam a história deste cliente.',
  'Generation activity': 'Atividade de geração',
  'queued': 'na fila',
  'running': 'em andamento',
  'completed': 'concluída',
  'failed': 'falhou',
  'cancelled': 'cancelada',
  '01 / SOURCE': '01 / ORIGEM',
  'Add a portrait': 'Adicionar retrato',
  'Upload a clear image to use as the starting point for new looks.': 'Envie uma imagem nítida para usar como ponto de partida para novos visuais.',
  'Choose an image': 'Escolher imagem',
  'JPEG, PNG, or WebP · 10 MB max': 'JPEG, PNG ou WebP · até 10 MB',
  '02 / EXPLORE': '02 / EXPLORE',
  'Generate looks': 'Gerar visuais',
  'Describe a hairstyle, color, or visual direction to explore.': 'Descreva um penteado, uma cor ou a direção visual que deseja explorar.',
  'Source portrait': 'Retrato de origem',
  'Select an image': 'Selecione uma imagem',
  'Portrait': 'Retrato',
  'Creative direction': 'Direção criativa',
  'Try a shoulder-length bob with warm chestnut highlights. Keep facial features, expression, and pose unchanged.': 'Experimente um corte na altura dos ombros com reflexos castanhos quentes. Mantenha os traços, a expressão e a pose.',
  'Variations': 'Variações',
  'image': 'imagem',
  'images': 'imagens',
  'Generation will be available when model, storage, and worker credentials are configured.': 'A geração estará disponível quando o modelo, o armazenamento e o worker estiverem configurados.',
  'Starting…': 'Iniciando…',
  'Generate images': 'Gerar imagens',
  '03 / CURATE': '03 / ORGANIZE',
  'Add a milestone': 'Adicionar etapa',
  'Mark a step in the client’s progression, then select images from the gallery.': 'Marque uma etapa na evolução do cliente e selecione as imagens na galeria.',
  'Milestone name': 'Nome da etapa',
  'First consultation': 'Primeira consulta',
  'Add milestone': 'Adicionar etapa',
  'STUDIO SETTINGS': 'CONFIGURAÇÕES DO ESTÚDIO',
  'Manage your team and review workspace activity.': 'Gerencie sua equipe e acompanhe as atividades do espaço de trabalho.',
  'Invite a team member': 'Adicionar membro à equipe',
  'Create an account and share its initial password directly with the person.': 'Crie uma conta e compartilhe a senha inicial diretamente com a pessoa.',
  'Full name': 'Nome completo',
  'Email': 'E-mail',
  'Initial password': 'Senha inicial',
  'Role': 'Função',
  'Professional': 'Profissional',
  'Administrator': 'Administrador',
  'Create account': 'Criar conta',
  'Change your password': 'Alterar sua senha',
  'Current password': 'Senha atual',
  'New password': 'Nova senha',
  'Update password': 'Atualizar senha',
  'Team members': 'Membros da equipe',
  'Member': 'Membro',
  'Status': 'Status',
  'Active': 'Ativo',
  'Inactive': 'Inativo',
  'Recent activity': 'Atividade recente',
  'created': 'criou',
  'updated': 'atualizou',
  'uploaded': 'enviou',
  'placed': 'associou',
  'client': 'cliente',
  'case': 'jornada',
  'milestone': 'etapa',
  'asset': 'imagem',
  'user': 'usuário',
  'audit event': 'evento de auditoria',
  'Admin access required': 'Acesso de administrador necessário',
  'sign in required': 'É necessário entrar na conta',
  'session expired': 'Sua sessão expirou',
  'admin access required': 'Acesso de administrador necessário',
  'invalid credentials': 'E-mail ou senha inválidos',
  'too many attempts; try again later': 'Muitas tentativas. Tente novamente mais tarde.',
  'current password is incorrect': 'A senha atual está incorreta',
  'image generation is not configured yet': 'A geração de imagens ainda não está configurada',
  'image is too large or invalid': 'A imagem é muito grande ou inválida',
  'image is required': 'É necessário selecionar uma imagem',
  'image must be at most 10 MB': 'A imagem deve ter no máximo 10 MB',
  'use a JPEG, PNG, or WebP image': 'Use uma imagem JPEG, PNG ou WebP',
  'client not found': 'Cliente não encontrado',
  'case not found': 'Jornada não encontrada',
  'image not found': 'Imagem não encontrada',
  'milestone not found': 'Etapa não encontrada',
  'invalid client fields': 'Dados do cliente inválidos',
  'invalid case fields': 'Dados da jornada inválidos',
  'invalid milestone title': 'Nome da etapa inválido',
  'invalid user fields': 'Dados do usuário inválidos',
  'user already exists or could not be created': 'O usuário já existe ou não pôde ser criado',
  'provide a description of 10 to 1500 characters and 1 to 4 images': 'Descreva o visual com 10 a 1.500 caracteres e escolha de 1 a 4 imagens',
  'select a source image': 'Selecione uma imagem de origem',
  'source image not found': 'Imagem de origem não encontrada',
  'unsupported model': 'Modelo não suportado',
  'could not start image workflow': 'Não foi possível iniciar a geração',
  'could not create client': 'Não foi possível criar o cliente',
  'could not create case': 'Não foi possível criar a jornada',
  'could not store image': 'Não foi possível armazenar a imagem',
  'could not save image record': 'Não foi possível salvar a imagem',
  'could not update image': 'Não foi possível atualizar a imagem',
  'could not create milestone': 'Não foi possível criar a etapa',
  'could not create session': 'Não foi possível iniciar a sessão',
  'could not update password': 'Não foi possível atualizar a senha',
  'cannot remove your own admin access': 'Você não pode remover seu próprio acesso de administrador',
  'could not load account': 'Não foi possível carregar a conta',
  'could not load clients': 'Não foi possível carregar os clientes',
  'could not update client': 'Não foi possível atualizar o cliente',
  'could not load cases': 'Não foi possível carregar as jornadas',
  'could not load milestones': 'Não foi possível carregar as etapas',
  'could not load assets': 'Não foi possível carregar as imagens',
  'could not read image': 'Não foi possível ler a imagem',
  'could not load image': 'Não foi possível carregar a imagem',
  'image link expired': 'O link da imagem expirou',
  'invalid milestone': 'Etapa inválida',
  'could not load users': 'Não foi possível carregar os usuários',
  'user not found': 'Usuário não encontrado',
  'could not update user': 'Não foi possível atualizar o usuário',
  'could not load audit history': 'Não foi possível carregar o histórico de atividades',
  'could not load runs': 'Não foi possível carregar as gerações',
  'run not found': 'Geração não encontrada',
  'could not create run': 'Não foi possível criar a geração',
  'not found': 'Não encontrado',
  'internal error': 'Erro interno',
}

const enExtra: Record<string, string> = { 'created': 'created', 'updated': 'updated', 'uploaded': 'uploaded', 'placed': 'placed' }

type Preferences = {
  locale: Locale
  setLocale: (locale: Locale) => void
  theme: Theme
  setTheme: (theme: Theme) => void
  t: (text: string) => string
}

const Context = createContext<Preferences | null>(null)

function stored<K extends string>(key: string, allowed: readonly K[], fallback: K): K {
  try { const value = localStorage.getItem(key); return allowed.find(option => option === value) ?? fallback }
  catch { return fallback }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [locale, setLocale] = useState<Locale>(() => stored('trama.locale', ['pt-BR', 'en'], 'pt-BR'))
  const [theme, setTheme] = useState<Theme>(() => stored('trama.theme', ['light', 'dark'], 'light'))
  useEffect(() => {
    document.documentElement.lang = locale
    document.title = locale === 'pt-BR' ? 'Trama | Estúdio de visagismo' : 'Trama | Visagism studio'
    try { localStorage.setItem('trama.locale', locale) } catch { /* storage may be unavailable */ }
  }, [locale])
  useEffect(() => {
    document.documentElement.dataset.theme = theme
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#171e1b' : '#f8f6f1')
    try { localStorage.setItem('trama.theme', theme) } catch { /* storage may be unavailable */ }
  }, [theme])
  const t = useCallback((text: string) => {
    const leading = text.match(/^\s*/)?.[0] ?? ''
    const trailing = text.match(/\s*$/)?.[0] ?? ''
    const key = text.trim()
    if (locale === 'en') return leading + (enExtra[key] ?? key) + trailing
    if (key.startsWith('Request failed (')) return leading + key.replace('Request failed', 'Falha na solicitação') + trailing
    return leading + (pt[key] ?? key) + trailing
  }, [locale])
  const value = useMemo(() => ({ locale, setLocale, theme, setTheme, t }), [locale, theme, t])
  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function usePreferences() {
  const context = useContext(Context)
  if (!context) throw new Error('PreferencesProvider is missing')
  return context
}
