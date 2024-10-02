// scripts.js

document.addEventListener("DOMContentLoaded", function () {
    // Инициализация Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyDH2AS_JOYtLNRjOsJUNzjEa70sa0JFIfo",
        authDomain: "azdilteks-a8867.firebaseapp.com",
        databaseURL: "https://azdilteks-a8867-default-rtdb.firebaseio.com", // Добавьте URL базы данных
        projectId: "azdilteks-a8867",
        storageBucket: "azdilteks-a8867.appspot.com",
        messagingSenderId: "694134591027",
        appId: "1:694134591027:web:60a05e7965f8a1b7e9dd46",
        measurementId: "G-SRBKVSJQ7Z"
    };

    // Инициализируйте приложение Firebase
    firebase.initializeApp(firebaseConfig);

    // Получите ссылку на базу данных
    const database = firebase.database();

    const categories = document.querySelectorAll(".category");
    const modals = document.querySelectorAll(".modal");
    const closeButtons = document.querySelectorAll(".close");
    const fashionItems = document.querySelectorAll(".fashion-item");
    const fashionModal = document.getElementById("modal-fashion");
    const checkoutModal = document.getElementById("modal-checkout");
    const editOrderModal = document.getElementById("modal-edit-order");
    const compareModal = document.getElementById("modal-compare"); // Модальное окно для сравнения
    const cart = [];
    const cartItemsContainer = document.getElementById("cart-items");
    const orderHistoryContainer = document.getElementById("order-history-items");
    const compareList = []; // Список для сравнения
    let editOrderId = null;
    let selectedCurrency = 'UZS'; // Начальная валюта

    const currencySelect = document.getElementById("currency-select");

    // Конвертационные курсы
    const exchangeRates = {
        'UZS': 1,
        'USD': 11000 // Примерный курс, актуализируйте при необходимости
    };

    // Загрузка данных при загрузке страницы
    loadCart();
    loadOrderHistory();
    initializeSmartDate();
    initializeAnalytics(); // Инициализация аналитики

    // Обработчик изменения валюты
    currencySelect.addEventListener("change", function () {
        selectedCurrency = this.value;
        updateAllPrices();
    });

    // Открытие модальных окон для категорий
    categories.forEach(category => {
        category.addEventListener("click", function () {
            const categoryType = category.getAttribute("data-category");
            const modal = document.getElementById(`modal-${categoryType}`);
            if (modal) {
                modal.style.display = "flex";
            }
        });
    });

    // Закрытие модальных окон
    closeButtons.forEach(button => {
        button.addEventListener("click", function () {
            modals.forEach(modal => {
                modal.style.display = "none";
            });
        });
    });

    // Закрытие модальных окон при клике вне контента
    window.addEventListener("click", function (event) {
        modals.forEach(modal => {
            if (event.target === modal) {
                modal.style.display = "none";
            }
        });
    });

    // Открытие модального окна выбора опций при нажатии на "Выбрать"
    const selectButtons = document.querySelectorAll(".select-btn");
    selectButtons.forEach(button => {
        button.addEventListener("click", function () {
            const fashionItem = this.closest(".fashion-item");
            const category = fashionItem.getAttribute("data-category");
            const price = parseFloat(fashionItem.getAttribute("data-price"));
            const name = fashionItem.querySelector("p").innerText;
            const imageSrc = fashionItem.querySelector("img").getAttribute("src");

            // Заполнение данных в модальном окне выбора опций
            document.getElementById("fashion-name").innerText = name;
            document.getElementById("fashion-image").setAttribute("src", imageSrc);
            document.getElementById("fashion-price").innerText = formatPrice(price);

            fashionModal.style.display = "flex";
        });
    });

    // Добавление товара в корзину
    document.getElementById("order-form").addEventListener("submit", function (event) {
        event.preventDefault();
        const color = document.getElementById("color").value;
        const deliveryDate = document.getElementById("delivery-date").value;
        const notes = document.getElementById("notes").value;

        // Получение всех выбранных размеров и количеств
        const sizeQuantities = document.querySelectorAll(".size-quantity");
        sizeQuantities.forEach(input => {
            const quantity = parseInt(input.value);
            const size = input.getAttribute("data-size");
            if (quantity > 0) {
                const fashionName = document.getElementById("fashion-name").innerText;
                const fashionImage = document.getElementById("fashion-image").getAttribute("src");
                const fashionPriceText = document.getElementById("fashion-price").innerText;
                const fashionPrice = parseFloat(fashionPriceText.replace(/[^0-9.]/g, ""));

                const cartItem = {
                    id: Date.now() + Math.random(), // Уникальный ID для каждого товара
                    name: fashionName,
                    size: size,
                    color: color,
                    quantity: quantity,
                    notes: notes,
                    image: fashionImage,
                    price: fashionPrice,
                    deliveryDate: deliveryDate
                };

                cart.push(cartItem);
            }
        });

        updateCart();
        fashionModal.style.display = "none";
        updateAnalyticsData(); // Обновление данных аналитики

        // Сброс значений формы
        document.getElementById("order-form").reset();
        // Установка минимальной даты заново
        initializeSmartDate();
    });

    // Обновление корзины
    function updateCart() {
        cartItemsContainer.innerHTML = "";
        let totalPrice = 0;
        cart.forEach((item, index) => {
            const cartItemElement = document.createElement("div");
            cartItemElement.classList.add("cart-item");
            cartItemElement.innerHTML = `
                <img src="${item.image}" alt="${item.name}">
                <div>
                    <p><strong>${item.name}</strong></p>
                    <p>Размер: ${item.size}</p>
                    <p>Цвет: ${item.color}</p>
                    <p>Количество: ${item.quantity}</p>
                    <p>Заметки: ${item.notes}</p>
                    <p>Дата доставки: ${formatDate(item.deliveryDate)}</p>
                    <p class="price" data-price="${item.price}">${formatPrice(item.price)}</p>
                    <p class="total-price" data-total="${item.price * item.quantity}"><strong>Итого: ${formatPrice(item.price * item.quantity)}</strong></p>
                </div>
                <button class="remove-cart-item" data-index="${index}">Удалить</button>
            `;
            cartItemsContainer.appendChild(cartItemElement);
            totalPrice += item.price * item.quantity;
        });

        // Добавление общего итога
        if (cart.length > 0) {
            const totalElement = document.createElement("div");
            totalElement.classList.add("cart-total");
            totalElement.innerHTML = `<p><strong>Общая сумма: ${formatPrice(totalPrice)}</strong></p>`;
            cartItemsContainer.appendChild(totalElement);
        }

        // Добавление обработчиков для удаления элементов из корзины
        const removeButtons = document.querySelectorAll(".remove-cart-item");
        removeButtons.forEach(button => {
            button.addEventListener("click", function () {
                const index = parseInt(this.getAttribute("data-index"));
                cart.splice(index, 1);
                updateCart();
                updateAnalyticsData(); // Обновление данных аналитики
            });
        });

        saveCart();
    }

    // Оформление заказа и открытие модального окна для данных клиента
    document.getElementById("checkout").addEventListener("click", function () {
        if (cart.length === 0) {
            alert("Ваша корзина пуста!");
            return;
        }
        checkoutModal.style.display = "flex";
    });

    // Подтверждение заказа и добавление в базу данных Firebase
    document.getElementById("checkout-form").addEventListener("submit", function (event) {
        event.preventDefault();
        const customerName = document.getElementById("customer-name").value.trim();
        const phone = document.getElementById("phone").value.trim();
        const company = document.getElementById("company").value.trim();

        if (customerName === "" || phone === "" || company === "") {
            alert("Пожалуйста, заполните все поля.");
            return;
        }

        const order = {
            customerName: customerName,
            phone: phone,
            company: company,
            items: [...cart] // Копируем текущую корзину
        };

        addOrder(order);
        cart.length = 0; // Очищаем корзину после оформления заказа
        updateCart();
        checkoutModal.style.display = "none";
        updateAnalyticsData(); // Обновление данных аналитики
    });

    // Добавление заказа в базу данных Firebase
    function addOrder(order) {
        const ordersRef = database.ref('orders');
        const newOrderRef = ordersRef.push();
        newOrderRef.set(order)
            .then(() => {
                order.id = newOrderRef.key;
                // Удаляем вызов displayOrder(order); чтобы избежать дублирования
                // displayOrder(order); // Эту строку мы удалили
            })
            .catch((error) => {
                console.error('Error adding order:', error);
            });
    }

    // Отображение заказа в истории
    function displayOrder(order) {
        // Проверка наличия items массива
        if (!order.items || !Array.isArray(order.items)) {
            console.error("Order items are undefined or not an array:", order);
            return;
        }

        // Вычисление оставшихся дней до дедлайна
        const today = new Date();
        const deliveryDate = new Date(order.items[0].deliveryDate);
        const timeDiff = deliveryDate - today;
        const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));

        // Определение класса для цвета уведомления
        let deadlineClass = '';
        if (daysRemaining > 20) {
            deadlineClass = 'deadline-green';
        } else if (daysRemaining > 10) {
            deadlineClass = 'deadline-yellow';
        } else if (daysRemaining > 5) {
            deadlineClass = 'deadline-orange';
        } else {
            deadlineClass = 'deadline-red';
        }

        const orderElement = document.createElement("div");
        orderElement.classList.add("order-item", deadlineClass);
        orderElement.setAttribute("data-order-id", order.id);
        orderElement.innerHTML = `
            <h3>Заказ от ${order.customerName} (${formatDate(order.items[0].deliveryDate)})</h3>
            <p><strong>Телефон:</strong> ${order.phone}</p>
            <p><strong>Компания:</strong> ${order.company}</p>
            <div class="order-items-list">
                ${order.items.map(item => `
                    <div class="order-item-details">
                        <img src="${item.image}" alt="${item.name}">
                        <div>
                            <p><strong>${item.name}</strong></p>
                            <p>Размер: ${item.size}</p>
                            <p>Цвет: ${item.color}</p>
                            <p>Количество: ${item.quantity}</p>
                            <p>Заметки: ${item.notes}</p>
                            <p class="price" data-price="${item.price}">Цена за единицу: ${formatPrice(item.price)}</p>
                            <p class="total-price" data-total="${item.price * item.quantity}"><strong>Итого: ${formatPrice(item.price * item.quantity)}</strong></p>
                        </div>
                    </div>
                `).join('')}
            </div>
            <div class="order-item-actions">
                <button class="edit-btn">Редактировать</button>
                <button class="delete-btn">Удалить</button>
                <button class="compare-btn">Сравнить</button>
            </div>
            <hr>
        `;
        orderHistoryContainer.appendChild(orderElement);

        // Добавляем обработчики для кнопок редактирования, удаления и сравнения
        const editButton = orderElement.querySelector(".edit-btn");
        const deleteButton = orderElement.querySelector(".delete-btn");
        const compareButton = orderElement.querySelector(".compare-btn");

        editButton.addEventListener("click", function () {
            openEditOrderModal(order.id);
        });

        deleteButton.addEventListener("click", function () {
            deleteOrder(order.id);
        });

        compareButton.addEventListener("click", function () {
            toggleCompare(order.id, compareButton);
        });
    }

    // Остальной код остается без изменений

    // Загрузка истории заказов из Firebase
    function loadOrderHistory() {
        const ordersRef = database.ref('orders');
        ordersRef.on('value', (snapshot) => {
            orderHistoryContainer.innerHTML = ''; // Очистка контейнера перед загрузкой
            const orders = snapshot.val();
            if (orders) {
                const ordersArray = Object.keys(orders).map(key => {
                    const order = orders[key];
                    order.id = key;
                    return order;
                });
                // Сортировка заказов по дате создания (последние сверху)
                ordersArray.sort((a, b) => b.id.localeCompare(a.id));
                ordersArray.forEach(order => {
                    displayOrder(order);
                });
                updateAnalyticsData(); // Обновление аналитики
            }
        }, (error) => {
            console.error('Error loading orders:', error);
        });
    }

    // Сохранение корзины в localStorage (корзина остается локальной)
    function saveCart() {
        localStorage.setItem('cart', JSON.stringify(cart));
    }

    // Загрузка корзины из localStorage
    function loadCart() {
        const storedCart = JSON.parse(localStorage.getItem('cart'));
        if (storedCart && Array.isArray(storedCart)) {
            storedCart.forEach(item => cart.push(item));
            updateCart();
        }
    }

    // Удаление заказа из Firebase
    function deleteOrder(orderId) {
        const orderRef = database.ref('orders/' + orderId);
        orderRef.remove()
            .then(() => {
                const orderElement = orderHistoryContainer.querySelector(`[data-order-id="${orderId}"]`);
                if (orderElement) {
                    orderHistoryContainer.removeChild(orderElement);
                }
                // Удаление из списка сравнения, если присутствует
                const compareIndex = compareList.indexOf(orderId);
                if (compareIndex !== -1) {
                    compareList.splice(compareIndex, 1);
                    updateCompareList();
                }
                updateAnalyticsData(); // Обновление данных аналитики
            })
            .catch((error) => {
                console.error('Error deleting order:', error);
            });
    }

    // Открытие модального окна для редактирования заказа
    function openEditOrderModal(orderId) {
        const orderRef = database.ref('orders/' + orderId);
        orderRef.once('value')
            .then((snapshot) => {
                const order = snapshot.val();
                if (!order) return;

                editOrderId = orderId;

                // Заполнение полей формы редактирования заказа
                document.getElementById("edit-customer-name").value = order.customerName;
                document.getElementById("edit-phone").value = order.phone;
                document.getElementById("edit-company").value = order.company;

                editOrderModal.style.display = "flex";
            })
            .catch((error) => {
                console.error('Error fetching order for editing:', error);
            });
    }

    // Подтверждение редактирования заказа и обновление в Firebase
    document.getElementById("edit-order-form").addEventListener("submit", function (event) {
        event.preventDefault();
        const customerName = document.getElementById("edit-customer-name").value.trim();
        const phone = document.getElementById("edit-phone").value.trim();
        const company = document.getElementById("edit-company").value.trim();

        if (customerName === "" || phone === "" || company === "") {
            alert("Пожалуйста, заполните все поля.");
            return;
        }

        const orderRef = database.ref('orders/' + editOrderId);
        orderRef.update({
            customerName: customerName,
            phone: phone,
            company: company
        })
            .then(() => {
                // Обновление отображения заказа
                const orderElement = orderHistoryContainer.querySelector(`[data-order-id="${editOrderId}"]`);
                if (orderElement) {
                    orderElement.querySelector("h3").innerText = `Заказ от ${customerName} (${formatDate(orderElement.querySelector("h3").innerText.split('(')[1].slice(0, -1))})`;
                    const paragraphs = orderElement.querySelectorAll("p");
                    paragraphs[0].innerHTML = `<strong>Телефон:</strong> ${phone}`;
                    paragraphs[1].innerHTML = `<strong>Компания:</strong> ${company}`;
                }

                editOrderModal.style.display = "none";
                editOrderId = null;
            })
            .catch((error) => {
                console.error('Error updating order:', error);
            });
    });

    // Закрытие модального окна редактирования заказа
    document.querySelector("#modal-edit-order .close").addEventListener("click", function () {
        editOrderModal.style.display = "none";
        editOrderId = null;
    });

    // Функция для добавления или удаления заказа из списка сравнения
    function toggleCompare(orderId, button) {
        const index = compareList.indexOf(orderId);
        if (index === -1) {
            if (compareList.length >= 3) { // Ограничение на 3 заказа для сравнения
                alert("Вы можете сравнить максимум 3 заказа.");
                return;
            }
            compareList.push(orderId);
            button.innerText = "Убрать из сравнения";
            alert("Заказ добавлен в список сравнения.");
        } else {
            compareList.splice(index, 1);
            button.innerText = "Сравнить";
            alert("Заказ удален из списка сравнения.");
        }
        updateCompareList();
    }

    // Функция для обновления списка сравнения и сохранения в localStorage
    function updateCompareList() {
        localStorage.setItem('compareList', JSON.stringify(compareList));
    }

    // Загрузка списка сравнения из localStorage
    function loadCompareList() {
        const storedCompareList = JSON.parse(localStorage.getItem('compareList'));
        if (storedCompareList && Array.isArray(storedCompareList)) {
            storedCompareList.forEach(orderId => {
                if (!compareList.includes(orderId)) {
                    compareList.push(orderId);
                }
            });
        }
    }

    // Обработчик кнопки "Сравнить выбранные"
    document.getElementById("compare-selected").addEventListener("click", function () {
        if (compareList.length === 0) {
            alert("Выберите заказы для сравнения.");
            return;
        }
        displayCompareList();
        compareModal.style.display = "flex";
    });

    // Отображение списка сравнения в модальном окне
    function displayCompareList() {
        const compareItemsContainer = document.getElementById("compare-list");
        compareItemsContainer.innerHTML = "";
        let totalComparePrice = 0;

        let loadedOrders = 0;
        compareList.forEach(orderId => {
            const orderRef = database.ref('orders/' + orderId);
            orderRef.once('value')
                .then((snapshot) => {
                    const order = snapshot.val();
                    if (order && order.items && Array.isArray(order.items)) {
                        order.items.forEach(item => {
                            const compareItemElement = document.createElement("div");
                            compareItemElement.classList.add("compare-item");
                            compareItemElement.innerHTML = `
                                <img src="${item.image}" alt="${item.name}">
                                <div>
                                    <p><strong>${item.name}</strong></p>
                                    <p>Размер: ${item.size}</p>
                                    <p>Цвет: ${item.color}</p>
                                    <p>Количество: ${item.quantity}</p>
                                    <p>Заметки: ${item.notes}</p>
                                    <p class="price" data-price="${item.price}">Цена за единицу: ${formatPrice(item.price)}</p>
                                    <p class="total-price" data-total="${item.price * item.quantity}"><strong>Итого: ${formatPrice(item.price * item.quantity)}</strong></p>
                                </div>
                            `;
                            compareItemsContainer.appendChild(compareItemElement);
                            totalComparePrice += item.price * item.quantity;
                        });
                    }

                    loadedOrders++;
                    if (loadedOrders === compareList.length) {
                        // Добавление общего итога сравнения
                        if (compareList.length > 0) {
                            const totalElement = document.createElement("div");
                            totalElement.classList.add("compare-total");
                            totalElement.innerHTML = `<p><strong>Общая сумма сравнения: ${formatPrice(totalComparePrice)}</strong></p>`;
                            compareItemsContainer.appendChild(totalElement);
                        }
                    }
                })
                .catch((error) => {
                    console.error('Error loading order for comparison:', error);
                });
        });
    }

    // Закрытие модального окна сравнения
    document.querySelector("#modal-compare .close").addEventListener("click", function () {
        compareModal.style.display = "none";
    });

    // Очистка списка сравнения после закрытия модального окна
    compareModal.addEventListener("click", function (event) {
        if (event.target === compareModal) {
            compareModal.style.display = "none";
        }
    });

    // Инициализация умной даты в форме заказа
    function initializeSmartDate() {
        const deliveryDateInput = document.getElementById("delivery-date");
        const today = new Date();
        const minDate = new Date(today.setDate(today.getDate() + 20));
        const yyyy = minDate.getFullYear();
        const mm = String(minDate.getMonth() + 1).padStart(2, '0');
        const dd = String(minDate.getDate()).padStart(2, '0');
        const minDateStr = `${yyyy}-${mm}-${dd}`;
        deliveryDateInput.setAttribute("min", minDateStr);
        deliveryDateInput.value = minDateStr;
    }

    // Форматирование даты в удобный вид
    function formatDate(dateStr) {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const date = new Date(dateStr);
        return date.toLocaleDateString('ru-RU', options);
    }

    // Форматирование цены в выбранной валюте
    function formatPrice(priceInUZS) {
        if (selectedCurrency === 'UZS') {
            return `${priceInUZS.toLocaleString('ru-RU')} UZS`;
        } else if (selectedCurrency === 'USD') {
            const priceInUSD = priceInUZS / exchangeRates['USD'];
            return `$${priceInUSD.toFixed(2)}`;
        }
    }

    // Обновление всех цен на странице при смене валюты
    function updateAllPrices() {
        // Обновление цен в модальных окнах фасонов
        document.querySelectorAll(".price").forEach(priceElement => {
            const priceInUZS = parseFloat(priceElement.getAttribute("data-price"));
            priceElement.innerText = `Цена: ${formatPrice(priceInUZS)}`;
        });

        // Обновление цен в корзине
        document.querySelectorAll(".cart-item .price").forEach(priceElement => {
            const priceInUZS = parseFloat(priceElement.getAttribute("data-price"));
            priceElement.innerText = formatPrice(priceInUZS);
        });

        document.querySelectorAll(".cart-item .total-price").forEach(totalPriceElement => {
            const totalInUZS = parseFloat(totalPriceElement.getAttribute("data-total"));
            totalPriceElement.innerText = `Итого: ${formatPrice(totalInUZS)}`;
        });

        // Обновление цен в истории заказов
        document.querySelectorAll(".order-item .order-item-details .price").forEach(priceElement => {
            const priceInUZS = parseFloat(priceElement.getAttribute("data-price"));
            priceElement.innerText = `Цена за единицу: ${formatPrice(priceInUZS)}`;
        });

        document.querySelectorAll(".order-item .order-item-details .total-price").forEach(totalPriceElement => {
            const totalInUZS = parseFloat(totalPriceElement.getAttribute("data-total"));
            totalPriceElement.innerText = `Итого: ${formatPrice(totalInUZS)}`;
        });

        // Обновление цен в списке сравнения
        document.querySelectorAll(".compare-item .price").forEach(priceElement => {
            const priceInUZS = parseFloat(priceElement.getAttribute("data-price"));
            priceElement.innerText = `Цена за единицу: ${formatPrice(priceInUZS)}`;
        });

        document.querySelectorAll(".compare-item .total-price").forEach(totalPriceElement => {
            const totalInUZS = parseFloat(totalPriceElement.getAttribute("data-total"));
            totalPriceElement.innerText = `Итого: ${formatPrice(totalInUZS)}`;
        });

        // Обновление аналитики
        updateAnalyticsCharts();
    }

    // Инициализация Аналитики
    function initializeAnalytics() {
        // Инициализация графиков
        const monthlySalesCtx = document.getElementById('monthly-sales-chart').getContext('2d');
        window.monthlySalesChart = new Chart(monthlySalesCtx, {
            type: 'bar',
            data: {
                labels: [], // Месяцы
                datasets: [{
                    label: 'Продажи (UZS)',
                    data: [],
                    backgroundColor: 'rgba(54, 162, 235, 0.6)',
                    borderColor: 'rgba(54, 162, 235, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { display: false },
                    title: { display: true, text: 'Месячные продажи' }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return formatPrice(value);
                            }
                        }
                    }
                }
            }
        });

        const topProductsCtx = document.getElementById('top-products-chart').getContext('2d');
        window.topProductsChart = new Chart(topProductsCtx, {
            type: 'pie',
            data: {
                labels: [], // Названия товаров
                datasets: [{
                    label: 'Продажи по товарам',
                    data: [],
                    backgroundColor: [
                        'rgba(255, 99, 132, 0.6)',
                        'rgba(54, 162, 235, 0.6)',
                        'rgba(255, 206, 86, 0.6)',
                        'rgba(75, 192, 192, 0.6)',
                        'rgba(153, 102, 255, 0.6)',
                        'rgba(255, 159, 64, 0.6)'
                    ],
                    borderColor: [
                        'rgba(255, 99, 132, 1)',
                        'rgba(54, 162, 235, 1)',
                        'rgba(255, 206, 86, 1)',
                        'rgba(75, 192, 192, 1)',
                        'rgba(153, 102, 255, 1)',
                        'rgba(255, 159, 64, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    title: { display: true, text: 'Топ-5 наиболее продаваемых товаров' }
                }
            }
        });

        // Обновление аналитики при загрузке
        updateAnalyticsData();
    }

    // Обновление данных аналитики
    function updateAnalyticsData() {
        const ordersRef = database.ref('orders');
        ordersRef.once('value', (snapshot) => {
            const ordersObj = snapshot.val();
            if (ordersObj) {
                const orders = Object.values(ordersObj);
                const monthlySales = {};
                const productSales = {};

                orders.forEach(order => {
                    if (!order.items || !Array.isArray(order.items)) {
                        console.warn("Пропущен заказ без корректного массива items:", order);
                        return; // Пропускаем некорректные заказы
                    }

                    order.items.forEach(item => {
                        // Месячные продажи
                        const deliveryDate = new Date(item.deliveryDate);
                        const month = deliveryDate.toLocaleString('default', { month: 'long', year: 'numeric' });
                        if (monthlySales[month]) {
                            monthlySales[month] += item.price * item.quantity;
                        } else {
                            monthlySales[month] = item.price * item.quantity;
                        }

                        // Продажи по товарам
                        if (productSales[item.name]) {
                            productSales[item.name] += item.quantity;
                        } else {
                            productSales[item.name] = item.quantity;
                        }
                    });
                });

                // Обновление графика месячных продаж
                const months = Object.keys(monthlySales).sort((a, b) => {
                    const [monthA, yearA] = a.split(' ');
                    const [monthB, yearB] = b.split(' ');
                    const dateA = new Date(`${monthA} 1, ${yearA}`);
                    const dateB = new Date(`${monthB} 1, ${yearB}`);
                    return dateA - dateB;
                });
                const salesData = months.map(month => monthlySales[month]);

                window.monthlySalesChart.data.labels = months;
                window.monthlySalesChart.data.datasets[0].data = salesData;
                window.monthlySalesChart.update();

                // Определение топ-5 товаров
                const sortedProducts = Object.entries(productSales)
                    .sort((a, b) => b[1] - a[1])
                    .slice(0, 5);
                const topProductNames = sortedProducts.map(entry => entry[0]);
                const topProductQuantities = sortedProducts.map(entry => entry[1]);

                window.topProductsChart.data.labels = topProductNames;
                window.topProductsChart.data.datasets[0].data = topProductQuantities;
                window.topProductsChart.update();
            }
        }, (error) => {
            console.error('Error updating analytics:', error);
        });
    }

    // Функция для обновления графиков аналитики
    function updateAnalyticsCharts() {
        updateAnalyticsData();
    }

    // Инициализация списка сравнения
    loadCompareList();
});
