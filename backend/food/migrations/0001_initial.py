from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('core', '0012_usersettings_show_hijri_date'),
    ]

    operations = [
        migrations.CreateModel(
            name='FoodMenu',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('name', models.CharField(help_text='Food menu name for quotations', max_length=200)),
                ('category', models.CharField(choices=[('STANDARD', 'Standard'), ('PREMIUM', 'Premium'), ('ROYAL', 'Royal'), ('CUSTOM', 'Custom quote')], default='STANDARD', max_length=20)),
                ('description', models.TextField(blank=True)),
                ('menu_items', models.JSONField(default=list, help_text='Dishes included in this menu, e.g. Chicken Karahi, Biryani')),
                ('price_per_menu', models.DecimalField(decimal_places=2, default=0, help_text='Price charged per menu / per head package', max_digits=12)),
                ('is_active', models.BooleanField(default=True)),
                ('display_order', models.PositiveSmallIntegerField(default=0)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('tenant', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='food_menus', to='core.tenant')),
            ],
            options={
                'verbose_name': 'Food menu',
                'verbose_name_plural': 'Food menus',
                'ordering': ['display_order', 'name'],
            },
        ),
        migrations.AddConstraint(
            model_name='foodmenu',
            constraint=models.UniqueConstraint(fields=('tenant', 'name'), name='food_menu_unique_name_per_tenant'),
        ),
    ]
