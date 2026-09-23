from django.contrib import admin

from core.admin_mixins import TenantScopedAdminMixin

from .models import FoodMenu


@admin.register(FoodMenu)
class FoodMenuAdmin(TenantScopedAdminMixin, admin.ModelAdmin):
    list_display = ('name', 'category', 'price_per_menu', 'is_active', 'tenant', 'display_order')
    list_filter = ('category', 'is_active', 'tenant')
    search_fields = ('name', 'description')
