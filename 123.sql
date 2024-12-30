CREATE OR REPLACE FUNCTION public.process_enrollment()
RETURNS void AS $$
DECLARE
    -- Курсор для конкурсных групп
    group_cursor CURSOR FOR 
        SELECT 
            kg."PK_Konkursnaya_gruppa",
            kg."PK_KCP",
            kg."PK_Kategoriya_obucheniya",
            k."Summa" as available_places,
            k."PK_Forma_obucheniya"
        FROM public."Konkursnaya_gruppa" kg
        JOIN public."KCP" k ON k."PK_KCP" = kg."PK_KCP"
        WHERE NOT EXISTS (
            SELECT 1 
            FROM public."Stroka_prikaza" sp
            JOIN public."Prikaz" p ON sp."PK_Prikaz" = p."PK_Prikaz"
            WHERE p."PK_Kategoriya_obucheniya" = kg."PK_Kategoriya_obucheniya"
            AND p."Utverzhdeno" = TRUE
        );

    -- Курсор для студентов
    student_cursor CURSOR (group_id INT, priority INT) FOR
        SELECT 
            z."PK_Zayavlenie",
            z."PK_Lichnoe_delo",
            z."Summa_ballov",
            fl."Familiya" || ' ' || fl."Imya" || ' ' || COALESCE(fl."Otchestvo", '') as fio
        FROM public."Zayavlenie" z
        JOIN public."Lichnoe_delo" ld ON ld."PK_Lichnoe_delo" = z."PK_Lichnoe_delo"
        JOIN public."Fizicheskoe_litso" fl ON fl."PK_Fizicheskoe_litso" = ld."PK_Fizicheskoe_litso"
        WHERE z."PK_Konkursnaya_gruppa" = group_id
        AND z."Prioritet" = priority
        AND NOT EXISTS (
            SELECT 1 
            FROM public."Stroka_prikaza" sp
            WHERE sp."PK_Lichnoe_delo" = z."PK_Lichnoe_delo"
        )
        ORDER BY z."Summa_ballov" DESC, fl."Familiya", fl."Imya", fl."Otchestvo";

    group_rec RECORD;
    student_rec RECORD;
    new_prikaz_id INT;
    current_priority INT;
    current_priority_1 INT;
    enroll_count INT;
    first_group BOOLEAN := TRUE;
    current_forma_obucheniya INT;
    current_kategoriya_obucheniya INT;

BEGIN
    -- Открываем курсор для конкурсных групп
    FOR group_rec IN group_cursor LOOP
        -- Проверяем, нужно ли создать новый приказ
        IF first_group OR 
           group_rec."PK_Forma_obucheniya" != current_forma_obucheniya OR 
           group_rec."PK_Kategoriya_obucheniya" != current_kategoriya_obucheniya THEN
            
            -- Создаем новый приказ
            INSERT INTO public."Prikaz" (
                "Nomer", 
                "Data", 
                "Chei", 
                "Utverzhdeno",
                "PK_Forma_obucheniya",
                "PK_Kategoriya_obucheniya"
            )
            VALUES (
                'AUTO-' || TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD'),
                CURRENT_DATE,
                'Автоматическое зачисление',
                FALSE,
                group_rec."PK_Forma_obucheniya",
                group_rec."PK_Kategoriya_obucheniya"
            )
            RETURNING "PK_Prikaz" INTO new_prikaz_id;

            current_forma_obucheniya := group_rec."PK_Forma_obucheniya";
            current_kategoriya_obucheniya := group_rec."PK_Kategoriya_obucheniya";
            first_group := FALSE;

            RAISE NOTICE E'\nСоздан новый приказ ID: % (Форма обучения: %, Категория: %)', 
                new_prikaz_id,
                current_forma_obucheniya,
                current_kategoriya_obucheniya;
        END IF;

        RAISE NOTICE E'\nОбработка конкурсной группы ID: % (Доступно мест: %)', 
            group_rec."PK_Konkursnaya_gruppa", 
            group_rec.available_places;

        enroll_count := 0;

        -- Обрабатываем приоритеты
        FOR current_priority_1 IN 2..5 LOOP
            FOR current_priority IN 1..current_priority_1 LOOP
                RAISE NOTICE 'Обработка приоритета: %', current_priority;

                -- Открываем курсор для студентов текущего приоритета
                FOR student_rec IN student_cursor(group_rec."PK_Konkursnaya_gruppa", current_priority) LOOP
                    -- Проверяем наличие мест
                    IF enroll_count < group_rec.available_places THEN
                        -- Зачисляем студента
                        INSERT INTO public."Stroka_prikaza" (
                            "PK_Prikaz",
                            "PK_Zayavlenie",
                            "PK_Lichnoe_delo"
                        )
                        VALUES (
                            new_prikaz_id,
                            student_rec."PK_Zayavlenie",
                            student_rec."PK_Lichnoe_delo"
                        );

                        enroll_count := enroll_count + 1;

                        RAISE NOTICE 'Зачислен: % (Баллы: %, Приоритет: %)', 
                            student_rec.fio,
                            student_rec."Summa_ballov",
                            current_priority;
                    ELSE
                        RAISE NOTICE 'Нет мест для: % (Баллы: %, Приоритет: %)', 
                            student_rec.fio,
                            student_rec."Summa_ballov",
                            current_priority;
                        EXIT;
                    END IF;
                END LOOP;

                EXIT WHEN enroll_count >= group_rec.available_places;
            END LOOP;
            
            EXIT WHEN enroll_count >= group_rec.available_places;
        END LOOP;

        RAISE NOTICE 'Зачислено в группу: % из % мест', 
            enroll_count, 
            group_rec.available_places;
    END LOOP;

    RAISE NOTICE E'\nЗачисление завершено. Проверьте созданные приказы.';
END;
$$ LANGUAGE plpgsql;