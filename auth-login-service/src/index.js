const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

dotenv.config();

const { PORT = 4001, MONGO_URI = 'mongodb://localhost:27017/ebiblio', JWT_SECRET = 'supersecretkey' } = process.env;

mongoose.connect(MONGO_URI).then(() => console.log('Auth-login connected to MongoDB')).catch((err) => console.error('Mongo error', err));

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

app.post('/auth/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ message: 'Email et mot de passe requis' });
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Identifiants invalides' });
    const valid = await bcrypt.compare(password, user.password || '');
    if (!valid) return res.status(401).json({ message: 'Identifiants invalides' });
    if (!user.isActive) return res.status(403).json({ message: 'Compte inactif. Veuillez vérifier votre email.' });
    if (!user.firstLoginCompleted) {
      return res.status(403).json({
        message: 'Veuillez changer votre mot de passe avant de continuer.',
        requirePasswordChange: true,
        email: user.email
      });
    }
    user.lastLogin = new Date();
    await user.save();
    const token = generateToken(user);
    const payload = user.toObject();
    delete payload.password;
    res.json({ token, user: { ...payload, id: user._id } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Erreur serveur' });
  }
});

app.get('/', (req, res) => res.json({ status: 'auth-login ok' }));

app.listen(PORT, () => console.log(`auth-login-service running on ${PORT}`));
