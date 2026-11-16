import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { z } from 'zod';

export const idSchema = z.string().min(1).max(180).regex(/^[a-zA-Z0-9_-]+$/);

export function serialize(value) {
    if (value instanceof Timestamp)
        return value.toDate().toISOString();
    if (value instanceof Date)
        return value.toISOString();
    if (Array.isArray(value))
        return value.map(serialize);
    if (value && typeof value === 'object') {
        return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, serialize(v)]));
    }
    return value;
}

// O id do documento sempre vence: um campo "id" dentro dos dados não pode sobrescrevê-lo.
export function cleanDoc(id, data) {
    return serialize({ ...data, id });
}

export function serverNow() {
    return FieldValue.serverTimestamp();
}

export function parseList(value, fallback = 100) {
    const n = Number(value ?? fallback);
    return Number.isFinite(n) ? Math.min(Math.max(Math.floor(n), 1), 500) : fallback;
}
