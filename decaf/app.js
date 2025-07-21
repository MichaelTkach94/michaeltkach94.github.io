// 30-дневная игра отказа от кофеина с исправленной системой сохранения

const TOTAL_DAYS = 30;
const COFFEE_PRICE = 150; // Цена кофе в рублях

// Данные о наградах (научно обоснованные факты)
const rewards = {
    1: {
        title: "Начало детоксикации", 
        description: "Кофеин начал выводиться из организма. Период полураспада кофеина в крови составляет 5-6 часов.",
        icon: "🎯"
    },
    3: {
        title: "Преодоление ломки", 
        description: "Синдром отмены позади! Самые тяжелые дни прошли. Головные боли и усталость должны уменьшиться.",
        icon: "💪"
    },
    7: {
        title: "Восстановление сна", 
        description: "Аденозиновые рецепторы восстановлены. Качество сна значительно улучшилось, засыпание стало легче.",
        icon: "😴"
    },
    14: {
        title: "Снижение тревожности", 
        description: "Уровень кортизола (гормона стресса) нормализовался. Концентрация и внимание улучшились.",
        icon: "😌"
    },
    21: {
        title: "Новая привычка", 
        description: "Новая привычка сформирована! Уровень энергии стабилизировался без внешних стимуляторов.",
        icon: "🔄"
    },
    30: {
        title: "ПОБЕДА! Полное восстановление", 
        description: "Организм полностью восстановился! Артериальное давление нормализовалось, сердце работает лучше.",
        icon: "🏆"
    }
};

// Глобальные переменные игры
let gameState = {
    markedDays: [],
    unlockedRewards: [],
    startDate: null,
    currentStreak: 0,
    totalMarked: 0
};

let storageMethod = 'url';

// === УНИВЕРСАЛЬНАЯ СИСТЕМА СОХРАНЕНИЯ ===

// Метод 1: Cookies (основной)
function setCookie(name, value, days = 365) {
    try {
        const expires = new Date();
        expires.setTime(expires.getTime() + (days * 24 * 60 * 60 * 1000));
        document.cookie = name + '=' + encodeURIComponent(JSON.stringify(value)) + ';expires=' + expires.toUTCString() + ';path=/;SameSite=Lax';
        return true;
    } catch (e) {
        console.warn('Cookies недоступны:', e);
        return false;
    }
}

function getCookie(name) {
    try {
        const nameEQ = name + "=";
        const ca = document.cookie.split(';');
        for(let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') c = c.substring(1, c.length);
            if (c.indexOf(nameEQ) === 0) {
                return JSON.parse(decodeURIComponent(c.substring(nameEQ.length, c.length)));
            }
        }
        return null;
    } catch (e) {
        return null;
    }
}

// Метод 2: localStorage (запасной)
function setLocalStorage(name, value) {
    try {
        localStorage.setItem(name, JSON.stringify(value));
        return true;
    } catch (e) {
        return false;
    }
}

function getLocalStorage(name) {
    try {
        const item = localStorage.getItem(name);
        return item ? JSON.parse(item) : null;
    } catch (e) {
        return null;
    }
}

// Метод 3: URL параметры (последний резерв)
function setUrlParam(name, value) {
    try {
        const url = new URL(window.location);
        url.searchParams.set(name, encodeURIComponent(JSON.stringify(value)));
        window.history.replaceState({}, '', url);
        return true;
    } catch (e) {
        return false;
    }
}

function getUrlParam(name) {
    try {
        const url = new URL(window.location);
        const param = url.searchParams.get(name);
        return param ? JSON.parse(decodeURIComponent(param)) : null;
    } catch (e) {
        return null;
    }
}

// Определение рабочего метода сохранения
function detectStorageMethod() {
    console.log('🔍 Определяем доступные методы сохранения...');
    
    // Пробуем cookies
    if (setCookie('test', 'test', 1)) {
        const testValue = getCookie('test');
        if (testValue === 'test') {
            setCookie('test', '', -1); // Удаляем тест
            storageMethod = 'cookies';
            console.log('✅ Cookies доступны');
            return 'cookies';
        }
    }
    
    // Пробуем localStorage
    if (setLocalStorage('test', 'test')) {
        const testValue = getLocalStorage('test');
        if (testValue === 'test') {
            try { localStorage.removeItem('test'); } catch(e) {}
            storageMethod = 'localStorage';
            console.log('✅ localStorage доступен');
            return 'localStorage';
        }
    }
    
    // Используем URL параметры
    storageMethod = 'url';
    console.log('✅ Используем URL параметры');
    return 'url';
}

// Универсальное сохранение данных
function saveData(key, data) {
    let success = false;
    
    try {
        if (storageMethod === 'cookies') {
            success = setCookie(key, data, 365);
            if (success && getCookie(key) !== null) {
                updateStorageStatus('cookies', 'success');
                return true;
            }
        }
        
        if (storageMethod === 'localStorage') {
            success = setLocalStorage(key, data);
            if (success && getLocalStorage(key) !== null) {
                updateStorageStatus('localStorage', 'success');
                return true;
            }
        }
        
        // URL параметры как резерв
        success = setUrlParam(key, data);
        if (success) {
            storageMethod = 'url';
            updateStorageStatus('url', 'success');
            return true;
        }
        
    } catch (error) {
        console.error('Ошибка сохранения:', error);
        updateStorageStatus(storageMethod, 'error');
        return false;
    }
    
    updateStorageStatus(storageMethod, 'error');
    return false;
}

// Универсальная загрузка данных
function loadData(key) {
    try {
        let data = null;
        
        // Сначала пробуем текущий метод
        if (storageMethod === 'cookies') {
            data = getCookie(key);
            if (data) return data;
        } else if (storageMethod === 'localStorage') {
            data = getLocalStorage(key);
            if (data) return data;
        } else if (storageMethod === 'url') {
            data = getUrlParam(key);
            if (data) return data;
        }
        
        // Если не нашли в текущем методе, пробуем все остальные
        if (!data) {
            data = getCookie(key);
            if (data) {
                storageMethod = 'cookies';
                console.log('🔍 Найдены данные в cookies, переключаемся на cookies');
                return data;
            }
        }
        
        if (!data) {
            data = getLocalStorage(key);
            if (data) {
                storageMethod = 'localStorage';
                console.log('🔍 Найдены данные в localStorage, переключаемся на localStorage');
                return data;
            }
        }
        
        if (!data) {
            data = getUrlParam(key);
            if (data) {
                storageMethod = 'url';
                console.log('🔍 Найдены данные в URL параметрах, переключаемся на URL');
                return data;
            }
        }
        
        return null;
        
    } catch (error) {
        console.error('Ошибка загрузки:', error);
        return null;
    }
}

// === ИГРОВАЯ ЛОГИКА ===

function canMarkDay(day) {
    if (gameState.markedDays.includes(day)) return false;
    if (day === 1) return true;
    
    const maxMarkedDay = Math.max(0, ...gameState.markedDays);
    return day === maxMarkedDay + 1;
}

function markDay(day) {
    if (!canMarkDay(day)) {
        console.log(`❌ Нельзя отметить день ${day}`);
        return false;
    }

    gameState.markedDays.push(day);
    gameState.markedDays.sort((a, b) => a - b);
    gameState.totalMarked = gameState.markedDays.length;

    if (day === 1 && !gameState.startDate) {
        gameState.startDate = new Date().toISOString();
    }

    console.log(`✅ День ${day} отмечен!`);
    
    // Проверяем новые награды
    if (rewards[day] && !gameState.unlockedRewards.includes(day)) {
        gameState.unlockedRewards.push(day);
        console.log(`🎉 Новая награда за день ${day}!`);
        
        // Показываем награду с задержкой
        setTimeout(() => {
            showReward(day);
        }, 500);
    }
    
    // Пересчитываем streak
    calculateStreak();
    
    // Сохраняем и обновляем интерфейс
    saveGameState();
    updateInterface();
    
    return true;
}

function unmarkDay(day) {
    const index = gameState.markedDays.indexOf(day);
    if (index === -1) return false;
    
    const maxDay = Math.max(...gameState.markedDays);
    if (day !== maxDay) {
        console.log(`❌ Нельзя снять отметку с дня ${day} - не последний`);
        return false;
    }
    
    gameState.markedDays.splice(index, 1);
    gameState.totalMarked = gameState.markedDays.length;
    
    const rewardIndex = gameState.unlockedRewards.indexOf(day);
    if (rewardIndex !== -1) {
        gameState.unlockedRewards.splice(rewardIndex, 1);
    }
    
    console.log(`❌ День ${day} снят с отметки`);
    
    calculateStreak();
    saveGameState();
    updateInterface();
    
    return true;
}

function calculateStreak() {
    gameState.currentStreak = 0;
    
    if (gameState.markedDays.length > 0) {
        const sorted = [...gameState.markedDays].sort((a, b) => a - b);
        if (sorted[0] === 1) {
            gameState.currentStreak = 1;
            for (let i = 1; i < sorted.length; i++) {
                if (sorted[i] === sorted[i-1] + 1) {
                    gameState.currentStreak++;
                } else {
                    break;
                }
            }
        }
    }
}

// === СОХРАНЕНИЕ И ЗАГРУЗКА СОСТОЯНИЯ ИГРЫ ===

function saveGameState() {
    const success = saveData('caffeineQuitGame', gameState);
    if (success) {
        console.log('💾 Состояние игры сохранено');
    } else {
        console.error('❌ Ошибка сохранения состояния игры');
    }
    return success;
}

function loadGameState() {
    try {
        console.log('🔍 Пытаемся загрузить состояние игры...');
        console.log('🔍 Текущий метод сохранения:', storageMethod);
        
        const savedState = loadData('caffeineQuitGame');
        
        if (savedState) {
            console.log('📥 Найдены сохраненные данные:', savedState);
            
            gameState = {
                markedDays: Array.isArray(savedState.markedDays) ? savedState.markedDays : [],
                unlockedRewards: Array.isArray(savedState.unlockedRewards) ? savedState.unlockedRewards : [],
                startDate: savedState.startDate || null,
                currentStreak: savedState.currentStreak || 0,
                totalMarked: savedState.totalMarked || 0
            };
            
            calculateStreak(); // Пересчитываем на всякий случай
            
            console.log('📥 Состояние игры загружено:', gameState);
            console.log('📥 Финальный метод сохранения:', storageMethod);
            updateStorageStatus(storageMethod, 'success');
            return true;
        } else {
            console.log('📥 Сохраненные данные не найдены');
        }
        
        return false;
    } catch (error) {
        console.error('❌ Ошибка загрузки состояния игры:', error);
        updateStorageStatus(storageMethod, 'error');
        return false;
    }
}

// === ОБНОВЛЕНИЕ ИНТЕРФЕЙСА ===

function updateInterface() {
    updateProgress();
    updateStats();
    updateCalendar();
    updateRewards();
}

function updateProgress() {
    const completed = gameState.totalMarked;
    const percentage = Math.round((completed / TOTAL_DAYS) * 100);
    
    const progressFill = document.getElementById('progressFill');
    const progressDays = document.getElementById('progressDays');
    const progressPercentage = document.getElementById('progressPercentage');
    
    if (progressFill) {
        progressFill.style.width = `${percentage}%`;
    }
    
    if (progressDays) {
        progressDays.textContent = completed;
    }
    
    if (progressPercentage) {
        progressPercentage.textContent = percentage;
    }
}

function updateStats() {
    const earnedRewards = gameState.unlockedRewards.length;
    const moneySaved = gameState.totalMarked * COFFEE_PRICE;
    
    const streakEl = document.getElementById('streakDays');
    const rewardsEl = document.getElementById('rewardsEarned');
    const moneySavedEl = document.getElementById('moneySaved');
    
    if (streakEl) streakEl.textContent = gameState.currentStreak;
    if (rewardsEl) rewardsEl.textContent = earnedRewards;
    if (moneySavedEl) moneySavedEl.textContent = moneySaved + '₽';
}

function updateCalendar() {
    const grid = document.getElementById('calendarGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    for (let day = 1; day <= TOTAL_DAYS; day++) {
        const button = document.createElement('button');
        button.className = 'day-button';
        button.textContent = day;
        
        const isCompleted = gameState.markedDays.includes(day);
        const canMark = canMarkDay(day);
        
        if (isCompleted) {
            button.classList.add('completed');
            button.addEventListener('click', (e) => {
                e.preventDefault();
                unmarkDay(day);
            });
            button.title = `День ${day} завершен! Нажмите, чтобы снять отметку`;
        } else if (canMark) {
            button.classList.add('next-available');
            button.addEventListener('click', (e) => {
                e.preventDefault();
                markDay(day);
            });
            button.title = `Отметить день ${day} как завершенный`;
        } else {
            button.classList.add('disabled');
            button.title = `День ${day} недоступен. Отмечайте дни по порядку`;
        }
        
        grid.appendChild(button);
    }
}

function updateRewards() {
    const grid = document.getElementById('rewardsGrid');
    if (!grid) return;
    
    grid.innerHTML = '';
    
    const sortedRewards = [...gameState.unlockedRewards].sort((a, b) => a - b);
    
    sortedRewards.forEach(day => {
        const reward = rewards[day];
        if (reward) {
            const badge = document.createElement('div');
            badge.className = 'reward-badge';
            
            badge.innerHTML = `
                <div class="reward-icon">${reward.icon}</div>
                <div class="reward-title">${reward.title}</div>
                <div class="reward-description">День ${day}: ${reward.description}</div>
            `;
            
            grid.appendChild(badge);
        }
    });
}

// === МОДАЛЬНЫЕ ОКНА ===

function showReward(day) {
    const reward = rewards[day];
    if (!reward) return;
    
    const modal = document.getElementById('rewardModal');
    const overlay = document.getElementById('modalOverlay');
    const icon = document.getElementById('rewardIcon');
    const title = document.getElementById('modalTitle');
    const description = document.getElementById('modalDescription');
    
    if (!modal || !overlay || !icon || !title || !description) return;
    
    icon.textContent = reward.icon;
    title.textContent = reward.title;
    description.textContent = `День ${day}: ${reward.description}`;
    
    overlay.style.display = 'flex';
    modal.style.display = 'flex';
    document.body.classList.add('modal-open');
}

function closeModal() {
    const modal = document.getElementById('rewardModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    document.body.classList.remove('modal-open');
}

function showTestModal() {
    const modal = document.getElementById('testModal');
    const overlay = document.getElementById('modalOverlay');
    const urlTest = document.getElementById('urlTest');
    const currentMethod = document.getElementById('currentMethod');
    
    if (!modal || !overlay) return;
    
    // Тестируем URL параметры
    const testSuccess = setUrlParam('test', { time: Date.now() });
    if (urlTest) {
        urlTest.textContent = testSuccess ? '✅ Работает' : '❌ Ошибка';
    }
    
    // Показываем текущий метод
    if (currentMethod) {
        const methodNames = {
            'cookies': 'Cookies 🍪',
            'localStorage': 'Local Storage 💾',
            'url': 'URL параметры 🔗'
        };
        currentMethod.textContent = methodNames[storageMethod] || 'Неизвестно';
    }
    
    overlay.style.display = 'flex';
    modal.style.display = 'flex';
    document.body.classList.add('test-modal-open');
}

function closeTestModal() {
    const modal = document.getElementById('testModal');
    const overlay = document.getElementById('modalOverlay');
    
    if (modal) modal.style.display = 'none';
    if (overlay) overlay.style.display = 'none';
    document.body.classList.remove('test-modal-open');
}

// === УПРАВЛЕНИЕ ИГРОЙ ===

function resetGame() {
    if (!confirm('Вы уверены, что хотите сбросить прогресс? Все данные будут потеряны!')) {
        return;
    }
    
    gameState = {
        markedDays: [],
        unlockedRewards: [],
        startDate: null,
        currentStreak: 0,
        totalMarked: 0
    };
    
    // Очищаем все методы сохранения
    try {
        setCookie('caffeineQuitGame', '', -1);
        localStorage.removeItem('caffeineQuitGame');
        const url = new URL(window.location);
        url.searchParams.delete('caffeineQuitGame');
        window.history.replaceState({}, '', url);
    } catch (e) {
        console.warn('Не удалось полностью очистить данные:', e);
    }
    
    updateInterface();
    updateStorageStatus(storageMethod, 'success', '🗑️ Прогресс сброшен!');
    
    console.log('🗑️ Игра сброшена');
}

// === СТАТУС СОХРАНЕНИЯ ===

function updateStorageStatus(method, status = 'success', customMessage = null) {
    const statusEl = document.getElementById('saveStatus');
    const iconEl = document.getElementById('saveIcon');
    const indicator = document.querySelector('.save-indicator');
    
    if (!statusEl || !iconEl || !indicator) return;
    
    // Убираем предыдущие классы состояния
    indicator.classList.remove('success', 'warning', 'error');
    
    const methodNames = {
        'cookies': 'Cookies',
        'localStorage': 'localStorage', 
        'url': 'URL параметры'
    };
    
    let message, icon, className;
    
    if (customMessage) {
        message = customMessage;
        icon = '💾';
        className = 'success';
    } else {
        switch (status) {
            case 'success':
                message = `Сохранено: ${methodNames[method]}`;
                icon = '✅';
                className = 'success';
                break;
            case 'warning':
                message = `Внимание: ${methodNames[method]}`;
                icon = '⚠️';
                className = 'warning';
                break;
            case 'error':
                message = `Ошибка: ${methodNames[method]}`;
                icon = '❌';
                className = 'error';
                break;
            default:
                message = 'Инициализация...';
                icon = '💾';
                className = 'success';
        }
    }
    
    statusEl.textContent = message;
    iconEl.textContent = icon;
    indicator.classList.add(className);
    
    // Сбрасываем кастомное сообщение через 3 секунды
    if (customMessage) {
        setTimeout(() => {
            updateStorageStatus(method, 'success');
        }, 3000);
    }
}

// === ИНИЦИАЛИЗАЦИЯ ===

function init() {
    console.log('🚀 Инициализация игры "30 Дней Без Кофеина"');
    
    // Определяем метод сохранения
    detectStorageMethod();
    
    // Загружаем состояние игры
    const hasProgress = loadGameState();
    
    // Если данные найдены, обновляем метод сохранения
    if (hasProgress) {
        console.log('📥 Данные найдены, текущий метод:', storageMethod);
    } else {
        console.log('📥 Данные не найдены, используем метод:', storageMethod);
    }
    
    // Обновляем интерфейс
    updateInterface();
    
    // Привязываем события
    const resetBtn = document.getElementById('resetBtn');
    if (resetBtn) {
        resetBtn.addEventListener('click', resetGame);
    }
    
    const testSaveBtn = document.getElementById('testSaveBtn');
    if (testSaveBtn) {
        testSaveBtn.addEventListener('click', showTestModal);
    }
    
    const closeModalBtn = document.getElementById('closeModalBtn');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeModal);
    }
    
    const closeTestBtn = document.getElementById('closeTestBtn');
    if (closeTestBtn) {
        closeTestBtn.addEventListener('click', closeTestModal);
    }
    
    const modalOverlay = document.getElementById('modalOverlay');
    if (modalOverlay) {
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
                closeTestModal();
            }
        });
    }
    
    // Обработка клавиши Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeModal();
            closeTestModal();
        }
    });
    
    // Автосохранение при закрытии страницы
    window.addEventListener('beforeunload', () => {
        if (gameState.totalMarked > 0) {
            saveGameState();
        }
    });
    
    // Приветственное сообщение
    if (hasProgress && gameState.totalMarked > 0) {
        updateStorageStatus(storageMethod, 'success', `🎉 Добро пожаловать! Прогресс: ${gameState.totalMarked} дней!`);
    } else {
        updateStorageStatus(storageMethod, 'success', '🌱 Начните ваш путь к свободе от кофеина!');
    }
    
    console.log('✅ Инициализация завершена');
    console.log('📊 Состояние игры:', gameState);
}

// === ЗАПУСК ПРИЛОЖЕНИЯ ===

document.addEventListener('DOMContentLoaded', init);

// Автосохранение каждые 10 секунд при наличии прогресса
setInterval(() => {
    if (gameState.totalMarked > 0) {
        saveGameState();
    }
}, 10000);

console.log('🎯 30 Дней Без Кофеина - скрипт загружен');