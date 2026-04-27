from django.contrib import admin

from apps.tenancy.models import RegistrationInterest, School, SchoolDomain, TenantConfig


@admin.register(RegistrationInterest)
class RegistrationInterestAdmin(admin.ModelAdmin):
    list_display  = ("name", "email", "school_name", "enquiry_type", "status", "created_at")
    list_filter   = ("status", "enquiry_type")
    search_fields = ("name", "email", "school_name")
    readonly_fields = ("created_at", "updated_at")
    ordering      = ("-created_at",)
    list_editable = ("status",)


@admin.register(School)
class SchoolAdmin(admin.ModelAdmin):
    list_display  = ("name", "slug", "is_active", "created_at")
    search_fields = ("name", "slug")
    ordering      = ("-created_at",)


admin.site.register(SchoolDomain)
admin.site.register(TenantConfig)
