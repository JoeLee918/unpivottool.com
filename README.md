# Unpivot Tool - Excel Data Transformation Tool

A free, browser-based tool for converting wide Excel tables to long format without Power Query complexity.

## Features

- **Instant Conversion**: Transform Excel data in seconds
- **Local Processing**: All data stays in your browser
- **Multiple Formats**: Support for Excel (.xlsx, .xls) and CSV files
- **No Registration**: Completely free, no account required
- **Privacy First**: No data sent to servers

## Recent Updates (Latest)

### UI/UX Improvements
- **FAQ Layout**: Adjusted FAQ boxes to be wider and better fit overall layout
- **Excel Grid Height**: Fixed Excel input boxes to maintain consistent height after content deletion
- **Alert System**: Added proper CSS styling for success/error alerts with smooth animations
- **Table Styling**: Enhanced Excel-like cell borders for better visual clarity

### Previous Fixes
- **Page Stretching**: Limited displayed rows to 20 to prevent page stretching with large files
- **Step 1 Buttons**: Cleaned up redundant buttons, keeping only essential ones
- **Advanced Options**: Removed unnecessary "Advanced Options" button from Step 2
- **Table Borders**: Added prominent Excel-like cell borders to data grids
- **FAQ Toggle**: Fixed FAQ expansion/collapse functionality
- **Modal Behavior**: Ensured "Expand Full Editor" works as modal popup
- **File Upload Feedback**: Added clear guidance after successful file upload

## How to Use

1. **Step 1**: Paste your Excel data or upload a file
2. **Step 2**: Configure which columns to keep as ID and which to unpivot
3. **Step 3**: Download your converted data as Excel or CSV

## Technical Details

- Built with vanilla JavaScript, HTML5, and CSS3
- Uses SheetJS for Excel file processing
- Papa Parse for CSV handling
- Responsive design with mobile-first approach

## Local Development

To run the tool locally:

```bash
python -m http.server 3000
```

Then open `http://localhost:3000` in your browser.

## File Structure

- `index.html` - Main application interface
- `app.js` - Core JavaScript functionality
- `styles.css` - Styling and responsive design
- `README.md` - Project documentation

## Browser Compatibility

- Chrome 80+
- Firefox 75+
- Safari 13+
- Edge 80+

## Privacy & Security

- All processing happens locally in your browser
- No data is sent to external servers
- No cookies or tracking mechanisms
- No account registration required 