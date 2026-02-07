import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import { CartProvider } from '../context/CartContext';
import ErrorBoundary from '../components/ErrorBoundary';
import ProtectedRoute from '../components/ProtectedRoute';
import PortalProtectedRoute from '../components/PortalProtectedRoute';
import Layout from '../components/Layout';
import PortalLayout from '../components/PortalLayout';

import LoginPage from '../pages/auth/LoginPage';
import SignupPage from '../pages/auth/SignupPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';

import DashboardPage from '../pages/DashboardPage';
import ProductsPage from '../pages/ProductsPage';
import PlansPage from '../pages/PlansPage';
import SubscriptionsPage from '../pages/SubscriptionsPage';
import InvoicesPage from '../pages/InvoicesPage';
import PaymentsPage from '../pages/PaymentsPage';
import TemplatesPage from '../pages/TemplatesPage';
import DiscountsPage from '../pages/DiscountsPage';
import TaxesPage from '../pages/TaxesPage';
import UsersPage from '../pages/UsersPage';
import ReportsPage from '../pages/ReportsPage';
import SubscriptionFormPage from '../pages/SubscriptionFormPage';
import ContactsPage from '../pages/ContactsPage';
import AttributesPage from '../pages/AttributesPage';

import HomePage from '../portal/HomePage';
import ShopPage from '../portal/ShopPage';
import ProductDetailPage from '../portal/ProductDetailPage';
import CartPage from '../portal/CartPage';
import CheckoutPage from '../portal/CheckoutPage';
import OrderConfirmationPage from '../portal/OrderConfirmationPage';
import MyOrdersPage from '../portal/MyOrdersPage';
import OrderDetailPage from '../portal/OrderDetailPage';
import PortalInvoicePage from '../portal/PortalInvoicePage';
import MyProfilePage from '../portal/MyProfilePage';

function App() {
  return (
    <ErrorBoundary>
    <AuthProvider>
    <CartProvider>
      <BrowserRouter>
        <Routes>
          {/* Public auth routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />

          {/* Portal routes (e-commerce shop) */}
          <Route element={<PortalLayout />}>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/shop/:productId" element={<ProductDetailPage />} />
            <Route path="/cart" element={<CartPage />} />

            {/* Portal routes requiring login */}
            <Route element={<PortalProtectedRoute />}>
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/order-confirmation/:orderId" element={<OrderConfirmationPage />} />
              <Route path="/my-orders" element={<MyOrdersPage />} />
              <Route path="/my-orders/:subId" element={<OrderDetailPage />} />
              <Route path="/my-invoices/:invoiceId" element={<PortalInvoicePage />} />
              <Route path="/my-profile" element={<MyProfilePage />} />
            </Route>
          </Route>

          {/* Admin/Internal protected routes with sidebar layout */}
          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/products" element={<ProductsPage />} />
              <Route path="/plans" element={<PlansPage />} />
              <Route path="/subscriptions" element={<SubscriptionsPage />} />
              <Route path="/subscriptions/new" element={<SubscriptionFormPage />} />
              <Route path="/subscriptions/:subId" element={<SubscriptionFormPage />} />
              <Route path="/contacts" element={<ContactsPage />} />
              <Route path="/invoices" element={<InvoicesPage />} />
              <Route path="/payments" element={<PaymentsPage />} />
              <Route path="/templates" element={<TemplatesPage />} />
              <Route path="/discounts" element={<DiscountsPage />} />
              <Route path="/taxes" element={<TaxesPage />} />
              <Route path="/attributes" element={<AttributesPage />} />
              <Route path="/users" element={<UsersPage />} />
              <Route path="/reports" element={<ReportsPage />} />
            </Route>
          </Route>

          {/* Default redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </CartProvider>
    </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;
