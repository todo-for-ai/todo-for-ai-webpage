export const Analytics = {
  track: (_event: string) => {
    // TODO: Implement
  },

  page: (_path: string) => {
    // TODO: Implement
  }
}

export const trackPageView = (_path: string, _title?: string) => {
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
    create: (_projectId: string) => {},
    update: (_taskId: string) => {},
    delete: (_taskId: string) => {},
    view: (_taskId: string) => {}
  },
  auth: {
    login: (_method?: string) => {},
    logout: () => {},
    register: () => {}
  },
  project: {
    create: () => {},
    view: (_projectId: string) => {},
    update: (_projectId: string) => {}
  },
  settings: {
    enabled: true,
    changeLanguage: (_lang: string) => {}
  },
  social: {
    joinTelegramGroup: () => {},
    joinWeChatGroup: () => {},
    contactDeveloper: () => {}
  }
};

export default analytics
