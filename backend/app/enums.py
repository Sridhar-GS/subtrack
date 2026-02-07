import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    INTERNAL = "internal"
    PORTAL = "portal"


class BillingPeriod(str, enum.Enum):
    DAILY = "daily"
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    YEARLY = "yearly"


class SubscriptionStatus(str, enum.Enum):
    DRAFT = "draft"
    QUOTATION = "quotation"
    CONFIRMED = "confirmed"
    ACTIVE = "active"
    PAUSED = "paused"
    CLOSED = "closed"


class InvoiceStatus(str, enum.Enum):
    DRAFT = "draft"
    CONFIRMED = "confirmed"
    PAID = "paid"
    CANCELLED = "cancelled"


class DiscountType(str, enum.Enum):
    FIXED = "fixed"
    PERCENTAGE = "percentage"


class ProductType(str, enum.Enum):
    CONSUMABLE = "consumable"
    SERVICE = "service"
    SUBSCRIPTION = "subscription"
