  const searchInput = document.getElementById('search-input');
        const autocompleteResults = document.getElementById('autocomplete-results');
        const repositoriesList = document.getElementById('repositories-list');
        
        // Таймер для debounce
        let debounceTimer;
        // Текущий запрос для отмены дублирующихся
        let currentController;
        
        // Обработчик ввода
        searchInput.addEventListener('input', function(e) {
            const query = e.target.value.trim();
            
            // Очистка предыдущего таймера
            clearTimeout(debounceTimer);
            
            // Закрыть автодополнение если запрос пустой
            if (!query) {
                autocompleteResults.style.display = 'none';
                return;
            }
            
            // Debounce 500ms
            debounceTimer = setTimeout(() => {
                fetchRepositories(query);
            }, 500);
        });
        
        // Запрос к GitHub API
        function fetchRepositories(query) {
            // Отмена предыдущего запроса если он есть
            if (currentController) {
                currentController.abort();
            }
            
            // Создаем новый AbortController для текущего запроса
            currentController = new AbortController();
            
            // Показываем загрузку
            autocompleteResults.innerHTML = '<div class="autocomplete-item">Loading...</div>';
            autocompleteResults.style.display = 'block';
            
            // Формируем URL для запроса
            const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=5`;
            
            fetch(url, {
                signal: currentController.signal
            })
            .then(response => {
                if (!response.ok) {
                    throw new Error(`GitHub API error: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                displayAutocompleteResults(data.items);
            })
            .catch(error => {
                if (error.name === 'AbortError') return;
                autocompleteResults.innerHTML = `<div class="error-message">Error: ${error.message}</div>`;
            });
        }
        
        // Отображение результатов автодополнения
        function displayAutocompleteResults(repositories) {
            if (!repositories || repositories.length === 0) {
                autocompleteResults.innerHTML = '<div class="autocomplete-item">No repositories found</div>';
                autocompleteResults.style.display = 'block';
                return;
            }
            
            autocompleteResults.innerHTML = '';
            
            repositories.forEach(repo => {
                const item = document.createElement('div');
                item.className = 'autocomplete-item';
                item.textContent = repo.full_name;
                item.dataset.repo = JSON.stringify({
                    name: repo.name,
                    full_name: repo.full_name,
                    owner: repo.owner.login,
                    stars: repo.stargazers_count
                });
                
                item.addEventListener('click', () => {
                    addRepositoryToList(JSON.parse(item.dataset.repo));
                    searchInput.value = '';
                    autocompleteResults.style.display = 'none';
                });
                
                autocompleteResults.appendChild(item);
            });
            
            autocompleteResults.style.display = 'block';
        }
        
        // Добавление репозитория в список
        function addRepositoryToList(repo) {
            const listItem = document.createElement('li');
            listItem.className = 'repository-item';
            listItem.innerHTML = `
                <div class="repo-info">
                    <div class="repo-name">${repo.name}</div>
                    <div class="repo-owner">Owner: ${repo.owner}</div>
                    <div class="repo-stars">Stars: ${repo.stars}</div>
                </div>
                <button class="remove-btn">&times;</button>
            `;
            
            // Добавляем обработчик удаления
            listItem.querySelector('.remove-btn').addEventListener('click', () => {
                listItem.remove();
            });
            
            repositoriesList.appendChild(listItem);
        }
        
        // Закрытие автодополнения при клике вне области
        document.addEventListener('click', (e) => {
            if (!searchInput.contains(e.target) && 
                !autocompleteResults.contains(e.target)) {
                autocompleteResults.style.display = 'none';
            }
        });