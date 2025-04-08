import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';

// Cargar variables del .env
dotenv.config();

const app = express();

// Variables desde entorno
const port = process.env.PORT || 3000;
const uploadFolder = process.env.UPLOAD_DIR || 'uploads';
console.log('Directorio de subida:', process.env.UPLOAD_DIR);

// Para que __dirname funcione con ESModules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Habilitar CORS para permitir peticiones desde el frontend Angular
app.use(cors());
app.use(express.json());

// Crear carpeta 'uploads' si no existe
const uploadDir = path.join(__dirname, uploadFolder);
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
  const relativePath = `/${process.env.UPLOAD_DIR || 'uploads'}/${req.file.filename}`;
  res.json({
    message: 'Imagen subida correctamente',
    filename: req.file.filename,
    path: relativePath,
  });
});

app.get('/', (req, res) => {
  res.send('API de subida de imágenes en funcionamiento');
});

// Ruta para hacer ls del root directory
app.get('/ls', (req, res) => {
  fs.readdir(uploadDir, (err, files) => {
    if (err) {
      return res.status(500).json({ error: 'Error al leer el directorio' });
    }
    res.json({files, directory: uploadDir });
  });
});

// Servir archivos estáticos desde la carpeta uploads
app.use(`/${process.env.UPLOAD_DIR || 'uploads'}`, express.static(uploadDir));

// Iniciar servidor
app.listen(port, () => {
  console.log(`Servidor corriendo en http://localhost:${port}`);
});
