const express = require('express');
const mongoose = require('mongoose');
const multer = require('multer');
const nodemailer = require('nodemailer');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Models
const Blog = require('./models/Blog');
const Contact = require('./models/Contact');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('frontend'));
app.use('/uploads', express.static('uploads'));

// MongoDB Connection
mongoose.connect(
  'mongodb+srv://rohithagent69:LHqCMeXmkOaHIaSo@evilcluster.4qkmu4k.mongodb.net/blogDB?retryWrites=true&w=majority&appName=evilcluster',
  { useNewUrlParser: true, useUnifiedTopology: true }
)
.then(() => console.log('✅ MongoDB connected'))
.catch((err) => console.error('❌ MongoDB connection error:', err));

// Multer (image upload) setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);
    if (extname && mimetype) return cb(null, true);
    cb(new Error('Only image files are allowed'));
  },
});

// ✅ Nodemailer setup (fixed)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'rohithagent69@gmail.com',
    pass: process.env.EMAIL_PASS || 'xcjhyrxmtmbmiaoy',
  },
});

// ------------------- ROUTES -------------------

// Get all blogs
app.get('/api/blogs', async (req, res) => {
  try {
    const blogs = await Blog.find().sort({ createdAt: -1 });
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single blog
app.get('/api/blogs/:id', async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });
    res.json(blog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create blog (with image upload)
app.post('/api/blogs', upload.single('image'), async (req, res) => {
  try {
    const { title, excerpt, content, category, author } = req.body;

    if (!title || !excerpt || !content || !author || !req.file) {
      return res.status(400).json({ error: 'All fields including image are required' });
    }

    const blog = new Blog({
      title,
      excerpt,
      content,
      category,
      author,
      image: `/uploads/${req.file.filename}`,
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Add review to blog
app.post('/api/blogs/:id/reviews', async (req, res) => {
  try {
    const { name, comment } = req.body;
    const blog = await Blog.findById(req.params.id);
    if (!blog) return res.status(404).json({ error: 'Blog not found' });

    blog.reviews.push({
      name,
      comment,
      createdAt: new Date(),
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Contact form route
app.post('/api/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;

    const contact = new Contact({ name, email, message });
    await contact.save();

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: 'New Contact Form Submission',
      html: `
        <h3>New Contact Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong> ${message}</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    res.status(201).json({ message: 'Contact form submitted successfully' });
  } catch (error) {
    console.error('❌ Contact form error:', error);
    res.status(500).json({ error: 'Failed to submit contact form' });
  }
});

// Static HTML Pages
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'index.html')));
app.get('/post.html', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'post.html')));
app.get('/submit.html', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'submit.html')));
app.get('/contact.html', (req, res) => res.sendFile(path.join(__dirname, 'frontend', 'contact.html')));

// Ensure "uploads" directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running at: http://localhost:${PORT}`);
});
