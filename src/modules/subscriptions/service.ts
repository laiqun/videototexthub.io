import { and, count, desc, eq, inArray } from 'drizzle-orm';
import { getUuid, getSnowId } from '@/lib/hash';
import { db } from '@/core/db';
import { subscription } from '@/config/db/schema';

export enum SubscriptionStatus {
  PENDING = 'pending',
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PENDING_CANCEL = 'pending_cancel',
  TRIALING = 'trialing',
  EXPIRED = 'expired',
  PAUSED = 'paused',
}

export type NewSubscription = typeof subscription.$inferInsert;
export type UpdateSubscription = Partial<Omit<NewSubscription, 'id' | 'subscriptionNo' | 'createdAt'>>;

export async function createSubscription(data: NewSubscription) {
  const [result] = await db().insert(subscription).values(data).returning();
  return result;
}

export async function updateBySubscriptionNo(subscriptionNo: string, data: UpdateSubscription) {
  const [result] = await db()
    .update(subscription)
    .set(data)
    .where(eq(subscription.subscriptionNo, subscriptionNo))
    .returning();
  return result;
}

export async function findBySubscriptionNo(subscriptionNo: string) {
  const [result] = await db()
    .select()
    .from(subscription)
    .where(eq(subscription.subscriptionNo, subscriptionNo));
  return result;
}

export async function findByProviderSubscriptionId(params: {
  provider: string;
  subscriptionId: string;
}) {
  const [result] = await db()
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.paymentProvider, params.provider),
        eq(subscription.subscriptionId, params.subscriptionId)
      )
    );
  return result;
}

export async function getCurrentSubscription(userId: string) {
  const [result] = await db()
    .select()
    .from(subscription)
    .where(
      and(
        eq(subscription.userId, userId),
        inArray(subscription.status, [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.PENDING_CANCEL,
          SubscriptionStatus.TRIALING,
        ])
      )
    )
    .orderBy(desc(subscription.createdAt))
    .limit(1);
  return result;
}

export async function getSubscriptions(params: {
  userId?: string;
  status?: string;
  page?: number;
  limit?: number;
}) {
  const { userId, status, page = 1, limit = 30 } = params;
  return db()
    .select()
    .from(subscription)
    .where(
      and(
        userId ? eq(subscription.userId, userId) : undefined,
        status ? eq(subscription.status, status) : undefined
      )
    )
    .orderBy(desc(subscription.createdAt))
    .limit(limit)
    .offset((page - 1) * limit);
}

/**
 * Check whether user has any valid subscription access.
 *
 * Rule (ported from the original aiimagedescriber project):
 * - currentPeriodEnd is the primary expiry source
 * - canceledEndAt is only a fallback when currentPeriodEnd is missing
 * - paused/pending subscriptions never grant access
 * - any non-expired subscription is enough
 */
export async function hasValidSubscriptionAccess(userId: string) {
  const result = await db()
    .select()
    .from(subscription)
    .where(eq(subscription.userId, userId))
    .orderBy(desc(subscription.createdAt));

  const now = Date.now();

  return result.some((item: typeof subscription.$inferSelect) => {
    if (
      item.status === SubscriptionStatus.PAUSED ||
      item.status === SubscriptionStatus.PENDING
    ) {
      return false;
    }

    const effectiveEndAt = item.currentPeriodEnd || item.canceledEndAt || null;
    return !!effectiveEndAt && effectiveEndAt.getTime() > now;
  });
}
