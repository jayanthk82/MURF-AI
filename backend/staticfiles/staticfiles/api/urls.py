from django.contrib import admin

from django.urls import path
from .views import ProcessQueryView

urlpatterns = [
    path('process-query/', ProcessQueryView.as_view(), name='process-query'),
]