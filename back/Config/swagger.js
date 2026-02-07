import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
import path from "path";

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "API Chat",
      version: "1.0.0",
      description: "Documentation de l’API backend",
    },
  },
  apis: [path.resolve("./Routes/*.js")],
};

const swaggerSpec = swaggerJsdoc(options);

export default function setupSwagger(app) {
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
}