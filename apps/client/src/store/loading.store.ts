import { create } from "zustand";

type LoadingStoreState = {
  isLoading: boolean;
};

type LoadingStoreActions = {
  setIsLoading: (isLoading: boolean) => void;
  reset: () => void;
};

type LoadingStore = LoadingStoreActions & LoadingStoreState;

const useLoadingStore = create<LoadingStore>((set) => ({
  isLoading: false,
  setIsLoading: (isLoading) => set({ isLoading }),
  reset: () => set({ isLoading: false }),
}));

export default useLoadingStore;
