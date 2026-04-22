export type Language = 'fr' | 'en' | 'es';

export const languageNames: Record<Language, string> = {
  fr: '🇫🇷 FR',
  en: '🇬🇧 EN',
  es: '🇪🇸 ES',
};

export const translations = {
  fr: {
    // Auth
    login: 'Connexion',
    register: "S'inscrire",
    email: 'Email',
    password: 'Mot de passe',
    firstName: 'Prénom',
    lastName: 'Nom',
    phone: 'Téléphone',
    submit: 'Valider',
    backHome: "Retour à l'accueil",

    // Nav
    home: 'Accueil',
    inscription: 'Inscription',
    connexion: 'Connexion',

    // Server list
    myServers: 'Mes serveurs',
    createServer: 'Créer un serveur',
    joinServer: 'Rejoindre un serveur',
    noServer: "Vous n'avez pas encore de serveur.",
    serverName: 'Nom du serveur',

    // Chat UI
    send: 'Envoyer',
    messagePlaceholder: 'Message',
    editBtn: '✏️ modifier',
    searchGif: 'Rechercher un GIF…',
    loadingGif: 'Chargement…',
    online: 'en ligne',
    modified: '(modifié)',
    textChannels: 'Channels texte',
    newChannel: '+ Nouveau channel',
    backToServers: '← Mes serveurs',
    serverSettings: '⚙️ Serveur',

    // Translation toggle
    translateMessages: 'Traduire les messages',
    translating: 'Traduction…',
    showOriginal: 'Voir original',
    showTranslated: 'Voir traduction',

    // Moderation
    kick: '👢 Expulser',
    ban: '🔨 Bannir',
    mute: '🔇 Muter',
    sendDm: '💬 Envoyer DM',
    duration: 'DURÉE',
    reason: 'RAISON (optionnel)',
    permanent: 'Permanent',
    confirm: 'Confirmer',
    cancel: 'Annuler',
    confirmBan: 'Confirmer le ban',

    // Mute
    mutedLabel: '🔇 Muté',
    mutedWarning: "🔇 Vous êtes muté — vous pouvez écrire dans",

    // Server page
    inviteCode: "Code d'invitation",
    leaveServer: 'Quitter le serveur',
    deleteServer: 'Supprimer le serveur',
    channels: 'Channels',
    members: 'Membres',
    youTag: '(vous)',
    rightClickHint: "Clic droit sur un membre pour l'expulser ou le bannir",

    // Roles
    roleOwner: 'Owner',
    roleAdmin: 'Admin',
    roleMember: 'Membre',
  },

  en: {
    login: 'Login',
    register: 'Register',
    email: 'Email',
    password: 'Password',
    firstName: 'First name',
    lastName: 'Last name',
    phone: 'Phone',
    submit: 'Submit',
    backHome: 'Back to home',

    home: 'Home',
    inscription: 'Register',
    connexion: 'Login',

    myServers: 'My servers',
    createServer: 'Create a server',
    joinServer: 'Join a server',
    noServer: "You don't have any servers yet.",
    serverName: 'Server name',

    send: 'Send',
    messagePlaceholder: 'Message',
    editBtn: '✏️ edit',
    searchGif: 'Search a GIF…',
    loadingGif: 'Loading…',
    online: 'online',
    modified: '(edited)',
    textChannels: 'Text channels',
    newChannel: '+ New channel',
    backToServers: '← My servers',
    serverSettings: '⚙️ Server',

    translateMessages: 'Translate messages',
    translating: 'Translating…',
    showOriginal: 'Show original',
    showTranslated: 'Show translation',

    kick: '👢 Kick',
    ban: '🔨 Ban',
    mute: '🔇 Mute',
    sendDm: '💬 Send DM',
    duration: 'DURATION',
    reason: 'REASON (optional)',
    permanent: 'Permanent',
    confirm: 'Confirm',
    cancel: 'Cancel',
    confirmBan: 'Confirm ban',

    mutedLabel: '🔇 Muted',
    mutedWarning: '🔇 You are muted — you can write in',

    inviteCode: 'Invite code',
    leaveServer: 'Leave server',
    deleteServer: 'Delete server',
    channels: 'Channels',
    members: 'Members',
    youTag: '(you)',
    rightClickHint: 'Right-click a member to kick or ban them',

    roleOwner: 'Owner',
    roleAdmin: 'Admin',
    roleMember: 'Member',
  },

  es: {
    login: 'Iniciar sesión',
    register: 'Registrarse',
    email: 'Correo electrónico',
    password: 'Contraseña',
    firstName: 'Nombre',
    lastName: 'Apellido',
    phone: 'Teléfono',
    submit: 'Confirmar',
    backHome: 'Volver al inicio',

    home: 'Inicio',
    inscription: 'Registro',
    connexion: 'Iniciar sesión',

    myServers: 'Mis servidores',
    createServer: 'Crear un servidor',
    joinServer: 'Unirse a un servidor',
    noServer: 'Aún no tienes servidores.',
    serverName: 'Nombre del servidor',

    send: 'Enviar',
    messagePlaceholder: 'Mensaje',
    editBtn: '✏️ editar',
    searchGif: 'Buscar un GIF…',
    loadingGif: 'Cargando…',
    online: 'en línea',
    modified: '(editado)',
    textChannels: 'Canales de texto',
    newChannel: '+ Nuevo canal',
    backToServers: '← Mis servidores',
    serverSettings: '⚙️ Servidor',

    translateMessages: 'Traducir mensajes',
    translating: 'Traduciendo…',
    showOriginal: 'Ver original',
    showTranslated: 'Ver traducción',

    kick: '👢 Expulsar',
    ban: '🔨 Banear',
    mute: '🔇 Silenciar',
    sendDm: '💬 Enviar DM',
    duration: 'DURACIÓN',
    reason: 'RAZÓN (opcional)',
    permanent: 'Permanente',
    confirm: 'Confirmar',
    cancel: 'Cancelar',
    confirmBan: 'Confirmar ban',

    mutedLabel: '🔇 Silenciado',
    mutedWarning: '🔇 Estás silenciado — puedes escribir en',

    inviteCode: 'Código de invitación',
    leaveServer: 'Abandonar servidor',
    deleteServer: 'Eliminar servidor',
    channels: 'Canales',
    members: 'Miembros',
    youTag: '(tú)',
    rightClickHint: 'Clic derecho en un miembro para expulsarlo o banearlo',

    roleOwner: 'Owner',
    roleAdmin: 'Admin',
    roleMember: 'Miembro',
  },
} as const;

export type TranslationKey = keyof typeof translations.fr;
