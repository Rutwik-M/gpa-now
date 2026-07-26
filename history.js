document.addEventListener('DOMContentLoaded', () => {

    const historyList  = document.getElementById('history-records-list');
    const historyCount = document.getElementById('history-count');
    const btnClearAll  = document.getElementById('btn-clear-all');

    const TYPE_META = {
        semester: { icon: 'fa-solid fa-graduation-cap', label: 'Semester', color: 'text-indigo-500' },
        cgpa:     { icon: 'fa-solid fa-layer-group',    label: 'CGPA',     color: 'text-emerald-500' },
        convert:  { icon: 'fa-solid fa-percent',         label: 'Convert',  color: 'text-amber-500'   },
    };

    function getRecords() { return JSON.parse(localStorage.getItem('cgpaRecords') || '[]'); }
    function setRecords(r) { localStorage.setItem('cgpaRecords', JSON.stringify(r)); }

    function loadHistory() {
        const records = getRecords();
        historyCount.textContent = `${records.length} record${records.length !== 1 ? 's' : ''}`;
        btnClearAll.classList.toggle('hidden', records.length === 0);

        if (records.length === 0) {
            historyList.innerHTML = `
                <div class="flex flex-col items-center justify-center py-16 text-center">
                    <i class="fa-regular fa-folder-open text-4xl text-[#DEDAD6] mb-3"></i>
                    <p class="text-sm text-[#C8C6C2] italic">No records saved yet.</p>
                    <a href="index.html" class="mt-4 text-xs font-medium text-[#1A1918] underline underline-offset-2">Go to calculator →</a>
                </div>`;
            return;
        }

        historyList.innerHTML = '';

        records.forEach(record => {
            const meta     = TYPE_META[record.type] || TYPE_META.convert;
            const hasCourses = record.type === 'semester' && record.courses && record.courses.length > 0;
            const hasSems    = record.type === 'cgpa' && record.semesters && record.semesters.length > 0;
            const isExpandable = hasCourses || hasSems;

            // Wrapper (row + detail panel)
            const wrapper = document.createElement('div');

            // Main row
            const row = document.createElement('div');
            row.className = 'grid grid-cols-12 gap-2 items-center px-5 py-3 record-row';
            row.innerHTML = `
                <!-- Expand chevron -->
                <div class="col-span-1 flex justify-center">
                    ${isExpandable
                        ? `<button class="expand-btn text-[#C8C6C2] hover:text-[#1A1918] transition-colors p-1">
                               <i class="fa-solid fa-chevron-right text-[9px] transition-transform duration-200"></i>
                           </button>`
                        : `<span class="w-5 h-5"></span>`}
                </div>
                <!-- Name + date -->
                <div class="col-span-4 min-w-0">
                    <p class="text-sm font-medium text-[#1A1918] truncate">${record.name}</p>
                    <p class="text-[9px] text-[#C8C6C2] mt-0.5">${record.date}</p>
                </div>
                <!-- Type badge -->
                <div class="col-span-2 flex justify-center">
                    <span class="inline-flex items-center gap-1 text-[9px] font-semibold px-2 py-0.5 rounded-full bg-[#F5F4F0] border border-[#ECEAE5] ${meta.color}">
                        <i class="${meta.icon} text-[8px]"></i> ${meta.label}
                    </span>
                </div>
                <!-- GPA -->
                <div class="col-span-2 text-center">
                    <p class="text-sm font-playfair font-medium text-[#1A1918]">${record.gpa}</p>
                </div>
                <!-- % -->
                <div class="col-span-2 text-center">
                    <span class="inline-block text-xs font-medium text-[#6B6965] bg-[#F5F4F0] border border-[#ECEAE5] px-2 py-0.5 rounded-md">${record.percentage}%</span>
                </div>
                <!-- Delete -->
                <div class="col-span-1 flex justify-end">
                    <button class="del-btn text-[#D6D4D0] hover:text-red-400 transition-colors p-1">
                        <i class="fa-regular fa-trash-can text-xs"></i>
                    </button>
                </div>`;

            // Detail panel (hidden by default)
            const detail = document.createElement('div');
            detail.className = 'detail-panel hidden px-5 pb-4 pt-3 bg-[#FAFAF7]';

            if (hasCourses) {
                let rows = record.courses.map(c => `
                    <tr class="border-b border-[#F5F4F0] last:border-0">
                        <td class="py-1.5 text-xs text-[#1A1918]">${c.name || '—'}</td>
                        <td class="py-1.5 text-xs text-center text-[#6B6965]">${c.credits}</td>
                        <td class="py-1.5 text-center">
                            <span class="inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded bg-[#EEECEA] text-[#1A1918]">${c.grade}</span>
                        </td>
                        <td class="py-1.5 text-xs text-right text-[#6B6965]">${c.gradePoints}</td>
                        <td class="py-1.5 text-xs text-right text-[#6B6965]">${(c.credits * c.gradePoints).toFixed(0)}</td>
                    </tr>`).join('');
                detail.innerHTML = `
                    <div class="ml-6 border border-[#ECEAE5] rounded-lg overflow-hidden bg-white">
                        <table class="w-full">
                            <thead>
                                <tr class="bg-[#F8F7F4] border-b border-[#ECEAE5]">
                                    <th class="text-left px-3 py-1.5 text-[9px] font-semibold text-[#C8C6C2] uppercase tracking-widest">Subject</th>
                                    <th class="px-3 py-1.5 text-[9px] font-semibold text-[#C8C6C2] uppercase tracking-widest text-center">Cr</th>
                                    <th class="px-3 py-1.5 text-[9px] font-semibold text-[#C8C6C2] uppercase tracking-widest text-center">Grade</th>
                                    <th class="px-3 py-1.5 text-[9px] font-semibold text-[#C8C6C2] uppercase tracking-widest text-right">GP</th>
                                    <th class="px-3 py-1.5 text-[9px] font-semibold text-[#C8C6C2] uppercase tracking-widest text-right">EGP</th>
                                </tr>
                            </thead>
                            <tbody class="px-3">${rows}</tbody>
                            <tfoot>
                                <tr class="bg-[#F8F7F4] border-t border-[#ECEAE5]">
                                    <td colspan="3" class="px-3 py-1.5 text-[10px] font-semibold text-[#6B6965]">Total</td>
                                    <td class="px-3 py-1.5 text-xs font-semibold text-[#1A1918] text-right">${record.totalCredits} cr</td>
                                    <td class="px-3 py-1.5 text-xs font-semibold text-[#1A1918] text-right">${Number(record.totalEgp).toFixed(0)}</td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>`;
            } else if (hasSems) {
                const allRecords = getRecords();
                const semNames   = record.semesters.map(id => {
                    const sem = allRecords.find(r => r.id === id);
                    return sem ? `<span class="inline-flex items-center gap-1 text-xs bg-[#F0EEE9] px-2 py-0.5 rounded-md text-[#1A1918]"><i class="fa-solid fa-graduation-cap text-[9px] text-indigo-400"></i>${sem.name}</span>` : '';
                }).filter(Boolean).join('');
                detail.innerHTML = `
                    <div class="ml-6">
                        <p class="text-[9px] font-semibold text-[#C8C6C2] uppercase tracking-[0.15em] mb-2">Combined from ${record.semesters.length} semester${record.semesters.length !== 1 ? 's' : ''}:</p>
                        <div class="flex flex-wrap gap-1.5">${semNames || '<span class="text-xs text-[#C8C6C2] italic">Semesters no longer available</span>'}</div>
                        <p class="text-[9px] text-[#C8C6C2] mt-2">Total credits: ${record.totalCredits}</p>
                    </div>`;
            }

            // Wire expand toggle
            if (isExpandable) {
                const expandBtn = row.querySelector('.expand-btn');
                const chevron   = expandBtn.querySelector('i');
                expandBtn.addEventListener('click', () => {
                    const isOpen = detail.classList.toggle('hidden');
                    chevron.style.transform = isOpen ? '' : 'rotate(90deg)';
                });
            }

            // Wire delete
            row.querySelector('.del-btn').addEventListener('click', () => {
                if (!confirm('Delete this record?')) return;
                setRecords(getRecords().filter(r => r.id !== record.id));
                loadHistory();
            });

            wrapper.appendChild(row);
            wrapper.appendChild(detail);
            historyList.appendChild(wrapper);
        });
    }

    btnClearAll?.addEventListener('click', () => {
        if (confirm('Delete ALL records? This cannot be undone.')) {
            localStorage.removeItem('cgpaRecords');
            loadHistory();
        }
    });

    loadHistory();
});
