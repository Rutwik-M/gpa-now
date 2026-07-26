document.addEventListener('DOMContentLoaded', () => {

    //  DOM REFERENCES

    // Sidebar nav buttons (desktop)
    const navBtns = document.querySelectorAll('[id^="nav-"]');
    // Mobile tab buttons
    const mobTabs = document.querySelectorAll('[id^="mob-tab-"]');
    // All section panels
    const sections = {
        'section-convert':   document.getElementById('section-convert'),
        'section-calculate': document.getElementById('section-calculate'),
        'section-cgpa':      document.getElementById('section-cgpa'),
    };

    // Convert section
    const directCgpaInput       = document.getElementById('direct-cgpa');
    const btnConvert             = document.getElementById('btn-convert');
    const convertResultContainer = document.getElementById('convert-result-container');
    const convertPercentageValue = document.getElementById('convert-percentage-value');
    const saveNameConvert        = document.getElementById('save-name-convert');
    const btnSaveConvert         = document.getElementById('btn-save-convert');

    // Calculate section
    const btnAddCourse       = document.getElementById('btn-add-course');
    const courseList         = document.getElementById('course-list');
    const btnCalculate       = document.getElementById('btn-calculate');
    const calcResultContainer= document.getElementById('calc-result-container');
    const calcGpaValue       = document.getElementById('calc-gpa-value');
    const calcTotalEgp       = document.getElementById('calc-total-egp');
    const calcPercentageValue= document.getElementById('calc-percentage-value');
    const saveNameCalc       = document.getElementById('save-name-calc');
    const btnSaveCalc        = document.getElementById('btn-save-calc');

    // CGPA combiner section
    const cgpaSemesterList    = document.getElementById('cgpa-semester-list');
    const cgpaResultContainer = document.getElementById('cgpa-result-container');
    const cgpaNoSelection     = document.getElementById('cgpa-no-selection');
    const cgpaValue           = document.getElementById('cgpa-value');
    const cgpaTotalCredits    = document.getElementById('cgpa-total-credits');
    const cgpaPercentage      = document.getElementById('cgpa-percentage');
    const saveNameCgpa        = document.getElementById('save-name-cgpa');
    const btnSaveCgpa         = document.getElementById('btn-save-cgpa');

    // Sidebar records
    const savedRecordsList = document.getElementById('saved-records-list');
    const savedCount       = document.getElementById('saved-count');
    const savedCountMobile = document.getElementById('saved-count-mobile');

    // Mobile reference toggle
    const btnToggleRef   = document.getElementById('btn-toggle-ref');
    const mobileRefDrawer= document.getElementById('mobile-ref-drawer');
    const refIcon        = document.getElementById('ref-icon');

    // State
    let currentCalculation = null; // holds last computed result

    //  SECTION SWITCHING

    function switchSection(targetId) {
        // Hide all sections
        Object.entries(sections).forEach(([id, el]) => {
            el.style.display = 'none';
        });

        // Show target
        const target = sections[targetId];
        if (target) {
            target.style.display = 'flex';
            target.style.flexDirection = 'column';
        }

        // Update desktop sidebar active state
        navBtns.forEach(btn => {
            const isActive = btn.dataset.section === targetId;
            btn.classList.toggle('sidebar-btn-active', isActive);
        });

        // Update mobile tab active state
        mobTabs.forEach(btn => {
            const isActive = btn.dataset.section === targetId;
            btn.classList.toggle('mob-tab-active', isActive);
            btn.classList.toggle('text-[#8C8984]', !isActive);
        });

        // If switching to CGPA combiner, refresh its list
        if (targetId === 'section-cgpa') refreshCgpaSemesterList();
    }

    // Wire up desktop nav
    navBtns.forEach(btn => btn.addEventListener('click', () => switchSection(btn.dataset.section)));
    // Wire up mobile tabs
    mobTabs.forEach(btn => btn.addEventListener('click', () => switchSection(btn.dataset.section)));

    // Initialize: show convert section
    switchSection('section-convert');

    //  SHARED UTILS

    const calcPercentage = (gpa) => Math.max(0, Math.min(100, (gpa - 0.75) * 10)).toFixed(2);

    const gradePoints = { AA: 10, AB: 9, BB: 8, BC: 7, CC: 6, CD: 5, DD: 4, FF: 0 };

    function getRecords() {
        return JSON.parse(localStorage.getItem('cgpaRecords') || '[]');
    }
    function setRecords(records) {
        localStorage.setItem('cgpaRecords', JSON.stringify(records));
    }

    function flashError(el) {
        el.style.borderColor = '#FCA5A5';
        el.focus();
        setTimeout(() => { el.style.borderColor = ''; }, 1600);
    }

    //  CONVERT SECTION

    function doConvert() {
        const gpa = parseFloat(directCgpaInput.value);
        if (isNaN(gpa) || gpa < 0 || gpa > 10) { flashError(directCgpaInput); return; }

        const percentage = calcPercentage(gpa);
        convertPercentageValue.textContent = `${percentage}%`;
        currentCalculation = { gpa: gpa.toFixed(2), percentage, type: 'convert' };

        convertResultContainer.classList.remove('hidden');
        convertResultContainer.classList.add('fade-up');
    }

    btnConvert.addEventListener('click', doConvert);
    directCgpaInput.addEventListener('keydown', e => { if (e.key === 'Enter') doConvert(); });

    //  GRADE CALCULATOR — Course rows

    const courseRowTemplate = () => `
        <div class="course-item grid grid-cols-12 gap-2 items-center">
            <div class="col-span-5 sm:col-span-6">
                <input type="text" class="course-name w-full px-2.5 py-2 text-sm bg-white border border-[#ECEAE5] rounded-lg focus:border-[#1A1918] focus:ring-1 focus:ring-[#1A1918]/10 outline-none placeholder:text-[#D6D4D0] transition-colors" placeholder="Subject">
            </div>
            <div class="col-span-3">
                <input type="number" min="0" step="1" class="course-credit w-full px-2 py-2 text-sm text-center bg-white border border-[#ECEAE5] rounded-lg focus:border-[#1A1918] focus:ring-1 focus:ring-[#1A1918]/10 outline-none placeholder:text-[#D6D4D0] transition-colors" placeholder="Cr">
            </div>
            <div class="col-span-3 sm:col-span-2 relative custom-dropdown">
                <input type="hidden" class="course-grade" value="">
                <div class="dropdown-trigger w-full px-2 py-2 text-sm bg-white border border-[#ECEAE5] rounded-lg cursor-pointer flex justify-between items-center transition-colors">
                    <span class="dropdown-label text-[#C8C6C2]">—</span>
                    <i class="fa-solid fa-chevron-down text-[8px] text-[#C8C6C2]"></i>
                </div>
                <ul class="dropdown-menu absolute z-50 left-0 right-0 top-full mt-1 bg-white border border-[#ECEAE5] rounded-lg shadow-lg hidden py-1">
                    <li class="px-3 py-1.5 text-sm hover:bg-[#F5F4F0] cursor-pointer transition-colors" data-value="AA">AA</li>
                    <li class="px-3 py-1.5 text-sm hover:bg-[#F5F4F0] cursor-pointer transition-colors" data-value="AB">AB</li>
                    <li class="px-3 py-1.5 text-sm hover:bg-[#F5F4F0] cursor-pointer transition-colors" data-value="BB">BB</li>
                    <li class="px-3 py-1.5 text-sm hover:bg-[#F5F4F0] cursor-pointer transition-colors" data-value="BC">BC</li>
                    <li class="px-3 py-1.5 text-sm hover:bg-[#F5F4F0] cursor-pointer transition-colors" data-value="CC">CC</li>
                    <li class="px-3 py-1.5 text-sm hover:bg-[#F5F4F0] cursor-pointer transition-colors" data-value="CD">CD</li>
                    <li class="px-3 py-1.5 text-sm hover:bg-[#F5F4F0] cursor-pointer transition-colors" data-value="DD">DD</li>
                    <li class="px-3 py-1.5 text-sm hover:bg-[#F5F4F0] cursor-pointer transition-colors" data-value="FF">FF</li>
                </ul>
            </div>
            <div class="col-span-1 flex justify-center">
                <button class="btn-remove-course text-[#D6D4D0] hover:text-red-400 transition-colors p-1">
                    <i class="fa-solid fa-xmark text-xs"></i>
                </button>
            </div>
        </div>`;

    btnAddCourse.addEventListener('click', () => {
        courseList.insertAdjacentHTML('beforeend', courseRowTemplate());
        const scrollEl = courseList.closest('.overflow-y-auto');
        if (scrollEl) requestAnimationFrame(() => { scrollEl.scrollTop = scrollEl.scrollHeight; });
        courseList.lastElementChild?.querySelector('.course-name')?.focus();
    });

    courseList.addEventListener('click', e => {
        const btn = e.target.closest('.btn-remove-course');
        if (!btn) return;
        const item = btn.closest('.course-item');
        if (courseList.children.length > 1) {
            item.remove();
        } else {
            item.querySelectorAll('input').forEach(i => i.value = '');
            const dropdownInput = item.querySelector('.course-grade');
            if (dropdownInput) {
                dropdownInput.value = '';
                const label = item.querySelector('.dropdown-label');
                if (label) {
                    label.textContent = '—';
                    label.classList.remove('text-[#1A1918]');
                    label.classList.add('text-[#C8C6C2]');
                }
            }
        }
    });

    // Custom dropdown event delegation
    document.addEventListener('click', e => {
        const trigger = e.target.closest('.dropdown-trigger');
        if (trigger) {
            document.querySelectorAll('.dropdown-menu:not(.hidden)').forEach(m => {
                if (m !== trigger.nextElementSibling) m.classList.add('hidden');
            });
            trigger.nextElementSibling.classList.toggle('hidden');
            return;
        }

        const option = e.target.closest('.dropdown-menu li');
        if (option) {
            const val = option.dataset.value;
            const container = option.closest('.custom-dropdown');
            container.querySelector('.course-grade').value = val;
            const label = container.querySelector('.dropdown-label');
            label.textContent = val;
            label.classList.remove('text-[#C8C6C2]');
            label.classList.add('text-[#1A1918]');
            option.closest('.dropdown-menu').classList.add('hidden');
            return;
        }

        document.querySelectorAll('.dropdown-menu:not(.hidden)').forEach(m => m.classList.add('hidden'));
    });

    // ─── Calculate GPA ───────────────────────────────────────
    btnCalculate.addEventListener('click', () => {
        let totalCredits = 0, totalEgp = 0;
        const courses = [];

        courseList.querySelectorAll('.course-item').forEach(item => {
            const name     = item.querySelector('.course-name').value.trim();
            const credit   = parseFloat(item.querySelector('.course-credit').value);
            const grade    = item.querySelector('.course-grade').value;
            const gp       = gradePoints[grade];

            if (!isNaN(credit) && credit > 0 && gp !== undefined) {
                totalCredits += credit;
                totalEgp     += credit * gp;
                courses.push({ name: name || 'Unnamed', credits: credit, grade, gradePoints: gp });
            }
        });

        if (courses.length === 0 || totalCredits === 0) {
            const orig = btnCalculate.textContent;
            btnCalculate.textContent = '⚠ Add at least one valid course';
            btnCalculate.classList.add('bg-amber-700');
            setTimeout(() => { btnCalculate.textContent = orig; btnCalculate.classList.remove('bg-amber-700'); }, 2000);
            return;
        }

        const gpa = totalEgp / totalCredits;
        const percentage = calcPercentage(gpa);

        calcGpaValue.textContent        = gpa.toFixed(2);
        calcTotalEgp.textContent        = totalEgp.toFixed(0);
        calcPercentageValue.textContent = `${percentage}%`;

        currentCalculation = { gpa: gpa.toFixed(2), percentage, type: 'semester', totalCredits, totalEgp, courses };

        calcResultContainer.classList.remove('hidden');
        calcResultContainer.classList.add('fade-up');
    });

    //  CGPA COMBINER SECTION

    function refreshCgpaSemesterList() {
        const records   = getRecords();
        // Include all records that aren't CGPA-type (covers old records with no type field)
        const semesters = records.filter(r => r.type !== 'cgpa');

        if (semesters.length === 0) {
            cgpaSemesterList.innerHTML = `
                <div class="flex flex-col items-center justify-center py-12 text-center">
                    <i class="fa-solid fa-layer-group text-3xl text-[#DEDAD6] mb-3"></i>
                    <p class="text-sm text-[#C8C6C2] italic">No semester records yet.</p>
                    <p class="text-xs text-[#C8C6C2] mt-1">Calculate and save from the Grade Calc tab first.</p>
                </div>`;
            cgpaResultContainer.classList.add('hidden');
            cgpaNoSelection.classList.remove('hidden');
            return;
        }

        cgpaSemesterList.innerHTML = `
            <p class="text-[10px] font-semibold text-[#C8C6C2] uppercase tracking-[0.15em] mb-3">Select Semesters to Combine</p>
            <div id="sem-checkboxes" class="space-y-2"></div>`;

        const checkboxContainer = document.getElementById('sem-checkboxes');
        semesters.forEach(sem => {
            const hasCredits = sem.totalCredits && sem.totalEgp !== undefined;
            const row = document.createElement('div');
            row.className = 'sem-row flex items-center gap-3 p-3 rounded-xl border border-[#ECEAE5] cursor-pointer select-none';
            row.innerHTML = `
                <input type="checkbox" class="sem-checkbox w-4 h-4 accent-[#1A1918] cursor-pointer flex-shrink-0" data-id="${sem.id}">
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-medium text-[#1A1918] truncate">${sem.name}</p>
                    <p class="sem-subtitle text-[10px] text-[#8C8984]">${sem.date}${hasCredits ? ` · ${sem.totalCredits} cr` : ''}</p>
                </div>
                ${!hasCredits ? `
                <div class="flex items-center gap-1 flex-shrink-0" title="Enter credit count for this semester">
                    <input type="number" class="manual-credits w-14 px-2 py-1 text-xs text-center border border-[#E0DED9] rounded-lg outline-none focus:border-[#1A1918] bg-white" placeholder="Cr" min="1" step="1">
                    <span class="text-[9px] text-[#C8C6C2]">cr</span>
                </div>` : ''}
                <div class="text-right flex-shrink-0">
                    <p class="text-sm font-playfair font-medium text-[#1A1918]">${sem.gpa}</p>
                    <p class="text-[10px] text-[#8C8984]">${sem.percentage}%</p>
                </div>`;
            checkboxContainer.appendChild(row);

            const cb        = row.querySelector('.sem-checkbox');
            const manualCr  = row.querySelector('.manual-credits');

            // Click anywhere on the row (not on manual-credits input) toggles checkbox
            row.addEventListener('click', e => {
                if (e.target === cb || e.target === manualCr) return;
                cb.checked = !cb.checked;
                cb.dispatchEvent(new Event('change'));
            });

            cb.addEventListener('change', () => {
                row.classList.toggle('selected', cb.checked);
                row.style.borderColor = cb.checked ? '#1A1918' : '';
                updateCgpaResult();
            });

            if (manualCr) {
                manualCr.addEventListener('input', () => {
                    const cr = parseFloat(manualCr.value);
                    if (!isNaN(cr) && cr > 0) {
                        // Persist credits to localStorage so they survive page refresh
                        const recs = getRecords();
                        const idx  = recs.findIndex(r => r.id === sem.id);
                        if (idx !== -1) {
                            recs[idx].totalCredits = cr;
                            recs[idx].totalEgp     = parseFloat(sem.gpa) * cr;
                            setRecords(recs);
                            // Update the inline subtitle to confirm
                            const subtitle = row.querySelector('.sem-subtitle');
                            if (subtitle) subtitle.textContent = `${sem.date} · ${cr} cr ✓`;
                        }
                    }
                    if (cb.checked) updateCgpaResult();
                });
            }
        });
    }

    function updateCgpaResult() {
        const checkboxes = document.querySelectorAll('.sem-checkbox:checked');
        if (checkboxes.length === 0) {
            cgpaResultContainer.classList.add('hidden');
            cgpaNoSelection.textContent = 'Select semesters above to see combined CGPA';
            cgpaNoSelection.classList.remove('hidden');
            return;
        }

        const records = getRecords();
        let totalEgp = 0, totalCredits = 0, needsCredits = false;

        checkboxes.forEach(cb => {
            const id  = parseInt(cb.dataset.id);
            const sem = records.find(r => r.id === id);
            if (!sem) return;

            if (sem.totalCredits && sem.totalEgp !== undefined) {
                // New format — use exact stored EGP
                totalEgp     += sem.totalEgp;
                totalCredits += sem.totalCredits;
            } else {
                // Legacy record — use manual credits input
                const row      = cb.closest('.sem-row');
                const manualCr = parseFloat(row?.querySelector('.manual-credits')?.value);
                if (!isNaN(manualCr) && manualCr > 0) {
                    totalEgp     += parseFloat(sem.gpa) * manualCr;
                    totalCredits += manualCr;
                } else {
                    needsCredits = true;
                }
            }
        });

        if (needsCredits) {
            cgpaNoSelection.textContent = '⚠️ Enter credit count for highlighted semester(s)';
            cgpaResultContainer.classList.add('hidden');
            cgpaNoSelection.classList.remove('hidden');
            return;
        }

        if (totalCredits === 0) return;

        const gpa = totalEgp / totalCredits;
        const percentage = calcPercentage(gpa);

        cgpaValue.textContent        = gpa.toFixed(2);
        cgpaTotalCredits.textContent = totalCredits;
        cgpaPercentage.textContent   = `${percentage}%`;

        currentCalculation = {
            gpa: gpa.toFixed(2), percentage, type: 'cgpa',
            semesters: Array.from(checkboxes).map(cb => parseInt(cb.dataset.id)),
            totalCredits
        };

        cgpaNoSelection.classList.add('hidden');
        cgpaResultContainer.classList.remove('hidden');
        cgpaResultContainer.classList.add('fade-up');
    }

    //  SAVE RECORDS

    function saveRecord(nameInput, saveBtn) {
        const name = nameInput.value.trim();
        if (!name) { flashError(nameInput); return; }
        if (!currentCalculation) { return; }

        const records = getRecords();
        const convertCreditsInput = document.getElementById('convert-credits');
        const convertCr = parseFloat(convertCreditsInput?.value);
        const newRecord = {
            id: Date.now(),
            name,
            gpa: currentCalculation.gpa,
            percentage: currentCalculation.percentage,
            date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
            type: currentCalculation.type || 'convert',
            // Include credits in convert-type records if user provided them
            ...((currentCalculation.type === 'convert' && !isNaN(convertCr) && convertCr > 0) && {
                totalCredits: convertCr,
                totalEgp: parseFloat(currentCalculation.gpa) * convertCr,
            }),
            ...(currentCalculation.type === 'semester' && {
                totalCredits: currentCalculation.totalCredits,
                totalEgp: currentCalculation.totalEgp,
                courses: currentCalculation.courses,
            }),
            ...(currentCalculation.type === 'cgpa' && {
                totalCredits: currentCalculation.totalCredits,
                semesters: currentCalculation.semesters,
            }),
        };
        // Clear credits input after save
        if (convertCreditsInput) convertCreditsInput.value = '';

        records.unshift(newRecord);
        setRecords(records);
        nameInput.value = '';

        // Button feedback
        const origHTML = saveBtn.innerHTML;
        saveBtn.innerHTML = '<i class="fa-solid fa-check text-xs"></i> Saved!';
        saveBtn.classList.add('bg-[#1A1918]', 'text-white', 'border-[#1A1918]');
        setTimeout(() => {
            saveBtn.innerHTML = origHTML;
            saveBtn.classList.remove('bg-[#1A1918]', 'text-white', 'border-[#1A1918]');
        }, 1800);

        loadSidebarRecords();
        // If CGPA combiner is active, refresh its list
        if (document.getElementById('section-cgpa').style.display === 'flex') {
            refreshCgpaSemesterList();
        }
    }

    btnSaveConvert.addEventListener('click', () => saveRecord(saveNameConvert, btnSaveConvert));
    btnSaveCalc.addEventListener('click',   () => saveRecord(saveNameCalc, btnSaveCalc));
    btnSaveCgpa.addEventListener('click',   () => saveRecord(saveNameCgpa, btnSaveCgpa));

    //  SIDEBAR RECENT RECORDS

    function loadSidebarRecords() {
        const records = getRecords();
        const count   = records.length;

        if (savedCount)       savedCount.textContent = count;
        if (savedCountMobile) savedCountMobile.textContent = count;
        if (!savedRecordsList) return;

        if (count === 0) {
            savedRecordsList.innerHTML = '<p class="text-[10px] text-[#C8C6C2] italic py-4 text-center">No saved records.</p>';
            return;
        }

        const typeIcon = { semester: '📚', cgpa: '📊', convert: '📐' };

        savedRecordsList.innerHTML = '';
        records.slice(0, 5).forEach(record => {
            const el = document.createElement('div');
            el.className = 'record-row flex items-center justify-between py-2 px-1.5 rounded-lg cursor-default border border-transparent hover:border-[#ECEAE5]';
            el.innerHTML = `
                <div class="min-w-0 flex-1">
                    <p class="text-[10px] font-medium text-[#1A1918] truncate leading-tight">
                        <span class="mr-0.5">${typeIcon[record.type] || '📐'}</span>${record.name}
                    </p>
                    <p class="text-[9px] text-[#C8C6C2] mt-0.5">${record.date}</p>
                </div>
                <div class="flex items-center gap-1.5 ml-2 flex-shrink-0">
                    <div class="text-right">
                        <p class="text-[11px] font-playfair font-medium text-[#1A1918]">${record.gpa}</p>
                        <p class="text-[9px] text-[#8C8984]">${record.percentage}%</p>
                    </div>
                    <button onclick="deleteRecord(${record.id})" class="text-[#D6D4D0] hover:text-red-400 transition-colors p-1 ml-0.5">
                        <i class="fa-regular fa-trash-can text-[10px]"></i>
                    </button>
                </div>`;
            savedRecordsList.appendChild(el);
        });
    }

    window.deleteRecord = (id) => {
        if (!confirm('Delete this record?')) return;
        setRecords(getRecords().filter(r => r.id !== id));
        loadSidebarRecords();
    };

    //  MOBILE REFERENCE DRAWER TOGGLE

    if (btnToggleRef && mobileRefDrawer) {
        btnToggleRef.addEventListener('click', () => {
            const isNowHidden = mobileRefDrawer.classList.toggle('hidden');
            if (refIcon) {
                refIcon.className = isNowHidden
                    ? 'fa-solid fa-table-list text-[#8C8984]'
                    : 'fa-solid fa-xmark text-[#8C8984]';
            }
        });
    }

    //  INIT
    loadSidebarRecords();
});
