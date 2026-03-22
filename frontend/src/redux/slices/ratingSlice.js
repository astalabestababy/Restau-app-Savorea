import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';
import { getAuthToken } from '../../utils/authToken';
import API_URL from '../../config/api';

export const fetchRatings = createAsyncThunk(
  'ratings/fetchRatings',
  async (itemName) => {
    const url = itemName
      ? `${API_URL}/ratings?itemName=${encodeURIComponent(itemName)}`
      : `${API_URL}/ratings`;
    const response = await axios.get(url);
    return { itemName, data: response.data };
  }
);

export const submitReview = createAsyncThunk(
  'ratings/submitReview',
  async ({ itemName, rating, comment, orderId, userName }) => {
    const token = await getAuthToken();
    await axios.post(`${API_URL}/reviews`, { itemName, rating, comment, orderId, userName }, {
      headers: { 'x-auth-token': token },
    });
    const response = await axios.get(`${API_URL}/ratings?itemName=${encodeURIComponent(itemName)}`);
    return { itemName, itemRating: response.data };
  }
);

export const updateReview = createAsyncThunk(
  'ratings/updateReview',
  async ({ itemName, reviewId, rating, comment, userName }) => {
    const token = await getAuthToken();
    await axios.put(`${API_URL}/reviews/${reviewId}`, { rating, comment, userName }, {
      headers: { 'x-auth-token': token },
    });
    const response = await axios.get(`${API_URL}/ratings?itemName=${encodeURIComponent(itemName)}`);
    return { itemName, itemRating: response.data };
  }
);

const ratingSlice = createSlice({
  name: 'ratings',
  initialState: {
    ratings: {},
    loading: false,
    error: null,
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchRatings.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchRatings.fulfilled, (state, action) => {
        state.loading = false;
        const { itemName, data } = action.payload;
        if (itemName) {
          state.ratings[itemName] = data;
        } else {
          const map = {};
          data.forEach(r => { map[r.name] = r; });
          state.ratings = map;
        }
      })
      .addCase(fetchRatings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(submitReview.fulfilled, (state, action) => {
        state.ratings[action.payload.itemName] = action.payload.itemRating;
      })
      .addCase(updateReview.fulfilled, (state, action) => {
        state.ratings[action.payload.itemName] = action.payload.itemRating;
      });
  },
});

export default ratingSlice.reducer;
