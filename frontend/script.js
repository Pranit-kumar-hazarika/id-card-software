document.addEventListener("DOMContentLoaded", () => {
    const rollInput = document.getElementById("roll");
    const nameInput = document.getElementById("name");
    const fathernameInput = document.getElementById("fathername");
    const courseInput = document.getElementById("course");
    const bloodGroupInput = document.getElementById("blood-group");
    const contactNumberInput = document.getElementById("contact-number");
    const issueDateInput = document.getElementById("issue-date");
    const photoInput = document.getElementById("photo");
    const signatureInput = document.getElementById("signature");
    const sessionInput = document.getElementById("sessionInput");

    const idRoll = document.getElementById("id-roll");
    const idName = document.getElementById("id-name");
    const idFathername = document.getElementById("id-fathername");
    const idCourse = document.getElementById("id-course");
    const idBloodGroup = document.getElementById("id-blood-group");
    const idContactNumber = document.getElementById("id-contact-number");
    const idIssueDate = document.getElementById("id-issue-date");
    const idPhoto = document.getElementById("id-photo");
    const signatureHolder = document.getElementById("signature-holder");
    const barcode = document.getElementById("barcode");
    const idSession = document.getElementById("id-session");
    const studentCategory = document.getElementById("studentCategory").value;


    const generateBtn = document.getElementById("generate");
    const resetBtn = document.getElementById("reset");
    const printBtn = document.getElementById("print");

    // API base URL
    const API_URL = 'http://localhost:3000/api';
    // Generate ID Card
    generateBtn.addEventListener("click", () => {
        if (
            rollInput.value.trim() === "" ||
            nameInput.value.trim() === "" ||
            fathernameInput.value.trim() === "" ||
            courseInput.value.trim() === "" ||
            bloodGroupInput.value.trim() === "" ||
            contactNumberInput.value.trim() === "" ||
            issueDateInput.value.trim() === "" ||
            sessionInput.value.trim() === ""
        ) {
            alert("Please fill in all the fields!");
            return;
        }

        if (!/^\d{10}$/.test(contactNumberInput.value.trim())) {
            alert("Please enter a valid 10-digit contact number.");
            return;
        }

        // Update ID Card preview
        idRoll.textContent = rollInput.value;
        idName.textContent = nameInput.value;
        idFathername.textContent = fathernameInput.value;
        idCourse.textContent = courseInput.value;
        idBloodGroup.textContent = bloodGroupInput.value;
        idContactNumber.textContent = contactNumberInput.value;
        idIssueDate.textContent = issueDateInput.value;
        idSession.innerHTML = `SESSION<br>${sessionInput.value.trim()}`;

        // Handle Photo
        let photoBase64 = "";
        if (photoInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = (e) => {
                idPhoto.src = e.target.result;
            };
            reader.readAsDataURL(photoInput.files[0]);
        } else {
            idPhoto.src = "image/default-photo.png";
            photoBase64 = "image/default-photo.png";
        }

        // Handle Signature
        let signatureBase64 = "";
        if (signatureInput.files.length > 0) {
            const reader = new FileReader();
            reader.onload = (e) => {
                signatureHolder.src = e.target.result;
                signatureBase64 = e.target.result;
                generateBarcode(rollInput.value);
            };
            reader.readAsDataURL(signatureInput.files[0]);
        } else {
            signatureHolder.src = "image/default-signature.png";
            signatureBase64 = "image/default-signature.png";
            generateBarcode(rollInput.value);
        }
    });

    // Generate Barcode
    function generateBarcode(roll) {
        try {
            JsBarcode(barcode, roll, {
                format: "CODE128",
                displayValue: false,
                width: 2,
                height: 40,
            });
        } catch (error) {
            console.error("Error generating barcode:", error);
        }
    }

    // Reset Form
    resetBtn.addEventListener("click", () => {
        rollInput.value = "";
        nameInput.value = "";
        fathernameInput.value = "";
        courseInput.value = "";
        bloodGroupInput.value = "";
        contactNumberInput.value = "";
        issueDateInput.value = "";
        sessionInput.value = "";
        photoInput.value = null;
        signatureInput.value = null;

        idRoll.textContent = "XXXXX";
        idName.textContent = "XXXXX";
        idFathername.textContent = "XXXXX";
        idCourse.textContent = "XXXXX";
        idBloodGroup.textContent = "XXXXX";
        idContactNumber.textContent = "XXXXX";
        idIssueDate.textContent = "XX-XX-XXXX";
        idSession.innerHTML = "SESSION<br>YYYY-YY";
        idPhoto.src = "image/default-photo.png";
        signatureHolder.src = "image/default-signature.png";
        barcode.innerHTML = "";
    });

    // Print and Save Data to Database
    printBtn.addEventListener("click", async () => {
        const roll = rollInput.value.trim();
        const name = nameInput.value.trim();
        const fathername = fathernameInput.value.trim();
        const course = courseInput.value.trim();
        const bloodGroup = bloodGroupInput.value.trim();
        const contactNumber = contactNumberInput.value.trim();
        const issueDate = issueDateInput.value.trim();
        const session = sessionInput.value.trim();
        const studentCategory = document.getElementById("studentCategory").value;
        console.log("Saving student with category:", studentCategory);

        if (!roll || !name || !fathername || !course ||
            !bloodGroup || !contactNumber || !issueDate || !session || !studentCategory) {
            alert("Please fill in all fields before printing!");
            return;
        }

        const photo = idPhoto.src;
        const signature = signatureHolder.src;

        try {
            const response = await fetch(`http://localhost:3000/api/students`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    roll,
                    name,
                    fathername,
                    course,
                    bloodGroup,
                    contactNumber,
                    issueDate,
                    session,
                    category: studentCategory, // ✅ Correct key for database
                    photo,
                    signature
                })

            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to save student data');
            }

            const printContent = document.querySelector(".id-card-section").outerHTML;
            const originalContent = document.body.innerHTML;

            document.body.innerHTML = `<div style="width: 86mm; height: 54mm; margin: auto;">${printContent}</div>`;
            window.print();
            document.body.innerHTML = originalContent;

            setTimeout(() => {
                window.location.reload();
            }, 500);

        } catch (error) {
            alert(`Error: ${error.message}`);
            console.error('Error saving student data:', error);
        }
    });

});
