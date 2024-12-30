import logging
from django.shortcuts import render, redirect, get_object_or_404
from django.apps import apps
from django.forms import modelform_factory
from .models import (
    FizicheskoeLitso, LichnoeDelo, Zayavlenie, Dokument, Rezultat, 
    Spetsialnost, Predmet, PredmetSpetsialnost, KonkursnayaGruppa, 
    TipOtsenki, VidDokumenta, Prikaz, StrokaPrikaza, Kcp, 
    FormaObucheniya, KategoriyaObucheniya
)
from .forms import FizicheskoeLitsoForm, LichnoeDeloForm, ZayavlenieForm, DokumentForm, RezultatForm, PrikazForm
from django.contrib import messages
from django.http import JsonResponse, HttpResponse
from django.views.decorators.http import require_GET, require_POST
from django.db.models import Q, Count
from django.forms.models import model_to_dict
import json
from django.db import transaction, models
from datetime import datetime
from django.db import connection
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import csrf_exempt
from django.urls import reverse
from django.core.serializers.json import DjangoJSONEncoder

logger = logging.getLogger(__name__)

def dynamic_view(request, model_name, pk=None):
    model = apps.get_model('kust_site', model_name)
    data = model.objects.all()
    fields = model._meta.fields

    # Создаем форму на основе модели, исключая первичный ключ
    Form = modelform_factory(model, fields=[field.name for field in fields if not field.get_internal_type() == 'AutoField'])

    # Обработка редактирования
    if pk is not None:
        instance = get_object_or_404(model, pk=pk)
        form = Form(request.POST or None, instance=instance)
    else:
        form = Form(request.POST or None)

    if request.method == "POST" and form.is_valid():
        form.save()
        return redirect('dynamic_view', model_name=model_name)

    context = {
        'data': data,
        'model_name': model_name,
        'fields': fields,
        'form': form,
        'editing': pk is not None,
        'fields_count': len(fields),
        'fields_count_plus_one': len(fields) + 1  # Добавлено новое значение для дальнейшего использования в шаблоне
    }

    return render(request, 'dynamic_template.html', context)


def create_fizicheskoe_litso(request, pk=None):
    if pk:
        instance = get_object_or_404(FizicheskoeLitso, pk=pk)
        form = FizicheskoeLitsoForm(request.POST or None, instance=instance)
    else:
        form = FizicheskoeLitsoForm(request.POST or None)

    if request.method == "POST" and form.is_valid():
        form.save()
        return redirect('create_fizicheskoe_litso')  # Перенаправление, например, на страницу списка

    context = {
        'fizicheskoe_litso_form': form
    }
    return render(request, 'index.html', context)  # Обновите на нужный шаблон

def create_lichnoe_delo(request, pk=None):
    if request.method == "POST":
        form = LichnoeDeloForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('create_lichnoe_delo')  # Перенаправление на страницу со списком/формой
    else:
        form = LichnoeDeloForm()

    context = {
        'lichnoe_delo_form': form
    }
    return render(request, 'lichnoe_delo_form.html', context)  # Обновите на нужный шаблон

def create_zayavlenie(request, pk=None):
    if request.method == "POST":
        form = ZayavlenieForm(request.POST)
        if form.is_valid():
            form.save()
            return redirect('create_zayavlenie')  # Перенаправление на страницу со списком/формой
    else:
        form = ZayavlenieForm()

    context = {
        'zayavlenie_form': form
    }
    return render(request, 'zayavlenie_form.html', context)  # Обновите на нужный шаблон

def index(request):
    fizicheskoe_litso = None
    if 'selected_fizlitso' in request.session:
        fizicheskoe_litso = get_object_or_404(FizicheskoeLitso, pk=request.session['selected_fizlitso'])
    
    context = {
        'fizicheskoe_litso': fizicheskoe_litso
    }
    return render(request, 'index.html', context)

@require_GET
def get_predmety(request):
    napravlenie_id = request.GET.get('napravlenie_id')
    if napravlenie_id:
        # Получаем предметы для выбранного направления
        predmety = PredmetSpetsialnost.objects.filter(
            pk_spetsialnost_id=napravlenie_id
        ).select_related('pk_predmet').values(
            'pk_predmet__pk_predmet',
            'pk_predmet__naim'
        )
        
        return JsonResponse({
            'predmety': [
                {
                    'id': item['pk_predmet__pk_predmet'],
                    'name': item['pk_predmet__naim']
                } for item in predmety
            ]
        })
    return JsonResponse({'predmety': []})

def get_documents(request):
    fizlitso_id = request.GET.get('fizlitso_id')
    documents = Dokument.objects.filter(pk_fizicheskoe_litso_id=fizlitso_id).values(
        'pk_dokument',  # Добавляем ID документа
        'seriya',
        'nomer',
        'kem_vydan',
        'data_vydachi',
        'fio_v_dokumente',
        'pk_vid_dokumenta__naim'  # Добавляем название вида документа
    )
    return JsonResponse({'documents': list(documents)})

def get_lichnoe_delo(request):
    fizlitso_id = request.GET.get('fizlitso_id')
    try:
        lichnoe_delo = LichnoeDelo.objects.filter(pk_fizicheskoe_litso_id=fizlitso_id).first()
        
        response_data = {}
        if lichnoe_delo:
            response_data = model_to_dict(lichnoe_delo)
            # Добавляем данные тблы с нуыми олями
            response_data['table_data'] = list(
                LichnoeDelo.objects.filter(pk_fizicheskoe_litso_id=fizlitso_id).values(
                    'pk_lichnoe_delo',
                    'nomer',
                    'original',
                    'pk_fizicheskoe_litso',
                    'pk_fizicheskoe_litso__familiya',
                    'pk_fizicheskoe_litso__imya',
                    'pk_fizicheskoe_litso__otchestvo'
                )
            )
        return JsonResponse(response_data)
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)

def get_zayavleniya(request):
    lichnoe_delo_id = request.GET.get('lichnoe_delo_id')
    zayavleniya = Zayavlenie.objects.filter(pk_lichnoe_delo_id=lichnoe_delo_id)
    data = [{
        'napravlenie': f"{z.napravlenie.kod} {z.napravlenie.naim}" if z.napravlenie else '',
        'summa_ballov': z.summa_ballov,
        'prioritet': z.prioritet,
        'konkursnaya_gruppa': z.pk_konkursnaya_gruppa.naim if z.pk_konkursnaya_gruppa else '',
        'data_podachi': z.data_podachi.strftime('%d.%m.%Y') if z.data_podachi else '',
        'id': z.pk_zayavlenie
    } for z in zayavleniya]
    return JsonResponse(data, safe=False)

def load_fizicheskoe_litso(request):
    if request.method == 'POST':
        form = FizicheskoeLitsoForm(request.POST)
        if form.is_valid():
            form.save()
            return JsonResponse({'status': 'success'})
        else:
            return JsonResponse({'status': 'error', 'errors': form.errors})
    else:
        form = FizicheskoeLitsoForm()
    
    fizicheskoe_data = FizicheskoeLitso.objects.all()
    return render(request, 'fizicheskoe_litso.html', {
        'form': form,
        'fizicheskoe_data': fizicheskoe_data
    })

def load_dokument(request):
    fizlitso_id = request.GET.get('fizlitso_id')
    fizicheskoe_litso = None
    
    if fizlitso_id:
        fizicheskoe_litso = get_object_or_404(FizicheskoeLitso, pk=fizlitso_id)
    
    if request.method == 'POST':
        form = DokumentForm(request.POST, fizicheskoe_litso=fizicheskoe_litso)
        if form.is_valid():
            dokument = form.save(commit=False)
            if fizlitso_id:
                dokument.pk_fizicheskoe_litso_id = fizlitso_id
            dokument.save()
            return redirect('index')
    else:
        form = DokumentForm(fizicheskoe_litso=fizicheskoe_litso)

    # Фильтруем документы по физическому лицу
    queryset = Dokument.objects.all()
    if fizlitso_id:
        queryset = queryset.filter(pk_fizicheskoe_litso_id=fizlitso_id)
    
    context = {
        'dokument_form': form,
        'dokument_data': queryset.select_related('pk_vid_dokumenta', 'pk_fizicheskoe_litso'),
        'fizicheskoe_litso': fizicheskoe_litso,  # Добавляем в контекст
        'fizlitso_id': fizlitso_id  # Добавляем ID в контекст
    }
    return render(request, 'dokument.html', context)

def load_lichnoe_delo(request):
    # Получаем выбранное физическое лицо
    selected_fiz_litso_id = request.GET.get('fizlitso_id')
    
    # Инициализируем формы
    initial = {}
    if selected_fiz_litso_id:
        initial['pk_fizicheskoe_litso'] = selected_fiz_litso_id
        
    lichnoe_delo_form = LichnoeDeloForm(initial=initial)

    # Получаем личные дела только для выбранного физического лица
    queryset = LichnoeDelo.objects.none()  # Пустой queryset по умолчанию
    
    if selected_fiz_litso_id:
        # Если выбрано физическое лицо, получаем его личные дела
        queryset = LichnoeDelo.objects.filter(
            pk_fizicheskoe_litso_id=selected_fiz_litso_id
        ).select_related('pk_fizicheskoe_litso')
        
        # Добавим отладочную информацию
        print(f"Searching for lichnoe_delo with fizlitso_id: {selected_fiz_litso_id}")
        print(f"Found records: {queryset.count()}")
    
    # Получаем выбранное физическое лицо для отображения в форме
    selected_fiz_litso = None
    if selected_fiz_litso_id:
        selected_fiz_litso = FizicheskoeLitso.objects.filter(
            pk_fizicheskoe_litso=selected_fiz_litso_id
        ).first()
        
        # Добавим отладочную информацию
        print(f"Selected fizlitso: {selected_fiz_litso}")

    context = {
        'lichnoe_delo_form': lichnoe_delo_form,
        'lichnoe_delo_list': queryset,
        'selected_fiz_litso': selected_fiz_litso
    }
    
    return render(request, 'lichnoe_delo.html', context)

def load_zayavlenie(request):
    # Получаем ID выбранного личного дела
    lichnoe_delo_id = request.GET.get('lichnoe_delo_id')
    
    # Если ID пустой, но есть в сессии - используем его
    if not lichnoe_delo_id and 'current_lichnoe_delo_id' in request.session:
        return redirect(f'/load_zayavlenie/?lichnoe_delo_id={request.session["current_lichnoe_delo_id"]}')
    
    # Если есть ID - сохраняем в сессию
    if lichnoe_delo_id:
        request.session['current_lichnoe_delo_id'] = lichnoe_delo_id
    
    # Инициализируем формы
    initial = {'pk_lichnoe_delo': lichnoe_delo_id} if lichnoe_delo_id else {}
    zayavlenie_form = ZayavlenieForm(initial=initial)
    rezultat_forms = [RezultatForm(prefix=f'rezultat_{i}') for i in range(3)]

    # Получаем заявления
    if lichnoe_delo_id:
        try:
            zayavleniya = Zayavlenie.objects.select_related(
                'pk_konkursnaya_gruppa',
                'pk_lichnoe_delo'
            ).filter(
                pk_lichnoe_delo_id=lichnoe_delo_id
            ).order_by('prioritet')
            
            used_prioritets = list(zayavleniya.values_list('prioritet', flat=True))
            print(f"Найдено заявлений: {zayavleniya.count()}")
            
        except Exception as e:
            print(f"Ошибка при получении заявлений: {e}")
            zayavleniya = Zayavlenie.objects.none()
            used_prioritets = []
    else:
        zayavleniya = Zayavlenie.objects.none()
        used_prioritets = []

    # Создаем список доступных приоритетов
    available_priorities = [i for i in range(1, 6) if i not in used_prioritets]
    
    # Получаем конкурсные группы
    konkursnye_gruppy = KonkursnayaGruppa.objects.all().order_by('naim')
    
    context = {
        'zayavlenie_form': zayavlenie_form,
        'rezultat_forms': rezultat_forms,
        'zayavleniya': zayavleniya,
        'lichnoe_delo_id': lichnoe_delo_id,
        'available_priorities': available_priorities,
        'used_priorities': used_prioritets,
        'konkursnye_gruppy': konkursnye_gruppy,  # Добавляем в контекст
    }
    
    return render(request, 'zayavlenie.html', context)

def check_prioritet(request):
    lichnoe_delo_id = request.GET.get('lichnoe_delo_id')
    prioritet = request.GET.get('prioritet')
    
    if lichnoe_delo_id and prioritet:
        # Проверяем, существует ли заявление с таким приоритетом для этого личного дела
        exists = Zayavlenie.objects.filter(
            pk_lichnoe_delo_id=lichnoe_delo_id,
            prioritet=prioritet
        ).exists()
        
        return JsonResponse({'used': exists})
    
    return JsonResponse({'used': False})

def get_used_prioritets(request):
    lichnoe_delo_id = request.GET.get('lichnoe_delo_id')
    current_zayavlenie_id = request.GET.get('current_zayavlenie_id')
    
    if lichnoe_delo_id:
        # Получаем список уже использованных приоритетов
        query = Zayavlenie.objects.filter(pk_lichnoe_delo_id=lichnoe_delo_id)
        
        # Исключаем текущее заявление при редактировании
        if current_zayavlenie_id:
            query = query.exclude(pk_zayavlenie=current_zayavlenie_id)
        
        used_prioritets = list(query.values_list('prioritet', flat=True))
        
        return JsonResponse({'used_prioritets': used_prioritets})
    
    return JsonResponse({'used_prioritets': []})

def save_zayavlenie_data(request):
    if request.method == 'POST':
        try:
            print("Получены данные POST:", request.POST)
            
            lichnoe_delo_id = request.POST.get('selected_lichnoe_delo')
            print(f"ID личного дела из POST: {lichnoe_delo_id}")

            if not lichnoe_delo_id:
                raise ValueError("ID личного дела не указан")

            # Полуаем объект специальности
            spetsialnost = Spetsialnost.objects.get(pk_spetsialnost=request.POST.get('napravlenie'))
            
            # Преобразуем дату
            date_str = request.POST.get('data_podachi')
            try:
                date_obj = datetime.strptime(date_str, '%m/%d/%Y')
                formatted_date = date_obj.strftime('%Y-%m-%d')
            except ValueError as e:
                print(f"Ошибка преобразования даты: {e}")
                formatted_date = date_str

            # Создаем заявление
            zayavlenie = Zayavlenie.objects.create(
                pk_lichnoe_delo_id=lichnoe_delo_id,
                napravlenie=spetsialnost,  # Передаем объект специальности
                prioritet=request.POST.get('prioritet'),
                data_podachi=formatted_date,
                pk_konkursnaya_gruppa_id=request.POST.get('pk_konkursnaya_gruppa'),
                summa_ballov=0
            )
            print(f"Создано заявление с ID: {zayavlenie.pk}")

            # Сохраняем результаты
            summa_ballov = 0
            i = 0
            while f'rezultat_{i}-pk_predmet' in request.POST:
                predmet_id = request.POST.get(f'rezultat_{i}-pk_predmet')
                tip_otsenki_id = request.POST.get(f'rezultat_{i}-tip_ispytaniya')
                ball = int(request.POST.get(f'rezultat_{i}-bally', 0))
                
                print(f"Обработка результата {i}: предмет={predmet_id}, тип={tip_otsenki_id}, блл={ball}")
                
                if predmet_id and tip_otsenki_id and ball:
                    # Получаем объекты моделей
                    predmet = Predmet.objects.get(pk_predmet=predmet_id)
                    tip_otsenki = TipOtsenki.objects.get(pk_tip_otsenki=tip_otsenki_id)
                    
                    rezultat = Rezultat.objects.create(
                        pk_zayavlenie=zayavlenie,
                        pk_predmet=predmet,
                        pk_tip_otsenki=tip_otsenki,
                        ball=ball,
                        pk_lichnoe_delo=lichnoe_delo_id
                    )
                    print(f"Создан результат с ID: {rezultat.pk}")
                    summa_ballov += ball
                i += 1

            # Обновляем сумму баллов
            zayavlenie.summa_ballov = summa_ballov
            zayavlenie.save()
            print(f"Обновлена сумма баллов: {summa_ballov}")

            return JsonResponse({
                'success': True,
                'message': 'Заявление успешно сохранено'
            })

        except Exception as e:
            print(f"Ошибка при сохранении: {str(e)}")
            return JsonResponse({
                'success': False,
                'message': f'Ошибка при сохранении: {str(e)}'
            })

    return JsonResponse({
        'success': False,
        'message': 'Метод не поддерживается'
    })

@require_POST
def save_dokument(request):
    try:
        dokument_id = request.POST.get('dokument_id')
        fizlitso_id = request.POST.get('selected_fizlitso')
        
        if not fizlitso_id:
            return JsonResponse({
                'success': False,
                'error': 'Не указано физическое лицо'
            })

        data = request.POST.copy()
        data['pk_fizicheskoe_litso'] = fizlitso_id

        if dokument_id:
            # Редактирование существующего документа
            dokument = get_object_or_404(Dokument, pk_dokument=dokument_id)
            form = DokumentForm(data, instance=dokument)
        else:
            # Создание нового документа
            form = DokumentForm(data)

        if form.is_valid():
            dokument = form.save(commit=False)
            dokument.pk_fizicheskoe_litso_id = fizlitso_id
            dokument.save()
            
            return JsonResponse({
                'success': True,
                'message': 'Документ успешно сохранен'
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'Ошибка валидации формы',
                'errors': form.errors
            })

    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })

def get_dokument(request):
    dokument_id = request.GET.get('id')
    try:
        dokument = Dokument.objects.get(pk=dokument_id)
        data = {
            'pk_vid_dokumenta': dokument.pk_vid_dokumenta,
            'seriya': dokument.seriya,
            'nomer': dokument.nomer,
            'kem_vydan': dokument.kem_vydan,
            'kod_podrazd': dokument.kod_podrazd,
            'data_vydachi': dokument.data_vydachi.strftime('%d.%m.%Y'),
            'strana': dokument.strana,
            'fio_v_dokumente': dokument.fio_v_dokumente,
            'data_rozhdeniya': dokument.data_rozhdeniya.strftime('%d.%m.%Y') if dokument.data_rozhdeniya else '',
            'pol': dokument.pol,
            'mesto_rozhdeniya': dokument.mesto_rozhdeniya,
            'pk_fizicheskoe_litso': dokument.pk_fizicheskoe_litso_id,
            'pk_lichnoe_delo': dokument.pk_lichnoe_delo_id
        }
        return JsonResponse(data)
    except Dokument.DoesNotExist:
        return JsonResponse({
            'success': False,
            'message': 'Документ не найден'
        })

def dokumenty_list(request, pk_fizicheskoe_litso):
    fizicheskoe_litso = get_object_or_404(FizicheskoeLitso, pk=pk_fizicheskoe_litso)
    dokumenty = (Dokument.objects.filter(pk_fizicheskoe_litso=pk_fizicheskoe_litso)
                .select_related('pk_vid_dokumenta')
                .order_by('pk_vid_dokumenta__naim'))
    vidy_dokumentov = VidDokumenta.objects.all()
    
    context = {
        'dokumenty': dokumenty,
        'vidy_dokumentov': vidy_dokumentov,
        'fizicheskoe_litso': fizicheskoe_litso,
    }
    
    return render(request, 'dokumenty.html', context)

def konkursnye_gruppy(request):
    try:
        konkursnye_gruppy = KonkursnayaGruppa.objects.select_related('pk_kcp', 'pk_kategoriya_obucheniya').all()
        formy_obucheniya = FormaObucheniya.objects.all()
        kategorii_obucheniya = KategoriyaObucheniya.objects.all()
        
        # Добавляем КЦП с предзагрузкой связанных данных
        kcps = Kcp.objects.select_related(
            'pk_facultet',
            'pk_forma_obucheniya',
            'pk_spetsialnost'
        ).all()
        
        return render(request, 'konkursnye_gruppy.html', {
            'konkursnye_gruppy': konkursnye_gruppy,
            'formy_obucheniya': formy_obucheniya,
            'kategorii_obucheniya': kategorii_obucheniya,
            'kcps': kcps
        })
    except Exception as e:
        print(f"Error in konkursnye_gruppy view: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Ошибка при загрузке данных: {str(e)}'
        }, status=500)

def konkursnaya_gruppa_detail(request, pk):
    gruppa = get_object_or_404(KonkursnayaGruppa, pk=pk)
    
    # Получаем все заявления для данной конкурсной группы
    zayavleniya = Zayavlenie.objects.filter(
        pk_konkursnaya_gruppa=gruppa
    ).select_related(
        'pk_lichnoe_delo',
        'pk_lichnoe_delo__pk_fizicheskoe_litso'
    ).order_by(
        '-summa_ballov',  # Сортировка по убыванию баллов
        'data_podachi'    # При равных баллах - по дате подачи
    )

    return render(request, 'konkursnaya_gruppa_detail.html', {
        'gruppa': gruppa,
        'zayavleniya': zayavleniya
    })

@require_POST
def create_prikaz(request):
    try:
        # Получаем данные из формы
        nomer = request.POST.get('nomer')
        data = request.POST.get('data')
        chei = request.POST.get('chei')
        forma_obucheniya = request.POST.get('pk_forma_obucheniya')
        kategoriya_obucheniya = request.POST.get('pk_kategoriya_obucheniya')
        konkursnaya_gruppa = request.POST.get('pk_konkursnaya_gruppa')

        # Создаем приказ
        prikaz = Prikaz.objects.create(
            nomer=nomer,
            data=data,
            chei=chei,
            utverzhdeno=False,
            pk_forma_obucheniya_id=forma_obucheniya,
            pk_kategoriya_obucheniya_id=kategoriya_obucheniya,
            pk_konkursnaya_gruppa_id=konkursnaya_gruppa
        )

        return JsonResponse({
            'success': True,
            'message': 'Приказ успешно создан'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        })

@require_POST
def utverdit_prikaz(request, prikaz_id):
    try:
        prikaz = get_object_or_404(Prikaz, pk_prikaz=prikaz_id)
        
        # Проверяем, не утвержден ли уже приказ
        if prikaz.utverzhdeno:
            return JsonResponse({
                'success': False,
                'message': 'Приказ уже утвержден'
            })

        # Утверждаем приказ
        prikaz.utverzhdeno = True
        prikaz.save()

        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        })

def prikaz_detail(request, pk):
    prikaz = get_object_or_404(Prikaz, pk_prikaz=pk)
    stroki = StrokaPrikaza.objects.filter(pk_prikaz=prikaz).select_related(
        'pk_zayavlenie__pk_lichnoe_delo__pk_fizicheskoe_litso',
        'pk_zayavlenie__pk_konkursnaya_gruppa'
    ).order_by(
        'pk_zayavlenie__pk_konkursnaya_gruppa',
        '-pk_zayavlenie__summa_ballov'
    )
    
    return render(request, 'prikaz_detail.html', {
        'prikaz': prikaz,
        'stroki': stroki
    })

@require_GET
def zachislenie(request):
    try:
        prikazy = Prikaz.objects.annotate(
            kolichestvo_studentov=Count('strokaprikaza')
        ).order_by('-data')
        
        prikazy_data = []
        for prikaz in prikazy:
            prikazy_data.append({
                'nomer': prikaz.nomer,
                'data': prikaz.data.strftime('%d.%m.%Y'),
                'status': 'Черновик' if not prikaz.utverzhdeno else 'Утвержден',
                'kolichestvo_studentov': prikaz.kolichestvo_studentov,
                'pk_prikaz': prikaz.pk_prikaz,
                'utverzhden': prikaz.utverzhdeno
            })
        
        context = {
            'prikazy': prikazy_data,
            'forma': PrikazForm(),
            'konkursnye_gruppy': KonkursnayaGruppa.objects.all()
        }
        
        return render(request, 'zachislenie.html', context)
    except Exception as e:
        print(f"Error in zachislenie view: {e}")
        return HttpResponse(f"Error: {e}", status=500)

# Вспомогательная функция для рендеринга кнопок действий
def render_actions(prikaz):
    return f'''
        <a href="/zachislenie/prikaz/{prikaz.pk_prikaz}" class="btn btn-info btn-sm">
            <i class="fas fa-eye"></i> Просмотр
        </a>
        <button class="btn btn-warning btn-sm ml-1" onclick="editPrikaz({prikaz.pk_prikaz})">
            <i class="fas fa-edit"></i> Редактировать
        </button>
        <button class="btn btn-success btn-sm ml-1" onclick="utverditPrikaz({prikaz.pk_prikaz})">
            <i class="fas fa-check"></i> Утвердить
        </button>
        <button class="btn btn-danger btn-sm ml-1" onclick="deletePrikaz({prikaz.pk_prikaz})">
            <i class="fas fa-trash"></i> Удалить
        </button>
    '''

@require_GET
def get_available_groups(request):

    try:
        forma_id = request.GET.get('forma_id')
        kategoriya_id = request.GET.get('kategoriya_id')
        
        # Базовый запрос для неиспользованных групп
        used_groups = Prikaz.objects.filter(
            utverzhdeno=True
        ).values_list('pk_konkursnaya_gruppa_id', flat=True)
        
        groups_query = KonkursnayaGruppa.objects.exclude(
            pk_konkursnaya_gruppa__in=used_groups
        )
        
        # Добавляем фильтры по форме и категории обучения
        if forma_id:
            groups_query = groups_query.filter(pk_forma_obucheniya_id=forma_id)
        if kategoriya_id:
            groups_query = groups_query.filter(pk_kategoriya_obucheniya_id=kategoriya_id)
        
        groups = groups_query.order_by('naim').values('pk_konkursnaya_gruppa', 'naim')
        
        return JsonResponse({
            'success': True,
            'groups': list(groups)
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })

@require_POST
def remove_student_from_prikaz(request, pk):
    try:
        stroka = get_object_or_404(StrokaPrikaza, pk_stroka_prikaza=pk)
        if not stroka.pk_prikaz.utverzhdeno:
            stroka.delete()
            return JsonResponse({'success': True})
        else:
            return JsonResponse({
                'success': False, 
                'message': 'Нельзя удалить студента из утвержденного приказа'
            })
    except Exception as e:
        return JsonResponse({'success': False, 'message': str(e)})

@csrf_exempt
def get_prikaz(request, pk):
    try:
        prikaz = get_object_or_404(Prikaz, pk_prikaz=pk)
        return JsonResponse({
            'status': 'success',
            'prikaz': {
                'pk_prikaz': prikaz.pk_prikaz,
                'nomer': prikaz.nomer,
                'data': prikaz.data.strftime('%Y-%m-%d'),
                'chei': prikaz.chei,
                'pk_forma_obucheniya': prikaz.pk_forma_obucheniya.pk if prikaz.pk_forma_obucheniya else '',
                'pk_kategoriya_obucheniya': prikaz.pk_kategoriya_obucheniya.pk if prikaz.pk_kategoriya_obucheniya else '',
                'pk_konkursnaya_gruppa': prikaz.pk_konkursnaya_gruppa.pk if prikaz.pk_konkursnaya_gruppa else ''
            }
        })
    except Exception as e:
        return JsonResponse({'status': 'error', 'message': str(e)})

@csrf_exempt
def edit_prikaz(request, pk):
    if request.method == 'POST':
        try:
            prikaz = get_object_or_404(Prikaz, pk_prikaz=pk)
            form = PrikazForm(request.POST, instance=prikaz)
            if form.is_valid():
                form.save()
                return JsonResponse({'status': 'success'})
            return JsonResponse({'status': 'error', 'message': 'Форма невалидна'})
        except Exception as e:
            return JsonResponse({'status': 'error', 'message': str(e)})
    return JsonResponse({'status': 'error', 'message': 'Метод не поддерживается'})

@require_GET
def search_available_students(request, prikaz_id):
    try:
        # Получаем приказ
        prikaz = get_object_or_404(Prikaz, pk_prikaz=prikaz_id)
        
        # Получаем конкурсную группу из приказа
        konkursnaya_gruppa = prikaz.pk_konkursnaya_gruppa
        if not konkursnaya_gruppa:
            return JsonResponse({
                'success': False,
                'message': 'Не указана конкурсная группа в приказе'
            })
        
        # Поисковый запрос
        query = request.GET.get('q', '')
        
        # Получаем заявления только для указанной конкурсной группы
        zayavleniya = Zayavlenie.objects.select_related(
            'pk_lichnoe_delo__pk_fizicheskoe_litso',
            'pk_konkursnaya_gruppa'
        ).filter(
            pk_konkursnaya_gruppa=konkursnaya_gruppa
        ).exclude(
            pk_zayavlenie__in=StrokaPrikaza.objects.filter(
                pk_prikaz=prikaz
            ).values('pk_zayavlenie')
        ).order_by('-summa_ballov')  # Сортируем по убыванию суммы баллов
        
        # Применяем поисковый фильтр если есть запрос
        if query:
            zayavleniya = zayavleniya.filter(
                Q(pk_lichnoe_delo__pk_fizicheskoe_litso__familiya__icontains=query) |
                Q(pk_lichnoe_delo__pk_fizicheskoe_litso__imya__icontains=query) |
                Q(pk_lichnoe_delo__pk_fizicheskoe_litso__otchestvo__icontains=query)
            )
        
        # Формируем список студентов
        students = []
        for z in zayavleniya:
            fio = f"{z.pk_lichnoe_delo.pk_fizicheskoe_litso.familiya} {z.pk_lichnoe_delo.pk_fizicheskoe_litso.imya}"
            if z.pk_lichnoe_delo.pk_fizicheskoe_litso.otchestvo:
                fio += f" {z.pk_lichnoe_delo.pk_fizicheskoe_litso.otchestvo}"
                
            students.append({
                'pk_zayavlenie': z.pk_zayavlenie,
                'pk_lichnoe_delo': z.pk_lichnoe_delo.pk_lichnoe_delo,
                'fio': fio,
                'konkursnaya_gruppa': z.pk_konkursnaya_gruppa.naim,
                'summa_ballov': z.summa_ballov
            })
        
        return JsonResponse({
            'success': True,
            'students': students
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        })

@require_POST
def add_student_to_prikaz(request, prikaz_id):
    try:
        data = json.loads(request.body)
        prikaz = get_object_or_404(Prikaz, pk_prikaz=prikaz_id)
        
        # Проверяем, не утвержден ли приказ
        if prikaz.utverzhdeno:
            return JsonResponse({
                'success': False,
                'message': 'Нельзя редактировать утвержденный приказ'
            })

        # Получаем заявление для получения ID личного дела
        zayavlenie = get_object_or_404(Zayavlenie, pk_zayavlenie=data['pk_zayavlenie'])

        # Создаем новую строку приказа
        stroka = StrokaPrikaza.objects.create(
            pk_prikaz=prikaz,
            pk_zayavlenie=zayavlenie,
            pk_lichnoe_delo=zayavlenie.pk_lichnoe_delo.pk_lichnoe_delo  # Передаем числовой ID
        )

        return JsonResponse({'success': True})
    except Exception as e:
        print(f"Error details: {str(e)}")  # Добавляем вывод деталей ошибки
        return JsonResponse({
            'success': False,
            'message': str(e)
        })

@require_POST
def remove_student(request, stroka_id):
    try:
        # Получаем строку приказа
        stroka = get_object_or_404(StrokaPrikaza, pk_stroka_prikaza=stroka_id)
        
        # Проверяем, не утвержден ли приказ
        if stroka.pk_prikaz.utverzhdeno:
            return JsonResponse({
                'success': False,
                'message': 'Нельзя редактировать утвержденный приказ'
            })
            
        # Удаляем строку
        stroka.delete()
        
        return JsonResponse({
            'success': True
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        })

@require_POST
def generate_prikazy(request):
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT public.process_enrollment();")
            
        return JsonResponse({
            'success': True,
            'message': 'Приказы успешно сформированы'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Ошибка при формировании приказов: {str(e)}'
        })

@require_POST
def generate_prikaz(request, pk):
    try:
        with connection.cursor() as cursor:
            # Вызываем хранимую процедуру или триггер для формирования приказа
            cursor.execute("SELECT generate_prikaz(%s)", [pk])
            # Если процедура возвращает результат, можно его получить
            result = cursor.fetchone()
            
        return JsonResponse({
            'success': True,
            'message': 'Приказ успешно сформирован'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': f'Ошибка при формировании приказа: {str(e)}'
        })
@require_POST
def delete_prikaz(request, prikaz_id):
    try:
        prikaz = get_object_or_404(Prikaz, pk_prikaz=prikaz_id)
        
        # Проверяем, не утвержден ли приказ
        if prikaz.utverzhdeno:
            return JsonResponse({
                'success': False,
                'message': 'Нельзя удалить утвержденный приказ'
            })

        # Удаляем приказ
        prikaz.delete()

        return JsonResponse({
            'success': True,
            'message': 'Приказ успешно удален'
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'message': str(e)
        })

def get_zayavlenie_data(request):
    zayavlenie_id = request.GET.get('id')
    try:
        zayavlenie = Zayavlenie.objects.get(pk_zayavlenie=zayavlenie_id)
        data = {
            'success': True,
            'napravlenie_id': zayavlenie.napravlenie.pk_spetsialnost if zayavlenie.napravlenie else '',
            'prioritet': zayavlenie.prioritet,
            'data_podachi': zayavlenie.data_podachi.strftime('%Y-%m-%d') if zayavlenie.data_podachi else '',
            'konkursnaya_gruppa_id': zayavlenie.pk_konkursnaya_gruppa.pk_konkursnaya_gruppa if zayavlenie.pk_konkursnaya_gruppa else ''
        }
    except Zayavlenie.DoesNotExist:
        data = {'success': False}
    return JsonResponse(data)

@csrf_exempt
def delete_zayavlenie(request):
    if request.method == 'POST':
        # Отладочная информация
        print("POST data:", request.POST)
        print("Raw data:", request.body)
        
        zayavlenie_id = request.POST.get('zayavlenie_id')
        print("Received zayavlenie_id:", zayavlenie_id)
        
        try:
            if not zayavlenie_id:
                return JsonResponse({'success': False, 'error': 'ID не указан'})
                
            zayavlenie = Zayavlenie.objects.get(pk_zayavlenie=zayavlenie_id)
            zayavlenie.delete()
            return JsonResponse({'success': True})
        except Exception as e:
            print("Error:", str(e))
            return JsonResponse({'success': False, 'error': str(e)})
    return JsonResponse({'success': False, 'error': 'Метод не поддерживается'})

def get_groups_by_specialty(request):
    specialty_id = request.GET.get('specialty_id')
    if not specialty_id:
        return JsonResponse({'groups': []})
    
    # Получаем группы через связь KCP
    groups = KonkursnayaGruppa.objects.filter(
        pk_kcp__pk_spetsialnost_id=specialty_id
    ).values('pk_konkursnaya_gruppa', 'naim', 'kolichestvo_mest')
    
    groups_data = [
        {
            'id': group['pk_konkursnaya_gruppa'],
            'name': f"{group['naim']} ({group['kolichestvo_mest']} мест)"
        }
        for group in groups
    ]
    
    return JsonResponse({'groups': groups_data})

@require_GET
def get_dokumenty_list(request):
    fizlitso_id = request.GET.get('fizlitso_id')
    if not fizlitso_id:
        return JsonResponse({'error': 'Не указан ID физического лица'}, status=400)
        
    dokumenty = Dokument.objects.filter(pk_fizicheskoe_litso_id=fizlitso_id).select_related('pk_vid_dokumenta')
    
    data = [{
        'pk_dokument ': dok.pk_dokument,  # Первичный ключ
        'pk_vid_dokumenta': dok.pk_vid_dokumenta.naim if dok.pk_vid_dokumenta else None,  # ID вида документа
        'seriya': dok.seriya or '',
        'nomer': dok.nomer or '',
        'kem_vydan': dok.kem_vydan or '',
        'kod_podrazd': str(dok.kod_podrazd) if dok.kod_podrazd else '',
        'data_vydachi': dok.data_vydachi.strftime('%d.%m.%Y') if dok.data_vydachi else '',
        'strana': dok.strana or '',
        'fio_v_dokumente': dok.fio_v_dokumente or '',  # Исправлено с fio на fio_v_dokumente
        'data_rozhdeniya': dok.data_rozhdeniya.strftime('%d.%m.%Y') if dok.data_rozhdeniya else '',
        'pol': dok.pol or '',
        'mesto_rozhdeniya': dok.mesto_rozhdeniya or '',
        'pk_fizicheskoe_litso': dok.pk_fizicheskoe_litso_id  # Добавлен pk_fizicheskoe_litso
    } for dok in dokumenty]
    
    return JsonResponse(data, safe=False)

@require_POST
def delete_dokument(request):
    try:
        dokument_id = request.POST.get('dokument_id')
        if not dokument_id:
            return JsonResponse({'success': False, 'error': 'Не указан ID документа'})
            
        dokument = get_object_or_404(Dokument, pk_dokument=dokument_id)
        dokument.delete()
        
        return JsonResponse({'success': True})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@require_GET
def get_dokument_data(request):
    try:
        dokument_id = request.GET.get('dokument_id')
        if not dokument_id:
            return JsonResponse({'success': False, 'error': 'Не указан ID документа'})
            
        dokument = get_object_or_404(Dokument, pk_dokument=dokument_id)
        data = {
            'pk_vid_dokumenta': dokument.pk_vid_dokumenta.pk_vid_dokumenta if dokument.pk_vid_dokumenta else None,
            'seriya': dokument.seriya or '',
            'nomer': dokument.nomer or '',
            'kem_vydan': dokument.kem_vydan or '',
            'kod_podrazd': dokument.kod_podrazd or '',
            'data_vydachi': dokument.data_vydachi.strftime('%d.%m.%Y') if dokument.data_vydachi else '',
            'strana': dokument.strana or '',
            'fio_v_dokumente': dokument.fio_v_dokumente or '',
            'data_rozhdeniya': dokument.data_rozhdeniya.strftime('%d.%m.%Y') if dokument.data_rozhdeniya else '',
            'pol': dokument.pol or '',
            'mesto_rozhdeniya': dokument.mesto_rozhdeniya or ''
        }
        return JsonResponse({'success': True, 'data': data})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@require_GET
def refresh_fizlitso_table(request):
    try:
        fizlitso_list = FizicheskoeLitso.objects.all()
        data = []
        
        for fl in fizlitso_list:
            item = {
                'pk_fizicheskoe_litso': fl.pk_fizicheskoe_litso,
                'familiya': fl.familiya,
                'imya': fl.imya,
                'otchestvo': fl.otchestvo or '-',
                'data_rozhdeniya': fl.data_rozhdeniya.strftime('%d.%m.%Y') if fl.data_rozhdeniya else '-',
                'telefon': fl.telefon,
                'actions': f'''
                    <button class="btn btn-info btn-sm" onclick="openRelatedTabs('{fl.pk_fizicheskoe_litso}')">
                        <i class="fas fa-check me-1"></i>Выбрать
                    </button>
                    <button class="btn btn-warning btn-sm edit-fizlitso ms-1" data-id="{fl.pk_fizicheskoe_litso}">
                        <i class="fas fa-edit me-1"></i>Редактировать
                    </button>
                '''
            }
            data.append(item)
        
        return JsonResponse({
            'success': True,
            'data': data
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })

@require_POST
def save_fizicheskoe_litso(request):
    try:
        form = FizicheskoeLitsoForm(request.POST)
        if form.is_valid():
            form.save()
            return JsonResponse({
                'success': True,
                'message': 'Физическое лицо успешно сохранено'
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'Ошибка валидации формы',
                'errors': form.errors
            })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })

@require_GET
def get_fizlitso_data(request):
    try:
        fizlitso_id = request.GET.get('fizlitso_id')
        if not fizlitso_id:
            return JsonResponse({'success': False, 'error': 'Не указан ID физического лица'})
            
        fizlitso = get_object_or_404(FizicheskoeLitso, pk_fizicheskoe_litso=fizlitso_id)
        data = {
            'familiya': fizlitso.familiya,
            'imya': fizlitso.imya,
            'otchestvo': fizlitso.otchestvo or '',
            'data_rozhdeniya': fizlitso.data_rozhdeniya.strftime('%Y-%m-%d'),
            'data_rozhdeniya_display': fizlitso.data_rozhdeniya.strftime('%d.%m.%Y'),
            'telefon': fizlitso.telefon
        }
        return JsonResponse({'success': True, 'data': data})
    except Exception as e:
        return JsonResponse({'success': False, 'error': str(e)})

@require_POST
def update_fizlitso(request):
    try:
        fizlitso_id = request.POST.get('fizlitso_id')
        if not fizlitso_id:
            return JsonResponse({'success': False, 'error': 'Не указан ID физического лица'})
            
        fizlitso = get_object_or_404(FizicheskoeLitso, pk_fizicheskoe_litso=fizlitso_id)
        form = FizicheskoeLitsoForm(request.POST, instance=fizlitso)
        
        if form.is_valid():
            form.save()
            return JsonResponse({
                'success': True,
                'message': 'Данные успешно обновлены'
            })
        else:
            return JsonResponse({
                'success': False,
                'error': 'Ошибка валидации формы',
                'errors': form.errors
            })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })

@require_GET
def refresh_lichnoe_delo_table(request):
    try:
        selected_fiz_litso_id = request.GET.get('fizlitso_id')
        lichnoe_delo_list = LichnoeDelo.objects.none()
        
        if selected_fiz_litso_id:
            lichnoe_delo_list = LichnoeDelo.objects.filter(
                pk_fizicheskoe_litso_id=selected_fiz_litso_id
            ).select_related('pk_fizicheskoe_litso')
        
        data = []
        for ld in lichnoe_delo_list:
            # Формируем только ФИО
            fio = ''
            if ld.pk_fizicheskoe_litso:
                fio = f"{ld.pk_fizicheskoe_litso.familiya} {ld.pk_fizicheskoe_litso.imya}"
                if ld.pk_fizicheskoe_litso.otchestvo:
                    fio += f" {ld.pk_fizicheskoe_litso.otchestvo}"
            
            # Формируем URL для редактирования
            edit_url = reverse('dynamic_view_edit', kwargs={
                'model_name': 'LichnoeDelo',
                'pk': ld.pk_lichnoe_delo
            })
            
            # Формируем badge для оригинала
            original_badge = '''
                <span class="badge bg-success">Есть</span>
            ''' if ld.original else '''
                <span class="badge bg-secondary">Нет</span>
            '''
            
            item = {
                'pk_lichnoe_delo': ld.pk_lichnoe_delo,
                'nomer': ld.nomer,
                'original': original_badge,  # Используем badge вместо текста
                'fio': fio,
                'actions': f'''
                    <div class="btn-group" role="group">
                        <button type="button" 
                                class="btn btn-info btn-sm text-white edit-lichnoe-delo"
                                data-lichnoe-delo-id="{ld.pk_lichnoe_delo}"
                                data-fiz-litso-id="{ld.pk_fizicheskoe_litso.pk_fizicheskoe_litso if ld.pk_fizicheskoe_litso else ''}">
                            <i class="fas fa-edit me-1"></i> Редактировать
                        </button>
                        <button type="button" 
                                class="btn btn-success btn-sm text-white select-lichnoe-delo"
                                data-lichnoe-delo-id="{ld.pk_lichnoe_delo}"
                                data-fiz-litso-id="{ld.pk_fizicheskoe_litso.pk_fizicheskoe_litso if ld.pk_fizicheskoe_litso else ''}">
                            <i class="fas fa-file-alt me-1"></i> Заявления
                        </button>
                    </div>
                '''
            }
            data.append(item)
        
        return JsonResponse({
            'success': True,
            'data': data
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })

@require_POST
def save_lichnoe_delo(request):
    try:
        # Получаем ID записи, если это редактирование
        lichnoe_delo_id = request.POST.get('lichnoe_delo_id')
        
        # Получаем существующее личное дело или None
        instance = None
        if lichnoe_delo_id:
            instance = LichnoeDelo.objects.filter(pk_lichnoe_delo=lichnoe_delo_id).first()
        
        # Создаем форму с данными
        form = LichnoeDeloForm(request.POST, instance=instance)
        
        if form.is_valid():
            lichnoe_delo = form.save()
            return JsonResponse({
                'success': True,
                'message': 'Личное дело успешно сохранено',
                'id': lichnoe_delo.pk_lichnoe_delo
            })
        else:
            # Формируем сообщения об ошибках
            errors = {}
            for field, error_list in form.errors.items():
                errors[field] = [str(error) for error in error_list]
            
            return JsonResponse({
                'success': False,
                'errors': errors
            })
            
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })

@require_GET
def get_lichnoe_delo_data(request):
    try:
        lichnoe_delo_id = request.GET.get('lichnoe_delo_id')
        if not lichnoe_delo_id:
            return JsonResponse({'success': False, 'error': 'Не указан ID личного дела'})
            
        lichnoe_delo = get_object_or_404(LichnoeDelo, pk_lichnoe_delo=lichnoe_delo_id)
        
        data = {
            'pk_lichnoe_delo': lichnoe_delo.pk_lichnoe_delo,
            'nomer': lichnoe_delo.nomer,
            'original': lichnoe_delo.original,
            'pk_fizicheskoe_litso': lichnoe_delo.pk_fizicheskoe_litso.pk_fizicheskoe_litso if lichnoe_delo.pk_fizicheskoe_litso else None
        }
        
        return JsonResponse({
            'success': True,
            'data': data
        })
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })

@require_POST
def update_lichnoe_delo(request):
    try:
        lichnoe_delo_id = request.POST.get('lichnoe_delo_id')
        if not lichnoe_delo_id:
            return JsonResponse({
                'success': False,
                'error': 'Не указан ID личного дела'
            })
        
        # Получаем существующее личное дело
        lichnoe_delo = get_object_or_404(LichnoeDelo, pk_lichnoe_delo=lichnoe_delo_id)
        
        # Создаем форму с данными и существующим экземпляром
        form = LichnoeDeloForm(request.POST, instance=lichnoe_delo)
        
        if form.is_valid():
            form.save()
            return JsonResponse({
                'success': True,
                'message': 'Личное дело успешно обновлено'
            })
        else:
            return JsonResponse({
                'success': False,
                'errors': form.errors
            })
            
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        })

def get_group_details(request, pk=None):
    try:
        # Получаем ID группы либо из URL, либо из GET-параметра
        group_id = pk if pk is not None else request.GET.get('group_id')
        
        if not group_id:
            return JsonResponse({
                'success': False,
                'error': 'Group ID not provided'
            })
            
        print(f"Getting details for group ID: {group_id}")
        gruppa = get_object_or_404(KonkursnayaGruppa, pk_konkursnaya_gruppa=group_id)
        
        # Получаем категорию обучения напрямую из группы
        kategoriya_obucheniya = gruppa.pk_kategoriya_obucheniya.pk_kategoriya_obucheniya if gruppa.pk_kategoriya_obucheniya else None
        
        # Получаем форму обучения через связь KCP
        forma_obucheniya = None
        if gruppa.pk_kcp and gruppa.pk_kcp.pk_forma_obucheniya:
            forma_obucheniya = gruppa.pk_kcp.pk_forma_obucheniya.pk_forma_obucheniya
        
        print(f"Found group: {gruppa}")
        print(f"Forma obucheniya: {forma_obucheniya}")
        print(f"Kategoriya obucheniya: {kategoriya_obucheniya}")
        
        return JsonResponse({
            'success': True,
            'data': {
                'forma_obucheniya': forma_obucheniya,
                'kategoriya_obucheniya': kategoriya_obucheniya
            }
        })
        
    except Exception as e:
        print(f"Error in get_group_details: {str(e)}")
        return JsonResponse({
            'status': 'error',
            'message': str(e)
        })
    
@require_POST
@transaction.atomic
def create_konkursnaya_gruppa(request):
    try:
        # Получаем данные из формы
        naim = request.POST.get('nazvanie')
        kategoriya_obucheniya_id = request.POST.get('uroven_podgotovki')
        kolichestvo_mest = request.POST.get('plan_nabora')
        daty_podachi = request.POST.get('daty_podachi', '')
        pk_kcp = request.POST.get('pk_kcp')

        # Валидация данных
        if not all([naim, kategoriya_obucheniya_id, kolichestvo_mest, pk_kcp]):
            return JsonResponse({
                'success': False,
                'message': 'Все обязательные поля должны быть заполнены'
            })

        # Форматируем даты
        if daty_podachi:
            try:
                start_date, end_date = daty_podachi.split(' - ')
                start_date = datetime.strptime(start_date, '%d.%m.%Y').strftime('%Y-%m-%d')
                end_date = datetime.strptime(end_date, '%d.%m.%Y').strftime('%Y-%m-%d')
                daty_podachi = f"[{start_date}, {end_date}]"
            except Exception as e:
                return JsonResponse({
                    'success': False,
                    'message': f'Ошибка в формате дат: {str(e)}'
                })

        # Получаем следующее значение для pk_konkursnaya_gruppa
        max_pk = KonkursnayaGruppa.objects.aggregate(models.Max('pk_konkursnaya_gruppa'))['pk_konkursnaya_gruppa__max']
        next_pk = (max_pk or 0) + 1

        # Создаем конкурсную группу с явным указанием pk
        gruppa = KonkursnayaGruppa.objects.create(
            pk_konkursnaya_gruppa=next_pk,  # Явно указываем ID
            naim=naim,
            kolichestvo_mest=kolichestvo_mest,
            pk_kcp_id=pk_kcp,
            pk_kategoriya_obucheniya_id=kategoriya_obucheniya_id,
            daty_podachi=daty_podachi if daty_podachi else None
        )

        return JsonResponse({
            'success': True,
            'message': 'Конкурсная группа успешно создана'
        })

    except Exception as e:
        # Добавляем подробности об ошибке в лог
        print(f"Error creating konkursnaya gruppa: {str(e)}")
        return JsonResponse({
            'success': False,
            'message': f'Ошибка при создании группы: {str(e)}'
        })

def refresh_konkursnye_gruppy(request):
    try:
        konkursnye_gruppy = KonkursnayaGruppa.objects.select_related('pk_kcp', 'pk_kategoriya_obucheniya').all()
        data = []
        
        for gruppa in konkursnye_gruppy:
            data.append({
                'nazvanie': gruppa.naim,
                'forma_obucheniya': str(gruppa.pk_kcp.pk_forma_obucheniya) if gruppa.pk_kcp else '',
                'uroven_podgotovki': str(gruppa.pk_kategoriya_obucheniya) if gruppa.pk_kategoriya_obucheniya else '',
                'plan_nabora': str(gruppa.kolichestvo_mest),
                'actions': f'<a href="/konkursnye-gruppy/{gruppa.pk_konkursnaya_gruppa}" class="btn btn-info btn-sm"><i class="fas fa-eye me-1"></i>Просмотр списка</a>'
            })
        
        return JsonResponse({'data': data})
    except Exception as e:
        return JsonResponse({'error': str(e)}, status=500)