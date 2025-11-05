import { useDispatch, useSelector, useStore, type TypedUseSelectorHook } from 'react-redux';
import { RootState } from './root-state';
import { AppDispatch, AppStore } from './store';

// Use throughout your app instead of plain `useDispatch` and `useSelector`
// Rewritten to avoid bundler issues with .withTypes() method
export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppStore: () => AppStore = useStore;
