import { configureStore } from '@reduxjs/toolkit';
import productReducer from './slices/productSlice';
import orderReducer from './slices/orderSlice';
import ratingReducer from './slices/ratingSlice';

export const store = configureStore({
  reducer: {
    products: productReducer,
    orders: orderReducer,
    ratings: ratingReducer,
  },
});

export default store;
