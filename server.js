const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cloudinary = require('./config/cloudinary'); // Cloudinary config
const { CloudinaryStorage } = require('multer-storage-cloudinary');
require('dotenv').config();

const app = express();

// ====== Middleware ======
app.use(cors({
  origin: [
    "http://localhost:3000",
    "https://blogit-frontend-minnulekha-minnulekhas-projects.vercel.app"
  ],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ====== MongoDB Connection ======
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 10000
})
.then(() => console.log('✅ MongoDB connected'))
.catch(err => {
  console.error('❌ MongoDB connection error:', err.message);
  process.exit(1);
});

// ====== Cloudinary Storage for Multer ======
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'blogit',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    public_id: (req, file) => `${Date.now()}-${file.originalname.replace(/\s+/g, '-')}`
  }
});

const upload = multer({ storage });

// ====== Models ======
const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true },
  passwordHash: { type: String, required: true }
}, { timestamps: true });
const User = mongoose.model('User', userSchema);

const postSchema = new mongoose.Schema({
  title: { type: String, required: true },
  content: { type: String, required: true },
  imageUrl: { type: String },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });
const Post = mongoose.model('Post', postSchema);

// ====== Auth Middleware ======
function requireAuth(req, res, next) {
  const auth = req.headers.authorization || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'No token provided' });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// ====== Auth Routes ======
app.post('/auth/signup', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields required' });

    const exists = await User.findOne({ $or: [{ email }, { username }] });
    if (exists) return res.status(409).json({ error: 'User with email/username already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ username, email, passwordHash });

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error("❌ Signup error:", err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'All fields required' });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ error: 'Invalid credentials' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, username: user.username, email: user.email } });
  } catch (err) {
    console.error("❌ Login error:", err);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.get('/auth/me', requireAuth, async (req, res) => {
  const user = await User.findById(req.user.id).select('_id username email');
  res.json({ user });
});

// ====== Post Routes ======
app.post('/posts', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const { title, content } = req.body;
    if (!title || !content) return res.status(400).json({ error: 'Title and content required' });

    const imageUrl = req.file ? req.file.path : undefined;
    const post = await Post.create({ title, content, imageUrl, author: req.user.id });
    const populated = await post.populate('author', 'username email');
    res.json(populated);
  } catch (err) {
    console.error("❌ Post create error:", err);
    res.status(500).json({ error: 'Create failed' });
  }
});

app.get('/posts', async (req, res) => {
  const posts = await Post.find().sort({ createdAt: -1 }).populate('author', 'username email');
  res.json(posts);
});

app.get('/posts/:id', async (req, res) => {
  const post = await Post.findById(req.params.id).populate('author', 'username email');
  if (!post) return res.status(404).json({ error: 'Not found' });
  res.json(post);
});

app.put('/posts/:id', requireAuth, upload.single('image'), async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    if (post.author.toString() !== req.user.id) return res.status(403).json({ error: 'Not your post' });

    const { title, content } = req.body;
    if (title !== undefined) post.title = title;
    if (content !== undefined) post.content = content;
    if (req.file) post.imageUrl = req.file.path;

    await post.save();
    const populated = await post.populate('author', 'username email');
    res.json(populated);
  } catch (err) {
    console.error("❌ Post update error:", err);
    res.status(500).json({ error: 'Update failed' });
  }
});

app.delete('/posts/:id', requireAuth, async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    if (!post) return res.status(404).json({ error: 'Not found' });
    if (post.author.toString() !== req.user.id) return res.status(403).json({ error: 'Not your post' });

    await Post.findByIdAndDelete(req.params.id);
    res.json({ message: 'Post deleted' });
  } catch (err) {
    console.error("❌ Post delete error:", err);
    res.status(500).json({ error: 'Delete failed' });
  }
});

// ====== Start Server ======
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
