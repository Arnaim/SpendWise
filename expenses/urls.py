from django.urls import path
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('transactions/', views.transactions, name='transactions'),
    path('reports/', views.reports, name='reports'),
    path('settings/', views.settings_view, name='settings'),
    path('add/', views.add_expense, name='add_expense'),
    path('edit/<int:pk>/', views.edit_expense, name='edit_expense'),
    path('delete/<int:pk>/', views.delete_expense, name='delete_expense'),
    path('login/', views.login_view, name='login'),
    path('register/', views.register_view, name='register'),
]