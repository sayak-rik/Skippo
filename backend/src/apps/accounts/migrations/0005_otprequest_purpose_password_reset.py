from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("accounts", "0004_otprequest_role_admin"),
    ]

    operations = [
        migrations.AlterField(
            model_name="otprequest",
            name="purpose",
            field=models.CharField(
                choices=[
                    ("login", "Login"),
                    ("confirm_action", "Confirm Action"),
                    ("password_reset", "Password Reset"),
                ],
                default="login",
                max_length=20,
            ),
        ),
    ]
