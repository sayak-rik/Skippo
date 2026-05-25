from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0008_google_auth_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='teacherprofile',
            name='google_sub',
            field=models.CharField(blank=True, max_length=128, null=True, unique=True),
        ),
        migrations.AlterField(
            model_name='otprequest',
            name='role',
            field=models.CharField(
                choices=[
                    ('parent', 'Parent'),
                    ('driver', 'Driver'),
                    ('teacher', 'Teacher'),
                    ('admin', 'Admin'),
                ],
                max_length=16,
            ),
        ),
    ]
