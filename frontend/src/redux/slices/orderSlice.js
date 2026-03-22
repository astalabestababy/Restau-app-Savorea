import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { getAuthToken } from '../../utils/authToken';
import API_URL from '../../config/api';

export const fetchOrders = createAsyncThunk(
  'orders/fetchOrders',
  async () => {
    const token = await getAuthToken();
    const response = await axios.get(`${API_URL}/orders/myorders`, {
      headers: { 'x-auth-token': token },
    });
    return response.data;
  }
);

export const createOrder = createAsyncThunk(
  'orders/createOrder',
  async (orderData) => {
    const token = await getAuthToken();
    const response = await axios.post(`${API_URL}/orders`, orderData, {
      headers: { 'x-auth-token': token },
    });
    return response.data;
  }
);

const orderSlice = createSlice({
  name: 'orders',
  initialState: {
    items: [],
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrders.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchOrders.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchOrders.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(createOrder.fulfilled, (state, action) => {
        state.items.push(action.payload);
      });
  },
});

export default orderSlice.reducer;
