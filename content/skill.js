
        // 定義全域
        const searchInput = document.getElementById('search-bar');
        const searchButton = document.getElementById('search-button');
        const resultsTitle = document.getElementById('results-title');
        const resultsContent = document.getElementById('results-content');

        let professorDataStore = null;
        // 載入我們的db 
        async function initializeData() {
            const jsonFileUrl = './dbms.json'; 
            
            try {
                const response = await fetch(jsonFileUrl);
                if (!response.ok) {
                    throw new Error(`HTTP 錯誤! 狀態: ${response.status}`);
                }
                
                const fullData = await response.json();
                
                // 使用db 的 skill 節點
                if (fullData && fullData.skill) {
                    professorDataStore = fullData.skill;
                } else {
                    professorDataStore = fullData; 
                }

                resultsTitle.textContent = '教授任教專長';
                resultsContent.innerHTML = '資料載入完成。請輸入教授名稱';

            } catch (error)
             {
                resultsTitle.textContent = '載入失敗';
                resultsContent.innerHTML = '無法載入教授資料，請檢查網路';
            }
        }

        function translateKey(key) {
            const translations = {
                'level': '等級',
                'department': '系所',
                'school': '學校',
                'expertise': '專長'
            };
            if (!isNaN(key)) {
                return `項目 ${parseInt(key) + 1}`;
            }
            return translations[key.toLowerCase()] || key;
        }
            //建立 HTML (保留不變)
        function buildHtmlFromData(data) {
            let html = '';
            // 檢查是否為 '類陣列' 物件 
            const isArrayLike = typeof data === 'object' && data !== null && !Array.isArray(data) && 
                                Object.keys(data).length > 0 && Object.keys(data).every(k => !isNaN(k));
            
            if (Array.isArray(data) || isArrayLike) {
                const items = Array.isArray(data) ? data : Object.values(data);
                items.forEach((item) => {
                    html += `<div class="result-item">`;
                    if (typeof item === 'object' && item !== null) {
                        html += buildHtmlFromData(item);
                    } else {
                        html += `<span>${item}</span>`;
                    }
                    html += `</div>`;
                });
            } else if (typeof data === 'object' && data !== null) {
                for (const [key, value] of Object.entries(data)) {
                    if (key === '系所網址' && typeof value === 'string' && value.startsWith('http')) {
                        html += `<div><strong>${translateKey(key)}:</strong> <a href="${value}" target="_blank">點擊前往</a></div>`;
                    } else if (typeof value === 'object' && value !== null) {
                        html += `<div><strong>${translateKey(key)}:</strong>`;
                        html += `<div class="nested-item">${buildHtmlFromData(value)}</div></div>`;
                    } else {
                        html += `<div><strong>${translateKey(key)}:</strong> ${value}</div>`;
                    }
                }
            } else {
                html = String(data);
            }
            return html;
        }
        //顯示特定教授資料的輔助函數
        function displayProfessorData(professorName) {
            const data = professorDataStore[professorName];
            resultsTitle.textContent = `${professorName} 的任教專常資料`;
            resultsContent.innerHTML = buildHtmlFromData(data);
        }
        //執行搜教授
        function performSearch() {
            if (!professorDataStore) {
                resultsTitle.textContent = '錯誤';
                resultsContent.innerHTML = '教授資料尚未載入完成，請稍後再試。';
                return;
            }

            const searchTerm = searchInput.value.trim();

            if (!searchTerm) {
                resultsTitle.textContent = '提示';
                resultsContent.innerHTML = '請輸入一個教授名稱進行查詢。';
                return;
            }

            resultsTitle.textContent = '查詢中...';
            resultsContent.innerHTML = `正在搜尋包含 "${searchTerm}" 的教授...`;

            const allProfessorNames = Object.keys(professorDataStore);
            
            // 【已修改】將搜尋和比對改為不區分大小寫 (e.g. "aaron" 也能找到 "AARON")
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            const matches = allProfessorNames.filter(name => name.toLowerCase().includes(lowerCaseSearchTerm));

            if (matches.length === 0) {
                resultsTitle.textContent = '查無資料';
                resultsContent.innerHTML = `在資料中找不到包含 "${searchTerm}" 的教授。`;

            } else if (matches.length === 1) {
                displayProfessorData(matches[0]);

            } else {
                resultsTitle.textContent = `找到 ${matches.length} 筆相關結果`;
                
                let html = '<p>請點選下方符合的教授名稱：</p><ul>';
                
                matches.forEach(name => {
                    const safeNameAttr = name.replace(/"/g, '&quot;');
                    html += `<li><a href="#" class="professor-link" data-name="${safeNameAttr}">${name}</a></li>`;
                });
                
                html += '</ul>';
                resultsContent.innerHTML = html;
            }
        }
