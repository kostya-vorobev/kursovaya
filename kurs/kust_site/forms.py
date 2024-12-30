# forms.py
from django import forms
from .models import Spetsialnost
from .models import FizicheskoeLitso, LichnoeDelo, Zayavlenie, Dokument, Rezultat, TipOtsenki, Predmet, PredmetSpetsialnost, KonkursnayaGruppa, VidDokumenta, Prikaz
from django.db.models import Q

class SpecialtyForm(forms.Form):
    specialty = forms.ModelChoiceField(queryset=Spetsialnost.objects.all(), label="Выберите специальность")

class FizicheskoeLitsoForm(forms.ModelForm):
    class Meta:
        model = FizicheskoeLitso
        fields = ['familiya', 'imya', 'otchestvo', 'data_rozhdeniya', 'telefon']
        widgets = {
            'familiya': forms.TextInput(attrs={
                'class': 'form-control',
                'maxlength': '32',
                'required': True,
                'placeholder': 'Введите фамилию'
            }),
            'imya': forms.TextInput(attrs={
                'class': 'form-control',
                'maxlength': '32',
                'required': True,
                'placeholder': 'Введите имя'
            }),
            'otchestvo': forms.TextInput(attrs={
                'class': 'form-control',
                'maxlength': '32',
                'placeholder': 'Введите отчество'
            }),
            'data_rozhdeniya': forms.DateInput(attrs={
                'class': 'form-control datepicker',
                'type': 'date',
                'required': True,
                'autocomplete': 'off',
                'placeholder': 'Выберите дату рождения'
            }),
            'telefon': forms.TextInput(attrs={
                'class': 'form-control',
                'required': True,
                'placeholder': '+7(XXX)XXX-XX-XX',
                'maxlength': '15'
            })
        }
        error_messages = {
            'familiya': {
                'required': 'Пожалуйста, введите фамилию',
                'invalid': 'Фамилия должна содержать только русские буквы'
            },
            'imya': {
                'required': 'Пожалуйста, введите имя',
                'invalid': 'Имя должно содержать только русские буквы'
            },
            'otchestvo': {
                'invalid': 'Отчество должно содержать только русские буквы'
            },
            'data_rozhdeniya': {
                'required': 'Пожалуйста, выберите дату рождения',
                'invalid': 'Неверный формат даты'
            },
            'telefon': {
                'required': 'Пожалуйста, введите номер телефона',
                'invalid': 'Неверный формат номера телефона'
            }
        }

class DokumentForm(forms.ModelForm):
    class Meta:
        model = Dokument
        fields = [
            'pk_fizicheskoe_litso',
            'pk_vid_dokumenta',
            'seriya',
            'nomer',
            'kem_vydan',
            'kod_podrazd',
            'data_vydachi',
            'strana',
            'fio_v_dokumente',
            'data_rozhdeniya',
            'pol',
            'mesto_rozhdeniya'
        ]
        widgets = {
            'pk_fizicheskoe_litso': forms.Select(attrs={
                'class': 'form-control select2',
                'disabled': 'disabled'
            }),
            'data_vydachi': forms.DateInput(attrs={
                'class': 'form-control datepicker',
                'autocomplete': 'off',
                'placeholder': 'Выберите дату выдачи'
            }),
            'data_rozhdeniya': forms.DateInput(attrs={
                'class': 'form-control datepicker',
                'autocomplete': 'off',
                'placeholder': 'Выберите дату рождения'
            }),
            'pk_vid_dokumenta': forms.Select(attrs={
                'class': 'form-control select2',
                'style': 'width: 100%'
            }),
            'seriya': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Введите серию документа'
            }),
            'nomer': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Введите номер документа'
            }),
            'kem_vydan': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Кем выдан документ'
            }),
            'kod_podrazd': forms.NumberInput(attrs={
                'class': 'form-control',
                'placeholder': 'Код подразделения'
            }),
            'strana': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Введите страну'
            }),
            'fio_v_dokumente': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'ФИО как в документе'
            }),
            'pol': forms.Select(attrs={
                'class': 'form-control'
            }, choices=[
                ('', 'Выберите пол'),
                ('М', 'Мужской'),
                ('Ж', 'Женский')
            ]),
            'mesto_rozhdeniya': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Место рождения'
            })
        }

    def __init__(self, *args, fizicheskoe_litso=None, **kwargs):
        super().__init__(*args, **kwargs)
        if fizicheskoe_litso:
            self.fields['pk_fizicheskoe_litso'].initial = fizicheskoe_litso.pk
            self.fields['pk_fizicheskoe_litso'].queryset = FizicheskoeLitso.objects.filter(pk=fizicheskoe_litso.pk)
            self.fields['fio_v_dokumente'].initial = f"{fizicheskoe_litso.familiya} {fizicheskoe_litso.imya} {fizicheskoe_litso.otchestvo}"

        # Делаем необязательные поля необязательными в форме
        optional_fields = ['seriya', 'kem_vydan', 'kod_podrazd', 'strana', 
                         'data_rozhdeniya', 'pol', 'mesto_rozhdeniya']
        for field in optional_fields:
            self.fields[field].required = False

        # Настраиваем отображение связанных полей
        self.fields['pk_fizicheskoe_litso'].queryset = FizicheskoeLitso.objects.all().order_by('familiya')
        self.fields['pk_vid_dokumenta'].queryset = VidDokumenta.objects.all().order_by('naim')

        # Настраиваем отображение в выпадающих списках
        self.fields['pk_fizicheskoe_litso'].label_from_instance = lambda obj: f"{obj.familiya} {obj.imya} {obj.otchestvo}"
        self.fields['pk_vid_dokumenta'].label_from_instance = lambda obj: f"{obj.naim}"

class LichnoeDeloForm(forms.ModelForm):
    class Meta:
        model = LichnoeDelo
        fields = ['nomer', 'original', 'pk_fizicheskoe_litso']
        widgets = {
            'nomer': forms.TextInput(attrs={
                'class': 'form-control',
                'placeholder': 'Введите номер личного дела',
                'required': True,
                'maxlength': '32'
            }),
            'original': forms.CheckboxInput(attrs={
                'class': 'form-check-input',
                'role': 'switch'
            }),
            'pk_fizicheskoe_litso': forms.HiddenInput()
        }

    def clean_nomer(self):
        nomer = self.cleaned_data.get('nomer')
        if not nomer:
            raise forms.ValidationError('Номер личного дела обязателен')
        
        # Проверка на уникальность номера
        instance = getattr(self, 'instance', None)
        if instance and instance.pk:
            # При редактировании исключаем текущее личное дело из проверки
            exists = LichnoeDelo.objects.exclude(pk=instance.pk).filter(nomer=nomer).exists()
        else:
            # При создании проверяем все личные дела
            exists = LichnoeDelo.objects.filter(nomer=nomer).exists()
            
        if exists:
            raise forms.ValidationError('Личное дело с таким номером уже существует')
            
        return nomer

class ZayavlenieForm(forms.ModelForm):
    napravlenie = forms.ModelChoiceField(
        queryset=Spetsialnost.objects.all().order_by('naim'),
        empty_label="Выберите специальность",
        widget=forms.Select(attrs={'class': 'form-control'}),
        label="Специальность"
    )
    
    prioritet = forms.ChoiceField(
        choices=[],
        widget=forms.Select(attrs={'class': 'form-control'}),
        label="Приоритет"
    )

    data_podachi = forms.DateField(
        widget=forms.DateInput(attrs={
            'class': 'form-control datepicker',
            'autocomplete': 'off'
        }),
        label="Дата подачи"
    )

    pk_konkursnaya_gruppa = forms.ModelChoiceField(
        queryset=KonkursnayaGruppa.objects.all().order_by('naim'),
        empty_label="Выберите конкурсную группу",
        widget=forms.Select(attrs={'class': 'form-control'}),
        label="Конкурсная грппа"
    )

    class Meta:
        model = Zayavlenie
        fields = ['napravlenie', 'prioritet', 'data_podachi', 'pk_konkursnaya_gruppa']

    def __init__(self, *args, available_priorities=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields['napravlenie'].label_from_instance = lambda obj: f"{obj.kod} - {obj.naim}"
        self.fields['pk_konkursnaya_gruppa'].label_from_instance = lambda obj: f"{obj.naim} ({obj.kolichestvo_mest} мест)"
        
        # Устанавливаем доступные приоритеты
        if available_priorities is not None:
            self.fields['prioritet'].choices = [('', 'Выберите приоритет')] + [
                (str(p), str(p)) for p in available_priorities
            ]
        else:
            self.fields['prioritet'].choices = [('', 'Выберите приоритет')] + [
                (str(i), str(i)) for i in range(1, 6)
            ]

class RezultatForm(forms.ModelForm):
    bally = forms.DecimalField(
        min_value=0,
        max_value=100,
        decimal_places=2,
        widget=forms.NumberInput(attrs={
            'class': 'form-control',
            'min': '0',
            'max': '100',
            'step': '0.01'
        }),
        label="Баллы"
    )

    tip_ispytaniya = forms.ModelChoiceField(
        queryset=TipOtsenki.objects.all().order_by('naim'),
        empty_label="Выберите тип испытания",
        widget=forms.Select(attrs={'class': 'form-control'}),
        label="Тип испытания"
    )

    pk_predmet = forms.ModelChoiceField(
        queryset=Predmet.objects.all(),
        empty_label="Выберите предмет",
        widget=forms.Select(attrs={'class': 'form-control'}),
        label="Предмет"
    )

    class Meta:
        model = Rezultat
        fields = ['pk_predmet', 'tip_ispytaniya', 'bally']

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        # Настройка отображения предметов
        self.fields['pk_predmet'].queryset = Predmet.objects.all().order_by('naim')
        self.fields['pk_predmet'].label_from_instance = lambda obj: obj.naim
        
        # Настройка отображения типов испытаний
        self.fields['tip_ispytaniya'].queryset = TipOtsenki.objects.all().order_by('naim')
        self.fields['tip_ispytaniya'].label_from_instance = lambda obj: obj.naim

    def clean_bally(self):
        value = self.cleaned_data['bally']
        if value is not None:
            if value < 0:
                raise forms.ValidationError('Баллы не могут быть отрицательными')
            if value > 100:
                raise forms.ValidationError('Баллы не могут превышать 100')
        return value

class PrikazForm(forms.ModelForm):
    class Meta:
        model = Prikaz
        fields = ['nomer', 'data', 'chei', 'pk_forma_obucheniya', 'pk_kategoriya_obucheniya']
        widgets = {
            'nomer': forms.TextInput(attrs={
                'class': 'form-control',
                'required': True,
                'placeholder': 'Введите номер приказа'
            }),
            'data': forms.DateInput(attrs={
                'class': 'form-control datepicker',
                'required': True,
                'autocomplete': 'off',
                'placeholder': 'Выберите дату'
            }),
            'chei': forms.TextInput(attrs={
                'class': 'form-control',
                'required': True,
                'placeholder': 'Укажите, чей приказ'
            }),
            'pk_forma_obucheniya': forms.Select(attrs={
                'class': 'form-control'
            }),
            'pk_kategoriya_obucheniya': forms.Select(attrs={
                'class': 'form-control'
            })
        }