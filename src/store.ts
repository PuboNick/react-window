import { debounce, Emitter, random } from 'pubo-utils';
import { WebStorage } from 'pubo-web';
import { useEffect, useState } from 'react';

import Panel, { PanelOptions } from './wrapper';

interface PanelConfig {
  id: string;
  panel: string;
}

interface PanelState {
  list: PanelConfig[];
  order: string[];
  focus: null | string;
}

export enum PanelEvents {
  UPDATE_TOP_PANEL = 'UPDATE_TOP_PANEL',
  UPDATE_LIST = 'UPDATE_LIST',
  UPDATE_FOCUS_PANEL = 'UPDATE_FOCUS_PANEL',
}

const storage = new WebStorage({ key: 'yk-panels', type: 'localStorage' });
const save = debounce(({ list, order, focus }: any) => {
  storage.state = { list, order, focus };
}, 200);

const initialList = (function () {
  if (storage.state && storage.state.list) {
    return storage.state.list.filter((item: any) => !item.rest.removeOnWindowClose);
  }
  return [];
})();

export const RegisterPanels: Panel[] = [];

export const register = (options: PanelOptions | PanelOptions[]) => {
  if (Array.isArray(options)) {
    options.forEach((option) => RegisterPanels.push(new Panel(option)));
  } else {
    RegisterPanels.push(new Panel(options));
  }
};

class PanelStore {
  emitter = new Emitter();
  state: PanelState = {
    list: initialList,
    order: storage.state?.order ?? initialList.map((item: any) => item.id),
    focus: storage.state?.focus ?? null,
  };
  public dragging = false;

  getState() {
    return this.state;
  }

  setState(state: PanelState) {
    this.state = state;
    this.emitter.emit(PanelEvents.UPDATE_LIST, this.state.list);
    this.emitter.emit(PanelEvents.UPDATE_TOP_PANEL, this.state.order);
    this.emitter.emit(PanelEvents.UPDATE_FOCUS_PANEL, this.state.focus);
    save(this.state);
  }

  push(payload: any) {
    let panel: any = { id: random(), ...payload };
    const i: any = RegisterPanels.find((p) => panel.panel === p.name);
    if (!i) {
      return;
    }
    panel = { ...panel, ...i };
    delete panel.content;

    if (panel.rect) {
      const width = panel.rest.defaultWidth ?? panel.rest.minWidth ?? 0;
      const height = panel.rest.defaultHeight ?? panel.rest.minHeight ?? 0;

      panel.defaultPageX = panel.rect.x - width / 2 + panel.rect.width / 2;
      panel.defaultPageY = panel.rect.y - height / 2;
      if (panel.defaultPageY < 10) {
        panel.defaultPageY = 10;
      } else if (panel.defaultPageY + height > window.innerHeight) {
        panel.defaultPageY = window.innerHeight - height;
      }

      if (panel.defaultPageX < 0) {
        panel.defaultPageX = 0;
      } else if (panel.defaultPageX > window.innerWidth - width) {
        panel.defaultPageX = window.innerWidth - width;
      }
      delete panel.rect;
    }

    const list = [...this.state.list];
    const index = list.findIndex((item) => item.panel === panel.panel);

    if (i.rest.single && index > -1) {
      this.updateTopPanel(this.state.list[index].id);
      this.state.focus = this.state.list[index].id;
      this.emitter.emit(PanelEvents.UPDATE_FOCUS_PANEL, this.state.focus);
    } else {
      this.state.focus = null;
      list.push(panel);
      this.state.list = list;

      this.emitter.emit(PanelEvents.UPDATE_LIST, list);
      this.state.order.push(panel.id);
      this.emitter.emit(PanelEvents.UPDATE_TOP_PANEL, this.state.order);
      this.emitter.emit(PanelEvents.UPDATE_FOCUS_PANEL, this.state.focus);
      save({ list, order: this.state.order, focus: this.state.focus });
    }
  }

  updateTopPanel(id: string) {
    const index = this.state.order.findIndex((item) => item === id);
    this.state.focus = null;
    this.emitter.emit(PanelEvents.UPDATE_FOCUS_PANEL, this.state.focus);
    if (index > -1) {
      this.state.order.splice(index, 1);
      this.state.order.push(id);
      this.emitter.emit(PanelEvents.UPDATE_TOP_PANEL, this.state.order);
    }

    save({ list: this.state.list, order: this.state.order, focus: this.state.focus });
  }

  remove(id: string) {
    const list = [...this.state.list];
    const index = list.findIndex((item) => item.id === id);
    if (index < 0) {
      return;
    }
    list.splice(index, 1);
    this.state.list = list;
    const orderIndex = this.state.order.indexOf(id);
    if (index > 0) {
      this.state.order.splice(orderIndex, 1);
      this.emitter.emit(PanelEvents.UPDATE_TOP_PANEL, this.state.order);
    }

    save({ list, order: this.state.order, focus: this.state.focus });
    this.emitter.emit(PanelEvents.UPDATE_LIST, list);
  }
}

export const panelStore = new PanelStore();

export const usePanelList = () => {
  const [list, setList] = useState(panelStore.getState().list);

  useEffect(() => {
    const id = panelStore.emitter.on(PanelEvents.UPDATE_LIST, (arr: any) => {
      setList(arr);
    });

    return () => {
      panelStore.emitter.cancel(id);
    };
  }, []);

  return list;
};
