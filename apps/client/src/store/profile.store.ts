import { create } from "zustand";
import { persist } from "zustand/middleware";

type ProfileStoreState = {
  id: string;
  name: string;
  pronouns: string;
};

type ProfileStoreAction = {
  setName: (name: string) => void;
  setPronouns: (pronouns: string) => void;
  setId: (id: string) => void;
  reset: () => void;
};

type ProfileStore = ProfileStoreState & ProfileStoreAction;

const useProfileStore = create<ProfileStore>()(
  persist(
    (set) => ({
      name: "",
      pronouns: "",
      id: "",
      setName: (name) => set({ name }),
      setPronouns: (pronouns) => set({ pronouns }),
      setId: (id) => set({ id }),
      reset: () => set({ name: "", pronouns: "", id: "" }),
    }),
    {
      name: "profile-storage",
      partialize: (state) => ({ name: state.name, pronouns: state.pronouns }),
    }
  )
);

export default useProfileStore;
