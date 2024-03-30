from django.urls import path
from . import views
from django.views.generic import TemplateView

app_name = 'G863'
urlpatterns = [
            path('test', views.test, name='test'),
            path('', views.index, name='G863'),
            path('lesson2', views.lesson2, name='lesson2'),
            path('lesson3<str:suffix>', views.lesson3, name='lesson3'),
            path('lesson4', views.lesson4, name='lesson4'),
            path('lesson5', views.lesson5, name='lesson5'),
            path('lesson6', views.lesson6, name='lesson6'),
            path('lesson7', views.lesson7, name='lesson7'),
            path('final', views.final, name='final')
            ]

