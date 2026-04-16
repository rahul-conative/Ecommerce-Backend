# Kubernetes-Ready Notes

- Package each module behind its service layer and avoid cross-module DB access.
- Externalize config with environment variables or ConfigMaps.
- Replace the in-memory event bus with Kafka or another broker.
- Run workers as separate deployments once queues are split out.
- Place an API gateway in front of `/api/v1` before extracting services.
