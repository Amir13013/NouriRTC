import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.sendStatus(401);

  const token = authHeader.split(" ")[1];
  const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

  req.user = decoded;
  next();
};
