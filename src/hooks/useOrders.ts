import { useState, useCallback, useEffect } from 'react';
import { StockOrder } from '../components/Dashboard';
import { buildApiUrl } from '../config/api';
import { convertBackendTimeToLocal, logTimeConversion } from '../lib/utils';

export const useOrders = (username: string) => {
  const [orders, setOrders] = useState<StockOrder[]>([]);

  const handleOrderUpdate = useCallback((orderUpdate: StockOrder) => {
    console.log('handleOrderUpdate callback created');
    console.log('orderUpdate received: ', orderUpdate);
    
    setOrders((prev) => {
      // console.log('Current orders state before update:', prev);
      
      const submittedAt = orderUpdate.submittedAt ? convertBackendTimeToLocal(orderUpdate.submittedAt) : new Date();
      const filledAt = orderUpdate.filledAt ? convertBackendTimeToLocal(orderUpdate.filledAt) : undefined;
      
      // Check for duplicate updates by comparing key fields
      const isDuplicate = prev.some(
        (order) => 
          order.symbol === orderUpdate.symbol &&
          order.side === orderUpdate.side &&
          order.quantity === orderUpdate.quantity &&
          order.status === orderUpdate.status &&
          order.clientOrderId === orderUpdate.clientOrderId
      );

      if (isDuplicate) {
        console.log('Duplicate order detected by clientOrderId, skipping update');
        return prev;
      }

      const newOrder = {
        symbol: orderUpdate.symbol,
        quantity: orderUpdate.quantity,
        side: orderUpdate.side,
        status: orderUpdate.status,
        filledQuantity: orderUpdate.filledQuantity,
        filledAvgPrice: orderUpdate.filledAvgPrice,
        submittedAt,
        filledAt,
        clientOrderId: orderUpdate.clientOrderId,
      } as StockOrder;

      console.log('New order to be added:', newOrder);
      const updatedOrders = [...prev, newOrder];
      // console.log('Updated orders array:', updatedOrders);
      
      return updatedOrders;
    });
  }, []);

  const fetchOrders = useCallback(async () => {
    if (!username) {
      console.log('No username provided, skipping order fetch');
      return;
    }
    
    try {
      console.log('Fetching orders for user:', username);
      const ordersRes = await fetch(buildApiUrl(`/router/orders/${username}`));
      console.log('Orders response status:', ordersRes.status, ordersRes.ok);
      
      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        //console.log('Orders data received from server:', ordersData);
        const ordersArray = (Array.isArray(ordersData)
          ? ordersData
          : ordersData.orders || []
        ).map((order: any) => {
          const submittedAt = order.submittedAt ? convertBackendTimeToLocal(order.submittedAt) : new Date();
          const filledAt = order.filledAt ? convertBackendTimeToLocal(order.filledAt) : undefined;
          
          return {
            symbol: order.symbol,
            quantity: Number(order.quantity) || 0,
            filledQuantity: Number(order.filledQuantity) || undefined,
            side: order.side,
            status: order.status,
            filledAvgPrice: Number(order.filledAvgPrice) || undefined,
            submittedAt,
            filledAt,
            clientOrderId: order.clientOrderId,
          } as StockOrder;
        });
        
        setOrders(ordersArray);
      } else {
        console.log('No orders found for user:', username);
        setOrders([]);
      }
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
      throw error;
    }
  }, [username]);

  // Load orders when username changes
  useEffect(() => {
    if (username) {
      fetchOrders();
    }
  }, [username, fetchOrders]);

  return {
    orders,
    handleOrderUpdate,
    fetchOrders
  };
}; 