from pydantic import BaseModel
from decimal import Decimal
from datetime import date


class ActiveSubscriptionsReport(BaseModel):
    total_active: int
    subscriptions: list[dict] = []


class RevenueReport(BaseModel):
    total_revenue: Decimal
    period_start: date | None = None
    period_end: date | None = None


class PaymentsSummaryReport(BaseModel):
    total_payments: Decimal
    payment_count: int
    by_method: list[dict] = []


class OverdueInvoicesReport(BaseModel):
    total_overdue: int
    total_amount: Decimal
    invoices: list[dict] = []
