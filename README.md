### React Window

一个可拖拽的窗口组件

1.注册

```
import { register } from './src';

register([
  {
    name: 'test',
    title: '测试窗口',
    panel: React.lazy(() => import('./test')),
    minWidth: 370,
    minHeight: 340,
    single: true,
    headerBorder: true,
  },
]);
```

2.渲染

```
import { PanelRender } from './src';

function App() {
  return (
    <div style={{ height: '100vh', width: '100%', position: 'relative', background: '#333' }}>
      <PanelRender />
    </div>
  );
}
```

3.打开窗口

```
import { panelStore } from './src';

panelStore.push({ panel: 'test' /** 窗口名称 */ });
```

3.手动移除窗口

```
panelStore.remove('panel-id') //自动生成的窗口ID;
panelStore.removeByName(test);
```

4.使用和配置样式
目前只提供源码的使用方式和样式修改
