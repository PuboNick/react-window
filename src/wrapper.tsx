import { Emitter } from 'pubo-utils';
import { LazyExoticComponent, Suspense, useEffect, useMemo, useState } from 'react';

import { Loading } from './Loading';
import { PanelWindow } from './PanelWindow';
import { storage } from './storage';
import { panelStore, RegisterPanels, usePanelList } from './store';

export interface PanelOptions {
  name: string /**窗口名称 唯一ID */;
  title: string /**默认标题 */;
  panel: LazyExoticComponent<any> /**Panel 组件 */;
  minWidth?: number /**最小宽度 */;
  minHeight?: number /**最小高度 */;
  defaultHeight?: number /**默认高度 */;
  defaultWidth?: number /**默认宽度 */;
  defaultPageX?: number /**默认页面位置X */;
  defaultPageY?: number /**默认页面位置Y */;
  backgroundOpacity?: number /**背景不透明度 0-1, default 0.6 */;
  single?: boolean /**是否为单例，页面中只允许存在一个 */;
  resizable?: boolean /**能否调整尺寸 */;
  moveable?: boolean /**能否移动 */;
  closable?: boolean /**能否关闭 */;
  scrollable?: boolean /**是否可滚动 */;
  hiddenWindow?: boolean /**是否隐藏窗口 */;
  hiddenInMenu?: boolean /**是否在菜单中隐藏该选项 */;
  pathname?: string /**只在该路径下显示 */;
  headerBorder?: boolean /**是否标题栏显示边框 */;
  zIndex?: number /**z-index 层级 */;
  isModal?: boolean /**模态框模式 */;
  removeOnWindowClose?: boolean /**浏览器关闭后是否移除*/;
  group?: string /**分组，一个分组中只允许同时存在一个 */;
}

const PanelComponent = (props: any = {}) => {
  const Content = useMemo<any>(() => props.content, []);
  const [header, setHeader] = useState(null);
  const [hiddenWindow, setHiddenWindow] = useState(
    storage.state[props.id]?.hiddenWindow ?? props.hiddenWindow ?? false,
  );
  const [title, setTitle] = useState(props.title);
  const defaultHeight = useMemo(() => {
    return props.defaultHeight ? Math.min(props.defaultHeight, window.innerHeight - 100) : null;
  }, []);
  const closable = useMemo(() => props.closable ?? true, [props.closable]);
  const resizable = useMemo(() => props.resizable ?? true, [props.resizable]);
  const moveable = useMemo(() => props.moveable ?? true, [props.moveable]);
  const scrollable = useMemo(() => props.scrollable ?? true, [props.scrollable]);
  const emitter = useMemo(() => new Emitter(), []);

  const Window = useMemo(() => {
    return (
      <PanelWindow
        onClose={() => {
          panelStore.remove(props.id);
        }}
        key={props.id}
        title={title}
        params={{ ...props, defaultHeight }}
        header={header}
        hiddenWindow={hiddenWindow}
        resizable={resizable}
        closable={closable}
        moveable={moveable}
        emitter={emitter}
        scrollable={scrollable}
      >
        <Suspense fallback={<Loading />}>
          <Content
            {...props}
            hiddenWindow={hiddenWindow}
            setTitle={setTitle}
            setHeader={setHeader}
            setHiddenWindow={setHiddenWindow}
            emitter={emitter}
          />
        </Suspense>
      </PanelWindow>
    );
  }, [title, header]);

  return <>{Window}</>;
};

export default class Panel {
  content: any;
  name;
  title;
  rest: any = {};
  hiddenInMenu = false;

  constructor({ panel, name, title, hiddenInMenu = false, ...rest }: PanelOptions) {
    this.content = panel;
    this.name = name;
    this.title = title;
    this.hiddenInMenu = hiddenInMenu;
    this.rest = rest;
    this.rest.closable = rest.closable ?? true;
  }

  render(props: any = {}) {
    const title = props.title || this.title || this.name;
    return (
      <PanelComponent key={props.id} name={this.name} {...{ ...this.rest, ...props, title, content: this.content }} />
    );
  }
}

export const PanelRender = ({ pathname }: { pathname?: string }) => {
  const panels = usePanelList();

  const list = useMemo(() => {
    return panels.filter((item: any) => (item.rest.pathname ? item.rest.pathname === location.pathname : true));
  }, [panels, pathname]);

  useEffect(() => {
    const onWindowClick = () => {
      if (panelStore.dragging) {
        return;
      }

      const arr = panelStore.getState().list.filter((item: any) => item.rest.isModal);
      arr.forEach((item: any) => panelStore.remove(item.id));
    };

    window.addEventListener('click', onWindowClick);
    return () => {
      window.removeEventListener('click', onWindowClick);
    };
  }, []);

  return (
    <>
      {list.map(({ panel, ...params }: any) => {
        return RegisterPanels.find((item) => panel === item.name)?.render(params);
      })}
    </>
  );
};
