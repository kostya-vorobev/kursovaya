from django.contrib import admin
from django.urls import path
#from kust_site.views import zayavlenie_list  # Убедитесь, что импортируете из правильного приложения
from kust_site.views import dynamic_view, create_lichnoe_delo, create_fizicheskoe_litso, create_zayavlenie, index
from kust_site import views 

urlpatterns = [
    path('admin/', admin.site.urls),
     path('', index, name='index'),
    #path('zayavlenie/', zayavlenie_list, name='zayavlenie_list'),
    path('data/<str:model_name>/', dynamic_view, name='dynamic_view'),  # Для списка
    path('data/<str:model_name>/<int:pk>/', dynamic_view, name='dynamic_view_edit'),  # Для редактирования
    path('create_fizicheskoe_litso/', create_fizicheskoe_litso, name='create_fizicheskoe_litso'),
    path('create_lichnoe_delo/', create_lichnoe_delo, name='create_lichnoe_delo'),
    path('create_zayavlenie/', create_zayavlenie, name='create_zayavlenie'),
    path('get_predmety/', views.get_predmety, name='get_predmety'),
    path('get_used_prioritets/', views.get_used_prioritets, name='get_used_prioritets'),
    path('get_documents/', views.get_documents, name='get_documents'),
    path('get_lichnoe_delo/', views.get_lichnoe_delo, name='get_lichnoe_delo'),
    path('get_zayavleniya/', views.get_zayavleniya, name='get_zayavleniya'),
    path('load_fizicheskoe_litso/', views.load_fizicheskoe_litso, name='load_fizicheskoe_litso'),
    path('load_dokument/', views.load_dokument, name='load_dokument'),
    path('load_lichnoe_delo/', views.load_lichnoe_delo, name='load_lichnoe_delo'),
    path('load_zayavlenie/', views.load_zayavlenie, name='load_zayavlenie'),
    path('check_prioritet/', views.check_prioritet, name='check_prioritet'),
    path('save_zayavlenie_data/', views.save_zayavlenie_data, name='save_zayavlenie_data'),
    path('save_dokument/', views.save_dokument, name='save_dokument'),
    path('get_dokument/', views.get_dokument, name='get_dokument'),
    path('dokumenty/<int:pk_fizicheskoe_litso>/', views.dokumenty_list, name='dokumenty_list'),
    path('dokumenty/', views.dokumenty_list, name='dokumenty_list'),
    path('konkursnye-gruppy/', views.konkursnye_gruppy, name='konkursnye_gruppy'),
    path('konkursnye-gruppy/<int:pk>/', views.konkursnaya_gruppa_detail, name='konkursnaya_gruppa_detail'),
    path('zachislenie/', views.zachislenie, name='zachislenie'),
    path('zachislenie/create/', views.create_prikaz, name='create_prikaz'),
    path('zachislenie/prikaz/<int:pk>/', views.prikaz_detail, name='prikaz_detail'),
    path('zachislenie/remove-student/<int:pk>/', views.remove_student_from_prikaz, name='remove_student_from_prikaz'),
    path('zachislenie/get-prikaz/<int:pk>/', views.get_prikaz, name='get_prikaz'),
    path('zachislenie/edit-prikaz/<int:pk>/', views.edit_prikaz, name='edit_prikaz'),
    path('zachislenie/search-available-students/<int:prikaz_id>/', views.search_available_students, name='search_available_students'),
    path('zachislenie/add-student-to-prikaz/<int:prikaz_id>/', views.add_student_to_prikaz, name='add_student_to_prikaz'),
    path('zachislenie/remove-student/<int:stroka_id>/', views.remove_student, name='remove_student'),
    path('zachislenie/utverdit-prikaz/<int:prikaz_id>/', views.utverdit_prikaz, name='utverdit_prikaz'),
    path('zachislenie/generate-prikazy/', views.generate_prikazy, name='generate_prikazy'),
    path('zachislenie/delete-prikaz/<int:prikaz_id>/', views.delete_prikaz, name='delete_prikaz'),
    path('get_zayavleniya/', views.get_zayavleniya, name='get_zayavleniya'),
    path('delete_zayavlenie/', views.delete_zayavlenie, name='delete_zayavlenie'),
    path('get_zayavlenie_data/', views.get_zayavlenie_data, name='get_zayavlenie_data'),
    path('delete_zayavlenie/<int:prikaz_id>/', views.delete_zayavlenie, name='delete_zayavlenie'),
    path('delete_zayavlenie/', views.delete_zayavlenie, name='delete_zayavlenie'),
    path('get_groups_by_specialty/', views.get_groups_by_specialty, name='get_groups_by_specialty'),
    path('get_dokumenty_list/', views.get_dokumenty_list, name='get_dokumenty_list'),
    path('delete_dokument/', views.delete_dokument, name='delete_dokument'),
    path('get_dokument_data/', views.get_dokument_data, name='get_dokument_data'),
    path('refresh_fizlitso_table/', views.refresh_fizlitso_table, name='refresh_fizlitso_table'),
    path('save_fizicheskoe_litso/', views.save_fizicheskoe_litso, name='save_fizicheskoe_litso'),
    path('get_fizlitso_data/', views.get_fizlitso_data, name='get_fizlitso_data'),
    path('update_fizlitso/', views.update_fizlitso, name='update_fizlitso'),
    path('refresh_lichnoe_delo_table/', views.refresh_lichnoe_delo_table, name='refresh_lichnoe_delo_table'),
    path('save_lichnoe_delo/', views.save_lichnoe_delo, name='save_lichnoe_delo'),
    path('get_lichnoe_delo_data/', views.get_lichnoe_delo_data, name='get_lichnoe_delo_data'),
    path('update_lichnoe_delo/', views.update_lichnoe_delo, name='update_lichnoe_delo'),
    path('zachislenie/get-available-groups/', views.get_available_groups, name='get_available_groups'),
    path('zachislenie/get-group-details/<int:pk>/', views.get_group_details, name='get_group_details'),
    path('zachislenie/get-group-details/', views.get_group_details, name='get_group_details'),
    path('zachislenie/get-prikaz/<int:pk>/', views.get_prikaz, name='get_prikaz'),
    path('zachislenie/get-group-details/', views.get_group_details, name='get_group_details'),
    path('zachislenie/get-group-details/<int:pk>/', views.get_group_details, name='get_group_details_with_pk'),
    path('zachislenie/generate-prikaz/<int:pk>/', views.generate_prikaz, name='generate_prikaz'),
    path('create-konkursnaya-gruppa/', views.create_konkursnaya_gruppa, name='create_konkursnaya_gruppa'),
    path('refresh_konkursnye_gruppy/', views.refresh_konkursnye_gruppy, name='refresh_konkursnye_gruppy'),
]