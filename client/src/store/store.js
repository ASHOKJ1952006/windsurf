import { configureStore } from '@reduxjs/toolkit'
import authReducer from './slices/authSlice'
import coursesReducer from './slices/coursesSlice'
import enrollmentsReducer from './slices/enrollmentsSlice'
import forumReducer from './slices/forumSlice'
import jobsReducer from './slices/jobsSlice'
import notificationsReducer from './slices/notificationsSlice'

export const store = configureStore({
  reducer: {
    auth: authReducer,
    courses: coursesReducer,
    enrollments: enrollmentsReducer,
    forum: forumReducer,
    jobs: jobsReducer,
    notifications: notificationsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
})
