import './index.css';

import { panelStore } from './store';

export const showPanelModal = (payload: any) => {
  const list = panelStore.getState().list;

  const olds = list.filter((panel: any) => panel.rest.isModal && payload.panel !== panel.name);
  for (const item of olds) {
    panelStore.remove(item.id);
  }

  panelStore.push(payload);
};

export { panelStore };
export { register } from './store';
export { PanelRender } from './wrapper';
