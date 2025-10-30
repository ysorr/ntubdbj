        // 當按下鍵盤的 Enter 或是 點一些東西，他可以自動的去enter ，而不用手動按網頁的按鈕 ---
        document.addEventListener('DOMContentLoaded', initializeData);
        searchButton.addEventListener('click', performSearch);
        searchInput.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                performSearch();
            }
        });

        resultsContent.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('school-link')) {
                e.preventDefault(); 
                const schoolName = e.target.getAttribute('data-name');
                displaySchoolData(schoolName);
            }
        });
     resultsContent.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('professor-link')) {
                e.preventDefault(); 
                const professorName = e.target.getAttribute('data-name');
                displayProfessorData(professorName);
            }
        });
         resultsContent.addEventListener('click', (e) => {
            if (e.target && e.target.classList.contains('teacher-link')) {
                e.preventDefault(); 
                const teacherName = e.target.getAttribute('data-name');
                displayTeacherData(teacherName);
            }
        });
        