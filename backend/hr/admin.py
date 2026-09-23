from django.contrib import admin

from .models import DailyWageEntry, LaborWorker, SalaryAdvance


@admin.register(LaborWorker)
class LaborWorkerAdmin(admin.ModelAdmin):
    list_display = ('full_name', 'pay_type', 'department', 'daily_rate', 'monthly_salary', 'is_active', 'tenant')
    list_filter = ('pay_type', 'department', 'is_active', 'tenant')


@admin.register(SalaryAdvance)
class SalaryAdvanceAdmin(admin.ModelAdmin):
    list_display = ('advance_date', 'amount', 'status', 'repaid_amount', 'tenant')
    list_filter = ('status', 'tenant')


@admin.register(DailyWageEntry)
class DailyWageEntryAdmin(admin.ModelAdmin):
    list_display = ('work_date', 'days', 'daily_rate', 'amount', 'status', 'tenant')
    list_filter = ('status', 'tenant')
