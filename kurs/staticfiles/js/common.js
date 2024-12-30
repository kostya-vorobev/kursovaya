// Объект для хранения всех функций приложения
const AppManager = {
    // Инициализация таблицы физических лиц
    initFizLitsoTable: function() {
        if ($('#fizLitsoTable').length === 0) return; // Проверяем наличие таблицы
        
        var $table = $('#fizLitsoTable');
        
        // Инициализация таблицы
        $table.bootstrapTable({
            locale: 'ru-RU',
            search: true,
            searchAlign: 'left',
            showColumns: true,
            showRefresh: true,
            showToggle: true,
            filterControl: true,
            pagination: true,
            pageSize: 10,
            pageList: [10, 25, 50, 100, 'All'],
            filterShowClear: true,
            sidePagination: 'client',
            icons: {
                refresh: 'fas fa-sync',
                toggle: 'fas fa-list',
                columns: 'fas fa-columns'
            },
            onPostBody: function() {
                // Инициализация datepicker для фильтра даты с з��держкой
                setTimeout(function() {
                    $('[data-filter-control="datepicker"]').datepicker({
                        format: 'dd.mm.yyyy',
                        language: 'ru',
                        autoclose: true,
                        todayHighlight: true
                    });
                }, 200);

                // Инициализация маски для телефона
                if ($.fn.mask) {
                    $('[data-field="telefon"] input').mask('+7(999)999-99-99');
                }
            }
        });

        // Кнопка сброса фильтров
        $('#clearFilters').click(function() {
            $table.bootstrapTable('clearFilterControl');
            $table.bootstrapTable('refresh');
        });

        // Валидация формы
        $('#fizicheskoe_litso_form').on('submit', function(event) {
            if (!this.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            $(this).addClass('was-validated');
        });

        // Инициализация datepicker для поля даты рождения в форме
        initFormDatepicker();
    },

    // Отдельная функция для инициализации datepicker в форме
    initFormDatepicker: function() {
        $('#id_data_rozhdeniya').datepicker({
            format: 'dd.mm.yyyy',
            language: 'ru',
            autoclose: true,
            todayHighlight: true,
            endDate: new Date(),
            orientation: 'bottom auto'
        });

        // Добавляем иконку календаря, если её нет
        if ($('#id_data_rozhdeniya').parent('.input-group').length === 0) {
            $('#id_data_rozhdeniya').wrap('<div class="input-group"></div>');
            $('#id_data_rozhdeniya').after(
                '<span class="input-group-text">' +
                '<i class="fas fa-calendar"></i>' +
                '</span>'
            );
        }

        // Открытие календаря по клику на иконку
        $(document).on('click', '#id_data_rozhdeniya + .input-group-text', function() {
            $('#id_data_rozhdeniya').datepicker('show');
        });
    },

    // Инициализация фильтров личного дела
    initLichnoeDeloFilters: function() {
        const filterTable = function() {
            const fio = $('#filterFIO').val().toLowerCase();
            const nomer = $('#filterNomer').val().toLowerCase();
            const original = $('#filterOriginal').val();

            $('#lichnoeDelo_table tbody tr').each(function() {
                const row = $(this);
                let showRow = true;

                if (fio && !row.find('td:eq(0)').text().toLowerCase().includes(fio)) {
                    showRow = false;
                }
                if (nomer && !row.find('td:eq(1)').text().toLowerCase().includes(nomer)) {
                    showRow = false;
                }
                if (original) {
                    const hasOriginal = row.find('td:eq(2) .badge').hasClass('bg-success');
                    if (original === 'true' && !hasOriginal || original === 'false' && hasOriginal) {
                        showRow = false;
                    }
                }

                row.toggle(showRow);
            });
        };

        $('#filterFIO, #filterNomer, #filterOriginal').on('input change', filterTable);
        $('#clearFilters').click(function() {
            $('.table thead input, .table thead select').val('');
            filterTable();
        });
    },

    // Инициализация после загрузки контента
    initDynamicContent: function() {
        this.initZayavlenieTable();
        // Инициализация Select2
        if ($.fn.select2) {
            $('.select2').select2({
                width: '100%',
                language: 'ru'
            });
        }

        // Инициализация датапикера
        if ($.fn.datepicker) {
            $('.datepicker').datepicker({
                format: 'dd.mm.yyyy',
                language: 'ru',
                autoclose: true,
                todayHighlight: true
            });
        }

        // Инициализация таблицы
        this.initZayavlenieTable();

        // Инициализация формы
        this.initZayavlenieForm();
    },

    // Инициализация обработчиков событий вкладок
    initTabs: function() {
        const self = this;
        
        // Обработчик клика по кнопке "Заявления" в личном деле
        $(document).on('click', '.select-lichnoe-delo', function(e) {
            e.preventDefault();
            const lichnoeDeloId = $(this).data('lichnoe-delo-id');
            console.log('Selected lichnoe delo:', lichnoeDeloId); // Отладка
            window.switchToZayavlenieTab(lichnoeDeloId);
        });

        // Обработка переключения вкладок
        $(document).on('shown.bs.tab', 'a[data-toggle="tab"]', function(e) {
            const $tab = $(e.target);
            const target = $tab.attr('href');
            const url = $tab.data('url');
            
            console.log('Tab switched to:', target, 'URL:', url); // Отладка

            if (url && !$tab.hasClass('disabled')) {
                const params = {};
                const selectedFizLitsoId = localStorage.getItem('selectedFizLitsoId');
                const selectedLichnoeDeloId = localStorage.getItem('selectedLichnoeDeloId');

                if (selectedFizLitsoId && (target === '#dokument' || target === '#lichnoeDelo')) {
                    params.fizlitso_id = selectedFizLitsoId;
                }
                if (selectedLichnoeDeloId && target === '#zayavlenie') {
                    params.lichnoe_delo_id = selectedLichnoeDeloId;
                }

                $.ajax({
                    url: url,
                    type: 'GET',
                    data: params,
                    success: function(data) {
                        $(target).html(data);
                        self.initDynamicContent();
                    },
                    error: function(xhr, status, error) {
                        console.error('Error loading tab content:', error); // Отладка
                        alert('Ошибка при загрузке содержимого вкладки');
                    }
                });
            }
        });

        // Загрузка начальной вкладки
        const activeTab = $('.nav-tabs .active');
        if (activeTab.length) {
            const url = activeTab.data('url');
            if (url) {
                $.ajax({
                    url: url,
                    type: 'GET',
                    success: function(data) {
                        $(activeTab.attr('href')).html(data);
                        self.initDynamicContent();
                    },
                    error: function(xhr, status, error) {
                        console.error('Error loading initial tab:', error); // Отладка
                    }
                });
            }
        }
    },

    // Инициализация форм
    initForms: function() {
        // Валидация формы физического лица
        $('#fizicheskoe_litso_form').on('submit', function(event) {
            if (!this.checkValidity()) {
                event.preventDefault();
                event.stopPropagation();
            }
            $(this).addClass('was-validated');
        });

        // Инициализация datepicker
        if ($('#id_data_rozhdeniya').length) {
            $('#id_data_rozhdeniya').datepicker({
                format: 'dd.mm.yyyy',
                language: 'ru',
                autoclose: true,
                todayHighlight: true,
                max: new Date(),
                endDate: new Date(),
                orientation: 'bottom auto'
            });

            if ($('#id_data_rozhdeniya').parent('.input-group').length === 0) {
                $('#id_data_rozhdeniya').wrap('<div class="input-group"></div>')
                    .after('<span class="input-group-text"><i class="fas fa-calendar"></i></span>');
            }
        }

        // Инициализация select2 для селектора специальности
        $('select[name="napravlenie"]')
            .addClass('form-control')
            .select2({
                placeholder: 'Выберите специальность',
                allowClear: true,
                width: '100%',
                theme: 'bootstrap4',
                dropdownParent: $('select[name="napravlenie"]').parent(),
                // Добавляем поиск
                minimumInputLength: 0,
                maximumInputLength: 20,
                minimumResultsForSearch: 5, // показывать поиск если больше 5 опций
                language: {
                    noResults: function() {
                        return "Ничего не найдено";
                    },
                    searching: function() {
                        return "Поиск...";
                    },
                    inputTooShort: function() {
                        return "Пожалуйста, введите больше символов";
                    },
                    inputTooLong: function() {
                        return "Пожалуйста, введите меньше символов";
                    }
                }
            }).on('select2:select', function(e) {
                const selectedData = e.params.data;
                $(this).select2('trigger', 'select', {
                    data: selectedData
                });
            });

        // При программном изменении значения тоже обновляем отображение
        $('select[name="napravlenie"]').on('change', function() {
            const selectedOption = $(this).find('option:selected');
            if (selectedOption.val()) {
                const text = selectedOption.text();
                $('#select2-' + $(this).attr('id') + '-container').text(text);
                $('#select2-' + $(this).attr('id') + '-container').attr('title', text);
            }
        });

        // Инициализация datepicker для даты подачи
        $('.form-control.datepicker').datepicker({
            format: 'dd.mm.yyyy',
            language: 'ru',
            autoclose: true,
            todayHighlight: true,
            max: new Date(),
            endDate: new Date(),
            orientation: 'bottom auto'
        }).on('changeDate', function(e) {
            // Дополнительная проверка при изменении даты
            const selectedDate = e.date;
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (selectedDate > today) {
                $(this).val(''); // Очищаем поле
                alert('Нельзя выбрать дату позднее текущей');
            }
        });

        // Добавляем проверку при ручном вводе
        $('.form-control.datepicker').on('input', function() {
            const inputDate = $(this).datepicker('getDate');
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            if (inputDate && inputDate > today) {
                $(this).val(''); // Очищаем поле
                alert('Нельзя выбрать дату позднее текущей');
            }
        });

        // Добавляем иконку календаря
        if ($('.form-control.datepicker').parent('.input-group').length === 0) {
            $('.form-control.datepicker')
                .wrap('<div class="input-group"></div>')
                .after('<span class="input-group-text"><i class="fas fa-calendar"></i></span>');
        }

        // Дополнительное ограничение через установку атрибута max
        $('.form-control.datepicker').each(function() {
            const today = new Date();
            const dd = String(today.getDate()).padStart(2, '0');
            const mm = String(today.getMonth() + 1).padStart(2, '0');
            const yyyy = today.getFullYear();
            const maxDate = yyyy + '-' + mm + '-' + dd;
            $(this).attr('max', maxDate);
        });

        // Блокировка будущих дат в календаре
        $.fn.datepicker.dates['ru'].today = "Сегодня";
        $('.form-control.datepicker').datepicker('setEndDate', new Date());
    },

    // Глобальные функции для работы с вкладками
    initGlobalFunctions: function() {
        // Функция включения вкладки заявлений
        window.enableZayavlenieTab = function() {
            $('#zayavlenie-tab').removeClass('disabled');
        };

        // Функция переключения на вкладку заявлений
        window.switchToZayavlenieTab = function(lichnoeDeloId) {
            console.log('Switching to zayavlenie tab with ID:', lichnoeDeloId); // Отладка
            localStorage.setItem('selectedLichnoeDeloId', lichnoeDeloId);
            
            const zayavlenieTab = $('#zayavlenie-tab');
            const url = zayavlenieTab.data('url');
            
            zayavlenieTab.removeClass('disabled');

            if (url) {
                $.ajax({
                    url: url,
                    type: 'GET',
                    data: { lichnoe_delo_id: lichnoeDeloId },
                    success: function(data) {
                        $('#zayavlenie').html(data);
                        zayavlenieTab.tab('show');
                        AppManager.initDynamicContent();
                    },
                    error: function(xhr, status, error) {
                        console.error('Error loading zayavlenie:', error); // Отладка
                        alert('Ошибка при загрузке заявлений');
                    }
                });
            }
        };

        // Функция открытия связанных вкладок
        window.openRelatedTabs = function(fizlitsoId) {
            console.log('Opening related tabs for fizlitso:', fizlitsoId); // Отладка
            localStorage.setItem('selectedFizLitsoId', fizlitsoId);
            
            const dokumentTab = $('#dokument-tab');
            const lichnoeDeloTab = $('#lichnoeDelo-tab');
            
            dokumentTab.removeClass('disabled');
            lichnoeDeloTab.removeClass('disabled');
            
            dokumentTab.tab('show');
        };
    },

    // Инициализация таблицы заявлений
    initZayavlenieTable: function() {
        const $table = $('#table');
        if (!$table.length) return;

        // Если таблица уже инициализирована, просто обновляем форматтер и возвращаемся
        if ($table.data('bootstrap.table')) {
            this.updateTableActions($table);
            return;
        }

        // Добавляем форматтер для колонки действий
        this.updateTableActions($table);

        // Добавляем обработчики событий для кнопок (только один раз)
        if (!this.actionsInitialized) {
            this.initTableActions($table);
            this.actionsInitialized = true;
        }
    },

    // Метод для обновления форматтера действий
    updateTableActions: function($table) {
        $table.find('td:last-child').each(function() {
            const rowId = $(this).closest('tr').data('id');
            if (rowId) {
                $(this).html(`
                    <div class="btn-group">
                        <button class="btn btn-info btn-sm edit-zayavlenie" 
                                data-id="${rowId}" 
                                title="Редактировать">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn btn-danger btn-sm delete-zayavlenie" 
                                data-id="${rowId}" 
                                title="Удалить">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                `);
            }
        });
    },

    // Метод для инициализации обработчиков событий
    initTableActions: function($table) {
        // Обработчик удаления
        $(document).on('click', '.delete-zayavlenie', function(e) {
            e.preventDefault();
            const id = $(this).data('zayavlenie-id');
            if (confirm('Вы уверены, что хотите удалить это заявление?')) {
                $.ajax({
                    url: '/delete_zayavlenie/',
                    type: 'POST',
                    data: {
                        'id': id,
                        'csrfmiddlewaretoken': $('input[name=csrfmiddlewaretoken]').val()
                    },
                    success: function(response) {
                        if (response.success) {
                            // Обновляем только содержимое таблицы
                            $table.find(`tr[data-id="${id}"]`).remove();
                        } else {
                            alert('Ошибка при удалении');
                        }
                    }
                });
            }
        });

        // Обработчик редактирования
        $(document).on('click', '.edit-zayavlenie', function(e) {
            e.preventDefault();
            const id = $(this).data('id');
            $.ajax({
                url: '/get_zayavlenie_data/',
                type: 'GET',
                data: { id: id },
                success: function(data) {
                    if (data.success) {
                        // Заполняем форму данными
                        const $napravlenieSelect = $('select[name="napravlenie"]');
                        
                        // Убедимся, что опции загружены
                        if ($napravlenieSelect.find('option').length <= 1) {
                            // Если опций нет, загружаем их и потом устанавливаем значение
                            $.get('/get_specialnosti/', function(specialnosti) {
                                $napravlenieSelect.empty();
                                $napravlenieSelect.append('<option value="">Выберите специальность</option>');
                                specialnosti.forEach(function(item) {
                                    $napravlenieSelect.append(
                                        `<option value="${item.id}">${item.naim}</option>`
                                    );
                                });
                                $napravlenieSelect.val(data.napravlenie_id);
                            });
                        } else {
                            // Если опции уже есть, просто устанавливаем значение
                            $napravlenieSelect.val(data.napravlenie_id);
                        }

                        // Устанавливаем остальные значения
                        $('select[name="prioritet"]').val(data.prioritet);
                        $('input[name="data_podachi"]').val(data.data_podachi);
                        $('select[name="konkursnaya_gruppa"]').val(data.konkursnaya_gruppa_id);
                        
                        // Прокручиваем страницу к форме
                        $('html, body').animate({
                            scrollTop: $("#zayavlenieForm").offset().top
                        }, 500);
                    }
                }
            });
        });
    },

    // Получение данных из существующей таблицы
    getTableData: function($table) {
        const data = [];
        $table.find('tbody tr').each(function() {
            if (!$(this).find('td[colspan]').length) { // Пропускаем строки "Нет заявлений"
                data.push({
                    napravlenie: $(this).find('td:eq(0)').text(),
                    summa: $(this).find('td:eq(1)').text(),
                    prioritet: $(this).find('td:eq(2)').text(),
                    gruppa: $(this).find('td:eq(3)').text(),
                    data: $(this).find('td:eq(4)').text(),
                    id: $(this).data('id')
                });
            }
        });
        return data;
    },

    // Инициализация формы заявления
    initZayavlenieForm: function() {
        const self = this;
        const $form = $('#zayavlenieForm');
        if (!$form.length) return;

        // Обрабо��чик изменения направления
        $('select[name="napravlenie"]').on('change', function() {
            const napravlenieId = $(this).val();
            if (napravlenieId) {
                $('#predmety_container').show();
                // Загружаем предметы для выбранной специальности
                $.ajax({
                    url: '/get_predmety/',
                    data: { 'napravlenie_id': napravlenieId },
                    success: function(response) {
                        if (response.predmety) {
                            updatePredmetySelects(response.predmety);
                        }
                    }
                });
            } else {
                $('#predmety_container').hide();
            }
        });

        // Функция обновления списков предметов
        function updatePredmetySelects(predmety) {
            // Для каждой формы результата
            for (var i = 0; i < 3; i++) {
                var select = $(`select[name="rezultat_${i}-pk_predmet"]`);
                var currentValue = select.val();
                
                select.empty();
                select.append('<option value="">Выберите предмет</option>');
                
                predmety.forEach(function(predmet) {
                    select.append(
                        $('<option></option>')
                            .val(predmet.id)
                            .text(predmet.name)
                    );
                });

                if (currentValue && predmety.some(p => p.id == currentValue)) {
                    select.val(currentValue);
                }
            }
            updatePredmetyAvailability();
        }

        // Функция обновления доступности предметов
        function updatePredmetyAvailability() {
            var selectedPredmety = $('select[name*="pk_predmet"]').map(function() {
                return $(this).val();
            }).get().filter(Boolean);

            $('select[name*="pk_predmet"]').each(function() {
                var currentSelect = $(this);
                var currentValue = currentSelect.val();

                currentSelect.find('option').each(function() {
                    var optionValue = $(this).val();
                    if (optionValue && optionValue !== currentValue) {
                        $(this).prop('disabled', selectedPredmety.includes(optionValue));
                    }
                });
            });
        }

        // Обработчик изменения предмета
        $('select[name*="pk_predmet"]').on('change', function() {
            updatePredmetyAvailability();
        });

        // Обработка отправки формы
        $form.off('submit').on('submit', function(e) {
            e.preventDefault();
            const formData = new FormData(this);
            const selectedText = $('#id_napravlenie option:selected').text();
            $('#napravlenie_text').val(selectedText);

            $.ajax({
                url: $(this).attr('action'),
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    if (response.success) {
                        alert(response.message);
                        window.location.reload();
                    } else {
                        alert('Ошибка: ' + response.message);
                    }
                },
                error: function(xhr, status, error) {
                    alert('Произошла ошибка при сохранении: ' + error);
                }
            });
        });

        // Инициализация обработки приоритетов
        this.initPriorityHandling();
    },

    // Обработка приоритетов
    initPriorityHandling: function() {
        function updatePrioritySelect() {
            const usedPriorities = [];
            $('#table tbody tr').each(function() {
                const priority = parseInt($(this).find('td:eq(2)').text());
                if (!isNaN(priority)) {
                    usedPriorities.push(priority);
                }
            });

            const prioritySelect = $('#id_prioritet');
            const currentValue = prioritySelect.val();
            
            prioritySelect.empty()
                .append('<option value="">Выберите приоритет</option>');
            
            for (let i = 1; i <= 5; i++) {
                if (!usedPriorities.includes(i)) {
                    prioritySelect.append(`<option value="${i}">${i}</option>`);
                }
            }
            
            if (currentValue && !usedPriorities.includes(parseInt(currentValue))) {
                prioritySelect.val(currentValue);
            }
        }

        updatePrioritySelect();

        $('#id_prioritet').on('change', function() {
            const selectedPriority = parseInt($(this).val());
            const usedPriorities = [];
            $('#table tbody tr').each(function() {
                const priority = parseInt($(this).find('td:eq(2)').text());
                if (!isNaN(priority)) {
                    usedPriorities.push(priority);
                }
            });
            
            if (usedPriorities.includes(selectedPriority)) {
                alert('Этот приоритет уже использован!');
                $(this).val('');
                updatePrioritySelect();
            }
        });
    },

    // Инициализация всех компонентов заявления
    initZayavlenie: function() {
        this.initZayavlenieTable();
        this.initZayavlenieForm();
    },

    // Обработчики предметов
    initPredmetHandlers: function() {
        const self = this;
        $('select[name*="pk_predmet"]').on('change', function() {
            self.updatePredmetyAvailability();
        });

        $(document).ready(function() {
            // Получаем текущие предметы из селекторов
            var predmety = [];
            $('select[name*="pk_predmet"] option').each(function() {
                if ($(this).val()) {
                    predmety.push({
                        id: $(this).val(),
                        name: $(this).text()
                    });
                }
            });
            
            // Обновляем селекторы с текущими предметами
            self.updatePredmetySelects(predmety);
        });
    },

    // Общая инициализация
    init: function() {
        const self = this;
        $(document).ready(function() {
            self.initTabs();
            self.initGlobalFunctions();

            // Обработчик для динамически загруженного контента
            $(document).ajaxComplete(function(event, xhr, settings) {
                if (settings.url && settings.url.includes('load_zayavlenie')) {
                    self.initDynamicContent();
                }
            });
        });
    }
};

// Глобальные форматтеры и обработчики событий для таблицы заявлений
window.actionFormatter = function(value, row) {
    return [
        '<div class="btn-group" role="group">',
        '<button class="btn btn-danger btn-sm delete-zayavlenie" title="Удалить">',
        '<i class="bi bi-trash"></i> Удалить',
        '</button>',
        '</div>'
    ].join('');
};

window.actionEvents = {
    'click .delete-zayavlenie': function(e, value, row) {
        if (confirm('Вы уверены, что хотите удалить это заявление?')) {
            $.ajax({
                url: '/delete_zayavlenie/',
                type: 'POST',
                data: {
                    'id': $(e.target).closest('tr').data('id'),
                    'csrfmiddlewaretoken': $('input[name=csrfmiddlewaretoken]').val()
                },
                success: function(response) {
                    if (response.success) {
                        $('#table').bootstrapTable('refresh');
                    } else {
                        alert('Ошибка при удалении');
                    }
                }
            });
        }
    }
};

// Функция инициализации таблицы документов
function initDokumentTable() {
    if ($('#dokumentTable').length === 0) return; // Проверяем наличие таблицы
    
    var $table = $('#dokumentTable');
    
    // Инициализация таблицы
    $table.bootstrapTable({
        locale: 'ru-RU',
        search: true,
        searchAlign: 'left',
        showColumns: true,
        showRefresh: true,
        showToggle: true,
        filterControl: true,
        pagination: true,
        pageSize: 10,
        pageList: [10, 25, 50, 100, 'All'],
        filterShowClear: true,
        sidePagination: 'client',
        icons: {
            refresh: 'fas fa-sync',
            toggle: 'fas fa-list',
            columns: 'fas fa-columns'
        },
        onPostBody: function() {
            // Инициализация datepicker для фильтров даты
            setTimeout(function() {
                $('[data-filter-control="datepicker"]').datepicker({
                    format: 'dd.mm.yyyy',
                    language: 'ru',
                    autoclose: true,
                    todayHighlight: true
                });
            }, 200);
        }
    });

    // Кнопка сброса фильтров
    $('#clearFilters').click(function() {
        $table.bootstrapTable('clearFilterControl');
        $table.bootstrapTable('refresh');
    });

    // Инициализация datepicker для полей даты в форме документа
    initDokumentFormDatepickers();
}

// Отдельная функция для инициализации datepicker в форме документа
function initDokumentFormDatepickers() {
    // Инициализация для даты выдачи
    $('#id_data_vydachi').datepicker({
        format: 'dd.mm.yyyy',
        language: 'ru',
        autoclose: true,
        todayHighlight: true,
        endDate: new Date(),
        orientation: 'bottom auto'
    });

    // Инициализация для даты рождения
    $('#id_data_rozhdeniya').datepicker({
        format: 'dd.mm.yyyy',
        language: 'ru',
        autoclose: true,
        todayHighlight: true,
        endDate: new Date(),
        orientation: 'bottom auto'
    });

    // Добавляем иконки календаря для обоих полей
    ['#id_data_vydachi', '#id_data_rozhdeniya'].forEach(function(selector) {
        if ($(selector).parent('.input-group').length === 0) {
            $(selector).wrap('<div class="input-group"></div>');
            $(selector).after(
                '<span class="input-group-text">' +
                '<i class="fas fa-calendar"></i>' +
                '</span>'
            );
        }

        // Открытие календаря по клику на иконку
        $(document).on('click', selector + ' + .input-group-text', function() {
            $(selector).datepicker('show');
        });
    });
}

// Инициализация приложения
AppManager.init(); 