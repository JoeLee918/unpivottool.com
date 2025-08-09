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
- Header 徽章与 Logo 间距优化：重构 `.nav` 布局，徽章紧邻品牌标识；右侧下拉保持贴右
- 首屏四个特性区块改为 2x2 网格：`.hero-features` 使用 CSS Grid，统一尺寸、文本居中，移动端单列
- Unmerge 首页复用同样的 `.hero-features` 网格与导航对齐规则，保持站内一致性
- Enhanced FAQ layout with better visual hierarchy
- Fixed Excel grid height consistency
- Added smooth alert animations for user feedback
- Improved table styling with Excel-like borders

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
