let blogPosts = [];

async function loadBlogList() {
    try {
        const response = await fetch('./posts/posts.json');
        if (!response.ok) throw new Error('Failed to load posts');
        
        blogPosts = await response.json();
        displayPosts(blogPosts);
        document.getElementById('blogList').style.display = 'block';
        document.getElementById('postView').style.display = 'none';
    } catch (error) {
        showError('Failed to load blog posts');
    }
}

async function loadPost(postId) {
    try {
        const post = blogPosts.find(p => p.id === postId);
        if (!post) throw new Error('Post not found');
        
        const response = await fetch(`.${post.path}`); // Add dot for relative path
        if (!response.ok) throw new Error('Failed to load post content');
        
        const content = await response.text();
        document.getElementById('postContent').innerHTML = content;
        document.getElementById('blogList').style.display = 'none';
        document.getElementById('postView').style.display = 'block';
        
        // Update URL without reload
        history.pushState({ postId }, post.title, `/blog?post=${postId}`);
        document.title = `${post.title} - Blog`;
    } catch (error) {
        showError('Failed to load post');
    }
}

// Handle browser back/forward
window.addEventListener('popstate', (event) => {
    if (event.state?.postId) {
        loadPost(event.state.postId);
    } else {
        showBlogList();
    }
});

async function loadPosts() {
    try {
        // Define your first blog post since posts.json isn't set up yet
        blogPosts = [{
            id: "post1",
            title: "Cybersecurity: The Ultimate Guide to Online Safety",
            category: "security",
            date: "2024-01-15",
            author: "Ankur Goswami",
            image: "posts/post1/images/cybersecurity.png",
            summary: "A complete guide to cybersecurity covering threats, solutions, and best practices for individuals and businesses.",
            path: "posts\post1\cybersecurity-basic.html",
            tags: ["Cybersecurity", "Online Safety", "Security"]
        }];
        
        displayPosts(blogPosts);
    } catch (error) {
        console.error('Error loading blog posts:', error);
        showNotification('Failed to load blog posts', 'error');
    }
}

// Display blog posts
function displayPosts(posts) {
    const blogPostsDiv = document.getElementById('blogPosts');
    blogPostsDiv.innerHTML = '';
    
    // Display featured post first
    if (posts.length > 0) {
        const featured = posts[0];
        document.getElementById('featuredPost').innerHTML = `
            <div class="featured-card">
                <img src="${featured.image}" alt="${featured.title}">
                <div class="featured-content">
                    <span class="category">${featured.category}</span>
                    <h2>${featured.title}</h2>
                    <p>${featured.summary}</p>
                    <div class="post-meta">
                        <span><i class="far fa-user"></i> ${featured.author}</span>
                        <span><i class="far fa-calendar"></i> ${formatDate(featured.date)}</span>
                    </div>
                </div>
            </div>
        `;
    }

    // Display remaining posts
    posts.slice(1).forEach(post => {
        const postElement = document.createElement('div');
        postElement.className = 'blog-post';
        postElement.innerHTML = `
            <img src="${post.image}" alt="${post.title}">
            <span class="category">${post.category}</span>
            <h2>${post.title}</h2>
            <p>${post.summary}</p>
            <div class="post-meta">
                <span><i class="far fa-user"></i> ${post.author}</span>
                <span><i class="far fa-calendar"></i> ${formatDate(post.date)}</span>
            </div>
            <div class="tags">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        `;
        postElement.onclick = () => showPost(post);
        blogPostsDiv.appendChild(postElement);
    });
}

// Enhanced filter posts function
function filterPosts() {
    const searchTerm = document.getElementById('searchBar').value.toLowerCase().trim();
    const activeCategory = document.querySelector('.category-btn.active').getAttribute('data-category');
    
    let filteredPosts = [...blogPosts]; // Create a copy of blogPosts array
    
    // Apply category filter if not 'all'
    if (activeCategory && activeCategory !== 'all') {
        filteredPosts = filteredPosts.filter(post => 
            post.category.toLowerCase() === activeCategory.toLowerCase()
        );
    }
    
    // Apply search filter if search term exists
    if (searchTerm) {
        filteredPosts = filteredPosts.filter(post => 
            post.title.toLowerCase().includes(searchTerm) || 
            post.summary.toLowerCase().includes(searchTerm) ||
            post.tags.some(tag => tag.toLowerCase().includes(searchTerm)) ||
            post.category.toLowerCase().includes(searchTerm)
        );
    }
    
    displayPosts(filteredPosts);
    updateSearchMessage(filteredPosts.length, searchTerm);
}

// Show individual post
async function showPost(post) {
    if (!post) return;
    
    try {
        const response = await fetch(post.path);
        if (!response.ok) throw new Error('Failed to load post content');
        const content = await response.text();
        
        // Extract just the article content from the loaded HTML
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = content;
        const articleContent = tempDiv.querySelector('article').innerHTML;
        
        // Hide blog list elements
        document.getElementById('blogList').style.display = 'none';
        
        // Show post content
        const postContentDiv = document.getElementById('postContent');
        postContentDiv.innerHTML = articleContent;
        document.getElementById('postView').style.display = 'block';
        
        // Update URL and title
        history.pushState({ postId: post.id }, post.title, `?post=${post.id}`);
        document.title = `${post.title} - Blog`;
        
    } catch (error) {
        console.error('Error loading post:', error);
        showNotification('Failed to load post content', 'error');
    }
}

// Filter posts by category
function filterByCategory(category) {
    // Update active button
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.classList.remove('active');
        if (btn.getAttribute('data-category') === category) {
            btn.classList.add('active');
        }
    });
    
    // Apply filters
    filterPosts();
}

// Update search results message
function updateSearchMessage(resultCount, searchTerm) {
    const searchMessage = document.getElementById('searchMessage');
    if (!searchMessage) return;

    if (searchTerm) {
        searchMessage.style.display = 'block';
        if (resultCount > 0) {
            searchMessage.textContent = `Found ${resultCount} post${resultCount !== 1 ? 's' : ''} matching "${searchTerm}"`;
            searchMessage.className = 'search-message success';
        } else {
            searchMessage.textContent = `No posts found matching "${searchTerm}"`;
            searchMessage.className = 'search-message error';
        }
    } else {
        searchMessage.style.display = 'none';
    }
}

// Format date
function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// Share post on social media
function sharePost(platform) {
    const url = window.location.href;
    const title = document.querySelector('#postData h1').innerText;
    
    const urls = {
        twitter: `https://twitter.com/intent/tweet?text=${title}&url=${url}`,
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
        linkedin: `https://www.linkedin.com/shareArticle?mini=true&url=${url}&title=${title}`
    };
    
    window.open(urls[platform], '_blank');
}

// Initialize event listeners
document.addEventListener('DOMContentLoaded', () => {
    const blogPostsDiv = document.getElementById('blogPosts');
    if (blogPostsDiv) {
        blogPostsDiv.innerHTML = '<div class="loading">Loading posts...</div>';
        loadPosts();
    }

    // Add search input listener
    const searchBar = document.getElementById('searchBar');
    if (searchBar) {
        searchBar.addEventListener('input', debounce(() => {
            filterPosts();
        }, 300));
    }

    // Add category button listeners
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filterByCategory(btn.getAttribute('data-category'));
        });
    });
});

function showPost(postId) {
    // Hide blog list
    document.getElementById('blogList').style.display = 'none';
    
    // Hide all posts
    document.querySelectorAll('.post-content').forEach(post => {
        post.classList.add('hidden');
    });
    
    // Show selected post
    const postContent = document.getElementById(postId);
    if (postContent) {
        document.getElementById('postView').classList.remove('hidden');
        postContent.classList.remove('hidden');
        window.scrollTo(0, 0);
        
        // Update URL
        history.pushState({ postId }, '', `?post=${postId}`);
    }
}

function showBlogList() {
    // Hide post view
    document.getElementById('postView').classList.add('hidden');
    document.querySelectorAll('.post-content').forEach(post => {
        post.classList.add('hidden');
    });
    
    // Show blog list
    document.getElementById('blogList').style.display = 'block';
    
    // Update URL
    history.pushState({}, '', window.location.pathname);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const postId = params.get('post');
    
    if (postId) {
        showPost(postId);
    }
});

// Handle browser back/forward
window.addEventListener('popstate', (event) => {
    if (event.state?.postId) {
        showPost(event.state.postId);
    } else {
        showBlogList();
    }
});

// Load components
async function loadComponent(elementId, path) {
    try {
        const response = await fetch(path);
        const html = await response.text();
        document.getElementById(elementId).innerHTML = html;
        
        // Reinitialize components after loading
        if (elementId === 'header-container') {
            initializeThemeToggle();
        }
    } catch (error) {
        console.error('Error loading component:', error);
    }
}

// Theme toggle functionality
function initializeThemeToggle() {
    const themeToggle = document.getElementById('theme-toggle');
    const icon = themeToggle.querySelector('i');
    
    // Get saved theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        document.body.className = savedTheme;
        updateThemeIcon(icon, savedTheme);
    }

    themeToggle?.addEventListener('click', () => {
        if (document.body.classList.contains('eye-comfort-theme')) {
            document.body.className = '';
        } else {
            document.body.className = 'eye-comfort-theme';
        }
        
        // Save theme preference
        localStorage.setItem('theme', document.body.className);
        updateThemeIcon(icon, document.body.className);
    });
}

function updateThemeIcon(icon, theme) {
    if (theme.includes('eye-comfort')) {
        icon.className = 'fas fa-eye-slash';
        icon.parentElement.title = 'Switch to Normal Mode';
    } else {
        icon.className = 'fas fa-eye';
        icon.parentElement.title = 'Switch to Eye Comfort Mode';
    }
}

// About page popup functions
function showAbout() {
    document.getElementById('about-content').style.display = 'block';
    closeContactPopup();
}

function showContactPopup() {
    document.getElementById('contact-popup').style.display = 'flex';
}

function closeContactPopup() {
    document.getElementById('contact-popup').style.display = 'none';
}

// Initialize popup events
document.addEventListener('DOMContentLoaded', () => {
    const blogPostsDiv = document.getElementById('blogPosts');
    if (blogPostsDiv) {
        blogPostsDiv.innerHTML = '<div class="loading">Loading posts...</div>';
        loadPosts();
    }

    // Add search input listener
    const searchBar = document.getElementById('searchBar');
    if (searchBar) {
        searchBar.addEventListener('input', debounce(() => {
            filterPosts();
        }, 300));
    }

    // Add category button listeners
    document.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            filterByCategory(btn.getAttribute('data-category'));
        });
    });
    
    // Add popup click handler
    const contactPopup = document.getElementById('contact-popup');
    if (contactPopup) {
        contactPopup.addEventListener('click', function(e) {
            if (e.target === this) {
                closeContactPopup();
            }
        });
    }
});

// Initialize components
document.addEventListener('DOMContentLoaded', () => {
    loadComponent('header-container', '/components/header.html');
    loadComponent('footer-container', '/components/footer.html');
    
    // Handle contact form submission if on contact page
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Form submitted! (Note: This is just a demo - no backend processing)');
            contactForm.reset();
        });
    }
});

// Dropdown functionality
document.addEventListener('DOMContentLoaded', () => {
    const dropdowns = document.querySelectorAll('.dropdown');
    
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('.dropdown-toggle');
        
        // Handle click events
        toggle?.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            
            // Close all other dropdowns
            dropdowns.forEach(other => {
                if (other !== dropdown) {
                    other.classList.remove('active');
                }
            });
            
            // Toggle current dropdown
            dropdown.classList.toggle('active');
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', () => {
        dropdowns.forEach(dropdown => {
            dropdown.classList.remove('active');
        });
    });

    // Prevent dropdown menu clicks from closing
    document.querySelectorAll('.dropdown-menu').forEach(menu => {
        menu.addEventListener('click', (e) => {
            e.stopPropagation();
        });
    });
});

// Dropdown functionality
document.addEventListener('DOMContentLoaded', () => {
    const dropdowns = document.querySelectorAll('[data-dropdown]');
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navLinks = document.querySelector('.nav-links');

    // Toggle mobile menu
    mobileToggle?.addEventListener('click', () => {
        navLinks.classList.toggle('active');
    });

    // Handle dropdowns
    dropdowns.forEach(dropdown => {
        const toggle = dropdown.querySelector('[data-dropdown-toggle]');
        
        // Desktop hover
        if (window.innerWidth > 768) {
            dropdown.addEventListener('mouseenter', () => {
                dropdown.classList.add('active');
            });
            
            dropdown.addEventListener('mouseleave', () => {
                dropdown.classList.remove('active');
            });
        }
        
        // Mobile click
        toggle?.addEventListener('click', (e) => {
            if (window.innerWidth <= 768) {
                e.preventDefault();
                dropdown.classList.toggle('active');
                
                // Close other dropdowns
                dropdowns.forEach(other => {
                    if (other !== dropdown) {
                        other.classList.remove('active');
                    }
                });
            }
        });
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('[data-dropdown]')) {
            dropdowns.forEach(dropdown => {
                dropdown.classList.remove('active');
            });
        }
    });
});

// Blog loading functionality
function loadLatestBlogs() {
    fetch('./api/posts.json')
        .then(response => response.json())
        .then(data => {
            const container = document.getElementById('blog-container');
            if (container) {
                container.innerHTML = data.posts.slice(0, 5).map(post => `
                    <article class="blog-preview clickable">
                        <h3>${post.title}</h3>
                        <p>${post.excerpt}</p>
                        <a href="./blog/${post.slug}.html">Read more</a>
                    </article>
                `).join('');
            }
        })
        .catch(error => console.error('Error loading blogs:', error));
}

// Contact popup functions
function showContactPopup() {
    const popup = document.getElementById('contact-popup');
    if (popup) popup.style.display = 'flex';
}

function closeContactPopup() {
    const popup = document.getElementById('contact-popup');
    if (popup) popup.style.display = 'none';
}

// Initialize all functionality
document.addEventListener('DOMContentLoaded', () => {
    // Load components
    loadComponent('header-container', './components/header.html');
    loadComponent('footer-container', './components/footer.html');
    
    // Initialize blog loading if on index page
    if (document.getElementById('blog-container')) {
        loadLatestBlogs();
        setInterval(loadLatestBlogs, 300000);
    }
    
    // Initialize contact form if exists
    const contactForm = document.getElementById('contact-form');
    if (contactForm) {
        contactForm.addEventListener('submit', (e) => {
            e.preventDefault();
            alert('Message sent! (Demo only)');
            closeContactPopup();
        });
    }
});
