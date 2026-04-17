const { knex } = require("./postgres-client");

class OutboxRepository {
  async enqueue(client, event) {
    await client("outbox_events").insert({
      id: event.id,
      event_name: event.eventName,
      aggregate_id: event.aggregateId,
      version: event.version,
      payload: JSON.stringify(event.payload),
      occurred_at: event.occurredAt,
      status: "pending",
    });
  }

  async pullPending(limit = 50) {
    const trx = await knex.transaction();

    try {
      const rows = await trx("outbox_events")
        .select("id", "event_name", "aggregate_id", "version", "payload", "occurred_at")
        .where("status", "pending")
        .orderBy("occurred_at", "asc")
        .limit(limit)
        .forUpdate()
        .skipLocked();

      if (rows.length) {
        await trx("outbox_events")
          .whereIn(
            "id",
            rows.map((row) => row.id),
          )
          .update({ status: "processing" });
      }

      await trx.commit();
      return rows;
    } catch (error) {
      await trx.rollback();
      throw error;
    }
  }

  async markPublished(eventId) {
    await knex("outbox_events").where("id", eventId).update({
      status: "published",
      processed_at: knex.fn.now(),
    });
  }

  async markFailed(eventId, errorMessage) {
    await knex("outbox_events").where("id", eventId).update({
      status: "failed",
      last_error: errorMessage?.slice(0, 500) || "Unknown outbox failure",
    });
  }
}

module.exports = { OutboxRepository };
