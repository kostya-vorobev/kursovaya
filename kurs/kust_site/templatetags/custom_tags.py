from django import template
from django.db.models import ForeignKey

register = template.Library()


@register.simple_tag
def get_attr(obj, attr_name):
    value = getattr(obj, attr_name, "")
    if value is None:
        return ""
    
    # Проверяем, является ли значение экземпляром ForeignKey
    if hasattr(value, '__str__'):
        return str(value)  # Возвращаем строковое представление объекта
    return value

@register.filter
def get_foreign_value(obj, field_name):
    return getattr(obj, field_name).__str__() if getattr(obj, field_name) else ''

@register.filter
def get_field_value(obj, field_name):
    return getattr(obj, field_name).__str__() if getattr(obj, field_name) else ''

@register.filter(name='add_class')
def add_class(field, css_class):
    return field.as_widget(attrs={'class': css_class})

@register.filter(name='addclass')
def addclass(field, css_class):
    return field.as_widget(attrs={"class": css_class})