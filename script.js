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

let applications = JSON.parse(localStorage.getItem("applications")) || [];
let companyResearch = JSON.parse(localStorage.getItem("companyResearch")) || [];
let isEditing = false;
let isEditingResearch = false;
let statusChart = null;
let timelineChart = null;

// =====================
// 2.5 DATE FORMATTING HELPER FUNCTION
// =====================

// Helper function to format dates as YYYY/MM/DD
function formatDateYYYYMMDD(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
}

// Helper function to format dates in a readable way (for display)
function formatDateReadable(date) {
    const d = new Date(date);
    return d.toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric"
    });
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
    createCharts(); // Creates pie and bar charts
    
    // Focus search input for quick use
    setTimeout(() => searchInput.focus(), 100);
}

// Set up all event listeners
function setupEventListeners() {
    // FORM EVENTS
    addApplicationBtn.addEventListener("click", showAddForm);
    cancelBtn.addEventListener("click", hideForm);
    applicationForm.addEventListener("submit", handleFormSubmit);
    
    // RESEARCH BUTTON - FIXED: Now properly shows research form
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
}

// Set default follow-up date to tomorrow
function setupDateDefault() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    followUpDate.value = tomorrow.toISOString().split("T")[0];
    followUpDate.min = new Date().toISOString().split("T")[0];
}

// Handle form submission (both add and edit)
function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate follow-up date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const selectedDate = new Date(followUpDate.value);
    selectedDate.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
        showNotification("⚠️ Follow-up date cannot be in the past!", "error");
        followUpDate.focus();
        return;
    }
    
    // Validate required fields
    if (!company.value.trim() || !jobTitle.value.trim()) {
        showNotification("⚠️ Company and Job Title are required!", "error");
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
// 5. APPLICATION CRUD OPERATIONS - FIXED: Adding now works!
// =====================

// Add new application - FIXED: This was missing!
function addNewApplication() {
    const newApp = {
        id: Date.now(),
        company: company.value.trim(),
        jobTitle: jobTitle.value.trim(),
        status: status.value,
        dateApplied: new Date().toISOString(), // Store as ISO for easier sorting
        dateAppliedDisplay: formatDateYYYYMMDD(new Date()), // Format as YYYY/MM/DD
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
        lastUpdated: new Date().toISOString(),
        dateAdded: new Date().toISOString()
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
        lastUpdated: new Date().toISOString(),
        dateAdded: new Date().toISOString()
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
    const ratingStars = app.glassdoorRating ? 
        "★".repeat(Math.floor(app.glassdoorRating)) +
        (app.glassdoorRating % 1 >= 0.5 ? "½" : "") +
        "☆".repeat(5 - Math.ceil(app.glassdoorRating))
        : "";
    
    row.innerHTML = `
        <td data-label="Company">
            <strong>${app.company}</strong>
            ${app.glassdoorRating ? `<div class="rating-small">${ratingStars} ${app.glassdoorRating}</div>` : ""}
        </td>
        <td data-label="Job Title">${app.jobTitle}</td>
        <td data-label="Status">
            <span class="status-badge status-${app.status.toLowerCase()}">
                ${app.status}
            </span>
        </td>
        <td data-label="Date Applied">${app.dateAppliedDisplay || formatDateYYYYMMDD(app.dateApplied)}</td>
        <td data-label="Follow-Up">
            ${formatDateYYYYMMDD(app.followUpDate)}
            ${daysUntil >= 0 ? `<br><small class="days-remaining">(${daysUntil} day${daysUntil !== 1 ? "s" : ""} ${daysUntil === 0 ? 'today' : 'left'})</small>` : 
              `<br><small class="days-remaining overdue">(${Math.abs(daysUntil)} day${Math.abs(daysUntil) !== 1 ? "s" : ""} overdue)</small>`}
        </td>
        <td data-label="Alert">
            ${isOverdue ? 
                `<span class="alert overdue">⚠️ Overdue</span>` : 
                `<span class="alert ok">✅ On track</span>`}
        </td>
        <td data-label="Actions">
            <button class="action-btn" onclick="editApplication(${app.id})">
                ✏️ Edit
            </button>
            <button class="action-btn delete-btn" onclick="deleteApplication(${app.id})">
                🗑️ Delete
            </button>
            ${app.companyNotes ? `<button class="action-btn" onclick="viewCompanyResearch('${app.company}')" title="View Research">📚</button>` : ""}
        </td>
    `;
    
    return row;
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
            case "newest": return new Date(b.dateApplied) - new Date(a.dateApplied);
            case "oldest": return new Date(a.dateApplied) - new Date(b.dateApplied);
            case "company": return a.company.localeCompare(b.company);
            case "followup": return new Date(a.followUpDate) - new Date(b.followUpDate);
            default: return 0;
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

// =====================
// 8. ANALYTICS & CHARTS - FIXED: Now working properly!
// =====================

// Create both charts
function createCharts() {
    createStatusChart();
    createTimelineChart();
}

// Create status distribution chart (pie chart)
function createStatusChart() {
    // Destroy existing chart if it exists
    if (statusChart) {
        statusChart.destroy();
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
    
    // Ensure we have a canvas element
    if (statusChartCanvas.parentElement.innerHTML.includes('<div')) {
        statusChartCanvas.parentElement.innerHTML = '<canvas id="statusChart" width="400" height="300"></canvas>';
    }
    
    const statusColors = {
        Applied: '#3b82f6', // Blue
        Interview: '#10b981', // Green
        Rejected: '#ef4444', // Red
        Offer: '#8b5cf6' // Purple
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

// Create timeline chart (applications over time) - FIXED: Now working!
function createTimelineChart() {
    // Destroy existing chart if it exists
    if (timelineChart) {
        timelineChart.destroy();
    }
    
    const ctx = timelineChartCanvas.getContext("2d");
    
    // Group applications by date (last 7 days)
    const dateMap = {};
    const today = new Date();
    
    // Initialize last 7 days
    for (let i = 6; i >= 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateKey = formatDateYYYYMMDD(date); // Use YYYY/MM/DD format
        dateMap[dateKey] = 0;
    }
    
    // Count applications for each date
    applications.forEach(app => {
        const appDate = new Date(app.dateApplied);
        const dateKey = formatDateYYYYMMDD(appDate);
        
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
    
    // Ensure we have a canvas element
    if (timelineChartCanvas.parentElement.innerHTML.includes('<div')) {
        timelineChartCanvas.parentElement.innerHTML = '<canvas id="timelineChart" width="400" height="300"></canvas>';
    }
    
    timelineChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: dates,
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
        
        const lastUpdated = formatDateYYYYMMDD(research.lastUpdated); // Use YYYY/MM/DD format
        
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
                <h4>${research.company}</h4>
                <button class="action-btn" onclick="editResearch('${research.company}')" style="padding: 4px 8px; font-size: 12px;">
                    ✏️ Edit
                </button>
            </div>
            
            ${ratingStars ? `
                <div class="rating-stars">
                    ${ratingStars} ${research.glassdoorRating}/5
                </div>
            ` : ''}
            
            ${research.averageSalary ? `
                <p><strong>Avg Salary:</strong> ${research.averageSalary}</p>
            ` : ''}
            
            ${research.companyNotes ? `
                <p><strong>Notes:</strong> ${research.companyNotes.substring(0, 100)}${research.companyNotes.length > 100 ? '...' : ''}</p>
            ` : ''}
            
            ${research.recruiterContact ? `
                <p><strong>Contact:</strong> ${research.recruiterContact}</p>
            ` : ''}
            
            <div style="margin-top: 10px; font-size: 12px; color: #6b7280; border-top: 1px solid #e5e7eb; padding-top: 8px;">
                Last updated: ${lastUpdated}
            </div>
        `;
        
        researchCards.appendChild(card);
    });
}

// Edit company research
function editResearch(companyName) {
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
        company.focus();
    }
}

// =====================
// 11. IMPORT/EXPORT FUNCTIONS
// =====================

function exportData() {
    const data = {
        applications: applications,
        companyResearch: companyResearch,
        exportedAt: formatDateYYYYMMDD(new Date()), // Use YYYY/MM/DD format
        version: "1.0"
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `job-tracker-backup-${formatDateYYYYMMDD(new Date())}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showNotification("✅ Data exported successfully!", "success");
}

function handleImport(event) {
    const file = event.target.files[0];
    if (!file) return;
    
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
        }
        
        // Reset file input
        event.target.value = '';
    };
    
    reader.readAsText(file);
}

// =====================
// 12. UI UTILITIES
// =====================

function showNotification(message, type) {
    // Remove existing notifications
    const existingNotif = document.querySelector('.notification');
    if (existingNotif) existingNotif.remove();
    
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    notification.style.backgroundColor = type === 'error' ? '#ef4444' : 
                                      type === 'success' ? '#10b981' : 
                                      type === 'info' ? '#3b82f6' : '#6b7280';
    
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
    
    // Escape: Hide form
    if (e.key === 'Escape' && applicationFormContainer.style.display === 'block') {
        hideForm();
    }
}

// Make functions globally available for inline event handlers
window.editApplication = editApplication;
window.deleteApplication = deleteApplication;
window.viewCompanyResearch = viewCompanyResearch;
window.editResearch = editResearch;