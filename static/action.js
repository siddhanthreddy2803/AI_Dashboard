document.addEventListener("DOMContentLoaded", () => {
    const inputTypeSelect = document.getElementById("input-type");
    const uploadSection = document.getElementById("upload-section");
    const linkSection = document.getElementById("link-section");
    const dataButton = document.getElementById("data");
    const columnSelectSection = document.getElementById("column-select-section");
    const columnSelect = document.getElementById("column-select");
    const promptInput = document.getElementById("prompt-input");
    const resultsDiv = document.getElementById("results");
    const resultsTable = document.getElementById("results-table");
    const downloadButton = document.getElementById("download-button");
    const tableContainer = document.getElementById("tableContainer");
    const uploadForm = document.getElementById("upload-form");
    const sheetUrlTextarea = document.getElementById("sheet-url");
    const submitQueryButton = document.getElementById("submit-query");
    const promptTextarea = document.getElementById("prompt");

    uploadSection.style.display = "none";
    linkSection.style.display = "none";
    dataButton.style.display = "none";
    columnSelectSection.style.display = "none";
    promptInput.style.display = "none";
    resultsDiv.style.display = "none";
    downloadButton.style.display = "none";

    inputTypeSelect.addEventListener("change", () => {
        if (inputTypeSelect.value === "csv") {
            uploadSection.style.display = "block";
            linkSection.style.display = "none";
        } else if (inputTypeSelect.value === "google_drive_link") {
            uploadSection.style.display = "none";
            linkSection.style.display = "block";
        }
        dataButton.style.display = "block";
        tableContainer.innerHTML = "";
        columnSelectSection.style.display = "none";
        promptInput.style.display = "none";
        resultsDiv.style.display = "none";
        downloadButton.style.display = "none";
    });

    dataButton.addEventListener("click", () => {
        const inputType = inputTypeSelect.value;
        const formData = new FormData();

        if (inputType === "csv") {
            const fileInput = uploadForm.querySelector('input[name="file"]');
            if (!fileInput.files[0]) {
                alert("Please upload a file.");
                return;
            }
            formData.append("file", fileInput.files[0]);
            fetch("/upload", {
                method: "POST",
                body: formData,
            })
                .then((response) => response.json())
                .then((data) => {
                    if (data.error) {
                        alert(data.error);
                    } else {
                        displayTable(data);
                        populateColumnDropdown(data.columns);
                    }
                })
                .catch((error) => console.error("Error fetching data:", error));
        } else if (inputType === "google_drive_link") {
            const googleDriveLink = sheetUrlTextarea.value.trim();
            
            if (!googleDriveLink) {
                alert("Please enter a valid Google Drive link.");
                return;
            }
            
            formData.append("google_drive_link", googleDriveLink);
            fetch("/upload2", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    sheet_url: googleDriveLink
                })
            })
            .then((response) => response.json())
            .then((data) => {
                if (data.error) {
                    alert(data.error);
                } else {
                    displayTable(data);
                    populateColumnDropdown(data.columns);
                }
            })
            .catch((error) => console.error("Error fetching data:", error));
        }
    });

    function displayTable(data) {
        const table = document.createElement("table");
        const thead = document.createElement("thead");
        const tbody = document.createElement("tbody");

        const headerRow = document.createElement("tr");
        data.columns.forEach((column) => {
            const th = document.createElement("th");
            th.textContent = column;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        data.preview.forEach((row) => {
            const tableRow = document.createElement("tr");
            data.columns.forEach((column) => {
                const td = document.createElement("td");
                td.textContent = row[column] || "";
                tableRow.appendChild(td);
            });
            tbody.appendChild(tableRow);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        tableContainer.innerHTML = "";
        tableContainer.appendChild(table);
        columnSelectSection.style.display = "block";
    }

    function populateColumnDropdown(columns) {
        columnSelect.innerHTML = '<option value="" disabled selected>Select a column</option>';
        columns.forEach((column) => {
            const option = document.createElement("option");
            option.value = column;
            option.textContent = column;
            columnSelect.appendChild(option);
        });
    }

    columnSelect.addEventListener("change", () => {
        promptInput.style.display = "block";
        resultsDiv.style.display = "none";
        downloadButton.style.display = "none";
    });

    submitQueryButton.addEventListener("click", () => {
        const inputType = inputTypeSelect.value;
        const prompt = promptTextarea.value.trim();
        const selectedColumn = columnSelect.value;

        if (!prompt) {
            alert("Please provide a valid query.");
            return;
        }

        const payload = {
            input_type: inputType,
            prompt: prompt,
            selected_column: selectedColumn,
        };

        if (inputType === "csv") {
            const fileInput = uploadForm.querySelector('input[name="file"]');
            payload.file_name = fileInput.files[0]?.name;
        } else if (inputType === "google_drive_link") {
            payload.google_drive_link = sheetUrlTextarea.value;
        }

        fetch("/process-query", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(payload),
        })
            .then((response) => response.json())
            .then((data) => {
                if (data.error) {
                    alert(data.error);
                } else {
                    displayResults(data.results);
                    resultsDiv.style.display = "block";
                    downloadButton.style.display = "block";
                }
            })
            .catch((error) => console.error("Error processing query:", error));
    });

    function displayResults(results) {
        const table = document.createElement("table");
        const thead = document.createElement("thead");
        const tbody = document.createElement("tbody");

        const headerRow = document.createElement("tr");
        ["Entity", "Data"].forEach((header) => {
            const th = document.createElement("th");
            th.textContent = header;
            headerRow.appendChild(th);
        });
        thead.appendChild(headerRow);

        results.forEach(({ entity, data }) => {
            const row = document.createElement("tr");
            [entity, data].forEach((value) => {
                const td = document.createElement("td");
                td.textContent = value || "";
                row.appendChild(td);
            });
            tbody.appendChild(row);
        });

        table.appendChild(thead);
        table.appendChild(tbody);
        resultsTable.innerHTML = "";
        resultsTable.appendChild(table);
    }

    downloadButton.addEventListener("click", () => {
        window.location.href = "/download-results";
    });
});
