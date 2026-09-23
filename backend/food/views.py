from rest_framework import viewsets, filters
from django_filters.rest_framework import DjangoFilterBackend

from core.mixins import TenantQuerysetMixin, TenantAssignMixin
from core.permissions import IsAdminOrManagerOrReadOnly, IsTenantOwner, IsMarriageHallApp
from .models import FoodMenu
from .serializers import FoodMenuSerializer


class FoodMenuViewSet(TenantQuerysetMixin, TenantAssignMixin, viewsets.ModelViewSet):
    queryset = FoodMenu.objects.all().order_by('display_order', 'name')
    serializer_class = FoodMenuSerializer
    permission_classes = [IsMarriageHallApp, IsAdminOrManagerOrReadOnly, IsTenantOwner]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['category', 'is_active']
    search_fields = ['name', 'description']
    ordering_fields = ['name', 'price_per_menu', 'display_order', 'created_at', 'category']
