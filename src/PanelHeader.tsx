import { CloseIcon } from './Icons';

export default function PanelHeader({ onClose, children, onMouseDown, right, closable, bordered }: any) {
  return (
    <div
      className="panel-header"
      draggable={false}
      onTouchStart={onMouseDown}
      onMouseDown={onMouseDown}
      style={{
        zIndex: 1,
        borderBottom: bordered ? '1px solid #7F7E7E' : '',
        background: '#454545',
        borderRadius: '10px 10px 0 0',
      }}
    >
      <div
        style={{
          left: '0px',
          top: '0px',
          maxWidth: 'calc(100% - 50px)',
          padding: '0 10px',
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          fontSize: '16px',
          textAlign: 'left',
          color: 'rgba(223, 238, 243, 1)',
          fontWeight: 'bold',
        }}
      >
        {children}
      </div>
      {right && (
        <div
          onMouseDown={(e) => e.stopPropagation()}
          draggable={false}
          style={{
            position: 'absolute',
            right: '45px',
            bottom: '0',
            height: '100%',
            cursor: 'default',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          {right}
        </div>
      )}
      {closable && (
        <img
          src={CloseIcon}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="close-btn"
          alt="close"
          role="presentation"
        />
      )}
    </div>
  );
}
