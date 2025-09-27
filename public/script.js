// Theme Management
function initTheme() {
    // Set dark theme as default
    const currentTheme = localStorage.getItem('theme') || 'dark';
    console.log('Initializing theme:', currentTheme);
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
}

function toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    
    console.log('Toggling theme from', currentTheme, 'to', newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    updateThemeIcon(newTheme);
}

function updateThemeIcon(theme) {
    const themeToggles = document.querySelectorAll('.theme-toggle');
    themeToggles.forEach(toggle => {
        if (toggle) {
            toggle.textContent = theme === 'dark' ? '☀️' : '🌙';
            toggle.title = theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme';
            // Ensure click handler is attached
            toggle.onclick = toggleTheme;
        }
    });
}

// Make functions globally available
window.initTheme = initTheme;
window.toggleTheme = toggleTheme;
window.updateThemeIcon = updateThemeIcon;
window.toggleMobileNav = toggleMobileNav;

// Initialize theme immediately
initTheme();

// Mobile Navigation
function toggleMobileNav() {
    const navLinks = document.querySelector('.nav-links');
    const navToggle = document.querySelector('.nav-toggle');
    
    if (navLinks && navToggle) {
        navLinks.classList.toggle('active');
        navToggle.classList.toggle('active');
    }
}

// Close mobile nav when clicking outside
document.addEventListener('click', function(event) {
    const navLinks = document.querySelector('.nav-links');
    const navToggle = document.querySelector('.nav-toggle');
    const mainNav = document.querySelector('.main-nav');
    
    if (navLinks && navToggle && mainNav) {
        if (!mainNav.contains(event.target) && navLinks.classList.contains('active')) {
            navLinks.classList.remove('active');
            navToggle.classList.remove('active');
        }
    }
});

// Close mobile nav when window is resized to desktop
window.addEventListener('resize', function() {
    if (window.innerWidth > 768) {
        const navLinks = document.querySelector('.nav-links');
        const navToggle = document.querySelector('.nav-toggle');
        
        if (navLinks && navToggle) {
            navLinks.classList.remove('active');
            navToggle.classList.remove('active');
        }
    }
});

// AJAX Search functionality
let searchTimeout;
let currentSearchRequest;

function handleQuickSearch(event) {
    // Allow normal form submission for now
    return true;
}

function initializeQuickSearch() {
    const searchInput = document.getElementById('quick-search-input');
    const searchResults = document.getElementById('search-results');
    
    if (!searchInput || !searchResults) return;
    
    searchInput.addEventListener('input', function() {
        const query = this.value.trim();
        
        // Clear previous timeout
        if (searchTimeout) {
            clearTimeout(searchTimeout);
        }
        
        // Cancel previous request
        if (currentSearchRequest) {
            currentSearchRequest.abort();
        }
        
        if (query.length < 2) {
            searchResults.style.display = 'none';
            searchResults.innerHTML = '';
            return;
        }
        
        // Debounce search
        searchTimeout = setTimeout(() => {
            performQuickSearch(query);
        }, 300);
    });
    
    // Hide search results when clicking outside
    document.addEventListener('click', function(event) {
        if (!searchInput.contains(event.target) && !searchResults.contains(event.target)) {
            searchResults.style.display = 'none';
        }
    });
    
    // Handle keyboard navigation
    searchInput.addEventListener('keydown', function(event) {
        const results = searchResults.querySelectorAll('.search-result-item');
        const selected = searchResults.querySelector('.search-result-item.selected');
        
        if (event.key === 'ArrowDown') {
            event.preventDefault();
            if (selected) {
                selected.classList.remove('selected');
                const next = selected.nextElementSibling;
                (next || results[0]).classList.add('selected');
            } else if (results.length > 0) {
                results[0].classList.add('selected');
            }
        } else if (event.key === 'ArrowUp') {
            event.preventDefault();
            if (selected) {
                selected.classList.remove('selected');
                const prev = selected.previousElementSibling;
                (prev || results[results.length - 1]).classList.add('selected');
            } else if (results.length > 0) {
                results[results.length - 1].classList.add('selected');
            }
        } else if (event.key === 'Enter') {
            if (selected) {
                event.preventDefault();
                selected.click();
            }
        } else if (event.key === 'Escape') {
            searchResults.style.display = 'none';
        }
    });
}

async function performQuickSearch(query) {
    const searchResults = document.getElementById('search-results');
    
    if (!searchResults) return;
    
    try {
        const controller = new AbortController();
        currentSearchRequest = controller;
        
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&limit=5`, {
            signal: controller.signal
        });
        
        if (!response.ok) {
            throw new Error('Search failed');
        }
        
        const data = await response.json();
        displaySearchResults(data.results || []);
        
    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('Search error:', error);
            searchResults.innerHTML = '<div class="search-error">Search failed</div>';
            searchResults.style.display = 'block';
        }
    } finally {
        currentSearchRequest = null;
    }
}

function displaySearchResults(results) {
    const searchResults = document.getElementById('search-results');
    
    if (!searchResults) return;
    
    if (results.length === 0) {
        searchResults.innerHTML = '<div class="search-no-results">No results found</div>';
        searchResults.style.display = 'block';
        return;
    }
    
    const html = results.map(paste => `
        <div class="search-result-item" data-paste-id="${paste.id}">
            <div class="search-result-title">${escapeHtml(paste.title || 'Untitled')}</div>
            <div class="search-result-meta">
                ${paste.language ? `<span class="language-tag">${escapeHtml(paste.language)}</span>` : ''}
                <span class="result-date">${new Date(paste.createdAt).toLocaleDateString()}</span>
                <span class="result-views">${paste.views} views</span>
            </div>
            <div class="search-result-preview">${escapeHtml(paste.content.substring(0, 100))}${paste.content.length > 100 ? '...' : ''}</div>
        </div>
    `).join('');
    
    searchResults.innerHTML = html;
    searchResults.style.display = 'block';
    
    // Add click listeners to search results
    const resultItems = searchResults.querySelectorAll('.search-result-item');
    resultItems.forEach(item => {
        item.addEventListener('click', function(e) {
            e.preventDefault();
            const pasteId = this.getAttribute('data-paste-id');
            if (pasteId) {
                window.location.href = `/paste/${pasteId}`;
            }
        });
    });
}

function navigateToResult(url) {
    window.location.href = url;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

document.addEventListener('DOMContentLoaded', function() {
    // Initialize theme first
    initTheme();
    
    // Re-initialize theme after a short delay to ensure all elements are loaded
    setTimeout(initTheme, 100);
    
    // Initialize quick search
    initializeQuickSearch();
    const form = document.getElementById('pasteForm');
    const result = document.getElementById('result');
    const pasteUrl = document.getElementById('pasteUrl');
    const rawUrl = document.getElementById('rawUrl');

    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();

            const formData = new FormData(form);
            const data = {
                title: formData.get('title'),
                content: formData.get('content'),
                language: formData.get('language'),
                expiryHours: formData.get('expiryHours') ? parseInt(formData.get('expiryHours')) : undefined,
                isPublic: formData.get('isPublic') === 'on'
            };

            // Validate content length
            if (data.content.length > 1000000) {
                showNotification('Content too long. Maximum 1MB allowed.', 'error');
                return;
            }

            try {
                const response = await fetch('/paste', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(data)
                });

                const responseData = await response.json();

                if (responseData.success) {
                    const fullUrl = window.location.origin + responseData.url;
                    const fullRawUrl = window.location.origin + '/raw/' + responseData.id;
                    
                    pasteUrl.href = fullUrl;
                    pasteUrl.textContent = fullUrl;
                    rawUrl.href = fullRawUrl;
                    rawUrl.textContent = fullRawUrl;
                    
                    result.classList.remove('hidden');
                    form.reset();
                    
                    // Scroll to result
                    result.scrollIntoView({ behavior: 'smooth' });
                } else {
                    showNotification('Error: ' + responseData.error, 'error');
                }
            } catch (error) {
                console.error('Error:', error);
                showNotification('An error occurred while creating the paste', 'error');
            }
        });
    }

    // Auto-resize textarea
    const textarea = document.getElementById('content');
    if (textarea) {
        textarea.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = Math.min(this.scrollHeight, 500) + 'px';
        });
    }

    // Character counter
    if (textarea) {
        const counter = document.createElement('div');
        counter.className = 'character-counter';
        counter.style.cssText = 'text-align: right; font-size: 0.8rem; color: #666; margin-top: 5px;';
        textarea.parentNode.appendChild(counter);
        
        function updateCounter() {
            const length = textarea.value.length;
            const maxLength = 1000000;
            counter.textContent = `${length.toLocaleString()} / ${maxLength.toLocaleString()} characters`;
            
            if (length > maxLength * 0.9) {
                counter.style.color = '#e74c3c';
            } else if (length > maxLength * 0.7) {
                counter.style.color = '#f39c12';
            } else {
                counter.style.color = '#666';
            }
        }
        
        textarea.addEventListener('input', updateCounter);
        updateCounter();
    }
});

function copyToClipboard(text) {
    const textToCopy = text || document.getElementById('pasteUrl')?.href;
    
    if (!textToCopy) {
        showNotification('Nothing to copy', 'error');
        return;
    }
    
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(textToCopy).then(function() {
            showNotification('Copied to clipboard!');
        }).catch(function(err) {
            console.error('Could not copy text: ', err);
            fallbackCopyTextToClipboard(textToCopy);
        });
    } else {
        fallbackCopyTextToClipboard(textToCopy);
    }
}

function fallbackCopyTextToClipboard(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    
    textArea.style.top = "0";
    textArea.style.left = "0";
    textArea.style.position = "fixed";
    textArea.style.opacity = "0";

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
        const successful = document.execCommand('copy');
        if (successful) {
            showNotification('Copied to clipboard!');
        } else {
            showNotification('Could not copy text', 'error');
        }
    } catch (err) {
        console.error('Fallback: Could not copy text: ', err);
        showNotification('Could not copy text', 'error');
    }

    document.body.removeChild(textArea);
}

function showNotification(message, type = 'success') {
    // Remove existing notifications
    const existing = document.querySelectorAll('.notification');
    existing.forEach(el => el.remove());
    
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.textContent = message;
    
    if (type === 'error') {
        notification.style.background = '#e74c3c';
    } else if (type === 'warning') {
        notification.style.background = '#f39c12';
    } else {
        notification.style.background = '#28a745';
    }
    
    document.body.appendChild(notification);
    
    // Animate in
    setTimeout(() => {
        notification.classList.add('show');
    }, 10);
    
    // Animate out
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Keyboard shortcuts
document.addEventListener('keydown', function(e) {
    // Ctrl/Cmd + Enter to submit form
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        const form = document.getElementById('pasteForm');
        if (form) {
            form.dispatchEvent(new Event('submit'));
        }
    }
    
    // Ctrl/Cmd + K to focus on search
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        const searchInput = document.querySelector('input[name="q"]');
        if (searchInput) {
            e.preventDefault();
            searchInput.focus();
        }
    }
});

// Theme detection and preference
function detectTheme() {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
        // User prefers dark mode
        return 'dark';
    }
    return 'light';
}

// Language detection helper for syntax highlighting
function detectLanguageFromContent(content) {
    const patterns = {
        javascript: /(?:function|const|let|var|=>|console\.log|document\.|window\.)/i,
        python: /(?:def |import |from |print\(|if __name__|class )/i,
        java: /(?:public class|public static void|import java|System\.out)/i,
        cpp: /(?:#include|using namespace|std::|cout|cin|int main)/i,
        html: /(?:<html|<head|<body|<div|<script|<!DOCTYPE)/i,
        css: /(?:\{[\s\S]*\}|@media|@import|\.[\w-]+\s*\{)/i,
        sql: /(?:SELECT|INSERT|UPDATE|DELETE|CREATE TABLE|FROM|WHERE)/i,
        json: /^\s*[\{\[][\s\S]*[\}\]]\s*$/,
        xml: /^\s*<\?xml|<[a-zA-Z][\s\S]*>/,
        yaml: /^\s*[\w-]+:\s*[\w\s-]*$/m,
        markdown: /(?:^#+\s|^\*\s|\[.*\]\(.*\)|```)/m,
        bash: /(?:#!\/bin\/bash|echo |ls |cd |mkdir |chmod)/i,
        php: /(?:<\?php|\$\w+|echo |function )/i,
        ruby: /(?:def |require |puts |class |end$)/i,
        go: /(?:package |import |func |var |:=)/i,
        rust: /(?:fn |let |use |struct |impl )/i,
        typescript: /(?:interface |type |declare |export |import.*from)/i,
        csharp: /(?:using System|namespace |class |static void|Console\.)/i,
        powershell: /(?:Get-|Set-|New-|Remove-|\$\w+|Write-Host)/i
    };

    for (const [lang, pattern] of Object.entries(patterns)) {
        if (pattern.test(content)) {
            return lang;
        }
    }

    return null;
}

// Initialize tooltips and other UI enhancements
function initializeUIEnhancements() {
    // Add tooltips to buttons
    const buttons = document.querySelectorAll('button[title], a[title]');
    buttons.forEach(button => {
        // Simple tooltip implementation could be added here
    });
    
    // Add loading states to forms
    const forms = document.querySelectorAll('form');
    forms.forEach(form => {
        form.addEventListener('submit', function() {
            const submitBtn = form.querySelector('button[type="submit"]');
            if (submitBtn) {
                submitBtn.disabled = true;
                const originalText = submitBtn.textContent;
                submitBtn.textContent = 'Processing...';
                
                // Re-enable after 5 seconds as fallback
                setTimeout(() => {
                    submitBtn.disabled = false;
                    submitBtn.textContent = originalText;
                }, 5000);
            }
        });
    });
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeUIEnhancements);
} else {
    initializeUIEnhancements();
}