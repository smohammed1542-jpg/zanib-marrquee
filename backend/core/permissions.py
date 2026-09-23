from rest_framework import permissions

from core.roles import (
    ALL_ROLES,
    MANAGE_ROLES,
    OPERATE_ROLES,
    ROLE_ADMIN,
    STAFF_READ_ROLES,
    STAFF_WRITE_ROLES,
    user_role,
)

MARRIAGE_HALL_APP = 'MARRIAGE_HALL'
GUEST_HOUSE_APP = 'GUEST_HOUSE'


def _user_app_type(user):
    return getattr(user, 'app_type', MARRIAGE_HALL_APP) or MARRIAGE_HALL_APP


class IsMarriageHallApp(permissions.BasePermission):
    """Only Marriage Hall users (superuser bypasses)."""

    message = 'This account is for Guest House. Use the Guest House login.'

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return _user_app_type(request.user) == MARRIAGE_HALL_APP


class IsGuestHouseApp(permissions.BasePermission):
    """Only Guest House users (superuser bypasses)."""

    message = 'This account is for Marriage Hall. Use the Marriage Hall login.'

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return _user_app_type(request.user) == GUEST_HOUSE_APP


class IsTenantOwner(permissions.BasePermission):
    """Object must belong to the user's tenant."""

    def has_object_permission(self, request, view, obj):
        if request.user.is_superuser and not request.user.tenant_id:
            return True
        tenant = getattr(obj, 'tenant', None)
        if tenant is None:
            booking = getattr(obj, 'booking', None)
            if booking is not None:
                tenant = getattr(booking, 'tenant', None)
        if tenant is None:
            return False
        obj_tenant_id = tenant.id if hasattr(tenant, 'id') else tenant
        return obj_tenant_id == request.user.tenant_id


class IsAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_superuser or user_role(request.user) == ROLE_ADMIN
        )


class IsAdminOrManager(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return user_role(request.user) in MANAGE_ROLES


class IsAdminOrManagerOrReadOnly(permissions.BasePermission):
    """ADMIN/MANAGER: full access. HR denied."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        role = user_role(request.user)
        if request.method in permissions.SAFE_METHODS:
            return role in OPERATE_ROLES
        return role in MANAGE_ROLES


class IsAdminOrManagerOrStaffWrite(permissions.BasePermission):
    """ADMIN/MANAGER: full operational access."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return user_role(request.user) in OPERATE_ROLES


class IsAdminWriteOperateRead(permissions.BasePermission):
    """ADMIN may change setup data. ADMIN and MANAGER may read it. HR denied."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        role = user_role(request.user)
        if request.method in permissions.SAFE_METHODS:
            return role in OPERATE_ROLES
        return role == ROLE_ADMIN


class IsAdminOnly(permissions.BasePermission):
    """Only ADMIN (and superuser) may access."""

    def has_permission(self, request, view):
        return request.user.is_authenticated and (
            request.user.is_superuser or user_role(request.user) == ROLE_ADMIN
        )


class IsAdminOrHr(permissions.BasePermission):
    """Admin and HR (staff write / password reset)."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return user_role(request.user) in STAFF_WRITE_ROLES


class IsAdminOrManagerWriteStaffRead(permissions.BasePermission):
    """Staff management: ADMIN and HR only. MANAGER has no employee access."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        role = user_role(request.user)
        if request.method in permissions.SAFE_METHODS:
            return role in STAFF_READ_ROLES
        return role in STAFF_WRITE_ROLES


class IsAdminOrManagerNoStaff(permissions.BasePermission):
    """Expenses etc.: ADMIN/MANAGER only; HR denied."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return user_role(request.user) in MANAGE_ROLES


class IsGhStaffOrAbove(permissions.BasePermission):
    """Guest House front-desk actions: ADMIN and MANAGER."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        return user_role(request.user) in OPERATE_ROLES


class IsCustomerWritable(permissions.BasePermission):
    """Customers: ADMIN/MANAGER full; HR denied."""

    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.is_superuser:
            return True
        role = user_role(request.user)
        if request.method in permissions.SAFE_METHODS:
            return role in OPERATE_ROLES
        if request.method == 'DELETE':
            return role in MANAGE_ROLES
        if role in MANAGE_ROLES:
            return True
        return role in OPERATE_ROLES and _user_app_type(request.user) in (GUEST_HOUSE_APP, MARRIAGE_HALL_APP)
