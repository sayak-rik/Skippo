from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("tenancy", "0001_initial"),
    ]

    operations = [
        migrations.AddField(
            model_name="tenantconfig",
            name="ai_tokens_per_teacher_per_day",
            field=models.PositiveSmallIntegerField(default=5),
        ),
    ]
