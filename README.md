# 📊 UnpivotTool - Transform Wide Tables to Long Format

**Latest Update v2.1 (2025-01-27): Critical Excel Bug Fix & Native English UI** 🚨✅

A powerful, free online tool that converts wide Excel tables to normalized long format instantly. Perfect for data analysis, reporting, and database normalization.

## 🚨 Major Bug Fixes in v2.1

### ✅ FIXED: Excel Cell Line Break Handling
- **Problem**: Excel cells with line breaks (Alt+Enter) were incorrectly split into multiple cells
- **Solution**: Complete rewrite of clipboard parser with intelligent TSV detection
- **Impact**: Now handles complex Excel data with perfect accuracy

### 🇺🇸 IMPROVED: Native American English Interface
- Updated all UI text for international markets
- Enhanced error messages for better user experience
- Professional, conversational tone throughout

## ✨ Key Features

- 🔄 **Smart Data Transform**: Convert wide tables to long format in 3 easy steps
- 📋 **Multiple Input Methods**: Paste directly or upload Excel/CSV files
- 🎯 **Intelligent Column Detection**: Automatically suggests ID and value columns
- 📊 **Multiple Export Options**: Download as Excel, CSV, or copy to clipboard
- 🚫 **No Sign-Up Required**: Completely free, no registration needed
- 🔒 **Privacy First**: All processing happens in your browser
- 📱 **Mobile Friendly**: Responsive design works on all devices

## 🚀 Quick Start

1. **Input Data**: Paste your table or upload an Excel/CSV file
2. **Choose Columns**: Select which columns to keep (ID) and transform (Values)
3. **Get Results**: Download or copy your normalized data

## 💡 Perfect For

- 📈 **Data Analysts**: Preparing data for visualization tools
- 🔬 **Researchers**: Converting survey data for statistical analysis
- 💼 **Business Users**: Normalizing reports for database import
- 🎓 **Students**: Learning data transformation concepts

## 🛠️ Technical Features

### Enhanced Excel Support
- Handles multi-line cell content (Alt+Enter in Excel)
- Preserves data integrity during paste operations
- Smart detection of TSV vs CSV formats
- Robust error handling and validation

### Advanced UI
- Intelligent column selector for large datasets
- Expandable table editor with keyboard navigation
- Real-time preview of transformations
- Professional error messages and feedback

## 📖 How It Works

### Input Methods
1. **Direct Paste**: Copy from Excel and paste directly into the grid
2. **File Upload**: Support for .xlsx, .xls, and .csv files (up to 5MB)

### Column Configuration
- **ID Columns**: Data to keep unchanged (e.g., Name, Date)
- **Value Columns**: Data to transform from wide to long format
- **Custom Names**: Set your own variable and value column names

### Output Formats
- **Excel (.xlsx)**: Professional spreadsheet format
- **CSV**: Universal compatibility
- **Clipboard**: Ready to paste into other applications

## 🔧 Technical Implementation

### Core Algorithm
```javascript
// Enhanced clipboard parser handles Excel line breaks correctly
parseExcelClipboard(data) {
    // Intelligent format detection
    if (data.includes('\t')) {
        return this.parseTSVWithCellLineBreaks(data);
    }
    // Robust CSV parsing with PapaParse
    return this.parseCSVWithCellLineBreaks(data);
}
```

### Browser Compatibility
- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## 📊 Example Transformation

### Before (Wide Format)
| Name | Jan | Feb | Mar |
|------|-----|-----|-----|
| John | 100 | 150 | 200 |
| Jane | 120 | 180 | 220 |

### After (Long Format)
| Name | Variable | Value |
|------|----------|-------|
| John | Jan      | 100   |
| John | Feb      | 150   |
| John | Mar      | 200   |
| Jane | Jan      | 120   |
| Jane | Feb      | 180   |
| Jane | Mar      | 220   |

## 🚀 Getting Started

### Local Development
1. Clone the repository
2. Open `index.html` in your browser
3. Start transforming data!

### File Requirements
- Data should start at cell A1
- Include one header row
- Avoid merged cells and multiple sheets
- File size limit: 5MB

## 🆕 Version History

### v2.1 (2025-01-27) - Critical Bug Fix
- 🔧 Fixed Excel cell line break handling bug
- 🇺🇸 Updated to native American English
- ✨ Enhanced error messages and user feedback
- 🚀 Improved paste operation reliability

### v2.0 (2025-01-27) - Major Feature Update
- 🎯 Smart column configuration with popup selectors
- 🔧 Enhanced data management controls
- 📊 Improved large table handling
- ⌨️ Keyboard navigation support

### v1.0 (2025-01-26) - Initial Release
- 📋 Basic unpivot functionality
- 📁 File upload support
- 📊 Excel and CSV export

## 🤝 Contributing

We welcome contributions! Please feel free to submit issues or pull requests.

## 📄 License

This project is open source and available under the MIT License.

## 🌟 Why Choose UnpivotTool?

- **Accuracy**: Handles complex Excel data with perfect precision
- **Speed**: Instant transformations, no server processing
- **Privacy**: Your data never leaves your browser
- **Simplicity**: No learning curve, works immediately
- **Professional**: Native English interface for international users

---

**Transform your data today - it's that simple!** 🚀

*Built with ❤️ for data professionals worldwide* 