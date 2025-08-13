// Copied from excel-tools/unmerge-fill/tool-specific.js to remove cross-directory dependency
// 保持交互完全一致，不修改任何逻辑

// Unmerge & Fill Tool - Specific JavaScript Logic

function initializeNavigationDropdown() {
	const dropdownBtn = document.querySelector('.dropdown-btn');
	const dropdownContent = document.querySelector('.dropdown-content');
	if (dropdownBtn && dropdownContent) {
		dropdownBtn.addEventListener('click', function(e) {
			e.preventDefault(); e.stopPropagation(); dropdownContent.classList.toggle('show');
		});
		document.addEventListener('click', function(e) {
			if (!dropdownBtn.contains(e.target) && !dropdownContent.contains(e.target)) dropdownContent.classList.remove('show');
		});
		dropdownBtn.addEventListener('touchstart', function(e) { e.preventDefault(); dropdownContent.classList.toggle('show'); });
	}
}

class UnmergeFillTool {
	constructor() {
		this.currentData = [];
		this.fullData = [];
		this.merges = [];
		this.processedData = [];
		this.__autoTimer = null;
		this.__isDirty = false;
		this.__hasShownResultsTip = false;
		this.initializeEventListeners();
		this.loadDefaultData();
	}

	initializeEventListeners() {
		document.getElementById('clear-all')?.addEventListener('click', () => { this.resetToEmptyGrid(); });
		document.getElementById('check-results')?.addEventListener('click', () => {
			const resultsSection = document.getElementById('results-section');
			if (!resultsSection || resultsSection.style.display === 'none') return;
			const tooTall = resultsSection.getBoundingClientRect().height > window.innerHeight * 0.7;
			if (tooTall) this.openResultsModal?.(); else resultsSection.scrollIntoView({ behavior: 'smooth' });
			this.__isDirty = false; this.setCheckResultsBadge(false);
		});
		document.getElementById('regenerate-results')?.addEventListener('click', () => {
			this.processData('both'); this.__isDirty = false; const b = document.getElementById('regenerate-results'); if (b) b.style.display = 'none';
		});
		document.getElementById('copy-results')?.addEventListener('click', this.copyResults.bind(this));
		document.getElementById('download-excel')?.addEventListener('click', this.downloadExcel.bind(this));
		document.getElementById('download-csv')?.addEventListener('click', this.downloadCSV.bind(this));
		const fab = document.getElementById('open-full-editor-fab'); if (fab) fab.addEventListener('click', () => this.openEditorModal());
		document.getElementById('modal-editor-close')?.addEventListener('click', () => this.closeEditorModal());
		document.getElementById('modal-editor-cancel')?.addEventListener('click', () => this.closeEditorModal());
		this.setupFileUpload();
		this.setupDataGridEvents();
	}

	processData(action = 'both') {
		if (!this.currentData.length) { this.showAlert('Please add some data first', 'error'); return; }
		setTimeout(() => {
			try {
				this.extractTableData();
				const source = Array.isArray(this.fullData) && this.fullData.length ? this.fullData : this.currentData;
				const fullMerges = this.detectMergedGroups(source, { detectHorizontal: true });
				const expanded = this.expandMergesForConvert({ matrix: source, merges: fullMerges || [] }, { keepTrueBlank: true });
				if (action === 'split') this.processedData = expanded;
				else if (action === 'both') this.processedData = this.fillRemainingBlanks(expanded);
				else throw new Error('Invalid action');
				this.displayResults(); this.showAlert(`Done. ${this.processedData.length} rows processed.`, 'success');
				this.__isDirty = true; this.setCheckResultsBadge(true);
			} catch (e) { console.error(e); this.showAlert('Error processing data. Please check your input.', 'error'); }
		}, 500);
	}

	fillRemainingBlanks(data) { const out = data.map(r => r.slice()); for (let r=1;r<out.length;r++){ for (let c=0;c<out[r].length;c++){ const v=(out[r][c]||'').trim(); if (v==='' && out[r-1] && (out[r-1][c]||'').trim()!=='') out[r][c]=out[r-1][c]; } } return out; }

	displayResults() {
		const resultsSection = document.getElementById('results-section'); const resultsTable = document.getElementById('results-table'); const resultsCount = document.getElementById('results-count'); if (!resultsSection||!resultsTable||!resultsCount) return;
		resultsCount.textContent = `${this.processedData.length} rows processed`;
		let html = '<table><thead><tr>'; if (this.processedData.length>0){ this.processedData[0].forEach((_,i)=>{ html += `<th>Column ${i+1}</th>`; }); } html += '</tr></thead><tbody>';
		this.processedData.forEach(row => { html += '<tr>'; row.forEach(cell => { html += `<td>${cell}</td>`; }); html += '</tr>'; }); html += '</tbody></table>';
		resultsTable.innerHTML = html; resultsSection.style.display = 'block'; const checkBtn=document.getElementById('check-results'); if (checkBtn){ checkBtn.style.display='inline-block'; checkBtn.disabled=false; } this.setCheckResultsBadge(this.__isDirty);
		if (!this.__hasShownResultsTip){ this.showAlert('Results generated below — scroll to see.', 'info'); this.__hasShownResultsTip = true; }
		resultsSection.classList.add('success-animation'); setTimeout(()=>resultsSection.classList.remove('success-animation'),600);
	}

	showAlert(message, type='info'){ document.querySelectorAll('.alert').forEach(a=>a.remove()); const alert=document.createElement('div'); alert.className=`alert alert-${type}`; alert.textContent=message; const main=document.querySelector('.main .container'); if (main) main.insertBefore(alert, main.firstChild); setTimeout(()=>alert.remove(),5000); }
	setCheckResultsBadge(show){ const btn=document.getElementById('check-results'); if (!btn) return; if (show) btn.setAttribute('data-new','1'); else btn.removeAttribute('data-new'); }
	loadDefaultData(){ this.fullData=Array(5).fill(0).map(()=>Array(4).fill('')); this.fullData[0]=['Column 1','Column 2','Column 3','Column 4']; this.currentData=this.fullData.slice(0,15); this.merges=this.detectMergedGroups(this.currentData,{detectHorizontal:true}); this.updateDataGrid(); }
	updateDataGrid(){ const grid=document.getElementById('data-grid'); if(!grid) return; grid.innerHTML=''; this.renderGridWithMerges(grid,this.currentData,this.merges||[]); grid.querySelectorAll('tr').forEach((tr,r)=>{ tr.querySelectorAll('td').forEach((td,c)=>{ this.addCellEventListeners(td,r,c); }); }); this.scheduleAutoProcess(); const fab=document.getElementById('open-full-editor-fab'); if (fab){ const rows=Array.isArray(this.fullData)?this.fullData.length:0; const cols=rows>0?(this.fullData[0]?.length||0):0; fab.style.display = rows*cols>2000?'inline-flex':'none'; } }
	setupFileUpload(){ const uploadZone=document.getElementById('upload-zone'); const fileInput=document.getElementById('file-input'); if(!uploadZone||!fileInput) return; uploadZone.addEventListener('click',()=>fileInput.click()); uploadZone.addEventListener('dragover',(e)=>{e.preventDefault(); uploadZone.classList.add('dragover');}); uploadZone.addEventListener('dragleave',()=>uploadZone.classList.remove('dragover')); uploadZone.addEventListener('drop',(e)=>{e.preventDefault(); uploadZone.classList.remove('dragover'); const files=e.dataTransfer.files; if (files.length>0) this.handleFileUpload(files[0]);}); fileInput.addEventListener('change',(e)=>{ if (e.target.files.length>0) this.handleFileUpload(e.target.files[0]); }); }
	handleFileUpload(file){ const MAX=5*1024*1024; if (file.size>MAX){ this.showAlert('File is too large. Please upload files up to 5MB.','error'); return;} const reader=new FileReader(); reader.onload=(e)=>{ try{ if (file.name.endsWith('.csv')) this.processCSV(new TextDecoder().decode(e.target.result)); else this.processExcel(e.target.result); this.showAlert(`File "${file.name}" loaded successfully`,'success'); this.scheduleAutoProcess(); }catch(err){ console.error(err); this.showAlert('Error processing file. Please check the format.','error'); } }; reader.readAsArrayBuffer(file); }
	processCSV(content){ const text=typeof content==='string'?content:new TextDecoder().decode(content); const lines=text.split('\n'); const matrix=lines.map(line=> line.split(',').map(cell=>cell.trim().replace(/"/g,''))).filter(row=>row.some(cell=>cell!=='')); this.fullData=matrix; this.currentData=matrix.slice(0,15); this.merges=this.detectMergedGroups(this.currentData,{detectHorizontal:true}); this.updateDataGrid(); this.scheduleAutoProcess(); }
	processExcel(content){ const workbook=XLSX.read(content,{type:'array'}); const firstSheet=workbook.Sheets[workbook.SheetNames[0]]; const matrix=XLSX.utils.sheet_to_json(firstSheet,{header:1}); this.fullData=matrix; this.currentData=matrix.slice(0,15); this.merges=this.detectMergedGroups(this.currentData,{detectHorizontal:true}); this.updateDataGrid(); this.__isDirty=true; this.setCheckResultsBadge(true); this.scheduleAutoProcess(); }
	setupDataGridEvents(){ const grid=document.getElementById('data-grid'); if(!grid) return; grid.addEventListener('keydown',(e)=>{ if(e.key==='Delete'||e.key==='Backspace'){ e.preventDefault(); this.handleCellDeletion(e);} }); grid.addEventListener('paste',(e)=>{ e.preventDefault(); const html=e.clipboardData.getData('text/html'); if (html && /<table[\s\S]*?>[\s\S]*?<\/table>/i.test(html)){ try{ const {matrix}=this.parseHtmlTableFromClipboard(html); this.fullData=matrix; this.currentData=matrix.slice(0,15); this.merges=this.detectMergedGroups(this.currentData,{detectHorizontal:true}); this.updateDataGrid(); this.showAlert('Data imported from HTML table','success'); this.scheduleAutoProcess(); return; }catch(err){ console.warn('HTML paste parse failed, fallback to TSV', err);} } const text=e.clipboardData.getData('text'); this.parsePastedData(text); }); grid.addEventListener('input',(e)=>{ if (e.target.tagName==='TD'){ const rowIndex=Array.from(e.target.parentNode.parentNode.children).indexOf(e.target.parentNode); const cellIndex=Array.from(e.target.parentNode.children).indexOf(e.target); if (this.currentData[rowIndex] && this.currentData[rowIndex][cellIndex]!==undefined){ this.currentData[rowIndex][cellIndex]=e.target.textContent; } clearTimeout(this.__recheckTimer); this.__recheckTimer=setTimeout(()=>{ this.merges=this.detectMergedGroups(this.currentData,{detectHorizontal:true}); this.updateDataGrid(); },120); this.__isDirty=true; this.setCheckResultsBadge(true); this.scheduleAutoProcess(); } }); }
	handleCellDeletion(e){ const target=e.target; const selection=window.getSelection(); const selectedText=selection.toString(); const gridText=document.getElementById('data-grid').textContent; if (selectedText.trim().length >= gridText.trim().length*0.8){ this.resetToEmptyGrid(); } else if (target.tagName==='TD'){ const rowIndex=Array.from(target.parentNode.parentNode.children).indexOf(target.parentNode); const cellIndex=Array.from(target.parentNode.children).indexOf(target); target.textContent=''; this.currentData[rowIndex][cellIndex]=''; target.classList.remove('merged-cell','merged-cell-placeholder'); target.removeAttribute('data-merged-value'); } }
	resetToEmptyGrid(){ this.fullData=Array(5).fill().map(()=>Array(4).fill('')); this.fullData[0]=['Column 1','Column 2','Column 3','Column 4']; this.currentData=this.fullData.slice(0,15); this.merges=[]; this.processedData=[]; clearTimeout(this.__autoTimer); this.__autoTimer=null; this.updateDataGrid(); const resultsSection=document.getElementById('results-section'); if (resultsSection) resultsSection.style.display='none'; const checkBtn=document.getElementById('check-results'); if (checkBtn){ checkBtn.style.display='none'; checkBtn.disabled=true; checkBtn.removeAttribute('data-new'); } const regenBtn=document.getElementById('regenerate-results'); if (regenBtn) regenBtn.style.display='none'; setTimeout(()=>{ const first=document.querySelector('#data-grid tr:nth-child(2) td:first-child'); if(first) first.focus(); },50); this.showAlert('Grid cleared and ready for new data','info'); }
	addCellEventListeners(td,rowIndex,cellIndex){ let updateTimeout; td.addEventListener('input',()=>{ clearTimeout(updateTimeout); updateTimeout=setTimeout(()=>{ this.currentData[rowIndex][cellIndex]=td.textContent; if (this.fullData[rowIndex]){ if (!Array.isArray(this.fullData[rowIndex])) this.fullData[rowIndex]=[]; this.fullData[rowIndex][cellIndex]=td.textContent; } if (td.classList.contains('merged-cell-placeholder')){ td.classList.remove('merged-cell-placeholder'); td.removeAttribute('data-merged-value'); } this.__isDirty=true; this.setCheckResultsBadge(true); this.scheduleAutoProcess(); },100); }); td.addEventListener('keydown',(e)=>{ if (e.key==='Delete'||e.key==='Backspace'){ e.stopPropagation(); } }); }
	scheduleAutoProcess(){ if (!this.currentData||this.currentData.length===0) return; clearTimeout(this.__autoTimer); const cells=((this.fullData?.length||0)*(this.fullData?.[0]?.length||0))||0; const isSmall=cells<=2000; const regenBtn=document.getElementById('regenerate-results'); if (!isSmall){ if (regenBtn) regenBtn.style.display='inline-block'; return; } else { if (regenBtn) regenBtn.style.display='none'; } let delay=500; if (cells>10000) delay=800; this.__autoTimer=setTimeout(()=>{ this.processData('both'); },delay); }
	parsePastedData(text){ const lines=text.replace(/\r\n?|\n/g,'\n').split('\n'); const data=lines.map(line=> line.split('\t').map(cell=>cell.trim())); const filtered=data.filter(row=>row.some(cell=>cell!=='')); this.fullData=filtered; this.currentData=filtered.slice(0,15); this.merges=this.detectMergedGroups(this.currentData,{detectHorizontal:true}); this.updateDataGrid(); this.showAlert('Data pasted successfully','success'); this.__isDirty=true; this.setCheckResultsBadge(true); this.scheduleAutoProcess(); }
	copyResults(){ if (!this.processedData.length){ this.showAlert('No results to copy','error'); return;} const text=this.processedData.map(row=>row.join('\t')).join('\n'); navigator.clipboard.writeText(text).then(()=>{ this.showAlert('Results copied to clipboard','success'); }).catch(()=>{ this.showAlert('Failed to copy results','error'); }); }
	downloadExcel(){ if (!this.processedData.length){ this.showAlert('No results to download','error'); return;} const ws=XLSX.utils.aoa_to_sheet(this.processedData); const wb=XLSX.utils.book_new(); XLSX.utils.book_append_sheet(wb,ws,'Processed Data'); XLSX.writeFile(wb,'unmerge-fill-results.xlsx'); this.showAlert('Excel file downloaded','success'); }
	downloadCSV(){ if (!this.processedData.length){ this.showAlert('No results to download','error'); return;} const csv=this.processedData.map(row=> row.map(cell=>`"${cell}"`).join(',')).join('\n'); const blob=new Blob([csv],{type:'text/csv'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='unmerge-fill-results.csv'; a.click(); URL.revokeObjectURL(url); this.showAlert('CSV file downloaded','success'); }
	parseHtmlTableFromClipboard(html){ const parser=new DOMParser(); const doc=parser.parseFromString(html,'text/html'); const table=doc.querySelector('table'); if(!table) throw new Error('No table'); const rows=Array.from(table.rows); const totalCols=rows.reduce((max,tr)=>{ const count=Array.from(tr.cells).reduce((c,td)=>c+(parseInt(td.colSpan||1)),0); return Math.max(max,count); },0); const matrix=Array.from({length:rows.length},()=>Array(totalCols).fill('')); const occupied=Array.from({length:rows.length},()=>Array(totalCols).fill(false)); rows.forEach((tr,r)=>{ let cIndex=0; Array.from(tr.cells).forEach(td=>{ while(cIndex<totalCols && occupied[r][cIndex]) cIndex++; const rs=parseInt(td.rowSpan||1); const cs=parseInt(td.colSpan||1); const value=(td.textContent||'').trim(); matrix[r][cIndex]=value; if (rs>1||cs>1){ for(let rr=r; rr<r+rs; rr++){ for(let cc=cIndex; cc<cIndex+cs; cc++) occupied[rr][cc]=true; } } else occupied[r][cIndex]=true; cIndex+=cs; }); }); return { matrix: this.ensureRectangular(matrix) } }
	ensureRectangular(matrix){ const maxCols=matrix.reduce((m,row)=>Math.max(m,row.length),0); return matrix.map(row=>{ const out=row.slice(); while(out.length<maxCols) out.push(''); return out; }); }
	openEditorModal(){ const modal=document.getElementById('modal-editor'); const container=document.getElementById('large-grid-container'); if(!modal||!container) return; container.innerHTML='<table class="excel-grid" id="large-grid" contenteditable="true"></table>'; const table=container.querySelector('#large-grid'); const merges=this.detectMergedGroups((Array.isArray(this.fullData)&&this.fullData.length?this.fullData:this.currentData),{detectHorizontal:true}); this.renderGridWithMerges(table,(this.fullData&&this.fullData.length?this.fullData:this.currentData),merges); modal.style.display='flex'; }
	closeEditorModal(){ const modal=document.getElementById('modal-editor'); if (modal) modal.style.display='none'; }
	detectMergedGroups(matrix,{detectHorizontal=true}={}){ const merges=[]; const rows=matrix.length; const cols=rows?matrix[0].length:0; let id=0; for(let c=0;c<cols;c++){ let r=0; while(r<rows){ const v=(matrix[r][c]||'').trim(); if (v!==''){ let r2=r+1; let empty=0; while(r2<rows && (matrix[r2][c]||'').trim()===''){ const hasOther=matrix[r2].some((cell,cc)=>cc!==c && (cell||'').trim()!==''); if (!hasOther) break; empty++; r2++; } if (empty>0){ merges.push({id:`m${id++}`,top:r,left:c,rowSpan:empty+1,colSpan:1,value:v}); r=r2; continue; } } r++; } } if (detectHorizontal){ for(let r=0;r<rows;r++){ const nonEmpty=matrix[r].filter(x=>(x||'').trim()!=='').length; const ratio=nonEmpty/(cols||1); const thr=r<=3?0.05:0.3; if (ratio<thr) continue; let c=0; while(c<cols){ const v=(matrix[r][c]||'').trim(); if (v!==''){ let c2=c+1; let empty=0; while(c2<cols && (matrix[r][c2]||'').trim()===''){ empty++; c2++; } if (empty>0){ merges.push({id:`m${id++}`,top:r,left:c,rowSpan:1,colSpan:empty+1,value:v}); c=c2; continue; } } c++; } } } return merges; }
	renderGridWithMerges(grid,matrix,merges){ grid.innerHTML=''; matrix.forEach((row,r)=>{ const tr=document.createElement('tr'); row.forEach((cell,c)=>{ const td=document.createElement('td'); td.contentEditable=true; td.textContent=cell||''; const hit=merges.find(m=> r>=m.top && r<m.top+m.rowSpan && c>=m.left && c<m.left+m.colSpan); if (hit){ if (r===hit.top && c===hit.left) td.classList.add('merged-cell'); else { td.classList.add('merged-cell-placeholder'); td.setAttribute('data-merged-value', hit.value); } } tr.appendChild(td); }); grid.appendChild(tr); }); }
	expandMergesForConvert(model,{keepTrueBlank=true}={}){ const {matrix,merges}=model; const out=matrix.map(row=>row.slice()); merges.forEach(m=>{ for(let r=m.top; r<m.top+m.rowSpan; r++){ for(let c=m.left; c<m.left+m.colSpan; c++){ const isAnchor=r===m.top && c===m.left; if (!isAnchor){ if (keepTrueBlank){ if ((out[r][c]||'').trim()==='') out[r][c]=m.value; } else out[r][c]=m.value; } } } }); return out; }
	extractTableData(){ const grid=document.getElementById('data-grid'); const rows=grid.querySelectorAll('tr'); const matrix=[]; rows.forEach(tr=>{ const row=[]; tr.querySelectorAll('td').forEach(td=>row.push(td.textContent.trim())); if (row.some(v=>v!=='')) matrix.push(row); }); this.currentData=matrix; if (!Array.isArray(this.fullData)) this.fullData=[]; for(let r=0;r<matrix.length;r++){ if (!Array.isArray(this.fullData[r])) this.fullData[r]=[]; for(let c=0;c<matrix[r].length;c++){ this.fullData[r][c]=matrix[r][c]; } } }
}

document.addEventListener('DOMContentLoaded', () => { initializeNavigationDropdown(); window.unmergeFillTool = new UnmergeFillTool(); });

function toggleFAQ(element){ const answer=element.nextElementSibling; const toggle=element.querySelector('.faq-toggle'); if (answer.style.display==='block'){ answer.style.display='none'; toggle.textContent='+'; element.classList.remove('active'); } else { answer.style.display='block'; toggle.textContent='−'; element.classList.add('active'); } }


