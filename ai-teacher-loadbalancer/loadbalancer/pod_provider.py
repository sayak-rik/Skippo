"""Pod provider selection.

POD_PROVIDER=fly    → Fly.io Machines API (production default)
POD_PROVIDER=docker → containers on the local Docker daemon (local development)

Both clients share the same public interface:
create_machine / delete_machine / get_machine_state / list_machines / build_pod_url.
"""

from django.conf import settings


def get_pod_client():
    if settings.POD_PROVIDER == "docker":
        from .docker_machine import DockerMachineClient
        return DockerMachineClient()
    from .fly_machine import FlyMachineClient
    return FlyMachineClient()
