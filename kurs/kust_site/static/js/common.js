// Объект для хранения всех функций приложения
const AppManager = {
    // Инициализация таблицы физических лиц
    initFizLitsoTable: function() {
        if ($('#fizLitsoTable').length === 0) return;
        
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
            columns: [{
                field: 'familiya',
                title: 'Фамилия',
                sortable: true,
                filterControl: 'input',
                filterStrictSearch: false
            }, {
                field: 'imya',
                title: 'Имя',
                sortable: true,
                filterControl: 'input',
                filterStrictSearch: false
            }, {
                field: 'otchestvo',
                title: 'Отчество',
                sortable: true,
                filterControl: 'input',
                filterStrictSearch: false
            }, {
                field: 'data_rozhdeniya',
                title: 'Дата рождения',
                sortable: true,
                filterControl: 'datepicker',
                filterDatepickerOptions: {
                    format: 'dd.mm.yyyy',
                    language: 'ru',
                    autoclose: true,
                    todayHighlight: true
                }
            }, {
                field: 'telefon',
                title: 'Телефон',
                sortable: true,
                filterControl: 'input',
                filterStrictSearch: false
            }, {
                field: 'actions',
                title: 'Действия',
                sortable: false,
                filterControl: false
            }],
            onPostBody: function() {
                // Инициализация datepicker для фильтра даты с задержкой
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

        // Добавляем валидацию формы
        this.validateZayavlenieForm();
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
                        alert('Ошибка при загрузке содержимого страницы');
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
    initDokumentTable: function() {
        if ($('#dokumentTable').length === 0) return;
        
        var $table = $('#dokumentTable');
        // Уничтожаем существующую таблицу если она есть
        if ($.fn.bootstrapTable.Constructor.DEFAULTS) {
            $table.bootstrapTable('destroy');
        }
        
        // Инициализация таблицы
        $table.bootstrapTable({
            locale: 'ru-RU',
            search: true,
            showColumns: true,
            showRefresh: true,
            showToggle: true,
            searchAlign: 'left',
            filterControl: true,
            filterControlVisible: true,
            filterControlContainer: '#filterControls',
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
                    $('.datepicker-filter-control').datepicker({
                        format: 'dd.mm.yyyy',
                        language: 'ru',
                        autoclose: true
                    });
                }, 200);
            }
        });
        $table.bootstrapTable('refresh').$button.name = "refresh1";
        // Добавляем стили для контейнера фильтров
        $('#filterControls').addClass('row g-3');
        
        // Оборачиваем каждый фильтр в div с классом col
        $('#filterControls .bootstrap-table-filter-control-vid').wrap('<div class="col-md-2"></div>');
        $('#filterControls .bootstrap-table-filter-control-seriya').wrap('<div class="col-md-1"></div>');
        $('#filterControls .bootstrap-table-filter-control-nomer').wrap('<div class="col-md-1"></div>');
        $('#filterControls .bootstrap-table-filter-control-kem_vydan').wrap('<div class="col-md-2"></div>');
        $('#filterControls .bootstrap-table-filter-control-kod_podrazd').wrap('<div class="col-md-1"></div>');
        $('#filterControls .bootstrap-table-filter-control-data_vydachi').wrap('<div class="col-md-1"></div>');
        $('#filterControls .bootstrap-table-filter-control-strana').wrap('<div class="col-md-1"></div>');
        $('#filterControls .bootstrap-table-filter-control-fio').wrap('<div class="col-md-2"></div>');
        $('#filterControls .bootstrap-table-filter-control-data_rozhd').wrap('<div class="col-md-1"></div>');
        $('#filterControls .bootstrap-table-filter-control-pol').wrap('<div class="col-md-1"></div>');
        $('#filterControls .bootstrap-table-filter-control-mesto_rozhd').wrap('<div class="col-md-2"></div>');
    
        // Кнопка сброса фильтров
        $('#clearFilters').off('click').on('click', function() {
            $table.bootstrapTable('clearFilterControl');
            $table.bootstrapTable('refresh');
        });
    
        // Инициализация datepicker для полей даты в форме документа
        initDokumentFormDatepickers();
        initDokumentForm();
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

        // Инициализация select2 для экзаменатора специальност
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
        const self = this;
        const $table = $('#zayavlenieTable');
        if (!$table.length) return;
        
        // Проверяем, инициализирована ли уже таблица
        if ($table.attr('data-initialized') === 'true') {
            // Если таблица уже инициализирована, просто обновляем данные
            refreshZayavlenieTable();
            return;
        }
        
        // Инициализируем таблицу только если она еще не инициализирована
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
            onLoadSuccess: function() {
                updatePrioritetOptions();
            }
        });
        
        // Помечаем таблицу как инициализированную
        $table.attr('data-initialized', 'true');
        
        // При первой инициализации загружаем данные
        const lichnoeDeloId = $('input[name="selected_lichnoe_delo"]').val();
        if (lichnoeDeloId) {
            $.ajax({
                url: '/get_zayavleniya/',
                type: 'GET',
                data: { lichnoe_delo_id: lichnoeDeloId },
                success: function(response) {
                    console.log('Данные с сервера:', response);
                    
                    const processedData = response
                        .map(item => ({
                            napravlenie: item.napravlenie_name || item.napravlenie,
                            summa: item.summa_ballov || '',
                            prioritet: item.prioritet || '',
                            gruppa: item.konkursnaya_gruppa || '',
                            data: item.data_podachi || item.data,
                            actions: `
                                <button type="button" 
                                        class="btn btn-danger btn-sm delete-zayavlenie" 
                                        data-id="${item.id}" 
                                        title="Удалить">
                                    <i class="bi bi-trash"></i> Удалить
                                </button>
                            `
                        }))
                        .sort((a, b) => {
                            const prioritetA = parseInt(a.prioritet) || 999;
                            const prioritetB = parseInt(b.prioritet) || 999;
                            return prioritetA - prioritetB;
                        });
                    
                    console.log('Обработанные данные:', processedData);
                    $table.bootstrapTable('load', processedData);
                }
            });
        }

        $table.on('load-success.bs.table', function(e, data) {
            self.updatePriorityOptions();
            self.updateGroupOptions();
        });

        // Обновляем приоритеты при любых изменениях в таблице
        $table.on('post-body.bs.table', function() {
            self.updatePriorityOptions();
            self.updateGroupOptions();
        });
    },

    // Функция для безопасного обновления/инициализации таблицы
    safeInitZayavlenieTable: function() {
        const $table = $('#zayavlenieTable');
        if (!$table.length) return;
        
        try {
            if ($table.attr('data-initialized') === 'true') {
                refreshZayavlenieTable();
            }
        } catch (error) {
            console.error('Ошибка при инициализации таблицы:', error);
        }
    },

    // Функция для программного обновления таблицы
    updateZayavlenieTable: function() {
        const lichnoeDeloId = $('input[name="selected_lichnoe_delo"]').val();
        console.log('Запрос обновления для ID:', lichnoeDeloId);
        
        // Имитируем клик по к��опке обновления
        $('.bootstrap-table button[name="refresh"]').trigger('click');
    },

    // Функция удаления заявления
    deleteZayavlenie: function(id) {
        console.log('Вызвана функция удаления с ID:', id);
        
        if (!id && id !== 0) {
            console.error('ID не указан для удаления');
            return;
        }

        if (confirm('Вы действительно хотите удалить это заявление?')) {
            $.ajax({
                url: '/delete_zayavlenie/',
                type: 'POST',
                data: {
                    zayavlenie_id: id,
                    csrfmiddlewaretoken: $('input[name=csrfmiddlewaretoken]').val()
                },
                success: function(response) {
                    console.log('Ответ сервера:', response);
                    if (response.success) {
                        // Находим и удаляем строку из таблицы
                        const $table = $('#zayavlenieTable');
                        $table.bootstrapTable('remove', {
                            field: 'id',
                            values: [id]
                        });
                        alert('Заявление успешно удалено');
                    } else {
                        alert(response.error || 'Ошибка при удалении заявления');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Ошибка при удалении:', {
                        status: xhr.status,
                        error: error,
                        response: xhr.responseText
                    });
                    alert('Произошла ошибка при удалении заявления');
                }
            });
        }
    },

    // Обработчик отправки формы
    initZayavlenieForm: function() {
        const self = this;
        const $form = $('#zayavlenieForm');
        if (!$form.length) return;

        // Добавляем обработчик изменения приоритета
        $('select[name="prioritet"]').on('change', function() {
            const selectedPriority = $(this).val();
            const usedPriorities = self.getUsedPriorities();
            
            if (selectedPriority && usedPriorities.includes(parseInt(selectedPriority))) {
                alert('Этот приоритет уже используется!');
                $(this).val('');
                self.updatePriorityOptions();
            }
        });

        // Обновляем обработчик для группы
        $('select[name="pk_konkursnaya_gruppa"]').on('change', function() {
            const selectedGroup = $(this).val();
            const usedGroups = self.getUsedGroups();
            
            if (selectedGroup && usedGroups.includes(selectedGroup.toString())) {
                alert('Эта конкурсная группа уже используется!');
                $(this).val('');
                self.updateGroupOptions();
            }
        });

        // Обработчик изменения направления
        $('select[name="napravlenie"]').on('change', function() {
            const napravlenieId = $(this).val();
            if (napravlenieId) {
                // Показываем контейнер с предметами
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

                // Загружаем группы для выбранной специальности
                $.ajax({
                    url: '/get_groups_by_specialty/',
                    type: 'GET',
                    data: { specialty_id: napravlenieId },
                    success: function(response) {
                        const $groupSelect = $('select[name="pk_konkursnaya_gruppa"]');
                        const groups = response.groups;
                        const usedGroups = self.getUsedGroups();

                        // Очищаем текущие опции
                        $groupSelect.empty().append('<option value="">Выберите конкурсную группу</option>');
                        
                        groups.forEach(group => {
                            const isDisabled = usedGroups.includes(group.id.toString());
                            const option = new Option(group.name, group.id, false, false);
                            option.disabled = isDisabled;
                            $groupSelect.append(option);
                        });

                        // Обновляем select2, если он используется
                        if ($.fn.select2 && $groupSelect.hasClass('select2-hidden-accessible')) {
                            $groupSelect.select2('destroy').select2({
                                width: '100%',
                                language: 'ru',
                                placeholder: 'Выберите конкурсную группу'
                            });
                        }
                    },
                    error: function(xhr, status, error) {
                        console.error('Ошибка при загрузке групп:', error);
                        alert('Произошла ошибка при загрузке списка групп');
                    }
                });
            } else {
                // Скрываем конте����нер с предметами если направление не выбрано
                $('#predmety_container').hide();
                
                // Очищаем селектор групп
                const $groupSelect = $('select[name="pk_konkursnaya_gruppa"]');
                $groupSelect.empty().append('<option value="">Выберите конкурсную группу</option>');
                
                if ($.fn.select2 && $groupSelect.hasClass('select2-hidden-accessible')) {
                    $groupSelect.select2('destroy').select2({
                        width: '100%',
                        language: 'ru',
                        placeholder: 'Выберите конкурсную группу'
                    });
                }
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
            
            // Преобразуем дату в нужный формат перед отправкой
            const dateInput = $(this).find('input[name="data_podachi"]');
            const dateParts = dateInput.val().split('.');
            const formattedDate = `${dateParts[2]}-${dateParts[1]}-${dateParts[0]}`;
            dateInput.val(formattedDate);
            
            const formData = new FormData(this);
            
            $.ajax({
                url: $(this).attr('action'),
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    if (response.success) {
                        // Возвращаем сходный формат даты обратно
                        dateInput.val(dateInput.val().split('-').reverse().join('.'));
                        
                        $('#zayavlenieForm')[0].reset();
                        
                        // Обновляем таблицу
                        const lichnoeDeloId = $('input[name="selected_lichnoe_delo"]').val();
                        $.ajax({
                            url: '/get_zayavleniya/',
                            type: 'GET',
                            data: { lichnoe_delo_id: lichnoeDeloId },
                            success: function(data) {
                                $('#zayavlenie-table').bootstrapTable('load', data);
                            }
                        });
                        
                        $('#predmety_container').hide();
                        $('select[name="napravlenie"]').val('');
                        
                        alert('Заявление успешно добавлено');
                        refreshZayavlenieTable();
                    } else {
                        alert(response.message || 'Ошибка при сохранении');
                    }
                },
                error: function(xhr, status, error) {
                    // Возвращаем исходный формат даты в случае ошибки
                    dateInput.val(dateInput.val().split('-').reverse().join('.'));
                    alert('Произошла ошибка при сохранении');
                    console.error(error);
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
                alert('Этот приортет уже использован!');
                $(this).val('');
                updatePrioritySelect();
            }
        });
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
            self.initFizLitsoTable();
            self.initTabs();
            self.initGlobalFunctions();
            self.initDokumentForm(); // Добавляем инициализацию формы документа
            
            // Обработчик для динамически загруженного контента
            $(document).ajaxComplete(function(event, xhr, settings) {
                if (settings.url && settings.url.includes('load_zayavlenie')) {
                    self.initDynamicContent();
                }
            });

            // Обработчик удаления заявления
            $(document).on('click', '.delete-zayavlenie', function(e) {
                e.preventDefault();
                console.log('Delete button clicked'); // Отладочный вывод
                
                // Получаем ID из data-атрибута
                const zayavlenieId = $(this).attr('data-id');
                console.log('Button clicked, ID:', zayavlenieId);
                
                // Отладочная информация
                console.log('Button data attributes:', $(this).data());
                console.log('Button HTML:', $(this).prop('outerHTML'));
                
                if (!zayavlenieId) {
                    console.error('ID не найден в кнопке');
                    alert('Ошибка: ID Заявления не найден');
                    return;
                }

                if (confirm('Вы действительно хотите удалить это заявление?')) {
                    $.ajax({
                        url: '/delete_zayavlenie/',
                        type: 'POST',
                        data: {
                            zayavlenie_id: zayavlenieId
                        },
                        success: function(response) {
                            console.log('Response:', response);
                            if (response.success) {
                                // Находим и удаляем строку из таблицы
                                const $row = $(`[data-zayavlenie-id="${zayavlenieId}"]`).closest('tr');
                                $row.remove();
                                alert('Заявление успешно удалено');
                            } else {
                                alert(response.error || 'Ошибка при удалении заявления');
                            }
                        },
                        error: function(xhr, status, error) {
                            console.error('Ajax error:', {
                                status: xhr.status,
                                error: error,
                                response: xhr.responseText
                            });
                            alert('Произошла ошибка при удалении заявления');
                        }
                    });
                }
            });
        });
    },

    // Обработка выбора личного дела
    handleLichnoeDeloSelection: function() {
        $('.select-lichnoe-delo').click(function() {
            const lichnoeDelo = $(this).data('lichnoe-delo-id');
            console.log('Selected lichnoe delo:', lichnoeDelo);

            // Загрузка заявлений для выбранного личного дела
            $.ajax({
                url: '/load_zayavlenie/',
                type: 'GET',
                data: { lichnoe_delo_id: lichnoeDelo },
                beforeSend: function() {
                    $('#zayavlenie_container').html('<div class="text-center"><i class="fas fa-spinner fa-spin"></i> Загрузка...</div>');
                },
                success: function(response) {
                    console.log('Received response:', response); // Отладка
                    
                    // Обновляем контейнер с новыми данными
                    $('#zayavlenie_container').html(response);
                    
                    // Проверяем наличие данных в таблице
                    const rowCount = $('#zayavlenieTable tbody tr').length;
                    console.log('Number of rows:', rowCount); // Отладочная информация
                    
                    // Проверяем содержимое каждой строки
                    $('#zayavlenieTable tbody tr').each(function(index) {
                        console.log('Row', index, 'content:', $(this).html()); // Отладка
                    });

                    // Инициализируем таблицу
                    const $table = $('#zayavlenieTable');
                    
                    // Проверяем, что таблица существует
                    if ($table.length) {
                        console.log('Table found, initializing...'); // Отладка
                        
                        // Добавляем поля для фильтрации
                        $table.find('thead th').each(function() {
                            const $th = $(this);
                            const fieldName = $th.text().trim();
                            console.log('Processing column:', fieldName); // Отладка
                            
                            if (fieldName && fieldName !== 'Действия') {
                                const $filterDiv = $('<div class="filter-control mt-2">');
                                const $filter = $('<input type="text" class="form-control form-control-sm" placeholder="Фильтр...">');
                                
                                $filter.on('keyup', function() {
                                    const searchText = $(this).val().toLowerCase();
                                    console.log('Filtering by:', searchText); // Отладка
                                    
                                    $table.find('tbody tr').each(function() {
                                        const $row = $(this);
                                        const cellText = $row.find(`td:eq(${$th.index()})`).text().toLowerCase();
                                        
                                        if (cellText.includes(searchText)) {
                                            $row.show();
                                        } else {
                                            $row.hide();
                                        }
                                    });
                                });
                                
                                $filterDiv.append($filter);
                                $th.append($filterDiv);
                            }
                        });

                        // Обработчик кнопки сброса фильтров
                        $('#clearFilters').off('click').on('click', function() {
                            console.log('Clearing filters...'); // Отладка
                            $table.find('.filter-control input').val('');
                            $table.find('tbody tr').show();
                        });
                        
                        // Показываем таблицу
                        $table.show();
                    } else {
                        console.error('Table not found in DOM'); // Отладка
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Error loading zayavlenie:', error);
                    console.error('Status:', status);
                    console.error('Response:', xhr.responseText); // Отладка
                    $('#zayavlenie_container').html(
                        '<div class="alert alert-danger">' +
                        'Ошибка загрузки заявлений: ' + error +
                        '</div>'
                    );
                }
            });

            // Переключение на вкладку заявлений
            $('a[href="#zayavlenie"]').tab('show');
        });
    },

    // Добавляем новые методы для работы с приоритетами
    getUsedPriorities: function() {
        const $table = $('#zayavlenieTable');
        if (!$table.length) return [];

        try {
            const tableData = $table.bootstrapTable('getData');
            return tableData
                .map(row => parseInt(row.prioritet))
                .filter(p => !isNaN(p));
        } catch (error) {
            console.error('Ошибка при получении использованных приоритетов:', error);
            return [];
        }
    },

    updatePriorityOptions: function() {
        const $prioritetSelect = $('select[name="prioritet"]');
        if (!$prioritetSelect.length) return;

        const usedPriorities = this.getUsedPriorities();
        const currentValue = parseInt($prioritetSelect.val());

        // Сохраняем текущее ��нач���н����е
        const currentSelection = $prioritetSelect.val();

        // Очищаем и пересоздаем опции
        $prioritetSelect.empty();
        
        // Добавляем пустую опцию
        $prioritetSelect.append('<option value="">Выберите приоритет</option>');

        // Добавляем опции от 1 до 5
        for (let i = 1; i <= 5; i++) {
            const isDisabled = usedPriorities.includes(i);
            const option = new Option(i.toString(), i.toString(), false, currentSelection == i);
            option.disabled = isDisabled;
            $prioritetSelect.append(option);
        }

        // Если используется select2, обновляем его
        if ($.fn.select2 && $prioritetSelect.hasClass('select2-hidden-accessible')) {
            $prioritetSelect.select2('destroy').select2({
                width: '100%',
                language: 'ru',
                placeholder: 'Выберите приоритет'
            });
        }
    },

    // Добавляем методы для работы с группами
    getUsedGroups: function() {
        const $table = $('#zayavlenieTable');
        if (!$table.length) return [];

        try {
            const tableData = $table.bootstrapTable('getData');
            return tableData
                .map(row => {
                    // Извлекаем номер группы из строки (например, из "Группа 1" получаем "1")
                    const groupMatch = (row.gruppa || '').match(/Группа (\d+)/);
                    return groupMatch ? groupMatch[1] : null;
                })
                .filter(g => g); // фильтруем пустые значения
        } catch (error) {
            console.error('Ошибка при получении использованных групп:', error);
            return [];
        }
    },

    updateGroupOptions: function() {
        const $groupSelect = $('select[name="pk_konkursnaya_gruppa"]');
        if (!$groupSelect.length) return;

        const usedGroups = this.getUsedGroups();
        const currentSelection = $groupSelect.val();

        // Сохраняем все доступные опции
        const allOptions = Array.from($groupSelect.find('option')).map(opt => ({
            value: opt.value,
            text: opt.text
        }));

        // Очищаем и пересоздаем опции
        $groupSelect.empty();
        
        // Добавляем пустую опцию
        $groupSelect.append('<option value="">Выберите конкурсную группу</option>');

        // Добавляем остальные опции
        allOptions.forEach(opt => {
            if (opt.value) {
                // Проверяем, используется ли значение в таблице
                const isDisabled = usedGroups.includes(opt.value.toString());
                const option = new Option(opt.text, opt.value, false, currentSelection === opt.value);
                option.disabled = isDisabled;
                $groupSelect.append(option);
            }
        });

        // Если используется select2, обновляем его
        if ($.fn.select2 && $groupSelect.hasClass('select2-hidden-accessible')) {
            $groupSelect.select2('destroy').select2({
                width: '100%',
                language: 'ru',
                placeholder: 'Выберите конкурсную группу'
            });
        }
    },

    // Добавляем метод для загрузки групп
    loadGroupsBySpecialty: function(specialtyId) {
        const self = this;
        const $groupSelect = $('select[name="pk_konkursnaya_gruppa"]');
        
        // Очищаем текущие опции
        $groupSelect.empty().append('<option value="">Выберите конкурсную группу</option>');
        
        if (!specialtyId) return;

        // Загружаем группы для выбранной специальности
        $.ajax({
            url: '/get_groups_by_specialty/',
            type: 'GET',
            data: { specialty_id: specialtyId },
            success: function(response) {
                const groups = response.groups;
                const usedGroups = self.getUsedGroups();

                groups.forEach(group => {
                    const isDisabled = usedGroups.includes(group.id.toString());
                    const option = new Option(group.name, group.id, false, false);
                    option.disabled = isDisabled;
                    $groupSelect.append(option);
                });

                // Обновляем select2, если он используется
                if ($.fn.select2 && $groupSelect.hasClass('select2-hidden-accessible')) {
                    $groupSelect.select2('destroy').select2({
                        width: '100%',
                        language: 'ru',
                        placeholder: 'Выберите конкурсную группу'
                    });
                }
            },
            error: function(xhr, status, error) {
                console.error('Ошибка при загрузке групп:', error);
                alert('Произошла ошибка при загрузке списка групп');
            }
        });
    },

    // Добавляем метод валидации
    validateZayavlenieForm: function() {
        const self = this;
        const $form = $('#zayavlenieForm');
        
        $form.on('submit', function(e) {
            e.preventDefault();
            
            // Очищаем предыдущие ошибки
            $('.invalid-feedback').remove();
            $('.is-invalid').removeClass('is-invalid');
            
            let isValid = true;
            const errors = {};

            // Проверка направления
            const napravlenie = $('select[name="napravlenie"]').val();
            if (!napravlenie) {
                isValid = false;
                errors['napravlenie'] = 'Выберите направление';
            }

            // Проверка приоритета
            const prioritet = $('select[name="prioritet"]').val();
            if (!prioritet) {
                isValid = false;
                errors['prioritet'] = 'Выберите приоритет';
            }

            // Проверка конкурсной группы
            const gruppa = $('select[name="pk_konkursnaya_gruppa"]').val();
            if (!gruppa) {
                isValid = false;
                errors['pk_konkursnaya_gruppa'] = 'Выберите конкурсную группу';
            }

            // Проверка даты подачи
            const dataPodachi = $('input[name="data_podachi"]').val();
            if (!dataPodachi) {
                isValid = false;
                errors['data_podachi'] = 'Укажите дату подачи';
            } else {
                // Проверка формата даты и валидности
                const dateRegex = /^\d{2}\.\d{2}\.\d{4}$/;
                if (!dateRegex.test(dataPodachi)) {
                    isValid = false;
                    errors['data_podachi'] = 'Неверный формат даты (ДД.ММ.ГГГГ)';
                } else {
                    const [day, month, year] = dataPodachi.split('.');
                    const date = new Date(year, month - 1, day);
                    if (isNaN(date.getTime())) {
                        isValid = false;
                        errors['data_podachi'] = 'Указана некорр��ктная дата';
                    }
                }
            }

            // Проверка результатов экзаменов
            const $predmetyContainer = $('#predmety_container');
            if ($predmetyContainer.is(':visible')) {
                $predmetyContainer.find('.card').each(function(index) {
                    const predmet = $(this).find('select[name^="rezultat_"][name$="-pk_predmet"]').val();
                    const tipIspytaniya = $(this).find('select[name^="rezultat_"][name$="-tip_ispytaniya"]').val();
                    const bally = $(this).find('input[name^="rezultat_"][name$="-bally"]').val();

                    if (!predmet) {
                        isValid = false;
                        errors[`rezultat_${index}_predmet`] = 'Выберите предмет';
                    }
                    if (!tipIspytaniya) {
                        isValid = false;
                        errors[`rezultat_${index}_tip`] = 'Выберите тип испытания';
                    }
                    if (!bally || bally < 0 || bally > 100) {
                        isValid = false;
                        errors[`rezultat_${index}_bally`] = 'Укажите корректные баллы (0-100)';
                    }
                });
            }

            // Отображение ошибок
            if (!isValid) {
                Object.keys(errors).forEach(fieldName => {
                    const $field = $(`[name="${fieldName}"]`);
                    if ($field.length) {
                        $field.addClass('is-invalid');
                        $field.after(`<div class="invalid-feedback">${errors[fieldName]}</div>`);
                    } else {
                        // Для полей результатов экзаменов
                        const [prefix, index, type] = fieldName.split('_');
                        if (prefix === 'rezultat') {
                            const $container = $predmetyContainer.find('.card').eq(index);
                            const selector = type === 'predmet' ? 'pk_predmet' :
                                           type === 'tip' ? 'tip_ispytaniya' : 'bally';
                            const $field = $container.find(`[name^="rezultat_"][name$="-${selector}"]`);
                            $field.addClass('is-invalid');
                            $field.after(`<div class="invalid-feedback">${errors[fieldName]}</div>`);
                        }
                    }
                });
                
                // Прокрутка к первой ошибке
                const $firstError = $('.is-invalid').first();
                if ($firstError.length) {
                    $('html, body').animate({
                        scrollTop: $firstError.offset().top - 100
                    }, 500);
                }
                
                return false;
            }

            // Если всё валидно, отправляем форму
            const formData = new FormData($form[0]);
            $.ajax({
                url: $form.attr('action'),
                type: 'POST',
                data: formData,
                processData: false,
                contentType: false,
                success: function(response) {
                    if (response.success) {
                        // Обновляем таблицу
                        $('#zayavlenieTable').bootstrapTable('refresh');
                        
                        // Очищаем форму
                        $form[0].reset();
                        $predmetyContainer.hide();
                        
                        // Показываем сообщение об успехе
                        alert('Заявление успешно сохранено');
                    } else {
                        alert(response.error || 'Произошла ошибка при сохранении заявления');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Ошибка при отправке формы:', error);
                    alert('Произошла ошибка при сохранении заявления');
                }
            });
        });
    },

    // Инициализация формы документов
    initDokumentForm: function() {
        const self = this;
        const $form = $('#dokument_form');
        if (!$form.length) return;
    

        // Предотвращаем стандартную отправку формы
        $form.on('submit', function(e) {
            e.preventDefault();
            return false;
        });
    }
};

// Глобальный форматтер для кнопки удаления
window.actionFormatter = (function() {
    // Кэш для уже отформатированных кнопок
    const cache = new Map();
    
    return function(value, row) {
        // Создаем уникальный ключ для кэша
        const cacheKey = row.id || row.napravlenie + row.prioritet;
        
        // Если кнопка уже была отформатирована, возвращаем из кэша
        if (cache.has(cacheKey)) {
            return cache.get(cacheKey);
        }
        
        // Получаем ID
        let id;
        if (row.actions && typeof row.actions === 'string') {
            const match = row.actions.match(/data-id="(\d+)"/);
            if (match) {
                id = match[1];
            }
        }
        if (!id) {
            id = row.id || row.pk || row.pk_zayavlenie || row.zayavlenie_id;
        }
        
        // Создаем HTML кнопки
        const buttonHtml = id ? 
            `<div class="btn-group" role="group">
                <button type="button" 
                        class="btn btn-danger btn-sm delete-zayavlenie" 
                        data-id="${id}" 
                        data-zayavlenie-id="${id}"
                        title="Удалить">
                    <i class="bi bi-trash"></i> Удалить
                </button>
            </div>` :
            `<div class="btn-group" role="group">
                <button type="button" 
                        class="btn btn-danger btn-sm delete-zayavlenie disabled" 
                        title="ID не найден">
                    <i class="bi bi-trash"></i> Удалить
                </button>
            </div>`;
            
        // Сохраняем в кэш
        cache.set(cacheKey, buttonHtml);
        
        return buttonHtml;
    };
})();

window.actionEvents = {
    'click .delete-zayavlenie': function(e, value, row) {
        if (confirm('Вы уверены, что хотите удалить это заявление?')) {
            const $button = $(e.target).closest('.delete-zayavlenie');
            const $row = $button.closest('tr');
            
            $.ajax({
                url: '/delete_zayavlenie/',
                type: 'POST',
                data: {
                    'zayavlenie_id': $button.data('id'),
                    'csrfmiddlewaretoken': $('input[name=csrfmiddlewaretoken]').val()
                },
                beforeSend: function() {
                    // Блокируем кнопку на время удаления
                    $button.prop('disabled', true);
                },
                success: function(response) {
                    // Даже если в ответе есть error, но success = true, значит удаление прошло успешно
                    if (response.success) {
                        $row.remove();
                        // Обновляем таблицу, если она использует bootstrap-table
                        const $table = $('#zayavlenieTable');
                        if ($table.length && $table.bootstrapTable) {
                            $table.bootstrapTable('refresh');
                        }
                    } else {
                        alert(response.error || 'Ошибка при удалении заявления');
                    }
                },
                error: function(xhr, status, error) {
                    console.error('Ajax error:', error);
                    alert('Произошла ошибка при удалении заявления');
                },
                complete: function() {
                    // В любом случае разблокируем кнопку
                    $button.prop('disabled', false);
                }
            });
        }
    }
};

// Функция инициализации таблицы документов
function initDokumentTable() {
    if ($('#dokumentTable').length === 0) return;
    
    var $table = $('#dokumentTable');
    console.log($table);
    // Уничтожаем существующую таблицу если она есть
    if ($.fn.bootstrapTable.Constructor.DEFAULTS) {
        $table.bootstrapTable('destroy');
    }
    
    // Инициализация таблицы
    $table.bootstrapTable({
        locale: 'ru-RU',
        search: true,
        showColumns: true,
        showRefresh: true,
        showToggle: true,
        searchAlign: 'left',
        filterControl: true,
        filterControlVisible: true,
        filterControlContainer: '#filterControls',
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
                $('.datepicker-filter-control').datepicker({
                    format: 'dd.mm.yyyy',
                    language: 'ru',
                    autoclose: true
                });
            }, 200);
        }
    });
    $table.bootstrapTable('refresh').$button.name = "refresh1";
    // Добавляем стили для контейнера фильтров
    $('#filterControls').addClass('row g-3');
    
    // Оборачиваем каждый фильтр в div с классом col
    $('#filterControls .bootstrap-table-filter-control-vid').wrap('<div class="col-md-2"></div>');
    $('#filterControls .bootstrap-table-filter-control-seriya').wrap('<div class="col-md-1"></div>');
    $('#filterControls .bootstrap-table-filter-control-nomer').wrap('<div class="col-md-1"></div>');
    $('#filterControls .bootstrap-table-filter-control-kem_vydan').wrap('<div class="col-md-2"></div>');
    $('#filterControls .bootstrap-table-filter-control-kod_podrazd').wrap('<div class="col-md-1"></div>');
    $('#filterControls .bootstrap-table-filter-control-data_vydachi').wrap('<div class="col-md-1"></div>');
    $('#filterControls .bootstrap-table-filter-control-strana').wrap('<div class="col-md-1"></div>');
    $('#filterControls .bootstrap-table-filter-control-fio').wrap('<div class="col-md-2"></div>');
    $('#filterControls .bootstrap-table-filter-control-data_rozhd').wrap('<div class="col-md-1"></div>');
    $('#filterControls .bootstrap-table-filter-control-pol').wrap('<div class="col-md-1"></div>');
    $('#filterControls .bootstrap-table-filter-control-mesto_rozhd').wrap('<div class="col-md-2"></div>');

    // Кнопка сброса фильтров
    $('#clearFilters').off('click').on('click', function() {
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

// Функция инициализации личного дела
function initLichnoeDelo() {
    if ($('#lichnoeDelo_table').length === 0) return; // Проверяем наличие таблицы

    // Функция фильтрации
    function filterTable() {
        var fio = $('#filterFIO').val().toLowerCase();
        var nomer = $('#filterNomer').val().toLowerCase();
        var original = $('#filterOriginal').val();

        $('#lichnoeDelo_table tbody tr').each(function() {
            var row = $(this);
            var showRow = true;

            // Проверка каждого филтра
            if (fio && !row.find('td:eq(0)').text().toLowerCase().includes(fio)) {
                showRow = false;
            }
            if (nomer && !row.find('td:eq(1)').text().toLowerCase().includes(nomer)) {
                showRow = false;
            }
            if (original) {
                var hasOriginal = row.find('td:eq(2) .badge').hasClass('bg-success');
                if (original === 'true' && !hasOriginal || original === 'false' && hasOriginal) {
                    showRow = false;
                }
            }

            row.toggle(showRow);
        });
    }

    // Обработчики событий для фильтров
    $('#filterFIO, #filterNomer, #filterOriginal').off('input change').on('input change', filterTable);

    // Сброс фильтров
    $('#clearFilters').off('click').click(function() {
        $('.table thead input, .table thead select').val('');
        filterTable();
    });

    // Обработчик клика по кнопке "Заявления"
    $('.select-lichnoe-delo').off('click').click(function(e) {
        e.preventDefault();
        var lichnoeDeloId = $(this).data('lichnoe-delo-id');
        var fizLitsoId = $(this).data('fiz-litso-id');
        
        // Сохраняем ID в localStorage
        localStorage.setItem('selectedLichnoeDeloId', lichnoeDeloId);
        localStorage.setItem('selectedFizLitsoId', fizLitsoId);
        
        // Разблокируем вкладку заявление в родительском окне
        if (window.parent && window.parent.enableZayavlenieTab) {
            window.parent.enableZayavlenieTab();
        }
        
        // Переключаемся на вкладку заявление с одним заросом
        if (window.parent && window.parent.switchToZayavlenieTab) {
            window.parent.switchToZayavlenieTab(lichnoeDeloId);
            return false;
        }
    });
}

// Функция инициализации всех таблиц с фильтрами
function initBootstrapTables() {
    // Находим все таблицы с атрибутом data-toggle="table"
    $('table[data-toggle="table"]').each(function() {
        var $table = $(this);
        
        // Базовые настройки для всех таблиц
        var defaultSettings = {
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
                columns: 'fas fa-columns',
                detailOpen: 'fas fa-plus',
                detailClose: 'fas fa-minus'
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
        };

        // Получаем пользовательские настройки из data-атрибутов
        var customSettings = $table.data();
        
        // Объединяем настройки
        var settings = $.extend({}, defaultSettings, customSettings);
        
        // Инициализуем таблицу
        $table.bootstrapTable(settings);

        // Добавляем обработчик для кнопки сброса фильтров
        var tableId = $table.attr('id');
        $('#clearFilters_' + tableId).off('click').on('click', function() {
            $table.bootstrapTable('clearFilterControl');
            $table.bootstrapTable('refresh');
        });
    });
}

// Обновляем основную функцию инициализации
$(document).ready(function() {
    // Заменяем отдельную инициализацию таблиц на общую
    initBootstrapTables();
    
    // Осавляем специфичные инициализации
    initLichnoeDelo();
});

// Инициализация приложения
AppManager.init(); 

function initFizLitsoFilters() {
    if ($('#fizLitsoTable').length === 0) return;

    // Функция фильтрации
    function filterTable() {
        var fio = $('#filterFIO').val().toLowerCase();
        var telefon = $('#filterTelefon').val().toLowerCase();
        var dataRozhdeniya = $('#filterDataRozhdeniya').val();

        $('#fizLitsoTable tbody tr').each(function() {
            var row = $(this);
            var showRow = true;

            // ФИО (проверяем по всем трем колонкам)
            if (fio) {
                var fullName = row.find('td:eq(0)').text().toLowerCase() + ' ' +
                              row.find('td:eq(1)').text().toLowerCase() + ' ' +
                              row.find('td:eq(2)').text().toLowerCase();
                if (!fullName.includes(fio)) {
                    showRow = false;
                }
            }

            // Телефон
            if (telefon && !row.find('td:eq(4)').text().toLowerCase().includes(telefon)) {
                showRow = false;
            }

            // Дата рождения
            if (dataRozhdeniya && row.find('td:eq(3)').text() !== dataRozhdeniya) {
                showRow = false;
            }

            row.toggle(showRow);
        });
    }

    // Инициализация datepicker для фильтра даты рождения
    $('#filterDataRozhdeniya').datepicker({
        format: 'dd.mm.yyyy',
        language: 'ru',
        autoclose: true,
        todayHighlight: true
    });

    // Обработчики событий
    $('#filterFIO, #filterTelefon').on('input', filterTable);
    $('#filterDataRozhdeniya').on('change', filterTable);

    // Сброс фильтров
    $('#clearFilters_fizLitsoTable').click(function() {
        $('#filterFIO, #filterTelefon, #filterDataRozhdeniya').val('');
        filterTable();
    });
}

// Добавляем в основную инициализацию
$(document).ready(function() {
    // ... существующие инициализации ...
    initFizLitsoFilters();
}); 

// Функция для инициализации обработчиков ввода результатов
function initResultInputHandlers() {
    $('.result-input-btn').off('click').on('click', function() {
        const index = $(this).data('index');
        showResultInput(index);
    });
}

// Функция показа формы ввода результатов
function showResultInput(index) {
    const row = $('#zayavlenie-table').bootstrapTable('getData')[index];
    if (!row) {
        console.error('Row data not found for index:', index);
        return;
    }

    // Получаем список экзаменов для выбранной специальности
    $.ajax({
        url: '/api/exams/',
        method: 'GET',
        data: { napravlenie: row.napravlenie },
        success: function(response) {
            // Создаем форму для ввода результатов
            let formHtml = '<form id="result-form">';
            response.exams.forEach(exam => {
                formHtml += `
                    <div class="form-group">
                        <label>${exam.name}</label>
                        <input type="number" class="form-control" 
                               name="exam_${exam.id}" min="0" max="100">
                    </div>
                `;
            });
            formHtml += '</form>';

            // Показываем модальное окно  формой
            $('#resultModal .modal-body').html(formHtml);
            $('#resultModal').modal('show');
        },
        error: function(xhr, status, error) {
            console.error('Error loading exams:', error);
            alert('Ошибка при загрузке списка экзаменов');
        }
    });
} 

// Функция обнолния аблицы с защитой от множественных вызовов
const refreshZayavlenieTable = (function() {
    let isLoading = false;
    let timeoutId = null;
    
    function doRefresh() {
        if (isLoading) return;
        
        const $table = $('#zayavlenieTable');
        if (!$table.length) return;
        
        const lichnoeDeloId = $('input[name="selected_lichnoe_delo"]').val();
        console.log('Запрашиваем данные для личного дела ID:', lichnoeDeloId);
        
        isLoading = true;
        
        $.ajax({
            url: '/get_zayavleniya/',
            type: 'GET',
            data: { lichnoe_delo_id: lichnoeDeloId },
            headers: {
                'X-CSRFToken': $('input[name=csrfmiddlewaretoken]').val()
            },
            success: function(response) {
                console.log('Данные с сервера:', response);
                
                const processedData = response
                    .map(item => ({
                        napravlenie: item.napravlenie_name || item.napravlenie,
                        summa: item.summa_ballov || '',
                        prioritet: item.prioritet || '',
                        gruppa: item.konkursnaya_gruppa || '',
                        data: item.data_podachi || item.data,
                        actions: `
                            <button type="button" 
                                    class="btn btn-danger btn-sm delete-zayavlenie" 
                                    data-id="${item.id}" 
                                    title="Удалить">
                                <i class="bi bi-trash"></i> Удалить
                            </button>
                        `
                    }))
                    .sort((a, b) => {
                        const prioritetA = parseInt(a.prioritet) || 999;
                        const prioritetB = parseInt(b.prioritet) || 999;
                        return prioritetA - prioritetB;
                    });
                
                console.log('Обработанные данные:', processedData);
                $table.bootstrapTable('load', processedData);
            },
            error: function(xhr, status, error) {
                console.error('Ошибка при обновлении таблицы:', error);
                alert('Произошла ошибка при обновлении таблицы');
            },
            complete: function() {
                isLoading = false;
            }
        });
    }
    
    return function() {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(doRefresh, 100);
    };
})();

// Централизованная инициализация всех обработчиков обновления
function initTableRefreshHandlers() {
    // Удаляем все существующие обработчики
    $(document).off('click', '.bootstrap-table button[name="refresh"]');
    $('#zayavlenieTable').off('refresh.bs.table');
    $('#zayavlenieTable').off('load-success.bs.table');
    $('.refresh-table').off('click');
    
    // Добавляем один обработчик на все события обновления
    const events = [
        'click.refresh',
        'refresh.bs.table',
        'load-success.bs.table'
    ];
    
    $(document).on(events.join(' '), '.bootstrap-table button[name="refresh"]', function(e) {
        e.preventDefault();
        e.stopPropagation();
        refreshZayavlenieTable();
    });
}

// Инициализация при загрузке документа
$(document).ready(function() {
    initTableRefreshHandlers();
});

// Переопределяем метод refresh в bootstrap-table
$.extend($.fn.bootstrapTable.defaults, {
    refresh: refreshZayavlenieTable
});

// Обработка динамически загруженного контента
$(document).ajaxComplete(function(event, xhr, settings) {
    if (settings.url && (
        settings.url.includes('load_zayavlenie') || 
        settings.url.includes('get_zayavleniya')
    )) {
        initTableRefreshHandlers();
    }
});

// Обновленная функция updatePrioritetOptions
function updatePrioritetOptions() {
    const $table = $('#zayavlenie-table');
    const $prioritetSelect = $('select[name="prioritet"]');
    
    if (!$table.length || !$prioritetSelect.length) {
        return;
    }
    
    try {
        const tableData = $table.bootstrapTable('getData');
        const usedPrioritets = tableData
            .map(row => parseInt(row.prioritet))
            .filter(p => !isNaN(p));
        
        // Сначала включаем все опции
        $prioritetSelect.find('option').prop('disabled', false);
        
        // Затем отключаем использованные
        usedPrioritets.forEach(priority => {
            $prioritetSelect.find(`option[value="${priority}"]`).prop('disabled', true);
        });
        
        // Проверяем текущее значение
        const currentValue = parseInt($prioritetSelect.val());
        if (usedPrioritets.includes(currentValue)) {
            $prioritetSelect.val('');
        }
        
        // Если используется select2, обновляем его
        if ($.fn.select2 && $prioritetSelect.hasClass('select2-hidden-accessible')) {
            $prioritetSelect.select2('destroy').select2();
        }
    } catch (error) {
        console.error('Ошибка при обновлении приоритетов:', error);
    }
}

// Инициализация таблицы с обработчиком загрузки
$('#zayavlenieTable').bootstrapTable({
    onLoadSuccess: function(data) {
        console.log('Table loaded successfully');
        updatePrioritetOptions();
    }
});

// Обработчики событий
$(document).on('post-body.bs.table', '#zayavlenieTable', function() {
    if ($('select[name="prioritet"]').length) {
        updatePrioritetOptions();
    }
});

$(document).on('change click focus', 'select[name="prioritet"]', function() {
    if ($('#zayavlenieTable').length) {
        updatePrioritetOptions();
    }
});


function replaceRefreshButtons() {
    console.log('replaceRefreshButtons called');
    
    // Проверяем наличие таблиц
    console.log('Tables found:', {
        dokument: $('#dokumentTable').length,
        zayavlenie: $('#zayavlenieTable').length
    });

    // Проверяем наличие стандартных кнопок обновления
    console.log('Refresh buttons found:', {
        dokument: $('#dokumentTable').closest('.bootstrap-table').find('button[name="refresh"]').length,
        zayavlenie: $('#zayavlenieTable').closest('.bootstrap-table').find('button[name="refresh"]').length
    });

    // Заменяем кнопку в таблице документов
    if ($('#dokumentTable').length) {
        const $dokButton = $('#dokumentTable').closest('.bootstrap-table').find('button[name="refresh"]');
        if ($dokButton.length) {
            console.log('Replacing dokument refresh button');
            $dokButton.replaceWith(
                `<button type="button" class="btn btn-secondary custom-refresh-dokument" name="refreshDokumentTable" title="Обновить">
                    <i class="fas fa-sync"></i>
                </button>`
            );
        }
    }

    // Заменяем кнопку в таблице заявлений
    if ($('#zayavlenieTable').length) {
        const $zayavButton = $('#zayavlenieTable').closest('.bootstrap-table').find('button[name="refresh"]');
        if ($zayavButton.length) {
            console.log('Replacing zayavlenie refresh button');
            $zayavButton.replaceWith(
                `<button type="button" class="btn btn-secondary custom-refresh-zayavlenie" name="refreshZayavlenieTablee" title="Обновить">
                    <i class="fas fa-sync"></i>
                </button>`
            );
        }
    }

    // Добавляем обработчики для новых кнопок
    $('.custom-refresh-dokument').off('click').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Custom dokument refresh clicked');
        refreshDokumentTable();
    });

    $('.custom-refresh-zayavlenie').off('click').on('click', function(e) {
        e.preventDefault();
        e.stopPropagation();
        console.log('Custom zayavlenie refresh clicked');
        refreshZayavlenieTable();
    });
}

// Вызываем функцию после полной загрузки DOM
$(document).ready(function() {
    console.log('Document ready');
    // Даем таблицам время на инициализацию
    setTimeout(replaceRefreshButtons, 500);
});

// Вызываем функцию после инициализации bootstrap-table
$(document).on('post-init.bs.table', function() {
    console.log('Bootstrap table initialized');
    replaceRefreshButtons();
});

// Обновляем кнопки после загрузки контента
$(document).ajaxComplete(function(event, xhr, settings) {
    console.log('Ajax completed:', settings.url);
    if (settings.url && (
        settings.url.includes('load_zayavlenie') || 
        settings.url.includes('load_dokument')
    )) {
        setTimeout(replaceRefreshButtons, 500);
    }
});

// Обновляем кнопки при переключении вкладок
$(document).on('shown.bs.tab', 'a[data-toggle="tab"]', function(e) {
    console.log('Tab switched:', $(e.target).attr('href'));
    setTimeout(replaceRefreshButtons, 500);
});

// Добавляем обработчик на событие инициализации таблицы
$(document).on('initialized.bs.table', function() {
    console.log('Table initialized event caught');
    setTimeout(replaceRefreshButtons, 500);
});

// Функция для безопасного обновления таблицы
function safeRefreshTable(tableId) {
    console.log(`Attempting to refresh table: ${tableId}`);
    const $table = $(`#${tableId}`);
    
    if (!$table.length) {
        console.warn(`Table ${tableId} not found in DOM`);
        return;
    }

    try {
        if ($table.bootstrapTable && typeof $table.bootstrapTable === 'function') {
            $table.bootstrapTable('refresh', {
                silent: true,
                onRefresh: function() {
                    console.log(`${tableId} refresh initiated`);
                }
            });
        } else {
            console.warn(`${tableId} is not initialized with bootstrapTable`);
            // Пробуем переинициализировать таблицу
            initBootstrapTable($table);
        }
    } catch (error) {
        console.error(`Error refreshing ${tableId}:`, error);
    }
}

// Функция инициализации bootstrap-table
function initBootstrapTable($table) {
    try {
        if ($table.data('bootstrap.table')) {
            $table.bootstrapTable('destroy');
        }
        
        $table.bootstrapTable({
            locale: 'ru-RU',
            search: true,
            showColumns: true,
            showRefresh: true,
            showToggle: true,
            filterControl: true,
            pagination: true,
            pageSize: 10,
            pageList: [10, 25, 50, 100, 'All'],
            onPostBody: function() {
                console.log('Table post-body event triggered');
                replaceRefreshButton($table.attr('id'));
            }
        });
        
        console.log(`Table ${$table.attr('id')} initialized successfully`);
    } catch (error) {
        console.error('Error initializing table:', error);
    }
}

 


// Обработчики событий
$(document).ready(function() {
    console.log('Document ready, initializing tables...');
    
    // Инициализация существующих таблиц
    ['dokumentTable', 'zayavlenieTable'].forEach(tableId => {
        const $table = $(`#${tableId}`);
        if ($table.length) {
            initBootstrapTable($table);
        }
    });
});

// Функция обновления таблицы документов с защитой от множественных вызовов
const refreshDokumentTable = (function() {
    let isLoading = false;
    let timeoutId = null;
    
    function doRefresh() {
        if (isLoading) return;
        
        const $table = $('#dokumentTable');
        if (!$table.length) return;
        
        const fizLitsoId = localStorage.getItem('selectedFizLitsoId');
        console.log('Запрашиваем документы для физ. лица ID:', fizLitsoId);
        
        isLoading = true;
        
        $.ajax({
            url: '/get_dokumenty_list/',  // Новый endpoint для получения списка документов
            type: 'GET',
            data: { 
                fizlitso_id: fizLitsoId
            },
            headers: {
                'X-CSRFToken': $('input[name=csrfmiddlewaretoken]').val()
            },
            success: function(response) {
                console.log('Данные с сервера:', response);
                
                if (Array.isArray(response)) {
                    const processedData = response.map(item => ({
                        vid: item.pk_vid_dokumenta.naim || '-',  // Поле для колонки "Вид документа"
                        seriya: item.seriya || '-',
                        nomer: item.nomer || '-',
                        kem_vydan: item.kem_vydan || '-',
                        kod_podrazd: item.kod_podrazd || '-',
                        data_vydachi: item.data_vydachi || '-',
                        strana: item.strana || '-',
                        fio: item.fio_v_dokumente || '-',  // Переименовано в fio для соответствия колонке
                        data_rozhd: item.data_rozhdeniya || '-',  // Переименовано в data_rozhd для соответствия колонке
                        pol: item.pol || '-',
                        mesto_rozhd: item.mesto_rozhdeniya || '-',  // Переименовано в mesto_rozhd для соответствия колонке
                        actions: `
                            <div class="btn-group" role="group">
                                <button type="button" 
                                        class="btn btn-danger btn-sm delete-dokument" 
                                        data-id="${item['pk_dokument ']}"
                                        data-fizlitso-id="${item.pk_fizicheskoe_litso}"
                                        title="Удалить">
                                    <i class="bi bi-trash"></i>Удалить
                                </button>
                                <button type="button" 
                                        class="btn btn-primary btn-sm edit-dokument" 
                                        data-id="${item['pk_dokument ']}"
                                        data-fizlitso-id="${item.pk_fizicheskoe_litso}"
                                        title="Редактировать">
                                    <i class="bi bi-pencil"></i>Редактировать
                                </button>
                            </div>
                        `
                    }));
                    
                    console.log('Обработанные данные:', processedData);
                    $table.bootstrapTable('load', processedData);
                    
                    // Обновляем фльтры после загрузки даннх
                    setTimeout(() => {
                        $('[data-filter-control="datepicker"]').datepicker({
                            format: 'dd.mm.yyyy',
                            language: 'ru',
                            autoclose: true
                        });
                    }, 200);
                } else {
                    console.error('Неверный формат даннх от сервера:', response);
                }
            },
            error: function(xhr, status, error) {
                console.error('Ошибка при обновлении таблицы документов:', error);
                console.error('Статус:', xhr.status);
                console.error('Ответ:', xhr.responseText);
            },
            complete: function() {
                isLoading = false;
            }
        });
    }
    
    return function() {
        if (timeoutId) {
            clearTimeout(timeoutId);
        }
        timeoutId = setTimeout(doRefresh, 100);
    };
})();

// Функция для замены кнопок обновления
function replaceRefreshButton(tableType) {
    const config = {
        dokument: {
            tableId: 'dokumentTable',
            buttonClass: 'custom-refresh-dokument',
            refreshFunction: refreshDokumentTable
        },
        zayavlenie: {
            tableId: 'zayavlenieTable',
            buttonClass: 'custom-refresh-zayavlenie',
            refreshFunction: refreshZayavlenieTable
        }
    };

    const settings = config[tableType];
    if (!settings) return;

    const $table = $(`#${settings.tableId}`);
    if (!$table.length) return;

    // Находим только кнопку обновления, не трогая остальные элементы тулбара
    const $toolbar = $table.closest('.bootstrap-table').find('.fixed-table-toolbar');
    const $oldButton = $toolbar.find('button[name="refresh"]');
    
    if ($oldButton.length) {
        // Создаем новую кнопку, сохраняя все остальные атрибуты
        const $newButton = $(`
            <button type="button" 
                    class="btn btn-secondary ${settings.buttonClass}" 
                    name="${tableType}Table"
                    title="Обновить">
                <i class="fas fa-sync"></i>
            </button>
        `);

        // Заменяем только кнопку обновления
        $oldButton.replaceWith($newButton);

        // Добавляем обработчик на новую кнопку
        $newButton.off('click').on('click', function(e) {
            e.preventDefault();
            e.stopPropagation();
            console.log(`Custom refresh clicked for ${tableType}`);
            settings.refreshFunction();
        });

        console.log(`Refresh button replaced for ${tableType} table`);
    }

    // Убеждаемся, что все остальные элементы управления таблицы инициализированы
    $table.bootstrapTable('refreshOptions', {
        showColumns: true,
        showToggle: true,
        search: true,
        searchAlign: 'right',
        showRefresh: true
    });
}

// Функция валидации формы документа
function validateDokumentForm() {
    let isValid = true;
    const errors = [];

    // Проверка обязательных полей
    const requiredFields = {
        'pk_vid_dokumenta': 'Вид документа',
        'nomer': 'Номер документа',
        'data_vydachi': 'Дата выдачи',
        'fio_v_dokumente': 'ФИО в документе'
    };

    Object.entries(requiredFields).forEach(([fieldName, fieldLabel]) => {
        const $field = $(`[name="${fieldName}"]`);
        const value = $field.val();
        
        if (!value || value.trim() === '') {
            isValid = false;
            errors.push(`Поле "${fieldLabel}" обязательно для заполнения`);
            $field.addClass('is-invalid');
        } else {
            $field.removeClass('is-invalid');
        }
    });

    // Валидация даты выдачи
    const dataVydachi = $('[name="data_vydachi"]').val();
    if (dataVydachi) {
        const date = new Date(dataVydachi);
        if (isNaN(date.getTime()) || date > new Date()) {
            isValid = false;
            errors.push('Дата выдачи не может быть больше текущей даты');
            $('[name="data_vydachi"]').addClass('is-invalid');
        }
    }

    // Отображение ошибок
    const $errorContainer = $('#dokumentFormErrors');
    if (errors.length > 0) {
        $errorContainer.html(errors.map(error => `<div class="alert alert-danger">${error}</div>`).join(''));
        $errorContainer.show();
    } else {
        $errorContainer.hide();
    }

    return isValid;
}


function showAlert(type, message) {
    const alertHtml = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
        </div>
    `;
    $('#alertContainer').html(alertHtml);
}

// Инициализация датапикеров
$('[name="data_vydachi"], [name="data_rozhdeniya"]').datepicker({
    format: 'dd.mm.yyyy',
    language: 'ru',
    autoclose: true,
    todayHighlight: true,
    endDate: new Date()
});

// Очистка ошибок при вводе
$('#dokument_form input, #dokument_form select').on('input change', function() {
    $(this).removeClass('is-invalid');
    if ($('#dokumentFormErrors').is(':visible')) {
        $('#dokumentFormErrors').hide();
    }
});



