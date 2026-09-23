from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import models

from core.models import Tenant

PAY_TYPE_MONTHLY = 'MONTHLY'
PAY_TYPE_DAILY = 'DAILY'
PAY_TYPE_CHOICES = (
    (PAY_TYPE_MONTHLY, 'Monthly salary'),
    (PAY_TYPE_DAILY, 'Daily wage'),
)

DEPARTMENT_CHOICES = (
    ('KITCHEN', 'Kitchen'),
    ('SECURITY', 'Security'),
    ('CLEANING', 'Cleaning'),
    ('SETUP', 'Setup / Events'),
    ('RECEPTION', 'Reception'),
    ('MAINTENANCE', 'Maintenance'),
    ('OTHER', 'Other'),
)

ADVANCE_PENDING = 'PENDING'
ADVANCE_REPAID = 'REPAID'
ADVANCE_DEDUCTED = 'DEDUCTED'
ADVANCE_STATUS_CHOICES = (
    (ADVANCE_PENDING, 'Pending recovery'),
    (ADVANCE_REPAID, 'Repaid'),
    (ADVANCE_DEDUCTED, 'Deducted from salary'),
)

WAGE_DRAFT = 'DRAFT'
WAGE_PAID = 'PAID'
WAGE_STATUS_CHOICES = (
    (WAGE_DRAFT, 'Draft'),
    (WAGE_PAID, 'Paid'),
)


class LaborWorker(models.Model):
    """Daily/monthly labor without requiring a system login."""

    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='labor_workers')
    full_name = models.CharField(max_length=120)
    phone = models.CharField(max_length=20, blank=True, default='')
    cnic = models.CharField(max_length=20, blank=True, default='')
    pay_type = models.CharField(max_length=10, choices=PAY_TYPE_CHOICES, default=PAY_TYPE_DAILY)
    monthly_salary = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    daily_rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    department = models.CharField(max_length=20, choices=DEPARTMENT_CHOICES, default='OTHER')
    designation = models.CharField(max_length=80, blank=True, default='')
    is_active = models.BooleanField(default=True)
    joining_date = models.DateField(null=True, blank=True)
    notes = models.TextField(blank=True, default='')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['full_name', 'id']

    def __str__(self):
        return self.full_name


class SalaryAdvance(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='salary_advances')
    staff_profile = models.ForeignKey(
        'authentication.StaffProfile',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='salary_advances',
    )
    labor_worker = models.ForeignKey(
        LaborWorker,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='salary_advances',
    )
    amount = models.DecimalField(max_digits=12, decimal_places=2)
    advance_date = models.DateField()
    reason = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=10, choices=ADVANCE_STATUS_CHOICES, default=ADVANCE_PENDING)
    repaid_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recorded_salary_advances',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-advance_date', '-id']

    @property
    def balance(self):
        return max(Decimal('0'), self.amount - (self.repaid_amount or Decimal('0')))

    def clean(self):
        if bool(self.staff_profile_id) == bool(self.labor_worker_id):
            raise ValidationError('Select either a staff employee or a labor worker.')

    def save(self, *args, **kwargs):
        self.full_clean()
        if self.repaid_amount >= self.amount and self.status == ADVANCE_PENDING:
            self.status = ADVANCE_REPAID
        super().save(*args, **kwargs)


class DailyWageEntry(models.Model):
    tenant = models.ForeignKey(Tenant, on_delete=models.CASCADE, related_name='daily_wage_entries')
    staff_profile = models.ForeignKey(
        'authentication.StaffProfile',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='daily_wage_entries',
    )
    labor_worker = models.ForeignKey(
        LaborWorker,
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='daily_wage_entries',
    )
    work_date = models.DateField()
    days = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal('1'))
    daily_rate = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    notes = models.CharField(max_length=255, blank=True, default='')
    status = models.CharField(max_length=10, choices=WAGE_STATUS_CHOICES, default=WAGE_DRAFT)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='recorded_daily_wages',
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-work_date', '-id']

    def clean(self):
        if bool(self.staff_profile_id) == bool(self.labor_worker_id):
            raise ValidationError('Select either a staff employee or a labor worker.')
        if self.days <= 0:
            raise ValidationError('Days must be greater than zero.')

    def save(self, *args, **kwargs):
        self.amount = (self.days or Decimal('0')) * (self.daily_rate or Decimal('0'))
        self.full_clean()
        super().save(*args, **kwargs)
