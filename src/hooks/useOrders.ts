import { useState, useCallback } from 'react';
import { StockOrder } from '../components/Dashboard';

export const useOrders = (username: string) => {
  const [orders, setOrders] = useState<StockOrder[]>([]);

  const handleOrderUpdate = useCallback((orderUpdate: StockOrder) => {
    console.log('handleOrderUpdate callback created');
    console.log('orderUpdate received: ', orderUpdate);
    setOrders((prev) => {
      const submittedAt = orderUpdate.submittedAt ? new Date(orderUpdate.submittedAt) : new Date();
      const filledAt = orderUpdate.filledAt ? new Date(orderUpdate.filledAt) : undefined;
      
      // Check if this order already exists
      const isDuplicate = prev.some(
        o => o.symbol === orderUpdate.symbol &&
             o.side === orderUpdate.side &&
             o.quantity === Number(orderUpdate.quantity) &&
             // Check if the previous order was submitted within the last 3 minutes
             o.submittedAt && 
             (new Date().getTime() - o.submittedAt.getTime()) < 3 * 60 * 1000
      );

      if (isDuplicate) {
        console.log('Duplicate order detected, skipping update');
        return prev;
      }

      // Remove any pending orders for the same symbol
      const updated = prev.filter((o) => o.symbol !== orderUpdate.symbol || o.status !== 'pending');
      
      return [
        ...updated,
        {
          symbol: orderUpdate.symbol,
          quantity: Number(orderUpdate.quantity) || 0,
          filledQuantity: Number(orderUpdate.filledQuantity) || 0,
          side: orderUpdate.side,
          status: orderUpdate.status,
          filledAvgPrice: Number(orderUpdate.filledAvgPrice) || undefined,
          submittedAt: submittedAt,
          filledAt: filledAt,
          clientOrderId: orderUpdate.clientOrderId,
        } as StockOrder,
      ];
    });
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!username) return;
    
    try {
      const ordersRes = await fetch(`http://localhost:3001/router/orders/${username}`);
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        console.log('Recent orders retrieved: ', ordersData);
        const ordersArray = (Array.isArray(ordersData)
          ? ordersData
          : ordersData.orders || []
        ).map((order: any) => ({
          symbol: order.symbol,
          quantity: Number(order.quantity) || 0,
          filledQuantity: Number(order.filledQuantity) || undefined,
          side: order.side,
          status: order.status,
          filledAvgPrice: Number(order.filledAvgPrice) || undefined,
          submittedAt: order.submittedAt ? new Date(order.submittedAt) : new Date(),
          filledAt: order.filledAt ? new Date(order.filledAt) : undefined,
          clientOrderId: order.clientOrderId,
        } as StockOrder));
        setOrders(ordersArray);
      } else {
        console.log('No orders found.');
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      throw error;
    }
  }, [username]);

  return {
    orders,
    handleOrderUpdate,
    fetchOrders
  };
}; 