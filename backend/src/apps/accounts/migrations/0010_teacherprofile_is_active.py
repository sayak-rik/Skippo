from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0009_teacher_google_auth"),
    ]

    operations = [
        migrations.AddField(
            model_name="teacherprofile",
            name="is_active",
            field=models.BooleanField(default=True),
        ),
    ]
