from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('bookings', '0020_booking_slot_blank_choice'),
        ('food', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='booking',
            name='food_charge',
            field=models.DecimalField(decimal_places=2, default=0, max_digits=12),
        ),
        migrations.AddField(
            model_name='booking',
            name='food_menu',
            field=models.ForeignKey(
                blank=True,
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                related_name='bookings',
                to='food.foodmenu',
            ),
        ),
    ]
