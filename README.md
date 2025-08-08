# Unpivot Tool - Excel Data Transformation Tool

🔗 **Live Demo: [unpivottool.com](https://unpivottool.com)**

A free, browser-based tool for converting wide Excel tables to long format without Power Query complexity.

## Features

- ⚡ **Instant Conversion**: Transform Excel data in seconds
- 🔒 **Local Processing**: All data stays in your browser
- 🆓 **Completely Free**: No signup or registration required
- 📊 **Multiple Formats**: Support for Excel (.xlsx, .xls) and CSV files
- 🔐 **Privacy First**: No data sent to servers, 100% local processing
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile devices

## How to Use

1. **Step 1**: Paste your Excel data or upload a file (.xlsx, .xls, .csv)
2. **Step 2**: Configure which columns to keep as ID and which to unpivot
3. **Step 3**: Download your converted data as Excel or CSV

Visit [unpivottool.com](https://unpivottool.com) and start converting your Excel data instantly.

## Tech Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **File Processing**: SheetJS for Excel files, PapaParse for CSV
- **Design**: Mobile-first responsive design
- **Processing**: 100% client-side, no server required

## Recent Updates

### Latest UI/UX Improvements
- Unified "virtual merge model" across Home and Unmerge tools
- Step1 now visually preserves merged ranges with placeholders
- Step2 conversion is idempotent; repeated clicks refresh correctly
- Expanded cells only fill blanks created by merges; true blanks stay empty
- Softer placeholder visuals (neutral gray, dashed borders)

### Previous Fixes
- Limited display to 20 rows for better performance
- Streamlined button layout and removed redundant options
- Enhanced modal behavior for full editor mode
- Added clear file upload success indicators

## Local Development

```bash
# Clone the repository
git clone https://github.com/JoeLee918/unpivottool.com.git

# Navigate to directory
cd unpivottool.com

# Start local server
python -m http.server 3000

# Open in browser
http://localhost:3000

## Changelog 2025-08-08

- feat(unmerge): reuse virtual merge detection and expansion in `excel-tools/unmerge-fill/tool-specific.js`
- fix(home): preserve merged appearance on paste and after edits; make Convert repeatable
- style: tone down merged placeholders in `styles.css` for cleaner look
