const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const { PORT = 4003, MONGO_URI = 'mongodb://localhost:27017/ebiblio', JWT_SECRET = 'supersecretkey' } = process.env;

mongoose.connect(MONGO_URI).then(() => console.log('User-profile connected to MongoDB')).catch((err) => console.error('Mongo error', err));

const userSchema = new mongoose.Schema({
  firstName: String,
  lastName: String,
  name: String,
  email: { type: String, unique: true },
  password: String,
  avatar: String,
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

function authRequired(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) return res.status(401).json({ message: 'Token manquant' });
  try {
    const token = header.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ message: 'Token invalide' });
  }
}

function sanitize(user) {
  const payload = user.toObject();
  delete payload.password;
  return { ...payload, id: user._id };
}

app.get('/users/me', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(sanitize(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.patch('/users/me', authRequired, async (req, res) => {
  try {
    const allowed = ['firstName', 'lastName', 'name', 'avatar', 'address'];
    const updates = {};
    allowed.forEach((key) => {
      if (typeof req.body[key] !== 'undefined') updates[key] = req.body[key];
    });
    const user = await User.findByIdAndUpdate(req.user.userId, updates, { new: true });
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    res.json(sanitize(user));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.delete('/users/me', authRequired, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    user.status = 'supprime';
    user.isActive = false;
    await user.save();
    res.json({ message: 'Compte supprimé' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.patch('/users/me/password', authRequired, async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) return res.status(400).json({ message: 'Champs requis manquants' });
  try {
    const user = await User.findById(req.user.userId);
    if (!user) return res.status(404).json({ message: 'Utilisateur introuvable' });
    const valid = await bcrypt.compare(oldPassword, user.password || '');
    if (!valid) return res.status(401).json({ message: 'Ancien mot de passe incorrect' });
    user.password = await bcrypt.hash(newPassword, 10);
    user.firstLoginCompleted = true;
    await user.save();
    res.json({ message: 'Mot de passe mis à jour' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/', (req, res) => res.json({ status: 'user-profile ok' }));

app.listen(PORT, () => console.log(`user-profile-service running on ${PORT}`));
