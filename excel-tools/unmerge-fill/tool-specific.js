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
        // 全量矩阵（用于浮框完整呈现与实际处理）
        this.fullData = [];
        // 合并分组（虚拟合并模型）
        this.merges = [];
        // 处理结果矩阵
        this.processedData = [];
        // 自动处理防抖定时器
        this.__autoTimer = null;
        // 脏标记与提示状态
        this.__isDirty = false; // 是否有未查看的新结果
        this.__hasShownResultsTip = false; // 是否已提示过“结果在下方”
        
        this.initializeEventListeners();
        this.loadDefaultData();
        console.log('✅ UnmergeFillTool initialized');
    }

    initializeEventListeners() {
        // 单框：仅 Clear All 按钮
        document.getElementById('clear-all')?.addEventListener('click', () => {
            this.resetToEmptyGrid();
        });

        // Check Results 按钮：滚动到结果或打开结果浮框
        document.getElementById('check-results')?.addEventListener('click', () => {
            const resultsSection = document.getElementById('results-section');
            if (!resultsSection || resultsSection.style.display === 'none') return;
            const tooTall = resultsSection.getBoundingClientRect().height > window.innerHeight * 0.7;
            if (tooTall) this.openResultsModal();
            else resultsSection.scrollIntoView({ behavior: 'smooth' });
            // 用户已查看结果
            this.__isDirty = false;
            this.setCheckResultsBadge(false);
        });

        // Regenerate 按钮：立即重算
        document.getElementById('regenerate-results')?.addEventListener('click', () => {
            this.processData('both');
            this.__isDirty = false;
            const regenBtn = document.getElementById('regenerate-results');
            if (regenBtn) regenBtn.style.display = 'none';
        });

        // Results actions
        document.getElementById('copy-results')?.addEventListener('click', this.copyResults.bind(this));
        document.getElementById('download-excel')?.addEventListener('click', this.downloadExcel.bind(this));
        document.getElementById('download-csv')?.addEventListener('click', this.downloadCSV.bind(this));

        // 右下角浮动按钮（打开输入全表浮框）
        const fab = document.getElementById('open-full-editor-fab');
        if (fab) fab.addEventListener('click', () => this.openEditorModal());

        // 浮框关闭/取消
        document.getElementById('modal-editor-close')?.addEventListener('click', () => this.closeEditorModal());
        document.getElementById('modal-editor-cancel')?.addEventListener('click', () => this.closeEditorModal());

        // File upload
        this.setupFileUpload();
        
        // Data grid events
        this.setupDataGridEvents();
    }

    // 已移除 action 选择逻辑

    processData(action = 'both') {
        if (!this.currentData.length) {
            this.showAlert('Please add some data first', 'error');
            return;
        }

        console.log(`🔧 Processing data (auto) with action: ${action}`);

        // Process data based on action
        setTimeout(() => {
            try {
                // 每次处理前同步提取预览编辑变更，并基于全量数据处理
                this.extractTableData();
                const source = Array.isArray(this.fullData) && this.fullData.length ? this.fullData : this.currentData;
                const fullMerges = this.detectMergedGroups(source, { detectHorizontal: true });

                // 统一基于“虚拟合并模型”展开（对全量）
                const expanded = this.expandMergesForConvert({
                    matrix: source,
                    merges: fullMerges || []
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
                this.showAlert(`Done. ${this.processedData.length} rows processed.`, 'success');
                // 标记有新结果，等待用户查看
                this.__isDirty = true;
                this.setCheckResultsBadge(true);
                
            } catch (error) {
                console.error('Processing error:', error);
                this.showAlert('Error processing data. Please check your input.', 'error');
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

        // 同框显示结果
        resultsSection.style.display = 'block';

        // 激活并显示 Check Results 按钮
        const checkBtn = document.getElementById('check-results');
        if (checkBtn) {
            checkBtn.style.display = 'inline-block';
            checkBtn.disabled = false;
        }

        // 根据脏标记控制徽标
        this.setCheckResultsBadge(this.__isDirty);

        // 首次生成结果时给出引导提示
        if (!this.__hasShownResultsTip) {
            this.showAlert('Results generated below — scroll to see.', 'info');
            this.__hasShownResultsTip = true;
        }

        // Add success animation
        resultsSection.classList.add('success-animation');
        setTimeout(() => {
            resultsSection.classList.remove('success-animation');
        }, 600);
    }

    // 按钮文案函数已移除（不再需要）

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

    // 控制“Check Results”徽标
    setCheckResultsBadge(show) {
        const btn = document.getElementById('check-results');
        if (!btn) return;
        if (show) btn.setAttribute('data-new', '1');
        else btn.removeAttribute('data-new');
    }

    loadDefaultData() {
        // 空白占位（4列 x 5行；首行为列头）
        this.fullData = Array(5).fill(0).map(() => Array(4).fill(''));
        this.fullData[0] = ['Column 1', 'Column 2', 'Column 3', 'Column 4'];
        this.currentData = this.fullData.slice(0, 15);
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

        // 网格更新后自动调度处理（防抖）
        this.scheduleAutoProcess();

        // 阈值 FAB：基于全量单元格数
        const fab = document.getElementById('open-full-editor-fab');
        if (fab) {
            const rowsCount = Array.isArray(this.fullData) ? this.fullData.length : 0;
            const colsCount = rowsCount > 0 ? (this.fullData[0]?.length || 0) : 0;
            const cells = rowsCount * colsCount;
            fab.style.display = cells > 2000 ? 'inline-flex' : 'none';
        }
    }

    // 移除旧的 clearData（改为 resetToEmptyGrid）

    // 移除增行/增列功能

    // 移除大编辑器逻辑

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
        // 5MB 限制
        const MAX = 5 * 1024 * 1024;
        if (file.size > MAX) {
            this.showAlert('File is too large. Please upload files up to 5MB.', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                if (file.name.endsWith('.csv')) {
                    this.processCSV(e.target.result);
                } else {
                    this.processExcel(e.target.result);
                }
                this.showAlert(`File "${file.name}" loaded successfully`, 'success');
                this.scheduleAutoProcess();
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
        const matrix = lines.map(line => 
            line.split(',').map(cell => cell.trim().replace(/"/g, ''))
        ).filter(row => row.some(cell => cell !== ''));

        this.fullData = matrix;
        this.currentData = matrix.slice(0, 15);
        this.merges = this.detectMergedGroups(this.currentData, { detectHorizontal: true });
        this.updateDataGrid();
        this.scheduleAutoProcess();
    }

    processExcel(content) {
        // Use SheetJS for Excel processing
        const workbook = XLSX.read(content, { type: 'array' });
        const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
        const matrix = XLSX.utils.sheet_to_json(firstSheet, { header: 1 });

        this.fullData = matrix;
        this.currentData = matrix.slice(0, 15);
        this.merges = this.detectMergedGroups(this.currentData, { detectHorizontal: true });
        this.updateDataGrid();
        // 上传后标脏并显示徽标
        this.__isDirty = true;
        this.setCheckResultsBadge(true);
        this.scheduleAutoProcess();
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
                    this.fullData = matrix;
                    this.currentData = matrix.slice(0, 15);
                    this.merges = this.detectMergedGroups(this.currentData, { detectHorizontal: true });
                    this.updateDataGrid();
                    this.showAlert('Data imported from HTML table', 'success');
                    this.scheduleAutoProcess();
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

                // 标脏 + 徽标 + 自动调度
                this.__isDirty = true;
                this.setCheckResultsBadge(true);
                this.scheduleAutoProcess();
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
        this.fullData = Array(5).fill().map(() => Array(4).fill(''));
        // 添加标题行
        this.fullData[0] = ['Column 1', 'Column 2', 'Column 3', 'Column 4'];
        this.currentData = this.fullData.slice(0, 15);
        // 清空合并与结果、定时器
        this.merges = [];
        this.processedData = [];
        clearTimeout(this.__autoTimer);
        this.__autoTimer = null;
        
        // 稳定地重建表格
        this.updateDataGrid();
        
        // 隐藏结果区与按钮
        const resultsSection = document.getElementById('results-section');
        if (resultsSection) resultsSection.style.display = 'none';
        const checkBtn = document.getElementById('check-results');
        if (checkBtn) { checkBtn.style.display = 'none'; checkBtn.disabled = true; checkBtn.removeAttribute('data-new'); }
        const regenBtn = document.getElementById('regenerate-results');
        if (regenBtn) regenBtn.style.display = 'none';

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
                // 同步回全量数据对应行（仅限预览范围）
                if (this.fullData[rowIndex]) {
                    if (!Array.isArray(this.fullData[rowIndex])) this.fullData[rowIndex] = [];
                    this.fullData[rowIndex][cellIndex] = td.textContent;
                }
                // 用户编辑后，若该格为占位格则移除水印与占位类（一次性）
                if (td.classList.contains('merged-cell-placeholder')) {
                    td.classList.remove('merged-cell-placeholder');
                    td.removeAttribute('data-merged-value');
                }
                // 标脏 + 徽标 + 自动处理
                this.__isDirty = true;
                this.setCheckResultsBadge(true);
                this.scheduleAutoProcess();
            }, 100);
        });
        
        // 防止默认的删除行为
        td.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                e.stopPropagation();
            }
        });
    }

    // 自动处理调度：根据数据规模设置防抖时间
    scheduleAutoProcess() {
        if (!this.currentData || this.currentData.length === 0) return;
        clearTimeout(this.__autoTimer);
        const cells = ( (this.fullData?.length || 0) * (this.fullData?.[0]?.length || 0) ) || 0;
        const isSmall = cells <= 2000;

        // 小表：自动刷新；大表：显示 Regenerate 按钮
        const regenBtn = document.getElementById('regenerate-results');
        if (!isSmall) {
            if (regenBtn) regenBtn.style.display = 'inline-block';
            return;
        } else {
            if (regenBtn) regenBtn.style.display = 'none';
        }

        let delay = 500; // 准实时刷新
        if (cells > 10000) delay = 800;
        this.__autoTimer = setTimeout(() => {
            this.processData('both');
            // 新结果生成后，仍保持徽标，直到用户查看
        }, delay);
    }

    parsePastedData(text) {
        const lines = text.replace(/\r\n?|\n/g, '\n').split('\n');
        const data = lines.map(line => line.split('\t').map(cell => cell.trim()));
        const filtered = data.filter(row => row.some(cell => cell !== ''));
        this.fullData = filtered;
        this.currentData = filtered.slice(0, 15);
        this.merges = this.detectMergedGroups(this.currentData, { detectHorizontal: true });
        this.updateDataGrid();
        this.showAlert('Data pasted successfully', 'success');
        // 粘贴后标脏并显示徽标
        this.__isDirty = true;
        this.setCheckResultsBadge(true);
        this.scheduleAutoProcess();
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

    // 打开输入全表浮框
    openEditorModal() {
        const modal = document.getElementById('modal-editor');
        const container = document.getElementById('large-grid-container');
        if (!modal || !container) return;

        // 构建表格并基于全量数据渲染
        container.innerHTML = '<table class="excel-grid" id="large-grid" contenteditable="true"></table>';
        const table = container.querySelector('#large-grid');
        const merges = this.detectMergedGroups(Array.isArray(this.fullData) && this.fullData.length ? this.fullData : this.currentData, { detectHorizontal: true });
        this.renderGridWithMerges(table, (this.fullData && this.fullData.length ? this.fullData : this.currentData), merges);

        modal.style.display = 'flex';
    }

    closeEditorModal() {
        const modal = document.getElementById('modal-editor');
        if (modal) modal.style.display = 'none';
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
        // 同步写回全量数据前 N 行
        if (!Array.isArray(this.fullData)) this.fullData = [];
        for (let r = 0; r < matrix.length; r++) {
            if (!Array.isArray(this.fullData[r])) this.fullData[r] = [];
            for (let c = 0; c < matrix[r].length; c++) {
                this.fullData[r][c] = matrix[r][c];
            }
        }
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