const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const {
  PORT = 4002,
  MONGO_URI = 'mongodb://localhost:27017/ebiblio',
  JWT_SECRET = 'supersecretkey',
  ADMIN_EMAIL = 'taha.chakouat@gmail.com',
  ADMIN_PASSWORD = 'admin123'
} = process.env;

mongoose.connect(MONGO_URI).then(() => console.log('Auth-register connected to MongoDB')).catch((err) => console.error('Mongo error', err));

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  email: { type: String, unique: true },
  password: String,
  role: { type: String, default: 'user' },
  status: { type: String, default: 'actif' },
  isActive: { type: Boolean, default: true },
  firstLoginCompleted: { type: Boolean, default: true },
  lastLogin: Date,
  address: {
    rue: String,
    ville: String,
    codePostal: String,
    pays: String,
  },
  stats: {
    totalCommandes: { type: Number, default: 0 },
    totalDepense: { type: Number, default: 0 },
    livresAchetes: { type: Number, default: 0 },
    livresLoues: { type: Number, default: 0 }
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

const app = express();
app.use(cors());
app.use(express.json());

function generateToken(user) {
  return jwt.sign({ userId: user._id.toString(), role: user.role, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
}

function sanitize(user) {
  const payload = user.toObject();
  delete payload.password;
  return { ...payload, id: user._id };
}

app.post('/auth/register', async (req, res) => {
  const { firstName, lastName, email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email et mot de passe requis' });
  try {
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Utilisateur déjà enregistré' });

    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({
      firstName,
      lastName,
      email,
      password: hashed,
      role: 'user',
      status: 'actif',
      isActive: true,
      firstLoginCompleted: true,
    });

    const token = generateToken(user);
    res.status(201).json({ token, user: sanitize(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de l\'inscription' });
  }
});

app.post('/auth/complete-first-login', async (req, res) => {
  const { email, temporaryPassword, newPassword } = req.body;
  if (!email || !temporaryPassword || !newPassword) {
    return res.status(400).json({ message: 'Champs requis manquants' });
  }
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });

    const valid = await bcrypt.compare(temporaryPassword, user.password || '');
    if (!valid) return res.status(401).json({ message: 'Mot de passe provisoire invalide' });

    user.password = await bcrypt.hash(newPassword, 10);
    user.firstLoginCompleted = true;
    user.isActive = true;
    await user.save();

    const token = generateToken(user);
    res.json({ token, user: sanitize(user) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur lors de la mise à jour du mot de passe' });
  }
});

app.get('/', (req, res) => res.json({ status: 'auth-register ok' }));

async function seedAdmin() {
  try {
    const admin = await User.findOne({ email: ADMIN_EMAIL });
    if (!admin) {
      const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
      await User.create({
        firstName: 'Admin',
        lastName: 'eBiblio',
        email: ADMIN_EMAIL,
        password: hashed,
        role: 'admin',
        status: 'actif',
        isActive: true,
        firstLoginCompleted: true,
      });
      console.log('Admin seed created');
    }
  } catch (err) {
    console.error('Admin seed failed', err);
  }
}

seedAdmin();

app.listen(PORT, () => console.log(`auth-register-service running on ${PORT}`));
