import { Button as BpButton } from '@blueprintjs/core';
import { disabledGroup } from '../groups';

export const Button = disabledGroup.bind(BpButton, (group, self) => ({
  disabled: group.disabled || self.disabled,
}));
