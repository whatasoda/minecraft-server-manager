import { Toaster, Intent, ToastProps } from '@blueprintjs/core';

const toaster = Toaster.create({ maxToasts: 8 });

export default {
  success(message: string, action?: ToastProps) {
    toaster.show({ intent: Intent.SUCCESS, message, action });
  },
  warning(message: string, action?: ToastProps) {
    toaster.show({ intent: Intent.WARNING, message, action });
  },
  danger(message: string, action?: ToastProps) {
    toaster.show({ intent: Intent.DANGER, message, action });
  },
};
