import {
  InputGroup as BpInputGroup,
  NumericInput as BpNumericInput,
  HTMLSelect as BpHTMLSelect,
} from '@blueprintjs/core';
import { disabledGroup } from '../groups';

export const InputGroup = disabledGroup.bind(BpInputGroup, (group, self) => ({
  disabled: group.disabled || self.disabled,
}));
export const NumericInput = disabledGroup.bind(BpNumericInput, (group, self) => ({
  disabled: group.disabled || self.disabled,
}));
export const HTMLSelect = disabledGroup.bind(BpHTMLSelect, (group, self) => ({
  disabled: group.disabled || self.disabled,
}));
