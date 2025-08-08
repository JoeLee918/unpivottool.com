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
        // 原始矩阵（展示阶段不做填充）
        this.currentData = [];
        // 合并分组（虚拟合并模型）
        this.merges = [];
        // 处理结果矩阵
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
                // 每次处理前同步提取与重检，保证可重复点击刷新
                this.extractTableData();
                this.merges = this.detectMergedGroups(this.currentData, { detectHorizontal: true });

                // 统一基于“虚拟合并模型”展开
                const expanded = this.expandMergesForConvert({
                    matrix: this.currentData,
                    merges: this.merges || []
                }, { keepTrueBlank: true });

                if (action === 'split') {
                    // 仅拆分并填充“因合并导致的空白”，真实空白保留
                    this.processedData = expanded;
                } else if (action === 'both') {
                    // 拆分后，再对剩余真实空白做保守式向上填充
                    this.processedData = this.fillRemainingBlanks(expanded);
                } else {
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

    // 对“非合并造成的空白”进行保守式向上填充
    fillRemainingBlanks(data) {
        const out = data.map(row => row.slice());
        for (let r = 1; r < out.length; r++) {
            for (let c = 0; c < out[r].length; c++) {
                const v = (out[r][c] || '').trim();
                if (v === '' && out[r - 1] && (out[r - 1][c] || '').trim() !== '') {
                    out[r][c] = out[r - 1][c];
                }
            }
        }
        return out;
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
        // 示例数据：第一列存在纵向合并
        const sampleData = [
            ['Department', 'Employee', 'Q1 Sales', 'Q2 Sales'],
            ['Sales', 'John Smith', '75000', '82000'],
            ['', 'Sarah Wilson', '68000', '71000'],
            ['', 'Mike Johnson', '72000', '76000'],
            ['Marketing', 'Lisa Brown', '85000', '89000'],
            ['', 'Tom Davis', '62000', '65000']
        ];
        this.currentData = sampleData;
        this.merges = this.detectMergedGroups(this.currentData, { detectHorizontal: true });
        this.updateDataGrid();
    }

    updateDataGrid() {
        const grid = document.getElementById('data-grid');
        if (!grid) return;

        // 清空并用统一占位渲染
        grid.innerHTML = '';
        this.renderGridWithMerges(grid, this.currentData, this.merges || []);

        // 重新绑定每个单元格的输入监听（用于同步 this.currentData）
        grid.querySelectorAll('tr').forEach((tr, r) => {
            tr.querySelectorAll('td').forEach((td, c) => {
                this.addCellEventListeners(td, r, c);
            });
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

        // 处理粘贴：优先解析HTML表格，回退到TSV
        grid.addEventListener('paste', (e) => {
            e.preventDefault();
            const html = e.clipboardData.getData('text/html');
            if (html && /<table[\s\S]*?>[\s\S]*?<\/table>/i.test(html)) {
                try {
                    const { matrix, merges } = this.parseHtmlTableFromClipboard(html);
                    this.currentData = matrix;
                    this.merges = merges;
                    this.updateDataGrid();
                    this.showAlert('Data imported from HTML table', 'success');
                    return;
                } catch (err) {
                    console.warn('HTML paste parse failed, fallback to TSV', err);
                }
            }
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

                // 轻度防抖后重检合并并按占位渲染
                clearTimeout(this.__recheckTimer);
                this.__recheckTimer = setTimeout(() => {
                    this.merges = this.detectMergedGroups(this.currentData, { detectHorizontal: true });
                    this.updateDataGrid();
                }, 120);
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
        const lines = text.replace(/\r\n?|\n/g, '\n').split('\n');
        const data = lines.map(line => line.split('\t').map(cell => cell.trim()));
        // 保留原始空白，展示阶段仅检测+占位
        this.currentData = data.filter(row => row.some(cell => cell !== ''));
        this.merges = this.detectMergedGroups(this.currentData, { detectHorizontal: true });
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

    // HTML表格解析为矩阵与合并
    parseHtmlTableFromClipboard(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const table = doc.querySelector('table');
        if (!table) throw new Error('No table');

        const rows = Array.from(table.rows);
        const totalCols = rows.reduce((max, tr) => {
            const count = Array.from(tr.cells).reduce((c, td) => c + (parseInt(td.colSpan || 1)), 0);
            return Math.max(max, count);
        }, 0);

        const matrix = Array.from({ length: rows.length }, () => Array(totalCols).fill(''));
        const occupied = Array.from({ length: rows.length }, () => Array(totalCols).fill(false));
        const merges = [];

        rows.forEach((tr, r) => {
            let cIndex = 0;
            Array.from(tr.cells).forEach(td => {
                while (cIndex < totalCols && occupied[r][cIndex]) cIndex++;
                const rs = parseInt(td.rowSpan || 1);
                const cs = parseInt(td.colSpan || 1);
                const value = (td.textContent || '').trim();
                matrix[r][cIndex] = value;
                if (rs > 1 || cs > 1) {
                    merges.push({ top: r, left: cIndex, rowSpan: rs, colSpan: cs, value });
                    for (let rr = r; rr < r + rs; rr++) {
                        for (let cc = cIndex; cc < cIndex + cs; cc++) occupied[rr][cc] = true;
                    }
                } else {
                    occupied[r][cIndex] = true;
                }
                cIndex += cs;
            });
        });

        return { matrix: this.ensureRectangular(matrix), merges };
    }

    ensureRectangular(matrix) {
        const maxCols = matrix.reduce((m, row) => Math.max(m, row.length), 0);
        return matrix.map(row => { const out = row.slice(); while (out.length < maxCols) out.push(''); return out; });
    }
    // ===== 共享：虚拟合并模型（与首页一致） =====
    detectMergedGroups(matrix, { detectHorizontal = true } = {}) {
        const merges = [];
        const rows = matrix.length;
        const cols = rows ? matrix[0].length : 0;
        let id = 0;

        // 纵向
        for (let c = 0; c < cols; c++) {
            let r = 0;
            while (r < rows) {
                const v = (matrix[r][c] || '').trim();
                if (v !== '') {
                    let r2 = r + 1; let emptyCount = 0;
                    while (r2 < rows && (matrix[r2][c] || '').trim() === '') {
                        const hasOtherValues = matrix[r2].some((cell, cc) => cc !== c && (cell || '').trim() !== '');
                        if (!hasOtherValues) break;
                        emptyCount++; r2++;
                    }
                    if (emptyCount > 0) {
                        merges.push({ id: `m${id++}`, top: r, left: c, rowSpan: emptyCount + 1, colSpan: 1, value: v });
                        r = r2; continue;
                    }
                }
                r++;
            }
        }

        // 横向（可选）
        if (detectHorizontal) {
            for (let r = 0; r < rows; r++) {
                const nonEmptyCount = matrix[r].filter(x => (x || '').trim() !== '').length;
                const nonEmptyRatio = nonEmptyCount / (cols || 1);
                const ratioThreshold = r <= 3 ? 0.05 : 0.3; // 表头更宽松
                if (nonEmptyRatio < ratioThreshold) continue;
                let c = 0;
                while (c < cols) {
                    const v = (matrix[r][c] || '').trim();
                    if (v !== '') {
                        let c2 = c + 1; let emptyCount = 0;
                        while (c2 < cols && (matrix[r][c2] || '').trim() === '') { emptyCount++; c2++; }
                        if (emptyCount > 0) {
                            merges.push({ id: `m${id++}`, top: r, left: c, rowSpan: 1, colSpan: emptyCount + 1, value: v });
                            c = c2; continue;
                        }
                    }
                    c++;
                }
            }
        }

        return merges;
    }

    renderGridWithMerges(grid, matrix, merges) {
        grid.innerHTML = '';
        matrix.forEach((row, r) => {
            const tr = document.createElement('tr');
            row.forEach((cell, c) => {
                const td = document.createElement('td');
                td.contentEditable = true;
                td.textContent = cell || '';
                const hit = merges.find(m => r >= m.top && r < m.top + m.rowSpan && c >= m.left && c < m.left + m.colSpan);
                if (hit) {
                    if (r === hit.top && c === hit.left) td.classList.add('merged-cell');
                    else {
                        td.classList.add('merged-cell-placeholder');
                        td.setAttribute('data-merged-value', hit.value);
                    }
                }
                tr.appendChild(td);
            });
            grid.appendChild(tr);
        });
    }

    expandMergesForConvert(model, { keepTrueBlank = true } = {}) {
        const { matrix, merges } = model;
        const out = matrix.map(row => row.slice());
        merges.forEach(m => {
            for (let r = m.top; r < m.top + m.rowSpan; r++) {
                for (let c = m.left; c < m.left + m.colSpan; c++) {
                    const isAnchor = r === m.top && c === m.left;
                    if (!isAnchor) {
                        if (keepTrueBlank) {
                            if ((out[r][c] || '').trim() === '') out[r][c] = m.value;
                        } else out[r][c] = m.value;
                    }
                }
            }
        });
        return out;
    }

    // 提取当前可编辑表格为矩阵
    extractTableData() {
        const grid = document.getElementById('data-grid');
        const rows = grid.querySelectorAll('tr');
        const matrix = [];
        rows.forEach(tr => {
            const row = [];
            tr.querySelectorAll('td').forEach(td => row.push(td.textContent.trim()));
            if (row.some(v => v !== '')) matrix.push(row);
        });
        this.currentData = matrix;
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