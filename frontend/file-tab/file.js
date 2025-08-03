document.addEventListener("DOMContentLoaded", () => {
    // Backend API URL - change this to match your server
    //API_URL = 'http://localhost:3000/api';

    loadStudents();

    document.getElementById("deleteAll").addEventListener("click", deleteAllStudents);
    document.getElementById("exportExcel").addEventListener("click", exportToExcel);
});

// Load students from SQLite database
async function loadStudents(category = "") {
    try {
        const response = await fetch(`http://localhost:3000/api/students`);
        let students = await response.json();

        // Filter by category if selected
        if (category) {
            students = students.filter(s => s.category === category); // ✅ fixed
        }

        displayStudents(students);
    } catch (error) {
        console.error('Error loading students:', error);
        alert('Failed to load student data. Please check server connection.');
    }
}


function filterByCategory() {
    const selectedCategory = document.getElementById("categoryFilter").value;
    loadStudents(selectedCategory);
}

// Display students in the list
function displayStudents(students) {
    const studentList = document.getElementById("studentList");
    studentList.innerHTML = "";

    if (students.length === 0) {
        studentList.innerHTML = "<p class='no-data'>No student records found</p>";
        return;
    }

    // Group students by category
    const grouped = {};
    students.forEach(student => {
        const category = student.category || "Uncategorized";
        if (!grouped[category]) grouped[category] = [];
        grouped[category].push(student);
    });

    // Display grouped students
    for (const category in grouped) {
        const groupTitle = document.createElement("h4");
        groupTitle.textContent = `📁 ${category}`;
        groupTitle.classList.add("category-title");
        studentList.appendChild(groupTitle);

        grouped[category].forEach(student => {
            const studentItem = document.createElement("div");
            studentItem.classList.add("student-item");
            studentItem.innerHTML = `
                <span>${student.roll} - ${student.name}</span>
                <div class="student-buttons">
                    <button class="view-btn" onclick="viewStudent(${student.id})">👁 View</button>
                    <button class="delete-btn" onclick="deleteStudent(${student.id})">🗑 Delete</button>
                    <button class="print-btn" onclick="printStudent(${student.id})">🖨 Print</button>
                </div>
            `;
            studentList.appendChild(studentItem);
        });
    }
}


// Delete all students
async function deleteAllStudents() {
    const selectedCategory = document.getElementById("categoryFilter").value;

    let confirmationMessage = "Are you sure you want to delete ";
    confirmationMessage += selectedCategory
        ? `all student records from "${selectedCategory}" category?`
        : "ALL student records? This cannot be undone.";

    if (confirm(confirmationMessage)) {
        try {
            let url = `http://localhost:3000/api/students`;
            if (selectedCategory) {
                url += `?category=${encodeURIComponent(selectedCategory)}`;
            }

            const response = await fetch(url, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete student records');
            }

            const result = await response.json();
            alert(`Success: ${result.deletedCount} student records deleted`);
            loadStudents(selectedCategory);

        } catch (error) {
            console.error('Error deleting students:', error);
            alert('Failed to delete student records');
        }
    }
}

// Delete a specific student
async function deleteStudent(id) {
    if (confirm("Are you sure you want to delete this student record?")) {
        try {
            const response = await fetch(`http://localhost:3000/api/students/${id}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete student');
            }

            await response.json();
            loadStudents();
        } catch (error) {
            console.error('Error deleting student:', error);
            alert('Failed to delete student record');
        }
    }
}
// View student details
async function viewStudent(id) {
    try {
        // Get the roll number first
        const listResponse = await fetch(`http://localhost:3000/api/students`);
        const studentsList = await listResponse.json();
        const student = studentsList.find(s => s.id === id);

        if (!student) {
            throw new Error('Student not found');
        }

        // Fetch full student details including photo and signature
        const response = await fetch(`http://localhost:3000/api/students/roll/${student.roll}`);

        if (!response.ok) {
            throw new Error('Failed to fetch student details');
        }

        const studentDetails = await response.json();

        // Create a modal to display student details
        const modal = document.createElement('div');
        modal.className = 'student-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <span class="close-button">&times;</span>
                <h2>Student Details</h2>
                <div class="student-preview">
                    <div class="preview-photo">
                        <img src="${studentDetails.photo}" alt="Student Photo">
                    </div>
                    <div class="preview-details">
                        <p><strong>Roll Number:</strong> ${studentDetails.roll}</p>
                        <p><strong>Name:</strong> ${studentDetails.name}</p>
                        <p><strong>Father's Name:</strong> ${studentDetails.fathername}</p>
                        <p><strong>Course:</strong> ${studentDetails.course}</p>
                        <p><strong>Blood Group:</strong> ${studentDetails.bloodGroup}</p>
                        <p><strong>Contact Number:</strong> ${studentDetails.contactNumber}</p>
                        <p><strong>Issue Date:</strong> ${studentDetails.issueDate}</p>
                        <p><strong>Session:</strong> ${studentDetails.session}</p>
                    </div>
                </div>
                <div class="signature-preview">
                    <p><strong>Signature:</strong></p>
                    <img src="${studentDetails.signature}" alt="Student Signature">
                </div>
                <button class="print-modal-btn">Print ID Card</button>
            </div>
        `;

        document.body.appendChild(modal);

        // Close button functionality
        const closeButton = modal.querySelector('.close-button');
        closeButton.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        // Print button functionality
        const printButton = modal.querySelector('.print-modal-btn');
        printButton.addEventListener('click', () => {
            printStudent(id);
        });

        // Close modal when clicking outside
        window.addEventListener('click', (event) => {
            if (event.target === modal) {
                document.body.removeChild(modal);
            }
        });

    } catch (error) {
        console.error('Error viewing student details:', error);
        alert('Failed to load student details');
    }
}

// Print student ID card
async function printStudent(id) {
    try {
        // Get the roll number first
        const listResponse = await fetch(`http://localhost:3000/api/students`);
        const studentsList = await listResponse.json();
        const student = studentsList.find(s => s.id === id);

        if (!student) {
            throw new Error('Student not found');
        }

        // Fetch full student details
        const response = await fetch(`http://localhost:3000/api/students/roll/${student.roll}`);

        if (!response.ok) {
            throw new Error('Failed to fetch student details');
        }

        const studentDetails = await response.json();

        // Create an ID card element
        const idCard = document.createElement('div');
        idCard.className = 'id-card-section';
        idCard.innerHTML = `
            <!-- Header -->
            <div class="id-card-section" id="id-card">
            <div class="id-header">
                <img src="../image/BClogo.png" alt="College Logo">
                <div>
                    <h2>BAHONA COLLEGE</h2>
                    <h3>বাহনা মহাবিদ্যালয়</h3>
                    <p>Affiliated to Dibrugarh University <br> PO: Bahona, Jorhat, Assam - 785101</p>
                </div>
                <span id="id-session">SESSION<br><span class="session-year">${studentDetails.session}</span></span>
            </div>

                    <!-- Main Body -->
                    <div class="id-body">
                        <div class="photo-date-section">
                            <!-- Student Photo -->
                            <img id="id-photo" class="id-photo" src="${studentDetails.photo}" alt="Student Photo">

                            <!-- Date of Issue Below the Photo -->
                            <div class="issue-date">
                                <strong>Date of Issue:</strong> <span id="id-issue-date">${studentDetails.issueDate}</span>
                            </div>
                        </div>

                        <!-- Student Details -->
                        <div class="details">
                            <div class="id-title">COLLEGE ID CUM LIBRARY CARD</div>
                            <p><strong>Roll Number</strong>: <span id="id-roll">${studentDetails.roll}</span></p>
                            <p><strong>Name</strong>: <span id="id-name">${studentDetails.name}</span></p>
                            <p><strong>Father's Name</strong>: <span id="id-fathername">${studentDetails.fathername}</span></p>
                            <p><strong>Course</strong>: <span id="id-course">${studentDetails.course}</span></p>
                            <p><strong>Blood Group</strong>: <span id="id-blood-group">${studentDetails.bloodGroup}</span></p>
                            <p><strong>Contact Number</strong>: <span id="id-contact-number">${studentDetails.contactNumber}</span></p>
                        </div>
                    </div>
                                        <!-- Barcode -->
                                        <div class="barcode-box">
                                            <svg id="barcode"></svg>
                                        </div>

                    <!-- Signature, Barcode & Authority Signature in One Line -->
                    <div class="footer-line">
                        <div class="signature-box">
                            <!-- Card Holder Signature -->
                            <div class="signature-st">
                                <img id="signature-holder" class="signature-s" src="${studentDetails.signature}" alt="Card Holder Signature">
                                <p>Signature of the Card<br>Holder</p>
                            </div>

                            <!-- Issuing Authority Signature -->
                            <div class="signature-au">
                                <img src="../image/Ausign.jpg" class="signature-a" alt="Issuer Signature">
                                <p>Signature of the Issuing<br>Authority</p>
                            </div>
                        </div>
                    </div>

            <!-- Footer Note --> 
            <div class="footer">
                <p class="note">N.B:Kindly submit the card after the completion of the course.<br>© Developed by Computer Science Dept, Bahona College</p>
            </div>
        </div>
        </section>
        `;

        // Print the ID card
        const originalContent = document.body.innerHTML;
        document.body.innerHTML = `<div style="width: 86mm; height: 54mm; margin: auto;">${idCard.outerHTML}</div>`;

        // Generate barcode
        JsBarcode("#barcode", studentDetails.roll, {
            format: "CODE128",
            displayValue: false,
            width: 2,
            height: 40,
        });

        window.print();
        document.body.innerHTML = originalContent;

        // Reload the page after printing
        setTimeout(() => {
            window.location.reload();
        }, 500);

    } catch (error) {
        console.error('Error printing student ID:', error);
        alert('Failed to print student ID card');
    }
}
// Search student by roll number
async function searchStudent() {
    let searchTerm = document.getElementById("searchInput").value.trim();
    if (!searchTerm) {
        loadStudents();
        return;
    }

    try {
        const response = await fetch(`http://localhost:3000/api/students/search?term=${searchTerm}`);
        const students = await response.json();
        displayStudents(students);
    } catch (error) {
        console.error('Error searching students:', error);
        alert('Failed to search student records');
    }
}

// Export student data to Excel
async function exportToExcel() {
    try {
        const selectedCategory = document.getElementById("categoryFilter").value;
        let url = `http://localhost:3000/api/students`;

        if (selectedCategory) {
            url += `?category=${encodeURIComponent(selectedCategory)}`;
        }

        const response = await fetch(url);
        const students = await response.json();

        if (students.length === 0) {
            alert('No student records to export');
            return;
        }

        const studentData = students.map(student => ({
            "Roll Number": student.roll,
            "Name": student.name,
            "Father Name": student.fathername,
            "Course": student.course,
            "Blood Group": student.bloodGroup,
            "Contact Number": student.contactNumber,
            "Date of Issue": student.issueDate,
            "Session": student.session,
            "Category": student.category
        }));

        const worksheet = XLSX.utils.json_to_sheet(studentData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Students");

        XLSX.writeFile(workbook, selectedCategory ? `${selectedCategory}-students.xlsx` : "students.xlsx");

    } catch (error) {
        console.error('Error exporting to Excel:', error);
        alert('Failed to export student records');
    }
}
