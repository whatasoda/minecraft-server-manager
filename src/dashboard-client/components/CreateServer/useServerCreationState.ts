import { useMemo, useReducer } from 'react';
import { produce } from 'immer';

interface State {
  draft: Minecraft.MachineConfig;
  body: Minecraft.MachineConfig;
  isSizeUpdateLocked: boolean;
  isReadyToRequest: boolean;
}

const initialConfig: Minecraft.MachineConfig = {
  name: 'server',
  machineType: 'n2-standard-2',
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
      payload: KeyValueUnion<Minecraft.MachineConfig>;
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

export default function useServerCreationState() {
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
}

const availableMachineTypes: Minecraft.MachineType[] = [
  {
    name: 'n2-standard-2',
    description: '2 vCPUs 8 GB RAM',
    memoryGb: 8,
    maximumPersistentDisksSizeGb: '263168',
  },
  {
    name: 'n2-standard-4',
    description: '4 vCPUs 16 GB RAM',
    memoryGb: 16,
    maximumPersistentDisksSizeGb: '263168',
  },
  {
    name: 'n2-standard-8',
    description: '8 vCPUs 32 GB RAM',
    memoryGb: 32,
    maximumPersistentDisksSizeGb: '263168',
  },
  {
    name: 'n2-standard-16',
    description: '16 vCPUs 64 GB RAM',
    memoryGb: 64,
    maximumPersistentDisksSizeGb: '263168',
  },
  {
    name: 'n2-standard-32',
    description: '32 vCPUs 128 GB RAM',
    memoryGb: 128,
    maximumPersistentDisksSizeGb: '263168',
  },
  {
    name: 'n2-standard-48',
    description: '48 vCPUs 192 GB RAM',
    memoryGb: 192,
    maximumPersistentDisksSizeGb: '263168',
  },
  {
    name: 'n2-standard-64',
    description: '64 vCPUs 256 GB RAM',
    memoryGb: 256,
    maximumPersistentDisksSizeGb: '263168',
  },
  {
    name: 'n2-standard-80',
    description: '80 vCPUs 320 GB RAM',
    memoryGb: 320,
    maximumPersistentDisksSizeGb: '263168',
  },
];
const machineTypeMap = new Map(availableMachineTypes.map((machineType) => [machineType.name, machineType]));
useServerCreationState.availableMachineTypes = availableMachineTypes;
useServerCreationState.availableMachineTypeMap = machineTypeMap;
