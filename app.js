// UnpivotTool - 核心JavaScript逻辑
// 参考PRD中的简单unpivot逻辑，添加完整的交互功能

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

class UnpivotTool {
    constructor() {
        console.log('🚀 UnpivotTool 类开始初始化');
        this.currentData = [];
        this.columns = [];
        this.resultData = [];
        // 是否将空白单元格按“合并单元格”规则自动继承填充（首页默认关闭）
        this.treatBlanksAsMerged = false;
        // 合并分组（用于虚拟合并的展示与转换阶段拆分）
        this.merges = [];
        // 高亮状态：按区域记忆是否开启标黄
        this.highlightState = {
            '#data-grid': false,
            '#large-grid': false,
            '#results-table table': false
        };
        
        this.initializeEventListeners();
        this.loadDefaultData();
        console.log('✅ UnpivotTool 类初始化完成');
    }

    // 初始化事件监听器
    initializeEventListeners() {
        console.log('🔧 开始初始化事件监听器');
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
        // 统一处理批量删除，防止范围删除导致结构跳动
        dataGrid.addEventListener('keydown', (e) => {
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    const range = selection.getRangeAt(0);
                    if (dataGrid.contains(range.startContainer) && dataGrid.contains(range.endContainer)) {
                        const selectedText = selection.toString();
                        if (selectedText && selectedText.length > 0) {
                            e.preventDefault();
                            // 逐格清空所有被选中的单元格
                            dataGrid.querySelectorAll('td').forEach(td => {
                                if (selection.containsNode(td, true)) td.textContent = '';
                            });
                            // 保持结构，重新渲染
                            this.extractTableData({ keepEmptyRows: true });
                            this.updateTableDisplay();
                            if (this.highlightState['#data-grid']) this.toggleEmptyHighlight('#data-grid');
                            selection.removeAllRanges();
                        }
                    }
                }
            }
        });

        // 仅当存在空单元格时允许“标黄空格”
        const toggleEmptyBtn = document.getElementById('toggle-empty-highlight');
        if (toggleEmptyBtn) toggleEmptyBtn.addEventListener('click', () => this.toggleEmptyHighlight('#data-grid'));

        // 扩展编辑器
        const expandBtn = document.getElementById('expand-editor');
        if (expandBtn) expandBtn.addEventListener('click', this.openExpandedEditor.bind(this));

        // 右下角浮动按钮（仅引导，不自动弹出）
        const fab = document.getElementById('open-full-editor-fab');
        if (fab) fab.addEventListener('click', this.openExpandedEditor.bind(this));

        // 模态框控制
        document.querySelectorAll('.modal-close').forEach(btn => {
            btn.addEventListener('click', this.closeModal.bind(this));
        });
        document.getElementById('save-changes').addEventListener('click', this.saveModalChanges.bind(this));

        // 数据预处理按钮
        const preprocessBtn = document.getElementById('preprocess-btn');
        if (preprocessBtn) {
            console.log('✅ 找到preprocess-btn按钮，正在绑定事件监听器');
            preprocessBtn.addEventListener('click', (e) => {
                console.log('🖱️ Header Merge按钮被点击');
                e.preventDefault();
                e.stopPropagation();
                this.openMergeModal();
            });
            
            // 🔧 额外检查：确保按钮不被其他事件干扰
            preprocessBtn.style.pointerEvents = 'auto';
            preprocessBtn.disabled = false;
            
            console.log('🎯 按钮状态检查:', {
                disabled: preprocessBtn.disabled,
                display: getComputedStyle(preprocessBtn).display,
                visibility: getComputedStyle(preprocessBtn).visibility,
                pointerEvents: getComputedStyle(preprocessBtn).pointerEvents
            });
        } else {
            console.error('❌ 未找到preprocess-btn按钮');
        }

        // 转换按钮
        document.getElementById('convert-btn').addEventListener('click', this.performUnpivot.bind(this));

        // 结果操作
        document.getElementById('edit-results').addEventListener('click', this.openResultsEditor.bind(this));
        document.getElementById('copy-all').addEventListener('click', this.copyResults.bind(this));
        document.getElementById('download-excel').addEventListener('click', this.downloadExcel.bind(this));
        document.getElementById('download-csv').addEventListener('click', this.downloadCSV.bind(this));

        // 数据管理功能 - 直接绑定HTML中的按钮，不再动态创建
        // this.addDataManagementControls(); // 注释掉这一行
        
        // 直接绑定HTML中已存在的按钮
        const resetBtn = document.getElementById('reset-sample');  
        const addRowBtn = document.getElementById('add-row');
        const addColBtn = document.getElementById('add-column');
        
        if (resetBtn) resetBtn.addEventListener('click', this.resetToSample.bind(this));
        if (addRowBtn) addRowBtn.addEventListener('click', this.addRow.bind(this));
        if (addColBtn) addColBtn.addEventListener('click', this.addColumn.bind(this));
    }

    // 添加数据管理控制按钮 - 已注释掉，改为直接绑定HTML中的按钮
    /*
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
    */

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
        // 从当前表格提取初始数据
        this.extractTableData();
        // 初始即进行一次合并检测并按占位渲染，确保Step1也呈现合并外观
        this.merges = this.detectMergedGroups(this.currentData, { detectHorizontal: true });
        this.updateTableDisplay();
        // 同步列配置
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

            const matrix = Array.isArray(data) ? data : (data && data.matrix ? data.matrix : []);
            const merges = (data && data.merges) ? data.merges : [];

            if (this.validateFileData(matrix)) {
                // 上传后同样执行一次“合并展开填充”（严格空才填）
                const expanded = this.expandMergesForConvert({ matrix, merges }, { keepTrueBlank: true });
                this.loadDataToGrid(expanded, merges);
                this.extractTableData();
                this.updateColumnConfig();
                
                // 切换到Paste Data标签
                this.switchInputMethod('paste');
                
                // 显示成功提示并引导用户
                this.showAlert('File uploaded successfully! Your data is now in the "Paste Data" tab. You can edit it there or proceed to Step 2.', 'success');
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
                        const matrix = results.data;
                        resolve({ matrix, merges: [] });
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
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    // 使用 defval 保留空白；blankrows: false 以去掉完全空行
                    const matrixRaw = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', blankrows: false });
                    const matrix = this.ensureRectangular(matrixRaw);
                    const merges = (worksheet['!merges'] || []).map(r => ({
                        id: `x_${r.s.r}_${r.s.c}`,
                        top: r.s.r,
                        left: r.s.c,
                        rowSpan: (r.e.r - r.s.r + 1),
                        colSpan: (r.e.c - r.s.c + 1),
                        value: (matrix[r.s.r] && matrix[r.s.r][r.s.c]) ? String(matrix[r.s.r][r.s.c]).trim() : ''
                    }));
                    resolve({ matrix, merges });
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

    // 将数据加载到表格（仅页内渲染预览，但内存保留全量）
    loadDataToGrid(data, mergesOverride = null) {
        const grid = document.getElementById('data-grid');
        grid.innerHTML = '';

        // 限制显示的行数，避免页面过长（仅影响展示，不影响内存数据）
        const maxRows = 15;
        const displayData = Array.isArray(data) ? data.slice(0, maxRows) : [];

        // 保存全量数据到内存，currentData 仅用于小表或预览
        this.fullData = Array.isArray(data) ? data.map(row => row.slice()) : [];
        this.currentData = displayData.map(row => row.slice());
        this.merges = Array.isArray(mergesOverride) ? mergesOverride : this.detectMergedGroups(this.currentData, { detectHorizontal: true });

        // 渲染：带合并占位外观
        this.renderGridWithMerges(grid, this.currentData, this.merges);

        // 根据是否存在空单元格，切换按钮可用态
        const hasEmpty = this.currentData.some(row => row.some(cell => cell === '' || /^(?:\s|\u00A0)+$/.test(cell)));
        const toggleEmptyBtn = document.getElementById('toggle-empty-highlight');
        if (toggleEmptyBtn) toggleEmptyBtn.disabled = !hasEmpty;

        // 过去在表格内追加的提示行会污染数据，这里彻底移除

        // 阈值提示：当全量单元格数 > 2000 时，仅显示右下角 FAB 引导
        const fab = document.getElementById('open-full-editor-fab');
        if (fab) {
            const rowsCount = Array.isArray(this.fullData) ? this.fullData.length : 0;
            const colsCount = rowsCount > 0 ? (this.fullData[0] ? this.fullData[0].length : 0) : 0;
            const cells = rowsCount * colsCount;
            fab.style.display = cells > 2000 ? 'inline-flex' : 'none';
        }
    }

    // 处理表格编辑
    handleTableEdit() {
        // 表格内容变化时重新提取数据
        setTimeout(() => {
            this.extractTableData({ keepEmptyRows: true });
            // 重新检测合并并按占位渲染（保持展示与数据一致）
            this.merges = this.detectMergedGroups(this.currentData, { detectHorizontal: true });
            this.updateTableDisplay();
            this.updateColumnConfig();
            // 若区域高亮开着，自动重应用
            if (this.highlightState['#data-grid']) this.toggleEmptyHighlight('#data-grid');
        }, 100);
    }

    // 增强的粘贴处理事件
    handlePaste(e) {
        e.preventDefault();
        
        // 优先解析 HTML 表格（可读取 colspan/rowspan）
        const html = e.clipboardData.getData('text/html');
        if (html && /<table[\s\S]*?>[\s\S]*?<\/table>/i.test(html)) {
            try {
                const { matrix, merges } = this.parseHtmlTableFromClipboard(html);
                // 需求：粘贴后即“拆分并填充合并空白”，但真实空白保留
                const expanded = this.expandMergesForConvert({ matrix, merges }, { keepTrueBlank: true });
                this.loadDataToGrid(expanded, merges);
                this.extractTableData();
                this.updateColumnConfig();
                this.showAlert('Data imported from HTML table!', 'success');
                return;
            } catch (err) {
                console.warn('HTML table parse failed, fallback to TSV:', err);
            }
        }

        // 回退到 TSV 解析
        const paste = e.clipboardData.getData('text');
        if (paste) {
            try {
                const rows = this.parseExcelClipboard(paste);
                // 粘贴TSV也执行“拆分并填充合并空白（启发式识别）”
                const merges = this.detectMergedGroups(rows, { detectHorizontal: true });
                const expanded = this.expandMergesForConvert({ matrix: rows, merges }, { keepTrueBlank: true });
                this.loadDataToGrid(expanded, merges);
                this.extractTableData();
                this.updateColumnConfig();
                this.showAlert('Data imported successfully!', 'success');
                if (window.unpivotTool) window.unpivotTool.currentData = this.currentData;
            } catch (error) {
                console.error('❌ 粘贴数据处理失败:', error);
                this.showAlert('Failed to process pasted data. Please try again.', 'error');
            }
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
                
                console.log('🔍 删除检测:', {
                    selectedLength: selectedText.trim().length,
                    gridLength: gridText.trim().length,
                    ratio: selectedText.trim().length / gridText.trim().length
                });
                
                // 🔑 优化全选判断：检查选中内容是否包含表格的主要数据
                const isFullSelection = this.isFullTableSelection(selectedText, grid);
                
                if (isFullSelection) {
                    // 🔑 全选情况：特殊处理，确保表格结构完整
                    console.log('🗑️ 检测到全选删除，开始处理...');
                    
                    const cells = grid.querySelectorAll('td');
                    const rowCount = grid.querySelectorAll('tr').length;
                    const colCount = cells.length > 0 ? grid.querySelector('tr').querySelectorAll('td').length : 0;
                    
                    console.log(`📊 当前表格结构: ${rowCount}行 x ${colCount}列`);
                    
                    // 如果表格结构不够，重建一个基础的3x3表格
                    if (rowCount < 3 || colCount < 3) {
                        console.log('🔧 表格结构不足，重建3x3基础表格');
                        const basicData = [
                            ['', '', ''],
                            ['', '', ''],
                            ['', '', '']
                        ];
                        this.loadDataToGrid(basicData);
                    } else {
                        console.log('🧹 表格结构充足，只清空内容');
                        // 表格结构足够，只清空内容
                        cells.forEach(cell => {
                            cell.textContent = '';
                            cell.setAttribute('contenteditable', 'true');
                        });
                    }
                    
                    // 将焦点设置到第一个单元格
                    const firstCell = grid.querySelector('td');
                    if (firstCell) {
                        firstCell.focus();
                        console.log('✅ 焦点已设置到第一个单元格');
                    }
                    
                    // 🚨 关键修复：全选删除时不调用extractTableData
                    // 直接清空当前数据，但保持基本结构
                    this.currentData = [];
                    this.columns = [];
                    
                    // 清空列配置界面，避免显示错误信息
                    const idColumnsEl = document.getElementById('id-columns');
                    const valueColumnsEl = document.getElementById('value-columns');
                    if (idColumnsEl) idColumnsEl.innerHTML = '';
                    if (valueColumnsEl) valueColumnsEl.innerHTML = '';
                    
                    console.log('✅ 全选删除处理完成');
                    
                } else {
                    // 部分选中，删除选中内容，正常处理
                    const range = selection.getRangeAt(0);
                    range.deleteContents();
                    
                    // 部分删除时才调用数据更新
                    setTimeout(() => {
                        this.extractTableData();
                        this.updateColumnConfig();
                    }, 10);
                }
                
                // 清除选择
                selection.removeAllRanges();
            }
        }
    }

    // 🔧 更准确的全选判断函数
    isFullTableSelection(selectedText, grid) {
        // 获取表格的纯数据内容（去除空白和格式）
        const cells = grid.querySelectorAll('td');
        const cellTexts = Array.from(cells).map(cell => cell.textContent.trim()).filter(text => text !== '');
        const totalCellText = cellTexts.join('');
        
        // 清理选中文本（去除制表符、换行符等格式字符）
        const cleanSelectedText = selectedText.replace(/[\t\n\r\s]+/g, '');
        const cleanTotalText = totalCellText.replace(/[\t\n\r\s]+/g, '');
        
        console.log('🧮 全选判断数据:', {
            cellCount: cells.length,
            cellTexts: cellTexts,
            cleanSelectedLength: cleanSelectedText.length,
            cleanTotalLength: cleanTotalText.length,
            similarity: cleanSelectedText.length / cleanTotalText.length
        });
        
        // 如果选中内容包含了80%以上的表格文本内容，视为全选
        const isFullSelection = cleanSelectedText.length >= cleanTotalText.length * 0.8;
        
        // 或者：检查选中内容是否包含表格中的大部分单元格文本
        const containedCells = cellTexts.filter(cellText => 
            cleanSelectedText.includes(cellText.replace(/[\t\n\r\s]+/g, ''))
        ).length;
        const isContainsMostCells = containedCells >= cellTexts.length * 0.8;
        
        console.log('🎯 全选判断结果:', {
            byLength: isFullSelection,
            byCells: isContainsMostCells,
            containedCells: containedCells,
            totalCells: cellTexts.length,
            finalResult: isFullSelection || isContainsMostCells
        });
        
        return isFullSelection || isContainsMostCells;
    }

    // Enhanced Excel clipboard parser that properly handles cell line breaks
    parseExcelClipboard(pasteData) {
        // Normalize line endings
        const normalizedData = pasteData
            .replace(/\r\n/g, '\n')
            .replace(/\r/g, '\n')
            .trim();

        console.log('📋 parseExcelClipboard 开始解析:', normalizedData.substring(0, 100) + '...');

        // Excel clipboard data is typically tab-separated values (TSV)
        // We need to intelligently detect row boundaries vs. intra-cell line breaks
        
        if (normalizedData.includes('\t')) {
            console.log('📊 检测到制表符分隔格式(TSV)');
            // Handle tab-separated format (most common from Excel)
            return this.parseTSVWithCellLineBreaks(normalizedData);
        } else if (normalizedData.includes(',')) {
            console.log('📊 检测到逗号分隔格式(CSV)');
            // Handle comma-separated format with proper CSV parsing
            return this.parseCSVWithCellLineBreaks(normalizedData);
        } else {
            console.log('📊 检测到简单格式(Simple)');
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

                // 是否视空白为合并占位并进行继承填充
                return this.treatBlanksAsMerged ? this.handleMergedCells(parsedData) : parsedData;
            }
        } catch (error) {
            console.warn('TSV parsing with PapaParse failed:', error);
        }
        
        // Fallback到简单的tab分割方法
        const simpleData = data.split('\n')
            .map(line => line.split('\t').map(cell => this.cleanCell(cell)))
            .filter(row => row.some(cell => cell !== ''));
        
        return this.treatBlanksAsMerged ? this.handleMergedCells(simpleData) : simpleData;
    }

    // 处理合并单元格：空单元格继承上一行或左边相同的值
    handleMergedCells(data) {
        if (data.length === 0) return data;
        
        console.log('🔧 handleMergedCells 开始处理数据:', data);
        let cellsFilled = 0;
        
        // 第一步：处理行方向的合并单元格（从左到右填充）
        for (let rowIndex = 0; rowIndex < data.length; rowIndex++) {
            const currentRow = data[rowIndex];
            for (let colIndex = 1; colIndex < currentRow.length; colIndex++) {
                // 如果当前单元格为空且左边单元格有内容，则继承左边的值
                if (currentRow[colIndex] === '' && currentRow[colIndex - 1] !== '') {
                    currentRow[colIndex] = currentRow[colIndex - 1];
                    cellsFilled++;
                    console.log(`📝 水平填充: [${rowIndex}][${colIndex}] = "${currentRow[colIndex]}"`);
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
                    cellsFilled++;
                    console.log(`📝 垂直填充: [${rowIndex}][${colIndex}] = "${currentRow[colIndex]}"`);
                }
            }
        }
        
        console.log(`✅ handleMergedCells 完成，共填充 ${cellsFilled} 个单元格`);
        console.log('🔧 处理后的数据:', data);
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
                return this.treatBlanksAsMerged ? this.handleMergedCells(parsedData) : parsedData;
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
        const parsedData = lines
            .map(line => [this.cleanCell(line)])
            .filter(row => row[0] !== '');
        
        // 简单格式是否处理为空合并占位
        return this.treatBlanksAsMerged ? this.handleMergedCells(parsedData) : parsedData;
    }

    // Clean individual cell data
    cleanCell(cell) {
        // 仅移除包裹引号，不做 trim，保留空格/制表符/nbsp
        return cell.replace(/^["']|["']$/g, '');
    }

    // 从表格提取数据（跳过提示/非数据行）
    extractTableData(options = {}) {
        const grid = document.getElementById('data-grid');
        const rows = grid.querySelectorAll('tr');
        
        this.currentData = [];
        this.columns = [];

        rows.forEach((row, rowIndex) => {
            if (row.dataset && row.dataset.nonData === '1') return; // 跳过非数据行
            if (row.classList && row.classList.contains('non-data-row')) return; // 兼容类名
            const cells = row.querySelectorAll('td');
            const rowData = [];
            
            cells.forEach((cell, colIndex) => {
                const value = cell.textContent; // 保留空格
                
                if (rowIndex === 0) {
                    // 头部行，提取列名
                    this.columns.push(value || `Column${colIndex + 1}`);
                }
                rowData.push(value);
            });
            
            if (options.keepEmptyRows) this.currentData.push(rowData);
            else if (rowData.some(cell => cell !== '')) this.currentData.push(rowData);
        });
    }

    // ===== 合并检测 / 占位渲染 / 展开填充 =====
    detectMergedGroups(matrix, { detectHorizontal = true } = {}) {
        const merges = [];
        const rows = matrix.length;
        const cols = rows ? matrix[0].length : 0;
        let id = 0;

        // 纵向
        for (let c = 0; c < cols; c++) {
            let r = 0;
            while (r < rows) {
                const v = (matrix[r][c] || '');
                if (v !== '') {
                    let r2 = r + 1;
                    let emptyCount = 0;
                    while (r2 < rows && (matrix[r2][c] || '') === '') {
                        const hasOtherValues = matrix[r2].some((cell, cc) => cc !== c && (cell || '') !== '');
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
                // 对疑似表头行（前3行）放宽阈值，便于识别 NGB / SZX / Grand total 等横向合并
                const nonEmptyCount = matrix[r].filter(x => (x || '') !== '').length;
                const nonEmptyRatio = nonEmptyCount / (cols || 1);
                const ratioThreshold = r <= 3 ? 0.05 : 0.3;
                if (nonEmptyRatio < ratioThreshold) continue;
                let c = 0;
                while (c < cols) {
                    const v = (matrix[r][c] || '');
                    if (v !== '') {
                        let c2 = c + 1; let emptyCount = 0;
                        while (c2 < cols && (matrix[r][c2] || '') === '') { emptyCount++; c2++; }
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
                    // 现在我们已经在粘贴/上传阶段直接填充展开，仍保留占位样式用于可视提示
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
                            if ((out[r][c] || '') === '') out[r][c] = m.value;
                        } else out[r][c] = m.value;
                    }
                }
            }
        });
        return out;
    }

    // 切换空单元格高亮（只在存在空单元格时可点）
    toggleEmptyHighlight(selector) {
        const grid = selector ? document.querySelector(selector) : document.getElementById('data-grid');
        if (!grid) return;
        let hasAny = false;
        // 切换记忆状态
        if (selector) this.highlightState[selector] = !this.highlightState[selector];
        grid.querySelectorAll('tr').forEach((tr) => {
            tr.querySelectorAll('td').forEach((td) => {
                const v = td.textContent || '';
                // 视觉空：全是空白字符（包含 NBSP）
                const isVisualEmpty = v === '' || /^(?:\s|\u00A0)+$/.test(v);
                if (isVisualEmpty) {
                    hasAny = true;
                    td.classList.toggle('empty-cell');
                }
            });
        });
        if (!hasAny) this.showAlert('No empty cells to highlight.', 'info');
    }

    // HTML表格解析为矩阵与合并模型
    parseHtmlTableFromClipboard(html) {
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const table = doc.querySelector('table');
        if (!table) throw new Error('No table found');

        const rows = Array.from(table.rows);
        // 预估最大列数
        const totalCols = rows.reduce((max, tr) => {
            let count = 0; Array.from(tr.cells).forEach(td => count += (parseInt(td.colSpan || 1))); return Math.max(max, count);
        }, 0);

        const matrix = Array.from({ length: rows.length }, () => Array(totalCols).fill(''));
        const occupied = Array.from({ length: rows.length }, () => Array(totalCols).fill(false));
        const merges = [];

        rows.forEach((tr, r) => {
            let cIndex = 0;
            Array.from(tr.cells).forEach(td => {
                while (cIndex < totalCols && occupied[r][cIndex]) cIndex++;
                const rowSpan = parseInt(td.rowSpan || 1);
                const colSpan = parseInt(td.colSpan || 1);
                const value = (td.textContent ?? '');
                matrix[r][cIndex] = value;
                if (rowSpan > 1 || colSpan > 1) {
                    merges.push({ top: r, left: cIndex, rowSpan, colSpan, value });
                    for (let rr = r; rr < r + rowSpan; rr++) {
                        for (let cc = cIndex; cc < cIndex + colSpan; cc++) {
                            occupied[rr][cc] = true;
                        }
                    }
                    occupied[r][cIndex] = true; // 锚点也标记为占用
                } else {
                    occupied[r][cIndex] = true;
                }
                cIndex += colSpan;
            });
        });

        return { matrix: this.ensureRectangular(matrix), merges };
    }

    ensureRectangular(matrix) {
        const maxCols = matrix.reduce((m, row) => Math.max(m, row.length), 0);
        return matrix.map(row => {
            const out = row.slice();
            while (out.length < maxCols) out.push('');
            return out;
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

        // 浮框标黄按钮状态与事件
        const modalHighlightBtn = document.getElementById('modal-highlight-empty');
        if (modalHighlightBtn) {
            const hasEmpty = this.currentData.some(row => row.some(cell => cell === '' || /^(?:\s|\u00A0)+$/.test(cell)));
            modalHighlightBtn.disabled = !hasEmpty;
            if (!modalHighlightBtn.__bound) {
                modalHighlightBtn.addEventListener('click', () => this.toggleEmptyHighlight('#large-grid'));
                modalHighlightBtn.__bound = true;
            }
        }
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
            const rowData = headers.map(header => (row[header] !== undefined ? row[header] : ''));
            tableData.push(rowData);
        });
        
        // 创建可编辑的结果表格
        container.innerHTML = this.createGridFromData(tableData);
        modal.style.display = 'flex';
        
        // 添加键盘导航支持
        this.addKeyboardNavigation(container);
        
        // 标记这是结果编辑模式
        modal.setAttribute('data-editing-mode', 'results');

        // 结果浮框：标黄按钮状态与事件（视觉空判定）
        const modalHighlightBtn = document.getElementById('modal-highlight-empty');
        if (modalHighlightBtn) {
            const hasEmpty = tableData.some(row => row.some(cell => cell === '' || /^(?:\s|\u00A0)+$/.test(cell || '')));
            modalHighlightBtn.disabled = !hasEmpty;
            if (!modalHighlightBtn.__bound) {
                modalHighlightBtn.addEventListener('click', () => this.toggleEmptyHighlight('#large-grid'));
                modalHighlightBtn.__bound = true;
            }
        }
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
        
        // 优先使用 fullData（全量显示），否则退回 currentData，再退回空表
        const base = Array.isArray(this.fullData) && this.fullData.length > 0 ? this.fullData : this.currentData;
        const data = base && base.length > 0 ? base : this.createEmptyGrid(20, 10);
        
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
                // 保留空格，以便结果浮框也遵循视觉空与数据空的区分
                rowData.push(cell.textContent);
            });
            // 结果编辑也保留空行，避免用户清空后结构跳变
            newData.push(rowData);
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
            // 若结果区域高亮开着，重应用
            if (this.highlightState['#results-table table']) this.toggleEmptyHighlight('#results-table table');
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

        // 选择用于转换的数据源：大表用 fullData，小表用 currentData（并同步编辑变更）
        let sourceMatrix = Array.isArray(this.fullData) && this.fullData.length >= this.currentData.length
            ? this.fullData
            : this.currentData;
        // 若两者等长，优先使用用户当前编辑后的 currentData
        if (this.fullData && this.fullData.length === this.currentData.length) {
            this.fullData = this.currentData.map(r => r.slice());
            sourceMatrix = this.fullData;
        }
        // 每次转换前检测合并
        this.merges = this.detectMergedGroups(sourceMatrix, { detectHorizontal: true });

        // 转换前：基于合并分组统一展开并填充（仅合并产生的空白），不修改展示用的 currentData
        const expandedMatrix = this.expandMergesForConvert({
            matrix: sourceMatrix,
            merges: this.merges || []
        }, { keepTrueBlank: true });

        // 执行转换（从展开后的矩阵计算列名与数据）
        const expandedColumns = expandedMatrix[0] || [];
        const expandedRows = expandedMatrix.slice(1);

        // 重新构建 columns -> 仅用于 unpivot 的临时映射
        const tempColumns = expandedColumns.map((name, idx) => ({ index: idx, name }));
        const idCols = idColumns.map(c => ({ index: c.index, name: expandedColumns[c.index] }));
        const valCols = valueColumns.map(c => ({ index: c.index, name: expandedColumns[c.index] }));

        this.resultData = this.unpivotDataFromMatrix(expandedRows, idCols, valCols, variableName, valueName);
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

    // 基于矩阵的Unpivot（不依赖 this.currentData）
    unpivotDataFromMatrix(dataRows, idColumns, valueColumns, variableName, valueName) {
        const result = [];
        dataRows.forEach(row => {
            valueColumns.forEach(valueCol => {
                const newRow = {};
                idColumns.forEach(idCol => {
                    newRow[idCol.name] = row[idCol.index] || '';
                });
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
                const v = row.hasOwnProperty(header) ? row[header] : '';
                html += `<td>${v}</td>`;
            });
            html += '</tr>';
        });
        html += '</tbody></table>';

        resultsTable.innerHTML = html;
        resultsSection.style.display = 'block';

        // 滚动到结果区域
        resultsSection.scrollIntoView({ behavior: 'smooth' });

        // 结果标黄按钮启用与绑定
        const highlightBtn = document.getElementById('highlight-results');
        if (highlightBtn) {
            const hasEmpty = this.resultData.some(row => Object.values(row).some(v => v === '' || /^(?:\s|\u00A0)+$/.test(v || '')));
            highlightBtn.disabled = !hasEmpty;
            if (!highlightBtn.__bound) {
                highlightBtn.addEventListener('click', () => this.toggleEmptyHighlight('#results-table table'));
                highlightBtn.__bound = true;
            }
        }
    }

    // 复制结果到剪贴板
    async copyResults() {
        if (this.resultData.length === 0) {
            this.showAlert('No data to copy. Please convert data first.', 'warning');
            return;
        }

        // 获取Copy按钮元素，用于视觉反馈
        const copyBtn = document.getElementById('copy-all');
        const originalText = copyBtn.textContent;
        const originalClass = copyBtn.className;

        try {
            // 显示复制中状态
            copyBtn.textContent = '📋 Copying...';
            copyBtn.disabled = true;
            copyBtn.className = copyBtn.className.replace('btn-secondary', 'btn-info');

            const headers = Object.keys(this.resultData[0]);
            let csvText = headers.join('\t') + '\n';
            
            this.resultData.forEach(row => {
                const values = headers.map(header => row[header] || '');
                csvText += values.join('\t') + '\n';
            });

            // 尝试现代剪贴板API
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(csvText);
            } else {
                // 降级到传统方法
                this.fallbackCopyToClipboard(csvText);
            }

            // 成功反馈
            copyBtn.textContent = '✅ Copied!';
            copyBtn.className = copyBtn.className.replace('btn-info', 'btn-success');
            this.showAlert(`Successfully copied ${this.resultData.length} rows to clipboard!`, 'success');

            // 2秒后恢复按钮状态
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.className = originalClass;
                copyBtn.disabled = false;
            }, 2000);

        } catch (error) {
            console.error('Copy failed:', error);
            
            // 错误反馈
            copyBtn.textContent = '❌ Failed';
            copyBtn.className = copyBtn.className.replace('btn-info', 'btn-danger');
            this.showAlert('Unable to copy to clipboard. Please try selecting and copying manually.', 'error');
            
            // 2秒后恢复按钮状态
            setTimeout(() => {
                copyBtn.textContent = originalText;
                copyBtn.className = originalClass;
                copyBtn.disabled = false;
            }, 2000);
        }
    }

    // 添加降级复制方法（用于不支持现代API的浏览器）
    fallbackCopyToClipboard(text) {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        try {
            document.execCommand('copy');
            textArea.remove();
        } catch (err) {
            textArea.remove();
            throw err;
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
        console.log('🚀 openMergeModal 方法被调用');
        const modal = document.getElementById('merge-modal');
        if (!modal) {
            console.error('❌ 未找到merge-modal元素');
            this.showAlert('Header merge function is not available. Please refresh the page.', 'error');
            return;
        }
        console.log('✅ 找到merge-modal元素，正在显示');
        
        // 🔧 确保模态框能够正确显示
        modal.style.display = 'flex';
        modal.style.visibility = 'visible';
        modal.style.opacity = '1';
        modal.style.zIndex = '1000';
        
        // 🔧 添加焦点管理
        setTimeout(() => {
            const firstInput = modal.querySelector('input');
            if (firstInput) {
                firstInput.focus();
            }
        }, 100);
        
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
                const cellValue = (cell ?? '').toString().slice(0, 20); // 限制显示长度
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
        
        // 重新更新列配置
        this.updateColumnConfig();
        
        // 显示成功提示
        this.showAlert('Data preprocessing completed successfully!', 'success');
    }

    // 跳过合并设置
    skipMergeSettings() {
        this.closeMergeModal();
        // 直接更新列配置，无需数据处理
        this.updateColumnConfig();
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
        this.renderGridWithMerges(grid, this.currentData, this.merges || []);
    }
}

// 页面加载完成后初始化应用 - 已移动到文件末尾

// FAQ切换功能
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

// 更新实例化代码以保存引用并暴露到全局对象
document.addEventListener('DOMContentLoaded', () => {
    // 初始化导航下拉菜单
    initializeNavigationDropdown();
    
    unpivotToolInstance = new UnpivotTool();
    
    // 🔧 将关键方法暴露到window.unpivotTool供调试使用
    window.unpivotTool = {
        instance: unpivotToolInstance,
        get currentData() {
            return unpivotToolInstance.currentData;
        },
        set currentData(value) {
            unpivotToolInstance.currentData = value;
        },
        handleMergedCells: unpivotToolInstance.handleMergedCells.bind(unpivotToolInstance),
        parseExcelClipboard: unpivotToolInstance.parseExcelClipboard.bind(unpivotToolInstance),
        parseTSVWithCellLineBreaks: unpivotToolInstance.parseTSVWithCellLineBreaks.bind(unpivotToolInstance),
        parseSimpleFormat: unpivotToolInstance.parseSimpleFormat.bind(unpivotToolInstance)
    };
    
    console.log('✅ UnpivotTool已初始化并暴露到window.unpivotTool');
    console.log('🔧 可用方法:', Object.keys(window.unpivotTool));
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