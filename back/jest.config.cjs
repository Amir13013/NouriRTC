'use strict';

module.exports = {
  // 👉 les tests tournent dans un environnement Node.js (pas un navigateur)
  testEnvironment: 'node',
  // 👉 babel-jest transforme les "import/export" ESM en CommonJS que Jest comprend
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  // 👉 je génère automatiquement le rapport de coverage après chaque npm test
  collectCoverage: true,
  // 👉 le rapport HTML est généré dans le dossier coverage/
  coverageDirectory: 'coverage',
  // 👉 je mesure le coverage uniquement sur ces dossiers (pas les fichiers de config, routes, etc.)
  collectCoverageFrom: [
    'Controllers/**/*.js',
    '!Controllers/ChannelControllers.js',  // pas dans le scope des tests demandés
    '!Controllers/DmControllers.js',
    '!Controllers/GifControllers.js',
    'middleware/**/*.js',
    '!middleware/Error.js',
    'utils/**/*.js',
  ],
  // 👉 si le coverage tombe sous ces seuils → npm test échoue automatiquement
  coverageThreshold: {
    global: {
      lines: 80,
      functions: 80,
      branches: 70,
      statements: 80,
    },
  },
  // 👉 Jest cherche les fichiers de test dans le dossier __tests__/
  testMatch: ['**/__tests__/**/*.test.js'],
};
