// =====================
// 1. DOM ELEMENT SELECTIONS
// =====================

// MAIN ELEMENTS
const addApplicationBtn = document.getElementById("addApplicationBtn");
const applicationFormContainer = document.getElementById("applicationFormContainer");
const applicationForm = document.getElementById("applicationForm");
const cancelBtn = document.getElementById("cancelBtn");
const applicationsTable = document.getElementById("applicationsTable");
const filterStatus = document.getElementById("filterStatus");
const searchInput = document.getElementById("searchInput");
const sortBy = document.getElementById("sortBy");
const helpBtn = document.getElementById("helpBtn");
const shortcutsModal = document.getElementById("shortcutsModal");

// ANALYTICS ELEMENTS
const statusChartCanvas = document.getElementById("statusChart");
const timelineChartCanvas = document.getElementById("timelineChart");

// COMPANY RESEARCH ELEMENTS
const addResearchBtn = document.getElementById("addResearchBtn");
const researchSearch = document.getElementById("researchSearch");
const researchCards = document.getElementById("researchCards");

// FORM INPUT ELEMENTS
const company = document.getElementById("company");
const jobTitle = document.getElementById("jobTitle");
const status = document.getElementById("status");
const followUpDate = document.getElementById("followUpDate");

// FORM RESEARCH FIELDS
const glassdoorRating = document.getElementById("glassdoorRating");
const averageSalary = document.getElementById("averageSalary");
const companyNotes = document.getElementById("companyNotes");
const recruiterContact = document.getElementById("recruiterContact");
const editingId = document.getElementById("editingId");
const researchId = document.getElementById("researchId");

// DASHBOARD ELEMENTS
const totalCount = document.getElementById("totalCount");
const interviewCount = document.getElementById("interviewCount");
const rejectedCount = document.getElementById("rejectedCount");
const offerCount = document.getElementById("offerCount");
const responseRate = document.getElementById("responseRate");
const pendingFollowups = document.getElementById("pendingFollowups");
const avgRating = document.getElementById("avgRating");

// IMPORT/EXPORT ELEMENTS
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");

// FORM UI ELEMENTS
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");

// =====================
// 2. DATA STORAGE & STATE
// =====================

// Safe JSON parse helper
function safeJSONParse(str, fallback) {
    try {
        return JSON.parse(str) || fallback;
    } catch (e) {
        console.error("JSON parse error:", e);
        return fallback;
    }
}

let applications = safeJSONParse(localStorage.getItem("applications"), []);
let companyResearch = safeJSONParse(localStorage.getItem("companyResearch"), []);
let isEditing = false;
let isEditingResearch = false;
let statusChart = null;
let timelineChart = null;

// =====================
// 2.5 DATE FORMATTING FUNCTIONS
// =====================

// For storage (ISO format)
function formatDateForStorage(date) {
    return new Date(date).toISOString();
}

// For display (e.g., "Jan 15, 2024")
function formatDateForDisplay(date) {
    return new Date(date).toLocaleDateString("en-US", {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// For input fields (YYYY-MM-DD)
function formatDateForInput(date) {
    return new Date(date).toISOString().split('T')[0];
}

// For consistent sorting (YYYY/MM/DD)
function formatDateForSorting(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// =====================
// 3. INITIALIZATION
// =====================

// Initialize everything when page loads
document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
    setupDateDefault();
    displayApplications();
    displayCompanyResearch();
    setupEventListeners();
    updateDashboard();
    createCharts();
    
    // Focus search input for quick use
    setTimeout(() => searchInput.focus(), 100);
}

// Set up all event listeners
function setupEventListeners() {
    // FORM EVENTS
    addApplicationBtn.addEventListener("click", showAddForm);
    cancelBtn.addEventListener("click", hideForm);
    applicationForm.addEventListener("submit", handleFormSubmit);
    
    // RESEARCH BUTTON
    addResearchBtn.addEventListener("click", showAddResearchForm);
    
    // FILTER/SORT EVENTS
    filterStatus.addEventListener("change", () => {
        displayApplications();
        updateCharts();
    });
    
    sortBy.addEventListener("change", displayApplications);
    
    // SEARCH EVENTS (with debouncing)
    let searchTimeout;
    searchInput.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            displayApplications();
            updateCharts();
        }, 300);
    });
    
    // RESEARCH SEARCH
    researchSearch.addEventListener("input", () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(displayCompanyResearch, 300);
    });
    
    // EXPORT/IMPORT EVENTS
    exportBtn.addEventListener("click", exportData);
    importBtn.addEventListener("click", () => importFile.click());
    importFile.addEventListener("change", handleImport);
    
    // HELP/SHORTCUTS
    helpBtn.addEventListener("click", () => {
        shortcutsModal.style.display = "flex";
    });
    
    // Close modal when clicking outside
    shortcutsModal.addEventListener("click", (e) => {
        if (e.target === shortcutsModal) {
            shortcutsModal.style.display = "none";
        }
    });
    
    // KEYBOARD SHORTCUTS
    document.addEventListener("keydown", handleKeyboardShortcuts);
    
    // FORM KEYBOARD EVENTS
    applicationFormContainer.addEventListener("keydown", (e) => {
        if (e.key === "Escape") hideForm();
    });
}

// =====================
// 4. FORM HANDLING
// =====================

// Show form to add new application
function showAddForm() {
    resetForm();
    formTitle.textContent = "Add New Application";
    submitBtn.textContent = "Add Application";
    applicationFormContainer.style.display = "block";
    company.focus();
    isEditing = false;
    isEditingResearch = false;
}

// Show form to add/edit company research
function showAddResearchForm() {
    resetForm();
    formTitle.textContent = "Add Company Research";
    submitBtn.textContent = "Save Research";
    applicationFormContainer.style.display = "block";
    company.focus();
    isEditingResearch = true;
    isEditing = false;
}

// Hide form
function hideForm() {
    applicationFormContainer.style.display = "none";
    resetForm();
}

// Reset form to default state
function resetForm() {
    applicationForm.reset();
    editingId.value = "";
    researchId.value = "";
    isEditing = false;
    isEditingResearch = false;
    setupDateDefault();
    
    // Remove any error styling
    document.querySelectorAll('.error').forEach(el => el.classList.remove('error'));
    document.querySelectorAll('.error-message').forEach(el => el.remove());
}

// Set default follow-up date to tomorrow
function setupDateDefault() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    followUpDate.value = formatDateForInput(tomorrow);
    followUpDate.min = formatDateForInput(new Date());
}

// Validate form data
function validateApplication(data) {
    const errors = [];
    
    if (!data.company || data.company.length < 2) {
        errors.push("Company name must be at least 2 characters");
    }
    
    if (!data.jobTitle || data.jobTitle.length < 2) {
        errors.push("Job title must be at least 2 characters");
    }
    
    const followUp = new Date(data.followUpDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (followUp < today) {
        errors.push("Follow-up date cannot be in the past");
    }
    
    return errors;
}

// Show validation errors
function showValidationErrors(errors) {
    errors.forEach(error => showNotification(error, "error"));
}

// Handle form submission (both add and edit)
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate form data
    const errors = validateApplication({
        company: company.value.trim(),
        jobTitle: jobTitle.value.trim(),
        followUpDate: followUpDate.value
    });
    
    if (errors.length > 0) {
        showValidationErrors(errors);
        return;
    }
    
    // Handle based on mode
    if (isEditingResearch) {
        saveCompanyResearch();
    } else if (isEditing && editingId.value) {
        updateExistingApplication();
    } else {
        addNewApplication();
    }
    
    hideForm();
}

// =====================
// 5. APPLICATION CRUD OPERATIONS
// =====================

// Add new application
function addNewApplication() {
    const newApp = {
        id: Date.now(),
        company: company.value.trim(),
        jobTitle: jobTitle.value.trim(),
        status: status.value,
        dateApplied: formatDateForStorage(new Date()),
        dateAppliedDisplay: formatDateForSorting(new Date()),
        followUpDate: followUpDate.value,
        glassdoorRating: glassdoorRating.value || null,
        averageSalary: averageSalary.value || "",
        companyNotes: companyNotes.value || "",
        recruiterContact: recruiterContact.value || ""
    };
    
    applications.push(newApp);
    saveApplications();
    displayApplications();
    updateDashboard();
    updateCharts();
    
    // Also save as company research if research fields filled
    if (glassdoorRating.value || averageSalary.value || companyNotes.value) {
        saveCompanyResearchData(newApp);
    }
    
    showNotification("✅ Application added successfully!", "success");
}

// Update existing application
function updateExistingApplication() {
    const appId = parseInt(editingId.value);
    
    applications = applications.map(app => 
        app.id === appId ? {
            ...app,
            company: company.value.trim(),
            jobTitle: jobTitle.value.trim(),
            status: status.value,
            followUpDate: followUpDate.value,
            glassdoorRating: glassdoorRating.value || app.glassdoorRating,
            averageSalary: averageSalary.value || app.averageSalary,
            companyNotes: companyNotes.value || app.companyNotes,
            recruiterContact: recruiterContact.value || app.recruiterContact
        } : app
    );
    
    saveApplications();
    displayApplications();
    updateDashboard();
    updateCharts();
    
    showNotification("✅ Application updated successfully!", "success");
}

// Save company research
function saveCompanyResearch() {
    const research = {
        id: researchId.value || Date.now(),
        company: company.value.trim(),
        glassdoorRating: glassdoorRating.value || null,
        averageSalary: averageSalary.value || "",
        companyNotes: companyNotes.value || "",
        recruiterContact: recruiterContact.value || "",
        lastUpdated: formatDateForStorage(new Date())
    };
    
    // Check if research already exists for this company
    const existingIndex = companyResearch.findIndex(r => 
        r.company.toLowerCase() === company.value.trim().toLowerCase()
    );
    
    if (existingIndex >= 0) {
        // Update existing research
        companyResearch[existingIndex] = {
            ...companyResearch[existingIndex],
            ...research
        };
        showNotification("✅ Company research updated!", "success");
    } else {
        // Add new research
        companyResearch.push(research);
        showNotification("✅ Company research added!", "success");
    }
    
    saveCompanyResearchToStorage();
    displayCompanyResearch();
    updateDashboard();
}

// Save company research data from application
function saveCompanyResearchData(appData) {
    const researchData = {
        id: Date.now(),
        company: appData.company,
        glassdoorRating: appData.glassdoorRating,
        averageSalary: appData.averageSalary,
        companyNotes: appData.companyNotes,
        recruiterContact: appData.recruiterContact,
        lastUpdated: formatDateForStorage(new Date())
    };
    
    // Check if research already exists for this company
    const existingIndex = companyResearch.findIndex(r => 
        r.company.toLowerCase() === appData.company.toLowerCase()
    );
    
    if (existingIndex >= 0) {
        // Update existing research
        companyResearch[existingIndex] = {
            ...companyResearch[existingIndex],
            ...researchData
        };
    } else {
        // Add new research
        companyResearch.push(researchData);
    }
    
    saveCompanyResearchToStorage();
    displayCompanyResearch();
}

// Save applications to localStorage
function saveApplications() {
    localStorage.setItem("applications", JSON.stringify(applications));
}

// Save company research to localStorage
function saveCompanyResearchToStorage() {
    localStorage.setItem("companyResearch", JSON.stringify(companyResearch));
}

// =====================
// 6. DISPLAY APPLICATIONS
// =====================

function displayApplications() {
    applicationsTable.innerHTML = "";
    
    const filter = filterStatus.value;
    const search = searchInput.value.toLowerCase();
    
    // Filter applications
    let filteredApps = applications.filter(app =>
        (filter === "All" || app.status === filter) &&
        (app.company.toLowerCase().includes(search) ||
         app.jobTitle.toLowerCase().includes(search))
    );
    
    // Sort applications
    filteredApps = sortApplications(filteredApps);
    
    // Show empty state if no applications
    if (filteredApps.length === 0) {
        showEmptyState();
        return;
    }
    
    // Create table rows
    filteredApps.forEach(app => {
        const row = createApplicationRow(app);
        applicationsTable.appendChild(row);
    });
    
    updateDashboard();
}

// Create HTML row for an application
function createApplicationRow(app) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const followUp = new Date(app.followUpDate);
    followUp.setHours(0, 0, 0, 0);
    
    const isOverdue = followUp < today && app.status === "Applied";
    const timeDiff = followUp.getTime() - today.getTime();
    const daysUntil = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
    
    const row = document.createElement("tr");
    
    // Create star rating display
    let ratingStars = "";
    if (app.glassdoorRating) {
        const fullStars = Math.floor(app.glassdoorRating);
        const hasHalfStar = app.glassdoorRating % 1 >= 0.5;
        const emptyStars = 5 - Math.ceil(app.glassdoorRating);
        
        ratingStars = "★".repeat(fullStars) +
                     (hasHalfStar ? "½" : "") +
                     "☆".repeat(emptyStars);
    }
    
    row.innerHTML = `
        <td data-label="Company">
            <strong>${escapeHtml(app.company)}</strong>
            ${app.glassdoorRating ? `<div class="rating-small">${ratingStars} ${app.glassdoorRating}</div>` : ""}
        </td>
        <td data-label="Job Title">${escapeHtml(app.jobTitle)}</td>
        <td data-label="Status">
            <span class="status-badge status-${app.status.toLowerCase()}">
                ${app.status}
            </span>
        </td>
        <td data-label="Date Applied">${formatDateForDisplay(app.dateApplied)}</td>
        <td data-label="Follow-Up">
            ${formatDateForDisplay(app.followUpDate)}
            ${daysUntil >= 0 ? 
                `<br><small class="days-remaining">(${daysUntil} day${daysUntil !== 1 ? "s" : ""} ${daysUntil === 0 ? 'today' : 'left'})</small>` : 
                `<br><small class="days-remaining overdue">(${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""} overdue)</small>`}
        </td>
        <td data-label="Alert">
            ${isOverdue ? 
                `<span class="alert overdue">⚠️ Overdue</span>` : 
                `<span class="alert ok">✅ On track</span>`}
        </td>
        <td data-label="Actions">
            <button class="action-btn" onclick="editApplication(${app.id})" title="Edit">
                ✏️ Edit
            </button>
            <button class="action-btn delete-btn" onclick="deleteApplication(${app.id})" title="Delete">
                🗑️ Delete
            </button>
            ${app.companyNotes ? 
                `<button class="action-btn" onclick="viewCompanyResearch('${escapeHtml(app.company)}')" title="View Research">📚</button>` : 
                ""}
        </td>
    `;
    
    return row;
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Show empty state message
function showEmptyState() {
    applicationsTable.innerHTML = `
        <tr>
            <td colspan="7">
                <div class="empty-state">
                    <div class="empty-icon">📭</div>
                    <h3>No applications found</h3>
                    <p>${applications.length === 0 ? 
                        'Click "+ Add Application" to get started!' : 
                        'Try changing your search or filter.'}</p>
                    ${applications.length === 0 ? 
                        `<button class="action-btn" onclick="showAddForm()" style="margin-top: 15px;">
                            + Add Your First Application
                        </button>` : ""}
                </div>
            </td>
        </tr>
    `;
}

// Sort applications based on selected criteria
function sortApplications(apps) {
    const sortValue = sortBy.value;
    
    return [...apps].sort((a, b) => {
        switch(sortValue) {
            case "newest": 
                return new Date(b.dateApplied) - new Date(a.dateApplied);
            case "oldest": 
                return new Date(a.dateApplied) - new Date(b.dateApplied);
            case "company": 
                return a.company.localeCompare(b.company);
            case "followup": 
                return new Date(a.followUpDate) - new Date(b.followUpDate);
            default: 
                return 0;
        }
    });
}

// =====================
// 7. CRUD OPERATIONS
// =====================

// Edit an existing application
function editApplication(id) {
    const app = applications.find(a => a.id === id);
    if (!app) return;
    
    company.value = app.company;
    jobTitle.value = app.jobTitle;
    status.value = app.status;
    followUpDate.value = app.followUpDate;
    editingId.value = app.id;
    
    glassdoorRating.value = app.glassdoorRating || "";
    averageSalary.value = app.averageSalary || "";
    companyNotes.value = app.companyNotes || "";
    recruiterContact.value = app.recruiterContact || "";
    
    isEditing = true;
    isEditingResearch = false;
    formTitle.textContent = "Edit Application";
    submitBtn.textContent = "Update Application";
    applicationFormContainer.style.display = "block";
    company.focus();
}

// Delete an application
function deleteApplication(id) {
    if (confirm("Are you sure you want to delete this application?")) {
        applications = applications.filter(app => app.id !== id);
        saveApplications();
        displayApplications();
        updateDashboard();
        updateCharts();
        showNotification("🗑️ Application deleted", "info");
    }
}

// Delete company research
function deleteResearch(companyName) {
    if (confirm(`Delete research for ${companyName}?`)) {
        companyResearch = companyResearch.filter(r => 
            r.company.toLowerCase() !== companyName.toLowerCase()
        );
        saveCompanyResearchToStorage();
        displayCompanyResearch();
        updateDashboard();
        showNotification("📚 Research deleted", "info");
    }
}

// View company research
function viewCompanyResearch(companyName) {
    const research = companyResearch.find(r => 
        r.company.toLowerCase() === companyName.toLowerCase()
    );
    
    if (research) {
        company.value = research.company;
        glassdoorRating.value = research.glassdoorRating || "";
        averageSalary.value = research.averageSalary || "";
        companyNotes.value = research.companyNotes || "";
        recruiterContact.value = research.recruiterContact || "";
        
        researchId.value = research.id;
        isEditingResearch = true;
        isEditing = false;
        formTitle.textContent = "Edit Company Research";
        submitBtn.textContent = "Update Research";
        applicationFormContainer.style.display = "block";
    } else {
        showNotification("No research found for this company", "info");
    }
}

// Edit company research
function editResearch(companyName) {
    viewCompanyResearch(companyName);
}

// =====================
// 8. ANALYTICS & CHARTS
// =====================

// Create both charts
function createCharts() {
    createStatusChart();
    createTimelineChart();
}

// Create status distribution chart (pie chart)
function createStatusChart() {
    // Properly destroy existing chart
    if (statusChart) {
        statusChart.destroy();
        statusChart = null;
    }
    
    const ctx = statusChartCanvas.getContext("2d");
    
    // Calculate status counts
    const statusCounts = {
        Applied: 0,
        Interview: 0,
        Rejected: 0,
        Offer: 0
    };
    
    applications.forEach(app => {
        if (statusCounts[app.status] !== undefined) {
            statusCounts[app.status]++;
        }
    });
    
    // Only create chart if we have data
    const hasData = Object.values(statusCounts).some(count => count > 0);
    
    if (!hasData) {
        // Show placeholder message
        statusChartCanvas.parentElement.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6b7280;">
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 10px;">📊</div>
                    <p>No data yet</p>
                    <p style="font-size: 12px;">Add some applications to see status distribution</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Restore canvas if placeholder was shown
    if (statusChartCanvas.parentElement.innerHTML.includes('<div')) {
        statusChartCanvas.parentElement.innerHTML = '<canvas id="statusChart"></canvas>';
    }
    
    const statusColors = {
        Applied: '#3b82f6',
        Interview: '#10b981',
        Rejected: '#ef4444',
        Offer: '#8b5cf6'
    };
    
    statusChart = new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(statusCounts),
            datasets: [{
                data: Object.values(statusCounts),
                backgroundColor: Object.values(statusColors),
                borderColor: '#ffffff',
                borderWidth: 2,
                hoverOffset: 15
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'right',
                    labels: {
                        padding: 20,
                        usePointStyle: true,
                        font: {
                            size: 12
                        }
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = Math.round((value / total) * 100);
                            return `${label}: ${value} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

// Create timeline chart (applications over time)
function createTimelineChart() {
    // Properly destroy existing chart
    if (timelineChart) {
        timelineChart.destroy();
        timelineChart = null;
    }
    
    const ctx = timelineChartCanvas.getContext("2d");
    
    // Group applications by date (last 7 days)
    const dateMap = {};
    const today = new Date();
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateKey = formatDateForSorting(date);
        dateMap[dateKey] = 0;
    }
    
    // Count applications for each date
    applications.forEach(app => {
        const appDate = new Date(app.dateApplied);
        const dateKey = formatDateForSorting(appDate);
        
        // Only count if within last 7 days
        const daysDiff = Math.floor((today - appDate) / (1000 * 60 * 60 * 24));
        if (daysDiff >= 0 && daysDiff <= 6) {
            if (dateMap[dateKey] !== undefined) {
                dateMap[dateKey]++;
            }
        }
    });
    
    const dates = Object.keys(dateMap);
    const counts = Object.values(dateMap);
    
    // Only create chart if we have data
    const hasData = counts.some(count => count > 0) || applications.length > 0;
    
    if (!hasData) {
        // Show placeholder message
        timelineChartCanvas.parentElement.innerHTML = `
            <div style="display: flex; align-items: center; justify-content: center; height: 100%; color: #6b7280;">
                <div style="text-align: center;">
                    <div style="font-size: 48px; margin-bottom: 10px;">📈</div>
                    <p>No timeline data</p>
                    <p style="font-size: 12px;">Applications will appear here over time</p>
                </div>
            </div>
        `;
        return;
    }
    
    // Restore canvas if placeholder was shown
    if (timelineChartCanvas.parentElement.innerHTML.includes('<div')) {
        timelineChartCanvas.parentElement.innerHTML = '<canvas id="timelineChart"></canvas>';
    }
    
    timelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates.map(date => {
                const [year, month, day] = date.split('/');
                return `${month}/${day}`;
            }),
            datasets: [{
                label: 'Applications',
                data: counts,
                borderColor: '#3b82f6',
                backgroundColor: 'rgba(59, 130, 246, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: '#3b82f6',
                pointBorderColor: '#ffffff',
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.05)'
                    },
                    ticks: {
                        stepSize: 1,
                        precision: 0
                    }
                },
                x: {
                    grid: {
                        display: false
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    titleFont: {
                        size: 14
                    },
                    bodyFont: {
                        size: 13
                    },
                    callbacks: {
                        label: function(context) {
                            return `Applications: ${context.raw}`;
                        }
                    }
                }
            },
            interaction: {
                intersect: false,
                mode: 'nearest'
            }
        }
    });
}

// Update charts when data changes
function updateCharts() {
    createStatusChart();
    createTimelineChart();
}

// =====================
// 9. DASHBOARD UPDATES
// =====================

function updateDashboard() {
    // Update counts
    totalCount.textContent = applications.length;
    
    const interviews = applications.filter(app => app.status === "Interview").length;
    const rejected = applications.filter(app => app.status === "Rejected").length;
    const offers = applications.filter(app => app.status === "Offer").length;
    
    interviewCount.textContent = interviews;
    rejectedCount.textContent = rejected;
    offerCount.textContent = offers;
    
    // Calculate response rate
    const totalWithResponse = interviews + rejected + offers;
    const responseRateValue = applications.length > 0 ? 
        Math.round((totalWithResponse / applications.length) * 100) : 0;
    responseRate.textContent = `${responseRateValue}%`;
    
    // Calculate pending follow-ups
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const pending = applications.filter(app => {
        const followUp = new Date(app.followUpDate);
        followUp.setHours(0, 0, 0, 0);
        return followUp <= today && app.status === "Applied";
    }).length;
    
    pendingFollowups.textContent = pending;
    
    // Calculate average Glassdoor rating
    const ratings = companyResearch
        .filter(r => r.glassdoorRating)
        .map(r => parseFloat(r.glassdoorRating));
    
    const avgRatingValue = ratings.length > 0 ? 
        (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) : 0;
    avgRating.textContent = avgRatingValue;
}

// =====================
// 10. COMPANY RESEARCH DISPLAY
// =====================

function displayCompanyResearch() {
    researchCards.innerHTML = "";
    
    const searchTerm = researchSearch.value.toLowerCase();
    
    // Filter research
    let filteredResearch = companyResearch.filter(research =>
        research.company.toLowerCase().includes(searchTerm) ||
        (research.companyNotes && research.companyNotes.toLowerCase().includes(searchTerm))
    );
    
    // Sort by last updated
    filteredResearch.sort((a, b) => new Date(b.lastUpdated) - new Date(a.lastUpdated));
    
    // Show empty state
    if (filteredResearch.length === 0) {
        researchCards.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">🏢</div>
                <h3>No company research</h3>
                <p>${companyResearch.length === 0 ? 
                    'Click "+ Add Company Research" to start tracking company information' : 
                    'No research matches your search'}</p>
            </div>
        `;
        return;
    }
    
    // Create research cards
    filteredResearch.forEach(research => {
        const card = document.createElement("div");
        card.className = "research-card";
        
        const lastUpdated = formatDateForDisplay(research.lastUpdated);
        
        // Create star rating display
        let ratingStars = "";
        if (research.glassdoorRating) {
            const fullStars = Math.floor(research.glassdoorRating);
            const hasHalfStar = research.glassdoorRating % 1 >= 0.5;
            const emptyStars = 5 - Math.ceil(research.glassdoorRating);
            
            ratingStars = "★".repeat(fullStars) +
                         (hasHalfStar ? "½" : "") +
                         "☆".repeat(emptyStars);
        }
        
        card.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: start;">
                <h4>${escapeHtml(research.company)}</h4>
                <div>
                    <button class="action-btn" onclick="editResearch('${escapeHtml(research.company)}')" title="Edit Research">✏️</button>
                    <button class="action-btn delete-btn" onclick="deleteResearch('${escapeHtml(research.company)}')" title="Delete Research">🗑️</button>
                </div>
            </div>
            
            ${ratingStars ? `
                <div class="rating-stars">
                    ${ratingStars} ${research.glassdoorRating}/5
                </div>
            ` : ''}
            
            ${research.averageSalary ? `
                <p><strong>Avg Salary:</strong> ${escapeHtml(research.averageSalary)}</p>
            ` : ''}
            
            ${research.companyNotes ? `
                <p><strong>Notes:</strong> ${escapeHtml(research.companyNotes.substring(0, 100))}${research.companyNotes.length > 100 ? '...' : ''}</p>
            ` : ''}
            
            ${research.recruiterContact ? `
                <p><strong>Contact:</strong> ${escapeHtml(research.recruiterContact)}</p>
            ` : ''}
            
            <div style="margin-top: 10px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                Last updated: ${lastUpdated}
            </div>
        `;
        
        researchCards.appendChild(card);
    });
}

// =====================
// 11. IMPORT/EXPORT FUNCTIONS
// =====================

async function exportData() {
    showLoading();
    
    const data = {
        applications: applications,
        companyResearch: companyResearch,
        exportedAt: formatDateForStorage(new Date()),
        version: "1.0"
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-tracker-backup-${formatDateForSorting(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    hideLoading();
    showNotification("✅ Data exported successfully!", "success");
}

async function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    showLoading();
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            if (confirm("This will replace all your current data. Are you sure?")) {
                applications = data.applications || [];
                companyResearch = data.companyResearch || [];
                
                saveApplications();
                saveCompanyResearchToStorage();
                
                displayApplications();
                displayCompanyResearch();
                updateDashboard();
                updateCharts();
                
                showNotification("✅ Data imported successfully!", "success");
            }
        } catch (error) {
            showNotification("❌ Error importing data. Invalid file format.", "error");
            console.error("Import error:", error);
        } finally {
            hideLoading();
        }
        
        // Reset file input
        event.target.value = '';
    };
    
    reader.onerror = function() {
        hideLoading();
        showNotification("❌ Error reading file", "error");
    };
    
    reader.readAsText(file);
}

// =====================
// 12. UI UTILITIES
// =====================

function showLoading() {
    document.body.classList.add('loading');
}

function hideLoading() {
    document.body.classList.remove('loading');
}

function showNotification(message, type) {
    // Remove existing notifications
    const existingNotif = document.querySelector('.notification');
    if (existingNotif) existingNotif.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    // Set color based on type
    const colors = {
        error: '#ef4444',
        success: '#10b981',
        info: '#3b82f6',
        warning: '#f59e0b'
    };
    notification.style.backgroundColor = colors[type] || '#6b7280';
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

function handleKeyboardShortcuts(e) {
    // Ctrl/Cmd + N: New application
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        showAddForm();
    }
    
    // Ctrl/Cmd + F: Focus search
    if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        searchInput.focus();
        searchInput.select();
    }
    
    // ? : Show shortcuts
    if (e.key === '?' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        shortcutsModal.style.display = "flex";
    }
    
    // Escape: Hide form or modal
    if (e.key === 'Escape') {
        if (applicationFormContainer.style.display === 'block') {
            hideForm();
        }
        if (shortcutsModal.style.display === 'flex') {
            shortcutsModal.style.display = 'none';
        }
    }
}

// =====================
// 13. MAKE FUNCTIONS GLOBAL
// =====================

window.editApplication = editApplication;
window.deleteApplication = deleteApplication;
window.viewCompanyResearch = viewCompanyResearch;
window.editResearch = editResearch;
window.deleteResearch = deleteResearch;
window.showAddForm = showAddForm;