// Global variables
let allBlogs = [];
let currentBlogId = null;
const BASE_URL = 'https://blog-backend-qc11.onrender.com';

// DOM Content Loaded Event
document.addEventListener('DOMContentLoaded', function() {
    const currentPage = window.location.pathname;
    
    if (currentPage === '/' || currentPage.includes('index.html')) {
        initHomePage();
    } else if (currentPage.includes('post.html')) {
        initPostPage();
    } else if (currentPage.includes('submit.html')) {
        initSubmitPage();
    } else if (currentPage.includes('contact.html')) {
        initContactPage();
    }
    
    // Initialize popup functionality on all pages
    initPopups();
});

// Home Page Functions
function initHomePage() {
    loadBlogs();
    initSearch();
}

function loadBlogs() {
    const loadingSpinner = document.getElementById('loadingSpinner');
    const blogsGrid = document.getElementById('blogsGrid');
    const noBlogsMessage = document.getElementById('noBlogsMessage');
    
    if (loadingSpinner) loadingSpinner.style.display = 'block';
    if (noBlogsMessage) noBlogsMessage.style.display = 'none';
    
    fetch(`${BASE_URL}/api/blogs`)
        .then(response => response.json())
        .then(blogs => {
            allBlogs = blogs;
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            displayBlogs(blogs);
        })
        .catch(error => {
            console.error('Error loading blogs:', error);
            if (loadingSpinner) loadingSpinner.style.display = 'none';
            if (blogsGrid) blogsGrid.innerHTML = '<p class="error">Failed to load blogs. Please try again later.</p>';
        });
}

function displayBlogs(blogs) {
    const blogsGrid = document.getElementById('blogsGrid');
    const noBlogsMessage = document.getElementById('noBlogsMessage');
    
    if (!blogsGrid) return;
    
    if (blogs.length === 0) {
        blogsGrid.innerHTML = '';
        if (noBlogsMessage) noBlogsMessage.style.display = 'block';
        return;
    }
    
    if (noBlogsMessage) noBlogsMessage.style.display = 'none';
    
    blogsGrid.innerHTML = blogs.map(blog => {
        const blogDate = new Date(blog.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        return `
            <div class="blog-card">
                ${blog.image ? 
                    `<img src="${blog.image}" alt="${blog.title}" class="blog-image">` :
                    `<div class="blog-image" style="background: linear-gradient(45deg, #667eea, #764ba2); display: flex; align-items: center; justify-content: center; color: white; font-size: 1.2rem;">No Image</div>`
                }
                <div class="blog-content">
                    <span class="blog-category">${blog.category}</span>
                    <h3 class="blog-title">${blog.title}</h3>
                    <p class="blog-excerpt">${blog.excerpt}</p>
                    <div class="blog-meta">
                        <span class="blog-author">By ${blog.author}</span>
                        <span class="blog-date">${blogDate}</span>
                    </div>
                    <a href="post.html?id=${blog._id}" class="read-more-btn">Read More</a>
                </div>
            </div>
        `;
    }).join('');
}

function initSearch() {
    const searchInput = document.getElementById('searchInput');
    const searchBtn = document.getElementById('searchBtn');
    
    if (!searchInput) return;
    
    // Real-time search
    searchInput.addEventListener('input', function() {
        const searchTerm = this.value.toLowerCase().trim();
        filterBlogs(searchTerm);
    });
    
    // Search button click
    if (searchBtn) {
        searchBtn.addEventListener('click', function() {
            const searchTerm = searchInput.value.toLowerCase().trim();
            filterBlogs(searchTerm);
        });
    }
}

function filterBlogs(searchTerm) {
    if (searchTerm === '') {
        displayBlogs(allBlogs);
        return;
    }
    
    const filteredBlogs = allBlogs.filter(blog => 
        blog.title.toLowerCase().includes(searchTerm) ||
        blog.excerpt.toLowerCase().includes(searchTerm) ||
        blog.author.toLowerCase().includes(searchTerm) ||
        blog.category.toLowerCase().includes(searchTerm)
    );
    
    displayBlogs(filteredBlogs);
}

// Post Page Functions
function initPostPage() {
    const urlParams = new URLSearchParams(window.location.search);
    currentBlogId = urlParams.get('id');
    
    if (currentBlogId) {
        loadBlogPost(currentBlogId);
        initReviewForm();
    } else {
        document.getElementById('blogPost').innerHTML = '<p class="error">Blog post not found.</p>';
    }
}

function loadBlogPost(blogId) {
    fetch(`${BASE_URL}/api/blogs/${blogId}`)
        .then(response => {
            if (!response.ok) {
                throw new Error('Blog not found');
            }
            return response.json();
        })
        .then(blog => {
            displayBlogPost(blog);
            displayReviews(blog.reviews);
        })
        .catch(error => {
            console.error('Error loading blog post:', error);
            document.getElementById('blogPost').innerHTML = '<p class="error">Failed to load blog post.</p>';
        });
}

function displayBlogPost(blog) {
    const blogPost = document.getElementById('blogPost');
    const blogDate = new Date(blog.createdAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
    
    blogPost.innerHTML = `
        ${blog.image ? `<img src="${blog.image}" alt="${blog.title}">` : ''}
        <h1>${blog.title}</h1>
        <div class="meta">
            <span><strong>Category:</strong> ${blog.category}</span>
            <span><strong>Author:</strong> ${blog.author}</span>
            <span><strong>Published:</strong> ${blogDate}</span>
        </div>
        <div class="content">
            ${blog.content.split('\n').map(paragraph => `<p>${paragraph}</p>`).join('')}
        </div>
    `;
    
    // Update page title
    document.title = `${blog.title} - BlogSite`;
}

function displayReviews(reviews) {
    const reviewsList = document.getElementById('reviewsList');
    
    if (!reviews || reviews.length === 0) {
        reviewsList.innerHTML = '<p>No reviews yet. Be the first to leave a review!</p>';
        return;
    }
    
    reviewsList.innerHTML = reviews.map(review => {
        const reviewDate = new Date(review.createdAt).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
        
        return `
            <div class="review-item">
                <div class="review-header">
                    <span class="review-author">${review.name}</span>
                    <span class="review-date">${reviewDate}</span>
                </div>
                <p class="review-comment">${review.comment}</p>
            </div>
        `;
    }).join('');
}

function initReviewForm() {
    const reviewForm = document.getElementById('reviewForm');
    
    if (!reviewForm) return;
    
    reviewForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const formData = new FormData(this);
        const reviewData = {
            name: formData.get('name'),
            comment: formData.get('comment')
        };
        
        fetch(`${BASE_URL}/api/blogs/${currentBlogId}/reviews`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(reviewData)
        })
        .then(response => response.json())
        .then(updatedBlog => {
            displayReviews(updatedBlog.reviews);
            reviewForm.reset();
            showSuccessPopup('Review submitted successfully!');
        })
        .catch(error => {
            console.error('Error submitting review:', error);
            alert('Failed to submit review. Please try again.');
        });
    });
}

// Submit Page Functions
function initSubmitPage() {
    const blogForm = document.getElementById('blogForm');
    
    if (!blogForm) return;
    
    blogForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('submitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        // Show loading state
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        
        const formData = new FormData(this);
        
        fetch(`${BASE_URL}/api/blogs`, {
            method: 'POST',
            body: formData
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to submit blog');
            }
            return response.json();
        })
        .then(blog => {
            blogForm.reset();
            showSuccessPopup('Blog submitted successfully!');
        })
        .catch(error => {
            console.error('Error submitting blog:', error);
            alert('Failed to submit blog. Please try again.');
        })
        .finally(() => {
            // Reset button state
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        });
    });
}

// Contact Page Functions
function initContactPage() {
    const contactForm = document.getElementById('contactForm');
    
    if (!contactForm) return;
    
    contactForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const submitBtn = document.getElementById('contactSubmitBtn');
        const btnText = submitBtn.querySelector('.btn-text');
        const btnLoading = submitBtn.querySelector('.btn-loading');
        
        // Show loading state
        submitBtn.disabled = true;
        btnText.style.display = 'none';
        btnLoading.style.display = 'inline';
        
        const formData = new FormData(this);
        const contactData = {
            name: formData.get('name'),
            email: formData.get('email'),
            message: formData.get('message')
        };
        
        fetch(`${BASE_URL}/api/contact`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(contactData)
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Failed to send message');
            }
            return response.json();
        })
        .then(result => {
            contactForm.reset();
            showSuccessPopup('Message sent successfully! We\'ll get back to you soon.');
        })
        .catch(error => {
            console.error('Error sending message:', error);
            alert('Failed to send message. Please try again.');
        })
        .finally(() => {
            // Reset button state
            submitBtn.disabled = false;
            btnText.style.display = 'inline';
            btnLoading.style.display = 'none';
        });
    });
}

// Popup Functions
function initPopups() {
    const popup = document.getElementById('successPopup');
    const closeBtn = document.querySelector('.popup-close');
    
    if (!popup) return;
    
    // Close popup when clicking the close button
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            popup.style.display = 'none';
        });
    }
    
    // Close popup when clicking outside of it
    popup.addEventListener('click', function(e) {
        if (e.target === popup) {
            popup.style.display = 'none';
        }
    });
    
    // Close popup with Escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && popup.style.display === 'block') {
            popup.style.display = 'none';
        }
    });
}

function showSuccessPopup(message) {
    const popup = document.getElementById('successPopup');
    const messageElement = document.getElementById('successMessage');
    
    if (!popup) return;
    
    if (messageElement) {
        messageElement.textContent = message;
    }
    
    popup.style.display = 'block';
    
    // Auto-close after 3 seconds
    setTimeout(() => {
        popup.style.display = 'none';
    }, 3000);
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

function truncateText(text, maxLength) {
    if (text.length <= maxLength) return text;
    return text.substr(0, maxLength) + '...';
}

// Error Handling
window.addEventListener('error', function(e) {
    console.error('JavaScript error:', e.error);
});

// Network Error Handling
window.addEventListener('online', function() {
    console.log('Connection restored');
});

window.addEventListener('offline', function() {
    console.log('Connection lost');
    alert('Internet connection lost. Some features may not work properly.');
});