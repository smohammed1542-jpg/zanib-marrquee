from django.urls import path, include
from rest_framework.routers import DefaultRouter

from .views import (
    DailyWageEntryViewSet,
    HrSummaryView,
    HrWorkerOptionsView,
    LaborWorkerViewSet,
    SalaryAdvanceViewSet,
)

router = DefaultRouter()
router.register(r'labor', LaborWorkerViewSet, basename='hr-labor')
router.register(r'advances', SalaryAdvanceViewSet, basename='hr-advances')
router.register(r'daily-wages', DailyWageEntryViewSet, basename='hr-daily-wages')

urlpatterns = [
    path('summary/', HrSummaryView.as_view(), name='hr-summary'),
    path('worker-options/', HrWorkerOptionsView.as_view(), name='hr-worker-options'),
    path('', include(router.urls)),
]
