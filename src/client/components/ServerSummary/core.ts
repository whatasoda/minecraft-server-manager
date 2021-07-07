import { useMemo, useState } from 'react';
import createCoreState from '../../utils/createCoreState';

interface CoreProps {
  instance: Meteora.InstanceInfo | { name: string; status?: never };
}

export default createCoreState((props: CoreProps) => {
  const name = useMemo(() => props.instance.name, []);
  const [instance, setInstance] = useState(() => {
    if (props.instance.status) {
      return props.instance;
    } else {
      return null;
    }
  });

  return {
    name,
    instance,
    setInstance,
  };
});
