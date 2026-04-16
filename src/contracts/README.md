# Internal Contracts

This folder holds stable contracts that survive the move from modular monolith to microservices.

- `events/`: canonical domain event names and event envelope builders

Rules:

- Controllers and services may evolve, but published event names and payload shapes should change carefully.
- New event payload changes should prefer version bumps over in-place breaking changes.
- When a module is extracted later, this contract layer becomes the handoff point to Kafka or HTTP consumers.
