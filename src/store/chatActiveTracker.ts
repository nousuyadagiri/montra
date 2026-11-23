let currentActiveChatId: string | null = null;

export const chatActiveTracker = {
  setActive: (id: string | null) => {
    currentActiveChatId = id;
  },
  getActive: () => currentActiveChatId,
};

