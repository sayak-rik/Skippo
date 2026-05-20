from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0003_alter_devicesession_id_alter_driverinvitation_id_and_more"),
    ]

    operations = [
        migrations.AlterField(
            model_name="otprequest",
            name="role",
            field=models.CharField(
                choices=[("parent", "Parent"), ("driver", "Driver"), ("admin", "Admin")],
                max_length=16,
            ),
        ),
    ]
