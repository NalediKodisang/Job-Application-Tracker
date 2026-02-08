// ELEMENTS
const addApplicationBtn = document.getElementById("addApplicationBtn");
const applicationFormContainer = document.getElementById("applicationFormContainer");
const applicationForm = document.getElementById("applicationForm");
const cancelBtn = document.getElementById("cancelBtn");
const applicationsTable = document.getElementById("applicationsTable");
const filterStatus = document.getElementById("filterStatus");
const searchInput = document.getElementById("searchInput");
const sortBy = document.getElementById("sortBy");
const exportBtn = document.getElementById("exportBtn");
const importBtn = document.getElementById("importBtn");
const importFile = document.getElementById("importFile");
const formTitle = document.getElementById("formTitle");
const submitBtn = document.getElementById("submitBtn");
const editingId = document.getElementById("editingId");

// Form input elements
const company = document.getElementById("company");
const jobTitle = document.getElementById("jobTitle");
const status = document.getElementById("status");
const followUpDate = document.getElementById("followUpDate");

// DASHBOARD ELEMENTS
const totalCount = document.getElementById("totalCount");
const interviewCount = document.getElementById("interviewCount");
const rejectedCount = document.getElementById("rejectedCount");
const offerCount = document.getElementById("offerCount");
const responseRate = document.getElementById("responseRate");
const pendingFollowups = document.getElementById("pendingFollowups");

// LOAD DATA
let applications = JSON.parse(localStorage.getItem("applications")) || [];
let isEditing = false;

// INITIALIZE
displayApplications();
setupDateDefault();
showStorageWarning();

// SHOW FORM
addApplicationBtn.onclick = () => {
    resetForm();
    formTitle.textContent = "Add New Application";
    submitBtn.textContent = "Add Application";
    applicationFormContainer.style.display = "block";
    company.focus();
};

// CANCEL FORM
cancelBtn.onclick = () => {
    applicationFormContainer.style.display = "none";
    resetForm();
};

// FORM SUBMISSION HANDLER
applicationForm.addEventListener("submit", (e) => {
    e.preventDefault();
    
    // Validate follow-up date
    const followUp = new Date(followUpDate.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (followUp < today) {
        alert("⚠️ Follow-up date cannot be in the past! Please select today or a future date.");
        followUpDate.focus();
        return;
    }
    
    if (isEditing && editingId.value) {
        // Update existing application
        applications = applications.map(app => 
            app.id === parseInt(editingId.value) ? {
                ...app,
                company: company.value.trim(),
                jobTitle: jobTitle.value.trim(),
                status: status.value,
                followUpDate: followUpDate.value
            } : app
        );
    } else {
        // Add new application
        applications.push({
            id: Date.now(),
            company: company.value.trim(),
            jobTitle: jobTitle.value.trim(),
            status: status.value,
            dateApplied: new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
            }),
            followUpDate: followUpDate.value
        });
    }
    
    // Save and update
    saveApplications();
    applicationFormContainer.style.display = "none";
    resetForm();
    displayApplications();
});

// DISPLAY APPLICATIONS
function displayApplications() {
    applicationsTable.innerHTML = "";

    const filter = filterStatus.value;
    const search = searchInput.value.toLowerCase();
    const today = new Date();

    let filteredApps = applications.filter(app =>
        (filter === "All" || app.status === filter) &&
        (app.company.toLowerCase().includes(search) ||
         app.jobTitle.toLowerCase().includes(search))
    );

    // Sort applications
    filteredApps = sortApplications(filteredApps);

    // Empty state
    if (filteredApps.length === 0) {
        applicationsTable.innerHTML = `
            <tr>
                <td colspan="7">
                    <div class="empty-state">
                        <h3>📭 No applications found</h3>
                        <p>${applications.length === 0 ? 
                            'Click "+ Add Application" to get started!' : 
                            'Try changing your search or filter.'}</p>
                    </div>
                </td>
            </tr>
        `;
        updateDashboard();
        return;
    }

    // Display each application
    filteredApps.forEach(app => {
        const followUp = new Date(app.followUpDate);
        const isOverdue = today > followUp && app.status === "Applied";
        const daysUntil = Math.ceil((followUp - today) / (1000 * 60 * 60 * 24));
        
        const row = document.createElement("tr");
        row.innerHTML = `
            <td data-label="Company">${app.company}</td>
            <td data-label="Job Title">${app.jobTitle}</td>
            <td data-label="Status">
                <span class="status-badge status-${app.status.toLowerCase()}"
                      onclick="enableStatusEdit(${app.id})">
                      ${app.status}
                </span>
            </td>
            <td data-label="Date Applied">${app.dateApplied}</td>
            <td data-label="Follow-Up">
                ${app.followUpDate}
                ${daysUntil >= 0 ? `<br><small>(${daysUntil} day${daysUntil !== 1 ? 's' : ''})</small>` : ''}
            </td>
            <td data-label="Alert">
                ${isOverdue
                    ? `<span class="alert overdue">⚠️ Overdue</span>`
                    : `<span class="alert ok">✅ On track</span>`
                }
            </td>
            <td data-label="Actions">
                <button class="action-btn" onclick="editApplication(${app.id})">
                    ✏️ Edit
                </button>
                <button class="action-btn delete-btn" onclick="deleteApplication(${app.id})">
                    🗑️ Delete
                </button>
            </td>
        `;
        applicationsTable.appendChild(row);
    });

    updateDashboard();
}

// SORT APPLICATIONS
function sortApplications(apps) {
    const sortValue = sortBy.value;
    
    return [...apps].sort((a, b) => {
        switch(sortValue) {
            case 'newest':
                return b.id - a.id;
            case 'oldest':
                return a.id - b.id;
            case 'company':
                return a.company.localeCompare(b.company);
            case 'followup':
                return new Date(a.followUpDate) - new Date(b.followUpDate);
            default:
                return 0;
        }
    });
}

// EDIT APPLICATION
function editApplication(id) {
    const app = applications.find(a => a.id === id);
    if (!app) return;
    
    // Populate form
    company.value = app.company;
    jobTitle.value = app.jobTitle;
    status.value = app.status;
    followUpDate.value = app.followUpDate;
    editingId.value = app.id;
    
    // Change form mode
    isEditing = true;
    formTitle.textContent = "Edit Application";
    submitBtn.textContent = "Update Application";
    applicationFormContainer.style.display = "block";
    company.focus();
}

// ENABLE STATUS EDIT
function enableStatusEdit(id) {
    const app = applications.find(a => a.id === id);
    if (!app) return;
    
    const row = [...applicationsTable.rows].find(r => 
        r.innerHTML.includes(`onclick="editApplication(${id})"`) || 
        r.innerHTML.includes(`onclick="deleteApplication(${id})"`)
    );
    
    if (!row) return;
    
    row.cells[2].innerHTML = `
        <select class="status-dropdown" onchange="updateStatus(${id}, this.value)">
            <option value="Applied" ${app.status === "Applied" ? "selected" : ""}>Applied</option>
            <option value="Interview" ${app.status === "Interview" ? "selected" : ""}>Interview</option>
            <option value="Rejected" ${app.status === "Rejected" ? "selected" : ""}>Rejected</option>
            <option value="Offer" ${app.status === "Offer" ? "selected" : ""}>Offer</option>
        </select>
    `;
    
    // Focus the dropdown
    setTimeout(() => row.cells[2].querySelector('select').focus(), 10);
}

// UPDATE STATUS
function updateStatus(id, newStatus) {
    applications = applications.map(app =>
        app.id === id ? { ...app, status: newStatus } : app
    );
    saveApplications();
    displayApplications();
}

// DELETE APPLICATION
function deleteApplication(id) {
    if (!confirm("Are you sure you want to delete this application?")) return;
    
    applications = applications.filter(app => app.id !== id);
    saveApplications();
    displayApplications();
    
    // Show success message
    showNotification("Application deleted successfully!", "success");
}

// SAVE APPLICATIONS TO LOCALSTORAGE
function saveApplications() {
    localStorage.setItem("applications", JSON.stringify(applications));
}

// DASHBOARD ANALYTICS
function updateDashboard() {
    const total = applications.length;
    const interviews = applications.filter(a => a.status === "Interview").length;
    const rejected = applications.filter(a => a.status === "Rejected").length;
    const offers = applications.filter(a => a.status === "Offer").length;
    
    // Count pending follow-ups
    const today = new Date();
    const pending = applications.filter(app => {
        const followUp = new Date(app.followUpDate);
        return followUp >= today && app.status === "Applied";
    }).length;

    const responded = interviews + rejected + offers;
    const rate = total === 0 ? 0 : Math.round((responded / total) * 100);

    totalCount.textContent = total;
    interviewCount.textContent = interviews;
    rejectedCount.textContent = rejected;
    offerCount.textContent = offers;
    responseRate.textContent = rate + "%";
    pendingFollowups.textContent = pending;
}

// RESET FORM
function resetForm() {
    applicationForm.reset();
    editingId.value = "";
    isEditing = false;
    setupDateDefault();
}

// SET DEFAULT DATE TO TOMORROW
function setupDateDefault() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    followUpDate.value = tomorrow.toISOString().split('T')[0];
    followUpDate.min = new Date().toISOString().split('T')[0];
}

// EXPORT DATA
exportBtn.onclick = () => {
    if (applications.length === 0) {
        alert("No data to export!");
        return;
    }
    
    const dataStr = JSON.stringify(applications, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `job-applications-${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    document.body.appendChild(linkElement);
    linkElement.click();
    document.body.removeChild(linkElement);
    
    showNotification("Data exported successfully!", "success");
};

// IMPORT DATA
importBtn.onclick = () => {
    importFile.click();
};

importFile.onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (applications.length > 0 && !confirm("⚠️ Importing will replace all current applications. Continue?")) {
        e.target.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const importedData = JSON.parse(event.target.result);
            
            // Validate imported data structure
            if (!Array.isArray(importedData) || !importedData.every(item => 
                item.company && item.jobTitle && item.status && item.dateApplied && item.followUpDate
            )) {
                throw new Error("Invalid file format");
            }
            
            applications = importedData;
            saveApplications();
            displayApplications();
            
            showNotification("Data imported successfully! " + importedData.length + " applications loaded.", "success");
        } catch (error) {
            alert("❌ Error: Invalid file format. Please select a valid JSON export file.");
        }
    };
    reader.readAsText(file);
    e.target.value = '';
};

// SHOW STORAGE WARNING
function showStorageWarning() {
    if (!localStorage.getItem('shownStorageWarning')) {
        setTimeout(() => {
            showNotification("💡 Tip: Your data is stored locally in your browser. Export regularly to backup your applications.", "info");
            localStorage.setItem('shownStorageWarning', 'true');
        }, 2000);
    }
}

// SHOW NOTIFICATION
function showNotification(message, type = 'info') {
    // Remove existing notification
    const existingNotification = document.querySelector('.notification');
    if (existingNotification) {
        existingNotification.remove();
    }
    
    // Create notification
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <span>${message}</span>
        <button onclick="this.parentElement.remove()">×</button>
    `;
    
    // Add styles
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        border-radius: 8px;
        color: white;
        font-weight: 600;
        display: flex;
        justify-content: space-between;
        align-items: center;
        min-width: 300px;
        max-width: 400px;
        z-index: 1000;
        animation: slideIn 0.3s ease;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    `;
    
    if (type === 'success') {
        notification.style.background = 'linear-gradient(135deg, #10b981 0%, #059669 100%)';
    } else if (type === 'error') {
        notification.style.background = 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)';
    } else {
        notification.style.background = 'linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%)';
    }
    
    notification.querySelector('button').style.cssText = `
        background: none;
        border: none;
        color: white;
        font-size: 20px;
        cursor: pointer;
        margin-left: 15px;
        padding: 0 5px;
    `;
    
    document.body.appendChild(notification);
    
    // Auto remove after 5 seconds
    setTimeout(() => {
        if (notification.parentElement) {
            notification.style.animation = 'slideOut 0.3s ease forwards';
            setTimeout(() => notification.remove(), 300);
        }
    }, 5000);
}

// Add notification animations to style
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// EVENT LISTENERS FOR FILTERS
filterStatus.onchange = displayApplications;
searchInput.oninput = displayApplications;
sortBy.onchange = displayApplications;

// ADD DEBOUNCE TO SEARCH
let searchTimeout;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(displayApplications, 300);
});

// ENTER KEY TO SUBMIT FORM
applicationForm.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        applicationForm.requestSubmit();
    }
});

// FOCUS TRAPPING IN FORM
applicationFormContainer.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        cancelBtn.click();
    }
});