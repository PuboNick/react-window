import { panelStore } from './store';

type OnMove = (n: { offsetX: number; offsetY: number; key?: string }) => void;
type OnMoveEnd = () => void;

interface DragMethodProps {
  key?: string;
  onMove?: OnMove;
  onMoveEnd?: OnMoveEnd;
}

export class DragMethod {
  private readonly key?: string = '';
  private readonly cache = { pageX: 0, pageY: 0, dragging: false };

  private readonly onMouseMove;
  private readonly onMouseUp;
  public readonly onMouseDown;
  public readonly onTouchStart;
  public onMove?: OnMove;
  public onMoveEnd?: OnMoveEnd;

  constructor({ key = '', onMove, onMoveEnd }: DragMethodProps = {}) {
    this.key = key;
    this.onMouseDown = this._onMouseDown.bind(this);
    this.onTouchStart = this._onMouseDown.bind(this);
    this.onMouseMove = this._onMouseMove.bind(this);
    this.onMouseUp = this._onMouseUp.bind(this);
    this.onMove = onMove;
    this.onMoveEnd = onMoveEnd;
  }

  private _onMouseMove(e: any) {
    if (typeof this.onMove !== 'function') {
      return;
    }

    if (e.preventDefault) {
      e.preventDefault();
    } else {
      e.returnValue = false;
    }

    const pageX = e.pageX ?? e.touches[0]?.pageX;
    const pageY = e.pageY ?? e.touches[0]?.pageY;

    this.onMove({
      offsetX: pageX - this.cache.pageX,
      offsetY: pageY - this.cache.pageY,
      key: this.key,
    });
    this.cache.pageX = pageX;
    this.cache.pageY = pageY;
  }

  private clearListener() {
    window.removeEventListener('mousemove', this.onMouseMove);
    window.removeEventListener('touchmove', this.onMouseMove);
    window.removeEventListener('mouseup', this.onMouseUp);
    window.removeEventListener('touchend', this.onMouseUp);
  }

  private _onMouseUp() {
    this.clearListener();
    this.cache.dragging = false;
    if (typeof this.onMoveEnd === 'function') {
      this.onMoveEnd();
    }
    setTimeout(() => (panelStore.dragging = false));
  }

  private _onMouseDown(e: any) {
    panelStore.dragging = true;
    if (e.preventDefault && e.pageX) {
      e.preventDefault();
    } else {
      e.returnValue = false;
    }
    if (typeof this.onMove !== 'function' || this.cache.dragging) {
      return;
    }
    this.clearListener();
    const pageX = e.pageX ?? e.touches[0]?.pageX;
    const pageY = e.pageY ?? e.touches[0]?.pageY;

    this.cache.dragging = true;
    this.cache.pageX = pageX;
    this.cache.pageY = pageY;

    window.addEventListener('mousemove', this.onMouseMove);
    window.addEventListener('touchmove', this.onMouseMove, { passive: false });
    window.addEventListener('mouseup', this.onMouseUp);
    window.addEventListener('touchend', this.onMouseUp, { passive: false });
  }
}
