// UnpivotTool - 核心JavaScript逻辑
// 参考PRD中的简单unpivot逻辑，添加完整的交互功能

class UnpivotTool {
    constructor() {
        this.currentData = [];
        this.columns = [];
        this.resultData = [];
        
        this.initializeEventListeners();
        this.loadDefaultData();
    }

    // 初始化事件监听器
    initializeEventListeners() {
        // 选项卡切换
        const tabBtns = document.querySelectorAll('.tab-btn');
        tabBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchInputMethod(e.target.dataset.method));
        });

        // 文件上传
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('file-input');
        
        uploadZone.addEventListener('click', () => fileInput.click());
        uploadZone.addEventListener('dragover', this.handleDragOver.bind(this));
        uploadZone.addEventListener('drop', this.handleFileDrop.bind(this));
        fileInput.addEventListener('change', this.handleFileSelect.bind(this));

        // 表格编辑
        const dataGrid = document.getElementById('data-grid');
        dataGrid.addEventListener('input', this.handleTableEdit.bind(this));
        dataGrid.addEventListener('paste', this.handlePaste.bind(this));
        dataGrid.addEventListener('keydown', this.handleTableKeydown.bind(this));

        // 扩展编辑器
        document.getElementById('expand-editor').addEventListener('click', this.openExpandedEditor.bind(this));

        // 模态框控制
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', this.closeModal.bind(this));
        });
        document.getElementById('save-changes').addEventListener('click', this.saveModalChanges.bind(this));

        // 数据预处理按钮
        document.getElementById('preprocess-btn').addEventListener('click', this.openMergeModal.bind(this));

        // 转换按钮
        document.getElementById('convert-btn').addEventListener('click', this.performUnpivot.bind(this));

        // 结果操作
        document.getElementById('edit-results').addEventListener('click', this.openResultsEditor.bind(this));
        document.getElementById('copy-all').addEventListener('click', this.copyResults.bind(this));
        document.getElementById('download-excel').addEventListener('click', this.downloadExcel.bind(this));
        document.getElementById('download-csv').addEventListener('click', this.downloadCSV.bind(this));

        // 数据管理功能
        this.addDataManagementControls();
    }

    // 添加数据管理控制按钮
    addDataManagementControls() {
        const pasteArea = document.querySelector('.paste-area');
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'data-controls';
        controlsDiv.innerHTML = `
            <button id="clear-all-data" class="btn btn-outline">🗑️ Clear All Data</button>
            <button id="reset-sample" class="btn btn-outline">🔄 Reset to Sample</button>
            <button id="add-row" class="btn btn-outline">➕ Add Row</button>
            <button id="add-column" class="btn btn-outline">➕ Add Column</button>
        `;
        
        pasteArea.appendChild(controlsDiv);

        // 绑定事件
        document.getElementById('clear-all-data').addEventListener('click', this.clearAllData.bind(this));
        document.getElementById('reset-sample').addEventListener('click', this.resetToSample.bind(this));
        document.getElementById('add-row').addEventListener('click', this.addRow.bind(this));
        document.getElementById('add-column').addEventListener('click', this.addColumn.bind(this));
    }

    // Clear all data from the grid
    clearAllData() {
        if (confirm('Are you sure you want to clear all data? This action cannot be undone.')) {
            const grid = document.getElementById('data-grid');
            grid.innerHTML = '<tr><td>Name</td><td>Column1</td><td>Column2</td></tr>';
            this.extractTableData();
            this.updateColumnConfig();
            this.showAlert('Data cleared successfully!', 'success');
        }
    }

    // Reset to sample data
    resetToSample() {
        const sampleData = [
            ['Name', 'Jan', 'Feb', 'Mar', 'Apr'],
            ['John', '100', '150', '200', '250'],
            ['Jane', '120', '180', '220', '280'],
            ['Bob', '90', '140', '190', '240']
        ];
        this.loadDataToGrid(sampleData);
        this.extractTableData();
        this.updateColumnConfig();
        this.showAlert('Sample data loaded successfully!', 'success');
    }

    // 添加行
    addRow() {
        const grid = document.getElementById('data-grid');
        const lastRow = grid.querySelector('tr:last-child');
        const colCount = lastRow ? lastRow.children.length : 3;
        
        const newRow = document.createElement('tr');
        for (let i = 0; i < colCount; i++) {
            const td = document.createElement('td');
            td.contentEditable = true;
            td.textContent = '';
            td.style.minHeight = '36px';   // 确保与模板行高度一致
            newRow.appendChild(td);
        }
        
        grid.appendChild(newRow);
        this.extractTableData();
        this.updateColumnConfig();
    }

    // 添加列
    addColumn() {
        const grid = document.getElementById('data-grid');
        const rows = grid.querySelectorAll('tr');
        
        rows.forEach((row, index) => {
            const td = document.createElement('td');
            td.contentEditable = true;
            td.textContent = index === 0 ? 'NewColumn' : '';
            row.appendChild(td);
        });
        
        this.extractTableData();
        this.updateColumnConfig();
    }

    // 加载默认示例数据
    loadDefaultData() {
        this.extractTableData();
        this.updateColumnConfig();
    }

    // 切换输入方法
    switchInputMethod(method) {
        // 更新选项卡状态
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-method="${method}"]`).classList.add('active');

        // 显示对应输入方法
        document.querySelectorAll('.input-method').forEach(methodEl => {
            methodEl.classList.remove('active');
        });
        document.querySelector(`.input-method[data-method="${method}"]`).classList.add('active');
    }

    // 处理文件拖拽
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('dragover');
    }

    handleFileDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    // 处理文件选择
    handleFileSelect(e) {
        const file = e.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    // 处理文件处理
    async processFile(file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (file.size > maxSize) {
            this.showAlert('File size exceeds 5MB limit. Please choose a smaller file.', 'error');
            return;
        }

        try {
            let data;
            const fileName = file.name.toLowerCase();
            
            if (fileName.endsWith('.csv')) {
                data = await this.parseCSV(file);
            } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
                data = await this.parseExcel(file);
            } else {
                this.showAlert('Unsupported file format. Please upload an Excel (.xlsx, .xls) or CSV file.', 'error');
                return;
            }

            if (this.validateFileData(data)) {
                this.loadDataToGrid(data);
                this.extractTableData();
                this.updateColumnConfig();
                this.showAlert('File loaded successfully!', 'success');
            }
        } catch (error) {
            console.error('File processing error:', error);
            this.showAlert('Unable to process this file. Please check the format and try again.', 'error');
        }
    }

    // 解析CSV文件
    parseCSV(file) {
        return new Promise((resolve, reject) => {
            Papa.parse(file, {
                complete: (results) => {
                    if (results.errors.length > 0) {
                        reject(new Error('CSV parsing failed'));
                    } else {
                        resolve(results.data);
                    }
                },
                error: reject
            });
        });
    }

    // 解析Excel文件
    parseExcel(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, { type: 'array' });
                    
                    // 使用第一个工作表
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    
                    // 转换为数组
                    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                    resolve(jsonData);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    // 验证文件数据格式
    validateFileData(data) {
        if (!data || data.length < 2) {
            this.showAlert('Your file needs at least one header row and one data row.', 'error');
            return false;
        }

        // Check if data starts at A1 (first row, first column has content)
        if (!data[0] || !data[0][0]) {
            this.showAlert('Please make sure your data starts at cell A1 with a proper header.', 'error');
            return false;
        }

        // Check for minimum columns
        if (data[0].length < 2) {
            this.showAlert('Your table needs at least 2 columns to work properly.', 'error');
            return false;
        }

        return true;
    }

    // 将数据加载到表格
    loadDataToGrid(data) {
        const grid = document.getElementById('data-grid');
        grid.innerHTML = '';

        data.forEach((row, rowIndex) => {
            const tr = document.createElement('tr');
            row.forEach((cell, colIndex) => {
                const td = document.createElement('td');
                td.textContent = cell || '';
                td.contentEditable = true;
                tr.appendChild(td);
            });
            grid.appendChild(tr);
        });
    }

    // 处理表格编辑
    handleTableEdit() {
        // 表格内容变化时重新提取数据
        setTimeout(() => {
            this.extractTableData();
            this.updateColumnConfig();
        }, 100);
    }

    // 增强的粘贴处理事件
    handlePaste(e) {
        e.preventDefault();
        
        // 获取粘贴数据
        const paste = e.clipboardData.getData('text');
        
        if (paste) {
            // 增强的解析逻辑，处理Excel特殊格式
            const rows = this.parseExcelClipboard(paste);
            this.loadDataToGrid(rows);
            this.extractTableData();
            this.updateColumnConfig();
            this.showAlert('Data imported successfully!', 'success');
        }
    }

    // 处理Step1表格的键盘事件
    handleTableKeydown(e) {
        // 只处理Delete和Backspace键
        if (e.key === 'Delete' || e.key === 'Backspace') {
            e.preventDefault();
            
            const selection = window.getSelection();
            const selectedText = selection.toString();
            const grid = document.getElementById('data-grid');
            
            if (selectedText.length > 0) {
                // 有选中内容
                const gridText = grid.textContent || grid.innerText;
                
                // 判断是否为全选：选中文本几乎等于表格全部文本
                if (selectedText.trim().length >= gridText.trim().length * 0.9) {
                    // 全选情况：只清空所有单元格的文本内容，保持DOM结构
                    const cells = grid.querySelectorAll('td');
                    cells.forEach(cell => {
                        // 只清空文本内容，保持单元格DOM结构
                        cell.textContent = '';
                        // 确保单元格仍然可编辑
                        cell.setAttribute('contenteditable', 'true');
                    });
                    
                    // 将焦点设置到第一个单元格
                    const firstCell = grid.querySelector('td');
                    if (firstCell) {
                        firstCell.focus();
                    }
                } else {
                    // 部分选中，删除选中内容
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                }
                
                // 清除选择
                selection.removeAllRanges();
                
                // 触发数据更新
                setTimeout(() => {
                    this.extractTableData();
                    this.updateColumnConfig();
                }, 10);
            }
        }
    }

    // Enhanced Excel clipboard parser that properly handles cell line breaks
    parseExcelClipboard(pasteData) {
        // Normalize line endings
        const normalizedData = pasteData
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim();

        // Excel clipboard data is typically tab-separated values (TSV)
        // We need to intelligently detect row boundaries vs. intra-cell line breaks
        
        if (normalizedData.includes('\t')) {
            // Handle tab-separated format (most common from Excel)
            return this.parseTSVWithCellLineBreaks(normalizedData);
        } else if (normalizedData.includes(',')) {
            // Handle comma-separated format with proper CSV parsing
            return this.parseCSVWithCellLineBreaks(normalizedData);
        } else {
            // Single column or simple data
            return this.parseSimpleFormat(normalizedData);
        }
    }

    // Parse TSV format while preserving intra-cell line breaks and handling merged cells
    parseTSVWithCellLineBreaks(data) {
        try {
            // 使用PapaParse处理TSV格式，它能正确处理引号和换行符
            const result = Papa.parse(data, {
                delimiter: '\t',          // 制表符分隔
                newline: '\n',           // 换行符
                quoteChar: '"',          // 引号字符
                skipEmptyLines: false,   // 不跳过空行，因为空行可能是单元格内的换行
                header: false            // 不将第一行作为header
            });
            
            if (result.errors.length === 0) {
                const parsedData = result.data
                    .map(row => row.map(cell => this.cleanCell(cell)))
                    .filter(row => row.some(cell => cell !== ''));
                
                // 处理合并单元格：如果当前单元格为空，使用上一行相同位置的值
                return this.handleMergedCells(parsedData);
            }
        } catch (error) {
            console.warn('TSV parsing with PapaParse failed:', error);
        }
        
        // Fallback到简单的tab分割方法
        const simpleData = data.split('\n')
            .map(line => line.split('\t').map(cell => this.cleanCell(cell)))
            .filter(row => row.some(cell => cell !== ''));
            
        return this.handleMergedCells(simpleData);
    }

    // 处理合并单元格：空单元格继承上一行或左边相同的值
    handleMergedCells(data) {
        if (data.length === 0) return data;
        
        // 第一步：处理行方向的合并单元格（从左到右填充）
        for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
            const currentRow = data[rowIndex];
            for (let colIndex = 1; colIndex < currentRow.length; colIndex++) {
                // 如果当前单元格为空且左边单元格有内容，则继承左边的值
                if (currentRow[colIndex] === '' && currentRow[colIndex - 1] !== '') {
                    currentRow[colIndex] = currentRow[colIndex - 1];
                }
            }
        }
        
        // 第二步：处理列方向的合并单元格（从上到下填充）
        for (let rowIndex = 1; rowIndex < data.length; rowIndex++) {
            const currentRow = data[rowIndex];
            const previousRow = data[rowIndex - 1];
            
            for (let colIndex = 0; colIndex < currentRow.length; colIndex++) {
                // 如果当前单元格为空且上一行对应位置有内容，则继承上一行的值
                if (currentRow[colIndex] === '' && previousRow && previousRow[colIndex] !== '') {
                    currentRow[colIndex] = previousRow[colIndex];
                }
            }
        }
        
        return data;
    }

    // Parse CSV format with proper handling of quoted fields and merged cells
    parseCSVWithCellLineBreaks(data) {
        try {
            // Use PapaParse for proper CSV handling
            const result = Papa.parse(data, {
                delimiter: ',',
                newline: '\n',
                quoteChar: '"',
                skipEmptyLines: true
            });
            
            if (result.errors.length === 0) {
                const parsedData = result.data.map(row => 
                    row.map(cell => this.cleanCell(cell))
                );
                return this.handleMergedCells(parsedData);
            }
        } catch (error) {
            console.warn('CSV parsing failed, falling back to simple split:', error);
        }
        
        // Fallback to simple parsing
        return this.parseSimpleFormat(data);
    }

    // Parse simple format (single column or basic data)
    parseSimpleFormat(data) {
        const lines = data.split('\n');
        return lines
            .map(line => [this.cleanCell(line)])
            .filter(row => row[0] !== '');
    }

    // Clean individual cell data
    cleanCell(cell) {
        return cell
            .replace(/^["']|["']$/g, '') // Remove surrounding quotes
            .trim(); // Remove whitespace
    }

    // 从表格提取数据
    extractTableData() {
        const grid = document.getElementById('data-grid');
        const rows = grid.querySelectorAll('tr');
        
        this.currentData = [];
        this.columns = [];

        rows.forEach((row, rowIndex) => {
            const cells = row.querySelectorAll('td');
            const rowData = [];
            
            cells.forEach((cell, colIndex) => {
                const value = cell.textContent.trim();
                
                if (rowIndex === 0) {
                    // 头部行，提取列名
                    this.columns.push(value || `Column${colIndex + 1}`);
                }
                rowData.push(value);
            });
            
            if (rowData.some(cell => cell !== '')) {
                this.currentData.push(rowData);
            }
        });
    }

    // 更新列配置界面
    updateColumnConfig() {
        if (this.columns.length === 0) return;

        const idColumnsEl = document.getElementById('id-columns');
        const valueColumnsEl = document.getElementById('value-columns');
        
        idColumnsEl.innerHTML = '';
        valueColumnsEl.innerHTML = '';

        // 检查是否有长表头，决定使用普通显示还是弹出式选择器
        const hasLongHeaders = this.columns.some(col => col.length > 15);
        const hasManyColumns = this.columns.length > 8;

        if (hasLongHeaders || hasManyColumns) {
            // 使用弹出式选择器
            this.createPopupSelectors(idColumnsEl, valueColumnsEl);
        } else {
            // 使用普通复选框显示
            this.createNormalSelectors(idColumnsEl, valueColumnsEl);
        }
    }

    // 创建普通选择器
    createNormalSelectors(idColumnsEl, valueColumnsEl) {
        this.columns.forEach((column, index) => {
            // ID列选项（默认选中第一列）
            const idCheckbox = this.createCheckbox(column, `id-${index}`, index === 0);
            idColumnsEl.appendChild(idCheckbox);

            // 值列选项（默认选中除第一列外的所有列）
            const valueCheckbox = this.createCheckbox(column, `value-${index}`, index > 0);
            valueColumnsEl.appendChild(valueCheckbox);
        });
    }

    // 创建弹出式选择器
    createPopupSelectors(idColumnsEl, valueColumnsEl) {
        // ID列弹出选择器
        const idSelector = this.createPopupSelector('id', 'ID Columns', 
            this.columns.map((col, idx) => ({ label: col, value: idx, checked: idx === 0 })));
        idColumnsEl.appendChild(idSelector);

        // 值列弹出选择器  
        const valueSelector = this.createPopupSelector('value', 'Value Columns',
            this.columns.map((col, idx) => ({ label: col, value: idx, checked: idx > 0 })));
        valueColumnsEl.appendChild(valueSelector);
    }

    // 创建弹出选择器
    createPopupSelector(type, title, options) {
        const container = document.createElement('div');
        container.className = 'popup-selector-container';

        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'popup-selector-btn btn btn-outline';
        button.innerHTML = `
            <span class="selector-title">${title}</span>
            <span class="selector-count">(${options.filter(o => o.checked).length} selected)</span>
            <span class="selector-arrow">▼</span>
        `;

        const dropdown = document.createElement('div');
        dropdown.className = 'popup-selector-dropdown';
        dropdown.style.display = 'none';

        // 添加全选/取消全选按钮
        const controlsDiv = document.createElement('div');
        controlsDiv.className = 'selector-controls';
        controlsDiv.innerHTML = `
            <button type="button" class="btn-mini" data-action="select-all">Select All</button>
            <button type="button" class="btn-mini" data-action="deselect-all">Deselect All</button>
        `;
        dropdown.appendChild(controlsDiv);

        // 添加选项列表
        const optionsDiv = document.createElement('div');
        optionsDiv.className = 'selector-options';

        options.forEach((option, index) => {
            const optionDiv = document.createElement('div');
            optionDiv.className = 'selector-option';

            const checkbox = document.createElement('input');
            checkbox.type = 'checkbox';
            checkbox.id = `${type}-${option.value}`;
            checkbox.name = `${type}-${option.value}`;
            checkbox.checked = option.checked;
            checkbox.addEventListener('change', () => this.updateSelectorCount(button, dropdown));

            const label = document.createElement('label');
            label.htmlFor = checkbox.id;
            // 截断长标签并添加提示
            const displayText = option.label.length > 25 ? 
                option.label.substring(0, 25) + '...' : option.label;
            label.textContent = displayText;
            label.title = option.label; // 完整文本作为提示

            optionDiv.appendChild(checkbox);
            optionDiv.appendChild(label);
            optionsDiv.appendChild(optionDiv);
        });

        dropdown.appendChild(optionsDiv);

        // 绑定事件
        button.addEventListener('click', (e) => {
            e.preventDefault();
            this.toggleDropdown(dropdown);
        });

        // 控制按钮事件
        controlsDiv.addEventListener('click', (e) => {
            if (e.target.dataset.action === 'select-all') {
                this.selectAllOptions(dropdown, true);
            } else if (e.target.dataset.action === 'deselect-all') {
                this.selectAllOptions(dropdown, false);
            }
            this.updateSelectorCount(button, dropdown);
        });

        container.appendChild(button);
        container.appendChild(dropdown);

        // 点击外部关闭下拉框
        document.addEventListener('click', (e) => {
            if (!container.contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });

        return container;
    }

    // 切换下拉框显示
    toggleDropdown(dropdown) {
        const isVisible = dropdown.style.display !== 'none';
        // 先关闭所有其他下拉框
        document.querySelectorAll('.popup-selector-dropdown').forEach(d => {
            d.style.display = 'none';
        });
        // 切换当前下拉框
        dropdown.style.display = isVisible ? 'none' : 'block';
    }

    // 全选/取消全选
    selectAllOptions(dropdown, checked) {
        const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach(cb => cb.checked = checked);
    }

    // 更新选择器计数
    updateSelectorCount(button, dropdown) {
        const checkboxes = dropdown.querySelectorAll('input[type="checkbox"]:checked');
        const countSpan = button.querySelector('.selector-count');
        countSpan.textContent = `(${checkboxes.length} selected)`;
    }

    // 创建复选框元素
    createCheckbox(label, name, checked = false) {
        const div = document.createElement('div');
        div.className = 'checkbox-item';
        
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.id = name;
        checkbox.name = name;
        checkbox.checked = checked;
        
        const labelEl = document.createElement('label');
        labelEl.htmlFor = name;
        labelEl.textContent = label;
        
        div.appendChild(checkbox);
        div.appendChild(labelEl);
        
        return div;
    }

    // 优化的扩展编辑器
    openExpandedEditor() {
        const modal = document.getElementById('modal-editor');
        const container = document.getElementById('large-grid-container');
        
        // 创建大型编辑表格，使用虚拟滚动优化性能
        container.innerHTML = this.createLargeGrid();
        modal.style.display = 'flex';
        
        // 添加键盘导航支持
        this.addKeyboardNavigation(container);
    }

    // 打开结果数据编辑器
    openResultsEditor() {
        if (!this.resultData || this.resultData.length === 0) {
            this.showAlert('No results to edit. Please convert data first.', 'warning');
            return;
        }

        const modal = document.getElementById('modal-editor');
        const container = document.getElementById('large-grid-container');
        
        // 更新模态框标题
        modal.querySelector('.modal-header h3').textContent = 'Edit Results Data';
        
        // 将结果数据转换为表格格式
        const headers = Object.keys(this.resultData[0]);
        const tableData = [headers];
        
        this.resultData.forEach(row => {
            const rowData = headers.map(header => row[header] || '');
            tableData.push(rowData);
        });
        
        // 创建可编辑的结果表格
        container.innerHTML = this.createGridFromData(tableData);
        modal.style.display = 'flex';
        
        // 添加键盘导航支持
        this.addKeyboardNavigation(container);
        
        // 标记这是结果编辑模式
        modal.setAttribute('data-editing-mode', 'results');
    }

    // 添加键盘导航支持
    addKeyboardNavigation(container) {
        const table = container.querySelector('table');
        if (!table) return;

        table.addEventListener('keydown', (e) => {
            const target = e.target;
            if (target.tagName !== 'TD') return;

            const currentRow = target.parentElement;
            const currentCellIndex = Array.from(currentRow.children).indexOf(target);
            let nextCell = null;

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    const prevRow = currentRow.previousElementSibling;
                    if (prevRow) {
                        nextCell = prevRow.children[currentCellIndex];
                    }
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    const nextRow = currentRow.nextElementSibling;
                    if (nextRow) {
                        nextCell = nextRow.children[currentCellIndex];
                    }
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    nextCell = target.previousElementSibling;
                    break;
                case 'ArrowRight':
                case 'Tab':
                    e.preventDefault();
                    nextCell = target.nextElementSibling;
                    break;
                case 'Delete':
                case 'Backspace':
                    e.preventDefault();
                    // 检查是否全选了表格内容
                    const selection = window.getSelection();
                    if (selection.toString().length > 0) {
                        // 有选中内容，清空选中的部分
                        const range = selection.getRangeAt(0);
                        range.deleteContents();
                    } else {
                        // 没有选中内容，清空当前单元格
                        target.textContent = '';
                    }
                    // 触发数据更新
                    setTimeout(() => {
                        this.handleTableEdit();
                    }, 10);
                    break;
            }

            if (nextCell) {
                nextCell.focus();
            }
        });
    }

    // 创建大型编辑表格
    createLargeGrid() {
        let html = '<table class="excel-grid" id="large-grid" contenteditable="true">';
        
        // 如果有现有数据，使用现有数据，否则创建20x10的空表格
        const data = this.currentData.length > 0 ? this.currentData : this.createEmptyGrid(20, 10);
        
        data.forEach((row, rowIndex) => {
            html += '<tr>';
            row.forEach((cell, colIndex) => {
                html += `<td tabindex="0">${cell || ''}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</table>';
        return html;
    }

    // 从数据创建编辑表格
    createGridFromData(data) {
        let html = '<table class="excel-grid" id="large-grid" contenteditable="true">';
        
        data.forEach((row, rowIndex) => {
            html += '<tr>';
            row.forEach((cell, colIndex) => {
                html += `<td tabindex="0">${cell || ''}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</table>';
        return html;
    }

    // 创建空表格
    createEmptyGrid(rows, cols) {
        const grid = [];
        for (let i = 0; i < rows; i++) {
            const row = [];
            for (let j = 0; j < cols; j++) {
                row.push('');
            }
            grid.push(row);
        }
        return grid;
    }

    // 保存模态框更改
    saveModalChanges() {
        const modal = document.getElementById('modal-editor');
        const largeGrid = document.getElementById('large-grid');
        const rows = largeGrid.querySelectorAll('tr');
        const editingMode = modal.getAttribute('data-editing-mode');
        
        const newData = [];
        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            const rowData = [];
            cells.forEach(cell => {
                rowData.push(cell.textContent.trim());
            });
            if (rowData.some(cell => cell !== '')) {
                newData.push(rowData);
            }
        });

        if (editingMode === 'results') {
            // 编辑结果数据模式
            if (newData.length === 0) {
                this.showAlert('Cannot save empty results data.', 'error');
                return;
            }
            
            // 将表格数据转换回对象数组格式
            const headers = newData[0];
            const dataRows = newData.slice(1);
            
            this.resultData = dataRows.map(row => {
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = row[index] || '';
                });
                return obj;
            });
            
            // 重新显示结果
            this.displayResults();
            this.showAlert('Results have been updated!', 'success');
        } else {
            // 默认编辑输入数据模式
            this.loadDataToGrid(newData);
            this.extractTableData();
            this.updateColumnConfig();
            this.showAlert('Your changes have been saved!', 'success');
        }
        
        this.closeModal();
    }

    // 关闭模态框
    closeModal() {
        const modal = document.getElementById('modal-editor');
        modal.style.display = 'none';
        
        // 重置模态框状态
        modal.querySelector('.modal-header h3').textContent = 'Full Table Editor';
        modal.removeAttribute('data-editing-mode');
    }

    // 执行Unpivot转换
    performUnpivot() {
        if (this.currentData.length < 2) {
            this.showAlert('Please add your data first. You need at least one header row and one data row.', 'error');
            return;
        }

        // 获取选中的列
        const idColumns = this.getSelectedColumns('id');
        const valueColumns = this.getSelectedColumns('value');

        if (idColumns.length === 0) {
            this.showAlert('Please choose at least one column to keep as ID columns.', 'error');
            return;
        }

        if (valueColumns.length === 0) {
            this.showAlert('Please choose at least one column to convert.', 'error');
            return;
        }

        // 获取列名设置
        const variableName = document.getElementById('variable-name').value || 'Variable';
        const valueName = document.getElementById('value-name').value || 'Value';

        // 执行转换
        this.resultData = this.unpivotData(idColumns, valueColumns, variableName, valueName);
        this.displayResults();
    }

    // 获取选中的列
    getSelectedColumns(type) {
        const checkboxes = document.querySelectorAll(`#${type}-columns input:checked`);
        const selectedColumns = [];
        
        checkboxes.forEach(checkbox => {
            const index = parseInt(checkbox.name.split('-')[1]);
            selectedColumns.push({
                index: index,
                name: this.columns[index]
            });
        });
        
        return selectedColumns;
    }

    // 核心Unpivot逻辑 - 参考PRD中的简单实现
    unpivotData(idColumns, valueColumns, variableName, valueName) {
        const result = [];
        const headers = this.currentData[0];
        const dataRows = this.currentData.slice(1);

        dataRows.forEach(row => {
            valueColumns.forEach(valueCol => {
                const newRow = {};
                
                // 复制ID列的值
                idColumns.forEach(idCol => {
                    newRow[idCol.name] = row[idCol.index] || '';
                });
                
                // 添加变量名和值
                newRow[variableName] = valueCol.name;
                newRow[valueName] = row[valueCol.index] || '';
                
                result.push(newRow);
            });
        });

        return result;
    }

    // 显示转换结果
    displayResults() {
        if (this.resultData.length === 0) return;

        const resultsSection = document.getElementById('results-section');
        const resultsTable = document.getElementById('results-table');
        const resultsCount = document.getElementById('results-count');

        // 更新计数
        resultsCount.textContent = `${this.resultData.length} rows converted`;

        // 创建结果表格
        const headers = Object.keys(this.resultData[0]);
        let html = '<table><thead><tr>';
        
        headers.forEach(header => {
            html += `<th>${header}</th>`;
        });
        html += '</tr></thead><tbody>';

        this.resultData.forEach(row => {
            html += '<tr>';
            headers.forEach(header => {
                html += `<td>${row[header] || ''}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';

        resultsTable.innerHTML = html;
        resultsSection.style.display = 'block';

        // 滚动到结果区域
        resultsSection.scrollIntoView({ behavior: 'smooth' });
    }

    // 复制结果到剪贴板
    async copyResults() {
        if (this.resultData.length === 0) return;

        try {
            const headers = Object.keys(this.resultData[0]);
            let csvText = headers.join('\t') + '\n';
            
            this.resultData.forEach(row => {
                const values = headers.map(header => row[header] || '');
                csvText += values.join('\t') + '\n';
            });

            await navigator.clipboard.writeText(csvText);
            this.showAlert('Results copied to clipboard!', 'success');
        } catch (error) {
            console.error('Copy failed:', error);
            this.showAlert('Unable to copy to clipboard. Please try again.', 'error');
        }
    }

    // 下载Excel文件
    downloadExcel() {
        if (this.resultData.length === 0) return;

        try {
            const ws = XLSX.utils.json_to_sheet(this.resultData);
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, 'Unpivoted Data');
            
            const filename = `unpivoted_data_${new Date().toISOString().slice(0, 10)}.xlsx`;
            XLSX.writeFile(wb, filename);
            
            this.showAlert('Excel file downloaded successfully!', 'success');
        } catch (error) {
            console.error('Excel download failed:', error);
            this.showAlert('Unable to download Excel file. Please try again.', 'error');
        }
    }

    // 下载CSV文件
    downloadCSV() {
        if (this.resultData.length === 0) return;

        try {
            const csv = Papa.unparse(this.resultData);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            
            const filename = `unpivoted_data_${new Date().toISOString().slice(0, 10)}.csv`;
            link.href = URL.createObjectURL(blob);
            link.download = filename;
            link.click();
            
            this.showAlert('CSV file downloaded successfully!', 'success');
        } catch (error) {
            console.error('CSV download failed:', error);
            this.showAlert('Unable to download CSV file. Please try again.', 'error');
        }
    }

    // 显示提示消息
    showAlert(message, type = 'info') {
        // 移除现有提示
        const existingAlerts = document.querySelectorAll('.alert');
        existingAlerts.forEach(alert => alert.remove());

        // 创建新提示
        const alert = document.createElement('div');
        alert.className = `alert alert-${type}`;
        alert.textContent = message;

        // 插入到主内容区顶部
        const main = document.querySelector('.main .container');
        main.insertBefore(alert, main.firstChild);

        // 3秒后自动消失
        setTimeout(() => {
            alert.remove();
        }, 3000);
    }

    // ===== 数据预处理功能 =====

    // 打开合并设置模态框
    openMergeModal() {
        const modal = document.getElementById('merge-modal');
        modal.style.display = 'flex';
        
        // 设置默认状态：行合并选中，列合并不选中
        const rowCheckbox = document.getElementById('merge-rows-checkbox');
        const colCheckbox = document.getElementById('merge-cols-checkbox');
        const rowConnectorGroup = document.getElementById('row-connector-group');
        const colConnectorGroup = document.getElementById('col-connector-group');
        
        rowCheckbox.checked = true;  // 默认选中行合并
        colCheckbox.checked = false; // 默认不选中列合并
        
        rowConnectorGroup.style.display = 'block';  // 显示行连接符选项
        colConnectorGroup.style.display = 'none';   // 隐藏列连接符选项
        
        // 初始化预览
        this.updateMergePreview();
        
        // 绑定事件监听器
        this.bindMergeEvents();
    }

    // 绑定合并相关事件
    bindMergeEvents() {
        const rowCheckbox = document.getElementById('merge-rows-checkbox');
        const colCheckbox = document.getElementById('merge-cols-checkbox');
        const rowConnectors = document.querySelectorAll('input[name="row-connector"]');
        const colConnectors = document.querySelectorAll('input[name="col-connector"]');

        // 行合并复选框变化
        rowCheckbox.addEventListener('change', (e) => {
            const connectorGroup = document.getElementById('row-connector-group');
            connectorGroup.style.display = e.target.checked ? 'block' : 'none';
            this.updateMergePreview();
        });

        // 列合并复选框变化
        colCheckbox.addEventListener('change', (e) => {
            const connectorGroup = document.getElementById('col-connector-group');
            connectorGroup.style.display = e.target.checked ? 'block' : 'none';
            this.updateMergePreview();
        });

        // 连接符变化
        rowConnectors.forEach(radio => {
            radio.addEventListener('change', () => this.updateMergePreview());
        });
        colConnectors.forEach(radio => {
            radio.addEventListener('change', () => this.updateMergePreview());
        });
    }

    // 更新合并预览
    updateMergePreview() {
        const config = this.getMergeConfig();
        const sampleData = this.currentData.slice(0, 4); // 取前4行作为预览
        
        if (sampleData.length === 0) {
            document.getElementById('merge-preview').innerHTML = '<p>No data to preview</p>';
            return;
        }

        const previewResult = this.processDataMerge(sampleData, config);
        this.renderPreviewTable(previewResult.slice(0, 3)); // 只显示前3行
    }

    // 渲染预览表格
    renderPreviewTable(data) {
        const previewDiv = document.getElementById('merge-preview');
        
        if (data.length === 0) {
            previewDiv.innerHTML = '<p>No data to preview</p>';
            return;
        }

        let html = '<table style="width: 100%; border-collapse: collapse;">';
        
        data.forEach((row, rowIndex) => {
            html += '<tr>';
            row.forEach((cell, colIndex) => {
                const cellValue = (cell || '').toString().slice(0, 20); // 限制显示长度
                const isHeader = rowIndex === 0 ? 'font-weight: bold; background: #f0f0f0;' : '';
                html += `<td style="border: 1px solid #ddd; padding: 4px; font-size: 0.8rem; ${isHeader}">${cellValue}</td>`;
            });
            html += '</tr>';
        });
        
        html += '</table>';
        previewDiv.innerHTML = html;
    }

    // 获取合并配置
    getMergeConfig() {
        const mergeRows = document.getElementById('merge-rows-checkbox').checked;
        const mergeCols = document.getElementById('merge-cols-checkbox').checked;
        const rowConnector = document.querySelector('input[name="row-connector"]:checked')?.value || ' ';
        const colConnector = document.querySelector('input[name="col-connector"]:checked')?.value || ' ';

        return {
            enabled: mergeRows || mergeCols,
            mergeRows,
            mergeCols,
            rowConnector,
            colConnector
        };
    }

    // 主合并处理函数（条件执行核心）
    processDataMerge(tableData, config) {
        // 最快路径：功能未启用直接返回
        if (!config.enabled) {
            return tableData;
        }
        
        // 次快路径：都没选择合并选项  
        if (!config.mergeRows && !config.mergeCols) {
            return tableData;
        }
        
        let result = [...tableData]; // 浅拷贝避免修改原数据
        
        // 条件1: 只有勾选行合并才执行行合并代码
        if (config.mergeRows && tableData.length >= 2) {
            result = this.mergeTopRows(result, config.rowConnector);
        }
        
        // 条件2: 只有勾选列合并才执行列合并代码
        if (config.mergeCols && result.length > 0 && result[0].length >= 2) {
            result = this.mergeLeftCols(result, config.colConnector);
        }
        
        return result;
    }

    // 行合并算法 - 处理层级表头
    mergeTopRows(data, connector = ' ') {
        if (data.length < 2) return data;
        
        const row1 = data[0]; // 父级分类
        const row2 = data[1]; // 子级分类
        const maxCols = Math.max(row1.length, row2.length);
        
        // 生成新的表头行
        const newHeader = [];
        for (let i = 0; i < maxCols; i++) {
            const parent = (row1[i] || '').toString().trim();
            const child = (row2[i] || '').toString().trim();
            
            // 智能合并逻辑
            if (parent && child) {
                newHeader[i] = `${parent}${connector}${child}`;
            } else if (parent) {
                newHeader[i] = parent;
            } else if (child) {
                newHeader[i] = child;
            } else {
                newHeader[i] = '';
            }
        }
        
        // 返回新表头 + 剩余数据
        return [newHeader, ...data.slice(2)];
    }

    // 列合并算法 - 处理标识列
    mergeLeftCols(data, connector = ' ') {
        return data.map(row => {
            if (row.length < 2) return row;
            
            const col1 = (row[0] || '').toString().trim();
            const col2 = (row[1] || '').toString().trim();
            
            // 生成新的第一列
            let newFirstCol;
            if (col1 && col2) {
                newFirstCol = `${col1}${connector}${col2}`;
            } else if (col1) {
                newFirstCol = col1;
            } else if (col2) {
                newFirstCol = col2;
            } else {
                newFirstCol = '';
            }
            
            // 返回新第一列 + 剩余列
            return [newFirstCol, ...row.slice(2)];
        });
    }

    // 应用合并设置
    applyMergeSettings() {
        const config = this.getMergeConfig();
        
        // 如果都没选择，等于跳过功能
        if (!config.mergeRows && !config.mergeCols) {
            this.skipMergeSettings();
            return;
        }
        
        // 执行条件合并
        const mergedData = this.processDataMerge(this.currentData, config);
        
        // 更新当前数据
        this.currentData = mergedData;
        
        // 更新表格显示
        this.updateTableDisplay();
        
        // 关闭弹窗
        this.closeMergeModal();
        
        // 重新初始化列选择器
        this.initializeColumnSelectors();
        
        // 显示成功提示
        this.showAlert('Data preprocessing completed successfully!', 'success');
    }

    // 跳过合并设置
    skipMergeSettings() {
        this.closeMergeModal();
        // 直接初始化列选择器，无需数据处理
        this.initializeColumnSelectors();
    }

    // 关闭合并模态框
    closeMergeModal() {
        const modal = document.getElementById('merge-modal');
        modal.style.display = 'none';
        
        // 重置复选框状态
        document.getElementById('merge-rows-checkbox').checked = false;
        document.getElementById('merge-cols-checkbox').checked = false;
        
        // 隐藏连接符选项
        document.getElementById('row-connector-group').style.display = 'none';
        document.getElementById('col-connector-group').style.display = 'none';
    }

    // 更新表格显示
    updateTableDisplay() {
        const grid = document.getElementById('data-grid');
        grid.innerHTML = '';
        
        this.currentData.forEach(row => {
            const tr = document.createElement('tr');
            row.forEach(cell => {
                const td = document.createElement('td');
                td.textContent = cell || '';
                td.contentEditable = true;
                tr.appendChild(td);
            });
            grid.appendChild(tr);
        });
    }
}

// 页面加载完成后初始化应用 - 已移动到文件末尾

// FAQ切换功能
function toggleFAQ(element) {
    const faqItem = element.closest('.faq-item');
    const isActive = faqItem.classList.contains('active');
    
    // 关闭所有其他FAQ项目
    document.querySelectorAll('.faq-item.active').forEach(item => {
        if (item !== faqItem) {
            item.classList.remove('active');
        }
    });
    
    // 切换当前FAQ项目
    if (isActive) {
        faqItem.classList.remove('active');
    } else {
        faqItem.classList.add('active');
    }
}

// 平滑滚动导航功能
document.addEventListener('DOMContentLoaded', function() {
    // 处理导航链接的平滑滚动
    const navLinks = document.querySelectorAll('.nav-links a[href^="#"]');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                const headerHeight = document.querySelector('.header').offsetHeight;
                const targetPosition = targetSection.offsetTop - headerHeight - 20;
                
                window.scrollTo({
                    top: targetPosition,
                    behavior: 'smooth'
                });
            }
        });
    });
});

// 增强结果表格的选择功能
function enhanceResultsTable() {
    const resultsTable = document.querySelector('#results-table table');
    if (!resultsTable) return;
    
    // 添加表格选择增强
    resultsTable.addEventListener('mousedown', function(e) {
        e.stopPropagation();
    });
    
    // 为每个单元格添加选择功能
    const cells = resultsTable.querySelectorAll('td, th');
    cells.forEach(cell => {
        cell.addEventListener('click', function(e) {
            e.stopPropagation();
            
            // 清除之前的选择
            const previousSelected = resultsTable.querySelector('.cell-selected');
            if (previousSelected) {
                previousSelected.classList.remove('cell-selected');
            }
            
            // 选中当前单元格
            this.classList.add('cell-selected');
            
            // 选择单元格内容
            const range = document.createRange();
            range.selectNodeContents(this);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        });
        
        // 添加双击选择整行功能
        cell.addEventListener('dblclick', function(e) {
            e.stopPropagation();
            
            const row = this.closest('tr');
            const range = document.createRange();
            range.selectNodeContents(row);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        });
    });
    
    // 添加Ctrl+A全选表格功能
    resultsTable.addEventListener('keydown', function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
            e.preventDefault();
            e.stopPropagation();
            
            const range = document.createRange();
            range.selectNodeContents(this);
            const selection = window.getSelection();
            selection.removeAllRanges();
            selection.addRange(range);
        }
    });
    
    // 使表格可聚焦以接收键盘事件
    resultsTable.setAttribute('tabindex', '0');
}

// 监听结果显示完成事件，然后增强表格
const originalDisplayResults = UnpivotTool.prototype.displayResults;
UnpivotTool.prototype.displayResults = function() {
    originalDisplayResults.call(this);
    
    // 延迟执行以确保DOM已更新
    setTimeout(() => {
        enhanceResultsTable();
    }, 100);
}; 

// ===== 全局函数 - 供HTML onclick事件调用 =====

// 全局引用到UnpivotTool实例
let unpivotToolInstance = null;

// 更新实例化代码以保存引用
document.addEventListener('DOMContentLoaded', () => {
    unpivotToolInstance = new UnpivotTool();
});

// 关闭合并模态框
function closeMergeModal() {
    if (unpivotToolInstance) {
        unpivotToolInstance.closeMergeModal();
    }
}

// 应用合并设置
function applyMergeSettings() {
    if (unpivotToolInstance) {
        unpivotToolInstance.applyMergeSettings();
    }
}

// 跳过合并设置
function skipMergeSettings() {
    if (unpivotToolInstance) {
        unpivotToolInstance.skipMergeSettings();
    }
} 