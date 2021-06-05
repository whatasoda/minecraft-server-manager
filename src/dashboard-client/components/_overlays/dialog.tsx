import React, { useImperativeHandle, forwardRef, useState, createRef } from 'react';
import ReactDOM from 'react-dom';
import { Overlay } from '@blueprintjs/core';

interface DialogController {
  showDialog<T extends string>(DialogWrapper: DialogComponentType<T>): Promise<T>;
}

type DialogBodyComponentType<T extends string> = (props: DialogBodyProps<T>) => React.ReactElement;
interface DialogBodyProps<T extends string> {
  close: (payload?: T) => void;
}

type DialogComponentType<T extends string> = (props: DialogProps<T>) => React.ReactElement;
interface DialogProps<T extends string> {
  resolve: (payload: T) => void;
  onClosed: () => void;
}

const DialogRoot = forwardRef<DialogController>((_, ref) => {
  const [dialogs, setDialogs] = useState<Record<string, JSX.Element>>({});

  useImperativeHandle(
    ref,
    () => {
      let lastId = 0;
      return {
        showDialog: <T extends string>(DialogWrapper: DialogComponentType<T>) => {
          return new Promise<T>((resolve) => {
            const id = `${lastId++}`;
            const onClosed = () => {
              return setDialogs((curr) => {
                const next = { ...curr };
                delete next[id];
                return next;
              });
            };
            const dialog = <DialogWrapper key={id} resolve={resolve} onClosed={onClosed} />;
            setDialogs((curr) => ({ ...curr, [id]: dialog }));
          });
        },
      };
    },
    [],
  );

  return <>{Object.values(dialogs)}</>;
});

const createDialogController = (container: HTMLElement = document.body) => {
  const controllerRef = createRef<DialogController>();

  const initializeRoot = () => {
    if (controllerRef.current) return;

    const containerElement = document.createElement('div');
    container.appendChild(containerElement);
    ReactDOM.render(<DialogRoot ref={controllerRef} />, containerElement);
  };

  const showDialog: DialogController['showDialog'] = (...args) => {
    initializeRoot();
    if (!controllerRef.current) throw new Error('DialogRoot uninitialized');
    return controllerRef.current.showDialog(...args);
  };

  return { showDialog };
};

const defaultDialogController = createDialogController();

export const createDialog = <T extends string>(
  defaultPayload: T,
  DialogBody: DialogBodyComponentType<T>,
  controller: DialogController = defaultDialogController,
) => {
  const Dialog = ({ resolve, onClosed }: DialogProps<T>) => {
    const [isOpen, setIsOpen] = useState(true);
    const close = (payload: T = defaultPayload) => {
      resolve(payload);
      setIsOpen(false);
    };
    return (
      <Overlay
        isOpen={isOpen}
        transitionDuration={50}
        onClose={() => close()}
        onClosed={onClosed}
        children={<DialogBody close={close} />}
      />
    );
  };

  return () => controller.showDialog(Dialog);
};
