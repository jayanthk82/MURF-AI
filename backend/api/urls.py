from django.contrib import admin  #type: ignore
from django.views.decorators.csrf import csrf_exempt
from django.urls import path  #type: ignore
from .views import ProcessQueryView

urlpatterns = [
    path('process/', csrf_exempt(ProcessQueryView.as_view()), name='process-query'),
]