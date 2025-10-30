
        const searchInput = document.getElementById('search-bar');
        const searchButton = document.getElementById('search-button');
        const resultsTitle = document.getElementById('results-title');
        const resultsContent = document.getElementById('results-content');

        let teacherDataStore = null;

        //判斷「專兼任」
        function fitStatusForFullOrPartTime(data) {
            // 嘗試取得資料內的「專兼任」欄位
            let fullOrPartTime = null;
            for (const key of Object.keys(data)) {
                if (key === '專兼任' || key === 'fullOrPartTime' || key.toLowerCase() === 'fullorparttime') {
                    fullOrPartTime = data[key];
                    break;
                }
            }
            if (!fullOrPartTime) return null;
            let val = Array.isArray(fullOrPartTime) ? fullOrPartTime[0] : fullOrPartTime;
            if (typeof val === "object" && val !== null) {
                val = Object.values(val)[0];
            }
            if (typeof val !== "string") return null;
            if (val.includes('專任')) return {text: '適合', class: 'fit-yes', detail: val};
            if (val.includes('兼任')) return {text: '不適合', class: 'fit-no', detail: val};
            return null;
        }

        async function initializeData() {
            const jsonFileUrl = './dbms.json'; 
            
            try {
                const response = await fetch(jsonFileUrl);
                if (!response.ok) {
                    throw new Error(`HTTP 錯誤! 狀態: ${response.status}`);
                }
                
                const fullData = await response.json();
                
                if (fullData && fullData.teacherlevel) {
                    teacherDataStore = fullData.teacherlevel;
                } else {
                    console.error("JSON 格式錯誤，找不到 'teacherlevel' 鍵。");
                    teacherDataStore = fullData; 
                }

                resultsTitle.textContent = '師資等級查詢';
                resultsContent.innerHTML = '教師資料已載入完成。請在上方輸入教師姓名。';

            } catch (error) {
                console.error("無法抓取或解析 JSON 資料:", error);
                resultsTitle.textContent = '載入失敗';
                resultsContent.innerHTML = '無法載入教師資料，請檢查主機連線或 JSON 檔案路徑是否正確。';
            }
        }

        function translateKey(key) {
            const translations = {
                'level': '等級',
                'department': '系所',
                'school': '學校',
                'expertise': '專長',
                'position': '聘書職級',
                'fullorparttime': '專兼任',
                '專兼任': '專兼任'
            };
            if (!isNaN(key)) {
                return `項目 ${parseInt(key) + 1}`;
            }
            return translations[key.toLowerCase()] || key;
        }

        function buildHtmlFromData(data, parentKey = '') {
            let html = '';
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
                    // 依照「聘書職級」查看是否成為穩定專題教授
                    if (translateKey(key) === '聘書職級') {
                        html += `<div><strong>聘書職級:</strong> `;
                        if (typeof value === 'object' && value !== null) {
                            html += `<div class="nested-item">${buildHtmlFromData(value, key)}</div>`;
                        } else {
                            html += `${value}`;
                        }
                        html += `</div>`;

                        // 新增判斷區塊（只針對該教師最外層的資料）
                        if (!parentKey) {
                            let fitStatus = fitStatusForFullOrPartTime(data);
                            html += `<div><strong>是否成為穩定專題教授：</strong>`;
                            if (fitStatus) {
                                html += `<span class="fit-status ${fitStatus.class}">${fitStatus.text}</span>`;
                                if (fitStatus.detail) {
                                }
                            } else {
                                html += `<span class="fit-status fit-no">不適合</span>`;
                            }
                            html += `</div>`;
                        }
                    } else {
                        if (typeof value === 'object' && value !== null) {
                            html += `<div><strong>${translateKey(key)}:</strong>`;
                            html += `<div class="nested-item">${buildHtmlFromData(value, key)}</div></div>`;
                        } else {
                            html += `<div><strong>${translateKey(key)}:</strong> ${value}</div>`;
                        }
                    }
                }
            } else {
                html = String(data);
            }
            return html;
        }

        function displayTeacherData(teacherName) {
            const data = teacherDataStore[teacherName];
            resultsTitle.textContent = `${teacherName} 的師資資料`;
            resultsContent.innerHTML = buildHtmlFromData(data);
        }

        function performSearch() {
            if (!teacherDataStore) {
                resultsTitle.textContent = '錯誤';
                resultsContent.innerHTML = '教師資料尚未載入完成，請稍後再試。';
                return;
            }

            const searchTerm = searchInput.value.trim();

            if (!searchTerm) {
                resultsTitle.textContent = '提示';
                resultsContent.innerHTML = '請輸入一個教師名稱進行查詢。';
                return;
            }

            resultsTitle.textContent = '查詢中...';
            resultsContent.innerHTML = `正在搜尋包含 "${searchTerm}" 的教師...`;

            const allTeacherNames = Object.keys(teacherDataStore);
            const matches = allTeacherNames.filter(name => name.includes(searchTerm));

            if (matches.length === 0) {
                resultsTitle.textContent = '查無資料';
                resultsContent.innerHTML = `在資料中找不到包含 "${searchTerm}" 的教師。`;

            } else if (matches.length === 1) {
                displayTeacherData(matches[0]);

            } else {
                resultsTitle.textContent = `找到 ${matches.length} 筆相關結果`;
                
                let html = '<p>請點選下方符合的教師名稱：</p><ul>';
                
                matches.forEach(name => {
                    const safeNameAttr = name.replace(/"/g, '&quot;');
                    html += `<li><a href="#" class="teacher-link" data-name="${safeNameAttr}">${name}</a></li>`;
                });
                
                html += '</ul>';
                resultsContent.innerHTML = html;
            }
        }
