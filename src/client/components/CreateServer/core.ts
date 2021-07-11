import { useMemo, useReducer } from 'react';
import { produce } from 'immer';
import createCoreState from '../../utils/createCoreState';
import { machineTypeMap } from '../../../shared/constants/machineType';

interface State {
  draft: Meteora.ServerConfig;
  body: Meteora.ServerConfig;
  isSizeUpdateLocked: boolean;
  isReadyToRequest: boolean;
}

const initialConfig: Meteora.ServerConfig = {
  name: 'server',
  machineType: '',
  javaMemorySizeGb: 2,
  diskSizeGb: 50,
};
const initialState: State = {
  draft: { ...initialConfig },
  body: { ...initialConfig },
  isSizeUpdateLocked: true,
  isReadyToRequest: false,
};

type Action =
  | {
      type: 'set';
      payload: KeyValueUnion<Meteora.ServerConfig>;
    }
  | {
      type: 'clear';
      payload?: never;
    };

const reducer = produce((state: State, action: Action) => {
  switch (action.type) {
    case 'set': {
      const { key, value } = action.payload;
      if (key === 'diskSizeGb' || key === 'javaMemorySizeGb') {
        if (state.isSizeUpdateLocked) {
          return;
        }
      }
      (state.draft as any)[key] = value;
      break;
    }
    case 'clear': {
      return initialState;
    }
  }

  const machineType = machineTypeMap.get(state.draft.machineType);
  state.body.name = state.draft.name;
  if (machineType) {
    state.isSizeUpdateLocked = false;
    state.body.machineType = machineType.name;
    state.body.javaMemorySizeGb = Math.max(
      initialConfig.javaMemorySizeGb,
      Math.min(state.draft.javaMemorySizeGb, machineType.memoryGb - 3),
    );
    state.body.diskSizeGb = Math.max(
      initialConfig.diskSizeGb,
      Math.min(state.draft.diskSizeGb, parseInt(machineType.maximumPersistentDisksSizeGb)),
    );
  } else {
    state.isSizeUpdateLocked = true;
    state.body.machineType = '';
  }
  state.isReadyToRequest = !!(state.body.name && machineType);
}, initialState);

export default createCoreState(() => {
  const [state, dispatch] = useReducer(reducer, initialState);
  const actions = useMemo(() => {
    return {
      setName(name: string) {
        dispatch({ type: 'set', payload: { key: 'name', value: name } });
      },
      setMachineType(machineType: string) {
        dispatch({ type: 'set', payload: { key: 'machineType', value: machineType } });
      },
      setJavaMemorySizeGb(javaMemorySizeGb: number) {
        dispatch({ type: 'set', payload: { key: 'javaMemorySizeGb', value: javaMemorySizeGb } });
      },
      setDiskSizeGb(diskSizeGb: number) {
        dispatch({ type: 'set', payload: { key: 'diskSizeGb', value: diskSizeGb } });
      },
      clear() {
        dispatch({ type: 'clear' });
      },
    };
  }, []);

  const { body, isReadyToRequest, isSizeUpdateLocked } = state;
  return {
    body,
    actions,
    isReadyToRequest,
    isSizeUpdateLocked,
  };
});
