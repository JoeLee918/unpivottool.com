// Unmerge & Fill Tool - Specific JavaScript Logic

class UnmergeFillTool {
    constructor() {
        console.log('🔧 UnmergeFillTool initializing...');
        this.currentData = [];
        this.processedData = [];
        this.selectedAction = null;
        
        this.initializeEventListeners();
        this.loadDefaultData();
        console.log('✅ UnmergeFillTool initialized');
    }

    initializeEventListeners() {
        // Method switching
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const method = btn.dataset.method;
                
                // Update active tab
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // Show corresponding method
                document.querySelectorAll('.input-method').forEach(m => m.classList.remove('active'));
                document.querySelector(`[data-method="${method}"]`).classList.add('active');
            });
        });

        // Action card selection
        document.querySelectorAll('.action-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (e.target.classList.contains('action-btn')) return;
                
                const action = card.dataset.action;
                this.selectAction(action);
            });
        });

        // Action buttons
        document.querySelectorAll('.action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const action = btn.dataset.action;
                this.processData(action);
            });
        });

        // Data management
        document.getElementById('expand-editor')?.addEventListener('click', this.openFullEditor.bind(this));
        document.getElementById('clear-data')?.addEventListener('click', this.clearData.bind(this));
        document.getElementById('add-row')?.addEventListener('click', this.addRow.bind(this));
        document.getElementById('add-column')?.addEventListener('click', this.addColumn.bind(this));

        // Results actions
        document.getElementById('copy-results')?.addEventListener('click', this.copyResults.bind(this));
        document.getElementById('download-excel')?.addEventListener('click', this.downloadExcel.bind(this));
        document.getElementById('download-csv')?.addEventListener('click', this.downloadCSV.bind(this));

        // File upload
        this.setupFileUpload();
        
        // Data grid events
        this.setupDataGridEvents();
    }

    selectAction(action) {
        // Remove previous selection
        document.querySelectorAll('.action-card').forEach(card => {
            card.classList.remove('selected');
        });

        // Select new action
        const selectedCard = document.querySelector(`[data-action="${action}"]`);
        if (selectedCard) {
            selectedCard.classList.add('selected');
            this.selectedAction = action;
        }

        console.log(`🎯 Selected action: ${action}`);
    }

    processData(action) {
        if (!this.currentData.length) {
            this.showAlert('Please add some data first', 'error');
            return;
        }

        console.log(`🔧 Processing data with action: ${action}`);
        
        // Show loading state
        const btn = document.querySelector(`[data-action="${action}"] .action-btn`);
        btn.classList.add('loading');
        btn.textContent = 'Processing...';

        // Process data based on action
        setTimeout(() => {
            try {
                switch (action) {
                    case 'split':
                        this.processedData = this.splitMergedCells(this.currentData);
                        break;
                    case 'fill':
                        this.processedData = this.fillEmptyCells(this.currentData);
                        break;
                    case 'both':
                        this.processedData = this.splitMergedCells(this.fillEmptyCells(this.currentData));
                        break;
                    default:
                        throw new Error('Invalid action');
                }

                this.displayResults();
                this.showAlert(`Data processed successfully! ${this.processedData.length} rows generated.`, 'success');
                
            } catch (error) {
                console.error('Processing error:', error);
                this.showAlert('Error processing data. Please check your input.', 'error');
            } finally {
                // Remove loading state
                btn.classList.remove('loading');
                btn.textContent = this.getButtonText(action);
            }
        }, 500);
    }

    splitMergedCells(data) {
        console.log('✂️ Splitting merged cells...');
        const result = [];
        
        for (let i = 0; i < data.length; i++) {
            const row = [...data[i]];
            
            // Detect and split merged cells
            for (let j = 0; j < row.length; j++) {
                if (row[j] === '' && i > 0) {
                    // Look for the last non-empty value in this column
                    let lastValue = '';
                    for (let k = i - 1; k >= 0; k--) {
                        if (data[k][j] !== '') {
                            lastValue = data[k][j];
                            break;
                        }
                    }
                    row[j] = lastValue;
                }
            }
            
            result.push(row);
        }
        
        return result;
    }

    fillEmptyCells(data) {
        console.log('🎨 Filling empty cells...');
        const result = [];
        
        for (let i = 0; i < data.length; i++) {
            const row = [...data[i]];
            
            // Fill empty cells with values from above
            for (let j = 0; j < row.length; j++) {
                if (row[j] === '' && i > 0) {
                    let lastValue = '';
                    for (let k = i - 1; k >= 0; k--) {
                        if (data[k][j] !== '') {
                            lastValue = data[k][j];
                            break;
                        }
                    }
                    row[j] = lastValue;
                }
            }
            
            result.push(row);
        }
        
        return result;
    }

    displayResults() {
        const resultsSection = document.getElementById('results-section');
        const resultsTable = document.getElementById('results-table');
        const resultsCount = document.getElementById('results-count');
        
        if (!resultsSection || !resultsTable || !resultsCount) return;

        // Update count
        resultsCount.textContent = `${this.processedData.length} rows processed`;

        // Create results table
        let tableHTML = '<table><thead><tr>';
        
        // Headers
        if (this.processedData.length > 0) {
            this.processedData[0].forEach((_, index) => {
                tableHTML += `<th>Column ${index + 1}</th>`;
            });
        }
        tableHTML += '</tr></thead><tbody>';

        // Data rows
        this.processedData.forEach(row => {
            tableHTML += '<tr>';
            row.forEach(cell => {
                tableHTML += `<td>${cell}</td>`;
            });
            tableHTML += '</tr>';
        });

        tableHTML += '</tbody></table>';
        resultsTable.innerHTML = tableHTML;

        // Show results section
        resultsSection.style.display = 'block';
        resultsSection.scrollIntoView({ behavior: 'smooth' });

        // Add success animation
        resultsSection.classList.add('success-animation');
        setTimeout(() => {
            resultsSection.classList.remove('success-animation');
        }, 600);
    }

    getButtonText(action) {
        const texts = {
            'split': 'Split Cells',
            'fill': 'Fill Cells',
            'both': 'Split & Fill'
        };
        return texts[action] || 'Process';
    }

    showAlert(message, type = 'info') {
        // Remove existing alerts
        document.querySelectorAll('.alert').forEach(alert => alert.remove());

        // Create new alert
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        // Insert at top of main container
        const main = document.querySelector('.main .container');
        if (main) {
            main.insertBefore(alert, main.firstChild);
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    loadDefaultData() {
        // Load sample data with merged cells into the grid
        const sampleData = [
            ['Department', 'Employee', 'Q1 Sales', 'Q2 Sales'],
            ['Sales', 'John Smith', '75000', '82000'],
            ['', 'Sarah Wilson', '68000', '71000'],
            ['', 'Mike Johnson', '72000', '76000'],
            ['Marketing', 'Lisa Brown', '85000', '89000'],
            ['', 'Tom Davis', '62000', '65000']
        ];

        this.currentData = sampleData;
        this.updateDataGrid();
    }

    updateDataGrid() {
        const grid = document.getElementById('data-grid');
        if (!grid) return;

        // Clear existing content
        grid.innerHTML = '';

        // Create table structure with merged cells support
        this.currentData.forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            
            row.forEach((cell, cellIndex) => {
                const td = document.createElement('td');
                td.textContent = cell;
                td.contentEditable = true;
                
                // Add merged cell styling for empty cells that represent merged ranges
                if (cell === '' && cellIndex === 0 && rowIndex > 0) {
                    // Check if this is part of a merged cell
                    let mergedValue = '';
                    for (let i = rowIndex - 1; i >= 0; i--) {
                        if (this.currentData[i][cellIndex] !== '') {
                            mergedValue = this.currentData[i][cellIndex];
                            break;
                        }
                    }
                    if (mergedValue) {
                        td.classList.add('merged-cell-placeholder');
                        td.setAttribute('data-merged-value', mergedValue);
                    }
                }
                
                // Add event listeners for editing
                td.addEventListener('blur', () => {
                    this.currentData[rowIndex][cellIndex] = td.textContent;
                });
                
                tr.appendChild(td);
            });
            
            grid.appendChild(tr);
        });
    }

    clearData() {
        this.loadDefaultData();
        this.showAlert('Reset to sample data', 'success');
    }

    addRow() {
        const newRow = new Array(this.currentData[0]?.length || 1).fill('');
        this.currentData.push(newRow);
        this.updateDataGrid();
        this.showAlert('Row added', 'info');
    }

    addColumn() {
        this.currentData.forEach(row => row.push(''));
        this.updateDataGrid();
        this.showAlert('Column added', 'info');
    }

    openFullEditor() {
        const modal = document.getElementById('modal-editor');
        const container = document.getElementById('large-grid-container');
        
        if (!modal || !container) return;

        // Create large grid
        let gridHTML = '<table>';
        this.currentData.forEach(row => {
            gridHTML += '<tr>';
            row.forEach(cell => {
                gridHTML += `<td contenteditable="true">${cell}</td>`;
            });
            gridHTML += '</tr>';
        });
        gridHTML += '</table>';
        
        container.innerHTML = gridHTML;
        modal.style.display = 'flex';

        // Save changes button
        document.getElementById('save-changes')?.addEventListener('click', () => {
            this.saveChangesFromModal();
            modal.style.display = 'none';
        });

        // Close button
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', () => {
                modal.style.display = 'none';
            });
        });
    }

    saveChangesFromModal() {
        const container = document.getElementById('large-grid-container');
        const rows = container.querySelectorAll('tr');
        
        this.currentData = [];
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const rowData = Array.from(cells).map(cell => cell.textContent);
            this.currentData.push(rowData);
        });

        this.updateDataGrid();
        this.showAlert('Changes saved', 'success');
    }

    setupFileUpload() {
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('file-input');

        if (!uploadZone || !fileInput) return;

        // Click to upload
        uploadZone.addEventListener('click', () => fileInput.click());

        // Drag and drop
        uploadZone.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });
    }

    handleFileUpload(file) {
        console.log('📁 Processing file:', file.name);
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (file.name.endsWith('.csv')) {
                    this.processCSV(e.target.result);
                } else {
                    this.processExcel(e.target.result);
                }
                this.showAlert(`File "${file.name}" loaded successfully`, 'success');
            } catch (error) {
                console.error('File processing error:', error);
                this.showAlert('Error processing file. Please check the format.', 'error');
            }
        };
        
        reader.readAsArrayBuffer(file);
    }

    processCSV(content) {
        // Simple CSV processing
        const lines = content.split('\n');
        this.currentData = lines.map(line => 
            line.split(',').map(cell => cell.trim().replace(/"/g, ''))
        ).filter(row => row.some(cell => cell !== ''));
        
        this.updateDataGrid();
    }

    processExcel(content) {
        // Use SheetJS for Excel processing
        const workbook = XLSX.read(content, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        this.currentData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });
        
        this.updateDataGrid();
    }

    setupDataGridEvents() {
        const grid = document.getElementById('data-grid');
        if (!grid) return;

        // Handle paste events
        grid.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text');
            this.parsePastedData(text);
        });

        // Fix mobile delete key issue
        grid.addEventListener('keydown', (e) => {
            if (e.key === 'Backspace' || e.key === 'Delete') {
                e.stopPropagation();
            }
        });

        // Improve mobile input experience
        grid.addEventListener('input', (e) => {
            if (e.target.tagName === 'TD') {
                e.target.style.minHeight = 'auto';
            }
        });
    }

    parsePastedData(text) {
        const lines = text.split('\n').filter(line => line.trim());
        this.currentData = lines.map(line => 
            line.split('\t').map(cell => cell.trim())
        );
        
        this.updateDataGrid();
        this.showAlert('Data pasted successfully', 'success');
    }

    copyResults() {
        if (!this.processedData.length) {
            this.showAlert('No results to copy', 'error');
            return;
        }

        const text = this.processedData.map(row => 
            row.join('\t')
        ).join('\n');

        navigator.clipboard.writeText(text).then(() => {
            this.showAlert('Results copied to clipboard', 'success');
        }).catch(() => {
            this.showAlert('Failed to copy results', 'error');
        });
    }

    downloadExcel() {
        if (!this.processedData.length) {
            this.showAlert('No results to download', 'error');
            return;
        }

        const worksheet = XLSX.utils.aoa_to_sheet(this.processedData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Processed Data');
        
        XLSX.writeFile(workbook, 'unmerge-fill-results.xlsx');
        this.showAlert('Excel file downloaded', 'success');
    }

    downloadCSV() {
        if (!this.processedData.length) {
            this.showAlert('No results to download', 'error');
            return;
        }

        const csv = this.processedData.map(row => 
            row.map(cell => `"${cell}"`).join(',')
        ).join('\n');

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'unmerge-fill-results.csv';
        a.click();
        URL.revokeObjectURL(url);

        this.showAlert('CSV file downloaded', 'success');
    }
}

// Initialize tool when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.unmergeFillTool = new UnmergeFillTool();
});

// Global FAQ toggle function
function toggleFAQ(element) {
    const answer = element.nextElementSibling;
    const toggle = element.querySelector('.faq-toggle');
    
    if (answer.style.display === 'block') {
        answer.style.display = 'none';
        toggle.textContent = '+';
        element.classList.remove('active');
    } else {
        answer.style.display = 'block';
        toggle.textContent = '−';
        element.classList.add('active');
    }
} 