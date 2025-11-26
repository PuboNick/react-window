import { waitFor } from 'pubo-utils';
import { useCallback, useEffect, useMemo, useRef } from 'react';

import { DragMethod } from './drag';
import PanelHeader from './PanelHeader';
import { storage } from './storage';
import { PanelEvents, panelStore } from './store';

class _PanelWindow {
  config = { minWidth: 234, minHeight: 250 };
  onContentMouseDown: any;
  onSizeChange: any;
  onMoveStart: any;
  private _pos: any;
  private onWindowResize: any;
  private readonly fixed = { position: 'left', value: 0 };
  private unsubscribe: any;
  private upTopPanelSubscriber: any;
  private readonly windowEdges = { left: 0, right: 0, top: 5, bottom: 60 };
  private props: any;
  private el: any;

  // 限制拖动区域
  set pos(pos) {
    if (pos.pageY < this.windowEdges.top) {
      pos.pageY = this.windowEdges.top;
    }
    if (window.innerHeight - pos.pageY - pos.height < this.windowEdges.bottom) {
      pos.pageY = window.innerHeight - pos.height - this.windowEdges.bottom;
    }

    if (pos.pageX < this.windowEdges.left) {
      pos.pageX = this.windowEdges.left;
    }

    if (document.body.clientWidth - pos.pageX - pos.width < this.windowEdges.right) {
      pos.pageX = document.body.clientWidth - pos.width - this.windowEdges.right;
    }

    this._pos = pos;
  }

  get pos() {
    return this._pos;
  }

  constructor(props: any) {
    this.props = props;
    if (this.props.params.minWidth) {
      this.config.minWidth = this.props.params.minWidth;
    }
    if (this.props.params.minHeight) {
      this.config.minHeight = this.props.params.minHeight + 34;
    }
    this.pos = this.getInitialPosition(this.props);

    this.onContentMouseDown = new DragMethod({
      onMoveEnd: this.onMoveEnd.bind(this),
      onMove: this.moveWindow.bind(this),
      key: 'pos',
    });
    this.onSizeChange = new DragMethod({
      onMoveEnd: this.onMoveEnd.bind(this),
      onMove: this.resize.bind(this),
      key: 'size',
    });

    this.onMoveStart = (e: any) => {
      if (e.target.className === 'close-btn' || !this.props.moveable) {
        return;
      }
      e.stopPropagation();
      this.onContentMouseDown.onMouseDown(e);
      panelStore.updateTopPanel(this.props.params.id);
      this._removeModalPanels();
    };
  }

  dispose() {
    window.removeEventListener('resize', this.onWindowResize);
    panelStore.emitter.cancel(this.unsubscribe);
    panelStore.emitter.cancel(this.upTopPanelSubscriber);
  }

  init(el: any) {
    this.el = el;

    this.unsubscribe = panelStore.emitter.on(PanelEvents.UPDATE_FOCUS_PANEL, (id: string) => {
      let border = '4px solid rgba(0, 0, 0, 0)';

      if (id === this.props.params.id) {
        border = '4px solid #007AFF';
      }

      if (this.el.style.border !== border) {
        this.el.style.border = border;
      }
    });

    this.upTopPanelSubscriber = panelStore.emitter.on(PanelEvents.UPDATE_TOP_PANEL, (ids: string) => {
      const index = ids.indexOf(this.props.params.id);
      if (index > -1) {
        this.el.style.zIndex = (this.props.params?.zIndex ?? 1) + index;
      }
    });
  }

  mount() {
    this.updatePos();
    this.props.emitter.emit('update-pos', this.pos);
    this.onWindowResize = this._onWindowResize.bind(this);
    window.addEventListener('resize', this.onWindowResize);

    const i = panelStore.getState().order.indexOf(this.props.params.id);
    if (i > -1) {
      this.el.style.zIndex = (this.props.params?.zIndex ?? 1) + i;
    }

    const index = panelStore.getState().order.indexOf(this.props.params.id);
    if (index > -1) {
      this.el.style.zIndex = (this.props.params?.zIndex ?? 1) + index;
    }
  }

  updatePos() {
    if (!this.el) {
      return;
    }
    this.el.style.left = `${this.pos.pageX}px`;
    this.el.style.top = `${this.pos.pageY}px`;
    this.el.style.width = `${this.pos.width}px`;
    this.el.style.height = `${this.pos.height}px`;
  }

  onMoveEnd() {
    const res: any = {};
    res[this.props.params.id] = this.pos;
    storage.merge(res);
    this.props.emitter.emit('update-pos', this.pos);
    this.setFixed(this.pos);
  }

  moveWindow({ offsetX, offsetY }: any) {
    const pos = { pageX: this.pos.pageX + offsetX, pageY: this.pos.pageY + offsetY };
    this.pos = { ...this.pos, ...pos };
    this.updatePos();
  }

  resize({ offsetX, offsetY }: any) {
    const oldWidth = this.pos.width ?? this.el.clientWidth;
    const oldHeight = this.pos.height ?? this.el.clientHeight;
    const n = { ...this.pos, width: oldWidth + offsetX, height: oldHeight + offsetY };
    if (n.width < this.config.minWidth) {
      n.width = this.config.minWidth;
    }
    if (n.height < this.config.minHeight) {
      n.height = this.config.minHeight;
    }

    this.pos = n;
    this.updatePos();
    this.props.emitter.emit('update-size', n);
  }

  onClose() {
    const s = { ...storage.state };
    delete s[this.props.params.id];
    storage.state = s;
    if (typeof this.props.onClose === 'function') {
      this.props.onClose();
    }
  }

  setFixed(pos: any) {
    this.fixed.position = pos.width / 2 + pos.pageX <= document.body.clientWidth / 2 ? 'left' : 'right';
    this.fixed.value = this.fixed.position === 'left' ? pos.pageX : document.body.clientWidth - pos.pageX - pos.width;
  }

  getInitialPosition(props: any) {
    if (storage?.state && storage?.state[this.props.params.id]) {
      this.setFixed(storage.state[this.props.params.id]);
      return storage.state[this.props.params.id];
    }
    const width = props.params.defaultWidth || this.config.minWidth;
    const pos = {
      pageX: props.params.defaultPageX ?? (document.body.clientWidth - width) / 2,
      pageY: props.params.defaultPageY ?? 10,
      width,
      height: props.params.defaultHeight || this.config.minHeight,
    };

    this.setFixed(pos);

    return pos;
  }

  _onWindowResize() {
    if (this.fixed.position === 'right') {
      const pageX = document.body.clientWidth - this.fixed.value - this.pos.width;
      this.pos = { ...this.pos, pageX };
      this.updatePos();
      this.props.emitter.emit('update-pos', this.pos);
    }
  }

  _removeModalPanels() {
    const arr = panelStore
      .getState()
      .list.filter((item: any) => !item.rest.closable && item.id !== this.props.params.id);

    arr.forEach((item: any) => {
      panelStore.remove(item.id);
    });
  }
}

export function PanelWindow(props: any) {
  const instance = useMemo(() => new _PanelWindow(props), []);
  const ref: any = useRef();

  const init = useCallback(async () => {
    await waitFor(async () => ref.current, { checkTime: 100, timeout: 10000 });

    instance.init(ref.current);
    instance.mount();
  }, []);

  useEffect(() => {
    init();

    return () => {
      instance.dispose();
    };
  }, []);

  useEffect(() => {
    storage.merge({ [props.params.id]: { ...instance.pos, hiddenWindow: props.hiddenWindow } });
  }, [props.hiddenWindow]);

  return (
    <div
      draggable={false}
      style={{
        position: 'absolute',
        boxSizing: 'border-box',
        overflow: 'visible',
        borderRadius: 14,
        border: '4px solid rgba(0, 0, 0, 0)',
      }}
      ref={ref}
      onClick={(e) => {
        instance._removeModalPanels();

        e.stopPropagation();
        panelStore.updateTopPanel(props.params.id);
      }}
    >
      <div style={{ width: '100%', height: '100%' }} className="panel">
        {props.hiddenWindow ? (
          <div style={{ height: '34px', opacity: 0 }} />
        ) : (
          <PanelHeader
            closable={props.closable}
            onMouseDown={instance.onMoveStart}
            defaultWidth={instance.pos.width}
            emitter={props.emitter}
            onClose={() => instance.onClose()}
            right={props.header}
            bordered={props.params.rest.headerBorder}
          >
            {props.title}
          </PanelHeader>
        )}
        <div
          className="panel-content card"
          onMouseDown={props.hiddenWindow ? instance.onMoveStart : null}
          style={{ borderColor: props.hiddenWindow ? 'rgba(0, 0, 0, 0)' : undefined }}
        >
          <div
            style={{
              width: '100%',
              height: '100%',
              backgroundColor: `rgba(69, 69, 69, ${props.params.backgroundOpacity ?? 1})`,
              overflow: props.scrollable ? 'auto' : 'hidden',
              boxSizing: 'content-box',
              color: '#fff',
            }}
            className={props.scrollable ? 'primary-responsive' : ''}
          >
            {props.children}
          </div>
        </div>
        {props.resizable && (
          <div
            className="panel-resize-rect"
            draggable={false}
            onMouseDown={(e: any) => {
              e.stopPropagation();
              instance.onSizeChange.onMouseDown(e);
            }}
          />
        )}
      </div>
    </div>
  );
}
