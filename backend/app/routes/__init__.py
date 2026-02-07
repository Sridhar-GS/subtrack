from fastapi import APIRouter

from app.routes import (
    auth, users, products, product_variants, recurring_plans,
    subscriptions, invoices, payments, discounts, taxes,
    quotation_templates, reports,
    cart, checkout,
)

api_router = APIRouter(prefix="/api")

api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(products.router, prefix="/products", tags=["Products"])
api_router.include_router(product_variants.router, prefix="/products", tags=["Product Variants"])
api_router.include_router(recurring_plans.router, prefix="/recurring-plans", tags=["Recurring Plans"])
api_router.include_router(subscriptions.router, prefix="/subscriptions", tags=["Subscriptions"])
api_router.include_router(invoices.router, prefix="/invoices", tags=["Invoices"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(taxes.router, prefix="/taxes", tags=["Taxes"])
api_router.include_router(discounts.router, prefix="/discounts", tags=["Discounts"])
api_router.include_router(quotation_templates.router, prefix="/quotation-templates", tags=["Quotation Templates"])
api_router.include_router(reports.router, prefix="/reports", tags=["Reports"])
api_router.include_router(cart.router, prefix="/cart", tags=["Cart"])
api_router.include_router(checkout.router, prefix="/checkout", tags=["Checkout"])
