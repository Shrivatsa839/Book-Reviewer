document.addEventListener('DOMContentLoaded', () => {
  checkLogin();
  loadBooks(); // Load books by default
});

async function checkLogin() {
  const res = await fetch('/is-logged-in');
  const data = await res.json();
  if (data.loggedIn) {
    document.querySelectorAll('.nav-link[href="#"]')[1].style.display = 'none'; // Hide login
    document.querySelectorAll('.nav-link[href="#"]')[2].style.display = 'none'; // Hide register
    document.getElementById('logout').style.display = 'block';
  }
}

document.getElementById('loginForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  const res = await fetch('/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const result = await res.json();
  if (result.success) {
    location.reload();
  } else {
    alert(result.message);
  }
});

document.getElementById('registerForm').addEventListener('submit', async (e) => {
  e.preventDefault();
  const formData = new FormData(e.target);
  const data = Object.fromEntries(formData);
  const res = await fetch('/register', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  const result = await res.json();
  if (result.success) {
    location.reload();
  } else {
    alert(result.message);
  }
});

async function loadBooks() {
  const res = await fetch('/books');
  const books = await res.json();
  const content = document.getElementById('content');
  content.innerHTML = '<h2>Books</h2><div class="row"></div>';
  books.forEach(book => {
    const card = `
      <div class="col-md-4 mb-4">
        <div class="card book-card">
          <img src="${book.cover}" class="card-img-top" alt="${book.title}">
          <div class="card-body">
            <h5 class="card-title">${book.title}</h5>
            <p class="card-text">By ${book.author}</p>
            <a href="#" class="btn btn-primary" onclick="loadBook('${book._id}')">View Details</a>
          </div>
        </div>
      </div>
    `;
    content.querySelector('.row').innerHTML += card;
  });
}
async function loadBook(id) {
  const res = await fetch(`/book/${id}`);
  const { book, reviews } = await res.json();
  const content = document.getElementById('content');
  content.innerHTML = `
    <h2>${book.title}</h2>
    <p>By ${book.author}</p>
    <p>${book.description}</p>
    <img src="${book.cover}" alt="${book.title}" class="img-fluid mb-3" style="max-width: 200px;">
    <h3>Reviews</h3>
    <div id="reviews-list" class="review-list"></div>
    <form id="reviewForm" class="mt-4">
      <div class="mb-3">
        <label>Rating (1-5)</label>
        <input type="number" class="form-control" name="rating" min="1" max="5" required>
      </div>
      <div class="mb-3">
        <label>Review</label>
        <textarea class="form-control" name="text" required></textarea>
      </div>
      <button type="submit" class="btn btn-primary">Submit Review</button>
    </form>
  `;
  reviews.forEach(review => {
    const reviewHtml = `
      <div class="card mb-2">
        <div class="card-body">
          <p class="star-rating">${'★'.repeat(review.rating)}</p>
          <p>${review.text}</p>
          <small>By ${review.userId.email} on ${new Date(review.date).toLocaleDateString()}</small>
        </div>
      </div>
    `;
    document.getElementById('reviews-list').innerHTML += reviewHtml;
  });

  document.getElementById('reviewForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    data.bookId = id;
    const res = await fetch('/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    const result = await res.json();
    if (result.success) {
      loadBook(id); // Reload book details
    } else {
      alert(result.message);
    }
  });
}