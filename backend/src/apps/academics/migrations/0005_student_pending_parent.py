from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("academics", "0004_alter_assistrequest_id_alter_classbroadcast_id_and_more"),
    ]

    operations = [
        migrations.AddField(
            model_name="student",
            name="pending_parent_phone",
            field=models.CharField(blank=True, default="", max_length=20),
        ),
        migrations.AddField(
            model_name="student",
            name="pending_parent_name",
            field=models.CharField(blank=True, default="", max_length=255),
        ),
    ]
