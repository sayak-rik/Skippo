from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from apps.accounts.views import (
    AcceptDriverInviteView,
    AcceptInviteView,
    AccountsRootView,
    TeacherGoogleAuthView,
    TeacherGoogleLinkAccountView,
    TeacherPhoneLookupView,
    AdminDriverDetailView,
    AdminDriverListView,
    AdminDriverSignupRequestListView,
    AdminDriverSignupRequestReviewView,
    AdminDriverStudentsView,
    AdminLeaveActionItemsView,
    AdminLoginView,
    AdminPermissionListView,
    AdminRoleAssignView,
    AdminRoleDetailView,
    AdminRoleListView,
    AdminSubstituteAssignView,
    AdminTeacherDetailView,
    AdminTeacherInviteListView,
    AdminTeacherInviteRevokeView,
    AdminTeacherLeaveDetailView,
    AdminTeacherLeaveListView,
    AdminTeacherListView,
    AdminUserRoleListView,
    CreateTeacherInviteView,
    DriverApprovalStatusView,
    DriverSelfSignupView,
    MeView,
    OTPRequestView,
    OTPVerifyView,
    ParentAddStudentView,
    ParentChangeEmailConfirmView,
    ParentChangeEmailRequestView,
    ParentChangePhoneConfirmView,
    ParentChangePhoneRequestView,
    ParentClassroomListView,
    ParentCompleteProfileView,
    ParentGoogleAuthView,
    ParentGoogleLinkAccountView,
    ParentPhoneLookupView,
    ParentProfileView,
    ParentSchoolListView,
    ParentSchoolNotFoundView,
    ParentSignupCheckView,
    ParentSignupCompleteView,
    ParentStudentDiscoveryView,
    PasswordResetConfirmView,
    PasswordResetRequestView,
    ValidateDriverInviteView,
    ValidateInviteView,
)

urlpatterns = [
    # Module health
    path("", AccountsRootView.as_view(), name="accounts-root"),

    # Staff / superuser login (email + password → JWT)
    path("admin/login/", AdminLoginView.as_view(), name="accounts-admin-login"),

    # Authenticated user info
    path("me/", MeView.as_view(), name="accounts-me"),

    # Teacher invite flow
    path("teacher/invite/<str:token>/", ValidateInviteView.as_view(), name="accounts-validate-invite"),
    path("teacher/accept-invite/",      AcceptInviteView.as_view(),   name="accounts-accept-invite"),

    # Teacher phone lookup + Google Sign-In
    path("teacher/lookup/",              TeacherPhoneLookupView.as_view(),       name="accounts-teacher-lookup"),
    path("teacher/google/",              TeacherGoogleAuthView.as_view(),        name="accounts-teacher-google-auth"),
    path("teacher/google/link-account/", TeacherGoogleLinkAccountView.as_view(), name="accounts-teacher-google-link"),

    # Driver invite flow (req 6) — invited drivers bypass approval queue
    path("driver/invite/<str:token>/", ValidateDriverInviteView.as_view(), name="accounts-validate-driver-invite"),
    path("driver/accept-invite/",      AcceptDriverInviteView.as_view(),   name="accounts-accept-driver-invite"),

    # Driver self-signup (req 6) — no invite; waits for admin approval
    path("driver/signup/",          DriverSelfSignupView.as_view(),    name="accounts-driver-signup"),
    path("driver/approval-status/", DriverApprovalStatusView.as_view(), name="accounts-driver-approval-status"),

    # OTP login (parent & driver)
    path("otp/request/", OTPRequestView.as_view(), name="accounts-otp-request"),
    path("otp/verify/",  OTPVerifyView.as_view(),  name="accounts-otp-verify"),

    # Parent phone-number lookup (determines login vs signup before OTP is sent)
    path("parent/lookup/",           ParentPhoneLookupView.as_view(),    name="accounts-parent-lookup"),
    # Update name for parent with an incomplete profile after first login
    path("parent/complete-profile/", ParentCompleteProfileView.as_view(), name="accounts-parent-complete-profile"),

    # Parent self-service profile management (authenticated)
    path("parent/profile/",                 ParentProfileView.as_view(),             name="accounts-parent-profile"),
    path("parent/add-student/",             ParentAddStudentView.as_view(),          name="accounts-parent-add-student"),
    path("parent/change-phone/request/",    ParentChangePhoneRequestView.as_view(),  name="accounts-parent-change-phone-request"),
    path("parent/change-phone/confirm/",    ParentChangePhoneConfirmView.as_view(),  name="accounts-parent-change-phone-confirm"),
    path("parent/change-email/request/",    ParentChangeEmailRequestView.as_view(),  name="accounts-parent-change-email-request"),
    path("parent/change-email/confirm/",    ParentChangeEmailConfirmView.as_view(),  name="accounts-parent-change-email-confirm"),

    # Google Sign-In for parents
    path("parent/google/",              ParentGoogleAuthView.as_view(),        name="accounts-parent-google-auth"),
    path("parent/google/link-account/", ParentGoogleLinkAccountView.as_view(), name="accounts-parent-google-link"),

    # New-parent discovery signup flow (cascading dropdowns → student claim / migration)
    path("parent/schools/",              ParentSchoolListView.as_view(),        name="accounts-parent-schools"),
    path("parent/classrooms/",           ParentClassroomListView.as_view(),     name="accounts-parent-classrooms"),
    path("parent/discovery-students/",   ParentStudentDiscoveryView.as_view(),  name="accounts-parent-discovery-students"),
    path("parent/signup/check/",         ParentSignupCheckView.as_view(),       name="accounts-parent-signup-check"),
    path("parent/signup/complete/",      ParentSignupCompleteView.as_view(),    name="accounts-parent-signup-complete"),
    path("parent/school-not-found/",     ParentSchoolNotFoundView.as_view(),    name="accounts-parent-school-not-found"),

    # JWT token refresh
    path("token/refresh/", TokenRefreshView.as_view(), name="accounts-token-refresh"),

    # Password reset (admin dashboard)
    path("password/reset-request/", PasswordResetRequestView.as_view(), name="accounts-password-reset-request"),
    path("password/reset-confirm/", PasswordResetConfirmView.as_view(), name="accounts-password-reset-confirm"),

    # Admin teacher management
    path("admin/teachers/",                                          AdminTeacherListView.as_view(),          name="accounts-admin-teachers"),
    path("admin/teachers/invite/",                                   CreateTeacherInviteView.as_view(),       name="accounts-admin-teacher-invite"),
    path("admin/teachers/invitations/",                              AdminTeacherInviteListView.as_view(),    name="accounts-admin-teacher-invitations"),
    path("admin/teachers/invitations/<int:invite_id>/",              AdminTeacherInviteRevokeView.as_view(),  name="accounts-admin-teacher-invite-revoke"),
    path("admin/teachers/<int:teacher_id>/",                         AdminTeacherDetailView.as_view(),        name="auth-admin-teacher-detail"),
    path("admin/teachers/<int:teacher_id>/leaves/",                  AdminTeacherLeaveListView.as_view(),  name="auth-admin-teacher-leaves"),
    path("admin/teachers/<int:teacher_id>/leaves/<int:leave_id>/",   AdminTeacherLeaveDetailView.as_view(), name="auth-admin-teacher-leave-detail"),
    path("admin/leaves/action-items/",                               AdminLeaveActionItemsView.as_view(),  name="auth-admin-leave-action-items"),
    path("admin/leaves/<int:leave_id>/substitutes/",                 AdminSubstituteAssignView.as_view(),  name="auth-admin-substitute-assign"),

    # Admin driver management
    path("admin/drivers/",                                        AdminDriverListView.as_view(),                  name="accounts-admin-drivers"),
    path("admin/drivers/<int:driver_id>/",                        AdminDriverDetailView.as_view(),                name="accounts-admin-driver-detail"),
    path("admin/drivers/<int:driver_id>/students/",               AdminDriverStudentsView.as_view(),              name="accounts-admin-driver-students"),
    path("admin/driver-requests/",                                AdminDriverSignupRequestListView.as_view(),     name="accounts-admin-driver-requests"),
    path("admin/driver-requests/<int:request_id>/review/",        AdminDriverSignupRequestReviewView.as_view(),   name="accounts-admin-driver-request-review"),

    # Admin — RBAC: roles & permissions
    path("admin/permissions/",                              AdminPermissionListView.as_view(), name="accounts-admin-permissions"),
    path("admin/roles/",                                    AdminRoleListView.as_view(),       name="accounts-admin-roles"),
    path("admin/roles/<int:role_id>/",                      AdminRoleDetailView.as_view(),     name="accounts-admin-role-detail"),
    path("admin/roles/<int:role_id>/assign/",               AdminRoleAssignView.as_view(),     name="accounts-admin-role-assign"),
    path("admin/users/<int:user_id>/roles/",                AdminUserRoleListView.as_view(),   name="accounts-admin-user-roles"),
]
