from decimal import Decimal

from django.db.models import Sum
from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView

from authentication.models import StaffProfile
from core.mixins import TenantAssignMixin, TenantQuerysetMixin
from core.permissions import IsAdminOrManagerWriteStaffRead, IsTenantOwner
from core.roles import ROLE_ADMIN, ROLE_HR, user_role
from .models import (
    ADVANCE_PENDING,
    PAY_TYPE_DAILY,
    PAY_TYPE_MONTHLY,
    DailyWageEntry,
    LaborWorker,
    SalaryAdvance,
    WAGE_PAID,
)
from .serializers import (
    DailyWageEntrySerializer,
    LaborWorkerSerializer,
    SalaryAdvanceSerializer,
    StaffProfileOptionSerializer,
)


class HrPortalMixin(TenantQuerysetMixin, TenantAssignMixin):
    permission_classes = [IsAdminOrManagerWriteStaffRead, IsTenantOwner]

    def perform_create(self, serializer):
        user = self.request.user
        extra = {'tenant': user.tenant} if user.tenant_id else {}
        if hasattr(serializer.Meta.model, 'created_by'):
            extra['created_by'] = user
        serializer.save(**extra)


class LaborWorkerViewSet(HrPortalMixin, viewsets.ModelViewSet):
    queryset = LaborWorker.objects.all()
    serializer_class = LaborWorkerSerializer


class SalaryAdvanceViewSet(HrPortalMixin, viewsets.ModelViewSet):
    queryset = SalaryAdvance.objects.select_related(
        'staff_profile__user', 'labor_worker',
    ).all()
    serializer_class = SalaryAdvanceSerializer


class DailyWageEntryViewSet(HrPortalMixin, viewsets.ModelViewSet):
    queryset = DailyWageEntry.objects.select_related(
        'staff_profile__user', 'labor_worker',
    ).all()
    serializer_class = DailyWageEntrySerializer

    def get_queryset(self):
        qs = super().get_queryset()
        work_date = self.request.query_params.get('work_date')
        if work_date:
            qs = qs.filter(work_date=work_date)
        status = self.request.query_params.get('status')
        if status:
            qs = qs.filter(status=status.upper())
        return qs


class HrSummaryView(APIView):
    permission_classes = [IsAdminOrManagerWriteStaffRead]

    def get(self, request):
        tenant = request.user.tenant
        if not tenant:
            return Response({'detail': 'No tenant.'}, status=400)

        staff_profiles = StaffProfile.objects.filter(tenant=tenant).select_related('user')
        labor_workers = LaborWorker.objects.filter(tenant=tenant, is_active=True)
        advances = SalaryAdvance.objects.filter(tenant=tenant)
        daily_wages = DailyWageEntry.objects.filter(tenant=tenant)

        monthly_staff = staff_profiles.filter(pay_type=PAY_TYPE_MONTHLY, status=True)
        daily_staff = staff_profiles.filter(pay_type=PAY_TYPE_DAILY, status=True)

        monthly_payroll = monthly_staff.aggregate(total=Sum('salary'))['total'] or Decimal('0')
        daily_labor_count = labor_workers.filter(pay_type=PAY_TYPE_DAILY).count() + daily_staff.count()
        pending_advance_total = sum(
            a.balance for a in advances.filter(status=ADVANCE_PENDING)
        )

        today_wages = daily_wages.filter(status=WAGE_PAID).aggregate(total=Sum('amount'))['total'] or Decimal('0')
        month_wages = daily_wages.filter(status=WAGE_PAID).aggregate(total=Sum('amount'))['total'] or Decimal('0')

        return Response({
            'employee_count': staff_profiles.filter(status=True).count(),
            'labor_count': labor_workers.count(),
            'monthly_payroll': monthly_payroll,
            'daily_labor_count': daily_labor_count,
            'pending_advances': pending_advance_total,
            'paid_daily_wages_total': month_wages,
            'can_write': user_role(request.user) in (ROLE_ADMIN, ROLE_HR),
        })


class HrWorkerOptionsView(APIView):
    """Staff + labor dropdown options for advances and daily wages."""

    permission_classes = [IsAdminOrManagerWriteStaffRead]

    def get(self, request):
        tenant = request.user.tenant
        if not tenant:
            return Response({'staff': [], 'labor': []})

        staff = StaffProfileOptionSerializer(
            StaffProfile.objects.filter(tenant=tenant, status=True).select_related('user'),
            many=True,
        ).data
        labor = LaborWorkerSerializer(
            LaborWorker.objects.filter(tenant=tenant, is_active=True),
            many=True,
        ).data
        return Response({'staff': staff, 'labor': labor})
