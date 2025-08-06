# Excel Tools PRD Document (Updated)

## 项目概述
基于现有 unpivottool.com 扩展四个Excel辅助工具，形成工具矩阵，提升网站价值和用户留存。同时进行网站架构重构，优化用户体验和SEO表现。

---

## 网站重构规划

### 第一阶段：网站架构规划（1-2天）

#### 新网站结构
```
根目录 (/)
├── 主页 (/)                    - 核心价值展示和快速开始
├── 原工具页面 (/unpivot-tool)    - 实际功能页面
├── Excel工具集 (/excel-tools)    - 新工具矩阵页面
│   ├── /excel-tools/spotlight     # 聚光灯工具
│   ├── /excel-tools/text-grouper  # 文本聚合工具  
│   ├── /excel-tools/filter-counter # 筛选计数工具
│   └── /excel-tools/cell-fill     # 单元格填充工具
├── 使用指南 (/guide)           - 详细教程和最佳实践
│   ├── /guide/getting-started
│   ├── /guide/excel-vs-power-query
│   ├── /guide/data-preparation
│   └── /guide/excel-tools-overview  # 新增：Excel工具使用指南
├── 博客中心 (/resources)       - 学习资源和案例
│   ├── /resources/wide-vs-long-format
│   ├── /resources/when-to-unpivot
│   ├── /resources/success-stories
│   └── /resources/excel-productivity-tips  # 新增：Excel效率提升
├── FAQ页面 (/faq)              - 常见问题
└── 关于我们 (/about)           - 团队和技术背景
```

#### 关键词分配策略
* **Homepage**：`unpivot tool`, `excel data converter`, `excel data tools`
* **Original Tool Page**：`online unpivot`, `convert wide to long format`
* **Excel Tools Suite**：`excel productivity tools`, `excel data analysis tools`
* **Guide Pages**：`how to unpivot data`, `excel unpivot tutorial`, `excel tools guide`
* **Blog Pages**：`data transformation best practices`, `unpivot vs pivot table`

### 第二阶段：内容重新分配（2-3天）

#### Homepage Content Streamlining (Keep 20% of core content)
**Content to Keep:**
* Hero section (value proposition) + Excel Tools Suite preview
* 3-step workflow demonstration
* Quick demo (before/after tables)
* Core features introduction (expand to 6 selling points, including new tools)
* CTA buttons (pointing to original tool page + Excel Tools Suite)

**Content to Remove:**
* Detailed FAQ (move to dedicated FAQ page)
* Professional team introduction (move to About page)
* Technical depth content (move to guide pages)
* Blog-style articles (move to Resources page)

#### 新建Excel工具集页面
**新建：**`/excel-tools/index.html`
* 4个工具的概览介绍
* 每个工具的核心价值展示
* 使用场景对比表格
* 工具间的功能互补说明

### 第三阶段：导航系统重构（1-2天）

#### 新导航菜单设计
```html
<nav class="main-nav">
  <a href="/" class="nav-brand">📊 UnpivotTool</a>
  <div class="nav-links">
    <a href="/unpivot-tool">Unpivot Data</a>
    <div class="dropdown">
      <a href="/excel-tools" class="dropdown-toggle">Excel Tools ▼</a>
      <div class="dropdown-menu">
        <a href="/excel-tools/spotlight">🔍 Spotlight Highlighter</a>
        <a href="/excel-tools/text-grouper">📊 Text Grouper</a>
        <a href="/excel-tools/filter-counter">🎯 Filter Counter</a>
        <a href="/excel-tools/cell-fill">📝 Cell Auto-Fill</a>
      </div>
    </div>
    <a href="/guide">Guide</a>
    <a href="/resources">Resources</a>
    <a href="/faq">FAQ</a>
    <a href="/about">About</a>
  </div>
</nav>
```

---

## Excel工具详细规划

## 1. Spotlight (聚光灯高亮工具)

### 1.1 产品定位
简化Excel条件格式设置的在线工具，通过可视化交互实现数据高亮显示。

### 1.2 核心功能

#### 文本高亮模式
- 用户点击表格中任意文本单元格
- 所有相同文text自动高亮显示
- 支持多个不同文本同时高亮（不同颜色）
- 右侧控制面板显示已选择的高亮项目

#### 数值区间高亮模式
- 自动检测数值列
- 将数值范围平均分为5个区间
- 每个区间分配不同颜色（渐变色谱）
- 用户可调整区间边界

### 1.3 商业模式
- 完全免费使用
- 支持无限制高亮项目
- 支持导出带条件格式的Excel文件

### 1.4 技术实现

#### 前端核心代码
```javascript
class SpotlightTool {
    constructor() {
        this.highlightedItems = new Map();
        this.colorPalette = ['#FFE6CC', '#E6F3FF', '#E6FFE6', '#FFE6F3', '#F3E6FF'];
        this.maxHighlights = Infinity; // 无限制
    }
    
    handleCellClick(cell) {
        const value = cell.textContent.trim();
        const dataType = this.detectDataType(value);
        
        if (dataType === 'text') {
            this.handleTextHighlight(value);
        } else if (dataType === 'number') {
            this.handleNumberRangeHighlight();
        }
    }
    
    addTextHighlight(text) {
        if (this.highlightedItems.size >= this.maxFreeHighlights && !this.isPremium) {
            this.showUpgradeModal();
            return;
        }
        
        const color = this.getNextColor();
        this.highlightedItems.set(text, { type: 'text', color: color });
        this.findAndHighlightCells(text, color);
    }
    
    // 数值区间计算
    calculateRanges(numbers, rangeCount = 5) {
        const min = Math.min(...numbers);
        const max = Math.max(...numbers);
        const step = (max - min) / rangeCount;
        
        return Array.from({ length: rangeCount }, (_, i) => ({
            min: min + (step * i),
            max: min + (step * (i + 1)),
            color: this.colorPalette[i]
        }));
    }
    
    // 生成Excel条件格式规则
    generateConditionalFormatting() {
        const rules = [];
        this.highlightedItems.forEach((item, key) => {
            if (item.type === 'text') {
                rules.push({
                    type: 'cellIs',
                    operator: 'equal',
                    formula: `"${key}"`,
                    fill: { fgColor: { rgb: item.color.replace('#', '') } }
                });
            }
        });
        return rules;
    }
}
```

---

## 2. Text-Grouper (文本聚合工具)

### 2.1 产品定位
将重复的文本数据进行分组聚合，类似于数据透视表但专门处理文本内容。

### 2.2 核心功能
- 按指定列的文本值进行分组
- 将同组的其他文本列内容用逗号连接
- 数值列进行求和操作
- 支持多级分组
- **新增：Unpivot Text功能** - 用户自定义分隔符拆分文本

### 2.3 使用场景示例
#### 输入数据：
| 姓名 | 部门 | 技能 | 工资 |
|------|------|------|------|
| 张三 | IT | Java | 8000 |
| 张三 | IT | Python | 0 |
| 李四 | HR | 招聘 | 6000 |
| 李四 | HR | 培训 | 0 |

#### 输出结果（按姓名分组）：
| Name | Department | Skills | Salary |
|------|------------|--------|--------|
| Zhang San | IT | Java,Python | 8000 |
| Li Si | HR | Recruiting,Training | 6000 |

#### Unpivot Text使用场景：
**输入数据：**
| Name | Skills |
|------|---------|
| John | Java;Python;React |
| Mary | SQL;Tableau;Excel |

**用户选择分隔符：** `;`

**输出结果：**
| Name | Skills |
|------|--------|
| John | Java |
| John | Python |
| John | React |
| Mary | SQL |
| Mary | Tableau |
| Mary | Excel |

### 2.4 技术实现

#### 核心算法
```javascript
class TextGrouper {
    constructor() {
        this.data = [];
        this.groupByColumns = [];
        this.aggregateColumns = [];
    }
    
    // 主要分组逻辑
    groupData(data, groupByColumns, aggregateColumns) {
        const grouped = new Map();
        
        data.forEach(row => {
            // 生成分组键
            const groupKey = groupByColumns.map(col => row[col]).join('|||');
            
            if (!grouped.has(groupKey)) {
                // 初始化分组
                const newGroup = { ...row };
                aggregateColumns.forEach(col => {
                    if (this.isNumeric(row[col])) {
                        newGroup[col] = parseFloat(row[col]) || 0;
                    } else {
                        newGroup[col] = row[col] || '';
                    }
                });
                grouped.set(groupKey, newGroup);
            } else {
                // 聚合数据
                const existingGroup = grouped.get(groupKey);
                aggregateColumns.forEach(col => {
                    if (this.isNumeric(row[col])) {
                        existingGroup[col] += parseFloat(row[col]) || 0;
                    } else {
                        // 文本聚合：用逗号连接，去重
                        const existingTexts = existingGroup[col].split(',').filter(t => t.trim());
                        const newText = row[col];
                        if (newText && !existingTexts.includes(newText)) {
                            existingGroup[col] = existingTexts.concat(newText).join(',');
                        }
                    }
                });
            }
        });
        
        return Array.from(grouped.values());
    }
    
    // 检测数值类型
    isNumeric(value) {
        return !isNaN(parseFloat(value)) && isFinite(value);
    }
    
    // 新增：Unpivot Text 功能
    unpivotText(data, textColumn, delimiter = ',') {
        const result = [];
        
        data.forEach(row => {
            const textValue = row[textColumn];
            if (textValue && typeof textValue === 'string') {
                const splitValues = textValue.split(delimiter).map(v => v.trim()).filter(v => v);
                
                splitValues.forEach(splitValue => {
                    const newRow = { ...row };
                    newRow[textColumn] = splitValue;
                    result.push(newRow);
                });
            } else {
                // 如果没有可拆分的文本，保持原行
                result.push({ ...row });
            }
        });
        
        return result;
    }
    
    // 检测可能的分隔符
    detectDelimiters(data, column) {
        const commonDelimiters = [',', ';', '|', '/', '\\', '-', ':', ' '];
        const delimiterCounts = new Map();
        
        data.slice(0, 100).forEach(row => { // 只检测前100行
            const value = row[column];
            if (typeof value === 'string') {
                commonDelimiters.forEach(delimiter => {
                    const count = (value.match(new RegExp('\\' + delimiter, 'g')) || []).length;
                    if (count > 0) {
                        delimiterCounts.set(delimiter, (delimiterCounts.get(delimiter) || 0) + count);
                    }
                });
            }
        });
        
        // 按使用频率排序
        return Array.from(delimiterCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([delimiter, count]) => ({ delimiter, count }));
    }
}
```

---

## 3. Filter-Counter (筛选计数工具)

### 3.1 产品定位
模仿WPS表格的筛选功能，在Excel数据筛选时显示每个选项的数量统计。

### 3.2 核心功能
- 为每一列添加筛选下拉框
- 下拉框中显示每个值及其出现次数
- 支持多列同时筛选
- 实时更新筛选结果和计数

### 3.3 界面设计
```
列标题 ▼ 
├── ☑ 全选 (总计: 1000)
├── ☑ 张三 (123)
├── ☑ 李四 (89)
├── ☑ 王五 (234)
└── ☐ 赵六 (67)
```

### 3.4 技术实现

#### 核心代码
```javascript
class FilterCounter {
    constructor() {
        this.originalData = [];
        this.filteredData = [];
        this.filters = new Map(); // 存储每列的筛选状态
    }
    
    // 初始化筛选器
    initializeFilters(data) {
        const headers = Object.keys(data[0]);
        this.originalData = data;
        this.filteredData = [...data];
        
        headers.forEach(header => {
            const valueCount = this.getValueCounts(data, header);
            this.createFilterDropdown(header, valueCount);
        });
    }
    
    // 统计每个值的出现次数
    getValueCounts(data, column) {
        const counts = new Map();
        data.forEach(row => {
            const value = row[column];
            counts.set(value, (counts.get(value) || 0) + 1);
        });
        
        // 按数量排序
        return new Map([...counts.entries()].sort((a, b) => b[1] - a[1]));
    }
    
    // 创建筛选下拉框
    createFilterDropdown(column, valueCounts) {
        const dropdown = document.createElement('div');
        dropdown.className = 'filter-dropdown';
        
        // 全选选项
        const selectAll = this.createFilterOption(
            'select-all', 
            '全选', 
            this.originalData.length,
            true,
            () => this.handleSelectAll(column)
        );
        dropdown.appendChild(selectAll);
        
        // 各个值选项
        valueCounts.forEach((count, value) => {
            const option = this.createFilterOption(
                value,
                value,
                count,
                true,
                () => this.handleFilterChange(column, value)
            );
            dropdown.appendChild(option);
        });
        
        return dropdown;
    }
    
    // 创建筛选选项
    createFilterOption(value, displayText, count, checked, onChange) {
        const option = document.createElement('div');
        option.className = 'filter-option';
        option.innerHTML = `
            <label>
                <input type="checkbox" value="${value}" ${checked ? 'checked' : ''}>
                <span class="filter-text">${displayText}</span>
                <span class="filter-count">(${count})</span>
            </label>
        `;
        
        option.querySelector('input').addEventListener('change', onChange);
        return option;
    }
    
    // 处理筛选变更
    handleFilterChange(column, value) {
        if (!this.filters.has(column)) {
            this.filters.set(column, new Set());
        }
        
        const columnFilter = this.filters.get(column);
        if (columnFilter.has(value)) {
            columnFilter.delete(value);
        } else {
            columnFilter.add(value);
        }
        
        this.applyFilters();
        this.updateFilterCounts();
    }
    
    // 应用筛选
    applyFilters() {
        this.filteredData = this.originalData.filter(row => {
            return Array.from(this.filters.entries()).every(([column, selectedValues]) => {
                if (selectedValues.size === 0) return true; // 未设置筛选
                return selectedValues.has(row[column]);
            });
        });
        
        this.renderTable(this.filteredData);
    }
    
    // 更新筛选计数
    updateFilterCounts() {
        const headers = Object.keys(this.originalData[0]);
        headers.forEach(header => {
            const newCounts = this.getValueCounts(this.filteredData, header);
            this.updateDropdownCounts(header, newCounts);
        });
    }
}
```

---

## 4. Cell-Fill (单元格拆分后自动填充工具)

### 4.1 产品定位
解决Excel中合并单元格拆分后需要手动填充空白单元格的问题。

### 4.2 核心功能
- 自动检测合并单元格区域
- 一键填充空白单元格
- 支持向下填充和向右填充
- 智能识别填充模式

### 4.3 使用场景示例

#### 问题场景（Excel拆分合并单元格后）：
| 部门 | 姓名 | 职位 |
|------|------|------|
| 销售部 | 张三 | 经理 |
|      | 李四 | 专员 |
|      | 王五 | 专员 |
| 技术部 | 赵六 | 总监 |
|      | 陈七 | 工程师 |

#### 自动填充后：
| 部门 | 姓名 | 职位 |
|------|------|------|
| 销售部 | 张三 | 经理 |
| 销售部 | 李四 | 专员 |
| 销售部 | 王五 | 专员 |
| 技术部 | 赵六 | 总监 |
| 技术部 | 陈七 | 工程师 |

### 4.4 技术实现

#### 核心算法
```javascript
class CellFiller {
    constructor() {
        this.data = [];
        this.fillRules = [];
    }
    
    // 主要填充逻辑
    autoFillCells(data) {
        const result = data.map(row => ({ ...row }));
        const headers = Object.keys(data[0]);
        
        headers.forEach(header => {
            this.fillColumnBlanks(result, header);
        });
        
        return result;
    }
    
    // 填充单列的空白单元格
    fillColumnBlanks(data, columnName) {
        let lastValidValue = null;
        
        for (let i = 0; i < data.length; i++) {
            const currentValue = data[i][columnName];
            
            if (this.isEmpty(currentValue)) {
                // 空白单元格，用上一个有效值填充
                if (lastValidValue !== null) {
                    data[i][columnName] = lastValidValue;
                }
            } else {
                // 更新最后一个有效值
                lastValidValue = currentValue;
            }
        }
    }
    
    // 检测空白单元格
    isEmpty(value) {
        return value === null || 
               value === undefined || 
               value === '' || 
               (typeof value === 'string' && value.trim() === '');
    }
    
    // 智能检测填充模式
    detectFillPattern(data) {
        const patterns = [];
        const headers = Object.keys(data[0]);
        
        headers.forEach(header => {
            const columnData = data.map(row => row[header]);
            const blankRanges = this.findBlankRanges(columnData);
            
            if (blankRanges.length > 0) {
                patterns.push({
                    column: header,
                    type: 'down-fill',
                    ranges: blankRanges
                });
            }
        });
        
        return patterns;
    }
    
    // 查找空白区域
    findBlankRanges(columnData) {
        const ranges = [];
        let currentRange = null;
        
        columnData.forEach((value, index) => {
            if (this.isEmpty(value)) {
                if (!currentRange) {
                    currentRange = { start: index, end: index };
                } else {
                    currentRange.end = index;
                }
            } else {
                if (currentRange) {
                    ranges.push(currentRange);
                    currentRange = null;
                }
            }
        });
        
        // 处理最后一个范围
        if (currentRange) {
            ranges.push(currentRange);
        }
        
        return ranges;
    }
    
    // 预览填充效果
    previewFill(data) {
        const preview = this.autoFillCells(data);
        const changes = [];
        
        data.forEach((originalRow, rowIndex) => {
            const updatedRow = preview[rowIndex];
            Object.keys(originalRow).forEach(column => {
                if (this.isEmpty(originalRow[column]) && !this.isEmpty(updatedRow[column])) {
                    changes.push({
                        row: rowIndex,
                        column: column,
                        oldValue: originalRow[column],
                        newValue: updatedRow[column]
                    });
                }
            });
        });
        
        return { preview, changes };
    }
    
    // 高级填充选项
    advancedFill(data, options = {}) {
        const {
            fillDirection = 'down', // 'down', 'right', 'both'
            selectedColumns = null,  // 指定列填充
            fillMethod = 'previous'  // 'previous', 'next', 'interpolate'
        } = options;
        
        let result = data.map(row => ({ ...row }));
        
        if (fillDirection === 'down' || fillDirection === 'both') {
            result = this.fillDown(result, selectedColumns, fillMethod);
        }
        
        if (fillDirection === 'right' || fillDirection === 'both') {
            result = this.fillRight(result, selectedColumns, fillMethod);
        }
        
        return result;
    }
    
    // 向下填充
    fillDown(data, columns = null, method = 'previous') {
        const targetColumns = columns || Object.keys(data[0]);
        const result = data.map(row => ({ ...row }));
        
        targetColumns.forEach(column => {
            if (method === 'previous') {
                this.fillColumnBlanks(result, column);
            } else if (method === 'next') {
                this.fillColumnBlanksFromNext(result, column);
            }
        });
        
        return result;
    }
    
    // 使用下一个有效值填充
    fillColumnBlanksFromNext(data, columnName) {
        for (let i = data.length - 2; i >= 0; i--) {
            if (this.isEmpty(data[i][columnName]) && !this.isEmpty(data[i + 1][columnName])) {
                data[i][columnName] = data[i + 1][columnName];
            }
        }
    }
}
```

---

## 5. 共用组件设计

### 5.1 文件结构
```
项目根目录/
├── index.html                    (主页)
├── unpivot-tool/
│   └── index.html               (原工具页面)
├── excel-tools/
│   ├── index.html               (工具集合页面)
│   ├── spotlight/
│   │   └── index.html
│   ├── text-grouper/
│   │   └── index.html
│   ├── filter-counter/
│   │   └── index.html
│   └── cell-fill/
│       └── index.html
├── guide/
│   ├── index.html               (指南中心)
│   ├── getting-started.html
│   ├── excel-vs-power-query.html
│   ├── data-preparation.html
│   └── excel-tools-overview.html  # 新增
├── resources/
│   ├── index.html               (资源中心)
│   ├── wide-vs-long-format.html
│   ├── success-stories.html
│   └── excel-productivity-tips.html  # 新增
├── faq/
│   └── index.html
├── about/
│   └── index.html
├── assets/
│   ├── css/
│   │   ├── common.css           (共用样式)
│   │   └── tools.css            (工具专用样式)
│   ├── js/
│   │   ├── common.js            (共用功能)
│   │   └── file-handler.js      (文件处理)
│   └── images/
└── sitemap.xml
```

### 5.2 共用组件
- 统一的文件上传组件
- 统一的表格渲染组件  
- 统一的下载组件
- 统一的UI样式
- 统一的导航和面包屑组件

### 5.3 SEO优化
每个工具页面包含：
- 独特的页面标题和描述
- 相关关键词优化
- 工具间的内链导航
- 统一的面包屑导航
- 结构化数据标记

### 5.4 内部链接策略
**主页链接策略：**
* 主CTA指向 `/unpivot-tool`
* "Excel工具集"指向 `/excel-tools`
* "学习更多"指向 `/guide`

**Excel工具集页面链接：**
* 每个工具都有指向详细页面的链接
* "使用指南"指向 `/guide/excel-tools-overview`
* 工具间相互推荐

**单个工具页面链接：**
* "返回工具集"指向 `/excel-tools`
* "需要帮助？"指向相关指南页面
* 推荐其他相关工具

### 5.5 技术栈
- 前端：原生JavaScript (保持与现有工具一致)
- 文件处理：SheetJS
- 样式：Tailwind CSS
- 部署：静态托管

---

## 6. 开发优先级建议

### 第一阶段：网站重构（10-14天）
1. **网站架构规划**（1-2天）
2. **内容重新分配**（2-3天）
3. **导航系统重构**（1-2天）
4. **内部链接策略实施**（1天）
5. **技术实施**（2-3天）
6. **内容迁移和优化**（2-3天）
7. **测试和上线**（1-2天）

### 第二阶段：Excel工具开发（5-7天）
1. **Cell-Fill** - 解决明确痛点，技术实现相对简单
2. **Filter-Counter** - 市场需求大，用户价值高
3. **Text-Grouper** - 补充功能，数据处理价值高
4. **Spotlight** - 有付费潜力，但技术复杂度较高

### 第三阶段：优化和监控（持续进行）
1. **设置监控工具**
2. **A/B测试优化**
3. **根据用户反馈调整**
4. **SEO持续优化**

**总预计开发时间：15-21天**

---

## 7. 成功指标

### 网站重构成功指标：
- 页面加载速度提升30%
- 用户停留时间增加50%
- 内部页面跳转率提升40%
- 搜索引擎收录页面数量增加5倍

### Excel工具成功指标：
- 工具使用率达到原unpivot工具的20%
- 用户在网站总停留时间增加100%
- 付费转化率达到2-5%（Spotlight工具）
- 工具集页面月访问量达到1000+