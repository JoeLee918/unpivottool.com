# Excel Tools PRD Document (Simplified & Focused)

## Project Overview
Extend the existing unpivottool.com with four complementary Excel tools while maintaining the unpivot tool as the primary focus. Create a streamlined user experience that supports the main product while offering additional value through related utilities.

---

## Website Architecture Strategy

### Core Philosophy
- **Primary Focus**: Unpivot tool remains the main product and homepage focus
- **Secondary Tools**: Excel utilities positioned as complementary features
- **Simple Structure**: Flat URL hierarchy for better SEO and user experience
- **Future-Proof**: Easy to migrate to separate domains if tools grow significantly

### URL Structure (Simplified)
```
unpivottool.com/
├── /                              # Homepage - Unpivot Tool (primary)
├── /excel-spotlight-tool          # Spotlight highlighter
├── /excel-text-grouper-tool       # Text grouper & unpivot text
├── /excel-filter-counter-tool     # Filter with counters
├── /excel-unmerge-fill-tool       # Unmerge and auto-fill cells
├── /guide                         # Unified guide for all tools
├── /resources                     # Blog content and resources
└── /about                         # About page
```

### Navigation Design (Simplified)
```html
<nav class="main-nav">
  <a href="/" class="nav-brand">📊 UnpivotTool</a>
  <div class="nav-links">
    <a href="/guide">All Tools & Guide</a>
    <a href="/resources">Resources</a>
    <a href="/about">About</a>
  </div>
</nav>
```

### Homepage Content Strategy
**Primary Content (80% of page):**
- Hero section focused on unpivot functionality
- Main unpivot tool interface
- Core value propositions for data transformation
- Primary CTA for unpivot tool usage

**Secondary Content (20% of page - bottom section):**
```html
<section class="additional-tools">
  <h2>More Excel Productivity Tools</h2>
  <div class="tools-grid">
    <div class="tool-card">
      <h3>🔍 Excel Spotlight</h3>
      <p>Highlight data patterns with visual conditional formatting</p>
      <a href="/excel-spotlight-tool">Try Spotlight →</a>
    </div>
    <div class="tool-card">
      <h3>📊 Text Grouper</h3>
      <p>Group and aggregate text data, plus unpivot text with custom delimiters</p>
      <a href="/excel-text-grouper-tool">Try Grouper →</a>
    </div>
    <div class="tool-card">
      <h3>🎯 Filter Counter</h3>
      <p>Filter data with value counts like WPS Office</p>
      <a href="/excel-filter-counter-tool">Try Filter →</a>
    </div>
    <div class="tool-card">
      <h3>📝 Unmerge Fill</h3>
      <p>Auto-fill cells after unmerging in Excel</p>
      <a href="/excel-unmerge-fill-tool">Try Unmerge →</a>
    </div>
  </div>
</section>
```

---

## SEO Strategy

### Keyword Targeting Priority
1. **Homepage**: `unpivot tool`, `excel unpivot online`, `convert wide to long format`
2. **Individual Tools**: Long-tail keywords for each specific function
3. **Guide Page**: `excel tools guide`, `data transformation tutorial`
4. **Resources**: `excel tips`, `data analysis best practices`

### Individual Tool Keywords
- **/excel-spotlight-tool**: `excel conditional formatting tool`, `highlight duplicate values excel`
- **/excel-text-grouper-tool**: `excel group text data`, `unpivot text with delimiter`
- **/excel-filter-counter-tool**: `excel filter with count`, `wps filter alternative`
- **/excel-unmerge-fill-tool**: `excel unmerge cells fill`, `auto fill merged cells`

### Cross-Linking Strategy
- Each tool page links back to homepage with contextual anchor text
- Tools recommend related tools at the bottom
- Guide page serves as hub linking to all tools
- All pages include Google Analytics tracking

---

## Tool Specifications

## 1. Excel Spotlight Tool

### Product Positioning
Visual conditional formatting tool that simplifies data highlighting through interactive clicks.

### Core Features
- **Text Highlighting**: Click any cell to highlight all matching text values
- **Number Range Highlighting**: Automatic 5-tier color coding for numerical data
- **Multi-selection**: Support multiple highlight groups with different colors
- **Export**: Download Excel file with conditional formatting rules applied

### Technical Implementation
```javascript
class ExcelSpotlight {
    constructor() {
        this.highlights = new Map();
        this.colorPalette = ['#FFE6CC', '#E6F3FF', '#E6FFE6', '#FFE6F3', '#F3E6FF'];
        this.currentColorIndex = 0;
    }
    
    handleCellClick(cell) {
        const value = cell.textContent.trim();
        if (this.isNumeric(value)) {
            this.highlightNumberRange(value);
        } else {
            this.highlightTextMatches(value);
        }
    }
    
    highlightTextMatches(text) {
        if (!this.highlights.has(text)) {
            const color = this.getNextColor();
            this.highlights.set(text, color);
            this.applyHighlight(text, color);
        }
    }
    
    generateExcelRules() {
        const rules = [];
        this.highlights.forEach((color, text) => {
            rules.push({
                type: 'cellIs',
                operator: 'equal',
                formula: `"${text}"`,
                fill: { fgColor: { rgb: color.replace('#', '') } }
            });
        });
        return rules;
    }
}
```

---

## 2. Excel Text Grouper Tool

### Product Positioning
Aggregate duplicate text entries and unpivot text with custom delimiters.

### Core Features
- **Text Grouping**: Group rows by specified columns, concatenate text values
- **Number Aggregation**: Sum numerical columns during grouping
- **Unpivot Text**: Split text by user-defined delimiters into separate rows
- **Smart Delimiter Detection**: Suggest common delimiters automatically

### Use Case Examples

#### Text Grouping:
**Input:**
| Name | Department | Skills | Salary |
|------|------------|--------|--------|
| John | IT | Java | 8000 |
| John | IT | Python | 0 |
| Mary | HR | Recruiting | 6000 |
| Mary | HR | Training | 0 |

**Output (grouped by Name):**
| Name | Department | Skills | Salary |
|------|------------|--------|--------|
| John | IT | Java,Python | 8000 |
| Mary | HR | Recruiting,Training | 6000 |

#### Unpivot Text:
**Input:**
| Name | Skills |
|------|---------|
| John | Java;Python;React |
| Mary | SQL;Tableau;Excel |

**User selects delimiter:** `;`

**Output:**
| Name | Skills |
|------|--------|
| John | Java |
| John | Python |
| John | React |
| Mary | SQL |
| Mary | Tableau |
| Mary | Excel |

### Technical Implementation
```javascript
class TextGrouper {
    constructor() {
        this.data = [];
        this.groupColumns = [];
    }
    
    groupData(data, groupByColumns, aggregateColumns) {
        const grouped = new Map();
        
        data.forEach(row => {
            const groupKey = groupByColumns.map(col => row[col]).join('|||');
            
            if (!grouped.has(groupKey)) {
                const newGroup = { ...row };
                grouped.set(groupKey, newGroup);
            } else {
                const existingGroup = grouped.get(groupKey);
                aggregateColumns.forEach(col => {
                    if (this.isNumeric(row[col])) {
                        existingGroup[col] += parseFloat(row[col]) || 0;
                    } else {
                        const existing = existingGroup[col].split(',').filter(Boolean);
                        const newValue = row[col];
                        if (newValue && !existing.includes(newValue)) {
                            existingGroup[col] = existing.concat(newValue).join(',');
                        }
                    }
                });
            }
        });
        
        return Array.from(grouped.values());
    }
    
    unpivotText(data, textColumn, delimiter = ',') {
        const result = [];
        
        data.forEach(row => {
            const textValue = row[textColumn];
            if (textValue && typeof textValue === 'string') {
                const splitValues = textValue.split(delimiter)
                    .map(v => v.trim())
                    .filter(v => v);
                
                splitValues.forEach(splitValue => {
                    const newRow = { ...row };
                    newRow[textColumn] = splitValue;
                    result.push(newRow);
                });
            } else {
                result.push({ ...row });
            }
        });
        
        return result;
    }
    
    detectDelimiters(data, column) {
        const commonDelimiters = [',', ';', '|', '/', '\\', '-', ':', ' '];
        const delimiterCounts = new Map();
        
        data.slice(0, 100).forEach(row => {
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
        
        return Array.from(delimiterCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .map(([delimiter, count]) => ({ delimiter, count }));
    }
}
```

---

## 3. Excel Filter Counter Tool

### Product Positioning
WPS Office-style filtering with value count display for each filter option.

### Core Features
- **Count Display**: Show occurrence count for each filter value
- **Multi-column Filtering**: Apply filters across multiple columns simultaneously
- **Real-time Updates**: Counts update dynamically as filters are applied
- **Export Filtered Data**: Download the filtered results

### Interface Design
```
Column Header ▼ 
├── ☑ Select All (Total: 1000)
├── ☑ John Smith (123)
├── ☑ Mary Johnson (89)
├── ☑ David Wilson (234)
└── ☐ Lisa Brown (67)
```

### Technical Implementation
```javascript
class FilterCounter {
    constructor() {
        this.originalData = [];
        this.filteredData = [];
        this.activeFilters = new Map();
    }
    
    initializeFilters(data) {
        this.originalData = data;
        this.filteredData = [...data];
        
        Object.keys(data[0]).forEach(column => {
            const valueCounts = this.getValueCounts(data, column);
            this.createFilterDropdown(column, valueCounts);
        });
    }
    
    getValueCounts(data, column) {
        const counts = new Map();
        data.forEach(row => {
            const value = row[column] || 'Empty';
            counts.set(value, (counts.get(value) || 0) + 1);
        });
        
        return new Map([...counts.entries()].sort((a, b) => b[1] - a[1]));
    }
    
    applyFilters() {
        this.filteredData = this.originalData.filter(row => {
            return Array.from(this.activeFilters.entries()).every(([column, selectedValues]) => {
                if (selectedValues.size === 0) return true;
                return selectedValues.has(row[column] || 'Empty');
            });
        });
        
        this.updateAllFilterCounts();
        this.renderTable(this.filteredData);
    }
    
    updateAllFilterCounts() {
        Object.keys(this.originalData[0]).forEach(column => {
            const newCounts = this.getValueCounts(this.filteredData, column);
            this.updateDropdownCounts(column, newCounts);
        });
    }
}
```

---

## 4. Excel Unmerge Fill Tool

### Product Positioning
Automatically fill blank cells that result from unmerging merged cells in Excel.

### Core Features
- **Auto-detect**: Identify patterns of blank cells that need filling
- **Fill Options**: Fill down, fill right, or both directions
- **Preview Mode**: Show changes before applying
- **Smart Detection**: Recognize different fill patterns automatically

### Use Case Example
**Before (after unmerging in Excel):**
| Department | Name | Position |
|------------|------|----------|
| Sales | John | Manager |
|        | Lisa | Specialist |
|        | Mike | Specialist |
| Tech | David | Director |
|      | Anna | Engineer |

**After Auto-Fill:**
| Department | Name | Position |
|------------|------|----------|
| Sales | John | Manager |
| Sales | Lisa | Specialist |
| Sales | Mike | Specialist |
| Tech | David | Director |
| Tech | Anna | Engineer |

### Technical Implementation
```javascript
class UnmergeFill {
    constructor() {
        this.data = [];
        this.fillPatterns = [];
    }
    
    autoFillCells(data) {
        const result = data.map(row => ({ ...row }));
        const headers = Object.keys(data[0]);
        
        headers.forEach(column => {
            this.fillColumnBlanks(result, column);
        });
        
        return result;
    }
    
    fillColumnBlanks(data, columnName) {
        let lastValidValue = null;
        
        for (let i = 0; i < data.length; i++) {
            const currentValue = data[i][columnName];
            
            if (this.isEmpty(currentValue)) {
                if (lastValidValue !== null) {
                    data[i][columnName] = lastValidValue;
                }
            } else {
                lastValidValue = currentValue;
            }
        }
    }
    
    isEmpty(value) {
        return value === null || 
               value === undefined || 
               value === '' || 
               (typeof value === 'string' && value.trim() === '');
    }
    
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
    
    detectFillPattern(data) {
        const patterns = [];
        const headers = Object.keys(data[0]);
        
        headers.forEach(column => {
            const columnData = data.map(row => row[column]);
            const blankRanges = this.findBlankRanges(columnData);
            
            if (blankRanges.length > 0) {
                patterns.push({
                    column: column,
                    type: 'down-fill',
                    ranges: blankRanges,
                    confidence: this.calculateConfidence(blankRanges, columnData.length)
                });
            }
        });
        
        return patterns;
    }
}
```

---

## File Structure & Shared Components

### Project Structure
```
unpivottool.com/
├── index.html                    # Homepage (unpivot tool)
├── excel-spotlight-tool/
│   └── index.html
├── excel-text-grouper-tool/
│   └── index.html
├── excel-filter-counter-tool/
│   └── index.html
├── excel-unmerge-fill-tool/
│   └── index.html
├── guide/
│   └── index.html               # Unified guide for all tools
├── resources/
│   └── index.html               # Blog and resources
├── about/
│   └── index.html
├── assets/
│   ├── css/
│   │   ├── common.css          # Shared styles
│   │   └── tools.css           # Tool-specific styles
│   ├── js/
│   │   ├── common.js           # Shared functionality
│   │   ├── file-handler.js     # File upload/download
│   │   └── analytics.js        # Google Analytics wrapper
│   └── images/
└── sitemap.xml
```

### Shared Components
- **File Upload Handler**: Unified Excel/CSV file processing
- **Table Renderer**: Consistent data table display
- **Download Manager**: Export functionality for all tools
- **Analytics Tracker**: Google Analytics integration for all pages
- **Navigation Component**: Consistent header/footer across all pages

### Cross-Linking Strategy
**Each tool page includes:**
- Breadcrumb: Home > Tool Name
- "Back to Main Tool" link to homepage
- "Related Tools" section linking to other utilities
- "Need Help?" link to unified guide page

**Homepage includes:**
- Primary unpivot tool interface (80% of content)
- Secondary tools showcase section (20% of content)
- Clear hierarchy: main tool vs. additional utilities

---

## Development Phases & Timeline

### Phase 1: Core Infrastructure (3-4 days)
1. **Shared Components Development**
   - File handler with SheetJS integration
   - Common UI components and styling
   - Analytics integration across all pages
   
2. **Homepage Optimization**
   - Maintain existing unpivot tool functionality
   - Add secondary tools showcase section
   - Implement simplified navigation

### Phase 2: Tool Development (5-7 days)
**Priority Order:**
1. **Unmerge Fill Tool** (1-2 days) - Solves clear pain point, simple logic
2. **Filter Counter Tool** (2 days) - High demand, moderate complexity
3. **Text Grouper Tool** (2 days) - Includes unpivot text feature
4. **Spotlight Tool** (1-2 days) - Visual features, moderate complexity

### Phase 3: Integration & Testing (2-3 days)
1. **Cross-linking Implementation**
2. **SEO Optimization**
   - Meta tags for each page
   - Schema markup
   - Sitemap generation
3. **Performance Testing**
4. **Mobile Responsiveness**
5. **Analytics Verification**

**Total Development Time: 10-14 days**

---

## Success Metrics

### Primary Metrics (Homepage/Unpivot Tool)
- Unpivot tool usage remains primary focus
- Homepage bounce rate < 40%
- Average session duration > 3 minutes

### Secondary Metrics (Additional Tools)
- Each tool achieves 10-20% usage of main unpivot tool
- Cross-tool navigation rate > 15%
- Overall site session duration increases by 50%

### SEO Metrics
- Long-tail keyword rankings for each tool
- Total indexed pages increase
- Organic traffic growth across all tools
- Featured snippet opportunities for specific Excel problems

### Technical Metrics
- Page load speed < 2 seconds for all tools
- Mobile usability score > 90
- Core Web Vitals in green zone
- Google Analytics tracking on 100% of pages

---

## Risk Mitigation

### Primary Product Protection
- Unpivot tool remains the main focus and traffic driver
- Additional tools positioned as "bonus features"
- Clear hierarchy in navigation and content priority

### SEO Risks
- Monitor for keyword cannibalization
- Each tool targets distinct long-tail keywords
- Main unpivot keywords protected on homepage

### Technical Risks
- Shared components reduce code duplication
- Progressive enhancement for older browsers
- Fallback options if JavaScript fails

### User Experience Risks
- Simple navigation prevents confusion
- Clear tool descriptions and use cases
- Consistent UI across all tools