from django.db import migrations, models


def migrate_staff_to_manager(apps, schema_editor):
    User = apps.get_model('authentication', 'User')
    User.objects.filter(role='STAFF').update(role='MANAGER')


class Migration(migrations.Migration):

    dependencies = [
        ('authentication', '0005_alter_user_username'),
    ]

    operations = [
        migrations.RunPython(migrate_staff_to_manager, migrations.RunPython.noop),
        migrations.AlterField(
            model_name='user',
            name='role',
            field=models.CharField(
                choices=[('ADMIN', 'Admin'), ('MANAGER', 'Manage'), ('HR', 'HR')],
                default='MANAGER',
                max_length=20,
            ),
        ),
    ]
