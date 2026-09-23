from django.db import models
from core.models import Tenant


class FoodMenu(models.Model):
    """Sellable food menu package for hall event quotations."""

    CATEGORY_CHOICES = [
        ('STANDARD', 'Standard'),
        ('PREMIUM', 'Premium'),
        ('ROYAL', 'Royal'),
        ('CUSTOM', 'Custom quote'),
    ]

    tenant = models.ForeignKey(
        Tenant,
        on_delete=models.CASCADE,
        related_name='food_menus',
        null=True,
        blank=True,
    )
    name = models.CharField(max_length=200, help_text='Food menu name for quotations')
    category = models.CharField(max_length=20, choices=CATEGORY_CHOICES, default='STANDARD')
    description = models.TextField(blank=True)
    menu_items = models.JSONField(
        default=list,
        help_text='Dishes included in this menu, e.g. Chicken Karahi, Biryani',
    )
    price_per_menu = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        default=0,
        help_text='Price charged per menu / per head package',
    )
    is_active = models.BooleanField(default=True)
    display_order = models.PositiveSmallIntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['display_order', 'name']
        constraints = [
            models.UniqueConstraint(
                fields=['tenant', 'name'],
                name='food_menu_unique_name_per_tenant',
            ),
        ]
        verbose_name = 'Food menu'
        verbose_name_plural = 'Food menus'

    def __str__(self):
        return f'{self.name} ({self.price_per_menu})'
