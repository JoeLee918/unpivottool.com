// Unmerge & Fill Tool - Specific JavaScript Logic

// 导航下拉菜单功能
function initializeNavigationDropdown() {
    const dropdownBtn = document.querySelector('.dropdown-btn');
    const dropdownContent = document.querySelector('.dropdown-content');
    
    if (dropdownBtn && dropdownContent) {
        // 点击按钮切换下拉菜单
        dropdownBtn.addEventListener('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            dropdownContent.classList.toggle('show');
        });
        
        // 点击其他地方关闭下拉菜单
        document.addEventListener('click', function(e) {
            if (!dropdownBtn.contains(e.target) && !dropdownContent.contains(e.target)) {
                dropdownContent.classList.remove('show');
            }
        });
        
        // 移动端触摸事件
        dropdownBtn.addEventListener('touchstart', function(e) {
            e.preventDefault();
            dropdownContent.classList.toggle('show');
        });
        
        console.log('✅ 导航下拉菜单初始化完成');
    } else {
        console.log('ℹ️ 未找到导航下拉菜单元素，可能不在当前页面');
    }
}

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
        // 修改示例数据，正确表示合并单元格的状态
        const sampleData = [
            ['Department', 'Employee', 'Q1 Sales', 'Q2 Sales'],
            ['Sales', 'John Smith', '75000', '82000'],
            ['', 'Sarah Wilson', '68000', '71000'],  // 空字符串表示合并的单元格
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

        // 清空并重建表格结构
        grid.innerHTML = '';

        this.currentData.forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            
            row.forEach((cell, cellIndex) => {
                const td = document.createElement('td');
                td.contentEditable = true;
                td.textContent = cell;
                
                // 为空单元格添加合并单元格占位符样式
                if (cell === '' && cellIndex === 0 && rowIndex > 0) {
                    td.classList.add('merged-cell-placeholder');
                    // 查找对应的合并值
                    let mergedValue = '';
                    for (let i = rowIndex - 1; i >= 0; i--) {
                        if (this.currentData[i][cellIndex] !== '') {
                            mergedValue = this.currentData[i][cellIndex];
                            break;
                        }
                    }
                    td.setAttribute('data-merged-value', mergedValue);
                }
                
                // 为非空的可能合并单元格添加样式
                if (cell !== '' && cellIndex === 0 && rowIndex > 0) {
                    // 检查下面是否有空单元格（表示这是合并的开始）
                    let hasEmptyBelow = false;
                    for (let i = rowIndex + 1; i < this.currentData.length; i++) {
                        if (this.currentData[i][cellIndex] === '') {
                            hasEmptyBelow = true;
                            break;
                        } else {
                            break;
                        }
                    }
                    if (hasEmptyBelow) {
                        td.classList.add('merged-cell');
                    }
                }
                
                // 添加事件监听器
                this.addCellEventListeners(td, rowIndex, cellIndex);
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

        // 处理删除键
        grid.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.preventDefault(); // 防止默认行为
                this.handleCellDeletion(e);
            }
        });

        // 处理粘贴
        grid.addEventListener('paste', (e) => {
            e.preventDefault();
            const text = e.clipboardData.getData('text');
            this.parsePastedData(text);
        });

        // 防止表格跳动的输入处理
        grid.addEventListener('input', (e) => {
            if (e.target.tagName === 'TD') {
                const rowIndex = Array.from(e.target.parentNode.parentNode.children).indexOf(e.target.parentNode);
                const cellIndex = Array.from(e.target.parentNode.children).indexOf(e.target);
                
                // 更新数据但不重建DOM
                if (this.currentData[rowIndex] && this.currentData[rowIndex][cellIndex] !== undefined) {
                    this.currentData[rowIndex][cellIndex] = e.target.textContent;
                }
            }
        });
    }

    handleCellDeletion(e) {
        const target = e.target;
        
        // 检查是否是全选删除
        const selection = window.getSelection();
        const selectedText = selection.toString();
        const gridText = document.getElementById('data-grid').textContent;
        
        if (selectedText.trim().length >= gridText.trim().length * 0.8) {
            // 全选删除：重置为空白数据
            this.resetToEmptyGrid();
        } else if (target.tagName === 'TD') {
            // 单个单元格删除：只清空内容，不破坏结构
            const rowIndex = Array.from(target.parentNode.parentNode.children).indexOf(target.parentNode);
            const cellIndex = Array.from(target.parentNode.children).indexOf(target);
            
            target.textContent = '';
            this.currentData[rowIndex][cellIndex] = '';
            
            // 移除合并单元格样式
            target.classList.remove('merged-cell', 'merged-cell-placeholder');
            target.removeAttribute('data-merged-value');
        }
    }

    resetToEmptyGrid() {
        // 创建空白4x5网格
        this.currentData = Array(5).fill().map(() => Array(4).fill(''));
        // 添加标题行
        this.currentData[0] = ['Column 1', 'Column 2', 'Column 3', 'Column 4'];
        
        // 稳定地重建表格
        this.updateDataGrid();
        
        // 设置焦点到第一个数据单元格
        setTimeout(() => {
            const firstDataCell = document.querySelector('#data-grid tr:nth-child(2) td:first-child');
            if (firstDataCell) {
                firstDataCell.focus();
            }
        }, 50);
        
        this.showAlert('Grid cleared and ready for new data', 'info');
    }

    addCellEventListeners(td, rowIndex, cellIndex) {
        // 防抖的内容更新
        let updateTimeout;
        td.addEventListener('input', (e) => {
            clearTimeout(updateTimeout);
            updateTimeout = setTimeout(() => {
                this.currentData[rowIndex][cellIndex] = td.textContent;
            }, 100);
        });
        
        // 防止默认的删除行为
        td.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.stopPropagation();
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
    initializeNavigationDropdown(); // Initialize dropdown
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