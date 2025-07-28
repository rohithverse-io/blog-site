const BASE_URL = 'https://blog-backend-qc11.onrender.com'; // ✅ Your backend URL

// Load Blogs
async function loadBlogs() {
    try {
        const response = await fetch(`${BASE_URL}/api/blogs`);
        const blogs = await response.json();
        const blogContainer = document.getElementById('blog-container');
        if (!blogContainer) return;

        blogContainer.innerHTML = '';

        blogs.forEach((blog, index) => {
            const blogCard = document.createElement('div');
            blogCard.className = 'blog-card';

            blogCard.innerHTML = `
                <img src="${blog.image}" alt="${blog.title}">
                <h3>${blog.title}</h3>
                <p>${blog.excerpt}</p>
                <p><strong>Author:</strong> ${blog.author || 'Anonymous'}</p>
                <button onclick="viewBlog('${blog._id}')">Read More</button>
            `;

            blogContainer.appendChild(blogCard);
        });
    } catch (error) {
        console.error('Error loading blogs:', error);
    }
}

function viewBlog(id) {
    window.location.href = `post.html?id=${id}`;
}

// Blog Submit
document.addEventListener('DOMContentLoaded', () => {
    const blogForm = document.getElementById('blog-form');
    if (blogForm) {
        blogForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const formData = new FormData(blogForm);
            try {
                const response = await fetch(`${BASE_URL}/api/blogs`, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    showPopup('Blog submitted successfully!');
                    blogForm.reset();
                } else {
                    console.error('Blog submission failed:', await response.text());
                    alert('Failed to submit blog.');
                }
            } catch (error) {
                console.error('Error submitting blog:', error);
            }
        });
    }

    // Contact form
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            const name = document.getElementById('name')?.value;
            const email = document.getElementById('email')?.value;
            const message = document.getElementById('message')?.value;

            try {
                const response = await fetch(`${BASE_URL}/api/contact`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ name, email, message }),
                });

                if (response.ok) {
                    showPopup('Message sent successfully!');
                    contactForm.reset();
                } else {
                    alert('Failed to send message.');
                }
            } catch (error) {
                console.error('Error sending message:', error);
                alert('Something went wrong!');
            }
        });
    }

    // Blog detail page
    if (window.location.pathname.endsWith('post.html')) {
        loadBlogDetails();
    }

    // Load blogs on homepage
    if (document.getElementById('blog-container')) {
        loadBlogs();
    }
});

// Show popup
function showPopup(message) {
    let popup = document.getElementById('popup');
    if (!popup) {
        popup = document.createElement('div');
        popup.id = 'popup';
        popup.style.position = 'fixed';
        popup.style.bottom = '20px';
        popup.style.left = '50%';
        popup.style.transform = 'translateX(-50%)';
        popup.style.background = '#4caf50';
        popup.style.color = '#fff';
        popup.style.padding = '10px 20px';
        popup.style.borderRadius = '5px';
        popup.style.zIndex = 1000;
        document.body.appendChild(popup);
    }

    popup.textContent = message;
    popup.style.display = 'block';

    setTimeout(() => {
        popup.style.display = 'none';
    }, 3000);
}

// Load blog details and reviews
async function loadBlogDetails() {
    const urlParams = new URLSearchParams(window.location.search);
    const blogId = urlParams.get('id');

    if (!blogId) {
        document.getElementById('post-container').innerHTML = '<p>Blog not found.</p>';
        return;
    }

    try {
        const blogRes = await fetch(`${BASE_URL}/api/blogs/${blogId}`);
        const blog = await blogRes.json();

        const container = document.getElementById('post-container');
        container.innerHTML = `
            <h1>${blog.title}</h1>
            <img src="${blog.image}" alt="${blog.title}" class="post-image">
            <p>${blog.content}</p>
            <p><strong>Author:</strong> ${blog.author || 'Anonymous'}</p>
            <div id="reviews-container">
                <h3>Reviews</h3>
                <ul id="reviews-list"></ul>
            </div>
            <form id="review-form">
                <h4>Leave a Review:</h4>
                <input type="text" id="reviewer" placeholder="Your Name" required><br>
                <textarea id="reviewText" placeholder="Your Review" required></textarea><br>
                <button type="submit">Submit Review</button>
            </form>
        `;

        loadReviews(blogId);

        const reviewForm = document.getElementById('review-form');
        reviewForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const reviewer = document.getElementById('reviewer').value;
            const reviewText = document.getElementById('reviewText').value;

            const res = await fetch(`${BASE_URL}/api/blogs/${blogId}/reviews`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ reviewer, review: reviewText }),
            });

            if (res.ok) {
                showPopup('Review submitted!');
                reviewForm.reset();
                loadReviews(blogId);
            } else {
                alert('Failed to submit review.');
            }
        });

    } catch (error) {
        console.error('Error loading blog details:', error);
    }
}

// Load Reviews
async function loadReviews(blogId) {
    try {
        const res = await fetch(`${BASE_URL}/api/blogs/${blogId}/reviews`);
        const data = await res.json();

        const list = document.getElementById('reviews-list');
        list.innerHTML = '';

        data.forEach(review => {
            const li = document.createElement('li');
            li.textContent = `${review.reviewer}: ${review.review}`;
            list.appendChild(li);
        });
    } catch (error) {
        console.error('Error loading reviews:', error);
    }
}

// Search
const searchInput = document.getElementById('search-input');
if (searchInput) {
    searchInput.addEventListener('input', async () => {
        const query = searchInput.value.toLowerCase();
        try {
            const res = await fetch(`${BASE_URL}/api/blogs`);
            const blogs = await res.json();
            const filtered = blogs.filter(blog =>
                blog.title.toLowerCase().includes(query) ||
                blog.excerpt.toLowerCase().includes(query) ||
                blog.content.toLowerCase().includes(query)
            );

            const blogContainer = document.getElementById('blog-container');
            blogContainer.innerHTML = '';

            filtered.forEach(blog => {
                const blogCard = document.createElement('div');
                blogCard.className = 'blog-card';
                blogCard.innerHTML = `
                    <img src="${blog.image}" alt="${blog.title}">
                    <h3>${blog.title}</h3>
                    <p>${blog.excerpt}</p>
                    <p><strong>Author:</strong> ${blog.author || 'Anonymous'}</p>
                    <button onclick="viewBlog('${blog._id}')">Read More</button>
                `;
                blogContainer.appendChild(blogCard);
            });
        } catch (error) {
            console.error('Search failed:', error);
        }
    });
}