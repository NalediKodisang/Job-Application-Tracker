// Elements
const addApplicationBtn = document.getElementById("addApplicationBtn");
const applicationFormContainer = document.getElementById("applicationFormContainer");
const applicationForm = document.getElementById("applicationForm");
const cancelBtn = document.getElementById("cancelBtn");
const applicationsTable = document.getElementById("applicationsTable");
const filterStatus = document.getElementById("filterStatus");
const searchInput = document.getElementById("searchInput");

// Load applications
let applications = JSON.parse(localStorage.getItem("applications")) || [];
displayApplications();

// Show form
addApplicationBtn.addEventListener("click", () => applicationFormContainer.style.display = "block");

// Cancel form
cancelBtn.addEventListener("click", () => { applicationFormContainer.style.display = "none"; applicationForm.reset(); });

// Submit form
applicationForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const company = document.getElementById("company").value.trim();
    const jobTitle = document.getElementById("jobTitle").value.trim();
    const status = document.getElementById("status").value;
    const dateApplied = new Date().toLocaleDateString();

    if (!company || !jobTitle) return alert("Company and Job Title required!");

    applications.push({ id: Date.now(), company, jobTitle, status, dateApplied });
    localStorage.setItem("applications", JSON.stringify(applications));
    displayApplications();
    applicationForm.reset();
    applicationFormContainer.style.display = "none";
});

// Display applications
function displayApplications() {
    const filter = filterStatus.value;
    const search = searchInput.value.toLowerCase();
    applicationsTable.innerHTML = "";

    applications
        .filter(app => (filter === "All" || app.status === filter) &&
                       (app.company.toLowerCase().includes(search) || app.jobTitle.toLowerCase().includes(search)))
        .forEach(app => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td data-label="Company">${app.company}</td>
                <td data-label="Job Title">${app.jobTitle}</td>
                <td data-label="Status">
                    <select class="status-dropdown" data-id="${app.id}">
                        <option value="Applied" ${app.status==="Applied"?"selected":""}>Applied</option>
                        <option value="Interview" ${app.status==="Interview"?"selected":""}>Interview</option>
                        <option value="Rejected" ${app.status==="Rejected"?"selected":""}>Rejected</option>
                        <option value="Offer" ${app.status==="Offer"?"selected":""}>Offer</option>
                    </select>
                </td>
                <td data-label="Date Applied">${app.dateApplied}</td>
                <td data-label="Actions"><button class="action-btn" onclick="deleteApplication(${app.id})">Delete</button></td>
            `;
            applicationsTable.appendChild(row);
        });

    // Status change
    document.querySelectorAll(".status-dropdown").forEach(dropdown => {
        dropdown.addEventListener("change", e => {
            const id = parseInt(e.target.dataset.id);
            const newStatus = e.target.value;
            applications = applications.map(app => app.id === id ? {...app, status:newStatus} : app);
            localStorage.setItem("applications", JSON.stringify(applications));
            displayApplications();
        });
    });
}

// Delete application
function deleteApplication(id) {
    if (!confirm("Delete this application?")) return;
    applications = applications.filter(app => app.id !== id);
    localStorage.setItem("applications", JSON.stringify(applications));
    displayApplications();
}

// Filter & Search
filterStatus.addEventListener("change", displayApplications);
searchInput.addEventListener("input", displayApplications);
