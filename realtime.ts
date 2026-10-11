/**
 * Pattern HMS - Centralized Real-time Event System (Server-Sent Events)
 * Provides instant live synchronization across Doctor, Laboratory, Waiting Display, Reception, and Finance panels.
 */
import { Response } from 'express';
import { EventEmitter } from 'events';

export type RealtimeEvent =
  | 'PATIENT_REGISTERED'
  | 'PATIENT_UPDATED'
  | 'APPOINTMENT_CREATED'
  | 'APPOINTMENT_CONFIRMED'
  | 'APPOINTMENT_CHECKED_IN'
  | 'APPOINTMENT_CANCELLED'
  | 'QUEUE_ENTRY_CREATED'
  | 'QUEUE_UPDATED'
  | 'QUEUE_PATIENT_CALLED'
  | 'QUEUE_PATIENT_SKIPPED'
  | 'QUEUE_PATIENT_RECALLED'
  | 'QUEUE_PATIENT_COMPLETED'
  | 'QUEUE_PATIENT_CANCELLED'
  | 'DOCTOR_STATUS_CHANGED'
  | 'DOCTOR_AVAILABLE'
  | 'DOCTOR_BUSY'
  | 'DOCTOR_ON_BREAK'
  | 'DOCTOR_ON_PRAYER_BREAK'
  | 'DOCTOR_ON_LEAVE'
  | 'DOCTOR_EMERGENCY'
  | 'DOCTOR_OFFLINE'
  | 'CONSULTATION_STARTED'
  | 'CONSULTATION_UPDATED'
  | 'CONSULTATION_COMPLETED'
  | 'PRESCRIPTION_CREATED'
  | 'PRESCRIPTION_UPDATED'
  | 'TEST_ORDER_CREATED'
  | 'TEST_ORDER_UPDATED'
  | 'TEST_ORDER_ACCEPTED'
  | 'TEST_SAMPLE_PENDING'
  | 'TEST_SAMPLE_COLLECTED'
  | 'TEST_PROCESSING'
  | 'TEST_RESULT_READY'
  | 'TEST_RESULT_VERIFIED'
  | 'TEST_COMPLETED'
  | 'TEST_CANCELLED'
  | 'INVOICE_CREATED'
  | 'INVOICE_UPDATED'
  | 'PAYMENT_RECEIVED'
  | 'PAYMENT_UPDATED'
  | 'PAYMENT_REFUNDED'
  | 'PAYMENT_VOIDED'
  | 'EXPENSE_CREATED'
  | 'EXPENSE_APPROVED'
  | 'EXPENSE_PAID'
  | 'COMMISSION_CREATED'
  | 'COMMISSION_UPDATED'
  | 'COMMISSION_PAID';

interface ClientConnection {
  id: string;
  res: Response;
  branchId?: string;
  organizationId?: string;
}

class RealtimeHub extends EventEmitter {
  private clients: Map<string, ClientConnection> = new Map();

  constructor() {
    super();
    // Keepalive ping every 20 seconds to prevent connection drops
    setInterval(() => {
      this.pingAll();
    }, 20000);
  }

  public addClient(id: string, res: Response, branchId?: string, organizationId?: string) {
    this.clients.set(id, { id, res, branchId, organizationId });
  }

  public removeClient(id: string) {
    this.clients.delete(id);
  }

  public broadcast(event: RealtimeEvent, data: any, filter?: { branchId?: string; organizationId?: string }) {
    const payload = JSON.stringify({
      event,
      data,
      timestamp: new Date().toISOString()
    });

    for (const [id, client] of this.clients.entries()) {
      if (filter?.branchId && client.branchId && client.branchId !== filter.branchId) {
        continue;
      }
      if (filter?.organizationId && client.organizationId && client.organizationId !== filter.organizationId) {
        continue;
      }

      try {
        client.res.write(`event: ${event}\n`);
        client.res.write(`data: ${payload}\n\n`);
      } catch (err) {
        this.clients.delete(id);
      }
    }

    // Also emit locally in node process for audit/triggers
    this.emit(event, data);
  }

  private pingAll() {
    for (const [id, client] of this.clients.entries()) {
      try {
        client.res.write(': keepalive\n\n');
      } catch {
        this.clients.delete(id);
      }
    }
  }

  public getConnectedClientsCount(): number {
    return this.clients.size;
  }
}

export const realtimeHub = new RealtimeHub();
