import { create } from "zustand";
import { persist } from "zustand/middleware";

type ProfileStoreState = {
  name: string;
};

type ProfileStoreAction = {
  setName: (name: string) => void;
  resetName: () => void;
};

type ProfileStore = ProfileStoreState & ProfileStoreAction;

const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      name: "",
      setName: (name) => set({ name }),
      resetName: () => set({ name: "" }),
    }),
    { name: "profile-storage" }
  )
);

export default useProfileStore;
