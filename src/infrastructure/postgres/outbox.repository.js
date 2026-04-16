const { postgresPool } = require("./postgres-client");

class OutboxRepository {
  async enqueue(client, event) {
    await client.query(
      `INSERT INTO outbox_events (id, event_name, aggregate_id, version, payload, occurred_at, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7)`,
      [
        event.id,
        event.eventName,
        event.aggregateId,
        event.version,
        JSON.stringify(event.payload),
        event.occurredAt,
        "pending",
      ],
    );
  }

  async pullPending(limit = 50) {
    const client = await postgresPool.connect();

    try {
      await client.query("BEGIN");
      const { rows } = await client.query(
        `SELECT id, event_name, aggregate_id, version, payload, occurred_at
         FROM outbox_events
         WHERE status = 'pending'
         ORDER BY occurred_at ASC
         LIMIT $1
         FOR UPDATE SKIP LOCKED`,
        [limit],
      );

      if (rows.length) {
        await client.query(`UPDATE outbox_events SET status = 'processing' WHERE id = ANY($1::uuid[])`, [
          rows.map((row) => row.id),
        ]);
      }

      await client.query("COMMIT");
      return rows;
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async markPublished(eventId) {
    await postgresPool.query(
      `UPDATE outbox_events
       SET status = 'published', processed_at = NOW()
       WHERE id = $1`,
      [eventId],
    );
  }

  async markFailed(eventId, errorMessage) {
    await postgresPool.query(
      `UPDATE outbox_events
       SET status = 'failed', last_error = $2
       WHERE id = $1`,
      [eventId, errorMessage?.slice(0, 500) || "Unknown outbox failure"],
    );
  }
}

module.exports = { OutboxRepository };
