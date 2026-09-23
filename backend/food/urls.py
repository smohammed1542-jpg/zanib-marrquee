from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import FoodMenuViewSet

router = DefaultRouter()
router.register(r'menus', FoodMenuViewSet, basename='food-menu')

urlpatterns = [
    path('', include(router.urls)),
]
