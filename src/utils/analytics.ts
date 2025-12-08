export const Analytics = {
  track: (event: string) => {
    // TODO: Implement
  },

  page: (path: string) => {
    // TODO: Implement
  }
}

export const trackPageView = (path: string, title?: string) => {
  // TODO: Implement
}

export const loadGAScript = (): Promise<void> => {
  // TODO: Implement
  return Promise.resolve()
}


export const analytics = {
  track: () => {},
  page: () => {},
  identify: () => {},
  task: {
    create: (projectId: string) => {},
    update: (taskId: string) => {},
    delete: (taskId: string) => {},
    view: (taskId: string) => {}
  },
  auth: {
    login: (method?: string) => {},
    logout: () => {},
    register: () => {}
  },
  project: {
    create: () => {},
    view: (projectId: string) => {},
    update: (projectId: string) => {}
  },
  settings: {
    enabled: true,
    changeLanguage: (lang: string) => {}
  },
  social: {
    joinTelegramGroup: () => {},
    joinWeChatGroup: () => {},
    contactDeveloper: () => {}
  }
};

export default analytics
