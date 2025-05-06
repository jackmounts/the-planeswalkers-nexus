import { create } from "zustand";
import { persist } from "zustand/middleware";
import { v4 as uuidv4 } from "uuid";

type ProfileStoreState = {
  id: string;
  name: string;
  pronouns?: string;
  hasHydrated: boolean;
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
      hasHydrated: false,
      setId: (id) => set({ id }),
      setName: (name) => set({ name }),
      setPronouns: (pronouns) => set({ pronouns }),
      reset: () => set({ name: "", pronouns: "", id: "" }),
    }),
    {
      name: "profile-storage",
      onRehydrateStorage: () => (state) => {
        state!.hasHydrated = true;
        if (!state!.id) {
          const newId = uuidv4();
          state!.setId(newId);
        }
      },
    }
  )
);

export default useProfileStore;
