import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import some_error from './API/middleware/Error.js';
import pool from './API/Config/DataBase.js';
import Application from './API/Routes/Applications.js';
import Companies from './API/Routes/Companies.js';
import Advertisement from './API/Routes/Advertisements.js';
import People from './API/Routes/People.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api', People);
app.use('/api', Application);
app.use('/api', Companies);
app.use('/api', Advertisement);

app.use(express.static(path.join(__dirname, 'Front')));
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'Front', 'Connexion.html'));
});

app.use(some_error);

pool.connect()
  .then(() => {
    console.log('Connecté à PostgreSQL');
    app.listen(port, () => {
      console.log(`Serveur lancé sur http://localhost:${port}`);
    });
  })
  .catch(err => console.error('Erreur de connexion à PostgreSQL :', err));
