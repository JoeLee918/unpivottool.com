# UnpivotTool - Online Table Converter

> 🚀 **Version 2.0** - Enhanced with improved user experience and advanced features

Convert wide tables to long format (unpivot) instantly in your browser. No signup required, completely free to use.

## ✨ New Features (v2.0)

### 🔧 Data Management Controls
- **Clear All Data**: One-click to clear all table data
- **Reset to Sample**: Restore default example data
- **Add Row/Column**: Dynamic table expansion
- **Enhanced Delete**: Better data management workflow

### 📊 Improved Table Display
- **Enhanced Modal Editor**: Better performance for large datasets
- **Keyboard Navigation**: Arrow keys and Tab support in modal editor
- **Virtual Scrolling**: Optimized for tables with thousands of cells
- **Focus Management**: Better visual feedback for cell selection

### 📋 Advanced Paste Handling
- **Excel Format Support**: Maintains table headers when pasting from Excel
- **Multi-format Detection**: Handles tab-separated, comma-separated, and mixed data
- **Special Character Handling**: Properly processes quotes, line breaks, and whitespace
- **Paste Feedback**: Success notifications for paste operations

### 🎯 Smart Column Configuration
- **Adaptive Interface**: Automatically switches between normal and popup selectors
- **Popup Selectors**: For tables with long headers or many columns (>8 columns or >15 characters)
- **Bulk Selection**: Select All/Deselect All options
- **Header Truncation**: Long column names are truncated with tooltips
- **Dynamic Layout**: Prevents interface stretching with long headers

## 🛠 How It Works

### Step 1: Input Your Data
Choose your preferred method:
- **📋 Paste Method** (Recommended): Copy from Excel/Google Sheets and paste directly
- **📁 File Upload**: Upload .xlsx, .xls, or .csv files
- **✏️ Manual Entry**: Type directly in the editable table

### Step 2: Configure Columns
The tool automatically detects your data structure:
- **ID Columns**: Select columns to keep unchanged (e.g., Name, ID)
- **Value Columns**: Select columns to unpivot (e.g., Jan, Feb, Mar)
- **Custom Names**: Set names for the new Variable and Value columns

### Step 3: Download Results
Get your converted data:
- **📋 Copy to Clipboard**: Paste into Excel/Google Sheets
- **📊 Download Excel**: Get a .xlsx file
- **📄 Download CSV**: Get a comma-separated file

## 🚀 Features

### Core Functionality
- ✅ **No Registration Required** - Start using immediately
- ✅ **100% Browser-Based** - No server uploads, your data stays private
- ✅ **Multiple Input Methods** - Paste, upload, or type manually
- ✅ **Smart Column Detection** - Automatically suggests ID vs Value columns
- ✅ **Real-time Preview** - See results before downloading
- ✅ **Multiple Export Formats** - Excel, CSV, and clipboard

### Advanced Features
- 🔧 **Data Management Tools** - Clear, reset, add rows/columns
- 📱 **Mobile Responsive** - Works on phones and tablets
- ⌨️ **Keyboard Navigation** - Full keyboard support in modal editor
- 🎯 **Smart UI Adaptation** - Interface adapts to data complexity
- 🚀 **Performance Optimized** - Handles large datasets efficiently
- 🔄 **Enhanced Paste** - Robust Excel/CSV data processing

## 📋 Supported File Formats

### Input Formats
- **Excel Files**: .xlsx, .xls
- **CSV Files**: .csv (comma or tab separated)
- **Direct Paste**: From Excel, Google Sheets, or any spreadsheet

### Output Formats
- **Excel**: .xlsx with proper formatting
- **CSV**: Standard comma-separated values
- **Clipboard**: Tab-separated for direct pasting

## 🔧 Technical Specifications

### Browser Requirements
- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **JavaScript**: Must be enabled
- **File Size Limit**: 5MB for uploaded files
- **Table Size**: Optimized for up to 20,000 cells

### Performance Optimizations
- **Client-side Processing**: No server delays
- **Virtual Scrolling**: Smooth handling of large tables
- **Memory Efficient**: Optimized data structures
- **Fast Rendering**: Minimal DOM manipulation

## 🆕 Version History

### Version 2.0 (2025-01-27)
#### 🔧 Major Improvements
- **Enhanced Data Management**: Added clear, reset, and dynamic row/column controls
- **Improved Paste Handling**: Better Excel compatibility and format detection
- **Smart Column Configuration**: Adaptive UI that prevents layout issues with long headers
- **Optimized Table Display**: Enhanced modal editor with keyboard navigation
- **Better User Feedback**: Success/error notifications for all operations

#### 🐛 Bug Fixes
- Fixed Excel paste losing table headers
- Resolved layout stretching with long column names
- Improved performance with large datasets
- Enhanced mobile responsiveness

#### 🎨 UI/UX Enhancements
- Popup selectors for complex column configurations
- Keyboard navigation in modal editor
- Improved visual feedback and animations
- Better button and control placement

### Version 1.0 (2025-01-20)
- Initial release with basic unpivot functionality
- File upload and paste support
- Excel and CSV export capabilities

## 🔗 Use Cases

### Business Analytics
- **Sales Reports**: Convert monthly sales by product to time-series format
- **Survey Data**: Transform survey responses for statistical analysis
- **Financial Data**: Restructure budget data for trend analysis

### Academic Research
- **Experimental Data**: Convert wide-format results to long format for analysis
- **Survey Research**: Prepare questionnaire data for statistical software
- **Longitudinal Studies**: Transform repeated measures data

### Data Science
- **Data Preprocessing**: Prepare data for machine learning models
- **Visualization**: Convert data for charting libraries that expect long format
- **Database Import**: Transform spreadsheet data for database insertion

## 🛡️ Privacy & Security

- **No Data Storage**: All processing happens in your browser
- **No Server Uploads**: Files are processed locally on your device
- **HTTPS Secured**: All connections are encrypted
- **Open Source**: Code is transparent and auditable

## 📞 Support

- **Issues**: Report bugs or request features
- **Email**: support@unpivottool.com
- **Documentation**: Comprehensive guides and examples

## 📝 License

This project is open source and available under the MIT License.

---

*Built with ❤️ for data analysts, researchers, and anyone working with spreadsheet data.* 