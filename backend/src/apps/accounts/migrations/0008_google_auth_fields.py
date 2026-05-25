from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('accounts', '0007_teacherleave_substituteassignment'),
    ]

    operations = [
        migrations.AddField(
            model_name='platformuser',
            name='is_email_verified',
            field=models.BooleanField(default=False),
        ),
        migrations.AddField(
            model_name='parentprofile',
            name='google_sub',
            field=models.CharField(blank=True, max_length=128, null=True, unique=True),
        ),
    ]
