document.addEventListener('DOMContentLoaded', () => {
    // State management
    let state = {
        mode: 'local', // 'local' or 'wayback'
        slots: [
            { type: null, value: null, label: 'None selected' },
            { type: null, value: null, label: 'None selected' }
        ],
        waybackSnapshots: [],
        history: JSON.parse(localStorage.getItem('pdf_diff_history') || '[]')
    };

    // Elements
    const elements = {
        tabs: document.querySelectorAll('.tab-btn'),
        tabContents: document.querySelectorAll('.tab-content'),
        dropZones: [
            { zone: document.getElementById('drop-1'), input: document.getElementById('file-1'), nameEl: document.querySelector('#drop-1 .file-name') },
            { zone: document.getElementById('drop-2'), input: document.getElementById('file-2'), nameEl: document.querySelector('#drop-2 .file-name') }
        ],
        waybackUrl: document.getElementById('wayback-url'),
        wideSearch: document.getElementById('wide-search'),
        searchBtn: document.getElementById('search-btn'),
        snapshotsList: document.getElementById('snapshots-list'),
        selectionSummary: {
            slots: [
                document.getElementById('slot-1-summary').querySelector('.slot-value'),
                document.getElementById('slot-2-summary').querySelector('.slot-value')
            ]
        },
        compareBtn: document.getElementById('compare-btn'),
        loader: document.getElementById('loader'),
        results: document.getElementById('results'),
        diffOutput: document.getElementById('diff-output'),
        stats: {
            area: document.getElementById('stats-area'),
            add: document.getElementById('stat-add'),
            del: document.getElementById('stat-del'),
            chg: document.getElementById('stat-chg')
        },
        downloadBtn: document.getElementById('download-btn'),
        historyList: document.getElementById('history-list')
    };

    // --- Initialization ---
    renderHistory();
    updateUI();

    // --- Tabs ---
    elements.tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            const mode = tab.dataset.tab;
            state.mode = mode;
            elements.tabs.forEach(t => t.classList.toggle('active', t === tab));
            elements.tabContents.forEach(c => c.classList.toggle('active', c.id === `${mode}-section`));
        });
    });

    // --- Local Files ---
    elements.dropZones.forEach((d, index) => {
        d.zone.addEventListener('click', (e) => {
            if (e.target.closest('.view-icon-btn')) {
                e.stopPropagation();
                const slot = state.slots[index];
                if (slot.previewUrl) window.open(slot.previewUrl, '_blank');
                return;
            }
            d.input.click();
        });
        d.input.addEventListener('change', (e) => handleFile(e.target.files[0], index));
        
        ['dragover', 'dragleave', 'drop'].forEach(evt => {
            d.zone.addEventListener(evt, (e) => {
                e.preventDefault();
                if (evt === 'dragover') d.zone.classList.add('active');
                else d.zone.classList.remove('active');
                if (evt === 'drop') handleFile(e.dataTransfer.files[0], index);
            });
        });
    });

    function handleFile(file, index) {
        if (file && file.type === 'application/pdf') {
            const previewUrl = URL.createObjectURL(file);
            state.slots[index] = { type: 'file', value: file, label: file.name, previewUrl };
            updateUI();
        } else {
            alert('Please select a valid PDF file.');
        }
    }

    // --- Wayback Search ---
    elements.searchBtn.addEventListener('click', async () => {
        const url = elements.waybackUrl.value.trim();
        if (!url) return alert('Please enter a URL');

        elements.searchBtn.disabled = true;
        elements.searchBtn.textContent = 'Searching Archive...';
        elements.snapshotsList.innerHTML = '';

        const statusTimer = setTimeout(() => {
            elements.searchBtn.textContent = 'Archive is slow, still searching...';
        }, 5000);

        try {
            const response = await fetch('/archive-search', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    url,
                    wide: elements.wideSearch.checked 
                })
            });
            const data = await response.json();

            if (response.ok) {
                state.waybackSnapshots = data.results;
                if (data.results.length === 0) {
                    elements.snapshotsList.innerHTML = '<p class="text-muted">No PDF snapshots found for this URL.</p>';
                } else {
                    renderSnapshots();
                }
            } else {
                if (response.status === 504) {
                    alert('The Wayback Machine is taking too long to respond. This usually means their servers are busy. Please try again in a few moments.');
                } else {
                    alert(data.error || 'Search failed. The Archive might be temporarily unreachable.');
                }
            }
        } catch (err) {
            alert('Failed to connect to the server. Please check your internet connection.');
        } finally {
            clearTimeout(statusTimer);
            elements.searchBtn.disabled = false;
            elements.searchBtn.textContent = 'Search Archive';
        }
    });

    function renderSnapshots() {
        elements.snapshotsList.innerHTML = state.waybackSnapshots.map((snap, i) => {
            const date = parseWaybackDate(snap.timestamp);
            return `
                <div class="snapshot-item" data-index="${i}">
                    <div class="snapshot-filename" title="${snap.original_url}">${snap.filename}</div>
                    <span class="snapshot-date">${date.date}</span>
                    <span class="snapshot-time">${date.time}</span>
                    <a href="${snap.url}" target="_blank" class="view-link" onclick="event.stopPropagation()">View Original</a>
                </div>
            `;
        }).join('');

        elements.snapshotsList.querySelectorAll('.snapshot-item').forEach(item => {
            item.addEventListener('click', () => {
                const index = parseInt(item.dataset.index);
                handleSnapshotSelection(index);
            });
        });
        updateUI(); // Reflect any active selections in newly rendered list
    }

    function handleSnapshotSelection(index) {
        const snap = state.waybackSnapshots[index];
        const snapLabel = `Archive: ${parseWaybackDate(snap.timestamp).date}`;
        
        // Find existing selection if any
        const existingSlotIndex = state.slots.findIndex(s => s.type === 'url' && s.value === snap.url);
        
        if (existingSlotIndex !== -1) {
            // Deselect
            state.slots[existingSlotIndex] = { type: null, value: null, label: 'None selected' };
        } else {
            // Select in first available slot
            const targetSlotIndex = state.slots.findIndex(s => s.type === null);
            if (targetSlotIndex !== -1) {
                state.slots[targetSlotIndex] = { type: 'url', value: snap.url, label: snapLabel };
            } else {
                // Replace Slot 2
                state.slots[1] = { type: 'url', value: snap.url, label: snapLabel };
            }
        }
        updateUI();
    }

    function updateUI() {
        // Update selection summary
        state.slots.forEach((slot, i) => {
            elements.selectionSummary.slots[i].textContent = slot.label;
        });

        // Update Compare button
        elements.compareBtn.disabled = !(state.slots[0].value && state.slots[1].value);

        // Update Visual Selection in tabs
        elements.dropZones.forEach((d, i) => {
            const isSelected = state.slots[i].type === 'file';
            d.zone.classList.toggle('file-ready', isSelected);
        });

        if (state.waybackSnapshots.length > 0) {
            elements.snapshotsList.querySelectorAll('.snapshot-item').forEach(item => {
                const index = parseInt(item.dataset.index);
                const snap = state.waybackSnapshots[index];
                const isSelected = state.slots.some(s => s.type === 'url' && s.value === snap.url);
                item.classList.toggle('selected', isSelected);
            });
        }
    }

    function parseWaybackDate(ts) {
        const year = ts.substring(0, 4);
        const month = ts.substring(4, 6);
        const day = ts.substring(6, 8);
        const hour = ts.substring(8, 10);
        const min = ts.substring(10, 12);
        const dateObj = new Date(`${year}-${month}-${day}T${hour}:${min}:00Z`);
        return {
            date: dateObj.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' }),
            time: dateObj.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' }),
            full: dateObj.toLocaleString()
        };
    }

    // --- Comparison Logic ---
    elements.compareBtn.addEventListener('click', async () => {
        elements.compareBtn.disabled = true;
        elements.loader.style.display = 'block';
        elements.results.classList.remove('visible');
        
        const body = new FormData();
        state.slots.forEach((slot, i) => {
            const key = i === 0 ? 'file1' : 'file2';
            const urlKey = i === 0 ? 'url1' : 'url2';
            if (slot.type === 'file') {
                body.append(key, slot.value);
            } else {
                body.append(urlKey, slot.value);
            }
        });

        try {
            const response = await fetch('/compare', {
                method: 'POST',
                body: body
            });
            const data = await response.json();

            if (response.ok) {
                elements.diffOutput.innerHTML = data.diff;
                elements.stats.add.textContent = data.stats.add;
                elements.stats.del.textContent = data.stats.del;
                elements.stats.chg.textContent = data.stats.chg;
                
                elements.results.classList.add('visible');
                elements.results.scrollIntoView({ behavior: 'smooth' });

                addToHistory(data.stats);
            } else {
                alert(data.error || 'Comparison failed');
            }
        } catch (err) {
            alert('Failed to connect to server');
        } finally {
            elements.loader.style.display = 'none';
            elements.compareBtn.disabled = false;
        }
    });

    // --- History ---
    function addToHistory(stats) {
        const item = {
            id: Date.now(),
            date: new Date().toLocaleString(),
            stats: stats,
            label: `${state.slots[0].label} vs ${state.slots[1].label}`
        };
        state.history.unshift(item);
        if (state.history.length > 5) state.history.pop();
        localStorage.setItem('pdf_diff_history', JSON.stringify(state.history));
        renderHistory();
    }

    function renderHistory() {
        if (state.history.length === 0) {
            elements.historyList.innerHTML = '<p class="text-muted">No recent comparisons yet.</p>';
            return;
        }
        elements.historyList.innerHTML = state.history.map(item => `
            <div class="history-item">
                <div class="history-info">
                    <span class="history-title">${item.label}</span>
                    <span class="history-date">${item.date}</span>
                </div>
                <div class="history-stats">
                    <span style="color:#10b981">+${item.stats.add}</span>
                    <span style="color:#ef4444">-${item.stats.del}</span>
                </div>
            </div>
        `).join('');
    }

    // --- Export ---
    elements.downloadBtn.addEventListener('click', () => {
        const diffContent = elements.diffOutput.innerHTML;
        const stats = {
            add: elements.stats.add.textContent,
            del: elements.stats.del.textContent,
            chg: elements.stats.chg.textContent
        };
        
        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>PDF Comparison Report</title>
                <style>
                    body { font-family: sans-serif; padding: 40px; color: #333; background: #f1f5f9; }
                    .report-card { background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1); }
                    .stats { display: flex; gap: 20px; margin-bottom: 30px; padding: 20px; background: #f8fafc; border-radius: 8px; border: 1px solid #e2e8f0; }
                    .stat { font-weight: bold; font-family: monospace; }
                    .diff { width: 100%; border-collapse: collapse; font-family: monospace; font-size: 14px; }
                    .diff td { padding: 8px; border-bottom: 1px solid #edf2f7; }
                    .diff_header { background: #f7fafc; color: #718096; width: 40px; text-align: right; user-select: none; }
                    .diff_add { background: #dcfce7; }
                    .diff_sub { background: #fee2e2; }
                    .diff_chg { background: #fef3c7; }
                </style>
            </head>
            <body>
                <div class="report-card">
                    <h1>PDF Comparison Report</h1>
                    <p style="color: #64748b; margin-bottom: 2rem;">Generated on ${new Date().toLocaleString()}</p>
                    <div class="stats">
                        <div class="stat" style="color:#10b981">Additions: ${stats.add}</div>
                        <div class="stat" style="color:#ef4444">Deletions: ${stats.del}</div>
                        <div class="stat" style="color:#f59e0b">Changes: ${stats.chg}</div>
                    </div>
                </div>
                <div style="margin-top: 2rem; background: white; padding: 20px; border-radius: 12px;">
                    ${diffContent}
                </div>
            </body>
            </html>
        `;
        
        const blob = new Blob([html], { type: 'text/html' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `pdf_diff_report_${Date.now()}.html`;
        a.click();
    });
});
