from rest_framework import serializers

from authentication.models import StaffProfile
from .models import DailyWageEntry, LaborWorker, SalaryAdvance


class LaborWorkerSerializer(serializers.ModelSerializer):
    class Meta:
        model = LaborWorker
        fields = [
            'id', 'full_name', 'phone', 'cnic', 'pay_type', 'monthly_salary', 'daily_rate',
            'department', 'designation', 'is_active', 'joining_date', 'notes',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SalaryAdvanceSerializer(serializers.ModelSerializer):
    worker_name = serializers.SerializerMethodField()
    worker_type = serializers.SerializerMethodField()
    balance = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = SalaryAdvance
        fields = [
            'id', 'staff_profile', 'labor_worker', 'worker_name', 'worker_type',
            'amount', 'advance_date', 'reason', 'status', 'repaid_amount', 'balance',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'balance', 'created_at', 'updated_at']

    def get_worker_name(self, obj):
        if obj.staff_profile_id:
            user = obj.staff_profile.user
            name = f'{user.first_name or ""} {user.last_name or ""}'.strip()
            return name or user.username
        if obj.labor_worker_id:
            return obj.labor_worker.full_name
        return ''

    def get_worker_type(self, obj):
        if obj.staff_profile_id:
            return 'staff'
        if obj.labor_worker_id:
            return 'labor'
        return ''

    def validate(self, attrs):
        staff_profile = attrs.get('staff_profile', getattr(self.instance, 'staff_profile', None))
        labor_worker = attrs.get('labor_worker', getattr(self.instance, 'labor_worker', None))
        if bool(staff_profile) == bool(labor_worker):
            raise serializers.ValidationError('Select either a staff employee or a labor worker.')
        repaid = attrs.get('repaid_amount', getattr(self.instance, 'repaid_amount', 0) or 0)
        amount = attrs.get('amount', getattr(self.instance, 'amount', 0) or 0)
        if repaid > amount:
            raise serializers.ValidationError({'repaid_amount': 'Repaid amount cannot exceed advance amount.'})
        return attrs


class DailyWageEntrySerializer(serializers.ModelSerializer):
    worker_name = serializers.SerializerMethodField()
    worker_type = serializers.SerializerMethodField()

    class Meta:
        model = DailyWageEntry
        fields = [
            'id', 'staff_profile', 'labor_worker', 'worker_name', 'worker_type',
            'work_date', 'days', 'daily_rate', 'amount', 'notes', 'status',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'amount', 'created_at', 'updated_at']

    def get_worker_name(self, obj):
        if obj.staff_profile_id:
            user = obj.staff_profile.user
            name = f'{user.first_name or ""} {user.last_name or ""}'.strip()
            return name or user.username
        if obj.labor_worker_id:
            return obj.labor_worker.full_name
        return ''

    def get_worker_type(self, obj):
        if obj.staff_profile_id:
            return 'staff'
        if obj.labor_worker_id:
            return 'labor'
        return ''


class StaffProfileOptionSerializer(serializers.ModelSerializer):
    label = serializers.SerializerMethodField()
    pay_type = serializers.CharField(read_only=True)
    daily_rate = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    monthly_salary = serializers.DecimalField(source='salary', max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = StaffProfile
        fields = ['id', 'label', 'pay_type', 'daily_rate', 'monthly_salary']

    def get_label(self, obj):
        user = obj.user
        name = f'{user.first_name or ""} {user.last_name or ""}'.strip()
        return name or user.username
