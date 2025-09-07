const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const bodyParser = require('body-parser');
const bcrypt = require('bcryptjs');
const path = require('path');

const app = express();
const port = 3000;

// Connect to MongoDB
mongoose.connect('mongodb://localhost:27017/bookreviewdb', { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log(err));

// Middleware
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: 'secretkey',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: 'mongodb://localhost:27017/bookreviewdb' })
}));

// Models
const User = mongoose.model('User', new mongoose.Schema({
  email: { type: String, unique: true },
  password: String
}));

const Book = mongoose.model('Book', new mongoose.Schema({
  title: String,
  author: String,
  description: String,
  cover: String // URL to image
}));

const Review = mongoose.model('Review', new mongoose.Schema({
  bookId: { type: mongoose.Schema.Types.ObjectId, ref: 'Book' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rating: Number,
  text: String,
  date: { type: Date, default: Date.now }
}));

// Prepopulate books if empty
async function populateBooks() {
  if (await Book.countDocuments() === 0) {
    await Book.insertMany([
      {
        title: 'The Great Gatsby',
        author: 'F. Scott Fitzgerald',
        description: 'A classic novel about the American Dream.',
        cover: 'https://i.ibb.co/rKn25Hcz/download.jpg' // Corrected to direct URL
      },
      {
        title: '1984',
        author: 'George Orwell',
        description: 'Dystopian novel on totalitarianism.',
        cover: 'https://i.ibb.co/C5yRgKgZ/download-1.jpg' // Corrected to direct URL
      },
      {
        title: 'To Kill a Mockingbird',
        author: 'Harper Lee',
        description: 'Story of racism and innocence.',
        cover: 'https://i.ibb.co/VWS8C4pk/download-2.jpg' // Corrected to direct URL
      }
    ]);
    console.log('Sample books added');
  }
}
populateBooks();

// Routes
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.post('/register', async (req, res) => {
  const { email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  try {
    const user = new User({ email, password: hashed });
    await user.save();
    req.session.userId = user._id;
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, message: 'Email already exists' });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (user && await bcrypt.compare(password, user.password)) {
    req.session.userId = user._id;
    res.json({ success: true });
  } else {
    res.json({ success: false, message: 'Invalid credentials' });
  }
});

app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/');
});

app.get('/books', async (req, res) => {
  const books = await Book.find();
  res.json(books);
});

app.get('/book/:id', async (req, res) => {
  const book = await Book.findById(req.params.id);
  const reviews = await Review.find({ bookId: req.params.id }).populate('userId', 'email');
  res.json({ book, reviews });
});

app.post('/review', async (req, res) => {
  if (!req.session.userId) return res.json({ success: false, message: 'Login required' });
  const { bookId, rating, text } = req.body;
  const review = new Review({ bookId, userId: req.session.userId, rating, text });
  await review.save();
  res.json({ success: true });
});

app.get('/is-logged-in', (req, res) => {
  res.json({ loggedIn: !!req.session.userId });
});

app.listen(port, () => console.log(`Server running on port ${port}`));