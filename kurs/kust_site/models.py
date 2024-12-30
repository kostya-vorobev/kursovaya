# This is an auto-generated Django model module.
# You'll have to do the following manually to clean this up:
#   * Rearrange models' order
#   * Make sure each model has one field with primary_key=True
#   * Make sure each ForeignKey and OneToOneField has `on_delete` set to the desired behavior
#   * Remove `managed = False` lines if you wish to allow Django to create, modify, and delete the table
# Feel free to rename the models, but don't rename db_table values or field names.
from django.db import models
from django.shortcuts import render
from django.apps import apps


class BallIndDost(models.Model):
    ball = models.BigIntegerField(db_column='Ball', verbose_name='Балл')  # Field name made lowercase.
    pk_facultet = models.OneToOneField('Fakultet', models.DO_NOTHING, db_column='PK_Facultet', primary_key=True, verbose_name='id')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'Ball_Ind_Dost'



class Fakultet(models.Model):
    naim = models.CharField(db_column='Naim', max_length=64, verbose_name='Наименование')  # Field name made lowercase.
    abreviatura = models.CharField(db_column='Abreviatura', max_length=8, verbose_name='Абревиатура')  # Field name made lowercase.
    email = models.CharField(db_column='Email', max_length=64, verbose_name='Email')  # Field name made lowercase.
    telefon = models.CharField(db_column='Telefon', max_length=15, verbose_name='Телефон')  # Field name made lowercase.
    fio_decan = models.CharField(db_column='FIO_decan', max_length=64, verbose_name='ФИО декана')  # Field name made lowercase.
    pk_facultet = models.AutoField(db_column='PK_Facultet', primary_key=True, verbose_name='id')  # Field name made lowercase.
    def __str__(self):
        return str(self.abreviatura)
    class Meta:
        managed = False
        db_table = 'Fakultet'

class Vw_contest_results(models.Model):
    naim = models.TextField(db_column='ФИО', verbose_name='ФИО')
    specialnost = models.CharField(db_column='Специальность', max_length=64, verbose_name='Специальность')
    ball = models.DecimalField(db_column='Баллы_за_экзамены', max_digits=3, decimal_places=0, verbose_name='Баллы за экзамены')
    date_pod = models.CharField(db_column='Дата_подачи', verbose_name='Дата подачи')


    class Meta:
        managed = False
        db_table = 'vw_contest_results'

class FizicheskoeLitso(models.Model):
    imya = models.CharField(db_column='Imya', max_length=32, verbose_name='Имя')  # Field name made lowercase.
    familiya = models.CharField(db_column='Familiya', max_length=32, verbose_name='Фамилия')  # Field name made lowercase.
    otchestvo = models.CharField(db_column='Otchestvo', max_length=32, blank=True, null=True, verbose_name='Отчество')  # Field name made lowercase.
    data_rozhdeniya = models.DateField(db_column='Data_rozhdeniya', verbose_name='Дата рождения')  # Field name made lowercase.
    telefon = models.CharField(db_column='Telefon', max_length=18, verbose_name='Телефон')  # Field name made lowercase.
    pk_fizicheskoe_litso = models.AutoField(db_column='PK_Fizicheskoe_litso', primary_key=True, verbose_name='Физ. лицо')  # Field name made lowercase.
    def __str__(self):
        return str( str(self.pk_fizicheskoe_litso) +', '+ self.familiya + ' ' +  self.imya + ' ' + self.otchestvo + ', ' + str(self.data_rozhdeniya))
    class Meta:
        managed = False
        db_table = 'Fizicheskoe_litso'

class Dokument(models.Model):
    seriya = models.CharField(db_column='Seriya', max_length=32, blank=True, null=True, verbose_name='Серия')  # Field name made lowercase.
    nomer = models.CharField(db_column='Nomer', max_length=16, verbose_name='Номер')  # Field name made lowercase.
    kem_vydan = models.CharField(db_column='Kem_vydan', max_length=128, blank=True, null=True, verbose_name='Кем выдан')  # Field name made lowercase.
    kod_podrazd = models.DecimalField(db_column='Kod_podrazd', max_digits=6, decimal_places=0, blank=True, null=True, verbose_name='Код подразделения')  # Field name made lowercase.
    data_vydachi = models.DateField(db_column='Data_vydachi', verbose_name='Дата выдачи')  # Field name made lowercase.
    strana = models.CharField(db_column='Strana', max_length=64, blank=True, null=True, verbose_name='Страна')  # Field name made lowercase.
    fio_v_dokumente = models.CharField(db_column='FIO_v_dokumente', max_length=64, verbose_name='ФИО')  # Field name made lowercase.
    data_rozhdeniya = models.DateField(db_column='Data_rozhdeniya', blank=True, null=True, verbose_name='Дата рождения')  # Field name made lowercase.
    pol = models.CharField(db_column='Pol', max_length=8, blank=True, null=True, verbose_name='Пол')  # Field name made lowercase.
    mesto_rozhdeniya = models.CharField(db_column='Mesto_rozhdeniya', max_length=128, blank=True, null=True, verbose_name='Место рождения')  # Field name made lowercase.
    pk_vid_dokumenta = models.ForeignKey('VidDokumenta', models.DO_NOTHING, db_column='PK_Vid_dokumenta', blank=True, null=True, verbose_name='Вид документа')  # Field name made lowercase.
    pk_dokument = models.AutoField(db_column='PK_Dokument', primary_key=True, verbose_name='Номер документа')  # Field name made lowercase. The composite primary key (PK_Dokument, PK_Fizicheskoe_litso) found, that is not supported. The first column is selected.
    pk_fizicheskoe_litso = models.ForeignKey(FizicheskoeLitso, models.DO_NOTHING, db_column='PK_Fizicheskoe_litso', blank=True, null=True, verbose_name='Физ. лицо')  # Field name made lowercase.
    class Meta:
        managed = False
        db_table = 'Dokument'
        unique_together = (('pk_dokument', 'pk_fizicheskoe_litso'),)


class FormaObucheniya(models.Model):
    naim = models.CharField(db_column='Naim', max_length=64, verbose_name='Наимсенование')  # Field name made lowercase.
    pk_forma_obucheniya = models.AutoField(db_column='PK_Forma_obucheniya', primary_key=True, verbose_name='Форма обучения')  # Field name made lowercase.
    def __str__(self):
        return str(self.naim)
    class Meta:
        managed = False
        db_table = 'Forma_obucheniya'


class Kcp(models.Model):
    summa = models.DecimalField(db_column='Summa', max_digits=3, decimal_places=0, verbose_name='Сумма мест')  # Field name made lowercase.
    pk_facultet = models.ForeignKey(Fakultet, models.DO_NOTHING, db_column='PK_Facultet', blank=True, null=True, verbose_name='Факультет')  # Field name made lowercase.
    pk_forma_obucheniya = models.ForeignKey(FormaObucheniya, models.DO_NOTHING, db_column='PK_Forma_obucheniya', blank=True, null=True, verbose_name='Форма обучения')  # Field name made lowercase.
    pk_kcp = models.AutoField(db_column='PK_KCP', primary_key=True, verbose_name='id')  # Field name made lowercase.
    pk_spetsialnost = models.ForeignKey('Spetsialnost', models.DO_NOTHING, db_column='PK_Spetsialnost', blank=True, null=True, verbose_name='Специальность')  # Field name made lowercase.
    def __str__(self):
        return str(self.summa)
    class Meta:
        managed = False
        db_table = 'KCP'


class KategoriyaObucheniya(models.Model):
    naim = models.CharField(db_column='Naim', max_length=64, verbose_name='Наименование')  # Field name made lowercase.
    pk_kategoriya_obucheniya = models.AutoField(db_column='PK_Kategoriya_obucheniya', primary_key=True, verbose_name='id')  # Field name made lowercase.
    def __str__(self):
        return str(self.naim)
    class Meta:
        managed = False
        db_table = 'Kategoriya_obucheniya'


class KonkursnayaGruppa(models.Model):
    kolichestvo_mest = models.DecimalField(db_column='Kolichestvo_mest', max_digits=6, decimal_places=0, verbose_name='Количество мест')  # Field name made lowercase.
    pk_konkursnaya_gruppa = models.AutoField(db_column='PK_Konkursnaya_gruppa', primary_key=True, verbose_name='id')  # Field name made lowercase.
    pk_kcp = models.ForeignKey(Kcp, models.DO_NOTHING, db_column='PK_KCP', blank=True, null=True, verbose_name='КЦП')  # Field name made lowercase.
    pk_kategoriya_obucheniya = models.ForeignKey(KategoriyaObucheniya, models.DO_NOTHING, db_column='PK_Kategoriya_obucheniya', blank=True, null=True, verbose_name='Категория обучения')  # Field name made lowercase.
    daty_podachi = models.TextField(db_column='Daty_podachi', verbose_name='Дата подачи')  # Field name made lowercase. This field type is a guess.
    naim = models.CharField(db_column='Naim', max_length=64, verbose_name='Наименование')  # Field name made lowercase.
    def __str__(self):
        return str(self.naim + ', ' + str(self.pk_kategoriya_obucheniya))
    class Meta:
        managed = False
        db_table = 'Konkursnaya_gruppa'


class LichnoeDelo(models.Model):
    pk_lichnoe_delo = models.AutoField(db_column='PK_Lichnoe_delo', primary_key=True, verbose_name='id')  # Field name made lowercase.
    pk_fizicheskoe_litso = models.ForeignKey(FizicheskoeLitso, models.DO_NOTHING, db_column='PK_Fizicheskoe_litso', blank=True, null=True, verbose_name='Физ. лицо')  # Field name made lowercase.
    nomer = models.CharField(db_column='Nomer', max_length=32, verbose_name='Номер')  # Field name made lowercase.
    original = models.BooleanField(db_column='Original', verbose_name='Наличие оригинала')  # Field name made lowercase.
    def __str__(self):
        return str(str(self.nomer) + '\n' + str(self.pk_fizicheskoe_litso)) 
    class Meta:
        managed = False
        db_table = 'Lichnoe_delo'


class Predmet(models.Model):
    naim = models.CharField(db_column='Naim', max_length=64, verbose_name='Наименвоание')  # Field name made lowercase.
    pk_predmet = models.AutoField(db_column='PK_Predmet', primary_key=True, verbose_name='id')  # Field name made lowercase.
    def __str__(self):
        return str(self.naim) 
    class Meta:
        managed = False
        db_table = 'Predmet'


class PredmetSpetsialnost(models.Model):
    prioritet = models.DecimalField(db_column='Prioritet', max_digits=1, decimal_places=0, verbose_name='Приоритет')  # Field name made lowercase.
    pk_spetsialnost = models.ForeignKey('Spetsialnost', models.DO_NOTHING, db_column='PK_Spetsialnost', verbose_name='Специальность')  # Field name made lowercase.
    pk_predmet = models.ForeignKey(Predmet, models.DO_NOTHING, db_column='PK_Predmet', verbose_name='Предмет')  # Field name made lowercase.
    pk_predmet_spetsianost = models.AutoField(db_column='PK_Predmet_spetsianost', primary_key=True, verbose_name='id')  # Field name made lowercase. The composite primary key (PK_Predmet_spetsianost, PK_Spetsialnost, PK_Predmet) found, that is not supported. The first column is selected.

    class Meta:
        managed = False
        db_table = 'Predmet_spetsialnost'
        unique_together = (('pk_predmet_spetsianost', 'pk_spetsialnost', 'pk_predmet'),)


class Prikaz(models.Model):
    nomer = models.CharField(db_column='Nomer', max_length=16, verbose_name='Номер')  # Field name made lowercase.
    data = models.DateField(db_column='Data', verbose_name='Дата')  # Field name made lowercase.
    chei = models.CharField(db_column='Chei', max_length=128, verbose_name='Чей приказ')  # Field name made lowercase.
    utverzhdeno = models.BooleanField(db_column='Utverzhdeno', verbose_name='Утверждено')  # Field name made lowercase.
    pk_forma_obucheniya = models.ForeignKey(FormaObucheniya, models.DO_NOTHING, db_column='PK_Forma_obucheniya', blank=True, null=True, verbose_name='Форма обучения')  # Field name made lowercase.
    pk_kategoriya_obucheniya = models.ForeignKey(KategoriyaObucheniya, models.DO_NOTHING, db_column='PK_Kategoriya_obucheniya', blank=True, null=True, verbose_name='Категория обучения')  # Field name made lowercase.
    pk_prikaz = models.AutoField(db_column='PK_Prikaz', primary_key=True)  # Field name made lowercase.
    pk_konkursnaya_gruppa = models.ForeignKey(KonkursnayaGruppa, models.DO_NOTHING, db_column='PK_Konkursnaya_gruppa', blank=True, null=True, verbose_name='Конкурсная группа')  # Field name made lowercase.
    class Meta:
        managed = False
        db_table = 'Prikaz'


class Rezultat(models.Model):
    ball = models.DecimalField(db_column='Ball', max_digits=3, decimal_places=0, verbose_name='Балл')  # Field name made lowercase.
    pk_predmet = models.ForeignKey(Predmet, models.DO_NOTHING, db_column='PK_Predmet', blank=True, null=True, verbose_name='Предмет')  # Field name made lowercase.
    pk_tip_otsenki = models.ForeignKey('TipOtsenki', models.DO_NOTHING, db_column='PK_Tip_otsenki', blank=True, null=True, verbose_name='Тип оценки')  # Field name made lowercase.
    pk_zayavlenie = models.ForeignKey('Zayavlenie', models.DO_NOTHING, db_column='PK_Zayavlenie', verbose_name='Заявление')  # Field name made lowercase.
    pk_rezultat = models.AutoField(db_column='PK_Rezultat', primary_key=True, verbose_name='id')  # Field name made lowercase. The composite primary key (PK_Rezultat, PK_Zayavlenie, PK_Lichnoe_delo) found, that is not supported. The first column is selected.
    pk_lichnoe_delo = models.IntegerField(db_column='PK_Lichnoe_delo', verbose_name='Личное дело')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'Rezultat'
        unique_together = (('pk_rezultat', 'pk_zayavlenie', 'pk_lichnoe_delo'),)


class RezultatHistory(models.Model):
    pk_rezultat_history = models.AutoField(db_column='PK_Rezultat_history', primary_key=True)  # Field name made lowercase.
    pk_rezultat = models.IntegerField(db_column='PK_Rezultat')  # Field name made lowercase.
    ball = models.DecimalField(db_column='Ball', max_digits=3, decimal_places=0)  # Field name made lowercase.
    modified_at = models.DateTimeField(db_column='Modified_at')  # Field name made lowercase.
    change_type = models.CharField(db_column='Change_type', max_length=10)  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'Rezultat_history'


class Spetsialnost(models.Model):
    kod = models.DecimalField(db_column='Kod', max_digits=7, decimal_places=0, verbose_name='Код специальности')  # Field name made lowercase.
    naim = models.CharField(db_column='Naim', max_length=64, verbose_name='Наименование')  # Field name made lowercase.
    pk_spetsialnost = models.AutoField(db_column='PK_Spetsialnost', primary_key=True, verbose_name='id')  # Field name made lowercase.
    def __str__(self):
        return str(self.naim) 
    class Meta:
        managed = False
        db_table = 'Spetsialnost'


class StrokaPrikaza(models.Model):
    pk_prikaz = models.ForeignKey(Prikaz, models.DO_NOTHING, db_column='PK_Prikaz', verbose_name='id')  # Field name made lowercase.
    pk_stroka_prikaza = models.AutoField(db_column='PK_Stroka_prikaza', primary_key=True, verbose_name='Строка приказа')  # Field name made lowercase. The composite primary key (PK_Stroka_prikaza, PK_Zayavlenie, PK_Prikaz, PK_Lichnoe_delo) found, that is not supported. The first column is selected.
    pk_zayavlenie = models.ForeignKey('Zayavlenie', models.DO_NOTHING, db_column='PK_Zayavlenie', verbose_name='Заявление')  # Field name made lowercase.
    pk_lichnoe_delo = models.IntegerField(db_column='PK_Lichnoe_delo', verbose_name='Лчиное дело')  # Field name made lowercase.

    class Meta:
        managed = False
        db_table = 'Stroka_prikaza'
        unique_together = (('pk_stroka_prikaza', 'pk_zayavlenie', 'pk_prikaz', 'pk_lichnoe_delo'),)


class TipOtsenki(models.Model):
    naim = models.CharField(db_column='Naim', max_length=64, verbose_name='Наименование')  # Field name made lowercase.
    pk_tip_otsenki = models.AutoField(db_column='PK_Tip_otsenki', primary_key=True, verbose_name='id')  # Field name made lowercase.
    def __str__(self):
        return str(self.naim) 
    class Meta:
        managed = False
        db_table = 'Tip_otsenki'


class VidDokumenta(models.Model):
    naim = models.CharField(db_column='Naim', max_length=64, verbose_name='Наименование')  # Field name made lowercase.
    pk_vid_dokumenta = models.AutoField(db_column='PK_Vid_dokumenta', primary_key=True, verbose_name='id')  # Field name made lowercase.
    def __str__(self):
        return str(self.naim) 
    class Meta:
        managed = False
        db_table = 'Vid_dokumenta'


class Zayavlenie(models.Model):
    napravlenie = models.ForeignKey(Spetsialnost, models.DO_NOTHING, db_column='Napravlenie', verbose_name='Направление')  # Field name made lowercase.
    summa_ballov = models.DecimalField(db_column='Summa_ballov', max_digits=3, decimal_places=0, verbose_name='Сумма баллов')  # Field name made lowercase.
    prioritet = models.DecimalField(db_column='Prioritet', max_digits=3, decimal_places=0, verbose_name='Приоритет')  # Field name made lowercase.
    pk_konkursnaya_gruppa = models.ForeignKey(KonkursnayaGruppa, models.DO_NOTHING, db_column='PK_Konkursnaya_gruppa', blank=True, null=True, verbose_name='Конкурсная группа')  # Field name made lowercase.
    pk_zayavlenie = models.AutoField(db_column='PK_Zayavlenie', primary_key=True, verbose_name='Номер заявления')  # Field name made lowercase. The composite primary key (PK_Zayavlenie, PK_Lichnoe_delo) found, that is not supported. The first column is selected.
    pk_lichnoe_delo = models.ForeignKey(LichnoeDelo, models.DO_NOTHING, db_column='PK_Lichnoe_delo', verbose_name='Личное дело')  # Field name made lowercase.
    data_podachi = models.DateField(db_column='Data_podachi', verbose_name='Дата подачи')  # Field name made lowercase.
    def __str__(self):
        return str(self.pk_zayavlenie) 

    class Meta:
        managed = False
        db_table = 'Zayavlenie'
        unique_together = (('pk_zayavlenie', 'pk_lichnoe_delo'),)


class AuthGroup(models.Model):
    name = models.CharField(unique=True, max_length=150)

    class Meta:
        managed = False
        db_table = 'auth_group'


class AuthGroupPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)
    permission = models.ForeignKey('AuthPermission', models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_group_permissions'
        unique_together = (('group', 'permission'),)


class AuthPermission(models.Model):
    name = models.CharField(max_length=255)
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING)
    codename = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'auth_permission'
        unique_together = (('content_type', 'codename'),)


class AuthUser(models.Model):
    password = models.CharField(max_length=128)
    last_login = models.DateTimeField(blank=True, null=True)
    is_superuser = models.BooleanField()
    username = models.CharField(unique=True, max_length=150)
    first_name = models.CharField(max_length=150)
    last_name = models.CharField(max_length=150)
    email = models.CharField(max_length=254)
    is_staff = models.BooleanField()
    is_active = models.BooleanField()
    date_joined = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'auth_user'


class AuthUserGroups(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    group = models.ForeignKey(AuthGroup, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_groups'
        unique_together = (('user', 'group'),)


class AuthUserUserPermissions(models.Model):
    id = models.BigAutoField(primary_key=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)
    permission = models.ForeignKey(AuthPermission, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'auth_user_user_permissions'
        unique_together = (('user', 'permission'),)


class DjangoAdminLog(models.Model):
    action_time = models.DateTimeField()
    object_id = models.TextField(blank=True, null=True)
    object_repr = models.CharField(max_length=200)
    action_flag = models.SmallIntegerField()
    change_message = models.TextField()
    content_type = models.ForeignKey('DjangoContentType', models.DO_NOTHING, blank=True, null=True)
    user = models.ForeignKey(AuthUser, models.DO_NOTHING)

    class Meta:
        managed = False
        db_table = 'django_admin_log'


class DjangoContentType(models.Model):
    app_label = models.CharField(max_length=100)
    model = models.CharField(max_length=100)

    class Meta:
        managed = False
        db_table = 'django_content_type'
        unique_together = (('app_label', 'model'),)


class DjangoMigrations(models.Model):
    id = models.BigAutoField(primary_key=True)
    app = models.CharField(max_length=255)
    name = models.CharField(max_length=255)
    applied = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_migrations'


class DjangoSession(models.Model):
    session_key = models.CharField(primary_key=True, max_length=40)
    session_data = models.TextField()
    expire_date = models.DateTimeField()

    class Meta:
        managed = False
        db_table = 'django_session'
