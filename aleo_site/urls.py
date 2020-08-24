from django.urls import path
from . import views

urlpatterns = [
    path("", views.homepage, name="homepage"),
    path("form", views.form, name="form"),
    path("analyze", views.analyze, name="analyze"),
    path("submission", views.submission, name="submission"),
]
