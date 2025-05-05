import { create } from "zustand";
import { persist } from "zustand/middleware";

type ProfileStoreState = {
  id: string;
  name: string;
  pronouns: string;
};

type ProfileStoreAction = {
  setId: (id: string) => void;
  setName: (name: string) => void;
  setPronouns: (pronouns: string) => void;
  reset: () => void;
};

type ProfileStore = ProfileStoreState & ProfileStoreAction;

const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      name: "",
      pronouns: "",
      id: "",
      setId: (id) => set({ id }),
      setName: (name) => set({ name }),
      setPronouns: (pronouns) => set({ pronouns }),
      reset: () => set({ name: "", pronouns: "", id: "" }),
    }),
    {
      name: "profile-storage",
      partialize: (state) => ({ name: state.name, pronouns: state.pronouns }),
    }
  )
);

export default useProfileStore;
