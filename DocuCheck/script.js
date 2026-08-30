/* ============================================================
   DocuCheck — script.js
   Drag & drop, file validation, client-side analysis engine,
   animated score ring, staggered results, mobile menu.
   ============================================================ */

'use strict';

/* ---------- DOM References ---------- */
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('nav-links');

const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('file-input');
const browseBtn = document.getElementById('browse-btn');
const fileStatus = document.getElementById('file-status');

const textInput = document.getElementById('text-input');
const charCount = document.getElementById('char-count');
const clearBtn = document.getElementById('clear-btn');
const analyzeBtn = document.getElementById('analyze-btn');

const resultsSection = document.getElementById('results');
const scoreRing = document.getElementById('score-ring');
const scoreValue = document.getElementById('score-value');
const scoreLabel = document.getElementById('score-label');
const scoreDesc = document.getElementById('score-desc');

const criticalList = document.getElementById('critical-list');
const criticalCount = document.getElementById('critical-count');
const warningList = document.getElementById('warning-list');
const warningCount = document.getElementById('warning-count');
const positiveList = document.getElementById('positive-list');
const positiveCount = document.getElementById('positive-count');

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const MAX_CHARS = 5000;

let selectedFile = null;

/* ============================================================
   Navbar — scroll shadow + mobile menu
   ============================================================ */
window.addEventListener('scroll', () => {
    navbar.classList.toggle('scrolled', window.scrollY > 10);
});

hamburger.addEventListener('click', () => {
    const open = navLinks.classList.toggle('open');
    hamburger.classList.toggle('open', open);
    hamburger.setAttribute('aria-expanded', open);
});

// Close mobile menu when a nav link is clicked
navLinks.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
        navLinks.classList.remove('open');
        hamburger.classList.remove('open');
        hamburger.setAttribute('aria-expanded', 'false');
    });
});

/* ============================================================
   Drag & Drop + File Selection
   ============================================================ */
browseBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
});

dropzone.addEventListener('click', () => fileInput.click());

dropzone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropzone.classList.add('dragover');
});

dropzone.addEventListener('dragleave', () => {
    dropzone.classList.remove('dragover');
});

dropzone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropzone.classList.remove('dragover');
    const file = e.dataTransfer.files[0];
    if (file) validateAndSelect(file);
});

fileInput.addEventListener('change', () => {
    const file = fileInput.files[0];
    if (file) validateAndSelect(file);
});

function validateAndSelect(file) {
    const allowedTypes = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    const ext = file.name.split('.').pop().toLowerCase();
    const isAllowedExt = ext === 'pdf' || ext === 'docx';

    if (!allowedTypes.includes(file.type) && !isAllowedExt) {
        showFileStatus('❌', 'Unsupported file type. Please upload a PDF or DOCX file.', true);
        return;
    }
    if (file.size > MAX_FILE_SIZE) {
        showFileStatus('❌', 'File is too large. Maximum size is 10 MB.', true);
        return;
    }

    selectedFile = file;
    const sizeMB = (file.size / (1024 * 1024)).toFixed(2);
    showFileStatus('✅', `"${file.name}" attached (${sizeMB} MB).`, false);
}

function showFileStatus(icon, message, isError) {
    fileStatus.innerHTML = `
        <span class="file-check">${icon}</span>
        <span>${message}</span>
        <button class="file-remove" title="Remove file" aria-label="Remove file">&times;</button>
    `;
    fileStatus.classList.add('show');
    fileStatus.classList.toggle('error', isError);

    const removeBtn = fileStatus.querySelector('.file-remove');
    removeBtn.addEventListener('click', clearFile);
}

function clearFile() {
    selectedFile = null;
    fileInput.value = '';
    fileStatus.classList.remove('show', 'error');
    fileStatus.innerHTML = '';
}

/* ============================================================
   Text area — char counter + clear
   ============================================================ */
function updateCharCount() {
    charCount.textContent = `${textInput.value.length} / ${MAX_CHARS} chars`;
}

textInput.addEventListener('input', updateCharCount);

clearBtn.addEventListener('click', () => {
    textInput.value = '';
    updateCharCount();
    textInput.focus();
});

/* ============================================================
   Analysis Engine
   ============================================================ */
const ACTION_VERBS = [
    'managed', 'developed', 'led', 'created', 'designed', 'implemented',
    'improved', 'launched', 'built', 'delivered', 'optimized', 'resolved',
    'collaborated', 'analyzed', 'engineered', 'automated', 'increased',
    'reduced', 'mentored', 'coordinated', 'negotiated', 'architected'
];

const MISSING_SECTIONS = ['experience', 'education', 'skills', 'summary', 'objective', 'contact', 'projects', 'certifications'];

const SKILL_KEYWORDS = [
    'javascript', 'python', 'react', 'node.js', 'typescript', 'sql', 'java',
    'aws', 'docker', 'kubernetes', 'machine learning', 'data analysis',
    'project management', 'leadership', 'communication', 'agile', 'git',
    'html', 'css', 'c++', 'c#', 'go', 'rust', 'php', 'ruby', 'tableau',
    'power bi', 'excel', 'marketing', 'sales', 'design', 'figma', 'ui/ux'
];

function analyzeDocument() {
    const pastedText = textInput.value.trim();
    const hasText = pastedText.length > 0;
    const hasFile = selectedFile !== null;

    if (!hasText && !hasFile) {
        showFileStatus('⚠️', 'Please upload a file or paste your resume text before analyzing.', true);
        resultsSection.classList.remove('show');
        return;
    }

    // Simulated extraction from uploaded file
    const source = hasFile ? selectedFile.name : 'pasted text';
    const content = hasText
        ? pastedText
        : `Software Engineer with 5 years of experience building scalable web applications.
           Skills: JavaScript, Python, React, Node.js.
           Education: Bachelor of Science in Computer Science.
           Experience: Led a team of developers at TechCorp.`;

    const analysis = runChecks(content);

    // Render results
    renderResults(analysis, source);
    animateScore(analysis.score);
    animateCounts(analysis);
    resultsSection.classList.add('show');
    resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function runChecks(content) {
    const critical = [];
    const warnings = [];
    const positive = [];

    const words = content.split(/\s+/).filter(Boolean);
    const lowerContent = content.toLowerCase();

    /* ---- Critical Errors ---- */
    // Detect common typos / placeholder text
    const typoPatterns = [
        { regex: /\b(teh|recieve|seperate|adress|occured|definately|untill)\b/gi, msg: (w) => `Possible typo: "${w}"` },
        { regex: /\b(lorem ipsum|TODO|FIXME|XXX|placeholder|sample text)\b/gi, msg: (w) => `Placeholder text found: "${w}"` }
    ];
    typoPatterns.forEach(({ regex, msg }) => {
        const match = content.match(regex);
        if (match) critical.push(msg(match[0]));
    });

    // Missing essential sections
    MISSING_SECTIONS.forEach((section) => {
        if (!lowerContent.includes(section)) {
            critical.push(`Missing recommended section: "${capitalize(section)}"`);
        }
    });

    // Contact info checks
    if (!/\S+@\S+\.\S+/.test(content)) {
        critical.push('No email address detected — recruiters expect a contact email.');
    }
    if (!/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/.test(content)) {
        critical.push('No phone number detected — add a professional contact number.');
    }

    // Detect potential typos: single-letter words other than valid ones
    const validSingle = new Set(['a', 'i', 'A', 'I']);
    words.forEach((word) => {
        const clean = word.replace(/[^a-zA-Z]/g, '');
        if (clean.length === 1 && !validSingle.has(clean)) {
            critical.push(`Unusual single-letter word: "${clean}"`);
        }
    });

    /* ---- Formatting Warnings ---- */
    if (/[A-Z]{4,}/.test(content.replace(/\s/g, ''))) {
        warnings.push('Excessive ALL-CAPS text detected — use Title Case for headings.');
    }
    if (words.some((w) => w.length > 40)) {
        warnings.push('Very long unbroken strings detected — check URL/line wrapping.');
    }
    if (/\t/.test(content)) {
        warnings.push('Tab characters detected — use consistent spacing for clean alignment.');
    }
    if (/(.{1,10})$/.test(content.split('\n')[0]) && !content.split('\n')[0].trim()) {
        warnings.push('Inconsistent line spacing detected at the start of the document.');
    }
    if (/\s{3,}/.test(content)) {
        warnings.push('Multiple consecutive spaces detected — align columns consistently.');
    }
    if ((content.match(/\n/g) || []).length === 0) {
        warnings.push('Document appears to be a single block of text — break it into sections.');
    }

    /* ---- Positive Feedback & Smart Suggestions ---- */
    // Action verbs
    const foundVerbs = ACTION_VERBS.filter((verb) => lowerContent.includes(verb));
    if (foundVerbs.length > 0) {
        positive.push(`Great use of action verbs: ${foundVerbs.slice(0, 5).join(', ')}.`);
    } else {
        positive.push('Tip: Start bullet points with strong action verbs like "led", "built", or "improved".');
    }

    // Quantified achievements
    const quantified = content.match(/\d+%|\$\d+|\d+\s*\+/g);
    if (quantified) {
        positive.push(`Quantified results detected (${quantified.length} instance${quantified.length > 1 ? 's' : ''}) — this is excellent!`);
    } else {
        positive.push('Suggestion: Add measurable results (e.g., "increased sales by 30%").');
    }

    // Keyword suggestions based on content
    const suggestedKeywords = SKILL_KEYWORDS.filter((kw) => !lowerContent.includes(kw.toLowerCase())).slice(0, 6);
    if (suggestedKeywords.length > 0) {
        positive.push('Smart keyword suggestions:');
        positive.push(suggestedKeywords.map((kw) => `<span class="keyword-tag">${kw}</span>`).join(''));
    }

    /* ---- Score ---- */
    const totalIssues = critical.length + warnings.length;
    const bonus = foundVerbs.length > 0 ? 5 : 0;
    let score = Math.max(35, 92 - totalIssues * 6 + bonus);
    score = Math.min(100, Math.round(score));

    return { score, critical, warnings, positive };
}

function renderResults({ critical, warnings, positive }, source) {
    scoreLabel.textContent = 'Document Health Score';
    scoreDesc.textContent = `Analysis of ${source}. Keep refining to reach 100/100.`;

    renderList(criticalList, critical, '❌');
    renderList(warningList, warnings, '⚠️');
    renderList(positiveList, positive, '✅');

    criticalCount.textContent = critical.length;
    warningCount.textContent = warnings.length;
    positiveCount.textContent = positive.length;
}

function renderList(listEl, items, bullet) {
    listEl.innerHTML = '';
    if (items.length === 0) {
        const li = document.createElement('li');
        li.className = 'placeholder-item';
        li.textContent = 'No issues detected here. Great job! 🎉';
        listEl.appendChild(li);
        return;
    }

    items.forEach((item, index) => {
        const li = document.createElement('li');
        li.style.animationDelay = `${index * 0.08}s`;
        if (item.startsWith('Smart keyword suggestions:')) {
            li.innerHTML = `<span class="bullet">${bullet}</span><span><strong>${item}</strong></span>`;
            // next item holds the tags
        } else if (item.includes('keyword-tag')) {
            li.innerHTML = `<span class="bullet"></span><span>${item}</span>`;
        } else {
            li.innerHTML = `<span class="bullet">${bullet}</span><span>${item}</span>`;
        }
        listEl.appendChild(li);
    });
}

/* ============================================================
   Animations — score ring + count-up
   ============================================================ */
function animateScore(target) {
    // Reset then animate the conic-gradient ring
    scoreRing.style.setProperty('--score', '0');
    scoreValue.textContent = '0';

    requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            scoreRing.style.setProperty('--score', target);
        });
    });

    // Count-up number
    let current = 0;
    const duration = 1200;
    const stepTime = 16;
    const steps = duration / stepTime;
    const increment = target / steps;

    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        scoreValue.textContent = Math.round(current);
    }, stepTime);
}

function animateCounts({ critical, warnings, positive }) {
    animateCount(criticalCount, critical.length);
    animateCount(warningCount, warnings.length);
    animateCount(positiveCount, positive.length);
}

function animateCount(el, target) {
    let current = 0;
    const duration = 700;
    const stepTime = 16;
    const increment = target / (duration / stepTime);
    const timer = setInterval(() => {
        current += increment;
        if (current >= target) {
            current = target;
            clearInterval(timer);
        }
        el.textContent = Math.round(current);
    }, stepTime);
}

/* ============================================================
   Scroll reveal
   ============================================================ */
const revealObserver = new IntersectionObserver(
    (entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                revealObserver.unobserve(entry.target);
            }
        });
    },
    { threshold: 0.12 }
);

document.querySelectorAll('.card, .stat, .hero-content').forEach((el, i) => {
    el.classList.add('reveal');
    el.style.transitionDelay = `${(i % 3) * 0.08}s`;
    revealObserver.observe(el);
});

/* ============================================================
   Helpers
   ============================================================ */
function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

/* ============================================================
   Analyze button handler
   ============================================================ */
analyzeBtn.addEventListener('click', analyzeDocument);

// Allow Enter to trigger analysis from the textarea (Ctrl/Cmd + Enter)
textInput.addEventListener('keydown', (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        analyzeDocument();
    }
});

