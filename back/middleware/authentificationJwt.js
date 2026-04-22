import jwt from "jsonwebtoken";

// 👉 ce middleware se met devant chaque route protégée
// 👉 si le token est absent ou invalide → on bloque direct, le controller est jamais appelé
export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  // 👉 si y'a pas de header Authorization du tout → 401, pas la peine d'aller plus loin
  if (!authHeader) return res.sendStatus(401);

  // 👉 le header ressemble à "Bearer xxxxx", je prends juste la partie après l'espace
  const token = authHeader.split(" ")[1];
  try {
    // 👉 je vérifie que le token est valide et signé avec ma clé secrète
    // 👉 si le token est expiré ou modifié → jwt.verify lance une erreur → catch → 401
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    // 👉 je colle l'utilisateur décodé dans la requête pour que tous les controllers y aient accès
    req.user = decoded;
    // 👉 tout est bon → je passe au controller suivant
    next();
  } catch {
    // 👉 token invalide ou expiré → on refuse l'accès
    return res.sendStatus(401);
  }
};
