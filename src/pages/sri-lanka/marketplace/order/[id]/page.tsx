import { useParams } from "react-router-dom";
import OrderConfirmationContent from "./order-confirmation-content";

export default function OrderConfirmationPage() {
  const { id } = useParams<{ id: string }>();
  return <OrderConfirmationContent orderId={id ?? ""} />;
}
