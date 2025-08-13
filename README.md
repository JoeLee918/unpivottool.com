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

### 2025-08-13
- feat(unmerge): New canonical path `/excel-tools/unmerge-and-fill/` with breadcrumb + JSON-LD; `_redirects` adds 301 from `/excel-tools/unmerge-fill/`
- feat(resources): Add `/resources/` hub and two articles:
  - `/resources/what-is-unpivot/`
  - `/resources/how-to-unpivot-data-in-excel/`
- fix(css): Resource articles use relative `../../styles.css` to share global styling
- seo(sitemap): Include new URLs and update priorities; unify trailing slashes
- seo(robots): Open to major AI crawlers; add LLM-Content and LLM-Full-Content hints; block non-content paths like `/_next/`, `/static/`, error pages, and `*.json`.
- seo(sitemap): Simplify XML and include the Unmerge & Fill tool page; update `lastmod` to 2025-08-13.
- docs(llms): Add `llms.txt` (brief) and `llms-full.txt` (detailed) at site root in English.
- ops(cf): Recommend Cloudflare rules to Skip WAF/SBFM for verified crawlers and for `robots.txt`/`sitemap.xml`/`llms*`.

Verification
- Open `https://unpivottool.com/sitemap.xml` and confirm it renders XML.
- Windows PowerShell:
  - `curl.exe -s -A "bingbot" https://unpivottool.com/sitemap.xml | Select-String "<loc>"`
- Bing Webmaster Tools: resubmit the sitemap and recheck Discovered URLs after 5–15 minutes.

### 2025-08-09
- feat(unpivot): Add floating action button (FAB) "Open Full Editor"; show only when cells > 2000
- feat(unpivot): Full editor now renders complete dataset from `fullData`; Step1 preview limited to 15 rows
- fix(unpivot): Modal content scrolls within viewport; default field names changed to "Column A" / "Column B" (user editable)
- feat(unmerge): Add FAB for full editor; maintain full dataset in `fullData`, preview limited to 15 rows
- feat(unmerge): Threshold check uses full dataset; full editor modal renders complete table
- docs: Keep all public-facing copy in English per site requirement

### Unmerge & Fill (Single-box, auto processing)
- UI: Single-box workflow — paste or upload, results appear automatically below.
- Behavior: Always performs Unmerge & Fill automatically; no action selection.
- Controls: Removed full-screen editor modal; replaced "Reset to Sample" with "Clear All" (no confirmation).
- Limits: CSV support retained; upload limit enforced at 5MB.
- Copy: SEO/Demo/FAQ updated to emphasize "Paste, Done" and remove any "3-step" phrasing.

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

## Changelog 2025-01-27

- feat(unmerge): migrate to single-box auto-processing UI; remove steps and modal editor
- perf(unmerge): debounce auto processing by data size; add 5MB upload guard
- docs: update page copy and README to "Paste, Done"; rename button to "Clear All"
