import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { db } from './db.js';
import dotenv from 'dotenv';

// Cargar variables del .env
dotenv.config();

const app = express();

// Variables desde entorno
const port = process.env.PORT || 3000;

// Para que __dirname funcione con ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Habilitar CORS para permitir peticiones desde el frontend Angular
app.use(cors());
app.use(express.json());

// Crear carpeta 'uploads' si no existe
// NUEVO: usar ruta absoluta de variable de entorno o fallback local

const uploadDir = process.env.UPLOAD_DIR_PATH || path.join(__dirname, 'uploads');
console.log('Directorio de subida:', process.env.UPLOAD_DIR_PATH);


if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Configuración de Multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDir); // Carpeta donde se guardan las imágenes
  },
  filename: function (req, file, cb) {
    // Nombre único del archivo 
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ storage: storage });

// Ruta para subir imagen
app.post('/upload', upload.single('image'), (req, res) => {
  console.log('Archivo recibido:', req.file);
  if (!req.file) {
    return res.status(400).json({ message: 'No se subió ningún archivo' });
  }
  const filePath = `/images/${req.file.filename}`; // Cambiamos esto si querés servir desde ahí
  res.json({
    message: 'Imagen subida correctamente',
    filename: req.file.filename,
    path: filePath,
  });
});

app.get('/', (req, res) => {
  res.send('API de subida de imágenes en funcionamiento');
});

// Ruta para hacer ls del images/uploads directory
app.get('/ls-uploads', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error al leer el directorio' });
    }
    res.json({files, directory: uploadDir });
  });
});

// Get a random image from the upload directory
app.get('/random-cow', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error al leer el directorio' });
    }
    const randomFile = files[Math.floor(Math.random() * files.length)];
    const filePath = `/images/${ randomFile }`;
    res.json({url: filePath});
  });
});

app.get('/ls-root', (req, res) => {
  fs.readdir('/', (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error al leer el directorio' });
    }
    res.json({files, directory: '/' });
  });
});

app.get('/ls', (req, res) => {
  const dir = req.query.dir || '/';
  fs.readdir(dir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error al leer el directorio' });
    }
    res.json({files, directory: dir });
  });
});

app.post('/like/:image', async (req, res) => {
  const image = req.params.image;
  try {
    const [result] = await db.execute(
      'INSERT INTO image_likes (image_name) VALUES (?)',
      [image]
    );
    res.json({ success: true, id: result.insertId });
  } catch (err) {
    console.error('Error al guardar like:', err);
    res.status(500).json({ success: false, error: 'Error en el servidor' });
  }
});

// Servir archivos estáticos desde la carpeta uploads
app.use(`/images`, express.static(uploadDir));

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
