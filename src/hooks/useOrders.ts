import { useState, useCallback } from 'react';
import { StockOrder } from '../components/Dashboard';

export const useOrders = (username: string) => {
  const [orders, setOrders] = useState<StockOrder[]>([]);

  const handleOrderUpdate = useCallback((orderUpdate: StockOrder) => {
    console.log('handleOrderUpdate callback created');
    console.log('orderUpdate received: ', orderUpdate);
    
    setOrders((prev) => {
      // console.log('Current orders state before update:', prev);
      
      const submittedAt = orderUpdate.submittedAt ? new Date(orderUpdate.submittedAt) : new Date();
      const filledAt = orderUpdate.filledAt ? new Date(orderUpdate.filledAt) : undefined;
      
      // Check if this order already exists by clientOrderId
      const isDuplicate = orderUpdate.clientOrderId && 
        prev.some(o => o.clientOrderId === orderUpdate.clientOrderId);

      if (isDuplicate) {
        console.log('Duplicate order detected by clientOrderId, skipping update');
        return prev;
      }

      // Remove any pending orders for the same symbol
      const updated = prev.filter((o) => o.symbol !== orderUpdate.symbol || o.status !== 'pending');
      
      const newOrder = {
        symbol: orderUpdate.symbol,
        quantity: Number(orderUpdate.quantity) || 0,
        filledQuantity: Number(orderUpdate.filledQuantity) || 0,
        side: orderUpdate.side,
        status: orderUpdate.status,
        filledAvgPrice: Number(orderUpdate.filledAvgPrice) || undefined,
        submittedAt: submittedAt,
        filledAt: filledAt,
        clientOrderId: orderUpdate.clientOrderId,
      } as StockOrder;

      console.log('New order to be added:', newOrder);
      const updatedOrders = [...updated, newOrder];
      // console.log('Updated orders array:', updatedOrders);
      
      return updatedOrders;
    });
  }, []); // Remove orders dependency

  const fetchOrders = useCallback(async () => {
    if (!username) {
      console.log('No username provided, skipping order fetch');
      return;
    }
    
    try {
      console.log('Fetching orders for user:', username);
      const ordersRes = await fetch(`http://localhost:3001/router/orders/${username}`);
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        // console.log('Orders data received from server:', ordersData);
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
        console.log('No orders found for user:', username);
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