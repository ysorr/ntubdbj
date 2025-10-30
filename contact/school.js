        // 全域先定義
        const searchInput = document.getElementById('search-bar');
        const searchButton = document.getElementById('search-button');
        const resultsTitle = document.getElementById('results-title');
        const resultsContent = document.getElementById('results-content');
        let schoolDataStore = null;
        //載入資料庫
        async function initializeData() {
            const jsonFileUrl = './dbms.json'; 
            
            try {
                const response = await fetch(jsonFileUrl);
                if (!response.ok) {
                    throw new Error(`HTTP 錯誤! 狀態: ${response.status}`);
                }
                
                const fullData = await response.json();
                
                if (fullData && fullData.school) {
                    schoolDataStore = fullData.school;
                } else {
                    console.error("JSON 格式錯誤，找不到 'school' 鍵。");
                    schoolDataStore = fullData; 
                }

                resultsTitle.textContent = '學校專長定位';
                resultsContent.innerHTML = '學校資料已載入完成。請在上方輸入學校名稱。';

            } catch (error) {
                console.error("無法抓取或解析 JSON 資料:", error);
                resultsTitle.textContent = '載入失敗';
                resultsContent.innerHTML = '無法載入學校資料，請檢查主機連線或 JSON 檔案路徑是否正確。';
            }
        }
        function translateKey(key) {
            const translations = {

             };
            if (!isNaN(key)) {
                return `項目 ${parseInt(key) + 1}`;
            }
            return translations[key.toLowerCase()] || key;
        }
        //遞迴建立 HTML (保留不變)
        function buildHtmlFromData(data) {
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
            } 
            else if (typeof data === 'object' && data !== null) {
                for (const [key, value] of Object.entries(data)) {
                    if (typeof value === 'string' && value.startsWith('http')) {
                         html += `<div><strong>${translateKey(key)}:</strong> <a href="${value}" target="_blank">點擊前往</a></div>`;
                    }
                    else if (typeof value === 'object' && value !== null) {
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
            //顯示特定學校資料，並觸發 Gemini 分析
        function displaySchoolData(schoolName) {
            const data = schoolDataStore[schoolName];
            
            //顯示標題
            resultsTitle.textContent = `${schoolName} 的所有科系與資料`;
            
            //計算科系數量 (複製 runGeminiAnalysis 中的邏輯來確保一致)
            let departmentNames = [];
            if (Array.isArray(data)) {
                // 處理陣列結構
                departmentNames = data.map(d => d.系所名稱).filter(Boolean); // filter(Boolean) 移除空值
            } else if (typeof data === 'object' && data !== null) {
                if (data.系所名稱) {
                    departmentNames = [data.系所名稱];
                } else {
                    Object.values(data).forEach(val => { 
                        if (val && val.系所名稱) departmentNames.push(val.系所名稱); 
                    });
                }
            }
            const departmentCount = departmentNames.length;

            //建立 HTML (依照新順序)
            let html = '';
            
            //加入科系總數
            html += `<p style="font-weight: bold; font-size: 1.1em;">共 ${departmentCount} 個科系</p>`;

            //加入 Gemini 分析區塊的 "預留位置"
            html += `
                <div id="gemini-analysis" style="border-top: 2px solid #eee; padding-top: 15px; margin-bottom: 20px;">
                    <h4>Gemini分析</h4>
                    <p id="gemini-analysis-content">分析中，請稍候...</p>
                </div>
            `;
            
            //顯示學校的基本資料
            html += buildHtmlFromData(data); 

            //將組合好的 HTML 插入頁面
            resultsContent.innerHTML = html;
            
            //呼叫 Gemini API 分析函數
            runGeminiAnalysis(data);
        }
            //呼叫 Google Gemini API
        async function runGeminiAnalysis(schoolData) {
            const analysisBox = document.getElementById('gemini-analysis-content');

            // 從schoolData 提取科系列表
            let departmentNames = [];
            if (Array.isArray(schoolData)) {
            // 處理格式各樣的資料結構
                departmentNames = schoolData.map(d => d.系所名稱).filter(Boolean); // filter(Boolean) 移除空值
            } else if (typeof schoolData === 'object' && schoolData !== null) {
                if (schoolData.系所名稱) {
                    departmentNames = [schoolData.系所名稱];
                } else {
                    Object.values(schoolData).forEach(val => { 
                        if (val && val.系所名稱) departmentNames.push(val.系所名稱); 
                    });
                }
            }

            if (departmentNames.length === 0) {
                analysisBox.textContent = "分析失敗：找不到科系資料。";
                return;
            }

            const departmentList = departmentNames.join('、');
            
            //Prompt
            const prompt = `根據以下台灣的大學科系清單：「${departmentList}」。請用繁體中文分析這所學校的核心學術專長領域（例如：理工、醫學、商管、人文、藝術設計等）。你的回答必須非常簡短，只回答「以 XX 為強項」。例如：「以理工與商管為強項」或「以人文藝術為強項」。`;
            const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-2.5-flash:generateContent?key=" + encodeURIComponent(GEMINI_API_KEY);
            
            const requestBody = {
                contents: [{ parts: [{ text: prompt }] }]
            };

            //呼叫 API
            try {
                let res = await fetch(GEMINI_API_URL, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(requestBody)
                });

                if (!res.ok) {
                    const errorData = await res.json();
                    console.error("Gemini API 錯誤:", errorData);
                    if (res.status === 404) {
                         throw new Error(`API 請求失敗: 404 Not Found。請檢查 API 金鑰是否正確，以及 Google Cloud 專案是否已啟用 "Generative Language API"。`);
                    }
                    if (res.status === 400) {
                        throw new Error(`API 請求失敗: 400 Bad Request。請檢查 API 金鑰是否有效或 API 是否已啟用。`);
                    }
                    throw new Error(`API 請求失敗: ${res.status} ${res.statusText}`);
                }

                const data = await res.json();
                if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
                    const analysisResult = data.candidates[0].content.parts[0].text.trim();
                    analysisBox.textContent = `這間學校是 ： ${analysisResult}`;
                } else {
                    console.error("Gemini API 回應格式不符預期:", data);
                    throw new Error("API 回應格式錯誤。");
                }
            } catch (error) {
                console.error("呼叫 Gemini API 時發生錯誤:", error);
                if (error.message.includes("400")) {
                     analysisBox.textContent = "分析失敗：API 金鑰 (API Key) 無效或格式錯誤 (400 Bad Request)。";
                } else if (error.message.includes("404")) {
                    analysisBox.textContent = "分析失敗：找不到 API (404 Not Found)。請確認 Google Cloud 專案已「啟用」 Generative Language API。";
                } else {
                     analysisBox.textContent = `分析失敗：${error.message}`;
                }
            }
        }
                //執行搜尋
        function performSearch() {
            if (!schoolDataStore) {
                resultsTitle.textContent = '錯誤';
                resultsContent.innerHTML = '學校資料尚未載入完成，請稍後再試。';
                return;
            }
            const searchTerm = searchInput.value.trim();
            if (!searchTerm) {
                resultsTitle.textContent = '提示';
                resultsContent.innerHTML = '請輸入一個學校名稱進行查詢。';
                return;
            }
            resultsTitle.textContent = '查詢中...';
            resultsContent.innerHTML = `正在搜尋包含 "${searchTerm}" 的學校...`;
            const allSchoolNames = Object.keys(schoolDataStore);
            const lowerCaseSearchTerm = searchTerm.toLowerCase();
            const matches = allSchoolNames.filter(name => name.toLowerCase().includes(lowerCaseSearchTerm));

            if (matches.length === 0) {
                resultsTitle.textContent = '查無資料';
                resultsContent.innerHTML = `在資料中找不到包含 "${searchTerm}" 的學校。`;
            } else if (matches.length === 1) {
                displaySchoolData(matches[0]);
            } else {
                resultsTitle.textContent = `找到 ${matches.length} 筆相關結果`;
                let html = '<p>請點選下方符合的學校名稱：</p><ul>';
                matches.forEach(name => {
                    const safeNameAttr = name.replace(/"/g, '&quot;');
                    html += `<li><a href="#" class="school-link" data-name="${safeNameAttr}">${name}</a></li>`;
                });
                html += '</ul>';
                resultsContent.innerHTML = html;
            }
        }